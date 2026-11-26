/*  Ultimate Kit - Auto Captions, panel side. The voice file goes straight to ElevenLabs Speech to Text (Scribe) and
    comes back as words with their times (no local service). The words are tidied (punctuation kept apart), can be
    corrected by hand or by "wrong = right" rules, and are grouped into captions the way CapForge did it: a new
    caption after the word limit, a pause, a sentence end, too long a time or too many characters.
    Word: { t text, p punctuation after it, s start, e end (seconds in the file), lp confidence (log) }            */
var UKAutoCap = (function () {
    var API = "https://api.elevenlabs.io/v1/speech-to-text";
    var PUNCT = ".,!?;:\"'()[]" + String.fromCharCode(8230, 171, 187, 8220, 8221, 8222, 8216, 8217);
    var END = ".?!" + String.fromCharCode(8230);
    var SAMPLE = "Give your words the spotlight. Every word, right on cue.";

    /* the file as a Blob: straight from disk (the panel may read files), else through CEP's base64 reader */
    function readBlob(path) {
        return new Promise(function (ok, no) {
            var parts = String(path).replace(/\\/g, "/").split("/"), url = "file:///" + parts.map(function (s, i) { return (i === 0 && /^[A-Za-z]:$/.test(s)) ? s : encodeURIComponent(s); }).join("/").replace(/^\/+/, "");
            var x = new XMLHttpRequest(), fallback = function () {
                try {
                    var r = window.cep.fs.readFile(path, window.cep.encoding.Base64);
                    if (r.err) return no(new Error("Could not read the file: " + path));
                    fetch("data:application/octet-stream;base64," + r.data).then(function (q) { return q.blob(); }).then(ok, no);
                } catch (e) { no(new Error("Could not read the file: " + path)); }
            };
            try {
                x.open("GET", url, true); x.responseType = "blob";
                x.onload = function () { if (x.response && x.response.size > 0) ok(x.response); else fallback(); };
                x.onerror = fallback;
                x.send();
            } catch (e2) { fallback(); }
        });
    }
    function list(s) { return String(s || "").split(/[,\n;]+/).map(function (v) { return v.trim(); }).filter(function (v) { return v.length > 0 && v.length <= 50; }); }
    function post(blob, o, plain) {
        var fd = new FormData();
        fd.append("file", blob, o.name || "audio");
        fd.append("model_id", o.model || "scribe_v2");
        fd.append("timestamps_granularity", "word");
        fd.append("tag_audio_events", "false");
        fd.append("diarize", "false");
        if (o.lang) fd.append("language_code", o.lang);
        if (!plain) {
            if (o.lang && o.second && o.second !== o.lang) fd.append("secondary_language_codes", o.second);
            list(o.terms).slice(0, 100).forEach(function (t) { fd.append("keyterms", t.replace(/[<>{}\[\]\\]/g, "")); });
        }
        return fetch(API, { method: "POST", headers: { "xi-api-key": o.key }, body: fd }).then(function (r) {
            return r.text().then(function (txt) {
                var j = null; try { j = JSON.parse(txt); } catch (e) { }
                if (r.ok && j) return j;
                var d = j && j.detail, msg = d ? (typeof d === "string" ? d : (d.message || JSON.stringify(d))) : txt.slice(0, 200);
                var err = new Error(r.status === 401 ? "ElevenLabs did not accept the API key." : "ElevenLabs: " + msg);
                err.status = r.status; throw err;
            });
        }, function () { throw new Error("Could not reach ElevenLabs. Check the internet connection."); });
    }
    /* o: { path, name, key, lang, second, terms, model } -> { words, note } ; the extras (names, second language) are
       left out and the request repeated when the account / model refuses them */
    function transcribe(o) {
        if (!o.key) return Promise.reject(new Error("Enter the ElevenLabs API key."));
        return readBlob(o.path).then(function (blob) {
            var extras = (o.lang && o.second && o.second !== o.lang) || list(o.terms).length > 0;
            return post(blob, o, false).catch(function (e) {
                if (!extras || e.status === 401 || !e.status) throw e;
                return post(blob, o, true).then(function (j) { j._plain = e.message; return j; });
            });
        }).then(function (j) {
            var w = normalize(j);
            if (!w.length) throw new Error("No words were found in this file.");
            return { words: w, lang: j.language_code || "", note: j._plain ? "Names / second language were not accepted (" + j._plain + ")" : "" };
        });
    }
    function splitPunct(text) {
        var core = text, p = "";
        while (core.length && PUNCT.indexOf(core.charAt(core.length - 1)) >= 0) { p = core.charAt(core.length - 1) + p; core = core.substr(0, core.length - 1); }
        return [core, p];
    }
    function normalize(raw) {
        var out = [], src = (raw && raw.words) || [];
        src.forEach(function (t) {
            if (t.type === "spacing" || t.type === "audio_event") return;
            var text = String(t.text || "").trim(); if (!text) return;
            var sp = splitPunct(text);
            if (!sp[0]) { if (out.length) out[out.length - 1].p += sp[1]; return; }
            out.push({ t: sp[0], p: sp[1], s: Number(t.start) || 0, e: Number(t.end) || 0, lp: (typeof t.logprob === "number") ? t.logprob : 0 });
        });
        return out;
    }
    /* "wrong = right" lines: the wrong words (one or several in a row, any letter case) become the right ones */
    function applyRules(words, rules) {
        var key = function (s) { return String(s).toLowerCase(); }, n = 0;
        String(rules || "").split(/\n+/).forEach(function (line) {
            var m = line.split("="); if (m.length < 2) return;
            var from = m[0].trim().split(/\s+/).filter(Boolean).map(key), to = m.slice(1).join("=").trim().split(/\s+/).filter(Boolean), i, k;
            if (!from.length || !to.length) return;
            for (i = 0; i + from.length <= words.length; i++) {
                for (k = 0; k < from.length; k++) if (key(words[i + k].t) !== from[k]) break;
                if (k < from.length) continue;
                var s = words[i].s, e = words[i + from.length - 1].e, p = words[i + from.length - 1].p, rep = to.map(function (t, q) { return { t: t, p: q === to.length - 1 ? p : "", s: s + (e - s) * q / to.length, e: s + (e - s) * (q + 1) / to.length, lp: 0, fixed: 1 }; });
                Array.prototype.splice.apply(words, [i, from.length].concat(rep)); i += rep.length - 1; n++;
            }
        });
        return n;
    }
    function show(w) { return w.t + (w.p || ""); }
    /* o: { maxWords, maxChars (per line, 0 = no limit) } -> captions [{ s, e, i0, i1 (word range, i1 exclusive) }] */
    function group(words, o) {
        var maxW = Math.max(1, o.maxWords || 4), maxC = (o.maxChars || 0) > 0 ? o.maxChars * 2 : 1e9, out = [], cur = null, i;
        var flush = function () { if (cur) out.push(cur); cur = null; };
        for (i = 0; i < words.length; i++) {
            var w = words[i];
            if (cur) {
                var last = words[cur.i1 - 1], len = 0, k;
                for (k = cur.i0; k < cur.i1; k++) len += show(words[k]).length + 1;
                if (cur.i1 - cur.i0 >= maxW || w.s - last.e > 0.55 || w.e - words[cur.i0].s > 3.5 || len + show(w).length > maxC) flush();
            }
            if (!cur) cur = { i0: i, i1: i };
            cur.i1 = i + 1;
            if (END.split("").some(function (c) { return (w.p || "").indexOf(c) >= 0; })) flush();
        }
        flush();
        /* no lonely word at the end of a sentence: it takes the last word of the caption before it */
        for (i = 1; i < out.length; i++) {
            var pv = out[i - 1], cu = out[i], lw = words[pv.i1 - 1];
            if (cu.i1 - cu.i0 === 1 && pv.i1 - pv.i0 >= 3 && words[cu.i0].s - lw.e <= 0.55 && !END.split("").some(function (c) { return (lw.p || "").indexOf(c) >= 0; })) { pv.i1--; cu.i0--; }
        }
        out.forEach(function (b, q) {
            b.s = words[b.i0].s; b.e = words[b.i1 - 1].e + 0.12;
            var nx = out[q + 1] ? words[out[q + 1].i0].s : 1e9;
            if (nx - b.e < 0.35) b.e = nx;
        });
        return out;
    }
    /* what After Effects gets: [{ t0, t1, text (URI-encoded), ws: [word start times] }] */
    function blocks(words, o) {
        return group(words, o).map(function (b) {
            var tx = [], ws = [], k;
            for (k = b.i0; k < b.i1; k++) { tx.push(show(words[k])); ws.push(Math.round(words[k].s * 1000) / 1000); }
            return { t0: Math.round(b.s * 1000) / 1000, t1: Math.round(b.e * 1000) / 1000, text: encodeURIComponent(tx.join(" ")), ws: ws };
        });
    }
    function sample() {
        var w = [], t = 0.2;
        SAMPLE.split(" ").forEach(function (x) { var sp = splitPunct(x); w.push({ t: sp[0], p: sp[1], s: t, e: t + 0.3, lp: 0 }); t += 0.36 + (sp[1] ? 0.5 : 0); });
        return w;
    }
    function strip(s) { var r = ""; for (var i = 0; i < s.length; i++) if (PUNCT.indexOf(s.charAt(i)) < 0 || s.charAt(i) === "'") r += s.charAt(i); return r; }
    function rr(g, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function rgba(hex, a) { var h = String(hex).replace("#", ""); return "rgba(" + parseInt(h.substr(0, 2), 16) + "," + parseInt(h.substr(2, 2), 16) + "," + parseInt(h.substr(4, 2), 16) + "," + a + ")"; }

    /* the panel preview: the caption of the moment with the look chosen in the panel (o = the page's settings) */
    function draw(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
        var g = cv.getContext("2d"), W = cv.width, H = cv.height, words = (o.words && o.words.length) ? o.words : sample(), B = group(words, o);
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = "#1b1b20"; g.fillRect(0, 0, W, H);
        var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#2a2f3a"); gr.addColorStop(1, "#15161b"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        if (!B.length) return;
        var t0 = Math.max(0, B[0].s - 0.3), end = B[B.length - 1].e, span = Math.min(end - t0, 14) + 0.5, tt = t0 + (t % span), b = null, i;
        for (i = 0; i < B.length; i++) if (tt >= B[i].s && tt < B[i].e) b = B[i];
        if (!b) return;
        var fs = Math.max(9, H * (o.size || 6.5) / 100 * 1.9), lines = [[]], len = 0, act = -1, k;
        for (k = b.i0; k < b.i1; k++) {
            var s = o.punct === false ? strip(show(words[k])) : show(words[k]);
            if (lines[lines.length - 1].length && o.maxChars > 0 && len + 1 + s.length > o.maxChars) { lines.push([]); len = 0; }
            len += (len ? 1 : 0) + s.length; lines[lines.length - 1].push({ s: s, k: k });
            if (tt >= words[k].s) act = k;
        }
        g.font = "700 " + fs + "px 'Segoe UI', 'Noto Sans Georgian', Montserrat, Arial, sans-serif"; g.textBaseline = "alphabetic";
        var sp = g.measureText(" ").width, ld = fs * 1.2, widths = [], maxW = 0, cy = H * (o.posY || 72) / 100, top = cy - ((lines.length - 1) * ld) / 2;
        lines.forEach(function (ln) { var w = 0; ln.forEach(function (x, q) { x.w = g.measureText(x.s).width; w += x.w + (q ? sp : 0); }); widths.push(w); maxW = Math.max(maxW, w); });
        var padX = fs * 0.45, padY = fs * 0.3, bh = (lines.length - 1) * ld + fs + 2 * padY;
        if (o.box) { g.fillStyle = rgba(o.boxColor, (o.boxOp === undefined ? 60 : o.boxOp) / 100); rr(g, W / 2 - maxW / 2 - padX, top - fs * 0.34 - bh / 2 + ((lines.length - 1) * ld) / 2, maxW + 2 * padX, bh, bh / 2 * (o.boxRound || 0) / 100); g.fill(); }
        lines.forEach(function (ln, li) {
            var x = W / 2 - widths[li] / 2, y = top + li * ld;
            ln.forEach(function (it) {
                var on = it.k === act, wh = fs * 1.16, wx = fs * 0.2;
                if (on && o.wbox) { g.fillStyle = rgba(o.wboxColor, (o.wboxOp === undefined ? 100 : o.wboxOp) / 100); rr(g, x - wx, y - fs * 0.34 - wh / 2, it.w + 2 * wx, wh, wh / 2 * (o.wboxRound || 0) / 100); g.fill(); }
                g.globalAlpha = (it.k > act && act >= 0) ? (o.upcoming === undefined ? 100 : o.upcoming) / 100 : 1;
                if (o.shadow) { g.shadowColor = "rgba(0,0,0,0.55)"; g.shadowBlur = fs * 0.15; g.shadowOffsetY = fs * 0.04; }
                g.fillStyle = (on && o.hl) ? o.hlColor : (o.color || "#FFFFFF");
                var sc = on ? (o.scale || 100) / 100 : 1;
                if (sc !== 1) { g.save(); g.translate(x + it.w / 2, y - fs * 0.34); g.scale(sc, sc); g.fillText(it.s, -it.w / 2, fs * 0.34); g.restore(); } else g.fillText(it.s, x, y);
                g.shadowColor = "transparent"; g.shadowBlur = 0; g.shadowOffsetY = 0; g.globalAlpha = 1;
                x += it.w + sp;
            });
        });
    }
    function Player(cv) { this.cv = cv; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (o) { if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) { if (!self.running) return; self.t += Math.min(0.1, (now - last) / 1000); last = now; if (document.body.contains(self.cv)) draw(self.cv, self.t, self.o); requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { transcribe: transcribe, normalize: normalize, applyRules: applyRules, group: group, blocks: blocks, show: show, draw: draw, Player: Player };
})();

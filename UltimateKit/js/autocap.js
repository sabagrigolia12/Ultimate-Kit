/*  Ultimate Kit - Auto Captions, panel side. The voice file goes straight to ElevenLabs Speech to Text (Scribe) and
    comes back as words with their times (no local service). The words are tidied (punctuation kept apart), can be
    corrected by hand or by "wrong = right" rules, and are grouped into captions the way CapForge did it: a new
    caption after the word limit, a pause, a sentence end, too long a time or too many characters - here always ONE
    line, and captions too short to read are joined to a neighbour.
    Word: { t text, p punctuation after it, s start, e end (seconds in the file), lp confidence (log) }
    Style: the keys of BASE; 0 in maxWords / maxChars / posY = "Auto" = what suits the comp (vertical / horizontal). */
var UKAutoCap = (function () {
    var API = "https://api.elevenlabs.io/v1/speech-to-text";
    var PUNCT = ".,!?;:\"'()[]" + String.fromCharCode(8230, 171, 187, 8220, 8221, 8222, 8216, 8217);
    var END = ".?!" + String.fromCharCode(8230);
    var SAMPLE = "Give your words the spotlight. Every word, right on cue.";

    /* ------------------------------------------------------------ styles */
    var BASE = { maxWords: 0, maxChars: 0, punct: false, size: 6, posY: 0, color: "#FFFFFF", entrance: "none", shadow: false,
        hl: false, hlColor: "#FFD60A", scale: 100, upcoming: 100, wbox: false, wboxColor: "#7C5CFF", wboxOp: 100, wboxRound: 35,
        box: false, boxColor: "#000000", boxOp: 50, boxRound: 40 };
    var KEYS = Object.keys(BASE);
    function style(o) { var r = {}, k; for (k in BASE) r[k] = BASE[k]; if (o) for (k in o) if (k in BASE) r[k] = o[k]; return r; }
    var PRESETS = [
        { id: "ac1", name: "Black Box", s: style({ box: true }) },                                             // (user's 1)
        { id: "ac2", name: "Black Box Color", s: style({ box: true, hl: true, hlColor: "#FFD60A" }) },         // (user's 2)
        { id: "ac3", name: "Word Box", s: style({ shadow: true, hl: true, hlColor: "#FFFFFF", wbox: true }) },
        { id: "ac4", name: "Classic Subtitle", s: style({ punct: true, shadow: true, size: 5.5 }) },
        { id: "ac5", name: "Karaoke", s: style({ shadow: true, upcoming: 35 }) },
        { id: "ac6", name: "Pop Highlight", s: style({ shadow: true, hl: true, hlColor: "#3DFF7A", scale: 112, entrance: "pop", size: 7 }) },
        { id: "ac7", name: "One Word", s: style({ maxWords: 1, size: 10, shadow: true, entrance: "pop" }) }
    ];
    /* what the Auto values come to for a comp: one line that fits the frame, words per caption, height */
    function layout(o, comp) {
        var W = (comp && comp.w) || 1920, H = (comp && comp.h) || 1080, vert = H > W * 1.05, fs = Math.min(W, H) * (Number(o.size) || 6) / 100;
        var fit = Math.max(6, Math.floor(W * (vert ? 0.84 : 0.72) / (fs * 0.6)));
        return { W: W, H: H, vert: vert, fs: fs, maxChars: o.maxChars > 0 ? Number(o.maxChars) : fit, maxWords: o.maxWords > 0 ? Number(o.maxWords) : (vert ? 4 : 7),
            posY: o.posY > 0 ? Number(o.posY) : (vert ? 70 : 85) };
    }

    /* ------------------------------------------------------------ transcription */
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

    /* ------------------------------------------------------------ captions */
    function show(w) { return w.t + (w.p || ""); }
    function strip(s) { var r = ""; for (var i = 0; i < s.length; i++) if (PUNCT.indexOf(s.charAt(i)) < 0 || s.charAt(i) === "'") r += s.charAt(i); return r; }
    function ends(w) { return END.split("").some(function (c) { return (w.p || "").indexOf(c) >= 0; }); }
    function chars(words, i0, i1) { var n = 0; for (var k = i0; k < i1; k++) n += show(words[k]).length + (k > i0 ? 1 : 0); return n; }
    /* o: a style, comp {w, h} -> captions [{ s, e, i0, i1 (word range, i1 exclusive) }], each ONE line */
    function group(words, o, comp) {
        var L = layout(o, comp), maxW = Math.max(1, L.maxWords), maxC = L.maxChars, out = [], cur = null, i;
        var flush = function () { if (cur) out.push(cur); cur = null; };
        for (i = 0; i < words.length; i++) {
            var w = words[i];
            if (cur) {
                var last = words[cur.i1 - 1];
                if (cur.i1 - cur.i0 >= maxW || w.s - last.e > 0.55 || w.e - words[cur.i0].s > 3.5 || chars(words, cur.i0, cur.i1) + 1 + show(w).length > maxC) flush();
            }
            if (!cur) cur = { i0: i, i1: i };
            cur.i1 = i + 1;
            if (ends(w)) flush();
        }
        flush();
        if (maxW > 1) {
            /* too short to read (under 0.9 s or one word): joined to the next caption, else the one before, when it fits */
            var fits = function (a, b) { return b.i1 - a.i0 <= maxW && chars(words, a.i0, b.i1) <= maxC && words[b.i0].s - words[a.i1 - 1].e <= 0.55 && words[b.i1 - 1].e - words[a.i0].s <= 3.5; };
            var short = function (b) { return b.i1 - b.i0 === 1 || words[b.i1 - 1].e - words[b.i0].s < 0.9; };
            for (i = 0; i < out.length; i++) {
                if (!short(out[i])) continue;
                if (i + 1 < out.length && fits(out[i], out[i + 1])) { out[i + 1].i0 = out[i].i0; out.splice(i, 1); i--; continue; }
                if (i > 0 && fits(out[i - 1], out[i])) { out[i - 1].i1 = out[i].i1; out.splice(i, 1); i -= 2; if (i < -1) i = -1; }
            }
            /* no lonely word left at the end of a sentence: it takes the last word of the caption before it */
            for (i = 1; i < out.length; i++) {
                var pv = out[i - 1], cu = out[i], lw = words[pv.i1 - 1];
                if (cu.i1 - cu.i0 === 1 && pv.i1 - pv.i0 >= 3 && words[cu.i0].s - lw.e <= 0.55 && !ends(lw) && chars(words, pv.i1 - 1, cu.i1) <= maxC) { pv.i1--; cu.i0--; }
            }
        }
        out.forEach(function (b, q) {
            b.s = words[b.i0].s; b.e = words[b.i1 - 1].e + 0.12;
            var nx = out[q + 1] ? words[out[q + 1].i0].s : 1e9;
            if (nx - b.e < 0.35) b.e = nx;
        });
        return out;
    }
    /* what After Effects gets: [{ t0, t1, text (URI-encoded), ws: [word start times] }] */
    function blocks(words, o, comp) {
        return group(words, o, comp).map(function (b) {
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

    /* ------------------------------------------------------------ preview */
    function rr(g, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function rgba(hex, a) { var h = String(hex).replace("#", ""); return "rgba(" + parseInt(h.substr(0, 2), 16) + "," + parseInt(h.substr(2, 2), 16) + "," + parseInt(h.substr(4, 2), 16) + "," + a + ")"; }
    /* o: the style + { words, comp {w, h}, bg (a loaded Image of the comp's frame), thumb (a still for a style tile) } */
    function draw(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
        var g = cv.getContext("2d"), W = cv.width, H = cv.height, comp = o.thumb ? { w: 1920, h: 1080 } : (o.comp || { w: 1920, h: 1080 });
        var words = (!o.thumb && o.words && o.words.length) ? o.words : sample(), L = layout(o, comp), k = W / L.W;
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
        var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#2a2f3a"); gr.addColorStop(1, "#15161b"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        if (o.bg && o.bg.complete && o.bg.naturalWidth) {
            var s = Math.max(W / o.bg.naturalWidth, H / o.bg.naturalHeight);
            if (o.bgGain > 1) g.filter = "brightness(" + o.bgGain + ")";                // (a 32 bpc project writes its frame 10 x darker)
            g.drawImage(o.bg, (W - o.bg.naturalWidth * s) / 2, (H - o.bg.naturalHeight * s) / 2, o.bg.naturalWidth * s, o.bg.naturalHeight * s);
            g.filter = "none";
        }
        var B = group(words, o, comp), b = null, i, tt, act = -1;
        if (!B.length) return;
        if (o.thumb) { b = { i0: B[0].i0, i1: Math.min(B[0].i1, B[0].i0 + 3) }; act = Math.min(b.i1 - 1, b.i0 + 1); tt = words[act].s + 0.01; }
        else {
            var t0 = Math.max(0, B[0].s - 0.3), end = B[B.length - 1].e, span = Math.min(end - t0, 14) + 0.5;
            tt = t0 + (t % span);
            for (i = 0; i < B.length; i++) if (tt >= B[i].s && tt < B[i].e) b = B[i];
            if (!b) return;
        }
        var fs = (o.thumb ? Math.min(H * 0.17, L.fs * k * 2.2) : L.fs * k), items = [], kk;
        for (kk = b.i0; kk < b.i1; kk++) { items.push({ s: o.punct === false ? strip(show(words[kk])) : show(words[kk]), k: kk }); if (!o.thumb && tt >= words[kk].s) act = kk; }
        g.font = "700 " + fs + "px 'Segoe UI', 'Noto Sans Georgian', Montserrat, Arial, sans-serif"; g.textBaseline = "alphabetic";
        var sp = g.measureText(" ").width, tw = 0;
        items.forEach(function (x, q) { x.w = g.measureText(x.s).width; tw += x.w + (q ? sp : 0); });
        if (o.thumb && tw > W * 0.9) { var sc = W * 0.9 / tw; fs *= sc; sp *= sc; tw *= sc; g.font = "700 " + fs + "px 'Segoe UI', 'Noto Sans Georgian', Montserrat, Arial, sans-serif"; items.forEach(function (x) { x.w *= sc; }); }
        var cy = o.thumb ? H * 0.5 : H * L.posY / 100, y = cy + fs * 0.34, x = W / 2 - tw / 2;
        if (o.box) {
            var padX = fs * 0.45, padY = fs * 0.3, bh = fs + 2 * padY;
            g.fillStyle = rgba(o.boxColor, (o.boxOp === undefined ? 50 : o.boxOp) / 100); rr(g, W / 2 - tw / 2 - padX, cy - bh / 2, tw + 2 * padX, bh, bh / 2 * (o.boxRound || 0) / 100); g.fill();
        }
        items.forEach(function (it) {
            var on = it.k === act, wh = fs * 1.16, wx = fs * 0.2;
            if (on && o.wbox) { g.fillStyle = rgba(o.wboxColor, (o.wboxOp === undefined ? 100 : o.wboxOp) / 100); rr(g, x - wx, cy - wh / 2, it.w + 2 * wx, wh, wh / 2 * (o.wboxRound || 0) / 100); g.fill(); }
            g.globalAlpha = (it.k > act && act >= 0) ? (o.upcoming === undefined ? 100 : o.upcoming) / 100 : 1;
            if (o.shadow) { g.shadowColor = "rgba(0,0,0,0.6)"; g.shadowBlur = fs * 0.15; g.shadowOffsetX = fs * 0.035; g.shadowOffsetY = fs * 0.035; }
            g.fillStyle = (on && o.hl) ? o.hlColor : (o.color || "#FFFFFF");
            var sc2 = on ? (o.scale || 100) / 100 : 1;
            if (sc2 !== 1) { g.save(); g.translate(x + it.w / 2, cy); g.scale(sc2, sc2); g.fillText(it.s, -it.w / 2, fs * 0.34); g.restore(); } else g.fillText(it.s, x, y);
            g.shadowColor = "transparent"; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0; g.globalAlpha = 1;
            x += it.w + sp;
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
    return { transcribe: transcribe, normalize: normalize, applyRules: applyRules, group: group, blocks: blocks, show: show, draw: draw, Player: Player,
        PRESETS: PRESETS, KEYS: KEYS, style: style, layout: layout };
})();

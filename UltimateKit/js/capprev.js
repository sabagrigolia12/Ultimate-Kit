/*  Ultimate Kit - Captions preview. Draws a look of shared/captions.js with its animation the way After Effects
    builds it (jsx/captions.jsx): the same selector maths (a ramp travelling through letters / words / lines), the
    same em sizes, gradient, accent, glow.   o: { look, anim, colors, glow (%), mode, dIn, dOut, text, font, thumb } */
var UKCapPrev = (function () {
    var U = UK_CAP, lay = document.createElement("canvas"), tmp = document.createElement("canvas");
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function rgb(h) { h = String(h || "#FFFFFF").replace("#", ""); if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); return [parseInt(h.substr(0, 2), 16) || 0, parseInt(h.substr(2, 2), 16) || 0, parseInt(h.substr(4, 2), 16) || 0]; }
    function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function css(c, al) { return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + (al === undefined ? 1 : al) + ")"; }
    function hue(c, deg) {                       // turn a colour's hue (what a Fill Hue animator does)
        var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0, s = mx ? d / mx : 0, v = mx;
        if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; }
        h = ((h * 60 + deg) % 360 + 360) % 360;
        var cc = v * s, x = cc * (1 - Math.abs((h / 60) % 2 - 1)), m = v - cc, q = [[cc, x, 0], [x, cc, 0], [0, cc, x], [0, x, cc], [x, 0, cc], [cc, 0, x]][Math.floor(h / 60) % 6];
        return [(q[0] + m) * 255, (q[1] + m) * 255, (q[2] + m) * 255];
    }
    function smooth(a) { return a * a * (3 - 2 * a); }
    function ease(u, curve) { u = clamp(u, 0, 1); if (curve === "linear") return u; if (curve === "quint") return 1 - Math.pow(1 - u, 4); return 1 - Math.pow(1 - u, 1.9); }
    function easeIn(u, curve) { u = clamp(u, 0, 1); if (curve === "linear") return u; return Math.pow(u, 1.9); }
    function fontOf(role, size, own) { var F = U.FONTS[role] || U.FONTS.sans; return (F.it ? "italic " : "") + F.w + " " + size + "px " + (own || F.fam); }

    /* letters with their place, in units of the font size 100 */
    function layout(g, look, text, own) {
        var str = String(text).replace(/\r\n|\n/g, "\r"); if (look.caps) str = str.toUpperCase();
        var acc = U.accent(str, look.acc), rows = str.split("\r"), chars = [], lines = [], ci = 0, wi = 0, y = 0, W = 0, li, k, tr = (look.tr || 0) / 1000 * 100;
        for (li = 0; li < rows.length; li++) {
            var words = rows[li].split(" "), x = 0, size = 100, first = chars.length, j;
            for (j = 0; j < words.length; j++) {
                var w = words[j];
                if (j > 0) { g.font = fontOf(look.f, 100, own); chars.push({ ch: " ", x: x, w: g.measureText(" ").width + tr, line: li, word: -1, ci: ci++ }); x += chars[chars.length - 1].w; }
                if (!w.length) continue;
                var isAcc = !!(acc && wi >= acc.w0 && wi < acc.w1), role = isAcc && look.acc.f ? look.acc.f : look.f, fs = isAcc && look.acc.sc ? 100 * look.acc.sc : 100, x0 = x, f = fontOf(role, fs, isAcc && look.acc.f ? null : own);
                g.font = f; size = Math.max(size, fs);
                for (k = 0; k < w.length; k++) {
                    var a = g.measureText(w.substr(0, k)).width, b = g.measureText(w.substr(0, k + 1)).width;
                    chars.push({ ch: w.charAt(k), x: x0 + a + k * tr, w: b - a + tr, line: li, word: wi, ci: ci++, font: f, fs: fs, acc: isAcc, wx: x0 });
                }
                x = x0 + g.measureText(w).width + w.length * tr;
                for (k = chars.length - w.length; k < chars.length; k++) chars[k].ww = x - x0;
                wi++;
            }
            lines.push({ w: x, size: size, top: y, base: y + size * 0.84, first: first, n: chars.length - first });
            y += size * 1.14; W = Math.max(W, x);
        }
        for (k = 0; k < chars.length; k++) { var L = lines[chars[k].line]; chars[k].x += (W - L.w) / 2; if (chars[k].wx !== undefined) chars[k].wx += (W - L.w) / 2; chars[k].base = L.base; }
        return { chars: chars, lines: lines, W: W, H: y - (lines.length ? lines[lines.length - 1].size * 0.14 : 0), nC: ci, nW: wi, nL: rows.length };
    }
    function perm(n, seed) { var a = [], i, s = seed || 7; for (i = 0; i < n; i++) a.push(i); for (i = n - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor(s / 233280 * (i + 1)), q = a[i]; a[i] = a[j]; a[j] = q; } return a; }

    /* how far a letter is in its hidden state (1 = hidden, 0 = at rest) + the overshoot that follows it */
    function amount(A, T, c, ph, order) {
        var n = T.nC, idx = c.ci, r = { a: 0, b: 0 };
        if (ph.dir === 0) return r;
        if (A.kind === "all") { r.a = ph.dir > 0 ? 1 - ease(ph.u, A.curve) : easeIn(ph.u); return r; }
        if (A.kind === "mid") {
            var p = ph.dir > 0 ? ease(ph.u) : 1 - easeIn(ph.u), d = Math.abs(idx - (n - 1) / 2) / Math.max(0.5, n / 2), w = 0.5;
            r.a = smooth(clamp((d - (p * (1 + w) - w)) / w, 0, 1)); return r;
        }
        if (A.based === 3) { n = T.nW; idx = c.word; } else if (A.based === 4) { n = T.nL; idx = c.line; }
        if (idx < 0) idx = 0;
        if (A.random && order) idx = order[idx % order.length];
        var x = (idx + 0.5) / Math.max(1, n) * 100, W = A.W || 40, o;
        if (ph.dir > 0) { o = -W + ease(ph.u, A.curve) * (100 + W); r.a = smooth(clamp((x - o) / W, 0, 1)); }
        else { o = -W + easeIn(ph.u, A.curve) * (100 + W); r.a = smooth(clamp((o + W - x) / W, 0, 1)); }
        if (A.bump && ph.dir > 0) {
            var Wb = A.bump.W || 30, lag = A.bump.lag === undefined ? 0.12 : A.bump.lag, kk = (100 + W + Wb / 2) / (100 + W);
            var ob = Math.max(-100, -W - Wb / 2), u2 = clamp((ph.u - lag) / kk, 0, 1), off = ob + (100 - ob) * ease(u2, A.curve), q = (x - off) / Wb;
            if (q > 0 && q < 1) r.b = 0.5 - 0.5 * Math.cos(q * Math.PI * 2);
        }
        return r;
    }
    function phase(o, t) {
        var m = o.mode || "in", dIn = o.dIn || 1, dOut = o.dOut || 0.8, hold = 1.3, gap = 0.4, total, tt;
        if (o.thumb) return { dir: 0, u: 1 };
        if (m === "in") { total = dIn + hold + gap; tt = t % total; if (tt < dIn) return { dir: 1, u: tt / dIn }; return tt < dIn + hold ? { dir: 0, u: 1 } : { dir: 1, u: 0 }; }
        if (m === "out") { total = 0.7 + dOut + gap; tt = t % total; if (tt < 0.7) return { dir: 0, u: 1 }; return { dir: -1, u: Math.min(1, (tt - 0.7) / dOut) }; }
        total = dIn + hold + dOut + gap; tt = t % total;
        if (tt < dIn) return { dir: 1, u: tt / dIn };
        if (tt < dIn + hold) return { dir: 0, u: 1 };
        return { dir: -1, u: Math.min(1, (tt - dIn - hold) / dOut) };
    }
    function tint(src, col) { var x = tmp.getContext("2d"); tmp.width = src.width; tmp.height = src.height; x.drawImage(src, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, tmp.width, tmp.height); return tmp; }

    function draw(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
        var g = cv.getContext("2d"), Wc = cv.width, Hc = cv.height, look = o.look || U.LOOKS[0], A = o.anim || U.anim(look.a), col = o.colors || U.colors(look);
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = "none"; g.globalCompositeOperation = "source-over";
        g.fillStyle = "#08080a"; g.fillRect(0, 0, Wc, Hc);
        if (lay.width !== Wc || lay.height !== Hc) { lay.width = Wc; lay.height = Hc; }
        var lg = lay.getContext("2d"); lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = "source-over"; lg.globalAlpha = 1; lg.filter = "none"; lg.clearRect(0, 0, Wc, Hc);
        var own = o.font === false ? U.FONTS.med.fam : null, T = layout(lg, look, o.text || look.t, own);
        if (!T.chars.length) return;
        var k = Math.min(Wc * 0.82 / T.W, Hc * 0.62 / T.H, Hc * 0.4 / 100), fs = 100 * k, X0 = (Wc - T.W * k) / 2, Y0 = (Hc - T.H * k) / 2;
        var ph = phase(o, t), order = A.random ? perm(T.nC, 7) : null, P = A.p, g01 = clamp((look.g || 0) / 100, 0, 1), c1 = rgb(col.c1), c2 = rgb(col.c2), i;
        var spin = look.spin ? (t / look.spin * 360) % 360 : 0, horiz = (look.ang || 0) > 45;
        lg.textBaseline = "alphabetic"; lg.lineJoin = "round";
        for (i = 0; i < T.chars.length; i++) {
            var c = T.chars[i]; if (c.ch === " ") continue;
            var r = amount(A, T, c, ph, order), a = r.a, b = r.b, B = A.bump ? A.bump.p : {}, op = 1 - a * (1 - (P.opacity === undefined ? 100 : P.opacity) / 100);
            if (op <= 0.005) continue;
            var dx = 0, dy = 0, sx = 1, sy = 1, rot = 0, bl = 0, L = T.lines[c.line];
            if (P.pos) { dx += a * P.pos[0] * fs; dy += a * P.pos[1] * fs; } if (B.pos) { dx += b * B.pos[0] * fs; dy += b * B.pos[1] * fs; }
            if (P.scale) { sx = 1 + a * (P.scale[0] / 100 - 1); sy = 1 + a * (P.scale[1] / 100 - 1); } if (B.scale) { sx *= 1 + b * (B.scale[0] / 100 - 1); sy *= 1 + b * (B.scale[1] / 100 - 1); }
            if (P.rot) rot += a * P.rot; if (B.rot) rot += b * B.rot;
            if (P.blur) bl = a * Math.max(P.blur[0], P.blur[1]) * fs * 0.55;
            if (P.track) dx += a * P.track * 0.006 * fs * (c.ci - L.first - (L.n - 1) / 2);
            var px = X0 + (c.x + c.w / 2) * k, py = Y0 + c.base * k;                        // what the letter turns / scales round
            if (A.group === 2 && c.wx !== undefined) px = X0 + (c.wx + c.ww / 2) * k;
            if (A.group === 4) { px = Wc / 2; py = Hc / 2 + T.H * k * 0.18; }
            var base = c.acc ? rgb(col.acc) : rgb(col.fill);
            if (look.hue) base = hue(base, (T.nC > 1 ? c.ci / (T.nC - 1) : 0) * 300 + spin);
            lg.save(); lg.globalAlpha = clamp(op, 0, 1); if (bl > 0.4) lg.filter = "blur(" + bl.toFixed(1) + "px)";
            lg.translate(px + dx, py + dy); if (rot) lg.rotate(rot * Math.PI / 180); lg.scale(sx, sy);
            lg.font = c.font.replace(/ [\d.]+px /, " " + (c.fs * k).toFixed(2) + "px ");
            var fillS = css(base);
            if (g01 > 0) {
                var gr = horiz ? lg.createLinearGradient(X0 - px, 0, X0 + T.W * k - px, 0) : lg.createLinearGradient(0, Y0 + L.top * k - py, 0, Y0 + (L.top + L.size * 1.02) * k - py);
                gr.addColorStop(0, css(mixc(base, c1, g01))); gr.addColorStop(1, css(mixc(base, c2, g01))); fillS = gr;
            }
            var tx = X0 + c.x * k - px, ty = Y0 + c.base * k - py;
            if (look.stroke) { lg.strokeStyle = look.hollow ? fillS : look.stroke[0]; lg.lineWidth = look.stroke[1] * fs * (look.hollow ? 1 : 2); lg.strokeText(c.ch, tx, ty); }
            if (!look.hollow) { lg.fillStyle = fillS; lg.fillText(c.ch, tx, ty); }
            if (look.bevel) { var hg = lg.createLinearGradient(0, ty - c.fs * k * 0.78, 0, ty - c.fs * k * 0.3); hg.addColorStop(0, "rgba(255,255,255,0.75)"); hg.addColorStop(1, "rgba(255,255,255,0)"); lg.fillStyle = hg; lg.fillText(c.ch, tx, ty); }
            lg.restore();
        }
        if (look.lines) { lg.globalCompositeOperation = "destination-out"; lg.fillStyle = "rgba(0,0,0,0.5)"; var st = Math.max(3, Math.round(fs * 0.075)); for (i = 0; i < Hc; i += st) lg.fillRect(0, i, Wc, st * 0.42); lg.globalCompositeOperation = "source-over"; }
        var j, d;
        if (look.depth) { d = look.depth[1] * fs; tint(lay, look.depth[0]); for (j = 4; j >= 1; j--) g.drawImage(tmp, d * j / 4 * 0.71, d * j / 4 * 0.71); }
        if (look.split) { d = look.split * fs; g.globalAlpha = 0.85; g.drawImage(tint(lay, "#FF2A4D"), -d, 0); g.drawImage(tint(lay, "#22E5FF"), d, 0); g.globalAlpha = 1; }
        if (look.glow) {
            var am = look.glow[0] / 100 * (o.glow === undefined ? 1 : o.glow / 100), sz = (look.glow[1] || 1) * fs;
            if (am > 0.01) {
                var src = look.glow[2] ? tint(lay, col.glow) : lay;
                g.globalCompositeOperation = "lighter";
                g.filter = "blur(" + (sz * 0.5).toFixed(1) + "px)"; g.globalAlpha = clamp(0.55 * am, 0, 1); g.drawImage(src, 0, 0);
                g.filter = "blur(" + (sz * 0.16).toFixed(1) + "px)"; g.globalAlpha = clamp(0.6 * am, 0, 1); g.drawImage(src, 0, 0);
                g.filter = "none"; g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
            }
        }
        g.drawImage(lay, 0, 0);
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
    return { draw: draw, Player: Player };
})();

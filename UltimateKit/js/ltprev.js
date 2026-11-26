/*  Ultimate Kit - Lower Third previews (canvas). Same presets, timing and graphics geometry as After
    Effects (shared/lowerthird.js: the GEO code is run here as-is); the eases are the same bezier
    curves as the keyframes, text reveals are close sketches of the text animators.               */
var UKLTPrev = (function () {
    var cl = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var geo = new Function("e", "M", UK_LT.GEO + "\nreturn geo(e, M);");
    /* AE keyframe ease (zero speed, influences a / b) as a cubic bezier (a, 0, 1 - b, 1) */
    function bez(a, b) {
        var x1 = a / 100, x2 = 1 - b / 100;
        return function (x) {
            x = cl(x, 0, 1);
            if (x <= 0 || x >= 1) return x;
            var t = x, i;
            for (i = 0; i < 8; i++) {
                var u = 1 - t, fx = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t - x, dx = 3 * u * u * x1 + 6 * u * t * (x2 - x1) + 3 * t * t * (1 - x2);
                if (Math.abs(dx) < 1e-6) break;
                t = cl(t - fx / dx, 0, 1);
            }
            return 3 * (1 - t) * t * t + t * t * t;
        };
    }
    var EIN = bez(38, 85), EOUT = bez(80, 42);
    var E = {
        out: function (x) { x = cl(x, 0, 1); return 1 - Math.pow(1 - x, 3); },
        inout: function (x) { x = cl(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
        sine: function (x) { x = cl(x, 0, 1); return 0.5 - Math.cos(Math.PI * x) / 2; },
        lin: function (x) { return cl(x, 0, 1); }
    };
    /* range-selector cascade: unit k of n, time u, ramp W % -> 1 = selected */
    function cas(k, n, u, W, curve) { var O = -W + (100 + W) * curve(u), pos = (k + 0.5) / n * 100; return E.sine((O - pos + W) / W); }
    function hex(h, a) { var n = parseInt(String(h || "#ffffff").replace("#", ""), 16); return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + (a === undefined ? 1 : a) + ")"; }

    /* one text line laid out per character (tracking in 1/1000 em, like AE) */
    function line(g, str, font, size, track, al, x0, y) {
        g.font = font;
        var cs = [], x = 0, i, tr = track * size / 1000;
        for (i = 0; i < str.length; i++) { var w = g.measureText(str[i]).width; cs.push({ ch: str[i], x: x, w: w }); x += w + tr; }
        var wTot = Math.max(0, x - tr), s = al === "C" ? x0 - wTot / 2 : (al === "R" ? x0 - wTot : x0), word = 0, prev = true;
        for (i = 0; i < cs.length; i++) { cs[i].x += s; if (cs[i].ch !== " " && prev && i) word++; prev = cs[i].ch === " "; cs[i].word = word; }
        return { cs: cs, l: s, r: s + wTot, w: wTot, y: y, f: size, words: word + 1, font: font, track: tr };
    }
    /* reveal of one line: returns per-char states + clip */
    function textState(Ln, sp, sc, t, x) {
        var type = sp[0], s = UK_LT.sched(sp[1], sp[2], x.dIn, x.dOut), f = Ln.f, n = Ln.cs.length, i;
        var pin = cl((t - s.a) / s.d, 0, 1), pout = x.out ? cl((t - x.tO - s.oa) / s.od, 0, 1) : 0, phase = pout > 0 ? "out" : "in";
        var vis = EIN(pin) * (1 - EOUT(pout)), h = 1 - vis, st = [], clip = null;
        for (i = 0; i < n; i++) st.push({ dx: 0, dy: 0, op: 1, blur: 0, sc: 1, sy: 1 });
        var cascade = function (P, o) {
            for (i = 0; i < n; i++) {
                var k = o.words ? Ln.cs[i].word : i, nn = o.words ? Ln.words : n;
                var hh = phase === "in" ? 1 - cas(k, nn, pin, o.W, o.curve) : cas(k, nn, pout, o.W, o.curveOut);
                if (P.op !== undefined) st[i].op = 1 - hh;
                if (P.dy) st[i].dy = P.dy * hh;
                if (P.blur) st[i].blur = P.blur * hh;
                if (P.sc !== undefined) st[i].sc = 1 - hh;
                if (P.sy) st[i].sy = Math.max(0.02, Math.cos(hh * Math.PI / 2));
            }
        };
        var band = { x0: -1e5, x1: 1e5, y0: Ln.y - f * 1.05, y1: Ln.y + f * 0.4 };
        switch (type) {
            case "rise": clip = band; for (i = 0; i < n; i++) st[i].dy = h * f * 1.3; break;
            case "drop": clip = band; for (i = 0; i < n; i++) st[i].dy = -h * f * 1.35; break;
            case "riseChars": clip = band; cascade({ dy: f * 1.3 }, { W: 40, curve: E.out, curveOut: E.inout }); break;
            case "slide": clip = { x0: Ln.l - 1, x1: 1e5, y0: band.y0, y1: band.y1 }; for (i = 0; i < n; i++) st[i].dx = -h * (Ln.w + f * 0.6); break;
            case "slideR": clip = { x0: -1e5, x1: Ln.r + 1, y0: band.y0, y1: band.y1 }; for (i = 0; i < n; i++) st[i].dx = h * (Ln.w + f * 0.6); break;
            case "fadeUp": cascade({ op: 0, dy: f * 0.35, blur: f * 0.05 }, { W: 40, curve: E.out, curveOut: E.inout }); break;
            case "blur": cascade({ op: 0, blur: f * 0.3 }, { W: 55, curve: E.sine, curveOut: E.inout }); break;
            case "fade": for (i = 0; i < n; i++) { st[i].op = vis; st[i].dy = h * f * 0.25; } break;
            case "track": for (i = 0; i < n; i++) { st[i].op = vis; st[i].dx = (Ln.cs[i].x - Ln.l) * 0 + i * h * 160 * f / 1000 - (x.al === "C" ? (n - 1) * h * 80 * f / 1000 : 0); st[i].blur = h * f * 0.1; } break;
            case "pop": cascade({ sc: 0, op: 0 }, { W: 45, curve: E.sine, curveOut: E.inout }); break;
            case "words": cascade({ op: 0, dy: f * 0.3, blur: f * 0.06 }, { W: 55, words: true, curve: E.out, curveOut: E.inout }); break;
            case "type": cascade({ op: 0 }, { W: 10, curve: E.lin, curveOut: E.lin }); break;
            case "flip": cascade({ op: 0, sy: 1, dy: f * 0.25 }, { W: 45, curve: E.out, curveOut: E.inout }); break;
            case "wipe": var e = f * 0.3; clip = { x0: Ln.l - e, x1: Ln.l - e + (Ln.w + 2 * e) * vis, y0: -1e5, y1: 1e5 }; break;
            case "hold": var on = t >= s.a && !(x.out && t >= x.tO + s.oa); for (i = 0; i < n; i++) st[i].op = on ? 1 : 0; break;
        }
        return { st: st, clip: clip };
    }
    function drawLine(g, Ln, T, col) {
        g.save();
        if (T.clip) { g.beginPath(); g.rect(T.clip.x0, T.clip.y0, T.clip.x1 - T.clip.x0, T.clip.y1 - T.clip.y0); g.clip(); }
        g.font = Ln.font; g.textBaseline = "alphabetic"; g.textAlign = "left"; g.fillStyle = col;
        for (var i = 0; i < Ln.cs.length; i++) {
            var c = Ln.cs[i], s = T.st[i];
            if (c.ch === " " || s.op <= 0.004 || s.sc <= 0.01) continue;
            g.save();
            g.globalAlpha = cl(s.op, 0, 1);
            if (s.blur > 0.3) g.filter = "blur(" + s.blur.toFixed(1) + "px)";
            g.translate(c.x + c.w / 2 + s.dx, Ln.y + s.dy);
            g.scale(s.sc, s.sc * s.sy);
            g.fillText(c.ch, -c.w / 2, 0);
            g.restore();
        }
        g.restore();
    }
    /* polyline part a..b (0..1 of its length) */
    function part(g, pts, a, b, closed) {
        if (closed) pts = pts.concat([pts[0]]);
        var L = [0], i;
        for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        var tot = L[L.length - 1], s0 = a * tot, s1 = b * tot, on = false;
        if (tot <= 0 || s1 - s0 < 0.01) return;
        g.beginPath();
        for (i = 1; i < pts.length; i++) {
            if (L[i] < s0) continue;
            var sg = (L[i] - L[i - 1]) || 1, p0 = pts[i - 1], p1 = pts[i], f0 = cl((s0 - L[i - 1]) / sg, 0, 1), f1 = cl((s1 - L[i - 1]) / sg, 0, 1);
            if (!on) { g.moveTo(p0[0] + (p1[0] - p0[0]) * f0, p0[1] + (p1[1] - p0[1]) * f0); on = true; }
            g.lineTo(p0[0] + (p1[0] - p0[0]) * f1, p0[1] + (p1[1] - p0[1]) * f1);
            if (L[i] >= s1) break;
        }
        g.stroke();
    }
    function rrect(x0, y0, w, h, r, n) {
        var p = [], k, j;
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        var cs = [[x0 + w - r, y0 + r, -Math.PI / 2], [x0 + w - r, y0 + h - r, 0], [x0 + r, y0 + h - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]];
        for (k = 0; k < 4; k++) for (j = 0; j <= n; j++) { var a = cs[k][2] + j / n * Math.PI / 2; p.push([cs[k][0] + Math.cos(a) * r, cs[k][1] + Math.sin(a) * r]); }
        return p;
    }
    function element(g, e, G, t, x, colOf, fs) {
        var s = UK_LT.sched(e.at, e.len, x.dIn, x.dOut);
        var pin = cl((t - s.a) / s.d, 0, 1), pout = x.out ? cl((t - x.tO - s.oa) / s.od, 0, 1) : 0, v = EIN(pin) * (1 - EOUT(pout));
        var a = e.a, col = colOf(e.col), op = (e.op === undefined ? 100 : e.op) / 100, sx = 1, sy = 1, gop = 1, tA = 0, tB = 1;
        if (a === "draw") tB = v;
        else if (a === "drawR") tA = 1 - v;
        else if (a === "drawC") { tA = 0.5 - v / 2; tB = 0.5 + v / 2; }
        else if (a === "block") {
            if (pout > 0) { var po = cl(pout * 2, 0, 1), pe = cl(pout * 2 - 1, 0, 1); tA = 1 - EIN(po); tB = 1 - EIN(pe); if (pout >= 1) { tA = 0; tB = 0; } }
            else { tB = EIN(cl(pin * 2, 0, 1)); tA = EIN(cl(pin * 2 - 1, 0, 1)); }
        }
        else if (a === "fade") gop = v;
        else if (a === "scale") { sx = sy = 0.86 + 0.14 * v; gop = v; }
        else if (a === "pop") {
            var pp = pout > 0 ? 1 - EOUT(pout) : null;
            if (pp === null) pp = pin < 0.62 ? 1.12 * bez(40, 70)(pin / 0.62) : 1.12 - 0.12 * bez(45, 80)((pin - 0.62) / 0.38);
            sx = sy = pp;
        }
        else if (a === "up" || a === "down" || a === "center") sy = v;
        else sx = v;
        if (sx <= 0.002 || sy <= 0.002 || gop <= 0.002 || tB - tA <= 0.002) return;
        g.save();
        g.globalAlpha = op * gop;
        g.translate(G.pv[0], G.pv[1]); g.scale(sx, sy); g.translate(-G.pv[0], -G.pv[1]);
        g.fillStyle = g.strokeStyle = col;
        var sw = (e.sw || 0.04) * fs, T = e.t, k;
        g.lineWidth = sw; g.lineCap = "round"; g.lineJoin = "round";
        if (T === "plate" || T === "bar") { g.beginPath(); var rp = rrect(G.l, G.t, G.r - G.l, G.b - G.t, G.rd, 6); g.moveTo(rp[0][0], rp[0][1]); for (k = 1; k < rp.length; k++) g.lineTo(rp[k][0], rp[k][1]); g.closePath(); g.fill(); }
        else if (T === "outline") part(g, rrect(G.l, G.t, G.r - G.l, G.b - G.t, G.rd, 8), tA, tB, true);
        else if (T === "dot") {
            if (e.shape === "ring") { var rg = [], j; for (j = 0; j <= 48; j++) { var an = -Math.PI / 2 + j / 48 * Math.PI * 2; rg.push([G.x + Math.cos(an) * G.d / 2, G.y + Math.sin(an) * G.d / 2]); } part(g, rg, tA, tB, false); }
            else if (G.p.length) { g.beginPath(); g.moveTo(G.p[0][0][0], G.p[0][0][1]); for (k = 1; k < G.p[0].length; k++) g.lineTo(G.p[0][k][0], G.p[0][k][1]); g.closePath(); g.fill(); }
            else { g.beginPath(); g.arc(G.x, G.y, G.d / 2, 0, Math.PI * 2); g.fill(); }
        }
        else {
            if (T === "block") { g.lineWidth = G.b - G.t; g.lineCap = "butt"; }
            for (k = 0; k < G.p.length; k++) part(g, G.p[k], tA, tB, false);
        }
        g.restore();
    }
    function draw(cv, spec, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, CW = cv.clientWidth || 160, CH = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(CW * dpr)), H = Math.round(W * CH / CW);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var g = cv.getContext("2d");
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = "#14141a"; g.fillRect(0, 0, W, H);
        var dIn = o.inDur || 1.2, hold = o.hold === undefined ? 1.5 : o.hold, dOut = o.outDur || 0.9, out = o.mode !== "in";
        var total = dIn + hold + (out ? dOut : 0) + 0.6, tt = t % total;
        var x = { al: spec.al, dIn: dIn, dOut: dOut, out: out, tO: dIn + hold };
        // laid out in the full frame like After Effects, then shown through a zoomed window (o.zoom)
        // over the lower third, so small tiles stay readable
        var z = o.zoom || 1, VW = W, VH = H;
        var fs = VH * 0.062, ts = fs * (spec.cap ? 0.44 : 0.5), gap = UK_LT.lineGap(spec, fs, ts), A = UK_LT.anchor(spec, VW, VH, fs, gap);
        var cx0 = spec.al === "C" ? W / 2 - W / (2 * z) : (spec.al === "R" ? W - W / z : 0), cy0 = Math.max(0, Math.min(H - H / z, H * 0.86 - H / z * 0.62));
        g.scale(z, z);
        g.translate(-cx0, -cy0);
        var cols = UK_LT.colors(spec), oc = o.colors || {};
        var cN = oc.name || cols.name, cT = oc.title || cols.title, cP = oc.plate || cols.plate, cA = oc.accent || "#7C5CFF";
        var nameStr = o.name || "Alex Morgan", titleStr = o.title || "Creative Director";
        if (spec.cap) titleStr = titleStr.toUpperCase();
        var yN = spec.ord === "tn" ? gap : 0, yT = spec.ord === "tn" ? 0 : gap;
        var NL = line(g, nameStr, "600 " + fs + "px Inter, 'Segoe UI', sans-serif", fs, -5, spec.al, A[0], A[1] + yN);
        var TL = line(g, titleStr, "500 " + ts + "px Inter, 'Segoe UI', sans-serif", ts, spec.cap ? 160 : 10, spec.al, A[0], A[1] + yT);
        var mm = function (Ln) { return { l: Ln.l, r: Ln.r, t: Ln.y - Ln.f * UK_LT.CAP, b: Ln.y + Ln.f * UK_LT.DESC, y: Ln.y, f: Ln.f }; };
        var M = { n: mm(NL), t: mm(TL), fs: fs, al: spec.al };
        M.first = spec.ord === "tn" ? M.t : M.n; M.second = spec.ord === "tn" ? M.n : M.t;
        var colOf = function (c) { return c === "P" ? cP : (c === "N" ? cN : (c === "T" ? cT : cA)); };
        var i, blocks = [];
        for (i = 0; i < spec.e.length; i++) {
            if (spec.e[i].t === "block") { blocks.push(spec.e[i]); continue; }
            element(g, spec.e[i], geo(spec.e[i], M), tt, x, colOf, fs);
        }
        drawLine(g, TL, textState(TL, spec.t, spec, tt, x), cT);
        drawLine(g, NL, textState(NL, spec.n, spec, tt, x), cN);
        for (i = 0; i < blocks.length; i++) element(g, blocks[i], geo(blocks[i], M), tt, x, colOf, fs);
    }
    function Player(cv) { this.cv = cv; this.spec = null; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (spec, o) { if (spec && spec !== this.spec) { this.spec = spec; this.t = 0; } if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.restart = function () { this.t = 0; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) { if (!self.running) return; self.t += Math.min(0.1, (now - last) / 1000); last = now; if (self.spec && document.body.contains(self.cv)) draw(self.cv, self.spec, self.t, self.o); requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player };
})();

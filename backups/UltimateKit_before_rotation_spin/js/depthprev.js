/*  Ultimate Kit - Depth Reveal previews (canvas): a painted landscape with its own depth (sky far, three
    ridges, a near hill), each look computed like the AE effects (jsx/depth.jsx), and the
    wipe exactly as AE's Gradient Wipe does it (completion, softness, inverted for near-first).        */
var UKDepthPrev = (function () {
    var cl = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var IW = 320, IH = 180, base = null, looks = {};
    function hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
    function ridge(x, k) { var s = [0.22, 0.31, 0.43][k], a = [0.05, 0.06, 0.05][k], f = [2.1, 3.3, 1.7][k], p = [0.3, 1.9, 4.1][k]; return IH * (s + 0.12 + a * Math.sin(x / IW * Math.PI * f + p) + a * 0.5 * Math.sin(x / IW * Math.PI * f * 2.7 + p * 2)); }
    function hill(x) { return IH * (0.62 + 0.06 * Math.sin(x / IW * Math.PI * 1.3 + 0.8) + 0.03 * Math.sin(x / IW * Math.PI * 4.2)); }
    /* the scene (rgb) and its depth (0 far .. 1 near), painted once */
    function scene() {
        if (base) return base;
        var n = IW * IH, rgb = new Uint8ClampedArray(n * 3), dep = new Float32Array(n), x, y, i;
        var RC = [[150, 128, 170], [112, 96, 140], [74, 92, 70]], RD = [0.16, 0.3, 0.45];
        for (y = 0; y < IH; y++) for (x = 0; x < IW; x++) {
            i = y * IW + x;
            var r, g, b, d = 0, hy = hill(x), k;
            if (y >= hy) {
                var u = (y - hy) / (IH - hy), gr = hash(x, y) * 0.35 + 0.65 * hash(Math.floor(x / 2), Math.floor(y / 3));
                r = 120 + 70 * gr - 40 * u; g = 150 + 70 * gr - 30 * u; b = 30 + 20 * gr; d = 0.6 + 0.4 * u;
            } else {
                var hit = -1;
                for (k = 2; k >= 0; k--) if (y >= ridge(x, k)) { hit = k; break; }
                if (hit >= 0) { var sh = (y - ridge(x, hit)) / IH; r = RC[hit][0] - sh * 60; g = RC[hit][1] - sh * 50; b = RC[hit][2] - sh * 40; d = RD[hit] + sh * 0.3; }
                else {
                    var v = y / (IH * 0.5), sx = x - IW * 0.66, sy = y - IH * 0.4, sun = Math.exp(-(sx * sx + sy * sy) / (IH * IH * 0.02));
                    r = 70 + 180 * v + 120 * sun; g = 110 + 90 * v + 100 * sun; b = 170 - 40 * v + 40 * sun; d = 0;
                }
            }
            rgb[i * 3] = r; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = b; dep[i] = cl(d, 0, 1);
        }
        base = { rgb: rgb, dep: dep };
        return base;
    }
    function hex(h) { var n = parseInt(String(h || "#fff").replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    function hsv(h, s, v) { h = ((h % 360) + 360) % 360 / 60; var i = Math.floor(h), f = h - i, p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f)); return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]; }
    function lumAt(rgb, i) { return (rgb[i * 3] * 0.299 + rgb[i * 3 + 1] * 0.587 + rgb[i * 3 + 2] * 0.114) / 255; }
    function blurred(px) {
        var c = document.createElement("canvas"); c.width = IW; c.height = IH;
        var g = c.getContext("2d"), im = g.createImageData(IW, IH), i;
        for (i = 0; i < IW * IH; i++) { im.data[i * 4] = base.rgb[i * 3]; im.data[i * 4 + 1] = base.rgb[i * 3 + 1]; im.data[i * 4 + 2] = base.rgb[i * 3 + 2]; im.data[i * 4 + 3] = 255; }
        g.putImageData(im, 0, 0);
        var c2 = document.createElement("canvas"); c2.width = IW; c2.height = IH;
        var g2 = c2.getContext("2d"); g2.filter = "blur(" + px + "px)"; g2.drawImage(c, 0, 0);
        return g2.getImageData(0, 0, IW, IH).data;
    }
    /* the covering copy (rgb) of a look at a phase (degrees), a pixel sketch of the AE effects (jsx/depth.jsx).
       Palette looks are exact: Colorama's wheel by brightness (R+G+B)/3, turned by the phase, through the
       palette's fitted Channel Mixer (shared/depth.js)                                                    */
    function look(spec, o, phase) {
        var fx = spec.fx, c0 = hex((o.colors && o.colors[0]) || (spec.colors && spec.colors[0]) || "#FFFFFF"), c1 = hex((o.colors && o.colors[1]) || (spec.colors && spec.colors[1]) || "#FFFFFF");
        var live = fx === "palette" || fx === "dream", key = fx + (spec.pal || "") + c0 + c1 + (live ? Math.round(phase) : "");
        if (looks[key]) return looks[key];
        var S = scene(), n = IW * IH, out = new Uint8ClampedArray(n * 3), i, x, y, L, e, B = null, col, F = null, M = null, w;
        if (fx === "palette") { F = UK_DEPTH.fitOf(spec.pal); M = F.mix; }
        if (fx === "blur") B = blurred(5); else if (fx === "fog") B = blurred(2.5); else if (fx === "dream") B = blurred(0.6);
        for (i = 0; i < n; i++) {
            x = i % IW; y = (i / IW) | 0; L = lumAt(S.rgb, i);
            var r = S.rgb[i * 3], g = S.rgb[i * 3 + 1], b = S.rgb[i * 3 + 2];
            switch (fx) {
                case "palette":
                    w = UK_DEPTH.wheel((r + g + b) / 765 + (F.phase + phase) / 360);
                    r = 2.55 * (M[0][0] * w[0] + M[0][1] * w[1] + M[0][2] * w[2] + M[0][3]); g = 2.55 * (M[1][0] * w[0] + M[1][1] * w[1] + M[1][2] * w[2] + M[1][3]); b = 2.55 * (M[2][0] * w[0] + M[2][1] * w[1] + M[2][2] * w[2] + M[2][3]);
                    break;
                case "dream": L = (B[i * 4] * 0.299 + B[i * 4 + 1] * 0.587 + B[i * 4 + 2] * 0.114) / 255; col = hsv(L * 360 + phase, 1, 1); r = 255 * (0.3 * col[0] + 0.7); g = 255 * (0.3 * col[1] + 0.7); b = 255 * (0.3 * col[2] + 0.7); break;
                case "mono": r = g = b = L * 255; break;
                case "blur": r = B[i * 4]; g = B[i * 4 + 1]; b = B[i * 4 + 2]; break;
                case "fog": r = B[i * 4] * 0.18 + c0[0] * 0.82; g = B[i * 4 + 1] * 0.18 + c0[1] * 0.82; b = B[i * 4 + 2] * 0.18 + c0[2] * 0.82; break;
                case "dark": r = c0[0]; g = c0[1]; b = c0[2]; break;
                case "thermal": col = hsv(L * 360, 1, 1); r = col[0] * 255; g = col[1] * 255; b = col[2] * 255; break;
                case "golden": r = 255 * cl(L * 2.2, 0, 1); g = 255 * cl(L * 1.6 - 0.35, 0, 1); b = 255 * cl(L * 1.4 - 0.75, 0, 1); break;
                case "duo": r = c0[0] + (c1[0] - c0[0]) * L; g = c0[1] + (c1[1] - c0[1]) * L; b = c0[2] + (c1[2] - c0[2]) * L; break;
                case "neon":
                case "blueprint":
                    var xl = Math.max(0, x - 1), xr = Math.min(IW - 1, x + 1), yu = Math.max(0, y - 1), yd = Math.min(IH - 1, y + 1);
                    e = cl((Math.abs(lumAt(S.rgb, y * IW + xr) - lumAt(S.rgb, y * IW + xl)) + Math.abs(lumAt(S.rgb, yd * IW + x) - lumAt(S.rgb, yu * IW + x))) * 3, 0, 1);
                    if (fx === "neon") { r = c0[0] * e; g = c0[1] * e; b = c0[2] * e; }
                    else { r = c0[0] + (c1[0] - c0[0]) * e; g = c0[1] + (c1[1] - c0[1]) * e; b = c0[2] + (c1[2] - c0[2]) * e; }
                    break;
                case "mosaic":
                    var bs = 12, j = (Math.min(IH - 1, Math.floor(y / bs) * bs + bs / 2) * IW + Math.min(IW - 1, Math.floor(x / bs) * bs + bs / 2));
                    r = S.rgb[j * 3]; g = S.rgb[j * 3 + 1]; b = S.rgb[j * 3 + 2]; break;
                case "negative": r = 255 - r; g = 255 - g; b = 255 - b; break;
            }
            out[i * 3] = r; out[i * 3 + 1] = g; out[i * 3 + 2] = b;
        }
        if (!live || phase === 0) looks[key] = out;
        return out;
    }    /* AE's ease (influence a%, b%, zero speed) */
    function bez(a, b) {
        var x1 = a / 100, x2 = 1 - b / 100;
        return function (x) {
            if (x <= 0 || x >= 1) return cl(x, 0, 1);
            var lo = 0, hi = 1, s = x, i;
            for (i = 0; i < 26; i++) { s = (lo + hi) / 2; var u = 1 - s, bx = 3 * u * u * s * x1 + 3 * u * s * s * x2 + s * s * s; if (bx < x) lo = s; else hi = s; }
            return 3 * (1 - s) * s * s + s * s * s;
        };
    }
    var EZ = bez(UK_DEPTH.EASE[0], UK_DEPTH.EASE[1]), buf = null;
    /* o: { dur, softness 0..100, mode reveal|cover, dir near|far, colors, thumb, maxW } */
    function draw(cv, spec, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, CW = cv.clientWidth || 160, CH = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(CW * dpr)), Hc = Math.round(Wc * CH / CW);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        // AE's timing (UK_DEPTH.TIME, in units of the wipe duration D): colours turn from 0 to 1.03 D, the wipe runs 0.224 - 1.224 D
        var S = scene(), T = UK_DEPTH.TIME, D = Math.min(3, o.dur || 1.65), lead = 0.5, cyc = lead + T.wipe[1] * D + 1.0, tt = o.thumb ? lead + (T.wipe[0] + 0.45) * D : t % cyc;
        var c = EZ(cl((tt - lead - T.wipe[0] * D) / D, 0, 1)), pc = EZ(cl((tt - lead - T.phase[0] * D) / ((T.phase[1] - T.phase[0]) * D), 0, 1));
        if (o.mode === "cover") { c = 1 - c; pc = 1 - pc; }
        var cov = look(spec, o, pc > 0 && pc < 1 ? 360 * (spec.fx === "palette" ? T.turns : 1) * pc : 0);
        var s = Math.max(0.001, (o.softness === undefined ? spec.soft : o.softness) / 100), th = c * (1 + s) - s, near = o.dir === "near";        if (!buf) { buf = document.createElement("canvas"); buf.width = IW; buf.height = IH; }
        var g = buf.getContext("2d"), im = g.createImageData(IW, IH), d = im.data, i, n = IW * IH;
        for (i = 0; i < n; i++) {
            var G = near ? 1 - S.dep[i] : S.dep[i], a = cl((G - th) / s, 0, 1);
            d[i * 4] = S.rgb[i * 3] + (cov[i * 3] - S.rgb[i * 3]) * a;
            d[i * 4 + 1] = S.rgb[i * 3 + 1] + (cov[i * 3 + 1] - S.rgb[i * 3 + 1]) * a;
            d[i * 4 + 2] = S.rgb[i * 3 + 2] + (cov[i * 3 + 2] - S.rgb[i * 3 + 2]) * a;
            d[i * 4 + 3] = 255;
        }
        g.putImageData(im, 0, 0);
        var x = cv.getContext("2d");
        x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
        // cover-fit the 16:9 scene
        var sc = Math.max(Wc / IW, Hc / IH), w = IW * sc, h = IH * sc;
        x.drawImage(buf, (Wc - w) / 2, (Hc - h) / 2, w, h);
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
    return { draw: draw, Player: Player, scene: scene, IW: IW, IH: IH };
})();

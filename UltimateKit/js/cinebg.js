/*  Ultimate Kit - cinematic background preview (canvas).
    Mirrors jsx/backgrounds.jsx: white shapes on black -> blur -> 5-colour map -> grain. */
var UKCine = (function () {
    function hexRgb(h) { var n = parseInt(String(h).replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    function lut(pal) {
        var c = pal.map(hexRgb), out = new Uint8Array(256 * 3);
        for (var i = 0; i < 256; i++) {
            var x = i / 255 * 4, k = Math.min(3, Math.floor(x)), f = x - k;
            for (var j = 0; j < 3; j++) out[i * 3 + j] = Math.round(c[k][j] + (c[k + 1][j] - c[k][j]) * f);
        }
        return out;
    }
    /* periodic Catmull-Rom through a cycle of values (numbers or [x,y]) at u in [0,1) */
    function cyc(vals, u, shift) {
        if (!(vals instanceof Array)) return vals;
        var n = vals.length;
        if (n === 1) return vals[0];
        var x = ((u * n) % n + n) % n, i = Math.floor(x), t = x - i;
        function at(k) { return vals[(((k + (shift || 0)) % n) + n) % n]; }
        var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
        function cr(a, b, c, d) { return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t); }
        if (typeof p1 === "number") return cr(p0, p1, p2, p3);
        return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
    }
    function star(g, n, ro, ri) {
        g.beginPath();
        for (var i = 0; i < n * 2; i++) {
            var a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? ri : ro;
            g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g.closePath();
    }
    function drawLayer(g, d, u, W, H, P) {
        var U = Math.max(W, H), s = (d.s || 0.5) * U, ph = d.ph || 0;
        var pos = cyc(d.at || [[0.5, 0.5]], u, ph);
        var sc = d.sc ? cyc(d.sc, u, ph) / 100 : 1;
        var rot = d.r0 || 0;
        if (typeof d.rot === "number") rot += 360 * d.rot * u;
        else if (d.rot) rot += cyc(d.rot, u, ph);
        var op = d.op === undefined ? 1 : cyc(d.op, u, ph) / 100;
        var white = d.col !== 0, col = white ? "rgb(230,230,230)" : "#000";
        g.save();
        g.globalCompositeOperation = white ? "screen" : "source-over";
        g.globalAlpha = Math.max(0, Math.min(1, op));
        if (d.blur) g.filter = "blur(" + (d.blur * U * 0.3).toFixed(1) + "px)";
        g.translate(pos[0] * W, pos[1] * H);
        g.rotate(rot * Math.PI / 180);
        g.scale(sc, sc);
        g.fillStyle = col; g.strokeStyle = col; g.lineCap = "round";
        var w = (d.w || 0.05) * U * 1.4, i;
        switch (d.t) {
            case "orb":
                var gr = g.createRadialGradient(0, 0, 0, 0, 0, s / 2);
                gr.addColorStop(0, "#fff"); gr.addColorStop(1, "#000");
                g.fillStyle = gr; g.beginPath(); g.arc(0, 0, s / 2, 0, 7); g.fill(); break;
            case "ring":
                g.lineWidth = w; g.beginPath();
                var a1 = d.arc ? Math.PI * 2 * d.arc / 100 : Math.PI * 2;
                g.ellipse(0, 0, s / 2, s / 2 * (d.aspect || 1), 0, -Math.PI / 2, -Math.PI / 2 + a1); g.stroke(); break;
            case "rays": star(g, d.n || 8, s / 2, s / 2 * (d.inner || 0.1)); g.fill(); break;
            case "petal":
                var n = d.n || 6;
                for (i = 0; i < n; i++) { g.save(); g.rotate(i * 2 * Math.PI / n); g.beginPath(); g.ellipse(0, -s * 0.27, s * 0.13, s * 0.25, 0, 0, 7); g.fill(); g.restore(); }
                g.beginPath(); g.arc(0, 0, s * (d.inner || 0.3) * 0.55, 0, 7); g.fill(); break;
            case "tri": g.beginPath(); for (i = 0; i < 3; i++) { var aa = -Math.PI / 2 + i * 2 * Math.PI / 3; g.lineTo(Math.cos(aa) * s / 2, Math.sin(aa) * s / 2); } g.closePath(); g.fill(); break;
            case "beam":
                var bn = d.n || 4;
                for (i = 0; i < bn; i++) { g.save(); g.rotate((i - (bn - 1) / 2) * (d.spread || 15) * Math.PI / 180); g.fillRect(0, -w / 2, s, w); g.restore(); }
                break;
            case "band": g.fillRect(-U * 1.3, -(d.s || 0.15) * H / 2, U * 2.6, (d.s || 0.15) * H); break;
            case "swoosh":
                var hh = s * 0.2 * (d.flip ? -1 : 1);
                g.lineWidth = w; g.beginPath(); g.moveTo(-s / 2, 0); g.bezierCurveTo(-s / 2 + s / 3, -hh, s / 2 - s / 3, hh, s / 2, 0); g.stroke(); break;
            case "pulse":
                var m = d.n || 3;
                g.lineWidth = w;
                for (i = 0; i < m; i++) {
                    var q = ((u - i / m) % 1 + 1) % 1, e = 1 - Math.pow(1 - q, 2);
                    g.globalAlpha = op * (q < 0.15 ? q / 0.15 : 1 - (q - 0.15) / 0.85);
                    g.beginPath(); g.arc(0, 0, Math.max(0.1, s / 2 * e), 0, 7); g.stroke();
                }
                break;
            default:
                g.beginPath(); g.ellipse(0, 0, s / 2, s / 2 * (d.aspect || 1), 0, 0, 7); g.fill();
        }
        g.restore();
    }
    var bufA = document.createElement("canvas"), bufB = document.createElement("canvas");
    /* draw spec at loop phase u (0..1) into canvas cv */
    function draw(cv, spec, u, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1;
        var CW = cv.clientWidth || 96, CH = cv.clientHeight || 54;
        var maxW = o.maxW || 320, W = Math.min(maxW, Math.round(CW * dpr)), H = Math.round(W * CH / CW);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        bufA.width = W; bufA.height = H; bufB.width = W; bufB.height = H;
        var a = bufA.getContext("2d"), b = bufB.getContext("2d");
        a.fillStyle = "#000"; a.fillRect(0, 0, W, H);
        for (var i = 0; i < spec.layers.length; i++) drawLayer(a, spec.layers[i], u, W, H, spec.P || 14);
        var U = Math.max(W, H), soft = (o.softness === undefined ? 100 : o.softness) / 100;
        b.fillStyle = "#000"; b.fillRect(0, 0, W, H);
        b.filter = "blur(" + Math.max(0, (spec.soft || 0.03) * U * 2.5 * soft * 0.3).toFixed(1) + "px)";
        b.drawImage(bufA, 0, 0);
        b.filter = "none";
        var img = b.getImageData(0, 0, W, H), px = img.data, L = lut(o.colors || UK_CAT.cinePal[spec.pal]);
        var gr = (o.grain === undefined ? 16 : o.grain) * 2.2;
        for (var p = 0; p < px.length; p += 4) {
            var l = Math.round(px[p] * 0.299 + px[p + 1] * 0.587 + px[p + 2] * 0.114);
            var nz = gr ? (Math.random() - 0.5) * gr : 0;
            px[p] = Math.max(0, Math.min(255, L[l * 3] + nz));
            px[p + 1] = Math.max(0, Math.min(255, L[l * 3 + 1] + nz));
            px[p + 2] = Math.max(0, Math.min(255, L[l * 3 + 2] + nz));
            px[p + 3] = 255;
        }
        cv.getContext("2d").putImageData(img, 0, 0);
    }
    /* animated preview */
    function Player(cv) { this.cv = cv; this.spec = null; this.o = {}; this.u = 0; this.running = false; }
    Player.prototype.set = function (spec, o) { if (spec) this.spec = spec; if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) {
            if (!self.running) return;
            var dt = Math.min(0.1, (now - last) / 1000); last = now;
            if (self.spec && document.body.contains(self.cv)) {
                self.u = (self.u + dt * (self.o.speed || 100) / 100 / (self.spec.P || 14)) % 1;
                draw(self.cv, self.spec, self.u, self.o);
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player };
})();

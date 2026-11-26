/*  Ultimate Kit - click effect preview (canvas). Same timings as the After Effects build. */
var UKClick = (function () {
    var E = {
        expo: function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); },
        cubic: function (t) { return 1 - Math.pow(1 - t, 3); },
        quad: function (t) { return 1 - (1 - t) * (1 - t); },
        inQ: function (t) { return t * t; },
        sine: function (t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); }
    };
    function cl(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
    function seg(t, a, b) { return cl((t - a) / (b - a)); }
    function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
    function rgba(hex, a) {
        var n = parseInt(hex.replace("#", ""), 16);
        return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    }
    function arrow(g, x, y, s) {
        g.save(); g.translate(x, y); g.scale(s, s);
        g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 23); g.lineTo(6, 17.5); g.lineTo(10.5, 27); g.lineTo(14.5, 25); g.lineTo(10, 16); g.lineTo(18, 16); g.closePath();
        g.fillStyle = "#fff"; g.strokeStyle = "#111"; g.lineWidth = 1.4; g.fill(); g.stroke();
        g.restore();
    }
    /* t = seconds since the press started; t0 = moment the effect starts */
    var FX = {
        burst: function (g, t, c1, c2, S) {
            var u = seg(t, 0, 0.4);
            if (t >= 0 && u < 1) { g.beginPath(); g.arc(0, 0, (16 + (150 - 16) * E.expo(u)) / 2 * S, 0, 7); g.strokeStyle = c1; g.lineWidth = Math.max(0, 12 * (1 - E.quad(u))) * S; g.stroke(); }
            for (var i = 0; i < 10; i++) {
                var dl = (i % 2) * 0.03, k = seg(t, dl, dl + 0.5);
                if (t < dl || k >= 1) continue;
                var ang = (i * 36 + (i % 2) * 9 - 90) * Math.PI / 180, dist = 92 + 26 * ((i * 7) % 3);
                var r = 14 + (dist - 14) * E.expo(k), sc = k < 0.24 ? 1.15 * E.cubic(k / 0.24) : 1.15 - 0.7 * E.sine((k - 0.24) / 0.76);
                var op = 1 - cl((t - dl - 0.26) / 0.26);
                g.save(); g.globalAlpha = op; g.translate(Math.cos(ang) * r * S, Math.sin(ang) * r * S); g.rotate((i % 2 ? -1 : 1) * 2.6 * E.expo(k)); g.scale(sc * S, sc * S);
                var col = i % 2 ? c2 : c1, kind = i % 3;
                if (kind === 0) { g.beginPath(); g.arc(0, 0, 7.5, 0, 7); g.fillStyle = col; g.fill(); }
                else if (kind === 1) { g.strokeStyle = col; g.lineWidth = 3.5; g.strokeRect(-7.5, -7.5, 15, 15); }
                else { g.fillStyle = col; g.fillRect(-5.5, -5.5, 11, 11); }
                g.restore();
            }
        },
        dots: function (g, t, c1, c2, S) {
            var u = seg(t, 0, 0.65);
            if (t < 0 || t > 0.8) return;
            var rad = 150 * E.quad(u) * S, w = (24 + 46 * E.quad(u)) * S, op = 1 - E.inQ(seg(t, 0.18, 0.6));
            for (var y = -13; y <= 13; y++) for (var x = -13; x <= 13; x++) {
                var px = x * 18 * S, py = y * 18 * S, d = Math.sqrt(px * px + py * py);
                var a = cl(1 - Math.abs(d - rad) / (w * 0.75)) * op;
                if (a <= 0.01) continue;
                g.beginPath(); g.arc(px, py, 3.5 * S, 0, 7); g.fillStyle = rgba(c1, a); g.fill();
            }
            var gu = seg(t, 0, 0.5);
            g.beginPath(); g.arc(0, 0, (gu < 0.36 ? 28 * E.cubic(gu / 0.36) : 28 + 12 * (gu - 0.36) / 0.64) * S, 0, 7);
            g.fillStyle = rgba(c2, 0.45 * (1 - seg(t, 0.12, 0.5))); g.fill();
        },
        pixels: function (g, t, c1, c2, S) {
            var r = rng(42), cell = 22;
            for (var gy = -5; gy <= 5; gy++) for (var gx = -5; gx <= 5; gx++) {
                var d = Math.sqrt(gx * gx + gy * gy) * cell;
                if (d < 18 || d > 125 || r() > 0.42) continue;
                var s = 14 + Math.round(r() * 8), col = r() > 0.5 ? c1 : c2;
                var dl = d / 125 * 0.22 + r() * 0.06, life = 0.26 + r() * 0.16;
                var tt = t - dl;
                if (tt < 0 || tt > life) continue;
                var op = tt < 0.05 ? tt / 0.05 : 1 - E.inQ((tt - 0.05) / (life - 0.05));
                var sc = tt < 0.1 ? 0.4 + 0.6 * E.cubic(tt / 0.1) : 1 - 0.3 * (tt - 0.1) / (life - 0.1);
                g.save(); g.globalAlpha = op; g.shadowColor = col; g.shadowBlur = 10 * S;
                g.fillStyle = col; var z = s * sc * S; g.fillRect(gx * cell * S - z / 2, gy * cell * S - z / 2, z, z);
                g.restore();
            }
        },
        particles: function (g, t, c1, c2, S) {
            var r = rng(7);
            for (var i = 0; i < 26; i++) {
                var s = 3 + Math.round(r() * 4), col = r() > 0.45 ? c1 : c2, ang = r() * Math.PI * 2, sp = 110 + r() * 150, dl = r() * 0.05;
                var tt = t - dl;
                if (tt < 0 || tt > 0.75) continue;
                var k = tt / 0.75, e = E.expo(Math.min(1, tt / 0.28));
                var rr = tt < 0.28 ? 8 + (sp * 0.72 - 8) * e : sp * 0.72 + sp * 0.28 * E.sine((tt - 0.28) / 0.47);
                var drop = tt < 0.28 ? -8 * e : -8 + 34 * E.sine((tt - 0.28) / 0.47);
                g.globalAlpha = tt < 0.3 ? 1 : 1 - E.inQ((tt - 0.3) / 0.45);
                g.beginPath(); g.arc(Math.cos(ang) * rr * S, (Math.sin(ang) * rr + drop) * S, s / 2 * (1.3 - 0.9 * k) * S, 0, 7); g.fillStyle = col; g.fill();
                g.globalAlpha = 1;
            }
        },
        spark: function (g, t, c1, c2, S) {
            var u = seg(t, 0, 0.38);
            if (t >= 0 && u < 1) { g.beginPath(); g.arc(0, 0, (20 + 98 * E.expo(u)) / 2 * S, 0, 7); g.strokeStyle = c1; g.lineWidth = 6 * (1 - E.quad(u)) * S; g.stroke(); }
            for (var i = 0; i < 8; i++) {
                var ang = (i * 45 - 90) * Math.PI / 180, c = Math.cos(ang), s = Math.sin(ang);
                var e = E.cubic(seg(t, 0, 0.2)), st = E.inQ(seg(t, 0.08, 0.34));
                if (t < 0 || st >= 1) continue;
                var a = 26 + 38 * st, b = 26 + 38 * e;
                if (b <= a) continue;
                g.beginPath(); g.moveTo(c * a * S, s * a * S); g.lineTo(c * b * S, s * b * S);
                g.strokeStyle = i % 2 ? c2 : c1; g.lineWidth = 5 * S; g.lineCap = "round"; g.stroke();
            }
        },
        simple: function (g, t, c1, c2, S, fd) {
            function circ(col, op0, end, dl) {
                var tt = t - dl;
                if (tt < 0 || tt > 0.45) return;
                var k = tt / 0.45;
                g.beginPath(); g.arc(0, 0, end / 2 * E.quad(k) * S, 0, 7); g.fillStyle = rgba(col, op0 * (1 - E.sine(k))); g.fill();
            }
            circ(c2, 0.45, 165, fd * 3);
            circ(c1, 0.6, 140, 0);
        }
    };

    function Preview(canvas) {
        this.cv = canvas;
        this.g = canvas.getContext("2d");
        this.id = "simple";
        this.press = 0.26;
        this.c1 = "#7C5CFF";
        this.c2 = "#C4B5FD";
        this.size = 1;
        this.running = false;
    }
    Preview.prototype.set = function (o) { for (var k in o) this[k] = o[k]; };
    Preview.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, t0 = performance.now();
        function frame(now) {
            if (!self.running) return;
            self.draw(((now - t0) / 1000) % 2.4);
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    };
    Preview.prototype.stop = function () { this.running = false; };
    Preview.prototype.draw = function (T) {
        var cv = this.cv, g = this.g, dpr = window.devicePixelRatio || 1;
        var W = cv.clientWidth, H = cv.clientHeight;
        if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, W, H);
        var cx = W * 0.5, cy = H * 0.52, S = Math.min(W, H) / 330 * this.size;
        // the button being clicked
        var pressAt = 0.75, pr = this.press, tp = T - pressAt;
        var hover = E.cubic(cl((T - 0.35) / 0.35));
        var bw = Math.min(W * 0.5, 150), bh = 42;
        var dip = (tp >= 0 && tp < pr * 1.3) ? 0.06 * (0.5 - 0.5 * Math.cos(2 * Math.PI * tp / (pr * 1.3))) : 0;
        var bs = (1 + 0.06 * hover) * (1 - dip);
        g.save(); g.translate(cx, cy); g.scale(bs, bs);
        g.fillStyle = hover > 0.01 ? rgba(this.c1, 0.18 + 0.2 * hover) : "rgba(255,255,255,0.08)";
        g.strokeStyle = rgba(this.c1, 0.25 + 0.5 * hover); g.lineWidth = 1.2;
        roundRect(g, -bw / 2, -bh / 2, bw, bh, 12); g.fill(); g.stroke();
        g.fillStyle = "rgba(255,255,255,0.85)"; g.font = "600 12px Inter, Segoe UI, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText("Get started", 0, 1);
        g.restore();
        // the effect
        var t0 = pr * 0.38;
        g.save(); g.translate(cx + 6, cy + 4);
        if (tp >= t0) FX[this.id](g, tp - t0, this.c1, this.c2, S, 1 / 30);
        g.restore();
        // the cursor, gliding in then pressing
        var mv = E.cubic(cl(T / 0.6));
        var x = cx - W * 0.32 + (W * 0.32 + 6) * mv, y = cy + H * 0.3 - (H * 0.3 - 4) * mv;
        var sc = 1;
        if (tp >= 0) {
            if (tp < pr * 0.45) sc = 1 - 0.16 * E.cubic(tp / (pr * 0.45));
            else if (tp < pr) sc = 0.84 + 0.19 * E.quad((tp - pr * 0.45) / (pr * 0.55));
            else if (tp < pr * 1.4) sc = 1.03 - 0.03 * E.sine((tp - pr) / (pr * 0.4));
        }
        arrow(g, x, y, sc);
    };
    function roundRect(g, x, y, w, h, r) {
        g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    }
    return { Preview: Preview };
})();

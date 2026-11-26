/*  Ultimate Kit - gradient background preview (canvas). Mirrors jsx/gradientbg.jsx:
    circles wiggling (60-80 px at 1920), rotating around the centre 10 deg/s, blurred, grain. */
var UKGrad = (function () {
    /* smooth pseudo-wiggle: sum of sines with per-circle phases */
    function wig(t, f, a, seed) {
        var x = Math.sin(t * f * 2.1 + seed) * 0.55 + Math.sin(t * f * 3.7 + seed * 1.7) * 0.3 + Math.sin(t * f * 5.3 + seed * 2.3) * 0.15;
        var y = Math.sin(t * f * 2.4 + seed * 3.1) * 0.55 + Math.sin(t * f * 3.3 + seed * 0.7) * 0.3 + Math.sin(t * f * 5.9 + seed * 1.3) * 0.15;
        return [x * a, y * a];
    }
    var buf = document.createElement("canvas");
    function draw(cv, spec, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, CW = cv.clientWidth || 96, CH = cv.clientHeight || 54;
        var W = Math.min(o.maxW || 320, Math.round(CW * dpr)), H = Math.round(W * CH / CW);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        buf.width = W; buf.height = H;
        var g = buf.getContext("2d"), k = W / 1920;
        var bg = o.bg || spec.bg, cols = o.colors || spec.colors;
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        var L = UK_CAT.gradLayout(spec), rot = t * 10 * Math.PI / 180, cx = W / 2, cy = H / 2;
        for (var i = 0; i < L.length; i++) {
            var c = L[i], w = wig(t, c.f, c.a * k, i * 2.17 + 1);
            var px = c.x * W + w[0] - cx, py = c.y * H + w[1] - cy;
            var x = cx + px * Math.cos(rot) - py * Math.sin(rot), y = cy + px * Math.sin(rot) + py * Math.cos(rot);
            g.fillStyle = cols[c.c];
            g.beginPath(); g.arc(x, y, c.s * W / 2, 0, 7); g.fill();
        }
        var out = cv.getContext("2d");
        out.fillStyle = bg; out.fillRect(0, 0, W, H);
        out.filter = "blur(" + (150 * k * 0.75).toFixed(1) + "px)";
        out.drawImage(buf, 0, 0);
        out.filter = "none";
        var gr = (o.grain === undefined ? 6 : o.grain) * 2.2;
        if (gr > 0) {
            var img = out.getImageData(0, 0, W, H), p = img.data;
            for (var q = 0; q < p.length; q += 4) {
                var n = (Math.random() - 0.5) * gr;
                p[q] = Math.max(0, Math.min(255, p[q] + n)); p[q + 1] = Math.max(0, Math.min(255, p[q + 1] + n)); p[q + 2] = Math.max(0, Math.min(255, p[q + 2] + n));
            }
            out.putImageData(img, 0, 0);
        }
    }
    function Player(cv) { this.cv = cv; this.spec = null; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (spec, o) { if (spec) this.spec = spec; if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) {
            if (!self.running) return;
            self.t += Math.min(0.1, (now - last) / 1000); last = now;
            if (self.spec && document.body.contains(self.cv)) draw(self.cv, self.spec, self.t, self.o);
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player };
})();

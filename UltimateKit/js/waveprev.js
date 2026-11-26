/*  Ultimate Kit - Flag Wave preview (canvas): a picture (three bands and a disc) waving like the AE build
    (jsx/wave.jsx): ripples running from the left (Wave World, a Ring producer left of the picture), moving it
    (Displacement Map: Strength px) and shading it (the waves in Hard Light). o: UK_WAVE.DEF + maxW */
var UKWavePrev = (function () {
    var pic = null;
    function picture() {
        if (pic) return pic;
        pic = document.createElement("canvas"); pic.width = 600; pic.height = 400;
        var g = pic.getContext("2d"), cols = ["#F08A24", "#F7F2E8", "#1E8C46"];
        for (var i = 0; i < 3; i++) { g.fillStyle = cols[i]; g.fillRect(0, i * 400 / 3, 600, 400 / 3 + 1); }
        g.strokeStyle = "#233A7A"; g.lineWidth = 5; g.beginPath(); g.arc(300, 200, 48, 0, Math.PI * 2); g.stroke();
        for (var k = 0; k < 24; k++) { var a = k * Math.PI / 12; g.beginPath(); g.moveTo(300, 200); g.lineTo(300 + Math.cos(a) * 46, 200 + Math.sin(a) * 46); g.lineWidth = 1.5; g.stroke(); }
        return pic;
    }
    /* the wave height at x, y of the picture (0..1 each) at time t: rings from the producer, travelling */
    function height(u, v, t, o) {
        var px = -0.24, py = 0.14, ang = (o.angle || 0) * Math.PI / 180;
        var dx = (u - px) * 1.5, dy = v - py, d = Math.sqrt(dx * dx + dy * dy) + (dx * Math.sin(ang) - dy * Math.cos(ang)) * 0.15;
        var k = 9 / Math.max(0.2, (o.len || 0.7) + 0.3), w = 4.5 * (o.speed || 0.5) * 2 * (0.6 + (o.freq || 0.4));
        return Math.sin(d * k - t * w) * (o.amp === undefined ? 0.9 : o.amp) * (0.55 + 0.45 * Math.sin(d * k * 0.37 - t * w * 0.5 + 1.3));
    }
    function draw(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(cw * dpr)), H = Math.round(W * ch / cw);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var g = cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
        g.fillStyle = "#0B0B10"; g.fillRect(0, 0, W, H);
        var im = picture(), fw = Math.min(W * 0.72, H * 0.72 * 1.5), fh = fw / 1.5, x0 = (W - fw) / 2, y0 = (H - fh) / 2;
        var sk = fw / 1200, amp = (o.strength === undefined ? 25 : o.strength) * sk * 1.6, n = Math.max(24, Math.round(fw / 3)), sw = fw / n;
        for (var i = 0; i < n; i++) {          // vertical strips, each moved by the waves and shaded by their slope
            var u = (i + 0.5) / n, hv = height(u, 0.5, t, o), hv2 = height(u + 1 / n, 0.5, t, o), dy = hv * amp, slope = (hv2 - hv) * n * 0.08;
            g.drawImage(im, i / n * im.width, 0, im.width / n + 1, im.height, x0 + i * sw + hv * amp * 0.3, y0 + dy, sw + 1, fh);
            var sh = Math.max(-0.45, Math.min(0.45, slope * 2.2 + hv * 0.12));
            g.fillStyle = sh > 0 ? "rgba(255,255,255," + (sh * 0.55).toFixed(3) + ")" : "rgba(0,0,0," + (-sh * 0.7).toFixed(3) + ")";
            g.fillRect(x0 + i * sw + hv * amp * 0.3, y0 + dy, sw + 1, fh);
        }
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

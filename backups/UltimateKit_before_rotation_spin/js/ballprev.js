/*  Ultimate Kit - Ball preview (canvas), drawn from the same looks as the AE layers (shared/balls.js, jsx/ball.jsx):
    the glow, the ball with its radial ramp, each feathered mask layer with its blend mode clipped to the ball, the
    light sweep (Add, moving like the AE expression) and the Lens ring. An AE mask feather F is close to a gaussian
    blur with sigma F / 3.                                                                                      */
var UKBallPrev = (function () {
    var MODES = { normal: "source-over", screen: "screen", multiply: "multiply", add: "lighter", overlay: "overlay" };
    var bufs = {};
    function buf(k, n) { var b = bufs[k]; if (!b) b = bufs[k] = document.createElement("canvas"); if (b.width !== n || b.height !== n) { b.width = n; b.height = n; } return b; }
    function reset(g, n) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.filter = "none"; g.clearRect(0, 0, n, n); }
    function ellipse(g, e, k, c, grow) { g.beginPath(); g.ellipse(c + e[0] * k, c + e[1] * k, Math.max(0.1, e[2] * k + (grow || 0)), Math.max(0.1, e[3] * k + (grow || 0)), 0, 0, Math.PI * 2); }
    function blurred(src, n, sigma) {
        var E = buf("e", n), g = E.getContext("2d");
        reset(g, n);
        g.filter = sigma > 0.3 ? "blur(" + sigma.toFixed(2) + "px)" : "none";
        g.drawImage(src, 0, 0); g.filter = "none";
        return E;
    }
    function turn(g, d, k, c) { if (d.rot) { g.translate(c + d.e[0] * k, c + d.e[1] * k); g.rotate(d.rot * Math.PI / 180); g.translate(-(c + d.e[0] * k), -(c + d.e[1] * k)); } }
    /* one mask layer (Add mask e, Subtract mask cut, each feathered), unclipped */
    function layer(d, col, n, k, c) {
        var T = buf("t", n), q = T.getContext("2d"), f = d.f || 0, cf = d.cf === undefined ? f : d.cf;
        reset(q, n); turn(q, d, k, c);
        q.fillStyle = col; ellipse(q, d.e, k, c); q.fill();
        var E = blurred(T, n, f * k / 3);
        if (d.cut) {
            var U = buf("u", n), u = U.getContext("2d");
            reset(u, n); turn(u, d, k, c);
            u.filter = cf * k / 3 > 0.3 ? "blur(" + (cf * k / 3).toFixed(2) + "px)" : "none";
            u.fillStyle = "#000"; ellipse(u, d.cut, k, c); u.fill(); u.filter = "none";
            var g = E.getContext("2d"); g.globalCompositeOperation = "destination-out"; g.drawImage(U, 0, 0); g.globalCompositeOperation = "source-over";
        }
        return E;
    }
    function clip(E, c, k) { var g = E.getContext("2d"); g.globalCompositeOperation = "destination-in"; g.fillStyle = "#fff"; g.beginPath(); g.arc(c, c, k, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = "source-over"; }
    function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
    /* the ball (transparent around it) into buffer "b"; k = radius in px; F = glow / sweep settings; t = time */
    function ball(spec, cols, k, F, t) {
        var n = Math.ceil(k * 4), c = n / 2, B = buf("b", n), x = B.getContext("2d"), i, d, E, L = spec.layers, b = spec.base;
        var col = function (r) { return UK_BALL.color(spec, r, cols); };
        reset(x, n);
        /* Glow: the circle expanded by 0.3 size, feathered 1.2 size */
        if (F.glow) {
            var s = F.glowSize / 100 * k, T = buf("t", n), q = T.getContext("2d");
            reset(q, n); q.fillStyle = col("Glow"); ellipse(q, [0, 0, 1, 1], k, c, s * 0.3); q.fill();
            E = blurred(T, n, s * 1.2 / 3);
            x.globalAlpha = F.glowInt / 100; x.drawImage(E, 0, 0); x.globalAlpha = 1;
        }
        for (i = L.length - 1; i >= 0; i--) {
            d = L[i]; if (!d.out) continue;
            E = layer(d, col(d.c), n, k, c);
            x.globalAlpha = (d.o === undefined ? 100 : d.o) / 100; x.globalCompositeOperation = MODES[d.mode || "normal"]; x.drawImage(E, 0, 0);
        }
        x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
        /* the ball and its clipped layers on their own buffer */
        var I = buf("i", n), y = I.getContext("2d");
        reset(y, n);
        if (b) {
            var gr = y.createRadialGradient(c + b.s[0] * k, c + b.s[1] * k, 0, c + b.s[0] * k, c + b.s[1] * k, b.r * k);
            gr.addColorStop(0, col(b.c1)); gr.addColorStop(1, col(b.c2));
            y.globalAlpha = b.o === undefined ? 1 : b.o / 100;
            y.fillStyle = gr; y.beginPath(); y.arc(c, c, k, 0, Math.PI * 2); y.fill();
        }
        for (i = L.length - 1; i >= 0; i--) {
            d = L[i]; if (d.out) continue;
            E = layer(d, col(d.c), n, k, c); clip(E, c, k);
            y.globalAlpha = (d.o === undefined ? 100 : d.o) / 100; y.globalCompositeOperation = MODES[d.mode || "normal"]; y.drawImage(E, 0, 0);
        }
        /* Light Sweep: band 0.05 wide, 1.8 tall, rotated by the angle, feathered by the width, moved along the angle */
        if (F.sweep) {
            var p = 0.38;
            if (F.sweepTime > 0) { var cyc = F.sweepTime + Math.max(0, F.sweepPause); p = sm((t % cyc) / F.sweepTime); }
            var a = F.sweepAngle * Math.PI / 180, o = (-1.75 + 3.5 * p) * k, W2 = buf("t", n), w = W2.getContext("2d");
            reset(w, n);
            w.translate(c + o * Math.cos(a), c + o * Math.sin(a)); w.rotate(a);
            w.fillStyle = F.sweepColor || "#FFFFFF"; w.beginPath(); w.ellipse(0, 0, 0.05 * k, 1.8 * k, 0, 0, Math.PI * 2); w.fill();
            E = blurred(W2, n, F.sweepWidth / 100 * k / 3); clip(E, c, k);
            y.globalAlpha = F.sweepInt / 100; y.globalCompositeOperation = "lighter"; y.drawImage(E, 0, 0);
        }
        y.globalAlpha = 1; y.globalCompositeOperation = "destination-in"; y.beginPath(); y.arc(c, c, k, 0, Math.PI * 2); y.fill();
        y.globalCompositeOperation = "source-over";
        x.drawImage(I, 0, 0);
        if (spec.ring) {
            x.strokeStyle = col(spec.ring.c); x.lineWidth = Math.max(0.5, F.stroke * k / 400);
            x.beginPath(); x.arc(c, c, k, 0, Math.PI * 2); x.stroke();
        }
        return B;
    }
    function settings(spec, o) {
        var F = {}, key;
        for (key in UK_BALL.FX) F[key] = UK_BALL.FX[key];
        if (spec.fx) for (key in spec.fx) F[key] = spec.fx[key];
        if (o.fx) for (key in o.fx) if (o.fx[key] !== undefined && o.fx[key] !== null) F[key] = o.fx[key];
        return F;
    }
    /* o: { colors, size (% of the height), fx, maxW } */
    function draw(cv, spec, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(cw * dpr)), H = Math.round(W * ch / cw);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var x = cv.getContext("2d");
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
        var bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#1d1f27"); bg.addColorStop(1, "#0d0e12");
        x.fillStyle = bg; x.fillRect(0, 0, W, H);
        var k = Math.max(4, (o.size || 50) / 100 * H / 2), B = ball(spec, o.colors, k, settings(spec, o), t || 0);
        x.drawImage(B, W / 2 - B.width / 2, H / 2 - B.height / 2);
    }
    function Player(cv) { this.cv = cv; this.spec = null; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (spec, o) { if (spec) this.spec = spec; if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.restart = function () { this.t = 0; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) { if (!self.running) return; self.t += Math.min(0.1, (now - last) / 1000); last = now; if (self.spec && document.body.contains(self.cv)) draw(self.cv, self.spec, self.t, self.o); requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player, settings: settings };
})();

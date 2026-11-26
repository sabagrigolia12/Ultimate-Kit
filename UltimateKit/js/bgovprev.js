/*  Ultimate Kit - BG Overlay preview (canvas): a talking-head stand-in (a warm room, a dark speaker in front) and,
    between them, the look's elements drawn from the same data and keyframes as AE builds (shared/bgov.js), with the
    sample text on top. A 1080 x 1920 frame.  o: { id, dur, accent, line, amount, text, thumb, maxW }       */
var UKBgovPrev = (function () {
    var room = null, gray = null;
    function scene() {                  // the room behind the speaker (drawn once at 540 x 960)
        if (room) return;
        room = document.createElement("canvas"); room.width = 540; room.height = 960;
        var g = room.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 960);
        gr.addColorStop(0, "#5A3420"); gr.addColorStop(0.6, "#3B2215"); gr.addColorStop(1, "#160D08"); g.fillStyle = gr; g.fillRect(0, 0, 540, 960);
        g.filter = "blur(6px)";
        g.fillStyle = "#1C2E3A"; g.fillRect(60, 120, 150, 170); g.fillRect(60, 330, 150, 170);
        g.fillStyle = "#0E0907"; g.fillRect(230, 0, 14, 620); g.fillRect(0, 300, 540, 12);
        g.fillStyle = "#2E4A23"; g.beginPath(); g.ellipse(450, 420, 110, 200, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#C8873F"; g.globalAlpha = 0.35; g.beginPath(); g.ellipse(360, 140, 90, 90, 0, 0, Math.PI * 2); g.fill();
        g.filter = "none"; g.globalAlpha = 1;
        gray = document.createElement("canvas"); gray.width = 540; gray.height = 960;
        var q = gray.getContext("2d"); q.filter = "grayscale(1) brightness(0.8)"; q.drawImage(room, 0, 0); q.filter = "none";
    }
    function speaker(g, k, ox, oy) {    // the cut-out speaker in front
        g.save(); g.translate(ox, oy); g.scale(k, k);
        g.fillStyle = "#17191D";
        g.beginPath(); g.ellipse(540, 760, 150, 190, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(170, 1920); g.bezierCurveTo(170, 1180, 300, 1000, 540, 990); g.bezierCurveTo(780, 1000, 910, 1180, 910, 1920); g.closePath(); g.fill();
        g.restore();
    }
    function col(c, o) { return c === "A" ? o.accent : c === "L" ? o.line : c === "K" ? "#000000" : c; }
    function v(K, t, def) { return K ? UK_BGOV.val(K, t) : def; }
    function shapePath(g, e) {
        g.beginPath();
        if (e.k === "rect") { var rr = Math.min(e.r || 0, e.w / 2, e.h / 2); if (rr > 0 && g.roundRect) g.roundRect(-e.w / 2, -e.h / 2, e.w, e.h, rr); else g.rect(-e.w / 2, -e.h / 2, e.w, e.h); return 2 * (e.w + e.h); }
        if (e.k === "ellipse") { g.ellipse(0, 0, e.w / 2, e.h / 2, 0, -Math.PI / 2, Math.PI * 1.5); return Math.PI * (e.w + e.h) / 2; }
        var L = 0, i;
        g.moveTo(e.pts[0][0], e.pts[0][1]);
        for (i = 1; i < e.pts.length; i++) { g.lineTo(e.pts[i][0], e.pts[i][1]); L += Math.sqrt(Math.pow(e.pts[i][0] - e.pts[i - 1][0], 2) + Math.pow(e.pts[i][1] - e.pts[i - 1][1], 2)); }
        if (e.closed) { g.lineTo(e.pts[0][0], e.pts[0][1]); L += Math.sqrt(Math.pow(e.pts[0][0] - e.pts[i - 1][0], 2) + Math.pow(e.pts[0][1] - e.pts[i - 1][1], 2)); }
        return L;
    }
    function draw(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(cw * dpr)), Hc = Math.round(Wc * ch / cw);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var g = cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.filter = "none";
        g.fillStyle = "#0B0B10"; g.fillRect(0, 0, Wc, Hc);
        scene();
        var W = 1080, H = 1920, k = Math.min(Wc / W, Hc / H), ox = (Wc - W * k) / 2, oy = (Hc - H * k) / 2;
        var c = { dur: o.dur || 5, accent: o.accent || "#E3141B", line: o.line || "#FFFFFF", amount: o.amount === undefined ? 100 : o.amount };
        var spec = UK_BGOV.build(o.id, W, H, c), tt = o.thumb ? Math.min(c.dur * 0.45, 2.2) : t % (c.dur + 0.6), am = c.amount / 100, i, q;
        g.save(); g.beginPath(); g.rect(ox, oy, W * k, H * k); g.clip();
        g.drawImage(room, ox, oy, W * k, H * k);
        var BM = { screen: "screen", add: "lighter", multiply: "multiply", overlay: "overlay" };
        for (i = 0; i < spec.els.length; i++) {
            var e = spec.els[i], K = e.K || {}, op = v(K.o, tt, e.o === undefined ? 100 : e.o) / 100 * am;
            if (op <= 0.002) continue;
            if (e.k === "tone") { g.globalAlpha = op; g.drawImage(gray, ox, oy, W * k, H * k); g.globalAlpha = 1; continue; }
            var p = v(K.p, tt, e.p || [0, 0]), s = v(K.s, tt, [100, 100]), r = v(K.r, tt, 0), a = e.a || [0, 0];
            var te = v(K.te, tt, 100), ts = v(K.ts, tt, 0);
            if ((K.te || K.ts) && te - ts <= 0.05) continue;
            g.save();
            g.globalCompositeOperation = BM[e.blend] || "source-over";
            if (e.blur) g.filter = "blur(" + Math.max(0.5, e.blur * k).toFixed(1) + "px)";
            g.translate(ox + p[0] * k, oy + p[1] * k); g.rotate(r * Math.PI / 180); g.scale(s[0] / 100 * k, s[1] / 100 * k); g.translate(-a[0], -a[1]);
            var n = e.rep ? e.rep.n : 1;
            for (q = 0; q < n; q++) {
                g.save(); if (q) g.translate(e.rep.dx * q, e.rep.dy * q);
                var L = shapePath(g, e);
                if (e.fill) { g.globalAlpha = op * (e.fo === undefined ? 1 : e.fo / 100); g.fillStyle = col(e.fill, c); g.fill(); }
                if (e.stroke) {
                    g.globalAlpha = op; g.strokeStyle = col(e.stroke, c); g.lineWidth = Math.max(0.7 / (k * Math.max(0.01, s[0] / 100)), e.sw || 2);
                    if (K.te || K.ts) { g.setLineDash([L * (te - ts) / 100, L * 2]); g.lineDashOffset = -L * ts / 100; }
                    g.stroke(); g.setLineDash([]);
                }
                g.restore();
            }
            g.restore();
        }
        g.globalCompositeOperation = "source-over"; g.filter = "none"; g.globalAlpha = 1;
        speaker(g, k, ox, oy);
        /* the sample text (3D words through the default camera) */
        if (o.text !== false && spec.T) {
            var words = UK_BGOV.textKeys(spec.T, W, H, c), Zc = W / 2 / Math.tan(19.8 * Math.PI / 180);
            for (i = 0; i < words.length; i++) {
                var w = words[i], P = UK_BGOV.val(w.K.p, tt), O = UK_BGOV.val(w.K.o, tt) / 100, S = w.K.s ? UK_BGOV.val(w.K.s, tt)[0] / 100 : 1;
                if (O <= 0.01) continue;
                var z = w.K.z ? UK_BGOV.val(w.K.z, tt) : 0, f = Zc / (Zc + z), X = W / 2 + (P[0] - W / 2) * f, Y = H / 2 + (P[1] - H / 2) * f;
                g.save(); g.globalAlpha = O;
                g.font = "800 " + Math.round(w.size * f * S * k) + "px system-ui, 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
                if (w.shadow) { g.shadowColor = "rgba(0,0,0,0.55)"; g.shadowBlur = w.size * 0.25 * k; g.shadowOffsetX = w.size * 0.07 * k; g.shadowOffsetY = w.size * 0.07 * k; }
                g.fillStyle = "#FFFFFF"; g.fillText(w.word, ox + X * k, oy + Y * k);
                g.restore();
            }
        }
        g.restore();
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

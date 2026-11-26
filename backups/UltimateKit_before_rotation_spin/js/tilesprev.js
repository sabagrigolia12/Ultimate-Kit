/*  Ultimate Kit - "Number Tiles" card preview (canvas), the same layout, look and timing as jsx/tiles.jsx
    (shared/tiles.js): violet diamonds with a soft hot spot, a darker rim and a glow, numbered 1..n; each scales up
    from its own centre a few frames after the previous one.                                                   */
var UKTilesPrev = (function () {
    function hex(h) { var n = parseInt(String(h).replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
    function mix(a, b, k) { return [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)]; }
    function diamond(x, r, rc) {          // a square on its corner, half-diagonal r, round corners rc
        var p = [[0, -r], [r, 0], [0, r], [-r, 0]], i;
        x.beginPath();
        x.moveTo((p[3][0] + p[0][0]) / 2, (p[3][1] + p[0][1]) / 2);
        for (i = 0; i < 4; i++) { var a = p[i], b = p[(i + 1) % 4]; x.arcTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, rc); }
        x.closePath();
    }
    /* o: { tiles: {count, perRow, size, gap, corner, tile, hot, glow, number, glowAmt, delay}, inDur, hold, outDur, thumb, maxW } */
    function draw(cv, p, t, o) {
        o = o || {};
        var s = {}, k, D = UK_TILES.DEF;
        for (k in D) s[k] = D[k];
        if (o.tiles) for (k in o.tiles) if (o.tiles[k] !== undefined && o.tiles[k] !== null) s[k] = o.tiles[k];
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(cw * dpr)), H = Math.round(W * ch / cw);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var x = cv.getContext("2d");
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.shadowBlur = 0;
        x.fillStyle = "#0B0B0D"; x.fillRect(0, 0, W, H);
        var n = Math.max(1, Math.round(s.count)), per = UK_TILES.per(n, s.perRow);
        var T = UK_TILES.times(n, s.delay, 30, o.inDur || 0.9, o.hold === undefined ? 1.2 : o.hold, o.outDur || 0.8);
        var tt = o.thumb ? 99 : t % (T.end + 0.5);
        /* fit the group into the frame (the frame is 1080 high) */
        var u = H / 1080, size = s.size, gap = s.gap, S = size + gap * 1.41421, rows = Math.ceil(n / per);
        var gw = (Math.min(per, n) - 1) * S + (rows > 1 ? S / 2 : 0) + size * 1.5, gh = (rows - 1) * S / 2 + size * 1.5;
        var fit = Math.min(1, W * 0.94 / (gw * u), H * 0.94 / (gh * u));
        u *= fit;
        var cT = hex(s.tile), cH = hex(s.hot), cG = hex(s.glow), cRim = [Math.round(cT[0] * 0.42), Math.round(cT[1] * 0.42), Math.round(cT[2] * 0.5)];
        var r = size / 2 * u, rc = Math.min(r * 0.5, s.corner * u * 0.7071), Hh = UK_TILES.HOT;
        x.font = "800 " + Math.round(size * UK_TILES.FS * u) + "px 'Arial Rounded MT Bold', 'Nunito', 'Montserrat', 'Arial Black', Arial, sans-serif";
        x.textAlign = "center"; x.textBaseline = "middle";
        for (var i = 0; i < n; i++) {
            var sc = o.thumb ? 1 : UK_TILES.scale(tt, i, T.tIn, T.tOut, T.dl, T.tt, T.to);
            if (sc <= 0.001) continue;
            var ps = UK_TILES.pos(i, n, per, size, gap);
            x.save();
            x.translate(W / 2 + ps[0] * u, H / 2 + ps[1] * u); x.scale(sc, sc);
            /* glow */
            x.shadowColor = rgba(cG, Math.min(1, s.glowAmt / 100 * 0.9)); x.shadowBlur = size * 0.5 * u * fit;
            diamond(x, r, rc); x.fillStyle = rgba(cT, 1); x.fill();
            x.shadowBlur = size * 0.14 * u; x.shadowColor = rgba(cG, Math.min(1, s.glowAmt / 100)); x.fill();
            x.shadowBlur = 0;
            /* gradient: rim -> tile colour -> hot spot */
            diamond(x, r, rc); x.save(); x.clip();
            var g = x.createRadialGradient(Hh.x * size * u, Hh.y * size * u, 0, 0, 0, r * 1.05);
            g.addColorStop(0, rgba(cH, 1)); g.addColorStop(0.32, rgba(mix(cH, cT, 0.55), 1)); g.addColorStop(0.62, rgba(cT, 1)); g.addColorStop(0.9, rgba(mix(cT, cRim, 0.5), 1)); g.addColorStop(1, rgba(cRim, 1));
            x.fillStyle = g; x.fillRect(-r, -r, r * 2, r * 2);
            x.restore();
            /* number */
            x.fillStyle = s.number; x.fillText(String(i + 1), 0, size * 0.02 * u);
            x.restore();
        }
    }
    function Player(cv) { this.cv = cv; this.p = null; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (p, o) { if (p) this.p = p; if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.restart = function () { this.t = 0; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) { if (!self.running) return; self.t += Math.min(0.1, (now - last) / 1000); last = now; if (self.p && document.body.contains(self.cv)) draw(self.cv, self.p, self.t, self.o); requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player };
})();

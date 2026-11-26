/*  Ultimate Kit - SaaS BG preview: frames rendered by After Effects from the original comps (60 frames, every
    2nd frame of the first 4 s, 480 x 270) in one sprite sheet per background, assets/saasbg/<id>.jpg (6 x 10).
    Played in real time (15 fps), back and forth so the loop has no jump.                                   */
var UKSaasPrev = (function () {
    var FW = 480, FH = 270, COLS = 6, N = 60, FPS = 15, sheets = {};
    function sheet(id, onload) {
        var s = sheets[id];
        if (!s) { s = sheets[id] = new Image(); s.waiting = []; s.onload = function () { var w = s.waiting; s.waiting = []; w.forEach(function (f) { f(); }); }; s.src = "assets/saasbg/" + id + ".jpg"; }
        if (!s.complete && onload) s.waiting.push(onload);
        return s;
    }
    /* o: { maxW, thumb } */
    function draw(cv, id, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(cw * dpr)), H = Math.round(W * ch / cw);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var x = cv.getContext("2d");
        x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
        var s = sheet(id, function () { draw(cv, id, t, o); });
        if (!s.complete || !s.naturalWidth) return;
        var k = Math.floor((o.thumb ? 0 : t) * FPS) % (2 * N - 2);
        if (k >= N) k = 2 * N - 2 - k;
        // the comp is 16:9: cover the canvas
        var sc = Math.max(W / FW, H / FH), dw = FW * sc, dh = FH * sc;
        x.imageSmoothingQuality = "high";
        x.drawImage(s, (k % COLS) * FW, Math.floor(k / COLS) * FH, FW, FH, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
    function Player(cv) { this.cv = cv; this.id = null; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (id, o) { if (id) this.id = id; if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.restart = function () { this.t = 0; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) { if (!self.running) return; self.t += Math.min(0.1, (now - last) / 1000); last = now; if (self.id && document.body.contains(self.cv)) draw(self.cv, self.id, self.t, self.o); requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player };
})();

/*  Ultimate Kit - Transition previews (canvas). Plays the very same scene as After Effects
    (shared/transitions.js): the same shapes, keyframes and bezier eases. Clip A (before the cut)
    and clip B (after it) are drawn as two simple stand-in pictures.                             */
var UKTRPrev = (function () {
    var cl = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var cache = {};
    function bez(a, b) {
        var x1 = a / 100, x2 = 1 - b / 100;
        return function (x) {
            if (x <= 0 || x >= 1) return cl(x, 0, 1);
            var lo = 0, hi = 1, s = x, i;
            for (i = 0; i < 30; i++) { s = (lo + hi) / 2; var u = 1 - s, bx = 3 * u * u * s * x1 + 3 * u * s * s * x2 + s * s * s; if (bx < x) lo = s; else hi = s; }
            return 3 * (1 - s) * s * s + s * s * s;
        };
    }
    function ease(name) { var e = UK_TR.EASE[name]; if (!e) return function (x) { return x; }; var k = e[0] + "_" + e[1]; return cache[k] || (cache[k] = bez(e[0], e[1])); }
    function lerp(a, b, f) {
        if (typeof a === "number") return a + (b - a) * f;
        var o = [], i;
        for (i = 0; i < a.length; i++) o.push(lerp(a[i], b[i], f));
        return o;
    }
    /* value of a channel { k, e } at time t */
    function val(chn, t) {
        var k = chn.k, n = k.length, i;
        if (t <= k[0][0]) return k[0][1];
        if (t >= k[n - 1][0]) return k[n - 1][1];
        for (i = 0; i < n - 1; i++) if (t < k[i + 1][0]) break;
        var f = (t - k[i][0]) / Math.max(1e-6, k[i + 1][0] - k[i][0]);
        return lerp(k[i][1], k[i + 1][1], ease(chn.e[i])(f));
    }
    function xf(g, a, p, s, r) {
        g.translate(a[0] + (p ? p[0] : 0), a[1] + (p ? p[1] : 0));
        if (r) g.rotate(r * Math.PI / 180);
        if (s) g.scale(s[0] / 100, s[1] / 100);
        g.translate(-a[0], -a[1]);
    }
    function addShape(g, s, t) {
        if (s.ell) { g.moveTo(s.ell[0] + s.ell[2], s.ell[1]); g.ellipse(s.ell[0], s.ell[1], Math.max(0, s.ell[2]), Math.max(0, s.ell[3]), 0, 0, Math.PI * 2); return; }
        var p = s.k ? val({ k: s.k, e: s.e }, t) : s.pts, i;
        g.moveTo(p[0][0], p[0][1]);
        for (i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]);
        g.closePath();
    }
    /* the scene's shapes at time t, drawn in comp pixels (cols: c1 / c2 / c3) */
    function drawScene(g, sc, t, cols) {
        for (var i = sc.els.length - 1; i >= 0; i--) {
            var el = sc.els[i], tin = el.tIn === undefined ? 0 : el.tIn, tout = el.tOut === undefined ? sc.d : el.tOut;
            if (t < tin || t >= tout) continue;
            g.save();
            xf(g, el.a, el.p ? val(el.p, t) : null, el.s ? val(el.s, t) : null, el.r ? val(el.r, t) : el.r0);
            g.beginPath();
            for (var j = 0; j < el.shapes.length; j++) {
                var s = el.shapes[j];
                if (s.g) {
                    g.save();
                    var ga = s.g.a || [0, 0], sv = s.g.s ? val(s.g.s, t) : null;
                    if (sv && (Math.abs(sv[0]) < 0.01 || Math.abs(sv[1]) < 0.01)) { g.restore(); continue; }
                    xf(g, ga, s.g.p ? val(s.g.p, t) : null, sv, s.g.r ? val(s.g.r, t) : 0);
                    addShape(g, s, t);
                    g.restore();
                } else addShape(g, s, t);
            }
            g.fillStyle = cols[el.col] || "#fff";
            g.fill(el.eo ? "evenodd" : "nonzero");
            g.restore();
        }
    }
    /* stand-in clips: A before the cut, B after it */
    function clip(g, W, H, b) {
        var gr = g.createLinearGradient(0, 0, W, H);
        gr.addColorStop(0, b ? "#1d3557" : "#3a2a4d"); gr.addColorStop(1, b ? "#2a9d8f" : "#7c5cff");
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.fillStyle = "rgba(255,255,255,0.85)"; g.font = "700 " + Math.round(H * 0.32) + "px Inter, 'Segoe UI', sans-serif";
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(b ? "B" : "A", W / 2, H / 2);
    }
    var scenes = {};
    function sceneOf(id, W, H, d) { var k = id + "_" + W + "_" + H + "_" + d; if (!scenes[k]) scenes[k] = UK_TR.build(id, W, H, d); return scenes[k]; }
    function draw(cv, spec, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, CW = cv.clientWidth || 160, CH = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(CW * dpr)), H = Math.round(W * CH / CW);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var g = cv.getContext("2d");
        g.setTransform(1, 0, 0, 1, 0, 0);
        // the scene is laid out in a 1920-wide frame and scaled, so sizes match After Effects
        var FW = 1920, FH = Math.round(1920 * H / W), d = o.dur || 1.2, sc = sceneOf(spec.id, FW, FH, d), pad = 0.35;
        var tt = o.thumb ? sc.th * d : ((o.still !== undefined) ? o.still : (t % (d + 2 * pad)) - pad);
        clip(g, W, H, tt >= sc.cut);
        g.save();
        g.scale(W / FW, H / FH);
        drawScene(g, sc, cl(tt, 0, d - 1e-4), o.colors || { c1: "#FFC400", c2: "#FFFFFF", c3: "#141416" });
        g.restore();
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
    return { draw: draw, drawScene: drawScene, Player: Player };
})();

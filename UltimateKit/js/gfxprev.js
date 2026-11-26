/*  Ultimate Kit - Graphics preview: draws a spec of shared/graphics.js at a time, the way After Effects builds it
    (jsx/graphics.jsx): the same keys, the same eases (an After Effects key ease with speed 0 = cubic-bezier(out / 100,
    0, 1 - in / 100, 1)), the same shapes, masks and blurs (as near as a canvas gets).                               */
var UKGfxPrev = (function () {
    var G = UK_GFX;
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function bez(x1, x2, u) {
        if (u <= 0) return 0; if (u >= 1) return 1;
        var lo = 0, hi = 1, s = u, i;
        for (i = 0; i < 24; i++) { s = (lo + hi) / 2; var x = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s; if (x < u) lo = s; else hi = s; }
        return 3 * (1 - s) * s * s + s * s * s;
    }
    function segE(e, i) { if (e === "lin") return "lin"; if (typeof e[0] === "number") return e; return e[Math.min(i, e.length - 1)]; }
    function lerp(a, b, w) { if (a instanceof Array) { var r = [], i; for (i = 0; i < a.length; i++) r.push(a[i] + (b[i] - a[i]) * w); return r; } return a + (b - a) * w; }
    function val(an, t) {
        var K = an.k, n = K.length, i;
        if (t <= K[0][0]) return K[0][1];
        if (t >= K[n - 1][0]) return K[n - 1][1];
        for (i = 0; i < n - 1; i++) if (t < K[i + 1][0]) break;
        var u = (t - K[i][0]) / Math.max(1e-6, K[i + 1][0] - K[i][0]), e = segE(an.e, i);
        return lerp(K[i][1], K[i + 1][1], e === "lin" ? u : bez(e[0] / 100, 1 - e[1] / 100, u));
    }
    function state(l, t) {
        var s = { x: l.x || 0, y: l.y || 0, op: l.op === undefined ? 100 : l.op, sc: l.sc === undefined ? 100 : l.sc, rot: l.rot || 0, trim: l.te === undefined ? 100 : l.te, trimS: 0, val: 0 }, i;
        for (i = 0; i < l.a.length; i++) {
            var an = l.a[i], v = val(an, t);
            if (an.p === "pos") { s.x = v[0]; s.y = v[1]; } else s[an.p] = v;
        }
        if (!(s.sc instanceof Array)) s.sc = [s.sc, s.sc];
        return s;
    }
    function rr(g, x, y, w, h, r) { r = Math.max(0, Math.min(r || 0, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function fillOf(g, l, x0, y0, x1, y1) {
        if (!l.grad) return l.fill;
        var q = l.grad, gr;
        if (q.kind === "rad") gr = g.createRadialGradient(q.p1[0], q.p1[1], 0, q.p1[0], q.p1[1], Math.max(1, Math.sqrt(Math.pow(q.p2[0] - q.p1[0], 2) + Math.pow(q.p2[1] - q.p1[1], 2))));
        else if (q.p1) gr = g.createLinearGradient(q.p1[0], q.p1[1], q.p2[0], q.p2[1]);
        else gr = q.dir === "h" ? g.createLinearGradient(x0, 0, x1, 0) : g.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, q.c1); gr.addColorStop(1, q.c2);
        return gr;
    }
    /* the dash that shows the trimmed part of a stroke (start / end %) */
    function trimDash(g, len, s) {
        if (s.trim >= 99.99 && s.trimS <= 0.01) { g.setLineDash([]); return true; }
        var a = len * clamp(s.trimS, 0, 100) / 100, b = len * clamp(s.trim, 0, 100) / 100;
        if (b - a <= 0.01) return false;
        g.setLineDash([0, a, b - a, len * 2]); g.lineDashOffset = 0;
        return true;
    }
    function feather(d) { var h = 0.35; return 1 - clamp((d - (1 - h)) / (2 * h), 0, 1); }
    function textOf(l, s) { var str = l.count ? G.fmt(s.val, l.count.f, l.count.pre, l.count.suf) : l.s; if (s.chars !== undefined) str = String(str).substr(0, Math.floor(s.chars)); return l.caps ? String(str).toUpperCase() : String(str); }
    function fontOf(l, size) { var F = G.FONTS[l.role] || G.FONTS.head; return F.w + " " + size.toFixed(1) + "px " + F.css; }

    function layer(g, l, t, S) {
        var s = state(l, t);
        if (s.op <= 0.05 && l.t !== "bg") return;
        g.save();
        g.globalAlpha = clamp(s.op / 100, 0, 1);
        if (l.blend === "add") g.globalCompositeOperation = "lighter";
        else if (l.blend === "screen") g.globalCompositeOperation = "screen";
        if (l.blur) g.filter = "blur(" + (l.blur * 0.55).toFixed(1) + "px)";
        var W = S.W, H = S.H, i, j;
        if (l.t === "bg") {
            var r = Math.sqrt(Math.pow(l.p2[0] - l.p1[0], 2) + Math.pow(l.p2[1] - l.p1[1], 2)), gr = l.kind === "lin" ? g.createLinearGradient(l.p1[0], l.p1[1], l.p2[0], l.p2[1]) : g.createRadialGradient(l.p1[0], l.p1[1], 0, l.p1[0], l.p1[1], Math.max(1, r));
            gr.addColorStop(0, l.c1); gr.addColorStop(1, l.c2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        } else if (l.t === "dots") {
            g.fillStyle = l.c;
            for (j = l.gap / 2; j < H; j += l.gap) for (i = l.gap / 2; i < W; i += l.gap) {
                var a = 1;
                if (l.fade) a = feather(Math.sqrt(Math.pow((i - l.fade.x) / l.fade.rx, 2) + Math.pow((j - l.fade.y) / l.fade.ry, 2)));
                if (a <= 0.01) continue;
                g.globalAlpha = clamp(s.op / 100, 0, 1) * a; g.beginPath(); g.arc(i, j, l.r, 0, Math.PI * 2); g.fill();
            }
        } else if (l.t === "grid") {
            g.strokeStyle = l.c; g.lineWidth = l.w;
            var cell = function (x0, y0, x1, y1) {
                var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, a2 = 1;
                if (l.fade) a2 = feather(Math.sqrt(Math.pow((mx - l.fade.x) / l.fade.rx, 2) + Math.pow((my - l.fade.y) / l.fade.ry, 2)));
                if (a2 <= 0.01) return;
                g.globalAlpha = clamp(s.op / 100, 0, 1) * a2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
            };
            var st = l.gap;
            for (j = (H / 2) % st; j < H; j += st) for (i = 0; i < W; i += st) cell(i, j, i + st, j);
            if (!l.rows) for (i = (W / 2) % st; i < W; i += st) for (j = 0; j < H; j += st) cell(i, j, i, j + st);
        } else if (l.t === "hexes") {
            g.strokeStyle = l.c; g.lineWidth = l.sw;
            for (j = 0; l.y0 + j * l.dy < H + l.dy; j++) for (i = 0; l.x0 + i * l.dx < W + l.dx; i++) {
                var hx0 = l.x0 + i * l.dx + (j % 2 ? l.dx / 2 : 0), hy0 = l.y0 + j * l.dy, q2;
                g.beginPath();
                for (q2 = 0; q2 < 6; q2++) { var an2 = -Math.PI / 2 + q2 * Math.PI / 3; g[q2 ? "lineTo" : "moveTo"](hx0 + Math.cos(an2) * l.R, hy0 + Math.sin(an2) * l.R); }
                g.closePath(); g.stroke();
            }
        } else if (l.t === "edge") {
            g.strokeStyle = l.c; g.lineWidth = l.w * 1.4; g.filter = "blur(" + (l.blur * 0.55).toFixed(1) + "px)";
            g.strokeRect(0, 0, W, H);
        } else if (l.t === "orbit") {
            g.translate(s.x, s.y); g.rotate(s.rot * Math.PI / 180);
            var sz = l.size, gl = g.createRadialGradient(0, -l.R, 0, 0, -l.R, sz);
            gl.addColorStop(0, l.c2); gl.addColorStop(1, "rgba(0,0,0,0)");
            g.globalCompositeOperation = "lighter"; g.filter = "none";
            g.save(); g.translate(0, -l.R); g.scale(2.4, 0.55); g.translate(0, l.R); g.fillStyle = gl; g.beginPath(); g.arc(0, -l.R, sz, 0, Math.PI * 2); g.fill(); g.restore();
            var core = g.createRadialGradient(0, -l.R, 0, 0, -l.R, sz * 0.32); core.addColorStop(0, l.c); core.addColorStop(1, "rgba(255,255,255,0)");
            g.save(); g.translate(0, -l.R); g.scale(2.2, 0.35); g.translate(0, l.R); g.fillStyle = core; g.beginPath(); g.arc(0, -l.R, sz * 0.32, 0, Math.PI * 2); g.fill(); g.restore();
        } else if (l.t === "text") {
            var str = textOf(l, s), size = l.size, F = G.FONTS[l.role] || G.FONTS.head;
            g.font = fontOf(l, size);
            if ("letterSpacing" in g) g.letterSpacing = (l.track / 1000 * size) + "px";
            var tw = g.measureText(str).width;
            if (l.maxW && tw > l.maxW && !l.count) { size *= l.maxW / tw; g.font = fontOf(l, size); if ("letterSpacing" in g) g.letterSpacing = (l.track / 1000 * size) + "px"; tw = g.measureText(str).width; }
            l._size = size;
            g.translate(s.x, s.y); g.rotate(s.rot * Math.PI / 180); g.scale(s.sc[0] / 100, s.sc[1] / 100);
            var x0 = l.just === "left" ? 0 : (l.just === "right" ? -tw : -tw / 2), base = size * 0.36;
            g.textBaseline = "alphabetic";
            if (l.glow) { g.shadowColor = l.glow.c; g.shadowBlur = l.glow.r || size * 0.4; }
            g.fillStyle = l.grad ? (function () { var q = g.createLinearGradient(0, -size * 0.72 + base, 0, base); q.addColorStop(0, l.grad[0]); q.addColorStop(1, l.grad[1]); return q; })() : l.c;
            g.fillText(str, x0, base);
        } else {
            g.translate(s.x, s.y); g.rotate(s.rot * Math.PI / 180); g.scale(s.sc[0] / 100, s.sc[1] / 100);
            var w = l.w || 0, h = l.h || 0, ox = 0, oy = 0;
            if (l.org === "b") oy = -h / 2; else if (l.org === "t") oy = h / 2; else if (l.org === "l") ox = w / 2; else if (l.org === "r") ox = -w / 2;
            var path = null, len = 0;
            if (l.t === "rect") { rr(g, ox - w / 2, oy - h / 2, w, h, l.r); len = 2 * (w + h); }
            else if (l.t === "ell") { g.beginPath(); g.ellipse(ox, oy, w / 2, h / 2, 0, -Math.PI / 2, Math.PI * 1.5); len = Math.PI * (w + h) / 2; }
            else if (l.t === "ring") { g.beginPath(); var a0 = ((l.from || 0) - 90) * Math.PI / 180; g.arc(0, 0, l.R, a0, a0 + Math.PI * 2); len = Math.PI * 2 * l.R; }
            else if (l.t === "star") {
                g.beginPath();
                for (i = 0; i < l.n * 2; i++) { var rr2 = (i % 2 || l.poly) ? (l.poly ? l.R : l.r) : l.R, an = -Math.PI / 2 + i * Math.PI / l.n; if (l.poly && i % 2) continue; g[i ? "lineTo" : "moveTo"](Math.cos(an) * rr2, Math.sin(an) * rr2); }
                g.closePath();
            } else if (l.t === "path") {
                var P = l.v, I = l.i, O = l.o;
                g.beginPath(); g.moveTo(P[0][0] - l.x, P[0][1] - l.y);
                for (i = 1; i < P.length + (l.closed ? 1 : 0); i++) {
                    var a1 = P[(i - 1) % P.length], b1 = P[i % P.length], oa = O ? O[(i - 1) % P.length] : [0, 0], ib = I ? I[i % P.length] : [0, 0];
                    g.bezierCurveTo(a1[0] + oa[0] - l.x, a1[1] + oa[1] - l.y, b1[0] + ib[0] - l.x, b1[1] + ib[1] - l.y, b1[0] - l.x, b1[1] - l.y);
                    len += Math.sqrt(Math.pow(b1[0] - a1[0], 2) + Math.pow(b1[1] - a1[1], 2)) * 1.05;
                }
                if (l.closed) g.closePath();
            }
            if ((l.fill || l.grad) && l.t !== "ring") { g.fillStyle = fillOf(g, l, ox - w / 2, oy - h / 2, ox + w / 2, oy + h / 2); g.globalAlpha = clamp(s.op / 100, 0, 1) * ((l.fillOp === undefined ? 100 : l.fillOp) / 100); g.fill(); g.globalAlpha = clamp(s.op / 100, 0, 1); }
            if (l.track && l.t === "ring") { g.save(); g.setLineDash([]); g.strokeStyle = l.track; g.lineWidth = l.sw; g.stroke(); g.restore(); }
            if (l.stroke || (l.t === "ring")) {
                g.strokeStyle = l.stroke || l.c; g.lineWidth = l.sw || 2; g.lineCap = l.cap === "butt" ? "butt" : "round"; g.lineJoin = "round";
                if (l.dash) g.setLineDash(l.dash);
                if (!l.dash && !trimDash(g, len, s)) { g.restore(); return; }
                g.stroke();
            }
        }
        g.restore();
    }
    /* texts placed right after another (after: { name, gap }): the x the other's box ends at, at the end state */
    function place(g, S) {
        var by = {}, i, j;
        for (i = 0; i < S.layers.length; i++) by[S.layers[i].name] = S.layers[i];
        for (i = 0; i < S.layers.length; i++) {
            var l = S.layers[i], r = l.after && by[l.after.name];
            if (!r || r.t !== "text") continue;
            var s = state(r, S.dur), size = r.size;
            g.font = fontOf(r, size); if ("letterSpacing" in g) g.letterSpacing = (r.track / 1000 * size) + "px";
            var w = g.measureText(textOf(r, s)).width, right = r.just === "left" ? s.x + w : (r.just === "right" ? s.x : s.x + w / 2);
            var dx = right + l.after.gap - l.x;
            l.x += dx;
            for (j = 0; j < l.a.length; j++) if (l.a[j].p === "pos") for (var k = 0; k < l.a[j].k.length; k++) l.a[j].k[k][1] = [l.a[j].k[k][1][0] + dx, l.a[j].k[k][1][1]];
        }
    }
    /* o: { spec, t } ; the spec is in comp pixels, drawn to fit the canvas */
    function draw(cv, S, t) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
        var g = cv.getContext("2d"), k = Math.min(cv.width / S.W, cv.height / S.H), i;
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = "none"; g.globalCompositeOperation = "source-over";
        g.fillStyle = "#08080a"; g.fillRect(0, 0, cv.width, cv.height);
        g.translate((cv.width - S.W * k) / 2, (cv.height - S.H * k) / 2); g.scale(k, k);
        g.beginPath(); g.rect(0, 0, S.W, S.H); g.clip();
        if (!S._placed) { place(g, S); S._placed = true; }
        for (i = 0; i < S.layers.length; i++) { try { layer(g, S.layers[i], t, S); } catch (e) { } }
    }
    function Player(cv) { this.cv = cv; this.S = null; this.t = 0; this.running = false; this.hold = 1.2; }
    Player.prototype.set = function (S) { this.S = S; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) {
            if (!self.running) return;
            self.t += Math.min(0.1, (now - last) / 1000); last = now;
            if (self.S && document.body.contains(self.cv)) { var L = self.S.dur + self.hold; draw(self.cv, self.S, self.t % L); }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player, state: state };
})();

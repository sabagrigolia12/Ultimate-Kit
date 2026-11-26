/*  Ultimate Kit - Highlighter preview (canvas): a word on a plain dark or light ground (the light one with the faint
    grid of the reference reel), the look's layers drawn from the same spec and keyframes AE builds (shared/highlight.js)
    and the word's letters moved by the same text animators (range selectors, near enough).
    o: { id, colors { box, accent, ink }, dIn, dOut, mode "in" | "both", pad, round, reveal, ink, bg "auto" | "dark" |
         "light", word, thumb, maxW }                                                                              */
var UKHLPrev = (function () {
    var FONT = "800 {s}px Montserrat, 'Segoe UI', Arial, sans-serif";
    function col(slot, o) {
        if (slot === "B") return o.colors.box;
        if (slot === "A") return o.colors.accent;
        if (slot === "I") return o.colors.ink;
        return slot;
    }
    function v(K, t, def) { return K ? UK_HL.val(K, t) : def; }
    function rectPath(P, w, h, r, x, y) {
        w = Math.max(0, w); h = Math.max(0, h); r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
        if (w <= 0 || h <= 0) return;
        if (r > 0.2 && P.roundRect) P.roundRect(x - w / 2, y - h / 2, w, h, r); else P.rect(x - w / 2, y - h / 2, w, h);
    }
    /* the outline of a part as points (strokes that draw on, tapers) */
    function polyOf(part, t) {
        if (part.k === "path") return part.smooth ? UK_HL.dense(part.pts, part.closed, 10) : (part.closed ? part.pts.concat([part.pts[0]]) : part.pts);
        var sz = v(part.K.sz, t, [part.w, part.h]), rp = v(part.K.rp, t, part.pos || [0, 0]), pts = [], i;
        if (part.k === "ellipse") { for (i = 0; i <= 48; i++) { var a = -Math.PI / 2 + i / 48 * Math.PI * 2; pts.push([rp[0] + Math.cos(a) * sz[0] / 2, rp[1] + Math.sin(a) * sz[1] / 2]); } return pts; }
        var w = sz[0], h = sz[1], r = Math.min(v(part.K.rr, t, part.r || 0), w / 2, h / 2), x0 = rp[0] - w / 2, y0 = rp[1] - h / 2, x1 = rp[0] + w / 2, y1 = rp[1] + h / 2;
        if (r < 0.5) return [[x1, y0], [x1, y1], [x0, y1], [x0, y0], [x1, y0]];        // (AE's rectangle starts top right)
        var arc = function (cx, cy, a0) { for (var j = 0; j <= 5; j++) { var a = a0 + j / 5 * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
        arc(x1 - r, y0 + r, -Math.PI / 2); arc(x1 - r, y1 - r, 0); arc(x0 + r, y1 - r, Math.PI / 2); arc(x0 + r, y0 + r, Math.PI); pts.push(pts[0]);
        return pts;
    }
    function addShape(P, part, t) {
        if (part.k === "path") {
            var q = part.smooth ? UK_HL.dense(part.pts, part.closed, 10) : part.pts, i;
            P.moveTo(q[0][0], q[0][1]); for (i = 1; i < q.length; i++) P.lineTo(q[i][0], q[i][1]); if (part.closed) P.closePath();
            return;
        }
        var sz = v(part.K.sz, t, [part.w, part.h]), rp = v(part.K.rp, t, part.pos || [0, 0]);
        if (part.k === "ellipse") { if (sz[0] > 0 && sz[1] > 0) { P.moveTo(rp[0] + sz[0] / 2, rp[1]); P.ellipse(rp[0], rp[1], sz[0] / 2, sz[1] / 2, 0, 0, Math.PI * 2); } return; }
        rectPath(P, sz[0], sz[1], v(part.K.rr, t, part.r || 0), rp[0], rp[1]);
    }
    function partPath(part, t) {
        var P = new Path2D();
        if (!part.sub) { addShape(P, part, t); return P; }
        var Q = new Path2D(); addShape(Q, part, t);
        var sp = v(part.sub.K && part.sub.K.p, t, part.sub.p || [0, 0]), sr = v(part.sub.K && part.sub.K.r, t, part.sub.r || 0), sa = part.sub.a || [0, 0];
        var m = new DOMMatrix().translate(sp[0], sp[1]).rotate(sr).translate(-sa[0], -sa[1]);
        P.addPath(Q, m);
        return P;
    }
    /* the drawn part a..b (0..1) of a polyline, with an AE-like taper (pointed ends) */
    function strokeTrim(g, pts, a, b, w, taper) {
        var L = [0], i, n = pts.length;
        for (i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        var tot = L[n - 1]; if (tot <= 0 || b <= a) return;
        var s0 = a * tot, s1 = b * tot, seg = [], j = 1, k, steps = Math.max(2, Math.ceil((s1 - s0) / 2));
        for (k = 0; k <= steps; k++) {
            var s = s0 + (s1 - s0) * k / steps;
            while (j < n - 1 && L[j] < s) j++;
            var f = (s - L[j - 1]) / ((L[j] - L[j - 1]) || 1);
            seg.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f]);
        }
        if (!taper) { g.beginPath(); g.moveTo(seg[0][0], seg[0][1]); for (k = 1; k < seg.length; k++) g.lineTo(seg[k][0], seg[k][1]); g.stroke(); return; }
        var m = seg.length, lw = g.lineWidth;
        for (k = 1; k < m; k++) {
            var u = k / (m - 1), f2 = 1;
            if (u < taper[0] / 100) f2 = Math.min(f2, Math.sin(u / (taper[0] / 100) * Math.PI / 2));
            if (u > 1 - taper[1] / 100) f2 = Math.min(f2, Math.sin((1 - u) / (taper[1] / 100) * Math.PI / 2));
            g.lineWidth = Math.max(0.3, lw * f2);
            g.beginPath(); g.moveTo(seg[k - 1][0], seg[k - 1][1]); g.lineTo(seg[k][0], seg[k][1]); g.stroke();
        }
        g.lineWidth = lw;
    }
    function element(g, el, t, o) {
        var K = el.K, p = v(K.p, t, el.p || [0, 0]), s = v(K.s, t, [100, 100]), r = v(K.r, t, 0), op = v(K.o, t, 100) / 100, a = el.a || [0, 0], i;
        if (op <= 0.001 || Math.abs(s[0]) < 0.01 || Math.abs(s[1]) < 0.01) return;
        g.save();
        g.translate(p[0], p[1]); g.rotate(r * Math.PI / 180); g.scale(s[0] / 100, s[1] / 100); g.translate(-a[0], -a[1]);
        if (el.fill) {
            g.globalAlpha = op * (el.fo === undefined ? 1 : el.fo / 100); g.fillStyle = col(el.fill, o);
            if (el.merge === 4) {
                g.save(); g.clip(partPath(el.parts[0], t));
                for (i = 1; i < el.parts.length; i++) g.fill(partPath(el.parts[i], t));
                g.restore();
            } else if (el.merge === 3) {
                var P = new Path2D(); for (i = 0; i < el.parts.length; i++) P.addPath(partPath(el.parts[i], t)); g.fill(P, "evenodd");
            } else for (i = 0; i < el.parts.length; i++) g.fill(partPath(el.parts[i], t));
        }
        if (el.stroke) {
            var te = v(K.te, t, 100) / 100, ts = v(K.ts, t, 0) / 100;
            g.globalAlpha = op * (el.so === undefined ? 1 : el.so / 100); g.strokeStyle = col(el.stroke, o); g.lineWidth = el.sw || 2;
            g.lineCap = el.cap === 2 ? "round" : (el.cap === 3 ? "square" : "butt"); g.lineJoin = el.join === 2 ? "round" : (el.join === 3 ? "bevel" : "miter");
            for (i = 0; i < el.parts.length; i++) {
                if (te - ts <= 0.001) continue;
                if (te >= 0.999 && ts <= 0.001 && !el.taper && el.parts[i].k !== "path") g.stroke(partPath(el.parts[i], t));
                else strokeTrim(g, polyOf(el.parts[i], t), ts, te, el.sw || 2, el.taper);
            }
        }
        g.restore();
    }
    /* one highlight layer: drawn on its own canvas, then put down with its opacity, blur / glow / shadow */
    var buf = null;
    function layer(g, Ly, t, o, k, cx, cy, W, H) {
        var op = v(Ly.K.o, t, 100) / 100, s = v(Ly.K.s, t, [100, 100]), r = v(Ly.K.r, t, Ly.r || 0), pp = v(Ly.K.p, t, Ly.pp || [0, 0]), a = Ly.a || [0, 0], i;
        if (op <= 0.002) return;
        if (!buf) buf = document.createElement("canvas");
        if (buf.width !== W || buf.height !== H) { buf.width = W; buf.height = H; }
        var b = buf.getContext("2d"); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H);
        b.translate(cx + pp[0] * k, cy + pp[1] * k); b.rotate(r * Math.PI / 180); b.scale(s[0] / 100 * k, s[1] / 100 * k); b.translate(-a[0], -a[1]);
        for (i = 0; i < Ly.els.length; i++) element(b, Ly.els[i], t, o);
        g.save(); g.globalAlpha = op;
        var blur = 0, glow = null, sh = null;
        for (i = 0; i < Ly.fx.length; i++) { var f = Ly.fx[i]; if (f.k === "blur") blur = v(f.K, t, 0); else if (f.k === "glow") glow = f; else if (f.k === "shadow") sh = f; }
        if (glow) { g.save(); g.globalCompositeOperation = "lighter"; g.filter = "blur(" + Math.max(1, glow.radius * k * 0.5).toFixed(1) + "px)"; g.globalAlpha = op * Math.min(1, glow.intensity * 0.7); g.drawImage(buf, 0, 0); g.restore(); }
        if (sh) { var an = (sh.dir - 90) * Math.PI / 180; g.shadowColor = "rgba(0,0,0," + (sh.op / 100) + ")"; g.shadowBlur = sh.soft * k; g.shadowOffsetX = Math.cos(an) * sh.dist * k; g.shadowOffsetY = Math.sin(an) * sh.dist * k; }
        if (blur > 0.05) g.filter = "blur(" + (blur * k * 0.5).toFixed(1) + "px)";
        g.drawImage(buf, 0, 0);
        g.restore();
    }
    function mix(c1, c2, u) {
        var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
        var r = Math.round((a >> 16 & 255) + ((b >> 16 & 255) - (a >> 16 & 255)) * u), gg = Math.round((a >> 8 & 255) + ((b >> 8 & 255) - (a >> 8 & 255)) * u), bb = Math.round((a & 255) + ((b & 255) - (a & 255)) * u);
        return "rgb(" + r + "," + gg + "," + bb + ")";
    }
    function draw(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(cw * dpr)), Hc = Math.round(Wc * ch / cw);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var g = cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.filter = "none";
        var L = UK_HL.find(o.id), light = o.bg === "light" || (o.bg !== "dark" && L.bg === "light");
        /* the ground */
        var gr = g.createRadialGradient(Wc / 2, Hc / 2, 0, Wc / 2, Hc / 2, Wc * 0.7);
        if (light) { gr.addColorStop(0, "#F4F4F4"); gr.addColorStop(1, "#D9D9D9"); } else { gr.addColorStop(0, "#2A2A2C"); gr.addColorStop(1, "#151516"); }
        g.fillStyle = gr; g.fillRect(0, 0, Wc, Hc);
        if (light) { g.strokeStyle = "rgba(0,0,0,0.05)"; g.lineWidth = 1; var st = Hc / 9; for (var gx = (Wc / 2) % st; gx < Wc; gx += st) { g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx, Hc); g.stroke(); } for (var gy = (Hc / 2) % st; gy < Hc; gy += st) { g.beginPath(); g.moveTo(0, gy); g.lineTo(Wc, gy); g.stroke(); } }
        /* the word, measured as AE would box it (its ink, baseline at 0) */
        var word = o.word || "Highlight", fs = 100, k;
        g.font = FONT.replace("{s}", fs);
        var mt = g.measureText(word), asc = mt.actualBoundingBoxAscent || fs * 0.72, desc = mt.actualBoundingBoxDescent || fs * 0.02, tw = mt.width;
        var R = { left: -tw / 2, top: -asc, width: tw, height: asc + desc };
        var both = o.mode === "both", hold = o.thumb ? 0 : 1.1, dIn = o.dIn || 0.6, dOut = o.dOut || 0.45;
        var c = { dIn: dIn, dOut: dOut, tOut: both ? dIn * 1.5 + 0.1 + hold : null, pad: o.pad, round: o.round, reveal: o.reveal, ink: o.ink };
        var spec = UK_HL.build(o.id, R, fs, c), cycle = spec.end + 0.7;
        var tt = o.thumb ? Math.min(spec.end, dIn * 1.6) - 0.001 : (t % cycle) - 0.25;
        if (o.thumb && both) tt = c.tOut - 0.05;
        k = Math.min(Wc * 0.72 / (spec.w * 1.25), Hc * 0.4 / spec.h);
        var cx = Wc / 2, cy = Hc / 2, i, j;
        for (i = 0; i < spec.layers.length; i++) if (!spec.layers[i].above) layer(g, spec.layers[i], tt, o, k, cx, cy, Wc, Hc);
        /* letters */
        var base = light ? "#1A1A1A" : "#FFFFFF", chars = word.split(""), xs = [], x = R.left, n = 0, idx = [];
        for (i = 0; i < chars.length; i++) { var wch = g.measureText(word.substr(0, i + 1)).width; xs.push(R.left + (i ? g.measureText(word.substr(0, i)).width : 0)); idx.push(chars[i] === " " ? -1 : n++); x = R.left + wch; }
        var st2 = [], extra = 0;
        for (i = 0; i < chars.length; i++) {
            var q = { op: 1, dx: 0, dy: 0, bl: 0, sc: [1, 1], rot: 0, ink: 0, tr: 0 };
            if (idx[i] >= 0) for (j = 0; j < spec.text.length; j++) {
                var an = spec.text[j], sa = UK_HL.selAmount(an, tt, idx[i], n), P = an.props;
                if (sa <= 0) continue;
                if (P.opacity !== undefined) q.op *= 1 + (P.opacity / 100 - 1) * sa;
                if (P.pos) { q.dx += P.pos[0] * sa; q.dy += P.pos[1] * sa; }
                if (P.blur) q.bl += (P.blur[0] + P.blur[1]) / 2 * sa;
                if (P.scale) { q.sc[0] *= 1 + (P.scale[0] / 100 - 1) * sa; q.sc[1] *= 1 + (P.scale[1] / 100 - 1) * sa; }
                if (P.rot) q.rot += P.rot * sa;
                if (P.track) q.tr += P.track / 1000 * fs * 6 * sa;          // (as wide as After Effects spreads them)
                if (P.fill === "I") q.ink = Math.max(q.ink, sa);
            }
            q.shift = extra; extra += q.tr; st2.push(q);
        }
        g.save();
        if (spec.mask) { var mk = new Path2D(); mk.rect(cx - spec.w / 2 * k, cy - spec.h / 2 * k, spec.w * k, spec.h * k); g.clip(mk); }
        g.translate(cx, cy); g.scale(k, k); g.translate(-(R.left + R.width / 2), -(R.top + R.height / 2));
        g.textBaseline = "alphabetic";
        for (i = 0; i < chars.length; i++) {
            var s2 = st2[i]; if (chars[i] === " " || s2.op <= 0.01) continue;
            var cw2 = g.measureText(chars[i]).width, px = xs[i] + s2.shift - extra / 2 + s2.dx + cw2 / 2, py = s2.dy - asc / 2;
            g.save(); g.globalAlpha = Math.max(0, Math.min(1, s2.op));
            if (s2.bl > 0.3) g.filter = "blur(" + (s2.bl * k * 0.5).toFixed(1) + "px)";
            g.translate(px, py); g.rotate(s2.rot * Math.PI / 180); g.scale(s2.sc[0], s2.sc[1]);
            g.fillStyle = s2.ink > 0 ? mix(base, o.colors.ink, s2.ink) : base;
            g.fillText(chars[i], -cw2 / 2, asc / 2);
            g.restore();
        }
        g.restore();
        for (i = 0; i < spec.layers.length; i++) if (spec.layers[i].above) layer(g, spec.layers[i], tt, o, k, cx, cy, Wc, Hc);
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

/*  Ultimate Kit - "Plugin Slot" card preview (canvas), the same look and timing as jsx/slotcard.jsx
    (shared/slotcard.js): the card scales from its centre (0 -> 104 -> 100), icon / dot / text fade in.   */
var UKSlotPrev = (function () {
    function lerpKeys(K, t, curve) {
        if (t <= K[0][0]) return K[0][1];
        for (var i = 1; i < K.length; i++) if (t <= K[i][0]) {
            var a = K[i - 1], b = K[i], x = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
            return a[1] + (b[1] - a[1]) * curve(x, i - 1);
        }
        return K[K.length - 1][1];
    }
    var eo = function (x) { return 1 - Math.pow(1 - x, 3); }, eio = function (x) { return x * x * (3 - 2 * x); };
    function rrect(x, l, t, w, h, r) { r = Math.min(r, w / 2, h / 2); x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); }
    /* the text with AE tracking (1/1000 em per step), returns its width */
    function track(x, s, fs, tr, draw, x0, y0) {
        var w = 0, sp = fs * tr / 1000;
        for (var i = 0; i < s.length; i++) { var cw = x.measureText(s.charAt(i)).width; if (draw) x.fillText(s.charAt(i), x0 + w, y0); w += cw + (i < s.length - 1 ? sp : 0); }
        return w;
    }
    function icon(x, n, u, col, u0) {
        var ic = UK_SLOT.ICONS[Math.max(0, Math.min(UK_SLOT.ICONS.length - 1, (n || 1) - 1))], j;
        x.strokeStyle = col; x.fillStyle = col; x.lineWidth = UK_SLOT.ISW * u0; x.lineCap = "round"; x.lineJoin = "round";
        if (ic.line) for (j = 0; j < ic.line.length; j++) { var L = ic.line[j]; x.beginPath(); x.moveTo(L[0] * u, L[1] * u); x.lineTo(L[2] * u, L[3] * u); x.stroke(); }
        if (ic.poly) for (j = 0; j < ic.poly.length; j++) { x.beginPath(); for (var q = 0; q < ic.poly[j].length; q++) x[q ? "lineTo" : "moveTo"](ic.poly[j][q][0] * u, ic.poly[j][q][1] * u); x.stroke(); }
        if (ic.arc) for (j = 0; j < ic.arc.length; j++) {
            var A = ic.arc[j], s0 = -Math.PI / 2 + A[1] / 100 * Math.PI * 2, s1 = -Math.PI / 2 + A[2] / 100 * Math.PI * 2;
            x.beginPath(); x.arc(0, 0, A[0] * u, s0, s1); x.stroke();
        }
        if (ic.dot) for (j = 0; j < ic.dot.length; j++) { x.beginPath(); x.arc(ic.dot[j][0] * u, ic.dot[j][1] * u, ic.dot[j][2] * u, 0, Math.PI * 2); x.fill(); }
        if (ic.bar) for (j = 0; j < ic.bar.length; j++) { var B = ic.bar[j]; rrect(x, (B[0] - B[2] / 2) * u, (B[1] - B[3] / 2) * u, B[2] * u, B[3] * u, B[2] * u / 2); x.fill(); }
    }
    /* o: { text, slot, inDur, hold, outDur, thumb, maxW } */
    function draw(cv, p, t, o) {
        o = o || {};
        var s = {}, k, D = UK_SLOT.DEF;
        for (k in D) s[k] = D[k];
        if (o.slot) for (k in o.slot) if (o.slot[k] !== undefined && o.slot[k] !== null) s[k] = o.slot[k];
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(cw * dpr)), H = Math.round(W * ch / cw);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var x = cv.getContext("2d");
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
        x.fillStyle = "#0B0B0D"; x.fillRect(0, 0, W, H);
        /* the animation of card 29: the line grows across, the card opens, the text rises in; mirrored out */
        var dIn = o.inDur || 0.9, hold = o.hold === undefined ? 1.2 : o.hold, dOut = o.outDur || 0.8, T = UK_CARD.times(dIn, hold, dOut), RV = UK_SLOT.reveal(T);
        var tt = o.thumb ? dIn + 0.01 : t % (T.end + 0.5);
        var ei = function (q) { return 1 - Math.pow(1 - q, 3); }, eiR = function (q) { return q * q * q; };
        var inOut = function (q, i) { return i === 0 ? ei(q) : (i === 2 ? eiR(q) : 0); };
        var rw = lerpKeys(RV.w, tt, function (q, i) { return i === 1 ? 0 : eio(q); }), rh = lerpKeys(RV.h, tt, inOut);
        var fade = lerpKeys([[T.deco[0], 0], [T.deco[1], 1], [T.deco[2], 1], [T.deco[3], 0]], tt, inOut);
        var rise = lerpKeys([[T.text[0], 1], [T.text[1], 0], [T.text[2], 0], [T.text[3], 1]], tt, inOut);
        var str = String(o.text || (p && p.text) || "HIGH-PASS").replace(/\r\n|\n|\r/g, " ").toUpperCase();
        /* the frame is 1080 high; fit the card's width into the canvas */
        var u = H / 1080, fs = UK_SLOT.FS * u;
        x.font = "700 " + fs + "px 'Space Mono', 'JetBrains Mono', 'Roboto Mono', Consolas, monospace";
        var si = s.showIcon !== false, sd = s.showDot !== false;
        var tw = track(x, str, fs, UK_SLOT.TRACK, false), cardW = tw + UK_SLOT.pad(si, sd) * u, fit = Math.min(1, W * 0.9 / cardW);
        u *= fit; fs *= fit; x.font = "700 " + fs + "px 'Space Mono', 'JetBrains Mono', 'Roboto Mono', Consolas, monospace";
        tw = track(x, str, fs, UK_SLOT.TRACK, false); cardW = tw + UK_SLOT.pad(si, sd) * u;
        var LN = Math.max(3, Math.round(4 * H / 1080)), cw2 = cardW * rw, chh = LN + (s.height * u - LN) * rh;
        if (rw <= 0.001) return;
        x.translate(W / 2, H / 2);
        rrect(x, -cw2 / 2, -chh / 2, cw2, chh, s.corner * u);
        x.fillStyle = s.fill; x.fill();
        x.lineWidth = s.sw * u; x.strokeStyle = s.stroke; x.stroke();
        /* icon, dot and text clipped to the card (Card Matte) */
        x.save(); rrect(x, -cw2 / 2, -chh / 2, cw2, chh, s.corner * u); x.clip();
        x.globalAlpha = fade;
        if (si) { x.save(); x.translate(-cardW / 2 + UK_SLOT.iconX() * u, 0); icon(x, s.icon, u * UK_SLOT.IS, s.iconColor, u); x.restore(); }
        if (sd) { x.fillStyle = s.dot; x.beginPath(); x.arc(-cardW / 2 + UK_SLOT.dotX(si) * u, 0, UK_SLOT.DOT / 2 * u, 0, Math.PI * 2); x.fill(); }
        x.globalAlpha = 1;
        /* "rise": the text comes up from below through a band just around its own lines */
        x.beginPath(); x.rect(-W, -fs * 0.5, W * 2, fs * 1.05); x.clip();
        x.fillStyle = s.text; x.textBaseline = "middle"; x.textAlign = "left";
        track(x, str, fs, UK_SLOT.TRACK, true, -cardW / 2 + UK_SLOT.textLeft(si, sd) * u, fs * 0.04 + rise * fs * 1.2);
        x.restore();
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

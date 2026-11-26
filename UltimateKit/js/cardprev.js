/*  Ultimate Kit - Text Card previews (canvas). Same presets, sizes, Size keyframes and timing as After
    Effects (shared/cards.js); the lights, details and text reveals are close sketches of the AE layers. */
var UKCardPrev = (function () {
    var cl = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var cache = {};
    function bez(a, b) {
        var x1 = a / 100, x2 = 1 - b / 100;
        return function (x) {
            if (x <= 0 || x >= 1) return cl(x, 0, 1);
            var lo = 0, hi = 1, s = x, i;
            for (i = 0; i < 28; i++) { s = (lo + hi) / 2; var u = 1 - s, bx = 3 * u * u * s * x1 + 3 * u * s * s * x2 + s * s * s; if (bx < x) lo = s; else hi = s; }
            return 3 * (1 - s) * s * s + s * s * s;
        };
    }
    function E(name) { var e = UK_CARD.ease(name); if (!e) return function (x) { return cl(x, 0, 1); }; var k = e[0] + "_" + e[1]; return cache[k] || (cache[k] = bez(e[0], e[1])); }
    function val(chn, t) {
        var k = chn.k, n = k.length, i;
        if (t <= k[0][0]) return k[0][1];
        if (t >= k[n - 1][0]) return k[n - 1][1];
        for (i = 0; i < n - 1; i++) if (t < k[i + 1][0]) break;
        var f = E(chn.e[i])((t - k[i][0]) / Math.max(1e-6, k[i + 1][0] - k[i][0]));
        if (typeof k[i][1] === "number") return k[i][1] + (k[i + 1][1] - k[i][1]) * f;
        return [k[i][1][0] + (k[i + 1][1][0] - k[i][1][0]) * f, k[i][1][1] + (k[i + 1][1][1] - k[i][1][1]) * f];
    }
    /* in -> hold -> back: 0..1 at time t (the same as UK.CARD.io in AE) */
    function io(t, a, b, c, e, ease) { return val({ k: [[a, 0], [b, 1], [c, 1], [e, 0]], e: [ease || "out", "hold", "~" + (ease || "out")] }, t); }
    function hexA(h, a) { var n = parseInt(String(h || "#fff").replace("#", ""), 16); return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + (a === undefined ? 1 : a) + ")"; }
    function rr(g, w, h, r) {
        w = Math.max(0, w); h = Math.max(0, h); r = Math.max(0, Math.min(r, w / 2, h / 2));
        g.beginPath();
        g.moveTo(-w / 2 + r, -h / 2); g.lineTo(w / 2 - r, -h / 2); g.arcTo(w / 2, -h / 2, w / 2, -h / 2 + r, r);
        g.lineTo(w / 2, h / 2 - r); g.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
        g.lineTo(-w / 2 + r, h / 2); g.arcTo(-w / 2, h / 2, -w / 2, h / 2 - r, r);
        g.lineTo(-w / 2, -h / 2 + r); g.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
        g.closePath();
    }
    /* points round a rounded rectangle, starting at the top-left of the straight top edge, clockwise */
    function rrPts(w, h, r) {
        var p = [], k, j, n = 8;
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        var cs = [[w / 2 - r, -h / 2 + r, -Math.PI / 2], [w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI]];
        for (k = 0; k < 4; k++) for (j = 0; j <= n; j++) { var a = cs[k][2] + j / n * Math.PI / 2; p.push([cs[k][0] + Math.cos(a) * r, cs[k][1] + Math.sin(a) * r]); }
        p.push(p[0]);
        return p;
    }
    /* the part a..b (0..1, may wrap past 1) of a closed polyline */
    function part(g, pts, a, b) {
        var L = [0], i, tot;
        for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        tot = L[L.length - 1];
        function seg(s0, s1) {
            var on = false;
            g.beginPath();
            for (i = 1; i < pts.length; i++) {
                if (L[i] < s0) continue;
                var sg = (L[i] - L[i - 1]) || 1, p0 = pts[i - 1], p1 = pts[i], f0 = cl((s0 - L[i - 1]) / sg, 0, 1), f1 = cl((s1 - L[i - 1]) / sg, 0, 1);
                if (!on) { g.moveTo(p0[0] + (p1[0] - p0[0]) * f0, p0[1] + (p1[1] - p0[1]) * f0); on = true; }
                g.lineTo(p0[0] + (p1[0] - p0[0]) * f1, p0[1] + (p1[1] - p0[1]) * f1);
                if (L[i] >= s1) break;
            }
            g.stroke();
        }
        var len = Math.min(1, b - a);
        if (len <= 0.001 || tot <= 0) return;
        a = ((a % 1) + 1) % 1;
        var s0 = a * tot, s1 = s0 + len * tot;
        if (s1 <= tot) seg(s0, s1); else { seg(s0, tot); seg(0, s1 - tot); }
    }
    /* a soft gaussian light (like AE's stacked rings): ellipse w x h centred at x, y, peak alpha a */
    function gauss(g, x, y, w, h, hex, a) {
        if (a <= 0.003 || w <= 0 || h <= 0) return;
        var gr = g.createRadialGradient(0, 0, 0, 0, 0, 1), i;
        for (i = 0; i <= 10; i++) gr.addColorStop(i / 10, hexA(hex, a * Math.exp(-3.6 * Math.pow(i / 10, 2)) * (i === 10 ? 0 : 1)));
        g.save(); g.translate(x, y); g.scale(w / 2, h / 2); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
    }
    /* the same light keys as AE (UK.CARD.lightKeys): a in, b peak, s settled, c leaving, e gone */
    function lk(T) { var b = T.light[1], c = T.light[2]; return { a: T.light[0], b: b, s: Math.min(b + 0.6, (b + c) / 2), c: c, e: T.light[3] }; }
    function bloom(t, L, peak) { return val({ k: [[L.a, 0], [L.b, peak], [L.s, 1], [L.c, 1], [L.e, 0]], e: ["settle", "inout", "hold", "~settle"] }, t); }
    function breathe(t, L, amt) {
        if (L.c - L.s < 1.6) return 1;
        var ss = function (x) { x = cl(x, 0, 1); return x * x * (3 - 2 * x); }, w = ss((t - L.s) / 0.8) * (1 - ss((t - (L.c - 0.6)) / 0.6));
        return 1 - amt * w * (0.5 - 0.5 * Math.cos((t - L.s) * 2 * Math.PI / 3.2));
    }
    /* a soft glow round the card's shape (a canvas shadow of it, the shape itself drawn off-screen) */
    function halo(g, z, w, h, r, hex, a, soft) {
        if (a <= 0.003) return;
        g.save(); g.shadowColor = hexA(hex, Math.min(1, a)); g.shadowBlur = soft * z * 2; g.shadowOffsetX = 10000; g.translate(-10000 / z, 0);
        g.fillStyle = "#000"; rr(g, w, h, r); g.fill(); g.restore();
    }
    function cas(k, n, u, W, curve) { var O = -W + (100 + W) * curve(u), pos = (k + 0.5) / n * 100, x = cl((O - pos + W) / W, 0, 1); return 0.5 - Math.cos(Math.PI * x) / 2; }
    var outS = function (x) { x = cl(x, 0, 1); return 1 - Math.pow(1 - x, 3); }, inout = function (x) { x = cl(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

    function drawText(g, p, T, t, str, fs, col, d, lay, accent, shine) {
        var lines = String(str).split(/\r|\n/), lh = fs * 1.2, i, j, left = lay.text.left !== null;
        g.font = "600 " + fs + "px Inter, 'Segoe UI', sans-serif";
        var widest = 0;
        for (i = 0; i < lines.length; i++) widest = Math.max(widest, g.measureText(lines[i]).width);
        var fit = Math.min(1, lay.text.avail / Math.max(1, widest), d.h * 0.8 / Math.max(1, lines.length * lh));
        fs *= fit; lh *= fit; g.font = "600 " + fs + "px Inter, 'Segoe UI', sans-serif";
        var x0 = left ? -d.w / 2 + lay.text.left : 0;
        var a = T.text[0], b = T.text[1], c = T.text[2], e = T.text[3], ph = t < c ? "in" : "out", u = ph === "in" ? cl((t - a) / (b - a), 0, 1) : cl((t - c) / (e - c), 0, 1);
        var whole = io(t, a, b, c, e, "out");
        var chars = [], k = 0, word = 0, tw = 0;
        for (i = 0; i < lines.length; i++) {
            var lw = g.measureText(lines[i]).width, x = left ? x0 : -lw / 2, y = -((lines.length - 1) * lh) / 2 + i * lh + fs * 0.35, prev = true;
            tw = Math.max(tw, lw);
            for (j = 0; j < lines[i].length; j++) { var ch = lines[i][j], w = g.measureText(ch).width; if (ch !== " " && prev && chars.length) word++; prev = ch === " "; chars.push({ ch: ch, x: x + w / 2, y: y, w: w, k: k++, word: word }); x += w; }
            word++;
        }
        var n = chars.length, sp = shine ? cl((t - T.shine[0]) / (T.shine[1] - T.shine[0]), 0, 1) : -1, so = -28 + 128 * inout(sp);
        g.save();
        if (p.txt === "rise") { var top = -((lines.length - 1) * lh) / 2 - fs * 0.85, hh = lines.length * lh + fs * 0.1; g.beginPath(); g.rect(-5000, top, 10000, hh); g.clip(); }
        g.textAlign = "center"; g.textBaseline = "alphabetic";
        for (i = 0; i < n; i++) {
            var C = chars[i];
            if (C.ch === " ") continue;
            var hid = 0, dx = 0, dy = 0, op = 1, bl = 0, sc = 1;
            if (p.txt === "track") { hid = 1 - whole; op = whole; dx = (C.x - (left ? x0 : 0)) * 0.07 * hid * 2; bl = hid * fs * 0.12; }
            else if (p.txt === "rise") { dy = (1 - whole) * (lines.length * lh + fs * 0.5); }
            else {
                var words = p.txt === "words", kk = words ? C.word : C.k, nn = words ? word : n, W = { blur: 55, pop: 45, words: 55 }[p.txt] || 40;
                hid = ph === "in" ? 1 - cas(kk, nn, u, W, outS) : cas(kk, nn, u, W, inout);
                op = 1 - hid;
                if (p.txt === "blur") bl = hid * fs * 0.3; else if (p.txt === "pop") sc = 1 - hid; else { dy = hid * fs * 0.35; bl = hid * fs * 0.05; }
            }
            if (op <= 0.01 || sc <= 0.01) continue;
            var fill = col;
            if (sp > 0 && sp < 1) { var pos = (C.k + 0.5) / n * 100, dd = Math.abs(pos - (so + 14)) / 14; if (dd < 1) fill = shine; }
            g.save();
            g.globalAlpha = op;
            if (bl > 0.4) g.filter = "blur(" + bl.toFixed(1) + "px)";
            g.fillStyle = fill;
            g.translate(C.x + dx, C.y + dy); g.scale(sc, sc);
            g.fillText(C.ch, 0, 0);
            g.restore();
        }
        g.restore();
        return { tw: tw, x0: left ? x0 : -tw / 2, bottom: ((lines.length - 1) * lh) / 2 + fs * 0.35 + fs * 0.12, fs: fs };
    }
    function draw(cv, spec, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, CW = cv.clientWidth || 160, CH = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(CW * dpr)), Hc = Math.round(Wc * CH / CW);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var g = cv.getContext("2d");
        g.setTransform(1, 0, 0, 1, 0, 0);
        // a soft backdrop, so glass and light read like they will on footage
        var bg = g.createLinearGradient(0, 0, Wc, Hc); bg.addColorStop(0, "#1a1530"); bg.addColorStop(1, "#0f1a26");
        g.fillStyle = bg; g.fillRect(0, 0, Wc, Hc);
        g.save(); g.globalAlpha = 0.5; g.filter = "blur(" + Math.round(Hc * 0.18) + "px)"; g.fillStyle = "#5b3fd6"; g.beginPath(); g.arc(Wc * 0.25, Hc * 0.3, Hc * 0.35, 0, Math.PI * 2); g.fill(); g.fillStyle = "#0e7490"; g.beginPath(); g.arc(Wc * 0.8, Hc * 0.75, Hc * 0.3, 0, Math.PI * 2); g.fill(); g.restore();
        var S = UK_CARD.PALS[spec.pal], has = function (x) { return UK_CARD.has(spec, x); };
        var d0 = UK_CARD.dims(spec, 1080, { ws: o.ws, hs: o.hs, rd: o.rd }), lay = UK_CARD.layout(spec, d0);
        // like AE's 2D Text Box: the card is the text's box plus padding (shared/cards.js pads)
        var lines = String(o.text || spec.text).split(/\r|\n/), fs0 = d0.fs, wid = 0, li;
        g.font = "600 " + fs0 + "px Inter, 'Segoe UI', sans-serif";
        for (li = 0; li < lines.length; li++) wid = Math.max(wid, g.measureText(lines[li]).width);
        var fit0 = Math.min(1, lay.text.avail / Math.max(1, wid), d0.h * 0.8 / Math.max(1, lines.length * fs0 * 1.2));
        var tw = wid * fit0, fsF = fs0 * fit0, th = fsF / 2 + Math.round(fsF * 1.197) * (lines.length - 1);
        var PD = UK_CARD.pads(spec, d0, lay, tw, th, o.ws);
        var d = { w: PD.w, h: PD.h, u: 1, fs: d0.fs, rd: d0.rd, r: d0.rd >= 0.999 ? Math.min(PD.w, PD.h) / 2 : d0.rd * Math.min(PD.w, PD.h) / 2 };
        lay.text.left = (lay.text.left !== null) ? PD.l : null;
        var dIn = o.inDur || 0.9, hold = o.hold === undefined ? 1.2 : o.hold, dOut = o.outDur || 0.8, T = UK_CARD.times(dIn, hold, dOut), D = T.deco;
        var tt = o.thumb ? dIn + 0.3 : (t % (T.end + 0.5));
        var sz = val(UK_CARD.sizeKeys(spec, d, T), tt), w = sz[0], h = sz[1], r = Math.min(d.r, Math.min(w, h) / 2);
        var acc = o.accent || S.accent, cardC = o.cardColor || S.card, textC = o.textColor || S.text;
        var outline = spec.rev === "outline", OK = outline ? UK_CARD.outlineKeys(T) : null, fillK = outline ? val(OK.fill, tt) / 100 : 1;
        var z = Math.min(Wc * 0.86 / (d.w + 40), Hc * 0.72 / (d.h + 40)), u = 1;
        g.translate(Wc / 2, Hc / 2); g.scale(z, z);
        var deco = io(tt, D[0], D[1], D[2], D[3], "inout");
        if (w > 0.5 && h > 0.5) {
            // shadow (or, glowing looks, a tight halo + a wide bloom that bloom in and breathe), back card
            var LK = lk(T);
            if (has("glow")) {
                var gb = bloom(tt, LK, 1.15), gs2 = val({ k: [[LK.a, 0], [LK.s, 1], [LK.c, 1], [LK.e, 0]], e: ["out", "hold", "~out"] }, tt);
                halo(g, z, w, h, r, acc, gb * 0.72 * breathe(tt, LK, 0.2), 24 + 40 * gs2);
                halo(g, z, w, h, r, acc, gb * 0.92, 6 + 6 * gs2);
            } else { g.save(); g.translate(0, d.h * 0.08); g.filter = "blur(" + Math.max(1, (d.h * 0.3 + 22) * z * 0.5).toFixed(1) + "px)"; g.fillStyle = "rgba(0,0,0," + S.shadow / 100 * fillK + ")"; rr(g, w, h, r); g.fill(); g.restore(); }
            if (has("back")) { var bk = io(tt, D[0], D[1], D[2], D[3], "out"); g.save(); g.translate(18 * bk, 16 * bk); g.rotate(-4 * bk * Math.PI / 180); g.fillStyle = hexA(acc, spec.pal === "glass" ? 0.22 : 0.38); rr(g, w, h, r); g.fill(); g.restore(); }
            // the card and the light inside it
            g.save(); rr(g, w, h, r); g.fillStyle = hexA(cardC, S.fo / 100 * fillK); g.fill(); g.clip();
            // soft gaussian lights (the AE Lights layer): none of them reaches the card's edge with a cut
            if (spec.pal !== "ivory") g.globalCompositeOperation = "screen";
            if (S.aurora) { gauss(g, -d.w * 0.28, d.h * 0.3, d.w * 0.95, d.h * 1.7, "#FF6FD8", 0.75 * fillK); gauss(g, d.w * 0.3, -d.h * 0.25, d.w * 0.85, d.h * 1.6, "#38BDF8", 0.65 * fillK); }
            if (S.rim) gauss(g, 0, -d.h / 2, d.w * 0.72, Math.min(d.h * 0.9, 200), "#FFFFFF", S.rim * 0.42 / 100 * fillK);
            if (has("center")) {
                var an = parseInt(acc.replace("#", ""), 16), ach = [(an >> 16) & 255, (an >> 8) & 255, an & 255], grey = Math.max.apply(null, ach) - Math.min.apply(null, ach) < 38;
                var cop = ((spec.pal === "glass" || spec.pal === "ivory") ? 0.26 : 0.42) * (grey ? 0.62 : 1) * bloom(tt, LK, 1.25) * breathe(tt, LK, 0.18);
                var csc = val({ k: [[LK.a, 0.45], [LK.s, 1], [LK.c, 1], [LK.e, 0.82]], e: ["out", "hold", "~out"] }, tt);
                gauss(g, 0, 0, d.w * 0.78 * csc, d.h * 0.9 * csc, acc, cop);
            }
            if (has("sweep")) {
                var sp = E("inout")(cl((tt - T.sweep[0]) / (T.sweep[1] - T.sweep[0]), 0, 1)), bw = Math.max(70, d.h * 0.8), bb = bw * 0.9 + d.h * 0.6, bx = -d.w / 2 - bb + (d.w + 2 * bb) * sp;
                if (sp > 0 && sp < 1) {
                    var sc2 = spec.pal === "ivory" ? acc : "#FFFFFF", sa = spec.pal === "ivory" ? 0.28 : 0.42, si;
                    g.save(); g.translate(bx, 0); g.rotate(20 * Math.PI / 180);
                    var sg = g.createLinearGradient(-bw / 2, 0, bw / 2, 0);
                    for (si = 0; si <= 10; si++) sg.addColorStop(si / 10, hexA(sc2, sa * Math.exp(-3.6 * Math.pow((si - 5) / 5, 2))));
                    g.fillStyle = sg; g.fillRect(-bw / 2, -d.h * 2, bw, d.h * 4); g.restore();
                }
            }
            g.globalCompositeOperation = "source-over";
            if (has("rim")) {
                // a fine tapered highlight on the top edge
                var rm = Math.max(r, w * 0.14), rx = w / 2 - rm, rgr = g.createLinearGradient(-rx, 0, rx, 0), ra = (spec.pal === "glass" ? 0.9 : 0.75) * deco;
                rgr.addColorStop(0, hexA("#FFFFFF", 0)); rgr.addColorStop(0.5, hexA("#FFFFFF", ra)); rgr.addColorStop(1, hexA("#FFFFFF", 0));
                if (rx > 0) { g.fillStyle = rgr; g.beginPath(); g.moveTo(-rx, -h / 2 + 1); g.quadraticCurveTo(0, -h / 2 + 1 + 3.2, rx, -h / 2 + 1); g.quadraticCurveTo(0, -h / 2 + 1 - 0.4, -rx, -h / 2 + 1); g.fill(); }
            }
            // left details (in their final place; the card opens over them)
            if (lay.bar) { var bh = lay.bar.h * io(tt, D[0], D[1], D[2], D[3], "out"); g.fillStyle = acc; g.save(); g.translate(-d.w / 2 + lay.bar.x, 0); rr(g, lay.bar.w, bh, lay.bar.w / 2); g.fill(); g.restore(); }
            if (lay.badge) {
                var bd = lay.badge.d * io(tt, D[0], D[1], D[2], D[3], "over"), bxp = -d.w / 2 + lay.badge.x;
                g.fillStyle = acc; g.beginPath(); g.arc(bxp, 0, Math.max(0, bd / 2), 0, Math.PI * 2); g.fill();
                var io2 = io(tt, (D[0] + D[1]) / 2, D[1] + 0.1, D[2], D[2] + (D[3] - D[2]) * 0.6, "out");
                g.globalAlpha = io2; g.fillStyle = cardC; g.font = "600 " + Math.round(lay.badge.d * 0.42) + "px Inter, 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(o.index || "01", bxp, 1); g.globalAlpha = 1;
            }
            if (lay.dot) {
                var dxp = -d.w / 2 + lay.dot.x, dsz = lay.dot.d * io(tt, D[0], D[1], D[2], D[3], "over");
                g.fillStyle = acc; g.beginPath(); g.arc(dxp, 0, Math.max(0, dsz / 2), 0, Math.PI * 2); g.fill();
                if (tt > D[1] && tt < T.tO + 0.2) { var pu = ((tt - D[1]) % 1.3) / 1.3, pe = E("out")(pu); g.strokeStyle = hexA(acc, 0.8 * (1 - pe)); g.lineWidth = 1.6; g.beginPath(); g.arc(dxp, 0, lay.dot.d / 2 * (1 + 2.2 * pe), 0, Math.PI * 2); g.stroke(); }
            }
            g.restore();
            // edges
            if (has("inset")) { var ins = Math.max(8, d.h * 0.09); g.save(); g.globalAlpha = deco * 0.55; g.strokeStyle = acc; g.lineWidth = 1.1; rr(g, w - 2 * ins, h - 2 * ins, r - ins); g.stroke(); g.restore(); }
            g.save();
            if (outline) { g.strokeStyle = hexA(acc, 0.85); g.lineWidth = S.border[2] * 1.6; part(g, rrPts(w, h, r), 0, val(OK.draw, tt) / 100); }
            else { g.strokeStyle = hexA(S.border[0], S.border[1] / 100); g.lineWidth = Math.max(1, S.border[2] * 1.3); rr(g, w, h, r); g.stroke(); }
            g.restore();
            if (has("corners")) {
                var ci = Math.max(10, d.h * 0.08), arm = Math.min(Math.min(d.w, d.h) * 0.16, 44), cx2 = d.w / 2 - ci, cy2 = d.h / 2 - ci, q = [[-1, -1], [1, -1], [1, 1], [-1, 1]], k2;
                g.save(); rr(g, w, h, r); g.clip(); g.strokeStyle = acc; g.lineWidth = 2; g.lineCap = "round"; g.lineJoin = "round";
                for (k2 = 0; k2 < 4; k2++) { var sx = q[k2][0], sy = q[k2][1], cp = [[sx * cx2, sy * (cy2 - arm)], [sx * cx2, sy * cy2], [sx * (cx2 - arm), sy * cy2]]; var L2 = 2 * arm * deco; g.beginPath(); g.moveTo(cp[0][0], cp[0][1]); if (L2 <= arm) g.lineTo(cp[0][0], cp[0][1] + sy * L2); else { g.lineTo(cp[1][0], cp[1][1]); g.lineTo(cp[1][0] - sx * (L2 - arm), cp[1][1]); } g.stroke(); }
                g.restore();
            }
            if (has("runner")) {
                var turns = Math.max(1, Math.round((T.tO - D[0]) / 2.6)), off = val({ k: [[D[0], 0], [T.tO + dOut * 0.3, turns]], e: ["soft"] }, tt), ro = io(tt, D[0], D[1], D[2], D[3], "inout");
                if (ro > 0.01) {
                    var pts = rrPts(w, h, r);
                    // a comet: thin tail to a bright head, a white core, a soft glow
                    var NS = 14, cs, s0 = off % 1, seg = 0.22 / NS;
                    g.save(); g.lineCap = "round"; g.globalAlpha = ro; g.shadowColor = acc;
                    for (cs = 0; cs < NS; cs++) {
                        var tp = (cs + 1) / NS, wd = tp < 0.8 ? tp / 0.8 : 1;
                        g.globalAlpha = ro * Math.min(1, 0.15 + wd); g.shadowBlur = 16 * z * wd; g.strokeStyle = acc; g.lineWidth = Math.max(0.3, 3.6 * wd); part(g, pts, s0 + cs * seg, s0 + (cs + 1) * seg + 0.002);
                    }
                    g.shadowBlur = 0;
                    for (cs = 0; cs < NS; cs++) { var tq = (cs + 1) / NS, wq = tq < 0.75 ? tq / 0.75 : 1; g.globalAlpha = ro * wq; g.strokeStyle = hexA("#FFFFFF", 0.9); g.lineWidth = Math.max(0.2, 1.6 * wq); part(g, pts, s0 + cs * seg, s0 + (cs + 1) * seg + 0.002); }
                    g.restore();
                }
            }
            // text (clipped to the card) and its underline
            g.save(); rr(g, w, h, r); g.clip();
            var shineHex = has("shine") ? ((acc.toUpperCase() === textC.toUpperCase()) ? "#FFD98A" : acc) : null;
            var tm = drawText(g, spec, T, tt, o.text || spec.text, d.fs, textC, { w: d.w, h: d0.h }, lay, acc, shineHex);
            if (has("underline")) {
                var U0 = T.text[0] + (T.text[1] - T.text[0]) * 0.4, U1 = T.text[1] + 0.15, U3 = T.text[2] + (T.text[3] - T.text[2]) * 0.7, uv = io(tt, U0, U1, T.text[2], U3, "inout");
                var ul = Math.min(tm.tw * 0.5, lay.text.avail * 0.5), uy = tm.bottom + Math.max(6, tm.fs * 0.22);
                g.strokeStyle = acc; g.lineWidth = 2; g.lineCap = "round"; g.beginPath();
                if (lay.text.left !== null) { g.moveTo(tm.x0, uy); g.lineTo(tm.x0 + ul * uv, uy); } else { g.moveTo(-ul / 2 * uv, uy); g.lineTo(ul / 2 * uv, uy); }
                if (uv > 0.01) g.stroke();
            }
            g.restore();
        }
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
    return { draw: draw, Player: Player };
})();

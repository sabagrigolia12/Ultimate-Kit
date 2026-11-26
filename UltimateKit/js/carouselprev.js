/*  Ultimate Kit - Carousel preview (canvas): six cards placed with the exact rig of jsx/carousel.jsx (ring of
    n, Start Angle + Spin * t, tilt around X then Y) and seen through AE's default comp camera (39.6 deg),
    far cards first.  o: { radius %, start, tiltX, tiltY, spin, size %, ratio % (0 = photo), corner px, upright,
    maxW }                                                                                                    */
var UKCarPrev = (function () {
    var COLS = [["#7C5CFF", "#FF7AB8"], ["#22D3EE", "#3B82F6"], ["#F59E0B", "#EF4444"], ["#10B981", "#A3E635"], ["#F472B6", "#8B5CF6"], ["#FDE68A", "#FB923C"]];
    function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function draw(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(cw * dpr)), H = Math.round(W * ch / cw);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var g = cv.getContext("2d");
        g.fillStyle = "#0B0B10"; g.fillRect(0, 0, W, H);
        var vw = Math.min(W, H * 16 / 9), vh = vw * 9 / 16, ox = (W - vw) / 2, oy = (H - vh) / 2;
        var CW = 1280, k = vw / CW, zoom = (CW / 2) / Math.tan(19.8 * Math.PI / 180), n = 6, i, cards = [];
        var r = (o.radius === undefined ? 50.8 : o.radius) / 100 * CW, sa = (o.start === undefined ? 348 : o.start) + (o.spin || 0) * t;
        var ax = (o.tiltX === undefined ? 82 : o.tiltX) * Math.PI / 180, ay = (o.tiltY === undefined ? 410 : o.tiltY) * Math.PI / 180, size = (o.size === undefined ? 41.6 : o.size) / 100 * CW;
        for (i = 0; i < n; i++) {
            var ang = (sa + i * 360 / n) * Math.PI / 180, px = r * Math.sin(ang), py = 0, pz = r * Math.cos(ang);
            var y1 = py * Math.cos(ax) - pz * Math.sin(ax), z1 = py * Math.sin(ax) + pz * Math.cos(ax); py = y1; pz = z1;
            var x1 = px * Math.cos(ay) + pz * Math.sin(ay), z2 = -px * Math.sin(ay) + pz * Math.cos(ay); px = x1; pz = z2;
            cards.push({ x: px, y: py, z: pz, i: i, a: ang });
        }
        cards.sort(function (a, b) { return b.z - a.z; });       // far (big z, away from the camera) first
        var rt = (o.ratio || 0) / 100, cwr = rt <= 0 ? 1 : (rt <= 1 ? 1 : 1 / rt), chr = rt <= 0 ? 0.62 : (rt <= 1 ? rt : 1);
        for (i = 0; i < cards.length; i++) {
            var c = cards[i], s = zoom / Math.max(1, zoom + c.z), cx = ox + vw / 2 + c.x * s * k, cy = oy + vh / 2 + c.y * s * k;
            var w = size * cwr * s * k, h = size * chr * s * k;
            var cr = Math.min((o.corner || 0) * s * k, w / 2, h / 2);
            g.save(); g.translate(cx, cy); if (o.upright === false) g.rotate(c.a);     // off: the card turns with the ring
            var gr = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2), col = COLS[c.i % COLS.length];
            gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
            g.globalAlpha = 1; g.fillStyle = gr; rr(g, -w / 2, -h / 2, w, h, Math.max(0.5, cr)); g.fill();
            g.fillStyle = "rgba(255,255,255,0.85)"; g.font = "600 " + Math.max(8, Math.round(h * 0.28)) + "px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
            g.fillText(String(c.i + 1), 0, 0); g.restore();
        }
    }
    /* Path Carousel (jsx/carousel.jsx buildPath): the chosen path in its plane (3D: turned 329.6 deg around Y, seen
       by AE's default camera), drawn up to the trim head, and the cards riding it at End - i * Spacing.
       o: { shape, mode 3d|2d, dur, spacing (0 = auto), size %, align % }                                   */
    function shapePts(kind, W, H) {
        var s = W / 1280, k = 0.5523, r;
        switch (kind) {
            case "line": return { v: [[-0.68 * W, 0], [0.68 * W, 0]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], c: false };
            case "arc": return { v: [[-0.66 * W, 0.62 * H], [0, -0.2 * H], [0.66 * W, 0.62 * H]], i: [[0, 0], [-0.3 * W, 0], [-0.12 * W, -0.45 * H]], o: [[0.12 * W, -0.45 * H], [0.3 * W, 0], [0, 0]], c: false };
            case "wave": var v = [], ii = [], oo = [], j;
                for (j = 0; j < 5; j++) { v.push([-0.68 * W + j * 0.34 * W, (j % 2 ? -1 : 1) * 0.13 * H]); ii.push([-0.13 * W, 0]); oo.push([0.13 * W, 0]); }
                ii[0] = [0, 0]; oo[4] = [0, 0]; return { v: v, i: ii, o: oo, c: false };
            case "circle": r = 0.3 * W; return { v: [[0, -r], [r, 0], [0, r], [-r, 0]], i: [[-k * r, 0], [0, -k * r], [k * r, 0], [0, k * r]], o: [[k * r, 0], [0, k * r], [-k * r, 0], [0, -k * r]], c: true };
            default:
                var V = [[-706.286, 406.857], [-292.571, 62.857], [245.715, -6.857], [598.857, -378.286]], I = [[0, 0], [-174.857, 17.143], [-122.286, 40], [-122.286, 2.286]], O = [[0, 0], [174.857, -17.143], [122.285, -40], [122.286, -2.286]];
                var sc = function (a) { return a.map(function (p) { return [p[0] * s * 1.3, p[1] * s * 1.3]; }); };
                return { v: sc(V), i: sc(I), o: sc(O), c: false };
        }
    }
    var cache = {};
    function samples(kind, W, H) {          // ~even arc-length samples, like pointOnPath
        var key = kind + W, S = cache[key]; if (S) return S;
        var sh = shapePts(kind, W, H), segs = sh.c ? sh.v.length : sh.v.length - 1, pts = [], j, u;
        for (j = 0; j < segs; j++) {
            var a = sh.v[j], b = sh.v[(j + 1) % sh.v.length], c1 = [a[0] + sh.o[j][0], a[1] + sh.o[j][1]], c2 = [b[0] + sh.i[(j + 1) % sh.v.length][0], b[1] + sh.i[(j + 1) % sh.v.length][1]];
            for (u = 0; u < 1; u += 0.01) { var m = 1 - u; pts.push([m * m * m * a[0] + 3 * m * m * u * c1[0] + 3 * m * u * u * c2[0] + u * u * u * b[0], m * m * m * a[1] + 3 * m * m * u * c1[1] + 3 * m * u * u * c2[1] + u * u * u * b[1]]); }
        }
        pts.push(sh.c ? pts[0] : sh.v[sh.v.length - 1]);
        var len = [0]; for (j = 1; j < pts.length; j++) len.push(len[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
        S = cache[key] = { pts: pts, len: len, total: len[len.length - 1], closed: sh.c };
        return S;
    }
    function at(S, p) {
        var d = Math.max(0, Math.min(1, p)) * S.total, lo = 0, hi = S.len.length - 1;
        while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (S.len[mid] < d) lo = mid; else hi = mid; }
        var f = (d - S.len[lo]) / Math.max(1e-6, S.len[hi] - S.len[lo]), a = S.pts[lo], b = S.pts[hi], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        var x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, over = S.closed ? 0 : (p > 1 ? p - 1 : (p < 0 ? p : 0));
        // past the ends of an open path: straight on along the end tangent (as the AE expression does)
        return { x: x + Math.cos(ang) * over * S.total, y: y + Math.sin(ang) * over * S.total, ang: ang };
    }
    /* Trim Start, the way out: 0 until 0.835 of the duration, then gently off the slow part, faster, 100 at 1.2 */
    function trimStart(x) {
        if (x <= 0.835) return 0;
        if (x >= 1.2) return 100;
        var u = (x - 0.835) / 0.365;
        return 100 * (u < 0.6 ? 0.55 * Math.pow(u / 0.6, 2.4) : 0.55 + 0.45 * (1 - Math.pow(1 - (u - 0.6) / 0.4, 1.6)));
    }
    /* the user's Trim End: 0 > 34 > 46 > 100 at 0, .211, .835, 1 of the duration, fast - slow - fast */
    function trimEnd(x) {
        var e = function (u, a, b) { u = Math.max(0, Math.min(1, u)); return a + (b - a) * u; };
        if (x <= 0) return 0;
        if (x < 0.211) { var u1 = x / 0.211; return e(1 - Math.pow(1 - u1, 2.2), 0, 34); }
        if (x < 0.835) { var u2 = (x - 0.211) / 0.624; return e(u2 < 0.5 ? 0.5 * Math.pow(u2 * 2, 1.6) : 1 - 0.5 * Math.pow((1 - u2) * 2, 1.6), 34, 46); }
        if (x < 1) { var u3 = (x - 0.835) / 0.165; return e(u3 < 0.5 ? 2 * u3 * u3 : 1 - 2 * (1 - u3) * (1 - u3), 46, 100); }
        return 100;
    }
    function drawPath(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(cw * dpr)), Hc = Math.round(Wc * ch / cw);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var g = cv.getContext("2d"); g.fillStyle = "#0B0B10"; g.fillRect(0, 0, Wc, Hc);
        var vw = Math.min(Wc, Hc * 16 / 9), vh = vw * 9 / 16, ox = (Wc - vw) / 2, oy = (Hc - vh) / 2, CW = 1280, CH = 720, k = vw / CW;   // the real frame: the photos come in from outside it and leave it
        var three = o.mode !== "2d", th = three ? 329.6 * Math.PI / 180 : 0, zoom = (CW / 2) / Math.tan(19.8 * Math.PI / 180);
        var proj = function (x, y, z) { z = z || 0; var X = x * Math.cos(th) + z * Math.sin(th), Z = -x * Math.sin(th) + z * Math.cos(th), s = three ? zoom / (zoom + Z) : 1; return [ox + vw / 2 + X * s * k, oy + vh / 2 + y * s * k, Z]; };
        var ry = three ? (o.rotY || 0) * Math.PI / 180 : 0;   // Rotation Y: every card turns around its own vertical axis
        var S = samples(o.shape || "scurve", CW, CH), D = Math.max(0.3, o.dur || 3.63), cyc = 0.3 + 1.2 * D + 0.8, tt = o.thumb ? 0.3 + D * 0.5 : t % cyc;
        var x01 = (tt - 0.3) / D, end = trimEnd(x01) / 100, start = trimStart(x01) / 100;
        // the line between the trim tail and head
        g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = Math.max(1, 18 * k * 0.8);
        g.beginPath();
        var steps = Math.max(2, Math.round(160 * (end - start))), j;
        for (j = 0; j <= steps; j++) { var a = at(S, start + (end - start) * j / steps), p = proj(a.x, a.y); if (j) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
        if (end - start > 0.001) g.stroke();
        // the cards: End brings them in (each starts just outside the path's start), Start takes them out
        var n = 6, gap = (o.spacing > 0 ? o.spacing : 100 / n) / 100, size = (o.size === undefined ? 22 : o.size) / 100 * CW, cards = [], i;
        var pre = S.closed ? 0 : 0.75 * size / S.total;
        for (i = 0; i < n; i++) {
            var raw = end - i * gap - pre * (1 - end) + start * ((n - 1) * gap + 0.6), q = S.closed ? raw - Math.floor(raw) : raw;
            var vis = S.closed ? Math.max(0, Math.min(1, (end - i * gap) / 0.02)) * (1 - start) : 1;
            if (vis <= 0) continue;
            var pt = at(S, q), rot = pt.ang * (o.align || 0) / 100, w = size, h = size * 0.6, cs = Math.cos(rot), sn = Math.sin(rot);
            var corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(function (c) { var lx = c[0] * Math.cos(ry), lz = -c[0] * Math.sin(ry); return proj(pt.x + lx * cs - c[1] * sn, pt.y + lx * sn + c[1] * cs, lz); });
            cards.push({ c: corners, z: (corners[0][2] + corners[2][2]) / 2, i: i, a: vis });
        }
        cards.sort(function (x, y) { return y.z - x.z; });
        for (i = 0; i < cards.length; i++) {
            var C = cards[i].c, col = COLS[cards[i].i % COLS.length], gr = g.createLinearGradient(C[0][0], C[0][1], C[2][0], C[2][1]);
            gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
            g.globalAlpha = cards[i].a; g.fillStyle = gr;
            g.beginPath(); g.moveTo(C[0][0], C[0][1]); g.lineTo(C[1][0], C[1][1]); g.lineTo(C[2][0], C[2][1]); g.lineTo(C[3][0], C[3][1]); g.closePath(); g.fill();
        }
        g.globalAlpha = 1;
    }
    /* Card Spin (jsx/carousel.jsx buildCardSpin, shared/cardspin.js): the first card jumps up from under the frame,
       holds, sets off left slowly and faster, the stream pours in from the right and races past (motion blur: faint
       copies along the move), leaves; the last card comes in slowing down to the middle and scales away. Everything
       through the lens warp. A 1080 x 1920 frame (like the reference) in the middle of the canvas.  o: UK_CSPIN.DEF */
    function drawCardSpin(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(cw * dpr)), Hc = Math.round(Wc * ch / cw);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var g = cv.getContext("2d"); g.fillStyle = "#0B0B10"; g.fillRect(0, 0, Wc, Hc);
        var c = {}, k; for (k in UK_CSPIN.DEF) c[k] = UK_CSPIN.DEF[k]; for (k in o) if (UK_CSPIN.DEF[k] !== undefined && o[k] !== undefined) c[k] = Number(o[k]);
        var CWd = 1080, CHd = 1920, sk = Hc / CHd, ox = (Wc - CWd * sk) / 2;
        g.fillStyle = "#15151B"; g.fillRect(ox, 0, CWd * sk, Hc);
        var TT = UK_CSPIN.times(c), tt = o.thumb ? UK_CSPIN.POP + c.hold * 0.5 : t % (TT.end + 0.6);
        var G = UK_CSPIN.geo(c, CWd, CHd), F = UK_CSPIN.distance(c, G), K = UK_CSPIN.count(c, G), fd = 1 / 30;
        var d = UK_CSPIN.travel(tt, c, G), v = Math.abs(d - UK_CSPIN.travel(tt - fd, c, G)), blur = c.blur / 100 * v * UK_CSPIN.BLUR;
        var lift = UK_CSPIN.liftAt(tt, G, CHd), vl = Math.abs(lift - UK_CSPIN.liftAt(tt - fd, G, CHd)) * c.blur / 100 * UK_CSPIN.BLUR;
        var out = UK_CSPIN.outScale(tt, c);
        var bx = CWd / 2, by = G.y0, rx = Math.max(CWd * UK_CSPIN.LENS_RX, G.w * 2.2), ry = G.h * UK_CSPIN.LENS_RY, kw = c.warp / 100;
        var P = function (x, y) { var q = UK_CSPIN.lens(x - bx, y - by, rx, ry, kw); return [ox + (bx + q[0]) * sk, (by + q[1]) * sk]; };
        var list = [{ x: F - d, y: G.y0, s: out * UK_CSPIN.placeScale(1, F - d, CWd), n: 6, col: COLS[5] }];
        for (var j = 0; j < K; j++) {
            if (!UK_CSPIN.inStream(j, G, F)) continue;
            var x0 = UK_CSPIN.start(j, G) - d;
            if (x0 < -CWd || x0 > CWd) continue;
            list.push({ x: x0, y: (j % 2 ? G.y1 : G.y0) + (j === 0 ? lift : 0), s: UK_CSPIN.placeScale(j, x0, CWd), n: j % 6 + 1, col: COLS[j % COLS.length], j: j });
        }
        g.save(); g.beginPath(); g.rect(ox, 0, CWd * sk, Hc); g.clip();
        for (var q = list.length - 1; q >= 0; q--) {
            var cd = list[q], cxj = CWd / 2 + cd.x, cyj = cd.y, hw = G.w / 2 * cd.s, hh = G.h / 2 * cd.s;
            if (hw < 0.5) continue;
            var bxl = blur, byl = cd.j === 0 ? vl : 0, copies = (bxl > 2 || byl > 2) ? 5 : 1;
            for (var m = 0; m < copies; m++) {
                var f = copies > 1 ? (m / (copies - 1) - 0.5) : 0, dx = f * bxl, dy = f * byl, pts = [], q2;
                for (q2 = 0; q2 <= 8; q2++) pts.push(P(cxj + dx - hw + 2 * hw * q2 / 8, cyj + dy - hh));
                for (q2 = 1; q2 <= 8; q2++) pts.push(P(cxj + dx + hw, cyj + dy - hh + 2 * hh * q2 / 8));
                for (q2 = 1; q2 <= 8; q2++) pts.push(P(cxj + dx + hw - 2 * hw * q2 / 8, cyj + dy + hh));
                for (q2 = 1; q2 < 8; q2++) pts.push(P(cxj + dx - hw, cyj + dy + hh - 2 * hh * q2 / 8));
                var c0 = P(cxj + dx, cyj + dy), a0 = P(cxj + dx - hw, cyj + dy - hh), a1 = P(cxj + dx + hw, cyj + dy + hh);
                var gr = g.createLinearGradient(a0[0], a0[1], a1[0], a1[1]); gr.addColorStop(0, cd.col[0]); gr.addColorStop(1, cd.col[1]);
                g.globalAlpha = copies > 1 ? 0.3 : 1; g.fillStyle = gr; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
                for (q2 = 1; q2 < pts.length; q2++) g.lineTo(pts[q2][0], pts[q2][1]);
                g.closePath(); g.fill();
                if (copies === 1 || m === 2) {
                    var hgt = Math.abs(P(cxj + dx, cyj + dy + hh)[1] - P(cxj + dx, cyj + dy - hh)[1]);
                    g.globalAlpha = 0.9; g.fillStyle = "#fff"; g.font = "600 " + Math.max(6, Math.round(hgt * 0.3)) + "px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(cd.n), c0[0], c0[1]);
                }
            }
        }
        g.restore(); g.globalAlpha = 1;
    }
    /* Photo Burst (jsx/carousel.jsx buildBurst, shared/burst.js): small cards shoot up, gather, pour out towards the
       camera; the white last card follows. A 1920 x 1080 frame (like the reference).  o: UK_BURST.DEF */
    function drawBurst(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(cw * dpr)), Hc = Math.round(Wc * ch / cw);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var g = cv.getContext("2d"); g.fillStyle = "#0B0B10"; g.fillRect(0, 0, Wc, Hc);
        var c = {}, k; for (k in UK_BURST.DEF) c[k] = UK_BURST.DEF[k]; for (k in o) if (UK_BURST.DEF[k] !== undefined && o[k] !== undefined) c[k] = Number(o[k]);
        var CWd = 1920, CHd = 1080, sk = Math.min(Wc / CWd, Hc / CHd), ox = (Wc - CWd * sk) / 2, oy = (Hc - CHd * sk) / 2;
        g.fillStyle = "#15151B"; g.fillRect(ox, oy, CWd * sk, CHd * sk);
        var n = c.count > 0 ? Math.round(c.count) : 24, v = Math.max(1, c.speed) / 100, sp = Math.max(0, c.spacing) / 100;
        var e0n = UK_BURST.launch(n, n, c), end = (n * UK_BURST.DT * sp + c.lag) / v + UK_BURST.card(n, e0n, c, CWd, CHd, true).T / v;
        var tt = o.thumb ? 1.15 : t % (end + 0.5), cp = UK_BURST.px(c, CWd, CHd), list = [];
        for (var i = 0; i <= n; i++) {
            var last = i === n, e0 = UK_BURST.launch(i, n, c), K = UK_BURST.card(i, e0, c, CWd, CHd, last);
            var tl = last ? e0 + v * tt - (n * UK_BURST.DT * sp + c.lag) : e0 * (1 - sp) + v * tt;
            if (tl - e0 <= 0 || tl - e0 >= K.T) continue;
            var S = UK_BURST.at(K, tl - e0);
            list[last ? "unshift" : "push"]({ x: CWd / 2 + (S.x - CWd / 2) * c.spread / 100, y: S.y, s: S.s / 100 * cp, r: S.r * c.rotation / 100 * Math.PI / 180, last: last, n: i % 6 + 1, col: COLS[i % COLS.length] });
        }
        g.save(); g.beginPath(); g.rect(ox, oy, CWd * sk, CHd * sk); g.clip();
        for (var q = list.length - 1; q >= 0; q--) {           // the first card over the later ones, the last card on top of all
            var cd = list[q], hs = cd.s / 2 * sk;
            g.save(); g.translate(ox + cd.x * sk, oy + cd.y * sk); g.rotate(cd.r);
            g.shadowColor = "rgba(0,0,0,0.45)"; g.shadowBlur = hs * 0.5; g.shadowOffsetX = -hs * 0.2; g.shadowOffsetY = hs * 0.2;
            if (cd.last) g.fillStyle = "#F4F4F6";
            else { var gr = g.createLinearGradient(-hs, -hs, hs, hs); gr.addColorStop(0, cd.col[0]); gr.addColorStop(1, cd.col[1]); g.fillStyle = gr; }
            rr(g, -hs, -hs, hs * 2, hs * 2, hs * 0.16); g.fill();
            g.shadowColor = "transparent";
            if (!cd.last && hs > 4) { g.globalAlpha = 0.9; g.fillStyle = "#fff"; g.font = "600 " + Math.round(hs * 0.8) + "px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(cd.n), 0, hs * 0.05); g.globalAlpha = 1; }
            g.restore();
        }
        g.restore();
    }
    /* Sphere Carousel (jsx/carousel.jsx buildSphere, shared/sphere.js): numbered cards on the ball, facing the camera
       with their random tilt; the entry, then the ball turning from card to card along the default Focus keys.
       A 1080 x 1920 frame.  o: UK_SPHERE.DEF (+ thumb, maxW) */
    function sphEase(x) {          // a Focus turn: keys with speed 0, out influence 40 %, in influence 85 %
        var a = UK_SPHERE.EASE_OUT / 100, b = 1 - UK_SPHERE.EASE_IN / 100, lo = 0, hi = 1, u = 0.5;
        for (var q = 0; q < 22; q++) { u = (lo + hi) / 2; var m = 1 - u, xu = 3 * m * m * u * a + 3 * m * u * u * b + u * u * u; if (xu < x) lo = u; else hi = u; }
        return 3 * (1 - u) * u * u + u * u * u;
    }
    function drawSphere(cv, t, o) {
        var S = UK_SPHERE, dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(cw * dpr)), Hc = Math.round(Wc * ch / cw);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var g = cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#0B0B10"; g.fillRect(0, 0, Wc, Hc);
        var CWd = 1080, CHd = 1920, k = Math.min(Wc / CWd, Hc / CHd), ox = (Wc - CWd * k) / 2, oy = (Hc - CHd * k) / 2;
        g.fillStyle = "#050507"; g.fillRect(ox, oy, CWd * k, CHd * k);
        var c = {}, kk; for (kk in S.DEF) c[kk] = S.DEF[kk]; for (kk in o) if (S.DEF[kk] !== undefined && o[kk] !== undefined) c[kk] = Number(o[kk]);
        var n = Math.max(1, Math.min(S.MAX, c.count > 0 ? Math.round(c.count) : 12));
        var cardW = CWd * 0.5 * c.size / 100, cardH = cardW * S.CH / S.CW, R = S.R * cardW * c.distance / 100, D = CWd * S.ZOOM;
        var keys = S.focusKeys(n, 99), endT = keys[keys.length - 1][0] + S.HOLD + 0.3;
        var tt = o.thumb ? S.ENTRY + 0.1 : t % Math.min(endT, 6);
        // Focus at tt: from the keys (a turn eased like the AE keys)
        var a = 0, b = 0, p = 0, i;
        for (i = 0; i < keys.length - 1; i++) if (tt >= keys[i][0] && tt < keys[i + 1][0]) { a = keys[i][1] - 1; b = keys[i + 1][1] - 1; p = a === b ? 0 : sphEase((tt - keys[i][0]) / (keys[i + 1][0] - keys[i][0])); }
        if (tt >= keys[keys.length - 1][0]) { a = b = keys[keys.length - 1][1] - 1; }
        var AE = [], E = Math.min(1, tt / S.ENTRY); E = 1 - Math.pow(1 - E, 3);
        for (i = 0; i < n; i++) AE.push(S.azel(S.dir(i, n)));
        var dA = AE[b][0] - AE[a][0]; dA = ((dA % 360) + 540) % 360 - 180;
        var ya = (AE[a][0] + dA * p) * Math.PI / 180, pa = (AE[a][1] + (AE[b][1] - AE[a][1]) * p) * Math.PI / 180;
        var list = [];
        for (i = 0; i < n; i++) {
            var d = S.dir(i, n), m = i === 0 ? 1 : 1 + (1 - E) * 0.9, v = [d[0] * R * m, d[1] * R * m, d[2] * R * m];
            var x = v[0] * Math.cos(ya) + v[2] * Math.sin(ya), z = -v[0] * Math.sin(ya) + v[2] * Math.cos(ya), y = v[1];
            var yy = (y * Math.cos(pa) - z * Math.sin(pa)) * S.CH / S.CW, zz = (y * Math.sin(pa) + z * Math.cos(pa)) * S.DEPTH;
            var depth = zz + R * S.DEPTH;                       // from the front plane (z = 0 at the front card)
            if (depth <= -D * 0.9) continue;
            var face = Math.max(0, Math.min(1, -zz / S.DEPTH / Math.max(1, Math.sqrt(x * x + yy * yy + zz * zz / (S.DEPTH * S.DEPTH))) * 2.5 + 0.6));
            var al = (i === 0 ? 1 : E) * face;
            if (al <= 0.01) continue;
            list.push({ i: i, x: x, y: yy, z: depth, al: al, tl: S.tilt(i) });
        }
        list.sort(function (u, w) { return w.z - u.z; });       // far first
        g.save(); g.beginPath(); g.rect(ox, oy, CWd * k, CHd * k); g.clip();
        var proj = function (X, Y, Z) { var s = D / (D + Z); return [ox + (CWd / 2 + X * s) * k, oy + (CHd / 2 + Y * s) * k]; };
        for (i = 0; i < list.length; i++) {
            var L = list[i], tl = [L.tl[0] * c.tilt / 100 * Math.PI / 180, L.tl[1] * c.tilt / 100 * Math.PI / 180, L.tl[2] * c.tilt / 100 * Math.PI / 180];
            var pts = [[-cardW / 2, -cardH / 2], [cardW / 2, -cardH / 2], [cardW / 2, cardH / 2], [-cardW / 2, cardH / 2]].map(function (q) {
                var px = q[0], py = q[1], pz = 0, t1;
                t1 = py * Math.cos(tl[0]) - pz * Math.sin(tl[0]); pz = py * Math.sin(tl[0]) + pz * Math.cos(tl[0]); py = t1;       // X
                t1 = px * Math.cos(tl[1]) + pz * Math.sin(tl[1]); pz = -px * Math.sin(tl[1]) + pz * Math.cos(tl[1]); px = t1;      // Y
                t1 = px * Math.cos(tl[2]) - py * Math.sin(tl[2]); py = px * Math.sin(tl[2]) + py * Math.cos(tl[2]); px = t1;       // Z
                return proj(L.x + px, L.y + py, L.z + pz);
            });
            var col = COLS[L.i % COLS.length], gr = g.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]);
            gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
            g.globalAlpha = L.al; g.fillStyle = gr; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
            for (var q2 = 1; q2 < 4; q2++) g.lineTo(pts[q2][0], pts[q2][1]);
            g.closePath(); g.fill();
            var cx = (pts[0][0] + pts[2][0]) / 2, cy = (pts[0][1] + pts[2][1]) / 2, hh = Math.abs(pts[3][1] - pts[0][1]);
            g.fillStyle = "rgba(255,255,255,0.9)"; g.font = "700 " + Math.max(6, Math.round(hh * 0.28)) + "px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
            g.fillText(String((L.i % n) + 1), cx, cy);
        }
        g.restore(); g.globalAlpha = 1;
    }
    /* Card Swap (jsx/carousel.jsx buildSwap, shared/swap.js): the big card in the middle swapped by the chosen
       transition (the same keys as in AE), a 1080 x 1920 frame.  o: UK_SWAP.DEF (+ thumb, maxW) */
    function drawSwap(cv, t, o) {
        var S = UK_SWAP, dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(cw * dpr)), Hc = Math.round(Wc * ch / cw);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var g = cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = "#0B0B10"; g.fillRect(0, 0, Wc, Hc);
        var CWd = 1080, CHd = 1920, k = Math.min(Wc / CWd, Hc / CHd), ox = (Wc - CWd * k) / 2, oy = (Hc - CHd * k) / 2;
        g.fillStyle = "#050507"; g.fillRect(ox, oy, CWd * k, CHd * k);
        var c = {}, kk; for (kk in S.DEF) c[kk] = S.DEF[kk]; for (kk in o) if (S.DEF[kk] !== undefined && o[kk] !== undefined) c[kk] = kk === "random" ? !!o[kk] : Number(o[kk]);
        c.hold = Math.max(0, c.hold); c.dur = Math.max(0.07, c.dur);
        var n = Math.max(1, Math.min(S.MAX, c.count > 0 ? Math.round(c.count) : 6)), P = S.plan(c, n, c.seed || 1), cd = S.card(c, CWd, CHd);
        var tt = o.thumb ? c.dur + c.hold * 0.5 + (c.hold + c.dur) : t % (S.total(c, n) + 0.4);
        g.save(); g.beginPath(); g.rect(ox, oy, CWd * k, CHd * k); g.clip();
        for (var j = 0; j < n; j++) {               // the later card on top
            var s = S.at(S.keys(j, n, P, c, CWd, CHd), tt);
            if (s.o <= 0.5) continue;
            var w = cd.w * s.s / 100 * k, h = cd.h * s.s / 100 * k, fx = Math.cos(s.ry * Math.PI / 180);
            if (Math.abs(fx) < 0.02) continue;
            g.save(); g.translate(ox + s.x * k, oy + s.y * k); g.rotate(s.r * Math.PI / 180); g.scale(fx, 1);
            if (s.ry) { var sk = Math.sin(s.ry * Math.PI / 180) * 0.12; g.transform(1, sk, 0, 1, 0, 0); }      // (a hint of the 3D turn)
            g.globalAlpha = s.o / 100;
            var col = COLS[j % COLS.length], gr = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
            g.fillStyle = gr; rr(g, -w / 2, -h / 2, w, h, Math.max(1, S.CORNER / S.CW * w)); g.fill();
            g.fillStyle = "rgba(255,255,255,0.9)"; g.font = "700 " + Math.max(6, Math.round(w * 0.32)) + "px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
            g.fillText(String(j + 1), 0, 0);
            g.restore();
        }
        g.restore(); g.globalAlpha = 1;
    }
    /* Card Deck (jsx/carousel.jsx buildDeck, shared/deck.js): the deck, the front card dropping behind the mask edge
       (the same keys as in AE), a 1080 x 1920 frame.  o: UK_DECK.DEF (+ thumb, maxW) */
    function drawDeck(cv, t, o) {
        var S = UK_DECK, dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(cw * dpr)), Hc = Math.round(Wc * ch / cw);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var g = cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = "#0B0B10"; g.fillRect(0, 0, Wc, Hc);
        var CWd = 1080, CHd = 1920, k = Math.min(Wc / CWd, Hc / CHd), ox = (Wc - CWd * k) / 2, oy = (Hc - CHd * k) / 2;
        g.fillStyle = "#050507"; g.fillRect(ox, oy, CWd * k, CHd * k);
        var c = {}, kk; for (kk in S.DEF) c[kk] = S.DEF[kk]; for (kk in o) if (S.DEF[kk] !== undefined && o[kk] !== undefined) c[kk] = Number(o[kk]);
        c.hold = Math.max(0, c.hold); c.dur = Math.max(0.07, c.dur); c.dir = Math.max(1, Math.min(8, Math.round(c.dir) || 1));
        var n = Math.max(1, Math.min(S.MAX, c.count > 0 ? Math.round(c.count) : 6)), cd = S.card(c, CWd, CHd);
        var tt = o.thumb ? S.ENTRY + c.hold * 0.5 : t % (S.total(c, n) + 0.4);
        /* the frame, cut by the mask edge (the deck's side of the line) */
        var E = S.edge(c, CWd, CHd), e = E.e, p = E.p, tv = [-e[1], e[0]], B = 4000;
        var P = function (x, y) { return [ox + x * k, oy + y * k]; };
        g.save(); g.beginPath(); g.rect(ox, oy, CWd * k, CHd * k); g.clip();
        var q1 = P(p[0] + tv[0] * B, p[1] + tv[1] * B), q2 = P(p[0] - tv[0] * B, p[1] - tv[1] * B), q3 = P(p[0] - tv[0] * B - e[0] * B, p[1] - tv[1] * B - e[1] * B), q4 = P(p[0] + tv[0] * B - e[0] * B, p[1] + tv[1] * B - e[1] * B);
        g.beginPath(); g.moveTo(q1[0], q1[1]); g.lineTo(q2[0], q2[1]); g.lineTo(q3[0], q3[1]); g.lineTo(q4[0], q4[1]); g.closePath(); g.clip();
        for (var j = n - 1; j >= 0; j--) {               // the back first, the front card on top
            var s = S.at(S.keys(j, n, c, CWd, CHd), tt);
            if (s.o <= 0.5) continue;
            var w = cd.w * s.s / 100 * k, h = cd.h * s.s / 100 * k, cx = ox + s.x * k, cy = oy + s.y * k;
            g.globalAlpha = s.o / 100;
            var col = COLS[j % COLS.length], gr = g.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
            g.fillStyle = gr; rr(g, cx - w / 2, cy - h / 2, w, h, Math.max(1, S.CORNER / S.CW * w)); g.fill();
            g.fillStyle = "rgba(255,255,255,0.9)"; g.font = "700 " + Math.max(6, Math.round(h * 0.42)) + "px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
            g.fillText(String(j + 1), cx, cy);
        }
        g.restore(); g.globalAlpha = 1;
    }
    /* Focus Carousel (jsx/carousel.jsx buildFocus, shared/focus.js): the row of cards, the Focus card in the middle (the same keys as
       in AE), drawn flat and then through the precomp layer's Bezier Warp (top and bottom edges as curves, column by column), 1920 x 1080 */
    var focusFlat = null;
    function drawFocus(cv, t, o) {
        var F = UK_FOCUS, dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(cw * dpr)), Hc = Math.round(Wc * ch / cw);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var g = cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = "#0B0B10"; g.fillRect(0, 0, Wc, Hc);
        var FW = F.REF.W, FH = F.REF.H, k = Math.min(Wc / FW, Hc / FH), fw = Math.max(2, Math.round(FW * k)), fh = Math.max(2, Math.round(FH * k)), ox = (Wc - fw) / 2, oy = (Hc - fh) / 2;
        var n = Math.max(1, Math.min(F.MAX, o.count > 0 ? Math.round(o.count) : 4)), K = F.keys(n, !!o.random, o.seed || 1);
        var tt = o.thumb ? K[Math.min(1, K.length - 1)].t * 0.55 : t % (F.total(n) + 1.2), f = F.at(K, tt);
        if (!focusFlat) focusFlat = document.createElement("canvas");
        var fc = focusFlat; if (fc.width !== fw || fc.height !== fh) { fc.width = fw; fc.height = fh; }
        var q = fc.getContext("2d"); q.setTransform(1, 0, 0, 1, 0, 0); q.fillStyle = "#050507"; q.fillRect(0, 0, fw, fh);
        var nx = FW / 2 - (f - 1) * F.GAP, cwk = F.CARD[0] * k, chk = F.CARD[1] * k;
        for (var i = 0; i < n; i++) {
            var cx = (nx + i * F.GAP) * k, cy = FH / 2 * k;
            if (cx + cwk < 0 || cx - cwk > fw) continue;
            var col = F.COLS[i % F.COLS.length], rgb = "rgb(" + Math.round(col[0] * 255) + "," + Math.round(col[1] * 255) + "," + Math.round(col[2] * 255) + ")";
            q.fillStyle = rgb; rr(q, cx - cwk / 2, cy - chk / 2, cwk, chk, F.CORNER * k); q.fill();
            q.fillStyle = "rgba(255,255,255,0.95)"; q.font = "700 " + Math.max(6, Math.round(230 * k * 0.72)) + "px system-ui, sans-serif"; q.textAlign = "center"; q.textBaseline = "middle";
            q.fillText(String(i + 1), cx, cy);
        }
        /* the warp: each column of the flat frame between the warped top and bottom edges */
        var W = F.WARP, bz = function (a, b, c, d, u) { var m = 1 - u; return m * m * m * a + 3 * m * m * u * b + 3 * m * u * u * c + u * u * u * d; };
        var cols = Math.max(24, Math.round(fw / 3));
        for (var s = 0; s < cols; s++) {
            var u = (s + 0.5) / cols, sx0 = s / cols * fw, sw = fw / cols + 0.6;
            var tx = bz(W[0][0], W[1][0], W[2][0], W[3][0], u), ty = bz(W[0][1], W[1][1], W[2][1], W[3][1], u);
            var bx = bz(W[9][0], W[8][0], W[7][0], W[6][0], u), by = bz(W[9][1], W[8][1], W[7][1], W[6][1], u);
            var dx = (tx + bx) / 2 / FW * fw - sw / 2;
            g.drawImage(fc, sx0, 0, fw / cols, fh, ox + dx, oy + ty / FH * fh, sw, (by - ty) / FH * fh);
        }
    }
    function Player(cv) { this.cv = cv; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (o) { if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) { if (!self.running) return; self.t += Math.min(0.1, (now - last) / 1000); last = now; if (document.body.contains(self.cv)) (self.o.look === "path" ? drawPath : (self.o.look === "cardspin" ? drawCardSpin : (self.o.look === "burst" ? drawBurst : (self.o.look === "sphere" ? drawSphere : (self.o.look === "swap" ? drawSwap : (self.o.look === "deck" ? drawDeck : (self.o.look === "focus" ? drawFocus : draw)))))))(self.cv, self.t, self.o); requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, drawPath: drawPath, drawCardSpin: drawCardSpin, drawBurst: drawBurst, drawSphere: drawSphere, drawSwap: drawSwap, drawDeck: drawDeck, drawFocus: drawFocus, Player: Player };
})();

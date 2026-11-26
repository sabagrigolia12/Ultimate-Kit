/*  Ultimate Kit - Underline strokes (UK_UL). Shared by the panel preview and ExtendScript, so ES3 only.
    build(id, r, fs) -> { rot, pivot, behind, rough, strokes: [...] }
      r      the text box { left, top, width, height } in the text layer's space (y down)
      fs     font size (px); stroke widths and gaps follow it
      pivot  where the stroke layer sits (its Position, in the same space as r)
      rot    the layer's Rotation in degrees (tilted looks keep their tilt as a real rotation)
      behind true = the layer goes under the text (highlighters)
      rough  brush looks: { border, scale, stretch } for Roughen Edges on the layer (px / %)
    stroke: { pts: [[x, y]...] relative to the pivot, smooth (Catmull-Rom) or straight polyline,
              closed, w (px), delay / dur (fractions of the draw time), op (%), rot (group rotation),
              center (draws from its middle out to both ends),
              taper [start length %, end length %, start width %, end width %, start ease, end ease]
              (AE stroke Taper, measured on the drawn part - pointed brush / pen tips) }           */
var UK_UL = (function () {
    function line(x0, x1, y) { return [[x0, y || 0], [x1, y || 0]]; }
    function S(pts, o) {
        var s = { pts: pts, smooth: true, closed: false, w: 0, delay: 0, dur: 1, op: 100, rot: 0, center: false, taper: null }, k;
        if (o) for (k in o) s[k] = o[k];
        return s;
    }
    /* taper: lengths in % of the drawn stroke, widths in % of the stroke width (0 = sharp point) */
    function TP(sl, el, sw, ew, se, ee) { return [sl, el, sw || 0, ew || 0, (se === undefined) ? 40 : se, (ee === undefined) ? 40 : ee]; }
    /* a quick hand-drawn loop around the box: starts upper-left, goes round once and overshoots */
    function loop(rx, ry, turns, tilt, wob, n) {
        var p = [], i, c = Math.cos(tilt), s = Math.sin(tilt);
        for (i = 0; i <= n; i++) {
            var u = i / n, a = -Math.PI * 0.78 + u * Math.PI * 2 * turns, g = 0.95 + u * 0.1 + Math.sin(a * 2 + 0.7) * wob;
            var ex = Math.cos(a) * rx * g, ey = Math.sin(a) * ry * g * (1 + 0.05 * Math.cos(a));
            p.push([ex * c - ey * s, ex * s + ey * c]);
        }
        return p;
    }
    function ellipse(rx, ry, n) {
        var p = [], i;
        for (i = 0; i <= n; i++) { var a = -Math.PI * 0.75 + i / n * Math.PI * 2; p.push([Math.cos(a) * rx, Math.sin(a) * ry]); }
        return p;
    }
    /* rounded rectangle, starting at the middle of the top edge, clockwise */
    function rbox(w, h, rad) {
        var p = [], hw = w / 2, hh = h / 2, n = 6;
        rad = Math.min(rad, hw, hh);
        function arc(cx, cy, a0) { for (var j = 0; j <= n; j++) { var a = a0 + j / n * Math.PI / 2; p.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } }
        p.push([0, -hh]);
        arc(hw - rad, -hh + rad, -Math.PI / 2);
        arc(hw - rad, hh - rad, 0);
        arc(-hw + rad, hh - rad, Math.PI / 2);
        arc(-hw + rad, -hh + rad, Math.PI);
        p.push([0, -hh]);
        return p;
    }
    /* one corner bracket (sx, sy = which corner, -1 / 1): arm - corner - arm; rad > 0 rounds the corner */
    function corner(sx, sy, bw, bh, arm, rad) {
        var p = [[sx * bw, sy * (bh - arm)]], j;
        if (rad > 0) {
            var cx = sx * (bw - rad), cy = sy * (bh - rad), a0 = Math.atan2(0, sx), a1 = Math.atan2(sy, 0);
            // quarter arc from the vertical arm to the horizontal one
            for (j = 0; j <= 8; j++) { var t = j / 8, a = a0 + (a1 - a0 > Math.PI ? a1 - a0 - 2 * Math.PI : (a1 - a0 < -Math.PI ? a1 - a0 + 2 * Math.PI : a1 - a0)) * t; p.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
        } else p.push([sx * bw, sy * bh]);
        p.push([sx * (bw - arm), sy * bh]);
        return p;
    }
    /* a short straight mark from r0 to r1 out of (ox, oy) at angle a (deg) */
    function ray(ox, oy, a, r0, r1) { var c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return [[ox + c * r0, oy + s * r0], [ox + c * r1, oy + s * r1]]; }
    /* arrowhead at e, pointing along p -> e: wing - tip - wing */
    function head(e, p, len, ang) {
        var dx = e[0] - p[0], dy = e[1] - p[1], l = Math.sqrt(dx * dx + dy * dy) || 1, a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        dx /= l; dy /= l;
        return [[e[0] + (-dx * c + dy * s) * len, e[1] + (-dx * s - dy * c) * len], e, [e[0] + (-dx * c - dy * s) * len, e[1] + (dx * s - dy * c) * len]];
    }
    function build(id, r, fs) {
        var L = r.left, T = r.top, W = Math.max(r.width, fs), H = Math.max(r.height, fs * 0.7), B = T + H, cx = L + W / 2, cy = T + H / 2;
        var sw = Math.max(3, Math.round(fs * 0.08)), g = fs * 0.22, o = { rot: 0, behind: false, rough: null, strokes: [] }, i, p;
        var ext = fs * 0.06, bw, bh, arm, q = [[-1, -1], [1, -1], [1, 1], [-1, 1]], ang, e;
        switch (id) {
            /* ---- lines */
            case "ul01": o.pivot = [cx, B + g]; o.strokes = [S(line(-W / 2 - ext, W / 2 + ext), { smooth: false })]; break;
            case "ul02": o.pivot = [cx, B + g * 0.9];
                o.strokes = [S(line(-W / 2 - ext, W / 2 + ext), { smooth: false, dur: 0.7 }), S(line(-W * 0.42, W * 0.42, fs * 0.2), { smooth: false, delay: 0.35, dur: 0.65, w: sw * 0.8 })]; break;
            case "ul03": o.pivot = [cx, B + g * 1.1];
                o.strokes = [S([[-W / 2 - ext, fs * 0.12], [-W * 0.15, fs * 0.17], [W * 0.2, fs * 0.08], [W / 2 + fs * 0.1, -fs * 0.13]])]; break;
            case "ul04": o.pivot = [cx, B + g * 1.1]; p = [];
                var nw = Math.max(2, Math.round(W / (fs * 0.85))), n = nw * 6;
                for (i = 0; i <= n; i++) p.push([-W / 2 - ext + (W + 2 * ext) * i / n, Math.sin(i / n * nw * Math.PI * 2) * fs * 0.075]);
                o.strokes = [S(p)]; break;
            case "ul05": o.pivot = [cx, B + g]; o.strokes = [S(line(-W / 2 - ext, W / 2 + ext), { smooth: false, center: true })]; break;
            case "ul06": o.pivot = [cx, T + H * 0.76]; o.behind = true;
                o.strokes = [S(line(-W / 2 - fs * 0.1, W / 2 + fs * 0.1), { smooth: false, w: Math.round(H * 0.5), op: 40 })]; break;
            case "ul07": o.pivot = [cx, cy + H * 0.05]; o.strokes = [S(line(-W / 2 - ext, W / 2 + ext), { smooth: false })]; break;
            case "ul08": o.pivot = [cx, T - g * 0.9]; o.strokes = [S(line(-W / 2 - ext, W / 2 + ext), { smooth: false })]; break;
            case "ul09": o.pivot = [cx, cy];
                o.strokes = [S(line(-W / 2 - ext, W / 2 + ext, -H / 2 - g * 0.9), { smooth: false, dur: 0.75 }),
                    S(line(W / 2 + ext, -W / 2 - ext, H / 2 + g), { smooth: false, delay: 0.25, dur: 0.75 })]; break;
            case "ul17": o.pivot = [cx, B + g * 1.2]; o.rot = -4; o.strokes = [S(line(-W / 2 - ext, W / 2 + ext), { smooth: false })]; break;
            case "ul18": o.pivot = [L + W * 0.2, B + g]; o.strokes = [S(line(-W * 0.2, W * 0.2), { smooth: false })]; break;
            /* ---- circles and boxes */
            case "ul10": o.pivot = [cx, cy]; o.strokes = [S(loop(W / 2 + fs * 0.6, H / 2 + fs * 0.62, 1.13, -0.03, 0.025, 18))]; break;
            case "ul11": o.pivot = [cx, cy];
                o.strokes = [S(loop(W / 2 + fs * 0.55, H / 2 + fs * 0.55, 1.05, -0.03, 0.02, 18), { dur: 0.7 }),
                    S(loop(W / 2 + fs * 0.75, H / 2 + fs * 0.72, 1.05, 0.04, 0.03, 18), { delay: 0.3, dur: 0.7, w: sw * 0.75 })]; break;
            case "ul12": o.pivot = [cx, cy]; o.strokes = [S(ellipse(W / 2 + fs * 0.55, H / 2 + fs * 0.5, 24))]; break;
            case "ul13": o.pivot = [cx, cy]; o.strokes = [S(rbox(W + fs * 0.8, H + fs * 0.6, fs * 0.32), { smooth: false })]; break;
            /* ---- corner brackets (14 and its family) */
            case "ul14": o.pivot = [cx, cy];
                bw = W / 2 + fs * 0.35; bh = H / 2 + fs * 0.28; arm = Math.min(fs * 0.55, bw * 0.6);
                for (i = 0; i < 4; i++) o.strokes.push(S(corner(q[i][0], q[i][1], bw, bh, arm, 0), { smooth: false, delay: i * 0.12, dur: 0.64 }));
                break;
            case "ul21": o.pivot = [cx, cy];   // Side Brackets: a tall [ on the left and ] on the right
                bw = W / 2 + fs * 0.3; bh = H / 2 + fs * 0.22; arm = fs * 0.3;
                o.strokes = [S([[-bw + arm, -bh], [-bw, -bh], [-bw, bh], [-bw + arm, bh]], { smooth: false, dur: 0.75 }),
                    S([[bw - arm, bh], [bw, bh], [bw, -bh], [bw - arm, -bh]], { smooth: false, delay: 0.2, dur: 0.75 })]; break;
            case "ul22": o.pivot = [cx, cy];   // Two Corners: top-left and bottom-right, longer arms
                bw = W / 2 + fs * 0.35; bh = H / 2 + fs * 0.28; arm = Math.min(fs * 0.85, bw * 0.75);
                o.strokes = [S(corner(-1, -1, bw, bh, arm, 0), { smooth: false, dur: 0.7 }), S(corner(1, 1, bw, bh, arm, 0), { smooth: false, delay: 0.25, dur: 0.7 })]; break;
            case "ul23": o.pivot = [cx, cy];   // Round Corners: the four brackets with rounded corners
                bw = W / 2 + fs * 0.35; bh = H / 2 + fs * 0.28; arm = Math.min(fs * 0.6, bw * 0.6);
                for (i = 0; i < 4; i++) o.strokes.push(S(corner(q[i][0], q[i][1], bw, bh, arm, arm * 0.45), { smooth: false, delay: i * 0.12, dur: 0.64 }));
                break;
            case "ul24": o.pivot = [cx, cy];   // Focus Corners: every corner appears at its point and grows both arms
                bw = W / 2 + fs * 0.45; bh = H / 2 + fs * 0.35; arm = Math.min(fs * 0.5, bw * 0.5);
                for (i = 0; i < 4; i++) o.strokes.push(S(corner(q[i][0], q[i][1], bw, bh, arm, 0), { smooth: false, center: true, delay: i * 0.06, dur: 0.75 }));
                break;
            /* ---- emphasis marks (16 and its family) */
            case "ul16": o.pivot = [L + W + fs * 0.15, T - fs * 0.02];
                ang = [-78, -42, -6];
                for (i = 0; i < 3; i++) o.strokes.push(S(line(fs * 0.22, fs * 0.78), { smooth: false, rot: ang[i], delay: i * 0.15, dur: 0.7 }));
                break;
            case "ul25": o.pivot = [L - fs * 0.15, T - fs * 0.02];   // Emphasis Left: the same marks at the top-left
                ang = [-102, -138, -174];
                for (i = 0; i < 3; i++) o.strokes.push(S(line(fs * 0.22, fs * 0.78), { smooth: false, rot: ang[i], delay: i * 0.15, dur: 0.7 }));
                break;
            case "ul26": o.pivot = [cx, cy];   // Double Emphasis: marks on both top corners
                ang = [-78, -42, -6];
                for (i = 0; i < 3; i++) {
                    o.strokes.push(S(ray(-W / 2 - fs * 0.15, -H / 2 - fs * 0.02, 180 - ang[i], fs * 0.22, fs * 0.72), { smooth: false, delay: i * 0.12, dur: 0.6 }));
                    o.strokes.push(S(ray(W / 2 + fs * 0.15, -H / 2 - fs * 0.02, ang[i], fs * 0.22, fs * 0.72), { smooth: false, delay: 0.06 + i * 0.12, dur: 0.6 }));
                }
                break;
            case "ul27": o.pivot = [cx, T - fs * 0.12];   // Burst Marks: five rays fanning out above the word
                ang = [-150, -120, -90, -60, -30];
                for (i = 0; i < 5; i++) o.strokes.push(S(ray(0, 0, ang[i], fs * 0.2 + Math.abs(i - 2) * fs * 0.08, fs * 0.62 + Math.abs(i - 2) * fs * 0.08), { smooth: false, delay: Math.abs(i - 2) * 0.12, dur: 0.6 }));
                break;
            case "ul28": o.pivot = [cx, cy];   // Side Marks: three short marks on each side, pointing away
                ang = [-28, 0, 28];
                for (i = 0; i < 3; i++) {
                    o.strokes.push(S(ray(-W / 2 - fs * 0.2, 0, 180 - ang[i], fs * 0.1, fs * 0.52 - Math.abs(ang[i]) * fs * 0.004), { smooth: false, delay: i * 0.12, dur: 0.6 }));
                    o.strokes.push(S(ray(W / 2 + fs * 0.2, 0, ang[i], fs * 0.1, fs * 0.52 - Math.abs(ang[i]) * fs * 0.004), { smooth: false, delay: 0.06 + i * 0.12, dur: 0.6 }));
                }
                break;
            /* ---- arrows (20 and its family) */
            case "ul20": o.pivot = [cx, B + g * 1.1];
                e = [W / 2 + fs * 0.12, -fs * 0.15];
                o.strokes = [S([[-W / 2 - ext, fs * 0.12], [-W * 0.15, fs * 0.17], [W * 0.2, fs * 0.07], e], { dur: 0.75 }),
                    S(head(e, [W * 0.2, fs * 0.07], fs * 0.45, 35), { smooth: false, delay: 0.72, dur: 0.28 })];
                break;
            case "ul29": o.pivot = [cx, B + g];   // Straight Arrow: a clean line with an arrowhead
                e = [W / 2 + fs * 0.25, 0];
                o.strokes = [S(line(-W / 2 - ext, e[0]), { smooth: false, dur: 0.75 }), S(head(e, [0, 0], fs * 0.36, 38), { smooth: false, delay: 0.72, dur: 0.28 })];
                break;
            case "ul30": o.pivot = [L + W, B];   // Curved Arrow: comes up from below-right and points at the word
                e = [fs * 0.12, fs * 0.12];
                o.strokes = [S([[fs * 1.25, fs * 1.15], [fs * 1.05, fs * 0.55], [fs * 0.6, fs * 0.22], e], { dur: 0.75 }),
                    S(head(e, [fs * 0.6, fs * 0.22], fs * 0.34, 38), { smooth: false, delay: 0.72, dur: 0.28 })];
                break;
            case "ul31": o.pivot = [cx, B + g * 1.1];   // Tapered Arrow: a pen swoosh that thickens, with a head
                e = [W / 2 + fs * 0.15, -fs * 0.1];
                o.strokes = [S([[-W / 2 - fs * 0.2, fs * 0.14], [-W * 0.1, fs * 0.12], [W * 0.25, fs * 0.04], e], { dur: 0.78, w: sw * 1.5, taper: TP(70, 5, 0, 70, 30, 0) }),
                    S(head(e, [W * 0.25, fs * 0.04], fs * 0.42, 35), { smooth: false, delay: 0.74, dur: 0.26, w: sw * 1.1 })];
                break;
            /* ---- pen strokes from the references: pointed tips (stroke Taper) */
            case "ul32": o.pivot = [cx, B + g * 1.2];   // Tapered Swoosh: a thin tip, a full belly, a long fine tail
                o.strokes = [S([[-W / 2 - fs * 0.35, fs * 0.16], [-W * 0.15, -fs * 0.02], [W * 0.25, -fs * 0.06], [W / 2 + fs * 0.4, -fs * 0.02]], { w: sw * 1.9, taper: TP(18, 62, 0, 0, 50, 30) })];
                break;
            case "ul33": o.pivot = [cx, B + g * 1.1];   // Triple Swoosh: three overlapping quick pen strokes
                o.strokes = [S([[-W / 2 - fs * 0.45, fs * 0.08], [-W * 0.05, -fs * 0.06], [W * 0.35, -fs * 0.02]], { dur: 0.6, w: sw * 1.1, taper: TP(45, 45, 0, 0) }),
                    S([[-W * 0.3, fs * 0.06], [W * 0.15, fs * 0.0], [W / 2 + fs * 0.3, fs * 0.04]], { delay: 0.2, dur: 0.6, w: sw * 1.6, taper: TP(35, 25, 0, 30, 40, 60) }),
                    S([[-W * 0.12, fs * 0.13], [W * 0.15, fs * 0.12], [W * 0.38, fs * 0.15]], { delay: 0.4, dur: 0.55, w: sw * 0.9, taper: TP(45, 45, 0, 0) })];
                break;
            case "ul34": o.pivot = [cx, B + g * 1.1];   // Zigzag Scribble: right, back, right, back, right
                o.strokes = [S([[-W / 2 - fs * 0.3, -fs * 0.04], [W * 0.18, -fs * 0.06], [-W * 0.3, fs * 0.03], [W * 0.32, fs * 0.04], [-W * 0.12, fs * 0.12], [W / 2 + fs * 0.35, fs * 0.13]],
                    { smooth: false, w: sw * 1.4, taper: TP(8, 18, 0, 0, 30, 30) })];
                break;
            case "ul35": o.pivot = [cx, B + g];   // Dashed Taper: five pointed dashes, one after another
                var nd = 5, span = W + fs * 0.4, dl = span / nd;
                for (i = 0; i < nd; i++) {
                    var x0 = -span / 2 + i * dl, y0 = fs * 0.04 - i * fs * 0.025;
                    o.strokes.push(S([[x0, y0], [x0 + dl * 0.7, y0 - fs * 0.02]], { smooth: false, delay: i * 0.13, dur: 0.42, w: sw * 1.2, taper: TP(45, 45, 0, 0) }));
                }
                break;
            case "ul36": o.pivot = [cx, B + g];   // Tapered Line: one fine line, pointed at both ends
                o.strokes = [S([[-W / 2 - fs * 0.25, fs * 0.05], [0, -fs * 0.03], [W / 2 + fs * 0.25, -fs * 0.05]], { w: sw * 1.5, taper: TP(45, 50, 0, 0, 50, 50) })];
                break;
            case "ul37": o.pivot = [cx, B + g];   // Quick Return: across, a fast hook back, and across again
                o.strokes = [S([[-W / 2 - fs * 0.2, 0], [W * 0.22, -fs * 0.03], [-W * 0.18, fs * 0.08], [W / 2 + fs * 0.35, fs * 0.1]], { smooth: false, w: sw * 1.3, taper: TP(10, 30, 0, 0, 30, 40) })];
                break;
            case "ul38": o.pivot = [cx, B + g * 1.1];   // Swoosh Pair: two long fine strokes, the second overlapping
                o.strokes = [S([[-W / 2 - fs * 0.25, fs * 0.03], [0, -fs * 0.03], [W * 0.38, -fs * 0.04]], { dur: 0.65, w: sw * 1.2, taper: TP(35, 45, 0, 0) }),
                    S([[-W * 0.28, fs * 0.09], [W * 0.12, fs * 0.06], [W / 2 + fs * 0.35, fs * 0.08]], { delay: 0.3, dur: 0.7, w: sw * 1.2, taper: TP(30, 50, 0, 0) })];
                break;
            /* ---- brush strokes from the references: thick paint, ragged edges, a dry tail */
            case "ul39": o.pivot = [cx, B + g * 1.6];   // Dry Brush: a curved stroke, round start, dry ragged end
                o.rough = { border: fs * 0.05, scale: 22, stretch: 2.5 };
                o.strokes = [S([[-W / 2 - fs * 0.25, fs * 0.12], [-W * 0.1, -fs * 0.06], [W * 0.25, -fs * 0.05], [W / 2 + fs * 0.3, fs * 0.08]], { w: fs * 0.26, taper: TP(4, 30, 75, 25, 50, 40) }),
                    S([[W * 0.05, -fs * 0.15], [W * 0.3, -fs * 0.13], [W / 2 + fs * 0.32, -fs * 0.01]], { delay: 0.45, dur: 0.55, w: fs * 0.06, taper: TP(25, 60, 0, 0) }),
                    S([[W * 0.15, fs * 0.05], [W * 0.35, fs * 0.05], [W / 2 + fs * 0.22, fs * 0.13]], { delay: 0.55, dur: 0.45, w: fs * 0.05, taper: TP(25, 60, 0, 0) })];
                break;
            case "ul40": o.pivot = [cx, B + g * 1.5];   // Brush Line: a straight thick paint stroke
                o.rough = { border: fs * 0.06, scale: 18, stretch: 3 };
                o.strokes = [S(line(-W / 2 - fs * 0.25, W / 2 + fs * 0.25), { smooth: false, w: fs * 0.22, taper: TP(4, 22, 80, 45, 50, 40) }),
                    S(line(W * 0.1, W / 2 + fs * 0.28, -fs * 0.08), { smooth: false, delay: 0.5, dur: 0.5, w: fs * 0.05, taper: TP(20, 50, 0, 0) })];
                break;
            case "ul41": o.pivot = [cx, B + g * 1.7];   // Brush Arc: a fat arc, blunt rounded start, split tapering tail
                o.rough = { border: fs * 0.03, scale: 26, stretch: 2 };
                o.strokes = [S([[-W / 2 - fs * 0.35, fs * 0.18], [-W * 0.15, -fs * 0.04], [W * 0.2, -fs * 0.07], [W / 2 + fs * 0.4, -fs * 0.02]], { w: fs * 0.3, taper: TP(0, 70, 100, 12, 0, 30) }),
                    S([[W * 0.22, -fs * 0.06], [W / 2 + fs * 0.3, -fs * 0.08], [W / 2 + fs * 0.48, -fs * 0.1]], { delay: 0.55, dur: 0.45, w: fs * 0.07, taper: TP(20, 70, 0, 0) })];
                break;
            case "ul42": o.pivot = [cx, T + H * 0.72]; o.behind = true;   // Brush Highlight: a ragged paint stroke behind the text
                o.rough = { border: fs * 0.07, scale: 20, stretch: 3 };
                o.strokes = [S([[-W / 2 - fs * 0.2, fs * 0.04], [0, -fs * 0.02], [W / 2 + fs * 0.25, 0]], { w: Math.round(H * 0.55), op: 45, taper: TP(5, 15, 80, 55, 50, 40) })];
                break;
            default: o.pivot = [cx, B + g]; o.strokes = [S(line(-W / 2, W / 2), { smooth: false })];
        }
        for (i = 0; i < o.strokes.length; i++) if (!o.strokes[i].w) o.strokes[i].w = sw;
        return o;
    }
    /* Catmull-Rom tangents for an open path (AE in / out tangents, relative to the vertex) */
    function tangents(pts) {
        var n = pts.length, it = [], ot = [], j;
        for (j = 0; j < n; j++) {
            var p0 = pts[Math.max(0, j - 1)], p2 = pts[Math.min(n - 1, j + 1)];
            var dx = (p2[0] - p0[0]) / 6, dy = (p2[1] - p0[1]) / 6;
            it.push(j === 0 ? [0, 0] : [-dx, -dy]);
            ot.push(j === n - 1 ? [0, 0] : [dx, dy]);
        }
        return { i: it, o: ot };
    }
    /* dense polyline of a stroke (for the panel preview) */
    function sample(s) {
        var pts = s.pts, out = [], j, k;
        if (!s.smooth) return pts.slice();
        var tg = tangents(pts);
        for (j = 0; j < pts.length - 1; j++) {
            var a = pts[j], b = pts[j + 1], c1 = [a[0] + tg.o[j][0], a[1] + tg.o[j][1]], c2 = [b[0] + tg.i[j + 1][0], b[1] + tg.i[j + 1][1]];
            for (k = 0; k < 12; k++) {
                var t = k / 12, u = 1 - t;
                out.push([u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0], u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]]);
            }
        }
        out.push(pts[pts.length - 1]);
        return out;
    }
    return { build: build, tangents: tangents, sample: sample };
})();

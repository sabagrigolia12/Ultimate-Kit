/*  Ultimate Kit - Underline strokes (UK_UL). Shared by the panel preview and ExtendScript, so ES3 only.
    build(id, r, fs) -> { rot, pivot, behind, strokes: [...] }
      r      the text box { left, top, width, height } in the text layer's space (y down)
      fs     font size (px); stroke widths and gaps follow it
      pivot  where the stroke layer sits (its Position, in the same space as r)
      rot    the layer's Rotation in degrees (tilted looks keep their tilt as a real rotation)
      behind true = the layer goes under the text (highlighter)
    stroke: { pts: [[x, y]...] relative to the pivot, smooth (Catmull-Rom) or straight polyline,
              closed, w (px), delay / dur (fractions of the draw time), op (%), rot (group rotation),
              center (draws from its middle out to both ends) }                                     */
var UK_UL = (function () {
    function line(x0, x1, y) { return [[x0, y || 0], [x1, y || 0]]; }
    function S(pts, o) {
        var s = { pts: pts, smooth: true, closed: false, w: 0, delay: 0, dur: 1, op: 100, rot: 0, center: false }, k;
        if (o) for (k in o) s[k] = o[k];
        return s;
    }
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
        var p = [], hw = w / 2, hh = h / 2, i, n = 6;
        rad = Math.min(rad, hw, hh);
        function arc(cx, cy, a0) { for (var j = 0; j <= n; j++) { var a = a0 + j / n * Math.PI / 2; p.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } }
        p.push([0, -hh]);
        arc(hw - rad, -hh + rad, -Math.PI / 2);
        arc(hw - rad, hh - rad, 0);
        arc(-hw + rad, hh - rad, Math.PI / 2);
        arc(-hw + rad, -hh + rad, Math.PI);
        p.push([0, -hh]);
        for (i = 0; i < p.length; i++) p[i] = [p[i][0], p[i][1]];
        return p;
    }
    function build(id, r, fs) {
        var L = r.left, T = r.top, W = Math.max(r.width, fs), H = Math.max(r.height, fs * 0.7), B = T + H, cx = L + W / 2, cy = T + H / 2;
        var sw = Math.max(3, Math.round(fs * 0.08)), g = fs * 0.22, o = { rot: 0, behind: false, strokes: [] }, i, p;
        var ext = fs * 0.06;
        switch (id) {
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
            case "ul06": o.pivot = [cx, T + H * 0.64]; o.behind = true;
                o.strokes = [S(line(-W / 2 - fs * 0.1, W / 2 + fs * 0.1), { smooth: false, w: Math.round(H * 0.5), op: 40 })]; break;
            case "ul07": o.pivot = [cx, cy + H * 0.05]; o.strokes = [S(line(-W / 2 - ext, W / 2 + ext), { smooth: false })]; break;
            case "ul08": o.pivot = [cx, T - g * 0.9]; o.strokes = [S(line(-W / 2 - ext, W / 2 + ext), { smooth: false })]; break;
            case "ul09": o.pivot = [cx, cy];
                o.strokes = [S(line(-W / 2 - ext, W / 2 + ext, -H / 2 - g * 0.9), { smooth: false, dur: 0.75 }),
                    S(line(W / 2 + ext, -W / 2 - ext, H / 2 + g), { smooth: false, delay: 0.25, dur: 0.75 })]; break;
            case "ul10": o.pivot = [cx, cy]; o.strokes = [S(loop(W / 2 + fs * 0.6, H / 2 + fs * 0.62, 1.13, -0.03, 0.025, 18))]; break;
            case "ul11": o.pivot = [cx, cy];
                o.strokes = [S(loop(W / 2 + fs * 0.55, H / 2 + fs * 0.55, 1.05, -0.03, 0.02, 18), { dur: 0.7 }),
                    S(loop(W / 2 + fs * 0.75, H / 2 + fs * 0.72, 1.05, 0.04, 0.03, 18), { delay: 0.3, dur: 0.7, w: sw * 0.75 })]; break;
            case "ul12": o.pivot = [cx, cy]; o.strokes = [S(ellipse(W / 2 + fs * 0.55, H / 2 + fs * 0.5, 24))]; break;
            case "ul13": o.pivot = [cx, cy]; o.strokes = [S(rbox(W + fs * 0.8, H + fs * 0.6, fs * 0.32), { smooth: false })]; break;
            case "ul14": o.pivot = [cx, cy];
                var bw = W / 2 + fs * 0.35, bh = H / 2 + fs * 0.28, arm = Math.min(fs * 0.55, bw * 0.6), q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
                for (i = 0; i < 4; i++) {
                    var sx = q[i][0], sy = q[i][1];
                    o.strokes.push(S([[sx * bw, sy * (bh - arm)], [sx * bw, sy * bh], [sx * (bw - arm), sy * bh]], { smooth: false, delay: i * 0.12, dur: 0.64 }));
                }
                break;
            case "ul15": o.pivot = [L + W + fs * 0.42, T - fs * 0.22]; o.rot = -45;
                o.strokes = [S(line(-fs * 0.5, fs * 0.5), { smooth: false })]; break;
            case "ul16": o.pivot = [L + W + fs * 0.15, T - fs * 0.02];
                var ang = [-78, -42, -6];
                for (i = 0; i < 3; i++) o.strokes.push(S(line(fs * 0.22, fs * 0.78), { smooth: false, rot: ang[i], delay: i * 0.15, dur: 0.7 }));
                break;
            case "ul17": o.pivot = [cx, B + g * 1.2]; o.rot = -4; o.strokes = [S(line(-W / 2 - ext, W / 2 + ext), { smooth: false })]; break;
            case "ul18": o.pivot = [L + W * 0.2, B + g]; o.strokes = [S(line(-W * 0.2, W * 0.2), { smooth: false })]; break;
            case "ul19": o.pivot = [cx, B + g * 1.3]; p = [];
                var R = fs * 0.2;
                for (i = 0; i <= 48; i++) {
                    var u = i / 48, th = Math.PI * 2 * Math.max(0, Math.min(1, (u - 0.4) / 0.2));
                    p.push([-W / 2 + W * u - R * Math.sin(th), -R * (1 - Math.cos(th)) + fs * 0.03 * Math.sin(u * Math.PI)]);
                }
                o.strokes = [S(p)]; break;
            case "ul20": o.pivot = [cx, B + g * 1.1];
                var e = [W / 2 + fs * 0.12, -fs * 0.15], dx = -0.86, dy = 0.5;   // arrow direction back along the swoosh
                o.strokes = [S([[-W / 2 - ext, fs * 0.12], [-W * 0.15, fs * 0.17], [W * 0.2, fs * 0.07], e], { dur: 0.75 }),
                    S([[e[0] + (dx * 0.82 - dy * 0.57) * fs * 0.45, e[1] + (dy * 0.82 + dx * 0.57) * fs * 0.45], e,
                        [e[0] + (dx * 0.82 + dy * 0.57) * fs * 0.45, e[1] + (dy * 0.82 - dx * 0.57) * fs * 0.45]], { smooth: false, delay: 0.72, dur: 0.28 })];
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

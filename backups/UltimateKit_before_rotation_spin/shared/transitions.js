/*  Ultimate Kit - Transitions (UK_TR): 50 shape transitions. Shared by the panel preview and
    ExtendScript, so ES3 only.

    A transition is built around the cut between two clips: it lasts `d` seconds, the cut sits in
    the middle, and from `a` to `b` (around the cut) the shapes cover the whole frame.
    scene(id, W, H, d) -> { d, cut, th, els: [ element, ... ] }   (first element = top layer)

    element { name, col: "c1" main | "c2" line / edge | "c3" dark,
              shapes: [ shape ... ]            all filled with the element's colour
              eo       even-odd fill (frames with a hole)
              a        anchor [x, y] in comp pixels; the layer's Position = a + offset
              p, s, r  channels { k: [[t, value]...], e: [ease per segment] }
                       p offset [dx, dy] px, s scale [sx, sy] %, r rotation deg
              r0       fixed rotation when there is no r channel
              tIn, tOut   when the layer is on (in seconds of the transition) }
    shape   { pts: [[x, y]...] } polygon   | { ell: [cx, cy, rx, ry] } ellipse
            | { k: [[t, pts]...], e: [...] } a polygon whose outline is keyframed
            + optional g: { a, p, s, r } its own (group) transform, same channel format
    Everything that moves is a keyframe; eases are AE influences with zero speed (EASE).      */
var UK_TR = (function () {
    var EASE = {
        pass: [42, 42],     // sweeps through the frame: starts off screen, so the frame sees the fast middle
        land: [18, 72],     // arrives fast, settles long and soft
        leave: [72, 18],    // starts softly, leaves fast
        smooth: [60, 60],
        grow: [55, 25],     // covering shapes: soft start, strong finish (the edge leaves the frame fast)
        open: [25, 55],     // holes that open: quick start, softer finish
        lin: null, hold: [33, 33]
    };
    var RUN = 0.25;        // moving shapes start this many frame widths outside, so they already move fast when they enter

    /* ------------------------------------------------------------ geometry */
    function rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
    function shift(p, dx, dy) { var o = [], i; for (i = 0; i < p.length; i++) o.push([p[i][0] + dx, p[i][1] + dy]); return o; }
    function bounds(p) { var b = [1e9, 1e9, -1e9, -1e9], i; for (i = 0; i < p.length; i++) { b[0] = Math.min(b[0], p[i][0]); b[1] = Math.min(b[1], p[i][1]); b[2] = Math.max(b[2], p[i][0]); b[3] = Math.max(b[3], p[i][1]); } return b; }
    function ngon(cx, cy, r, n, rot) { var o = [], i; for (i = 0; i < n; i++) { var a = rot + i * 2 * Math.PI / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
    function star(cx, cy, r, n, inner, rot) { var o = [], i; for (i = 0; i < 2 * n; i++) { var a = rot + i * Math.PI / n, rr = (i % 2) ? r * inner : r; o.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); } return o; }
    function stadium(x0, x1, cy, r, n) {
        var o = [], i;
        for (i = 0; i <= n; i++) { var a = -Math.PI / 2 + i * Math.PI / n; o.push([x1 + r * Math.cos(a), cy + r * Math.sin(a)]); }
        for (i = 0; i <= n; i++) { var b = Math.PI / 2 + i * Math.PI / n; o.push([x0 + r * Math.cos(b), cy + r * Math.sin(b)]); }
        return o;
    }
    function rot(p, cx, cy, deg) { var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), o = [], i; for (i = 0; i < p.length; i++) { var x = p[i][0] - cx, y = p[i][1] - cy; o.push([cx + x * c - y * s, cy + x * s + y * c]); } return o; }

    /* ------------------------------------------------------------ building blocks */
    function ch(k, e) { return { k: k, e: e }; }
    function El(name, col, shapes, o) {
        o = o || {};
        return { name: name, col: col, shapes: shapes, a: o.a || [0, 0], p: o.p || null, s: o.s || null, r: o.r || null, r0: o.r0 || 0, tIn: o.tIn, tOut: o.tOut, eo: !!o.eo };
    }
    function span(W, H, d) { var h = Math.max(0.05, d * 0.08); return { d: d, cut: d / 2, a: d / 2 - h, b: d / 2 + h, W: W, H: H, OV: Math.max(W, H) * 0.015 + 4 }; }
    function frame(T) { return rect(-T.OV, -T.OV, T.W + T.OV, T.H + T.OV); }
    /* a rigid shape that travels from offset o0 to o1 */
    function sweep(name, col, pts, o0, o1, t0, t1, ease) { return El(name, col, [{ pts: pts }], { p: ch([[t0, o0], [t1, o1]], [ease || "pass"]) }); }
    /* in -> hold -> back out the way it came (doors, corners...) */
    function visit(name, col, pts, off, T, t0, t3, o) {
        o = o || {};
        return El(name, col, [{ pts: pts }], { p: ch([[t0, off], [T.a, [0, 0]], [T.b, [0, 0]], [t3, o.offOut || off]], ["land", "hold", "leave"]) });
    }
    /* a shape that grows from c until it covers (s 0 -> 100) and, mirrored, a hole of that shape opening
       in a full-frame plate; rr = optional rotation while it grows / opens                       */
    function burst(T, name, col, shp, c, t0, t1, t2, t3, rr) {
        var a = {}, k;
        for (k in shp) a[k] = shp[k];
        var inn = El(name, col, [shp], { a: c, s: ch([[t0, [0, 0]], [t1, [100, 100]]], ["grow"]), r: rr ? ch([[t0, rr[0]], [t1, rr[1]]], ["grow"]) : null, tIn: t0, tOut: t2 });
        a.g = { a: c, s: ch([[t2, [0, 0]], [t3, [100, 100]]], ["open"]), r: rr ? ch([[t2, rr[1]], [t3, rr[2]]], ["open"]) : null };
        var out = El(name + " Out", col, [{ pts: frame(T) }, a], { eo: true, tIn: t2, tOut: t3 });
        return [inn, out];
    }
    /* a shape scaled by k around c */
    function scaled(shp, c, k) {
        if (shp.ell) return { ell: [c[0] + (shp.ell[0] - c[0]) * k, c[1] + (shp.ell[1] - c[1]) * k, shp.ell[2] * k, shp.ell[3] * k] };
        var o = [], i;
        for (i = 0; i < shp.pts.length; i++) o.push([c[0] + (shp.pts[i][0] - c[0]) * k, c[1] + (shp.pts[i][1] - c[1]) * k]);
        return { pts: o };
    }
    /* A -> B with one shape in layered colours. Every colour moves on the SAME keyframes: on the way in
       the extra colours are a little bigger (thin outlines around the growing shape), on the way out
       their holes are a little smaller (thin outlines inside the opening hole). So the frame never
       turns into another flat colour between A and B - the shape itself carries the change.
       items: [[name, colour]...], the first is the main colour (top). shp at scale 100 covers the frame. */
    function layered(T, items, shp, c, rr, ease) {
        var n = items.length, d = T.d, ins = [], outs = [], j, t0 = d * 0.04, t3 = d * 0.96;
        for (j = 0; j < n; j++) {
            var kin = 1 + 0.07 * j, kout = 1.04 + 0.08 * (n - 1 - j);
            ins.push(El(items[j][0], items[j][1], [scaled(shp, c, kin)], { a: c, s: ch([[t0, [0, 0]], [T.a, [100, 100]]], [ease || "grow"]), r: rr ? ch([[t0, rr[0]], [T.a, rr[1]]], [ease || "grow"]) : null, tOut: T.b }));
            var h = scaled(shp, c, kout);
            h.g = { a: c, s: ch([[T.b, [0, 0]], [t3, [100, 100]]], ["open"]), r: rr ? ch([[T.b, rr[1]], [t3, rr[2]]], ["open"]) : null };
            outs.push(El(items[j][0] + " Out", items[j][1], [{ pts: rect(-T.W, -T.H, 2 * T.W, 2 * T.H) }, h], { eo: true, tIn: T.b }));
        }
        return ins.concat(outs);
    }
    /* full-height band between xa and xb (travel axis x), edge: flat / slant / chevron */
    function band(xa, xb, Hc, style, amt) {
        var o = 30, ys = (style === "chevron") ? [-o, Hc / 2, Hc + o] : [-o, Hc + o], p = [], i;
        function ex(x, y) { if (style === "slant") return x + amt * (1 - 2 * y / Hc); if (style === "chevron") return x + amt * (1 - Math.abs(2 * y / Hc - 1)); return x; }
        p.push([ex(xa, ys[0]), ys[0]]);
        for (i = 0; i < ys.length; i++) p.push([ex(xb, ys[i]), ys[i]]);
        for (i = ys.length - 1; i >= 1; i--) p.push([ex(xa, ys[i]), ys[i]]);
        return p;
    }
    /* points built for a left-to-right trip, turned to the real direction */
    function orient(p, dir, W, H) {
        var o = [], i;
        for (i = 0; i < p.length; i++) {
            var x = p[i][0], y = p[i][1];
            if (dir === "L") o.push([W - x, y]); else if (dir === "D") o.push([y, x]); else if (dir === "U") o.push([y, H - x]); else o.push([x, y]);
        }
        return o;
    }
    function odir(dx, dir) { if (dir === "L") return [-dx, 0]; if (dir === "D") return [0, dx]; if (dir === "U") return [0, -dx]; return [dx, 0]; }
    /* grid of cells, n along the long side */
    function grid(T, n) {
        var g = {};
        if (T.W >= T.H) { g.c = n; g.r = Math.max(2, Math.round(n * T.H / T.W)); } else { g.r = n; g.c = Math.max(2, Math.round(n * T.W / T.H)); }
        g.w = T.W / g.c; g.h = T.H / g.r;
        return g;
    }
    function cell(g, c, r) { return rect(c * g.w - 1, r * g.h - 1, (c + 1) * g.w + 1, (r + 1) * g.h + 1); }
    /* a shape that pops (scale 0 -> 100 at its own centre / pivot) and shrinks back */
    function pop(pts, pv, t0, t1, t2, t3) { return { pts: pts, g: { a: pv, s: ch([[t0, [0, 0]], [t1, [100, 100]], [t2, [100, 100]], [t3, [0, 0]]], ["land", "hold", "leave"]) } }; }
    function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

    /* ------------------------------------------------------------ the transitions */
    /* 01-06 one wide band crosses the frame, a thin line and a dark band on both of its edges */
    function wipe(T, style, amtF, dir) {
        var tr = (dir === "D" || dir === "U"), Wt = tr ? T.H : T.W, Hc = tr ? T.W : T.H, amt = Hc * amtF, ex = Math.abs(amt) * (style === "slant" ? 2 : 1);
        var body = 2.6 * Wt + ex * 1.8, thin = Wt * 0.035, wide = Wt * 0.1;
        var parts = [["Lead Line", "c2", body - 2, body + thin], ["Tail Line", "c2", -thin, 2], ["Lead Dark", "c3", body + thin - 2, body + thin + wide], ["Tail Dark", "c3", -thin - wide, -thin + 2], ["Body", "c1", 0, body]];
        var tot = band(-thin - wide - ex, body + thin + wide + ex, Hc, "flat", 0), b = bounds(tot);
        var s0 = -b[2] - RUN * Wt, s1 = Wt - b[0] + RUN * Wt, els = [], i;
        for (i = 0; i < parts.length; i++) els.push(sweep(parts[i][0], parts[i][1], orient(band(parts[i][2], parts[i][3], Hc, style, amt), dir, T.W, T.H), odir(s0, dir), odir(s1, dir), T.d * 0.03, T.d * 0.97));
        return els;
    }
    /* bars that race across, each a little out of step; alt = every second one from the other side */
    function bars(T, fr, cols, del, alt, tips, vertical) {
        var Wt = vertical ? T.H : T.W, Hc = vertical ? T.W : T.H, L = T.d * 0.86, els = [], tipEls = [], y = 0, i;
        for (i = 0; i < fr.length; i++) {
            var h = Hc * fr[i], len = Wt * 5, p = rect(0, y - 1, len, y + h + 1), s0 = -len - RUN * Wt, s1 = Wt + RUN * Wt, back = alt && (i % 2 === 1);
            var o0 = back ? s1 : s0, o1 = back ? s0 : s1, dir = vertical ? "D" : "R";
            els.push(sweep((vertical ? "Column " : "Bar ") + (i + 1), cols[i % cols.length], orient(p, dir, T.W, T.H), odir(o0, dir), odir(o1, dir), del[i % del.length] * T.d, del[i % del.length] * T.d + L));
            if (tips) {
                var tw = Wt * 0.04, tp = back ? rect(0, y - 1, tw, y + h + 1) : rect(len - tw, y - 1, len, y + h + 1);
                tipEls.push(sweep("Tip " + (i + 1), "c2", orient(tp, dir, T.W, T.H), odir(o0, dir), odir(o1, dir), del[i % del.length] * T.d, del[i % del.length] * T.d + L));
            }
            y += h;
        }
        return tipEls.concat(els);
    }
    /* slanted slices: long rotated bars stacked across the frame, sliding along their length */
    function slices(T, deg, n, cols, alt, step, tips) {
        var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), along = T.W * Math.abs(c) + T.H * Math.abs(s), across = T.W * Math.abs(s) + T.H * Math.abs(c);
        var hh = across / n, len = along * 5, L = T.d * 0.86, els = [], tipEls = [], i, cx = T.W / 2, cy = T.H / 2;
        for (i = 0; i < n; i++) {
            var off = -across / 2 + hh * (i + 0.5), back = alt && (i % 2 === 1), d0 = (len / 2 + along / 2 + RUN * along) * (back ? 1 : -1), t0 = (step ? step * i : 0.03) * T.d;
            // the bar centre moves along (c, s); across offset along (-s, c)
            var bx = cx - s * off, by = cy + c * off;
            var p = rot(rect(bx - len / 2, by - hh / 2 - 1, bx + len / 2, by + hh / 2 + 1), bx, by, deg);
            els.push(sweep("Slice " + (i + 1), cols[i % cols.length], p, [c * d0, s * d0], [-c * d0, -s * d0], t0, t0 + L));
            if (tips) {
                var tw = along * 0.035, ex = back ? -len / 2 : len / 2 - tw;
                tipEls.push(sweep("Tip " + (i + 1), "c2", rot(rect(bx + ex, by - hh / 2 - 1, bx + ex + tw, by + hh / 2 + 1), bx, by, deg), [c * d0, s * d0], [-c * d0, -s * d0], t0, t0 + L));
            }
        }
        return tipEls.concat(els);
    }

    function build(id, W, H, d) {
        var T = span(W, H, d), cx = W / 2, cy = H / 2, R = Math.sqrt(W * W + H * H) / 2 + T.OV, els = [], i, j, k, c, r, g, q;
        var A = T.a, B = T.b, th = 0.3;
        switch (id) {
            case "tr01": els = wipe(T, "flat", 0, "R"); break;
            case "tr02": els = wipe(T, "slant", 0.18, "R"); break;
            case "tr03": els = wipe(T, "chevron", 0.22, "R"); break;
            case "tr04": els = wipe(T, "flat", 0, "D"); break;
            case "tr05": els = wipe(T, "slant", 0.2, "U"); break;
            case "tr06": els = wipe(T, "slant", -0.5, "L"); break;
            case "tr07": els = bars(T, [0.12, 0.17, 0.1, 0.2, 0.13, 0.11, 0.17], ["c1", "c3", "c2", "c1", "c3", "c1", "c3"], [0.01, 0.08, 0.04, 0.11, 0.03, 0.09, 0.06], false, false); break;
            case "tr08": els = bars(T, [0.25, 0.25, 0.25, 0.25], ["c1", "c3"], [0.03, 0.08, 0.055, 0.105], true, true); break;
            case "tr09": els = bars(T, [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6], ["c1", "c3"], [0, 0.025, 0.05, 0.075, 0.1, 0.125], false, true, true); break;
            case "tr10": els = bars(T, [0.2, 0.2, 0.2, 0.2, 0.2], ["c1", "c3"], [0.03, 0.07, 0.03, 0.07, 0.03], true, true, true); break;
            case "tr11":   // staircase: bars with stepped ends, all moving together
                var N = 6, st = W * 0.09, Lb = 3 * W + (N - 1) * st * 1.7, s0 = -Lb - RUN * W, s1 = W + (N - 1) * st + RUN * W;
                for (i = 0; i < N; i++) {
                    var xa = -i * st, y0 = H * i / N - 1, y1 = H * (i + 1) / N + 1;
                    els.push(sweep("Tip " + (i + 1), "c2", rect(xa + Lb - W * 0.04, y0, xa + Lb, y1), [s0, 0], [s1, 0], d * 0.03, d * 0.97));
                    els.push(sweep("Step " + (i + 1), (i % 2) ? "c3" : "c1", rect(xa, y0, xa + Lb, y1), [s0, 0], [s1, 0], d * 0.03, d * 0.97));
                }
                break;
            case "tr12":   // pill bars race in from the right, the lowest first
                var NP = 6, pc = ["c1", "c3", "c1", "c2", "c1", "c3"];
                for (i = 0; i < NP; i++) {
                    var py0 = H * i / NP - 1, py1 = H * (i + 1) / NP + 1, pr = (py1 - py0) / 2, len = W * 3.2, ppts = stadium(pr, len - pr, (py0 + py1) / 2, pr, 8), pt0 = (0.03 + 0.013 * (NP - 1 - i)) * d;
                    els.push(sweep("Pill " + (i + 1), pc[i], ppts, [W + RUN * W, 0], [-len - RUN * W, 0], pt0, pt0 + d * 0.86));
                }
                break;
            case "tr13": els = slices(T, -22, 4, ["c1", "c3"], true, 0.025, true); break;
            case "tr14": els = slices(T, 35, 10, ["c1", "c2", "c3"], false, 0.012, false); break;
            case "tr15":   // circle: grows out of the middle with a white outline; a round hole opens with the same outline
                els = layered(T, [["Circle", "c1"], ["Ring", "c2"]], { ell: [cx, cy, R, R] }, [cx, cy]);
                th = 0.6; break;
            case "tr16":   // square spins while it grows, the hole spins on while it opens
                els = layered(T, [["Square", "c1"], ["Square Edge", "c2"]], { pts: ngon(cx, cy, R * 1.45, 4, Math.PI / 4) }, [cx, cy], [0, 135, 270]);
                th = 0.6; break;
            case "tr17":   // diamond: the diamond shape carries the change from A to B
                els = layered(T, [["Diamond", "c1"], ["Diamond Edge", "c3"]], { pts: ngon(cx, cy, (W + H) / 2 + T.OV * 2, 4, 0) }, [cx, cy]);
                th = 0.6; break;
            case "tr18":   // star, turning a little
                els = layered(T, [["Star", "c1"], ["Star Edge", "c2"]], { pts: star(cx, cy, R / 0.44 * 1.05, 5, 0.5, -Math.PI / 2) }, [cx, cy], [-30, 0, 30]);
                th = 0.55; break;
            case "tr19":   // ripples from the bottom-left corner: three colour rings that travel together
                var RC = Math.sqrt(W * W + H * H) + T.OV * 2, oc = [-T.OV, H + T.OV];
                els = layered(T, [["Ripple 1", "c1"], ["Ripple 2", "c2"], ["Ripple 3", "c3"]], { ell: [oc[0], oc[1], RC, RC] }, oc);
                th = 0.5; break;
            case "tr20":   // iris: the picture closes to a point and opens again (white outline on the edge)
                for (k = 0; k < 2; k++) {
                    var hk = k ? 1.2 * 0.9 : 1.2, hole = { ell: [cx, cy, R * hk, R * hk], g: { a: [cx, cy], s: ch([[d * 0.04, [100, 100]], [A, [0, 0]], [B, [0, 0]], [d * 0.96, [100, 100]]], ["grow", "hold", "open"]) } };
                    els.push(El(k ? "Iris Edge" : "Iris", k ? "c2" : "c1", [{ pts: rect(-W, -H, 2 * W, 2 * H) }, hole], { eo: true }));
                }
                th = 0.6; break;
            case "tr21":   // two circles roll in from the sides (the main colour last, so it covers all), a round hole opens
                var RL = Math.sqrt(W * W + H * H / 4) + T.OV * 2, RR = Math.sqrt(W * W / 4 + H * H) + T.OV;
                els.push(El("Circle L", "c1", [{ ell: [-T.OV, cy, RL, RL] }], { a: [-T.OV, cy], s: ch([[d * 0.1, [0, 0]], [A, [100, 100]]], ["grow"]), tOut: B }));
                els.push(El("Circle R", "c3", [{ ell: [W + T.OV, cy, RR, RR] }], { a: [W + T.OV, cy], s: ch([[d * 0.03, [0, 0]], [A - d * 0.08, [100, 100]]], ["grow"]), tOut: B }));
                var lo = layered(T, [["Opening", "c1"], ["Opening Edge", "c3"]], { ell: [cx, cy, R, R] }, [cx, cy]);
                els.push(lo[2], lo[3]);
                th = 0.6; break;
            case "tr22":   // bubbles pop up all over and shrink away
                g = grid(T, 6); q = rng(7);
                var A1 = [], A2 = [], A3 = [], rb = Math.sqrt(g.w * g.w + g.h * g.h) * 0.62;
                for (r = 0; r < g.r; r++) for (c = 0; c < g.c; c++) {
                    var bx = (c + 0.5) * g.w + (q() - 0.5) * g.w * 0.3, by = (r + 0.5) * g.h + (q() - 0.5) * g.h * 0.3, rr2 = rb * (1 + q() * 0.25), tq = q() * (A - d * 0.2);
                    var sh = { ell: [bx, by, rr2, rr2], g: { a: [bx, by], s: ch([[tq, [0, 0]], [tq + d * 0.2, [100, 100]], [B + tq, [100, 100]], [B + tq + d * 0.2, [0, 0]]], ["land", "hold", "leave"]) } };
                    k = (c + r * 2) % 3; (k === 0 ? A1 : (k === 1 ? A2 : A3)).push(sh);
                }
                els = [El("Bubbles A", "c1", A1), El("Bubbles B", "c3", A2), El("Bubbles C", "c2", A3)];
                th = 0.5; break;
            case "tr23": case "tr25":   // a line opens out, then fills the frame (23 horizontal, 25 vertical "TV");
                // the white edge rides on the same keyframes, a little thicker, so it is a thin outline
                var vtv = (id === "tr25");
                for (k = 0; k < 2; k++) {
                    var th0 = k ? 4.8 : 3, f0 = vtv ? [th0, 0] : [0, th0], f1 = vtv ? [th0, 100] : [100, th0];
                    els.push(El(k ? "Edge" : "Plate", k ? (vtv ? "c3" : "c2") : "c1", [{ pts: frame(T) }], { a: [cx, cy], s: ch([[d * 0.04, f0], [d * 0.22, f1], [A, [100, 100]], [B, [100, 100]], [d * 0.78, f1], [d * 0.96, f0]], ["land", "grow", "hold", "open", "leave"]) }));
                }
                th = 0.3; break;
            case "tr24":   // a cross grows out, its arms thicken until they meet
                var arms = [[1, 0.12], [0.12, 1]];
                for (k = 0; k < 2; k++) {
                    var aw = arms[k];
                    els.push(El(k ? "Cross V" : "Cross H", k ? "c3" : "c1", [{ pts: frame(T) }], { a: [cx, cy], s: ch([[d * 0.04 + k * d * 0.04, [0, 0]], [d * 0.24, [aw[0] * 100, aw[1] * 100]], [A, [100, 100]], [B, [100, 100]], [d * 0.76, [aw[0] * 100, aw[1] * 100]], [d * 0.96 - k * d * 0.04, [0, 0]]], ["land", "grow", "hold", "open", "leave"]) }));
                }
                th = 0.3; break;
            case "tr26": case "tr27":   // doors close from the sides (27 with a slanted seam) and open again
                var sl = (id === "tr27") ? H * 0.14 : 0, xt = cx + sl, xb = cx - sl, o = T.OV, e2 = W * 0.018;
                var Ld = [[-W, -o], [xt + 2, -o], [xb + 2, H + o], [-W, H + o]], Rd = [[xt - 2, -o], [2 * W, -o], [2 * W, H + o], [xb - 2, H + o]];
                var dl = [-(Math.max(xt, xb) + 2) - RUN * W, 0], dr = [W - Math.min(xt, xb) + 2 + RUN * W, 0];
                els = [visit("Edge L", "c2", [[xt + 2 - e2, -o], [xt + 2, -o], [xb + 2, H + o], [xb + 2 - e2, H + o]], dl, T, d * 0.04, d * 0.96),
                    visit("Edge R", "c2", [[xt - 2, -o], [xt - 2 + e2, -o], [xb - 2 + e2, H + o], [xb - 2, H + o]], dr, T, d * 0.04, d * 0.96),
                    visit("Door L", "c1", Ld, dl, T, d * 0.04, d * 0.96), visit("Door R", "c3", Rd, dr, T, d * 0.04, d * 0.96)];
                th = 0.15; break;
            case "tr28":   // shutter: closes from top and bottom, opens to the sides - one colour, so the swap at the
                // cut is invisible; the white edges sit under the halves and only show while they move
                var oo = T.OV, sw = Math.max(W, H) * 0.012;
                var top = rect(-oo, -oo, W + oo, cy + 1), bot = rect(-oo, cy - 1, W + oo, H + oo), lef = rect(-oo, -oo, cx + 1, H + oo), rig = rect(cx - 1, -oo, W + oo, H + oo);
                var pT = ch([[d * 0.03, [0, -cy - oo - sw - RUN * H]], [A, [0, 0]]], ["land"]), pB = ch([[d * 0.03, [0, cy + oo + sw + RUN * H]], [A, [0, 0]]], ["land"]);
                var pL = ch([[B, [0, 0]], [d * 0.97, [-cx - oo - sw - RUN * W, 0]]], ["leave"]), pR = ch([[B, [0, 0]], [d * 0.97, [cx + oo + sw + RUN * W, 0]]], ["leave"]);
                els = [El("Top", "c1", [{ pts: top }], { p: pT, tOut: B }), El("Bottom", "c1", [{ pts: bot }], { p: pB, tOut: B }),
                    El("Top Edge", "c2", [{ pts: rect(-oo, cy, W + oo, cy + sw) }], { p: pT, tOut: B }), El("Bottom Edge", "c2", [{ pts: rect(-oo, cy - sw, W + oo, cy) }], { p: pB, tOut: B }),
                    El("Left", "c1", [{ pts: lef }], { p: pL, tIn: B }), El("Right", "c1", [{ pts: rig }], { p: pR, tIn: B }),
                    El("Left Edge", "c2", [{ pts: rect(cx, -oo, cx + sw, H + oo) }], { p: pL, tIn: B }), El("Right Edge", "c2", [{ pts: rect(cx - sw, -oo, cx, H + oo) }], { p: pR, tIn: B })];
                th = 0.2; break;
            case "tr29":   // envelope: four triangles from the four edges meet in the middle
                var big = Math.max(W, H) * 1.2, ce = [cx, cy];
                var tris = [[[cx - big, -T.OV], [cx + big, -T.OV], ce, "Top", [0, -cy - RUN * H], "c1"], [[cx - big, H + T.OV], [cx + big, H + T.OV], ce, "Bottom", [0, cy + RUN * H], "c1"],
                    [[-T.OV, cy - big], [-T.OV, cy + big], ce, "Left", [-cx - RUN * W, 0], "c3"], [[W + T.OV, cy - big], [W + T.OV, cy + big], ce, "Right", [cx + RUN * W, 0], "c3"]];
                for (i = 0; i < 4; i++) els.push(visit(tris[i][3], tris[i][5], [tris[i][0], tris[i][1], [tris[i][2][0] + (i < 2 ? 0 : (i === 2 ? 3 : -3)), tris[i][2][1] + (i === 0 ? 3 : (i === 1 ? -3 : 0))]], tris[i][4], T, d * 0.02 * i, d * (1 - 0.02 * i)));
                th = 0.25; break;
            case "tr30":   // four corners: quarters fly in from the corners
                var qs = [[-1, -1, "c1"], [1, -1, "c3"], [1, 1, "c1"], [-1, 1, "c3"]];
                for (i = 0; i < 4; i++) {
                    var qx0 = qs[i][0] < 0 ? -T.OV : cx - 1, qy0 = qs[i][1] < 0 ? -T.OV : cy - 1;
                    els.push(visit("Corner " + (i + 1), qs[i][2], rect(qx0, qy0, qx0 + cx + T.OV + 1, qy0 + cy + T.OV + 1), [qs[i][0] * (cx + T.OV + RUN * W), qs[i][1] * (cy + T.OV + RUN * H)], T, d * 0.025 * i, d * (1 - 0.025 * (3 - i))));
                }
                th = 0.25; break;
            case "tr31":   // corner clash: two triangles from opposite corners meet on the diagonal
                var o3 = T.OV * 3, ew = Math.max(W, H) * 0.012, nx = H / Math.sqrt(W * W + H * H), ny = W / Math.sqrt(W * W + H * H);
                var t1p = [[-o3, -o3], [W + o3 + 2, -o3], [-o3, H + o3 + 2]], t2p = [[W + o3, H + o3], [-o3 - 2, H + o3], [W + o3, -o3 - 2]];
                var edge = [[W + o3, -o3], [W + o3 + ew * 2, -o3 + ew], [-o3 + ew, H + o3 + ew * 2], [-o3, H + o3]];
                els = [visit("Edge", "c2", edge, [-(W + RUN * W), -(H + RUN * H)], T, d * 0.04, d * 0.96),
                    visit("Half A", "c1", t1p, [-(W + RUN * W), -(H + RUN * H)], T, d * 0.04, d * 0.96),
                    visit("Half B", "c3", t2p, [W + RUN * W, H + RUN * H], T, d * 0.04, d * 0.96)];
                th = 0.25; break;
            case "tr32":   // hourglass: two big triangles from top and bottom overlap
                var o4 = T.OV;
                els = [visit("Top", "c1", [[-W, -o4], [2 * W, -o4], [cx, H + o4]], [0, -H - RUN * H], T, d * 0.03, d * 0.97),
                    visit("Bottom", "c3", [[-W, H + o4], [2 * W, H + o4], [cx, -o4]], [0, H + RUN * H], T, d * 0.06, d * 0.94)];
                th = 0.25; break;
            case "tr33":   // jaws: zigzag teeth close from top and bottom
                var nt = 8, tw2 = (W + 2 * T.OV) / nt, amp = H * 0.12, jt = [[-T.OV, -T.OV], [W + T.OV, -T.OV]], jb = [[W + T.OV, H + T.OV], [-T.OV, H + T.OV]];
                for (i = nt; i >= 0; i--) jt.push([-T.OV + i * tw2, cy + (i % 2 ? amp : -amp * 0.2)]);
                for (i = 0; i <= nt; i++) jb.push([-T.OV + i * tw2, cy + (i % 2 ? amp * 0.2 : -amp)]);
                els = [visit("Upper Jaw", "c1", jt, [0, -cy - amp - RUN * H], T, d * 0.03, d * 0.97), visit("Lower Jaw", "c3", jb, [0, cy + amp + RUN * H], T, d * 0.03, d * 0.97)];
                th = 0.25; break;
            case "tr34":   // zoom squares: one square with three colour outlines grows out, then opens as a square hole
                var zs = Math.max(W, H) * 0.5 + T.OV;
                els = layered(T, [["Square", "c1"], ["Square 2", "c3"], ["Square 3", "c2"], ["Square 4", "c3"]], { pts: rect(cx - zs, cy - zs, cx + zs, cy + zs) }, [cx, cy]);
                th = 0.6; break;
            case "tr35":   // squeeze box: a frame closes in from all edges and opens again, a thin white edge inside it
                for (k = 0; k < 2; k++) {
                    var bk = k ? 1.12 * 0.93 : 1.12, hole2 = { pts: rect(cx - (W / 2 + T.OV) * bk, cy - (H / 2 + T.OV) * bk, cx + (W / 2 + T.OV) * bk, cy + (H / 2 + T.OV) * bk), g: { a: [cx, cy], s: ch([[d * 0.04, [100, 100]], [A, [0, 0]], [B, [0, 0]], [d * 0.96, [100, 100]]], ["grow", "hold", "open"]) } };
                    els.push(El(k ? "Box Edge" : "Box", k ? "c2" : "c1", [{ pts: rect(-W, -H, 2 * W, 2 * H) }, hole2], { eo: true }));
                }
                th = 0.6; break;
            case "tr36": case "tr38": case "tr39":   // grid pops: diagonal wave / spiral / scattered
                g = grid(T, 8);
                var order = [], gA = [], gB = [], gC = [], n2;
                for (r = 0; r < g.r; r++) for (c = 0; c < g.c; c++) order.push([c, r]);
                if (id === "tr36") order.sort(function (u, v) { return (u[0] + u[1]) - (v[0] + v[1]); });
                else if (id === "tr38") {
                    order = []; var tp2 = 0, bt = g.r - 1, lf = 0, rt = g.c - 1;
                    while (tp2 <= bt && lf <= rt) {
                        for (c = lf; c <= rt; c++) order.push([c, tp2]);
                        for (r = tp2 + 1; r <= bt; r++) order.push([rt, r]);
                        if (bt > tp2) for (c = rt - 1; c >= lf; c--) order.push([c, bt]);
                        if (rt > lf) for (r = bt - 1; r > tp2; r--) order.push([lf, r]);
                        tp2++; bt--; lf++; rt--;
                    }
                } else { q = rng(3); for (i = order.length - 1; i > 0; i--) { j = Math.floor(q() * (i + 1)); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; } }
                n2 = order.length;
                var popT = d * 0.16, gap2 = (A - popT) / Math.max(1, n2 - 1);
                for (k = 0; k < n2; k++) {
                    c = order[k][0]; r = order[k][1];
                    var cc = [(c + 0.5) * g.w, (r + 0.5) * g.h], ct = k * gap2;
                    var sh2 = pop(cell(g, c, r), cc, ct, ct + popT, B + ct, B + ct + popT);
                    if (id === "tr39") (k % 3 === 0 ? gA : (k % 3 === 1 ? gB : gC)).push(sh2); else ((c + r) % 2 ? gB : gA).push(sh2);
                }
                els = [El("Cells A", "c1", gA), El("Cells B", "c3", gB)];
                if (gC.length) els.push(El("Cells C", "c2", gC));
                th = 0.5; break;
            case "tr37":   // checker: two halves of a checkerboard slide in from above and below
                g = grid(T, 8);
                var cA = [], cB = [], dy = H + 2 * T.OV + RUN * H;
                for (r = 0; r < g.r; r++) for (c = 0; c < g.c; c++) ((c + r) % 2 ? cB : cA).push({ pts: cell(g, c, r) });
                els = [El("Checks A", "c1", cA, { p: ch([[0, [0, -dy]], [A, [0, 0]], [B, [0, 0]], [d, [0, dy]]], ["land", "hold", "leave"]) }),
                    El("Checks B", "c3", cB, { p: ch([[0, [0, dy]], [A, [0, 0]], [B, [0, 0]], [d, [0, -dy]]], ["land", "hold", "leave"]) })];
                th = 0.4; break;
            case "tr40":   // triangle tiles: each cell fills from two opposite corners
                g = grid(T, 6);
                var tA = [], tB = [], sp = A * 0.35, lead = A * 0.2, gr = A - sp - lead;
                for (r = 0; r < g.r; r++) for (c = 0; c < g.c; c++) {
                    var x0 = c * g.w - 1, y0b = r * g.h - 1, x1 = (c + 1) * g.w + 1, y1b = (r + 1) * g.h + 1, qq = c / Math.max(1, g.c - 1) * sp;
                    tA.push(pop([[x0, y0b - 3], [x1 + 3, y1b], [x0, y1b]], [x0, y1b], qq, qq + gr, B + qq, B + qq + gr));
                    tB.push(pop([[x0 - 3, y0b], [x1, y0b], [x1, y1b + 3]], [x1, y0b], lead + qq, lead + qq + gr, B + lead + qq, B + lead + qq + gr));
                }
                els = [El("Tiles A", "c1", tA), El("Tiles B", "c3", tB)];
                th = 0.5; break;
            case "tr41":   // halftone: a grid of dots grows from left to right until they run together
                var cl2 = Math.sqrt(W * H / 40), nc = Math.ceil(W / cl2), nr = Math.ceil(H / cl2), ox = (W - nc * cl2) / 2, oy = (H - nr * cl2) / 2, rd = cl2 * 0.75;
                var dA = [], dB = [], lead2 = d * 0.05, sp2 = (A - lead2) * 0.5, gr2 = A - lead2 - sp2;
                for (r = 0; r < nr; r++) for (c = 0; c < nc; c++) {
                    var dx2 = ox + (c + 0.5) * cl2, dy2 = oy + (r + 0.5) * cl2, qd = c / Math.max(1, nc - 1) * sp2;
                    dA.push(pop(ngon(dx2, dy2, rd, 16, 0), [dx2, dy2], lead2 + qd, lead2 + qd + gr2, B + qd, B + qd + gr2));
                    dB.push(pop(ngon(dx2, dy2, rd, 16, 0), [dx2, dy2], qd, qd + gr2, B + lead2 + qd, B + lead2 + qd + gr2));
                }
                els = [El("Dots", "c1", dA), El("Dot Shadows", "c3", dB)];
                th = 0.4; break;
            case "tr42": case "tr43":   // blinds: slats open out of their centre lines (42 vertical, 43 horizontal)
                var nb = 7, vert = (id === "tr42"), bA = [], bB = [], st2 = d * 0.025, cd = d * 0.24;
                for (i = 0; i < nb; i++) {
                    var b0 = (vert ? W : H) * i / nb - 1, b1 = (vert ? W : H) * (i + 1) / nb + 1, mid = (b0 + b1) / 2, tb = i * st2, to = A - cd - (nb - 1) * st2;
                    var pts2 = vert ? rect(b0, -T.OV, b1, H + T.OV) : rect(-T.OV, b0, W + T.OV, b1), pv2 = vert ? [mid, cy] : [cx, mid];
                    var zero = vert ? [0, 100] : [100, 0];
                    var sb = { pts: pts2, g: { a: pv2, s: ch([[tb + Math.max(0, to), zero], [tb + Math.max(0, to) + cd, [100, 100]], [B + tb, [100, 100]], [B + tb + cd, zero]], ["land", "hold", "leave"]) } };
                    (i % 2 ? bB : bA).push(sb);
                }
                els = [El("Slats A", "c1", bA), El("Slats B", "c3", bB)];
                th = 0.5; break;
            case "tr44": case "tr46":   // pinwheel (44, from the centre) / fan (46, from the bottom-left corner): blades open
                var fan = (id === "tr46"), nbl = fan ? 6 : 8, C0 = fan ? [-T.OV, H + T.OV] : [cx, cy], Rb = (fan ? Math.sqrt(W * W + H * H) + 4 * T.OV : R * 1.3) / Math.cos(Math.PI / nbl);
                var a0 = fan ? -Math.PI / 2 : -Math.PI / 2, stepA = (fan ? Math.PI / 2 : 2 * Math.PI) / nbl, wA = [], wB = [], stb = fan ? d * 0.03 : 0;
                for (i = 0; i < nbl; i++) {
                    var aA = a0 + i * stepA - 0.015, aB = a0 + (i + 1) * stepA + 0.015, PA = [C0[0] + Rb * Math.cos(aA), C0[1] + Rb * Math.sin(aA)], PB = [C0[0] + Rb * Math.cos(aB), C0[1] + Rb * Math.sin(aB)];
                    // the blade's point sits a little behind the centre, so neighbouring blades overlap there too
                    var am = (aA + aB) / 2, Cb = [C0[0] - 14 * Math.cos(am), C0[1] - 14 * Math.sin(am)];
                    var t0b = i * stb + d * 0.03, t1b = A - (nbl - 1 - i) * stb, t2b = B + i * stb, t3b = d * 0.97 - (nbl - 1 - i) * stb;
                    var blade = { k: [[t0b, [Cb, PA, PA]], [t1b, [Cb, PA, PB]], [t2b, [Cb, PA, PB]], [t3b, [Cb, PB, PB]]], e: ["grow", "hold", "open"] };
                    (i % 2 ? wB : wA).push(blade);
                }
                els = [El("Blades A", "c1", wA), El("Blades B", "c3", wB)];
                th = 0.45; break;
            case "tr45":   // clock wipe: the hand sweeps round to cover and once more to uncover; a thin white wedge
                // rides just ahead of it on the way in and just behind it on the way out
                var S2 = R * 1.6, NA = 24, NK = 16, lead = 0.12, a12 = -Math.PI / 2;
                var wedgeA = function (a0, a1) { var w = [[cx, cy]], m; for (m = 0; m <= NA; m++) { var an = a0 + (a1 - a0) * m / NA; w.push([cx + S2 * Math.cos(an), cy + S2 * Math.sin(an)]); } return w; };
                var sweepS = function (u) { return 0.5 - Math.cos(Math.PI * u) / 2; };
                for (k = 0; k < 2; k++) {
                    var kk = [], ee = [], t0c = d * 0.04, t1c = A, t2c = B, t3c = d * 0.96;
                    for (i = 0; i <= NK; i++) {
                        var e1 = 2 * Math.PI * sweepS(i / NK), ld = k ? Math.min(lead, e1) : 0;
                        kk.push([t0c + (t1c - t0c) * i / NK, wedgeA(a12, a12 + Math.min(2 * Math.PI, e1 + ld))]);
                        if (i) ee.push("lin");
                    }
                    ee.push("hold");
                    for (i = 0; i <= NK; i++) {
                        var e2b = 2 * Math.PI * sweepS(i / NK), lg = k ? Math.min(lead, e2b) : 0;
                        kk.push([t2c + (t3c - t2c) * i / NK, wedgeA(a12 + Math.max(0, e2b - lg), a12 + 2 * Math.PI)]);
                        if (i) ee.push("lin");
                    }
                    els.push(El(k ? "Hand Edge" : "Hand", k ? "c2" : "c1", [{ k: kk, e: ee }]));
                }
                th = 0.45; break;
            case "tr47":   // propeller: blades grow and turn until they close into one disc
                var Rp = R * 1.08 / Math.cos(Math.PI / 8), pA = [], pB = [];
                for (i = 0; i < 8; i++) {
                    var b1a = -Math.PI / 2 + i * Math.PI / 4 - 0.02, b2a = b1a + Math.PI / 4 + 0.04, bm = (b1a + b2a) / 2;
                    (i % 2 ? pB : pA).push({ pts: [[cx - 14 * Math.cos(bm), cy - 14 * Math.sin(bm)], [cx + Rp * Math.cos(b1a), cy + Rp * Math.sin(b1a)], [cx + Rp * Math.cos((b1a + b2a) / 2) * 1.02, cy + Rp * Math.sin((b1a + b2a) / 2) * 1.02], [cx + Rp * Math.cos(b2a), cy + Rp * Math.sin(b2a)]] });
                }
                els = [El("Propeller A", "c1", pA, { a: [cx, cy], s: ch([[d * 0.03, [0, 0]], [A, [100, 100]], [B, [100, 100]], [d * 0.97, [0, 0]]], ["grow", "hold", "leave"]), r: ch([[d * 0.03, -90], [A, 0], [B, 0], [d * 0.97, 90]], ["grow", "hold", "leave"]) }),
                    El("Propeller B", "c3", pB, { a: [cx, cy], s: ch([[d * 0.03, [0, 0]], [A, [100, 100]], [B, [100, 100]], [d * 0.97, [0, 0]]], ["grow", "hold", "leave"]), r: ch([[d * 0.03, 90], [A, 0], [B, 0], [d * 0.97, -90]], ["grow", "hold", "leave"]) })];
                th = 0.45; break;
            case "tr48":   // equalizer: bars jump up to different heights, then all fill the frame
                var ne = 12, eq = rng(11), eA = [], eB = [], ew2 = W / ne;
                for (i = 0; i < ne; i++) {
                    var ex0 = i * ew2 - 1, ex1 = (i + 1) * ew2 + 1, hz = 100, h1 = 25 + eq() * 55, h2 = 10 + eq() * 30, te = i * d * 0.012;
                    var eqs = { pts: rect(ex0, -T.OV, ex1, H + T.OV), g: { a: [(ex0 + ex1) / 2, H + T.OV], s: ch([[te, [100, 0]], [te + A * 0.35, [100, h1]], [te + A * 0.6, [100, h2 + 20]], [A - d * 0.012 * (ne - 1 - i), [100, hz]], [B + te, [100, hz]], [B + te + (d - B - d * 0.012 * ne) * 0.45, [100, h1 * 0.7]], [d - d * 0.012 * (ne - i), [100, 0]]], ["smooth", "smooth", "grow", "hold", "smooth", "leave"]) } };
                    (i % 2 ? eB : eA).push(eqs);
                }
                els = [El("Bars A", "c1", eA), El("Bars B", "c3", eB)];
                th = 0.35; break;
            case "tr49":   // piano: keys drop from the top one after another and fall on through
                var nk = 10, kw = W / nk, kA = [], kB = [], kE = [], dyk = H + 2 * T.OV + RUN * H;
                for (i = 0; i < nk; i++) {
                    var kx0 = i * kw - 1, kx1 = (i + 1) * kw + 1, tk = i * d * 0.018;
                    var ks = { pts: rect(kx0, -T.OV, kx1, H + T.OV), g: { a: [0, 0], p: ch([[tk, [0, -dyk]], [A - d * 0.018 * (nk - 1 - i), [0, 0]], [B + tk, [0, 0]], [d - d * 0.018 * (nk - 1 - i), [0, dyk]]], ["land", "hold", "leave"]) } };
                    var kl = { pts: rect(kx1 - Math.max(2, W * 0.004), -T.OV, kx1 + Math.max(2, W * 0.004), H + T.OV), g: ks.g };
                    (i % 2 ? kB : kA).push(ks); if (i < nk - 1) kE.push(kl);
                }
                els = [El("Key Lines", "c2", kE), El("Keys A", "c1", kA), El("Keys B", "c3", kB)];
                th = 0.35; break;
            case "tr50":   // colour blocks slide into three parts of the frame from three sides
                var o5 = T.OV, bl = [[rect(-o5, -o5, W * 0.45 + 1, H + o5), [-W * 0.45 - o5 - RUN * W, 0], "c1"], [rect(W * 0.45 - 1, -o5, W + o5, H * 0.55 + 1), [0, -H * 0.55 - o5 - RUN * H], "c2"], [rect(W * 0.45 - 1, H * 0.55 - 1, W + o5, H + o5), [W * 0.55 + o5 + RUN * W, 0], "c3"]];
                for (i = 0; i < 3; i++) els.push(visit("Block " + (i + 1), bl[i][2], bl[i][0], bl[i][1], T, d * 0.03 * i, d * (1 - 0.03 * (2 - i))));
                th = 0.25; break;
        }
        return { d: d, cut: T.cut, a: A, b: B, th: th, els: els };
    }

    var LIST = [
        ["tr01", "Clean Wipe"], ["tr02", "Slant Wipe"], ["tr03", "Arrow Wipe"], ["tr04", "Drop Wipe"], ["tr05", "Rise Slant"],
        ["tr06", "Corner Wipe"], ["tr07", "Speed Bars"], ["tr08", "Interlock"], ["tr09", "Column Drop"], ["tr10", "Column Clash"],
        ["tr11", "Staircase"], ["tr12", "Pill Race"], ["tr13", "Diagonal Slices"], ["tr14", "Candy Stripes"], ["tr15", "Circle Burst"],
        ["tr16", "Spin Square"], ["tr17", "Diamond"], ["tr18", "Star"], ["tr19", "Corner Ripple"], ["tr20", "Iris"],
        ["tr21", "Twin Circles"], ["tr22", "Bubbles"], ["tr23", "Line Expand"], ["tr24", "Cross Expand"], ["tr25", "TV Line"],
        ["tr26", "Doors"], ["tr27", "Angled Doors"], ["tr28", "Shutter"], ["tr29", "Envelope"], ["tr30", "Four Corners"],
        ["tr31", "Corner Clash"], ["tr32", "Hourglass"], ["tr33", "Jaws"], ["tr34", "Zoom Squares"], ["tr35", "Squeeze Box"],
        ["tr36", "Grid Wave"], ["tr37", "Checker"], ["tr38", "Spiral Blocks"], ["tr39", "Pixel Scatter"], ["tr40", "Triangle Tiles"],
        ["tr41", "Halftone"], ["tr42", "Vertical Blinds"], ["tr43", "Blinds"], ["tr44", "Pinwheel"], ["tr45", "Clock Wipe"],
        ["tr46", "Corner Fan"], ["tr47", "Propeller"], ["tr48", "Equalizer"], ["tr49", "Piano"], ["tr50", "Color Blocks"]
    ];
    var list = [], n;
    for (n = 0; n < LIST.length; n++) list.push({ id: LIST[n][0], name: LIST[n][1] });
    return { list: list, EASE: EASE, build: build };
})();
if (typeof UK_CAT !== "undefined") UK_CAT.transitions = UK_TR.list;

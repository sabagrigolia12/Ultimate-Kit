/*  Ultimate Kit — transitions (broadcast + SaaS)
    Every overlay transition is a precomp whose frame is fully covered at its midpoint.
    It is placed so the midpoint sits on the playhead (= your cut point).              */

UK.TR = {};
UK.TR.R = {};   // recipes

/* ---------------------------------------------------------------- context */
UK.TR.ctx = function (c, D, pal) {
    var x = { c: c, W: c.width, H: c.height, D: D, pal: pal, cx: c.width / 2, cy: c.height / 2, ctl: "CONTROLS" };
    x.T = function (u) { return UK.snap(c, UK.clamp(u, 0, 1) * D); };
    x.fill = function (vecs, ci, op) {
        var f = UK.addFill(vecs, pal[ci - 1], op);
        f.property("ADBE Vector Fill Color").expression = UK.colorExpr(x.ctl, ci);
        return f;
    };
    x.stroke = function (vecs, ci, w, o) {
        var s = UK.addStroke(vecs, pal[ci - 1], w, o);
        s.property("ADBE Vector Stroke Color").expression = UK.colorExpr(x.ctl, ci);
        return s;
    };
    /* Gradient Ramp (comp-space points) coloured from the control colours */
    x.ramp = function (L, ciA, ciB, pA, pB) {
        var e = UK.fx(L, "ADBE Ramp", "Gradient");
        e = UK.efx(L, "Gradient");
        e.property("ADBE Ramp-0001").setValue(pA);
        e.property("ADBE Ramp-0003").setValue(pB);
        e.property("ADBE Ramp-0002").setValue(UK.rgba(pal[ciA - 1]));
        e.property("ADBE Ramp-0004").setValue(UK.rgba(pal[ciB - 1]));
        e.property("ADBE Ramp-0002").expression = UK.colorExpr(x.ctl, ciA);
        e.property("ADBE Ramp-0004").expression = UK.colorExpr(x.ctl, ciB);
        return e;
    };
    /* 2-colour gradient on a whole layer: white->black shape gradient remapped by CC Toner */
    x.toner = function (L, ciLight, ciDark) {
        var e = UK.fx(L, "CC Toner", "Gradient Colors");
        e = UK.efx(L, "Gradient Colors");
        try { e.property("CC Toner-0005").setValue(1); } catch (er) { }
        e.property("CC Toner-0001").setValue(UK.rgba(pal[ciLight - 1]));
        e.property("CC Toner-0003").setValue(UK.rgba(pal[ciDark - 1]));
        e.property("CC Toner-0001").expression = UK.colorExpr(x.ctl, ciLight);
        e.property("CC Toner-0003").expression = UK.colorExpr(x.ctl, ciDark);
        return e;
    };
    return x;
};
/* stagger slots */
UK.TR.order = function (n, mode, seed) {
    var s = [], i;
    for (i = 0; i < n; i++) s.push(i);
    if (mode === "rev") { for (i = 0; i < n; i++) s[i] = n - 1 - i; }
    else if (mode === "center") { for (i = 0; i < n; i++) s[i] = Math.round(Math.abs(i - (n - 1) / 2)); }
    else if (mode === "random") {
        var r = UK.rng(seed || 3), idx = [];
        for (i = 0; i < n; i++) idx.push(i);
        for (i = n - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
        for (i = 0; i < n; i++) s[idx[i]] = i;
    }
    return s;
};
UK.TR.max = function (a) { var m = 0; for (var i = 0; i < a.length; i++) if (a[i] > m) m = a[i]; return m; };
UK.TR.stack = function (n) { return n === 1 ? [1] : (n === 2 ? [2, 1] : (n === 3 ? [3, 2, 1] : [3, 2, 3, 1])); };

/* ================================================================ recipes */

/* Sliding panels: parallelogram | chevron | rounded rect, stacked with stagger */
UK.TR.R.panels = function (x, p) {
    var dir = p.dir || 0, n = p.n || 1, hold = (p.hold !== undefined) ? p.hold : 0.03;
    var st = (p.stagger !== undefined) ? p.stagger : (n > 1 ? 0.06 : 0);
    var shape = p.shape || "para";
    var ex = UK.extents(x.W, x.H, dir), A = ex.along, B = ex.across;
    var s = (shape === "para") ? (B / 2) * Math.tan(UK.rad(p.skew || 0)) : 0;
    var tip = (shape === "chevron") ? (B / 2) * (p.tip || 0.35) : 0;
    var zz = p.zigzag ? p.zigzag.size : 0;
    var PH = B + 80 + zz * 2;
    var PW = A + 2 * Math.abs(s) + 2 * tip + 80 + zz * 2;
    var ns = p.stripes || 0;
    var sw = Math.max(8, A * (p.stripeW || 0.035)), gap = sw * 0.75;
    var sExt = ns * (sw + gap);
    var S = A / 2 + PW / 2 + Math.abs(s) + tip + sExt + 40;
    var dv = [Math.cos(UK.rad(dir)), Math.sin(UK.rad(dir))];
    var colors = p.colors || UK.TR.stack(n);
    var inDur = 0.5 - hold - st * (n - 1);
    var hw = PW / 2, hh = PH / 2;

    function body(v, x0, w) {   // one panel/stripe spanning [x0, x0 + w] along the motion axis
        if (shape === "chevron") {
            UK.addPath(v, [[x0 - tip, -hh], [x0 + w - tip, -hh], [x0 + w, 0], [x0 + w - tip, hh], [x0 - tip, hh], [x0, 0]]);
        } else if (shape === "round") {
            UK.addRect(v, [w, PH], [x0 + w / 2, 0], Math.min(p.round || 60, w / 2));
        } else {
            UK.addPath(v, [[x0 + s, -hh], [x0 + w + s, -hh], [x0 + w - s, hh], [x0 - s, hh]]);
        }
    }

    for (var k = 0; k < n; k++) {
        var L = UK.shapeLayer(x.c, n === 1 ? "Panel" : "Panel " + (k + 1));
        var g = UK.group(UK.root(L), "Panel");
        var v = UK.vecs(g);
        if (shape === "chevron") body(v, -hw, PW);   // chevron spans from notch (-hw) to tip (+hw)
        else body(v, -hw, PW);
        if (p.zigzag) UK.addZigzag(v, p.zigzag.size, p.zigzag.ridges, p.zigzag.smooth);
        if (p.gradient && k === n - 1) {
            UK.addGradFill(v, false, [-hw * 0.6, -hh * 0.3], [hw * 0.6, hh * 0.3]);
        } else {
            x.fill(v, colors[k]);
        }
        if (k === n - 1 && ns > 0) {
            for (var j = 0; j < ns; j++) {
                var lead = UK.group(UK.root(L), "Stripe Lead " + (j + 1));
                var lv = UK.vecs(lead);
                body(lv, hw + gap + j * (sw + gap), sw);
                x.fill(lv, j % 2 === 0 ? 3 : 2);
                var trail = UK.group(UK.root(L), "Stripe Trail " + (j + 1));
                var tv = UK.vecs(trail);
                body(tv, -hw - gap - sw - j * (sw + gap), sw);
                x.fill(tv, j % 2 === 0 ? 3 : 2);
            }
        }
        if (p.gradient && k === n - 1) x.toner(L, 1, 2);
        UK.rot(L).setValue(dir);
        var lag = (n - 1 - k) * st;
        var b = 0.5 - hold - lag, c = 0.5 + hold + lag;
        UK.inOut(UK.pos(L), x.T(b - inDur), x.T(b), x.T(c), x.T(c + inDur),
            [x.cx - dv[0] * S, x.cy - dv[1] * S], [x.cx, x.cy], [x.cx + dv[0] * S, x.cy + dv[1] * S],
            p.cin || "out", p.cout || "in");
    }
};

/* Parallel lines drawn on / off with Trim Paths */
UK.TR.R.stripes = function (x, p) {
    var ang = p.angle || 0, n = p.n || 6, hold = (p.hold !== undefined) ? p.hold : 0.025;
    var ex = UK.extents(x.W, x.H, ang), A = ex.along, B = ex.across;
    var th = B / n + 4;
    var len = A + th * 2 + 120;
    var slots = UK.TR.order(n, p.order, p.seed), maxS = UK.TR.max(slots);
    var st = (p.stagger !== undefined) ? p.stagger : Math.min(0.06, 0.24 / Math.max(1, maxS));
    var dur = 0.5 - hold - st * maxS;
    var colors = p.colors || [1, 2];
    var L = UK.shapeLayer(x.c, "Stripes");
    for (var i = 0; i < n; i++) {
        var y = -B / 2 + (i + 0.5) * B / n;
        var rev = (p.order === "alt" && i % 2 === 1);
        var g = UK.group(UK.root(L), "Stripe " + (i + 1));
        var v = UK.vecs(g);
        var a0 = [-len / 2, y], a1 = [len / 2, y];
        UK.addPath(v, rev ? [a1, a0] : [a0, a1], null, null, false);
        var tr = UK.addTrim(v, "Trim");
        var a = st * slots[i], b = a + dur, c = 0.5 + hold + st * slots[i], d = c + dur;
        if (p.grow === "center") {
            UK.anim(tr.property("ADBE Vector Trim Start"), [[x.T(a), 50], [x.T(b), 0], [x.T(c), 0], [x.T(d), 50]], ["out", "linear", "in"]);
            UK.anim(tr.property("ADBE Vector Trim End"), [[x.T(a), 50], [x.T(b), 100], [x.T(c), 100], [x.T(d), 50]], ["out", "linear", "in"]);
        } else {
            UK.anim(tr.property("ADBE Vector Trim End"), [[x.T(a), 0], [x.T(b), 100]], ["out"]);
            UK.anim(tr.property("ADBE Vector Trim Start"), [[x.T(c), 0], [x.T(d), 100]], ["in"]);
        }
        x.stroke(v, colors[i % colors.length], th, { cap: p.round ? 2 : 1 });
    }
    UK.rot(L).setValue(ang);
};

/* Concentric discs that open into rings (stroke-width trick) */
UK.TR.R.iris = function (x, p) {
    var at = p.at || [0.5, 0.5], n = p.n || 2, hold = (p.hold !== undefined) ? p.hold : 0.03;
    var st = (p.stagger !== undefined) ? p.stagger : 0.07;
    var P = [at[0] * x.W, at[1] * x.H];
    var R = 0, corners = [[0, 0], [x.W, 0], [0, x.H], [x.W, x.H]];
    for (var q = 0; q < 4; q++) R = Math.max(R, Math.sqrt(Math.pow(corners[q][0] - P[0], 2) + Math.pow(corners[q][1] - P[1], 2)));
    R += 40;
    var colors = p.colors || UK.TR.stack(n);
    var inDur = 0.5 - hold - st * (n - 1);
    for (var k = 0; k < n; k++) {
        var L = UK.shapeLayer(x.c, "Ring " + (k + 1));
        var g = UK.group(UK.root(L), "Ring");
        var v = UK.vecs(g);
        var e = UK.addEllipse(v, [0, 0], [0, 0], "Circle");
        var lag = (n - 1 - k) * st, b = 0.5 - hold - lag, c = 0.5 + hold + lag;
        var T = [x.T(b - inDur), x.T(b), x.T(c), x.T(c + inDur)];
        UK.anim(e.property("ADBE Vector Ellipse Size"), [[T[0], [0, 0]], [T[1], [R, R]], [T[2], [R, R]], [T[3], [2 * R, 2 * R]]], [p.cin || "out", "linear", p.cout || "inout"]);
        var sk = x.stroke(v, colors[k], 0);
        UK.anim(sk.property("ADBE Vector Stroke Width"), [[T[0], 0], [T[1], R], [T[2], R], [T[3], 0]], [p.cin || "out", "linear", p.cout || "inout"]);
        if (p.gradient && k === n - 1) x.ramp(L, 1, 3, [x.W * 0.1, x.H * 0.05], [x.W * 0.95, x.H * 0.95]);
        UK.pos(L).setValue(P);
    }
};

/* Clock wipes: a disc drawn on with Trim Paths */
UK.TR.R.clock = function (x, p) {
    var at = p.at || [0.5, 0.5], n = p.n || 1, hold = (p.hold !== undefined) ? p.hold : 0.03;
    var st = (p.stagger !== undefined) ? p.stagger : 0.07;
    var P = [at[0] * x.W, at[1] * x.H];
    var R = 0, corners = [[0, 0], [x.W, 0], [0, x.H], [x.W, x.H]];
    for (var q = 0; q < 4; q++) R = Math.max(R, Math.sqrt(Math.pow(corners[q][0] - P[0], 2) + Math.pow(corners[q][1] - P[1], 2)));
    R += 40;
    var colors = p.colors || UK.TR.stack(n);
    var inDur = 0.5 - hold - st * (n - 1);
    for (var k = 0; k < n; k++) {
        var L = UK.shapeLayer(x.c, "Clock " + (k + 1));
        var g = UK.group(UK.root(L), "Clock");
        var v = UK.vecs(g);
        var e = UK.addEllipse(v, [R, R], [0, 0], "Circle");
        if (p.alt && k % 2 === 1) e.property("ADBE Vector Shape Direction").setValue(3);
        var tr = UK.addTrim(v, "Trim");
        var lag = (n - 1 - k) * st, b = 0.5 - hold - lag, c = 0.5 + hold + lag;
        UK.anim(tr.property("ADBE Vector Trim End"), [[x.T(b - inDur), 0], [x.T(b), 100]], [p.cin || "outSoft"]);
        UK.anim(tr.property("ADBE Vector Trim Start"), [[x.T(c), 0], [x.T(c + inDur), 100]], [p.cout || "inSoft"]);
        tr.property("ADBE Vector Trim Offset").setValue((p.offset || 0) * k + (p.startAngle || 0));
        x.stroke(v, colors[k], R, { cap: 1 });
        UK.pos(L).setValue(P);
    }
};

/* Doors / split pieces that close over the frame and retreat */
UK.TR.R.doors = function (x, p) {
    var W = x.W, H = x.H, m = 40, hold = (p.hold !== undefined) ? p.hold : 0.06, ov = 8;
    var pieces = [];
    var R = p.round || 0;
    if (p.mode === "v") {
        pieces.push({ name: "Door Top", rect: [-m, -m - R, W + m, H / 2 + ov], off: [0, -(H / 2 + m + 2 * R + 60)] });
        pieces.push({ name: "Door Bottom", rect: [-m, H / 2 - ov, W + m, H + m + R], off: [0, H / 2 + m + 2 * R + 60] });
    } else if (p.mode === "diag") {
        var o = Math.min(W, H) * 0.08, k = Math.max(W, H) + 200;
        pieces.push({ name: "Split A", poly: [[-m, -m], [W + m + o, -m], [-m, H + m + o]], off: [-k, -k] });
        pieces.push({ name: "Split B", poly: [[W + m, H + m], [-m - o, H + m], [W + m, -m - o]], off: [k, k] });
    } else if (p.mode === "quad") {
        pieces.push({ name: "Corner TL", rect: [-m, -m, W / 2 + ov, H / 2 + ov], off: [-(W / 2 + 100), -(H / 2 + 100)] });
        pieces.push({ name: "Corner TR", rect: [W / 2 - ov, -m, W + m, H / 2 + ov], off: [W / 2 + 100, -(H / 2 + 100)] });
        pieces.push({ name: "Corner BL", rect: [-m, H / 2 - ov, W / 2 + ov, H + m], off: [-(W / 2 + 100), H / 2 + 100] });
        pieces.push({ name: "Corner BR", rect: [W / 2 - ov, H / 2 - ov, W + m, H + m], off: [W / 2 + 100, H / 2 + 100] });
    } else {
        pieces.push({ name: "Door Left", rect: [-m - R, -m, W / 2 + ov, H + m], off: [-(W / 2 + m + 2 * R + 60), 0] });
        pieces.push({ name: "Door Right", rect: [W / 2 - ov, -m, W + m + R, H + m], off: [W / 2 + m + 2 * R + 60, 0] });
    }
    // two stacked passes: second colour slightly ahead, main colour on top
    var passes = [{ ci: 2, lag: 0.07 }, { ci: 1, lag: 0 }];
    var inDur = 0.5 - hold - 0.07;
    for (var pi = 0; pi < passes.length; pi++) {
        for (var i = 0; i < pieces.length; i++) {
            var pc = pieces[i];
            var L = UK.shapeLayer(x.c, pc.name + (pi === 0 ? " (back)" : ""));
            var g = UK.group(UK.root(L), "Piece");
            var v = UK.vecs(g);
            if (pc.rect) {
                var r = pc.rect;
                UK.addRect(v, [r[2] - r[0], r[3] - r[1]], [(r[0] + r[2]) / 2 - x.cx, (r[1] + r[3]) / 2 - x.cy], R);
            } else {
                var vv = [];
                for (var q = 0; q < pc.poly.length; q++) vv.push([pc.poly[q][0] - x.cx, pc.poly[q][1] - x.cy]);
                UK.addPath(v, vv);
            }
            x.fill(v, passes[pi].ci);
            var lag = passes[pi].lag, b = 0.5 - hold - lag, c = 0.5 + hold + lag;
            UK.inOut(UK.pos(L), x.T(b - inDur), x.T(b), x.T(c), x.T(c + inDur),
                [x.cx + pc.off[0], x.cy + pc.off[1]], [x.cx, x.cy], [x.cx + pc.off[0], x.cy + pc.off[1]], "out", "inSoft");
        }
    }
    // seam flash
    var vertical = (p.mode !== "v");
    var S = UK.shapeLayer(x.c, "Seam");
    var sg = UK.group(UK.root(S), "Seam");
    var sv = UK.vecs(sg);
    if (p.mode === "diag") {
        UK.addRect(sv, [Math.sqrt(W * W + H * H) + 200, 10], [0, 0]);
        UK.rot(S).setValue(-Math.atan2(H, W) * 180 / Math.PI);
    } else if (p.mode === "quad") {
        UK.addRect(sv, [10, H + 100], [0, 0]);
        UK.addRect(sv, [W + 100, 10], [0, 0]);
    } else {
        UK.addRect(sv, vertical ? [10, H + 100] : [W + 100, 10], [0, 0]);
    }
    x.fill(sv, 3);
    if (p.glow) {
        var gl = UK.fx(S, "ADBE Glo2", "Glow");
        gl = UK.efx(S, "Glow");
        gl.property("ADBE Glo2-0003").setValue(60);
        gl.property("ADBE Glo2-0004").setValue(1.5);
    }
    UK.pos(S).setValue([x.cx, x.cy]);
    var sc = UK.scale(S);
    var seamFrom = (p.mode === "diag" || p.mode === "quad") ? [0, 100] : (vertical ? [100, 0] : [0, 100]);
    UK.anim(sc, [[x.T(0.5 - hold - 0.02), seamFrom], [x.T(0.5), [100, 100]], [x.T(0.5 + hold), [100, 100]], [x.T(0.5 + hold + 0.08), seamFrom]], ["out", "linear", "in"]);
};

/* Spinning diamond / square that opens into a frame */
UK.TR.R.diamond = function (x, p) {
    var n = p.n || 2, hold = (p.hold !== undefined) ? p.hold : 0.03, st = (p.stagger !== undefined) ? p.stagger : 0.07;
    var rot0 = (p.rot !== undefined) ? p.rot : 45;
    var Rh = (rot0 === 45) ? (x.W + x.H) / (2 * Math.SQRT2) + 40 : Math.max(x.W, x.H) / 2 + 40;
    var colors = p.colors || UK.TR.stack(n);
    var inDur = 0.5 - hold - st * (n - 1);
    for (var k = 0; k < n; k++) {
        var L = UK.shapeLayer(x.c, "Diamond " + (k + 1));
        var g = UK.group(UK.root(L), "Diamond");
        var v = UK.vecs(g);
        var r = UK.addRect(v, [0, 0], [0, 0], 0, "Square");
        var lag = (n - 1 - k) * st, b = 0.5 - hold - lag, c = 0.5 + hold + lag;
        var T = [x.T(b - inDur), x.T(b), x.T(c), x.T(c + inDur)];
        UK.anim(r.property("ADBE Vector Rect Size"), [[T[0], [0, 0]], [T[1], [Rh, Rh]], [T[2], [Rh, Rh]], [T[3], [2 * Rh, 2 * Rh]]], ["out", "linear", "inout"]);
        var sk = x.stroke(v, colors[k], 0, { join: 1 });
        UK.anim(sk.property("ADBE Vector Stroke Width"), [[T[0], 0], [T[1], Rh], [T[2], Rh], [T[3], 0]], ["out", "linear", "inout"]);
        UK.pos(L).setValue([x.cx, x.cy]);
        var spin = p.spin || 0;
        if (spin) UK.anim(UK.rot(L), [[T[0], rot0 - spin], [T[1], rot0], [T[2], rot0], [T[3], rot0 + spin]], ["out", "linear", "inout"]);
        else UK.rot(L).setValue(rot0);
    }
};

/* Grid of tiles popping in and out */
UK.TR.R.grid = function (x, p) {
    var cols = p.cols || 10, rows = p.rows || 6, hold = (p.hold !== undefined) ? p.hold : 0.03;
    var cw = x.W / cols, ch = x.H / rows, rnd = p.round || 0;
    var n = cols * rows, slots = [], i, j;
    var rr = UK.rng(p.seed || 5);
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
        var sl;
        if (p.order === "random") sl = Math.floor(rr() * (cols + rows));
        else if (p.order === "center") sl = Math.round(Math.sqrt(Math.pow((i + 0.5) / cols - 0.5, 2) * 4 + Math.pow((j + 0.5) / rows - 0.5, 2) * 4) * (cols + rows) / 3);
        else sl = i + j;
        slots.push(sl);
    }
    var maxS = UK.TR.max(slots);
    var st = Math.min(0.03, 0.3 / Math.max(1, maxS));
    var dur = 0.5 - hold - st * maxS;
    var colors = p.colors || [1];
    var L = UK.shapeLayer(x.c, "Tiles");
    var over = rnd ? rnd * 0.9 : 3;
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
        var k = j * cols + i;
        var g = UK.group(UK.root(L), "Tile " + (k + 1));
        var v = UK.vecs(g);
        UK.addRect(v, [cw + over, ch + over], [0, 0], rnd);
        x.fill(v, colors[(i + j) % colors.length]);
        var tr = UK.gtr(g);
        tr.property("ADBE Vector Position").setValue([-x.W / 2 + (i + 0.5) * cw, -x.H / 2 + (j + 0.5) * ch]);
        var a = st * slots[k], b = a + dur, c = 0.5 + hold + st * slots[k], d = c + dur;
        UK.anim(UK.gtr(UK.root(L).property("Tile " + (k + 1)), "ADBE Vector Scale"), [[x.T(a), [0, 0]], [x.T(b), [100, 100]], [x.T(c), [100, 100]], [x.T(d), [0, 0]]], ["out", "linear", "in"]);
        UK.anim(UK.gtr(UK.root(L).property("Tile " + (k + 1)), "ADBE Vector Rotation"), [[x.T(a), -90], [x.T(b), 0], [x.T(c), 0], [x.T(d), 90]], ["out", "linear", "in"]);
    }
    UK.pos(L).setValue([x.cx, x.cy]);
};

/* ----------------------------------------------------- SaaS-only recipes */
UK.TR.R.pill = function (x, p) {
    var hold = 0.04;
    var L = UK.shapeLayer(x.c, "Pill");
    var g = UK.group(UK.root(L), "Pill");
    var v = UK.vecs(g);
    var r = UK.addRect(v, [x.W * 0.14, x.H * 0.075], [0, 0], x.H * 0.0375, "Pill Shape");
    UK.anim(r.property("ADBE Vector Rect Size"), [[x.T(0.04), [x.W * 0.14, x.H * 0.075]], [x.T(0.5 - hold), [x.W + 160, x.H + 160]]], ["outSoft"]);
    UK.anim(r.property("ADBE Vector Rect Roundness"), [[x.T(0.04), x.H * 0.0375], [x.T(0.5 - hold), 90]], ["outSoft"]);
    UK.addGradFill(v, false, [-x.W * 0.5, -x.H * 0.5], [x.W * 0.5, x.H * 0.5]);
    x.toner(L, 1, 2);
    UK.pos(L).setValue([x.cx, x.cy]);
    UK.anim(UK.pos(L), [[x.T(0.5 + hold), [x.cx, x.cy]], [x.T(1), [x.cx, x.cy - x.H - 200]]], ["in"]);
    UK.anim(UK.opac(L), [[x.T(0), 0], [x.T(0.06), 100]], ["ease"]);
    // light rim that follows the pill
    var Rm = UK.shapeLayer(x.c, "Pill Rim");
    var rg = UK.group(UK.root(Rm), "Rim");
    var rv = UK.vecs(rg);
    var rr = UK.addRect(rv, [x.W * 0.14, x.H * 0.075], [0, 0], x.H * 0.0375, "Rim Shape");
    UK.anim(rr.property("ADBE Vector Rect Size"), [[x.T(0.0), [x.W * 0.14, x.H * 0.075]], [x.T(0.46 - hold), [x.W + 220, x.H + 220]]], ["outSoft"]);
    UK.anim(UK.vecs(UK.root(Rm).property("Rim")).property("Rim Shape").property("ADBE Vector Rect Roundness"), [[x.T(0.0), x.H * 0.0375], [x.T(0.46 - hold), 110]], ["outSoft"]);
    x.fill(rv, 3, 100);
    Rm.moveAfter(L);
    UK.pos(Rm).setValue([x.cx, x.cy]);
    UK.anim(UK.pos(Rm), [[x.T(0.5 + hold + 0.05), [x.cx, x.cy]], [x.T(1), [x.cx, x.cy - x.H - 260]]], ["in"]);
    UK.anim(UK.opac(Rm), [[x.T(0), 0], [x.T(0.05), 100]], ["ease"]);
};

UK.TR.R.softwipe = function (x, p) {
    var hold = 0.04, Wd = x.W * 1.9, blur = Math.round(x.W * 0.06), st = 0.08;
    var inDur = 0.5 - hold - st;
    function band(name, w, ci, lag, toner) {
        var L = UK.shapeLayer(x.c, name);
        var g = UK.group(UK.root(L), "Band");
        var v = UK.vecs(g);
        UK.addRect(v, [w, x.H + blur * 6], [0, 0]);
        if (toner) { UK.addGradFill(v, false, [-x.W * 0.5, 0], [x.W * 0.5, 0]); x.toner(L, 1, 2); }
        else x.fill(v, ci);
        var bl = UK.fx(L, "ADBE Box Blur2", "Soft Edge");
        bl = UK.efx(L, "Soft Edge");
        bl.property("ADBE Box Blur2-0001").setValue(blur);
        bl.property("ADBE Box Blur2-0002").setValue(3);
        var s2 = x.W / 2 + w / 2 + blur * 3;
        var b = 0.5 - hold - lag, c = 0.5 + hold + lag;
        UK.inOut(UK.pos(L), x.T(b - inDur), x.T(b), x.T(c), x.T(c + inDur),
            [x.cx - s2, x.cy], [x.cx, x.cy], [x.cx + s2, x.cy], "outSoft", "inSoft");
        return L;
    }
    band("Front Glow", x.W * 0.5, 3, st, false);
    band("Gradient Band", Wd, 1, 0, true);
};

UK.TR.R.columns = function (x, p) {
    var n = p.n || 6, hold = 0.03, st = 0.045;
    var w = x.W / n, inDur = 0.5 - hold - st * (n - 1);
    for (var i = 0; i < n; i++) {
        var L = UK.shapeLayer(x.c, "Column " + (i + 1));
        var g = UK.group(UK.root(L), "Column");
        var v = UK.vecs(g);
        UK.addRect(v, [w + 4, x.H + 260], [0, 0], Math.min(80, w / 2));
        x.fill(v, i % 2 === 0 ? 1 : 2);
        var a = st * i, b = a + inDur, c = 0.5 + hold + st * i, d = c + inDur;
        var X = (i + 0.5) * w;
        UK.inOut(UK.pos(L), x.T(a), x.T(b), x.T(c), x.T(d), [X, x.cy + x.H + 200], [X, x.cy], [X, x.cy - x.H - 200], "out", "in");
    }
};

UK.TR.R.blob = function (x, p) {
    var diag = Math.sqrt(x.W * x.W + x.H * x.H);
    // back blob: in [0, .44] out [.56, 1]   front blob: in [.07, .46] out [.54, .93]
    var defs = [{ name: "Blob Back", ci: 2, size: diag * 2.25, t: [0, 0.44, 0.56, 1] }, { name: "Blob", ci: 1, size: diag * 2.1, t: [0.07, 0.46, 0.54, 0.93] }];
    for (var i = 0; i < defs.length; i++) {
        var d = defs[i];
        var L = UK.shapeLayer(x.c, d.name);
        var g = UK.group(UK.root(L), "Blob");
        var v = UK.vecs(g);
        UK.addEllipse(v, [d.size, d.size], [0, 0]);
        UK.addRoughen(v, x.W * 0.035, 3, 0.7, 4 + i);
        x.fill(v, d.ci);
        UK.pos(L).setValue([0, x.H]);
        UK.anim(UK.scale(L), [[x.T(d.t[0]), [0, 0]], [x.T(d.t[1]), [100, 100]]], ["outSoft"]);
        UK.anim(UK.pos(L), [[x.T(d.t[2]), [0, x.H]], [x.T(d.t[3]), [x.W + d.size * 0.55, -d.size * 0.55]]], ["inSoft"]);
    }
};

UK.TR.R.card = function (x, p) {
    var hold = 0.04;
    var L = UK.shapeLayer(x.c, "Card");
    var g = UK.group(UK.root(L), "Card");
    var v = UK.vecs(g);
    UK.addRect(v, [x.W * 0.5, x.H * 0.5], [0, 0], 36);
    x.fill(v, 1);
    var ds = UK.fx(L, "ADBE Drop Shadow", "Shadow");
    ds = UK.efx(L, "Shadow");
    ds.property("ADBE Drop Shadow-0002").setValue(90);
    ds.property("ADBE Drop Shadow-0004").setValue(30);
    ds.property("ADBE Drop Shadow-0005").setValue(80);
    ds.property("ADBE Drop Shadow-0003").setValue(180);
    UK.pos(L).setValue([x.cx, x.cy]);
    UK.anim(UK.scale(L), [[x.T(0.0), [0, 0]], [x.T(0.22), [100, 100]], [x.T(0.5 - hold), [280, 280]]], ["outSoft", "inout"]);
    UK.anim(UK.rot(L), [[x.T(0.0), -8], [x.T(0.22), 0]], ["outSoft"]);
    UK.anim(UK.pos(L), [[x.T(0.5 + hold), [x.cx, x.cy]], [x.T(1), [x.cx, x.cy + x.H * 1.6]]], ["in"]);
    // backdrop tint behind the card so the zoom reads as depth
    var B = UK.shapeLayer(x.c, "Backdrop");
    var bg = UK.group(UK.root(B), "Backdrop");
    var bv = UK.vecs(bg);
    UK.addRect(bv, [x.W + 40, x.H + 40], [0, 0]);
    x.fill(bv, 2, 100);
    UK.pos(B).setValue([x.cx, x.cy]);
    UK.anim(UK.opac(B), [[x.T(0.05), 0], [x.T(0.3), 55], [x.T(0.5), 55], [x.T(0.62), 0]], ["ease", "linear", "ease"]);
    B.moveAfter(L);
};

/* ============================================================ entry points */
UK.TR.logo = function (x, hold) {
    var L = UK.addText(x.c, "LOGO", { size: Math.round(x.H * 0.13), color: "#FFFFFF", name: "LOGO (edit me)" });
    UK.anim(UK.scale(L), [[x.T(0.5 - hold - 0.1), [0, 0]], [x.T(0.5 - hold + 0.02), [100, 100]], [x.T(0.5 + hold - 0.02), [104, 104]], [x.T(0.5 + hold + 0.08), [0, 0]]], ["out", "linear", "in"]);
    L.moveToBeginning();
};

UK.api.transition = function (a) {
    var host = UK.comp(true);
    var list = (a.cat === "saas") ? UK_CAT.saasTr : UK_CAT.sports;
    var spec = UK_CAT.find(list, a.id);
    if (!spec) throw new Error("Unknown transition " + a.id);
    if (spec.needsLayer) return UK.api.reveal({ id: a.id, duration: a.duration, mode: spec.r === "depthReveal" ? "depth" : "wipe", dir: a.dir });
    var D = UK.clamp(Number(a.duration) || 1.2, 0.3, 10);
    var pal = (a.cat === "saas" ? UK_CAT.saasPal : UK_CAT.sportsPal)[spec.pal];
    if (a.colors && a.colors.length === 3) pal = a.colors;
    var name = UK.uniqueName((a.cat === "saas" ? "TR SaaS " : "TR ") + spec.name);
    var c = UK.newComp(name, host, D, a.cat === "saas" ? "SaaS Transitions" : "Transitions");
    UK._fd = c.frameDuration;
    var x = UK.TR.ctx(c, D, pal);
    var ctl = UK.controlNull(c, "CONTROLS", pal, ["Main Color", "Second Color", "Accent Color"]);
    var p = {};
    for (var k in spec.p) if (spec.p.hasOwnProperty(k)) p[k] = spec.p[k];
    if (a.logo) p.hold = Math.max(p.hold || 0, 0.14);
    UK.TR.R[spec.r](x, p);
    if (a.logo) UK.TR.logo(x, p.hold);
    ctl.moveToBeginning();
    c.motionBlur = true;
    try { c.shutterAngle = 180; c.motionBlurSamplesPerFrame = 32; c.motionBlurAdaptiveSampleLimit = 128; } catch (eMb) { }
    for (var i = 1; i <= c.numLayers; i++) { var L = c.layer(i); if (!L.nullLayer) try { L.motionBlur = true; } catch (e) { } }
    var t = Math.max(0, UK.timeCTI(host) - D / 2);
    var TL = UK.place(host, c, t);
    TL.motionBlur = false;
    UK.selectOnly(host, [TL]);
    return { name: name, start: t, duration: D };
};

/* ---------------------------------------------------- Wipe / Depth Reveal
   Reveals the selected layer by a gradient (linear or depth map) with a colourful
   front band (CC Toner) that runs just ahead of the image.                     */
UK.api.reveal = function (a) {
    var host = UK.comp(false);
    var sel = host.selectedLayers;
    if (!sel.length) throw new Error("Select the layer you want to reveal (image, video, precomp or shape).");
    var L = sel[0];
    var D = UK.clamp(Number(a.duration) || 1.6, 0.3, 10);
    var depth = (a.mode === "depth");
    var hasSource = (L instanceof AVLayer) && L.source && !(L instanceof TextLayer) && !(L instanceof ShapeLayer) && L.source.width;
    var w = hasSource ? L.source.width : host.width, h = hasSource ? L.source.height : host.height;
    var gname = UK.uniqueName((depth ? "Depth Map - " : "Wipe Map - ") + L.name);
    var G = UK.newComp(gname, host, Math.max(host.duration, 1), "SaaS Transitions", w, h);
    if (depth) {
        var inner;
        if (hasSource) { inner = G.layers.add(L.source); }
        else { inner = L.copyToComp ? (L.copyToComp(G), G.layer(1)) : null; }
        if (!inner) throw new Error("Could not build a depth map for this layer.");
        if (hasSource && L.source instanceof FootageItem && L.source.mainSource && L.source.mainSource.isStill) inner.outPoint = G.duration;
        UK.fx(inner, "ADBE Black&White", "To Gray");
        var gb = UK.fx(inner, "ADBE Gaussian Blur 2", "Depth Soften");
        gb = UK.efx(inner, "Depth Soften");
        gb.property("ADBE Gaussian Blur 2-0001").setValue(Math.round(Math.max(w, h) * 0.02));
        gb.property("ADBE Gaussian Blur 2-0003").setValue(1);
        var lv = UK.fx(inner, "ADBE Easy Levels2", "Depth Contrast");
        lv = UK.efx(inner, "Depth Contrast");
        lv.property("ADBE Easy Levels2-0003").setValue(0.12);
        lv.property("ADBE Easy Levels2-0004").setValue(0.88);
        // gentle centre bias so flat images still read as "near in the middle"
        var bias = G.layers.addSolid([1, 1, 1], "Center Bias", w, h, 1);
        var br = UK.fx(bias, "ADBE Ramp", "Bias");
        br = UK.efx(bias, "Bias");
        br.property("ADBE Ramp-0001").setValue([w / 2, h / 2]);
        br.property("ADBE Ramp-0003").setValue([w / 2 + Math.max(w, h) * 0.7, h / 2]);
        br.property("ADBE Ramp-0005").setValue(2);
        br.property("ADBE Ramp-0002").setValue([1, 1, 1, 1]);
        br.property("ADBE Ramp-0004").setValue([0, 0, 0, 1]);
        bias.blendingMode = BlendingMode.SOFT_LIGHT;
        UK.opac(bias).setValue(60);
        bias.moveToBeginning();
        bias.comment = "Replace the layers in this comp with a real depth map (white = near) for a perfect depth reveal.";
    } else {
        var sol = G.layers.addSolid([1, 1, 1], "Wipe Gradient", w, h, 1);
        var rp = UK.fx(sol, "ADBE Ramp", "Direction");
        rp = UK.efx(sol, "Direction");
        var dir = a.dir || "left";
        var A = { left: [[w, h / 2], [0, h / 2]], right: [[0, h / 2], [w, h / 2]], up: [[w / 2, h], [w / 2, 0]], down: [[w / 2, 0], [w / 2, h]] }[dir] || [[w, h / 2], [0, h / 2]];
        // white reveals first -> put white where the wipe starts
        rp.property("ADBE Ramp-0001").setValue(A[1]);
        rp.property("ADBE Ramp-0003").setValue(A[0]);
        rp.property("ADBE Ramp-0002").setValue([1, 1, 1, 1]);
        rp.property("ADBE Ramp-0004").setValue([0, 0, 0, 1]);
    }
    // colour band layer = the gradient precomp itself, coloured by CC Toner
    var C = host.layers.add(G);
    C.name = UK.uniqueLayerName(host, (depth ? "Depth Color - " : "Wipe Color - ") + L.name);
    C.moveAfter(L);
    C.startTime = 0;
    if (hasSource) {
        C.parent = L;
        UK.pos(C).setValue(UK.anchor(L).value);
        UK.anchor(C).setValue([w / 2, h / 2]);
    }
    var pal = UK_CAT.saasPal[depth ? 2 : 0];
    var tn = UK.fx(C, "CC Toner", "Band Colors");
    tn = UK.efx(C, "Band Colors");
    try { tn.property("CC Toner-0005").setValue(3); } catch (e1) { }
    tn.property("CC Toner-0001").setValue(UK.rgba("#FDE68A"));
    tn.property("CC Toner-0006").setValue(UK.rgba(pal[0]));
    tn.property("CC Toner-0002").setValue(UK.rgba(pal[1]));
    tn.property("CC Toner-0007").setValue(UK.rgba("#22D3EE"));
    tn.property("CC Toner-0003").setValue(UK.rgba("#1E1B4B"));
    // controls live on the revealed layer
    var rev = UK.slider(L, "Reveal %", 0);
    UK.slider(L, "Color Lead", 28);
    UK.slider(L, "Edge Softness", depth ? 22 : 30);
    var t0 = UK.timeCTI(host);
    UK._fd = host.frameDuration;
    UK.anim(UK.efx(L, "Reveal %").property(1), [[t0, 0], [UK.snap(host, t0 + D), 100]], [[45, 72]]);
    var Lref = 'thisComp.layer("' + L.name.replace(/"/g, '\\"') + '")';
    var gwFront = UK.fx(C, "ADBE Gradient Wipe", "Front Edge");
    gwFront = UK.efx(C, "Front Edge");
    gwFront.property("ADBE Gradient Wipe-0003").setValue(C.index);
    gwFront.property("ADBE Gradient Wipe-0004").setValue(3);
    gwFront.property("ADBE Gradient Wipe-0001").expression = 'var L=' + Lref + '; var r=L.effect("Reveal %")(1); var lead=L.effect("Color Lead")(1); 100-Math.min(100,Math.max(0,r*(100+lead)/100));';
    gwFront.property("ADBE Gradient Wipe-0002").expression = Lref + '.effect("Edge Softness")(1);';
    var gwBack = UK.fx(C, "ADBE Gradient Wipe", "Back Edge");
    gwBack = UK.efx(C, "Back Edge");
    gwBack.property("ADBE Gradient Wipe-0003").setValue(C.index);
    gwBack.property("ADBE Gradient Wipe-0004").setValue(3);
    gwBack.property("ADBE Gradient Wipe-0005").setValue(1);
    gwBack.property("ADBE Gradient Wipe-0001").expression = 'Math.min(100,Math.max(0,' + Lref + '.effect("Reveal %")(1)));';
    gwBack.property("ADBE Gradient Wipe-0002").expression = Lref + '.effect("Edge Softness")(1);';
    var glo = UK.fx(C, "ADBE Glo2", "Band Glow");
    glo = UK.efx(C, "Band Glow");
    glo.property("ADBE Glo2-0002").setValue(55);
    glo.property("ADBE Glo2-0003").setValue(40);
    glo.property("ADBE Glo2-0004").setValue(0.7);
    // the revealed layer itself
    var gw = UK.fx(L, "ADBE Gradient Wipe", "Reveal Wipe");
    gw = UK.efx(L, "Reveal Wipe");
    gw.property("ADBE Gradient Wipe-0003").setValue(C.index);
    gw.property("ADBE Gradient Wipe-0004").setValue(3);
    gw.property("ADBE Gradient Wipe-0001").expression = '100-Math.min(100,Math.max(0,effect("Reveal %")(1)));';
    gw.property("ADBE Gradient Wipe-0002").expression = 'effect("Edge Softness")(1);';
    UK.selectOnly(host, [L]);
    return { name: L.name, band: C.name, map: G.name };
};

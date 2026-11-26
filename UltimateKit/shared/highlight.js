/*  Ultimate Kit - "Highlighter" (2026-10-26, the user's reference reel Video-70210.mp4 = Highlightr-style text
    highlights: a box wiping in behind the word with selection carets / dots, a white card with a hard shadow, a thin
    ellipse drawn round the word; 5 looks from it, 25 of mine). Shared by the panel preview (js/hlprev.js) and After
    Effects (jsx/highlight.jsx), so ES3.

    build(id, R, fs, c) -> spec
      R   the word's box { left, top, width, height } in the text layer's space (y down); fs its font size (px)
      c   { dIn, dOut, tOut: seconds after the start when the exit begins (null = no exit), pad (% of the look's
            padding), round (corner %, null = the look's), reveal (the word appears with the highlight), ink (the
            word takes the text colour while it sits on the highlight) }
    spec = { c: [x, y] where the highlight layers sit (text layer space), w, h (the padded box), uses (colour slots),
             layers: [{ n, above, blend, fx: [...], K: { o }, els: [...] }]   (bottom first; elements bottom first),
             text: [{ n, props, sel, K: { off, start, end, amt } }]          (text animators on the word),
             mask: [[x, y] x 4] (a mask on the word) | null }
    element: one shape group { n, parts: [shape], merge (3 subtract | 4 intersect | 0), fill / stroke: "B" box,
             "A" accent, "I" ink or "#hex", fo, so (fill / stroke opacity), sw, cap, join, taper [6], a, p,
             K: { p, s, r, o (group), te, ts (trim) } }
      shape: { k: "rect" | "ellipse" | "path", w, h, r, pos, pts, closed, smooth, K: { sz, rp, rr }, sub: { a, p, r,
             K: { p, r, s } } (its own transform) }   - a single-shape element may carry the shape fields itself
    K tracks: [[time, value, ease of the move to the next key], ...]; eases = UK.CURVES names, "linear", "hold".
    text animator: props { opacity, pos [x, y], blur [x, y], scale [x, y], rot, track, fill: "I" },
                   sel { based 2 (no spaces) | 3 words, shape 1 square | 2 ramp up | 3 ramp down, start, end,
                   offset, hi, lo, random }; keys on the Range: off / start / end / amt (Max Amount)          */
var UK_HL = (function () {
    var C = {};
    C.DEF = { dIn: 0.6, dOut: 0.45, mode: "both", pad: 100, reveal: true, ink: true, mb: true };
    C.EASES = {           // = jsx/core.jsx UK.CURVES: [out influence, in influence, out speed, in speed]
        ease: [33.34, 33.34, 0, 0], smooth: [42, 42, 0, 0], inout: [65, 65, 0, 0], inoutStrong: [82, 82, 0, 0],
        soft: [45, 70, 0, 0], out: [33, 32, 3.0, 0], outSoft: [40, 55, 1.6, 0], quint: [22, 64, 4.5, 0],
        expo: [16, 70, 6.2, 0], "in": [32, 33, 0, 3.0], inSoft: [55, 40, 0, 1.6], quintIn: [64, 22, 0, 4.5],
        expoIn: [70, 16, 0, 6.2]
    };
    C.ease = function (name, x) {
        if (name === "linear") return x;
        if (name === "hold") return 0;
        var e = C.EASES[name] || C.EASES.smooth, a = e[0] / 100, b = 1 - e[1] / 100, ya = e[2] * e[0] / 100, yb = 1 - e[3] * e[1] / 100;
        var lo = 0, hi = 1, u = 0.5;
        for (var q = 0; q < 24; q++) { u = (lo + hi) / 2; var m = 1 - u, xu = 3 * m * m * u * a + 3 * m * u * u * b + u * u * u; if (xu < x) lo = u; else hi = u; }
        var m2 = 1 - u;
        return 3 * m2 * m2 * u * ya + 3 * m2 * u * u * yb + u * u * u;
    };
    C.val = function (K, t) {
        if (t <= K[0][0]) return K[0][1];
        for (var i = 1; i < K.length; i++) if (t < K[i][0]) {
            var a = K[i - 1][1], b = K[i][1], e = C.ease(K[i - 1][2] || "smooth", (t - K[i - 1][0]) / Math.max(1e-6, K[i][0] - K[i - 1][0]));
            if (a instanceof Array) { var r = []; for (var d = 0; d < a.length; d++) r.push(a[d] + (b[d] - a[d]) * e); return r; }
            return a + (b - a) * e;
        }
        return K[K.length - 1][1];
    };

    /* 5 looks from the reference, 13 premium, 12 lighter ones for smaller clients */
    C.LOOKS = [
        { id: "hl01", name: "Select Caret", tier: "premium", ref: true, box: "#1F6BFF", accent: "#FF2D3D", ink: "#FFFFFF", px: 0.22, py: 0.08, round: 0 },
        { id: "hl02", name: "Corner Dots", tier: "pop", ref: true, box: "#23F06A", accent: "#1E78FF", ink: "#0E1A12", px: 0.16, py: 0.05, round: 0 },
        { id: "hl03", name: "Paper Card", tier: "premium", ref: true, box: "#FFFFFF", accent: "#1E78FF", ink: "#151515", px: 0.14, py: 0.06, round: 0 },
        { id: "hl04", name: "Orbit Ring", tier: "premium", ref: true, box: "#FFFFFF", px: 0.34, py: 0.36, round: 0 },
        { id: "hl15", name: "Caret Split", tier: "premium", ref: true, box: "#FF8A00", accent: "#1E78FF", ink: "#111111", px: 0.2, py: 0.08, round: 0 },
        { id: "hl05", name: "Clean Block", tier: "premium", box: "#0F62FE", ink: "#FFFFFF", px: 0.18, py: 0.06, round: 0 },
        { id: "hl06", name: "Double Sweep", tier: "premium", box: "#10306B", accent: "#00C2FF", ink: "#FFFFFF", px: 0.2, py: 0.07, round: 0 },
        { id: "hl07", name: "Center Split", tier: "premium", box: "#111111", accent: "#D4AF6A", ink: "#FFFFFF", px: 0.28, py: 0.12, round: 0 },
        { id: "hl08", name: "Underline Rise", tier: "premium", box: "#FF4D2E", ink: "#FFFFFF", px: 0.16, py: 0.06, round: 0 },
        { id: "hl09", name: "Focus Frame", tier: "premium", box: "#FFFFFF", accent: "#FFFFFF", px: 0.3, py: 0.2, round: 0 },
        { id: "hl10", name: "Glass Pill", tier: "premium", box: "#FFFFFF", accent: "#FFFFFF", px: 0.42, py: 0.2, round: 100 },
        { id: "hl11", name: "Shine Block", tier: "premium", box: "#6E3BFF", ink: "#FFFFFF", px: 0.24, py: 0.1, round: 22 },
        { id: "hl12", name: "Duo Split", tier: "premium", box: "#E10600", accent: "#7A0A0A", ink: "#FFFFFF", px: 0.2, py: 0.08, round: 0 },
        { id: "hl13", name: "Line Stripes", tier: "premium", box: "#00E0B8", ink: "#04161A", px: 0.2, py: 0.08, round: 0 },
        { id: "hl14", name: "Frame Grow", tier: "premium", box: "#FFFFFF", accent: "#FFFFFF", ink: "#0E0E0E", px: 0.3, py: 0.14, round: 0 },
        { id: "hl16", name: "Rise Inside", tier: "premium", box: "#FFFFFF", ink: "#0B0B0B", px: 0.2, py: 0.1, round: 0 },
        { id: "hl18", name: "Bubble Morph", tier: "premium", box: "#2F80FF", ink: "#FFFFFF", px: 0.3, py: 0.12, round: 45 },
        { id: "hl29", name: "Typing Cursor", tier: "premium", box: "#0F172A", accent: "#22C55E", ink: "#22C55E", px: 0.2, py: 0.1, round: 8 },
        { id: "hl30", name: "Offset Print", tier: "premium", box: "#FF4FA3", accent: "#FFFFFF", px: 0.2, py: 0.1, round: 0 },
        { id: "hl17", name: "Skew Slice", tier: "pop", box: "#FFE600", ink: "#111111", px: 0.3, py: 0.08, round: 0 },
        { id: "hl19", name: "Pill Pop", tier: "pop", box: "#FF3D7F", ink: "#FFFFFF", px: 0.36, py: 0.14, round: 100 },
        { id: "hl20", name: "Neo Shadow", tier: "pop", box: "#FFE14D", accent: "#111111", ink: "#111111", px: 0.24, py: 0.1, round: 0, bg: "light" },
        { id: "hl21", name: "Stacked Cards", tier: "pop", box: "#FFFFFF", accent: "#FF5A36", ink: "#111111", px: 0.24, py: 0.1, round: 14 },
        { id: "hl22", name: "Marker Bar", tier: "pop", box: "#FFE45C", px: 0.08, py: 0.02, round: 20, bg: "light" },
        { id: "hl23", name: "Marker Scribble", tier: "pop", box: "#FFD000", px: 0.1, py: 0.06, round: 0, bg: "light" },
        { id: "hl24", name: "Sticker Slap", tier: "pop", box: "#FFFFFF", accent: "#111111", ink: "#111111", px: 0.3, py: 0.14, round: 30 },
        { id: "hl25", name: "Price Tag", tier: "pop", box: "#00B67A", accent: "#FFFFFF", ink: "#FFFFFF", px: 0.24, py: 0.12, round: 10 },
        { id: "hl26", name: "Neon Glow", tier: "pop", box: "#00E5FF", px: 0.32, py: 0.16, round: 40 },
        { id: "hl27", name: "Glitch Block", tier: "pop", box: "#FF1F5A", accent: "#00F0FF", ink: "#FFFFFF", px: 0.2, py: 0.08, round: 0 },
        { id: "hl28", name: "Drop Bounce", tier: "pop", box: "#FFCC00", ink: "#111111", px: 0.24, py: 0.1, round: 14 }
    ];
    C.find = function (id) { for (var i = 0; i < C.LOOKS.length; i++) if (C.LOOKS[i].id === id) return C.LOOKS[i]; return C.LOOKS[0]; };

    /* ------------------------------------------------------------------ helpers */
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    /* a box growing from one side: "L" (left edge stays), "R", "C" (from the middle), "T", "B" */
    function edge(dir, w, h) {
        if (dir === "L") return { s: [0, h], p: [-w / 2, 0] };
        if (dir === "R") return { s: [0, h], p: [w / 2, 0] };
        if (dir === "C") return { s: [0, h], p: [0, 0] };
        if (dir === "M") return { s: [w, 0], p: [0, 0] };
        if (dir === "T") return { s: [w, 0], p: [0, -h / 2] };
        return { s: [w, 0], p: [0, h / 2] };
    }
    function grow(dir, w, h, t0, t1, ea) { var z = edge(dir, w, h); return { sz: [[t0, z.s, ea], [t1, [w, h]]], rp: [[t0, z.p, ea], [t1, [0, 0]]] }; }
    function shrink(dir, w, h, t0, t1, ea) { var z = edge(dir, w, h); return { sz: [[t0, [w, h], ea], [t1, z.s]], rp: [[t0, [0, 0], ea], [t1, z.p]] }; }
    /* rounded rectangle as points, from the top-left corner clockwise (outlines that draw on) */
    function rbox(w, h, r, x, y) {
        var p = [], hw = w / 2, hh = h / 2, n = 5, j, ox = x || 0, oy = y || 0;
        r = clamp(r || 0, 0, Math.min(hw, hh));
        var arc = function (cx, cy, a0) { for (j = 0; j <= n; j++) { var a = a0 + j / n * Math.PI / 2; p.push([ox + cx + Math.cos(a) * r, oy + cy + Math.sin(a) * r]); } };
        if (r < 0.5) return [[ox - hw, oy - hh], [ox + hw, oy - hh], [ox + hw, oy + hh], [ox - hw, oy + hh], [ox - hw, oy - hh]];
        arc(-hw + r, -hh + r, Math.PI); arc(hw - r, -hh + r, -Math.PI / 2); arc(hw - r, hh - r, 0); arc(-hw + r, hh - r, Math.PI / 2);
        p.push([p[0][0], p[0][1]]);
        return p;
    }
    /* an open, slightly tilted ellipse drawn once round and a little past its start (a pen loop) */
    function orbit(rx, ry, tilt, n) {
        var p = [], i, c = Math.cos(tilt), s = Math.sin(tilt);
        for (i = 0; i <= n; i++) {
            var u = i / n, a = -Math.PI * 0.62 + u * Math.PI * 2.12, k = 1 + 0.05 * u;
            var ex = Math.cos(a) * rx * k, ey = Math.sin(a) * ry * (1 - 0.06 * u);
            p.push([ex * c - ey * s, ex * s + ey * c]);
        }
        return p;
    }

    /* ------------------------------------------------------------------ the looks */
    var B = {};
    /* hl01 (reference "Motionsfly" / "HERE ARE 3"): the box wipes in from the left like a text selection, the right
       caret riding its edge, the left caret with its dot standing first; the word slides in with the edge; soft shadow;
       out: the word fades, the box blurs away */
    B.hl01 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, tw = d * 0.86, cw = Math.max(1.5, h * 0.07), ext = h * 0.07, dot = Math.max(4, h * 0.26);
        var g = grow("L", w, h, d * 0.06, tw, "quint");
        var els = [
            { n: "Box", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { sz: g.sz, rp: g.rp } },
            { n: "Caret Left", parts: [{ k: "rect", w: cw, h: h + 2 * ext }, { k: "ellipse", w: dot, h: dot, pos: [0, -h / 2 - ext] }], fill: "A", p: [X.x0, 0],
                K: { s: X.io([[0, [100, 0], "expo"], [d * 0.3, [100, 100]]], [[o, [100, 100], "quintIn"], [o + e * 0.5, [100, 0]]]) } },
            { n: "Caret Right", parts: [{ k: "rect", w: cw, h: h + 2 * ext }, { k: "ellipse", w: dot, h: dot, pos: [0, h / 2 + ext] }], fill: "A",
                K: { p: [[d * 0.06, [X.x0, 0], "quint"], [tw, [X.x1, 0]]], s: X.io([[0, [0, 0], "expo"], [d * 0.18, [100, 100]]], [[o, [100, 100], "quintIn"], [o + e * 0.5, [100, 0]]]) } }
        ];
        return {
            layers: [{ n: "Box", els: els, fx: [X.shadow(0.3), X.blurOut()], K: { o: X.io([[0, 100]], [[o + e * 0.25, 100, "inSoft"], [o + e, 0]]) } }],
            text: [X.revealIn({ opacity: 0, pos: [X.fs * 0.3, 0], blur: [X.fs * 0.12, 0] }, d * 0.12, tw * 1.05, "quint", 30),
                X.inkWipe(d * 0.06, tw, "quint", "fade"), X.fadeOut({ opacity: 0, blur: [X.fs * 0.1, X.fs * 0.1] }, o, o + e * 0.55)]
        };
    };
    /* hl02 (reference "Text Highlightr"): a bright box with small corner dots, the bottom-right dot riding the edge */
    B.hl02 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, tw = d * 0.82, dot = Math.max(4, h * 0.17);
        var g = grow("L", w, h, d * 0.04, tw, "quint");
        var els = [
            { n: "Box", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { sz: g.sz, rp: g.rp } },
            { n: "Dot Top", k: "ellipse", w: dot, h: dot, fill: "A", p: [X.x0, X.y0], K: { s: [[0, [0, 0], "out"], [d * 0.22, [100, 100]]] } },
            { n: "Dot Bottom", k: "ellipse", w: dot, h: dot, fill: "A", K: { p: [[d * 0.04, [X.x0, X.y1], "quint"], [tw, [X.x1, X.y1]]], s: [[0, [0, 0], "out"], [d * 0.18, [100, 100]]] } }
        ];
        return {
            layers: [{ n: "Box", els: els, fx: [X.shadow(0.25), X.blurOut()], K: { o: X.io([[0, 100]], [[o + e * 0.3, 100, "inSoft"], [o + e, 0]]) } }],
            text: [X.revealIn({ opacity: 0, pos: [X.fs * 0.45, 0], blur: [X.fs * 0.16, 0] }, d * 0.1, tw * 1.08, "quint", 34),
                X.inkWipe(d * 0.04, tw, "quint", "fade"), X.fadeOut({ opacity: 0 }, o, o + e * 0.45)]
        };
    };
    /* hl03 (reference "HIGHLIGHT ANIMATIONS" / "Carousel Builder"): a white card with a hard dark shadow and two tiny
       dots; the letters tip in from a tilt; out: the card stretches a touch and blurs away */
    B.hl03 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, tw = d * 0.8, sh = Math.max(2, X.fs * 0.06), dot = Math.max(3, h * 0.12);
        var g = grow("L", w, h, d * 0.02, tw, "quint"), gs = grow("L", w, h, d * 0.1, tw + d * 0.08, "quint");
        var els = [
            { n: "Hard Shadow", k: "rect", w: w, h: h, fill: "#000000", fo: 78, p: [sh, sh], K: { sz: gs.sz, rp: gs.rp } },
            { n: "Card", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { sz: g.sz, rp: g.rp } },
            { n: "Dot Top", k: "ellipse", w: dot, h: dot, fill: "A", p: [X.x0, X.y0], K: { s: [[0, [0, 0], "out"], [d * 0.2, [100, 100]]] } },
            { n: "Dot Bottom", k: "ellipse", w: dot, h: dot, fill: "A", K: { p: [[d * 0.02, [X.x0, X.y1], "quint"], [tw, [X.x1, X.y1]]] } }
        ];
        return {
            layers: [{ n: "Card", els: els, fx: [X.shadow(0.18), X.blurOut()], K: { o: X.io([[0, 100]], [[o + e * 0.2, 100, "inSoft"], [o + e, 0]]), s: X.io([[0, [100, 100]]], [[o, [100, 100], "inSoft"], [o + e, [106, 100]]]) } }],
            text: [X.revealIn({ opacity: 0, rot: -14, pos: [0, X.fs * 0.18], blur: [X.fs * 0.06, X.fs * 0.06] }, d * 0.08, d * 1.05, "quint", 40),
                X.inkWipe(d * 0.02, tw, "quint", "fade"), X.fadeOut({ opacity: 0, blur: [X.fs * 0.2, 0] }, o, o + e * 0.6)]
        };
    };
    /* hl04 (reference "Number 03"): a thin pen ellipse, tilted, pointed at both ends, drawn round the word while the word
       fades in from the left; out: the line runs off its end and the word fades */
    B.hl04 = function (X) {
        var d = X.d, e = X.e, o = X.o, rx = X.w / 2 * 1.04, ry = X.h / 2, sw = Math.max(1.5, X.fs * 0.04);
        var els = [{ n: "Ring", k: "path", pts: orbit(rx, ry, -0.035, 56), closed: false, smooth: true, stroke: "B", sw: sw, cap: 2, join: 2,
            taper: [22, 22, 0, 0, 50, 50], K: { te: X.io([[0, 0, "inout"], [d, 100]], []), ts: X.io([[0, 0]], [[o, 0, "inSoft"], [o + e, 100]]) } }];
        return {
            layers: [{ n: "Ring", els: els, fx: [] }],
            text: [X.revealIn({ opacity: 0, blur: [X.fs * 0.08, 0], pos: [X.fs * 0.12, 0] }, d * 0.15, d * 0.95, "outSoft", 45), X.fadeOut({ opacity: 0 }, o, o + e * 0.5)]
        };
    };
    /* hl15 (from the reference's carets): the two carets start together in the middle and pull the selection open */
    B.hl15 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, cw = Math.max(1.5, h * 0.075), ext = h * 0.08, dot = Math.max(4, h * 0.26), t1 = d * 0.25, t2 = d * 0.9;
        var g = grow("C", w, h, t1, t2, "expo"), s = shrink("C", w, h, o, o + e * 0.7, "expoIn");
        var caret = function (n, side) {
            return { n: n, parts: [{ k: "rect", w: cw, h: h + 2 * ext }, { k: "ellipse", w: dot, h: dot, pos: [0, side < 0 ? -h / 2 - ext : h / 2 + ext] }], fill: "A",
                K: { p: X.io([[t1, [0, 0], "expo"], [t2, [side * w / 2, 0]]], [[o, [side * w / 2, 0], "expoIn"], [o + e * 0.7, [0, 0]]]),
                    s: X.io([[0, [100, 0], "expo"], [t1, [100, 100]]], [[o + e * 0.7, [100, 100], "quintIn"], [o + e, [100, 0]]]) } };
        };
        return {
            layers: [{ n: "Selection", els: [{ n: "Box", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { sz: X.io(g.sz, s.sz), rp: X.io(g.rp, s.rp) } }, caret("Caret Left", -1), caret("Caret Right", 1)], fx: [X.shadow(0.25)] }],
            text: [X.inkAll(t1, t2 * 0.9, "expo", o, o + e * 0.6), X.revealIn({ opacity: 0, scale: [80, 80] }, t1, t2, "expo", 50, "center"), X.fadeOut({ opacity: 0 }, o + e * 0.2, o + e * 0.7)]
        };
    };
    /* hl05: a clean corporate block; the word stays and changes colour as the edge passes; out: it wipes off right */
    B.hl05 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, g = grow("L", w, h, 0, d, "expo"), s = shrink("R", w, h, o, o + e, "expoIn");
        return {
            layers: [{ n: "Block", els: [{ n: "Block", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { sz: X.io(g.sz, s.sz), rp: X.io(g.rp, s.rp) } }], fx: [] }],
            text: [X.inkWipe(0, d, "expo", "wipe", o, o + e, "expoIn"), X.revealIn({ opacity: 0, pos: [X.fs * 0.15, 0] }, 0, d * 0.9, "expo", 25), X.concealR({ opacity: 0 }, o + e * 0.1, o + e, "expoIn", 25)]
        };
    };
    /* hl06: an accent bar sweeps through first and pulls the main box in behind it; out: the bar covers it and leaves */
    B.hl06 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o;
        var a1 = grow("L", w, h, 0, d * 0.42, "expo"), a2 = shrink("R", w, h, d * 0.42, d * 0.92, "inout");
        var b1 = grow("L", w, h, d * 0.22, d * 0.8, "expo");
        var accSz = a1.sz.concat(a2.sz), accRp = a1.rp.concat(a2.rp), boxO = [[0, 100]];
        if (o !== null) {
            var c1 = grow("L", w, h, o, o + e * 0.45, "expoIn"), c2 = shrink("R", w, h, o + e * 0.45, o + e, "expo");
            accSz = accSz.concat(c1.sz).concat(c2.sz); accRp = accRp.concat(c1.rp).concat(c2.rp);
            accSz[a2.sz.length + a1.sz.length - 1][2] = "hold"; accRp[a2.rp.length + a1.rp.length - 1][2] = "hold";
            boxO = [[0, 100, "hold"], [o + e * 0.45, 0]];
        }
        return {
            layers: [{ n: "Sweep", els: [{ n: "Box", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { sz: b1.sz, rp: b1.rp, o: boxO } },
                { n: "Accent Bar", k: "rect", w: w, h: h, r: X.rr, fill: "A", K: { sz: accSz, rp: accRp } }], fx: [] }],
            text: [X.revealIn({ opacity: 0, pos: [X.fs * 0.25, 0] }, d * 0.35, d * 0.95, "expo", 30), X.inkAll(d * 0.3, d * 0.5, "linear"), X.holdOut(o + e * 0.45)]
        };
    };
    /* hl07: two gold hairlines run out from the middle, the box opens between them; the letters gather in */
    B.hl07 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, lh = Math.max(1.2, X.fs * 0.022);
        var g = grow("C", w, h, d * 0.25, d, "expo"), s = shrink("C", w, h, o + e * 0.2, o + e, "expoIn");
        var line = function (n, y, t0) {
            var gl = grow("C", w, lh, t0, t0 + d * 0.55, "expo"), sl = shrink("C", w, lh, o, o + e * 0.75, "expoIn");
            return { n: n, k: "rect", w: w, h: lh, fill: "A", p: [0, y], K: { sz: X.io(gl.sz, sl.sz), rp: X.io(gl.rp, sl.rp) } };
        };
        return {
            layers: [{ n: "Split", els: [{ n: "Box", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { sz: X.io(g.sz, s.sz), rp: X.io(g.rp, s.rp) } },
                line("Line Top", X.y0 - lh / 2, 0), line("Line Bottom", X.y1 + lh / 2, d * 0.06)], fx: [] }],
            text: [X.gather({ opacity: 0, track: 25, blur: [X.fs * 0.08, 0] }, d * 0.3, d * 1.05, "expo", o, o + e * 0.8), X.inkAll(d * 0.3, d * 0.6, "smooth", o + e * 0.2, o + e * 0.6)]
        };
    };
    /* hl08: a line draws under the word, then rises into the full block behind it */
    B.hl08 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, lh = Math.max(2, X.fs * 0.07), t1 = d * 0.48, yl = h / 2 - lh / 2;
        var sz = [[0, [0, lh], "expo"], [t1, [w, lh], "quint"], [d, [w, h]]], rp = [[0, [-w / 2, yl], "expo"], [t1, [0, yl], "quint"], [d, [0, 0]]];
        if (o !== null) { sz[2][2] = "linear"; rp[2][2] = "linear"; sz = sz.concat([[o, [w, h], "quintIn"], [o + e * 0.5, [w, lh], "expoIn"], [o + e, [0, lh]]]); rp = rp.concat([[o, [0, 0], "quintIn"], [o + e * 0.5, [0, yl], "expoIn"], [o + e, [w / 2, yl]]]); }
        return {
            layers: [{ n: "Rise", els: [{ n: "Block", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { sz: sz, rp: rp } }], fx: [] }],
            text: [X.inkAll(t1 + (d - t1) * 0.25, d, "smooth", o, o + e * 0.45), X.revealIn({ opacity: 0, pos: [0, X.fs * 0.2] }, t1 * 0.3, d * 0.9, "quint", 35), X.fadeOut({ opacity: 0, pos: [0, X.fs * 0.15] }, o + e * 0.3, o + e)]
        };
    };
    /* hl09: four corner brackets close in on the word from outside, a faint tint fills it, the word pulls into focus */
    B.hl09 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, arm = Math.min(h * 0.42, w * 0.2), sw = Math.max(1.5, X.fs * 0.035), k = 1.45, els = [];
        els.push({ n: "Tint", k: "rect", w: w, h: h, r: X.rr, fill: "B", fo: 14, K: { o: X.io([[d * 0.3, 0, "smooth"], [d, 100]], [[o, 100, "smooth"], [o + e * 0.6, 0]]) } });
        var cs = [[-1, -1, "Top Left"], [1, -1, "Top Right"], [1, 1, "Bottom Right"], [-1, 1, "Bottom Left"]], i;
        for (i = 0; i < 4; i++) {
            var sx = cs[i][0], sy = cs[i][1], P = [sx * w / 2, sy * h / 2], t0 = i * d * 0.04;
            els.push({ n: "Bracket " + cs[i][2], k: "path", pts: [[0, -sy * arm], [0, 0], [-sx * arm, 0]], closed: false, stroke: "A", sw: sw, cap: 3, join: 1,
                K: { p: X.io([[t0, [P[0] * k, P[1] * k], "expo"], [t0 + d * 0.75, P]], [[o, P, "expoIn"], [o + e, [P[0] * k, P[1] * k]]]), o: X.io([[t0, 0, "smooth"], [t0 + d * 0.3, 100]], [[o + e * 0.5, 100, "smooth"], [o + e, 0]]) } });
        }
        return { layers: [{ n: "Focus", els: els, fx: [] }], text: [X.focus(0, d * 0.85, o, o + e)] };
    };
    /* hl10: a frosted pill (see-through fill, hairline border) settles in, a soft light passes over it once */
    B.hl10 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, r = X.rr, sw = Math.max(1, X.fs * 0.018);
        var els = [
            { n: "Glass", k: "rect", w: w, h: h, r: r, fill: "B", fo: 16 },
            { n: "Border", k: "path", pts: rbox(w, h, r), closed: false, stroke: "A", so: 55, sw: sw, cap: 2, join: 2, K: { te: [[0, 0, "inout"], [d, 100]] } },
            X.shine(w, h, r, d * 0.45, d * 1.4, 32)
        ];
        return {
            layers: [{ n: "Glass", els: els, fx: [], K: { o: X.io([[0, 0, "smooth"], [d * 0.6, 100]], [[o, 100, "inSoft"], [o + e, 0]]), s: X.io([[0, [92, 92], "quint"], [d * 0.9, [100, 100]]], [[o, [100, 100], "inSoft"], [o + e, [96, 96]]]) } }],
            text: [X.revealIn({ opacity: 0, pos: [0, X.fs * 0.22], blur: [0, X.fs * 0.05] }, d * 0.15, d, "quint", 40), X.fadeOut({ opacity: 0 }, o, o + e * 0.6)]
        };
    };
    /* hl11: a rounded block rises from below its line, then a gloss sweeps across it */
    B.hl11 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, r = X.rr;
        return {
            layers: [{ n: "Gloss", els: [{ n: "Block", k: "rect", w: w, h: h, r: r, fill: "B" }, X.shine(w, h, r, d * 0.5, d * 1.45, 30)], fx: [X.shadow(0.22)], a: [0, h / 2], pp: [0, h / 2],
                K: { s: X.io([[0, [100, 0], "quint"], [d * 0.7, [100, 100]]], [[o, [100, 100], "quintIn"], [o + e * 0.8, [100, 0]]]), o: X.io([[0, 0, "smooth"], [d * 0.25, 100]], [[o + e * 0.5, 100, "smooth"], [o + e * 0.8, 0]]) } }],
            text: [X.revealIn({ opacity: 0, pos: [0, X.fs * 0.35] }, d * 0.15, d * 0.85, "quint", 35), X.inkAll(0, d * 0.4, "smooth"), X.concealR({ opacity: 0, pos: [0, X.fs * 0.3] }, o, o + e * 0.7, "quintIn", 35)]
        };
    };
    /* hl12: the box comes in as two halves from opposite sides that lock together */
    B.hl12 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, hh = h / 2;
        var t1 = grow("L", w, hh, 0, d * 0.8, "expo"), t2 = shrink("R", w, hh, o, o + e * 0.8, "expoIn");
        var b1 = grow("R", w, hh, d * 0.1, d * 0.9, "expo"), b2 = shrink("L", w, hh, o + e * 0.1, o + e * 0.9, "expoIn");
        return {
            layers: [{ n: "Split", els: [
                { n: "Top Half", k: "rect", w: w, h: hh, fill: "A", p: [0, -hh / 2], K: { sz: X.io(t1.sz, t2.sz), rp: X.io(t1.rp, t2.rp) } },
                { n: "Bottom Half", k: "rect", w: w, h: hh, fill: "B", p: [0, hh / 2], K: { sz: X.io(b1.sz, b2.sz), rp: X.io(b1.rp, b2.rp) } }], fx: [] }],
            text: [X.revealIn({ opacity: 0, pos: [X.fs * 0.3, 0] }, d * 0.15, d * 0.9, "expo", 30), X.inkAll(0, d * 0.5, "smooth"), X.fadeOut({ opacity: 0 }, o, o + e * 0.6)]
        };
    };
    /* hl13: three stripes sweep in one after another and close into the block; out they leave the same way */
    B.hl13 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, sh = h / 3, els = [], i;
        for (i = 0; i < 3; i++) {
            var t0 = i * d * 0.12, g = grow("L", w, sh + 0.6, t0, t0 + d * 0.7, "expo"), s = shrink("R", w, sh + 0.6, o + i * e * 0.1, o + i * e * 0.1 + e * 0.75, "expoIn");
            els.push({ n: "Stripe " + (i + 1), k: "rect", w: w, h: sh + 0.6, fill: "B", p: [0, -h / 2 + sh * (i + 0.5)], K: { sz: X.io(g.sz, s.sz), rp: X.io(g.rp, s.rp) } });
        }
        return {
            layers: [{ n: "Stripes", els: els, fx: [] }],
            text: [X.revealIn({ opacity: 0, pos: [X.fs * 0.2, 0] }, d * 0.2, d * 0.95, "expo", 30), X.inkWipe(d * 0.12, d * 0.82, "expo", "wipe", o, o + e * 0.95, "expoIn"), X.concealR({ opacity: 0 }, o + e * 0.1, o + e, "expoIn", 25)]
        };
    };
    /* hl14: a hairline frame grows from the word's centre, the fill eases in inside it */
    B.hl14 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, sw = Math.max(1, X.fs * 0.02), ins = Math.max(2, X.fs * 0.06);
        return {
            layers: [{ n: "Frame", els: [
                { n: "Fill", k: "rect", w: w - 2 * ins, h: h - 2 * ins, r: X.rr, fill: "B", K: { o: X.io([[d * 0.45, 0, "outSoft"], [d, 100]], [[o, 100, "inSoft"], [o + e * 0.5, 0]]) } },
                { n: "Hairline", k: "rect", w: w, h: h, r: X.rr, stroke: "A", sw: sw, K: { sz: X.io([[0, [w * 0.04, h * 0.04], "expo"], [d * 0.6, [w, h]]], [[o + e * 0.3, [w, h], "expoIn"], [o + e, [w * 0.04, h * 0.04]]]), o: X.io([[0, 0, "smooth"], [d * 0.2, 100]], [[o + e * 0.7, 100, "smooth"], [o + e, 0]]) } }], fx: [] }],
            text: [X.inkAll(d * 0.45, d, "outSoft", o, o + e * 0.5)]
        };
    };
    /* hl16: the box wipes in, then the word rises inside it from below (masked to the box); out it drops back */
    B.hl16 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, g = grow("L", w, h, 0, d * 0.6, "expo"), s = shrink("R", w, h, o + e * 0.35, o + e, "expoIn");
        return {
            layers: [{ n: "Box", els: [{ n: "Box", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { sz: X.io(g.sz, s.sz), rp: X.io(g.rp, s.rp) } }], fx: [] }],
            text: [X.revealIn({ pos: [0, h * 1.05] }, d * 0.3, d * 1.15, "quint", 30), X.inkAll(0, d * 0.05, "linear"), X.concealR({ pos: [0, h * 1.05] }, o, o + e * 0.6, "quintIn", 30)],
            mask: true
        };
    };
    /* hl18: a dot swells into a circle behind the word and stretches into a rounded block */
    B.hl18 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, c0 = h * 0.35, t1 = d * 0.35, r = X.rr;
        var sz = [[0, [c0, c0], "out"], [t1, [h, h], "expo"], [d, [w, h]]], rr = [[0, c0 / 2, "out"], [t1, h / 2, "expo"], [d, r]];
        if (o !== null) { sz[2][2] = "linear"; rr[2][2] = "linear"; sz = sz.concat([[o, [w, h], "expoIn"], [o + e * 0.6, [h, h], "inSoft"], [o + e, [0, 0]]]); rr = rr.concat([[o, r, "expoIn"], [o + e * 0.6, h / 2, "inSoft"], [o + e, 0]]); }
        return {
            layers: [{ n: "Bubble", els: [{ n: "Bubble", k: "rect", w: w, h: h, r: r, fill: "B", K: { sz: sz, rr: rr } }], fx: [X.shadow(0.2)] }],
            text: [X.revealIn({ opacity: 0, scale: [60, 60] }, t1 * 0.8, d * 1.05, "expo", 50, "center"), X.inkAll(t1 * 0.6, t1 * 1.2, "smooth"), X.fadeOut({ opacity: 0, scale: [70, 70] }, o, o + e * 0.6)]
        };
    };
    /* hl29: a block cursor types the word out (letter by letter), leaving the highlight behind it, then blinks */
    B.hl29 = function (X) {
        var w = X.w, h = X.h, d = X.d * 1.4, e = X.e, o = X.o, cw = Math.max(3, X.fs * 0.09), ch = h * 0.78, x0 = X.x0;
        var g = grow("L", w, h, 0, d, "linear"), blink = [], t, on = true;
        var pc = [[0, [x0 + cw, 0], "linear"], [d, [X.x1 - cw * 0.5, 0]]];
        for (t = d + 0.3; t < (o !== null ? o - 0.05 : d + 2.2); t += 0.32) { blink.push([t, on ? 0 : 100, "hold"]); on = !on; }
        if (!on) blink.push([t, 100, "hold"]);
        var co = [[0, 100, "hold"]].concat(blink);
        if (o !== null) { co.push([o, 100, "hold"]); pc[1][2] = "linear"; pc = pc.concat([[o, [X.x1 - cw * 0.5, 0], "linear"], [o + e, [x0 + cw, 0]]]); co.push([o + e, 0, "hold"]); }
        var gs = o !== null ? shrink("L", w, h, o, o + e, "linear") : null;
        return {
            layers: [{ n: "Typing", els: [{ n: "Box", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { sz: gs ? X.io(g.sz, gs.sz) : g.sz, rp: gs ? X.io(g.rp, gs.rp) : g.rp } },
                { n: "Cursor", k: "rect", w: cw, h: ch, fill: "A", K: { p: pc, o: co } }], fx: [] }],
            text: [X.typeIn(0, d, o, o + e), X.inkAll(0, 0.02, "linear")]
        };
    };
    /* hl30: a hairline outline draws round the word while a coloured plate slides in a little off-register */
    B.hl30 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, ofs = Math.max(3, X.fs * 0.09), sw = Math.max(1.5, X.fs * 0.03);
        return {
            layers: [{ n: "Print", els: [
                { n: "Plate", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { p: X.io([[d * 0.2, [ofs * 3.5, ofs * 3.5], "quint"], [d, [ofs, ofs]]], [[o, [ofs, ofs], "quintIn"], [o + e * 0.8, [ofs * 3.5, ofs * 3.5]]]), o: X.io([[d * 0.2, 0, "smooth"], [d * 0.5, 100]], [[o + e * 0.4, 100, "smooth"], [o + e * 0.8, 0]]) } },
                { n: "Outline", k: "path", pts: rbox(w, h, X.rr), closed: false, stroke: "A", sw: sw, cap: 3, join: 1, K: { te: X.io([[0, 0, "inout"], [d * 0.75, 100]], []), ts: X.io([[0, 0]], [[o, 0, "inout"], [o + e, 100]]) } }], fx: [] }],
            text: [X.revealIn({ opacity: 0, pos: [0, -X.fs * 0.15] }, d * 0.1, d * 0.9, "quint", 35), X.fadeOut({ opacity: 0 }, o, o + e * 0.6)]
        };
    };
    /* hl17: a slanted yellow slice shoots in from the left (stretched, motion-blurred) and snaps into place */
    B.hl17 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, sk = h * 0.28, x0 = X.x0, x1 = X.x1, y0 = X.y0, y1 = X.y1;
        var els = [{ n: "Slice", k: "path", pts: [[x0 + sk, y0], [x1 + sk, y0], [x1 - sk, y1], [x0 - sk, y1]], closed: true, fill: "B" }];
        return {
            layers: [{ n: "Slice", els: els, fx: [], a: [x0, 0], pp: [x0, 0],
                K: { p: X.io([[0, [x0 - w * 0.9, 0], "expo"], [d * 0.7, [x0, 0]]], [[o, [x0, 0], "expoIn"], [o + e * 0.8, [x0 + w * 1.4, 0]]]), s: X.io([[0, [190, 100], "expo"], [d * 0.75, [100, 100]]], [[o, [100, 100], "expoIn"], [o + e * 0.8, [190, 100]]]),
                    o: X.io([[0, 0, "linear"], [d * 0.12, 100]], [[o + e * 0.6, 100, "linear"], [o + e * 0.8, 0]]) } }],
            text: [X.revealIn({ opacity: 0, pos: [-X.fs * 0.6, 0], blur: [X.fs * 0.2, 0] }, d * 0.15, d * 0.85, "expo", 30), X.inkAll(d * 0.1, d * 0.4, "linear"), X.concealR({ opacity: 0, pos: [X.fs * 0.6, 0] }, o, o + e * 0.6, "expoIn", 30)]
        };
    };
    /* hl19: a candy pill pops up from nothing with a springy overshoot, the letters pop after it */
    B.hl19 = function (X) {
        var d = X.d, e = X.e, o = X.o;
        return {
            layers: [{ n: "Pill", els: [{ n: "Pill", k: "rect", w: X.w, h: X.h, r: X.rr, fill: "B" }], fx: [X.shadow(0.2)],
                K: { s: X.io([[0, [0, 0], "out"], [d * 0.45, [114, 114], "inout"], [d * 0.72, [95, 95], "inout"], [d, [100, 100]]], [[o, [100, 100], "inout"], [o + e * 0.35, [108, 108], "quintIn"], [o + e, [0, 0]]]),
                    r: X.io([[0, -8, "out"], [d * 0.6, 2, "inout"], [d, 0]], [[o, 0, "quintIn"], [o + e, 6]]) } }],
            text: [X.revealIn({ opacity: 0, scale: [0, 0] }, d * 0.2, d * 1.1, "out", 40), X.inkAll(0, d * 0.2, "linear"), X.fadeOut({ opacity: 0, scale: [50, 50] }, o + e * 0.2, o + e * 0.8)]
        };
    };
    /* hl20: neo-brutal: a flat box with a black outline lifts off its hard black shadow after it wipes in */
    B.hl20 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, ofs = Math.max(3, X.fs * 0.09), sw = Math.max(1.5, X.fs * 0.035);
        var g = grow("L", w, h, 0, d * 0.5, "expo"), gs = grow("L", w, h, 0, d * 0.5, "expo"), s = shrink("R", w, h, o + e * 0.35, o + e, "expoIn"), ss = shrink("R", w, h, o + e * 0.35, o + e, "expoIn");
        return {
            layers: [{ n: "Neo", els: [
                { n: "Shadow", k: "rect", w: w, h: h, fill: "A", p: [ofs, ofs], K: { sz: X.io(gs.sz, ss.sz), rp: X.io(gs.rp, ss.rp) } },
                { n: "Box", k: "rect", w: w, h: h, r: X.rr, fill: "B", stroke: "A", sw: sw, K: { sz: X.io(g.sz, s.sz), rp: X.io(g.rp, s.rp), p: X.io([[0, [ofs, ofs], "hold"], [d * 0.5, [ofs, ofs], "out"], [d, [0, 0]]], [[o, [0, 0], "inSoft"], [o + e * 0.35, [ofs, ofs]]]) } }], fx: [] }],
            text: [X.revealIn({ opacity: 0, pos: [X.fs * 0.2, 0] }, 0, d * 0.55, "expo", 25), X.inkAll(0, d * 0.3, "linear"), X.concealR({ opacity: 0 }, o + e * 0.35, o + e, "expoIn", 25)]
        };
    };
    /* hl21: a stack of cards lands behind the word one after another, each tilted a little */
    B.hl21 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, ofs = Math.max(3, X.fs * 0.08), els = [], i;
        var cards = [[2, -5, "A", 100, "Back Card"], [1, -2.5, "A", 55, "Middle Card"], [0, 0, "B", 100, "Front Card"]];
        for (i = 0; i < 3; i++) {
            var q = cards[i], t0 = i * d * 0.16, P = [q[0] * ofs * 0.6, q[0] * ofs];
            els.push({ n: q[4], k: "rect", w: w, h: h, r: X.rr, fill: q[2], fo: q[3],
                K: { p: X.io([[t0, [P[0], P[1] + h * 1.1], "out"], [t0 + d * 0.55, P]], [[o + (2 - i) * e * 0.12, P, "quintIn"], [o + (2 - i) * e * 0.12 + e * 0.6, [P[0], P[1] + h * 1.1]]]),
                    r: X.io([[t0, q[1] - 10, "out"], [t0 + d * 0.55, q[1]]], [[o, q[1], "quintIn"], [o + e, q[1] - 8]]), o: X.io([[t0, 0, "linear"], [t0 + d * 0.15, 100]], [[o + (2 - i) * e * 0.12 + e * 0.4, 100, "linear"], [o + (2 - i) * e * 0.12 + e * 0.6, 0]]) } });
        }
        return { layers: [{ n: "Cards", els: els, fx: [X.shadow(0.2)] }], text: [X.revealIn({ opacity: 0, pos: [0, X.fs * 0.3] }, d * 0.4, d * 1.05, "out", 35), X.inkAll(d * 0.32, d * 0.5, "linear"), X.fadeOut({ opacity: 0 }, o, o + e * 0.5)] };
    };
    /* hl22: a marker bar over the lower part of the word, a touch tilted, wiping in at marker speed */
    B.hl22 = function (X) {
        var w = X.w, h = X.h * 0.56, d = X.d, e = X.e, o = X.o, y = X.h / 2 - h / 2 + X.fs * 0.03;
        var g = grow("L", w, h, 0, d, "outSoft"), s = shrink("R", w, h, o, o + e, "inSoft");
        return { layers: [{ n: "Marker", els: [{ n: "Marker", k: "rect", w: w, h: h, r: X.rr * 0.56, fill: "B", fo: 90, p: [0, y], K: { sz: X.io(g.sz, s.sz), rp: X.io(g.rp, s.rp) } }], fx: [], r: -1.6 }], text: [] };
    };
    /* hl23: a felt-tip scribble colouring the word in, back and forth */
    B.hl23 = function (X) {
        var w = X.w, h = X.h, d = X.d * 1.3, e = X.e, o = X.o, sw = h * 0.36, n = Math.max(4, Math.round((w - sw) / (sw * 0.62))), pts = [], i;
        for (i = 0; i <= n; i++) { var u = i / n, x = X.x0 + sw * 0.5 + u * (w - sw); pts.push([x, i % 2 ? X.y1 - sw * 0.5 : X.y0 + sw * 0.5]); }
        return {
            layers: [{ n: "Scribble", els: [{ n: "Scribble", k: "path", pts: pts, closed: false, smooth: true, stroke: "B", so: 88, sw: sw, cap: 2, join: 2, K: { te: [[0, 0, "smooth"], [d, 100]], ts: X.io([[0, 0]], [[o, 0, "inSoft"], [o + e, 100]]) } }], fx: [] }],
            text: []
        };
    };
    /* hl24: a white sticker slaps on behind the word: big, tilted, settling with a bounce and a soft shadow */
    B.hl24 = function (X) {
        var d = X.d, e = X.e, o = X.o, sw = Math.max(1.5, X.fs * 0.03);
        return {
            layers: [{ n: "Sticker", els: [{ n: "Sticker", k: "rect", w: X.w, h: X.h, r: X.rr, fill: "B", stroke: "A", sw: sw }], fx: [X.shadow(0.35)],
                K: { s: X.io([[0, [165, 165], "expo"], [d * 0.45, [93, 93], "inout"], [d * 0.75, [102, 102], "inout"], [d, [100, 100]]], [[o, [100, 100], "inout"], [o + e * 0.3, [106, 106], "quintIn"], [o + e, [0, 0]]]),
                    r: X.io([[0, -14, "expo"], [d * 0.45, 3, "inout"], [d, -2]], [[o, -2, "quintIn"], [o + e, -18]]), o: X.io([[0, 0, "linear"], [d * 0.1, 100]], []) } }],
            text: [X.inkAll(d * 0.15, d * 0.3, "linear"), X.revealIn({ opacity: 0 }, d * 0.15, d * 0.3, "linear", 100), X.fadeOut({ opacity: 0 }, o + e * 0.3, o + e * 0.7)]
        };
    };
    /* hl25: a price tag with a punched hole swings in from the left */
    B.hl25 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, tip = h * 0.42, x0 = X.x0, x1 = X.x1, y0 = X.y0, y1 = X.y1, hole = Math.max(3, h * 0.16);
        var tag = { k: "path", pts: [[x0 - tip, 0], [x0, y0], [x1, y0], [x1, y1], [x0, y1]], closed: true };
        return {
            layers: [{ n: "Tag", els: [{ n: "Tag", parts: [tag, { k: "ellipse", w: hole, h: hole, pos: [x0 - tip * 0.25, 0] }], merge: 3, fill: "B" }], fx: [X.shadow(0.22)], a: [x0 - tip, 0], pp: [x0 - tip, 0],
                K: { p: X.io([[0, [x0 - tip - w * 0.5, 0], "expo"], [d * 0.6, [x0 - tip, 0]]], [[o, [x0 - tip, 0], "expoIn"], [o + e * 0.8, [x0 - tip - w * 0.5, 0]]]),
                    r: X.io([[0, -12, "out"], [d * 0.55, 3, "inout"], [d, 0]], [[o, 0, "quintIn"], [o + e * 0.8, -10]]), o: X.io([[0, 0, "linear"], [d * 0.15, 100]], [[o + e * 0.5, 100, "linear"], [o + e * 0.8, 0]]) } }],
            text: [X.revealIn({ opacity: 0, pos: [-X.fs * 0.3, 0] }, d * 0.2, d * 0.9, "expo", 30), X.inkAll(d * 0.1, d * 0.3, "linear"), X.fadeOut({ opacity: 0 }, o, o + e * 0.5)]
        };
    };
    /* hl26: a neon tube draws round the word, glows, flickers on */
    B.hl26 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, sw = Math.max(1.5, X.fs * 0.04);
        var fl = [[0, 100, "linear"], [d, 100, "hold"], [d + 0.06, 35, "hold"], [d + 0.1, 100, "hold"], [d + 0.2, 55, "hold"], [d + 0.24, 100, "linear"]];
        if (o !== null) fl = fl.concat([[o, 100, "hold"], [o + e * 0.2, 40, "hold"], [o + e * 0.3, 100, "inSoft"], [o + e, 0]]);
        return {
            layers: [{ n: "Neon", els: [{ n: "Tube", k: "path", pts: rbox(w, h, X.rr), closed: false, stroke: "B", sw: sw, cap: 2, join: 2, K: { te: [[0, 0, "inout"], [d, 100]] } }], fx: [{ k: "glow", radius: X.fs * 0.35, intensity: 1.4 }], K: { o: fl } }],
            text: [X.revealIn({ opacity: 0 }, d * 0.5, d + 0.25, "linear", 100)]
        };
    };
    /* hl27: the box glitches in: a few frame jumps with cyan slices, then it holds still */
    B.hl27 = function (X) {
        var w = X.w, h = X.h, d = X.d, e = X.e, o = X.o, j = X.fs * 0.14, f = Math.max(0.035, d * 0.07);
        var jit = function (t, s) { return [[t, [s * j, 0], "hold"], [t + f, [-s * j * 0.6, 0], "hold"], [t + 2 * f, [s * j * 0.3, 0], "hold"], [t + 3 * f, [0, 0], "hold"]]; };
        var bp = jit(0, 1), bo = [[0, 0, "hold"], [f * 0.5, 100, "hold"]];
        if (o !== null) { bp = bp.concat(jit(o, -1)); bo = bo.concat([[o + 3 * f, 100, "hold"], [o + 4 * f, 0, "hold"]]); }
        var slice = function (n, y, hh, col, t, s) {
            var K = { p: [[t, [s * j * 1.6, y], "hold"], [t + f, [-s * j, y], "hold"], [t + 2 * f, [s * j * 0.5, y], "hold"]], o: [[t, 0, "hold"], [t + 0.01, 100, "hold"], [t + 3 * f, 0, "hold"]] };
            if (o !== null) { K.p = K.p.concat([[o, [-s * j, y], "hold"], [o + f, [s * j * 1.4, y], "hold"]]); K.o = K.o.concat([[o, 100, "hold"], [o + 3 * f, 0, "hold"]]); }
            return { n: n, k: "rect", w: w * 1.05, h: hh, fill: col, K: K };
        };
        return {
            layers: [{ n: "Glitch", els: [{ n: "Box", k: "rect", w: w, h: h, r: X.rr, fill: "B", K: { p: bp, o: bo } }, slice("Slice 1", -h * 0.22, h * 0.22, "A", 0, 1), slice("Slice 2", h * 0.25, h * 0.16, "B", f, -1)], fx: [] }],
            text: [X.glitchIn(0, 4 * f, o, o + 4 * f), X.inkAll(0, 0.01, "linear")]
        };
    };
    /* hl28: the block drops from its top edge with a heavy bounce, the letters fall in after it */
    B.hl28 = function (X) {
        var d = X.d, e = X.e, o = X.o, y0 = X.y0;
        return {
            layers: [{ n: "Drop", els: [{ n: "Block", k: "rect", w: X.w, h: X.h, r: X.rr, fill: "B" }], fx: [X.shadow(0.2)], a: [0, y0], pp: [0, y0],
                K: { s: X.io([[0, [100, 0], "out"], [d * 0.5, [100, 114], "inout"], [d * 0.75, [100, 95], "inout"], [d, [100, 100]]], [[o, [100, 100], "quintIn"], [o + e * 0.8, [100, 0]]]) } }],
            text: [X.revealIn({ opacity: 0, pos: [0, -X.fs * 0.5] }, d * 0.2, d, "out", 35), X.inkAll(0, d * 0.3, "linear"), X.concealR({ opacity: 0, pos: [0, X.fs * 0.4] }, o, o + e * 0.7, "quintIn", 35)]
        };
    };

    /* a smooth path through points (Catmull-Rom): AE vertex tangents, and the same curve as a dense polyline */
    C.tangents = function (pts, closed) {
        var n = pts.length, I = [], O = [], i;
        for (i = 0; i < n; i++) {
            var a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
            var tx = (b[0] - a[0]) / 6, ty = (b[1] - a[1]) / 6;
            if (!closed && (i === 0 || i === n - 1)) { tx *= 2; ty *= 2; }
            O.push([tx, ty]); I.push([-tx, -ty]);
        }
        return { i: I, o: O };
    };
    C.dense = function (pts, closed, steps) {
        var tn = C.tangents(pts, closed), out = [], n = pts.length, last = closed ? n : n - 1, i, k;
        steps = steps || 8;
        for (i = 0; i < last; i++) {
            var a = pts[i], b = pts[(i + 1) % n], c1 = [a[0] + tn.o[i][0], a[1] + tn.o[i][1]], c2 = [b[0] + tn.i[(i + 1) % n][0], b[1] + tn.i[(i + 1) % n][1]];
            for (k = 0; k < steps; k++) {
                var u = k / steps, m = 1 - u;
                out.push([m * m * m * a[0] + 3 * m * m * u * c1[0] + 3 * m * u * u * c2[0] + u * u * u * b[0], m * m * m * a[1] + 3 * m * m * u * c1[1] + 3 * m * u * u * c2[1] + u * u * u * b[1]]);
            }
        }
        out.push(closed ? [pts[0][0], pts[0][1]] : [pts[n - 1][0], pts[n - 1][1]]);
        return out;
    };

    /* ------------------------------------------------------------------ build */
    C.build = function (id, R, fs, c) {
        var L = C.find(id), f = (c.pad === undefined ? 100 : c.pad) / 100;
        var px = fs * L.px * f, py = fs * L.py * f, w = R.width + 2 * px, h = R.height + 2 * py;
        var rd = (c.round === null || c.round === undefined) ? L.round : c.round;
        var X = { w: w, h: h, x0: -w / 2, x1: w / 2, y0: -h / 2, y1: h / 2, fs: fs, rr: clamp(rd, 0, 100) / 100 * h / 2,
            d: Math.max(0.1, c.dIn), e: Math.max(0.1, c.dOut), o: (c.tOut === null || c.tOut === undefined) ? null : c.tOut, reveal: c.reveal !== false, ink: c.ink !== false && !!L.ink };
        if (X.o !== null) X.o = Math.max(X.o, X.d * 1.5 + 0.1);
        X.io = function (a, b) {
            if (X.o === null || !b || !b.length) return a;
            var q = a.slice(); q[q.length - 1] = [q[q.length - 1][0], q[q.length - 1][1], "linear"];
            return q.concat(b);
        };
        X.shadow = function (k) { return { k: "shadow", op: Math.round(100 * k), dist: fs * 0.05, soft: fs * 0.22, dir: 160 }; };
        X.blurOut = function () { return X.o === null ? null : { k: "blur", K: [[X.o + X.e * 0.15, 0, "inSoft"], [X.o + X.e, fs * 0.28]] }; };
        /* the word: in from the left (a soft front W % wide) with the highlight; "center": from the middle out */
        X.revealIn = function (props, t0, t1, ea, W, mode) {
            if (!X.reveal) return null;
            if (mode === "center") return { n: "UK HL In", props: props, sel: { based: 2, shape: 1, start: 50, end: 50, smooth: 100 }, invert: true, K: { start: [[t0, 50, ea], [t1, 0]], end: [[t0, 50, ea], [t1, 100]] } };
            return { n: "UK HL In", props: props, sel: { based: 2, shape: 2, start: 0, end: W, hi: 70, lo: 70 }, K: { off: [[t0, -W, ea], [t1, 100]] } };
        };
        X.concealR = function (props, t0, t1, ea, W) {      // out to the right: the first letters go first
            if (!X.reveal || X.o === null) return null;
            return { n: "UK HL Out", props: props, sel: { based: 2, shape: 3, start: 0, end: W, hi: 70, lo: 70 }, K: { off: [[t0, -W, ea], [t1, 100]] } };
        };
        X.fadeOut = function (props, t0, t1) {
            if (!X.reveal || X.o === null) return null;
            return { n: "UK HL Out", props: props, sel: { based: 2, shape: 1, start: 0, end: 100 }, K: { amt: [[t0, 0, "inSoft"], [t1, 100]] } };
        };
        X.holdOut = function (t) { if (!X.reveal || X.o === null) return null; return { n: "UK HL Out", props: { opacity: 0 }, sel: { based: 2, shape: 1, start: 0, end: 100 }, K: { amt: [[0, 0, "hold"], [t, 100]] } }; };
        /* the word's colour on the highlight: with the wiping edge, or all at once */
        X.inkWipe = function (t0, t1, ea, out, o0, o1, eo) {
            if (!X.ink) return null;
            var K = { end: [[t0, 0, ea], [t1, 100]] };
            if (X.o !== null && out === "wipe") K.start = [[0, 0, "linear"], [o0, 0, eo || "inSoft"], [o1, 100]];
            else if (X.o !== null) K.amt = [[0, 100, "linear"], [X.o + X.e * 0.4, 100, "inSoft"], [X.o + X.e, 0]];
            return { n: "UK HL Ink", props: { fill: "I" }, sel: { based: 2, shape: 1, start: 0, end: 0, smooth: 100 }, K: K };
        };
        X.inkAll = function (t0, t1, ea, o0, o1) {
            if (!X.ink) return null;
            var K = { amt: [[t0, 0, ea], [t1, 100]] };
            if (X.o !== null) { var a = o0 === undefined ? X.o + X.e * 0.5 : o0, b = o1 === undefined ? X.o + X.e : o1; K.amt[1][2] = "linear"; K.amt = K.amt.concat([[a, 100, "inSoft"], [b, 0]]); }
            return { n: "UK HL Ink", props: { fill: "I" }, sel: { based: 2, shape: 1, start: 0, end: 100 }, K: K };
        };
        X.gather = function (props, t0, t1, ea, o0, o1) {      // letters spaced out gather in (and spread out again)
            if (!X.reveal) return null;
            var K = { amt: [[t0, 100, ea], [t1, 0]] };
            if (X.o !== null) K.amt = X.io(K.amt, [[o0, 0, "expoIn"], [o1, 100]]);
            return { n: "UK HL In", props: props, sel: { based: 2, shape: 1, start: 0, end: 100 }, K: K };
        };
        X.focus = function (t0, t1, o0, o1) {                  // a blur pull into focus
            var K = { amt: [[t0, 100, "outSoft"], [t1, 0]] };
            if (X.o !== null) K.amt = X.io(K.amt, [[o0, 0, "inSoft"], [o1, 100]]);
            return { n: "UK HL Focus", props: { blur: [fs * 0.16, fs * 0.16], opacity: 55 }, sel: { based: 2, shape: 1, start: 0, end: 100 }, K: K };
        };
        X.typeIn = function (t0, t1, o0, o1) {                 // letters appear one by one (hard), deleted back on the way out
            if (!X.reveal) return null;
            var K = { start: [[t0, 0, "linear"], [t1, 100]] };
            if (X.o !== null) K.start = X.io(K.start, [[o0, 100, "linear"], [o1, 0]]);
            return { n: "UK HL In", props: { opacity: 0 }, sel: { based: 2, shape: 1, start: 0, end: 100, smooth: 0 }, K: K };
        };
        X.glitchIn = function (t0, t1, o0, o1) {
            if (!X.reveal) return null;
            var K = { off: [[t0, 0, "linear"], [t1, 100]] };          // (the hidden letters leave the range in random order)
            if (X.o !== null) K.off = X.io(K.off, [[o0, 100, "linear"], [o1, 0]]);
            return { n: "UK HL In", props: { opacity: 0 }, sel: { based: 2, shape: 1, start: 0, end: 100, random: true, smooth: 0 }, K: K };
        };
        /* a soft light passing over a (rounded) box: a slanted bar intersected with the box (Merge Paths) */
        X.shine = function (w2, h2, r2, t0, t1, op) {
            var bw = Math.max(h2 * 0.5, w2 * 0.12);
            return { n: "Shine", parts: [{ k: "rect", w: w2, h: h2, r: r2 }, { k: "rect", w: bw, h: h2 * 2.6, sub: { r: 22, K: { p: [[t0, [-w2 / 2 - bw * 1.6, 0], "inout"], [t1, [w2 / 2 + bw * 1.6, 0]]] } } }],
                merge: 4, fill: "#FFFFFF", fo: op };
        };
        var spec = (B[id] || B.hl01)(X), uses = { B: 1 }, i, j, k;
        spec.c = [R.left + R.width / 2, R.top + R.height / 2];
        spec.w = w; spec.h = h;
        /* tidy up: no empty entries; single-shape elements as parts */
        for (i = 0; i < spec.layers.length; i++) {
            var Ly = spec.layers[i], fx = [];
            for (j = 0; j < (Ly.fx || []).length; j++) if (Ly.fx[j]) fx.push(Ly.fx[j]);
            Ly.fx = fx; Ly.K = Ly.K || {};
            for (j = 0; j < Ly.els.length; j++) {
                var el = Ly.els[j];
                if (!el.parts) {
                    var s = { k: el.k, w: el.w, h: el.h, r: el.r, pos: el.pos, pts: el.pts, closed: el.closed, smooth: el.smooth, K: {} };
                    var EK = el.K || {}, GK = {};
                    for (k in EK) { if (k === "sz" || k === "rp" || k === "rr") s.K[k] = EK[k]; else GK[k] = EK[k]; }
                    el.parts = [s]; el.K = GK;
                }
                el.K = el.K || {};
                for (k = 0; k < el.parts.length; k++) el.parts[k].K = el.parts[k].K || {};
                if (el.fill === "A" || el.stroke === "A") uses.A = 1;
                if (el.fill === "I" || el.stroke === "I") uses.I = 1;
            }
        }
        var tx = [];
        for (i = 0; i < (spec.text || []).length; i++) if (spec.text[i]) { tx.push(spec.text[i]); if (spec.text[i].props.fill === "I") uses.I = 1; }
        spec.text = tx;
        spec.uses = [];
        for (k in uses) spec.uses.push(k);
        spec.mask = spec.mask ? [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]] : null;
        spec.end = X.o === null ? X.d * 1.6 : X.o + X.e;
        return spec;
    };

    /* AE's range selector, near enough for the preview: how much character i of n is selected at time t */
    C.selAmount = function (an, t, i, n) {
        var s = an.sel, K = an.K;
        var S = K.start ? C.val(K.start, t) : (s.start || 0), E = K.end ? C.val(K.end, t) : (s.end === undefined ? 100 : s.end);
        var O = K.off ? C.val(K.off, t) : (s.offset || 0), A = K.amt ? C.val(K.amt, t) : 100;
        if (s.random) { var x = Math.sin((i + 1) * 12.9898 + 7.233) * 43758.5453; i = Math.floor((x - Math.floor(x)) * n * 0.999); }
        var a = i / n * 100, b = (i + 1) / n * 100, m = (a + b) / 2, s0 = Math.min(S, E) + O, e0 = Math.max(S, E) + O, v;
        if ((s.shape || 1) === 1) {
            if (s.smooth === 0) v = (m >= s0 && m < e0) ? 1 : 0;
            else v = Math.max(0, Math.min(b, e0) - Math.max(a, s0)) / (b - a);
        } else {
            var u = e0 > s0 ? clamp((m - s0) / (e0 - s0), 0, 1) : (m >= s0 ? 1 : 0);
            u = u * u * (3 - 2 * u);
            v = s.shape === 3 ? 1 - u : u;
        }
        if (an.invert) v = 1 - v;
        return clamp(v, 0, 1) * A / 100;
    };
    return C;
})();

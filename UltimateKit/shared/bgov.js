/*  Ultimate Kit - "BG Overlay" (2026-10-25, the user's talking-head references + 12 of mine): graphics that light
    up behind the speaker (grids, panels, lines, light) for the text to sit on. Shared by the panel preview
    (js/bgovprev.js) and After Effects (jsx/bgov.jsx), so ES3.

    A look is a list of elements, bottom first; every element becomes one shape layer in AE with clean keyframes:
      n name, k kind: "rect" | "ellipse" | "path" | "tone" (an adjustment layer: the background in black & white)
      w, h, r (rect / ellipse size, roundness); pts, closed (path, around the layer's anchor)
      fill / stroke: "A" accent, "L" line colour, "K" black or "#hex"; fo fill opacity, sw stroke width
      blend "normal" | "screen" | "add" | "multiply"; blur px; o opacity; a anchor; p position
      rep { n, dx, dy }: copies (an AE Repeater)
      K: keyframes { p, s, r, o, te, ts }: [[time, value, ease of the move to the next key], ...]
    Times are seconds for a look of c.dur seconds; positions are comp px (from W, H).
    Each look also has a sample text layout (T) placed to fit its graphics; AE adds it on request.          */
var UK_BGOV = (function () {
    var C = {};
    C.DEF = { dur: 5, accent: "#E3141B", line: "#FFFFFF", amount: 100, text: true };
    /* the eases: [out influence, in influence, out speed factor, in speed factor] (= jsx/core.jsx UK.CURVES) */
    C.EASES = {
        ease: [33.34, 33.34, 0, 0], smooth: [42, 42, 0, 0], inout: [65, 65, 0, 0], inoutStrong: [82, 82, 0, 0],
        out: [33, 32, 3.0, 0], outSoft: [40, 55, 1.6, 0], quint: [22, 64, 4.5, 0], expo: [16, 70, 6.2, 0],
        "in": [32, 33, 0, 3.0], inSoft: [55, 40, 0, 1.6], quintIn: [64, 22, 0, 4.5], expoIn: [70, 16, 0, 6.2]
    };
    /* the ease of a move (0..1 -> 0..1): AE's temporal bezier with those influences / speeds */
    C.ease = function (name, x) {
        if (name === "linear") return x;
        var e = C.EASES[name] || C.EASES.smooth, a = e[0] / 100, b = 1 - e[1] / 100, ya = e[2] * e[0] / 100, yb = 1 - e[3] * e[1] / 100;
        var lo = 0, hi = 1, u = 0.5;
        for (var q = 0; q < 24; q++) { u = (lo + hi) / 2; var m = 1 - u, xu = 3 * m * m * u * a + 3 * m * u * u * b + u * u * u; if (xu < x) lo = u; else hi = u; }
        var m2 = 1 - u;
        return 3 * m2 * m2 * u * ya + 3 * m2 * u * u * yb + u * u * u;
    };
    C.val = function (K, t) {               // keys at time t
        if (t <= K[0][0]) return K[0][1];
        for (var i = 1; i < K.length; i++) if (t < K[i][0]) {
            var a = K[i - 1][1], b = K[i][1], e = C.ease(K[i - 1][2] || "smooth", (t - K[i - 1][0]) / Math.max(1e-6, K[i][0] - K[i - 1][0]));
            if (a instanceof Array) { var r = []; for (var d = 0; d < a.length; d++) r.push(a[d] + (b[d] - a[d]) * e); return r; }
            return a + (b - a) * e;
        }
        return K[K.length - 1][1];
    };
    function rnd(i, k) { var x = Math.sin((i + 1) * 12.9898 + (k + 1) * 78.233) * 43758.5453; return x - Math.floor(x); }
    function box(w, h) { return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]; }

    /* 1 - Red Panels (the user's 1st reference): see-through accent panels wipe in one after another (Screen), hold,
       wipe away, and their thin outlines + the grid lines stay */
    function redPanels(W, H, c) {
        var D = c.dur, M = Math.min(W, H), g = 0.012 * M, cols = [0, 0.34 * W, 0.67 * W, W], rows = [0.06 * H, 0.21 * H, 0.38 * H, 0.52 * H], E = [];
        var tiles = [[1, 0, "L"], [2, 0, "T"], [0, 1, "L"], [1, 1, "T"], [2, 2, "R"], [0, 2, "L"]], i;
        for (i = 0; i < tiles.length; i++) {
            var q = tiles[i], cx = (cols[q[0]] + cols[q[0] + 1]) / 2, cy = (rows[q[1]] + rows[q[1] + 1]) / 2, w = cols[q[0] + 1] - cols[q[0]] - g, h = rows[q[1] + 1] - rows[q[1]] - g;
            var t0 = 0.12 + i * 0.07, t1 = D - 0.78 + i * 0.03, a, p, s0;
            if (q[2] === "L") { a = [-w / 2, 0]; p = [cx - w / 2, cy]; s0 = [0, 100]; }
            else if (q[2] === "R") { a = [w / 2, 0]; p = [cx + w / 2, cy]; s0 = [0, 100]; }
            else { a = [0, -h / 2]; p = [cx, cy - h / 2]; s0 = [100, 0]; }
            E.push({ n: "Panel " + (i + 1), k: "rect", w: w, h: h, fill: "A", fo: 88, blend: "screen", a: a, p: p,
                K: { s: [[t0, s0, "expo"], [t0 + 0.2, [100, 100]], [t1, [100, 100], "quintIn"], [t1 + 0.26, s0]] } });
        }
        for (i = 0; i < tiles.length; i++) {
            var q2 = tiles[i], cx2 = (cols[q2[0]] + cols[q2[0] + 1]) / 2, cy2 = (rows[q2[1]] + rows[q2[1] + 1]) / 2, w2 = cols[q2[0] + 1] - cols[q2[0]] - g, h2 = rows[q2[1] + 1] - rows[q2[1]] - g, tt = 0.12 + i * 0.07;
            E.push({ n: "Panel Line " + (i + 1), k: "path", pts: box(w2, h2), closed: true, stroke: "L", sw: 1.5, o: 38, p: [cx2, cy2], K: { te: [[tt, 0, "inout"], [tt + 0.6, 100]] } });
        }
        for (i = 0; i < rows.length; i++) E.push({ n: "Grid H" + (i + 1), k: "path", pts: [[0, 0], [W, 0]], stroke: "L", sw: 1, o: 26, p: [0, rows[i] - g / 2], K: { te: [[D - 0.85 + i * 0.05, 0, "inout"], [D - 0.25 + i * 0.05, 100]] } });
        for (i = 1; i < 3; i++) E.push({ n: "Grid V" + i, k: "path", pts: [[0, 0], [0, rows[3] - rows[0] + 0.06 * H]], stroke: "L", sw: 1, o: 26, p: [cols[i] - g / 2, rows[0] - 0.03 * H], K: { te: [[D - 0.8 + i * 0.06, 0, "inout"], [D - 0.2 + i * 0.06, 100]] } });
        return { els: E, T: { style: "slideR", x: 0.74 * W, y: 0.2 * H, words: ["YOUR", "TEXT", "HERE"] } };
    }
    /* 2 - Line Grid (the user's 2nd reference): the background in black & white and dimmed, thin lines drawing on
       from the side and from the top to frame the text, a few drifting specks */
    function lineGrid(W, H, c) {
        var D = c.dur, E = [], i;
        E.push({ n: "BG Tone", k: "tone", o: 100, K: { o: [[0, 0, "inout"], [0.4, 100], [D - 0.5, 100, "inout"], [D, 0]] } });
        E.push({ n: "Dim", k: "rect", w: W, h: H, fill: "K", fo: 100, p: [W / 2, H / 2], K: { o: [[0, 0, "inout"], [0.4, 28], [D - 0.5, 28, "inout"], [D, 0]] } });
        var L = [["Line H1", [[W, 0], [0.44 * W, 0]], [0, 0.3 * H], 0.2], ["Line H2", [[W, 0], [0.4 * W, 0]], [0, 0.43 * H], 0.34],
            ["Line V1", [[0, 0], [0, 0.34 * H]], [0.82 * W, 0.2 * H], 0.48], ["Line V2", [[0, 0], [0, 0.36 * H]], [0.94 * W, 0.25 * H], 0.6]];
        for (i = 0; i < L.length; i++) E.push({ n: L[i][0], k: "path", pts: L[i][1], stroke: "L", sw: 2, o: 72, p: L[i][2],
            K: { te: [[L[i][3], 0, "expo"], [L[i][3] + 0.7, 100]], ts: [[D - 0.7 + i * 0.05, 0, "quintIn"], [D - 0.25 + i * 0.05, 100]] } });
        for (i = 0; i < 7; i++) {
            var x = (0.45 + 0.5 * rnd(i, 1)) * W, y = (0.12 + 0.4 * rnd(i, 2)) * H, sz = 4 + 5 * rnd(i, 3), t0 = 0.3 + 0.25 * i;
            E.push({ n: "Speck " + (i + 1), k: "ellipse", w: sz, h: sz, fill: "L", fo: 100,
                K: { p: [[0, [x, y], "linear"], [D, [x + (rnd(i, 4) - 0.5) * 0.08 * W, y - 0.05 * H]]], o: [[t0, 0, "smooth"], [t0 + 0.4, 80, "smooth"], [t0 + 1.4, 20, "smooth"], [t0 + 2.2, 70, "smooth"], [D - 0.3, 0]] } });
        }
        return { els: E, T: { style: "fade", x: 0.68 * W, y: 0.33 * H, words: ["NO", "LIMITS"] } };
    }
    /* 3 - Dark Panel (the user's 3rd reference): a see-through black panel slides in, a thin white line draws down
       its edge and along its foot */
    function darkPanel(W, H, c) {
        var D = c.dur, pw = 0.5 * W, ph = 0.64 * H, x1 = 0.75 * W, xo = 1.3 * W;
        var KX = function (dx) { return [[0.15, [xo + dx, 0], "quint"], [0.8, [x1 + dx, 0]], [D - 0.6, [x1 + dx, 0], "quintIn"], [D - 0.1, [xo + dx, 0]]]; };
        var kp = KX(0), i;
        for (i = 0; i < kp.length; i++) kp[i][1] = [kp[i][1][0], ph / 2];
        var E = [{ n: "Dark Panel", k: "rect", w: pw, h: ph, fill: "K", fo: 100, o: 48, K: { p: kp } }];
        var ke = KX(-pw / 2);
        E.push({ n: "Edge Line", k: "path", pts: [[0, 0], [0, ph]], stroke: "L", sw: 1.5, o: 75, K: { p: ke, te: [[0.35, 0, "expo"], [1.05, 100]] } });
        var kb = KX(-pw / 2); for (i = 0; i < kb.length; i++) kb[i][1] = [kb[i][1][0], ph];
        E.push({ n: "Foot Line", k: "path", pts: [[0, 0], [pw, 0]], stroke: "L", sw: 1.5, o: 55, K: { p: kb, te: [[0.85, 0, "expo"], [1.4, 100]] } });
        var km = KX(-pw / 2); for (i = 0; i < km.length; i++) km[i][1] = [km[i][1][0], 0.012 * H];
        E.push({ n: "Marker", k: "rect", w: 0.012 * W, h: 0.012 * W, fill: "A", fo: 100, K: { p: km, s: [[0.9, [0, 0], "expo"], [1.2, [100, 100]]] } });
        return { els: E, T: { style: "stack3d", x: 0.75 * W, y: 0.2 * H, words: ["BIG", "BOLD", "IDEA"] } };
    }
    /* 4 - Light Beams: soft tilted beams of light sweep slowly across (Add) */
    function beams(W, H, c) {
        var D = c.dur, E = [], i;
        for (i = 0; i < 3; i++) {
            var x0 = (-0.1 + 0.32 * i) * W;
            E.push({ n: "Beam " + (i + 1), k: "rect", w: 0.16 * W, h: 1.6 * H, fill: i === 1 ? "L" : "A", fo: 100, blend: "add", blur: 0.06 * W, p: [x0, 0.35 * H],
                K: { p: [[0, [x0, 0.35 * H], "smooth"], [D, [x0 + 0.35 * W, 0.35 * H]]], r: [[0, -22]], o: [[0.1 * i, 0, "outSoft"], [0.9 + 0.1 * i, i === 1 ? 22 : 34], [D - 0.6, i === 1 ? 22 : 34, "inSoft"], [D, 0]] } });
        }
        return { els: E, T: { style: "rise", x: 0.5 * W, y: 0.16 * H, words: ["SHINE", "BRIGHT"] } };
    }
    /* 5 - Halo Rings: thin rings round the head draw on and turn slowly */
    function halo(W, H, c) {
        var D = c.dur, M = Math.min(W, H), E = [], R = [0.52, 0.72, 0.96], i;
        for (i = 0; i < 3; i++) E.push({ n: "Ring " + (i + 1), k: "ellipse", w: R[i] * M, h: R[i] * M, stroke: i === 1 ? "A" : "L", sw: i === 1 ? 4 : 1.5, o: i === 1 ? 85 : 45, p: [0.5 * W, 0.4 * H],
            K: { te: [[0.1 + 0.14 * i, 0, "expo"], [1.1 + 0.14 * i, 100]], ts: [[D - 0.7 + 0.08 * i, 0, "quintIn"], [D - 0.15 + 0.08 * i, 100]], r: [[0, i % 2 ? 30 : -20, "linear"], [D, i % 2 ? -10 : 25]], s: [[0, [86, 86], "expo"], [1.2, [100, 100]]] } });
        E.push({ n: "Orbit Dot", k: "ellipse", w: 0.022 * M, h: 0.022 * M, fill: "A", fo: 100, a: [0, 0.36 * M], p: [0.5 * W, 0.4 * H], K: { r: [[0.4, 200, "outSoft"], [D, 520]], o: [[0.4, 0, "smooth"], [0.8, 100], [D - 0.4, 100, "smooth"], [D - 0.1, 0]] } });
        return { els: E, T: { style: "slideL", x: 0.5 * W, y: 0.1 * H, words: ["STAY", "FOCUSED"] } };
    }
    /* 6 - Viewfinder: corner brackets close in round the speaker, ticks and a centre cross */
    function viewfinder(W, H, c) {
        var D = c.dur, M = Math.min(W, H), L = 0.09 * M, x0 = 0.08 * W, x1 = 0.92 * W, y0 = 0.1 * H, y1 = 0.62 * H, E = [], i;
        var C4 = [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]];
        for (i = 0; i < 4; i++) {
            var q = C4[i], off = [-q[2] * 0.05 * W, -q[3] * 0.04 * H];
            E.push({ n: "Corner " + (i + 1), k: "path", pts: [[q[2] * L, 0], [0, 0], [0, q[3] * L]], stroke: "L", sw: 3, o: 90,
                K: { p: [[0.05, [q[0] + off[0], q[1] + off[1]], "expo"], [0.75, [q[0], q[1]]], [D - 0.55, [q[0], q[1]], "quintIn"], [D - 0.1, [q[0] + off[0], q[1] + off[1]]]],
                    o: [[0.05, 0, "smooth"], [0.3, 90], [D - 0.35, 90, "smooth"], [D - 0.1, 0]] } });
        }
        for (i = 0; i < 2; i++) E.push({ n: "Tick " + (i + 1), k: "path", pts: [[0, 0], [0.06 * W, 0]], stroke: "A", sw: 3, o: 100, p: [i ? x1 - 0.06 * W - 0.02 * W : x0 + 0.02 * W, i ? y1 - 0.025 * H : y0 + 0.025 * H],
            K: { te: [[0.6 + 0.1 * i, 0, "expo"], [1.0 + 0.1 * i, 100]], ts: [[D - 0.6, 0, "quintIn"], [D - 0.3, 100]] } });
        E.push({ n: "Cross", k: "path", pts: [[-0.02 * M, 0], [0.02 * M, 0]], stroke: "L", sw: 1.5, o: 60, p: [0.5 * W, 0.36 * H], K: { s: [[0.5, [0, 100], "expo"], [0.9, [100, 100]]], o: [[D - 0.4, 60, "smooth"], [D - 0.1, 0]] } });
        E.push({ n: "Cross V", k: "path", pts: [[0, -0.02 * M], [0, 0.02 * M]], stroke: "L", sw: 1.5, o: 60, p: [0.5 * W, 0.36 * H], K: { s: [[0.55, [100, 0], "expo"], [0.95, [100, 100]]], o: [[D - 0.4, 60, "smooth"], [D - 0.1, 0]] } });
        return { els: E, T: { style: "slideL", x: 0.3 * W, y: 0.16 * H, words: ["LIVE", "NOW"] } };
    }
    /* 7 - Glow Orbs: big soft colour lights drift and breathe behind (Screen) */
    function orbs(W, H, c) {
        var D = c.dur, M = Math.min(W, H), E = [], O = [[0.25, 0.22, 0.95, "A"], [0.78, 0.34, 0.8, "#7C5CFF"], [0.52, 0.5, 0.6, "L"]], i;
        for (i = 0; i < 3; i++) {
            var q = O[i], x = q[0] * W, y = q[1] * H;
            E.push({ n: "Orb " + (i + 1), k: "ellipse", w: q[2] * M, h: q[2] * M, fill: q[3], fo: 100, blend: "screen", blur: 0.14 * M,
                K: { p: [[0, [x, y], "smooth"], [D, [x + (i % 2 ? -0.08 : 0.08) * W, y + (i === 2 ? -0.04 : 0.03) * H]]], s: [[0, [60, 60], "outSoft"], [1.4, [100, 100], "smooth"], [D, [108, 108]]],
                    o: [[0, 0, "outSoft"], [1.2, i === 2 ? 14 : 30], [D - 0.6, i === 2 ? 14 : 30, "inSoft"], [D, 0]] } });
        }
        return { els: E, T: { style: "rise", x: 0.5 * W, y: 0.18 * H, words: ["DREAM", "BIGGER"] } };
    }
    /* 8 - Rising Bars: see-through columns rise from behind the shoulders, out from the middle, with bright caps */
    function bars(W, H, c) {
        var D = c.dur, E = [], n = 7, bw = W / n, base = 0.6 * H, i;
        for (i = 0; i < n; i++) {
            var h = (0.16 + 0.24 * Math.abs(Math.sin(i * 1.7 + 0.6))) * H, d = Math.abs(i - (n - 1) / 2), t0 = 0.1 + d * 0.08, x = (i + 0.5) * bw;
            E.push({ n: "Bar " + (i + 1), k: "rect", w: bw * 0.78, h: h, fill: "A", fo: 100, o: 22, a: [0, h / 2], p: [x, base],
                K: { s: [[t0, [100, 0], "expo"], [t0 + 0.6, [100, 100]], [D - 0.6 + d * 0.04, [100, 100], "quintIn"], [D - 0.25 + d * 0.04, [100, 0]]] } });
            E.push({ n: "Cap " + (i + 1), k: "path", pts: [[-bw * 0.39, 0], [bw * 0.39, 0]], stroke: "L", sw: 2, o: 70,
                K: { p: [[t0, [x, base], "expo"], [t0 + 0.6, [x, base - h]], [D - 0.6 + d * 0.04, [x, base - h], "quintIn"], [D - 0.25 + d * 0.04, [x, base]]], o: [[t0, 0, "smooth"], [t0 + 0.2, 70], [D - 0.35 + d * 0.04, 70, "smooth"], [D - 0.2 + d * 0.04, 0]] } });
        }
        return { els: E, T: { style: "rise", x: 0.5 * W, y: 0.12 * H, words: ["LEVEL", "UP"] } };
    }
    /* 9 - Diamond Frames: two squares on their points spin into place round the head and keep turning slowly */
    function diamonds(W, H, c) {
        var D = c.dur, M = Math.min(W, H), E = [], S = [[0.56, "L", 1.5, 70], [0.76, "A", 6, 70]], i;
        for (i = 0; i < 2; i++) {
            var s = S[i][0] * M, t0 = 0.1 + 0.14 * i;
            E.push({ n: "Diamond " + (i + 1), k: "rect", w: s, h: s, stroke: S[i][1], sw: S[i][2], o: S[i][3], p: [0.5 * W, 0.4 * H],
                K: { r: [[t0, i ? 135 : -45, "expo"], [t0 + 1.0, 45, "linear"], [D, i ? 53 : 37]], s: [[t0, [30, 30], "expo"], [t0 + 1.0, [100, 100]], [D - 0.6, [100, 100], "quintIn"], [D - 0.1, [125, 125]]],
                    o: [[t0, 0, "smooth"], [t0 + 0.3, S[i][3]], [D - 0.4, S[i][3], "smooth"], [D - 0.1, 0]] } });
        }
        return { els: E, T: { style: "stack3d", x: 0.5 * W, y: 0.08 * H, words: ["THINK", "DIFFERENT", "TODAY"] } };
    }
    /* 10 - Dot Matrix: a grid of dots fades in row by row in a wave and out again */
    function dots(W, H, c) {
        var D = c.dur, E = [], cols = 9, rows = 11, dx = W / cols, dy = 0.055 * H, r = Math.max(3, 0.006 * W), i;
        for (i = 0; i < rows; i++) {
            var t0 = 0.05 + i * 0.05, y = 0.05 * H + i * dy;
            E.push({ n: "Dot Row " + (i + 1), k: "ellipse", w: r * 2, h: r * 2, fill: i % 4 === 2 ? "A" : "L", fo: 100, p: [dx / 2, y], rep: { n: cols, dx: dx, dy: 0 },
                K: { o: [[t0, 0, "outSoft"], [t0 + 0.5, i % 4 === 2 ? 90 : 45], [D - 0.8 + i * 0.03, i % 4 === 2 ? 90 : 45, "inSoft"], [D - 0.3 + i * 0.03, 0]],
                    p: [[t0, [dx / 2, y + 0.012 * H], "expo"], [t0 + 0.6, [dx / 2, y]]] } });
        }
        return { els: E, T: { style: "fade", x: 0.5 * W, y: 0.24 * H, words: ["DATA", "DRIVEN"] } };
    }
    /* 11 - Diagonal Stripes: a band of see-through stripes sweeps in and locks behind, with a thin line */
    function stripes(W, H, c) {
        var D = c.dur, E = [], sw = 0.07 * W, x1 = 0.18 * W;
        E.push({ n: "Stripes", k: "rect", w: sw, h: 1.5 * H, fill: "A", fo: 100, o: 26, rep: { n: 6, dx: sw * 2, dy: 0 },
            K: { p: [[0.1, [-1.2 * W, 0.3 * H], "expo"], [0.9, [x1, 0.3 * H]], [D - 0.6, [x1, 0.3 * H], "quintIn"], [D - 0.1, [1.3 * W, 0.3 * H]]], r: [[0, 28]] } });
        E.push({ n: "Stripe Line", k: "path", pts: [[0, 0], [W, 0]], stroke: "L", sw: 1.5, o: 55, p: [0, 0.56 * H], K: { te: [[0.6, 0, "expo"], [1.3, 100]], ts: [[D - 0.6, 0, "quintIn"], [D - 0.15, 100]] } });
        return { els: E, T: { style: "slideL", x: 0.5 * W, y: 0.14 * H, words: ["MOVE", "FAST"] } };
    }
    /* 12 - Spotlight: a soft stage light opens up behind the speaker, a hot core and a floor line */
    function spotlight(W, H, c) {
        var D = c.dur, M = Math.min(W, H), E = [];
        E.push({ n: "Spot", k: "ellipse", w: 1.15 * M, h: 1.15 * M, fill: "L", fo: 100, blend: "screen", blur: 0.2 * M, p: [0.5 * W, 0.38 * H],
            K: { s: [[0, [25, 25], "outSoft"], [1.3, [100, 100], "smooth"], [D, [106, 106]]], o: [[0, 0, "outSoft"], [1.0, 16], [D - 0.6, 16, "inSoft"], [D, 0]] } });
        E.push({ n: "Core", k: "ellipse", w: 0.5 * M, h: 0.5 * M, fill: "A", fo: 100, blend: "screen", blur: 0.08 * M, p: [0.5 * W, 0.36 * H],
            K: { s: [[0.2, [20, 20], "expo"], [1.2, [100, 100]]], o: [[0.2, 0, "outSoft"], [1.0, 32], [D - 0.6, 32, "inSoft"], [D, 0]] } });
        E.push({ n: "Floor Line", k: "path", pts: [[-0.4 * W, 0], [0.4 * W, 0]], stroke: "L", sw: 1.5, o: 50, p: [0.5 * W, 0.62 * H], K: { s: [[0.5, [0, 100], "expo"], [1.3, [100, 100]], [D - 0.5, [100, 100], "quintIn"], [D - 0.1, [0, 100]]] } });
        return { els: E, T: { style: "rise", x: 0.5 * W, y: 0.13 * H, words: ["CENTER", "STAGE"] } };
    }
    /* 13 - Orbit Arcs: broken rings turn round the head at different speeds */
    function arcs(W, H, c) {
        var D = c.dur, M = Math.min(W, H), E = [], A = [[0.5, 35, "L", 1.5], [0.64, 28, "A", 4], [0.8, 42, "L", 1.5], [0.98, 22, "A", 2]], i;
        for (i = 0; i < 4; i++) E.push({ n: "Arc " + (i + 1), k: "ellipse", w: A[i][0] * M, h: A[i][0] * M, stroke: A[i][2], sw: A[i][3], o: A[i][2] === "A" ? 90 : 55, p: [0.5 * W, 0.4 * H],
            K: { te: [[0.1 + 0.1 * i, 0, "expo"], [1.0 + 0.1 * i, A[i][1]]], r: [[0, i * 70, "linear"], [D, i * 70 + (i % 2 ? -120 : 150)]], o: [[D - 0.45, A[i][2] === "A" ? 90 : 55, "smooth"], [D - 0.1, 0]] } });
        return { els: E, T: { style: "slideR", x: 0.5 * W, y: 0.12 * H, words: ["ALWAYS", "MOVING"] } };
    }
    /* 14 - Scan Lines: thin lines of different lengths slide in from both sides, one accent bar */
    function scan(W, H, c) {
        var D = c.dur, E = [], i;
        for (i = 0; i < 8; i++) {
            var y = (0.08 + 0.065 * i) * H, len = (0.3 + 0.45 * rnd(i, 7)) * W, left = i % 2 === 0, x1 = left ? 0.04 * W : W - 0.04 * W - len, x0 = left ? -len - 0.05 * W : W + 0.05 * W, t0 = 0.08 + i * 0.06;
            E.push({ n: "Scan " + (i + 1), k: "path", pts: [[0, 0], [len, 0]], stroke: "L", sw: 1.5, o: 45,
                K: { p: [[t0, [x0, y], "expo"], [t0 + 0.7, [x1, y]], [D - 0.7 + i * 0.03, [x1, y], "quintIn"], [D - 0.3 + i * 0.03, [left ? W + 0.05 * W : -len - 0.05 * W, y]]] } });
        }
        E.push({ n: "Accent Bar", k: "rect", w: 0.32 * W, h: 0.008 * H, fill: "A", fo: 100, a: [-0.16 * W, 0], p: [0.04 * W, 0.6 * H], K: { s: [[0.5, [0, 100], "expo"], [1.1, [100, 100]], [D - 0.5, [100, 100], "quintIn"], [D - 0.2, [0, 100]]] } });
        return { els: E, T: { style: "slideL", x: 0.32 * W, y: 0.22 * H, words: ["SCAN", "THIS"] } };
    }
    /* 15 - Shutter: an accent block wipes up, splits into slats that slide off to both sides, a thin frame stays */
    function shutter(W, H, c) {
        var D = c.dur, E = [], n = 5, y0 = 0.08 * H, y1 = 0.58 * H, sh = (y1 - y0) / n, i;
        for (i = 0; i < n; i++) {
            var cy = y0 + (i + 0.5) * sh, k = n - 1 - i, left = i % 2 === 0, t0 = 0.05 + k * 0.035, t1 = 0.75 + i * 0.06;
            E.push({ n: "Slat " + (i + 1), k: "rect", w: W, h: sh + 1, fill: "A", fo: 100, o: 92, a: [left ? -W / 2 : W / 2, sh / 2], p: [left ? 0 : W, cy + sh / 2],
                K: { s: [[t0, [100, 0], "expo"], [t0 + 0.25, [100, 100]], [t1, [100, 100], "quintIn"], [t1 + 0.45, [0, 100]]] } });
        }
        E.push({ n: "Frame", k: "path", pts: box(0.84 * W, y1 - y0 - 0.04 * H), closed: true, stroke: "L", sw: 1.5, o: 55, p: [0.5 * W, (y0 + y1) / 2], K: { te: [[1.0, 0, "inout"], [1.8, 100]], ts: [[D - 0.7, 0, "quintIn"], [D - 0.2, 100]] } });
        return { els: E, T: { style: "stack3d", x: 0.5 * W, y: 0.15 * H, words: ["OPEN", "THE", "DOOR"] } };
    }
    C.LOOKS = [
        { id: "bo01", name: "Red Panels", f: redPanels, accent: "#E3141B" },
        { id: "bo02", name: "Line Grid", f: lineGrid, accent: "#FFFFFF" },
        { id: "bo03", name: "Dark Panel", f: darkPanel, accent: "#E3141B" },
        { id: "bo04", name: "Light Beams", f: beams, accent: "#FFB347" },
        { id: "bo05", name: "Halo Rings", f: halo, accent: "#E3141B" },
        { id: "bo06", name: "Viewfinder", f: viewfinder, accent: "#E3141B" },
        { id: "bo07", name: "Glow Orbs", f: orbs, accent: "#FF3D6E" },
        { id: "bo08", name: "Rising Bars", f: bars, accent: "#E3141B" },
        { id: "bo09", name: "Diamond Frames", f: diamonds, accent: "#D4AF37" },
        { id: "bo10", name: "Dot Matrix", f: dots, accent: "#E3141B" },
        { id: "bo11", name: "Diagonal Stripes", f: stripes, accent: "#E3141B" },
        { id: "bo12", name: "Spotlight", f: spotlight, accent: "#FFB347" },
        { id: "bo13", name: "Orbit Arcs", f: arcs, accent: "#D4AF37" },
        { id: "bo14", name: "Scan Lines", f: scan, accent: "#E3141B" },
        { id: "bo15", name: "Shutter", f: shutter, accent: "#E3141B" }
    ];
    C.find = function (id) { for (var i = 0; i < C.LOOKS.length; i++) if (C.LOOKS[i].id === id) return C.LOOKS[i]; return C.LOOKS[0]; };
    C.build = function (id, W, H, c) { return C.find(id).f(W, H, c); };
    /* the sample text: words, styles and keys (comp px; AE: one text layer per word) */
    C.textKeys = function (T, W, H, c) {
        var D = c.dur, out = [], M = Math.min(W, H), i, n = T.words.length;
        for (i = 0; i < n; i++) {
            var s3 = T.style === "stack3d", t0 = 0.55 + i * 0.16, size = (s3 && i === 1) ? 0.13 * M : 0.11 * M, y = T.y + i * 0.11 * M * (s3 ? 1.32 : 1.05), x = T.x, w = { word: T.words[i], size: size, z: 0, shadow: false, bold: true };
            if (T.style === "slideR") w.K = { p: [[t0, [x + 0.18 * W, y], "expo"], [t0 + 0.6, [x, y]]], o: [[t0, 0, "smooth"], [t0 + 0.3, 100], [D - 0.5, 100, "smooth"], [D - 0.2, 0]] };
            else if (T.style === "slideL") w.K = { p: [[t0, [x - 0.18 * W, y], "expo"], [t0 + 0.6, [x, y]]], o: [[t0, 0, "smooth"], [t0 + 0.3, 100], [D - 0.5, 100, "smooth"], [D - 0.2, 0]] };
            else if (T.style === "rise") w.K = { p: [[t0, [x, y + 0.05 * H], "expo"], [t0 + 0.6, [x, y]]], o: [[t0, 0, "smooth"], [t0 + 0.35, 100], [D - 0.5, 100, "smooth"], [D - 0.2, 0]] };
            else if (T.style === "stack3d") {
                /* 3D words: the first in front with a drop shadow, the second further back, the third nearer. Each
                   is placed through AE's default camera (39.6 deg) so that on screen they sit on their own lines */
                var Zc = W / 2 / Math.tan(19.8 * Math.PI / 180), zs = [0, 220, -110], ys = T.y, j;
                for (j = 0; j < i; j++) { var sj = (j === 1 ? 0.13 : 0.11) * M * Zc / (Zc + zs[j]), sk = (j + 1 === 1 ? 0.13 : 0.11) * M * Zc / (Zc + zs[j + 1]); ys += (sj + sk) / 2 * 1.08; }
                w.z = zs[i]; w.shadow = i === 0;
                var kz = (Zc + w.z) / Zc, wx = W / 2 + (x - W / 2) * kz, wy = H / 2 + (ys - H / 2) * kz;
                w.K = { p: [[t0, [wx, wy + 0.06 * H], "expo"], [t0 + 0.7, [wx, wy]]], z: [[t0, w.z + (i === 1 ? 500 : -300), "expo"], [t0 + 0.8, w.z]], o: [[t0, 0, "smooth"], [t0 + 0.3, i === 1 ? 70 : 100], [D - 0.5, i === 1 ? 70 : 100, "smooth"], [D - 0.2, 0]] };
            } else w.K = { p: [[t0, [x, y]]], s: [[t0, [115, 115], "expo"], [t0 + 0.7, [100, 100]]], o: [[t0, 0, "smooth"], [t0 + 0.45, 100], [D - 0.5, 100, "smooth"], [D - 0.2, 0]] };
            out.push(w);
        }
        return out;
    };
    return C;
})();

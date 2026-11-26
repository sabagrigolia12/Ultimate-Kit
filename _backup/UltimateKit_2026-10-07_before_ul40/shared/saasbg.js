/*  Ultimate Kit - SaaS backgrounds (UK_CAT.saasBg). Read by the panel and by ExtendScript (ES3 only).
    Every entry copies one background look seen in the previews of the SaaS packs on Envato;
    colours were sampled from the preview frames. ref = [preview, second] used for comparison.
    colors[0] = background colour; elements use colour indexes (c / fc / cols).
    Units: at = [x, y] fraction of the frame (can be outside 0..1); s / sz / w / blur / path points are
    fractions of the larger frame side U. Lists (at, sc, op, rot, pk, drift) are keyframes spread over
    one float cycle of P seconds; i = intro start values (keyframed from 0 to T0 seconds).
    Types: g4 (4-Color Gradient), ramp, blob, ring, rect, frame, path, noise, dots, bubbles, grid, nodes,
    burst, rays, sweep, flute.                                                                        */
(function (C) {
    function F() { var o = [], i; for (i = 0; i < arguments.length; i++) o = o.concat(arguments[i]); return o; }
    function X(base, extra) { var o = {}, k; for (k in base) o[k] = base[k]; if (extra) for (k in extra) o[k] = extra[k]; return o; }
    var CORNERS = [[0, 0], [1, 0], [0, 1], [1, 1]];
    /* small looping orbit of positions around (x, y) */
    function orbit(x, y, r, n, ph, ry) {
        var o = [], k; n = n || 4; ph = ph || 0;
        for (k = 0; k < n; k++) o.push([x + r * Math.cos(Math.PI * 2 * k / n + ph), y + (ry === undefined ? r * 0.75 : ry) * Math.sin(Math.PI * 2 * k / n + ph)]);
        return o;
    }
    /* 4 slowly wobbling copies of a point set (4-Color Gradient drift) */
    function wob(pts, a) {
        var o = [], k, i;
        for (k = 0; k < 4; k++) {
            var s = [];
            for (i = 0; i < pts.length; i++) s.push([pts[i][0] + a * Math.cos(Math.PI / 2 * k + i * 1.7), pts[i][1] + a * 0.8 * Math.sin(Math.PI / 2 * k + i * 2.3)]);
            o.push(s);
        }
        return o;
    }
    function g4(cols, pts, a, blend, extra) { pts = pts || CORNERS; return X({ t: "g4", cols: cols, pts: pts, drift: a ? wob(pts, a) : null, blend: blend || 100 }, extra); }
    function ramp(c0, c1, from, to, radial, extra) { return X({ t: "ramp", cols: [c0, c1], from: from, to: to, radial: !!radial }, extra); }
    function L(at) { return (at[0] instanceof Array) ? at : [at]; }
    function glow(c, at, s, a, blur, op, m, extra) { return X({ t: "blob", c: c, at: L(at), s: s, a: a || 1, blur: blur, op: op === undefined ? 100 : op, m: m || "add" }, extra); }
    function neon(base, cs, ws, bs, ops, m) {
        var o = [], i;
        for (i = 0; i < cs.length; i++) o.push(X(base, { c: cs[i], w: ws[i], blur: bs[i], m: m || "add", op: ops ? ops[i] : 100 }));
        return o;
    }
    /* a huge circle whose top (or, for a bowl, bottom) edge sits at fraction `edge` of the frame height */
    function arcY(edge, s, bowl) { return bowl ? (edge * 1080 - s * 1920 / 2) / 1080 : (edge * 1080 + s * 1920 / 2) / 1080; }
    function rim(edge, s, cs, ws, bs, ops, bowl, drift, extra) {
        var y = arcY(edge, s, bowl), d = drift || 0.02;
        return neon(X({ t: "ring", at: [[0.5, y], [0.5, y - d], [0.5, y + d * 0.3], [0.5, y - d * 0.7]], s: s }, extra), cs, ws, bs, ops);
    }
    function wave(a, ph, n, w) { var p = [], i; for (i = 0; i <= n; i++) p.push([-w / 2 + w * i / n, a * Math.sin(i / n * Math.PI * 2 + ph)]); return p; }
    function band(top, a, ph) { var p = wave(a, ph, 6, 1.3), s = top ? -1 : 1; p.push([0.65, s * 0.6]); p.push([-0.65, s * 0.6]); return p; }
    /* ribbon around a spine: thickness th[i]; k scales thickness, dy shifts across (in thickness units) */
    function ribbon(spine, th, k, dy, vertical) {
        var a = [], b = [], i;
        for (i = 0; i < spine.length; i++) {
            var h = th[i] * k / 2, o = dy * th[i];
            if (vertical) { a.push([spine[i][0] + o - h, spine[i][1]]); b.unshift([spine[i][0] + o + h, spine[i][1]]); }
            else { a.push([spine[i][0], spine[i][1] + o - h]); b.unshift([spine[i][0], spine[i][1] + o + h]); }
        }
        return a.concat(b);
    }
    function ribbons(spines, ths, k, dy, vertical) { var o = [], i; for (i = 0; i < spines.length; i++) o.push(ribbon(spines[i], ths[i % ths.length], k, dy, vertical)); return o; }
    /* layered floor glow (deep wide -> main -> hot core), y = centre height of the glows */
    function floorGlow(cs, y, wide, extra) {
        y = y || 1.08; wide = wide || 1;
        return [glow(cs[0], [[0.5, y], [0.5, y - 0.02], [0.5, y + 0.01], [0.5, y - 0.015]], 1.9 * wide, 0.45, 0.13, 85, "add", extra),
            glow(cs[1], [[0.5, y + 0.02], [0.5, y - 0.01], [0.5, y + 0.03], [0.5, y]], 1.25 * wide, 0.4, 0.095, 95, "add", X({ sc: [100, 105, 98, 103] }, extra)),
            glow(cs[2], [[0.5, y + 0.03], [0.5, y + 0.01], [0.5, y + 0.04], [0.5, y + 0.02]], 0.6 * wide, 0.38, 0.07, 90, "add", X({ sc: [100, 108, 97, 105] }, extra))];
    }
    function dots(c, n, seed, op, area, size, extra) { return X({ t: "dots", c: c, n: n, seed: seed || 1, smin: size ? size[0] : 0.0008, smax: size ? size[1] : 0.0018, amp: 0.006, op: op || [20, 70], area: area || [0, 0, 1, 1] }, extra); }
    function grid(c, gap, w, op, extra) { return X({ t: "grid", c: c, gap: gap, w: w || 0.0007, op: op === undefined ? 100 : op }, extra); }

    var S = [];
    function add(id, name, src, ref, colors, els, o) { S.push(X({ id: id, name: name, src: src, ref: ref, colors: colors, els: els, P: 18, T0: 0 }, o)); }

    /* ======================= SaaS Text Animation (C98UWG5) */
    add("sb001", "Blue Edge", "C98UWG5", ["C98UWG5", 3.0], ["#020204", "#13296b", "#276eca", "#3a8cff", "#0a0822", "#15276b"], [
        glow(4, [[0.0, 0.0], [0.04, 0.03], [0.0, 0.05], [0.02, 0.0]], 0.7, 0.8, 0.13, 80),
        glow(5, orbit(-0.04, 0.98, 0.03, 4, 1), 0.85, 0.6, 0.13, 85),
        glow(1, orbit(1.04, 0.42, 0.03, 4, 0.5, 0.08), 0.95, 1.45, 0.12, 95),
        glow(2, [[1.03, 0.3], [1.03, 0.42], [1.03, 0.25], [1.03, 0.36]], 0.5, 1.7, 0.07, 85, "add", { sc: [100, 110, 96, 106] }),
        glow(3, [[1.02, 0.18], [1.02, 0.32], [1.02, 0.14], [1.02, 0.26]], 0.2, 2.4, 0.04, 55),
        dots(3, 30, 4, [10, 45])], { P: 16 });

    /* ======================= Text Presets SAAS Intro (977PMGF) */
    add("sb002", "Electric Violet", "977PMGF", ["977PMGF", 0.6], ["#6402fa", "#7420ff", "#5a00e6"], [
        glow(1, [[0.5, 0.45], [0.52, 0.5], [0.48, 0.48]], 1.0, 0.65, 0.16, 35, "normal"),
        glow(2, [[0.5, 1.15]], 1.8, 0.4, 0.14, 40, "normal")]);
    add("sb003", "Navy Haze", "977PMGF", ["977PMGF", 13.3], ["#02010d", "#020232", "#231141", "#140b3d", "#04010b"], [
        g4([3, 1, 4, 0], CORNERS, 0.05, 120),
        glow(2, orbit(0.32, 0.2, 0.05), 0.75, 0.75, 0.14, 80, "normal")]);
    add("sb004", "Slate", "977PMGF", ["977PMGF", 19.8], ["#02060f", "#0a1827", "#091525", "#01050d"], [
        ramp(1, 3, [[0.2, 0.45], [0.25, 0.5], [0.18, 0.55]], [[1.05, 0.95]], true),
        glow(2, orbit(0.2, 0.5, 0.04), 0.6, 1.1, 0.14, 60, "normal")]);
    add("sb005", "Violet Dark Dome", "977PMGF", ["977PMGF", 23.1], ["#7901f8", "#5101a8", "#080112", "#2c015a"], [
        ramp(0, 1, [[0.5, 0.0]], [[0.5, 1.0]], false),
        glow(2, [[0.5, 1.12], [0.5, 1.1], [0.5, 1.13]], 1.15, 0.55, 0.1, 100, "normal", { i: { at: [0.5, 1.6] } }),
        glow(3, [[0.5, 1.0]], 1.6, 0.45, 0.12, 60, "normal")], { T0: 2 });
    add("sb006", "Lilac Mist", "977PMGF", ["977PMGF", 22.0], ["#e0dfe6", "#a46cff", "#c9b8f0", "#eeedf3"], [
        ramp(3, 0, [[0.5, 0.0]], [[0.5, 0.75]], false),
        glow(2, [[0.5, 1.0], [0.48, 0.98], [0.52, 1.0]], 1.6, 0.55, 0.15, 75, "normal"),
        glow(1, [[0.5, 1.1], [0.47, 1.08], [0.53, 1.1]], 1.2, 0.5, 0.12, 95, "normal", { sc: [100, 106, 98, 104] })]);
    add("sb007", "Prompt Glow", "977PMGF", ["977PMGF", 26.3], ["#020204", "#4d02b8", "#45027d", "#350252", "#7a3dff"], F(
        floorGlow([3, 1, 4], 1.1),
        glow(2, orbit(0.36, 1.04, 0.04), 0.5, 0.6, 0.08, 70)), { T0: 1.5, P: 16 });
    S[S.length - 1].els[0].i = { op: 0 }; S[S.length - 1].els[1].i = { op: 0 };
    add("sb008", "Purple Floor", "977PMGF", ["977PMGF", 32.9], ["#1f0242", "#6e15d0", "#d9c2ff", "#43107f"], [
        glow(3, [[0.5, 1.0], [0.5, 0.98], [0.5, 1.0]], 1.9, 0.3, 0.09, 70),
        glow(1, [[0.5, 1.035], [0.5, 1.025], [0.5, 1.04]], 1.9, 0.11, 0.03, 100, "normal"),
        glow(2, [[0.5, 0.995], [0.5, 0.99], [0.5, 0.997]], 1.5, 0.006, 0.004, 75)]);
    add("sb009", "Aurora Floor", "977PMGF", ["977PMGF", 48.5], ["#020207", "#7008fb", "#3048c0", "#175880", "#4c18be", "#1d0154"], [
        glow(5, [[0.5, 1.0]], 1.9, 0.4, 0.13, 90),
        glow(1, [[0.5, 1.1], [0.5, 1.08], [0.5, 1.1]], 1.9, 0.28, 0.08, 95),
        glow(2, orbit(0.5, 0.86, 0.03), 0.6, 0.5, 0.1, 80),
        glow(3, orbit(0.42, 0.76, 0.03, 4, 1), 0.35, 0.8, 0.08, 70),
        glow(4, orbit(0.64, 0.8, 0.03, 4, 2), 0.4, 0.8, 0.1, 70)]);
    add("sb010", "Off White", "977PMGF", ["977PMGF", 29.6], ["#f6f6f5", "#ffffff", "#ececeb"], [
        glow(1, orbit(0.5, 0.45, 0.04), 1.0, 0.7, 0.15, 70, "normal"),
        glow(2, [[0.5, 1.1]], 1.8, 0.35, 0.15, 40, "normal")], { light: true });

    /* ======================= SaaS Text Animation Pack (AUS4BJ5) */
    add("sb011", "Night Indigo", "AUS4BJ5", ["AUS4BJ5", 10.7], ["#0c0e19", "#2f3365", "#263a53", "#05080b", "#080a12"], [
        g4([4, 1, 2, 3], CORNERS, 0.05, 110),
        glow(0, [[0.5, 0.5], [0.52, 0.48], [0.49, 0.51]], 1.4, 0.22, 0.12, 85, "normal", { r0: 28 })], { P: 20 });
    add("sb012", "Morning", "AUS4BJ5", ["AUS4BJ5", 18.6], ["#fafcfe", "#cccffe", "#d5e8ff", "#f7f9ff"], [
        g4([0, 1, 2, 3], CORNERS, 0.05, 120)], { light: true, P: 20 });

    /* ======================= SaaS Text Animation Presets (KFNQGA2) */
    add("sb013", "Ember Blobs", "KFNQGA2", ["KFNQGA2", 3.55], ["#000000", "#e94b0f", "#d65d0a", "#be390c", "#cd6908", "#952c09"], [
        glow(3, orbit(0.24, 0.0, 0.06, 4, 0), 0.85, 0.55, 0.1, 95),
        glow(1, orbit(0.32, 0.04, 0.05, 4, 1), 0.45, 0.55, 0.08, 95),
        glow(2, orbit(0.04, 0.06, 0.03, 4, 2), 0.4, 0.8, 0.08, 85),
        glow(5, orbit(0.72, 1.02, 0.06, 4, 3), 0.95, 0.5, 0.11, 95),
        glow(4, orbit(0.96, 1.0, 0.04, 4, 1), 0.45, 0.8, 0.09, 90)], { P: 16 });
    add("sb014", "Ember Floor", "KFNQGA2", ["KFNQGA2", 12.5], ["#000000", "#ee4214", "#f17d08", "#bb5006"], [
        glow(3, [[0.5, 1.0], [0.5, 0.98], [0.5, 1.01]], 1.9, 0.55, 0.12, 95),
        glow(1, [[0.5, 1.06], [0.5, 1.04], [0.5, 1.07]], 1.3, 0.45, 0.09, 100),
        glow(2, orbit(0.05, 1.02, 0.03), 0.55, 0.8, 0.1, 95),
        glow(2, orbit(0.97, 1.02, 0.03, 4, 2), 0.55, 0.8, 0.1, 95)], { P: 16 });

    /* ======================= SaaS Text Presets (WHGRUT8) */
    add("sb015", "Teal Blue Grid", "WHGRUT8", ["WHGRUT8", 9.8], ["#060a10", "#1d3d48", "#10243f", "#0b292a", "#1a2833"], [
        glow(1, orbit(0.06, 0.32, 0.05, 4, 0, 0.08), 0.9, 1.2, 0.15, 90),
        glow(3, orbit(0.02, 0.92, 0.04, 4, 1), 0.6, 0.9, 0.12, 80),
        glow(2, orbit(0.96, 0.22, 0.05, 4, 2, 0.08), 0.9, 1.2, 0.15, 90),
        glow(2, orbit(1.0, 0.95, 0.03, 4, 3), 0.5, 0.9, 0.12, 70),
        grid(4, 1 / 6, 0.0007, 55)], { P: 20 });

    /* ======================= SaaS Text Presets (9MA8AYM) */
    add("sb016", "Orchid Sweep", "9MA8AYM", ["9MA8AYM", 1.1], ["#141313", "#6a3a79", "#573f85", "#502a55", "#452652", "#1d1d1d"], [
        glow(5, [[0.5, 0.5]], 1.2, 0.6, 0.15, 60, "normal"),
        glow(1, [[0.76, 0.04], [0.66, 0.1], [0.8, 0.0], [0.7, 0.06]], 1.0, 0.24, 0.07, 95, "add", { r0: -10 }),
        glow(2, [[0.97, 0.0], [0.93, 0.04], [0.98, 0.02]], 0.45, 0.5, 0.06, 80),
        glow(3, [[0.22, 0.96], [0.32, 0.9], [0.16, 1.0], [0.28, 0.93]], 0.95, 0.24, 0.07, 90, "add", { r0: -8 }),
        glow(4, [[0.03, 1.0], [0.06, 0.97]], 0.5, 0.6, 0.08, 75)], { P: 16 });
    add("sb017", "Orchid Edge", "9MA8AYM", ["9MA8AYM", 7.6], ["#151314", "#692f5f", "#613162", "#3a2039"], [
        glow(1, orbit(1.05, 0.62, 0.02, 4, 0, 0.06), 0.7, 1.45, 0.12, 95),
        glow(2, orbit(1.0, 0.08, 0.02), 0.42, 1.0, 0.1, 75),
        glow(3, orbit(0.16, 1.02, 0.04), 0.6, 0.5, 0.12, 75)], { P: 16 });
    add("sb018", "Pink Haze", "9MA8AYM", ["9MA8AYM", 10.4], ["#dac0d5", "#bda6b9", "#f5c3ed", "#fff1fb", "#ef6fd6"], [
        ramp(1, 2, [[0.5, 0.0]], [[0.5, 1.0]], false),
        glow(3, orbit(0.5, 0.55, 0.03), 0.95, 0.6, 0.14, 85, "normal"),
        glow(4, [[0.5, 1.06], [0.48, 1.05], [0.52, 1.06]], 0.5, 0.4, 0.06, 90, "normal", { sc: [100, 110, 96, 106] })], { light: true });
    add("sb019", "Charcoal Plum", "9MA8AYM", ["9MA8AYM", 15.5], ["#141314", "#231721", "#1b161a"], [
        ramp(0, 1, [[0.5, 0.35]], [[0.5, 1.0]], false),
        glow(1, orbit(0.5, 1.05, 0.04), 1.2, 0.35, 0.12, 60, "normal")]);
    add("sb020", "Indigo Night", "9MA8AYM", ["9MA8AYM", 20.5], ["#050d1f", "#210839", "#422259", "#0a0a22", "#1c0534"], [
        g4([1, 0, 2, 3], CORNERS, 0.05, 110),
        glow(2, orbit(0.08, 0.6, 0.04), 0.6, 0.9, 0.12, 50)]);

    /* ======================= SaaS Text Presets (TVM9V6E) */
    add("sb021", "Petrol Navy", "TVM9V6E", ["TVM9V6E", 40.6], ["#000001", "#034554", "#000e30", "#00122e", "#000a0d"], [
        g4([1, 0, 4, 2], CORNERS, 0.05, 110),
        glow(0, orbit(0.3, 0.6, 0.05), 0.65, 0.9, 0.12, 75, "normal")], { P: 20 });
    add("sb022", "Ultramarine Floor", "TVM9V6E", ["TVM9V6E", 13.7], ["#000005", "#000068", "#000042", "#0c1c4c"], [
        glow(2, [[0.5, 1.02]], 1.9, 0.4, 0.13, 95),
        glow(1, [[0.5, 1.1], [0.5, 1.08], [0.5, 1.1]], 1.6, 0.3, 0.08, 100),
        glow(3, orbit(0.55, 0.84, 0.03), 0.6, 0.35, 0.1, 55)]);
    add("sb023", "Dusk", "TVM9V6E", ["TVM9V6E", 23.3], ["#020202", "#1d0b41", "#3b332b", "#100b11"], [
        g4([1, 0, 3, 2], CORNERS, 0.05, 110),
        glow(0, orbit(0.76, 0.24, 0.04), 0.5, 1.0, 0.12, 70, "normal")], { P: 20 });

    /* ======================= SaaS Gradient Backgrounds (CX8P246) */
    /* lens: two dark ellipses (frame wide) part vertically; between them the band glows blue -> mint -> white */
    var lensT = [[0.5, 0.0], [0.5, -0.03], [0.5, -0.01], [0.5, -0.04]], lensB = [[0.5, 1.0], [0.5, 1.03], [0.5, 1.01], [0.5, 1.04]];
    function lens(at, iat) {
        return [{ t: "ring", c: 2, at: at, s: 1.02, a: 0.43, w: 0.17, blur: 0.08, m: "normal", op: 100, i: { at: iat } },
            { t: "ring", c: 4, at: at, s: 1.02, a: 0.43, w: 0.04, blur: 0.025, m: "normal", op: 100, i: { at: iat } },
            { t: "blob", c: 5, at: at, s: 1.02, a: 0.43, blur: 0.006, m: "normal", i: { at: iat } }];
    }
    add("sb024", "Horizon Split", "CX8P246", ["CX8P246", 13.5], ["#d9faf5", "#001310", "#56cb9c", "#a6f2ce", "#0c5a85", "#0c352a", "#ffffff"], F(
        lens(lensT, [0.5, 0.118]), lens(lensB, [0.5, 0.882]),
        dots(6, 25, 9, [10, 45])), { T0: 2, P: 18 });
    add("sb025", "Prism Panels", "CX8P246", ["CX8P246", 22.5], ["#000000", "#2b9dfe", "#38ddff", "#2135c4", "#14ccd4", "#ff4be0", "#266af3"], [
        { t: "rect", c: 3, at: [[0.3, 0.68], [0.33, 0.64], [0.29, 0.66]], sz: [0.9, 0.3], round: 0.1, r0: -38, blur: 0.06, m: "add", op: 70, i: { at: [0.0, 0.1], op: 0 } },
        { t: "rect", c: 1, at: [[0.48, 0.5], [0.51, 0.46], [0.47, 0.52]], ph: 1, sz: [0.85, 0.27], round: 0.1, r0: -38, blur: 0.055, m: "add", op: 75, i: { at: [0.08, 0.06], op: 0 } },
        { t: "rect", c: 2, at: [[0.58, 0.44], [0.55, 0.48], [0.6, 0.42]], ph: 2, sz: [0.62, 0.2], round: 0.08, r0: -38, blur: 0.05, m: "add", op: 80, i: { at: [0.18, 0.08], op: 0 } },
        { t: "rect", c: 6, at: [[0.74, 0.28], [0.71, 0.31], [0.76, 0.26]], ph: 1, sz: [0.6, 0.2], round: 0.08, r0: -38, blur: 0.06, m: "add", op: 60, i: { at: [0.3, 0.06], op: 0 } },
        { t: "rect", c: 4, at: [[0.78, 0.74], [0.75, 0.7], [0.8, 0.76]], ph: 2, sz: [0.5, 0.17], round: 0.07, r0: -38, blur: 0.07, m: "add", op: 45, i: { at: [0.4, 0.3], op: 0 } },
        glow(5, [[0.3, 0.3]], 0.3, 0.8, 0.07, 0, "add", { i: { op: 90, at: [0.12, 0.08] } })], { T0: 2.5, P: 20 });
    var gw1 = [[-0.62, -0.15], [-0.45, -0.09], [-0.23, 0.045], [-0.05, -0.05], [0.06, -0.2], [0.25, -0.3], [0.62, -0.33]];
    var gw2 = [[-0.62, -0.13], [-0.45, -0.06], [-0.25, 0.06], [-0.07, -0.02], [0.05, -0.17], [0.25, -0.28], [0.62, -0.31]];
    var gb1 = [[0.0, 0.1], [0.15, 0.04], [0.3, 0.0], [0.45, 0.03], [0.62, 0.08]], gb2 = [[0.0, 0.08], [0.15, 0.06], [0.3, 0.02], [0.45, 0.0], [0.62, 0.05]];
    add("sb026", "Golden Wave", "CX8P246", ["CX8P246", 28.0], ["#000000", "#ffd935", "#e49f42", "#305cc3", "#d9a055", "#f9d032"], [
        { t: "path", c: 3, at: [[0.5, 0.5]], pk: [gb1, gb2], w: 0.22, blur: 0.1, m: "normal", op: 90, i: { op: 0 } },
        { t: "path", c: 2, at: [[0.5, 0.5]], pk: [gw1, gw2], w: 0.27, blur: 0.11, m: "normal", op: 85, i: { op: 0 } },
        { t: "path", c: 1, at: [[0.5, 0.5]], pk: [gw1, gw2], w: 0.14, blur: 0.06, m: "normal", op: 95, i: { op: 0 } },
        glow(4, orbit(0.92, 0.0, 0.03), 0.6, 0.6, 0.12, 60, "normal", { i: { op: 0 } })], { T0: 2.5, P: 18 });
    add("sb027", "Lavender Mist", "CX8P246", ["CX8P246", 37.5], ["#000000", "#5d6efb", "#7c8aff", "#b2baff", "#ffffff"], [
        { t: "noise", cols: [0, 1, 3], scale: 700, contrast: 110, bright: -10, cx: 2, evo: 1, blur: 0.02, turb: { amt: 60, size: 0.15 }, drift: [[0, 0], [0.04, -0.06], [0, -0.02], [-0.04, -0.05]], mask: { at: [0.75, 1.0], sz: [1.6, 1.1], f: 0.3, ell: true }, m: "screen", op: 95 },
        glow(2, orbit(0.8, 1.05, 0.04), 1.0, 0.6, 0.12, 60),
        dots(4, 25, 3, [10, 45], [0, 0, 1, 0.8])], { P: 18 });
    add("sb028", "Screen Rim", "CX8P246", ["CX8P246", 45.0], ["#040310", "#6d1789", "#28bcfe", "#6b62df", "#591388", "#58106b", "#9aa5ff"], [
        glow(1, orbit(0.45, 0.02, 0.05), 0.62, 0.6, 0.14, 80, "normal"),
        glow(2, orbit(0.86, 0.72, 0.04, 4, 2), 0.36, 1.0, 0.1, 90, "normal"),
        { t: "frame", c: 3, at: [[0.5, -0.004]], sz: [1.02, 1.0], round: 0.12, blur: 0.008, m: "normal" },
        glow(6, [[0.5, 1.02]], 1.6, 0.05, 0.02, 50, "add"),
        { t: "rect", c: 4, at: [[0.5, -0.004]], sz: [1.02, 1.0], round: 0.12, w: 0.01, blur: 0.006, m: "normal", op: 100 },
        { t: "rect", c: 5, at: [[0.5, 0.5]], sz: [1.2, 0.7], blur: 0, m: "normal", op: 0, i: { op: 100 } },
        dots(6, 30, 5, [10, 50], [0, 0, 1, 0.85])], { T0: 2, P: 18 });
    add("sb029", "Aurora Arc", "CX8P246", ["CX8P246", 53.5], ["#000000", "#006e70", "#3cc2c7", "#5790a7", "#083866", "#2ea5a7", "#eaffff", "#000a14"], F(
        glow(1, [[0.5, 0.32], [0.52, 0.3], [0.48, 0.33]], 0.42, 1.7, 0.1, 90, "normal", { i: { op: 100, sc: 115 } }),
        glow(1, orbit(0.22, 0.24, 0.02), 0.22, 2.2, 0.08, 55, "normal"),
        glow(1, orbit(0.78, 0.24, 0.02, 4, 2), 0.22, 2.2, 0.08, 55, "normal"),
        glow(2, [[0.5, 0.58], [0.5, 0.56], [0.5, 0.59]], 0.3, 1.0, 0.08, 70, "add"),
        glow(4, [[0.5, arcY(0.78, 2.4)]], 2.4, 1, 0.02, 100, "normal"),
        glow(7, [[0.5, 1.06]], 0.9, 0.35, 0.06, 90, "normal"),
        rim(0.78, 2.4, [5, 3, 6], [0.1, 0.035, 0.008], [0.08, 0.03, 0.005], [75, 95, 100]),
        glow(6, [[0.5, 1.0]], 1.8, 0.4, 0.1, 0, "add", { i: { op: 80 } })), { T0: 2, P: 20 });

    /* ======================= SaaS Gradient Backgrounds (RLNWZL3) */
    var va1 = [[-0.62, -0.05], [-0.42, -0.05], [-0.3, 0.02], [-0.15, 0.17], [0, 0.21], [0.15, 0.17], [0.3, 0.02], [0.42, -0.05], [0.62, -0.05], [0.62, 0.6], [-0.62, 0.6]];
    var va2 = [[-0.62, -0.07], [-0.42, -0.04], [-0.3, 0.04], [-0.15, 0.18], [0, 0.22], [0.15, 0.18], [0.3, 0.04], [0.42, -0.04], [0.62, -0.07], [0.62, 0.6], [-0.62, 0.6]];
    add("sb030", "Blue Valley", "RLNWZL3", ["RLNWZL3", 8.8], ["#000818", "#2c59cf", "#102c88", "#1940ba", "#2b58ce", "#bcd4ff", "#020e2a"], F(
        glow(3, [[0.5, 0.02], [0.5, 0.05]], 0.75, 0.55, 0.12, 80),
        neon({ t: "ring", at: [[0.5, 0.2], [0.5, 0.18], [0.5, 0.2]], s: 0.2, arc: 42, i: { at: [0.5, 0.42], op: 0 } }, [3, 5], [0.02, 0.005], [0.02, 0.003], [80, 100]),
        { t: "path", fc: 2, closed: true, at: [[0.5, 0.42]], pk: [va1, va2], w: 0, blur: 0.04, m: "normal", op: 65, i: { at: [0.5, 1.1] } },
        neon({ t: "path", closed: true, at: [[0.5, 0.42]], pk: [va1, va2], i: { at: [0.5, 1.1] } }, [1, 5], [0.016, 0.003], [0.018, 0.002], [55, 75]),
        { t: "path", fc: 6, closed: true, at: [[0.5, 0.5]], pk: [va2, va1], w: 0, blur: 0.02, m: "normal", op: 100, i: { at: [0.5, 1.2] } },
        neon({ t: "path", closed: true, at: [[0.5, 0.5]], pk: [va2, va1], i: { at: [0.5, 1.2] } }, [1, 4, 5], [0.04, 0.012, 0.003], [0.04, 0.012, 0.002], [70, 90, 95])), { T0: 2.5 });
    function bowl(a, d) { return [[-a, -0.4], [-a * 0.62, -0.06], [-a * 0.25, d * 0.85], [0, d], [a * 0.25, d * 0.85], [a * 0.62, -0.06], [a, -0.4]]; }
    var tun = [];
    var ta = [0.75, 0.5, 0.28, 0.12];
    for (var ti = 0; ti < ta.length; ti++) {
        var tpk = [bowl(ta[ti], 0.2 - ti * 0.025), bowl(ta[ti] * 1.06, 0.21 - ti * 0.025)];
        tun.push({ t: "path", fc: 3, closed: true, at: [[0.5, 0.56]], pk: tpk, w: 0, blur: 0.03, m: "normal", op: 70, ph: ti, i: { op: 0 } });
        tun = tun.concat(neon({ t: "path", at: [[0.5, 0.56]], pk: tpk, ph: ti, i: { op: ti ? 0 : 100 } }, [1, 2], [0.016, 0.0035], [0.018, 0.002], [65, 90]));
    }
    add("sb031", "Magenta Tunnel", "RLNWZL3", ["RLNWZL3", 15.5], ["#1e0a2b", "#d946ef", "#fbd0ff", "#3d0d4e", "#552b64"], F(glow(4, [[0.5, 1.0]], 1.4, 0.5, 0.12, 60, "normal"), tun), { T0: 2 });
    function sphere(x, xi) {
        var at = [[x, 0.5], [x + (x < 0.5 ? 0.02 : -0.02), 0.49], [x, 0.51]];
        return [{ t: "ring", c: 4, at: at, s: 0.62, w: 0.07, blur: 0.06, m: "add", op: 80, i: { at: [xi, 0.5] } },
            { t: "blob", c: 3, at: at, s: 0.62, blur: 0.01, m: "normal", i: { at: [xi, 0.5] } },
            { t: "ring", c: 1, at: at, s: 0.62, w: 0.012, blur: 0.012, m: "add", op: 75, i: { at: [xi, 0.5] } }];
    }
    add("sb032", "Ember Eclipse", "RLNWZL3", ["RLNWZL3", 19.0], ["#1a0b0d", "#c2410c", "#ffb37a", "#2a120e", "#6a2410"], F(
        glow(4, [[0.5, 0.5]], 1.0, 0.6, 0.15, 25, "add"), sphere(-0.06, -0.4), sphere(1.06, 1.4)), { T0: 2 });
    function orbC(y, yi) {
        var at = [[0.5, y], [0.5, y + (y < 0.5 ? -0.02 : 0.02)], [0.5, y]];
        return [{ t: "ring", c: 2, at: at, s: 1.0, w: 0.05, blur: 0.04, m: "add", op: 70, i: { at: [0.5, yi] } },
            { t: "blob", c: 3, at: at, s: 1.0, blur: 0.006, m: "normal", i: { at: [0.5, yi] } },
            { t: "ring", c: 1, at: at, s: 1.0, w: 0.006, blur: 0.005, m: "add", op: 80, i: { at: [0.5, yi] } }];
    }
    add("sb033", "Emerald Orbit", "RLNWZL3", ["RLNWZL3", 24.0], ["#041819", "#5ef5a0", "#349065", "#0b2e24", "#23674d", "#0f3a2c"], F(
        grid(5, 0.06, 0.0006, 70),
        glow(4, [[0.5, 0.5]], 0.6, 0.6, 0.12, 60, "normal"),
        orbC(-0.39, -0.7), orbC(1.39, 1.7),
        { t: "rect", c: 1, at: [[0.5, 0.5]], sz: [0.9, 0.004], r0: 11, blur: 0.006, m: "add", op: 25, sc: [100, 108, 100], i: { op: 0 } },
        { t: "rect", c: 1, at: [[0.5, 0.5]], sz: [0.9, 0.004], r0: -11, blur: 0.006, m: "add", op: 25, sc: [100, 108, 100], i: { op: 0 } },
        glow(1, [[0.5, 0.5]], 0.9, 0.006, 0.006, 45, "add", { sc: [100, 115, 100], i: { op: 0 } })), { T0: 2 });
    var tubeA = [[-0.27, -0.36], [-0.2, -0.24], [-0.14, -0.16], [-0.07, -0.14], [0.0, -0.2], [0.05, -0.36]];
    var tubeB = [[-0.05, 0.36], [0.02, 0.22], [0.08, 0.15], [0.16, 0.13], [0.35, 0.13], [0.62, 0.13]];
    add("sb034", "Neon Tube", "RLNWZL3", ["RLNWZL3", 27.0], ["#15081d", "#8e4587", "#ffd6f6", "#3b0d35", "#e070d6"], F(
        glow(3, [[0.3, 0.3]], 0.9, 1, 0.14, 45, "add"),
        neon({ t: "path", at: [[0.5, 0.5], [0.52, 0.51], [0.49, 0.49]], pts: tubeA, i: { at: [0.3, 0.2] } }, [1, 4, 2], [0.12, 0.07, 0.014], [0.05, 0.008, 0.006], [55, 100, 85]),
        neon({ t: "path", at: [[0.5, 0.5], [0.48, 0.49], [0.51, 0.51]], pts: tubeB, i: { at: [0.7, 0.8] } }, [1, 4, 2], [0.12, 0.07, 0.014], [0.05, 0.008, 0.006], [55, 100, 85])), { T0: 1.5 });
    add("sb035", "Kaleido Burst", "RLNWZL3", ["RLNWZL3", 31.6], ["#0c0415", "#7de486", "#297a77", "#133b4c"], [
        { t: "burst", cols: [1, 2, 3, 0], waves: 2, points: 9, inner: 0.6, R: 0.24, max: 380, zoom: 60, spin: 0.06 }], { P: 8 });

    /* ======================= SaaS Gradient Backgrounds - 9 numbered (MPC8KR8 / WQMTCCD) */
    var V = ["#050407", "#443588", "#c3b7ec", "#6f61a8", "#a193d7"];
    function lightRing(at, s, a, cs, ws, bs, ops, extra) { return neon(X({ t: "ring", at: at, s: s, a: a || 1 }, extra), cs, ws, bs, ops); }
    add("sb036", "Ring Corners", "MPC8KR8", ["MPC8KR8", 1.8], V, F(
        lightRing([[0.5, 0.5]], 1.05, 0.62, [1, 3], [0.14, 0.05], [0.1, 0.04], [85, 75], { r0: -25, rot: [0, 4, 0, -4] }),
        lightRing([[0.5, 0.5]], 1.05, 0.62, [4, 2], [0.03, 0.01], [0.025, 0.008], [80, 100], { arc: 26, arcRot: -55, r0: -25, rot: [0, 4, 0, -4] }),
        lightRing([[0.5, 0.5]], 1.05, 0.62, [4, 2], [0.03, 0.01], [0.025, 0.008], [80, 100], { arc: 26, arcRot: 125, r0: -25, rot: [0, 4, 0, -4] })), { P: 20 });
    add("sb037", "Top Arc", "MPC8KR8", ["MPC8KR8", 4.2], V, [
        glow(1, [[0.5, -0.06], [0.5, -0.04], [0.5, -0.07]], 1.0, 0.2, 0.08, 95, "normal"),
        glow(3, [[0.5, -0.02], [0.5, -0.01], [0.5, -0.03]], 0.7, 0.07, 0.035, 85, "add"),
        glow(2, [[0.5, 0.0]], 0.4, 0.02, 0.012, 60, "add")], { P: 18 });
    add("sb038", "Teal Ring", "MPC8KR8", ["MPC8KR8", 7.3], ["#050407", "#2c5054", "#466468", "#203133", "#8fb3b6"], F(
        lightRing(orbit(0.38, 0.34, 0.04), 0.64, 1, [1, 2], [0.13, 0.05], [0.09, 0.04], [85, 70], { rot: [0, 8, 0, -8] }),
        lightRing(orbit(0.38, 0.34, 0.04), 0.64, 1, [4], [0.025], [0.025], [55], { arc: 40, arcRot: -60, rot: [0, 8, 0, -8] })), { P: 20 });
    add("sb039", "Left Ring", "MPC8KR8", ["MPC8KR8", 9.4], V, lightRing([[0.67, 0.55], [0.7, 0.52], [0.66, 0.57]], 1.3, 1, [1, 4, 2], [0.15, 0.05, 0.012], [0.1, 0.04, 0.008], [95, 80, 95]), { P: 18 });
    add("sb040", "Diagonal Corners", "MPC8KR8", ["MPC8KR8", 12.6], V, [
        glow(1, orbit(0.04, 0.0, 0.03), 0.75, 0.5, 0.1, 90, "add", { r0: -25 }),
        glow(3, orbit(0.02, 0.0, 0.02), 0.4, 0.4, 0.06, 70, "add", { r0: -25 }),
        glow(1, orbit(0.96, 1.0, 0.03, 4, 2), 0.75, 0.5, 0.1, 90, "add", { r0: -25 }),
        glow(3, orbit(0.98, 1.0, 0.02, 4, 2), 0.4, 0.4, 0.06, 70, "add", { r0: -25 })]);
    add("sb041", "Violet Floor", "MPC8KR8", ["MPC8KR8", 15.3], V, [
        glow(1, [[0.5, 1.05], [0.5, 1.03], [0.5, 1.06]], 1.0, 0.28, 0.09, 95, "add", { sc: [100, 106, 98, 104] }),
        glow(3, [[0.5, 1.0]], 0.7, 0.1, 0.04, 75),
        glow(2, [[0.5, 0.995]], 0.4, 0.02, 0.01, 50)]);
    add("sb042", "Teal Left", "MPC8KR8", ["MPC8KR8", 18.6], ["#050407", "#2f4446", "#5e6c6f", "#203e42", "#9fb1b3"], lightRing([[0.72, 0.5], [0.75, 0.48], [0.71, 0.52]], 1.2, 1, [1, 2, 4], [0.16, 0.06, 0.012], [0.11, 0.05, 0.01], [90, 75, 45]), { P: 20 });
    add("sb043", "Side Glows", "MPC8KR8", ["MPC8KR8", 21.2], V, [
        glow(3, orbit(-0.01, 0.25, 0.02), 0.4, 1.8, 0.1, 95),
        glow(1, orbit(1.01, 0.85, 0.02, 4, 2), 0.5, 1.6, 0.1, 95),
        glow(2, orbit(1.0, 0.95, 0.01), 0.15, 2.0, 0.04, 60)]);
    add("sb044", "Cross Corners", "MPC8KR8", ["MPC8KR8", 24.5], V, [
        glow(1, orbit(0.96, 0.0, 0.03), 0.75, 0.5, 0.1, 90, "add", { r0: 25 }),
        glow(1, orbit(0.04, 1.0, 0.03, 4, 2), 0.75, 0.5, 0.1, 85, "add", { r0: 25 })]);

    /* ======================= Strong SaaS Product Promo (BL8VAPC) */
    add("sb045", "Graphite Dust", "BL8VAPC", ["BL8VAPC", 17.2], ["#0b0b0b", "#222222", "#090909", "#070707", "#ffffff"], [
        ramp(1, 3, [[0.22, 0.38], [0.25, 0.4], [0.2, 0.36]], [[1.0, 1.0]], true),
        dots(4, 140, 21, [15, 70], [0, 0, 1, 1], [0.0007, 0.0016])], { P: 20 });

    /* ======================= Abstract SaaS Promo (QEFYJ2Y) */
    var SKY = ["#5ba4f7", "#9bc8f9", "#73b2f8", "#2e86eb", "#0b6cdd", "#1d79e5", "#ffffff", "#2b8df4", "#81b9f7"];
    function sky() {
        return [ramp(2, 4, [[0.5, 0.05]], [[0.5, 1.0]], false),
            glow(1, [[0.0, 0.0]], 0.55, 0.8, 0.12, 80, "normal"), glow(1, [[1.0, 0.0]], 0.55, 0.8, 0.12, 80, "normal"),
            { t: "path", fc: 5, closed: true, at: [[0.5, 0.74]], pk: [band(false, 0.035, 2.2), band(false, 0.045, 2.8), band(false, 0.03, 1.8)], w: 0, blur: 0.04, m: "normal", op: 80 }];
    }
    add("sb046", "Sky Dune", "QEFYJ2Y", ["QEFYJ2Y", 0.3], SKY, sky(), { light: true, P: 20 });
    add("sb047", "Sky Bubbles", "QEFYJ2Y", ["QEFYJ2Y", 25.9], SKY, F(sky(),
        { t: "bubbles", c: 6, fc: 7, n: 8, seed: 3, smin: 0.05, smax: 0.15, amp: 0.025, fop: 55, sop: 35, shop: 30, sw: 0.0018, blur: 0.002, area: [0.06, 0.12, 0.94, 0.88] }), { light: true, P: 20 });
    add("sb048", "Sky Globe", "QEFYJ2Y", ["QEFYJ2Y", 4.1], SKY, F(sky(),
        glow(7, orbit(0.62, 0.45, 0.01), 0.42, 1, 0.004, 70, "normal"),
        glow(8, orbit(0.6, 0.38, 0.01), 0.25, 0.8, 0.05, 50, "normal"),
        { t: "ring", c: 6, at: orbit(0.62, 0.45, 0.01), s: 0.42, w: 0.003, blur: 0.004, m: "add", op: 45 },
        { t: "ring", c: 6, at: orbit(0.62, 0.45, 0.01), s: 0.7, a: 0.28, w: 0.0012, blur: 0, m: "normal", op: 60, r0: -12 }), { light: true, P: 20 });

    /* ======================= Saas & Tech Backgrounds - grids (KS6NGHC / LJFVQYR) */
    var TG = ["#1c1c1c", "#2c2c2c", "#ff9326", "#ff8a24", "#fff21f", "#fff55f", "#1fbfa8", "#92fffd", "#ff3b2f", "#242424"];
    function nodes(c, gap, size, op, extra) { return X({ t: "nodes", c: c, gap: gap, size: size, op: op === undefined ? 100 : op, pan: [1, 0] }, extra); }
    function focus(at, s) { return { at: at, s: s, a: 0.75, blur: 0.06 }; }
    add("sb049", "Orange Nodes", "KS6NGHC", ["KS6NGHC", 0.9], TG, [
        grid(1, 0.2, 0.0007, 100, { diag: 45, pan: [1, 0] }),
        nodes(2, 0.2, 0.004, 70),
        nodes(2, 0.2, 0.009, 100, { glow: 0.006, matte: focus([[0.3, 0.45], [0.6, 0.5], [0.45, 0.4], [0.72, 0.55]], 0.75) }),
        nodes(3, 0.2, 0.014, 100, { glow: 0.01, matte: focus([[0.3, 0.45], [0.6, 0.5], [0.45, 0.4], [0.72, 0.55]], 0.45) })], { P: 24 });
    add("sb050", "Yellow Dots", "KS6NGHC", ["KS6NGHC", 7.0], TG, [
        grid(1, 0.2, 0.0007, 100, { pan: [1, 0] }),
        grid(9, 0.05, 0.0005, 60, { pan: [1, 0] }),
        nodes(4, 0.2, 0.006, 80, { round: 0.2 }),
        nodes(4, 0.2, 0.013, 100, { round: 0.2, glow: 0.008, matte: focus([[0.42, 0.55], [0.6, 0.45], [0.5, 0.6], [0.35, 0.45]], 0.55) })], { P: 24 });
    add("sb051", "Teal Dots", "KS6NGHC", ["KS6NGHC", 9.5], TG, [
        grid(1, 0.09, 0.0006, 90, { pan: [1, 0] }),
        { t: "ring", c: 1, at: [[0.5, 0.5]], s: 0.62, w: 0.0008, m: "normal", op: 70, rot: 0.02 },
        { t: "rect", c: 1, at: [[0.5, 0.5]], sz: [0.44, 0.44], w: 0.0008, m: "normal", op: 70, r0: 45, rot: 0.02 },
        nodes(1, 0.09, 0.003, 60, { round: 0.5 }),
        nodes(6, 0.09, 0.004, 100, { round: 0.5, glow: 0.004, matte: focus([[0.85, 0.4], [0.7, 0.6], [0.9, 0.7], [0.75, 0.3]], 0.5) })], { P: 24 });
    add("sb052", "Yellow Cross", "KS6NGHC", ["KS6NGHC", 20.5], TG, [
        grid(1, 0.2, 0.0007, 100, { pan: [1, 0] }),
        nodes(4, 0.2, 0.011, 70, { cross: true }),
        nodes(4, 0.2, 0.017, 100, { cross: true, glow: 0.008, matte: focus([[0.3, 0.6], [0.5, 0.45], [0.4, 0.65], [0.25, 0.5]], 0.5) })], { P: 24 });
    add("sb053", "Red Curved", "KS6NGHC", ["KS6NGHC", 3.5], TG, [
        grid(1, 0.1, 0.0007, 100, { pan: [1, 0], bulge: 30 }),
        nodes(8, 0.1, 0.004, 100, { bulge: 30, glow: 0.005, matte: focus([[0.45, 0.4], [0.55, 0.5], [0.4, 0.55], [0.5, 0.35]], 0.38) })], { P: 24 });
    add("sb054", "Orange Mini", "KS6NGHC", ["KS6NGHC", 22.5], TG, [
        grid(1, 0.09, 0.0006, 80, { pan: [1, 0] }),
        nodes(1, 0.09, 0.003, 70, { round: 0.2 }),
        nodes(2, 0.09, 0.007, 100, { round: 0.2, glow: 0.005, matte: focus([[0.62, 0.55], [0.7, 0.5], [0.58, 0.45], [0.66, 0.62]], 0.4) })], { P: 24 });

    /* ======================= Saas Backgrounds - 10 Ultra Wave (S3UUUAQ) - soft silk, normal blending */
    var ss1 = [[0.04, -0.3], [0.05, -0.15], [0.0, -0.01], [-0.05, 0.12], [-0.08, 0.24]], ss2 = [[0.06, -0.3], [0.06, -0.15], [0.0, 0.0], [-0.06, 0.13], [-0.07, 0.24]];
    var sth = [[0.03, 0.1, 0.13, 0.1, 0.03]];
    add("sb055", "Silk S", "S3UUUAQ", ["S3UUUAQ", 0.6], ["#000000", "#651402", "#8f6305", "#ffd23f", "#c24a10"], [
        { t: "path", fc: 1, closed: true, at: [[0.5, 0.5]], pk: ribbons([ss1, ss2], sth, 1.8, 0, true), w: 0, blur: 0.06, m: "normal", op: 85 },
        { t: "path", fc: 4, closed: true, at: [[0.5, 0.5]], pk: ribbons([ss1, ss2], sth, 1.1, -0.05, true), w: 0, blur: 0.03, m: "normal", op: 90 },
        { t: "path", fc: 2, closed: true, at: [[0.5, 0.5]], pk: ribbons([ss1, ss2], sth, 0.55, 0.28, true), w: 0, blur: 0.022, m: "normal", op: 90 },
        { t: "path", fc: 3, closed: true, at: [[0.5, 0.5]], pk: ribbons([ss1, ss2], sth, 0.1, 0.52, true), w: 0, blur: 0.006, m: "add", op: 70 }], { P: 14 });
    add("sb056", "Blue Planet", "S3UUUAQ", ["S3UUUAQ", 29.8], ["#010c19", "#2a62c1", "#eaf3ff", "#011124", "#02142d", "#0b2244"], F(
        ramp(0, 4, [[0.5, 0.0]], [[0.5, 1.0]], false),
        glow(5, [[0.5, 0.42]], 1.4, 0.35, 0.1, 70, "add"),
        glow(3, [[0.5, arcY(0.4, 2.2)]], 2.2, 1, 0.006, 100, "normal"),
        rim(0.4, 2.2, [1, 1, 2], [0.05, 0.014, 0.004], [0.05, 0.012, 0.003], [60, 90, 100]),
        glow(2, [[0.5, 0.4]], 0.05, 0.4, 0.012, 85, "add", { sc: [100, 115, 95, 110] }),
        glow(2, [[0.5, 0.4]], 0.45, 0.006, 0.005, 45, "add")), { P: 16 });
    var fs1 = [[-0.36, -0.12], [-0.18, -0.05], [0.0, 0.06], [0.17, 0.05], [0.34, -0.07]], fs2 = [[-0.36, -0.09], [-0.18, -0.08], [0.0, 0.03], [0.17, 0.08], [0.34, -0.03]], fs3 = [[-0.36, -0.14], [-0.18, -0.02], [0.0, 0.08], [0.17, 0.02], [0.34, -0.09]];
    var fth = [[0.08, 0.2, 0.24, 0.2, 0.09], [0.09, 0.17, 0.22, 0.24, 0.08], [0.07, 0.22, 0.2, 0.17, 0.1]];
    function silk(sp, th, cs, k) {
        k = k || 1;
        return [{ t: "path", fc: cs[0], closed: true, at: [[0.5, 0.5]], pk: ribbons(sp, th, 1.3 * k, 0), w: 0, blur: 0.09, m: "normal", op: 75 },
            { t: "path", fc: cs[0], closed: true, at: [[0.5, 0.5]], pk: ribbons(sp, th, 0.95 * k, 0), w: 0, blur: 0.04, m: "normal", op: 95 },
            { t: "path", fc: cs[1], closed: true, at: [[0.5, 0.5]], pk: ribbons(sp, th, 0.6 * k, -0.12), w: 0, blur: 0.04, m: "normal", op: 90 },
            { t: "path", fc: cs[2], closed: true, at: [[0.5, 0.5]], pk: ribbons(sp, th, 0.22 * k, -0.28), w: 0, blur: 0.03, m: "normal", op: 80 },
            { t: "path", fc: cs[3], closed: true, at: [[0.5, 0.5]], pk: ribbons(sp, th, 0.1 * k, 0.08), w: 0, blur: 0.02, m: "normal", op: 55 },
            { t: "path", fc: cs[4], closed: true, at: [[0.5, 0.5]], pk: ribbons(sp, th, 0.16 * k, 0.3), w: 0, blur: 0.035, m: "normal", op: 50 }];
    }
    add("sb057", "Fire Silk", "S3UUUAQ", ["S3UUUAQ", 8.3], ["#150001", "#ab2104", "#f69426", "#ffd98a", "#e57d48", "#3a0602"], silk([fs1, fs2, fs3], fth, [1, 2, 3, 4, 5]), { P: 16 });
    var fins = [];
    for (var fk = 0; fk < 6; fk++) {
        var fx = 0.34 + fk * 0.052, fy = 0.66 - fk * 0.052;
        fins.push({ t: "rect", c: 1, at: [[fx, fy], [fx - 0.012, fy - 0.018], [fx + 0.008, fy + 0.012]], ph: fk % 3, sz: [0.055, 0.62], round: 0.02, r0: -38, blur: 0.02, m: "normal", op: 95 });
        fins.push({ t: "rect", c: 2, at: [[fx + 0.01, fy + 0.005], [fx - 0.002, fy - 0.013], [fx + 0.018, fy + 0.017]], ph: fk % 3, sz: [0.03, 0.56], round: 0.015, r0: -38, blur: 0.02, m: "normal", op: 90 });
        fins.push({ t: "rect", c: fk < 4 ? 3 : 4, at: [[fx + 0.018, fy + 0.01], [fx + 0.006, fy - 0.008], [fx + 0.026, fy + 0.022]], ph: fk % 3, sz: [0.012, 0.48], round: 0.006, r0: -38, blur: 0.012, m: "normal", op: 80 });
    }
    add("sb058", "Neon Pulse", "S3UUUAQ", ["S3UUUAQ", 12.5], ["#000000", "#6b1a04", "#e0601a", "#cbd06b", "#ffe9a0"], fins, { P: 14 });
    var os1 = [[-0.44, -0.02], [-0.22, -0.1], [0.0, 0.02], [0.22, 0.09], [0.44, -0.03]], os2 = [[-0.44, 0.01], [-0.22, -0.07], [0.0, -0.01], [0.22, 0.06], [0.44, -0.06]], os3 = [[-0.44, -0.04], [-0.22, -0.12], [0.0, 0.04], [0.22, 0.07], [0.44, 0.0]];
    var oth = [[0.08, 0.2, 0.22, 0.2, 0.09], [0.09, 0.18, 0.24, 0.19, 0.08], [0.07, 0.21, 0.2, 0.21, 0.1]];
    function part(sp, a, b) { var o = [], i; for (i = 0; i < sp.length; i++) o.push(sp[i].slice(a, b)); return o; }
    function partT(th, a, b) { var o = [], i; for (i = 0; i < th.length; i++) o.push(th[i].slice(a, b)); return o; }
    add("sb059", "Silk Ocean", "S3UUUAQ", ["S3UUUAQ", 17.0], ["#000000", "#2c4bb8", "#7dc264", "#0f8a74", "#e8ff6a", "#030a18"], F(
        silk(part([os1, os2, os3], 0, 3), partT(oth, 0, 3), [1, 1, 4, 1, 5]),
        silk(part([os1, os2, os3], 1, 4), partT(oth, 1, 4), [2, 2, 4, 2, 5]),
        silk(part([os1, os2, os3], 2, 5), partT(oth, 2, 5), [3, 3, 4, 3, 5])), { P: 16 });
    var cs1 = [[-0.27, 0.02], [-0.13, -0.06], [0.02, 0.02], [0.15, 0.06], [0.27, -0.03]], cs2 = [[-0.27, 0.04], [-0.13, -0.03], [0.02, 0.0], [0.15, 0.08], [0.27, -0.05]];
    var cth = [[0.05, 0.14, 0.17, 0.14, 0.05]];
    add("sb060", "Cosmic Drift", "S3UUUAQ", ["S3UUUAQ", 21.0], ["#000000", "#2a8a9a", "#c26f21", "#a8d0b8", "#9a2a10", "#050505"], F(
        silk(part([cs1, cs2], 0, 3), partT(cth, 0, 3), [1, 1, 3, 1, 5]),
        silk(part([cs1, cs2], 2, 5), partT(cth, 2, 5), [2, 2, 3, 4, 5])), { P: 16 });
    var af = [], afc = [1, 2, 3, 1, 2, 3, 1], afx = [0.03, 0.08, 0.13, 0.17, 0.84, 0.9, 0.96];
    for (var ak = 0; ak < afx.length; ak++)
        af.push({ t: "rect", c: afc[ak], at: [[afx[ak], 0.5], [afx[ak] + 0.012, 0.5], [afx[ak] - 0.01, 0.5]], ph: ak % 3, sz: [0.02, 1.25], r0: 4, blur: 0.022, m: "add", op: [18, 40, 25, 35] });
    add("sb061", "Aurora Flow", "S3UUUAQ", ["S3UUUAQ", 23.6], ["#000000", "#34f5a4", "#8b5cf6", "#3b82f6"], af, { P: 16 });
    var cw1 = [[-0.6, -0.2], [-0.3, -0.27], [0.0, -0.25], [0.3, -0.3], [0.6, -0.36]], cw2 = [[-0.6, 0.32], [-0.3, 0.24], [0.0, 0.22], [0.3, 0.26], [0.6, 0.2]];
    add("sb062", "Colorful Swoosh", "S3UUUAQ", ["S3UUUAQ", 26.8], ["#000000", "#ff7a1a", "#ffd23f", "#a1420b"], [
        { t: "path", c: 3, at: [[0.5, 0.5], [0.52, 0.49], [0.48, 0.51]], pts: cw1, w: 0.1, blur: 0.06, m: "normal", op: 85 },
        { t: "path", c: 1, at: [[0.5, 0.5], [0.52, 0.49], [0.48, 0.51]], pts: cw1, w: 0.035, blur: 0.022, m: "add", op: 85 },
        { t: "path", c: 2, at: [[0.5, 0.49], [0.52, 0.48], [0.48, 0.5]], pts: cw1, w: 0.008, blur: 0.006, m: "add", op: 65 },
        { t: "path", c: 3, at: [[0.5, 0.5], [0.48, 0.51], [0.52, 0.49]], pts: cw2, w: 0.09, blur: 0.06, m: "normal", op: 75 },
        { t: "path", c: 1, at: [[0.5, 0.5], [0.48, 0.51], [0.52, 0.49]], pts: cw2, w: 0.03, blur: 0.02, m: "add", op: 75 }], { P: 14 });
    add("sb063", "Creative Sunset", "S3UUUAQ", ["S3UUUAQ", 30.6], ["#010000", "#e39c40", "#d74965", "#eb23f1", "#150a09"], [
        ramp(4, 0, [[0.5, 0.0]], [[0.5, 0.7]], false)], { P: 16 });
    add("sb064", "Blue Scan Orb", "S3UUUAQ", ["S3UUUAQ", 32.6], ["#000007", "#0a56f7", "#56a3f8", "#0d82f8", "#062dbf"], [
        glow(4, [[0.5, 0.78]], 0.95, 1, 0.09, 65, "add"),
        glow(1, [[0.5, 0.8], [0.5, 0.78], [0.5, 0.81]], 0.72, 1, 0.03, 100, "normal", { slices: { h: 0.006, w: 0.012 } }),
        glow(2, [[0.5, 0.68], [0.5, 0.66], [0.5, 0.69]], 0.42, 0.8, 0.07, 75, "add", { slices: { h: 0.006, w: 0.012 } })], { P: 12 });

    /* ======================= SaaS Product Promo MOGRTs (4BDDT7H) */
    add("sb065", "Ultra Floor", "4BDDT7H", ["4BDDT7H", 0.6], ["#020205", "#5a2bda", "#4713da", "#72206d", "#3603b1", "#1d0f2e"], F(
        floorGlow([5, 1, 2], 1.1),
        glow(3, orbit(0.0, 1.0, 0.03), 0.5, 0.7, 0.1, 85),
        glow(4, orbit(1.0, 1.0, 0.03, 4, 2), 0.5, 0.7, 0.1, 80)));
    add("sb066", "Lava Floor", "4BDDT7H", ["4BDDT7H", 7.1], ["#080402", "#dc3c1a", "#973311", "#5a0e37", "#ff7a3a"], F(
        floorGlow([2, 1, 4], 1.12, 0.8),
        glow(3, orbit(0.0, 1.0, 0.03), 0.45, 0.7, 0.1, 85)));
    add("sb067", "Lilac Rise", "4BDDT7H", ["4BDDT7H", 14.0], ["#f5f2fe", "#4000ff", "#9f7eff", "#e3daff", "#6632ff"], [
        ramp(0, 3, [[0.5, 0.0]], [[0.5, 0.55]], false),
        { t: "path", fc: 2, closed: true, at: [[0.5, 0.72]], pk: [band(false, -0.05, 0), band(false, -0.04, 0.4), band(false, -0.055, -0.3)], w: 0, blur: 0.07, m: "normal", op: 90 },
        { t: "path", fc: 1, closed: true, at: [[0.5, 0.86]], pk: [band(false, -0.05, 0), band(false, -0.045, 0.5), band(false, -0.06, -0.4)], w: 0, blur: 0.05, m: "normal", op: 100 }], { light: true });
    add("sb068", "Deep Violet Floor", "4BDDT7H", ["4BDDT7H", 43.8], ["#020204", "#3f00fa", "#2d00af", "#14024b"], F(floorGlow([3, 2, 1], 1.1, 0.7, { at: null }),
        glow(1, orbit(0.62, 1.05, 0.03), 0.7, 0.4, 0.08, 90)));
    S[S.length - 1].els[0].at = [[0.58, 1.08], [0.6, 1.06], [0.57, 1.09]]; S[S.length - 1].els[1].at = [[0.6, 1.1], [0.62, 1.08], [0.59, 1.1]]; S[S.length - 1].els[2].at = [[0.62, 1.1], [0.64, 1.09], [0.61, 1.1]];
    var halo = [];
    for (var hk = 0; hk < 3; hk++) halo.push({ t: "ring", c: 1, at: [[0.5, 0.5]], s: 0.4 + hk * 0.28, w: 0.05, blur: 0.05, m: "normal", op: 55 - hk * 7, sc: [100, 107, 100, 104], ph: hk });
    add("sb069", "Halo Rings", "4BDDT7H", ["4BDDT7H", 37.5], ["#ffffff", "#ded2fd", "#e1b9c6", "#b489bd", "#f5f0ff", "#ff9a6a"], F(halo,
        glow(2, orbit(0.48, 0.5, 0.01), 0.22, 1, 0.05, 90, "normal"),
        glow(3, orbit(0.52, 0.52, 0.01, 4, 2), 0.16, 1, 0.04, 85, "normal")), { light: true, P: 14 });

    /* ======================= AI SaaS Promo (A7M8WX3) */
    var CB = ["#232db4", "#4386be", "#2b43b7", "#9a76ea", "#ffffff", "#6c8ff7", "#838ce9", "#5a3cac", "#507982", "#7fb0ed"];
    add("sb070", "Cobalt Glow", "A7M8WX3", ["A7M8WX3", 0.3], CB, [
        glow(1, [[0.5, 1.08], [0.5, 1.06], [0.5, 1.08]], 1.9, 0.35, 0.11, 90),
        glow(3, orbit(0.5, 0.45, 0.02), 0.25, 1, 0.06, 40),
        dots(4, 35, 7, [15, 70], [0, 0, 1, 0.9])]);
    add("sb071", "Cobalt Planet", "A7M8WX3", ["A7M8WX3", 8.4], CB, F(
        glow(7, orbit(0.25, 0.62, 0.03), 0.6, 0.5, 0.1, 50, "add", { i: { op: 0 } }),
        glow(8, orbit(0.62, 0.62, 0.03, 4, 2), 0.6, 0.4, 0.1, 50, "add", { i: { op: 0 } }),
        glow(5, [[0.5, arcY(0.62, 2.6)]], 2.6, 1, 0.006, 100, "normal", { i: { at: [0.5, arcY(1.1, 2.6)] } }),
        neon({ t: "ring", at: [[0.5, arcY(0.62, 2.6)]], s: 2.6, i: { at: [0.5, arcY(1.1, 2.6)] } }, [6, 4], [0.03, 0.004], [0.03, 0.003], [70, 90]),
        dots(4, 30, 3, [15, 60], [0, 0, 1, 0.6])), { T0: 2.5 });
    var cw = [[-0.62, 0.19], [-0.35, 0.03], [-0.1, -0.08], [0.15, 0.04], [0.4, 0.14], [0.62, 0.0]], cwb = [[-0.62, 0.13], [-0.35, 0.08], [-0.1, -0.03], [0.15, -0.05], [0.4, 0.09], [0.62, 0.07]];
    add("sb072", "Cobalt Tube", "A7M8WX3", ["A7M8WX3", 15.0], CB, [
        { t: "path", c: 3, at: [[0.5, 0.62]], pk: [cw, cwb], w: 0.18, blur: 0.08, m: "add", op: 35 },
        { t: "path", c: 9, at: [[0.5, 0.62]], pk: [cw, cwb], w: 0.1, blur: 0.008, m: "normal", op: 95 },
        { t: "path", c: 4, at: [[0.5, 0.62]], pk: [cw, cwb], w: 0.065, blur: 0.016, m: "add", op: 35 },
        dots(4, 25, 5, [15, 60])]);
    var orbs = [];
    var orR = [0.15, 0.27, 0.42];
    for (var ok2 = 0; ok2 < orR.length; ok2++) {
        orbs.push({ t: "ring", c: 4, at: [[0.36, 0.55]], s: orR[ok2] * 2, w: 0.0012, m: "normal", op: 30 });
        orbs.push({ t: "blob", c: 4, at: [[0.36, 0.55]], off: [orR[ok2], 0], r0: ok2 * 110, s: 0.012, blur: 0.002, m: "add", op: 95, rot: ok2 % 2 ? -0.2 : 0.25 });
    }
    add("sb073", "Cobalt Orbits", "A7M8WX3", ["A7M8WX3", 29.4], CB, F(orbs, glow(1, [[0.5, 1.1]], 1.6, 0.3, 0.1, 50), dots(4, 35, 11, [15, 80])), { P: 24 });

    /* ======================= AI SaaS Promo MOGRT (PTJJVQK) */
    function dotGrid(c, op) { return { t: "nodes", c: c, gap: 0.04, size: 0.0016, op: op || 35, round: 0.5 }; }
    add("sb074", "Amethyst Rise", "PTJJVQK", ["PTJJVQK", 1.3], ["#06020c", "#1e0d3d", "#5a4580", "#14092a"], [
        ramp(0, 1, [[0.5, 0.0]], [[0.5, 1.0]], false), dotGrid(2, 30), glow(3, orbit(0.6, 0.85, 0.05), 1.0, 0.5, 0.14, 50)], { P: 20 });
    add("sb075", "Amethyst Diagonal", "PTJJVQK", ["PTJJVQK", 19.9], ["#020107", "#24104b", "#5a4580", "#120826"], [
        ramp(0, 1, [[0.05, 0.05], [0.1, 0.08], [0.04, 0.1]], [[1.0, 1.0]], false), dotGrid(2, 28)], { P: 20 });
    add("sb076", "Amethyst Top", "PTJJVQK", ["PTJJVQK", 15.4], ["#130929", "#291355", "#5a4580"], [
        ramp(1, 0, [[0.5, 0.0]], [[0.5, 1.0]], false), dotGrid(2, 30)], { P: 20 });
    add("sb077", "Violet Beam", "PTJJVQK", ["PTJJVQK", 8.3], ["#000000", "#6d3ce0", "#3a1a8a", "#a07bff"], [
        glow(2, [[1.0, 0.55], [0.98, 0.54], [1.0, 0.56]], 1.6, 0.32, 0.12, 70),
        glow(1, [[1.0, 0.55], [0.98, 0.55], [1.0, 0.55]], 1.2, 0.17, 0.07, 95, "add", { sc: [100, 105, 98, 103] }),
        glow(3, [[1.0, 0.55]], 0.8, 0.05, 0.03, 70)], { P: 16 });

    /* ======================= SaaS Promo (3V2ZDCB) */
    function bands(top, bottom, soft1, soft2) {
        return [{ t: "path", fc: soft1, closed: true, at: [[0.5, 0.3]], pk: [band(true, 0.04, 0), band(true, 0.055, 1.6), band(true, 0.035, 3.1)], w: 0, blur: 0.09, m: "normal", op: 65 },
            { t: "path", fc: top, closed: true, at: [[0.5, 0.2]], pk: [band(true, 0.045, 0.6), band(true, 0.03, 2.2), band(true, 0.05, 3.8)], w: 0, blur: 0.06, m: "normal", op: 100 },
            { t: "path", fc: soft2, closed: true, at: [[0.5, 0.7]], pk: [band(false, 0.04, 2), band(false, 0.05, 3.4), band(false, 0.035, 5)], w: 0, blur: 0.09, m: "normal", op: 65 },
            { t: "path", fc: bottom, closed: true, at: [[0.5, 0.8]], pk: [band(false, 0.045, 2.6), band(false, 0.03, 4.2), band(false, 0.05, 5.6)], w: 0, blur: 0.06, m: "normal", op: 100 }];
    }
    add("sb078", "Cream Bands", "3V2ZDCB", ["3V2ZDCB", 0.5], ["#fcf8f7", "#5b75f3", "#7087f5", "#a5b2f3", "#c3cdf6"], bands(1, 3, 2, 4), { light: true, P: 16 });
    add("sb079", "Red Blue Night", "3V2ZDCB", ["3V2ZDCB", 6.0], ["#08000a", "#da000a", "#1c33f1", "#5f000c", "#0f157b"], bands(1, 2, 3, 4), { P: 16 });
    S[S.length - 1].els[1].at = [[0.35, 0.16]]; S[S.length - 1].els[0].at = [[0.35, 0.26]]; S[S.length - 1].els[3].at = [[0.65, 0.84]]; S[S.length - 1].els[2].at = [[0.65, 0.74]];
    add("sb080", "Midnight Blue", "3V2ZDCB", ["3V2ZDCB", 27.8], ["#01000d", "#4018bd", "#271ab7", "#050422"], [g4([3, 0, 1, 2], CORNERS, 0.06, 110)], { P: 20 });
    add("sb081", "Violet Crimson", "3V2ZDCB", ["3V2ZDCB", 31.2], ["#070319", "#290f70", "#650049", "#080b4a", "#2a0124"], [
        g4([1, 0, 3, 2], CORNERS, 0.06, 110), glow(2, orbit(1.0, 0.95, 0.03), 0.6, 0.8, 0.12, 80)], { P: 20 });

    /* ======================= SaaS Style Smooth Logo Reveal (7UP27XZ) */
    add("sb082", "Pastel Dawn", "7UP27XZ", ["7UP27XZ", 0.3], ["#faf1f1", "#f2dffe", "#fef1cf", "#706cfb"], [g4([0, 1, 2, 3], CORNERS, 0.06, 140)], { light: true, P: 20 });
    add("sb083", "Pastel Vivid", "7UP27XZ", ["7UP27XZ", 13.0], ["#fce4a6", "#5c5efa", "#d579fc", "#c6fbc7"], [g4([0, 1, 2, 3], CORNERS, 0.06, 140)], { light: true, P: 20 });

    /* ======================= AI SaaS Promo (YE5UC6A) */
    var rip = [];
    for (var rk = 0; rk < 4; rk++) rip.push({ t: "ring", c: 2, at: [[0.5, 0.5]], s: 0.35 + rk * 0.3, w: 0.01, blur: 0.012, m: "normal", op: 35, sc: [100, 110, 100, 105], ph: rk });
    add("sb084", "Navy Ripple", "YE5UC6A", ["YE5UC6A", 8.5], ["#041624", "#082137", "#0b2a44"], F(ramp(0, 1, [[0.5, 0.5]], [[1.0, 1.0]], true), rip), { P: 16 });
    add("sb085", "Navy Comet", "YE5UC6A", ["YE5UC6A", 1.6], ["#041624", "#082137", "#0b2a44", "#3dff6a", "#0d5e3d"], F(ramp(0, 1, [[0.5, 0.5]], [[1.0, 1.0]], true), rip,
        glow(4, [[1.1, -0.05], [0.86, 0.28], [0.66, 0.38], [1.1, -0.05]], 0.22, 1, 0.06, [0, 70, 0, 0]),
        glow(3, [[1.1, -0.05], [0.86, 0.28], [0.66, 0.38], [1.1, -0.05]], 0.03, 1.4, 0.004, [0, 100, 0, 0], "normal")), { P: 10 });

    /* ======================= Ai SaaS Flat Marketing (SNTG3US) */
    add("sb086", "Flat Cloud", "SNTG3US", ["SNTG3US", 0.6], ["#e0e1e8", "#e9eaf0"], [glow(1, orbit(0.5, 0.45, 0.04), 1.0, 0.6, 0.15, 60, "normal")], { light: true });
    add("sb087", "Paper Grid", "SNTG3US", ["SNTG3US", 9.2], ["#fdfdfd", "#8c8c8c", "#ffffff"], [grid(1, 1 / 14, 0.0008, 80, { pan: [1, 1] })], { light: true, P: 24 });
    add("sb088", "Graphite Petals", "SNTG3US", ["SNTG3US", 11.0], ["#464443", "#4f4d4c", "#4e4c4b"], [
        { t: "rays", c: 1, at: [[-0.12, 0.6]], n: 8, len: 0.42, wd: 0.11, r: 0.1, a0: -80, step: 22, blur: 0.006, m: "normal", op: 100, rot: [0, 6, 2, 8] }], { P: 20 });
    add("sb089", "Mint Leaves", "SNTG3US", ["SNTG3US", 11.8], ["#7cfdca", "#adf8dc", "#96f9d2"], [
        glow(1, [[0.08, 0.1]], 0.42, 0.42, 0.003, 100, "normal", { r0: 35, rot: [0, 6, -3, 4] }),
        glow(1, [[0.26, 0.0]], 0.36, 0.38, 0.003, 100, "normal", { r0: -20, rot: [0, -5, 3, -2] }),
        glow(2, [[0.12, 0.28]], 0.3, 0.35, 0.003, 100, "normal", { r0: 60, rot: [0, 4, -4, 2] })], { light: true, P: 16 });

    /* ======================= SaaS App Promo (VKV7JL9) */
    add("sb090", "Magenta Burst", "VKV7JL9", ["VKV7JL9", 0.3], ["#4c066b", "#ff00fe", "#d805fa", "#6304dd", "#ffd0ff"], [
        ramp(1, 3, [[0.5, 0.5]], [[1.15, 0.0]], true),
        { t: "noise", cols: [0, 3, 4], sw: 6, sh: 900, scale: 140, contrast: 150, bright: -40, cx: 2, evo: 1, polar: true, m: "screen", op: 30 },
        glow(1, [[0.5, 0.5]], 0.5, 0.8, 0.1, 60, "add", { sc: [100, 115, 95, 110] })], { P: 12 });
    add("sb091", "Plum Fluid", "VKV7JL9", ["VKV7JL9", 46.0], ["#1c0421", "#3c00e7", "#8c0fb3", "#200328"], [
        { t: "noise", cols: [0, 1, 2], scale: 760, contrast: 110, bright: -38, cx: 3, evo: 1, turb: { amt: 120, size: 0.2 }, blur: 0.02, drift: [[0, 0], [0.05, 0.03], [0.02, -0.04], [-0.04, 0.02]], m: "normal", op: 100 }], { P: 18 });
    add("sb092", "Plum Haze", "VKV7JL9", ["VKV7JL9", 55.0], ["#220313", "#540c7b", "#5b1663", "#1d0423"], [
        { t: "noise", cols: [0, 1, 2], scale: 700, contrast: 95, bright: -30, cx: 2, evo: 1, turb: { amt: 60, size: 0.16 }, blur: 0.02, drift: [[0, 0], [0.04, 0.02], [0.01, -0.03], [-0.03, 0.02]], m: "normal", op: 100 }], { P: 18 });

    /* ======================= SaaS Product Promo (9FLG3LJ) */
    add("sb093", "Lilac White", "9FLG3LJ", ["9FLG3LJ", 0.3], ["#eeebee", "#e5d0ec", "#f2f0f3"], [ramp(2, 1, [[0.3, 0.2]], [[1.0, 1.0]], false)], { light: true, P: 20 });
    add("sb094", "Indigo Stars", "9FLG3LJ", ["9FLG3LJ", 1.6], ["#03000e", "#180045", "#6a5aa8", "#ffffff"], [
        ramp(0, 1, [[0.5, 0.0]], [[0.5, 1.0]], false),
        X(dotGrid(2, 35), { gap: 0.025, size: 0.0014, matte: { at: [[0.68, 0.62], [0.72, 0.6], [0.66, 0.64]], s: 0.55, a: 0.55, blur: 0.08 } }),
        dots(3, 50, 13, [10, 60])], { P: 20 });
    add("sb095", "Lavender Sweep", "9FLG3LJ", ["9FLG3LJ", 4.1], ["#6532b5", "#d0c5d9", "#9760c7", "#ffffff"], [
        ramp(1, 0, [[0.0, 1.0], [0.05, 0.95], [0.0, 0.95]], [[1.0, 0.0]], false),
        { t: "sweep", c: 3, wd: 0.25, ang: 30, op: 18, from: 0.1, to: 0.55 }], { P: 14 });
    add("sb096", "Crimson Floor", "9FLG3LJ", ["9FLG3LJ", 11.6], ["#000000", "#a21e33", "#300147", "#8f1739"], F(
        glow(2, [[0.5, 1.05]], 1.9, 0.35, 0.12, 95),
        glow(1, [[0.5, 1.08], [0.5, 1.06], [0.5, 1.08]], 0.9, 0.3, 0.08, 100, "add", { sc: [100, 106, 98, 103] }),
        glow(3, [[0.5, 1.06]], 0.45, 0.3, 0.06, 70)), { P: 16 });

    /* ======================= Ai Saas Promo Builder (2V95ETU) */
    add("sb097", "Neon Candy", "2V95ETU", ["2V95ETU", 0.3], ["#f0d7d3", "#f5cb3c", "#f7a1e6", "#f529e7", "#fb30c7"], [
        g4([0, 1, 2, 3], CORNERS, 0.05, 120), glow(4, orbit(1.0, 0.45, 0.03), 0.5, 1.2, 0.1, 60, "normal")], { light: true, P: 16 });
    add("sb098", "Magenta Corner", "2V95ETU", ["2V95ETU", 3.8], ["#000000", "#470141", "#550b4f"], [
        glow(1, orbit(0.0, 0.0, 0.03), 0.6, 0.8, 0.12, 95), glow(2, orbit(0.2, 0.5, 0.03), 0.35, 0.9, 0.1, 70)]);
    add("sb099", "Fluted Peach", "2V95ETU", ["2V95ETU", 5.0], ["#f29d81", "#e74817", "#fbe3da", "#ef8161", "#e6461c"], [
        glow(3, orbit(0.7, 0.55, 0.04), 0.6, 0.8, 0.12, 80, "normal"),
        glow(1, orbit(0.42, 0.18, 0.04, 4, 1), 0.3, 1, 0.07, 95, "normal"),
        glow(4, orbit(0.05, 0.7, 0.03, 4, 2), 0.4, 1, 0.08, 95, "normal"),
        glow(2, orbit(0.2, 0.08, 0.03, 4, 3), 0.35, 1, 0.08, 100, "normal"),
        { t: "flute", w: 0.014, h: 0.012, op: 55 }], { light: true, P: 16 });
    add("sb100", "Oxide", "2V95ETU", ["2V95ETU", 12.0], ["#e43200", "#b02400", "#c82b00"], [
        ramp(0, 1, [[0.5, 0.4]], [[0.5, 1.0]], false), glow(2, orbit(0.5, 0.55, 0.04), 1.3, 0.12, 0.08, 40, "normal")]);
    add("sb101", "Ember Black", "2V95ETU", ["2V95ETU", 26.0], ["#000000", "#1f0808", "#140202"], [glow(1, [[0.5, 1.05]], 0.8, 0.3, 0.1, 100)]);

    /* ======================= SaaS Product Promo MOGRT (LJ7AAES) */
    add("sb102", "Olive Glow", "LJ7AAES", ["LJ7AAES", 1.4], ["#030300", "#526000", "#4c5900", "#6e7100"], [
        glow(1, orbit(0.1, 0.0, 0.04), 1.0, 0.55, 0.13, 95), glow(3, orbit(0.55, 0.25, 0.04), 0.4, 0.7, 0.1, 60)]);
    add("sb103", "Acid Diagonal", "LJ7AAES", ["LJ7AAES", 4.8], ["#000000", "#d3f501", "#90a701", "#b5d202"], [
        glow(1, orbit(1.0, 0.0, 0.04), 0.9, 0.8, 0.13, 100), glow(2, orbit(0.0, 1.0, 0.04, 4, 2), 0.7, 0.8, 0.13, 95)]);
    var pills = [];
    var pc = [1, 1, 2, 3, 4];
    for (var pk2 = 4; pk2 >= 0; pk2--) pills.push({ t: "rect", fc: pc[4 - pk2], c: 4, at: [[0.5, 0.5]], sz: [0.3 + pk2 * 0.12, 0.13 + pk2 * 0.07], round: 0.07 + pk2 * 0.035, w: 0.0022, sop: 45, blur: 0.008, m: "normal", op: 100, sc: [100, 103, 100, 102], ph: pk2 % 4 });
    add("sb104", "Lime Stadiums", "LJ7AAES", ["LJ7AAES", 7.1], ["#000000", "#485303", "#748605", "#9eb319", "#bcd321"], pills, { P: 14 });
    add("sb105", "Olive Corner", "LJ7AAES", ["LJ7AAES", 21.8], ["#000000", "#3d4a00", "#6e8500"], [glow(1, orbit(1.0, 1.0, 0.04), 0.8, 0.8, 0.13, 95)]);

    /* ======================= SaaS Promotion (N86KXHT) */
    add("sb106", "Indigo Deep", "N86KXHT", ["N86KXHT", 0.3], ["#10082e", "#20086a", "#130838"], [glow(1, orbit(0.75, 0.4, 0.04), 0.9, 0.8, 0.14, 95)]);
    add("sb107", "Red Blue Dusk", "N86KXHT", ["N86KXHT", 9.1], ["#04050d", "#590709", "#1a078b", "#1d060f"], [g4([1, 2, 3, 0], CORNERS, 0.05, 110)], { P: 20 });
    add("sb108", "Red Sun", "N86KXHT", ["N86KXHT", 11.3], ["#f92629", "#fe7977", "#cc1e7e", "#d81b20", "#ffa3a0"], [
        glow(3, [[0.5, 1.1]], 1.8, 0.4, 0.12, 60, "normal"),
        glow(2, orbit(1.0, 0.4, 0.03), 0.5, 1.4, 0.1, 95, "normal"),
        glow(1, orbit(0.5, 0.5, 0.01), 0.48, 1, 0.04, 100, "normal", { sc: [100, 104, 98, 102] }),
        glow(4, orbit(0.48, 0.45, 0.01), 0.25, 1, 0.06, 50, "normal")], { light: true, P: 16 });
    add("sb109", "Electric Blue", "N86KXHT", ["N86KXHT", 20.0], ["#0911d0", "#5e6fe9", "#4482db", "#0a3eaa", "#020641"], [
        g4([4, 3, 0, 4], CORNERS, 0.05, 110),
        glow(1, orbit(0.55, 0.5, 0.03), 0.45, 0.7, 0.09, 85), glow(2, orbit(0.65, 0.48, 0.03, 4, 2), 0.3, 0.8, 0.08, 70)]);
    add("sb110", "Ultramarine", "N86KXHT", ["N86KXHT", 46.4], ["#1314eb", "#1415b4", "#1416fd"], [ramp(2, 1, [[0.1, 0.5]], [[0.65, 0.5]], false)]);
    add("sb111", "Cobalt Bokeh", "N86KXHT", ["N86KXHT", 29.5], ["#1530f0", "#3d5cff", "#9fb2ff", "#0a1bb0", "#ffffff"], [
        glow(3, [[0.0, 1.0]], 1.0, 1, 0.15, 70, "normal"),
        glow(1, orbit(0.6, 0.4, 0.04), 1.2, 1, 0.16, 80, "normal"),
        { t: "bubbles", c: 4, fc: 2, n: 16, seed: 9, smin: 0.03, smax: 0.1, amp: 0.025, fop: 10, sop: 22, shine: false, blur: 0.004, area: [0.45, 0.0, 1.0, 0.6] }], { P: 20 });

    /* ======================= Explore Saas Promo (GLX9LUK) */
    add("sb112", "Frost", "GLX9LUK", ["GLX9LUK", 16.2], ["#efeef1", "#ccdef2", "#d9eaf9", "#e3e9f1", "#ffffff"], [
        g4([0, 1, 2, 3], CORNERS, 0.05, 130), glow(4, [[0.45, 0.6], [0.5, 0.55], [0.42, 0.62]], 1.0, 0.3, 0.12, 50, "normal", { r0: -25 })], { light: true, P: 20 });
    add("sb113", "Frost Prism", "GLX9LUK", ["GLX9LUK", 6.5], ["#efeef1", "#ccdef2", "#d9eaf9", "#e3e9f1", "#f8e070", "#f7a774", "#8fc4f0"], [
        g4([0, 1, 2, 3], CORNERS, 0.05, 130),
        glow(4, orbit(0.38, 0.62, 0.03), 0.22, 1, 0.07, 75, "normal"),
        glow(5, orbit(0.6, 0.38, 0.03, 4, 1), 0.2, 1, 0.07, 70, "normal"),
        glow(6, orbit(0.64, 0.66, 0.03, 4, 2), 0.24, 1, 0.07, 70, "normal"),
        glow(5, orbit(0.33, 0.36, 0.03, 4, 3), 0.18, 1, 0.07, 55, "normal")], { light: true, P: 18 });

    /* ======================= Saas Product Promo (98HLNCL) */
    add("sb114", "Copper Grid", "98HLNCL", ["98HLNCL", 0.2], ["#090909", "#682b10", "#401e0f", "#151515", "#ffb27a"], [
        grid(3, 0.15, 0.0008, 100, { pan: [0, 1] }),
        glow(1, orbit(1.0, 0.1, 0.03), 0.75, 1.2, 0.13, 95), glow(2, orbit(0.0, 1.0, 0.03, 4, 2), 0.6, 1, 0.13, 90),
        dots(4, 30, 5, [10, 50])], { P: 24 });
    add("sb115", "Copper Edges", "98HLNCL", ["98HLNCL", 39.4], ["#000000", "#4f1e07", "#65290e"], [
        glow(1, orbit(-0.04, 0.3, 0.02, 4, 0, 0.06), 0.5, 2.0, 0.13, 95), glow(2, orbit(1.04, 0.5, 0.02, 4, 2, 0.06), 0.55, 2.0, 0.13, 95)]);
    add("sb116", "Copper Hint", "98HLNCL", ["98HLNCL", 3.8], ["#030303", "#251006", "#170b05"], [
        glow(1, orbit(1.0, 0.0, 0.03), 0.7, 1, 0.13, 100), glow(2, orbit(0.0, 1.0, 0.03, 4, 2), 0.6, 1, 0.13, 100)]);
    add("sb117", "Charcoal", "98HLNCL", ["98HLNCL", 44.2], ["#131313", "#191919"], [glow(1, orbit(0.5, 0.45, 0.04), 1.0, 0.6, 0.15, 70, "normal")]);

    /* ======================= SaaS Product Promo (VNQ947M) */
    function wgrid(c) { return grid(c === undefined ? 5 : c, 0.071, 0.0006, 14, { pan: [0, 1], m: "add" }); }
    add("sb118", "Berry Mesh", "VNQ947M", ["VNQ947M", 14.5], ["#e64b91", "#eae0f5", "#a59af3", "#cb99d9", "#e73a84", "#ffffff"], [
        glow(4, orbit(0.25, 0.85, 0.05), 1.0, 0.7, 0.14, 100, "normal"),
        glow(3, orbit(0.95, 0.5, 0.04, 4, 1), 0.7, 1, 0.13, 90, "normal"),
        glow(2, orbit(0.62, 0.22, 0.04, 4, 2), 0.42, 1, 0.1, 95, "normal"),
        glow(1, orbit(0.42, 0.08, 0.04, 4, 3), 0.45, 0.8, 0.1, 100, "normal"),
        wgrid()], { light: true, P: 16 });
    add("sb119", "Pink Sweep", "VNQ947M", ["VNQ947M", 4.2], ["#ffffff", "#e5216e", "#f4a3c4", "#ffffff"], [
        ramp(0, 1, [[0.15, 0.0], [0.2, 0.05], [0.12, 0.02]], [[0.85, 1.0]], false), wgrid(3)], { light: true, P: 16 });
    add("sb120", "Berry Violet", "VNQ947M", ["VNQ947M", 18.1], ["#e52c7a", "#e95f95", "#a89bf1", "#be7ccd", "#ec709d", "#ffffff"], [
        g4([1, 3, 0, 4], CORNERS, 0.05, 110), glow(2, orbit(0.62, 0.45, 0.04), 0.5, 1, 0.12, 90, "normal"), wgrid()], { light: true, P: 16 });
    add("sb121", "White Grid", "VNQ947M", ["VNQ947M", 10.3], ["#ffffff", "#e7e7ec", "#ffffff", "#ffffff", "#ffffff", "#d9d9e0"], [grid(5, 0.071, 0.0006, 100, { pan: [0, 1] })], { light: true, P: 20 });

    /* ======================= SaaS Startup Product Promo (5AG6JPH) */
    add("sb122", "Violet Dome", "5AG6JPH", ["5AG6JPH", 0.3], ["#000000", "#824ccd", "#4f2f7d", "#1b102b"], [
        glow(3, [[0.5, 1.05]], 1.5, 0.5, 0.1, 90, "add", { i: { sc: 30, op: 0 } }),
        glow(2, [[0.5, 1.08], [0.5, 1.06], [0.5, 1.08]], 1.0, 0.45, 0.08, 100, "add", { i: { sc: 25, op: 0 }, sc: [100, 104, 98, 102] }),
        glow(1, [[0.5, 1.1], [0.5, 1.09], [0.5, 1.1]], 0.6, 0.4, 0.06, 95, "add", { i: { sc: 20, op: 0 }, sc: [100, 106, 97, 104] })], { T0: 2.5, P: 16 });
    add("sb123", "Violet Corner", "5AG6JPH", ["5AG6JPH", 34.6], ["#000000", "#331e51", "#27173d"], [glow(1, orbit(0.05, 1.02, 0.03), 0.65, 0.75, 0.12, 100)]);

    /* ======================= SaaS Storytelling Titles (QDZMPKH) */
    add("sb124", "Midnight Smoke", "QDZMPKH", ["QDZMPKH", 13.0], ["#090531", "#162b84", "#270444", "#04051a", "#1d2581"], [
        { t: "noise", cols: [3, 1, 2], scale: 640, contrast: 105, bright: -36, cx: 4, evo: 1, turb: { amt: 90, size: 0.14 }, blur: 0.02, drift: [[0, 0], [0.05, -0.02], [0.01, 0.04], [-0.04, -0.01]], mask: { at: [0.5, 0.5], sz: [1.4, 0.75], f: 0.25, ell: true }, m: "screen", op: 95 },
        glow(4, orbit(0.35, 0.3, 0.05), 0.5, 1, 0.12, 40)], { P: 18 });

    /* ======================= Ai SaaS Intro MOGRT (4K25UR7) */
    add("sb125", "Ultraviolet Mesh", "4K25UR7", ["4K25UR7", 20.3], ["#1e004e", "#590086", "#3400ad", "#4500a4", "#0c0021"], [
        glow(4, orbit(0.05, 0.05, 0.04), 0.7, 0.8, 0.13, 80, "normal"),
        glow(1, orbit(0.8, 0.12, 0.05), 0.6, 0.8, 0.12, 95),
        glow(2, orbit(1.0, 0.45, 0.04, 4, 1), 0.45, 1.5, 0.11, 90),
        glow(3, orbit(0.1, 0.95, 0.05, 4, 2), 0.7, 0.8, 0.12, 90)], { P: 20 });

    /* ======================= Clean SaaS Product Promo (EFMV44T) */
    add("sb126", "Ice Sky", "EFMV44T", ["EFMV44T", 0.3], ["#d8ecfe", "#c3d7e6", "#e2f2ff"], [ramp(0, 1, [[0.5, 0.5]], [[1.05, 1.05]], true)], { light: true });
    add("sb127", "Ice Glow", "EFMV44T", ["EFMV44T", 2.9], ["#d8ecfe", "#c3d7e6", "#a2c1e9", "#b0cbf7", "#9cb8e3"], [
        ramp(0, 1, [[0.5, 0.5]], [[1.05, 1.05]], true),
        glow(2, orbit(0.3, 0.5, 0.04), 0.4, 0.6, 0.1, 80, "normal"), glow(3, orbit(0.6, 0.45, 0.04, 4, 2), 0.45, 0.5, 0.1, 75, "normal"),
        glow(4, orbit(0.5, 0.7, 0.04, 4, 1), 0.6, 0.3, 0.1, 60, "normal")], { light: true });
    add("sb128", "Azure Dusk", "EFMV44T", ["EFMV44T", 30.5], ["#4768b5", "#4aa8d8", "#1a2b6d", "#12618a", "#64afd7"], [
        g4([0, 1, 2, 3], CORNERS, 0.05, 110), glow(4, orbit(0.72, 0.5, 0.04), 0.35, 0.9, 0.1, 70)], { P: 20 });
    add("sb129", "Navy Azure", "EFMV44T", ["EFMV44T", 27.0], ["#1a2b6d", "#3b5da5", "#5a86d0"], [
        ramp(1, 0, [[0.5, 0.0]], [[0.5, 1.0]], false), glow(2, orbit(0.85, 0.05, 0.04), 0.7, 0.8, 0.13, 60)], { P: 20 });

    /* ======================= Ai SaaS Promo (8TTDG9Q) */
    add("sb130", "Emerald Floor", "8TTDG9Q", ["8TTDG9Q", 1.8], ["#021a07", "#073114", "#095923", "#062f12"], [
        ramp(1, 0, [[0.5, 0.45]], [[1.1, 1.1]], true), glow(2, [[0.5, 1.02], [0.5, 1.0], [0.5, 1.02]], 1.0, 0.35, 0.1, 100)]);
    add("sb131", "Neon Bowl", "8TTDG9Q", ["8TTDG9Q", 27.5], ["#062b0e", "#4cf577", "#3adb54", "#1e8930", "#0a3d1a"], F(
        glow(4, [[0.5, 0.55]], 1.2, 0.8, 0.15, 70),
        neon({ t: "ring", at: [[0.5, arcY(0.97, 1.25, true)]], s: 1.25, a: 1, i: { rot: -25 } }, [3, 2, 1], [0.18, 0.06, 0.02], [0.1, 0.04, 0.012], [55, 85, 100])), { T0: 2 });
    for (var nb = 1; nb <= 3; nb++) S[S.length - 1].els[nb].rot = [0, 1.5, 0, -1.5];

    /* ======================= Fast SaaS Product Promo (6FJ4AF6) */
    add("sb132", "Grape Diagonal", "6FJ4AF6", ["6FJ4AF6", 2.1], ["#14001e", "#450074", "#440055", "#150021", "#3a0050"], [
        g4([0, 1, 2, 3], CORNERS, 0.05, 110), glow(4, orbit(0.5, 0.5, 0.04), 0.6, 0.6, 0.12, 50)], { P: 20 });
    add("sb133", "Grape Vivid", "6FJ4AF6", ["6FJ4AF6", 40.8], ["#4e0a6a", "#7d1098", "#5d1173", "#6f1499", "#3e0850", "#230035"], [
        glow(1, orbit(0.05, 0.45, 0.05), 0.7, 0.9, 0.12, 95, "normal"),
        glow(3, orbit(0.85, 0.35, 0.05, 4, 1), 0.6, 0.9, 0.12, 90, "normal"),
        glow(2, orbit(0.2, 0.05, 0.04, 4, 2), 0.5, 0.8, 0.12, 80, "normal"),
        glow(4, orbit(0.45, 0.4, 0.04, 4, 3), 0.4, 0.9, 0.12, 80, "normal"),
        glow(5, orbit(0.95, 1.0, 0.03), 0.5, 0.8, 0.12, 90, "normal")], { P: 18 });

    /* ---- gradient looks use the preview's own colour layout (UK_CAT.saasMesh, shared/saasbg_mesh.js):
       colours 0..4 = the fitted palette, extra colours after it are used by overlay elements          */
    var OV = {
        sb008: [["#d9c2ff"], [glow(5, [[0.5, 0.995], [0.5, 0.99], [0.5, 0.997]], 1.5, 0.006, 0.004, 70)]],
        sb015: [["#1a2833"], [grid(5, 1 / 6, 0.0007, 55)]],
        sb043: [["#c3b7ec"], [glow(5, orbit(-0.01, 0.25, 0.02), 0.12, 3.0, 0.03, 60, "add")]],
        sb045: [["#ffffff"], [dots(5, 140, 21, [15, 70], [0, 0, 1, 1], [0.0007, 0.0016])]],
        sb047: [["#ffffff", "#2b8df4"], [{ t: "bubbles", c: 5, fc: 6, n: 8, seed: 3, smin: 0.05, smax: 0.15, amp: 0.025, fop: 55, sop: 35, shop: 30, sw: 0.0018, blur: 0.002, area: [0.06, 0.12, 0.94, 0.88] }]],
        sb070: [["#ffffff"], [dots(5, 35, 7, [15, 70], [0, 0, 1, 0.9])]],
        sb073: [["#ffffff"], (function () {
            var o = [], r = [0.15, 0.27, 0.42], k;
            for (k = 0; k < r.length; k++) {
                o.push({ t: "ring", c: 5, at: [[0.36, 0.55]], s: r[k] * 2, w: 0.0012, m: "normal", op: 30 });
                o.push({ t: "blob", c: 5, at: [[0.36, 0.55]], off: [r[k], 0], r0: k * 110, s: 0.012, blur: 0.002, m: "add", op: 95, rot: k % 2 ? -0.2 : 0.25 });
            }
            o.push(dots(5, 35, 11, [15, 80])); return o;
        })()],
        sb074: [["#5a4580"], [{ t: "nodes", c: 5, gap: 0.04, size: 0.0016, op: 30, round: 0.5 }]],
        sb075: [["#5a4580"], [{ t: "nodes", c: 5, gap: 0.04, size: 0.0016, op: 28, round: 0.5 }]],
        sb076: [["#5a4580"], [{ t: "nodes", c: 5, gap: 0.04, size: 0.0016, op: 30, round: 0.5 }]],
        sb084: [["#0b2a44"], (function () { var o = [], k; for (k = 0; k < 4; k++) o.push({ t: "ring", c: 5, at: [[0.5, 0.5]], s: 0.35 + k * 0.3, w: 0.01, blur: 0.012, m: "normal", op: 35, sc: [100, 110, 100, 105], ph: k }); return o; })()],
        sb085: [["#0b2a44", "#3dff6a", "#0d5e3d"], (function () {
            var o = [], k; for (k = 0; k < 4; k++) o.push({ t: "ring", c: 5, at: [[0.5, 0.5]], s: 0.35 + k * 0.3, w: 0.01, blur: 0.012, m: "normal", op: 35, sc: [100, 110, 100, 105], ph: k });
            o.push(glow(7, [[1.1, -0.05], [0.86, 0.28], [0.66, 0.38], [1.1, -0.05]], 0.22, 1, 0.06, [0, 70, 0, 0], "add"));
            o.push(glow(6, [[1.1, -0.05], [0.86, 0.28], [0.66, 0.38], [1.1, -0.05]], 0.03, 1.4, 0.004, [0, 100, 0, 0], "normal"));
            return o;
        })(), { P: 10 }],
        sb094: [["#6a5aa8", "#ffffff"], [{ t: "nodes", c: 5, gap: 0.025, size: 0.0014, op: 35, round: 0.5, matte: { at: [[0.68, 0.62], [0.72, 0.6], [0.66, 0.64]], s: 0.55, a: 0.55, blur: 0.08 } }, dots(6, 50, 13, [10, 60])]],
        sb095: [["#ffffff"], [{ t: "sweep", c: 5, wd: 0.25, ang: 30, op: 18, from: 0.1, to: 0.55 }]],
        sb099: [[], [{ t: "flute", w: 0.014, h: 0.012, op: 55 }]],
        sb111: [["#ffffff", "#9fb2ff"], [{ t: "bubbles", c: 5, fc: 6, n: 16, seed: 9, smin: 0.03, smax: 0.1, amp: 0.025, fop: 10, sop: 22, shine: false, blur: 0.004, area: [0.45, 0.0, 1.0, 0.6] }]],
        sb113: [["#f8e070", "#f7a774", "#8fc4f0"], [glow(5, orbit(0.38, 0.62, 0.03), 0.22, 1, 0.1, 42, "normal"), glow(6, orbit(0.6, 0.38, 0.03, 4, 1), 0.2, 1, 0.1, 38, "normal"),
            glow(7, orbit(0.64, 0.66, 0.03, 4, 2), 0.24, 1, 0.1, 38, "normal"), glow(6, orbit(0.33, 0.36, 0.03, 4, 3), 0.18, 1, 0.1, 30, "normal")]],
        sb114: [["#151515", "#ffb27a"], [grid(5, 0.15, 0.0008, 100, { pan: [0, 1] }), dots(6, 30, 5, [10, 50])]],
        sb118: [["#ffffff"], [grid(5, 0.071, 0.0006, 14, { pan: [0, 1], m: "add" })]],
        sb119: [["#ffffff"], [grid(5, 0.071, 0.0006, 14, { pan: [0, 1], m: "add" })]],
        sb120: [["#ffffff"], [grid(5, 0.071, 0.0006, 14, { pan: [0, 1], m: "add" })]]
    };
    var INTRO = { sb005: { op: 0 }, sb007: { op: 0 }, sb122: { op: 0, sc: 85 } };
    /* per-mesh extras: turb = slow liquid flow (Turbulent Displace) for the flowing silk / wave looks,
       rot = slow spin, slices = horizontal scan slices, blur / sc override the defaults             */
    var MOPT = { sb064: { slices: { h: 0.006, w: 0.012 } }, sb126: { blur: 0.1 }, sb035: { rot: [0, 6, 12, 6], sc: [104, 108, 104, 108] } };
    function remapCols(els, sh) {
        if (!sh) return els;
        var o = [], i, k;
        for (i = 0; i < els.length; i++) {
            var e = X(els[i]);
            if (typeof e.c === "number" && e.c >= 5) e.c += sh;
            if (typeof e.fc === "number" && e.fc >= 5) e.fc += sh;
            if (e.cols) { e.cols = e.cols.slice(); for (k = 0; k < e.cols.length; k++) if (e.cols[k] >= 5) e.cols[k] += sh; }
            o.push(e);
        }
        return o;
    }
    function hx(c) { var s = "#", k; for (k = 0; k < 3; k++) s += ("0" + Math.max(0, Math.min(255, Math.round(c[k]))).toString(16)).slice(-2); return s; }
    /* a fitted blob set -> blurred ellipse layers, background colour first in the palette. Every blob
       floats on its own (orbit, breathing scale, a little turn for long ones, own phase), so the
       colours flow against each other while the layers stay where they are.                        */
    function blobEls(bd, intro) {
        var order = [bd.bg], k, i, map = {}, pal = [], els = [];
        for (k = 0; k < bd.pal.length; k++) if (k !== bd.bg) order.push(k);
        for (k = 0; k < order.length; k++) { map[order[k]] = k; pal.push(hx(bd.pal[order[k]])); }
        for (i = 0; i < bd.blobs.length; i++) {
            var b = bd.blobs[i], rx = Math.exp(b[3]) / bd.W, ry = Math.exp(b[4]) / bd.W, sg = Math.exp(b[6]) / bd.W;
            /* crisp looks (fine fit, many small blobs) move less, so lines and rims stay together */
            var fine = bd.W >= 96 ? 0.3 : 1;
            var x = b[1] / bd.W, y = b[2] / bd.H, amp = fine * Math.max(0.015, Math.min(0.045, 0.25 * Math.max(rx, ry))), ph = i * 1.9;
            /* the orbit passes through the fitted spot (first key), so every loop starts on the exact look */
            x -= amp * Math.cos(ph); y -= amp * 1.4 * Math.sin(ph);
            var d = fine * (4 + (i % 3) * 0.6);
            var el = { t: "blob", c: map[b[0]], s: 2 * rx, a: ry / rx, r0: b[5] * 180 / Math.PI, blur: sg / 0.28, op: Math.round(100 / (1 + Math.exp(-b[7]))), m: "normal",
                at: orbit(x, y, amp, 4, ph, amp * 1.4), sc: i % 2 ? [100, 100 + d, 100, 100 - d] : [100, 100 - d, 100, 100 + d], i: intro };
            if (ry / rx < 0.75 || ry / rx > 1.33) el.rot = i % 2 ? [0, 7 * fine, 0, -7 * fine] : [0, -7 * fine, 0, 7 * fine];
            els.push(el);
        }
        return { pal: pal, els: els };
    }
    var MS = C.saasMesh || {}, BL = C.saasBlobs || {};
    for (var si = 0; si < S.length; si++) {
        var sp = S[si], md = MS[sp.id], bd = BL[sp.id];
        if (!md && !bd) continue;
        var ov = OV[sp.id] || [[], []], npal = bd ? bd.pal.length : md.pal.length;
        /* overlay colour indexes are written as 5, 6.. (after a 5-colour palette): shift them past this palette */
        ov = [ov[0], remapCols(ov[1], npal - 5), ov[2]];
        if (bd) {
            var be = blobEls(bd, INTRO[sp.id]);
            sp.colors = be.pal.concat(ov[0]);
            sp.els = be.els.concat(ov[1]);
            md = { pal: be.pal };
        } else {
            sp.colors = md.pal.concat(ov[0]);
            /* crisp looks (thin rims, neon lines) stay the fine mesh; it does not move as a layer - the
               picture flows in place (Turbulent Displace, large and gentle, evolution looped)          */
            var hi = (md.c || 16) > 16;
            /* (plain ifs: ExtendScript mis-evaluates chained ?: here) */
            var mb = 0.11;
            if (hi) mb = 0.045;
            if (md.c >= 96) mb = 0.02;
            var me = { t: "mesh", key: sp.id, i: INTRO[sp.id], blur: md.blur || mb, at: [[0.5, 0.5]], sc: [102], turb: { amt: 14, size: 0.3 } };
            if (MOPT[sp.id]) for (var mk in MOPT[sp.id]) me[mk] = MOPT[sp.id][mk];
            sp.els = [me].concat(ov[1]);
        }
        sp.mesh = true;
        if (INTRO[sp.id]) sp.T0 = 2;
        if (ov[2]) for (var ok3 in ov[2]) sp[ok3] = ov[2][ok3];
        var lum = 0, ch2 = md.pal[Math.min(2, md.pal.length - 1)]; lum = parseInt(ch2.substr(1, 2), 16) + parseInt(ch2.substr(3, 2), 16) + parseInt(ch2.substr(5, 2), 16);
        sp.light = lum > 380;
    }
    /* float loop length: the specs were timed at 18 / 24 s, which reads as almost still; 0.45x */
    for (si = 0; si < S.length; si++) S[si].P = Math.max(4, Math.round((S[si].P || 18) * 0.45));
    /* default order, most used SaaS looks first: soft gradients (blobs) before crisp meshes before
       grids / UI-like looks; within that, violet / blue hues and dark premium backgrounds rank up,
       light clean ones next, warm and acid colours later.                                       */
    function hsl(hexc) {
        var r = parseInt(hexc.substr(1, 2), 16) / 255, g = parseInt(hexc.substr(3, 2), 16) / 255, b = parseInt(hexc.substr(5, 2), 16) / 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = 0, hh = 0, d = mx - mn;
        if (d > 0.0001) {
            s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
            if (mx === r) hh = ((g - b) / d + (g < b ? 6 : 0)) * 60; else if (mx === g) hh = ((b - r) / d + 2) * 60; else hh = ((r - g) / d + 4) * 60;
        }
        return [hh, s, l];
    }
    function score(sp) {
        var sc = 0, k, best = 0, hue = -1, cols = sp.colors || [];
        if (BL[sp.id]) sc += BL[sp.id].W >= 96 ? 20 : 40; else if (sp.mesh) sc += 15;
        for (k = 0; k < sp.els.length; k++) if (/grid|nodes|flute|bubbles|rect|rays|noise/.test(sp.els[k].t)) sc -= 12;
        for (k = 0; k < cols.length; k++) { var q = hsl(cols[k]); if (q[1] * (1 - Math.abs(q[2] - 0.5) * 2) > best) { best = q[1] * (1 - Math.abs(q[2] - 0.5) * 2); hue = q[0]; } }
        if (hue >= 205 && hue <= 290) sc += 25; else if (hue > 290 && hue <= 340) sc += 14; else if (hue >= 160 && hue < 205) sc += 9; else if (hue >= 0) sc += 3;
        var bgL = cols.length ? hsl(cols[0])[2] : 0.5;
        if (bgL < 0.18) sc += 12; else if (bgL > 0.82) sc += 8;
        return sc;
    }
    for (si = 0; si < S.length; si++) S[si].rank = score(S[si]) * 1000 - si;
    S.sort(function (a, b) { return b.rank - a.rank; });
    C.saasBg = S;
    C.saasPacks = { C98UWG5: "SaaS Text Animation", "977PMGF": "Text Presets SAAS Intro", AUS4BJ5: "SaaS Text Animation Pack", KFNQGA2: "SaaS Text Animation Presets", WHGRUT8: "SaaS Text Presets", "9MA8AYM": "SaaS Text Presets", TVM9V6E: "SaaS Text Presets",
        CX8P246: "SaaS Gradient Backgrounds", RLNWZL3: "SaaS Gradient Backgrounds", MPC8KR8: "SaaS Gradient Backgrounds", BL8VAPC: "Strong SaaS Product Promo", QEFYJ2Y: "Abstract SaaS Promo", KS6NGHC: "Saas & Tech Backgrounds",
        S3UUUAQ: "Saas Backgrounds - Ultra Wave", "4BDDT7H": "SaaS Product Promo MOGRTs", A7M8WX3: "AI SaaS Promo", PTJJVQK: "AI SaaS Promo MOGRT", "3V2ZDCB": "SaaS Promo", "7UP27XZ": "SaaS Style Smooth Logo Reveal",
        YE5UC6A: "AI SaaS Promo", SNTG3US: "Ai SaaS Flat Marketing", VKV7JL9: "SaaS App Promo", "9FLG3LJ": "SaaS Product Promo", "2V95ETU": "Ai Saas Promo Builder", LJ7AAES: "SaaS Product Promo MOGRT",
        N86KXHT: "SaaS Promotion", GLX9LUK: "Explore Saas Promo", "98HLNCL": "Saas Product Promo", VNQ947M: "SaaS Product Promo", "5AG6JPH": "SaaS Startup Product Promo", QDZMPKH: "SaaS Storytelling Titles",
        "4K25UR7": "Ai SaaS Intro MOGRT", EFMV44T: "Clean SaaS Product Promo", "8TTDG9Q": "Ai SaaS Promo", "6FJ4AF6": "Fast SaaS Product Promo" };
})(UK_CAT);

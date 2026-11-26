/*  Ultimate Kit - cinematic backgrounds
    "BG Cinematic - Name (shapes)": white light-shapes on black, every move keyframed
    with smooth auto-bezier keys. The comp holds 3 identical loops (3 x P seconds).
    The layer placed in your comp plays the middle loop forever through Time Remap,
    at the speed of its "Speed" effect, so the float never jumps or stops.
    Effects on that layer (Effect Controls):
      Speed      floating speed in %          Softness   Gaussian blur (light softness)
      Light      brightness / contrast        Colors     CC Toner, 5 colours (shadows..highlights)
      Grain      film grain amount                                                           */

UK.BG = {};

UK.BG.smooth = function (prop) {
    for (var i = 1; i <= prop.numKeys; i++) {
        try {
            prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            prop.setTemporalContinuousAtKey(i, true);
            prop.setTemporalAutoBezierAtKey(i, true);
            if (prop.isSpatial) { prop.setSpatialContinuousAtKey(i, true); prop.setSpatialAutoBezierAtKey(i, true); }
        } catch (e) { }
    }
};
/* periodic keyframes: vals repeat every P seconds, written over 3 loops */
UK.BG.cyc = function (prop, vals, P, shift, map) {
    if (!(vals instanceof Array)) { prop.setValue(map(vals)); return; }
    var n = vals.length;
    if (n === 1) { prop.setValue(map(vals[0])); return; }
    for (var k = 0; k <= 3 * n; k++) prop.setValueAtTime(k * P / n, map(vals[(k + (shift || 0)) % n]));
    UK.BG.smooth(prop);
};
UK.BG.linear = function (prop, v0, v1, T) {
    prop.setValueAtTime(0, v0);
    prop.setValueAtTime(T, v1);
    for (var i = 1; i <= prop.numKeys; i++) prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
};

/* one light-shape layer */
UK.BG.layer = function (C, d, P, idx) {
    var W = C.width, H = C.height, U = Math.max(W, H), fd = C.frameDuration;
    var white = d.col !== 0, col = white ? "#E6E6E6" : "#000000";      // 90% grey: cores reach the brights, overlaps the highlights
    var names = { blob: "Glow", orb: "Orb", ring: "Ring", rays: "Rays", petal: "Petals", tri: "Triangle", beam: "Beams", band: "Band", swoosh: "Swoosh", pulse: "Pulse" };
    var L = UK.shapeLayer(C, (names[d.t] || "Shape") + " " + (idx + 1) + (white ? "" : " (shadow)"));
    var s = (d.s || 0.5) * U, i, j;
    var gname = "Shape";
    var g = UK.group(UK.root(L), gname);
    var v = UK.vecs(g);
    switch (d.t) {
        case "orb":
            UK.addEllipse(v, [s, s], [0, 0]);
            UK.addGradFill(v, true, [0, 0], [s / 2, 0]);
            break;
        case "ring":
            UK.addEllipse(v, [s, s * (d.aspect || 1)], [0, 0]);
            if (d.arc) UK.addTrim(v, "Arc").property("ADBE Vector Trim End").setValue(d.arc);
            UK.addStroke(v, col, (d.w || 0.05) * U * 1.4, { cap: 2 });
            break;
        case "rays":
            UK.addStar(v, { points: d.n || 8, outer: s / 2, inner: s / 2 * (d.inner || 0.1) });
            UK.addFill(v, col);
            break;
        case "petal":
            UK.addStar(v, { points: d.n || 6, outer: s / 2, inner: s / 2 * (d.inner || 0.3), outerRound: d.round || 90 });
            UK.addFill(v, col);
            break;
        case "tri":
            UK.addStar(v, { polygon: true, points: 3, outer: s / 2, outerRound: d.round || 20 });
            UK.addFill(v, col);
            break;
        case "beam":
            g.remove();
            var bn = d.n || 4, len = s, bw = (d.w || 0.05) * U;
            for (j = 0; j < bn; j++) {
                var bg = UK.group(UK.root(L), "Beam " + (j + 1));
                UK.addRect(UK.vecs(bg), [len, bw], [len / 2, 0], bw / 2);
                UK.addFill(UK.vecs(UK.root(L).property("Beam " + (j + 1))), col);
                UK.gtr(UK.root(L).property("Beam " + (j + 1))).property("ADBE Vector Rotation").setValue((j - (bn - 1) / 2) * (d.spread || 15));
            }
            break;
        case "band":
            UK.addRect(v, [U * 2.6, (d.s || 0.15) * H], [0, 0], (d.s || 0.15) * H / 2);
            UK.addFill(v, col);
            break;
        case "swoosh":
            var h = s * 0.2 * (d.flip ? -1 : 1);
            UK.addPath(v, [[-s / 2, 0], [s / 2, 0]], [[0, 0], [-s / 3, h]], [[s / 3, -h], [0, 0]], false);
            UK.addStroke(v, col, (d.w || 0.05) * U * 1.4, { cap: 2 });
            break;
        case "pulse":
            g.remove();
            var m = d.n || 3;
            for (j = 0; j < m; j++) {
                var rn = "Wave " + (j + 1);
                var rg = UK.group(UK.root(L), rn);
                UK.addEllipse(UK.vecs(rg), [s, s], [0, 0]);
                UK.addStroke(UK.vecs(UK.root(L).property(rn)), col, (d.w || 0.04) * U * 1.4);
                var tr = UK.gtr(UK.root(L).property(rn));
                var sk = [], ok = [], scv = [], opv = [];
                for (var k = 0; k <= 1; k++) {
                    var st = k * P + j * P / m;
                    sk.push([st, [0, 0]]); sk.push([st + P - fd, [100, 100]]);
                    ok.push([st, 0]); ok.push([st + P * 0.15, 100]); ok.push([st + P - fd, 0]);
                }
                for (i = 0; i < sk.length - 1; i++) scv.push(i % 2 === 0 ? "outSoft" : "linear");
                for (i = 0; i < ok.length - 1; i++) opv.push(i % 3 === 0 ? "smooth" : (i % 3 === 1 ? "inSoft" : "linear"));
                UK.anim(tr.property("ADBE Vector Scale"), sk, scv);
                UK.anim(UK.gtr(UK.root(L).property(rn)).property("ADBE Vector Group Opacity"), ok, opv);
            }
            break;
        default:   // blob
            UK.addEllipse(v, [s, s * (d.aspect || 1)], [0, 0]);
            UK.addFill(v, col);
    }
    var ph = d.ph || 0;
    UK.BG.cyc(UK.pos(L), d.at || [[0.5, 0.5]], P, ph, function (p) { return [p[0] * W, p[1] * H]; });
    if (d.sc) UK.BG.cyc(UK.scale(L), d.sc, P, ph, function (x) { return [x, x]; });
    var r0 = d.r0 || 0;
    if (typeof d.rot === "number") UK.BG.linear(UK.rot(L), r0, r0 + 360 * d.rot * 3, 3 * P);
    else if (d.rot) UK.BG.cyc(UK.rot(L), d.rot, P, ph, function (x) { return r0 + x; });
    else if (r0) UK.rot(L).setValue(r0);
    if (d.op !== undefined) UK.BG.cyc(UK.opac(L), d.op, P, ph, function (x) { return x; });
    if (d.blur) {
        UK.fx(L, "ADBE Gaussian Blur 2", "Soft");
        UK.efx(L, "Soft").property("ADBE Gaussian Blur 2-0001").setValue(Math.round(d.blur * U));
    }
    if (white) L.blendingMode = BlendingMode.SCREEN;      // lights add up, black never covers
    return L;
};

UK.api.cinematic = function (a) {
    var host = UK.comp(true);
    var spec = UK_CAT.find(UK_CAT.cinematic, a.id);
    if (!spec) throw new Error("Unknown background " + a.id);
    var W = host.width, H = host.height, U = Math.max(W, H), P = spec.P || 14;
    var pal = (a.colors && a.colors.length === 5) ? a.colors : UK_CAT.cinePal[spec.pal];
    var speed = UK.clamp(Number(a.speed) || 100, 1, 1000);
    var soft = UK.clamp((a.softness === undefined ? 100 : Number(a.softness)) / 100, 0, 5);
    var grain = UK.clamp(a.grain === undefined ? 16 : Number(a.grain), 0, 100);
    var full = a.fullComp !== false;
    var dur = full ? host.duration : UK.clamp(Number(a.duration) || 10, 0.1, 10800);
    var t0 = full ? 0 : UK.timeCTI(host);
    var name = UK.uniqueName("BG Cinematic - " + spec.name);
    UK._fd = host.frameDuration;

    /* ---- the shapes comp: 3 loops */
    var C = UK.newComp(name + " (shapes)", host, 3 * P, "Backgrounds");
    var black = C.layers.addSolid([0, 0, 0], "Black", W, H, host.pixelAspect);
    black.outPoint = C.duration;
    for (var i = 0; i < spec.layers.length; i++) UK.BG.layer(C, spec.layers[i], P, i);
    black.moveToEnd();
    C.comment = "Ultimate Kit cinematic background. Every move is keyframed and repeats every " + P + " s (3 loops).";

    /* ---- the layer in your comp */
    var L = host.layers.add(C);
    L.name = UK.uniqueLayerName(host, "BG Cinematic - " + spec.name);
    L.moveToEnd();
    L.startTime = t0;
    UK.slider(L, "Speed", speed);
    L.timeRemapEnabled = true;
    L.property("ADBE Time Remapping").expression = [
        '// Ultimate Kit: endless seamless loop, speed from the "Speed" effect (%)',
        'var P = ' + P + ';',
        'var sp = effect("Speed")(1);',
        'var t = 0;',
        'if (sp.numKeys == 0) { t = (time - inPoint) * sp.value / 100; }',
        'else { var fd = thisComp.frameDuration; for (var x = inPoint; x < time; x += fd) t += sp.valueAtTime(x) / 100 * fd; }',
        'var m = t % P; if (m < 0) m += P;',
        'P + m;'
    ].join("\n");
    L.inPoint = t0;
    L.outPoint = Math.min(t0 + dur, Math.max(host.duration, t0 + dur));
    UK.fx(L, "ADBE Gaussian Blur 2", "Softness");
    UK.efx(L, "Softness").property("ADBE Gaussian Blur 2-0001").setValue(Math.round((spec.soft || 0.03) * U * 2.5 * soft));
    UK.efx(L, "Softness").property("ADBE Gaussian Blur 2-0003").setValue(1);
    UK.fx(L, "ADBE Brightness & Contrast 2", "Light");
    UK.fx(L, "CC Toner", "Colors");
    var tn = UK.efx(L, "Colors");
    try { tn.property("CC Toner-0005").setValue(3); } catch (e1) { }      // Pentone: 5 colours
    tn = UK.efx(L, "Colors");
    tn.property("CC Toner-0003").setValue(UK.rgba(pal[0]));   // Shadows
    tn.property("CC Toner-0007").setValue(UK.rgba(pal[1]));   // Darks
    tn.property("CC Toner-0002").setValue(UK.rgba(pal[2]));   // Midtones
    tn.property("CC Toner-0006").setValue(UK.rgba(pal[3]));   // Brights
    tn.property("CC Toner-0001").setValue(UK.rgba(pal[4]));   // Highlights
    UK.fx(L, "ADBE Noise", "Grain");
    UK.efx(L, "Grain").property("ADBE Noise-0001").setValue(grain);
    UK.efx(L, "Grain").property("ADBE Noise-0002").setValue(0);
    L.comment = "Ultimate Kit: Speed / Softness / Light / Colors / Grain are in Effect Controls.";
    UK.selectOnly(host, [L]);
    return { name: L.name, comp: C.name, loop: P };
};

/*  Ultimate Kit - Flag Wave (shared/wave.js): the tutorial's flag wave on every selected layer (or, with nothing
    selected, on a new white rectangle "Flag"):
      <name> Wave Map   precomp: "Wave Area", a white rectangle over the layer's bounds, with Wave World; in the comp
                        over the flag in Hard Light, track-matted by it (= the tutorial's Overlay, only on the flag)
      <name> Flag       the layer precomposed; Displacement Map from the Wave Map
    Everything stays editable: Wave World on the Wave Map's "Wave Area", Displacement Map on the Flag layer.      */
UK.WV = {};
/* the layer's bounds in comp space (2D: its content box through its transform) */
UK.WV.bounds = function (L, t) {
    var r = L.sourceRectAtTime(t, false), pts = [[r.left, r.top], [r.left + r.width, r.top], [r.left + r.width, r.top + r.height], [r.left, r.top + r.height]];
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var i = 0; i < 4; i++) {
        var p = UK.toParent(L, pts[i], t);
        x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
    }
    return { x: x0, y: y0, w: Math.max(2, x1 - x0), h: Math.max(2, y1 - y0) };
};
UK.WV.build = function (comp, L, c) {
    var W = comp.width, H = comp.height, t = comp.time, bb = UK.WV.bounds(L, t), nm = L.name, i;
    var inP = L.inPoint, outP = L.outPoint;
    /* the layer, precomposed (everything moves in), at the same place */
    var idx = L.index, PC = comp.layers.precompose([idx], UK.uniqueName(nm + " Flag"), true);
    try { PC.parentFolder = UK.folder("Flag Wave"); } catch (e0) { }
    var PL = comp.layer(idx);
    /* the wave map: a white rectangle over the layer's bounds with Wave World (the tutorial's settings) */
    var MC = app.project.items.addComp(UK.uniqueName(nm + " Wave Map"), W, H, comp.pixelAspect, comp.duration, comp.frameRate);
    try { MC.parentFolder = UK.folder("Flag Wave"); } catch (e1) { }
    var S = UK.shapeLayer(MC, "Wave Area"), g = UK.group(UK.root(S), "Rectangle 1"), mg = c.strength + 20;      // (a margin: the moved edges still read waves)
    UK.addRect(UK.vecs(g), [UK.round(bb.w + 2 * mg, 2), UK.round(bb.h + 2 * mg, 2)], [UK.round(bb.x + bb.w / 2, 2), UK.round(bb.y + bb.h / 2, 2)], 0, "Rectangle Path 1");
    UK.addFill(UK.vecs(g), "#FFFFFF", 100, "Fill 1");
    UK.anchor(S).setValue([0, 0]); UK.pos(S).setValue([0, 0]);
    S.inPoint = 0; S.outPoint = MC.duration;
    var E = S.property("ADBE Effect Parade").addProperty("APC Wave World"), P = function (n) { return E.property("APC Wave World-" + n); };
    UK.safeSet(P("0002"), 1);                                // View: Height Map
    UK.safeSet(P("0030"), c.speed);                          // Simulation: Wave Speed
    UK.safeSet(P("0024"), UK_WAVE.PREROLL);                  // Pre-roll
    UK.safeSet(P("0042"), 1);                                // Producer 1: Ring
    P("0044").setValue([UK.round(bb.x + UK_WAVE.PRODUCER[0] * bb.w, 1), UK.round(bb.y + UK_WAVE.PRODUCER[1] * bb.h, 1)]);
    UK.safeSet(P("0046"), c.len); UK.safeSet(P("0048"), c.width); UK.safeSet(P("0050"), c.angle);
    UK.safeSet(P("0052"), c.amp); UK.safeSet(P("0054"), c.freq); UK.safeSet(P("0056"), 0);
    S.comment = "Ultimate Kit Flag Wave: Wave World makes the waves (Producer 1: where they start, their size, angle, height and frequency).";
    /* the waves over the flag in Hard Light, matted by the flag: the same picture as the tutorial's "flag in Overlay
       over the waves" (Hard Light of the waves on the flag = Overlay of the flag on the waves), but only on the
       flag, so it works over any background */
    var ML = comp.layers.add(MC);
    ML.moveBefore(PL);
    ML.startTime = 0; ML.inPoint = Math.max(0, inP); ML.outPoint = outP;
    ML.blendingMode = BlendingMode.HARD_LIGHT;
    if (typeof ML.setTrackMatte === "function") ML.setTrackMatte(PL, TrackMatteType.ALPHA);
    PL.enabled = true;
    ML.comment = "Ultimate Kit Flag Wave: the waves (Wave World inside): they shade the flag under them (Hard Light, matted by it) and move it (its Displacement Map).";
    /* the flag, moved by the waves */
    var D = UK.fx(PL, "ADBE Displacement Map", "Displacement Map");
    D = UK.efx(PL, "Displacement Map");
    D.property("ADBE Displacement Map-0001").setValue(ML.index);
    D.property("ADBE Displacement Map-0002").setValue(1);    // Red
    UK.safeSet(D.property("ADBE Displacement Map-0003"), c.strength);
    D.property("ADBE Displacement Map-0004").setValue(2);    // Green
    UK.safeSet(D.property("ADBE Displacement Map-0005"), c.strength);
    D.property("ADBE Displacement Map-0006").setValue(1);    // Center Map
    D.property("ADBE Displacement Map-0007").setValue(0);
    D.property("ADBE Displacement Map-0008").setValue(1);    // Expand Output
    PL.comment = "Ultimate Kit Flag Wave: moved by the Displacement Map from '" + ML.name + "' (which shades it). The picture itself is inside this precomp.";
    return PL;
};
UK.api.flagWave = function (a) {
    var comp = UK.comp(true), D = UK_WAVE.DEF, c = {}, k, i;
    for (k in D) c[k] = D[k];
    for (k in a) if (D[k] !== undefined && a[k] !== null && !isNaN(Number(a[k]))) c[k] = Number(a[k]);
    var sel = comp.selectedLayers, L = [];
    for (i = 0; i < sel.length; i++) if (sel[i] instanceof AVLayer || sel[i] instanceof ShapeLayer || sel[i] instanceof TextLayer) { if (!sel[i].nullLayer && !sel[i].adjustmentLayer && !sel[i].threeDLayer) L.push(sel[i]); }
    if (!L.length) {                 // nothing selected: a white rectangle to wave (the tutorial's start)
        var R = UK.shapeLayer(comp, UK.uniqueLayerName(comp, "Flag")), g = UK.group(UK.root(R), "Rectangle 1"), w = Math.round(Math.min(comp.width * 0.75, comp.height * 0.75 * 1.5));
        UK.addRect(UK.vecs(g), [w, Math.round(w / 1.5)], [0, 0], 0, "Rectangle Path 1");
        UK.addFill(UK.vecs(g), "#FFFFFF", 100, "Fill 1");
        UK.pos(R).setValue([comp.width / 2, comp.height / 2]);
        L.push(R);
    }
    var made = [];
    for (i = 0; i < L.length; i++) made.push(UK.WV.build(comp, L[i], c));
    UK.selectOnly(comp, made);
    return { flags: made.length, name: made[0].name };
};

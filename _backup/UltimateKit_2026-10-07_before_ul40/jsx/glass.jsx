/*  Ultimate Kit - Glass
    Turns the selected shape layer (or a new rounded panel) into a glass panel:
      Glass Blur   adjustment layer, alpha-matted to the panel: frosts what is behind it
      Glass Matte  hidden copy of the panel used as the matte
      Glass Edge   light rim that fades across the panel (stroke + Linear Wipe)
      Glass Shadow soft drop shadow underneath
    Everything follows the panel (parented) and is controlled from sliders on the panel.  */

UK.GL = {};

UK.GL.strip = function (L) {           // remove fills/strokes everywhere in a shape layer
    function walk(g) {
        for (var i = g.numProperties; i >= 1; i--) {
            var p = g.property(i), mn = p.matchName;
            if (mn === "ADBE Vector Graphic - Fill" || mn === "ADBE Vector Graphic - Stroke" || mn === "ADBE Vector Graphic - G-Fill" || mn === "ADBE Vector Graphic - G-Stroke") p.remove();
            else if (mn === "ADBE Vector Group") walk(p.property("ADBE Vectors Group"));
        }
    }
    walk(UK.root(L));
};
UK.GL.paint = function (L, fillHex, fillOp, strokeHex, strokeW, strokeOp) {
    UK.GL.strip(L);
    var R = UK.root(L);
    if (strokeHex) UK.addStroke(R, strokeHex, strokeW, { opacity: strokeOp, join: 2 });
    if (fillHex) UK.addFill(R, fillHex, fillOp);
};

UK.GL.follow = function (D, P) {
    var t = P.containingComp.time;
    var names = ["ADBE Anchor Point", "ADBE Position", "ADBE Scale", "ADBE Rotate Z", "ADBE Opacity"];
    for (var i = 0; i < names.length; i++) {
        var dp = UK.tr(D, names[i]), pp = UK.tr(P, names[i]);
        try { while (dp.numKeys) dp.removeKey(1); dp.expression = ""; if (names[i] !== "ADBE Opacity") dp.setValue(pp.valueAtTime(t, false)); } catch (e) { }
    }
    D.parent = P;
};

UK.api.glass = function (a) {
    var comp = UK.comp(true);
    var style = a.style || "frosted";
    var W = comp.width, H = comp.height;
    var sel = comp.selectedLayers, P = null;
    for (var i = 0; i < sel.length; i++) if (sel[i] instanceof ShapeLayer) { P = sel[i]; break; }
    if (!P) {
        P = UK.shapeLayer(comp, UK.uniqueLayerName(comp, "Glass Panel"));
        var g = UK.group(UK.root(P), "Panel");
        UK.addRect(UK.vecs(g), [Math.round(W * 0.42), Math.round(H * 0.5)], [0, 0], Math.round(Math.min(W, H) * 0.045));
        UK.pos(P).setValue([W / 2, H / 2]);
        P.startTime = 0;
    }
    var base = P.name;
    // ----- matte (solid copy of the panel shape)
    var M = P.duplicate();
    M.name = base + " - Glass Matte";
    UK.GL.paint(M, "#FFFFFF", 100);
    var Mfx = M.property("ADBE Effect Parade");
    for (var k = Mfx.numProperties; k >= 1; k--) Mfx.property(k).remove();
    // ----- shadow
    var S = P.duplicate();
    S.name = base + " - Glass Shadow";
    UK.GL.paint(S, "#000000", 100);
    var sb = UK.fx(S, "ADBE Gaussian Blur 2", "Shadow Softness");
    UK.efx(S, "Shadow Softness").property(1).setValue(Math.round(Math.min(W, H) * 0.05));
    // ----- blur adjustment
    var A = comp.layers.addSolid([1, 1, 1], base + " - Glass Blur", W, H, comp.pixelAspect);
    A.adjustmentLayer = true;
    A.startTime = 0; A.inPoint = P.inPoint; A.outPoint = P.outPoint;
    var fb = UK.fx(A, "ADBE Box Blur2", "Frost");
    fb = UK.efx(A, "Frost");
    fb.property("ADBE Box Blur2-0001").setValue(style === "liquid" ? 6 : 34);
    fb.property("ADBE Box Blur2-0002").setValue(3);
    fb.property("ADBE Box Blur2-0004").setValue(1);
    var bc = UK.fx(A, "ADBE Brightness & Contrast 2", "Glass Brightness");
    UK.efx(A, "Glass Brightness").property(1).setValue(style === "tint" ? 4 : 10);
    var hs = UK.fx(A, "ADBE HUE SATURATION", "Glass Saturation");
    UK.efx(A, "Glass Saturation").property("ADBE HUE SATURATION-0005").setValue(18);
    if (style === "liquid") {
        var bu = UK.fx(A, "ADBE Bulge", "Lens");
        bu = UK.efx(A, "Lens");
        var r = UK.compBounds(P);
        bu.property("ADBE Bulge-0001").setValue(r.width * 0.55);
        bu.property("ADBE Bulge-0002").setValue(r.height * 0.55);
        bu.property("ADBE Bulge-0004").setValue(0.6);
        bu.property("ADBE Bulge-0003").expression = 'var p = thisComp.layer("' + base + '");\np.toComp(p.anchorPoint);';
    }
    // ----- edge light
    var E = P.duplicate();
    E.name = base + " - Glass Edge";
    UK.GL.paint(E, null, 0, "#FFFFFF", Math.max(1.5, Math.round(Math.min(W, H) * 0.0025 * 10) / 10), 85);
    var lw = UK.fx(E, "ADBE Linear Wipe", "Edge Fade");
    lw = UK.efx(E, "Edge Fade");
    lw.property("ADBE Linear Wipe-0001").setValue(42);
    lw.property("ADBE Linear Wipe-0002").setValue(135);
    lw.property("ADBE Linear Wipe-0003").setValue(Math.round(Math.max(W, H) * 0.35));
    // ----- the panel surface itself
    var tint = a.tint || (style === "tint" ? UK_CAT.saasPal[0][0] : "#FFFFFF");
    UK.GL.paint(P, tint, style === "tint" ? 22 : (style === "liquid" ? 6 : 10));
    // ----- controls on the panel
    UK.slider(P, "Glass - Frost", style === "liquid" ? 6 : 34);
    UK.slider(P, "Glass - Brightness", style === "tint" ? 4 : 10);
    UK.slider(P, "Glass - Edge Light", 85);
    UK.slider(P, "Glass - Shadow", 28);
    var ref = 'thisComp.layer("' + base.replace(/"/g, '\\"') + '")';
    UK.efx(A, "Frost").property("ADBE Box Blur2-0001").expression = ref + '.effect("Glass - Frost")(1);';
    UK.efx(A, "Glass Brightness").property(1).expression = ref + '.effect("Glass - Brightness")(1);';
    UK.opac(E).expression = ref + '.effect("Glass - Edge Light")(1);';
    UK.opac(S).expression = ref + '.effect("Glass - Shadow")(1);';
    // ----- stacking:  Edge, Panel, Blur(+matte), Shadow  (top -> bottom)
    A.moveBefore(P); A.moveAfter(P);
    M.moveAfter(A);
    S.moveAfter(M);
    E.moveBefore(P);
    A.setTrackMatte(M, TrackMatteType.ALPHA);
    S.setTrackMatte(M, TrackMatteType.ALPHA_INVERTED);     // the shadow only shows outside the glass
    // follow the panel (duplicates lose their own animation first, otherwise it would apply twice)
    UK.GL.follow(M, P); UK.GL.follow(S, P); UK.GL.follow(E, P);
    UK.pos(S).setValue([UK.pos(S).value[0], UK.pos(S).value[1] + Math.round(Math.min(W, H) * 0.025)]);
    var tag = "UK glass: " + base;
    A.comment = tag; M.comment = tag; S.comment = tag; E.comment = tag;
    UK.selectOnly(comp, [P]);
    return { panel: base, style: style };
};

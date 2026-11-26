/*  Ultimate Kit - gradient backgrounds (hand-built mesh gradient)
    Precomp "BG Gradient - Name", top -> bottom:
      Adjustment Layer 1   Fast Box Blur 150 (3 iterations, repeat edge pixels)
      Null 1               Rotation: time*10   + colour controls (Background, Color 1..n)
      Shape Layer 8 .. 1   circles, Position: wiggle(speed, 60..80), parented to Null 1
      Background           full-frame rectangle
    On the precomp layer: colours (Essential Properties) and Grain (Effect Controls).  */

UK.GB = {};

UK.api.gradientBg = function (a) {
    var host = UK.comp(true);
    var spec = UK_CAT.find(UK_CAT.gradBg, a.id);
    if (!spec) throw new Error("Unknown gradient background " + a.id);
    var W = host.width, H = host.height, k = W / 1920;
    var bg = a.bg || spec.bg;
    var cols = (a.colors && a.colors.length === spec.colors.length) ? a.colors : spec.colors;
    var full = a.fullComp !== false;
    var dur = full ? host.duration : UK.clamp(Number(a.duration) || 10, 0.1, 10800);
    var t0 = full ? 0 : UK.timeCTI(host);
    var grain = UK.clamp(a.grain === undefined ? 6 : Number(a.grain), 0, 100);
    var name = UK.uniqueName("BG Gradient - " + spec.name);
    var C = UK.newComp(name, host, dur, "Backgrounds");
    var i;

    /* Background */
    var B = UK.shapeLayer(C, "Background");
    UK.addRect(UK.vecs(UK.group(UK.root(B), "Rect")), [W * 1.5, H * 1.5], [0, 0]);
    UK.addFill(UK.vecs(UK.root(B).property("Rect")), bg);
    UK.pos(B).setValue([W / 2, H / 2]);

    /* circles */
    var circles = UK_CAT.gradLayout(spec), shapes = [];
    for (i = 0; i < circles.length; i++) {
        var c = circles[i];
        var L = UK.shapeLayer(C, "Shape Layer " + (i + 1));
        var d = Math.round(c.s * W);
        UK.addEllipse(UK.vecs(UK.group(UK.root(L), "Ellipse 1")), [d, d], [0, 0]);
        UK.addFill(UK.vecs(UK.root(L).property("Ellipse 1")), cols[c.c]);
        UK.pos(L).setValue([c.x * W, c.y * H]);
        shapes.push({ L: L, c: c });
    }

    /* Null 1: rotation + colour controls */
    var N = C.layers.addNull();
    N.name = "Null 1";
    UK.pos(N).setValue([W / 2, H / 2]);
    UK.rot(N).expression = "time*10";
    UK.colorCtl(N, "Background", bg);
    for (i = 0; i < cols.length; i++) UK.colorCtl(N, "Color " + (i + 1), cols[i]);
    UK.root(B).property("Rect").property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").expression = 'thisComp.layer("Null 1").effect("Background")(1)';
    for (i = 0; i < shapes.length; i++) {
        var S = shapes[i];
        S.L.parent = N;   // keeps the circle where it is
        UK.root(S.L).property("Ellipse 1").property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill")
            .property("ADBE Vector Fill Color").expression = 'thisComp.layer("Null 1").effect("Color ' + (S.c.c + 1) + '")(1)';
        UK.pos(S.L).expression = "wiggle(" + S.c.f + ", " + Math.round(S.c.a * k) + ");";
    }

    /* Adjustment Layer 1: Fast Box Blur 150 */
    var A = C.layers.addSolid([1, 1, 1], "Adjustment Layer 1", W, H, host.pixelAspect, dur);
    A.adjustmentLayer = true;
    UK.fx(A, "ADBE Box Blur2", "Fast Box Blur");
    var fb = UK.efx(A, "Fast Box Blur");
    fb.property("ADBE Box Blur2-0001").setValue(Math.round(150 * k));
    fb.property("ADBE Box Blur2-0002").setValue(3);
    fb.property("ADBE Box Blur2-0004").setValue(1);
    A.moveToBeginning();

    /* colours on the precomp layer (Essential Properties) */
    UK.essential(C, UK.efx(N, "Background").property(1), "Background");
    for (i = 0; i < cols.length; i++) UK.essential(C, UK.efx(N, "Color " + (i + 1)).property(1), "Color " + (i + 1));

    /* the layer in your comp: only Grain as an effect */
    var P = host.layers.add(C);
    P.name = UK.uniqueLayerName(host, "BG Gradient - " + spec.name);
    P.moveToEnd();
    P.startTime = t0;
    UK.fx(P, "ADBE Noise", "Grain");
    UK.efx(P, "Grain").property("ADBE Noise-0001").setValue(grain);
    UK.efx(P, "Grain").property("ADBE Noise-0002").setValue(0);
    P.comment = "Ultimate Kit: colours in Essential Properties, grain in Effect Controls.";
    UK.selectOnly(host, [P]);
    return { name: P.name, comp: C.name };
};

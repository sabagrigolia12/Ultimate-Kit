/*  Ultimate Kit - Glass (user's build, 2026-10-08): a rounded rectangle that frosts what is behind it.
      Null N        Blur (Fast Box Blur radius), Frost (white tint %), Light (top rim %), Light Width (rim px)
      Glass Rim     white edge, bright at the top and fading down (stroke + Linear Wipe), parented to the base
      Glass Frost   the white tint inside, parented to the base
      Glass Base    the rectangle as an ADJUSTMENT layer: its Fast Box Blur only works inside the shape
    Rim and Frost read the base's rectangle (size, roundness), so editing the base's rectangle changes all. */
UK.GL = {};
/*  the magnifying edge: CC Glass on an adjustment layer, its bump map a hidden copy of the rectangle ("Lens Map"),
    so whatever is behind the glass bends near the edges, like through a lens. Softness = how wide the bent rim
    is, Displacement = how strong. No CC Glass light / shading (Ambient 100), only the refraction.            */
UK.GL.lens = function (adj, map, soft, disp) {
    var e = UK.fx(adj, "CC Glass", "Edge Lens");
    e.property("CC Glass-0002").setValue(map.index);       // Bump Map
    e.property("CC Glass-0003").setValue(4);
    UK.safeSet(e.property("CC Glass-0004"), soft);           // (CC Glass: Softness 0..500, Displacement -500..500)
    UK.safeSet(e.property("CC Glass-0006"), disp);
    e.property("CC Glass-0009").setValue(0);               // Light Intensity
    e.property("CC Glass-0017").setValue(100); e.property("CC Glass-0018").setValue(0); e.property("CC Glass-0019").setValue(0);
    map.enabled = false;
    return UK.efx(adj, "Edge Lens");
};
UK.GL.build = function (comp, a) {
    var W = comp.width, H = comp.height;
    var w = UK.clamp(Number(a.w) || Math.round(W * 0.75), 10, W * 4), h = UK.clamp(Number(a.h) || Math.round(H * 0.4), 10, H * 4);
    var rd = UK.clamp(a.round === undefined ? 36 : Number(a.round), 0, Math.min(w, h) / 2);
    var blur = UK.clamp(a.blur === undefined ? 6 : Number(a.blur), 0, 200), frost = UK.clamp(a.frost === undefined ? 12 : Number(a.frost), 0, 100), light = UK.clamp(a.light === undefined ? 80 : Number(a.light), 0, 100);
    var lw = UK.clamp(a.lightW === undefined ? Math.round(W / 1920 * 4 * 10) / 10 : Number(a.lightW), 0, 100);
    var t0 = comp.time;
    // the base: an adjustment shape layer
    var B = UK.shapeLayer(comp, UK.uniqueLayerName(comp, "Glass Base"));
    var g = UK.group(UK.root(B), "Glass");
    UK.addRect(UK.vecs(g), [w, h], [0, 0], rd, "Rect");
    UK.addFill(UK.vecs(g), "#FFFFFF", 100);
    UK.pos(B).setValue([W / 2, H / 2]);
    B.adjustmentLayer = true;
    B.label = 8;
    var e = UK.fx(B, "ADBE Box Blur2", "Fast Box Blur");
    UK.safeSet(e.property("ADBE Box Blur2-0001"), blur);
    e.property("ADBE Box Blur2-0002").setValue(3);         // Iterations
    e.property("ADBE Box Blur2-0004").setValue(1);         // Repeat Edge Pixels
    var bq = 'thisComp.layer("' + UK.WIPE.q(B.name) + '")';
    var rect = bq + '.content("Glass").content("Rect")';
    var shape = function (name) {
        var L = UK.shapeLayer(comp, UK.uniqueLayerName(comp, name));
        var gg = UK.group(UK.root(L), "Glass");
        var r = UK.addRect(UK.vecs(gg), [w, h], [0, 0], rd, "Rect");
        r = UK.root(L).property("Glass").property("ADBE Vectors Group").property("Rect");
        r.property("ADBE Vector Rect Size").expression = rect + '.size';
        r.property("ADBE Vector Rect Roundness").expression = rect + '.roundness';
        L.moveBefore(B);
        L.parent = B;
        L.label = 8;
        return L;
    };
    // the frost (white tint)
    var F = shape("Glass Frost");
    UK.addFill(UK.vecs(UK.root(F).property("Glass")), "#FFFFFF", 100);
    // the rim: a thin white edge that fades from the top down
    var R = shape("Glass Rim");
    // the stroke sits just OUTSIDE the glass edge (the path pushed out by half its width): nothing of the glass
    // shows beyond it, the stroke is the edge
    var op = UK.vecs(UK.root(R).property("Glass")).addProperty("ADBE Vector Filter - Offset");
    op.name = "Offset";
    UK.root(R).property("Glass").property("ADBE Vectors Group").property("Offset").property("ADBE Vector Offset Amount").setValue(lw / 2);
    UK.addStroke(UK.vecs(UK.root(R).property("Glass")), "#FFFFFF", lw, { join: 2 });
    R.moveBefore(F);
    // fully gone at the rectangle's bottom, full from a quarter below its top (the layer is comp-sized, the
    // rectangle in its middle): feather 0.75 h, threshold at the bottom: completion = (H/2 + h/2) / (H + 0.75 h)
    e = UK.fx(R, "ADBE Linear Wipe", "Fade");
    e.property("ADBE Linear Wipe-0002").setValue(0);       // the bottom goes first
    e.property("ADBE Linear Wipe-0003").setValue(Math.round(h * 0.75));
    e.property("ADBE Linear Wipe-0003").expression = rect + '.size[1] * 0.75';
    e.property("ADBE Linear Wipe-0001").expression = 'var h = ' + rect + '.size[1];\n100 * (height / 2 + h / 2) / (height + 0.75 * h)';
    var fade = a.fade === undefined ? 0 : Number(a.fade);     // 0: the stroke goes all round; 100: it fades out towards the bottom
    // the magnifying edge (before the blur)
    var lensS = a.lensW === undefined ? 55 : Number(a.lensW), lensD = a.lens === undefined ? 400 : Number(a.lens);
    var M = shape("Lens Map");
    UK.addFill(UK.vecs(UK.root(M).property("Glass")), "#FFFFFF", 100);
    M.moveAfter(B);
    UK.GL.lens(B, M, lensS, lensD).moveTo(1);
    // the controls
    var N = comp.layers.addNull();
    for (var k = 1; k <= comp.numLayers; k++) if (k !== N.index && comp.layer(k).name === N.name) { N.name = UK.uniqueLayerName(comp, N.name); break; }
    N.label = 1;
    N.moveBefore(R);
    UK.pos(N).setValue([W / 2, H / 2]);
    UK.slider(N, "Blur", blur);
    UK.slider(N, "Frost", frost);
    UK.slider(N, "Light", light);
    UK.slider(N, "Light Width", lw);
    UK.slider(N, "Light Fade", fade);
    UK.slider(N, "Edge Lens", lensD);
    UK.slider(N, "Lens Width", lensS);
    var nq = 'thisComp.layer("' + UK.WIPE.q(N.name) + '")';
    UK.efx(B, "Edge Lens").property("CC Glass-0006").expression = nq + '.effect("Edge Lens")(1)';
    UK.efx(B, "Edge Lens").property("CC Glass-0004").expression = 'Math.max(0, ' + nq + '.effect("Lens Width")(1))';
    UK.efx(B, "Fast Box Blur").property("ADBE Box Blur2-0001").expression = 'Math.max(0, ' + nq + '.effect("Blur")(1))';
    UK.opac(F).expression = 'clamp(' + nq + '.effect("Frost")(1), 0, 100)';
    UK.opac(R).expression = 'clamp(' + nq + '.effect("Light")(1), 0, 100)';
    UK.root(R).property("Glass").property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width").expression = 'Math.max(0, ' + nq + '.effect("Light Width")(1))';
    UK.root(R).property("Glass").property("ADBE Vectors Group").property("Offset").property("ADBE Vector Offset Amount").expression = 'Math.max(0, ' + nq + '.effect("Light Width")(1)) / 2';
    UK.efx(R, "Fade").property("ADBE Linear Wipe-0001").expression = 'var h = ' + rect + '.size[1], f = clamp(' + nq + '.effect("Light Fade")(1), 0, 100) / 100;\nf * 100 * (height / 2 + h / 2) / (height + 0.75 * h)';
    var lay = [B, F, R, N, M], i;
    for (i = 0; i < lay.length; i++) { lay[i].startTime = 0; lay[i].inPoint = 0; lay[i].outPoint = comp.duration; lay[i].comment = "Ultimate Kit Glass: Blur / Frost / Light / Light Width / Edge Lens / Lens Width on " + N.name + "; size and roundness on " + B.name + " > Glass > Rect."; }
    return { base: B, controls: N };
};
/*  Glow Box (gl02): the user's own "box animation 2", layer for layer as it is in their project (read with
    tools/ae-test/t_dump3.jsx): the same layer names and order, blending modes, shape contents, effects, values and
    keyframe easing. Nothing added; the only extra is the Null with the controls of these layers.
      <text>         Normal: SF Pro Display Regular 76, left aligned at the box's left part
      glass storke   Screen: tapered white stroke (round cap) + black stroke + black fill, Trim Offset 0 -> 540;
                     Glow, Glow 2, CC Vector Blur, Curves (*), CC Composite, CC Light Sweep (its Center keyframed)
      Shape Layer 2  Screen: the same strokes (fill off), Trim End 0 -> 100 + Offset 0 -> 180; Fast Box Blur,
                     CC Composite, Levels (alpha input white 0.365), Tritone
      Shape Layer 1  Screen: black box (stroke off) with three soft Drop Shadows: the glow behind
      Shape Layer 3  Screen: black box (stroke off), the size every other box reads
    (*) Curves can't be set by script: its measured curve y = 1 - (1 - x)^1.85 (RGB and alpha) is rebuilt as
        Invert -> Levels -> Invert + Levels on the alpha.
    Null: Color 1, Color 2, Highlight, Trim Speed, Spin, Light Width, Light Intensity, Light Speed, Refraction;
    at their defaults every value is exactly the user's.                                                       */
UK.GL.BOX = { c1: "#FF0000", c2: "#0006FF", hi: "#00D6FF", w: 1221, h: 215, round: 132, dur: 1.2346 };
UK.GL.buildBox = function (comp, a) {
    var K = UK.GL.BOX, W = comp.width, H = comp.height, cx = W / 2, cy = H / 2, fd = comp.frameDuration;
    var w = UK.clamp(Number(a.w) || K.w, 10, W * 4), h = UK.clamp(Number(a.h) || K.h, 10, H * 4), rd = UK.clamp(a.round === undefined ? K.round : Number(a.round), 0, Math.min(w, h) / 2);
    var c1 = a.c1 || K.c1, c2 = a.c2 || K.c2, hi = a.hi || K.hi, t0 = UK.snap(comp, Number(a.t0 !== undefined ? a.t0 : comp.time)), D = UK.clamp(Number(a.dur) || K.dur, 2 * fd, 60);
    UK._fd = fd;
    var q = UK.WIPE.q, made = [];
    // every shape layer: Screen, label 8, at [cx - 50, cy + 1] with its group at [50, -1] (as in the original)
    var shape = function (name) {
        var L = UK.shapeLayer(comp, UK.uniqueLayerName(comp, name));
        UK.pos(L).setValue([cx - 50, cy + 1]);
        try { L.blendingMode = BlendingMode.SCREEN; } catch (e) { }
        L.label = 8;
        made.push(L);
        return L;
    };
    var group = function (L) {
        UK.group(UK.root(L), "Rectangle 1");
        var V = function () { return UK.root(L).property("Rectangle 1").property("ADBE Vectors Group"); };
        UK.addRect(V(), [w, h], [0, 0], rd, "Rectangle Path 1");
        UK.root(L).property("Rectangle 1").property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([50, -1]);
        return V;
    };
    // Shape Layer 3: the size
    var S = shape("Shape Layer 3");
    var VS = group(S);
    UK.addStroke(VS(), "#FFFFFF", 2, {}, "Stroke 1"); VS().property("Stroke 1").enabled = false;
    UK.addFill(VS(), "#000000", 100, "Fill 1");
    var sq = 'thisComp.layer("' + q(S.name) + '").content("Rectangle 1").content("Rectangle Path 1").size';
    var linked = function (L) { var V = group(L); V().property("Rectangle Path 1").property("ADBE Vector Rect Size").expression = sq; return V; };
    var strokes = function (L, fillOn) {
        var V = linked(L);
        UK.addStroke(V(), "#FFFFFF", 10, { cap: 2 }, "Stroke 1");
        UK.addStroke(V(), "#000000", 10, {}, "Stroke 2");
        UK.addFill(V(), "#000000", 100, "Fill 1");
        var tp = function (nm, s, e2) { var t = V().property(nm).property("ADBE Vector Stroke Taper"); t.property("ADBE Vector Taper Start Length").setValue(s); t.property("ADBE Vector Taper End Length").setValue(e2); };
        tp("Stroke 1", 100, 23); tp("Stroke 2", 10, 10);
        if (!fillOn) V().property("Fill 1").enabled = false;
        UK.root(L).addProperty("ADBE Vector Filter - Trim");
    };
    // Shape Layer 1: the glow behind
    var B = shape("Shape Layer 1");
    var VB = linked(B);
    UK.addStroke(VB(), "#FFFFFF", 2, {}, "Stroke 1"); VB().property("Stroke 1").enabled = false;
    UK.addFill(VB(), "#000000", 100, "Fill 1");
    var ds = function (nm, col, op, dir, dist) {
        var e = UK.fx(B, "ADBE Drop Shadow", nm);
        e.property("ADBE Drop Shadow-0001").setValue(col); e.property("ADBE Drop Shadow-0002").setValue(op);
        e.property("ADBE Drop Shadow-0003").setValue(dir); e.property("ADBE Drop Shadow-0004").setValue(dist); e.property("ADBE Drop Shadow-0005").setValue(578);
    };
    ds("Drop Shadow", UK.rgba(c1), 127.5, 295, 52); ds("Drop Shadow 2", [0.10196100920439, 0, 1, 1], 127.5, 439, 52); ds("Drop Shadow 3", [1, 1, 1, 1], 38.25, 540, 34);
    // Shape Layer 2: the blurred coloured stroke
    var G = shape("Shape Layer 2");
    strokes(G, false);
    var e = UK.fx(G, "ADBE Box Blur2", "Fast Box Blur");
    e.property("ADBE Box Blur2-0001").setValue(15); e.property("ADBE Box Blur2-0002").setValue(3); e.property("ADBE Box Blur2-0003").setValue(1); e.property("ADBE Box Blur2-0004").setValue(1);
    e = UK.fx(G, "CS Composite", "CC Composite");
    e.property("CS Composite-0001").setValue(100); e.property("CS Composite-0002").setValue(35); e.property("CS Composite-0003").setValue(1);
    e = UK.fx(G, "ADBE Easy Levels2", "Levels");
    e.property("ADBE Easy Levels2-0001").setValue(5);                 // Alpha: Input White 0.365 ...
    e.property("ADBE Easy Levels2-0004").setValue(0.3647058904171);
    e.property("ADBE Easy Levels2-0001").setValue(1);                 // ... then shown on RGB, as in the original
    e = UK.fx(G, "ADBE Tritone", "Tritone");
    e.property("ADBE Tritone-0001").setValue(UK.rgba(hi)); e.property("ADBE Tritone-0002").setValue(UK.rgba(c1)); e.property("ADBE Tritone-0003").setValue(UK.rgba(c2));
    // glass storke
    var T = shape("glass storke");
    strokes(T, true);
    var glow = function (nm, radius, inten, col) {
        var x = UK.fx(T, "ADBE Glo2", nm);
        x.property("ADBE Glo2-0001").setValue(1); x.property("ADBE Glo2-0002").setValue(0); x.property("ADBE Glo2-0003").setValue(radius); x.property("ADBE Glo2-0004").setValue(inten);
        x.property("ADBE Glo2-0005").setValue(2); x.property("ADBE Glo2-0006").setValue(3); x.property("ADBE Glo2-0007").setValue(2); x.property("ADBE Glo2-0008").setValue(3);
        x.property("ADBE Glo2-0009").setValue(1); x.property("ADBE Glo2-0010").setValue(0); x.property("ADBE Glo2-0011").setValue(0.5);
        x.property("ADBE Glo2-0012").setValue(col); x.property("ADBE Glo2-0013").setValue([0, 0, 0, 1]); x.property("ADBE Glo2-0014").setValue(1);
    };
    glow("Glow", 30, 0.83, UK.rgba(c2)); glow("Glow 2", 147, 0.5, UK.rgba(c1));
    e = UK.fx(T, "CC Vector Blur", "CC Vector Blur");
    e.property("CC Vector Blur-0001").setValue(5); e.property("CC Vector Blur-0002").setValue(80); e.property("CC Vector Blur-0003").setValue(487);
    e.property("CC Vector Blur-0004").setValue(0.8); e.property("CC Vector Blur-0006").setValue(6); e.property("CC Vector Blur-0007").setValue(15);
    UK.fx(T, "ADBE Invert", "Curves (in)");
    e = UK.fx(T, "ADBE Easy Levels2", "Curves");
    e.property("ADBE Easy Levels2-0001").setValue(1); e.property("ADBE Easy Levels2-0005").setValue(0.54);
    UK.fx(T, "ADBE Invert", "Curves (out)");
    e = UK.fx(T, "ADBE Easy Levels2", "Curves (alpha)");
    e.property("ADBE Easy Levels2-0001").setValue(5); e.property("ADBE Easy Levels2-0005").setValue(3.2);
    e = UK.fx(T, "CS Composite", "CC Composite");
    e.property("CS Composite-0001").setValue(100); e.property("CS Composite-0002").setValue(35); e.property("CS Composite-0003").setValue(1);
    e = UK.fx(T, "CC Light Sweep", "CC Light Sweep");
    e.property("CC Light Sweep-0002").setValue(-30); e.property("CC Light Sweep-0003").setValue(3); UK.safeSet(e.property("CC Light Sweep-0004"), a.lightW === undefined ? 50 : Number(a.lightW));
    UK.safeSet(e.property("CC Light Sweep-0005"), a.lightI === undefined ? 25 : Number(a.lightI)); e.property("CC Light Sweep-0006").setValue(50); e.property("CC Light Sweep-0007").setValue(4);
    e.property("CC Light Sweep-0008").setValue([1, 0.98039215686275, 0.94117647058824, 1]); e.property("CC Light Sweep-0009").setValue(1);
    // keyframes: an Easy Ease out of the first, a 100 % ease (speed -8.81) into the second
    var k = K.dur / D;
    var keys = function (p, v1) {
        p.setValueAtTime(t0, 0); p.setValueAtTime(t0 + D, v1);
        p.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33.333333)], [new KeyframeEase(0, 33.333333)]);
        p.setTemporalEaseAtKey(2, [new KeyframeEase(-8.80568377865391 * k, 100)], [new KeyframeEase(0, 33.333333)]);
    };
    var trimT = function () { return T.property("ADBE Root Vectors Group").property("ADBE Vector Filter - Trim"); }, trimG = function () { return G.property("ADBE Root Vectors Group").property("ADBE Vector Filter - Trim"); };
    keys(trimT().property("ADBE Vector Trim Offset"), 540);
    keys(trimG().property("ADBE Vector Trim End"), 100);
    keys(trimG().property("ADBE Vector Trim Offset"), 180);
    // the light sweep: the original Center keys (layer pixels of a 1920 x 1080 comp), placed the same way round
    // this box: relative to the comp centre, scaled with the box
    var ls = function () { return UK.efx(T, "CC Light Sweep").property("CC Light Sweep-0001"); }, sx = w / K.w, sy = h / K.h;
    ls().setValueAtTime(t0 + 0.26693360026693 / K.dur * D, [cx + (182 - 960) * sx, cy + (397 - 540) * sy]);
    ls().setValueAtTime(t0 + 0.93426760093427 / K.dur * D, [cx + (1650.08163452148 - 960) * sx, cy + (333 - 540) * sy]);
    ls().setTemporalEaseAtKey(1, [new KeyframeEase(0, 16.666666667)], [new KeyframeEase(0, 33.333333)]);
    ls().setTemporalEaseAtKey(2, [new KeyframeEase(0, 100)], [new KeyframeEase(0, 16.666666667)]);
    try { ls().setSpatialTangentsAtKey(1, [0, 0], [0, 0]); ls().setSpatialTangentsAtKey(2, [0, 0], [0, 0]); } catch (e5) { }
    // the text: Normal, label 1, SF Pro Display Regular 76, left aligned, anchor 0, at the original place
    var X = null;
    if (a.text !== "" && a.text !== null) {
        var str = a.text === undefined ? "Make the glow look great" : String(a.text), font = UK.font();
        try { var fs = app.fonts.getFontsByPostScriptName("SFProDisplay-Regular"); if (fs && fs.length) font = "SFProDisplay-Regular"; } catch (e6) { }
        X = comp.layers.addText(str);
        var td = UK.textDoc(X), d = td.value;
        try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e7) { }
        d.font = font; d.fontSize = 76; d.applyFill = true; d.fillColor = [1, 1, 1]; d.applyStroke = false; d.tracking = 0;
        d.justification = ParagraphJustification.LEFT_JUSTIFY;
        td.setValue(d);
        UK.anchor(X).setValue([0, 0]);
        UK.pos(X).setValue([cx + (564.93359375 - 960) * sx, cy + (559.5009765625 - 540) * sy]);
        X.label = 1;
        X.moveBefore(T);
        made.push(X);
    }
    // the controls
    var N = comp.layers.addNull();
    for (var j = 1; j <= comp.numLayers; j++) if (j !== N.index && comp.layer(j).name === N.name) { N.name = UK.uniqueLayerName(comp, N.name); break; }
    N.label = 1;
    N.moveBefore(X || T);
    UK.pos(N).setValue([cx, cy]);
    UK.colorCtl(N, "Color 1", c1); UK.colorCtl(N, "Color 2", c2); UK.colorCtl(N, "Highlight", hi);
    UK.slider(N, "Trim Speed", 100); UK.slider(N, "Spin", 100);
    UK.slider(N, "Light Width", a.lightW === undefined ? 50 : Number(a.lightW));
    UK.slider(N, "Light Intensity", a.lightI === undefined ? 25 : Number(a.lightI));
    UK.slider(N, "Light Speed", 100);
    UK.slider(N, "Refraction", a.refr === undefined ? 80 : Number(a.refr));
    var nq = 'thisComp.layer("' + q(N.name) + '")', fx = function (nm) { return nq + '.effect("' + nm + '")(1)'; };
    var speedX = function (ctl, mul) { return 'var sp = Math.max(0.01, ' + fx(ctl) + ' / 100), t = key(1).time;\nvalueAtTime(t + (time - t) * sp)' + (mul ? ' * ' + fx(mul) + ' / 100' : ''); };
    trimT().property("ADBE Vector Trim Offset").expression = speedX("Trim Speed", "Spin");
    trimG().property("ADBE Vector Trim End").expression = speedX("Trim Speed");
    trimG().property("ADBE Vector Trim Offset").expression = speedX("Trim Speed", "Spin");
    ls().expression = speedX("Light Speed");
    UK.efx(T, "CC Light Sweep").property("CC Light Sweep-0004").expression = fx("Light Width");
    UK.efx(T, "CC Light Sweep").property("CC Light Sweep-0005").expression = fx("Light Intensity");
    UK.efx(T, "CC Vector Blur").property("CC Vector Blur-0002").expression = fx("Refraction");
    UK.efx(T, "Glow").property("ADBE Glo2-0012").expression = fx("Color 2");
    UK.efx(T, "Glow 2").property("ADBE Glo2-0012").expression = fx("Color 1");
    UK.efx(G, "Tritone").property("ADBE Tritone-0001").expression = fx("Highlight");
    UK.efx(G, "Tritone").property("ADBE Tritone-0002").expression = fx("Color 1");
    UK.efx(G, "Tritone").property("ADBE Tritone-0003").expression = fx("Color 2");
    UK.efx(B, "Drop Shadow").property("ADBE Drop Shadow-0001").expression = fx("Color 1");
    // (Drop Shadow 2 is 0.102, 0, 1 where Color 2 is 0, 0.0235, 1: kept that exact offset)
    UK.efx(B, "Drop Shadow 2").property("ADBE Drop Shadow-0001").expression = 'var c = ' + fx("Color 2") + ';\n[clamp(c[0] + 0.10196100920439, 0, 1), clamp(c[1] - 0.02352930791676, 0, 1), c[2], 1]';
    made.push(N);
    // CC Composite's Top Layer: the layer itself, as in the original (2 = glass storke, 3 = Shape Layer 2 there)
    UK.efx(T, "CC Composite").property("CS Composite-0004").setValue(T.index);
    UK.efx(G, "CC Composite").property("CS Composite-0004").setValue(G.index);
    for (j = 0; j < made.length; j++) { made[j].startTime = 0; made[j].inPoint = 0; made[j].outPoint = comp.duration; }
    N.comment = "Ultimate Kit Glow Box: the controls of these layers. Size on " + S.name + " > Rectangle 1 > Rectangle Path 1.";
    return { base: T, controls: N, size: S };
};
/*  Liquid Glass (gl03): the user's own set-up (2026-10-25, their "Comp 1", 1080 x 1920, read with
    tools/ae-test/t_dump5.jsx), exactly: one shape layer, a rounded rectangle (Size 701.43 x 1398.421, Roundness
    378, white Fill, a white 13 px Stroke switched off; group position = anchor point [28.247, 516.111]), with
    "Liquid Glass" (the TFM Liquid Glass plug-in) reading the layer under it and Noise 2 %. It rises from under the
    frame: Position keys 0 s / 1.5682 s / 4.9049 s, each easing in at 100 % influence. Panel: Width, Height, Noise;
    everything else is edited on the layer's effects.                                                         */
UK.GL.LQ = {
    w: 701.43038525398, h: 1398.4213376899, round: 378, noise: 2, W: 1080, H: 1920,
    end: [553.247406005859, 1012.14482116699], start: [568.247406005859, 2674.75819396973], mid: [568.247406005859, 1840.14482116699],
    times: [0, 1.5682, 4.9049],
    off: [28.2474007120849, 516.111412006002], anchor: [28.2474060058594, 516.111328125],
    /* the effect as it is on the user's layer (index: value); 0001 Source Layer is set to the layer under it */
    fx: { "0002": 4, "0004": 350, "0005": 50, "0006": 1.3, "0009": 9, "0010": [200 / 255, 220 / 255, 1, 1], "0011": 0, "0012": 100,
        "0015": 196, "0016": 0, "0017": 8, "0018": -18, "0019": [1, 1, 1, 1], "0020": 50, "0023": 2, "0026": 0, "0027": 2,
        "0030": 0, "0031": 30, "0032": 12, "0033": 20 }
};
/* the effect can't be added: is the plug-in missing, or switched off in Effect > Manage Effects (it then leaves app.effects too)? */
UK.GL.lqHasFile = function (F, depth) {
    var list = F.getFiles(), i;
    if (!list) return false;
    for (i = 0; i < list.length; i++) {
        if (/^LiquidGlass\.(aex|plugin)$/i.test(decodeURI(list[i].name))) return true;
        if (list[i] instanceof Folder && !/\.plugin$/i.test(list[i].name) && depth < 4 && UK.GL.lqHasFile(list[i], depth + 1)) return true;
    }
    return false;
};
UK.GL.lqMissing = function () {
    var dir = UK.appFolder("Plug-ins");
    if (dir.exists && UK.GL.lqHasFile(dir, 0)) return "Liquid Glass is switched off in After Effects: Effect > Manage Effects, turn it on, then restart After Effects.";
    return "Liquid Glass needs the TFM Liquid Glass plug-in (not installed in this After Effects).";
};
/*  Where the glass goes and what it shows (2026-11-12, the user's Lurpak project: the glass came out over their logo and
    "black"). Measured (tools/ae-test/t_lq_lab.jsx): the plug-in follows the glass layer's own moves, but reads its Source
    Layer as if that layer stood untouched in the middle of the comp, its Position / Scale / Rotation ignored, so a moved
    photo showed another part of itself. So the glass now reads "Glass Source": a hidden comp-sized precomp at the bottom
    holding a copy of the picture whose transform follows the original by expression (toComp, so parents count too): the
    glass always shows what is really behind it, wherever the photo is moved or scaled.
    The picture = the first visible footage / precomp / solid under the glass (a shape only if there is none); never text,
    nulls, adjustment layers. The glass goes BEHIND the selected layers (a logo) when there is a picture under them, else
    over the selection; nothing selected = on top.                                                                      */
UK.GL.lqPic = function (L) {         // 2 = footage / precomp / solid, 1 = shape, 0 = not a picture
    try {
        if (L instanceof CameraLayer || L instanceof LightLayer || L instanceof TextLayer) return 0;
        if (!L.enabled || !L.hasVideo || L.adjustmentLayer) return 0;
        try { if (L.guideLayer) return 0; } catch (eg) { }
        if (L instanceof ShapeLayer) return 1;
        if (L.nullLayer || !L.source) return 0;
        return 2;
    } catch (e) { return 0; }
};
UK.GL.lqFind = function (comp, from) {   // the first picture under layer index 'from'
    var shape = null, i, k;
    for (i = from + 1; i <= comp.numLayers; i++) {         // (an earlier, switched-off Glass Source is no picture)
        k = UK.GL.lqPic(comp.layer(i));
        if (k === 2) return comp.layer(i);
        if (k === 1 && !shape) shape = comp.layer(i);
    }
    return shape;
};
UK.GL.lqSource = function (comp, pic) {
    var SC = app.project.items.addComp(UK.uniqueName("Glass Source"), comp.width, comp.height, comp.pixelAspect, comp.duration, comp.frameRate);
    try { SC.parentFolder = UK.folder("Glass"); } catch (e0) { }
    pic.copyToComp(SC);
    var D = SC.layer(1), T = function (p) { return D.property("ADBE Transform Group").property(p); };
    try { if (D.threeDLayer) D.threeDLayer = false; } catch (e1) { }
    try { D.enabled = true; } catch (e2) { }
    var q = function (s) { return String(s).replace(/\\/g, "\\\\").replace(/"/g, "\\\""); };
    var ref = "comp(\"" + q(comp.name) + "\").layer(\"" + q(pic.name) + "\")";
    var head = "var L = " + ref + ", a = L.transform.anchorPoint, o = L.toComp([a[0], a[1], 0]);\n";
    var uv = "var u = L.toComp([a[0] + 100, a[1], 0]), v = L.toComp([a[0], a[1] + 100, 0]);\nvar ux = u[0] - o[0], uy = u[1] - o[1], vx = v[0] - o[0], vy = v[1] - o[1];\n";
    T("ADBE Anchor Point").expression = "var a = " + ref + ".transform.anchorPoint;\n[a[0], a[1]]";
    T("ADBE Position").expression = head + "[o[0], o[1]]";
    T("ADBE Scale").expression = head + uv + "var sx = Math.sqrt(ux * ux + uy * uy), sy = Math.sqrt(vx * vx + vy * vy);\nif (ux * vy - uy * vx < 0) sy = -sy;\n[sx, sy]";
    T("ADBE Rotate Z").expression = head + uv + "Math.atan2(uy, ux) * 180 / Math.PI";
    T("ADBE Opacity").expression = ref + ".transform.opacity";
    var S = comp.layers.add(SC);
    S.moveToEnd();
    S.enabled = false;
    S.comment = "Ultimate Kit Liquid Glass: what the glass shows (a copy of '" + pic.name + "' that follows it). Leave it switched off at the bottom.";
    return S;
};
UK.GL.buildLiquid = function (comp, a) {
    var Q = UK.GL.LQ, W = comp.width, H = comp.height, k;
    var w = UK.clamp(Number(a.w) || Q.w, 2, W * 4), h = UK.clamp(Number(a.h) || Q.h, 2, H * 4);
    if (Math.abs(w - Q.w) < 0.01) w = Q.w;              // the panel's 701.43 / 1398.42 = the original's exact size
    if (Math.abs(h - Q.h) < 0.01) h = Q.h;
    var noise = UK.clamp(a.noise === undefined ? Q.noise : Number(a.noise), 0, 100);
    var sel = comp.selectedLayers, top = null, low = null, i;
    for (i = 0; i < sel.length; i++) {
        if (sel[i] instanceof CameraLayer || sel[i] instanceof LightLayer) continue;
        if (!top || sel[i].index < top.index) top = sel[i];
        if (!low || sel[i].index > low.index) low = sel[i];
    }
    var t0 = comp.time;
    var L = UK.shapeLayer(comp, UK.uniqueLayerName(comp, "Liquid Glass"));
    var g = UK.group(UK.root(L), "Rectangle 1"), v = UK.vecs(g);
    var R = UK.addRect(v, [w, h], [0, 0], Q.round, "Rectangle Path 1");
    var St = v.addProperty("ADBE Vector Graphic - Stroke"); St.name = "Stroke 1";
    St.property("ADBE Vector Stroke Color").setValue([1, 1, 1, 1]);
    St.property("ADBE Vector Stroke Width").setValue(13);
    St.enabled = false;
    UK.addFill(v, "#FFFFFF", 100, "Fill 1");
    UK.gtr(g, "ADBE Vector Position").setValue(Q.off);
    UK.anchor(L).setValue(Q.anchor);
    L.label = 8;
    try { L.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(1); } catch (e0) { }
    /* the rise: the original keys, placed for this comp (same offsets from the frame, scaled to its size) */
    var sx = W / Q.W, sy = H / Q.H, ex = Q.end[0] * sx, ey = Q.end[1] * sy;
    var st0 = [ex + (Q.start[0] - Q.end[0]) * sx, H + h / 2 + (Q.start[1] - Q.H - Q.h / 2)];
    var md = [st0[0], st0[1] + (ey - st0[1]) * (Q.mid[1] - Q.start[1]) / (Q.end[1] - Q.start[1])];
    var P = UK.pos(L), ks = [st0, md, [ex, ey]], B = KeyframeInterpolationType.BEZIER;
    for (i = 0; i < 3; i++) P.setValueAtTime(t0 + Q.times[i], [ks[i][0], ks[i][1]]);
    var ins = [33.3333, 100, 100], outs = [33.3333, 33.3333, 33.3333];
    for (i = 1; i <= 3; i++) {
        P.setInterpolationTypeAtKey(i, B, B);
        P.setTemporalEaseAtKey(i, [new KeyframeEase(0, ins[i - 1])], [new KeyframeEase(0, outs[i - 1])]);
        try { P.setSpatialAutoBezierAtKey(i, false); P.setSpatialContinuousAtKey(i, false); P.setSpatialTangentsAtKey(i, [0, 0], [0, 0]); } catch (e1) { }
    }
    /* Liquid Glass (third-party), then Noise */
    var fxp = L.property("ADBE Effect Parade");
    if (!fxp.canAddProperty("TFM LiquidGlass")) throw new Error(UK.GL.lqMissing());
    var E = fxp.addProperty("TFM LiquidGlass");
    for (k in Q.fx) { try { UK.safeSet(E.property("TFM LiquidGlass-" + k), Q.fx[k]); } catch (e2) { } }
    var N = UK.fx(L, "ADBE Noise2", "Noise");
    UK.safeSet(N.property("ADBE Noise2-0001"), noise);
    N.property("ADBE Noise2-0002").setValue(0);
    N.property("ADBE Noise2-0003").setValue(0);
    /* behind the selected layers when a picture lies under them, else over the selection (nothing selected: on top) */
    var pic = null;
    if (low) {
        pic = UK.GL.lqFind(comp, low.index);
        if (pic) L.moveAfter(low);
        else { L.moveBefore(top); pic = UK.GL.lqFind(comp, L.index); }
    } else pic = UK.GL.lqFind(comp, L.index);
    var S = pic ? UK.GL.lqSource(comp, pic) : null;
    if (S) {
        E = L.property("ADBE Effect Parade").property(1);       // (the effect again: moving layers invalidates the old reference)
        try { E.property("TFM LiquidGlass-0001").setValue(S.index); } catch (e3) { UK.GL._srcErr = String(e3); }
    }
    L.comment = "Ultimate Kit Liquid Glass: move / animate this layer freely. Size on Contents > Rectangle 1 > Rectangle Path 1; the glass on Effects > Liquid Glass, Noise on Effects > Noise. " +
        (S ? "It shows '" + pic.name + "' through '" + S.name + "' (bottom, switched off), which follows that layer wherever it moves." : "No picture under it: pick one in Liquid Glass > Source Layer.");
    return { base: L, controls: L };
};
UK.api.glass = function (a) {
    var comp = UK.comp(true), r = UK.atomic(comp, function () {      // (if / else: ExtendScript ran both arms of a nested ?:)
        if (a.id === "gl03") return UK.GL.buildLiquid(comp, a);
        if (a.id === "gl02") return UK.GL.buildBox(comp, a);
        return UK.GL.build(comp, a);
    });
    UK.selectOnly(comp, [r.controls]);
    return { panel: r.base.name, controls: r.controls.name };
};

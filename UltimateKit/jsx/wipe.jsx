/*  Ultimate Kit - Wipe Reveal: the selected layer is precomposed ("Wipe Reveal"); inside, a white solid
    "Wipe Matte" (a wipe mask -> Turbulent Displace ...) is the alpha matte of the picture. In the comp: a Null
    (Wipe slider, Direction, Radial, Color 1, Color 2), the precomp, and a copy of it below that runs ahead.
    UK.WIPE.build has wr03 Sparkle Wipe (a soft wavy edge, a glowing seam of light 2 frames ahead and a shape layer
    of fine four-point glints along the front) and wr04 Grid Wipe (16 cells across fading in by a feathered front,
    glowing grid lines 4 frames ahead). wr01 Pixel Wipe: UK.WIPE.buildPixel; wr02 Color Wipe: UK.WIPE.buildColor. */
UK.WIPE = { LEAD: 3, C1: "#B67CFF", C2: "#8E33FF" };
UK.WIPE.LOOKS = {
    wr01: { lead: 3, dur: 40, c1: "#B67CFF", c2: "#8E33FF" },
    wr03: { lead: 1, dur: 45, c1: "#FFF3DC", c2: "#F2C27B" },
    wr04: { lead: 4, dur: 45, c1: "#6EE7FF", c2: "#3B5BFF" }
};
UK.WIPE.q = function (s) { return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"'); };
/* the matte's mask follows the Null: Wipe 0..100 % along Direction (Linear Wipe's angles: 90 = left to right),
   or a circle from the centre when Radial is on */
UK.WIPE.maskExpr = function (compName, nullName) {
    return [
        'var N = comp("' + UK.WIPE.q(compName) + '").layer("' + UK.WIPE.q(nullName) + '");',
        'var s = clamp(N.effect("Wipe")(1), 0, 100) / 100, a = degreesToRadians(N.effect("Direction")(1));',
        'var w = thisComp.width, h = thisComp.height, cx = w / 2, cy = h / 2, pad = mask("Wipe").maskFeather[0] / 2;',   // a feathered edge starts and ends fully outside
        'if (N.effect("Radial")(1) == 1) {',
        '    var r = s * (Math.sqrt(w * w + h * h) / 2 + pad), k = r * 0.5523;',
        '    createPath([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]], [[-k, 0], [0, -k], [k, 0], [0, k]], [[k, 0], [0, k], [-k, 0], [0, -k]], true);',
        '} else {',
        '    var dx = Math.sin(a), dy = -Math.cos(a), R = (Math.abs(dx) * w + Math.abs(dy) * h) / 2 + pad, f = -R + 2 * R * s, L = w + h;',
        '    var b = -R - pad - 10;',
        '    createPath([[cx + dx * b + dy * L, cy + dy * b - dx * L], [cx + dx * f + dy * L, cy + dy * f - dx * L], [cx + dx * f - dy * L, cy + dy * f + dx * L], [cx + dx * b - dy * L, cy + dy * b + dx * L]], [], [], true);',
        '}'
    ].join("\n");
};
/*  Sparkle Wipe glints: one shape layer of fine four-point stars (a long thin star, a short one turned 45 deg and
    a small core) that pop in and out one by one along the wipe front, each at a new random place every cycle.
    Every glint reads the Null (Wipe, Direction, Radial, Color 1) in its expressions.                         */
UK.WIPE.GLINTS = 26;
UK.WIPE.glintExpr = function (nq, i, pad, what) {
    var head = 'var N = thisComp.layer("' + nq + '"), i = ' + i + ';\n' +
        'var s = clamp(N.effect("Wipe")(1), 0, 100) / 100, P = 0.5 + 0.45 * ((i * 0.618034) % 1), ph = (i * 0.381966) % 1, cyc = Math.floor(time / P + ph);\n';
    if (what === "pos") return head +
        'seedRandom(i * 97 + cyc, true);\n' +
        'var w = thisComp.width, h = thisComp.height, cx = w / 2, cy = h / 2, pad = ' + pad + ', u = random(-0.015, 0.06) * w, v = random(-0.5, 0.5), p;\n' +
        'if (N.effect("Radial")(1) == 1) { var r = s * (Math.sqrt(w * w + h * h) / 2 + pad) + u, t = random(0, Math.PI * 2); p = [cx + r * Math.cos(t), cy + r * Math.sin(t)]; }\n' +
        'else { var a = degreesToRadians(N.effect("Direction")(1)), dx = Math.sin(a), dy = -Math.cos(a), R = (Math.abs(dx) * w + Math.abs(dy) * h) / 2 + pad, f = -R + 2 * R * s + u, L = Math.abs(dy) * w + Math.abs(dx) * h;\n' +
        '    p = [cx + dx * f - dy * v * L, cy + dy * f + dx * v * L]; }\n' +
        'p - [w / 2, h / 2]';
    if (what === "scale") return head +
        'var k = (time / P + ph) % 1, tw = Math.pow(Math.sin(Math.PI * k), 4);\n' +
        'seedRandom(i * 97 + cyc, true); random(); random(); random();\n' +
        'var z = random(30, 100) * tw * clamp(s * 12, 0, 1) * clamp((1 - s) * 8, 0, 1) * thisComp.width / 1920;\n' +
        '[z, z]';
    return head + 'seedRandom(i * 31, true);\nrandom(-25, 25) + time * 12';    // rotation
};
UK.WIPE.glints = function (comp, above, N, pad, inP, outP, glow) {
    var G = comp.layers.addShape(), i, nq = UK.WIPE.q(N.name);
    G.name = UK.uniqueLayerName(comp, "Glints");
    G.moveBefore(above);
    G.inPoint = inP; G.outPoint = outP;
    G.label = 2;
    try { G.blendingMode = BlendingMode.ADD; } catch (e0) { }
    var root = G.property("ADBE Root Vectors Group");
    var colorX = 'thisComp.layer("' + nq + '").effect("Color 1")(1)';
    for (i = 1; i <= UK.WIPE.GLINTS; i++) {
        var grp = root.addProperty("ADBE Vector Group");
        grp.name = "Glint " + i;
        var V = grp.property("ADBE Vectors Group");
        V.addProperty("ADBE Vector Shape - Star");
        V.addProperty("ADBE Vector Shape - Star");
        V.addProperty("ADBE Vector Shape - Ellipse");
        V.addProperty("ADBE Vector Graphic - Fill");
        grp = root.property("Glint " + i); V = grp.property("ADBE Vectors Group");
        var star = function (k, outer, inner, rot) {
            var st = V.property(k);
            st.property("ADBE Vector Star Type").setValue(1);
            st.property("ADBE Vector Star Points").setValue(4);
            st.property("ADBE Vector Star Outer Radius").setValue(outer);
            st.property("ADBE Vector Star Inner Radius").setValue(inner);
            st.property("ADBE Vector Star Rotation").setValue(rot);
        };
        star(1, 46, 2.2, 0);       // the long rays
        star(2, 17, 1.6, 45);      // the short diagonal rays
        V.property(3).property("ADBE Vector Ellipse Size").setValue([7, 7]);
        var fill = V.property(4).property("ADBE Vector Fill Color");
        fill.setValue([1, 1, 1, 1]);
        fill.expression = colorX;
        var T = grp.property("ADBE Vector Transform Group");
        T.property("ADBE Vector Position").expression = UK.WIPE.glintExpr(nq, i, pad, "pos");
        T.property("ADBE Vector Scale").expression = UK.WIPE.glintExpr(nq, i, pad, "scale");
        T.property("ADBE Vector Rotation").expression = UK.WIPE.glintExpr(nq, i, pad, "rot");
    }
    var e;
    if (glow === "deep") {
        e = UK.fx(G, "PEDG2");
        e.property("PEDG2-0103").setValue(1); e.property("PEDG2-0024").setValue(1);
        e.property("PEDG2-0017").setValue(140); e.property("PEDG2-0018").setValue(0.7);
    } else if (glow === "ae") {
        e = UK.fx(G, "ADBE Glo2");
        e.property("ADBE Glo2-0002").setValue(50); e.property("ADBE Glo2-0003").setValue(Math.round(24 * comp.width / 1920)); e.property("ADBE Glo2-0004").setValue(1.2);
    }
    G.comment = "Ultimate Kit Sparkle Wipe glints: they follow the Wipe slider on " + N.name + "; colour = Color 1.";
    return G;
};
UK.WIPE.hasGlow = function () {
    try { var e = app.effects; for (var i = 0; i < e.length; i++) if (e[i].matchName === "PEDG2") return true; } catch (x) { }
    return false;
};
UK.WIPE.build = function (comp, L, a) {
    var id = a.id === "wr03" ? "wr03" : "wr04", K = UK.WIPE.LOOKS[id];
    var fd = comp.frameDuration, t0 = UK.snap(comp, Number(a.t0 !== undefined ? a.t0 : comp.time)), D = UK.clamp(Number(a.dur) || K.dur * fd, 2 * fd, 60);
    var c1 = a.c1 || K.c1, c2 = a.c2 || K.c2, lead = K.lead * fd, idx = L.index, inP = L.inPoint, outP = L.outPoint, name = L.name;
    UK._fd = fd;
    // 1) precompose (all attributes move inside); the precomp runs LEAD frames longer for the copy that runs ahead
    var P = comp.layers.precompose([idx], "Wipe Reveal", true);
    try { P.parentFolder = UK.folder("Wipe Reveal"); } catch (e0) { }
    P.duration = P.duration + lead;
    var R = comp.layer(idx);
    R.inPoint = inP; R.outPoint = outP;
    UK.centerAnchor(R);       // the anchor in the centre of the picture (nothing moves on screen)
    // 2) inside: the white matte solid
    var pic = P.layer(1);
    var M = P.layers.addSolid([1, 1, 1], "Wipe Matte", P.width, P.height, P.pixelAspect, P.duration);
    M.moveBefore(pic);
    var mk = M.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    mk.name = "Wipe";
    var turb = function (amount, size) {
        var t = UK.fx(M, "ADBE Turbulent Displace");
        t.property("ADBE Turbulent Displace-0001").setValue(1);      // Turbulent
        t.property("ADBE Turbulent Displace-0002").setValue(amount);
        t.property("ADBE Turbulent Displace-0003").setValue(size);
        t.property("ADBE Turbulent Displace-0004").setValue([P.width / 2, P.height / 2]);
        t.property("ADBE Turbulent Displace-0005").setValue(1);      // Complexity
        t.property("ADBE Turbulent Displace-0012").setValue(3);      // Pin All
    };
    var mosaic = function (hb, vb) {
        var m = UK.fx(M, "ADBE Mosaic");
        m.property("ADBE Mosaic-0001").setValue(hb);
        m.property("ADBE Mosaic-0002").setValue(vb);
        m.property("ADBE Mosaic-0003").setValue(1);   // Sharp Colors for the grid cells
    };
    var e, cells = Math.max(1, Math.round(16 * P.height / P.width));
    if (id === "wr03") {
        // a soft edge in long smooth waves
        mk.property("ADBE Mask Feather").setValue([P.width * 0.035, P.width * 0.035]);
        turb(70, 160);
    } else {
        // 16 cells across; a wide feather makes them fade in one after another, the turbulence mixes the order
        mk.property("ADBE Mask Feather").setValue([P.width * 0.22, P.width * 0.22]);
        turb(170, 110);
        mosaic(16, cells);
    }
    if (typeof pic.setTrackMatte === "function") pic.setTrackMatte(M, TrackMatteType.ALPHA);
    else pic.trackMatteType = TrackMatteType.ALPHA;
    M.enabled = false;
    // 3) the copy below, LEAD frames ahead (it shows just in front of the picture's edge)
    var U = R.duplicate();                       // the clean one, above
    R.startTime = R.startTime - lead;
    R.inPoint = inP; R.outPoint = outP;
    if (id === "wr03") R.name = UK.uniqueLayerName(comp, "Light Seam");
    // 4) the controls
    var N = comp.layers.addNull();
    for (var k = 1; k <= comp.numLayers; k++) if (k !== N.index && comp.layer(k).name === N.name) { N.name = UK.uniqueLayerName(comp, N.name); break; }
    N.label = 1;
    N.moveBefore(U);
    N.inPoint = inP; N.outPoint = outP;
    var w = UK.slider(N, "Wipe", 0);
    UK.anim(w, [[t0, 0], [t0 + D, 100]], "ease");
    UK.fx(N, "ADBE Angle Control", "Direction").property(1).setValue(a.angle === undefined ? 90 : Number(a.angle));
    UK.checkCtl(N, "Radial", !!a.radial);
    UK.colorCtl(N, "Color 1", c1);
    UK.colorCtl(N, "Color 2", c2);
    mk.property("ADBE Mask Shape").expression = UK.WIPE.maskExpr(comp.name, N.name);
    // 5) the coloured dots on the copy
    var nq = UK.WIPE.q(N.name);
    e = UK.fx(R, "ADBE Ramp");
    e.property("ADBE Ramp-0001").setValue([P.width / 2, 0]);
    e.property("ADBE Ramp-0002").setValue(UK.rgba(c1));
    e.property("ADBE Ramp-0003").setValue([P.width / 2, P.height]);
    e.property("ADBE Ramp-0004").setValue(UK.rgba(c2));
    e.property("ADBE Ramp-0005").setValue(1);
    e.property("ADBE Ramp-0002").expression = 'thisComp.layer("' + nq + '").effect("Color 1")(1)';
    e.property("ADBE Ramp-0004").expression = 'thisComp.layer("' + nq + '").effect("Color 2")(1)';
    var radius = 321, exposure = 1.06;
    if (id === "wr03") {
        // the copy is a soft seam of light (the ramp colours) just ahead of the picture
        try { R.blendingMode = BlendingMode.ADD; } catch (eb) { }
        radius = 220; exposure = 0.8;
    } else {
        // only the grid lines of the cells, in the ramp colours
        e = UK.fx(R, "ADBE Grid");
        e.property("ADBE Grid-0001").setValue([0, 0]);
        e.property("ADBE Grid-0002").setValue(3);                // Size From: Width & Height Sliders
        e.property("ADBE Grid-0004").setValue(P.width / 16);
        e.property("ADBE Grid-0005").setValue(P.height / cells);
        e.property("ADBE Grid-0006").setValue(Math.max(2, Math.round(P.width / 480)));   // Border
        e.property("ADBE Grid-0014").setValue(3);                // Blending Mode: Stencil Alpha
        radius = 140; exposure = 1.2;
    }
    var glow = a.glow !== false && UK.WIPE.hasGlow();
    if (glow) {
        try {
            e = UK.fx(R, "PEDG2");
            e.property("PEDG2-0103").setValue(1);       // Glow Mode: Exponential
            e.property("PEDG2-0024").setValue(1);       // Blend Mode: Screen
            e.property("PEDG2-0017").setValue(radius);
            e.property("PEDG2-0018").setValue(exposure);
        } catch (e3) { glow = false; }
    }
    if (!glow && a.glow !== false && id === "wr04") {
        // without Deep Glow 2 the lines still get AE's own Glow
        e = UK.fx(R, "ADBE Glo2");
        e.property("ADBE Glo2-0002").setValue(40);     // Threshold (0..255)
        e.property("ADBE Glo2-0003").setValue(45);
        e.property("ADBE Glo2-0004").setValue(1.4);
    }
    if (id === "wr03") {
        if (!glow && a.glow !== false) {
            e = UK.fx(R, "ADBE Glo2");
            e.property("ADBE Glo2-0002").setValue(60); e.property("ADBE Glo2-0003").setValue(Math.round(90 * P.width / 1920)); e.property("ADBE Glo2-0004").setValue(1.2);
        }
        UK.WIPE.glints(comp, U, N, P.width * 0.035 / 2, inP, outP, a.glow !== false ? (glow ? "deep" : "ae") : null);
    }
    U.comment = R.comment = "Ultimate Kit Wipe Reveal (" + name + "): the Wipe slider on " + N.name + " (keyframes), Direction, Radial, Color 1 / 2. The lower copy runs " + K.lead + " frames ahead.";
    return { controls: N, top: U, dots: R, comp: P, glow: glow };
};
/*  Pixel Wipe (rebuilt 2026-11-04 from the panel's preview, js/wipeprev.js).
      The picture: the clean precomp through a hard block matte. Mosaic with Sharp Colors makes every cell fully in or
        fully out, so the picture itself is never pixelated. The matte is a white solid with two masks driven by the Null:
        "Wipe" (the front) and "End" (the back, subtracted), broken up by two Turbulent Displace effects whose Evolution
        runs, so the edge keeps moving.
      The pixels: a copy under it, time remapped: Pixel Band frames AHEAD of the picture while it comes in and the same
        BEHIND it while it goes (the picture's own edge then leads, so the pixels swallow it and the layer below shows
        after them). The copy's look is a solid cell fill with flicker, one bright dot per cell and a wide glow.
      The Null: Wipe (2 keys), Wipe End (2 keys at the layer's end), End Reverse (off = the ending comes again from the
        same side, on = it goes back the way it arrived), Direction, Radial, Color 1, Color 2, Pixel Band, Flicker, Motion. */
UK.WIPE.PIXEL = { DUR: 40, BAND: 5, CELL: 19.2, PAD: 110, FILL: 0.86 };
UK.WIPE.pixelMask = function (main, top, nul, pad, which) {
    var q = UK.WIPE.q;
    return [
        'var C = comp("' + q(main) + '"), N = C.layer("' + q(nul) + '"), T = time + C.layer("' + q(top) + '").startTime;',
        'var si = clamp(N.effect("Wipe")(1).valueAtTime(T), 0, 100) / 100, so = clamp(N.effect("Wipe End")(1).valueAtTime(T), 0, 100) / 100;',
        'var rev = N.effect("End Reverse")(1).valueAtTime(T) == 1;',
        which === "in" ? 'var s = rev ? si * (1 - so) : si;' : 'var s = rev ? 0 : so;',
        'var a = degreesToRadians(N.effect("Direction")(1)), w = thisComp.width, h = thisComp.height, cx = w / 2, cy = h / 2, pad = ' + pad + ';',
        'if (N.effect("Radial")(1) == 1) {',
        '    var r = s * (Math.sqrt(w * w + h * h) / 2 + pad), k = r * 0.5523;',
        '    createPath([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]], [[-k, 0], [0, -k], [k, 0], [0, k]], [[k, 0], [0, k], [-k, 0], [0, -k]], true);',
        '} else {',
        '    var dx = Math.sin(a), dy = -Math.cos(a), R = (Math.abs(dx) * w + Math.abs(dy) * h) / 2 + pad, f = -R + 2 * R * s, L = w + h, b = -R - 10;',
        '    createPath([[cx + dx * b + dy * L, cy + dy * b - dx * L], [cx + dx * f + dy * L, cy + dy * f - dx * L], [cx + dx * f - dy * L, cy + dy * f + dx * L], [cx + dx * b - dy * L, cy + dy * b + dx * L]], [], [], true);',
        '}'
    ].join("\n");
};
/* the copy's source time: ahead while the picture comes in (from nothing at the layer's start), behind during the ending
   (down to nothing at the ending's last key, so the pixels are gone exactly there) */
UK.WIPE.pixelTime = function (nul) {
    return [
        'var N = thisComp.layer("' + UK.WIPE.q(nul) + '"), w = N.effect("Wipe")(1), e = N.effect("Wipe End")(1);',
        'var L = clamp(N.effect("Pixel Band")(1), 0, 30) * thisComp.frameDuration;',
        'var I = w.numKeys ? w.key(w.numKeys).time : inPoint, O = e.numKeys ? e.key(1).time : outPoint + 1000, E = e.numKeys ? e.key(e.numKeys).time : outPoint + 1000;',
        'var d = time < (I + O) / 2 ? Math.min(L, Math.max(time - inPoint, 0)) : -Math.min(L, Math.max(E - time, 0));',
        'time - startTime + d'
    ].join("\n");
};
UK.WIPE.freeName = function (comp, base, self) {
    var name = base, n = 1, used = true, k;
    while (used) {
        used = false;
        for (k = 1; k <= comp.numLayers; k++) if (comp.layer(k).name === name && (!self || comp.layer(k).index !== self.index)) { used = true; break; }
        if (used) { n++; name = base + " " + n; }
    }
    return name;
};
UK.WIPE.buildPixel = function (comp, L, a) {
    var K = UK.WIPE.PIXEL, fd = comp.frameDuration, idx = L.index, inP = L.inPoint, outP = L.outPoint, name = L.name, q = UK.WIPE.q;
    var t0 = UK.snap(comp, Number(a.t0 !== undefined ? a.t0 : comp.time));
    if (t0 < inP || t0 >= outP - fd) t0 = UK.snap(comp, inP);
    var D = UK.clamp(Number(a.dur) || K.DUR * fd, 2 * fd, 60), c1 = a.c1 || UK.WIPE.LOOKS.wr01.c1, c2 = a.c2 || UK.WIPE.LOOKS.wr01.c2;
    var ending = a.ending === "same" || a.ending === "back" ? a.ending : "off";
    UK._fd = fd;
    // 1) precompose (all attributes move inside); the precomp runs a second longer for the copy that reads ahead
    var P = comp.layers.precompose([idx], "Wipe Reveal", true);
    try { P.parentFolder = UK.folder("Wipe Reveal"); } catch (e0) { }
    P.duration = P.duration + 1;
    var R = comp.layer(idx);
    R.inPoint = inP; R.outPoint = outP;
    UK.centerAnchor(R);       // the anchor in the centre of the picture (nothing moves on screen)
    var U = R.duplicate();    // the clean one, above
    R.name = UK.WIPE.freeName(comp, "Pixels", R);
    U.name = UK.WIPE.freeName(comp, "Wipe Reveal", U);
    R.label = 11;
    // 2) the controls
    var N = comp.layers.addNull();
    N.name = UK.WIPE.freeName(comp, "Pixel Wipe", N);
    N.label = 1;
    N.moveBefore(U);
    N.inPoint = inP; N.outPoint = outP;
    UK.anim(UK.slider(N, "Wipe", 0), [[t0, 0], [t0 + D, 100]], "ease");
    var we = UK.slider(N, "Wipe End", 0), t1 = UK.snap(comp, outP - fd), e0 = UK.snap(comp, Math.max(t0 + D, t1 - D)), hasEnd = false;
    if (ending !== "off" && t1 - e0 >= 2 * fd) { UK.anim(we, [[e0, 0], [t1, 100]], "ease"); hasEnd = true; }
    UK.checkCtl(N, "End Reverse", ending === "back");
    UK.fx(N, "ADBE Angle Control", "Direction").property(1).setValue(a.angle === undefined ? 90 : Number(a.angle));
    UK.checkCtl(N, "Radial", !!a.radial);
    UK.colorCtl(N, "Color 1", c1);
    UK.colorCtl(N, "Color 2", c2);
    UK.slider(N, "Pixel Band", K.BAND);
    UK.slider(N, "Flicker", 100);
    UK.slider(N, "Motion", 100);
    var nq = 'thisComp.layer("' + q(N.name) + '")', cq = 'comp("' + q(comp.name) + '").layer("' + q(N.name) + '")';
    // 3) inside the precomp: the white matte solid
    var W = P.width, H = P.height, s = Math.min(W, H) / 1080, hb = Math.max(1, Math.round(W / (K.CELL * s))), vb = Math.max(1, Math.round(H / (K.CELL * s)));
    var pic = P.layer(1);
    var M = P.layers.addSolid([1, 1, 1], "Wipe Matte", W, H, P.pixelAspect, P.duration);
    M.moveBefore(pic);
    M.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").name = "Wipe";
    var mEnd = M.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    mEnd.name = "End";
    mEnd.maskMode = MaskMode.SUBTRACT;
    var pad = Math.round(K.PAD * s);
    M.property("ADBE Mask Parade").property("Wipe").property("ADBE Mask Shape").expression = UK.WIPE.pixelMask(comp.name, U.name, N.name, pad, "in");
    M.property("ADBE Mask Parade").property("End").property("ADBE Mask Shape").expression = UK.WIPE.pixelMask(comp.name, U.name, N.name, pad, "out");
    var turb = function (amount, size, rate, seed) {
        var t = UK.fx(M, "ADBE Turbulent Displace");
        t.property("ADBE Turbulent Displace-0001").setValue(1);      // Turbulent
        t.property("ADBE Turbulent Displace-0002").setValue(amount);
        t.property("ADBE Turbulent Displace-0003").setValue(size * s);
        t.property("ADBE Turbulent Displace-0004").setValue([W / 2, H / 2]);
        t.property("ADBE Turbulent Displace-0005").setValue(1);      // Complexity
        t.property("ADBE Turbulent Displace-0006").expression = 'time * ' + rate + ' * ' + cq + '.effect("Motion")(1) / 100';   // Evolution
        t.property("ADBE Turbulent Displace-0010").setValue(seed);   // Random Seed
        t.property("ADBE Turbulent Displace-0012").setValue(3);      // Pin All
    };
    turb(90, 40, 360, 11);
    turb(60, 15, 520, 37);
    var m0 = UK.fx(M, "ADBE Mosaic");
    m0.property("ADBE Mosaic-0001").setValue(hb);
    m0.property("ADBE Mosaic-0002").setValue(vb);
    m0.property("ADBE Mosaic-0003").setValue(1);                     // Sharp Colors: a cell is in or out
    var lv = UK.fx(M, "ADBE Pro Levels2", "Hard Cells");             // no half transparent cell either (a soft edge under a cell's middle)
    lv.property("ADBE Pro Levels2-0032").setValue(0.49);
    lv.property("ADBE Pro Levels2-0033").setValue(0.51);
    if (typeof pic.setTrackMatte === "function") pic.setTrackMatte(M, TrackMatteType.ALPHA);
    else pic.trackMatteType = TrackMatteType.ALPHA;
    M.enabled = false;
    // 4) the copy: ahead / behind in time
    R.timeRemapEnabled = true;
    R.inPoint = inP; R.outPoint = outP;
    R.property("ADBE Time Remapping").expression = UK.WIPE.pixelTime(N.name);
    // 5) the glow under the cells, on a copy (the cells stay crisp, it only spills around them, as in the preview)
    var glow = false, glowLayer = function (nm, deep, radius, amount) {
        var G = R.duplicate();
        G.name = UK.WIPE.freeName(comp, nm, G);
        G.moveAfter(R);
        G.label = 11;
        try { G.blendingMode = BlendingMode.SCREEN; } catch (eb) { }
        var r = UK.fx(G, "ADBE Ramp");
        r.property("ADBE Ramp-0001").setValue([W / 2, 0]);
        r.property("ADBE Ramp-0002").setValue(UK.rgba(c1));
        r.property("ADBE Ramp-0003").setValue([W / 2, H]);
        r.property("ADBE Ramp-0004").setValue(UK.rgba(c2));
        r.property("ADBE Ramp-0005").setValue(1);
        r.property("ADBE Ramp-0002").expression = nq + '.effect("Color 1")(1)';
        r.property("ADBE Ramp-0004").expression = nq + '.effect("Color 2")(1)';
        if (deep) {
            var d = UK.fx(G, "PEDG2");
            d.property("PEDG2-0103").setValue(1);       // Glow Mode: Exponential
            d.property("PEDG2-0024").setValue(1);       // Blend Mode: Screen
            d.property("PEDG2-0017").setValue(radius * s);
            d.property("PEDG2-0018").setValue(amount);
        } else {
            var b = UK.fx(G, "ADBE Gaussian Blur 2");
            b.property("ADBE Gaussian Blur 2-0001").setValue(radius * s);
            G.property("ADBE Transform Group").property("ADBE Opacity").setValue(amount);
        }
        // only while the pixels run: a layer smaller than the frame must not keep a halo in between
        G.property("ADBE Transform Group").property("ADBE Opacity").expression = [
            'var N = ' + nq + ', L = clamp(N.effect("Pixel Band")(1), 0, 30) * thisComp.frameDuration, w = N.effect("Wipe")(1), e = N.effect("Wipe End")(1);',
            'value * Math.max(clamp((100 - w.valueAtTime(time + L)) / 10, 0, 1), clamp(e.valueAtTime(time + L) / 10, 0, 1))'
        ].join("\n");
        G.comment = "Ultimate Kit Pixel Wipe: the glow of the pixels above.";
        return G;
    };
    if (a.glow !== false) {
        var deep = UK.WIPE.hasGlow();
        if (deep) { try { glowLayer("Pixels Glow", true, 420, 0.3); glow = true; } catch (e3) { deep = false; } }
        if (!deep) { glowLayer("Pixels Glow Wide", false, 115, 55); glowLayer("Pixels Glow Near", false, 23, 45); }
    }
    // 6) the look of the cells: the fill, per cell flicker, one bright dot per cell, the source's alpha back on
    var scaled = function (ctl) { return 'var c = ' + nq + '.effect("' + ctl + '")(1), k = ' + K.FILL + ';\n[c[0] * k, c[1] * k, c[2] * k, 1]'; };
    var e = UK.fx(R, "ADBE Solid Composite", "Whole Frame");         // the fill first covers the whole frame (Mosaic moves its samples by a cell; "Cells Alpha" below cuts it to the matte)
    e = UK.fx(R, "ADBE Ramp");
    e.property("ADBE Ramp-0001").setValue([W / 2, 0]);
    e.property("ADBE Ramp-0002").setValue(UK.rgba(c1));
    e.property("ADBE Ramp-0003").setValue([W / 2, H]);
    e.property("ADBE Ramp-0004").setValue(UK.rgba(c2));
    e.property("ADBE Ramp-0005").setValue(1);
    e.property("ADBE Ramp-0002").expression = scaled("Color 1");
    e.property("ADBE Ramp-0004").expression = scaled("Color 2");
    e = UK.fx(R, "ADBE Fractal Noise", "Flicker");
    e.property("ADBE Fractal Noise-0004").setValue(75);              // Contrast
    e.property("ADBE Fractal Noise-0005").setValue(22);              // Brightness
    e.property("ADBE Fractal Noise-0006").setValue(1);               // Overflow: Clip
    e.property("ADBE Fractal Noise-0010").setValue(15 * s);          // Scale: about a cell or less
    e.property("ADBE Fractal Noise-0015").setValue(1);               // Complexity
    e.property("ADBE Fractal Noise-0023").expression = 'time * 900 * ' + nq + '.effect("Motion")(1) / 100';
    e.property("ADBE Fractal Noise-0029").expression = 'clamp(' + nq + '.effect("Flicker")(1), 0, 100)';
    e.property("ADBE Fractal Noise-0030").setValue(5);               // Blending Mode: Multiply
    e = UK.fx(R, "ADBE Mosaic", "Cells");
    e.property("ADBE Mosaic-0001").setValue(hb);
    e.property("ADBE Mosaic-0002").setValue(vb);
    e.property("ADBE Mosaic-0003").setValue(1);
    e = UK.fx(R, "ADBE Grid", "Dots");
    e.property("ADBE Grid-0001").setValue([0, 0]);
    e.property("ADBE Grid-0002").setValue(3);                        // Size From: Width & Height Sliders
    e.property("ADBE Grid-0004").setValue(W / hb);
    e.property("ADBE Grid-0005").setValue(H / vb);
    e.property("ADBE Grid-0006").setValue(20 * s);                   // Border: leaves a small middle in each cell ...
    e.property("ADBE Grid-0008").setValue(4 * s);                    // ... with soft edges: a round dot
    e.property("ADBE Grid-0009").setValue(4 * s);
    e.property("ADBE Grid-0011").setValue(1);                        // Invert Grid: the middles
    e.property("ADBE Grid-0012").setValue([1, 1, 1, 1]);
    e.property("ADBE Grid-0013").setValue(90);
    e.property("ADBE Grid-0014").setValue(2);                        // Blending Mode: Normal
    e = UK.fx(R, "ADBE Set Matte3", "Cells Alpha");
    e.property("ADBE Set Matte3-0001").setValue(R.index);
    e.property("ADBE Set Matte3-0002").setValue(4);                  // Alpha
    U.comment = R.comment = "Ultimate Kit Pixel Wipe (" + name + "): the Wipe and Wipe End keys on " + N.name + "; End Reverse: off = the ending comes from the same side again, on = it goes back the way it arrived.";
    return { controls: N, top: U, dots: R, comp: P, glow: glow, ending: hasEnd };
};
/*  Color Wipe: a solid with a two-colour Gradient Ramp covers the layer and a soft Linear Wipe takes it away.
    The Null: Progress (0 -> 100 over 30 f, Easy Ease), Angle (90 = left to right), Color 1, Color 2.          */
UK.WIPE.COLOR = { C1: "#FFFFFF", C2: "#BE11FF", FEATHER: 0.27 };
UK.WIPE.buildColor = function (comp, L, a) {
    var fd = comp.frameDuration, t0 = UK.snap(comp, Number(a.t0 !== undefined ? a.t0 : comp.time)), D = UK.clamp(Number(a.dur) || 30 * fd, 2 * fd, 60);
    var K = UK.WIPE.COLOR, c1 = a.c1 || K.C1, c2 = a.c2 || K.C2, W = comp.width, H = comp.height;
    UK._fd = fd;
    var S = comp.layers.addSolid([1, 1, 1], UK.uniqueLayerName(comp, "Color Wipe - " + L.name), W, H, comp.pixelAspect, comp.duration);
    S.moveBefore(L);
    S.inPoint = L.inPoint; S.outPoint = L.outPoint;
    S.label = 11;
    var N = comp.layers.addNull();
    for (var k = 1; k <= comp.numLayers; k++) if (k !== N.index && comp.layer(k).name === N.name) { N.name = UK.uniqueLayerName(comp, N.name); break; }
    N.label = 1;
    N.moveBefore(S);
    N.inPoint = L.inPoint; N.outPoint = L.outPoint;
    UK.anim(UK.slider(N, "Progress", 0), [[t0, 0], [t0 + D, 100]], "ease");
    UK.fx(N, "ADBE Angle Control", "Angle").property(1).setValue(a.angle === undefined ? 90 : Number(a.angle));
    UK.colorCtl(N, "Color 1", c1);
    UK.colorCtl(N, "Color 2", c2);
    var nq = 'thisComp.layer("' + UK.WIPE.q(N.name) + '")';
    // the ramp runs along Angle across the whole frame: Color 1 where the wipe starts, Color 2 where it ends
    var ends = function (sign) {
        return 'var a = degreesToRadians(' + nq + '.effect("Angle")(1)), dx = Math.sin(a), dy = -Math.cos(a), R = (Math.abs(dx) * width + Math.abs(dy) * height) / 2;\n' +
            '[width / 2 ' + sign + ' dx * R, height / 2 ' + sign + ' dy * R]';
    };
    var e = UK.fx(S, "ADBE Ramp");
    e.property("ADBE Ramp-0001").setValue([0, H / 2]);
    e.property("ADBE Ramp-0002").setValue(UK.rgba(c1));
    e.property("ADBE Ramp-0003").setValue([W, H / 2]);
    e.property("ADBE Ramp-0004").setValue(UK.rgba(c2));
    e.property("ADBE Ramp-0005").setValue(1);
    e.property("ADBE Ramp-0001").expression = ends("-");
    e.property("ADBE Ramp-0003").expression = ends("+");
    e.property("ADBE Ramp-0002").expression = nq + '.effect("Color 1")(1)';
    e.property("ADBE Ramp-0004").expression = nq + '.effect("Color 2")(1)';
    e = UK.fx(S, "ADBE Linear Wipe");
    e.property("ADBE Linear Wipe-0002").setValue(a.angle === undefined ? 90 : Number(a.angle));
    e.property("ADBE Linear Wipe-0003").setValue(Math.round(W * K.FEATHER));
    e.property("ADBE Linear Wipe-0001").expression = 'clamp(' + nq + '.effect("Progress")(1), 0, 100)';
    e.property("ADBE Linear Wipe-0002").expression = nq + '.effect("Angle")(1)';
    S.comment = "Ultimate Kit Color Wipe (" + L.name + "): Progress keyframes, Angle, Color 1 / 2 on " + N.name + ".";
    return { controls: N, top: S };
};
UK.api.wipeReveal = function (a) {
    var comp = UK.comp(false), sel = comp.selectedLayers;
    if (sel.length !== 1) throw new Error("Select one layer (a photo, a video or a precomp).");
    var L = sel[0];
    if (!(L instanceof AVLayer) || L.nullLayer || L.adjustmentLayer) throw new Error("Select a photo, video, precomp, text or shape layer.");
    if (a.id === "wr02") {
        var c = UK.WIPE.buildColor(comp, L, a);
        UK.selectOnly(comp, [c.controls]);
        return { name: c.top.name, controls: c.controls.name, glow: false };
    }
    var r = a.id === "wr03" || a.id === "wr04" ? UK.WIPE.build(comp, L, a) : UK.WIPE.buildPixel(comp, L, a);
    UK.selectOnly(comp, [r.controls]);
    return { name: r.top.name, controls: r.controls.name, glow: r.glow, ending: r.ending };
};

/*  Ultimate Kit - Wipe Reveal: the selected layer is precomposed ("Wipe Reveal"); inside, a white solid
    "Wipe Matte" (a wipe mask -> Turbulent Displace -> Mosaic) is the alpha matte of the picture. In the comp:
    a Null (Wipe slider, Direction, Radial, Color 1, Color 2), the precomp, and a copy of it below, 3 frames
    ahead, turned into glowing coloured dots (Gradient Ramp -> CC Ball Action -> Deep Glow 2 when installed).
    The same rig has two more looks: wr03 Sparkle Wipe (a soft wavy edge, a glowing seam of light 2 frames
    ahead and a shape layer of fine four-point glints along the front) and wr04 Grid Wipe (16 cells across fading in by a feathered front, glowing grid lines
    4 frames ahead).                                                                                        */
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
    var id = UK.WIPE.LOOKS[a.id] ? a.id : "wr01", K = UK.WIPE.LOOKS[id];
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
        m.property("ADBE Mosaic-0003").setValue(id === "wr04" ? 1 : 0);   // Sharp Colors for the grid cells
    };
    var e, cells = Math.max(1, Math.round(16 * P.height / P.width));
    if (id === "wr03") {
        // a soft edge in long smooth waves
        mk.property("ADBE Mask Feather").setValue([P.width * 0.035, P.width * 0.035]);
        turb(70, 160);
    } else if (id === "wr04") {
        // 16 cells across; a wide feather makes them fade in one after another, the turbulence mixes the order
        mk.property("ADBE Mask Feather").setValue([P.width * 0.22, P.width * 0.22]);
        turb(170, 110);
        mosaic(16, cells);
    } else {
        turb(200, 20);
        mosaic(100, 50);
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
    var balls = function (spacing, size, scatter) {
        var b = UK.fx(R, "CC Ball Action");
        b.property("CC Ball Action-0006").setValue(spacing);   // Grid Spacing
        b.property("CC Ball Action-0007").setValue(size);      // Ball Size
        if (scatter) b.property("CC Ball Action-0001").setValue(scatter);
        try { b.property("CC Ball Action-0009").setValue(2); } catch (e1) { }   // Coloring: Medium
        try { b.property("CC Ball Action-0010").setValue(-75); } catch (e2) { } // Shading
    };
    var radius = 321, exposure = 1.06;
    if (id === "wr03") {
        // the copy is a soft seam of light (the ramp colours) just ahead of the picture
        try { R.blendingMode = BlendingMode.ADD; } catch (eb) { }
        radius = 220; exposure = 0.8;
    } else if (id === "wr04") {
        // only the grid lines of the cells, in the ramp colours
        e = UK.fx(R, "ADBE Grid");
        e.property("ADBE Grid-0001").setValue([0, 0]);
        e.property("ADBE Grid-0002").setValue(3);                // Size From: Width & Height Sliders
        e.property("ADBE Grid-0004").setValue(P.width / 16);
        e.property("ADBE Grid-0005").setValue(P.height / cells);
        e.property("ADBE Grid-0006").setValue(Math.max(2, Math.round(P.width / 480)));   // Border
        e.property("ADBE Grid-0014").setValue(3);                // Blending Mode: Stencil Alpha
        radius = 140; exposure = 1.2;
    } else balls(5, 19);
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
    var r = UK.WIPE.build(comp, L, a);
    UK.selectOnly(comp, [r.controls]);
    return { name: r.top.name, controls: r.controls.name, glow: r.glow };
};

/*  Ultimate Kit - BG Overlay (shared/bgov.js): the chosen look as one precomp "BG Overlay - <look>", over the selected
    layer (the background: the graphics go behind the cut-out speaker) or on top:
      Overlay Controls   null: Accent, Line (colours of every element), Amount (% of every element's opacity)
      the elements       one shape layer each, named, with clean keyframes and speed ramps (Position, Scale,
                         Rotation, Opacity, Trim Paths), Repeaters for rows, Gaussian Blur for soft light
      Text - ...         (optional) a sample text layout that fits the look, to retype or delete
    Starts at the time indicator.                                                                              */
UK.BO = {};
UK.BO.curves = function (K) {          // the speed ramp of every move (key i to key i + 1)
    var c = [];
    for (var i = 0; i < K.length - 1; i++) { var e = K[i][2] || "smooth"; c.push(e === "linear" ? "linear" : (UK_BGOV.EASES[e] || UK_BGOV.EASES.smooth)); }
    return c;
};
UK.BO.keys = function (prop, K, map) {
    if (!K || !K.length) return;
    var ks = [];
    for (var i = 0; i < K.length; i++) ks.push([K[i][0], map ? map(K[i][1]) : K[i][1]]);
    if (ks.length === 1) { prop.setValue(ks[0][1]); return; }
    UK.anim(prop, ks, UK.BO.curves(K));
};
UK.BO.color = function (prop, col, CT) {
    if (col === "A") { prop.expression = CT + 'C.effect("Accent")(1)'; return; }
    if (col === "L") { prop.expression = CT + 'C.effect("Line")(1)'; return; }
    prop.setValue(UK.rgba(col === "K" ? "#000000" : col));
};
UK.BO.layer = function (Cc, e, c, CT) {
    var W = Cc.width, H = Cc.height, K = e.K || {}, L, k;
    if (e.k === "tone") {
        L = Cc.layers.addSolid([1, 1, 1], e.n, W, H, Cc.pixelAspect);
        L.adjustmentLayer = true;
        var T = UK.fx(L, "ADBE Tint", "Black & White");
        try { T.property("ADBE Tint-0003").setValue(100); } catch (e0) { }
    } else {
        L = UK.shapeLayer(Cc, e.n);
        var g = UK.group(UK.root(L), "Shape"), v = UK.vecs(g);
        if (e.k === "rect") UK.addRect(v, [UK.round(e.w, 2), UK.round(e.h, 2)], [0, 0], e.r || 0, "Rect");
        else if (e.k === "ellipse") { var el = UK.addEllipse(v, [UK.round(e.w, 2), UK.round(e.h, 2)], [0, 0], "Ellipse"); }
        else { var pts = []; for (k = 0; k < e.pts.length; k++) pts.push([UK.round(e.pts[k][0], 2), UK.round(e.pts[k][1], 2)]); UK.addPath(v, pts, null, null, !!e.closed, "Path"); }
        if (K.te || K.ts) {
            var tr = v.addProperty("ADBE Vector Filter - Trim"); tr.name = "Trim";
            tr.property("ADBE Vector Trim End").setValue(100);
            if (K.te) UK.BO.keys(tr.property("ADBE Vector Trim End"), K.te);
            if (K.ts) UK.BO.keys(tr.property("ADBE Vector Trim Start"), K.ts);
        }
        if (e.stroke) {
            var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.name = "Stroke";
            st.property("ADBE Vector Stroke Width").setValue(e.sw || 2);
            UK.BO.color(st.property("ADBE Vector Stroke Color"), e.stroke, CT);
        }
        if (e.fill) {
            var f = UK.addFill(v, "#FFFFFF", e.fo === undefined ? 100 : e.fo, "Fill");
            UK.BO.color(f.property("ADBE Vector Fill Color"), e.fill, CT);
        }
        if (e.rep) {
            var rp = v.addProperty("ADBE Vector Filter - Repeater"); rp.name = "Repeater";
            rp.property("ADBE Vector Repeater Copies").setValue(e.rep.n);
            rp.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([e.rep.dx, e.rep.dy]);
        }
        UK.anchor(L).setValue(e.a || [0, 0]);
        if (K.p) UK.BO.keys(UK.pos(L), K.p); else UK.pos(L).setValue(e.p || [0, 0]);
        if (K.s) UK.BO.keys(UK.scale(L), K.s);
        if (K.r) UK.BO.keys(UK.rot(L), K.r);
        if (e.blur) { var B = UK.fx(L, "ADBE Gaussian Blur 2", "Soft"); UK.safeSet(B.property("ADBE Gaussian Blur 2-0001"), UK.round(e.blur, 1)); try { B.property("ADBE Gaussian Blur 2-0003").setValue(0); } catch (e1) { } }
        L.motionBlur = true;
    }
    if (K.o) UK.BO.keys(UK.opac(L), K.o); else UK.opac(L).setValue(e.o === undefined ? 100 : e.o);
    UK.opac(L).expression = CT + 'value * C.effect("Amount")(1) / 100';
    var bm = { screen: BlendingMode.SCREEN, add: BlendingMode.ADD, multiply: BlendingMode.MULTIPLY, overlay: BlendingMode.OVERLAY };
    if (e.blend && bm[e.blend]) L.blendingMode = bm[e.blend];
    L.startTime = 0; L.inPoint = 0; L.outPoint = Cc.duration;
    return L;
};
UK.BO.text = function (Cc, T, c) {
    var W = Cc.width, H = Cc.height, list = UK_BGOV.textKeys(T, W, H, c), made = [], i;
    for (i = 0; i < list.length; i++) {
        var w = list[i], L = UK.addText(Cc, w.word, { size: Math.round(w.size), color: "#FFFFFF", tracking: 0, name: "Text - " + w.word });
        var K = w.K, P = L.property("ADBE Transform Group").property("ADBE Position");
        if (K.z) {                  // a 3D word: X fixed, Y and Z each keyed (separate dimensions)
            L.threeDLayer = true;
            P.dimensionsSeparated = true;
            var tg = L.property("ADBE Transform Group");
            tg.property("ADBE Position_0").setValue(K.p[K.p.length - 1][1][0]);
            UK.BO.keys(tg.property("ADBE Position_1"), K.p, function (v) { return v[1]; });
            UK.BO.keys(tg.property("ADBE Position_2"), K.z);
        } else UK.BO.keys(P, K.p);
        if (K.s) UK.BO.keys(UK.scale(L), K.s);
        UK.BO.keys(UK.opac(L), K.o);
        if (w.shadow) {
            var S = UK.fx(L, "ADBE Drop Shadow", "Shadow");
            UK.safeSet(S.property("ADBE Drop Shadow-0002"), S.property("ADBE Drop Shadow-0002").maxValue > 100 ? 0.55 * 255 : 55);
            UK.safeSet(S.property("ADBE Drop Shadow-0004"), Math.round(w.size * 0.1));
            UK.safeSet(S.property("ADBE Drop Shadow-0005"), Math.round(w.size * 0.25));
        }
        L.motionBlur = true;
        L.startTime = 0; L.inPoint = 0; L.outPoint = Cc.duration;
        made.push(L);
    }
    return made;
};
UK.api.bgOverlay = function (a) {
    var comp = UK.comp(true), D = UK_BGOV.DEF, c = {}, k, i;
    for (k in D) c[k] = D[k];
    for (k in a) if (D[k] !== undefined && a[k] !== null && a[k] !== undefined) c[k] = (k === "accent" || k === "line") ? String(a[k]) : (k === "text" ? !!a[k] : Number(a[k]));
    c.dur = Math.max(1, c.dur);
    var look = UK_BGOV.find(a.id), W = comp.width, H = comp.height, t0 = comp.time;
    var spec = UK_BGOV.build(look.id, W, H, c);
    var sel = comp.selectedLayers, under = null;
    for (i = 0; i < sel.length; i++) if (!under || sel[i].index < under.index) under = sel[i];
    var Cc = app.project.items.addComp(UK.uniqueName("BG Overlay - " + look.name), W, H, comp.pixelAspect, c.dur, comp.frameRate);
    try { Cc.parentFolder = UK.folder("BG Overlay"); } catch (e0) { }
    Cc.motionBlur = true;
    UK._fd = Cc.frameDuration;
    var N = Cc.layers.addNull(); N.name = "Overlay Controls"; N.label = 2;
    UK.colorCtl(N, "Accent", c.accent); UK.colorCtl(N, "Line", c.line); UK.slider(N, "Amount", c.amount);
    N.inPoint = 0; N.outPoint = Cc.duration;
    var CT = 'var C = thisComp.layer("Overlay Controls");\n';
    var tones = [];                       // (a "tone" works on the background: it goes into the comp, under the precomp)
    for (i = 0; i < spec.els.length; i++) { if (spec.els[i].k === "tone") tones.push(spec.els[i]); else UK.BO.layer(Cc, spec.els[i], c, CT); }
    if (c.text && spec.T) UK.BO.text(Cc, spec.T, c);
    N.moveToBeginning();
    N.comment = "Ultimate Kit BG Overlay (" + look.name + "): Accent / Line colours and Amount for every layer here; the motion is in each layer's keyframes.";
    var PL = comp.layers.add(Cc);
    if (under) PL.moveBefore(under);
    PL.startTime = t0; PL.inPoint = t0; PL.outPoint = Math.min(comp.duration, t0 + c.dur);
    PL.comment = "Ultimate Kit BG Overlay: " + look.name + ". Put it behind the cut-out speaker; everything is inside (colours on 'Overlay Controls').";
    for (i = 0; i < tones.length; i++) {
        var e = tones[i], A = comp.layers.addSolid([1, 1, 1], UK.uniqueLayerName(comp, Cc.name + " " + e.n), W, H, comp.pixelAspect);
        A.adjustmentLayer = true; A.label = 2;
        A.moveAfter(PL);
        var Tn = UK.fx(A, "ADBE Tint", "Black & White");
        try { Tn.property("ADBE Tint-0003").setValue(100); } catch (e2) { }
        var ko = []; for (k = 0; k < e.K.o.length; k++) ko.push([e.K.o[k][0] + t0, e.K.o[k][1], e.K.o[k][2]]);
        UK.BO.keys(UK.opac(A), ko);
        UK.opac(A).expression = 'var C = comp("' + UK.WIPE.q(Cc.name) + '").layer("Overlay Controls");\nvalue * C.effect("Amount")(1) / 100';
        A.startTime = 0; A.inPoint = t0; A.outPoint = PL.outPoint;
        A.comment = "Ultimate Kit BG Overlay: the background in black & white under '" + Cc.name + "' (keep it right under it, over the background).";
    }
    UK.selectOnly(comp, [PL]);
    return { name: PL.name, layers: Cc.numLayers };
};

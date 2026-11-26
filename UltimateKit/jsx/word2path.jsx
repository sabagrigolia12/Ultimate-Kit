/*  Ultimate Kit - Word to Path (2026-10-25, the header button next to Import SVG). The selected text layers, layers of
    Illustrator / EPS / PDF files and shape layers become pen-drawn letters: for every letter (every top group of a
    shape layer) one shape layer whose path runs through the middle of the letter with a stroke as thick as it was,
    in its colour, so Trim Paths draws it and every point can be moved. Two steps, the centre lines being found
    by the panel (js/centerline.js):
      w2pRead    the outlines of every letter (After Effects' own "Create Shapes from Text" / "... from Vector
                 Layer" for text and vector files, removed again at once; a shape layer is read as it is)
      w2pBuild   the letter layers (the original's transform, parent, times, effects), each anchor in its letter's
                 middle; the text goes into a precomp "Text N" (N = which text layer it was, from the top), switched
                 off; a vector or shape layer is switched off                                                     */
UK.W2P = {};
UK.W2P.CMD_TEXT = 3781;         // "Create Shapes from Text" (when the menu name is not found: another language)
UK.W2P.CMD_VECTOR = 3973;       // "Create Shapes from Vector Layer"
/* 2D affine [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f */
UK.W2P.mul = function (A, B) { return [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]; };
UK.W2P.groupM = function (tr, t) {
    var g = function (m, d) { try { return tr.property(m).valueAtTime(t, false); } catch (e) { return d; } };
    var an = g("ADBE Vector Anchor", [0, 0]), p = g("ADBE Vector Position", [0, 0]), s = g("ADBE Vector Scale", [100, 100]), r = g("ADBE Vector Rotation", 0) * Math.PI / 180;
    var cs = Math.cos(r), sn = Math.sin(r), sx = s[0] / 100, sy = s[1] / 100;
    return UK.W2P.mul([cs, sn, -sn, cs, p[0], p[1]], [sx, 0, 0, sy, -an[0] * sx, -an[1] * sy]);
};
UK.W2P.apply = function (M, path) {
    var r = { v: [], i: [], o: [], c: path.c }, k;
    for (k = 0; k < path.v.length; k++) {
        var v = path.v[k], a = path.i[k], b = path.o[k];
        r.v.push([M[0] * v[0] + M[2] * v[1] + M[4], M[1] * v[0] + M[3] * v[1] + M[5]]);
        r.i.push([M[0] * a[0] + M[2] * a[1], M[1] * a[0] + M[3] * a[1]]);
        r.o.push([M[0] * b[0] + M[2] * b[1], M[1] * b[0] + M[3] * b[1]]);
    }
    return r;
};
/* the parametric shapes as bezier paths */
UK.W2P.rect = function (p, t) {
    var s = p.property("ADBE Vector Rect Size").valueAtTime(t, false), c = p.property("ADBE Vector Rect Position").valueAtTime(t, false), r = Math.min(p.property("ADBE Vector Rect Roundness").valueAtTime(t, false), s[0] / 2, s[1] / 2);
    var x0 = c[0] - s[0] / 2, y0 = c[1] - s[1] / 2, x1 = c[0] + s[0] / 2, y1 = c[1] + s[1] / 2, k = 0.5523 * r;
    if (r <= 0) return { v: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], c: true };
    return { v: [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]],
        i: [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]], o: [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]], c: true };
};
UK.W2P.ellipse = function (p, t) {
    var s = p.property("ADBE Vector Ellipse Size").valueAtTime(t, false), c = p.property("ADBE Vector Ellipse Position").valueAtTime(t, false), a = s[0] / 2, b = s[1] / 2, K = 0.5523;
    return { v: [[c[0], c[1] - b], [c[0] + a, c[1]], [c[0], c[1] + b], [c[0] - a, c[1]]], i: [[-a * K, 0], [0, -b * K], [a * K, 0], [0, b * K]], o: [[a * K, 0], [0, b * K], [-a * K, 0], [0, -b * K]], c: true };
};
UK.W2P.star = function (p, t) {
    var g = function (m) { return p.property(m).valueAtTime(t, false); }, type = g("ADBE Vector Star Type"), n = Math.max(3, Math.round(g("ADBE Vector Star Points"))), c = g("ADBE Vector Star Position");
    var ro = g("ADBE Vector Star Outer Radius"), ri = type === 1 ? g("ADBE Vector Star Inner Radius") : ro, rot = g("ADBE Vector Star Rotation") * Math.PI / 180, r = { v: [], i: [], o: [], c: true };
    var m = type === 1 ? 2 * n : n;
    for (var k = 0; k < m; k++) { var rad = (type === 1 && k % 2) ? ri : ro, an = rot - Math.PI / 2 + k * 2 * Math.PI / m; r.v.push([c[0] + rad * Math.cos(an), c[1] + rad * Math.sin(an)]); r.i.push([0, 0]); r.o.push([0, 0]); }
    return r;
};
/* one piece (a letter / a group): its paths in layer space, its fill and stroke */
UK.W2P.collect = function (grp, M, t, pc) {
    var vecs = grp.matchName === "ADBE Vector Group" ? grp.property("ADBE Vectors Group") : grp, k, fillAt = -1, strokeAt = -1;
    if (grp.matchName === "ADBE Vector Group") M = UK.W2P.mul(M, UK.W2P.groupM(grp.property("ADBE Vector Transform Group"), t));
    for (k = 1; k <= vecs.numProperties; k++) {
        var p = vecs.property(k), mn = p.matchName, on = true;
        try { on = p.enabled; } catch (e0) { }
        if (!on) continue;
        if (mn === "ADBE Vector Group") UK.W2P.collect(p, M, t, pc);
        else if (mn === "ADBE Vector Shape - Group") { var s = p.property("ADBE Vector Shape").valueAtTime(t, false); pc.paths.push(UK.W2P.apply(M, { v: s.vertices, i: s.inTangents, o: s.outTangents, c: s.closed })); }
        else if (mn === "ADBE Vector Shape - Rect") pc.paths.push(UK.W2P.apply(M, UK.W2P.rect(p, t)));
        else if (mn === "ADBE Vector Shape - Ellipse") pc.paths.push(UK.W2P.apply(M, UK.W2P.ellipse(p, t)));
        else if (mn === "ADBE Vector Shape - Star") pc.paths.push(UK.W2P.apply(M, UK.W2P.star(p, t)));
        else if ((mn === "ADBE Vector Graphic - Fill" || mn === "ADBE Vector Graphic - G-Fill") && !pc.fill) {
            fillAt = k;
            pc.fill = { grad: mn !== "ADBE Vector Graphic - Fill", color: mn === "ADBE Vector Graphic - Fill" ? p.property("ADBE Vector Fill Color").valueAtTime(t, false) : [1, 1, 1, 1] };
            try { pc.rule = p.property("ADBE Vector Fill Rule").value; } catch (e1) { }
        } else if ((mn === "ADBE Vector Graphic - Stroke" || mn === "ADBE Vector Graphic - G-Stroke") && !pc.stroke) {
            strokeAt = k;
            var sc = Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2]));
            pc.stroke = { color: mn === "ADBE Vector Graphic - Stroke" ? p.property("ADBE Vector Stroke Color").valueAtTime(t, false) : [1, 1, 1, 1], width: p.property("ADBE Vector Stroke Width").valueAtTime(t, false) * sc, over: false };
        }
    }
    if (pc.fill && pc.stroke && fillAt > 0 && strokeAt > 0) pc.stroke.over = strokeAt < fillAt;       // (higher in the list = drawn on top)
};
UK.W2P.pieces = function (L, t) {
    var root = L.property("ADBE Root Vectors Group"), out = [], k, loose = { name: L.name, paths: [], rule: 1, fill: null, stroke: null };
    for (k = 1; k <= root.numProperties; k++) {
        var g = root.property(k), on = true;
        try { on = g.enabled; } catch (e0) { }
        if (!on) continue;
        if (g.matchName === "ADBE Vector Group") {
            var pc = { name: g.name, paths: [], rule: 1, fill: null, stroke: null };
            UK.W2P.collect(g, [1, 0, 0, 1, 0, 0], t, pc);
            if (pc.paths.length) out.push(pc);
        }
    }
    /* paths straight in the contents (no group): one more piece; a fill / stroke there paints the groups without their own */
    var flat = { matchName: "flat", numProperties: 0, items: [] };
    for (k = 1; k <= root.numProperties; k++) if (root.property(k).matchName !== "ADBE Vector Group") flat.items.push(root.property(k));
    flat.numProperties = flat.items.length; flat.property = function (q) { return this.items[q - 1]; };
    UK.W2P.collect(flat, [1, 0, 0, 1, 0, 0], t, loose);
    if (loose.paths.length) out.push(loose);
    for (k = 0; k < out.length; k++) { if (!out[k].fill && loose.fill) out[k].fill = loose.fill; if (!out[k].stroke && loose.stroke) out[k].stroke = loose.stroke; }
    return out;
};
UK.W2P.isVector = function (L) {
    try { return L instanceof AVLayer && L.source instanceof FootageItem && L.source.mainSource instanceof FileSource && /\.(ai|eps|pdf)$/i.test(L.source.mainSource.file.name); } catch (e) { return false; }
};
/* run one of After Effects' "Create Shapes from ..." on layer L alone; returns the new shape layer */
UK.W2P.outlines = function (comp, L, name, id) {
    var ids = {}, i;
    for (i = 1; i <= comp.numLayers; i++) { ids[comp.layer(i).id] = true; comp.layer(i).selected = false; }
    L.selected = true;
    var cmd = 0; try { cmd = app.findMenuCommandId(name); } catch (e0) { }
    app.executeCommand(cmd || id);
    for (i = 1; i <= comp.numLayers; i++) if (!ids[comp.layer(i).id] && comp.layer(i) instanceof ShapeLayer) return comp.layer(i);
    throw new Error("After Effects did not make shapes from '" + L.name + "'. Click the composition's timeline once and try again.");
};
UK.api.w2pRead = function () {
    var comp = UK.comp(false), sel = comp.selectedLayers, L = [], i, t = comp.time;
    for (i = 0; i < sel.length; i++) if (sel[i] instanceof TextLayer || sel[i] instanceof ShapeLayer || UK.W2P.isVector(sel[i])) L.push(sel[i]);
    if (!L.length) throw new Error("Select a text, Illustrator or shape layer.");
    var order = {}, n = 0;
    for (i = 1; i <= comp.numLayers; i++) if (comp.layer(i) instanceof TextLayer) order[comp.layer(i).id] = ++n;
    L.sort(function (a, b) { return a.index - b.index; });
    var items = [];
    for (i = 0; i < L.length; i++) {
        var Ly = L[i], kind = Ly instanceof TextLayer ? "text" : (Ly instanceof ShapeLayer ? "shape" : "vector"), pcs;
        if (kind === "shape") pcs = UK.W2P.pieces(Ly, t);
        else {
            var was = Ly.enabled, O = kind === "text" ? UK.W2P.outlines(comp, Ly, "Create Shapes from Text", UK.W2P.CMD_TEXT) : UK.W2P.outlines(comp, Ly, "Create Shapes from Vector Layer", UK.W2P.CMD_VECTOR);
            pcs = UK.W2P.pieces(O, t);
            O.remove();
            Ly.enabled = was;
        }
        items.push({ id: Ly.id, name: Ly.name, kind: kind, nth: order[Ly.id] || 1, pieces: pcs });
    }
    UK.selectOnly(comp, L);
    return { comp: comp.id, items: items };
};
/* copy a property tree's values, keyframes (with their eases) and expressions (same structure on both sides) */
UK.W2P.copyTree = function (src, dst) {
    for (var i = 1; i <= src.numProperties; i++) {
        var s = src.property(i), d = null;
        try { d = dst.property(s.matchName) || dst.property(i); } catch (e0) { }
        if (!d) continue;
        if (s.propertyType === PropertyType.PROPERTY) {
            try {
                if (s.propertyValueType === PropertyValueType.NO_VALUE || s.propertyValueType === PropertyValueType.CUSTOM_VALUE) continue;
                if (s.numKeys > 0) {
                    for (var k = 1; k <= s.numKeys; k++) d.setValueAtTime(s.keyTime(k), s.keyValue(k));
                    for (k = 1; k <= s.numKeys; k++) {
                        try { d.setInterpolationTypeAtKey(k, s.keyInInterpolationType(k), s.keyOutInterpolationType(k)); d.setTemporalEaseAtKey(k, s.keyInTemporalEase(k), s.keyOutTemporalEase(k)); } catch (e1) { }
                    }
                } else d.setValue(s.value);
                if (s.canSetExpression && s.expression !== "") { d.expression = s.expression; d.expressionEnabled = s.expressionEnabled; }
            } catch (e2) { }
        } else {
            try { if (s.canSetEnabled) d.enabled = s.enabled; } catch (e3) { }
            UK.W2P.copyTree(s, d);
        }
    }
};
UK.W2P.copyFx = function (src, dst) {
    var sf = src.property("ADBE Effect Parade"), df = dst.property("ADBE Effect Parade");
    if (!sf) return;
    for (var i = 1; i <= sf.numProperties; i++) {
        var e = sf.property(i);
        if (!df.canAddProperty(e.matchName)) continue;
        df.addProperty(e.matchName);
        var n = df.property(df.numProperties);
        try { n.name = e.name; } catch (e0) { }
        UK.W2P.copyTree(e, n);
        try { n.enabled = e.enabled; } catch (e1) { }
    }
};
/* the anchor into the middle of what the layer shows, without moving it (only a static 2D transform) */
UK.W2P.centre = function (L, t) {
    if (L.threeDLayer) return;
    var T = L.property("ADBE Transform Group"), nm = ["ADBE Anchor Point", "ADBE Position", "ADBE Position_0", "ADBE Position_1", "ADBE Scale", "ADBE Rotate Z"], i;
    for (i = 0; i < nm.length; i++) { var p = T.property(nm[i]); if (p && (p.numKeys > 0 || (p.canSetExpression && p.expression !== ""))) return; }
    var r = L.sourceRectAtTime(t, false);
    if (!(r.width > 0) && !(r.height > 0)) return;
    var c = [r.left + r.width / 2, r.top + r.height / 2], P = UK.toParent(L, c, t);
    T.property("ADBE Anchor Point").setValue(c);
    if (T.property("ADBE Position").dimensionsSeparated) { T.property("ADBE Position_0").setValue(P[0]); T.property("ADBE Position_1").setValue(P[1]); }
    else T.property("ADBE Position").setValue(P);
};
UK.W2P.name = function (n) {
    var used = {}, i; for (i = 1; i <= app.project.numItems; i++) used[app.project.item(i).name] = true;
    while (used["Text " + n]) n++;
    return "Text " + n;
};
UK.W2P.stroke = function (vecs, name, col, width, cap, join) {
    var s = vecs.addProperty("ADBE Vector Graphic - Stroke"); s.name = name;
    s.property("ADBE Vector Stroke Color").setValue([col[0], col[1], col[2], 1]);
    UK.safeSet(s.property("ADBE Vector Stroke Width"), Math.max(0.1, UK.round(width, 2)));
    try { s.property("ADBE Vector Stroke Line Cap").setValue(cap || 1); s.property("ADBE Vector Stroke Line Join").setValue(join || 1); s.property("ADBE Vector Stroke Miter Limit").setValue(4); } catch (e0) { }      // (caps / joins as the letter has them: js/centerline.js ends())
    return s;
};
UK.api.w2pBuild = function (a) {
    var comp = null, i, j, k, t, made = [], pts = 0;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i).id === a.comp) comp = app.project.item(i);
    if (!(comp instanceof CompItem)) throw new Error("The composition is gone.");
    t = comp.time;
    for (i = 0; i < a.items.length; i++) {
        var it = a.items[i], L = null;
        for (j = 1; j <= comp.numLayers; j++) if (comp.layer(j).id === it.id) L = comp.layer(j);
        if (!L) continue;
        var letters = [];
        for (j = 0; j < it.pieces.length; j++) {
            var pc = it.pieces[j]; if (!pc.comps || !pc.comps.length) continue;
            var N = comp.layers.addShape();
            N.name = UK.uniqueLayerName(comp, pc.name && pc.name.length < 10 ? pc.name : "Letter " + (j + 1));
            N.threeDLayer = L.threeDLayer;
            try { N.property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated = L.property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated; } catch (e0) { }
            UK.W2P.copyTree(L.property("ADBE Transform Group"), N.property("ADBE Transform Group"));
            try { if (L.parent) N.parent = L.parent; } catch (e1) { }
            N.startTime = L.startTime; N.inPoint = L.inPoint; N.outPoint = L.outPoint;
            try { N.blendingMode = L.blendingMode; } catch (e2) { }
            N.label = L.label;
            var fillC = pc.fill && !pc.fill.grad ? pc.fill.color : (pc.stroke ? pc.stroke.color : [1, 1, 1]), sw = pc.fill && pc.stroke ? pc.stroke.width : 0;
            /* the user's build (their WORDS comp): every line its own group "Shape n" with its path and stroke; a dot
               (the i's) a filled "Ellipse n" */
            var root = N.property("ADBE Root Vectors Group"), sn = 0, en = 0;
            for (k = 0; k < pc.comps.length; k++) {
                var c = pc.comps[k], g, vecs;
                if (c.dot) {
                    g = root.addProperty("ADBE Vector Group"); g.name = "Ellipse " + (++en); vecs = g.property("ADBE Vectors Group");
                    var dp = c.dot.round ? vecs.addProperty("ADBE Vector Shape - Ellipse") : vecs.addProperty("ADBE Vector Shape - Rect");
                    dp.property(c.dot.round ? "ADBE Vector Ellipse Size" : "ADBE Vector Rect Size").setValue([UK.round(c.dot.size[0], 2), UK.round(c.dot.size[1], 2)]);
                    var df = UK.addFill(vecs, "#FFFFFF", 100, "Fill 1"); df.property("ADBE Vector Fill Color").setValue([fillC[0], fillC[1], fillC[2], 1]);
                    UK.gtr(g, "ADBE Vector Position").setValue([UK.round(c.dot.c[0], 2), UK.round(c.dot.c[1], 2)]);
                    if (!c.dot.round && c.dot.angle) UK.gtr(g, "ADBE Vector Rotation").setValue(UK.round(c.dot.angle, 2));
                    continue;
                }
                for (var q = 0; q < c.paths.length; q++) {
                    var p = c.paths[q];
                    g = root.addProperty("ADBE Vector Group"); g.name = "Shape " + (++sn); vecs = g.property("ADBE Vectors Group");
                    var sp = vecs.addProperty("ADBE Vector Shape - Group"); sp.name = "Path 1";
                    sp.property("ADBE Vector Shape").setValue(UK.makeShape(p.v, p.i, p.o, !!p.c)); pts += p.v.length;
                    var cap = p.cap || c.cap || 1;
                    if (sw > 0) {                     // the text's outline round the stroke
                        UK.W2P.stroke(vecs, "Stroke 1", fillC, pc.stroke.over ? c.width - sw : c.width, cap, p.join);
                        UK.W2P.stroke(vecs, "Outline", pc.stroke.color, c.width + sw, cap, p.join);
                    } else UK.W2P.stroke(vecs, "Stroke 1", c.keep && pc.stroke ? pc.stroke.color : fillC, c.width, cap, p.join);
                }
            }
            UK.W2P.copyFx(L, N);
            UK.W2P.centre(N, t);
            N.moveBefore(L);
            N.comment = "Ultimate Kit Word to Path: '" + pc.name + "' of '" + L.name + "' (the path through its middle; Stroke Width = its thickness).";
            letters.push(N);
        }
        if (!letters.length) continue;
        made = made.concat(letters);
        if (it.kind === "text") {
            var nm = UK.W2P.name(it.nth), idx = L.index, PC = comp.layers.precompose([idx], nm, true);
            try { PC.parentFolder = UK.folder("Word to Path"); } catch (e3) { }
            PC.layer(1).enabled = true;
            var PL = comp.layer(idx); PL.enabled = false;
            PL.comment = "Ultimate Kit Word to Path: the original text (the letters above are its paths).";
        } else {
            L.enabled = false;
            L.comment = "Ultimate Kit Word to Path: the original (switched off; the letters above are its paths).";
        }
    }
    if (!made.length) throw new Error("No letters found in the selection.");
    UK.selectOnly(comp, made);
    return { letters: made.length, points: pts };
};

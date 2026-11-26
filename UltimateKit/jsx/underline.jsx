/*  Ultimate Kit - Underline: hand-drawn style strokes (lines, circles, boxes, marks) that draw on
    with Trim Paths. One shape layer per stroke set, parented to the text so it follows it.
      - round caps and joins, smooth speed-ramped Trim Paths keyframes (no linear corners)
      - colour: "Color" effect on the layer (every stroke follows it); timing: the Trim keyframes
      - tilted looks keep their tilt on the layer's Rotation (not baked into the path)
      - pen looks: the stroke's Taper (pointed tips); brush looks: + Roughen Edges ("Brush Edges")
    Geometry comes from shared/underline.js, the same code the panel preview draws.            */

UK.UL = {};
/* the box to decorate: { space: layer the strokes live in, r: box in that space, fs } */
UK.UL.target = function (comp, L, t) {
    if (L instanceof TextLayer) {
        var fs = 80;
        try { fs = UK.textDoc(L).value.fontSize; } catch (e) { }
        return { space: L, r: L.sourceRectAtTime(t, false), fs: fs };
    }
    // an Ultimate Kit text precomp: the box of its text, in the precomp layer's space (= its comp)
    if (L.source instanceof CompItem && L.comment === "UK text precomp" && UK.TX && UK.TX.wrapText) {
        var IL = UK.TX.wrapText(L.source);
        if (IL) {
            var it = t - L.startTime, ir = IL.sourceRectAtTime(it, false), tr = IL.property("ADBE Transform Group");
            var P = tr.property("ADBE Position").valueAtTime(it, false), A = tr.property("ADBE Anchor Point").valueAtTime(it, false), S = tr.property("ADBE Scale").valueAtTime(it, false);
            var ifs = 80;
            try { ifs = UK.textDoc(IL).value.fontSize; } catch (e2) { }
            return { space: L, fs: ifs * S[1] / 100, r: { left: P[0] + (ir.left - A[0]) * S[0] / 100, top: P[1] + (ir.top - A[1]) * S[1] / 100, width: ir.width * S[0] / 100, height: ir.height * S[1] / 100 } };
        }
    }
    var rr = L.sourceRectAtTime(t, false);
    return { space: L, r: rr, fs: Math.max(20, rr.height * 0.7) };
};
/* stroke Taper in percent units (Length Units 1): [start len, end len, start width, end width, start ease, end ease] */
UK.UL.taper = function (T, v) {
    var mn = ["ADBE Vector Taper Start Length", "ADBE Vector Taper End Length", "ADBE Vector Taper Start Width",
        "ADBE Vector Taper End Width", "ADBE Vector Taper Start Ease", "ADBE Vector Taper End Ease"];
    try { T.property("ADBE Vector Taper Length Units").setValue(1); } catch (e0) { }
    for (var i = 0; i < mn.length; i++) try { T.property(mn[i]).setValue(v[i]); } catch (e) { }
};
UK.UL.build = function (comp, id, tg, a, t0) {
    var spec = UK_CAT.find(UK_CAT.underline, id), geo = UK_UL.build(id, tg.r, tg.fs);
    var dur = UK.clamp(Number(a.dur) || 0.8, 0.1, 10), outDur = UK.clamp(Number(a.outDur) || 0.6, 0.1, 10), both = a.mode === "both";
    var M = UK.shapeLayer(comp, UK.uniqueLayerName(comp, spec ? spec.name : "Underline"));
    UK.colorCtl(M, "Color", a.color || "#7C5CFF");
    var tOut = both ? Math.max(t0 + dur + 0.2, (tg.space ? tg.space.outPoint : comp.duration) - outDur) : 0, j, k;
    for (j = 0; j < geo.strokes.length; j++) {
        var s = geo.strokes[j], gname = "Stroke " + (j + 1);
        var v = UK.vecs(UK.group(UK.root(M), gname)), tn = s.smooth ? UK_UL.tangents(s.pts) : null;
        UK.addPath(v, s.pts, tn ? tn.i : null, tn ? tn.o : null, !!s.closed);
        UK.addTrim(UK.vecs(UK.root(M).property(gname)), "Draw");
        // (brush looks: Roughen Edges reads the alpha, so see-through paint gets its opacity on the layer)
        var st = UK.addStroke(UK.vecs(UK.root(M).property(gname)), a.color || "#7C5CFF", Math.max(1, s.w), { cap: 2, join: 2, opacity: geo.rough ? 100 : s.op });
        if (geo.rough && s.op < 100) UK.opac(M).setValue(s.op);
        st.property("ADBE Vector Stroke Color").expression = 'effect("Color")(1)';
        if (s.taper) UK.UL.taper(st.property("ADBE Vector Stroke Taper"), s.taper);
        if (s.rot) UK.gtr(UK.root(M).property(gname)).property("ADBE Vector Rotation").setValue(s.rot);
        var trim = function () { return UK.vecs(UK.root(M).property(gname)).property("Draw"); };
        var a0 = t0 + s.delay * dur, d = Math.max(0.05, s.dur * dur), ein = [[45, 75]], eout = [[75, 45]];
        if (s.center) {
            UK.anim(trim().property("ADBE Vector Trim Start"), [[a0, 50], [a0 + d, 0]], ein);
            UK.anim(trim().property("ADBE Vector Trim End"), [[a0, 50], [a0 + d, 100]], ein);
        } else UK.anim(trim().property("ADBE Vector Trim End"), [[a0, 0], [a0 + d, 100]], ein);
        if (both) {
            var b0 = tOut + j * outDur * 0.08, bd = outDur * (1 - 0.08 * (geo.strokes.length - 1));
            if (s.center) {
                UK.anim(trim().property("ADBE Vector Trim Start"), [[b0, 0], [b0 + bd, 50]], eout);
                UK.anim(trim().property("ADBE Vector Trim End"), [[b0, 100], [b0 + bd, 50]], eout);
            } else UK.anim(trim().property("ADBE Vector Trim Start"), [[b0, 0], [b0 + bd, 100]], eout);
        }
    }
    // brush looks: ragged paint edges (static - the stroke itself is what animates)
    if (geo.rough) {
        UK.fx(M, "ADBE Roughen Edges", "Brush Edges");
        var R = UK.efx(M, "Brush Edges");
        R.property("ADBE Roughen Edges-0002").setValue(Math.max(1, Math.round(geo.rough.border * 10) / 10));
        R.property("ADBE Roughen Edges-0003").setValue(0.6);
        R.property("ADBE Roughen Edges-0004").setValue(0.8);
        R.property("ADBE Roughen Edges-0005").setValue(geo.rough.scale);
        R.property("ADBE Roughen Edges-0006").setValue(geo.rough.stretch);
        R.property("ADBE Roughen Edges-0008").setValue(4);
    }
    // the layer sits on the pivot; parented to the text so it follows it
    if (tg.space) { M.parent = tg.space; }
    UK.anchor(M).setValue([0, 0]);
    UK.pos(M).setValue(geo.pivot);
    UK.rot(M).setValue(geo.rot || 0);
    UK.scale(M).setValue([100, 100]);
    if (tg.space) { if (geo.behind) M.moveAfter(tg.space); else M.moveBefore(tg.space); }
    M.startTime = 0;
    M.inPoint = t0;
    M.outPoint = both ? tOut + outDur + comp.frameDuration : (tg.space ? Math.max(t0 + dur + 0.1, tg.space.outPoint) : comp.duration);
    M.comment = "Ultimate Kit Underline: colour in Effect Controls (Color), timing on the Trim Paths keyframes.";
    return M;
};
UK.api.underline = function (a) {
    var comp = UK.comp(true);
    UK._fd = comp.frameDuration;
    var t0 = UK.snap(comp, UK.timeCTI(comp)), sel = comp.selectedLayers, made = [], i;
    var targets = [];
    for (i = 0; i < sel.length; i++) if (sel[i] instanceof AVLayer || sel[i] instanceof TextLayer || sel[i] instanceof ShapeLayer) targets.push(sel[i]);
    if (!targets.length) {
        // nothing selected: a stroke for a text box in the middle of the frame
        var w = comp.width * 0.42, h = comp.height * 0.11;
        made.push(UK.UL.build(comp, a.id, { space: null, fs: h, r: { left: comp.width / 2 - w / 2, top: comp.height / 2 - h / 2, width: w, height: h } }, a, t0));
    } else {
        for (i = 0; i < targets.length; i++) made.push(UK.UL.build(comp, a.id, UK.UL.target(comp, targets[i], t0), a, t0));
    }
    UK.selectOnly(comp, made);
    var names = [];
    for (i = 0; i < made.length; i++) names.push(made[i].name);
    return { layers: names };
};

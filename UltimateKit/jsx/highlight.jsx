/*  Ultimate Kit - Highlighter (shared/highlight.js): the chosen look on each selected word, from the time indicator:
      HL <look> - <word>   shape layer(s) parented to the word (they follow it), behind it, one group per element,
                           every move a keyframe with its speed ramp (Position, Scale, Rotation, Opacity, the
                           rectangle's Size / Position / Roundness, Trim Paths), Drop Shadow / Gaussian Blur / Glow
      on the word          Effect Controls "UK HL Box", "UK HL Accent", "UK HL Ink" (the colours every layer reads)
                           and text animators "UK HL In" / "UK HL Ink" / "UK HL Out" (its letters in, its colour on
                           the highlight, its letters out), keyed on their Range selectors
    The exit runs at the word's out point. Applying again (any look) replaces the word's previous highlight.        */
UK.HL = {};
UK.HL.TAG = "UK HL: ";
UK.HL.NAMES = { B: "UK HL Box", A: "UK HL Accent", I: "UK HL Ink" };
/* keys [[t, v, ease], ...] (times from the start t0, frame-snapped) */
UK.HL.keys = function (prop, K, t0, map) {
    if (!K || !K.length) return;
    var fd = UK._fd || (1 / 30), ks = [], cv = [], i;
    for (i = 0; i < K.length; i++) ks.push([Math.round((t0 + K[i][0]) / fd) * fd, map ? map(K[i][1]) : K[i][1]]);
    if (ks.length === 1) { prop.setValue(ks[0][1]); return; }
    for (i = 0; i < K.length - 1; i++) cv.push(K[i][2] || "smooth");
    UK.anim(prop, ks, cv);
};
/* a colour slot: read from the word's control (falls back to the colour itself if that control is gone) */
UK.HL.fallback = function (hex) { var c = UK.rgba(hex); return "[" + UK.round(c[0], 4) + ", " + UK.round(c[1], 4) + ", " + UK.round(c[2], 4) + ", 1]"; };
UK.HL.color = function (prop, slot, ctl) {
    if (UK.HL.NAMES[slot]) {
        prop.setValue(UK.rgba(UK.HL._cols[slot]));
        prop.expression = "var W = " + (ctl === "parent" ? "thisLayer.hasParent ? thisLayer.parent : thisLayer" : "thisLayer") + ";\ntry { W.effect(\"" + UK.HL.NAMES[slot] + "\")(1) } catch (e) { " + UK.HL.fallback(UK.HL._cols[slot]) + " }";
        return;
    }
    prop.setValue(UK.rgba(slot));
};
/* one shape (rect / ellipse / path) into the contents V() gives (fresh each time: adding invalidates references) */
UK.HL.shape = function (V, part, t0) {
    var k = part.k, K = part.K || {}, p, i;
    if (k === "rect") {
        p = V().addProperty("ADBE Vector Shape - Rect"); i = p.propertyIndex;
        V().property(i).property("ADBE Vector Rect Size").setValue([part.w, part.h]);
        if (part.pos) V().property(i).property("ADBE Vector Rect Position").setValue(part.pos);
        if (part.r) V().property(i).property("ADBE Vector Rect Roundness").setValue(part.r);
        UK.HL.keys(V().property(i).property("ADBE Vector Rect Size"), K.sz, t0);
        UK.HL.keys(V().property(i).property("ADBE Vector Rect Position"), K.rp, t0);
        UK.HL.keys(V().property(i).property("ADBE Vector Rect Roundness"), K.rr, t0);
    } else if (k === "ellipse") {
        p = V().addProperty("ADBE Vector Shape - Ellipse"); i = p.propertyIndex;
        V().property(i).property("ADBE Vector Ellipse Size").setValue([part.w, part.h]);
        if (part.pos) V().property(i).property("ADBE Vector Ellipse Position").setValue(part.pos);
        UK.HL.keys(V().property(i).property("ADBE Vector Ellipse Size"), K.sz, t0);
        UK.HL.keys(V().property(i).property("ADBE Vector Ellipse Position"), K.rp, t0);
    } else {
        var tn = part.smooth ? UK_HL.tangents(part.pts, part.closed) : null;
        UK.addPath(V(), part.pts, tn ? tn.i : null, tn ? tn.o : null, !!part.closed);
    }
};
UK.HL.element = function (L, el, ctl, t0) {
    var gi = UK.group(UK.root(L), el.n).propertyIndex, i;
    var G = function () { return UK.root(L).property(gi); }, V = function () { return UK.vecs(G()); };
    for (i = 0; i < el.parts.length; i++) {
        var part = el.parts[i];
        if (part.sub) {                          // a shape with its own transform (a light bar travelling over a box)
            var si = UK.group(V(), "Part " + (i + 1)).propertyIndex, SV = function () { return UK.vecs(V().property(si)); };
            UK.HL.shape(SV, part, t0);
            var ST = function (n) { return UK.gtr(V().property(si), n); }, sk = part.sub.K || {};
            if (part.sub.a) ST("ADBE Vector Anchor").setValue(part.sub.a);
            if (part.sub.r) ST("ADBE Vector Rotation").setValue(part.sub.r);
            if (sk.p) UK.HL.keys(ST("ADBE Vector Position"), sk.p, t0); else if (part.sub.p) ST("ADBE Vector Position").setValue(part.sub.p);
            if (sk.r) UK.HL.keys(ST("ADBE Vector Rotation"), sk.r, t0);
        } else UK.HL.shape(V, part, t0);
    }
    if (el.merge) { var mi = V().addProperty("ADBE Vector Filter - Merge").propertyIndex; V().property(mi).property("ADBE Vector Merge Type").setValue(el.merge); }
    if (el.K.te || el.K.ts) {
        var ti = V().addProperty("ADBE Vector Filter - Trim").propertyIndex;
        V().property(ti).name = "Draw";
        V().property(ti).property("ADBE Vector Trim End").setValue(100);
        UK.HL.keys(V().property(ti).property("ADBE Vector Trim End"), el.K.te, t0);
        UK.HL.keys(V().property(ti).property("ADBE Vector Trim Start"), el.K.ts, t0);
    }
    if (el.stroke) {
        var sti = UK.addStroke(V(), "#FFFFFF", Math.max(0.5, el.sw || 2), { cap: el.cap || 1, join: el.join || 1, opacity: el.so === undefined ? 100 : el.so }).propertyIndex;
        UK.HL.color(V().property(sti).property("ADBE Vector Stroke Color"), el.stroke, ctl);
        if (el.taper) try { UK.UL.taper(V().property(sti).property("ADBE Vector Stroke Taper"), el.taper); } catch (e0) { }
    }
    if (el.fill) {
        var fi = UK.addFill(V(), "#FFFFFF", el.fo === undefined ? 100 : el.fo).propertyIndex;
        UK.HL.color(V().property(fi).property("ADBE Vector Fill Color"), el.fill, ctl);
    }
    var T = function (n) { return UK.gtr(G(), n); };
    if (el.a) T("ADBE Vector Anchor").setValue(el.a);
    if (el.K.p) UK.HL.keys(T("ADBE Vector Position"), el.K.p, t0); else if (el.p) T("ADBE Vector Position").setValue(el.p);
    UK.HL.keys(T("ADBE Vector Scale"), el.K.s, t0);
    UK.HL.keys(T("ADBE Vector Rotation"), el.K.r, t0);
    UK.HL.keys(T("ADBE Vector Group Opacity"), el.K.o, t0);
};
/* how far the layer's effects reach past the box (a shape layer's effects are cut at its content's box) */
UK.HL.margin = function (fx) {
    var m = 0, i, k;
    for (i = 0; i < fx.length; i++) {
        var f = fx[i];
        if (f.k === "shadow") m = Math.max(m, f.dist + f.soft * 1.6);
        if (f.k === "glow") m = Math.max(m, f.radius * 2);
        if (f.k === "blur") for (k = 0; k < f.K.length; k++) m = Math.max(m, f.K[k][1] * 2.6);
    }
    return m;
};
UK.HL.layer = function (comp, T, spec, Ly, look, a, t0, tag) {
    var L = UK.shapeLayer(comp, UK.uniqueLayerName(comp, "HL " + look.name + " - " + T.name)), i;
    L.parent = T;                                  // (first: the colours read the word's controls through the parent)
    for (i = Ly.els.length - 1; i >= 0; i--) UK.HL.element(L, Ly.els[i], "parent", t0);      // (the first group in the list is in front)
    var m = UK.HL.margin(Ly.fx);
    if (m > 0) {                                   // invisible room for the shadow / blur / glow
        var ri = UK.group(UK.root(L), "Room").propertyIndex;
        UK.addRect(UK.vecs(UK.root(L).property(ri)), [spec.w + 2 * m, spec.h + 2 * m], [0, 0], 0);
        UK.addFill(UK.vecs(UK.root(L).property(ri)), "#000000", 0);
    }
    for (i = 0; i < Ly.fx.length; i++) {
        var f = Ly.fx[i], E;
        if (f.k === "shadow") {
            E = UK.fx(L, "ADBE Drop Shadow", "Shadow");
            UK.safeSet(E.property("ADBE Drop Shadow-0002"), E.property("ADBE Drop Shadow-0002").maxValue > 100 ? f.op * 2.55 : f.op);
            UK.safeSet(E.property("ADBE Drop Shadow-0003"), f.dir);
            UK.safeSet(E.property("ADBE Drop Shadow-0004"), UK.round(f.dist, 1));
            UK.safeSet(E.property("ADBE Drop Shadow-0005"), UK.round(f.soft, 1));
        } else if (f.k === "blur") {
            E = UK.fx(L, "ADBE Gaussian Blur 2", "Exit Blur");
            try { E.property("ADBE Gaussian Blur 2-0003").setValue(0); } catch (e1) { }
            UK.HL.keys(UK.efx(L, "Exit Blur").property("ADBE Gaussian Blur 2-0001"), f.K, t0);
        } else if (f.k === "glow") {
            E = UK.fx(L, "ADBE Glo2", "Glow");
            var th = E.property("ADBE Glo2-0002");
            try { UK.safeSet(th, th.maxValue <= 1 ? 0.3 : 30); } catch (e2) { }
            try { UK.safeSet(UK.efx(L, "Glow").property("ADBE Glo2-0003"), UK.round(f.radius, 1)); } catch (e3) { }
            try { UK.safeSet(UK.efx(L, "Glow").property("ADBE Glo2-0004"), f.intensity); } catch (e4) { }
        }
    }
    var c = spec.c, K = Ly.K || {}, pp = Ly.pp || [0, 0];
    UK.anchor(L).setValue(Ly.a || [0, 0]);
    if (K.p) UK.HL.keys(UK.pos(L), K.p, t0, function (v) { return [c[0] + v[0], c[1] + v[1]]; });
    else UK.pos(L).setValue([c[0] + pp[0], c[1] + pp[1]]);
    if (K.s) UK.HL.keys(UK.scale(L), K.s, t0); else UK.scale(L).setValue([100, 100]);
    if (K.r) UK.HL.keys(UK.rot(L), K.r, t0); else UK.rot(L).setValue(Ly.r || 0);
    if (K.o) UK.HL.keys(UK.opac(L), K.o, t0);
    L.motionBlur = !!a.mb;
    L.label = 11;
    L.startTime = 0;
    L.inPoint = t0;
    L.outPoint = Math.max(t0 + comp.frameDuration, Math.min(comp.duration, T.outPoint));
    L.comment = tag + " | Ultimate Kit Highlighter (" + look.name + "): colours in the word's Effect Controls (UK HL Box / Accent / Ink), the motion in these keyframes.";
    return L;
};
UK.HL.textAnim = function (L, an, t0) {
    var props = {}, sel = {}, k;
    for (k in an.props) props[k] = an.props[k];
    for (k in an.sel) sel[k] = an.sel[k];
    var ink = props.fill === "I";
    if (ink) props.fill = "#FFFFFF";
    if (an.invert) sel.mode = 2;                   // (a Subtract selector on its own: everything but its range)
    if (sel.random) sel.seed = 11;
    var A = UK.TX.animator(L, an.n, props, sel);
    if (ink) A.group().property("ADBE Text Animator Properties").property("ADBE Text Fill Color").expression = 'try { effect("UK HL Ink")(1) } catch (e) { ' + UK.HL.fallback(UK.HL._cols.I) + " }";
    if (an.K.off) UK.HL.keys(A.range().property("ADBE Text Percent Offset"), an.K.off, t0);
    if (an.K.start) UK.HL.keys(A.range().property("ADBE Text Percent Start"), an.K.start, t0);
    if (an.K.end) UK.HL.keys(A.range().property("ADBE Text Percent End"), an.K.end, t0);
    if (an.K.amt) UK.HL.keys(A.range().property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount"), an.K.amt, t0);
};
/* the word's previous highlight: its layers, its UK HL animators / effects / mask */
UK.HL.clean = function (comp, T) {
    var tag = UK.HL.TAG + T.id + " |", i;
    for (i = comp.numLayers; i >= 1; i--) if (String(comp.layer(i).comment).indexOf(tag) === 0) comp.layer(i).remove();
    if (T instanceof TextLayer) { var A = UK.TX.animators(T); for (i = A.numProperties; i >= 1; i--) if (A.property(i).name.indexOf("UK HL") === 0) A.property(i).remove(); }
    var E = T.property("ADBE Effect Parade"); for (i = E.numProperties; i >= 1; i--) if (E.property(i).name.indexOf("UK HL") === 0) E.property(i).remove();
    var M = T.property("ADBE Mask Parade"); if (M) for (i = M.numProperties; i >= 1; i--) if (M.property(i).name.indexOf("UK HL") === 0) M.property(i).remove();
};
UK.HL.build = function (comp, T, look, a, t0) {
    UK.HL.clean(comp, T);
    var tg = UK.UL.target(comp, T, t0), isText = (T instanceof TextLayer) && tg.space === T, i;
    var dIn = UK.clamp(Number(a.dIn) || 0.6, 0.1, 5), dOut = UK.clamp(Number(a.dOut) || 0.45, 0.1, 5), end = Math.min(comp.duration, T.outPoint);
    var tOut = a.mode === "in" ? null : Math.max(dIn * 1.5 + 0.1, end - dOut - t0);
    var c = { dIn: dIn, dOut: dOut, tOut: tOut, pad: Number(a.pad) || 100, round: (a.round === null || a.round === undefined) ? null : Number(a.round),
        reveal: isText && a.reveal !== false, ink: isText && a.ink !== false };
    var spec = UK_HL.build(look.id, tg.r, tg.fs, c), tag = UK.HL.TAG + T.id;
    /* the colours: on the word, read by every highlight layer (parent) and its text animators */
    var cols = UK.HL._cols = { B: a.box || look.box, A: a.accent || look.accent || "#FFFFFF", I: a.inkColor || look.ink || "#FFFFFF" };
    for (i = 0; i < spec.uses.length; i++) UK.colorCtl(T, UK.HL.NAMES[spec.uses[i]], cols[spec.uses[i]]);
    var made = [], prev = null;
    for (i = 0; i < spec.layers.length; i++) {      // bottom first: each goes right under the word, above the one before
        var L = UK.HL.layer(comp, T, spec, spec.layers[i], look, a, t0, tag);
        if (spec.layers[i].above) { if (prev && prev.above) L.moveBefore(prev.L); else L.moveBefore(T); }
        else L.moveAfter(T);
        prev = { L: L, above: !!spec.layers[i].above };
        made.push(L);
    }
    if (isText) {
        for (i = 0; i < spec.text.length; i++) UK.HL.textAnim(T, spec.text[i], t0);
        if (spec.mask) {
            var M = T.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), mi = M.propertyIndex, pts = [];
            for (i = 0; i < spec.mask.length; i++) pts.push([spec.c[0] + spec.mask[i][0], spec.c[1] + spec.mask[i][1]]);
            T.property("ADBE Mask Parade").property(mi).name = "UK HL Mask";
            T.property("ADBE Mask Parade").property("UK HL Mask").property("ADBE Mask Shape").setValue(UK.makeShape(pts));
        }
    }
    return made;
};
UK.api.highlight = function (a) {
    var comp = UK.comp(true);
    UK._fd = comp.frameDuration;
    var t0 = UK.snap(comp, UK.timeCTI(comp)), look = UK_HL.find(a.id), sel = comp.selectedLayers, targets = [], made = [], i;
    for (i = 0; i < sel.length; i++) {
        var L = sel[i];
        if (String(L.comment).indexOf(UK.HL.TAG) === 0) continue;          // (a highlight layer itself)
        if (L instanceof TextLayer || L instanceof AVLayer || L instanceof ShapeLayer) targets.push(L);
    }
    return UK.atomic(comp, function () {
        if (!targets.length) {                     // nothing selected: a word to highlight, in the middle
            var W = UK.addText(comp, "HIGHLIGHT", { size: Math.round(comp.height * 0.07), color: "#FFFFFF", name: "Highlight", tracking: 0 });
            targets.push(W);
        }
        for (i = 0; i < targets.length; i++) made = made.concat(UK.HL.build(comp, targets[i], look, a, t0));
        if (a.mb) comp.motionBlur = true;
        UK.selectOnly(comp, targets);
        var names = [];
        for (i = 0; i < made.length; i++) names.push(made[i].name);
        return { layers: names, words: targets.length };
    });
};

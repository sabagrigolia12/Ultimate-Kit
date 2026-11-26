/*  Ultimate Kit — text animations (SaaS Text + Text)
    All motion is keyframed (range-selector offsets, sliders, transforms) with eased
    speed-ramps. Each preset builds an "In" and/or "Out" animator on the text layer.
    Re-applying a preset replaces the previous Ultimate Kit animators on that layer.   */

UK.TX = {};

/* --------------------------------------------------------------- helpers */
UK.TX.animators = function (L) { return L.property("ADBE Text Properties").property("ADBE Text Animators"); };
UK.TX.fontSize = function (L) { try { return UK.textDoc(L).value.fontSize; } catch (e) { return 80; } };

/* remove our previous animators / effects / masks / helper layers on this layer */
UK.TX.clean = function (L) {
    var i, A = UK.TX.animators(L);
    for (i = A.numProperties; i >= 1; i--) if (A.property(i).name.indexOf("UK ") === 0) A.property(i).remove();
    var E = L.property("ADBE Effect Parade");
    for (i = E.numProperties; i >= 1; i--) if (E.property(i).name.indexOf("UK ") === 0) E.property(i).remove();
    var M = L.property("ADBE Mask Parade");
    for (i = M.numProperties; i >= 1; i--) if (M.property(i).name.indexOf("UK ") === 0) M.property(i).remove();
    try { UK.textDoc(L).expression = ""; } catch (e1) { }
    try { L.property("ADBE Text Properties").property("ADBE Text More Options").property("ADBE Text Anchor Point Option").setValue(1); } catch (e2) { }
    try { if (L.threeDPerChar) L.threeDPerChar = false; } catch (e3) { }
    var c = L.containingComp, tag = "UK helper: " + L.name;
    for (i = c.numLayers; i >= 1; i--) if (c.layer(i).comment === tag) c.layer(i).remove();
};

/*  Build one animator.
    props: { pos:[x,y], scale:[x,y], opacity, blur:[x,y], rot, rotX, rotY, track, fill:"#hex", fillBright }
    sel:   { based:1 chars|2 no-spaces|3 words|4 lines, shape:1 sq|2 rampUp|3 rampDown|4 tri|5 round|6 smooth,
             start, end, offset, hi, lo, random, seed, smooth, mode }                                     */
UK.TX.animator = function (L, name, props, sel) {
    var A = UK.TX.animators(L).addProperty("ADBE Text Animator");
    A.name = name;
    var get = function () { return UK.TX.animators(L).property(name); };
    var s = get().property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    s.name = "Range";
    var R = get().property("ADBE Text Selectors").property("Range");
    var adv = R.property("ADBE Text Range Advanced");
    adv.property("ADBE Text Range Type2").setValue(sel.based || 1);
    adv.property("ADBE Text Range Shape").setValue(sel.shape || 1);
    if (sel.mode) adv.property("ADBE Text Selector Mode").setValue(sel.mode);
    if (sel.hi !== undefined) adv.property("ADBE Text Levels Max Ease").setValue(sel.hi);
    if (sel.lo !== undefined) adv.property("ADBE Text Levels Min Ease").setValue(sel.lo);
    if (sel.smooth !== undefined) adv.property("ADBE Text Selector Smoothness").setValue(sel.smooth);
    if (sel.random) { adv.property("ADBE Text Randomize Order").setValue(1); adv.property("ADBE Text Random Seed").setValue(sel.seed || 7); }
    if (sel.start !== undefined) R.property("ADBE Text Percent Start").setValue(sel.start);
    if (sel.end !== undefined) R.property("ADBE Text Percent End").setValue(sel.end);
    if (sel.offset !== undefined) R.property("ADBE Text Percent Offset").setValue(sel.offset);
    var P = function () { return get().property("ADBE Text Animator Properties"); };
    var add = function (mn, v) { P().addProperty(mn); P().property(mn).setValue(v); };
    if (props.pos) add("ADBE Text Position 3D", [props.pos[0], props.pos[1], props.pos[2] || 0]);
    if (props.scale) add("ADBE Text Scale 3D", [props.scale[0], props.scale[1], 100]);
    if (props.rotX !== undefined) add("ADBE Text Rotation X", props.rotX);
    if (props.rotY !== undefined) add("ADBE Text Rotation Y", props.rotY);
    if (props.rot !== undefined) add("ADBE Text Rotation", props.rot);
    if (props.track !== undefined) add("ADBE Text Tracking Amount", props.track);
    if (props.fill) add("ADBE Text Fill Color", UK.rgba(props.fill));
    if (props.blur) add("ADBE Text Blur", props.blur);
    if (props.opacity !== undefined) add("ADBE Text Opacity", props.opacity);
    return {
        range: function () { return get().property("ADBE Text Selectors").property("Range"); },
        group: get
    };
};

/* Cascading reveal ("in") or conceal ("out") driven by the range-selector Offset.
   Both ends of the ramp are eased (Ease High / Low >= 60), so every letter starts and lands with a
   soft speed-ramp - no linear corners.                                                             */
UK.TX.cascade = function (L, dir, props, o, t0, dur) {
    var W = o.W || 40;
    var an = UK.TX.animator(L, dir === "in" ? "UK In" : "UK Out", props, {
        based: o.based || 1, shape: dir === "in" ? 2 : 3, start: 0, end: W,
        hi: Math.max(60, (o.hi !== undefined) ? o.hi : 60), lo: Math.max(60, (o.lo !== undefined) ? o.lo : 80),
        random: o.random, seed: o.seed
    });
    UK.anim(an.range().property("ADBE Text Percent Offset"), [[t0, -W], [t0 + dur, 100]],
        [dir === "in" ? (o.curve || "outSoft") : (o.curveOut || "inSoft")]);
    return an;
};

/* A travelling "bump" (smooth bell-shaped selection) used for overshoots / rebounds */
/*  The bump's peak trails the cascade's "fully revealed" front by `lag` (fraction of dur),
    so every letter first arrives, then overshoots, then settles - a smooth bell (Smooth shape),
    never a triangle, so there is no corner at the peak.                                 */
UK.TX.bump = function (L, name, props, o, t0, dur) {
    var W = o.W || 30, Win = o.Win || 40, lag = (o.lag !== undefined) ? o.lag : 0.12;
    var an = UK.TX.animator(L, name, props, { based: o.based || 1, shape: 6, start: 0, end: W });
    var k = (100 + Win + W / 2) / (100 + Win);       // offset is limited to [-100, 100]; at 100 the bump has left the line
    UK.anim(an.range().property("ADBE Text Percent Offset"), [[t0 + dur * lag, Math.max(-100, -Win - W / 2)], [t0 + dur * lag + dur * k, 100]], [o.curve || "outSoft"]);
    return an;
};

UK.TX.mask = function (L, padTop, padBottom) {
    var r = L.sourceRectAtTime(L.inPoint, false);
    var M = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    M.name = "UK Line Mask";
    var x0 = r.left - 4000, x1 = r.left + r.width + 4000, y0 = r.top - padTop, y1 = r.top + r.height + padBottom;
    L.property("ADBE Mask Parade").property("UK Line Mask").property("ADBE Mask Shape").setValue(UK.makeShape([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]));
    L.property("ADBE Mask Parade").property("UK Line Mask").property("ADBE Mask Feather").setValue([0, padBottom * 0.25]);
};

/* helper layer that should be removed when the preset is re-applied */
UK.TX.helper = function (L, H) {
    H.comment = "UK helper: " + L.name;
    H.moveAfter(L);
    H.inPoint = L.inPoint; H.outPoint = L.outPoint;
    return H;
};
UK.TX.ref = function (L) { return 'thisComp.layer("' + L.name.replace(/"/g, '\\"') + '")'; };

/* ------------------------------------------------- generic preset table
   in/out: hidden state in em units (pos/blur scaled by font size)           */
UK.TX.GENERIC = {
    tx01: { based: 1, W: 40, inP: { opacity: 0, pos: [0, 0.55] }, outP: { opacity: 0, pos: [0, -0.45] } },
    tx02: { based: 1, W: 55, inP: { opacity: 0, blur: [0.35, 0.35] }, outP: { opacity: 0, blur: [0.35, 0.35] } },
    tx07: { based: 1, W: 45, threeD: true, inP: { opacity: 0, rotX: -90, pos: [0, 0.25] }, outP: { opacity: 0, rotX: 90, pos: [0, -0.25] } },
    tx10: { based: 1, W: 30, random: true, inP: { opacity: 0, blur: [0.15, 0.15] }, outP: { opacity: 0, blur: [0.15, 0.15] } },
    tx13: { based: 3, W: 65, inP: { opacity: 0, pos: [0.7, 0], blur: [0.2, 0] }, outP: { opacity: 0, pos: [-0.7, 0], blur: [0.2, 0] } }
};
UK.TX.em = function (p, fs) {
    var o = {}, k;
    for (k in p) if (p.hasOwnProperty(k)) o[k] = p[k];
    if (o.pos) o.pos = [o.pos[0] * fs, o.pos[1] * fs];
    if (o.blur) o.blur = [o.blur[0] * fs, o.blur[1] * fs];
    return o;
};

/* ------------------------------------------------------------- presets
   Each preset: function (L, ctx) where ctx = { comp, fs, mode, tIn, dIn, tOut, dOut, accent }  */
UK.TX.P = {};

UK.TX.generic = function (key) {
    return function (L, x) {
        var g = UK.TX.GENERIC[key];
        if (g.threeD) L.threeDPerChar = true;
        if (x.doIn) UK.TX.cascade(L, "in", UK.TX.em(g.inP, x.fs), g, x.tIn, x.dIn);
        if (x.doOut) UK.TX.cascade(L, "out", UK.TX.em(g.outP, x.fs), g, x.tOut, x.dOut);
    };
};
UK.TX.P.tx01 = UK.TX.generic("tx01");
UK.TX.P.tx02 = UK.TX.generic("tx02");
UK.TX.P.tx07 = UK.TX.generic("tx07");
UK.TX.P.tx10 = UK.TX.generic("tx10");
UK.TX.P.tx13 = UK.TX.generic("tx13");

/* Pop Scale: every letter grows from 0 with a soft S-curve, swells a little past full size and
   settles - one smooth bell (no corners), letters overlapping in time                          */
UK.TX.P.tx04 = function (L, x) {
    UK.TX.setGroup(L, 1);
    if (x.doIn) {
        UK.TX.cascade(L, "in", { scale: [0, 0], opacity: 0 }, { W: 45, hi: 85, lo: 85, curve: "smooth" }, x.tIn, x.dIn);
        UK.TX.bump(L, "UK In Swell", { scale: [112, 112] }, { W: 40, Win: 45, lag: 0.1, curve: "smooth" }, x.tIn, x.dIn * 1.1);
    }
    if (x.doOut) UK.TX.cascade(L, "out", { scale: [0, 0], opacity: 0 }, { W: 45, hi: 85, lo: 85, curveOut: "inout" }, x.tOut, x.dOut);
};

/* Line Rise: characters rise from behind an invisible line (mask) */
UK.TX.P.tx05 = function (L, x) {
    UK.TX.mask(L, x.fs * 0.3, x.fs * 0.12);
    if (x.doIn) UK.TX.cascade(L, "in", { pos: [0, x.fs * 1.15] }, { W: 45, lo: 85, curve: "outSoft" }, x.tIn, x.dIn);
    if (x.doOut) UK.TX.cascade(L, "out", { pos: [0, -x.fs * 1.25] }, { W: 45, lo: 85 }, x.tOut, x.dOut);
};

/* Tracking In: letter-spacing collapses while it sharpens */
UK.TX.P.tx06 = function (L, x) {
    if (x.doIn) {
        var a = UK.TX.animator(L, "UK In", { track: 420, blur: [x.fs * 0.2, 0], opacity: 0 }, { based: 1, shape: 1, start: 0, end: 100 });
        UK.anim(a.range().property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount"), [[x.tIn, 100], [x.tIn + x.dIn, 0]], ["quint"]);
    }
    if (x.doOut) {
        var b = UK.TX.animator(L, "UK Out", { track: 420, blur: [x.fs * 0.2, 0], opacity: 0 }, { based: 1, shape: 1, start: 0, end: 100 });
        UK.anim(b.range().property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount"), [[x.tOut, 0], [x.tOut + x.dOut, 100]], ["quintIn"]);
    }
};

/* Wave Loop: a soft sine wave runs through the letters forever. The wave's phase is one keyframed
   slider (UK Wave Phase 0 -> 360, linear, loopOut) - move its keys closer for a faster wave;
   UK Wave Height sets how far the letters lift.                                                */
UK.TX.P.tx08 = function (L, x) {
    UK.TX.setGroup(L, 1);
    UK.slider(L, "UK Wave Height", 100);
    UK.slider(L, "UK Wave Phase", 0);
    var T = Math.max(1.2, x.dIn * 1.6);
    UK.anim(UK.efx(L, "UK Wave Phase").property(1), [[x.tIn, 0], [x.tIn + T, 360]], ["linear"], { expr: 'loopOut("cycle")' });
    var a = UK.TX.animator(L, "UK Wave", { pos: [0, -x.fs * 0.22] }, { based: 1, shape: 1, start: 0, end: 100 });
    UK.TX.exprSel(a, 1, UK.TX.SEL + 'var ph = effect("UK Wave Phase")(1) * Math.PI / 180, h = effect("UK Wave Height")(1) / 100;\n' +
        'var w = Math.sin(ph - (textIndex - 1) * 0.55);\n[s * w * h, s * w * h, s];');
};

/* Bounce Drop: letters fall in on a soft S-curve and land with two gentle, rounded hops */
UK.TX.P.tx09 = function (L, x) {
    UK.TX.setGroup(L, 1);
    if (x.doIn) {
        UK.TX.cascade(L, "in", { pos: [0, -x.fs * 1.4], opacity: 0 }, { W: 38, hi: 80, lo: 80, curve: "smooth" }, x.tIn, x.dIn);
        UK.TX.bump(L, "UK In Hop", { pos: [0, -x.fs * 0.22] }, { W: 30, Win: 38, lag: 0.2, curve: "smooth" }, x.tIn, x.dIn);
        UK.TX.bump(L, "UK In Hop 2", { pos: [0, -x.fs * 0.07] }, { W: 26, Win: 38, lag: 0.42, curve: "smooth" }, x.tIn, x.dIn);
    }
    if (x.doOut) UK.TX.cascade(L, "out", { pos: [0, x.fs * 0.9], opacity: 0 }, { W: 38, hi: 80, lo: 80, curveOut: "inout" }, x.tOut, x.dOut);
};

/* Random Fade: letters fade up in random order - slowly, out of a soft blur and a slightly smaller size */
UK.TX.P.tx10 = function (L, x) {
    UK.TX.setGroup(L, 1);
    if (x.doIn) UK.TX.cascade(L, "in", { opacity: 0, blur: [x.fs * 0.25, x.fs * 0.25], scale: [88, 88] }, { W: 60, hi: 90, lo: 90, random: true, seed: 7, curve: "smooth" }, x.tIn, x.dIn * 1.5);
    if (x.doOut) UK.TX.cascade(L, "out", { opacity: 0, blur: [x.fs * 0.25, x.fs * 0.25], scale: [88, 88] }, { W: 60, hi: 90, lo: 90, random: true, seed: 3, curveOut: "inout" }, x.tOut, x.dOut * 1.2);
};

/* Elastic Stretch: letters grow up from the baseline, stretch a little taller and settle -
   all on smooth bells and eased ramps                                                         */
UK.TX.P.tx11 = function (L, x) {
    UK.TX.setGroup(L, 1);
    if (x.doIn) {
        UK.TX.cascade(L, "in", { scale: [100, 0], opacity: 0 }, { W: 42, hi: 85, lo: 85, curve: "smooth" }, x.tIn, x.dIn);
        UK.TX.bump(L, "UK In Stretch", { scale: [94, 118] }, { W: 38, Win: 42, lag: 0.12, curve: "smooth" }, x.tIn, x.dIn * 1.1);
    }
    if (x.doOut) UK.TX.cascade(L, "out", { scale: [100, 0], opacity: 0 }, { W: 42, hi: 85, lo: 85, curveOut: "inout" }, x.tOut, x.dOut);
};

/* Split Center: reveal from the middle outwards (two selectors) */
UK.TX.P.tx12 = function (L, x) {
    function build(name, t0, d, closing) {
        var an = UK.TX.animator(L, name, { opacity: 0, scale: [70, 70], blur: [x.fs * 0.12, x.fs * 0.12] }, { based: 1, shape: 1, start: 0, end: 100 });
        var sels = an.group().property("ADBE Text Selectors");
        var s2 = sels.addProperty("ADBE Text Selector");
        s2.name = "Center";
        var C = an.group().property("ADBE Text Selectors").property("Center");
        C.property("ADBE Text Range Advanced").property("ADBE Text Selector Mode").setValue(2);
        C.property("ADBE Text Range Advanced").property("ADBE Text Selector Smoothness").setValue(100);
        var a = closing ? [0, 50] : [50, 0], b = closing ? [100, 50] : [50, 100];
        var cv = closing ? "in" : "outSoft";
        UK.anim(an.group().property("ADBE Text Selectors").property("Center").property("ADBE Text Percent Start"), [[t0, a[0]], [t0 + d, a[1]]], [cv]);
        UK.anim(an.group().property("ADBE Text Selectors").property("Center").property("ADBE Text Percent End"), [[t0, b[0]], [t0 + d, b[1]]], [cv]);
    }
    if (x.doIn) build("UK In", x.tIn, x.dIn, false);
    if (x.doOut) build("UK Out", x.tOut, x.dOut, true);
};
/* -------------------------------------------------------------- SaaS
   Recreated from the reference packs. Every move is a keyframe with a speed-ramp:
   text-animator Offset / Amount keys, effect sliders (UK ...) and helper layers.        */

/* text-animator grouping: 1 characters, 2 words, 3 lines, 4 all (whole text scales as one) */
UK.TX.setGroup = function (L, v) {
    try { L.property("ADBE Text Properties").property("ADBE Text More Options").property("ADBE Text Anchor Point Option").setValue(v); } catch (e) { }
};
/* animator applied to the whole text; returns an accessor for its keyframable Amount */
UK.TX.whole = function (L, name, props) {
    var an = UK.TX.animator(L, name, props, { based: 1, shape: 1, start: 0, end: 100 });
    return function () { return an.range().property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount"); };
};
/* expression selector that scales the animator per unit (words / chars) */
UK.TX.exprSel = function (an, based, expr) {
    an.group().property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
    var es = an.group().property("ADBE Text Selectors").property(2);
    try { es.property("ADBE Text Range Type2").setValue(based); } catch (e) { }
    es.property("ADBE Text Expressible Amount").expression = expr;
};
UK.TX.SEL = "var s = (selectorValue instanceof Array) ? selectorValue[0] : selectorValue;\n";
/* accent colour that trails behind a cascade (letters arrive coloured, then turn to their own colour) */
UK.TX.trail = function (L, x, based, W, t0, dur, curve) {
    var c = UK.TX.animator(L, "UK Accent", { fill: x.accent }, { based: based, shape: 2, start: 0, end: W, hi: 0, lo: 60 });
    UK.anim(c.range().property("ADBE Text Percent Offset"), [[t0, -W], [t0 + dur, 100]], [curve || "smooth"]);
};
/* generic soft exit */
UK.TX.outSoft = function (L, x, based, o) {
    o = o || {};
    UK.TX.cascade(L, "out", { opacity: 0, blur: [x.fs * 0.12, x.fs * 0.12], pos: [0, -x.fs * (o.up === undefined ? 0.25 : o.up)] }, { based: based || 3, W: o.W || 50, curveOut: o.curve || "inSoft" }, x.tOut, x.dOut);
};
UK.TX.holdEnd = function (x) { return x.doOut ? x.tOut : x.tIn + x.dIn + Math.max(1.5, x.hold); };
UK.TX.glow = function (L, x, keys, curves) {
    UK.fx(L, "ADBE Glo2", "UK Glow");
    var g = UK.efx(L, "UK Glow");
    g.property("ADBE Glo2-0002").setValue(45);
    g.property("ADBE Glo2-0003").setValue(Math.round(x.fs * 0.55));
    UK.anim(UK.efx(L, "UK Glow").property("ADBE Glo2-0004"), keys, curves);
};
/* duplicate the text as a helper layer that rides on the original (parented) */
UK.TX.ghost = function (L, name, hex) {
    var D = L.duplicate();
    D.name = name;
    D.parent = L;
    if (hex) {
        UK.fx(D, "ADBE Fill", "UK Fill");
        UK.efx(D, "UK Fill").property("ADBE Fill-0002").setValue(UK.rgba(hex));
    }
    UK.TX.helper(L, D);
    return D;
};
UK.TX.layerRect = function (L, t) { return L.sourceRectAtTime(t, false); };

/* 01 Focus Pop: big, grey and soft -> settles white, then keeps drifting smaller */
UK.TX.P.st01 = function (L, x) {
    UK.TX.setGroup(L, 4);
    if (x.doIn) {
        var a = UK.TX.whole(L, "UK In", { scale: [145, 145], opacity: 0, blur: [x.fs * 0.1, x.fs * 0.1], fill: "#8B8B93" });
        UK.anim(a(), [[x.tIn, 100], [x.tIn + x.dIn, 0]], ["expo"]);
    }
    var d = UK.TX.whole(L, "UK Drift", { scale: [92, 92] });
    var t1 = x.doIn ? x.tIn + x.dIn * 0.5 : x.tIn;
    UK.anim(d(), [[t1, 0], [UK.TX.holdEnd(x) + (x.doOut ? x.dOut : 0), 100]], ["smooth"]);
    if (x.doOut) { var b = UK.TX.whole(L, "UK Out", { opacity: 0, scale: [85, 85], blur: [x.fs * 0.1, x.fs * 0.1] }); UK.anim(b(), [[x.tOut, 0], [x.tOut + x.dOut, 100]], ["expoIn"]); }
};
/* 02 Accent Zoom: same family, arrives in the accent colour from further away */
UK.TX.P.st02 = function (L, x) {
    UK.TX.setGroup(L, 4);
    if (x.doIn) {
        var a = UK.TX.whole(L, "UK In", { scale: [170, 170], opacity: 0, blur: [x.fs * 0.16, x.fs * 0.16] });
        UK.anim(a(), [[x.tIn, 100], [x.tIn + x.dIn, 0]], ["expo"]);
        var c = UK.TX.whole(L, "UK Accent", { fill: x.accent });
        UK.anim(c(), [[x.tIn, 100], [x.tIn + x.dIn * 1.4, 0]], ["smooth"]);
    }
    var d = UK.TX.whole(L, "UK Drift", { scale: [94, 94] });
    UK.anim(d(), [[x.doIn ? x.tIn + x.dIn * 0.5 : x.tIn, 0], [UK.TX.holdEnd(x) + (x.doOut ? x.dOut : 0), 100]], ["smooth"]);
    if (x.doOut) { var b = UK.TX.whole(L, "UK Out", { opacity: 0, scale: [80, 80], blur: [x.fs * 0.12, x.fs * 0.12] }); UK.anim(b(), [[x.tOut, 0], [x.tOut + x.dOut, 100]], ["expoIn"]); }
};
/* 03 Word Pop: words pop in one after another */
UK.TX.P.st03 = function (L, x) {
    UK.TX.setGroup(L, 2);
    if (x.doIn) UK.TX.cascade(L, "in", { opacity: 0, scale: [55, 55], pos: [0, x.fs * 0.18] }, { based: 3, W: 18, lo: 60, curve: "quint" }, x.tIn, x.dIn);
    if (x.doOut) UK.TX.cascade(L, "out", { opacity: 0, scale: [70, 70], pos: [0, -x.fs * 0.15] }, { based: 3, W: 20, curveOut: "quintIn" }, x.tOut, x.dOut);
};
/* 04 Random Glow Words: words appear in random order in the accent colour, then turn white */
UK.TX.P.st04 = function (L, x) {
    if (x.doIn) {
        UK.TX.cascade(L, "in", { opacity: 0, blur: [x.fs * 0.15, x.fs * 0.15] }, { based: 3, W: 30, lo: 70, random: true, seed: 5, curve: "outSoft" }, x.tIn, x.dIn);
        var c = UK.TX.animator(L, "UK Accent", { fill: x.accent }, { based: 3, shape: 2, start: 0, end: 45, hi: 0, lo: 50, random: true, seed: 5 });
        UK.anim(c.range().property("ADBE Text Percent Offset"), [[x.tIn + x.dIn * 0.25, -45], [x.tIn + x.dIn * 1.6, 100]], ["smooth"]);
    }
    if (x.doOut) UK.TX.cascade(L, "out", { opacity: 0, blur: [x.fs * 0.15, x.fs * 0.15] }, { based: 3, W: 35, random: true, seed: 9, curveOut: "inSoft" }, x.tOut, x.dOut);
};
/* 05 Char Color Cascade: letters type on left to right, arrive in the accent colour */
UK.TX.P.st05 = function (L, x) {
    if (x.doIn) {
        UK.TX.cascade(L, "in", { opacity: 0, pos: [0, x.fs * 0.12], blur: [x.fs * 0.06, x.fs * 0.06] }, { based: 1, W: 22, lo: 70, curve: "outSoft" }, x.tIn, x.dIn);
        UK.TX.trail(L, x, 1, 35, x.tIn + x.dIn * 0.2, x.dIn * 1.25);
    }
    if (x.doOut) UK.TX.cascade(L, "out", { opacity: 0, pos: [0, x.fs * 0.2] }, { based: 1, W: 25, curveOut: "inSoft" }, x.tOut, x.dOut);
};
/* 06 Soft Mask Rise: letters rise out of a soft fade at the bottom, fall back on exit */
UK.TX.P.st06 = function (L, x) {
    var r = L.sourceRectAtTime(L.inPoint, false);
    var M = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    M.name = "UK Soft Mask";
    // AE feathers half inside / half outside the mask edge: put the whole soft band under the text,
    // and start the letters below the band so nothing shows until they cross the mask line
    var f = x.fs * 0.22, bottom = r.top + r.height + f / 2 + x.fs * 0.02;
    var x0 = r.left - 4000, x1 = r.left + r.width + 4000, y0 = r.top - x.fs * 1.2, y1 = bottom;
    L.property("ADBE Mask Parade").property("UK Soft Mask").property("ADBE Mask Shape").setValue(UK.makeShape([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]));
    L.property("ADBE Mask Parade").property("UK Soft Mask").property("ADBE Mask Feather").setValue([0, f]);
    var drop = (bottom + f / 2 - r.top) + x.fs * 0.1;
    if (x.doIn) UK.TX.cascade(L, "in", { pos: [0, drop] }, { based: 1, W: 35, lo: 85, curve: "quint" }, x.tIn, x.dIn);
    if (x.doOut) UK.TX.cascade(L, "out", { pos: [0, drop] }, { based: 1, W: 35, curveOut: "quintIn" }, x.tOut, x.dOut);
};
/* 07 Letter Drop Swing: letters fall in from above with a swing, rotate away on exit */
UK.TX.P.st07 = function (L, x) {
    UK.TX.setGroup(L, 1);
    if (x.doIn) UK.TX.cascade(L, "in", { pos: [0, -x.fs * 1.1], rot: -40, opacity: 0 }, { based: 1, W: 30, lo: 80, curve: "outSoft" }, x.tIn, x.dIn);
    if (x.doOut) UK.TX.cascade(L, "out", { pos: [0, -x.fs * 0.8], rot: 35, opacity: 0 }, { based: 1, W: 30, curveOut: "inSoft" }, x.tOut, x.dOut);
};
/* 08 / 32 Stair Words: words start on a diagonal staircase and settle into one line.
   sign -1: the stairs hang above the line and come down (08); +1: they sit below and rise up (32) */
UK.TX.stair = function (L, x, sign) {
    function build(name, t0, d, dir) {
        // words show up on the staircase first, then glide into one line
        // the first word is the farthest from the line, each next one a step closer
        var W = 80, an = UK.TX.animator(L, name + " Stair", { pos: [0, sign * x.fs * 1.5] }, { based: 3, shape: dir === "in" ? 2 : 3, start: 0, end: W, hi: 60, lo: 92 });
        UK.anim(an.range().property("ADBE Text Percent Offset"), dir === "in" ? [[t0, -W], [t0 + d * 1.15, 100]] : [[t0, -W], [t0 + d, 100]], [dir === "in" ? "outSoft" : "inSoft"]);
        UK.TX.exprSel(an, 3, UK.TX.SEL + "var k = 1 - (textIndex - 1) / Math.max(1, textTotal) * 0.8;\n[s, s * k, s];");
        if (dir === "in") UK.TX.cascade(L, "in", { opacity: 0, blur: [0, x.fs * 0.1] }, { based: 3, W: 30, curve: "quint" }, t0, d * 0.45);
        else UK.TX.cascade(L, "out", { opacity: 0, blur: [0, x.fs * 0.1] }, { based: 3, W: 45, curveOut: "inSoft" }, t0 + d * 0.3, d * 0.7);
    }
    if (x.doIn) build("UK In", x.tIn, x.dIn, "in");
    if (x.doOut) build("UK Out", x.tOut, x.dOut, "out");
};
UK.TX.P.st08 = function (L, x) { UK.TX.stair(L, x, -1); };   // comes down from above
UK.TX.P.st32 = function (L, x) { UK.TX.stair(L, x, 1); };    // rises up from below
/* 09 Accent Word Wave: words fade up one by one, the accent colour washes over them */
UK.TX.P.st09 = function (L, x) {
    if (x.doIn) {
        UK.TX.cascade(L, "in", { opacity: 0, blur: [x.fs * 0.1, x.fs * 0.1], pos: [0, x.fs * 0.12] }, { based: 3, W: 45, lo: 85, curve: "outSoft" }, x.tIn, x.dIn);
        UK.TX.trail(L, x, 3, 50, x.tIn + x.dIn * 0.3, x.dIn * 1.4);
    }
    if (x.doOut) UK.TX.outSoft(L, x, 3);
};
/* 10 Zoom Blast: the word punches in from a huge scale with motion blur */
UK.TX.P.st10 = function (L, x) {
    UK.TX.setGroup(L, 4);
    try { L.motionBlur = true; x.comp.motionBlur = true; } catch (e) { }
    if (x.doIn) {
        var a = UK.TX.whole(L, "UK In", { scale: [800, 800], blur: [x.fs * 0.25, x.fs * 0.25] });
        UK.anim(a(), [[x.tIn, 100], [x.tIn + x.dIn, 0]], ["expo"]);
        var o = UK.TX.whole(L, "UK In Fade", { opacity: 0 });
        UK.anim(o(), [[x.tIn, 100], [x.tIn + x.dIn * 0.25, 0]], ["outSoft"]);
    }
    if (x.doOut) {
        var b = UK.TX.whole(L, "UK Out", { scale: [400, 400], opacity: 0, blur: [x.fs * 0.2, x.fs * 0.2] });
        UK.anim(b(), [[x.tOut, 0], [x.tOut + x.dOut, 100]], ["expoIn"]);
    }
};
/* 11 Sparkle Reveal: a four-point glint flies across and the text appears behind it */
UK.TX.P.st11 = function (L, x) {
    // the glint sweeps on the way in and again on the way out
    var tA = x.doIn ? x.tIn : x.tOut, dA = x.doIn ? x.dIn * 1.2 : x.dOut;
    var r = UK.TX.layerRect(L, (x.doIn ? x.tIn + x.dIn : x.tIn) + 0.05), ref = UK.TX.ref(L), S = Math.round(x.fs * 0.9);
    var gap = S * 0.62, span = r.width + gap * 2;
    // the glint travels from just before the first letter to just past the last one
    UK.slider(L, "UK Sparkle", 0);
    UK.anim(UK.efx(L, "UK Sparkle").property(1), [[tA, 0], [tA + dA, 100]], ["inout"]);
    // on the way in each letter is revealed by the glint's own position (same slider), so the text
    // can never run ahead of the star: a letter starts once the star reaches it and is fully on
    // `fw` behind it; the last letter completes as the star comes to rest beside it
    if (x.doIn) {
        var reveal = function (name, props, fw) {
            var an = UK.TX.animator(L, name, props, { based: 1, start: 0, end: 100 });
            UK.TX.exprSel(an, 1, 'var p = clamp(thisLayer.effect("UK Sparkle")(1), 0, 100) / 100;\n' +
                'var sx = ' + (r.left - gap) + ' + ' + span + ' * p;\n' +
                'var lx = ' + r.left + ' + ' + r.width + ' * (textIndex - 0.5) / textTotal;\n' +
                '100 * (1 - ease(sx - lx, 0, ' + fw + ', 0, 1));');
        };
        reveal("UK In", { opacity: 0, blur: [x.fs * 0.08, x.fs * 0.08] }, Math.round(gap * 0.6));
        reveal("UK In Accent", { fill: x.accent }, Math.round(gap * 0.95));
    }
    if (x.doOut) UK.TX.cascade(L, "out", { opacity: 0, blur: [x.fs * 0.08, x.fs * 0.08] }, { based: 1, W: 25, curveOut: "inSoft" }, x.tOut, x.dOut);
    // a big invisible frame gives the glow room, so it is never cropped at the layer edge
    var room = function (Ly) {
        UK.addRect(UK.vecs(UK.group(UK.root(Ly), "Glow Room")), [S * 6, S * 6], [0, 0]);
        UK.addFill(UK.vecs(UK.root(Ly).property("Glow Room")), "#000000", 0);
    };
    var H = UK.shapeLayer(x.comp, "Sparkle Haze");
    room(H);
    UK.addEllipse(UK.vecs(UK.group(UK.root(H), "Haze")), [S * 1.4, S * 1.4], [0, 0]);
    UK.addFill(UK.vecs(UK.root(H).property("Haze")), x.accent, 80);
    UK.fx(H, "ADBE Gaussian Blur 2", "Soft");
    UK.efx(H, "Soft").property("ADBE Gaussian Blur 2-0001").setValue(Math.round(S * 0.45));
    var St = UK.shapeLayer(x.comp, "Sparkle");
    room(St);
    UK.addStar(UK.vecs(UK.group(UK.root(St), "Star")), { points: 4, outer: S / 2, inner: S * 0.07, innerRound: 0 });
    UK.addFill(UK.vecs(UK.root(St).property("Star")), "#FFFFFF");
    UK.fx(St, "ADBE Glo2", "Glow");
    UK.efx(St, "Glow").property("ADBE Glo2-0003").setValue(Math.round(S * 0.4));
    var posExpr = 'var t = ' + ref + ';\nvar p = clamp(t.effect("UK Sparkle")(1), 0, 100) / 100;\nt.toComp([' + (r.left - gap) + ' + ' + span + ' * p, ' + (r.top + r.height / 2) + ']);';
    UK.pos(St).expression = posExpr;
    UK.pos(H).expression = posExpr;
    // grows on, travels at full size, stops beside the last letter, then shrinks away there
    var sc = [[tA - 0.05, [0, 0]], [tA + dA * 0.2, [100, 100]], [tA + dA + 0.12, [100, 100]], [tA + dA + 0.55, [0, 0]]];
    UK.anim(UK.scale(St), sc, ["outSoft", "linear", "inSoft"]);
    UK.anim(UK.scale(H), sc, ["outSoft", "linear", "inSoft"]);
    UK.anim(UK.rot(St), [[tA - 0.05, -45], [tA + dA + 0.55, 160]], ["inout"]);
    UK.TX.helper(L, H); UK.TX.helper(L, St);
    St.moveBefore(L); H.moveAfter(St);
};
/* 12 Glow Assemble: letters fly in from all around with a glow and settle */
UK.TX.P.st12 = function (L, x) {
    UK.TX.setGroup(L, 1);
    function build(name, t0, d, dir) {
        // wide, overlapping selection + zero-speed start and a long soft landing = calm, smooth assembly
        var W = 70, sel = { based: 1, shape: dir === "in" ? 2 : 3, start: 0, end: W, hi: 0, lo: 100, random: true, seed: 11 };
        var cv = [dir === "in" ? [38, 92] : [88, 30]];
        var f = UK.TX.animator(L, name, { opacity: 0, blur: [x.fs * 0.14, x.fs * 0.14] }, sel);
        UK.anim(f.range().property("ADBE Text Percent Offset"), [[t0, -W], [t0 + d * (dir === "in" ? 0.75 : 1), 100]], cv);
        var an = UK.TX.animator(L, name + " Scatter", { pos: [x.fs * 2.2, x.fs * 1.6], rot: 60 }, sel);
        UK.anim(an.range().property("ADBE Text Percent Offset"), [[t0, -W], [t0 + d, 100]], cv);
        UK.TX.exprSel(an, 1, UK.TX.SEL + "seedRandom(textIndex * 13, true);\n[random(-1, 1) * s, random(-1, 1) * s, s];");
    }
    if (x.doIn) { build("UK In", x.tIn, x.dIn * 2.2, "in"); UK.TX.trail(L, x, 1, 60, x.tIn + x.dIn * 0.8, x.dIn * 1.8); }
    if (x.doOut) build("UK Out", x.tOut, x.dOut * 1.3, "out");
    var g0 = x.doIn ? x.tIn : x.tOut;
    UK.TX.glow(L, x, x.doIn ? [[g0, 2.4], [g0 + x.dIn * 2.6, 0.5]] : [[g0, 0.5], [g0 + x.dOut * 1.3, 2]], ["smooth"]);
};
/* 13 Decode: letters arrive scrambled in the accent colour and resolve left to right */
UK.TX.P.st13 = function (L, x) {
    function dec(name, a, b, t0, d, curve) {
        var an = UK.TX.animator(L, name, { fill: x.accent }, { based: 1, shape: 1, start: a, end: 100, smooth: 0 });
        var P = an.group().property("ADBE Text Animator Properties");
        P.addProperty("ADBE Text Character Offset");
        an.group().property("ADBE Text Animator Properties").property("ADBE Text Character Offset").expression = "Math.round(random(3, 24));";
        UK.anim(an.range().property("ADBE Text Percent Start"), [[t0, a], [t0 + d, b]], [curve]);
    }
    if (x.doIn) {
        UK.TX.cascade(L, "in", { opacity: 0 }, { based: 1, W: 12, lo: 50, curve: "linear" }, x.tIn, x.dIn * 0.7);
        dec("UK In Decode", 0, 100, x.tIn + x.dIn * 0.25, x.dIn, "inout");
    }
    if (x.doOut) {
        dec("UK Out Decode", 100, 0, x.tOut, x.dOut * 0.6, "inout");
        UK.TX.cascade(L, "out", { opacity: 0 }, { based: 1, W: 12, curveOut: "linear" }, x.tOut + x.dOut * 0.3, x.dOut * 0.7);
    }
};
/* 14 / 29 / 30 / 31 Echo Stack: the text slides in from one side, holds, and leaves to the opposite
   side; lilac echoes trail behind it both ways. The text stays lilac until it lands, then turns white.
   dir = side it comes FROM: [1,0] right, [-1,0] left, [0,1] bottom, [0,-1] top                     */
UK.TX.echo = function (L, x, dir) {
    var n = 6, ghosts = [], i;
    for (i = 1; i <= n; i++) ghosts.push(UK.TX.ghost(L, L.name + " - Echo " + i, x.accent));
    // start / end fully outside the frame: distance from the text's edge to the comp edge (+ margin)
    var ax = dir[0] ? 0 : 1, size = ax ? x.comp.height : x.comp.width;
    var tr = L.property("ADBE Transform Group"), r = UK.TX.layerRect(L, x.tIn + x.dIn + 0.05);
    var sc = tr.property("ADBE Scale").value[ax] / 100, P = tr.property("ADBE Position").value[ax], A = tr.property("ADBE Anchor Point").value[ax];
    var lo = P + ((ax ? r.top : r.left) - A) * sc, hi = lo + (ax ? r.height : r.width) * sc, m = x.fs * 0.6;
    var toFar = (size - lo + m) / sc, toNear = (hi + m) / sc;   // to the right/bottom edge, to the left/top edge
    var sgn = dir[0] + dir[1];
    var D = sgn > 0 ? toFar : toNear, Dout = sgn > 0 ? toNear : toFar;
    var lag = Math.max(0.03, x.dIn * 0.045), lagOut = Math.max(0.025, x.dOut * 0.05);
    // the same move on the text and on every echo; echo k runs k steps later
    function move(Ly, dl, dlo) {
        UK.TX.setGroup(Ly, 4);
        if (x.doIn) {
            var a = UK.TX.whole(Ly, "UK In Move", { pos: [dir[0] * D, dir[1] * D] });
            UK.anim(a(), [[x.tIn + dl, 100], [x.tIn + dl + x.dIn * 1.1, 0]], ["quint"]);
        }
        if (x.doOut) {
            var b = UK.TX.whole(Ly, "UK Out Move", { pos: [-dir[0] * Dout, -dir[1] * Dout] });
            UK.anim(b(), [[x.tOut + dlo, 0], [x.tOut + dlo + x.dOut, 100]], ["quintIn"]);
        }
    }
    move(L, 0, 0);
    if (x.doIn) {
        var f = UK.TX.whole(L, "UK In Fade", { opacity: 0 });
        UK.anim(f(), [[x.tIn, 100], [x.tIn + x.dIn * 0.15, 0]], ["outSoft"]);
    }
    // the original text keeps its own (white) colour; the echoes are lilac while they travel and
    // turn white as they reach the centre (Fill effect opacity -> 0), lilac again when they leave
    for (i = 0; i < n; i++) {
        var G = ghosts[i], k = i + 1, op = 78 - i * 10;
        move(G, k * lag, k * lagOut);
        var fk = [], fc = [], land = x.tIn + k * lag + x.dIn * 1.1;
        if (x.doIn) { fk.push([land - x.dIn * 0.35, 1], [land, 0]); fc.push("smooth"); }
        if (x.doOut) { if (fk.length) fc.push("linear"); fk.push([x.tOut + k * lagOut, 0], [x.tOut + k * lagOut + x.dOut * 0.2, 1]); fc.push("smooth"); }
        if (fk.length) UK.anim(UK.efx(G, "UK Fill").property("Opacity"), fk, fc);
        // echoes are only visible while the text moves
        var ok = [], oc = [];
        if (x.doIn) { ok.push([x.tIn, op], [x.tIn + x.dIn * 0.7, op], [x.tIn + x.dIn * 1.2 + k * lag, 0]); oc.push("linear", "inSoft"); }
        if (x.doOut) { if (ok.length) oc.push("linear"); ok.push([x.tOut, 0], [x.tOut + x.dOut * 0.15, op]); oc.push("outSoft"); }
        if (ok.length > 1) UK.anim(UK.opac(G), ok, oc); else UK.opac(G).setValue(x.doIn ? op : 0);
    }
};
UK.TX.P.st14 = function (L, x) { UK.TX.echo(L, x, [1, 0]); };    // from the right
UK.TX.P.st29 = function (L, x) { UK.TX.echo(L, x, [-1, 0]); };   // from the left
UK.TX.P.st30 = function (L, x) { UK.TX.echo(L, x, [0, 1]); };    // from the bottom
UK.TX.P.st31 = function (L, x) { UK.TX.echo(L, x, [0, -1]); };   // from the top
/* 15 Glow Counter: the number counts up with a glow and a soft rise */
UK.TX.P.st15 = function (L, x) {
    var td = UK.textDoc(L);
    var raw = String(td.value.text);
    var num = parseFloat(raw.replace(/[^0-9.]/g, "")) || 110000;
    var suffix = raw.replace(/^[^0-9]*[0-9.,]+/, "");
    var prefix = raw.match(/^[^0-9]*/) ? raw.match(/^[^0-9]*/)[0] : "";
    var plus = suffix.indexOf("+") >= 0;
    suffix = suffix.replace(/\+/g, "");
    /*  Controls (Effect Controls):
          UK Count To     the number it counts to (type any value, e.g. 200)
          UK Progress     0 -> 100 % : the keyframed, eased count-up (independent of the number,
                          so changing "Count To" never breaks the easing)
          UK Currency     None / $ / EUR / GBP / GEL / JPY
          UK Plus         "+" at the end on / off
          UK Separators   thousands separator on / off                                       */
    var SYMS = ["None", "$", "€", "£", "₾", "¥"];
    var cur = 1;
    for (var si = 1; si < SYMS.length; si++) if (prefix.indexOf(SYMS[si]) >= 0) cur = si + 1;
    UK.slider(L, "UK Count To", num);
    UK.slider(L, "UK Progress", x.doIn ? 0 : 100);
    if (x.doIn) UK.anim(UK.efx(L, "UK Progress").property(1), [[x.tIn, 0], [x.tIn + Math.max(1.2, x.dIn * 1.8), 100]], [[22, 88]]);
    // setting the menu items turns the effect into a new object and drops its name,
    // so it is found again by index and renamed
    UK.fx(L, "ADBE Dropdown Control", "UK Currency");
    var EP = L.property("ADBE Effect Parade"), ddIdx = EP.numProperties;
    try {
        EP.property(ddIdx).property(1).setPropertyParameters(SYMS);
        EP = L.property("ADBE Effect Parade");
        EP.property(ddIdx).name = "UK Currency";
        EP.property(ddIdx).property(1).setValue(cur);
    } catch (eDD) { }
    UK.checkCtl(L, "UK Plus", plus);
    UK.checkCtl(L, "UK Separators", true);
    td.expression = [
        'var to = effect("UK Count To")(1), p = clamp(effect("UK Progress")(1), 0, 100) / 100;',
        'var n = Math.round(to * p);',
        'var s = String(Math.abs(n));',
        'if (effect("UK Separators")(1) == 1) s = s.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");',
        'var syms = ["", "$", "\\u20AC", "\\u00A3", "\\u20BE", "\\u00A5"], c = 0;',
        'try { c = effect("UK Currency")(1) - 1; } catch (e) { c = 0; }',
        '(n < 0 ? "-" : "") + (syms[c] || "") + s + "' + suffix.replace(/"/g, '\\"') + '" + (effect("UK Plus")(1) == 1 ? "+" : "");'
    ].join("\n");
    UK.TX.setGroup(L, 4);
    if (x.doIn) {
        var a = UK.TX.whole(L, "UK In", { opacity: 0, blur: [x.fs * 0.2, x.fs * 0.2], pos: [0, x.fs * 0.3] });
        UK.anim(a(), [[x.tIn, 100], [x.tIn + x.dIn * 0.8, 0]], ["quint"]);
        var c = UK.TX.whole(L, "UK Accent", { fill: x.accent });
        UK.anim(c(), [[x.tIn, 100], [x.tIn + Math.max(1.4, x.dIn * 2), 30]], ["smooth"]);
    }
    if (x.doOut) { var b = UK.TX.whole(L, "UK Out", { opacity: 0, blur: [x.fs * 0.2, x.fs * 0.2] }); UK.anim(b(), [[x.tOut, 0], [x.tOut + x.dOut, 100]], ["inSoft"]); }
    UK.TX.glow(L, x, x.doIn ? [[x.tIn, 0], [x.tIn + x.dIn * 0.5, 2.2], [x.tIn + Math.max(1.6, x.dIn * 2.2), 1.1]] : [[x.tOut, 1.1], [x.tOut + x.dOut, 0]], ["outSoft", "smooth"]);
};
/* typing with a caret (shared by 16 + 17) */
UK.TX.typing = function (L, x, block) {
    var td = UK.textDoc(L), d = td.value;
    d.justification = ParagraphJustification.LEFT_JUSTIFY;
    td.setValue(d);
    var r = L.sourceRectAtTime(L.inPoint, false);
    var cpos = UK.pos(L).value, cw = x.comp.width;
    UK.anchor(L).setValue([r.left, r.top + r.height / 2]);
    if (x.isNew) UK.pos(L).setValue([cw / 2 - r.width / 2, cpos[1]]);
    UK.slider(L, "UK Typing", x.doIn ? 0 : 100);
    var typ = UK.efx(L, "UK Typing").property(1);
    var keys = [], cv = [];
    if (x.doIn) { keys.push([x.tIn, 0], [x.tIn + x.dIn, 100]); cv.push("inout"); }
    if (x.doOut) { if (keys.length) cv.push("linear"); keys.push([x.tOut, 100], [x.tOut + x.dOut, 0]); cv.push("inout"); }
    UK.anim(typ, keys, cv);
    td.expression = 'var n = Math.round(clamp(effect("UK Typing")(1), 0, 100) / 100 * value.length);\nvalue.substr(0, n);';
    // the newest letters glow in the accent colour while typing
    var c = UK.TX.animator(L, "UK Accent", { fill: x.accent }, { based: 1, shape: 2, start: 70, end: 100, hi: 0, lo: 100 });
    var cAmt = c.range().property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount");
    if (x.doIn) UK.anim(cAmt, [[x.tIn + x.dIn, 100], [x.tIn + x.dIn + 0.6, 0]], ["smooth"]); else cAmt.setValue(0);
    // caret
    var C = UK.shapeLayer(x.comp, "Caret");
    var v = UK.vecs(UK.group(UK.root(C), "Caret"));
    if (block) UK.addRect(v, [Math.round(x.fs * 0.5), Math.round(x.fs * 0.72)], [Math.round(x.fs * 0.25), 0], Math.max(1, x.fs * 0.05));
    else UK.addRect(v, [Math.max(3, Math.round(x.fs * 0.07)), Math.round(x.fs * 1.05)], [0, 0], Math.max(1, x.fs * 0.03));
    UK.addFill(v, block ? x.accent : "#FFFFFF");
    if (!block) { UK.fx(C, "ADBE Glo2", "Glow"); UK.efx(C, "Glow").property("ADBE Glo2-0003").setValue(Math.round(x.fs * 0.3)); }
    UK.TX.helper(L, C);
    var ref = UK.TX.ref(L);
    UK.pos(C).expression = 'var t = ' + ref + ';\nvar r = t.sourceRectAtTime(time, false);\nvar gap = ' + Math.round(x.fs * 0.08) + ';\nvar w = (r.width > 0) ? r.left + r.width + gap : t.anchorPoint[0] + gap;\nt.toComp([w, t.anchorPoint[1]]);';
    var op = UK.opac(C), bk = [], blinkEnd = (x.doOut ? x.tOut + x.dOut + 1.2 : x.tIn + x.dIn + 6);
    var tt = Math.max(L.inPoint, x.tIn - 1.0);
    while (tt < blinkEnd) {
        var typingNow = (x.doIn && tt >= x.tIn && tt <= x.tIn + x.dIn) || (x.doOut && tt >= x.tOut && tt <= x.tOut + x.dOut);
        if (typingNow) { bk.push([tt, 100]); tt += 0.25; continue; }
        bk.push([tt, 100]); bk.push([tt + 0.4, 100]); bk.push([tt + 0.5, 0]); bk.push([tt + 0.9, 0]);
        tt += 1.0;
    }
    var clean = [];
    for (var i = 0; i < bk.length; i++) if (!clean.length || bk[i][0] > clean[clean.length - 1][0] + 0.02) clean.push(bk[i]);
    UK.anim(op, clean, "smooth");
};
UK.TX.P.st16 = function (L, x) { UK.TX.typing(L, x, false); };   // Type Line Cursor
UK.TX.P.st17 = function (L, x) { UK.TX.typing(L, x, true); };    // Type Block Cursor
/* 18 One Word Kinetic: one big word per beat, then the full sentence lands */
UK.TX.P.st18 = function (L, x) {
    var td = UK.textDoc(L), words = String(td.value.text).split(" "), n = words.length, i;
    var beat = Math.max(0.25, x.dIn * 0.45), t0 = x.tIn;
    // the full sentence (last step) is scaled to fit the frame
    var full = L.sourceRectAtTime(t0, false), fit = Math.min(1, x.comp.width * 0.86 / Math.max(1, full.width * UK.scale(L).value[0] / 100));
    UK.slider(L, "UK Word", 0);
    var wk = [], wc = [];
    for (i = 0; i <= n; i++) { wk.push([t0 + i * beat, i]); wc.push("hold"); }
    UK.anim(UK.efx(L, "UK Word").property(1), wk, wc);
    td.expression = 'var w = value.split(" ");\nvar i = Math.floor(effect("UK Word")(1));\n(i >= w.length) ? value : w[Math.max(0, i)];';
    UK.TX.setGroup(L, 4);
    var a = UK.TX.whole(L, "UK Pop", { scale: [135, 135], blur: [x.fs * 0.06, x.fs * 0.06] });
    var pk = [], pc = [], fd = x.comp.frameDuration;
    for (i = 0; i <= n; i++) {
        var ti = t0 + i * beat;
        if (i > 0) { pk.push([ti - fd, 0]); pc.push("linear"); }
        pk.push([ti, i === n ? 100 : 70]); pc.push("expo");
        pk.push([ti + beat * (i === n ? 1.4 : 0.85), 0]);
        if (i < n) pc.push("linear");
    }
    UK.anim(a(), pk, pc);
    if (fit < 0.999) {
        var ft = UK.TX.whole(L, "UK Fit", { scale: [fit * 100, fit * 100] }), tn = t0 + n * beat;
        UK.anim(ft(), [[tn - fd, 0], [tn, 100]], ["hold"]);
    }
    var o = UK.TX.whole(L, "UK In Fade", { opacity: 0 });
    UK.anim(o(), [[t0, 100], [t0 + beat * 0.3, 0]], ["outSoft"]);
    if (x.doOut) { var b = UK.TX.whole(L, "UK Out", { opacity: 0, scale: [90, 90], blur: [x.fs * 0.1, x.fs * 0.1] }); UK.anim(b(), [[x.tOut, 0], [x.tOut + x.dOut, 100]], ["inSoft"]); }
};
/* 19 Blur Bloom: a soft glowing cloud sharpens into the text */
UK.TX.P.st19 = function (L, x) {
    UK.TX.setGroup(L, 4);
    if (x.doIn) {
        var a = UK.TX.whole(L, "UK In", { blur: [x.fs * 0.6, x.fs * 0.6], opacity: 0, scale: [115, 115] });
        UK.anim(a(), [[x.tIn, 100], [x.tIn + x.dIn * 1.2, 0]], ["expo"]);
        var c = UK.TX.whole(L, "UK Accent", { fill: x.accent });
        UK.anim(c(), [[x.tIn, 100], [x.tIn + x.dIn * 1.6, 25]], ["smooth"]);
    }
    if (x.doOut) { var b = UK.TX.whole(L, "UK Out", { blur: [x.fs * 0.5, x.fs * 0.5], opacity: 0, scale: [108, 108] }); UK.anim(b(), [[x.tOut, 0], [x.tOut + x.dOut, 100]], ["expoIn"]); }
    UK.TX.glow(L, x, x.doIn ? [[x.tIn, 3], [x.tIn + x.dIn * 1.6, 0.8]] : [[x.tOut, 0.8], [x.tOut + x.dOut, 3]], ["smooth"]);
};
/* 20 Bounce Letters: letters jump up from different depths with a springy settle */
UK.TX.P.st20 = function (L, x) {
    UK.TX.setGroup(L, 1);
    function build(name, t0, d, dir) {
        var W = 28, an = UK.TX.animator(L, name, { pos: [0, x.fs * 1.5], opacity: 0 }, { based: 1, shape: dir === "in" ? 2 : 3, start: 0, end: W, hi: 0, lo: 50 });
        UK.anim(an.range().property("ADBE Text Percent Offset"), [[t0, -W], [t0 + d, 100]], [dir === "in" ? "smooth" : "inSoft"]);
        UK.TX.exprSel(an, 1, UK.TX.SEL + "seedRandom(textIndex * 7, true);\nvar k = random(0.4, 1.5);\n[s, s * k, s];");
    }
    if (x.doIn) { build("UK In", x.tIn, x.dIn, "in"); UK.TX.bump(L, "UK In Spring", { pos: [0, -x.fs * 0.28] }, { W: 24, Win: 28, lag: 0.12, curve: "smooth" }, x.tIn, x.dIn); }
    if (x.doOut) build("UK Out", x.tOut, x.dOut, "out");
};
/* 21 List Picker: a vertical list scrolls; the active line is bright, the rest dimmed */
UK.TX.P.st21 = function (L, x) {
    var td = UK.textDoc(L), d = td.value, i;
    var lines = String(d.text).split(/\r|\n/), n = lines.length;
    d.justification = ParagraphJustification.LEFT_JUSTIFY;
    td.setValue(d);
    d = td.value;
    var lh = (d.autoLeading || !d.leading) ? x.fs * 1.2 : d.leading;
    var r = L.sourceRectAtTime(L.inPoint, false);
    UK.anchor(L).setValue([r.left + r.width / 2, r.top + x.fs * 0.6]);
    if (x.isNew) UK.pos(L).setValue([x.comp.width / 2, x.comp.height / 2]);
    // dim everything except the active line (Subtract selector, index units)
    var an = UK.TX.animator(L, "UK List Dim", { opacity: 30, scale: [88, 88] }, { based: 4, shape: 1, start: 0, end: 100 });
    an.group().property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    var A = an.group().property("ADBE Text Selectors").property(2);
    A.name = "Active Line";
    A = an.group().property("ADBE Text Selectors").property("Active Line");
    var adv = A.property("ADBE Text Range Advanced");
    adv.property("ADBE Text Range Type2").setValue(4);
    adv.property("ADBE Text Selector Mode").setValue(2);
    adv.property("ADBE Text Range Units").setValue(2);
    adv.property("ADBE Text Selector Smoothness").setValue(100);
    UK.TX.setGroup(L, 3);
    var tStart = x.doIn ? x.tIn + x.dIn : x.tIn, tEnd = UK.TX.holdEnd(x);
    var step = Math.max(0.5, (tEnd - tStart) / Math.max(1, n - 1));
    var sk = [], ek = [], mk = [], c1 = [], c2 = [];
    for (i = 0; i < n; i++) {
        var t = tStart + i * step - (i ? step * 0.25 : 0), t2 = tStart + i * step;
        if (i === 0) { sk.push([t2, 0]); ek.push([t2, 1]); mk.push([t2, 0]); continue; }
        sk.push([t, i - 1], [t2, i]); ek.push([t, i], [t2, i + 1]); mk.push([t, i - 1], [t2, i]);
        c1.push("linear", "quint");
    }
    var rr = function () { return UK.TX.animators(L).property("UK List Dim").property("ADBE Text Selectors").property("Active Line"); };
    if (sk.length > 1) {
        UK.anim(rr().property("ADBE Text Index Start"), sk, c1);
        UK.anim(rr().property("ADBE Text Index End"), ek, c1);
    } else { rr().property("ADBE Text Index Start").setValue(0); rr().property("ADBE Text Index End").setValue(1); }
    // scroll: the whole list moves up one line per step
    var sc = UK.TX.animator(L, "UK List Scroll", { pos: [0, -lh * Math.max(1, n - 1)] }, { based: 1, shape: 1, start: 0, end: 100 });
    var amt = function () { return UK.TX.animators(L).property("UK List Scroll").property("ADBE Text Selectors").property("Range").property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount"); };
    var ak = [];
    for (i = 0; i < mk.length; i++) ak.push([mk[i][0], mk[i][1] / Math.max(1, n - 1) * 100]);
    if (ak.length > 1) UK.anim(amt(), ak, c1); else amt().setValue(0);
    if (x.doIn) UK.TX.cascade(L, "in", { opacity: 0, pos: [0, x.fs * 0.3] }, { based: 4, W: 40, curve: "outSoft" }, x.tIn, x.dIn);
    if (x.doOut) UK.TX.outSoft(L, x, 4);
    // bullet dot next to the active line
    var D = UK.shapeLayer(x.comp, "List Dot");
    UK.addEllipse(UK.vecs(UK.group(UK.root(D), "Dot")), [Math.round(x.fs * 0.22), Math.round(x.fs * 0.22)], [0, 0]);
    UK.addFill(UK.vecs(UK.root(D).property("Dot")), x.accent);
    UK.pos(D).expression = 'var t = ' + UK.TX.ref(L) + ';\nt.toComp([' + (r.left - x.fs * 0.45) + ', t.anchorPoint[1] - ' + (x.fs * 0.3) + ']);';
    if (x.doIn) UK.anim(UK.scale(D), [[x.tIn + x.dIn * 0.6, [0, 0]], [x.tIn + x.dIn, [100, 100]]], ["quint"]);
    if (x.doOut) UK.anim(UK.scale(D), [[x.tOut, [100, 100]], [x.tOut + x.dOut * 0.6, [0, 0]]], ["quintIn"]);
    UK.TX.helper(L, D);
};
/* 22 Line Roll: letters roll up from behind a line (3D per character) */
UK.TX.P.st22 = function (L, x) {
    L.threeDPerChar = true;
    UK.TX.mask(L, x.fs * 0.3, x.fs * 0.12);
    // far enough that the letters fully clear the mask at both ends (fully hidden before / after)
    if (x.doIn) UK.TX.cascade(L, "in", { pos: [0, x.fs * 1.45], rotX: -75 }, { W: 40, lo: 85, curve: "quint" }, x.tIn, x.dIn);
    if (x.doOut) UK.TX.cascade(L, "out", { pos: [0, -x.fs * 1.7], rotX: 75 }, { W: 40, lo: 85, curveOut: "quintIn" }, x.tOut, x.dOut);
};
/* 23 Word Fade Up: words fade up one by one out of a light blur (the old Marker Underline, without
   the underline - strokes live in the Underline category now) */
UK.TX.P.st23 = function (L, x) {
    if (x.doIn) UK.TX.cascade(L, "in", { opacity: 0, blur: [x.fs * 0.1, x.fs * 0.1], pos: [0, x.fs * 0.12] }, { based: 3, W: 50, lo: 85, curve: "outSoft" }, x.tIn, x.dIn);
    if (x.doOut) UK.TX.outSoft(L, x, 3);
};
/* 24 Word Blur In: words sharpen in place one by one, growing a touch (the old Marker Circle, without the circle) */
UK.TX.P.st24 = function (L, x) {
    UK.TX.setGroup(L, 2);
    if (x.doIn) UK.TX.cascade(L, "in", { opacity: 0, blur: [x.fs * 0.22, x.fs * 0.22], scale: [92, 92] }, { based: 3, W: 55, lo: 90, curve: "smooth" }, x.tIn, x.dIn);
    if (x.doOut) UK.TX.cascade(L, "out", { opacity: 0, blur: [x.fs * 0.22, x.fs * 0.22], scale: [92, 92] }, { based: 3, W: 55, curveOut: "inout" }, x.tOut, x.dOut);
};/* 25 Glitch RGB: the text flickers in with a red / cyan channel split that settles */
UK.TX.P.st25 = function (L, x) {
    var gh = [UK.TX.ghost(L, L.name + " - Red", "#FF2E4C"), UK.TX.ghost(L, L.name + " - Cyan", "#22E5FF")];
    var fd = x.comp.frameDuration;
    for (var i = 0; i < 2; i++) {
        var G = gh[i], P0 = UK.pos(G).value, s = i ? -1 : 1, k = x.fs * 0.12 * s;
        G.blendingMode = BlendingMode.SCREEN;
        var keys = [], cv = [], ok = [], oc = [];
        if (x.doIn) {
            keys.push([x.tIn, [P0[0] + k * 2.2, P0[1]]], [x.tIn + 3 * fd, [P0[0] - k, P0[1] + k * 0.3]], [x.tIn + 6 * fd, [P0[0] + k * 1.4, P0[1]]], [x.tIn + x.dIn, P0]);
            cv.push("linear", "linear", "expo");
            ok.push([x.tIn, 90], [x.tIn + x.dIn, 0]); oc.push("inSoft");
        }
        if (x.doOut) {
            if (keys.length) { cv.push("linear"); oc.push("linear"); }
            keys.push([x.tOut, P0], [x.tOut + x.dOut * 0.6, [P0[0] - k * 1.5, P0[1]]], [x.tOut + x.dOut, [P0[0] + k * 2.5, P0[1]]]); cv.push("expoIn", "linear");
            ok.push([x.tOut, 0], [x.tOut + x.dOut * 0.4, 90], [x.tOut + x.dOut, 0]); oc.push("outSoft", "in");
        }
        if (!x.doIn) UK.opac(G).setValue(0);
        UK.anim(UK.pos(G), keys, cv);
        UK.anim(UK.opac(G), ok, oc);
    }
    // the white text flickers on letter by letter in random order, with a sideways jolt
    if (x.doIn) {
        var a = UK.TX.animator(L, "UK In", { opacity: 0, pos: [x.fs * 0.15, 0] }, { based: 1, shape: 1, start: 0, end: 100, smooth: 0, random: true, seed: 3 });
        UK.anim(a.range().property("ADBE Text Percent Start"), [[x.tIn, 0], [x.tIn + x.dIn * 0.6, 100]], ["linear"]);
    }
    if (x.doOut) {
        var b = UK.TX.animator(L, "UK Out", { opacity: 0, pos: [-x.fs * 0.15, 0] }, { based: 1, shape: 1, start: 0, end: 0, smooth: 0, random: true, seed: 8 });
        UK.anim(b.range().property("ADBE Text Percent End"), [[x.tOut + x.dOut * 0.3, 0], [x.tOut + x.dOut, 100]], ["linear"]);
    }
};
/* 26 Slide Blur Words: words glide in from the right out of a horizontal blur */
UK.TX.P.st26 = function (L, x) {
    if (x.doIn) UK.TX.cascade(L, "in", { opacity: 0, pos: [x.fs * 1.4, 0], blur: [x.fs * 0.3, 0], fill: "#77777F" }, { based: 3, W: 55, lo: 90, curve: "quint" }, x.tIn, x.dIn);
    if (x.doOut) UK.TX.cascade(L, "out", { opacity: 0, pos: [-x.fs * 1.2, 0], blur: [x.fs * 0.3, 0] }, { based: 3, W: 55, curveOut: "quintIn" }, x.tOut, x.dOut);
};
/* 27 Scatter Align: words start scattered over the frame and slide into one line */
UK.TX.P.st27 = function (L, x) {
    UK.TX.setGroup(L, 2);
    // all words travel together (wide selection, soft per-word easing) from scattered spots,
    // zero speed at the start and a long gentle landing: no snapping, no broken motion
    function build(name, t0, d, dir) {
        var W = 85, sel = { based: 3, shape: dir === "in" ? 2 : 3, start: 0, end: W, hi: 0, lo: 100 };
        // the move starts with speed (already travelling on the first frame) and lands very softly
        var cv = [dir === "in" ? [30, 82, 1.6, 0] : [82, 30, 0, 1.6]];
        var an = UK.TX.animator(L, name + " Scatter", { pos: [x.fs * 3.2, x.fs * 2.3], rot: 18, blur: [x.fs * 0.12, x.fs * 0.12] }, sel);
        UK.anim(an.range().property("ADBE Text Percent Offset"), [[t0, -W], [t0 + d, 100]], cv);
        UK.TX.exprSel(an, 3, UK.TX.SEL + "seedRandom(textIndex * 31, true);\n[random(-1, 1) * s, random(-1, 1) * s, s];");
        // opacity uses the same selection and the same curve, only a little later in time, so every
        // word is already moving before it fades up (and on the way out it is gone before it stops)
        var o = UK.TX.animator(L, dir === "in" ? "UK In" : "UK Out", { opacity: 0 }, sel);
        // (the move's amount is range x expression = s^2; the fade is pushed to the start of each
        //  word's move so the word is seen travelling for most of its path)
        if (dir === "in") {
            UK.anim(o.range().property("ADBE Text Percent Offset"), [[t0 + d * 0.05, -W], [t0 + d * 1.05, 100]], cv);
            UK.TX.exprSel(o, 3, UK.TX.SEL + "linear(s, 55, 100, 0, 100);");
        } else UK.anim(o.range().property("ADBE Text Percent Offset"), [[t0, -W], [t0 + d * 0.9, 100]], cv);
    }
    if (x.doIn) build("UK In", x.tIn, x.dIn * 2, "in");
    if (x.doOut) build("UK Out", x.tOut, x.dOut * 1.3, "out");
};
/* 28 Slow Push: words drift in softly while the whole line slowly pushes towards camera */
UK.TX.P.st28 = function (L, x) {
    UK.TX.setGroup(L, 4);
    if (x.doIn) UK.TX.cascade(L, "in", { opacity: 0, blur: [x.fs * 0.15, x.fs * 0.15] }, { based: 3, W: 60, lo: 90, curve: "outSoft" }, x.tIn, x.dIn);
    var p = UK.TX.whole(L, "UK Push", { scale: [112, 112] });
    UK.anim(p(), [[x.tIn, 0], [UK.TX.holdEnd(x) + (x.doOut ? x.dOut : 0), 100]], ["smooth"]);
    if (x.doOut) UK.TX.outSoft(L, x, 3, { up: 0 });
};

/*  Letter bursts (33 Explode Out, 34 Explode). The motion lives on keyframed sliders on the text
    layer (UK Burst ...); every letter reads them `stagger` frames later than the letter before, so
    the whole word is one set of editable keyframes with speed-ramps, and the letters follow it
    2 frames apart. Letter positions are estimated along the line for the gather / scatter.        */
UK.TX.burstSel = function (L, x, r, body) {
    return 'var d = (textIndex - 1) * 2 * thisComp.frameDuration;\n' +
        'var xi = ' + r.left + ' + ' + r.width + ' * (textIndex - 0.5) / textTotal, cx = ' + (r.left + r.width / 2) + ', fs = ' + x.fs + ';\n' +
        'function k(n) { return effect(n)(1).valueAtTime(time - d) / 100; }\n' + body;
};
/* 34 Explode: at the start every letter sits at the word's centre at 0 % scale; by the half-way key
   each one has burst out in its own direction, grown to 150 % and turned (-50..50 deg); by the end
   key it is back on its own spot at 100 % and 0 deg. A null (Explode Bounce) carries the word:
   scale 100 -> 120 -> 80 -> 100 (frames 10 / 20 / 35 / 40 of a 1 s animation).                   */
UK.TX.P.st34 = function (L, x) {
    UK.TX.setGroup(L, 1);
    var D = x.dIn, t0 = x.tIn, h = D / 2, f = D / 30;
    var r = UK.TX.layerRect(L, t0 + D + 0.05), K = Math.round(Math.sqrt(x.comp.width * x.comp.width + x.comp.height * x.comp.height) * 2);
    if (x.doIn) {
        UK.slider(L, "UK Burst Pop", 100);       // scale: 100 -> 0 %, -50 -> 150 %, 0 -> 100 %
        UK.slider(L, "UK Burst Turn", 0);        // 0 / 100 = no turn / full random turn
        UK.slider(L, "UK Burst Gather", 100);    // 100 = all letters at the word's centre
        UK.slider(L, "UK Burst Scatter", 0);     // 100 = burst out in every direction
        UK.anim(UK.efx(L, "UK Burst Pop").property(1), [[t0, 100], [t0 + h, -50], [t0 + D, 0]], ["out", "inout"]);
        UK.anim(UK.efx(L, "UK Burst Turn").property(1), [[t0, 0], [t0 + h, 100], [t0 + D, 0]], ["out", "inout"]);
        UK.anim(UK.efx(L, "UK Burst Gather").property(1), [[t0, 100], [t0 + h, 0]], ["out"]);
        UK.anim(UK.efx(L, "UK Burst Scatter").property(1), [[t0, 0], [t0 + h, 100], [t0 + D, 0]], ["out", "inout"]);
        var sc = UK.TX.animator(L, "UK Burst Scale", { scale: [0, 0] }, { based: 1, shape: 1, start: 0, end: 100 });
        UK.TX.exprSel(sc, 1, UK.TX.burstSel(L, x, r, 'var p = k("UK Burst Pop") * 100;\n[p, p, p];'));
        var ro = UK.TX.animator(L, "UK Burst Turn", { rot: 50 }, { based: 1, shape: 1, start: 0, end: 100 });
        UK.TX.exprSel(ro, 1, UK.TX.burstSel(L, x, r, 'seedRandom(textIndex * 29, true);\nrandom(-1, 1) * k("UK Burst Turn") * 100;'));
        var mv = UK.TX.animator(L, "UK Burst Move", { pos: [K, K] }, { based: 1, shape: 1, start: 0, end: 100 });
        // outward from the word's centre (left letters to the left, right ones to the right, with an
        // up / down share) so the letters spread apart instead of piling up
        UK.TX.exprSel(mv, 1, UK.TX.burstSel(L, x, r, 'seedRandom(textIndex * 17, true);\n' +
            'var side = (xi - cx) / Math.max(1, ' + (r.width / 2) + ');\n' +
            'var a = Math.atan2(random(-1, 0.6), side * 1.4 + random(-0.35, 0.35)), rad = random(0.55, 1.0) * fs;\n' +
            'var dx = k("UK Burst Gather") * (cx - xi) + k("UK Burst Scatter") * Math.cos(a) * rad * 1.3;\n' +
            'var dy = k("UK Burst Scatter") * Math.sin(a) * rad;\n' +
            '[dx / ' + K + ' * 100, dy / ' + K + ' * 100, 0];'));
        // the whole word swells and settles on a null
        var N = x.comp.layers.addNull(), tr = L.property("ADBE Transform Group");
        N.name = "Explode Bounce";
        var P = tr.property("ADBE Position").value, A = tr.property("ADBE Anchor Point").value, S = tr.property("ADBE Scale").value;
        UK.pos(N).setValue([P[0] + (r.left + r.width / 2 - A[0]) * S[0] / 100, P[1] + (r.top + r.height / 2 - A[1]) * S[1] / 100]);
        UK.anchor(N).setValue([50, 50]);
        UK.TX.helper(L, N);
        N.moveBefore(L);
        L.parent = N;
        UK.anim(UK.scale(N), [[t0 + 10 * f, [100, 100]], [t0 + 20 * f, [120, 120]], [t0 + 35 * f, [80, 80]], [t0 + 40 * f, [100, 100]]], ["smooth", "smooth", "smooth"]);
    }
    if (x.doOut) UK.TX.outSoft(L, x, 1);
};
/* 33 Explode Out: the word is on screen, then its letters burst away in every direction - left,
   right, up, down, diagonals - growing and spinning, 2 frames apart, until every one has left the
   frame. One slider (UK Burst Away 0 -> 100) holds the keys: gentle start, then they fly off.      */
UK.TX.P.st33 = function (L, x) {
    UK.TX.setGroup(L, 1);
    if (x.doIn) UK.TX.cascade(L, "in", { opacity: 0, scale: [85, 85], blur: [x.fs * 0.12, x.fs * 0.12] }, { W: 45, curve: "smooth" }, x.tIn, x.dIn * 0.8);
    // the burst (every letter 2 frames after the previous one) ends exactly at the layer's end, so the
    // last letter is out of frame when the layer stops - re-applying never moves it
    var nCh = String(UK.textDoc(L).value.text).length, Dx = Math.max(0.9, (x.doOut ? x.dOut : x.dIn) * 1.3), total = Dx + 2 * x.comp.frameDuration * nCh;
    var tB = x.doOut ? Math.max(x.tIn + x.dIn + 0.2, L.outPoint - total) : x.tIn + x.dIn + 0.6;
    var r = UK.TX.layerRect(L, Math.max(x.tIn + x.dIn, tB - 0.05)), diag = Math.sqrt(x.comp.width * x.comp.width + x.comp.height * x.comp.height);
    var sc0 = Math.max(0.05, L.property("ADBE Transform Group").property("ADBE Scale").value[0] / 100), K = Math.round(diag * 4 / sc0), far = Math.round(diag * 1.4 / sc0);
    UK.slider(L, "UK Burst Away", 0);
    UK.anim(UK.efx(L, "UK Burst Away").property(1), [[tB, 0], [tB + Dx, 100]], [[45, 30, 0, 2.2]]);
    // direction: letters left of the centre go left, right ones go right, with a random up / down
    // share, so the word bursts in every direction (diagonals included)
    var mv = UK.TX.animator(L, "UK Burst Move", { pos: [K, K] }, { based: 1, shape: 1, start: 0, end: 100 });
    UK.TX.exprSel(mv, 1, UK.TX.burstSel(L, x, r, 'seedRandom(textIndex * 23, true);\n' +
        'var side = (xi - cx) / Math.max(1, ' + (r.width / 2) + ');\n' +
        'var a = Math.atan2(random(-1, 1), side + random(-0.7, 0.7)), p = k("UK Burst Away");\n' +
        '[Math.cos(a) * ' + far + ' * p / ' + K + ' * 100, Math.sin(a) * ' + far + ' * p / ' + K + ' * 100, 0];'));
    var gw = UK.TX.animator(L, "UK Burst Grow", { scale: [160, 160] }, { based: 1, shape: 1, start: 0, end: 100 });
    UK.TX.exprSel(gw, 1, UK.TX.burstSel(L, x, r, 'var p = k("UK Burst Away") * 100;\n[p, p, p];'));
    var tw = UK.TX.animator(L, "UK Burst Spin", { rot: 180 }, { based: 1, shape: 1, start: 0, end: 100 });
    UK.TX.exprSel(tw, 1, UK.TX.burstSel(L, x, r, 'seedRandom(textIndex * 41, true);\nrandom(-1, 1) * k("UK Burst Away") * 100;'));
    // (In only: keep the layer alive until the last letter has left the frame)
    if (!x.doOut && L.outPoint < tB + total) L.outPoint = Math.min(x.comp.duration, tB + total);
};

UK.TX.DEFAULT_TEXT = {
    st01: "Clean", st02: "preset", st03: "It's really easy to manage.", st04: "Good text design is invisible",
    st05: "more expensive", st06: "message", st07: "Really smooth.", st08: "we draw attention to something important",
    st09: "Just what I needed", st10: "Launch", st11: "Perfect for SaaS launches", st12: "Think Faster",
    st13: "Built for agent intros", st14: "Automate Work", st15: "$110,000+", st16: "Value Created",
    st17: "Everything in sync", st18: "Stand out with smart agents", st19: "Get it now!", st20: "But",
    st21: "Title\rStyle\rMotion\rTypewriter\rCounter\rSaaS\rText", st22: "Any brand", st23: "Meet SaaS Text Presets",
    st24: "Deadline today?", st25: "No presentation?", st26: "Everything moves faster", st27: "Text SaaS Animation",
    st28: "Less effort. More progress.", st29: "Automate Work", st30: "Automate Work", st31: "Automate Work",
    st32: "we lift what matters most", st33: "Break the rules", st34: "Explode",
    tx01: "Motion Made Simple", tx02: "Clear and calm", tx04: "Pop!", tx05: "Rise above", tx06: "Focus", tx07: "Flip the script",
    tx08: "Make some waves", tx09: "Drop in", tx10: "Softly random", tx11: "Stretch", tx12: "Center stage", tx13: "Slide right in"
};

/* ---------------------------------------------------------------- entry */
UK.api.text = function (a) {
    var comp = UK.comp(true);
    UK._fd = comp.frameDuration;
    var preset = UK.TX.P[a.id];
    if (!preset) throw new Error("Unknown text preset " + a.id);
    var mode = a.mode || "in";
    var dIn = UK.clamp(Number(a.inDur) || 1.0, 0.2, 10), dOut = UK.clamp(Number(a.outDur) || 0.8, 0.2, 10);
    var hold = UK.clamp(Number(a.hold) || 2.0, 0, 60);
    var accent = a.accent || UK_CAT.saasPal[0][0];
    var targets = UK.selectedTextLayers(comp), isNew = false;
    var cti = UK.timeCTI(comp);
    // a selected Ultimate Kit precomp counts as its text layer: re-apply inside it
    var wraps = UK.TX.selectedWraps(comp);
    if (!targets.length && wraps.length) {
        var res = [], outer = [];
        for (var w = 0; w < wraps.length; w++) {
            var W = wraps[w], ic = W.source, IL = UK.TX.wrapText(ic);
            if (!IL) continue;
            UK.selectOnly(ic, [IL]);
            UK.TX.applyOne(a, preset, ic, IL, cti - W.startTime, false, dIn, dOut, hold, accent, mode);
            W.inPoint = IL.inPoint + W.startTime; W.outPoint = IL.outPoint + W.startTime;
            res.push(IL.name); outer.push(W);
        }
        UK.selectOnly(comp, outer);
        return { layers: res };
    }
    if (!targets.length) {
        var str = a.text || UK.TX.DEFAULT_TEXT[a.id] || "Motion Made Simple";
        var longest = 1, parts = String(str).split(/\r|\n/);
        if (a.id === "st18") parts = String(str).split(" ");      // one word on screen at a time
        for (var pi = 0; pi < parts.length; pi++) longest = Math.max(longest, parts[pi].length);
        if (a.id === "st18") parts = [str];
        var size = Math.round(Math.min(comp.height * (parts.length > 2 ? 0.065 : 0.16), comp.width * 0.82 / (longest * 0.55)));
        var L0 = UK.addText(comp, str, { name: String(str).replace(/\r|\n/g, " ").substr(0, 40), size: size });
        L0.startTime = 0;
        L0.inPoint = cti;
        if (mode !== "in") L0.outPoint = Math.min(comp.duration, cti + (mode === "both" ? dIn : 0) + hold + dOut +
            (a.id === "st33" ? dOut * 0.3 + 2 * comp.frameDuration * String(str).length : 0));   // the letter-by-letter burst needs its stagger time
        targets = [L0];
        isNew = true;
    }
    var done = [], sel = [];
    for (var i = 0; i < targets.length; i++) {
        var L = targets[i];
        UK.TX.applyOne(a, preset, comp, L, cti, isNew, dIn, dOut, hold, accent, mode);
        done.push(L.name);
        // presets that build extra layers (echoes, sparkle, markers...) are tidied into one precomp,
        // unless we are already working inside one
        var wrapped = (comp.comment.indexOf("UK text precomp") === 0) ? null : UK.TX.wrap(comp, L);
        sel.push(wrapped || L);
    }
    UK.selectOnly(comp, sel);
    return { layers: done };
};
UK.TX.applyOne = function (a, preset, comp, L, cti, isNew, dIn, dOut, hold, accent, mode) {
    UK.TX.clean(L);
    var tIn = (cti >= L.inPoint && cti < L.outPoint) ? cti : L.inPoint;
    if (isNew) tIn = cti;
    var tOut = L.outPoint - dOut;
    if (mode === "both" && tOut < tIn + dIn) tOut = tIn + dIn;
    var x = {
        comp: comp, fs: UK.TX.fontSize(L), mode: mode, doIn: mode !== "out" || a.id === "tx08", doOut: mode !== "in" && a.id !== "tx08",
        tIn: UK.snap(comp, tIn), dIn: dIn, tOut: UK.snap(comp, tOut), dOut: dOut, hold: hold, accent: accent, accentLight: "#C4B5FD", isNew: isNew
    };
    preset(L, x);
};
/* put the text layer and its helper layers into one precomp; returns the precomp layer (or null) */
UK.TX.wrap = function (comp, L) {
    var tag = "UK helper: " + L.name, idx = [L.index], i;
    for (i = 1; i <= comp.numLayers; i++) if (comp.layer(i).comment === tag) idx.push(i);
    if (idx.length < 2) return null;
    idx.sort(function (p, q) { return p - q; });
    var inP = L.inPoint, outP = L.outPoint, nm = L.name;
    var pc = comp.layers.precompose(idx, nm + " (UK)", true);
    pc.comment = "UK text precomp";
    try { pc.parentFolder = UK.folder("Text"); } catch (e0) { }
    var PL = comp.layer(idx[0]);
    PL.comment = "UK text precomp";
    PL.inPoint = inP; PL.outPoint = outP;
    try { PL.collapseTransformation = true; } catch (e) { }   // keeps the text sharp at any scale
    return PL;
};
UK.TX.selectedWraps = function (comp) {
    var r = [], s = comp.selectedLayers;
    for (var i = 0; i < s.length; i++) if (s[i].source instanceof CompItem && s[i].comment === "UK text precomp") r.push(s[i]);
    return r;
};
UK.TX.wrapText = function (c) {
    for (var i = 1; i <= c.numLayers; i++) if (c.layer(i) instanceof TextLayer && c.layer(i).comment.indexOf("UK helper") !== 0) return c.layer(i);
    return null;
};

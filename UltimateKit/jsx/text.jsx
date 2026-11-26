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
    try { L.property("ADBE Text Properties").property("ADBE Text More Options").property("ADBE Text Anchor Point Align").setValue([0, 0]); } catch (e4) { }
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
UK.TX.trail = function (L, x, based, W, t0, dur, curve, ease) {
    var c = UK.TX.animator(L, "UK Accent", { fill: x.accent }, { based: based, shape: 2, start: 0, end: W, hi: ease ? ease[0] : 0, lo: ease ? ease[1] : 60 });
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
    UK.TX.glowCtl(L, x, L, "UK Glow", "Glow", Math.round(x.fs * 0.55));
};
/* glow controls (user request: every glow can be controlled after Apply): sliders on the text layer
   "UK <label>" (amount %, scales the glow's own keyed intensity) and "UK <label> Radius" (px), also offered in
   Essential Properties. T = the layer that carries the glow effect fxName (the text or one of its helpers). */
UK.TX.glowCtl = function (L, x, T, fxName, label, radius) {
    var a = "UK " + label, r = "UK " + label + " Radius";
    if (!UK.efx(L, a)) UK.slider(L, a, 100);
    if (!UK.efx(L, r)) UK.slider(L, r, Math.round(radius));
    var src = (T === L) ? "" : UK.TX.ref(L) + ".";
    UK.efx(T, fxName).property("ADBE Glo2-0004").expression = "value * " + src + 'effect("' + a + '")(1) / 100';
    UK.efx(T, fxName).property("ADBE Glo2-0003").expression = src + 'effect("' + r + '")(1)';
    x.egp = x.egp || [];
    x.egp.push([a, label], [r, label + " Radius"]);
};
/* accent after Apply (the panel's Accent colour and its on / off switch): "UK Accent" + "UK Accent On" on the text
   layer; every accent fill of the text animators and every accent colour of the helper layers follows them (off =
   the text's own colour) */
UK.TX.linkAccent = function (L, x) {
    var want = UK.rgba(x.accent), hits = [], i, j, k, tag = "UK helper: " + L.name;
    var same = function (v) { return v && v.length >= 3 && Math.abs(v[0] - want[0]) < 0.01 && Math.abs(v[1] - want[1]) < 0.01 && Math.abs(v[2] - want[2]) < 0.01; };
    var A = UK.TX.animators(L);
    for (i = 1; i <= A.numProperties; i++) {
        if (A.property(i).name.indexOf("UK") !== 0) continue;
        var fp = A.property(i).property("ADBE Text Animator Properties").property("ADBE Text Fill Color");
        try { if (fp && fp.expression === "" && same(fp.value)) hits.push([fp, ""]); } catch (e1) { }
    }
    var walk = function (p, pre) {
        for (var k = 1; k <= p.numProperties; k++) {      // (own k: a shared one never ends the recursion)
            var q = p.property(k);
            if (q.propertyType === PropertyType.PROPERTY) {
                try { if (q.propertyValueType === PropertyValueType.COLOR && q.canSetExpression && q.expression === "" && same(q.value)) hits.push([q, pre]); } catch (e2) { }
            } else walk(q, pre);
        }
    };
    var C = L.containingComp;
    for (j = 1; j <= C.numLayers; j++) if (C.layer(j).comment === tag) walk(C.layer(j), UK.TX.ref(L) + ".");
    if (!hits.length) return;
    if (!UK.efx(L, "UK Accent")) UK.colorCtl(L, "UK Accent", x.noAccent ? "#7C5CFF" : x.accent);
    if (!UK.efx(L, "UK Accent On")) UK.checkCtl(L, "UK Accent On", !x.noAccent);
    for (i = 0; i < hits.length; i++) {
        var s = hits[i][1], tx = s === "" ? "text" : s + "text";
        hits[i][0].expression = "var c = [1, 1, 1, 1];\nif (" + s + 'effect("UK Accent On")(1) == 1) c = ' + s + 'effect("UK Accent")(1);\n' +
            "else { try { var f = " + tx + ".sourceText.style.fillColor; c = [f[0], f[1], f[2], 1]; } catch (e) { } }\nc;";
    }
    x.egp = x.egp || [];
    x.egp.push(["UK Accent", "Accent"], ["UK Accent On", "Accent On"]);
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
/* 35 Word Pop Rise: Word Pop, and the whole line comes up a little from below, quickly, and stops; it is flat accent
   colour while it rises and cuts to its own colour (hold keys, no blend) the moment it stops; on exit it goes up
   (no colour change there, no blur) */
UK.TX.P.st35 = function (L, x) {
    UK.TX.P.st03(L, x);
    var lift = x.fs * 0.3;
    if (x.doIn) {
        var tStop = x.tIn + x.dIn * 0.6, tCut = x.tIn + x.dIn * 0.55;   // the colour cuts as the rise comes to rest
        var r = UK.TX.whole(L, "UK Rise", { pos: [0, lift] });
        UK.anim(r(), [[x.tIn, 100], [tStop, 0]], ["out"]);
        var c = UK.TX.whole(L, "UK Accent", { fill: x.accent });
        UK.anim(c(), [[x.tIn, 100], [tCut, 0]], ["hold"]);
    }
    if (x.doOut) {
        var u = UK.TX.whole(L, "UK Up", { pos: [0, -lift] });
        UK.anim(u(), [[x.tOut, 0], [x.tOut + x.dOut, 100]], ["in"]);
    }
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
/* 05 Char Color Cascade: letters type on left to right, arrive in the accent colour. The colour fades back over a
   wide, softly eased ramp (80 % of the line, ease 50 / 50, sine timing), so neighbouring letters differ only a
   little and the gradation reads smooth (user request: the narrow ramp looked banded). */
UK.TX.P.st05 = function (L, x) {
    if (x.doIn) {
        UK.TX.cascade(L, "in", { opacity: 0, pos: [0, x.fs * 0.12], blur: [x.fs * 0.06, x.fs * 0.06] }, { based: 1, W: 22, lo: 70, curve: "outSoft" }, x.tIn, x.dIn);
        UK.TX.trail(L, x, 1, 80, x.tIn + x.dIn * 0.15, x.dIn * 1.7, "smooth", [50, 50]);
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
    // one layer: the star with a white glow and the accent haze as a second glow on it (no separate haze layer)
    var St = UK.shapeLayer(x.comp, "Sparkle");
    room(St);
    UK.addStar(UK.vecs(UK.group(UK.root(St), "Star")), { points: 4, outer: S / 2, inner: S * 0.07, innerRound: 0 });
    UK.addFill(UK.vecs(UK.root(St).property("Star")), "#FFFFFF");
    UK.fx(St, "ADBE Glo2", "Glow");
    UK.efx(St, "Glow").property("ADBE Glo2-0003").setValue(Math.round(S * 0.4));
    UK.fx(St, "ADBE Glo2", "Haze");
    var hz = UK.efx(St, "Haze");
    hz.property("ADBE Glo2-0002").setValue(10);                      // threshold: the whole star glows
    hz.property("ADBE Glo2-0003").setValue(Math.round(S * 0.9));
    hz.property("ADBE Glo2-0004").setValue(1.6);
    hz = UK.efx(St, "Haze"); hz.property("ADBE Glo2-0007").setValue(2);                       // A & B colours
    hz = UK.efx(St, "Haze"); hz.property("ADBE Glo2-0012").setValue(UK.rgba(x.accent));
    hz = UK.efx(St, "Haze"); hz.property("ADBE Glo2-0013").setValue(UK.rgba(x.accent));
    UK.TX.glowCtl(L, x, St, "Glow", "Sparkle Glow", S * 0.4);
    UK.TX.glowCtl(L, x, St, "Haze", "Sparkle Haze", S * 0.9);
    var posExpr = 'var t = ' + ref + ';\nvar p = clamp(t.effect("UK Sparkle")(1), 0, 100) / 100;\nt.toComp([' + (r.left - gap) + ' + ' + span + ' * p, ' + (r.top + r.height / 2) + ']);';
    UK.pos(St).expression = posExpr;
    // grows on, travels at full size, stops beside the last letter, then shrinks away there
    var sc = [[tA - 0.05, [0, 0]], [tA + dA * 0.2, [100, 100]], [tA + dA + 0.12, [100, 100]], [tA + dA + 0.55, [0, 0]]];
    UK.anim(UK.scale(St), sc, ["outSoft", "linear", "inSoft"]);
    UK.anim(UK.rot(St), [[tA - 0.05, -45], [tA + dA + 0.55, 160]], ["inout"]);
    UK.TX.helper(L, St);
    St.moveBefore(L);
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
/* typing with a caret (shared by 16 + 17). smooth (16, user request: the hard letter-by-letter steps looked
   broken; then: no blur, nothing may show past the caret): the whole text stays in the layer, the caret glides
   (UK Typing slider, sine ease) and the letters fade in just BEHIND it (opacity only, about 3 letters). The caret
   sits on the measured letter edges (prefix widths), so no letter is ever ahead of it.                        */
UK.TX.typing = function (L, x, block, smooth) {
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
    var ec = smooth ? "smooth" : "inout";
    if (x.doIn) { keys.push([x.tIn, 0], [x.tIn + x.dIn, 100]); cv.push(ec); }
    if (x.doOut) { if (keys.length) cv.push("linear"); keys.push([x.tOut, 100], [x.tOut + x.dOut, 0]); cv.push(ec); }
    UK.anim(typ, keys, cv);
    var nCh = Math.max(1, String(d.text).length), SW = UK.round(Math.min(smooth ? 16 : 40, (smooth ? 130 : 300) / nCh), 2);   // soft front: ~1.3 letters (smooth) / ~3
    var FRONT = 'var W = ' + SW + ', O = -W + (100 + W) * clamp(effect("UK Typing")(1), 0, 100) / 100;\n';
    var c;
    if (smooth) {
        var ty = UK.TX.animator(L, "UK Type", { opacity: 0 }, { based: 1, shape: 2, start: 0, end: SW, hi: 60, lo: 60 });
        ty.range().property("ADBE Text Percent Offset").expression = FRONT + 'O';
        // colour: a smooth white -> accent ramp that ends at the caret (the newest letters are the most coloured,
        // further back they turn white - the same soft gradation as #7 Char Color Cascade)
        var GW = UK.round(Math.min(80, Math.max(30, 600 / nCh)), 2);
        c = UK.TX.animator(L, "UK Accent", { fill: x.accent }, { based: 1, shape: 2, start: 0, end: GW, hi: 50, lo: 50 });
        c.range().property("ADBE Text Percent Offset").expression = FRONT + 'clamp(O + W - ' + GW + ', -100, 100)';
    } else {
        td.expression = 'var n = Math.round(clamp(effect("UK Typing")(1), 0, 100) / 100 * value.length);\nvalue.substr(0, n);';
        // the newest letters glow in the accent colour while typing
        c = UK.TX.animator(L, "UK Accent", { fill: x.accent }, { based: 1, shape: 2, start: 70, end: 100, hi: 0, lo: 100 });
    }
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
    if (!block) UK.TX.glowCtl(L, x, C, "Glow", "Caret Glow", x.fs * 0.3);
    var ref = UK.TX.ref(L);
    if (smooth) {
        // the x of every letter edge (layer space): measured on a copy showing the first k letters
        var str0 = String(d.text), D0 = L.duplicate(), dd0 = UK.textDoc(D0), xs = [], k0, doc0;
        try {
            try { dd0.expression = ""; } catch (eX) { }
            for (k0 = 0; k0 <= nCh; k0++) {
                if (k0 === 0) { xs.push(UK.round(r.left, 2)); continue; }
                doc0 = dd0.value; doc0.text = str0.substr(0, k0); dd0.setValue(doc0);
                var rk = D0.sourceRectAtTime(L.inPoint, false);
                xs.push(UK.round(Math.max(xs[xs.length - 1], rk.width > 0 ? rk.left + rk.width : xs[xs.length - 1]), 2));
            }
        } finally { D0.remove(); }
        // the caret stands where the hidden letters begin (the right end of the fade): letter index f, between edges
        UK.pos(C).expression = 'var t = ' + ref + ', e = t.effect("UK Typing")(1), X = [' + xs.join(",") + '];\n' +
            'var W = ' + SW + ', O = -W + (100 + W) * clamp(e, 0, 100) / 100, n = X.length - 1;\n' +
            'var f = clamp((O + W) / 100, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), x = X[i] + (X[i + 1] - X[i]) * (f - i);\n' +
            'if (String(t.text.sourceText).length != n) { var r = t.sourceRectAtTime(time, false); x = r.left + r.width * f / n; }\n' +
            't.toComp([x + ' + Math.round(x.fs * 0.17) + ', t.anchorPoint[1]]);';     // a little air between the text and the caret
    }
    else UK.pos(C).expression = 'var t = ' + ref + ';\nvar r = t.sourceRectAtTime(time, false);\nvar gap = ' + Math.round(x.fs * 0.08) + ';\nvar w = (r.width > 0) ? r.left + r.width + gap : t.anchorPoint[0] + gap;\nt.toComp([w, t.anchorPoint[1]]);';
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
UK.TX.P.st16 = function (L, x) { UK.TX.typing(L, x, false, true); };   // Type Line Cursor (smooth)
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
/*  21 List Picker: a vertical list scrolls up line by line; the ball sits beside the active line.
    One keyframed slider drives it all (UK List Active: 0 = first line, 1 = second ...; long, soft
    speed-ramps between the steps). On the precomp layer (Essential Properties):
      Ball Color / Ball Size          the ball
      Focus Color                     the active line
      Other Color / Blur / Opacity    every other line
      Range                           how far the other lines move away from the active one     */
UK.TX.P.st21 = function (L, x) {
    var td = UK.textDoc(L), d = td.value, i;
    var lines = String(d.text).split(/\r|\n/), n = lines.length;
    d.justification = ParagraphJustification.LEFT_JUSTIFY;
    td.setValue(d);
    d = td.value;
    var lh = (d.autoLeading || !d.leading) ? x.fs * 1.2 : d.leading, own = "#FFFFFF";
    try { var fc = d.fillColor; own = "#" + ((1 << 24) + (Math.round(fc[0] * 255) << 16) + (Math.round(fc[1] * 255) << 8) + Math.round(fc[2] * 255)).toString(16).substr(1); } catch (eF) { }
    var r = L.sourceRectAtTime(L.inPoint, false);
    UK.anchor(L).setValue([r.left + r.width / 2, r.top + x.fs * 0.6]);
    if (x.isNew) UK.pos(L).setValue([x.comp.width / 2, x.comp.height / 2]);
    UK.TX.setGroup(L, 3);
    // the lines scale around their left edge, so the list stays left-aligned next to the ball
    try { L.property("ADBE Text Properties").property("ADBE Text More Options").property("ADBE Text Anchor Point Align").setValue([-50, 0]); } catch (eA) { }
    // controls
    UK.colorCtl(L, "UK Ball Color", x.accent);
    UK.slider(L, "UK Ball Size", 100);
    UK.colorCtl(L, "UK Focus Color", own);
    UK.colorCtl(L, "UK Other Color", own);
    UK.slider(L, "UK Other Blur", Math.round(x.fs * 0.04));
    UK.slider(L, "UK Other Opacity", 30);
    UK.slider(L, "UK Range", Math.round(x.fs * 0.2));
    // the active line: one step per line, each move a long soft ease (no sudden starts or stops)
    UK.slider(L, "UK List Active", 0);
    var tStart = x.doIn ? x.tIn + x.dIn * 0.6 : x.tIn, tEnd = UK.TX.holdEnd(x);
    var step = Math.max(0.6, (tEnd - tStart) / Math.max(1, n - 1)), mv = Math.max(0.45, step * 0.6), ak = [], ac = [];
    for (i = 0; i < n; i++) {
        var t2 = tStart + i * step;
        if (i === 0) { ak.push([t2, 0]); continue; }
        ak.push([t2 - mv, i - 1], [t2, i]); ac.push("linear", [78, 78, 0, 0]);
    }
    if (ak.length > 1) UK.anim(UK.efx(L, "UK List Active").property(1), ak, ac);
    // every line: its own colour first (Focus) ...
    var fo = UK.TX.animator(L, "UK List Focus", { fill: own }, { based: 4, shape: 1, start: 0, end: 100 });
    fo.group().property("ADBE Text Animator Properties").property("ADBE Text Fill Color").expression = 'effect("UK Focus Color")(1)';
    // ... the others fade towards the Other look the further they are from the active line
    var ot = UK.TX.animator(L, "UK List Others", { fill: own, opacity: 30, blur: [2, 2], scale: [88, 88] }, { based: 4, shape: 1, start: 0, end: 100 });
    var OP = function () { return UK.TX.animators(L).property("UK List Others").property("ADBE Text Animator Properties"); };
    OP().property("ADBE Text Fill Color").expression = 'effect("UK Other Color")(1)';
    OP().property("ADBE Text Opacity").expression = 'effect("UK Other Opacity")(1)';
    OP().property("ADBE Text Blur").expression = 'var b = Math.max(0, effect("UK Other Blur")(1));\n[b, b]';
    UK.TX.exprSel(ot, 4, UK.TX.SEL + 'var a = effect("UK List Active")(1);\nvar v = s * ease(Math.abs(textIndex - 1 - a), 0, 1, 0, 1);\n[v, v, v];');
    // scroll (the active line stays on the ball) + Range (the other lines step away from it)
    var K = Math.round(lh * (n + 2) + x.fs * 6);
    var sc = UK.TX.animator(L, "UK List Move", { pos: [0, K] }, { based: 4, shape: 1, start: 0, end: 100 });
    UK.TX.exprSel(sc, 4, UK.TX.SEL + 'var a = effect("UK List Active")(1), i = textIndex - 1;\n' +
        'var dy = -a * ' + lh + ' + effect("UK Range")(1) * clamp(i - a, -1, 1);\n' +
        'var v = s * clamp(dy / ' + K + ' * 100, -100, 100) / 100;\n[v, v, v];');
    if (x.doIn) UK.TX.cascade(L, "in", { opacity: 0, pos: [0, x.fs * 0.3] }, { based: 4, W: 40, curve: "outSoft" }, x.tIn, x.dIn);
    if (x.doOut) UK.TX.outSoft(L, x, 4);
    // the ball next to the active line (colour and size from the text layer's controls)
    var D = UK.shapeLayer(x.comp, "List Ball");
    UK.addEllipse(UK.vecs(UK.group(UK.root(D), "Ball")), [Math.round(x.fs * 0.22), Math.round(x.fs * 0.22)], [0, 0]);
    UK.addFill(UK.vecs(UK.root(D).property("Ball")), x.accent);
    var ref = UK.TX.ref(L);
    UK.vecs(UK.root(D).property("Ball")).property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").expression = ref + '.effect("UK Ball Color")(1)';
    UK.pos(D).expression = 'var t = ' + ref + ';\nt.toComp([' + (r.left - x.fs * 0.45) + ', t.anchorPoint[1] - ' + (x.fs * 0.3) + ']);';
    if (x.doIn) UK.anim(UK.scale(D), [[x.tIn + x.dIn * 0.4, [0, 0]], [x.tIn + x.dIn, [100, 100]]], [[30, 80, 0, 0]]);
    if (x.doOut) UK.anim(UK.scale(D), [[x.tOut, [100, 100]], [x.tOut + x.dOut * 0.6, [0, 0]]], [[80, 30, 0, 0]]);
    UK.scale(D).expression = 'value * Math.max(0, ' + ref + '.effect("UK Ball Size")(1)) / 100';
    UK.TX.helper(L, D);
    x.egp = [["UK Ball Color", "Ball Color"], ["UK Ball Size", "Ball Size"], ["UK Focus Color", "Focus Color"], ["UK Other Color", "Other Color"],
        ["UK Other Blur", "Other Blur"], ["UK Other Opacity", "Other Opacity"], ["UK Range", "Range"]];
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
/* 05 Center Build (replaced Slide Blur Words, user request): the words arrive one by one and the line keeps
   itself centred - the first word lands in the middle, and every new word pushes the words already there to
   the left. In time = the pace of one word x 2 (a sentence of n words takes In time x n / 2, at least In time).
   The shift is keyframed on the "UK Center" animator (one eased move per new word); every word fades in from a
   little to the right out of a soft horizontal blur (expression selector, words).                            */
UK.TX.P.st26 = function (L, x) {
    var words = String(UK.textDoc(L).value.text).replace(/[\r\n]+/g, " ").split(" "), w = [], i;
    for (i = 0; i < words.length; i++) if (words[i] !== "") w.push(words[i]);
    var n = Math.max(1, w.length), total = x.dIn * Math.max(1, n / 2);
    if (x.isNew && x.doOut && total > x.dIn) {    // a new layer gets the extra time before its hold
        var extra = total - x.dIn;
        L.outPoint = Math.min(x.comp.duration, L.outPoint + extra);
        x.tOut = UK.snap(x.comp, x.tOut + extra);
    }
    if (x.doOut) total = Math.max(Math.min(x.dIn, x.tOut - x.tIn), Math.min(total, x.tOut - x.tIn));
    var step = total / n, app = step * 0.75, mv = step * 0.85;
    if (x.doIn) {
        // the width of the first k words, measured on a copy of the layer (same font, size, tracking)
        var D = L.duplicate(), dd = UK.textDoc(D), wid = [], doc;
        try {
            for (i = 0; i < n; i++) { doc = dd.value; doc.text = w.slice(0, i + 1).join(" "); dd.setValue(doc); wid.push(D.sourceRectAtTime(x.tIn, false).width); }
        } finally { D.remove(); }
        var full = wid[n - 1], dx = function (k) { return UK.round((full - wid[k]) / 2, 2); };
        var c = UK.TX.animator(L, "UK Center", { pos: [dx(0), 0] }, { based: 1, shape: 1, start: 0, end: 100 });
        if (n > 1) {
            var keys = [[x.tIn, [dx(0), 0, 0]]], cv = [];
            for (i = 1; i < n; i++) {
                var tk = x.tIn + i * step;
                keys.push([tk, [dx(i - 1), 0, 0]], [tk + mv, [dx(i), 0, 0]]);
                cv.push("linear", "inout");
            }
            UK.anim(c.group().property("ADBE Text Animator Properties").property("ADBE Text Position 3D"), keys, cv);
        }
        var a = UK.TX.animator(L, "UK In", { opacity: 0, pos: [x.fs * 0.35, 0], blur: [x.fs * 0.25, 0] }, { based: 3, shape: 1, start: 0, end: 100 });
        UK.TX.exprSel(a, 3, 'var t0 = ' + UK.round(x.tIn, 4) + ' + (textIndex - 1) * ' + UK.round(step, 4) + ';\n' +
            'var p = clamp((time - t0) / ' + UK.round(app, 4) + ', 0, 1);\n100 * Math.pow(1 - p, 3);');
    }
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
        // at the peak the letters stand on a wide ring around the word's centre, well apart: every
        // other letter on the upper / lower half, left letters on the left, right ones on the right
        // (a little random angle and distance each, so it looks thrown, never stacked)
        var RX = Math.round(Math.max(r.width * 0.68, x.fs * 1.8)), RY = Math.round(Math.max(x.fs * 1.3, Math.min(RX * 0.7, x.fs * 1.9)));
        UK.TX.exprSel(mv, 1, UK.TX.burstSel(L, x, r, 'seedRandom(textIndex * 17, true);\n' +
            'var u = (textIndex - 0.5) / textTotal, up = (textIndex % 2) == 1;\n' +
            'var a = (up ? Math.PI * (1 + u) : Math.PI * (1 - u)) + random(-0.12, 0.12), g = random(0.88, 1.12);\n' +
            'var tx = Math.cos(a) * ' + RX + ' * g, ty = Math.sin(a) * ' + RY + ' * g;\n' +
            'var dx = k("UK Burst Gather") * (cx - xi) + k("UK Burst Scatter") * (tx - (xi - cx));\n' +
            'var dy = k("UK Burst Scatter") * ty;\n' +
            '[dx / ' + K + ' * 100, dy / ' + K + ' * 100, 0];'));
        var bounce = [[t0 + 10 * f, 100], [t0 + 20 * f, 120], [t0 + 35 * f, 80], [t0 + 40 * f, 100]];
        // dropped on a layer (no null): the layer's own Scale keys, around the word's centre (anchor moved there,
        // position compensated, so nothing moves)
        if (x.noNull && UK.scale(L).numKeys === 0 && UK.anchor(L).numKeys === 0 && UK.anchor(L).expression === "") {
            var S0 = UK.scale(L).value, A0 = UK.anchor(L).value, cx0 = r.left + r.width / 2, cy0 = r.top + r.height / 2;
            UK.anchor(L).setValue([cx0, cy0].concat(A0.length > 2 ? [A0[2]] : []));
            UK.shiftPos(L, [(cx0 - A0[0]) * S0[0] / 100, (cy0 - A0[1]) * S0[1] / 100]);
            var bk = [], bi;
            for (bi = 0; bi < bounce.length; bi++) bk.push([bounce[bi][0], [S0[0] * bounce[bi][1] / 100, S0[1] * bounce[bi][1] / 100].concat(S0.length > 2 ? [S0[2]] : [])]);
            UK.anim(UK.scale(L), bk, ["smooth", "smooth", "smooth"]);
            if (x.doOut) UK.TX.outSoft(L, x, 1);
            return;
        }
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
    st32: "we lift what matters most", st33: "Break the rules", st34: "Explode", st35: "It's really easy to manage.",
    tx01: "Motion Made Simple", tx02: "Clear and calm", tx04: "Pop!", tx06: "Focus", tx07: "Flip the script",
    tx08: "Make some waves", tx09: "Drop in", tx10: "Softly random", tx11: "Stretch", tx12: "Center stage", tx13: "Slide right in"
};

/* ---------------------------------------------------------------- entry */
UK.api.text = function (a) {
    var comp = a._comp || UK.comp(true);
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
            UK.TX.egp(ic, IL, UK.TX.applyOne(a, preset, ic, IL, cti - W.startTime, false, dIn, dOut, hold, accent, mode));
            W.inPoint = IL.inPoint + W.startTime; W.outPoint = IL.outPoint + W.startTime;
            res.push(IL.name); outer.push(W);
        }
        UK.selectOnly(comp, outer);
        return { layers: res };
    }
    if (!targets.length && a.drop) return { layers: [], none: comp.selectedLayers.length ? "nottext" : "nolayer" };
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
        var xo = UK.TX.applyOne(a, preset, comp, L, cti, isNew, dIn, dOut, hold, accent, mode);
        done.push(L.name);
        // presets that build extra layers (echoes, sparkle, markers...) are tidied into one precomp,
        // unless we are already working inside one
        var inside = comp.comment.indexOf("UK text precomp") === 0, wrapped = (inside || a.drop) ? null : UK.TX.wrap(comp, L);   // dropped: the animation only, no precomp
        if (wrapped) UK.TX.egp(wrapped.source, UK.TX.wrapText(wrapped.source), xo);
        else UK.TX.egp(comp, L, xo);
        sel.push(wrapped || L);
    }
    UK.selectOnly(comp, sel);
    return { layers: done };
};
UK.TX.applyOne = function (a, preset, comp, L, cti, isNew, dIn, dOut, hold, accent, mode) {
    /* where the text is now (the centre of its box, in its parent's space) - a preset must not move it */
    var tRest = (L.inPoint + L.outPoint) / 2, par0 = L.parent, c0 = null;
    try { var r0 = L.sourceRectAtTime(tRest, false); if (r0.width > 0) c0 = UK.toParent(L, [r0.left + r0.width / 2, r0.top + r0.height / 2], tRest); } catch (eR) { }
    UK.TX.clean(L);
    var tIn = (cti >= L.inPoint && cti < L.outPoint) ? cti : L.inPoint;
    if (isNew) tIn = cti;
    var tOut = L.outPoint - dOut;
    if (mode === "both" && tOut < tIn + dIn) tOut = tIn + dIn;
    var x = {
        comp: comp, fs: UK.TX.fontSize(L), mode: mode, doIn: mode !== "out" || a.id === "tx08", doOut: mode !== "in" && a.id !== "tx08",
        tIn: UK.snap(comp, tIn), dIn: dIn, tOut: UK.snap(comp, tOut), dOut: dOut, hold: hold, accent: accent, accentLight: "#C4B5FD", isNew: isNew,
        noNull: !!a.drop                                         // dropped on a layer: no null rigs, the animation goes on the layer itself
    };
    /* colour off (panel switch): every accent becomes the text's own colour, so nothing is tinted */
    if (a.noAccent) {
        var own = "#FFFFFF";
        try { own = UK.toHex(UK.textDoc(L).value.fillColor); } catch (eC) { }
        x.accent = own; x.accentLight = own; x.noAccent = true;
    }
    preset(L, x);
    UK.TX.linkAccent(L, x);
    // put the text back where it was (anchor / justification changes of a preset otherwise move it)
    if (c0 && !isNew && L.parent === par0) {
        try {
            // measured in the middle of the hold, where every preset is at rest (some still settle just after In)
            var t1 = x.doIn ? x.tIn + x.dIn + Math.max(0.4, x.hold / 2) : x.tIn;
            if (x.doIn && x.doOut) t1 = Math.max(x.tIn + x.dIn + 0.02, (x.tIn + x.dIn + x.tOut) / 2);
            t1 = Math.min(t1, L.outPoint - 0.02);
            if (x.doOut) t1 = Math.min(t1, Math.max(x.tIn, x.tOut - 0.02));
            var r1 = L.sourceRectAtTime(t1, false);
            if (r1.width > 0) {
                var c1 = UK.toParent(L, [r1.left + r1.width / 2, r1.top + r1.height / 2], t1);
                if (Math.abs(c1[0] - c0[0]) > 0.5 || Math.abs(c1[1] - c0[1]) > 0.5) UK.shiftPos(L, [c0[0] - c1[0], c0[1] - c1[1]]);
            }
        } catch (eP) { }
    }
    return x;
};
/* controls a preset wants on its precomp layer (x.egp = [[effect on the text layer, label]...]):
   added to the comp's Essential Graphics, so they show under Essential Properties outside.      */
UK.TX.egp = function (comp, L, x) {
    if (!x || !x.egp || !L) return;
    for (var i = x.egp.length - 1; i >= 0; i--) {   // each new controller goes on top: add the list backwards
        var fx = L.property("ADBE Effect Parade").property(x.egp[i][0]);
        if (fx) UK.essential(comp, fx.property(1), x.egp[i][1]);
    }
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
    UK.centerAnchor(PL);                                        // the anchor in the centre of the text
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

/* ------------------------------------------------------------ drag & drop
   A preset tile dragged out of the panel onto a layer in the timeline. After Effects' timeline refuses drags from
   outside and scripts can't see the mouse, so the panel's helper (bin/ukdrag.exe) reads the timeline row under the
   mouse from the screen (layer number + name) and the panel asks here: dragHover selects that layer while it is a text
   layer (the row turns white, like a click), dragDrop applies the preset to it (no precomp, no null), dragCancel puts
   the selection back as it was before the drag. */
UK.TX.norm = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); };
UK.TX.similar = function (a, b) {                 // 1 - edit distance / length
    if (!a.length || !b.length) return 0;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 1; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
};
/* the layer of comp c on the row the helper read: number n (0 = not read) and the words of its name */
UK.TX.matchRow = function (c, n, words) {
    var parts = String(words || "").split(" "), cands = [], i, k;
    if (UK.TX.norm(words)) cands.push(UK.TX.norm(words));
    if (parts.length > 1 && UK.TX.norm(parts.slice(1).join(" "))) cands.push(UK.TX.norm(parts.slice(1).join(" ")));   // without the layer icon
    var fits = function (L) {                     // true / false, or null when the name can't be read (non-Latin)
        var ln = UK.TX.norm(L.name);
        if (!ln || !cands.length) return null;
        for (k = 0; k < cands.length; k++) {
            var o = cands[k];
            if (o === ln || (o.length >= 5 && o.length >= ln.length * 0.6 && ln.indexOf(o) >= 0) || (ln.length >= 5 && o.indexOf(ln) >= 0) || UK.TX.similar(o, ln) >= 0.72) return true;
        }
        return false;
    };
    if (n >= 1 && n <= c.numLayers && fits(c.layer(n)) !== false) return c.layer(n);
    var hit = null, count = 0;
    for (i = 1; i <= c.numLayers; i++) if (fits(c.layer(i)) === true) { hit = c.layer(i); count++; }
    return count === 1 ? hit : null;
};
UK.TX.selectOnly = function (c, L) { for (var i = 1; i <= c.numLayers; i++) { var s = c.layer(i) === L; if (c.layer(i).selected !== s) c.layer(i).selected = s; } };
UK.api.dragBegin = function () {
    var c = app.project.activeItem, sel = [];
    if (c instanceof CompItem) for (var i = 0; i < c.selectedLayers.length; i++) sel.push(c.selectedLayers[i].index);
    UK.TX._drag = { comp: c, sel: sel };
    return {};
};
UK.api.dragHover = function (a) {
    var c = app.project.activeItem;
    if (!(c instanceof CompItem)) return { state: "none" };
    var L = (a.n || a.words) ? UK.TX.matchRow(c, Number(a.n) || 0, a.words) : null;
    if (L && L instanceof TextLayer) { UK.TX.selectOnly(c, L); return { state: "text", idx: L.index, name: L.name }; }
    UK.TX.selectOnly(c, null);
    return L ? { state: "nottext", idx: L.index, name: L.name } : { state: "none" };
};
UK.api.dragCancel = function () {
    var D = UK.TX._drag, c = app.project.activeItem;
    UK.TX._drag = null;
    if (!D || !(c instanceof CompItem) || D.comp !== c) return {};
    for (var i = 1; i <= c.numLayers; i++) c.layer(i).selected = false;
    for (var k = 0; k < D.sel.length; k++) if (D.sel[k] <= c.numLayers) c.layer(D.sel[k]).selected = true;
    return {};
};
UK.api.dragDrop = function (a) {
    var c = app.project.activeItem, L = (c instanceof CompItem && a.idx >= 1 && a.idx <= c.numLayers) ? c.layer(a.idx) : null;
    if (!(L instanceof TextLayer)) { UK.api.dragCancel(); return { where: "nottext" }; }
    UK.TX._drag = null;
    UK.TX.selectOnly(c, L);
    if (a.data) {                                   // your own preset: its animation only
        if (!a.data.anim) return { where: "nottext" };
        return UK.api.libApply(a);
    }
    a.drop = true; a._comp = c;
    return UK.api.text(a);
};
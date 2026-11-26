/*  Ultimate Kit - Lower Thirds: name + title (profession) reveals (presets: shared/lowerthird.js).
    Precomp "LT - <preset>" (comp size), top -> bottom:
      [Block ...]      wipe-through blocks (only some presets)
      Name, Title      text layers, coloured by a Fill effect from Controls
      element layers   plates, bars, lines, dots... their size follows the text (GEO expressions)
      Controls         null: move it to move everything; colours as effects
    Every move is keyframed with zero-speed, long eased ramps (no linear corners).
    On the precomp layer (Essential Properties): Name, Title, Name Color, Title Color, Accent, Plate. */

UK.LT = {};
UK.LT.IN = [38, 85, 0, 0];     // gentle start, long soft landing
UK.LT.OUT = [80, 42, 0, 0];    // slow lift-off, eased out
UK.LT.COL = { A: "Accent", P: "Plate", N: "Name Color", T: "Title Color" };

/* keys for one item: hidden -> shown in its In slot, shown -> hidden in its mirrored Out slot */
UK.LT.keys = function (prop, hid, shown, s, x) {
    var k = [[s.a, hid], [s.a + s.d, shown]], c = [UK.LT.IN];
    if (x.out) { k.push([x.tO + s.oa, shown], [x.tO + s.oa + s.od, hid]); c.push("linear", UK.LT.OUT); }
    UK.anim(prop, k, c);
};
UK.LT.colExpr = function (c) { return 'thisComp.layer("Controls").effect("' + (UK.LT.COL[c] || "Accent") + '")(1)'; };

/* a lighter weight of the plugin font for the title line */
UK.LT.font2 = function () {
    var f = UK.font(), c = [f.replace(/-(SemiBold|Semibold|Bold|BoldMT)$/, "-Medium"), f.replace(/-(SemiBold|Semibold|Bold|BoldMT|Medium)$/, "-Regular"), "Inter-Medium", "Inter-Regular", "ArialMT"];
    try {
        for (var i = 0; i < c.length; i++) { var a = app.fonts.getFontsByPostScriptName(c[i]); if (a && a.length) return c[i]; }
    } catch (e) { }
    return f;
};

/* expression head shared by every element property: the text boxes (in the Controls null's space)
   and the preset's GEO function -> var g                                                           */
UK.LT.pre = function (e, x) {
    return [
        '// Ultimate Kit Lower Third: size follows the Name / Title text',
        'var T0 = ' + UK.round(x.T0, 3) + ';',
        UK_LT.GEO,
        'function mm(nm) { var L = thisComp.layer(nm), r = L.sourceRectAtTime(T0, false), p = L.transform.position, f = L.text.sourceText.style.fontSize;',
        '    return { l: p[0] + r.left, r: p[0] + r.left + r.width, t: p[1] - f * ' + UK_LT.CAP + ', b: p[1] + f * ' + UK_LT.DESC + ', y: p[1], f: f }; }',
        'var mN = mm("Name"), mT = mm("Title");',
        'var g = geo(' + UK.json(e) + ', { n: mN, t: mT, fs: mN.f, al: "' + x.al + '", first: ' + (x.ord === "tn" ? "mT" : "mN") + ', second: ' + (x.ord === "tn" ? "mN" : "mT") + ' });'
    ].join("\n") + "\n";
};

/* one graphic element (its own shape layer, parented to Controls) */
UK.LT.element = function (C, N, e, x, label) {
    var S = UK.shapeLayer(C, label);
    S.parent = N;
    UK.anchor(S).setValue([0, 0]);
    UK.pos(S).setValue([0, 0]);
    UK.group(UK.root(S), "Shape");
    var V = function () { return UK.vecs(UK.root(S).property("Shape")); };
    var G = function () { return UK.root(S).property("Shape"); };
    var pre = UK.LT.pre(e, x), T = e.t, col = UK.LT.colExpr(e.col), op = (e.op === undefined) ? 100 : e.op, k;
    var swE = 'thisComp.layer("Name").text.sourceText.style.fontSize * ' + (e.sw || 0.04);
    var stroke = function (w, cap) {
        var st = UK.addStroke(V(), "#FFFFFF", 4, { cap: cap || 2, join: 2, opacity: op });
        st.property("ADBE Vector Stroke Color").expression = col;
        st.property("ADBE Vector Stroke Width").expression = w;
    };
    var fill = function () { UK.addFill(V(), "#FFFFFF", op).property("ADBE Vector Fill Color").expression = col; };
    var trim = false;
    if (T === "plate" || T === "bar" || T === "outline") {
        var R = UK.addRect(V(), [100, 40], [0, 0], 0);
        R = V().property(1);
        R.property("ADBE Vector Rect Size").expression = pre + '[g.r - g.l, g.b - g.t]';
        R.property("ADBE Vector Rect Position").expression = pre + '[(g.l + g.r) / 2, (g.t + g.b) / 2]';
        if (T !== "bar") V().property(1).property("ADBE Vector Rect Roundness").expression = pre + 'g.rd';
        if (T === "outline") { stroke(swE); trim = true; } else fill();
    } else if (T === "dot" && (e.shape === "circle" || e.shape === "ring" || !e.shape)) {
        UK.addEllipse(V(), [40, 40], [0, 0]);
        V().property(1).property("ADBE Vector Ellipse Size").expression = pre + '[g.d, g.d]';
        V().property(1).property("ADBE Vector Ellipse Position").expression = pre + '[g.x, g.y]';
        if (e.shape === "ring") { stroke(swE); trim = true; } else fill();
    } else {
        // paths: lines, brackets, slash, corner, flank, block (a thick line), square / diamond dots
        var np = (T === "brackets" || T === "flank") ? 2 : 1, closed = (T === "dot");
        for (k = 0; k < np; k++) {
            UK.addPath(V(), [[0, 0], [10, 0]], null, null, closed);
            V().property(k + 1).property("ADBE Vector Shape").expression = pre + 'createPath(g.p[' + k + '], [], [], ' + closed + ');';
        }
        if (T === "dot") fill();
        else { stroke(T === "block" ? pre + 'g.b - g.t' : swE, T === "block" ? 1 : 2); trim = true; }
    }
    if (trim) UK.addTrim(V(), "Draw");
    // transform pivot (the edge or centre the animation grows from)
    UK.gtr(G(), "ADBE Vector Anchor").expression = pre + 'g.pv';
    UK.gtr(G(), "ADBE Vector Position").expression = pre + 'g.pv';
    // animation
    var s = UK_LT.sched(e.at, e.len, x.dIn, x.dOut), a = e.a;
    var Tr = function () { return V().property("Draw"); };
    if (a === "draw") UK.LT.keys(Tr().property("ADBE Vector Trim End"), 0, 100, s, x);
    else if (a === "drawR") UK.LT.keys(Tr().property("ADBE Vector Trim Start"), 100, 0, s, x);
    else if (a === "drawC") { UK.LT.keys(Tr().property("ADBE Vector Trim Start"), 50, 0, s, x); UK.LT.keys(Tr().property("ADBE Vector Trim End"), 50, 100, s, x); }
    else if (a === "block") {
        // sweeps on from the left, then off to the right (the text switches on while it is covered)
        var h = s.d / 2, oh = s.od / 2, ke = [[s.a, 0], [s.a + h, 100]], ks = [[s.a + h, 0], [s.a + s.d, 100]], ce = [UK.LT.IN], cs = [UK.LT.IN];
        if (x.out) {
            ks.push([x.tO + s.oa, 100], [x.tO + s.oa + oh, 0]); cs.push("linear", UK.LT.IN);
            ke.push([x.tO + s.oa + oh, 100], [x.tO + s.oa + s.od, 0]); ce.push("linear", UK.LT.IN);
        }
        UK.anim(Tr().property("ADBE Vector Trim End"), ke, ce);
        UK.anim(Tr().property("ADBE Vector Trim Start"), ks, cs);
    } else if (a === "fade") UK.LT.keys(UK.gtr(G(), "ADBE Vector Group Opacity"), 0, 100, s, x);
    else if (a === "scale") {
        UK.LT.keys(UK.gtr(G(), "ADBE Vector Scale"), [86, 86], [100, 100], s, x);
        UK.LT.keys(UK.gtr(G(), "ADBE Vector Group Opacity"), 0, 100, s, x);
    } else if (a === "pop") {
        // grows, swells a little past full size and settles - one smooth bell, no corner
        var pk = [[s.a, [0, 0]], [s.a + s.d * 0.62, [112, 112]], [s.a + s.d, [100, 100]]], pc = [[40, 70, 0, 0], [45, 80, 0, 0]];
        if (x.out) { pk.push([x.tO + s.oa, [100, 100]], [x.tO + s.oa + s.od, [0, 0]]); pc.push("linear", UK.LT.OUT); }
        UK.anim(UK.gtr(G(), "ADBE Vector Scale"), pk, pc);
    } else {
        var hid = (a === "up" || a === "down" || a === "center") ? [100, 0] : [0, 100];
        UK.LT.keys(UK.gtr(G(), "ADBE Vector Scale"), hid, [100, 100], s, x);
    }
    return S;
};

/* text reveal on the Name / Title layer */
UK.LT.band = function (L, f, x0, x1) {
    var M = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    M.name = "UK Band";
    L.property("ADBE Mask Parade").property("UK Band").property("ADBE Mask Shape").setValue(UK.makeShape([[x0, -f * 1.05], [x1, -f * 1.05], [x1, f * 0.4], [x0, f * 0.4]]));
};
UK.LT.textAnim = function (L, sp, x) {
    var type = sp[0], s = UK_LT.sched(sp[1], sp[2], x.dIn, x.dOut), f = UK.TX.fontSize(L), r = L.sourceRectAtTime(x.T0, false);
    var whole = function (props) { UK.LT.keys(UK.TX.whole(L, "UK Reveal", props)(), 100, 0, s, x); };
    var cas = function (props, o) {
        UK.TX.cascade(L, "in", props, o, s.a, s.d);
        if (x.out) UK.TX.cascade(L, "out", props, o, x.tO + s.oa, s.od);
    };
    switch (type) {
        case "rise": UK.LT.band(L, f, -4000, 4000); whole({ pos: [0, f * 1.3] }); break;
        case "drop": UK.LT.band(L, f, -4000, 4000); whole({ pos: [0, -f * 1.35] }); break;
        case "riseChars": UK.LT.band(L, f, -4000, 4000); cas({ pos: [0, f * 1.3] }, { W: 40, hi: 70, lo: 90, curve: "outSoft", curveOut: "inSoft" }); break;
        case "slide": UK.LT.band(L, f, r.left - 1, 4000); whole({ pos: [-(r.width + f * 0.6), 0] }); break;
        case "slideR": UK.LT.band(L, f, -4000, r.left + r.width + 1); whole({ pos: [r.width + f * 0.6, 0] }); break;
        case "fadeUp": cas({ opacity: 0, pos: [0, f * 0.35], blur: [f * 0.05, f * 0.05] }, { W: 40, hi: 70, lo: 90, curve: "outSoft", curveOut: "inSoft" }); break;
        case "blur": cas({ opacity: 0, blur: [f * 0.3, f * 0.3] }, { W: 55, hi: 80, lo: 90, curve: "smooth", curveOut: "inout" }); break;
        case "fade": whole({ opacity: 0, pos: [0, f * 0.25] }); break;
        case "track": whole({ track: 160, opacity: 0, blur: [f * 0.1, 0] }); break;
        case "pop": UK.TX.setGroup(L, 1); cas({ scale: [0, 0], opacity: 0 }, { W: 45, hi: 85, lo: 85, curve: "smooth", curveOut: "inout" }); break;
        case "words": cas({ opacity: 0, pos: [0, f * 0.3], blur: [f * 0.06, f * 0.06] }, { based: 3, W: 55, hi: 70, lo: 90, curve: "outSoft", curveOut: "inSoft" }); break;
        case "type": cas({ opacity: 0 }, { W: 10, hi: 60, lo: 60, curve: "linear", curveOut: "linear" }); break;
        case "flip": L.threeDPerChar = true; cas({ opacity: 0, rotX: -90, pos: [0, f * 0.25] }, { W: 45, hi: 70, lo: 90, curve: "outSoft", curveOut: "inSoft" }); break;
        case "wipe":
            UK.slider(L, "Wipe", 0);
            UK.LT.keys(UK.efx(L, "Wipe").property(1), 0, 100, s, x);
            var M = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
            M.name = "UK Wipe";
            var MS = L.property("ADBE Mask Parade").property("UK Wipe");
            MS.property("ADBE Mask Feather").setValue([f * 0.25, 0]);
            MS.property("ADBE Mask Shape").expression = ['var T0 = ' + UK.round(x.T0, 3) + ', r = sourceRectAtTime(T0, false), p = clamp(effect("Wipe")(1), 0, 100) / 100;',
                'var e = ' + UK.round(f * 0.3, 1) + ', x0 = r.left - e, x1 = x0 + (r.width + 2 * e) * p, y0 = r.top - 400, y1 = r.top + r.height + 400;',
                'createPath([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], [], [], true);'].join("\n");
            break;
        case "hold":
            // behind a wipe-through block: switches on while the block covers it
            var hk = [[0, 0], [Math.max(UK._fd, s.a), 100]], hc = ["hold"];
            if (x.out) { hk.push([x.tO + s.oa, 0]); hc.push("hold"); }
            UK.anim(UK.opac(L), hk, hc);
            break;
    }
};

UK.LT.text = function (C, N, str, nm, size, font, x, y, hex, cap, tracking) {
    var L = UK.addText(C, str, { name: nm, size: size, font: font, color: hex, tracking: tracking });
    var td = UK.textDoc(L), d = td.value;
    d.justification = x.al === "C" ? ParagraphJustification.CENTER_JUSTIFY : (x.al === "R" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY);
    // capitals as a text style (typing a new title keeps them); older AE: the string itself
    var capsOk = !cap;
    if (cap) { try { d.fontCapsOption = FontCapsOption.FONT_ALL_CAPS; capsOk = true; } catch (e) { } }
    if (cap && !capsOk) { try { d.allCaps = true; capsOk = true; } catch (e2) { } }
    if (!capsOk) d.text = String(d.text).toUpperCase();
    td.setValue(d);
    L.parent = N;
    UK.anchor(L).setValue([0, 0]);
    UK.pos(L).setValue([0, y]);
    UK.fx(L, "ADBE Fill", "Color");
    UK.efx(L, "Color").property("ADBE Fill-0002").setValue(UK.rgba(hex));
    UK.efx(L, "Color").property("ADBE Fill-0002").expression = UK.LT.colExpr(nm === "Name" ? "N" : "T");
    L.startTime = 0;
    return L;
};

/* AE sometimes throws a one-off "Internal error" from sourceRectAtTime while the comp is still being
   built and switches that expression off: re-apply and re-enable any expression that failed      */
UK.LT.heal = function (C) {
    var left = 0, pass, j;
    function walk(g) {
        for (var k = 1; k <= g.numProperties; k++) {
            var p = g.property(k);
            if (p.propertyType !== PropertyType.PROPERTY) { walk(p); continue; }
            if (!p.canSetExpression || p.expression === "") continue;
            var bad = false;
            try { p.valueAtTime(0.5, false); } catch (e) { bad = true; }
            if (p.expressionError || !p.expressionEnabled) bad = true;
            if (!bad) continue;
            if (pass === 2) { left++; continue; }
            var ex = p.expression;
            try { p.expression = ""; p.expression = ex; p.expressionEnabled = true; } catch (e2) { }
        }
    }
    for (pass = 1; pass <= 2; pass++) for (j = 1; j <= C.numLayers; j++) walk(C.layer(j));
    return left;
};
/* builds the lower third precomp and puts it into host at time t0 */
UK.LT.build = function (host, a, t0) {
    UK._fd = host.frameDuration;
    var p = UK_CAT.find(UK_CAT.lowerThird, a.id);
    if (!p) throw new Error("Unknown lower third " + a.id);
    var dIn = UK.clamp(Number(a.inDur) || 1.2, 0.3, 6), hold = UK.clamp(Number(a.hold) || 3, 0, 120), dOut = UK.clamp(Number(a.outDur) || 0.9, 0.3, 6);
    var out = a.mode !== "in", cti = t0;
    var dur = dIn + hold + (out ? dOut : 0);
    var def = UK_LT.colors(p), cols = a.colors || {};
    var cN = cols.name || def.name, cT = cols.title || def.title, cP = cols.plate || def.plate, cA = cols.accent || "#7C5CFF";
    var C = UK.newComp(UK.uniqueName("LT - " + p.name), host, dur, "Lower Thirds");
    UK._fd = C.frameDuration;
    var W = C.width, H = C.height, fs = Math.round(H * 0.062), ts = Math.round(fs * (p.cap ? 0.44 : 0.5));
    var x = { al: p.al, ord: p.ord, dIn: dIn, dOut: dOut, out: out, tO: dIn + hold, T0: Math.min(dur - C.frameDuration, dIn + 0.02) };
    var gap = UK_LT.lineGap(p, fs, ts);
    // the Controls null carries everything: move it to move the lower third
    var N = C.layers.addNull();
    N.name = "Controls";
    N.label = 2;
    UK.anchor(N).setValue([0, 0]);
    UK.pos(N).setValue(UK_LT.anchor(p, W, H, fs, gap));
    UK.colorCtl(N, "Name Color", cN);
    UK.colorCtl(N, "Title Color", cT);
    UK.colorCtl(N, "Accent", cA);
    UK.colorCtl(N, "Plate", cP);
    var i, blocks = [];
    // the text first (the element expressions read it), then the graphics under it, blocks on top
    var nameStr = a.name || "Alex Morgan", titleStr = a.title || "Creative Director";
    var TL = UK.LT.text(C, N, titleStr, "Title", ts, UK.LT.font2(), x, p.ord === "tn" ? 0 : gap, cT, p.cap, p.cap ? 160 : 10);
    var NL = UK.LT.text(C, N, nameStr, "Name", fs, UK.font(), x, p.ord === "tn" ? gap : 0, cN, false, -5);
    var under = [];
    for (i = 0; i < p.e.length; i++) {
        var e = p.e[i], label = { plate: "Plate", bar: "Bar", line: "Line", outline: "Frame", block: "Block", dot: "Dot", brackets: "Brackets", slash: "Slash", corner: "Corner", flank: "Lines" }[e.t] || "Shape";
        var S = UK.LT.element(C, N, e, x, UK.uniqueLayerName(C, label));
        if (e.t === "block") blocks.push(S); else under.push(S);
    }
    // stacking: blocks over the text; the other graphics under it, first element at the bottom
    for (i = 0; i < under.length; i++) under[i].moveAfter(TL);
    for (i = 0; i < blocks.length; i++) blocks[i].moveBefore(NL);
    UK.LT.textAnim(NL, p.n, x);
    UK.LT.textAnim(TL, p.t, x);
    N.moveToBeginning();
    // Essential Properties (each new controller goes on top: added backwards)
    var eg = [[UK.textDoc(NL), "Name"], [UK.textDoc(TL), "Title"], [UK.efx(N, "Name Color").property(1), "Name Color"], [UK.efx(N, "Title Color").property(1), "Title Color"],
        [UK.efx(N, "Accent").property(1), "Accent"], [UK.efx(N, "Plate").property(1), "Plate"]];
    for (i = eg.length - 1; i >= 0; i--) UK.essential(C, eg[i][0], eg[i][1]);
    UK.LT.heal(C);
    C.comment = "Ultimate Kit Lower Third: text and colours in Essential Properties of the precomp layer; move the Controls null to move everything.";
    // the layer in your comp, from the playhead
    var L = host.layers.add(C);
    L.startTime = cti;
    L.name = UK.uniqueLayerName(host, "Lower Third - " + nameStr.substr(0, 30));
    L.comment = "Ultimate Kit: Name, Title and colours in Essential Properties (twirl the layer open).";
    try { L.collapseTransformation = true; } catch (eC) { }
    UK.centerAnchor(L);       // the anchor in the centre of the lower third (nothing moves on screen)
    return L;
};
UK.api.lowerThird = function (a) {
    var host = UK.comp(true), L = UK.LT.build(host, a, UK.timeCTI(host));
    UK.selectOnly(host, [L]);
    return { name: L.name, comp: L.source.name };
};

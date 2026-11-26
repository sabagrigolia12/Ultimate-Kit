/*  Ultimate Kit - "Plugin Slot" text card (look: shared/slotcard.js). Precomp "Card - TEXT" (your comp's size):
      Controls   Null: Fill, Stroke Color, Stroke Width, Corner, Height, Show Icon, Show Dot (off: the text moves into their room), Dot Color, Icon (dropdown: Lines, Grip,
                 Bars, Power, Chevron), Icon Color, Text Color - all also in Essential Properties
      Text       the text (wide-tracked capitals), parented to the Card, its place follows its own width
      Icon       the 5 icons (only the chosen one shows) and the dot, parented to the Card
      Card       the rounded rectangle (fill + stroke); its width follows the text; Scale keys = the reveal
    Change the text and the card grows with it.                                                           */

UK.SLOT = {};
UK.SLOT.font = function () {
    try {
        for (var i = 0; i < UK_SLOT.FONTS.length; i++) { var a = app.fonts.getFontsByPostScriptName(UK_SLOT.FONTS[i]); if (a && a.length) return UK_SLOT.FONTS[i]; }
    } catch (e) { }
    return UK.font();
};
UK.SLOT.build = function (host, a, t0) {
    var D = UK_SLOT.DEF, s = {}, k;
    for (k in D) s[k] = D[k];
    if (a.slot) for (k in a.slot) if (a.slot[k] !== undefined && a.slot[k] !== null) s[k] = a.slot[k];
    var dIn = UK.clamp(Number(a.inDur) || 0.9, 0.3, 5), hold = UK.clamp(Number(a.hold) || 2.5, 0, 120), dOut = UK.clamp(Number(a.outDur) || 0.8, 0.3, 5);
    var T = UK_CARD.times(dIn, hold, dOut), RV = UK_SLOT.reveal(T), i, j;
    var str = String(a.text || "HIGH-PASS").replace(/\r\n|\n|\r/g, " ");
    var C = UK.newComp(UK.uniqueName("Card - " + str.substr(0, 28)), host, T.end, "Text Cards");
    UK._fd = C.frameDuration;
    var u = C.height / 1080, cx = C.width / 2, cy = C.height / 2, r2 = function (v) { return UK.round(v, 2); };
    var CT = 'thisComp.layer("Controls")', ctl = function (n) { return CT + '.effect("' + n + '")(1)'; };
    /* the text's left edge (L) and the card's width (W): the icon / dot switches move the text into their room */
    var LX = 'var si = ' + ctl("Show Icon") + ' == 1, sd = ' + ctl("Show Dot") + ' == 1;\nvar L = (si || sd) ? ' + r2(UK_SLOT.PADL * u) + ' + (si ? ' + r2((UK_SLOT.ICONW + UK_SLOT.G1) * u) + ' : 0) + (sd ? ' + r2((UK_SLOT.DOT + UK_SLOT.G2) * u) + ' : 0) : ' + r2(UK_SLOT.PADR * u) + ';\n';
    var WX = LX + 'var r = thisComp.layer("Text").sourceRectAtTime(time, false), W = r.width + L + ' + r2(UK_SLOT.PADR * u) + ';\n';

    /* Card */
    var K = UK.shapeLayer(C, "Card");
    UK.anchor(K).setValue([0, 0]); UK.pos(K).setValue([cx, cy]);
    var g = UK.group(UK.root(K), "Card");
    var rect = UK.addRect(UK.vecs(g), [600 * u, s.height * u], [0, 0], s.corner * u);
    /* the reveal of card 29 (lineX): a line grows across, then the card opens up and down; mirrored at the end */
    var LN = Math.max(3, Math.round(4 * u));
    rect.property("ADBE Vector Rect Size").expression = WX + 'var h = ' + ctl("Height") + ', rw = effect("Reveal W")(1), rh = effect("Reveal H")(1);\n[W * rw, ' + LN + ' + (h - ' + LN + ') * rh]';
    rect = UK.vecs(UK.root(K).property("Card")).property(1);
    rect.property("ADBE Vector Rect Roundness").expression = ctl("Corner");
    var st = UK.addStroke(UK.vecs(UK.root(K).property("Card")), s.stroke, s.sw * u);
    st.property("ADBE Vector Stroke Color").expression = ctl("Stroke Color");
    st.property("ADBE Vector Stroke Width").expression = ctl("Stroke Width");
    var fl = UK.addFill(UK.vecs(UK.root(K).property("Card")), s.fill);
    fl.property("ADBE Vector Fill Color").expression = ctl("Fill");
    UK.fx(K, "ADBE Slider Control", "Reveal W"); UK.fx(K, "ADBE Slider Control", "Reveal H");
    UK.anim(UK.efx(K, "Reveal W").property(1), RV.w, UK.CARD.curves(["line", "hold", "~line"]));
    UK.anim(UK.efx(K, "Reveal H").property(1), RV.h, UK.CARD.curves(["out", "hold", "~out"]));
    /* Card Matte (hidden): the card's own shape, clips the icon and the text */
    var Mt = UK.shapeLayer(C, "Card Matte");
    Mt.parent = K; UK.anchor(Mt).setValue([0, 0]); UK.pos(Mt).setValue([0, 0]);
    var mr = UK.addRect(UK.vecs(UK.group(UK.root(Mt), "Card")), [100, 100], [0, 0], 0);
    mr.property("ADBE Vector Rect Size").expression = 'thisComp.layer("Card").content("Card").content(1).size';
    mr = UK.vecs(UK.root(Mt).property("Card")).property(1);
    mr.property("ADBE Vector Rect Roundness").expression = 'thisComp.layer("Card").content("Card").content(1).roundness';
    UK.addFill(UK.vecs(UK.root(Mt).property("Card")), "#FFFFFF");
    Mt.enabled = false;

    /* Icon + Dot */
    var I = UK.shapeLayer(C, "Icon");
    I.parent = K; UK.anchor(I).setValue([0, 0]); UK.pos(I).setValue([0, 0]);
    var IX = r2(UK_SLOT.iconX() * u);
    var dg = UK.group(UK.root(I), "Dot");
    UK.addEllipse(UK.vecs(dg), [UK_SLOT.DOT * u, UK_SLOT.DOT * u], [0, 0]);
    UK.addFill(UK.vecs(UK.root(I).property("Dot")), s.dot).property("ADBE Vector Fill Color").expression = ctl("Dot Color");
    UK.gtr(UK.root(I).property("Dot"), "ADBE Vector Position").expression = WX + '[-W / 2 + ' + r2(UK_SLOT.PADL * u) + ' + (si ? ' + r2((UK_SLOT.ICONW + UK_SLOT.G1) * u) + ' : 0) + ' + r2(UK_SLOT.DOT / 2 * u) + ', 0]';
    UK.gtr(UK.root(I).property("Dot"), "ADBE Vector Group Opacity").expression = ctl("Show Dot") + ' == 1 ? 100 : 0';
    for (i = UK_SLOT.ICONS.length - 1; i >= 0; i--) {
        var ic = UK_SLOT.ICONS[i], gn = "Icon " + (i + 1) + " - " + ic.name;
        UK.group(UK.root(I), gn);
        var V = function () { return UK.vecs(UK.root(I).property(gn)); };
        var iu = u * UK_SLOT.IS, P = function (x, y) { return [r2(x * iu), r2(y * iu)]; };
        if (ic.line) for (j = 0; j < ic.line.length; j++) { var L0 = ic.line[j]; UK.addPath(V(), [P(L0[0], L0[1]), P(L0[2], L0[3])], null, null, false); }
        if (ic.poly) for (j = 0; j < ic.poly.length; j++) { var pp = [], q; for (q = 0; q < ic.poly[j].length; q++) pp.push(P(ic.poly[j][q][0], ic.poly[j][q][1])); UK.addPath(V(), pp, null, null, false); }
        if (ic.arc) for (j = 0; j < ic.arc.length; j++) {
            var sub = UK.group(V(), "Arc");
            UK.addEllipse(UK.vecs(sub), [ic.arc[j][0] * 2 * iu, ic.arc[j][0] * 2 * iu], [0, 0]);
            var tr = UK.addTrim(UK.vecs(V().property("Arc")));
            tr.property("ADBE Vector Trim Start").setValue(ic.arc[j][1]);
            tr = UK.vecs(V().property("Arc")).property("ADBE Vector Filter - Trim");
            tr.property("ADBE Vector Trim End").setValue(ic.arc[j][2]);
        }
        if (ic.line || ic.poly || ic.arc) {
            var sk = UK.addStroke(V(), s.iconColor, UK_SLOT.ISW * u, { cap: 2, join: 2 });
            sk.property("ADBE Vector Stroke Color").expression = ctl("Icon Color");
        }
        if (ic.dot) for (j = 0; j < ic.dot.length; j++) UK.addEllipse(V(), [ic.dot[j][2] * 2 * iu, ic.dot[j][2] * 2 * iu], P(ic.dot[j][0], ic.dot[j][1]));
        if (ic.bar) for (j = 0; j < ic.bar.length; j++) UK.addRect(V(), [r2(ic.bar[j][2] * iu), r2(ic.bar[j][3] * iu)], P(ic.bar[j][0], ic.bar[j][1]), r2(ic.bar[j][2] * iu / 2));
        if (ic.dot || ic.bar) UK.addFill(V(), s.iconColor).property("ADBE Vector Fill Color").expression = ctl("Icon Color");
        UK.gtr(UK.root(I).property(gn), "ADBE Vector Position").expression = WX + '[-W / 2 + ' + IX + ', 0]';
        UK.gtr(UK.root(I).property(gn), "ADBE Vector Group Opacity").expression = '(' + ctl("Icon") + ' == ' + (i + 1) + ' && ' + ctl("Show Icon") + ' == 1) ? 100 : 0';
    }
    UK.anim(UK.opac(I), [[T.deco[0], 0], [T.deco[1], 100], [T.deco[2], 100], [T.deco[3], 0]], UK.CARD.curves(["out", "hold", "~out"]));

    /* Text */
    var TL = UK.addText(C, str, { name: "Text", size: Math.round(UK_SLOT.FS * u), color: s.text, font: UK.SLOT.font(), tracking: UK_SLOT.TRACK });
    var td = UK.textDoc(TL), d = td.value;
    d.justification = ParagraphJustification.LEFT_JUSTIFY;
    try { d.fontCapsOption = FontCapsOption.FONT_ALL_CAPS; } catch (e1) { }
    td.setValue(d);
    TL.parent = K;
    UK.anchor(TL).setValue([0, 0]);
    UK.pos(TL).expression = LX + 'var r = sourceRectAtTime(time, false), W = r.width + L + ' + r2(UK_SLOT.PADR * u) + ';\n[-W / 2 + L - r.left, -(r.top + r.height / 2)]';
    UK.fx(TL, "ADBE Fill", "Color");
    UK.efx(TL, "Color").property("ADBE Fill-0002").setValue(UK.rgba(s.text));
    UK.efx(TL, "Color").property("ADBE Fill-0002").expression = ctl("Text Color");
    /* the text animation of card 29 ("rise": up from below through a band) */
    UK.CARD.text(TL, { txt: "rise" }, T, UK.textDoc(TL).value.fontSize);
    TL.moveToBeginning();
    TL.setTrackMatte(Mt, TrackMatteType.ALPHA);
    I.setTrackMatte(Mt, TrackMatteType.ALPHA);

    /* Controls */
    var N = C.layers.addNull();
    N.name = "Controls"; N.label = 2;
    UK.colorCtl(N, "Fill", s.fill);
    UK.colorCtl(N, "Stroke Color", s.stroke);
    UK.slider(N, "Stroke Width", r2(s.sw * u));
    UK.slider(N, "Corner", r2(s.corner * u));
    UK.slider(N, "Height", r2(s.height * u));
    UK.checkCtl(N, "Show Icon", s.showIcon !== false);
    UK.checkCtl(N, "Show Dot", s.showDot !== false);
    UK.colorCtl(N, "Dot Color", s.dot);
    var dd = UK.fx(N, "ADBE Dropdown Control", "Icon"), names = [];
    for (i = 0; i < UK_SLOT.ICONS.length; i++) names.push(UK_SLOT.ICONS[i].name);
    /* setPropertyParameters turns the effect into a pseudo effect with its default name: rename the new one */
    try { dd.property(1).setPropertyParameters(names).propertyGroup(1).name = "Icon"; } catch (e2) { }
    UK.efx(N, "Icon").property(1).setValue(UK.clamp(Math.round(Number(s.icon) || 1), 1, UK_SLOT.ICONS.length));
    UK.colorCtl(N, "Icon Color", s.iconColor);
    UK.colorCtl(N, "Text Color", s.text);
    try { N.source.parentFolder = UK.folder("Text Cards"); } catch (e3) { }

    /* Essential Properties of the precomp layer (added backwards: each lands on top) */
    var eg = [[UK.textDoc(TL), "Text"]], cn = ["Fill", "Stroke Color", "Stroke Width", "Corner", "Height", "Show Icon", "Show Dot", "Dot Color", "Icon", "Icon Color", "Text Color"];
    for (i = 0; i < cn.length; i++) eg.push([UK.efx(N, cn[i]).property(1), cn[i]]);
    for (i = eg.length - 1; i >= 0; i--) UK.essential(C, eg[i][0], eg[i][1]);
    C.comment = "Ultimate Kit Plugin Slot card: everything is on the Controls null (and in Essential Properties); the card's width follows the Text.";
    var ln = UK.uniqueLayerName(host, "Card - " + str.substr(0, 28)), Lh = host.layers.add(C);
    Lh.startTime = t0;
    Lh.name = ln;
    Lh.comment = "Ultimate Kit: text, colours, stroke, icon in Essential Properties.";
    UK.centerAnchor(Lh);      // the anchor in the centre of the card
    return Lh;
};

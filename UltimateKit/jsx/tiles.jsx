/*  Ultimate Kit - "Number Tiles" text card (look: shared/tiles.js). Precomp "Tiles - n" (your comp's size):
      Controls   Null: Count, Per Row (0 = two rows), Tile Size, Gap, Corner, Tile Color, Highlight, Glow Color, Glow,
                 Number Color, Delay (frames), In Time, Out Time, In At, Out At - all also in Essential Properties
      Numbers    one text layer: the numbers 1..Count (one per line, made by expression), each line placed on its
                 tile and scaled with it by text animators
      Tiles      one shape layer: a group per tile (the diamond + a white hot spot), placed and scaled by expression;
                 the look is made by its effects: black behind (Solid Composite), Gaussian Blur (the soft gradient
                 and the darker rim), Set Matte (its own sharp shape back), CC Toner (Highlight / Tile Color / a
                 darker tile colour), two Drop Shadows at distance 0 (the glow)
    Count can be changed after Apply up to the number of tiles built (at least 30).                              */

UK.TILES = {};
UK.TILES.font = function () {
    try {
        for (var i = 0; i < UK_TILES.FONTS.length; i++) { var a = app.fonts.getFontsByPostScriptName(UK_TILES.FONTS[i]); if (a && a.length) return UK_TILES.FONTS[i]; }
    } catch (e) { }
    return UK.font();
};
UK.TILES.build = function (host, a, t0) {
    var D = UK_TILES.DEF, s = {}, k, i;
    for (k in D) s[k] = D[k];
    if (a.tiles) for (k in a.tiles) if (a.tiles[k] !== undefined && a.tiles[k] !== null) s[k] = a.tiles[k];
    var n = UK.clamp(Math.round(Number(s.count) || 6), 1, 200), MAXN = Math.max(UK_TILES.MAX, n);
    var dIn = UK.clamp(Number(a.inDur) || 0.9, 0.2, 5), hold = UK.clamp(Number(a.hold) || 2.5, 0, 120), dOut = UK.clamp(Number(a.outDur) || 0.8, 0.2, 5);
    var fps = host.frameRate, T = UK_TILES.times(n, s.delay, fps, dIn, hold, dOut);
    var C = UK.newComp(UK.uniqueName("Tiles - " + n), host, T.end, "Text Cards");
    UK._fd = C.frameDuration;
    var u = C.height / 1080, cx = C.width / 2, cy = C.height / 2, r2 = function (v) { return UK.round(v, 2); };
    var CT = 'thisComp.layer("Controls")', ctl = function (nm) { return CT + '.effect("' + nm + '")(1)'; };
    /* the shared head of every tile expression: count, layout and timing from the Controls */
    var HEAD = 'var c = ' + CT + ', n = Math.round(c.effect("Count")(1)), per = c.effect("Per Row")(1), size = c.effect("Tile Size")(1), gap = c.effect("Gap")(1);\n' +
        'var dl = c.effect("Delay (frames)")(1) * thisComp.frameDuration, tt = Math.max(0.05, c.effect("In Time")(1)), to = Math.max(0.05, c.effect("Out Time")(1)), tIn = c.effect("In At")(1), tOut = c.effect("Out At")(1);\n';

    /* Controls (first, so the expressions below find them) */
    var N = C.layers.addNull();
    N.name = "Controls"; N.label = 2;
    UK.slider(N, "Count", n);
    UK.slider(N, "Per Row", Math.max(0, Math.round(Number(s.perRow) || 0)));
    UK.slider(N, "Tile Size", r2(s.size * u));
    UK.slider(N, "Gap", r2(s.gap * u));
    UK.slider(N, "Corner", r2(s.corner * u));
    UK.colorCtl(N, "Tile Color", s.tile);
    UK.colorCtl(N, "Highlight", s.hot);
    UK.colorCtl(N, "Glow Color", s.glow);
    UK.slider(N, "Glow", s.glowAmt);
    UK.colorCtl(N, "Number Color", s.number);
    UK.slider(N, "Delay (frames)", s.delay);
    UK.slider(N, "In Time", r2(T.tt));
    UK.slider(N, "Out Time", r2(T.to));
    UK.slider(N, "In At", 0);
    UK.slider(N, "Out At", r2(T.tOut));
    try { N.source.parentFolder = UK.folder("Text Cards"); } catch (e0) { }

    /* Tiles */
    var K = UK.shapeLayer(C, "Tiles");
    UK.anchor(K).setValue([0, 0]); UK.pos(K).setValue([cx, cy]);
    var H = UK_TILES.HOT;
    for (i = MAXN - 1; i >= 0; i--) {          // added backwards: tile 1 ends up on top
        var gn = "Tile " + (i + 1);
        UK.group(UK.root(K), gn);
        var G = function () { return UK.root(K).property(gn); };
        UK.group(UK.vecs(G()), "Hot");
        UK.addEllipse(UK.vecs(UK.vecs(G()).property("Hot")), [H.r * 200, H.r * 200], [H.x * 100, H.y * 100]);
        UK.addFill(UK.vecs(UK.vecs(G()).property("Hot")), "#FFFFFF");
        UK.group(UK.vecs(G()), "Body");
        var B = function () { return UK.vecs(UK.vecs(G()).property("Body")); };
        UK.addPath(B(), [[0, -50], [50, 0], [0, 50], [-50, 0]], null, null, true);
        var rc = B().addProperty("ADBE Vector Filter - RC");
        rc.property("ADBE Vector RoundCorner Radius").expression = 'var c = ' + CT + ';\nc.effect("Corner")(1) * 100 / Math.max(1, c.effect("Tile Size")(1))';
        UK.addFill(B(), "#808080");
        var tg = UK.gtr(G());
        tg.property("ADBE Vector Position").expression = HEAD + 'var i = ' + i + ';\n' + UK_TILES.POS_EXPR + '[px, py]';
        UK.gtr(G()).property("ADBE Vector Scale").expression = HEAD + 'var i = ' + i + ';\n' + UK_TILES.SCALE_EXPR + 'var v = i < n ? sc * size : 0;\n[v, v]';
    }
    /* the look: black behind, blurred (gradient + rim), its own sharp shape back, toned, glowing */
    UK.fx(K, "ADBE Solid Composite", "Backdrop");
    var sc0 = UK.efx(K, "Backdrop");
    sc0.property("ADBE Solid Composite-0002").setValue([0, 0, 0, 1]);
    UK.fx(K, "ADBE Gaussian Blur 2", "Gradient");
    UK.efx(K, "Gradient").property("ADBE Gaussian Blur 2-0001").expression = ctl("Tile Size") + ' * ' + UK_TILES.SPOT;
    UK.efx(K, "Gradient").property("ADBE Gaussian Blur 2-0003").setValue(1);
    UK.fx(K, "ADBE Set Matte3", "Shape");
    UK.efx(K, "Shape").property("ADBE Set Matte3-0001").setValue(K.index);
    UK.efx(K, "Shape").property("ADBE Set Matte3-0002").setValue(4);          // alpha
    UK.fx(K, "CC Toner", "Colors");
    var tn = UK.efx(K, "Colors");
    tn.property("CC Toner-0005").setValue(2);                                 // tritone
    UK.efx(K, "Colors").property("CC Toner-0001").expression = ctl("Highlight");
    UK.efx(K, "Colors").property("CC Toner-0002").expression = ctl("Tile Color");
    UK.efx(K, "Colors").property("CC Toner-0003").expression = 'var t = ' + ctl("Tile Color") + ';\n[t[0] * 0.42, t[1] * 0.42, t[2] * 0.5, 1]';
    var glows = [["Glow Wide", 0.5, 0.9], ["Glow Tight", 0.14, 1]];
    for (k = 0; k < glows.length; k++) {
        UK.fx(K, "ADBE Drop Shadow", glows[k][0]);
        var ds = UK.efx(K, glows[k][0]);
        ds.property("ADBE Drop Shadow-0004").setValue(0);
        UK.efx(K, glows[k][0]).property("ADBE Drop Shadow-0001").expression = ctl("Glow Color");
        UK.efx(K, glows[k][0]).property("ADBE Drop Shadow-0002").expression = 'Math.min(255, ' + ctl("Glow") + ' / 100 * 255 * ' + glows[k][2] + ')';
        UK.efx(K, glows[k][0]).property("ADBE Drop Shadow-0005").expression = ctl("Tile Size") + ' * ' + glows[k][1];
    }

    /* Numbers: one line per tile, the line's anchor on the digits' middle */
    var fs = Math.round(s.size * u * UK_TILES.FS), lead = Math.round(fs * 1.5), lines = [];
    for (i = 1; i <= n; i++) lines.push(String(i));
    var TL = UK.addText(C, lines.join("\r"), { name: "Numbers", size: fs, color: s.number, font: UK.TILES.font(), tracking: 0 });
    var td = UK.textDoc(TL), d = td.value;
    d.justification = ParagraphJustification.CENTER_JUSTIFY;
    try { d.autoLeading = false; d.leading = lead; } catch (e1) { }
    td.setValue(d);
    UK.textDoc(TL).expression = 'var n = Math.round(' + ctl("Count") + '), s = [];\nfor (var i = 1; i <= n; i++) s.push(i);\ns.join("\\r")';
    UK.anchor(TL).setValue([0, 0]); UK.pos(TL).setValue([cx, cy]);
    var more = TL.property("ADBE Text Properties").property("ADBE Text More Options");
    more.property("ADBE Text Anchor Point Option").setValue(3);               // grouping: line
    more.property("ADBE Text Anchor Point Align").setValue([0, -36]);         // the anchor up to the digits' middle
    var KK = 10000;
    var pl = UK.TX.animator(TL, "UK Place", { pos: [KK, KK] }, { based: 4, shape: 1, start: 0, end: 100 });
    UK.TX.exprSel(pl, 4, UK.TX.SEL + HEAD + 'var i = textIndex - 1;\n' + UK_TILES.POS_EXPR + 'var dy = py - i * ' + lead + ' + ' + r2(fs * 0.36) + ';\n[px / ' + KK + ' * s, dy / ' + KK + ' * s, 0]');   // s = the selector value, 100 = full
    var scA = UK.TX.animator(TL, "UK Scale", { scale: [0, 0] }, { based: 4, shape: 1, start: 0, end: 100 });
    UK.TX.exprSel(scA, 4, UK.TX.SEL + HEAD + 'var i = textIndex - 1;\n' + UK_TILES.SCALE_EXPR + 'var v = sc * size / ' + r2(s.size * u) + ';\nvar a = (1 - v) * s;\n[a, a, a]');
    UK.fx(TL, "ADBE Fill", "Number Color");
    UK.efx(TL, "Number Color").property("ADBE Fill-0002").expression = ctl("Number Color");
    TL.moveToBeginning();

    /* Essential Properties of the precomp layer (added backwards: each lands on top) */
    var cn = ["Count", "Per Row", "Tile Size", "Gap", "Corner", "Tile Color", "Highlight", "Glow Color", "Glow", "Number Color", "Delay (frames)"];
    for (i = cn.length - 1; i >= 0; i--) UK.essential(C, UK.efx(N, cn[i]).property(1), cn[i]);
    C.comment = "Ultimate Kit Number Tiles: everything is on the Controls null (and in Essential Properties). Count up to " + MAXN + ".";
    var ln = UK.uniqueLayerName(host, "Tiles - " + n), Lh = host.layers.add(C);
    Lh.startTime = t0;
    Lh.name = ln;
    Lh.comment = "Ultimate Kit: count, colours, sizes in Essential Properties.";
    UK.centerAnchor(Lh);      // the anchor in the centre of the tiles
    return Lh;
};

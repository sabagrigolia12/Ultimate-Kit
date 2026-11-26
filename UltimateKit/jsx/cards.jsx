/*  Ultimate Kit - Text Cards (presets: shared/cards.js).
    Built on After Effects' own "2D Text Box (Shape)" preset, so the card fits its text:
      Card        shape layer with AE's 2D Text Box (Select a Text Layer = Text). Its Padding, Roundness and
                  Offset shape the card; the reveal is keyframed on its Scale X / Scale Y (from the centre).
                  Effects: Shadow (Drop Shadow) or, on glowing looks, Glow + Glow Wide (Drop Shadows in the
                  accent that bloom in, breathe and fade). Details live inside it as groups (rim light, back
                  card, inner frame, corners, outline, bar, badge, dot, underline) and follow the card's box.
      Lights      one layer of soft light (top light, aurora, centre light, sweep), clipped; every light is
                  a stack of nested shapes with a gaussian falloff, so none ends in a hard edge
      Runner      a tapered comet running round the card's edge; its glow is effects on it
      Text, Index the text (the card measures it) and the list number
      Card Matte  (hidden) the card's own path, clips the lights and the text
    Change the text and the card, its outline, trims, runner, lights and details all follow it.     */

UK.CARD = {};
UK.CARD.PRESET = function () { return new File(UK.appFolder("Presets").fsName + "/Shapes/Elements/2D Text Box (Shape).ffx"); };
UK.CARD.PATH = 'thisComp.layer("Card").content("Text Box").content("Path 1").path';
UK.CARD.BB = 'function bb(t) { var p = ' + UK.CARD.PATH + '.points(t), b = [1e9, 1e9, -1e9, -1e9]; for (var i = 0; i < p.length; i++) { b[0] = Math.min(b[0], p[i][0]); b[1] = Math.min(b[1], p[i][1]); b[2] = Math.max(b[2], p[i][0]); b[3] = Math.max(b[3], p[i][1]); } return b; }\n';
UK.CARD.TB = 'thisComp.layer("Card").effect("2D Text Box")';
UK.CARD.curves = function (names) {
    var c = [], i;
    for (i = 0; i < names.length; i++) { var e = UK_CARD.ease(names[i]); c.push(e ? [e[0], e[1], 0, 0] : "linear"); }
    return c;
};
UK.CARD.col = function (name) { return 'thisComp.layer("Controls").effect("' + name + '")(1)'; };
UK.CARD.io = function (prop, a, b, c, e, v0, v1, ease) {
    UK.anim(prop, [[a, v0], [b, v1], [c, v1], [e, v0]], UK.CARD.curves([ease || "out", "hold", "~" + (ease || "out")]));
};
/* when the lights / glow bloom: a in, b peak (a little brighter), s settled, c leaving, e gone */
UK.CARD.lightKeys = function (T) {
    var a = T.light[0], b = T.light[1], c = T.light[2], e = T.light[3], s = Math.min(b + 0.6, (b + c) / 2);
    return { a: a, b: b, s: s, c: c, e: e };
};
/* a slow, gentle breathing (multiplies the keyed value) between the settle and the leave */
UK.CARD.breathe = function (LT, amt) {
    if (LT.c - LT.s < 1.6) return "";
    var s = UK.round(LT.s, 3), c = UK.round(LT.c, 3);
    return 'var w = ease(time, ' + s + ', ' + UK.round(LT.s + 0.8, 3) + ', 0, 1) * ease(time, ' + UK.round(LT.c - 0.6, 3) + ', ' + c + ', 1, 0);\n' +
        'value * (1 - ' + amt + ' * w * (0.5 - 0.5 * Math.cos((time - ' + s + ') * 2 * Math.PI / 3.2)))';
};
/* a glow as a Drop Shadow (distance 0) in the accent colour: it blooms (softness and opacity) and fades back */
UK.CARD.glow = function (L, name, acc, hex, LT, o) {
    UK.fx(L, "ADBE Drop Shadow", name);
    var e = function (n) { return UK.efx(L, name).property("ADBE Drop Shadow-" + UK.pad(n, 4)); };
    e(1).setValue(UK.rgba(hex));
    e(1).expression = acc;
    e(4).setValue(0);
    UK.anim(e(5), [[LT.a, UK.round(o.soft[0], 1)], [LT.s, UK.round(o.soft[1], 1)], [LT.c, UK.round(o.soft[1], 1)], [LT.e, UK.round(o.soft[0], 1)]], UK.CARD.curves(["out", "hold", "~out"]));
    UK.anim(e(2), [[LT.a, 0], [LT.b, Math.min(255, o.op * 1.15)], [LT.s, o.op], [LT.c, o.op], [LT.e, 0]], UK.CARD.curves(["settle", "inout", "hold", "~settle"]));
    if (o.breathe) e(2).expression = UK.CARD.breathe(LT, 0.2);
};
/* fill opacities (0..1) of n nested shapes, ring k = k/n of the full size (k = n the outermost), so their
   stack has a soft gaussian falloff from the centre to nothing at the edge */
UK.CARD.rings = function (n) {
    var A = [], a = [], k;
    for (k = 1; k <= n; k++) A[k] = Math.exp(-3.6 * Math.pow((k - 0.5) / n, 2));
    for (k = n; k >= 1; k--) a[k] = (k === n) ? A[n] : 1 - (1 - A[k]) / (1 - A[k + 1]);
    return a;
};
/* the box of a shape layer's path [x0, y0, x1, y1] */
UK.CARD.bounds = function (prop, t) {
    var v = prop.valueAtTime(t, false).vertices, b = [1e9, 1e9, -1e9, -1e9], i;
    for (i = 0; i < v.length; i++) { b[0] = Math.min(b[0], v[i][0]); b[1] = Math.min(b[1], v[i][1]); b[2] = Math.max(b[2], v[i][0]); b[3] = Math.max(b[3], v[i][1]); }
    return b;
};
/* a new group in a layer's contents (optionally moved to the top of the list = drawn in front) */
UK.CARD.grp = function (L, name, top) {
    var g = UK.group(UK.root(L), name);
    if (top) { try { UK.root(L).property(name).moveTo(1); } catch (e) { } }
    return function () { return UK.vecs(UK.root(L).property(name)); };
};
UK.CARD.text = function (L, p, T, f) {
    var a = T.text[0], b = T.text[1], c = T.text[2], e = T.text[3], r = L.sourceRectAtTime(0, false);
    var keys = function (prop) { UK.CARD.io(prop, a, b, c, e, 100, 0, "out"); };
    var cas = function (props, o) {
        UK.TX.cascade(L, "in", props, o, a, b - a);
        UK.TX.cascade(L, "out", props, { based: o.based, W: o.W, hi: o.hi, lo: o.lo, curveOut: o.curveOut }, c, e - c);
    };
    switch (p.txt) {
        case "blur": cas({ opacity: 0, blur: [f * 0.3, f * 0.3] }, { W: 55, hi: 80, lo: 90, curve: "smooth", curveOut: "inout" }); break;
        case "track": keys(UK.TX.whole(L, "UK Reveal", { track: 70, opacity: 0, blur: [f * 0.12, 0] })()); break;
        case "rise":
            var M = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
            M.name = "UK Band";
            L.property("ADBE Mask Parade").property("UK Band").property("ADBE Mask Shape").setValue(UK.makeShape([[r.left - 4000, r.top - f * 0.15], [r.left + r.width + 4000, r.top - f * 0.15], [r.left + r.width + 4000, r.top + r.height + f * 0.2], [r.left - 4000, r.top + r.height + f * 0.2]]));
            keys(UK.TX.whole(L, "UK Reveal", { pos: [0, r.height + f * 0.5] })());
            break;
        case "pop": UK.TX.setGroup(L, 1); cas({ scale: [0, 0], opacity: 0 }, { W: 45, hi: 85, lo: 85, curve: "smooth", curveOut: "inout" }); break;
        case "words": cas({ opacity: 0, pos: [0, f * 0.3], blur: [f * 0.06, f * 0.06] }, { based: 3, W: 55, hi: 70, lo: 90, curve: "outSoft", curveOut: "inSoft" }); break;
        default: cas({ opacity: 0, pos: [0, f * 0.35], blur: [f * 0.05, f * 0.05] }, { W: 40, hi: 70, lo: 90, curve: "outSoft", curveOut: "inSoft" });
    }
};

UK.CARD.build = function (host, a, t0) {
    UK._fd = host.frameDuration;
    var p = UK_CAT.find(UK_CAT.cards, a.id);
    if (!p) throw new Error("Unknown card " + a.id);
    var preset = UK.CARD.PRESET();
    if (!preset.exists) throw new Error("After Effects' preset \"2D Text Box (Shape)\" was not found (Presets/Shapes/Elements).");
    var S = UK_CARD.PALS[p.pal], has = function (dc) { return UK_CARD.has(p, dc); };
    var dIn = UK.clamp(Number(a.inDur) || 0.9, 0.3, 5), hold = UK.clamp(Number(a.hold) || 2.5, 0, 120), dOut = UK.clamp(Number(a.outDur) || 0.8, 0.3, 5);
    var T = UK_CARD.times(dIn, hold, dOut), TH = UK.round(T.card[1], 3), D = T.deco, i;
    var cols = { card: a.cardColor || S.card, text: a.textColor || S.text, accent: a.accent || S.accent };
    var str = String(a.text || p.text).replace(/\r\n|\n/g, "\r");
    var C = UK.newComp(UK.uniqueName("Card - " + str.replace(/\r/g, " ").substr(0, 28)), host, T.end, "Text Cards");
    UK._fd = C.frameDuration;
    var W = C.width, H = C.height, cx = W / 2, cy = H / 2, d = UK_CARD.dims(p, H, { ws: a.ws, hs: a.hs, rd: a.rd }), u = d.u, lay = UK_CARD.layout(p, d);
    var place = function (L) { UK.anchor(L).setValue([0, 0]); UK.pos(L).setValue([cx, cy]); L.startTime = 0; return L; };
    var outline = (p.rev === "outline"), OK = outline ? UK_CARD.outlineKeys(T) : null, ACC = UK.CARD.col("Accent");
    var BBH = UK.CARD.BB + 'var B = bb(' + TH + ');\n';   // the card's box once it is open
    // ---- controls
    var N = C.layers.addNull();
    N.name = "Controls"; N.label = 2;
    UK.colorCtl(N, "Card Color", cols.card);
    UK.colorCtl(N, "Text Color", cols.text);
    UK.colorCtl(N, "Accent", cols.accent);
    // ---- text (the card measures it)
    var TL = UK.addText(C, str, { name: "Text", size: d.fs, color: cols.text, tracking: 0 });
    var td = UK.textDoc(TL), dd = td.value;
    if (lay.text.left !== null) { dd.justification = ParagraphJustification.LEFT_JUSTIFY; td.setValue(dd); }
    var r0 = TL.sourceRectAtTime(0, false), fit = Math.min(1, lay.text.avail / Math.max(1, r0.width), (d.h * 0.8) / Math.max(1, r0.height));
    if (fit < 0.999) { dd = td.value; dd.fontSize = Math.max(8, Math.floor(d.fs * fit)); td.setValue(dd); }
    TL.startTime = 0;
    UK.centerText(TL, C, [cx, cy]);
    // ---- the card: AE's 2D Text Box (Shape)
    var K = UK.shapeLayer(C, "Card");
    place(K);
    K.applyPreset(preset);
    var KE = function () { return K.property("ADBE Effect Parade"); };
    KE().property(1).property(1).setValue(TL.index);
    var tb = function (n) { return KE().property("2D Text Box").property("Pseudo/ADBE 2D Text Box-" + UK.pad(n, 4)); };
    tb(1).setValue(1);            // Measure Text: At Single Time ...
    tb(2).setValue(TH);           // ... once the text has fully arrived
    tb(4).setValue(0); tb(5).setValue(100); tb(6).setValue(100); tb(7).setValue(1);
    for (i = 10; i <= 14; i++) tb(i).setValue(0);
    tb(21).setValue(0);
    var KP = function () { return UK.vecs(UK.root(K).property("Text Box")).property("Path 1").property("ADBE Vector Shape"); };
    // padding: the box the design asks for around this text (left layouts keep room for the badge / bar / dot)
    var b0 = UK.CARD.bounds(KP(), TH), bw = b0[2] - b0[0], bh = b0[3] - b0[1];
    var PD = UK_CARD.pads(p, d, lay, bw, bh, a.ws), pT = PD.t, pL = PD.l, pR = PD.r;
    tb(11).setValue(UK.round(pL, 1)); tb(12).setValue(UK.round(pR, 1)); tb(13).setValue(UK.round(pT, 1)); tb(14).setValue(UK.round(pT, 1));
    // centre the card in the frame (the text moves; the box follows it)
    var b1 = UK.CARD.bounds(KP(), TH), tp = UK.pos(TL).value;
    UK.pos(TL).setValue([tp[0] - (b1[0] + b1[2]) / 2, tp[1] - (b1[1] + b1[3]) / 2]);
    var BX = UK.CARD.bounds(KP(), TH), Wb = BX[2] - BX[0], Hb = BX[3] - BX[1];
    tb(21).setValue(UK.round(d.rd >= 0.999 ? Math.ceil(Math.min(Wb, Hb) / 2) + 1 : d.rd * Math.min(Wb, Hb) / 2, 1));
    // reveal: Scale X / Scale Y of the 2D Text Box (from the centre), the same keys mirrored on the way out
    var sk = UK_CARD.sizeKeys(p, { w: Wb, h: Hb, u: u }, T), kx = [], ky = [];
    for (i = 0; i < sk.k.length; i++) { kx.push([sk.k[i][0], sk.k[i][1][0] / Wb * 100]); ky.push([sk.k[i][0], sk.k[i][1][1] / Hb * 100]); }
    UK.anim(tb(5), kx, UK.CARD.curves(sk.e));
    UK.anim(tb(6), ky, UK.CARD.curves(sk.e));
    var KV = function () { return UK.vecs(UK.root(K).property("Text Box")); };
    KV().property("Fill 1").property("ADBE Vector Fill Color").expression = UK.CARD.col("Card Color");
    KV().property("Stroke 1").property("ADBE Vector Stroke Color").setValue(UK.rgba(S.border[0]));
    KV().property("Stroke 1").property("ADBE Vector Stroke Width").setValue(Math.max(1, UK.round(S.border[2] * u * 1.3, 1)));
    var fillFollow = function (prop, full) {
        if (!outline) { prop.setValue(full); return; }
        var k = [], j;
        for (j = 0; j < OK.fill.k.length; j++) k.push([OK.fill.k[j][0], full * OK.fill.k[j][1] / 100]);
        UK.anim(prop, k, UK.CARD.curves(OK.fill.e));
    };
    fillFollow(KV().property("Fill 1").property("ADBE Vector Fill Opacity"), S.fo);
    fillFollow(KV().property("Stroke 1").property("ADBE Vector Stroke Opacity"), S.border[1]);
    // effects on the card: a soft shadow, or (glowing looks) a two-layer glow - a tight bright halo and a
    // wide soft bloom - that blooms in once the card is open, breathes gently and fades before it closes
    var LT = UK.CARD.lightKeys(T);
    if (has("glow")) {
        UK.CARD.glow(K, "Glow", ACC, cols.accent, LT, { soft: [6 * u, 12 * u], op: 235 });
        UK.CARD.glow(K, "Glow Wide", ACC, cols.accent, LT, { soft: [24 * u, Math.max(64 * u, Hb * 0.5)], op: 185, breathe: true });
    } else {
        UK.fx(K, "ADBE Drop Shadow", "Shadow");
        var sh = function () { return UK.efx(K, "Shadow"); };
        sh().property("ADBE Drop Shadow-0003").setValue(180);
        sh().property("ADBE Drop Shadow-0004").setValue(Math.round(Hb * 0.08));
        sh().property("ADBE Drop Shadow-0005").setValue(Math.round(Hb * 0.4 + 30 * u));
        fillFollow(sh().property("ADBE Drop Shadow-0002"), S.shadow * 2.55);
    }
    // ---- details inside the Card layer (groups that follow the card's box)
    var accStroke = function (V, w, o) { var s = UK.addStroke(V(), cols.accent, w, o || { cap: 2, join: 2 }); s.property("ADBE Vector Stroke Color").expression = ACC; return s; };
    var accFill = function (V) { UK.addFill(V(), cols.accent, 100).property("ADBE Vector Fill Color").expression = ACC; };
    if (has("back")) {
        // a second card behind (below the card in the list), turning out a little
        var VB = UK.CARD.grp(K, "Back Card", false);
        UK.addPath(VB(), [[0, 0], [1, 0], [1, 1]], null, null, true);
        VB().property(1).property("ADBE Vector Shape").expression = UK.CARD.PATH;
        accFill(VB);
        var gB = function (n) { return UK.gtr(UK.root(K).property("Back Card"), n); };
        gB("ADBE Vector Group Opacity").setValue(p.pal === "glass" ? 22 : 38);
        gB("ADBE Vector Anchor").expression = BBH + '[(B[0] + B[2]) / 2, (B[1] + B[3]) / 2]';
        UK.CARD.io(gB("ADBE Vector Position"), D[0], D[1], D[2], D[3], [0, 0], [18 * u, 16 * u], "out");
        gB("ADBE Vector Position").expression = BBH + 'value + [(B[0] + B[2]) / 2, (B[1] + B[3]) / 2]';
        UK.CARD.io(gB("ADBE Vector Rotation"), D[0], D[1], D[2], D[3], 0, -4, "out");
    }
    if (has("inset")) {
        var ins = Math.round(Math.max(8 * u, Hb * 0.09)), VI = UK.CARD.grp(K, "Inner Frame", true);
        UK.addRect(VI(), [10, 10], [0, 0]);
        VI().property(1).property("ADBE Vector Rect Size").expression = UK.CARD.BB + 'var B = bb(time);\n[Math.max(0, B[2] - B[0] - ' + 2 * ins + '), Math.max(0, B[3] - B[1] - ' + 2 * ins + ')]';
        VI().property(1).property("ADBE Vector Rect Position").expression = UK.CARD.BB + 'var B = bb(time);\n[(B[0] + B[2]) / 2, (B[1] + B[3]) / 2]';
        VI().property(1).property("ADBE Vector Rect Roundness").expression = 'Math.max(0, ' + UK.CARD.TB + '("Pseudo/ADBE 2D Text Box-0021") - ' + ins + ')';
        accStroke(VI, Math.max(1, UK.round(1.1 * u, 1)), { opacity: 55 });
        UK.CARD.io(UK.gtr(UK.root(K).property("Inner Frame"), "ADBE Vector Group Opacity"), D[0], D[1], D[2], D[3], 0, 100, "inout");
    }
    if (has("rim")) {
        // a fine highlight on the top edge: a tapered line, brightest in the middle, gone well before the corners
        var rw = Math.max(1.2, UK.round(1.6 * u, 1)), VRm = UK.CARD.grp(K, "Rim Light", true);
        UK.addPath(VRm(), [[0, 0], [1, 0]], null, null, false);
        VRm().property(1).property("ADBE Vector Shape").expression = UK.CARD.BB + 'var B = bb(time), w = B[2] - B[0], r = Math.min(' + UK.CARD.TB + '("Pseudo/ADBE 2D Text Box-0021"), (B[3] - B[1]) / 2);\n' +
            'var m = Math.max(r, w * 0.14), y = B[1] + ' + UK.round(rw / 2 + 0.5, 2) + ';\ncreatePath([[B[0] + m, y], [B[2] - m, y]], [], [], false);';
        var rs = UK.addStroke(VRm(), "#FFFFFF", rw, { cap: 2, opacity: p.pal === "glass" ? 90 : 75 });
        UK.UL.taper(rs.property("ADBE Vector Stroke Taper"), [50, 50, 0, 0, 40, 40]);
        UK.CARD.io(UK.gtr(UK.root(K).property("Rim Light"), "ADBE Vector Group Opacity"), D[0], D[1], D[2], D[3], 0, 100, "inout");
    }
    if (has("corners")) {
        var ci =Math.round(Math.max(10 * u, Hb * 0.08)), arm = Math.round(Math.min(Math.min(Wb, Hb) * 0.16, 44 * u)), q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        var VC = UK.CARD.grp(K, "Corners", true);
        for (i = 0; i < 4; i++) {
            UK.addPath(VC(), [[0, 0], [1, 0], [1, 1]], null, null, false);
            VC().property(VC().numProperties).property("ADBE Vector Shape").expression = BBH + 'var cx = (B[0] + B[2]) / 2, cy = (B[1] + B[3]) / 2, x = (B[2] - B[0]) / 2 - ' + ci + ', y = (B[3] - B[1]) / 2 - ' + ci + ', a = ' + arm + ', sx = ' + q[i][0] + ', sy = ' + q[i][1] + ';\ncreatePath([[cx + sx * x, cy + sy * (y - a)], [cx + sx * x, cy + sy * y], [cx + sx * (x - a), cy + sy * y]], [], [], false);';
        }
        accStroke(VC, Math.max(1.5, UK.round(2 * u, 1)));
        UK.addTrim(VC(), "Draw");
        UK.CARD.io(VC().property("Draw").property("ADBE Vector Trim End"), D[0], D[1], D[2], D[3], 0, 100, "inout");
    }
    if (outline) {
        // the edge draws on first (the card's own path, trimmed), then the card fills in
        var VO = UK.CARD.grp(K, "Outline", true);
        UK.addPath(VO(), [[0, 0], [1, 0], [1, 1]], null, null, true);
        VO().property(1).property("ADBE Vector Shape").expression = UK.CARD.PATH;
        accStroke(VO, Math.max(1.5, UK.round(S.border[2] * u * 1.6, 1)), { opacity: 85 });
        UK.addTrim(VO(), "Draw");
        var dk = [];
        for (i = 0; i < OK.draw.k.length; i++) dk.push([OK.draw.k[i][0], OK.draw.k[i][1]]);
        UK.anim(VO().property("Draw").property("ADBE Vector Trim End"), dk, UK.CARD.curves(OK.draw.e));
    }
    var leftPos = function (x) { return BBH + '[B[0] + ' + UK.round(x, 2) + ', (B[1] + B[3]) / 2]'; };
    if (lay.bar) {
        var VBr = UK.CARD.grp(K, "Accent Bar", true);
        UK.addRect(VBr(), [lay.bar.w, lay.bar.h], [0, 0], lay.bar.w / 2);
        accFill(VBr);
        UK.CARD.io(VBr().property(1).property("ADBE Vector Rect Size"), D[0], D[1], D[2], D[3], [lay.bar.w, 0], [lay.bar.w, Math.min(lay.bar.h, Hb * 0.55)], "out");
        VBr().property(1).property("ADBE Vector Rect Position").expression = leftPos(lay.bar.x);
    }
    var badgeL = null;
    if (lay.badge) {
        var VBg = UK.CARD.grp(K, "Badge", true);
        UK.addEllipse(VBg(), [lay.badge.d, lay.badge.d], [0, 0]);
        accFill(VBg);
        UK.CARD.io(VBg().property(1).property("ADBE Vector Ellipse Size"), D[0], D[1], D[2], D[3], [0, 0], [lay.badge.d, lay.badge.d], "over");
        VBg().property(1).property("ADBE Vector Ellipse Position").expression = leftPos(lay.badge.x);
        badgeL = UK.addText(C, a.index || "01", { name: "Index", size: Math.round(lay.badge.d * 0.42), color: cols.card, tracking: 0 });
        badgeL.startTime = 0;
        UK.fx(badgeL, "ADBE Fill", "Color");
        UK.efx(badgeL, "Color").property("ADBE Fill-0002").expression = UK.CARD.col("Card Color");
        UK.pos(badgeL).expression = UK.CARD.BB + 'var B = bb(' + TH + '), c = thisComp.layer("Card");\nc.toComp([B[0] + ' + UK.round(lay.badge.x, 2) + ', (B[1] + B[3]) / 2])';
        UK.CARD.io(UK.opac(badgeL), (D[0] + D[1]) / 2, D[1] + 0.1, D[2], D[2] + (D[3] - D[2]) * 0.6, 0, 100, "out");
    }
    if (lay.dot) {
        var VD = UK.CARD.grp(K, "Dot", true);
        UK.addEllipse(VD(), [lay.dot.d, lay.dot.d], [0, 0]);
        accFill(VD);
        UK.CARD.io(VD().property(1).property("ADBE Vector Ellipse Size"), D[0], D[1], D[2], D[3], [0, 0], [lay.dot.d, lay.dot.d], "over");
        VD().property(1).property("ADBE Vector Ellipse Position").expression = leftPos(lay.dot.x);
        // a soft ring pulsing out of the dot: one keyframed pulse on the group, repeated by loopOut
        var VPu = UK.CARD.grp(K, "Dot Pulse", true);
        UK.addEllipse(VPu(), [lay.dot.d, lay.dot.d], [0, 0]);
        VPu().property(1).property("ADBE Vector Ellipse Position").expression = leftPos(lay.dot.x);
        accStroke(VPu, Math.max(1.5, UK.round(1.6 * u, 1)), {});
        var gP = function (n) { return UK.gtr(UK.root(K).property("Dot Pulse"), n); };
        gP("ADBE Vector Anchor").expression = leftPos(lay.dot.x);
        gP("ADBE Vector Position").expression = leftPos(lay.dot.x);
        UK.anim(gP("ADBE Vector Scale"), [[D[1], [100, 100]], [D[1] + 1.3, [320, 320]]], UK.CARD.curves(["out"]), { expr: 'loopOut("cycle")' });
        UK.anim(gP("ADBE Vector Group Opacity"), [[D[1], 80], [D[1] + 1.3, 0]], UK.CARD.curves(["out"]), { expr: '(time < ' + UK.round(D[1], 3) + ' || time > ' + UK.round(T.tO, 3) + ') ? 0 : loopOut("cycle")' });
    }
    if (has("underline")) {
        // a fine line under the text (measured from the Text layer), drawn out from its centre / start
        var VU = UK.CARD.grp(K, "Underline", true), left = lay.text.left !== null;
        UK.addPath(VU(), [[0, 0], [1, 0]], null, null, false);
        VU().property(1).property("ADBE Vector Shape").expression = 'var L = thisComp.layer("Text"), r = L.sourceRectAtTime(' + TH + ', false);\n' +
            'var a = fromComp(L.toComp([r.left, r.top + r.height])), b = fromComp(L.toComp([r.left + r.width, r.top + r.height])), g = Math.max(' + UK.round(6 * u, 1) + ', L.text.sourceText.style.fontSize * 0.22);\n' +
            'var w = (b[0] - a[0]) * 0.5, x0 = ' + (left ? 'a[0]' : '(a[0] + b[0]) / 2 - w / 2') + ';\ncreatePath([[x0, a[1] + g], [x0 + w, a[1] + g]], [], [], false);';
        accStroke(VU, Math.max(1.5, UK.round(2 * u, 1)), { cap: 2 });
        UK.addTrim(VU(), "Draw");
        var U0 = T.text[0] + (T.text[1] - T.text[0]) * 0.4, U1 = T.text[1] + 0.15, U3 = T.text[2] + (T.text[3] - T.text[2]) * 0.7;
        if (left) UK.CARD.io(VU().property("Draw").property("ADBE Vector Trim End"), U0, U1, T.text[2], U3, 0, 100, "inout");
        else {
            UK.CARD.io(VU().property("Draw").property("ADBE Vector Trim Start"), U0, U1, T.text[2], U3, 50, 0, "inout");
            UK.CARD.io(VU().property("Draw").property("ADBE Vector Trim End"), U0, U1, T.text[2], U3, 50, 100, "inout");
        }
    }
    // ---- the matte (the card's own path) for the lights and the text
    var Mt = UK.shapeLayer(C, "Card Matte");
    place(Mt);
    var VM = UK.CARD.grp(Mt, "Shape", false);
    UK.addPath(VM(), [[0, 0], [1, 0], [1, 1]], null, null, true);
    VM().property(1).property("ADBE Vector Shape").expression = UK.CARD.PATH;
    UK.addFill(VM(), "#FFFFFF", 100);
    Mt.enabled = false;
    Mt.moveToEnd();
    var clip = function (L) { try { L.setTrackMatte(Mt, TrackMatteType.ALPHA); } catch (e) { } };
    // ---- lights: one layer, one blur, clipped to the card
    // ---- lights: one layer, clipped to the card. Each light is a stack of nested shapes whose opacities
    //      give a soft gaussian falloff (bright centre, nothing at its edge), so no light ends in a hard cut;
    //      one light blur only smooths the steps. They follow the card's box when the text changes.
    var needLights = S.rim || S.aurora || has("center") || has("sweep");
    if (needLights) {
        var LG = UK.shapeLayer(C, "Lights");
        place(LG);
        var blurPx = Math.max(3 * u, Hb * 0.07);
        var FOL = BBH + 'var sx = (B[2] - B[0]) / ' + UK.round(Wb, 2) + ', sy = (B[3] - B[1]) / ' + UK.round(Hb, 2) + ';\n';
        var light = function (name, size, off, hex, op, band) {
            var n = Math.max(8, Math.min(20, Math.ceil(Math.max(band ? size[0] : Math.max(size[0], size[1])) / 2 / blurPx))), A = UK.CARD.rings(n), k;
            UK.CARD.grp(LG, name, false);
            var V = function () { return UK.vecs(UK.root(LG).property(name)); };
            for (k = n; k >= 1; k--) {
                UK.group(V(), "Ring " + k);
                var R = function () { return UK.vecs(V().property("Ring " + k)); };
                if (band) UK.addRect(R(), [UK.round(size[0] * k / n, 2), size[1]], [0, 0]);
                else UK.addEllipse(R(), [UK.round(size[0] * k / n, 2), UK.round(size[1] * k / n, 2)], [0, 0]);
                var f = UK.addFill(R(), hex, UK.round(A[k] * 100, 2));
                if (hex === cols.accent) f.property("ADBE Vector Fill Color").expression = ACC;
            }
            var g = function (m) { return UK.gtr(UK.root(LG).property(name), m); };
            g("ADBE Vector Position").expression = FOL + '[(B[0] + B[2]) / 2 + ' + UK.round(off[0], 1) + ' * sx, (B[1] + B[3]) / 2 + ' + UK.round(off[1], 1) + ' * sy]';
            g("ADBE Vector Scale").expression = FOL + '[value[0] * sx, value[1] * sy]';
            g("ADBE Vector Group Opacity").setValue(op);
            return g;
        };
        if (S.aurora) {
            light("Aurora 1", [Wb * 0.95, Hb * 1.7], [-Wb * 0.28, Hb * 0.3], "#FF6FD8", 75);
            light("Aurora 2", [Wb * 0.85, Hb * 1.6], [Wb * 0.3, -Hb * 0.25], "#38BDF8", 65);
        }
        // a soft light from above: centred on the top edge, it fades out long before the corners
        if (S.rim) light("Top Light", [Wb * 0.72, Math.min(Hb * 0.9, 200 * u)], [0, -Hb / 2], "#FFFFFF", Math.round(S.rim * 0.42));
        if (has("center")) {
            // a warm pool of the accent behind the text: it blooms out of the middle (a little brighter, then
            // settles), breathes slowly while the card holds and sinks back before the card closes
            var ac = UK.rgba(cols.accent), grey = Math.max(ac[0], ac[1], ac[2]) - Math.min(ac[0], ac[1], ac[2]) < 0.15;
            var cOp = ((p.pal === "glass" || p.pal === "ivory") ? 26 : 42) * (grey ? 0.62 : 1), gc = light("Center Light", [Wb * 0.78, Hb * 0.9], [0, 0], cols.accent, 0);
            UK.anim(gc("ADBE Vector Group Opacity"), [[LT.a, 0], [LT.b, cOp * 1.25], [LT.s, cOp], [LT.c, cOp], [LT.e, 0]], UK.CARD.curves(["settle", "inout", "hold", "~settle"]),
                { expr: UK.CARD.breathe(LT, 0.18) });
            UK.anim(gc("ADBE Vector Scale"), [[LT.a, [45, 45]], [LT.s, [100, 100]], [LT.c, [100, 100]], [LT.e, [82, 82]]], UK.CARD.curves(["out", "hold", "~out"]));
            gc("ADBE Vector Scale").expression = FOL + '[value[0] * sx, value[1] * sy]';
        }
        if (has("sweep")) {
            // a soft band of light crossing once (gaussian across its width)
            var sw = Math.max(70 * u, Hb * 0.8), gs = light("Sweep", [sw, Hb * 3], [0, 0], p.pal === "ivory" ? cols.accent : "#FFFFFF", p.pal === "ivory" ? 28 : 42, true);
            gs("ADBE Vector Rotation").setValue(20);
            UK.slider(LG, "Sweep", 0);
            UK.anim(UK.efx(LG, "Sweep").property(1), [[T.sweep[0], 0], [T.sweep[1], 100]], UK.CARD.curves(["inout"]));
            gs("ADBE Vector Position").expression = BBH + 'var p = clamp(effect("Sweep")(1), 0, 100) / 100, b = ' + Math.round(sw * 0.9 + Hb * 0.6) + ';\n[B[0] - b + (B[2] - B[0] + 2 * b) * p, (B[1] + B[3]) / 2]';
        }
        UK.fx(LG, "ADBE Gaussian Blur 2", "Soft");
        UK.efx(LG, "Soft").property("ADBE Gaussian Blur 2-0001").setValue(UK.round(blurPx, 1));
        LG.blendingMode = (p.pal === "ivory") ? BlendingMode.NORMAL : BlendingMode.SCREEN;
        LG.moveBefore(K);   // just above the card
        clip(LG);
    }
    // ---- runner: a light running round the card's edge (its glow is a Glow effect on it)
    if (has("runner")) {
        var RN = UK.shapeLayer(C, "Runner");
        place(RN);
        var VR = UK.CARD.grp(RN, "Shape", false);
        UK.addPath(VR(), [[0, 0], [1, 0], [1, 1]], null, null, true);
        VR().property(1).property("ADBE Vector Shape").expression = UK.CARD.PATH;
        // a comet: a white-hot core over the accent line, both tapering off into a long tail
        UK.addStroke(VR(), "#FFFFFF", Math.max(1, UK.round(1.6 * u, 1)), { cap: 2, opacity: 90 }, "Core");
        accStroke(VR, Math.max(2, UK.round(3.6 * u, 1)), { cap: 2 }).name = "Line";
        UK.UL.taper(VR().property("Core").property("ADBE Vector Stroke Taper"), [75, 6, 0, 40, 30, 0]);
        UK.UL.taper(VR().property("Line").property("ADBE Vector Stroke Taper"), [80, 6, 0, 50, 30, 0]);
        UK.addTrim(VR(), "Run");
        VR().property("Run").property("ADBE Vector Trim End").setValue(22);
        var turns = Math.max(1, Math.round((T.tO - D[0]) / 2.6));
        UK.anim(VR().property("Run").property("ADBE Vector Trim Offset"), [[D[0], 0], [T.tO + dOut * 0.3, 360 * turns]], UK.CARD.curves(["soft"]));
        UK.CARD.io(UK.opac(RN), D[0], D[1], D[2], D[3], 0, 100, "inout");
        // its glow: effects on the runner itself (a tight halo and a wide soft one)
        var RT = { a: D[0], b: (D[0] + D[1]) / 2, s: D[1], c: D[2], e: D[3] };
        UK.CARD.glow(RN, "Glow", ACC, cols.accent, RT, { soft: [4 * u, 9 * u], op: 255 });
        UK.CARD.glow(RN, "Glow Wide", ACC, cols.accent, RT, { soft: [14 * u, 34 * u], op: 235 });
        RN.moveBefore(needLights ? LG : K);   // above the card (and its lights)
    }
    // ---- text on top, clipped to the card
    UK.fx(TL, "ADBE Fill", "Color");
    UK.efx(TL, "Color").property("ADBE Fill-0002").setValue(UK.rgba(cols.text));
    UK.efx(TL, "Color").property("ADBE Fill-0002").expression = UK.CARD.col("Text Color");
    var fsz = UK.textDoc(TL).value.fontSize;
    if (has("shine")) {
        var shineHex = (cols.accent.toUpperCase() === cols.text.toUpperCase()) ? "#FFD98A" : cols.accent;
        var sa = UK.TX.animator(TL, "UK Shine", { fill: shineHex }, { based: 1, shape: 6, start: 0, end: 28 });
        UK.anim(sa.range().property("ADBE Text Percent Offset"), [[T.shine[0], -28], [T.shine[1], 100]], UK.CARD.curves(["inout"]));
    }
    UK.CARD.text(TL, p, T, fsz);
    TL.moveToBeginning();
    if (badgeL) badgeL.moveToBeginning();
    clip(TL);
    N.moveToBeginning();
    // Essential Properties of the precomp layer
    var eg = [[UK.textDoc(TL), "Text"]];
    if (badgeL) eg.push([UK.textDoc(badgeL), "Index"]);
    eg.push([UK.efx(N, "Card Color").property(1), "Card Color"], [UK.efx(N, "Text Color").property(1), "Text Color"], [UK.efx(N, "Accent").property(1), "Accent"]);
    for (i = eg.length - 1; i >= 0; i--) UK.essential(C, eg[i][0], eg[i][1]);
    C.comment = "Ultimate Kit Text Card: the Card layer is AE's 2D Text Box (Shape) - Padding / Roundness / Scale X-Y keyframes in its effect; everything follows the Text.";
    var L = host.layers.add(C);
    L.startTime = t0;
    L.name = UK.uniqueLayerName(host, "Card - " + str.replace(/\r/g, " ").substr(0, 28));
    L.comment = "Ultimate Kit: text and colours in Essential Properties.";
    try { L.collapseTransformation = true; } catch (e) { }
    UK.centerAnchor(L);       // the anchor in the centre of the card
    return L;
};
UK.api.card = function (a) {
    var host = UK.comp(true), p = UK_CAT.find(UK_CAT.cards, a.id);
    var L;
    if (p && p.kind === "slot") L = UK.SLOT.build(host, a, UK.timeCTI(host));
    else if (p && p.kind === "tiles") L = UK.TILES.build(host, a, UK.timeCTI(host));
    else L = UK.CARD.build(host, a, UK.timeCTI(host));
    UK.selectOnly(host, [L]);
    return { name: L.name, comp: L.source.name };
};

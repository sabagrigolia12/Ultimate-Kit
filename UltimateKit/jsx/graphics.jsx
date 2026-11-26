/*  Ultimate Kit - Graphics: builds a template of shared/graphics.js as a precomp the size of the comp it goes in.
    Every move is ordinary keyframes with eases (speed 0, influence = the speed ramp), so the Graph Editor shows it and
    any key can be moved. The only expressions: a counter's text (formats its "Value" slider, which is keyed) and a
    gradient's points (they follow their layer). Layers are named as in the panel; colours are plain values.          */
UK.GFX = {};
UK.GFX._f = {};
UK.GFX.font = function (role) {
    if (UK.GFX._f[role]) return UK.GFX._f[role];
    var F = UK_GFX.FONTS[role] || UK_GFX.FONTS.head, pick = F.ps[F.ps.length - 1], i;
    try { for (i = 0; i < F.ps.length; i++) { var a = app.fonts.getFontsByPostScriptName(F.ps[i]); if (a && a.length) { pick = F.ps[i]; break; } } } catch (e) { }
    UK.GFX._f[role] = pick;
    return pick;
};
/* keys of an anim on a property; map turns a spec value into the property's value */
UK.GFX.keys = function (prop, an, map) {
    var K = an.k, i, idx = [], n = 1;
    for (i = 0; i < K.length; i++) prop.setValueAtTime(K[i][0], map ? map(K[i][1]) : K[i][1]);
    for (i = 0; i < K.length; i++) idx.push(prop.nearestKeyIndex(K[i][0]));
    if (!prop.isSpatial) { var t = prop.propertyValueType; if (t === PropertyValueType.TwoD) n = 2; else if (t === PropertyValueType.ThreeD) n = 3; }
    var seg = function (j) { var e = an.e; if (e === "lin") return "lin"; if (typeof e[0] === "number") return e; return e[Math.min(j, e.length - 1)]; };
    var arr = function (infl) { var a = []; for (var d = 0; d < n; d++) a.push(new KeyframeEase(0, UK.clamp(infl, 0.1, 100))); return a; };
    var B = KeyframeInterpolationType.BEZIER, LIN = KeyframeInterpolationType.LINEAR;
    for (i = 0; i < K.length; i++) {
        var ein = i > 0 ? seg(i - 1) : null, eout = i < K.length - 1 ? seg(i) : null;
        try { prop.setInterpolationTypeAtKey(idx[i], ein === "lin" ? LIN : B, eout === "lin" ? LIN : B); } catch (e1) { }
        var inI = (ein && ein !== "lin") ? ein[1] : 33.33, outI = (eout && eout !== "lin") ? eout[0] : 33.33;
        if (ein !== "lin" || eout !== "lin") { try { prop.setTemporalEaseAtKey(idx[i], arr(inI), arr(outI)); } catch (e2) { } }
        if (prop.isSpatial) {
            try { var z = (K[i][1].length === 3) ? [0, 0, 0] : [0, 0]; prop.setSpatialAutoBezierAtKey(idx[i], false); prop.setSpatialContinuousAtKey(idx[i], false); prop.setSpatialTangentsAtKey(idx[i], z, z); } catch (e3) { }
        }
    }
};
UK.GFX.ellipseShape = function (cx, cy, rx, ry) {
    var k = 0.5523;
    return UK.makeShape([[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]],
        [[-rx * k, 0], [0, -ry * k], [rx * k, 0], [0, ry * k]], [[rx * k, 0], [0, ry * k], [-rx * k, 0], [0, -ry * k]], true);
};
UK.GFX.fade = function (L, f) {          // an elliptical mask with a soft edge (content coordinates = comp here)
    if (!f) return;
    var M = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    M.name = "Fade";
    L.property("ADBE Mask Parade").property("Fade").property("ADBE Mask Shape").setValue(UK.GFX.ellipseShape(f.x, f.y, f.rx, f.ry));
    var fe = 0.7 * Math.min(f.rx, f.ry);
    L.property("ADBE Mask Parade").property("Fade").property("ADBE Mask Feather").setValue([fe, fe]);
};
UK.GFX.blur = function (L, px, room) {
    var e = UK.fx(L, "ADBE Gaussian Blur 2", "Soft");
    UK.safeSet(e.property("ADBE Gaussian Blur 2-0001"), UK.round(px * 1.4, 1));      // (= the preview's sigma 0.55 x px)
    try { e.property("ADBE Gaussian Blur 2-0003").setValue(0); } catch (e1) { }
    if (room) {                                     // a shape layer's blur is cut at its content: an invisible bigger rect
        var g = UK.group(UK.root(L), "Glow Room");
        UK.addRect(UK.vecs(g), room, null, 0, "Room");
        UK.addFill(UK.vecs(g), "#000000", 0, "Room Fill");
    }
};
UK.GFX.ramp = function (L, c1, c2, kind, p1, p2) {   // p1 / p2 in the layer's own space; they follow the layer
    var e = UK.fx(L, "ADBE Ramp", "Gradient");
    e.property("ADBE Ramp-0002").setValue(UK.rgba(c1));
    e.property("ADBE Ramp-0004").setValue(UK.rgba(c2));
    e.property("ADBE Ramp-0005").setValue(kind === "rad" ? 2 : 1);
    e.property("ADBE Ramp-0001").expression = "toComp([" + UK.round(p1[0], 2) + ", " + UK.round(p1[1], 2) + "]);";
    e.property("ADBE Ramp-0003").expression = "toComp([" + UK.round(p2[0], 2) + ", " + UK.round(p2[1], 2) + "]);";
    return e;
};
UK.GFX.blend = function (L, b) {
    try { if (b === "add") L.blendingMode = BlendingMode.ADD; else if (b === "screen") L.blendingMode = BlendingMode.SCREEN; } catch (e) { }
};

/* one spec layer -> one After Effects layer */
UK.GFX.layer = function (C, l, S, boxes) {
    var W = S.W, H = S.H, L = null, V = null, trimP = null, i;
    var shape = function () { var x = C.layers.addShape(); x.name = l.name || l.t; return x; };
    var org = function () { var w = l.w || 0, h = l.h || 0; if (l.org === "b") return [0, -h / 2]; if (l.org === "t") return [0, h / 2]; if (l.org === "l") return [w / 2, 0]; if (l.org === "r") return [-w / 2, 0]; return [0, 0]; };
    if (l.t === "bg") {
        L = C.layers.addSolid(UK.rgb(l.c2), l.name || "Background", W, H, 1);
        var e = UK.fx(L, "ADBE Ramp", "Gradient");
        e.property("ADBE Ramp-0001").setValue(l.p1); e.property("ADBE Ramp-0003").setValue(l.p2);
        e.property("ADBE Ramp-0002").setValue(UK.rgba(l.c1)); e.property("ADBE Ramp-0004").setValue(UK.rgba(l.c2));
        e.property("ADBE Ramp-0005").setValue(l.kind === "lin" ? 1 : 2);
    } else if (l.t === "dots") {
        L = shape(); UK.pos(L).setValue([0, 0]); UK.anchor(L).setValue([0, 0]);
        var gd = UK.group(UK.root(L), "Dots");
        UK.addEllipse(UK.vecs(gd), [l.r * 2, l.r * 2], [l.gap / 2, l.gap / 2], "Dot");
        UK.addFill(UK.vecs(gd), l.c, 100, "Dot Fill");
        UK.addRepeater(UK.vecs(gd), Math.ceil(W / l.gap) + 1, [l.gap, 0], "Across");
        UK.addRepeater(UK.vecs(gd), Math.ceil(H / l.gap) + 1, [0, l.gap], "Down");
        UK.GFX.fade(L, l.fade);
    } else if (l.t === "grid") {
        L = shape(); UK.pos(L).setValue([0, 0]); UK.anchor(L).setValue([0, 0]);
        var y0 = (H / 2) % l.gap, x0 = (W / 2) % l.gap;
        var gr = UK.group(UK.root(L), "Rows");
        UK.addRect(UK.vecs(gr), [W, l.w], [W / 2, y0], 0, "Row");
        UK.addFill(UK.vecs(gr), l.c, 100, "Row Fill");
        UK.addRepeater(UK.vecs(gr), Math.ceil(H / l.gap) + 1, [0, l.gap], "Down");
        if (!l.rows) {
            var gc = UK.group(UK.root(L), "Columns");
            UK.addRect(UK.vecs(gc), [l.w, H], [x0, H / 2], 0, "Column");
            UK.addFill(UK.vecs(gc), l.c, 100, "Column Fill");
            UK.addRepeater(UK.vecs(gc), Math.ceil(W / l.gap) + 1, [l.gap, 0], "Across");
        }
        UK.GFX.fade(L, l.fade);
    } else if (l.t === "edge") {
        L = shape(); UK.pos(L).setValue([W / 2, H / 2]); UK.anchor(L).setValue([0, 0]);
        var ge = UK.group(UK.root(L), "Frame");
        UK.addRect(UK.vecs(ge), [W, H], [0, 0], 0, "Frame Rect");
        UK.addStroke(UK.vecs(ge), l.c, l.w * 1.4, {}, "Frame Stroke");
        UK.GFX.blur(L, l.blur, null);
    } else if (l.t === "orbit") {
        L = shape(); UK.pos(L).setValue([l.x, l.y]); UK.anchor(L).setValue([0, 0]);
        var gl = UK.group(UK.root(L), "Light");
        UK.addEllipse(UK.vecs(gl), [l.size * 2.6, l.size * 0.5], [0, -l.R], "Light Shape");
        UK.addFill(UK.vecs(gl), l.c2, 85, "Light Fill");
        var gk = UK.group(UK.root(L), "Core");
        UK.addEllipse(UK.vecs(gk), [l.size * 1.0, l.size * 0.12], [0, -l.R], "Core Shape");
        UK.addFill(UK.vecs(gk), l.c, 100, "Core Fill");
        UK.GFX.blur(L, l.size * 0.14, [l.size * 8, l.size * 4]);
        UK.gtr(UK.root(L).property("Glow Room"), "ADBE Vector Position").setValue([0, -l.R]);
    } else if (l.t === "text") {
        L = C.layers.addText(l.s || " ");
        var td = UK.textDoc(L), d = td.value;
        try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e0) { }
        d.font = UK.GFX.font(l.role); d.fontSize = l.size; d.applyFill = true; d.fillColor = UK.rgb(l.c); d.applyStroke = false;
        d.tracking = l.track || 0;
        try { d.justification = l.just === "left" ? ParagraphJustification.LEFT_JUSTIFY : (l.just === "right" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY); } catch (e1) { }
        try { if (l.caps) d.fontCapsOption = FontCapsOption.FONT_ALL_CAPS; } catch (e2) { }
        if (l.lead) { try { d.autoLeading = false; d.leading = l.lead; } catch (e3) { } }
        td.setValue(d);
        L.name = l.name || "Text";
        if (l.count) {
            var sl = UK.slider(L, "Value", l.a.length ? 0 : 0);
            td.expression = UK_GFX.FMT_SRC + "\nfmt(effect(\"Value\")(1), " + UK.json(l.count.f || "int") + ", " + UK.json(l.count.pre || "") + ", " + UK.json(l.count.suf || "") + ");";
        }
        /* fit the width, then put the anchor where the spec means it (middle of the line, left / centre / right) */
        var endT = Math.max(0, S.dur - 0.01), r = L.sourceRectAtTime(endT, false);
        if (l.maxW && r.width > l.maxW && !l.count) { d = td.value; d.fontSize = l.size * l.maxW / r.width; td.setValue(d); r = L.sourceRectAtTime(endT, false); }
        var ax = l.just === "left" ? r.left : (l.just === "right" ? r.left + r.width : r.left + r.width / 2);
        UK.anchor(L).setValue([ax, r.top + r.height / 2]);
        boxes[l.name] = { w: r.width, h: r.height };
        if (l.grad) UK.GFX.ramp(L, l.grad[0], l.grad[1], "lin", [ax, r.top], [ax, r.top + r.height]);
        if (l.glow) {
            var sh = UK.fx(L, "ADBE Drop Shadow", "Glow");
            sh.property("ADBE Drop Shadow-0001").setValue(UK.rgba(l.glow.c));
            UK.CAP.pct(sh.property("ADBE Drop Shadow-0002"), l.glow.op || 70);
            UK.safeSet(sh.property("ADBE Drop Shadow-0004"), 0);
            UK.safeSet(sh.property("ADBE Drop Shadow-0005"), UK.round(l.glow.r || l.size * 0.4, 1));
        }
        UK.pos(L).setValue([l.x, l.y]);
    } else {
        L = shape(); UK.pos(L).setValue([l.x || 0, l.y || 0]); UK.anchor(L).setValue([0, 0]);
        var o = org(), g = UK.group(UK.root(L), l.name || l.t);
        if (l.t === "ring" && l.track) {
            var gt = UK.group(UK.root(L), "Track");
            UK.addEllipse(UK.vecs(gt), [l.R * 2, l.R * 2], [0, 0], "Track Ellipse");
            UK.addStroke(UK.vecs(gt), l.track, l.sw, { cap: 2 }, "Track Stroke");
            UK.root(L).property("Track").moveTo(2);                      // under the ring
        }
        if (l.t === "rect") UK.addRect(UK.vecs(g), [l.w, l.h], o, l.r || 0, "Rect");
        else if (l.t === "ell") UK.addEllipse(UK.vecs(g), [l.w, l.h], o, "Ellipse");
        else if (l.t === "ring") UK.addEllipse(UK.vecs(g), [l.R * 2, l.R * 2], [0, 0], "Ring");
        else if (l.t === "star") UK.addStar(UK.vecs(g), { points: l.n, outer: l.R, inner: l.r, polygon: !!l.poly }, "Star");
        else if (l.t === "path") {
            var vv = [], ii = [], oo = [];
            for (i = 0; i < l.v.length; i++) { vv.push([l.v[i][0] - l.x, l.v[i][1] - l.y]); ii.push(l.i ? l.i[i] : [0, 0]); oo.push(l.o ? l.o[i] : [0, 0]); }
            UK.addPath(UK.vecs(g), vv, ii, oo, !!l.closed, "Path");
        }
        var needTrim = l.t === "ring" || l.te !== undefined;
        for (i = 0; i < l.a.length; i++) if (l.a[i].p === "trim" || l.a[i].p === "trimS") needTrim = true;
        if (needTrim) {
            trimP = UK.addTrim(UK.vecs(g), "Trim Paths");
            if (l.t === "ring") trimP.property("ADBE Vector Trim Offset").setValue(l.from || 0);
        }
        if ((l.fill || l.grad) && l.t !== "ring") UK.addFill(UK.vecs(g), l.fill || "#FFFFFF", l.fillOp === undefined ? 100 : l.fillOp, "Fill");
        if (l.stroke || l.t === "ring") {
            var so = { cap: l.cap === "butt" ? 1 : 2, join: 2 };
            UK.addStroke(UK.vecs(g), l.stroke || l.c, l.sw || 2, so, "Stroke");
            if (l.dash) {
                try {
                    var D = UK.vecs(g).property("Stroke").property("ADBE Vector Stroke Dashes");
                    D.addProperty("ADBE Vector Stroke Dash 1").setValue(l.dash[0]);
                    D.addProperty("ADBE Vector Stroke Gap 1").setValue(l.dash[1]);
                } catch (eD) { }
            }
        }
        if (l.grad) {
            var q = l.grad, p1 = q.p1, p2 = q.p2;
            if (!p1) { p1 = q.dir === "h" ? [o[0] - l.w / 2, o[1]] : [o[0], o[1] - l.h / 2]; p2 = q.dir === "h" ? [o[0] + l.w / 2, o[1]] : [o[0], o[1] + l.h / 2]; }
            UK.GFX.ramp(L, q.c1, q.c2, q.kind === "rad" ? "rad" : "lin", p1, p2);
        }
        if (l.blur) { var big = Math.max(l.w || 0, l.h || 0, (l.R || 0) * 2) + l.blur * 6; UK.GFX.blur(L, l.blur, [big, big]); }
        if (trimP) trimP = UK.vecs(UK.root(L).property(l.name || l.t)).property("Trim Paths");
    }
    UK.GFX.blend(L, l.blend);
    if (l.op !== undefined && l.t !== "bg") UK.opac(L).setValue(l.op);
    if (l.sc !== undefined && l.t !== "text") { var s0 = l.sc instanceof Array ? l.sc : [l.sc, l.sc]; UK.scale(L).setValue(s0); }
    if (l.rot) UK.rot(L).setValue(l.rot);
    /* the keys */
    for (i = 0; i < l.a.length; i++) {
        var an = l.a[i];
        if (an.p === "pos") UK.GFX.keys(UK.pos(L), an);
        else if (an.p === "op") UK.GFX.keys(UK.opac(L), an);
        else if (an.p === "rot") UK.GFX.keys(UK.rot(L), an);
        else if (an.p === "sc") UK.GFX.keys(UK.scale(L), an, function (v) { return v instanceof Array ? v : [v, v]; });
        else if (an.p === "val") UK.GFX.keys(UK.efx(L, "Value").property(1), an);
        else if (an.p === "chars") {                                     // typing: one Source Text key per letter (hold keys)
            var TP = UK.textDoc(L), full = String(TP.value.text), n0 = an.k[0][1], n1 = an.k[an.k.length - 1][1], ta = an.k[0][0], tb = an.k[an.k.length - 1][0], ch;
            for (ch = n0; ch <= n1; ch++) { var dd = TP.value; dd.text = ch > 0 ? full.substr(0, ch) : " "; TP.setValueAtTime(ta + (tb - ta) * (ch - n0) / Math.max(1, n1 - n0), dd); }
        }
        else if ((an.p === "trim" || an.p === "trimS") && trimP) UK.GFX.keys(trimP.property(an.p === "trim" ? "ADBE Vector Trim End" : "ADBE Vector Trim Start"), an);
    }
    if (l.t === "ring" && trimP) {
        var has = false; for (i = 0; i < l.a.length; i++) if (l.a[i].p === "trim") has = true;
        if (!has) trimP.property("ADBE Vector Trim End").setValue(l.te === undefined ? 100 : l.te);
    }
    return L;
};

/* a: { id, pal (palette object), texts, overlay, edge, speed, light, dur, name } -> a precomp in the active comp */
UK.api.graphic = function (a) {
    var host = a._comp || UK.comp(true), W = host.width, H = host.height;
    var S = UK_GFX.timed(UK_GFX.spec(a.id, W, H, a.pal || UK_GFX.PALETTES[0], a.texts || {}, { overlay: a.overlay, edge: a.edge, dur: a.dur }), a.speed || 1, a.light || 1);
    var t0 = UK.timeCTI(host);
    return UK.atomic(host, function () {
        var C = app.project.items.addComp(UK.uniqueName(S.name), W, H, host.pixelAspect, Math.max(0.5, S.dur), host.frameRate);
        try { C.parentFolder = UK.folder("Graphics"); } catch (e0) { }
        C.comment = "Ultimate Kit Graphic: " + S.id;
        var boxes = {}, made = [], i;
        for (i = 0; i < S.layers.length; i++) {
            var l = S.layers[i];
            if (l.after && boxes[l.after.name]) {                 // placed right after another text (e.g. .69 after the timer)
                var ref = null; for (var j = 0; j < made.length; j++) if (made[j].name === l.after.name) ref = made[j];
                if (ref) { var rr = ref.sourceRectAtTime(Math.max(0, S.dur - 0.01), false), rp = UK.pos(ref).valueAtTime(S.dur, false), ra = UK.anchor(ref).value; l.x = rp[0] - ra[0] + rr.left + rr.width + l.after.gap; for (var k = 0; k < l.a.length; k++) if (l.a[k].p === "pos") for (var m = 0; m < l.a[k].k.length; m++) l.a[k].k[m][1] = [l.x, l.a[k].k[m][1][1]]; }
            }
            made.push(UK.GFX.layer(C, l, S, boxes));
        }
        var PL = host.layers.add(C);
        PL.startTime = t0;
        UK.selectOnly(host, [PL]);
        return { layers: [PL.name], comp: C.name };
    });
};
/* the active comp's size for the panel's preview */
UK.api.gfxComp = function () { var c = app.project.activeItem; return (c && c instanceof CompItem) ? { w: c.width, h: c.height, name: c.name } : { w: 0, h: 0 }; };

/*  Ultimate Kit - SaaS backgrounds (copies of the SaaS packs' preview backgrounds)
    Precomp "BG SaaS - Name", top -> bottom:
      Controls        Speed, Intro, Color 1..n (all in Essential Properties of the precomp layer)
      element layers  meshes, glows, grids... every move is a few keyframes: an optional intro (T0 s)
                      and ONE float cycle (P s); a loop expression (same as loopOut("cycle"), or
                      "offset" for steady pans / spins) repeats it for as long as the comp runs
      Background      full-frame colour (Color 1)
    Speed: move the keyframes closer / further apart, or raise / lower Speed (100 = as built,
    200 = twice as fast, 0 = still). The precomp is as long as the layer you asked for.          */

UK.SB = {};
UK.SB.CTL = "Controls";
UK.SB.col = function (i) { return 'thisComp.layer("' + UK.SB.CTL + '").effect("Color ' + (i + 1) + '")(1)'; };
UK.SB.MODES = { add: BlendingMode.ADD, screen: BlendingMode.SCREEN, normal: BlendingMode.NORMAL, multiply: BlendingMode.MULTIPLY, overlay: BlendingMode.OVERLAY, soft: BlendingMode.SOFT_LIGHT };

UK.SB.smooth = function (prop) {
    for (var i = 1; i <= prop.numKeys; i++) {
        try {
            prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            prop.setTemporalContinuousAtKey(i, true);
            prop.setTemporalAutoBezierAtKey(i, true);
            if (prop.isSpatial) { prop.setSpatialContinuousAtKey(i, true); prop.setSpatialAutoBezierAtKey(i, true); }
        } catch (e) { }
    }
};
/* the comp's own clock: Speed (%) and Intro (off = start at the loop) from the Controls layer */
UK.SB.clock = function (T0) {
    return 'var ctl = thisComp.layer("' + UK.SB.CTL + '"), t = time * ctl.effect("Speed")(1) / 100 + (ctl.effect("Intro")(1) == 1 ? 0 : ' + T0 + ');\n';
};
/* loop expression on a keyframed property: the keys from key(k0) to the last one repeat forever
   ("cycle" = loopOut("cycle"); "offset" = loopOut("offset"), keeps moving on). Works with any
   number of keys, so keyframes can be moved, added or removed.                                    */
UK.SB.loop = function (prop, k0, T0, offset) {
    prop.expression = [
        '// Ultimate Kit: loopOut("' + (offset ? 'offset' : 'cycle') + '") from key ' + k0 + ' + Speed / Intro (Essential Properties)',
        UK.SB.clock(T0) + 'var a = key(Math.min(' + k0 + ', numKeys)).time, b = key(numKeys).time;',
        'if (t <= b || b <= a) { valueAtTime(t); }',
        offset ? 'else { var c = Math.floor((t - a) / (b - a)); add(valueAtTime(t - c * (b - a)), mul(sub(key(numKeys).value, key(' + k0 + ').value), c)); }'
               : 'else { valueAtTime(a + (t - a) % (b - a)); }'
    ].join("\n");
};
/* seamless loop: the last key and the first loop key get the same tangent (Catmull-Rom across the seam) */
UK.SB.seam = function (prop, i0, i1) {
    if (i1 - i0 < 2) return;
    var vt = prop.propertyValueType;
    if (vt === PropertyValueType.SHAPE || vt === PropertyValueType.COLOR || vt === PropertyValueType.CUSTOM_VALUE || vt === PropertyValueType.NO_VALUE) return;
    try {
        var dt = prop.keyTime(i0 + 1) - prop.keyTime(i0), nx = prop.keyValue(i0 + 1), pv = prop.keyValue(i1 - 1), k, e;
        if (!(nx instanceof Array)) { nx = [nx]; pv = [pv]; }
        if (prop.isSpatial) {
            var h = [], m = 0;
            for (k = 0; k < nx.length; k++) { h.push((nx[k] - pv[k]) / 6); m += (nx[k] - pv[k]) * (nx[k] - pv[k]); }
            var nh = []; for (k = 0; k < h.length; k++) nh.push(-h[k]);
            prop.setSpatialTangentsAtKey(i0, nh, h); prop.setSpatialTangentsAtKey(i1, nh, h);
            e = [new KeyframeEase(Math.sqrt(m) / (2 * dt), 33.33)];
        } else {
            e = [];
            for (k = 0; k < UK.dims(prop); k++) e.push(new KeyframeEase((nx[k] - pv[k]) / (2 * dt), 33.33));
        }
        prop.setTemporalEaseAtKey(i0, e, e); prop.setTemporalEaseAtKey(i1, e, e);
    } catch (err) { }
};
/* keyframes: optional intro value at 0, then ONE float cycle: vals spread over P starting at T0 and
   back to the first value (shift = phase in keys); the loop expression repeats it.
   A single value with an intro gives 2 keys (intro -> value).                                     */
UK.SB.cyc = function (prop, vals, X, shift, map, iv) {
    var P = X.P, T0 = X.T0, list = (vals instanceof Array) ? vals : [vals];
    var hasIntro = (iv !== undefined && iv !== null && T0 > 0);
    if (list.length === 1 && !hasIntro) { prop.setValue(map(list[0])); return; }
    if (hasIntro) prop.setValueAtTime(0, map(iv));
    if (list.length === 1) { prop.setValueAtTime(T0, map(list[0])); }
    else { var n = list.length; for (var k = 0; k <= n; k++) prop.setValueAtTime(T0 + k * P / n, map(list[(k + (shift || 0)) % n])); }
    UK.SB.smooth(prop);
    var k0 = hasIntro ? 2 : 1;
    if (list.length > 1) UK.SB.seam(prop, k0, prop.numKeys);
    UK.SB.loop(prop, k0, T0, false);
    if (hasIntro) {
        /* the intro leaves its start at rest and lands softly (zero-speed ease, long influence) */
        try {
            var dims = prop.isSpatial ? 1 : UK.dims(prop);
            prop.setTemporalEaseAtKey(1, UK.easeArr(dims, 33.3, 0), UK.easeArr(dims, 70, 0));
            if (list.length === 1) prop.setTemporalEaseAtKey(2, UK.easeArr(dims, 75, 0), UK.easeArr(dims, 33.3, 0));
        } catch (e) { }
    }
};
/* steady motion (pans, spins, evolution): v0 -> v1 is the move over 3 loops; one loop is keyed
   (T0 -> T0 + P, linear) and loopOut("offset") keeps it going at the same rate                     */
UK.SB.linear = function (prop, v0, v1, X) {
    var v = (v0 instanceof Array) ? [] : v0 + (v1 - v0) / 3, i;
    if (v0 instanceof Array) for (i = 0; i < v0.length; i++) v.push(v0[i] + (v1[i] - v0[i]) / 3);
    prop.setValueAtTime(X.T0, v0);
    prop.setValueAtTime(X.T0 + X.P, v);
    for (i = 1; i <= prop.numKeys; i++) prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    UK.SB.loop(prop, 1, X.T0, true);
};
/* smooth closed / open bezier through points (Catmull-Rom tangents) */
UK.SB.shape = function (pts, closed, U) {
    var n = pts.length, v = [], it = [], ot = [], i;
    for (i = 0; i < n; i++) v.push([pts[i][0] * U, pts[i][1] * U]);
    for (i = 0; i < n; i++) {
        var a = v[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = v[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
        var tx = (b[0] - a[0]) / 6, ty = (b[1] - a[1]) / 6;
        if (!closed && (i === 0 || i === n - 1)) { tx *= 2; ty *= 2; }
        it.push([-tx, -ty]); ot.push([tx, ty]);
    }
    return UK.makeShape(v, it, ot, closed);
};
UK.SB.blur = function (L, b, U, edge) {
    if (!b) return;
    UK.fx(L, "ADBE Gaussian Blur 2", "Soft");
    UK.efx(L, "Soft").property("ADBE Gaussian Blur 2-0001").setValue(Math.max(0.5, Math.round(b * U * 10) / 10));
    if (edge) UK.efx(L, "Soft").property("ADBE Gaussian Blur 2-0003").setValue(1);   // full-frame solids: no dark border
};
UK.SB.fill = function (vecs, ci, cols, op) {
    var f = UK.addFill(vecs, cols[ci], op === undefined ? 100 : op);
    f.property("ADBE Vector Fill Color").expression = UK.SB.col(ci);
    return f;
};
UK.SB.stroke = function (vecs, ci, cols, w, op) {
    var s = UK.addStroke(vecs, cols[ci], w, { cap: 2, join: 2, opacity: op === undefined ? 100 : op });
    s.property("ADBE Vector Stroke Color").expression = UK.SB.col(ci);
    return s;
};
UK.SB.colorProp = function (prop, ci, cols) { prop.setValue(UK.rgba(cols[ci])); prop.expression = UK.SB.col(ci); };
/* transform / opacity / blur / blend shared by every element layer (d.i = intro start values) */
UK.SB.common = function (L, d, X) {
    var W = X.W, H = X.H, ph = d.ph || 0, iv = d.i || {};
    var P2 = function (p) { return [p[0] * W, p[1] * H]; };
    if (d.at) UK.SB.cyc(UK.pos(L), d.at, X, ph, P2, iv.at);
    if (d.sc || iv.sc !== undefined) UK.SB.cyc(UK.scale(L), d.sc || 100, X, ph, function (v) { return [v, v]; }, iv.sc);
    var r0 = d.r0 || 0;
    if (typeof d.rot === "number") UK.SB.linear(UK.rot(L), r0, r0 + 360 * d.rot * 3, X);
    else if (d.rot || iv.rot !== undefined) UK.SB.cyc(UK.rot(L), d.rot || 0, X, ph, function (v) { return r0 + v; }, iv.rot);
    else if (r0) UK.rot(L).setValue(r0);
    if (d.op instanceof Array || iv.op !== undefined) UK.SB.cyc(UK.opac(L), d.op === undefined ? 100 : d.op, X, ph, function (v) { return v; }, iv.op);
    else if (d.op !== undefined) UK.opac(L).setValue(d.op);
    UK.SB.blur(L, d.blur, X.U, d.edge);
    L.blendingMode = UK.SB.MODES[d.m || "normal"] || BlendingMode.NORMAL;
};
UK.SB.evolve = function (eff, evoIdx, cycIdx, revIdx, revs, X) {
    UK.SB.linear(eff.property(evoIdx), 0, 360 * revs * 3, X);
    eff.property(cycIdx).setValue(1);
    eff.property(revIdx).setValue(revs);
};
/* AE crops a shape layer's blur to the content box: an invisible frame (fill opacity 0) around the
   content, larger by the blur spread, keeps every glow soft to its very edge                    */
UK.SB.room = function (L, cx, cy, w, h, blur, U) {
    if (!blur) return;
    var m = blur * U * 2.5;
    var g = UK.group(UK.root(L), "Glow Room");
    UK.addRect(UK.vecs(g), [w + 2 * m, h + 2 * m], [cx, cy]);
    UK.addFill(UK.vecs(UK.root(L).property("Glow Room")), "#000000", 0);
};
UK.SB.bbox = function (pk, pad) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, i, j;
    for (i = 0; i < pk.length; i++) for (j = 0; j < pk[i].length; j++) {
        x0 = Math.min(x0, pk[i][j][0]); x1 = Math.max(x1, pk[i][j][0]);
        y0 = Math.min(y0, pk[i][j][1]); y1 = Math.max(y1, pk[i][j][1]);
    }
    return [(x0 + x1) / 2, (y0 + y1) / 2, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad];
};
UK.SB.mask = function (L, mk, X) {
    var W = X.W, H = X.H, U = X.U, cx = mk.at[0] * W, cy = mk.at[1] * H, hw = mk.sz[0] * U / 2, hh = mk.sz[1] * U / 2, K = 0.5523;
    var M = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    M.name = "Area";
    var ms;
    if (mk.ell) ms = UK.makeShape([[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]],
        [[-hw * K, 0], [0, -hh * K], [hw * K, 0], [0, hh * K]], [[hw * K, 0], [0, hh * K], [-hw * K, 0], [0, -hh * K]], true);
    else ms = UK.makeShape([[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh]], null, null, true);
    M.property("ADBE Mask Shape").setValue(ms);
    M.property("ADBE Mask Feather").setValue([mk.f * U, mk.f * U]);
};

/* ---- high-res meshes as weight maps: for every palette colour k a tiny grey image (one pixel per cell,
   plus a clamped ring) holds how much of colour k each cell has. Each map is tinted black -> Color k
   (expression to Controls) and the maps are added together, so the colours stay editable while a
   32 x 18 or 64 x 36 mesh builds in a second. Maps are written once to Documents/Ultimate Kit.   */
UK.SB.hash = function (s) { var h = 5381, i; for (i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(16); };
UK.SB.bmp = function (f, w, h, grey) {
    var row = Math.ceil(w * 3 / 4) * 4, size = 54 + row * h, s = [], x, y;
    function le(v, n) { var o = ""; for (var k = 0; k < n; k++) { o += String.fromCharCode(v & 255); v = v >>> 8; } return o; }
    s.push("BM" + le(size, 4) + le(0, 4) + le(54, 4) + le(40, 4) + le(w, 4) + le(h, 4) + le(1, 2) + le(24, 2) + le(0, 4) + le(row * h, 4) + le(2835, 4) + le(2835, 4) + le(0, 4) + le(0, 4));
    for (y = h - 1; y >= 0; y--) {
        var r = "";
        for (x = 0; x < w; x++) { var g = String.fromCharCode(grey(x, y)); r += g + g + g; }
        for (x = w * 3; x < row; x++) r += String.fromCharCode(0);
        s.push(r);
    }
    f.encoding = "BINARY";
    if (!f.open("w")) throw new Error("Cannot write " + f.fsName);
    f.write(s.join("")); f.close();
};
UK.SB.mapItem = function (key, k, MD) {
    var dir = new Folder(Folder.myDocuments.fsName + "/Ultimate Kit/SaaS BG Maps");
    if (!dir.exists) dir.create();
    var MC = MD.c, MR = MD.r, f = new File(dir.fsName + "/" + key + "_" + (k + 1) + "_" + UK.SB.hash(MD.cells + MD.pal.length) + ".bmp"), i;
    if (!f.exists) UK.SB.bmp(f, MC + 2, MR + 2, function (x, y) {
        var cx = Math.max(0, Math.min(MC - 1, x - 1)), cy = Math.max(0, Math.min(MR - 1, y - 1)), c = MD.cells.substr((cy * MC + cx) * 4, 4);
        var a = Number(c.charAt(0)), b = Number(c.charAt(1)), t = Number(c.substr(2)) / 99, w = 0;
        if (a === k) w += a === b ? 1 : 1 - t;
        if (b === k && a !== b) w += t;
        return Math.max(0, Math.min(255, Math.round(w * 255)));
    });
    for (i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof FootageItem && it.file && it.file.fsName === f.fsName) return it;
    }
    var item = app.project.importFile(new ImportOptions(f));
    item.parentFolder = UK.folder("SaaS BG Maps");
    return item;
};
UK.SB.meshMaps = function (C, d, X) {
    var MD = UK_CAT.saasMesh[d.key], W = X.W, H = X.H, U = X.U, K = MD.pal.length, out = [], k, iv = d.i || {};
    var Mv = C.layers.addNull();
    Mv.name = "Mesh Move";
    UK.pos(Mv).setValue([W / 2, H / 2]);
    var first = true;
    for (k = 0; k < K; k++) {
        if (MD.cells.indexOf(String(k)) < 0) continue;   // colour not used by any cell
        var L = C.layers.add(UK.SB.mapItem(d.key, k, MD));
        L.name = "Mesh Color " + (k + 1);
        L.outPoint = C.duration;
        UK.pos(L).setValue([W / 2, H / 2]);
        UK.scale(L).setValue([W / MD.c * 100, H / MD.r * 100]);
        try { L.samplingQuality = LayerSamplingQuality.BICUBIC; } catch (e0) { }
        L.quality = LayerQuality.BEST;
        UK.fx(L, "ADBE Tint", "Color");
        UK.efx(L, "Color").property("ADBE Tint-0001").setValue([0, 0, 0, 1]);
        UK.SB.colorProp(UK.efx(L, "Color").property("ADBE Tint-0002"), k, X.cols);
        L.blendingMode = first ? BlendingMode.NORMAL : BlendingMode.ADD;
        first = false;
        L.parent = Mv;
        if (d.flow) {
            /* every colour drifts on its own small loop (own phase): the colours flow, the picture holds */
            var fa = d.flow * U, fp = k * 1.7, fl = [], fs = [], q;
            for (q = 0; q < 4; q++) fl.push([fa * Math.cos(fp + q * Math.PI / 2), fa * 0.8 * Math.sin(fp + q * Math.PI / 2)]);
            for (q = 0; q < 4; q++) fs.push(100 + 1.5 * Math.sin(fp + q * Math.PI / 2));
            var b0 = UK.pos(L).value;   // centre in the parent's space
            UK.SB.cyc(UK.pos(L), fl, X, 0, function (p) { return [b0[0] + p[0], b0[1] + p[1]]; });
            UK.SB.cyc(UK.scale(L), fs, X, 0, function (v) { return [W / MD.c * v, H / MD.r * v]; });
        }
        if (d.op instanceof Array || iv.op !== undefined) UK.SB.cyc(UK.opac(L), d.op === undefined ? 100 : d.op, X, 0, function (v) { return v; }, iv.op);
        L.locked = false;
        out.push(L);
    }
    var at = d.at || [[0.5, 0.5]], sc = d.sc || [103, 105, 103.5, 105.5];
    UK.SB.cyc(UK.pos(Mv), at, X, 0, function (p) { return [p[0] * W, p[1] * H]; }, iv.at);
    UK.SB.cyc(UK.scale(Mv), sc, X, 0, function (v) { return [v, v]; }, iv.sc);
    if (d.rot) UK.SB.cyc(UK.rot(Mv), d.rot, X, 0, function (v) { return v; });
    /* blur (and liquid flow) for the maps only: an adjustment layer right above them */
    var A = C.layers.addSolid([1, 1, 1], "Mesh Soften", W, H, X.pa, C.duration);
    A.adjustmentLayer = true;
    if (d.turb) {
        /* flow first, then the blur smooths the displaced edges */
        UK.fx(A, "ADBE Turbulent Displace", "Liquid");
        var lq = UK.efx(A, "Liquid");
        lq.property("ADBE Turbulent Displace-0002").setValue(d.turb.amt || 50);
        lq.property("ADBE Turbulent Displace-0003").setValue(Math.round((d.turb.size || 0.1) * U));
        try { lq.property("ADBE Turbulent Displace-0005").setValue(1); } catch (e5) { }   // complexity 1: broad, smooth waves
        UK.SB.evolve(lq, "ADBE Turbulent Displace-0006", "ADBE Turbulent Displace-0008", "ADBE Turbulent Displace-0009", 1, X);
    }
    UK.SB.blur(A, d.blur || 0.035, U, true);
    if (d.slices) {
        /* horizontal scan slices sliding sideways (square Wave Warp), after the blur so they stay crisp */
        UK.fx(A, "ADBE Wave Warp", "Slices");
        var sl = UK.efx(A, "Slices");
        sl.property("ADBE Wave Warp-0001").setValue(2);
        sl.property("ADBE Wave Warp-0002").setValue(Math.round(d.slices.h * U));
        sl.property("ADBE Wave Warp-0003").setValue(Math.round(d.slices.w * U));
        sl.property("ADBE Wave Warp-0004").setValue(0);
        sl.property("ADBE Wave Warp-0005").setValue(0);
        UK.SB.linear(sl.property("ADBE Wave Warp-0007"), 0, 360 * 3, X);
    }
    out.push(A); out.push(Mv);
    return out;
};

UK.SB.NAMES = { g4: "Gradient", ramp: "Ramp", blob: "Glow", ring: "Ring", rect: "Panel", path: "Shape", noise: "Smoke", dots: "Dust", bubbles: "Bubbles", grid: "Grid", nodes: "Nodes", burst: "Burst", rays: "Rays", sweep: "Light Sweep" };

UK.SB.element = function (C, d, X, idx) {
    var W = X.W, H = X.H, U = X.U, P = X.P, cols = X.cols, i, k, L, g, v;
    var nm = (UK.SB.NAMES[d.t] || "Layer") + " " + (idx + 1);
    var P2 = function (p) { return [p[0] * W, p[1] * H]; };
    switch (d.t) {
        case "g4":
            /* 4-Color Gradient: four coloured points (keyframed drift), smooth blend */
            L = C.layers.addSolid([0, 0, 0], nm, W, H, X.pa, C.duration);
            UK.fx(L, "ADBE 4ColorGradient", "Colors");
            var cg = UK.efx(L, "Colors"), pIdx = ["0001", "0003", "0005", "0007"], cIdx = ["0002", "0004", "0006", "0008"];
            for (k = 0; k < 4; k++) {
                var pl = [];
                if (d.drift) for (i = 0; i < d.drift.length; i++) pl.push(d.drift[i][k]); else pl.push(d.pts[k]);
                UK.SB.cyc(cg.property("ADBE 4ColorGradient-" + pIdx[k]), pl, X, 0, P2, d.i && d.i.pts ? d.i.pts[k] : undefined);
                UK.SB.colorProp(UK.efx(L, "Colors").property("ADBE 4ColorGradient-" + cIdx[k]), d.cols[k], cols);
            }
            UK.efx(L, "Colors").property("ADBE 4ColorGradient-0009").setValue(d.blend || 100);
            d = { op: d.op, m: d.m, i: d.i ? { op: d.i.op } : null };
            break;
        case "ramp":
            /* Gradient Ramp: linear or radial, start / end points keyframed */
            L = C.layers.addSolid([0, 0, 0], nm, W, H, X.pa, C.duration);
            UK.fx(L, "ADBE Ramp", "Ramp");
            var rp = UK.efx(L, "Ramp");
            UK.SB.cyc(rp.property("ADBE Ramp-0001"), d.from, X, 0, P2);
            UK.SB.cyc(UK.efx(L, "Ramp").property("ADBE Ramp-0003"), d.to, X, 0, P2);
            UK.SB.colorProp(UK.efx(L, "Ramp").property("ADBE Ramp-0002"), d.cols[0], cols);
            UK.SB.colorProp(UK.efx(L, "Ramp").property("ADBE Ramp-0004"), d.cols[1], cols);
            UK.efx(L, "Ramp").property("ADBE Ramp-0005").setValue(d.radial ? 2 : 1);
            if (d.mask) UK.SB.mask(L, d.mask, X);
            d = { op: d.op, m: d.m, blur: d.blur, i: d.i };
            break;
        case "blob":
        case "ring":
        case "rect":
            L = UK.shapeLayer(C, nm);
            g = UK.group(UK.root(L), "Shape"); v = UK.vecs(g);
            var off = d.off ? [d.off[0] * U, d.off[1] * U] : [0, 0];
            if (d.t === "rect") UK.addRect(v, [d.sz[0] * U, d.sz[1] * U], off, (d.round || 0) * U);
            else UK.addEllipse(v, [d.s * U, d.s * U * (d.a || 1)], off);
            if (d.t === "ring" && d.arc) {
                UK.addTrim(UK.vecs(UK.root(L).property("Shape"))).property("ADBE Vector Trim End").setValue(d.arc);
                UK.gtr(UK.root(L).property("Shape")).property("ADBE Vector Rotation").setValue(-d.arc * 1.8 + (d.arcRot || 0));
            }
            v = UK.vecs(UK.root(L).property("Shape"));
            if (d.t === "blob") UK.SB.fill(v, d.c, cols);
            else if (d.t === "ring") UK.SB.stroke(v, d.c, cols, Math.max(0.5, d.w * U));
            else {
                if (d.fc !== undefined) UK.SB.fill(v, d.fc, cols, d.fop);
                if (d.w) UK.SB.stroke(v, d.c, cols, Math.max(0.5, d.w * U), d.sop);
                else if (d.fc === undefined) UK.SB.fill(v, d.c, cols);
            }
            var bw = d.t === "rect" ? d.sz[0] * U : d.s * U, bh = d.t === "rect" ? d.sz[1] * U : d.s * U * (d.a || 1), sw = (d.w || 0) * U;
            UK.SB.room(L, off[0], off[1], bw + sw, bh + sw, d.blur, U);
            break;
        case "mesh":
            if (UK_CAT.saasMesh[d.key].c > 16) return UK.SB.meshMaps(C, d, X);
            /* the preview's own colour layout: C x R soft cells (+ one ring outside the frame), each cell's
               colour is a mix of two palette colours (expression), blurred together into one gradient.
               Cells of the same colour share one group (one fill + expression for all of them).        */
            var MD = UK_CAT.saasMesh[d.key], MC = MD.c || 16, MR = MD.r || 9, cw = W / MC, ch = H / MR;
            var mgr = {}, mord = [];
            for (var yy = -1; yy <= MR; yy++) for (var xx = -1; xx <= MC; xx++) {
                var cx2 = Math.max(0, Math.min(MC - 1, xx)), cy2 = Math.max(0, Math.min(MR - 1, yy)), code = MD.cells.substr((cy2 * MC + cx2) * 4, 4);
                if (code.charAt(0) === code.charAt(1) || code.substr(2) === "00") code = code.charAt(0) + code.charAt(0) + "00";
                if (!mgr[code]) { mgr[code] = []; mord.push(code); }
                mgr[code].push([[cw * 1.02 * (xx < 0 || xx >= MC ? 2 : 1), ch * 1.02 * (yy < 0 || yy >= MR ? 2 : 1)],
                    [(xx + 0.5) * cw + (xx < 0 ? -cw / 2 : (xx >= MC ? cw / 2 : 0)), (yy + 0.5) * ch + (yy < 0 ? -ch / 2 : (yy >= MR ? ch / 2 : 0))]]);
            }
            L = UK.shapeLayer(C, "Gradient Mesh");
            for (k = 0; k < mord.length; k++) {
                var mc0 = mord[k], ci = Number(mc0.charAt(0)), cj = Number(mc0.charAt(1)), ct = Number(mc0.substr(2)) / 99;
                var gname = "Cells " + (k + 1), cl = mgr[mc0];
                UK.group(UK.root(L), gname);
                var gv = UK.vecs(UK.root(L).property(gname));
                for (i = 0; i < cl.length; i++) UK.addRect(gv, cl[i][0], cl[i][1]);
                var cf = UK.addFill(gv, cols[ci]);
                var ca = UK.rgb(cols[ci]), cb = UK.rgb(cols[cj]);
                cf.property("ADBE Vector Fill Color").setValue([ca[0] + (cb[0] - ca[0]) * ct, ca[1] + (cb[1] - ca[1]) * ct, ca[2] + (cb[2] - ca[2]) * ct, 1]);
                cf.property("ADBE Vector Fill Color").expression = (ci === cj || ct === 0) ? UK.SB.col(ci) :
                    "var a = " + UK.SB.col(ci) + ", b = " + UK.SB.col(cj) + ";\na + (b - a) * " + ct.toFixed(3) + ";";
            }
            if (!d.blur) d.blur = MC > 16 ? 0.035 : 0.11;
            UK.SB.room(L, W / 2, H / 2, W * 1.3, H * 1.3, d.blur, U);
            UK.anchor(L).setValue([W / 2, H / 2]);
            if (!d.at) d.at = [[0.5, 0.5]];
            if (!d.sc) d.sc = MC > 16 ? [103, 105, 103.5, 105.5] : [106, 110, 107, 111];
            break;
        case "frame":
            /* everything outside a rounded rectangle (inside of a screen edge): big rect minus the inner one */
            L = UK.shapeLayer(C, nm);
            g = UK.group(UK.root(L), "Frame");
            UK.addRect(UK.vecs(g), [U * 4, U * 4], [0, 0]);
            UK.addRect(UK.vecs(UK.root(L).property("Frame")), [d.sz[0] * U, d.sz[1] * U], [0, 0], (d.round || 0) * U);
            var mg = UK.vecs(UK.root(L).property("Frame")).addProperty("ADBE Vector Filter - Merge");
            try { mg.property("ADBE Vector Merge Type").setValue(3); } catch (e1) { }
            UK.SB.fill(UK.vecs(UK.root(L).property("Frame")), d.c, cols);
            break;
        case "path":
            L = UK.shapeLayer(C, nm);
            g = UK.group(UK.root(L), "Shape"); v = UK.vecs(g);
            var pk = d.pk || [d.pts], closed = !!d.closed;
            v.addProperty("ADBE Vector Shape - Group");
            var shp = UK.vecs(UK.root(L).property("Shape")).property(1).property("ADBE Vector Shape");
            UK.SB.cyc(shp, pk.length > 1 ? pk : [pk[0]], X, d.ph || 0, function (p) { return UK.SB.shape(p, closed, U); }, d.i && d.i.pk ? d.i.pk : undefined);
            v = UK.vecs(UK.root(L).property("Shape"));
            if (d.fc !== undefined) UK.SB.fill(v, d.fc, cols, d.fop);
            if (d.w) UK.SB.stroke(v, d.c, cols, Math.max(0.5, d.w * U), d.sop);
            var bb = UK.SB.bbox(d.i && d.i.pk ? pk.concat([d.i.pk]) : pk, (d.w || 0) / 2);
            UK.SB.room(L, bb[0] * U, bb[1] * U, bb[2] * U, bb[3] * U, d.blur, U);
            if (d.i) d.i = { at: d.i.at, sc: d.i.sc, op: d.i.op, rot: d.i.rot };
            break;
        case "rays":
            /* soft petals radiating from a point (each petal a rounded bar) */
            L = UK.shapeLayer(C, nm);
            for (k = 0; k < d.n; k++) {
                var pg = UK.group(UK.root(L), "Petal " + (k + 1));
                UK.addRect(UK.vecs(pg), [d.len * U, d.wd * U], [d.r * U + d.len * U / 2, 0], d.wd * U / 2);
                UK.SB.fill(UK.vecs(UK.root(L).property("Petal " + (k + 1))), d.c, cols);
                UK.gtr(UK.root(L).property("Petal " + (k + 1))).property("ADBE Vector Rotation").setValue((d.a0 || 0) + k * (d.step || 30));
            }
            UK.SB.room(L, 0, 0, (d.r + d.len) * 2 * U, (d.r + d.len) * 2 * U, d.blur, U);
            break;
        case "burst":
            /* spiky star rings growing out of the centre, wave after wave (zoom-blurred) */
            var nw = d.waves || 3, cs = d.cols, R = (d.R || 0.5) * U, S1 = d.max || 420;
            for (k = 0; k < nw; k++) {
                var B = UK.shapeLayer(C, nm + " Wave " + (k + 1));
                for (i = 0; i < cs.length; i++) {
                    var sg = UK.group(UK.root(B), "Ring " + (i + 1));
                    UK.addStar(UK.vecs(sg), { points: d.points || 9, outer: R * (1 - i * 0.17), inner: R * (1 - i * 0.17) * (d.inner || 0.62) });
                    UK.SB.fill(UK.vecs(UK.root(B).property("Ring " + (i + 1))), cs[i], cols);
                }
                UK.pos(B).setValue([W / 2, H / 2]);
                var sk = [], scv = [], ok = [], ocv = [], fd = C.frameDuration;
                /* one wave per loop (phase k / nw), repeated by the loop expressions */
                var s0 = X.T0 + (k / nw) * P, s1 = s0 + P - fd;
                sk.push([s0, [0, 0]], [s1, [S1, S1]], [s0 + P, [0, 0]]); scv.push("in", "hold");
                ok.push([s0, 0], [s0 + P * 0.12, 100], [s1 - P * 0.25, 100], [s1, 0], [s0 + P, 0]); ocv.push("smooth", "linear", "smooth", "hold");
                UK.anim(UK.scale(B), sk, scv);
                UK.anim(UK.opac(B), ok, ocv);
                UK.SB.loop(UK.scale(B), 1, X.T0, false);
                UK.SB.loop(UK.opac(B), 1, X.T0, false);
                UK.SB.linear(UK.rot(B), k * 13, k * 13 + 360 * (d.spin || 0.1) * 3, X);
                UK.fx(B, "CC Radial Fast Blur", "Rays");
                UK.efx(B, "Rays").property("CC Radial Fast Blur-0001").setValue([W / 2, H / 2]);
                UK.efx(B, "Rays").property("CC Radial Fast Blur-0002").setValue(d.zoom || 55);
                UK.SB.blur(B, d.blur || 0.004, U);
            }
            return [];
        case "sweep":
            /* soft light sweep crossing the frame once per loop (as in the preview) */
            L = UK.shapeLayer(C, nm);
            UK.addRect(UK.vecs(UK.group(UK.root(L), "Sheen")), [(d.wd || 0.2) * U, 2.6 * U], [0, 0], 0.1 * U);
            UK.SB.fill(UK.vecs(UK.root(L).property("Sheen")), d.c, cols);
            UK.rot(L).setValue(d.ang === undefined ? 22 : d.ang);
            UK.SB.blur(L, d.blur || 0.07, U);
            L.blendingMode = UK.SB.MODES[d.m || "add"];
            var Lx = [-0.3 * W, H / 2], Rx = [1.3 * W, H / 2], sk2 = [], sc2 = [], a1 = d.from || 0.1, a2 = d.to || 0.6;
            /* one pass per loop: wait left, cross, wait right, jump back at the loop point */
            sk2 = [[X.T0, Lx], [X.T0 + a1 * P, Lx], [X.T0 + a2 * P, Rx], [X.T0 + P, Lx]]; sc2 = ["hold", "inout", "hold"];
            UK.anim(UK.pos(L), sk2, sc2);
            UK.SB.loop(UK.pos(L), 1, X.T0, false);
            UK.opac(L).setValue(d.op === undefined ? 50 : d.op);
            return [L];
        case "noise":
            /* smoke / fluid: Fractal Noise coloured by Tritone (+ Turbulent Displace, Polar rays) */
            var NW = d.polar ? Math.round(Math.sqrt(W * W + H * H) * 1.08) : W, NH = d.polar ? NW : H;
            L = C.layers.addSolid([0, 0, 0], nm, NW, NH, X.pa, C.duration);
            UK.fx(L, "ADBE Fractal Noise", "Fractal Noise");
            var fn = UK.efx(L, "Fractal Noise");
            fn.property("ADBE Fractal Noise-0004").setValue(d.contrast || 120);
            fn.property("ADBE Fractal Noise-0005").setValue(d.bright || 0);
            if (d.sw || d.sh) {
                fn.property("ADBE Fractal Noise-0009").setValue(0);
                fn.property("ADBE Fractal Noise-0011").setValue(d.sw || 100);
                fn.property("ADBE Fractal Noise-0012").setValue(d.sh || 100);
            }
            fn.property("ADBE Fractal Noise-0010").setValue((d.scale || 200) * U / 1920);
            fn.property("ADBE Fractal Noise-0015").setValue(d.cx || 3);
            if (d.drift) UK.SB.cyc(fn.property("ADBE Fractal Noise-0013"), d.drift, X, 0, function (p) { return [NW / 2 + p[0] * U, NH / 2 + p[1] * U]; });
            UK.SB.evolve(fn, "ADBE Fractal Noise-0023", "ADBE Fractal Noise-0025", "ADBE Fractal Noise-0026", d.evo || 1, X);
            if (d.turb) {
                UK.fx(L, "ADBE Turbulent Displace", "Flow");
                var td = UK.efx(L, "Flow");
                td.property("ADBE Turbulent Displace-0002").setValue(d.turb.amt || 60);
                td.property("ADBE Turbulent Displace-0003").setValue(Math.round((d.turb.size || 0.1) * U));
                UK.SB.evolve(td, "ADBE Turbulent Displace-0006", "ADBE Turbulent Displace-0008", "ADBE Turbulent Displace-0009", 1, X);
            }
            if (d.polar) {
                UK.fx(L, "ADBE Polar Coordinates", "Rays");
                UK.efx(L, "Rays").property("ADBE Polar Coordinates-0001").setValue(1);       // 100 % (percent = 0..1 in scripting)
                UK.efx(L, "Rays").property("ADBE Polar Coordinates-0002").setValue(1);
            }
            UK.fx(L, "ADBE Tritone", "Tint");
            var tc = d.cols || [0, 1, 2];
            UK.SB.colorProp(UK.efx(L, "Tint").property("ADBE Tritone-0003"), tc[0], cols);
            UK.SB.colorProp(UK.efx(L, "Tint").property("ADBE Tritone-0002"), tc[1], cols);
            UK.SB.colorProp(UK.efx(L, "Tint").property("ADBE Tritone-0001"), tc[2], cols);
            if (d.mask) UK.SB.mask(L, d.mask, X);
            d = { op: d.op, m: d.m, blur: d.blur, edge: !d.mask && !d.polar, i: d.i ? { op: d.i.op } : null };
            break;
        case "dots":
        case "bubbles":
            L = UK.shapeLayer(C, nm);
            UK.pos(L).setValue([0, 0]);
            var rnd = UK.rng(d.seed || 1), ar = d.area || [0, 0, 1, 1], n = d.n || 30, TP = (2 * Math.PI / P).toFixed(6);
            var buckets = d.t === "dots" ? 3 : n;
            for (var b = 0; b < buckets; b++) {
                var bg = UK.group(UK.root(L), (d.t === "dots" ? "Dots " : "Bubble ") + (b + 1));
                for (i = b; i < n; i += buckets) {
                    var x0 = (ar[0] + rnd() * (ar[2] - ar[0])) * W, y0 = (ar[1] + rnd() * (ar[3] - ar[1])) * H;
                    var sz2 = (d.smin + rnd() * (d.smax - d.smin)) * U, am = (d.amp || 0.01) * U;
                    var ax = (am * (0.5 + rnd())).toFixed(1), ay = (am * (0.5 + rnd())).toFixed(1);
                    var m1 = 1 + Math.floor(rnd() * 2), m2 = 1 + Math.floor(rnd() * 2), p1 = (rnd() * 6.28).toFixed(2), p2 = (rnd() * 6.28).toFixed(2);
                    var ex = UK.SB.clock(X.T0) + "t = (t - " + X.T0 + ") * " + TP + ";\n[" + x0.toFixed(1) + " + " + ax + " * Math.sin(t * " + m1 + " + " + p1 + "), " + y0.toFixed(1) + " + " + ay + " * Math.cos(t * " + m2 + " + " + p2 + ")];";
                    if (d.t === "dots") {
                        var el = UK.addEllipse(UK.vecs(UK.root(L).property(bg.name)), [sz2, sz2], [x0, y0]);
                        el.property("ADBE Vector Ellipse Position").expression = ex;
                    } else {
                        UK.addEllipse(UK.vecs(UK.root(L).property(bg.name)), [sz2, sz2], [0, 0]);
                        var bv = UK.vecs(UK.root(L).property(bg.name));
                        UK.SB.fill(bv, d.fc !== undefined ? d.fc : d.c, cols, d.fop || 18);
                        UK.SB.stroke(bv, d.c, cols, Math.max(1, U * (d.sw || 0.0012)), d.sop || 60);
                        if (d.shine !== false) {
                            var hl = UK.group(bv, "Shine");
                            UK.addEllipse(UK.vecs(hl), [sz2 * 0.36, sz2 * 0.2], [-sz2 * 0.18, -sz2 * 0.26]);
                            UK.SB.fill(UK.vecs(bv.property("Shine")), d.c, cols, d.shop || 45);
                        }
                        UK.gtr(UK.root(L).property(bg.name)).property("ADBE Vector Position").expression = ex;
                    }
                }
                if (d.t === "dots") {
                    UK.SB.fill(UK.vecs(UK.root(L).property(bg.name)), d.c, cols);
                    var o1 = d.op ? d.op[0] : 30, o2 = d.op ? d.op[1] : 80;
                    UK.SB.cyc(UK.gtr(UK.root(L).property(bg.name)).property("ADBE Vector Group Opacity"), [o1, o2, (o1 + o2) / 2, o2], X, b, function (x) { return x; });
                }
            }
            d = { blur: d.blur, m: d.m || (d.t === "dots" ? "add" : "normal"), i: d.i ? { op: d.i.op } : null };
            break;
        case "grid":
        case "nodes":
            L = UK.shapeLayer(C, nm);
            var gp = d.gap * W, nx = Math.ceil(W / gp) + 8, ny = Math.ceil(H / gp) + 8, st = -4 * gp;
            if (d.t === "grid") {
                var gv = UK.group(UK.root(L), "Vertical");
                UK.addPath(UK.vecs(gv), [[st, st], [st, H - st]], null, null, false);
                UK.SB.stroke(UK.vecs(UK.root(L).property("Vertical")), d.c, cols, Math.max(0.5, d.w * U));
                UK.addRepeater(UK.vecs(UK.root(L).property("Vertical")), nx, [gp, 0]);
                var gh = UK.group(UK.root(L), "Horizontal");
                UK.addPath(UK.vecs(gh), [[st, st], [W - st, st]], null, null, false);
                UK.SB.stroke(UK.vecs(UK.root(L).property("Horizontal")), d.c, cols, Math.max(0.5, d.w * U));
                UK.addRepeater(UK.vecs(UK.root(L).property("Horizontal")), ny, [0, gp]);
                if (d.diag) {
                    /* faint diagonal X in every cell */
                    var gd = UK.group(UK.root(L), "Diagonals");
                    UK.addPath(UK.vecs(gd), [[st, st], [st + gp, st + gp]], null, null, false);
                    UK.addPath(UK.vecs(UK.root(L).property("Diagonals")), [[st + gp, st], [st, st + gp]], null, null, false);
                    UK.SB.stroke(UK.vecs(UK.root(L).property("Diagonals")), d.c, cols, Math.max(0.5, d.w * U), d.diag);
                    UK.addRepeater(UK.vecs(UK.root(L).property("Diagonals")), nx, [gp, 0], "Columns");
                    UK.addRepeater(UK.vecs(UK.root(L).property("Diagonals")), ny, [0, gp], "Rows");
                }
            } else {
                var nd = UK.group(UK.root(L), "Node");
                var ns = d.size * U;
                if (d.cross) {
                    UK.addRect(UK.vecs(nd), [ns, ns * 0.28], [st, st], 0);
                    UK.addRect(UK.vecs(UK.root(L).property("Node")), [ns * 0.28, ns], [st, st], 0);
                } else UK.addRect(UK.vecs(nd), [ns, ns], [st, st], ns * (d.round === undefined ? 0.15 : d.round));
                UK.SB.fill(UK.vecs(UK.root(L).property("Node")), d.c, cols);
                UK.addRepeater(UK.vecs(UK.root(L).property("Node")), nx, [gp, 0], "Columns");
                UK.addRepeater(UK.vecs(UK.root(L).property("Node")), ny, [0, gp], "Rows");
            }
            var pn = d.pan || [0, 0], o0 = d.offset ? [d.offset[0] * gp, d.offset[1] * gp] : [0, 0];
            UK.pos(L).setValue(o0);
            if (pn[0] || pn[1]) UK.SB.linear(UK.pos(L), o0, [o0[0] + pn[0] * gp * 3, o0[1] + pn[1] * gp * 3], X);
            if (d.bulge) {
                UK.fx(L, "ADBE Optics Compensation", "Curve");
                try { UK.efx(L, "Curve").property(1).setValue(d.bulge); } catch (e0) { }
            }
            d = { op: d.op, m: d.m, blur: d.blur, matte: d.matte, glow: d.glow, i: d.i ? { op: d.i.op } : null };
            break;
        case "flute":
            /* reeded glass: every glow layer is displaced in vertical ribs + rib shading in Soft Light */
            for (i = 1; i <= C.numLayers; i++) {
                var FL = C.layer(i);
                if (FL.name === "Background" || !(FL instanceof ShapeLayer)) continue;
                UK.fx(FL, "ADBE Wave Warp", "Ribs");
                var ww = UK.efx(FL, "Ribs");
                ww.property("ADBE Wave Warp-0001").setValue(4);
                ww.property("ADBE Wave Warp-0002").setValue(Math.max(1, Math.round(d.h * U)));
                ww.property("ADBE Wave Warp-0003").setValue(Math.max(2, Math.round(d.w * U)));
                ww.property("ADBE Wave Warp-0004").setValue(90);
                ww.property("ADBE Wave Warp-0005").setValue(0);
                ww.property("ADBE Wave Warp-0006").setValue(2);
            }
            var Rb = UK.shapeLayer(C, "Ribs Shading"), rw = d.w * U;
            var rg = UK.group(UK.root(Rb), "Rib");
            UK.addRect(UK.vecs(rg), [rw, H * 1.2], [rw / 2, H / 2]);
            UK.addGradFill(UK.vecs(UK.root(Rb).property("Rib")), false, [0, H / 2], [rw, H / 2]);
            UK.addRepeater(UK.vecs(UK.root(Rb).property("Rib")), Math.ceil(W / rw) + 2, [rw, 0]);
            UK.pos(Rb).setValue([-rw, 0]);
            Rb.blendingMode = BlendingMode.SOFT_LIGHT;
            UK.opac(Rb).setValue(d.op || 45);
            return [Rb];
    }
    UK.SB.common(L, d, X);
    if (d.slices) {
        UK.fx(L, "ADBE Wave Warp", "Slices");
        var sl = UK.efx(L, "Slices");
        sl.property("ADBE Wave Warp-0001").setValue(2);
        sl.property("ADBE Wave Warp-0002").setValue(Math.round(d.slices.h * U));
        sl.property("ADBE Wave Warp-0003").setValue(Math.round(d.slices.w * U));
        sl.property("ADBE Wave Warp-0004").setValue(0);
        sl.property("ADBE Wave Warp-0005").setValue(0);
        UK.SB.linear(sl.property("ADBE Wave Warp-0007"), 0, 360 * 3, X);
    }
    if (d.turb) {
        UK.fx(L, "ADBE Turbulent Displace", "Liquid");
        var lq = UK.efx(L, "Liquid");
        lq.property("ADBE Turbulent Displace-0002").setValue(d.turb.amt || 50);
        lq.property("ADBE Turbulent Displace-0003").setValue(Math.round((d.turb.size || 0.03) * U));
        UK.SB.evolve(lq, "ADBE Turbulent Displace-0006", "ADBE Turbulent Displace-0008", "ADBE Turbulent Displace-0009", 1, X);
    }
    var out = [L];
    if (d.glow) {
        var G = L.duplicate();
        G.name = L.name + " Glow";
        UK.SB.blur(G, d.glow, U);
        G.blendingMode = BlendingMode.SCREEN;   // Add on a bright node blows it out to white
        try { if (UK.opac(G).numKeys === 0) UK.opac(G).setValue(60); } catch (e2) { }
        out.push(G);
    }
    if (d.matte) {
        var mt = d.matte, Mt = UK.shapeLayer(C, L.name + " Matte");
        UK.addEllipse(UK.vecs(UK.group(UK.root(Mt), "Area")), [mt.s * U, mt.s * U * (mt.a || 1)], [0, 0]);
        UK.addFill(UK.vecs(UK.root(Mt).property("Area")), "#FFFFFF");
        UK.SB.room(Mt, 0, 0, mt.s * U, mt.s * U * (mt.a || 1), mt.blur, U);
        UK.SB.cyc(UK.pos(Mt), mt.at, X, 0, P2);
        UK.SB.blur(Mt, mt.blur, U);
        for (i = 0; i < out.length; i++) {
            try { out[i].setTrackMatte(Mt, TrackMatteType.ALPHA); }
            catch (e) { Mt.moveBefore(out[i]); out[i].trackMatteType = TrackMatteType.ALPHA; }
        }
        out.push(Mt);
    }
    return out;
};

UK.api.saasBg = function (a) {
    var host = UK.comp(true);
    var spec = UK_CAT.find(UK_CAT.saasBg, a.id);
    if (!spec) throw new Error("Unknown SaaS background " + a.id);
    var W = host.width, H = host.height, U = Math.max(W, H), P = spec.P || 18, T0 = spec.T0 || 0, i;
    var cols = (a.colors && a.colors.length === spec.colors.length) ? a.colors : spec.colors;
    var speed = UK.clamp(Number(a.speed) || 100, 1, 1000);
    var intro = a.intro !== false;
    var dur = UK.clamp(Number(a.duration) || host.duration, 0.1, 10800);
    var t0 = a.fullComp === false ? UK.timeCTI(host) : 0;
    var name = UK.uniqueName("BG SaaS - " + spec.name);
    UK._fd = host.frameDuration;
    var X = { W: W, H: H, U: U, P: P, T0: T0, cols: cols, pa: host.pixelAspect };

    /* ---- the precomp: intro + one keyed loop, repeated by the loop expressions. It is at least
       10 minutes long, so the layer in your comp can be stretched to any length.                   */
    var C = UK.newComp(name, host, Math.max(dur, host.duration, 600), "Backgrounds");
    var B = UK.shapeLayer(C, "Background");
    UK.addRect(UK.vecs(UK.group(UK.root(B), "Rect")), [W * 1.2, H * 1.2], [0, 0]);
    UK.SB.fill(UK.vecs(UK.root(B).property("Rect")), 0, cols);
    UK.pos(B).setValue([W / 2, H / 2]);
    for (i = 0; i < spec.els.length; i++) UK.SB.element(C, spec.els[i], X, i);

    /* ---- controls: Speed, Intro and the colours, all in Essential Properties */
    var N = C.layers.addNull();
    N.name = UK.SB.CTL;
    N.label = 2;
    UK.essential(C, UK.slider(N, "Speed", speed), "Speed");
    UK.essential(C, UK.checkCtl(N, "Intro", intro), "Intro");
    for (i = 0; i < cols.length; i++) UK.colorCtl(N, "Color " + (i + 1), cols[i]);
    for (i = 0; i < cols.length; i++) UK.essential(C, UK.efx(N, "Color " + (i + 1)).property(1), spec.mesh ? "Color " + (i + 1) : (i === 0 ? "Background" : "Color " + i));
    B.moveToEnd();
    C.comment = "Ultimate Kit SaaS background: intro " + T0 + " s, then one " + P + " s float loop repeated by loopOut-style expressions. Speed: keyframe spacing or Speed (Essential Properties, 100 = as built).";

    /* ---- the layer in your comp (plays from its start; stretch it to any length) */
    var L = host.layers.add(C);
    L.name = UK.uniqueLayerName(host, "BG SaaS - " + spec.name);
    L.moveToEnd();
    L.startTime = t0;
    L.inPoint = t0;
    L.outPoint = Math.min(host.duration, t0 + dur);
    if (L.outPoint <= t0) L.outPoint = t0 + dur;
    L.comment = "Ultimate Kit: Speed, Intro and colours in Essential Properties (twirl the layer open).";
    UK.selectOnly(host, [L]);
    return { name: L.name, comp: C.name, loop: P };
};

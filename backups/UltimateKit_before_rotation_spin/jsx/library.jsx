/*  Ultimate Kit - your own presets (the "+" tile in every preset category).
    libSave: the selected layers -> plain data (every property with its value or keyframes, speed-ramps,
             spatial tangents and expressions; effects, masks, text animators, shape contents;
             precomps are saved with their own layers). The panel stores it as a .json file.
    libApply: two ways, picked automatically -
      animation  the preset is one text layer and text layers are selected: its text animators,
                 effects and transform keyframes go onto the selected layers (their own text stays;
                 position keys are moved to where each layer is)
      layers     anything else: the saved layers are rebuilt in the active comp at the playhead.     */

UK.LIB = {};
UK.LIB.GROUPS = ["ADBE Transform Group", "ADBE Effect Parade", "ADBE Mask Parade", "ADBE Text Properties", "ADBE Root Vectors Group"];
UK.LIB.SKIP_TYPES = function (vt) {
    return vt === PropertyValueType.NO_VALUE || vt === PropertyValueType.CUSTOM_VALUE || vt === PropertyValueType.MARKER ||
        vt === PropertyValueType.LAYER_INDEX || vt === PropertyValueType.MASK_INDEX;
};
/* ------------------------------------------------------------------ values */
UK.LIB.enc = function (v, vt) {
    if (vt === PropertyValueType.SHAPE) return { sh: 1, v: v.vertices, i: v.inTangents, o: v.outTangents, c: v.closed };
    if (vt === PropertyValueType.TEXT_DOCUMENT) {
        var d = { td: 1, text: v.text }, keys = ["font", "fontSize", "fillColor", "applyFill", "strokeColor", "applyStroke", "strokeWidth", "justification", "tracking", "leading", "strokeOverFill"], k;
        for (k = 0; k < keys.length; k++) { try { d[keys[k]] = v[keys[k]]; } catch (e) { } }
        return d;
    }
    return v;
};
UK.LIB.dec = function (v, cur) {
    if (v && v.sh) { var s = new Shape(); s.vertices = v.v; s.inTangents = v.i; s.outTangents = v.o; s.closed = v.c; return s; }
    if (v && v.td) {
        var d = cur, k;
        for (k in v) if (k !== "td") { try { d[k] = v[k]; } catch (e) { } }
        return d;
    }
    return v;
};
UK.LIB.ease = function (arr) { var o = [], i; for (i = 0; i < arr.length; i++) o.push([arr[i].speed, arr[i].influence]); return o; };
UK.LIB.mkEase = function (arr) { var o = [], i; for (i = 0; i < arr.length; i++) o.push(new KeyframeEase(arr[i][0], arr[i][1])); return o; };

/* ---------------------------------------------------------------- serialize */
UK.LIB.ser = function (p, t0) {
    var i, o;
    if (p.propertyType === PropertyType.PROPERTY) {
        var vt = p.propertyValueType;
        if (UK.LIB.SKIP_TYPES(vt)) return null;
        o = { m: p.matchName };
        try { if (p.canSetExpression && p.expression !== "") { o.x = p.expression; o.xe = p.expressionEnabled; } } catch (e0) { }
        if (p.numKeys > 0) {
            o.k = [];
            for (i = 1; i <= p.numKeys; i++) {
                var k = { t: p.keyTime(i) - t0, v: UK.LIB.enc(p.keyValue(i), vt) };
                try { k.ii = p.keyInInterpolationType(i); k.oi = p.keyOutInterpolationType(i); } catch (e1) { }
                try { k.ie = UK.LIB.ease(p.keyInTemporalEase(i)); k.oe = UK.LIB.ease(p.keyOutTemporalEase(i)); } catch (e2) { }
                try { k.tc = p.keyTemporalContinuous(i); k.ta = p.keyTemporalAutoBezier(i); } catch (e3) { }
                if (p.isSpatial) { try { k.si = p.keyInSpatialTangent(i); k.so = p.keyOutSpatialTangent(i); k.sc = p.keySpatialContinuous(i); k.sa = p.keySpatialAutoBezier(i); } catch (e4) { } }
                o.k.push(k);
            }
        } else {
            try { o.v = UK.LIB.enc(p.value, vt); } catch (e5) { }
        }
        if (o.v === undefined && !o.k && o.x === undefined) return null;
        return o;
    }
    o = { m: p.matchName, n: p.name, ix: p.propertyType === PropertyType.INDEXED_GROUP, c: [] };
    if (p.matchName === "ADBE Mask Atom") { try { o.mode = p.maskMode; o.inv = p.inverted; } catch (e6) { } }
    if (p.matchName === "ADBE Effect Parade" || o.ix) { try { o.en = p.enabled; } catch (e7) { } }
    for (i = 1; i <= p.numProperties; i++) {
        var c = null;
        try { c = UK.LIB.ser(p.property(i), t0); } catch (e8) { }
        if (c) o.c.push(c);
    }
    return o;
};
UK.LIB.serLayer = function (L, t0, all) {
    var o = { name: L.name, tin: L.inPoint - t0, tout: L.outPoint - t0, st: L.startTime - t0, g: [], label: L.label }, i;   // ("in" is reserved in ES3)
    if (L instanceof TextLayer) o.type = "text";
    else if (L instanceof ShapeLayer) o.type = "shape";
    else if (L.nullLayer) o.type = "null";
    else if (L instanceof AVLayer && L.source instanceof CompItem) { o.type = "comp"; o.comp = UK.LIB.serComp(L.source); }
    else if (L instanceof AVLayer && L.source && L.source.mainSource instanceof SolidSource) { o.type = "solid"; o.solid = { c: L.source.mainSource.color, w: L.source.width, h: L.source.height }; }
    else if (L instanceof AVLayer && L.source && L.source.file) { o.type = "file"; o.file = L.source.file.fsName; }
    else o.type = "other";
    try { o.blend = L.blendingMode; o.three = L.threeDLayer; o.adj = L.adjustmentLayer; o.mb = L.motionBlur; o.en = L.enabled; } catch (e) { }
    try { if (o.type === "text") o.tdpc = L.threeDPerChar; } catch (e1) { }
    if (L.parent) { for (i = 0; i < all.length; i++) if (all[i] === L.parent) o.parent = i; if (o.parent === undefined) o.ext = 1; }   // ext: parented to a layer that was not saved
    var tr = L.property("ADBE Transform Group");
    try { o.base = { p: tr.property("ADBE Position").valueAtTime(t0, false), a: tr.property("ADBE Anchor Point").valueAtTime(t0, false) }; } catch (e2) { }
    for (i = 0; i < UK.LIB.GROUPS.length; i++) {
        var g = L.property(UK.LIB.GROUPS[i]);
        if (g) { var s = UK.LIB.ser(g, t0); if (s) o.g.push(s); }
    }
    return o;
};
UK.LIB.serComp = function (C) {
    var o = { name: C.name, w: C.width, h: C.height, pa: C.pixelAspect, dur: C.duration, fr: C.frameRate, bg: C.bgColor, layers: [] }, all = [], i;
    for (i = C.numLayers; i >= 1; i--) all.push(C.layer(i));          // bottom -> top
    for (i = 0; i < all.length; i++) o.layers.push(UK.LIB.serLayer(all[i], 0, all));
    return o;
};

/* ------------------------------------------------------------------ restore */
UK.LIB.at = function (L, path) { var p = L, i; for (i = 0; i < path.length; i++) p = p.property(path[i]); return p; };
UK.LIB.setProp = function (L, path, c, t0, shift) {
    var get = function () { return UK.LIB.at(L, path); }, i;
    try {
        var P = get();
        if (c.k) {
            while (P.numKeys) P.removeKey(1);
            for (i = 0; i < c.k.length; i++) get().setValueAtTime(t0 + c.k[i].t, shift(UK.LIB.dec(c.k[i].v, get().value)));
            for (i = 0; i < c.k.length; i++) {
                var k = c.k[i], Q = get(), ki = Q.nearestKeyIndex(t0 + k.t);
                try { if (k.ii) Q.setInterpolationTypeAtKey(ki, k.ii, k.oi); } catch (e1) { }
                try { if (k.ie) get().setTemporalEaseAtKey(ki, UK.LIB.mkEase(k.ie), UK.LIB.mkEase(k.oe)); } catch (e2) { }
                try { if (k.tc !== undefined) { get().setTemporalContinuousAtKey(ki, k.tc); get().setTemporalAutoBezierAtKey(ki, k.ta); } } catch (e3) { }
                try { if (k.si) { get().setSpatialTangentsAtKey(ki, k.si, k.so); get().setSpatialContinuousAtKey(ki, k.sc); get().setSpatialAutoBezierAtKey(ki, k.sa); } } catch (e4) { }
            }
        } else if (c.v !== undefined) {
            if (P.numKeys) while (get().numKeys) get().removeKey(1);
            get().setValue(shift(UK.LIB.dec(c.v, get().value)));
        }
    } catch (e) { }
    try { if (c.x !== undefined) { get().expression = c.x; get().expressionEnabled = c.xe !== false; } } catch (e5) { }
};
/* rebuild the children of group g at `path` (indices from the layer); filter(child, depth) can skip */
UK.LIB.restore = function (L, path, g, t0, opt) {
    var i;
    for (i = 0; i < g.c.length; i++) {
        var c = g.c[i], parent = UK.LIB.at(L, path), idx = 0, ex = null;
        if (opt.skip && opt.skip(c, path.length)) continue;
        try { ex = parent.property(c.m); } catch (e0) { ex = null; }
        if (g.ix && (c.c || !ex)) {
            try { var np = parent.addProperty(c.m); idx = np.propertyIndex; } catch (e1) { continue; }
            if (c.c) { try { UK.LIB.at(L, path).property(idx).name = c.n; } catch (e2) { } }
        } else {
            if (!ex) continue;
            idx = ex.propertyIndex;
        }
        var cp = path.concat([idx]);
        if (c.c) {
            if (c.mode !== undefined) { try { UK.LIB.at(L, cp).maskMode = c.mode; UK.LIB.at(L, cp).inverted = c.inv; } catch (e3) { } }
            UK.LIB.restore(L, cp, c, t0, opt);
        } else UK.LIB.setProp(L, cp, c, t0, opt.shift ? opt.shift(c) : function (v) { return v; });
    }
};
UK.LIB.groupIndex = function (L, mn) { var g = L.property(mn); return g ? g.propertyIndex : 0; };
UK.LIB.makeLayer = function (comp, o, t0) {
    var L;
    if (o.type === "text") L = comp.layers.addText(" ");
    else if (o.type === "shape") L = comp.layers.addShape();
    else if (o.type === "null") L = comp.layers.addNull();
    else if (o.type === "solid") L = comp.layers.addSolid(o.solid.c, o.name, o.solid.w, o.solid.h, comp.pixelAspect, comp.duration);
    else if (o.type === "comp") L = comp.layers.add(UK.LIB.makeComp(o.comp));
    else if (o.type === "file") {
        var f = new File(o.file), item = null;
        if (f.exists) { item = app.project.importFile(new ImportOptions(f)); item.parentFolder = UK.folder("Imported"); L = comp.layers.add(item); }
        else L = comp.layers.addSolid([0.5, 0.5, 0.5], o.name + " (missing file)", comp.width, comp.height, comp.pixelAspect, comp.duration);
    } else L = comp.layers.addNull();
    L.name = o.name;
    try { L.startTime = t0 + o.st; } catch (e) { }
    try { if (o.three) L.threeDLayer = true; if (o.tdpc) L.threeDPerChar = true; if (o.adj) L.adjustmentLayer = true; if (o.mb) L.motionBlur = true; L.label = o.label; } catch (e1) { }
    var i;
    for (i = 0; i < o.g.length; i++) {
        var gi = UK.LIB.groupIndex(L, o.g[i].m);
        if (gi) UK.LIB.restore(L, [gi], o.g[i], t0, {});
    }
    try { L.blendingMode = o.blend; } catch (e2) { }
    try { L.inPoint = t0 + o.tin; L.outPoint = t0 + o.tout; } catch (e3) { }
    try { if (o.en === false) L.enabled = false; } catch (e4) { }
    return L;
};
UK.LIB.makeComp = function (o) {
    var C = app.project.items.addComp(UK.uniqueName(o.name), o.w, o.h, o.pa, o.dur, o.fr), made = [], i;
    C.parentFolder = UK.folder("My Presets");
    try { C.bgColor = o.bg; } catch (e) { }
    for (i = 0; i < o.layers.length; i++) made.push(UK.LIB.makeLayer(C, o.layers[i], 0));   // bottom -> top
    for (i = 0; i < o.layers.length; i++) if (o.layers[i].parent !== undefined) { try { made[i].parent = made[o.layers[i].parent]; } catch (e1) { } }
    return C;
};

/* ---------------------------------------------------------------------- API */
UK.api.libSave = function (a) {
    var comp = UK.comp(false), sel = comp.selectedLayers, i, j, k;
    if (!sel.length) throw new Error("Select the layer(s) to save as a preset first.");
    var all = [];
    for (i = 0; i < sel.length; i++) all.push(sel[i]);
    all.sort(function (p, q) { return q.index - p.index; });             // bottom -> top
    // the preset starts at the first keyframe (or the earliest in-point)
    var t0 = 1e9, t1 = -1e9;
    function scan(g) {
        for (var n = 1; n <= g.numProperties; n++) {
            var p = g.property(n);
            if (p.propertyType === PropertyType.PROPERTY) { if (p.numKeys) { t0 = Math.min(t0, p.keyTime(1)); t1 = Math.max(t1, p.keyTime(p.numKeys)); } }
            else scan(p);
        }
    }
    for (i = 0; i < all.length; i++) for (j = 0; j < UK.LIB.GROUPS.length; j++) { var g = all[i].property(UK.LIB.GROUPS[j]); if (g) { try { scan(g); } catch (e) { } } }
    if (t0 > 1e8) { t0 = all[0].inPoint; for (k = 1; k < all.length; k++) t0 = Math.min(t0, all[k].inPoint); t1 = t0 + 1; }
    var data = { v: 1, name: a.name || all[all.length - 1].name, span: Math.max(0.1, t1 - t0), layers: [] };
    for (i = 0; i < all.length; i++) data.layers.push(UK.LIB.serLayer(all[i], t0, all));
    data.anim = data.layers.length === 1 && data.layers[0].type === "text";
    if (a.thumb) {
        try { comp.saveFrameToPng(Math.min(comp.duration - comp.frameDuration, t0 + data.span * 0.7), new File(a.thumb)); } catch (eT) { }
    }
    return { data: data };
};
UK.api.libApply = function (a) {
    var comp = UK.comp(true), data = a.data, t0 = UK.timeCTI(comp), i, j;
    if (!data || !data.layers || !data.layers.length) throw new Error("This preset is empty.");
    var targets = UK.selectedTextLayers(comp);
    if (data.anim && targets.length) {
        var src = data.layers[0], done = [];
        for (i = 0; i < targets.length; i++) {
            var L = targets[i], tr = L.property("ADBE Transform Group");
            var cur = { p: tr.property("ADBE Position").valueAtTime(t0, false), a: tr.property("ADBE Anchor Point").valueAtTime(t0, false) };
            for (j = 0; j < src.g.length; j++) {
                var g = src.g[j], gi = UK.LIB.groupIndex(L, g.m);
                if (!gi) continue;
                if (g.m === "ADBE Transform Group") {
                    // only what moves (keys / expressions); position-like keys follow this layer
                    UK.LIB.restore(L, [gi], g, t0, {
                        skip: function (c) { return !c.c && !c.k && c.x === undefined; },
                        shift: function (c) {
                            var base = c.m === "ADBE Position" ? "p" : (c.m === "ADBE Anchor Point" ? "a" : null);
                            if (!base || !src.base) return function (v) { return v; };
                            return function (v) { var o = [], n; for (n = 0; n < v.length; n++) o.push(v[n] - (src.base[base][n] || 0) + (cur[base][n] || 0)); return o; };
                        }
                    });
                } else if (g.m === "ADBE Text Properties") {
                    // the text animators (and their options), never the layer's own text
                    UK.LIB.restore(L, [gi], g, t0, { skip: function (c, depth) { return depth === 1 && c.m === "ADBE Text Document"; } });
                } else UK.LIB.restore(L, [gi], g, t0, {});
            }
            try { if (src.tdpc) L.threeDPerChar = true; } catch (e) { }
            done.push(L.name);
        }
        return { mode: "animation", layers: done };
    }
    // rebuild the layers (bottom -> top), keep their parenting, select them
    var made = [], host = comp.selectedLayers.length ? comp.selectedLayers[0] : null;
    for (i = 0; i < data.layers.length; i++) made.push(UK.LIB.makeLayer(comp, data.layers[i], t0));
    for (i = 0; i < data.layers.length; i++) {
        var o = data.layers[i];
        if (o.parent !== undefined) { try { made[i].parent = made[o.parent]; } catch (e1) { } }
        else if (o.ext) {
            // it rode on a layer that was not saved (e.g. an underline on its text): ride on the selected
            // layer the same way, or sit in the middle of the frame when nothing is selected
            if (host) { try { made[i].parent = host; var P0 = UK.pos(made[i]); if (!P0.numKeys) P0.setValue(o.base ? o.base.p : P0.value); } catch (e2) { } }
            else { try { var P1 = UK.pos(made[i]); if (!P1.numKeys) P1.setValue([comp.width / 2, comp.height / 2]); } catch (e3) { } }
        }
    }
    UK.selectOnly(comp, made);
    var names = [];
    for (i = 0; i < made.length; i++) names.push(made[i].name);
    return { mode: "layers", layers: names };
};

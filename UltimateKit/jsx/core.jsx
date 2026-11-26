/*  Ultimate Kit — core helpers (ExtendScript, ES3)
    Everything else in /jsx builds on these helpers.                      */

var UK = (typeof UK !== "undefined") ? UK : {};
UK.api = UK.api || {};
UK.ROOT_FOLDER = "Ultimate Kit";
UK.VERSION = "1.0.0";

/* ------------------------------------------------------------------ JSON */
UK._q = function (s) {
    s = String(s);
    var o = '"', i, ch, code;
    for (i = 0; i < s.length; i++) {
        ch = s.charAt(i);
        code = s.charCodeAt(i);
        if (ch === '"') o += '\\"';
        else if (ch === "\\") o += "\\\\";
        else if (ch === "\n") o += "\\n";
        else if (ch === "\r") o += "\\r";
        else if (ch === "\t") o += "\\t";
        else if (code < 32 || code === 8232 || code === 8233) o += "\\u" + ("0000" + code.toString(16)).slice(-4);
        else o += ch;
    }
    return o + '"';
};
UK.json = function (v) {
    var t = typeof v, i, a;
    if (v === null || v === undefined) return "null";
    if (t === "number") return isFinite(v) ? String(v) : "null";
    if (t === "boolean") return v ? "true" : "false";
    if (t === "string") return UK._q(v);
    if (v instanceof Array) {
        a = [];
        for (i = 0; i < v.length; i++) a.push(UK.json(v[i]));
        return "[" + a.join(",") + "]";
    }
    if (t === "object") {
        a = [];
        for (var k in v) {
            if (!v.hasOwnProperty(k) || typeof v[k] === "function") continue;
            a.push(UK._q(k) + ":" + UK.json(v[k]));
        }
        return "{" + a.join(",") + "}";
    }
    return "null";
};
UK.parse = function (s) { return (s === undefined || s === null || s === "") ? {} : eval("(" + s + ")"); };

/* ------------------------------------------------------- entry from panel */
UK.call = function (fn, argsJson) {
    var res;
    app.beginUndoGroup("Ultimate Kit: " + fn);
    try {
        var f = UK.api[fn];
        if (!f) throw new Error("Unknown command: " + fn);
        res = { ok: true, data: f(UK.parse(argsJson)) };
    } catch (e) {
        var where = "";
        try { if (e.line) where = " [" + String(e.fileName || "").replace(/^.*[\\\/]/, "") + ":" + e.line + "]"; } catch (e2) { }
        res = { ok: false, error: (e.message || e.toString()) + where };
    }
    app.endUndoGroup();
    return UK.json(res);
};

/* ------------------------------------------------------------- small math */
UK.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
UK.lerp = function (a, b, t) { return a + (b - a) * t; };
UK.rad = function (d) { return d * Math.PI / 180; };
UK.round = function (v, n) { var m = Math.pow(10, n || 0); return Math.round(v * m) / m; };
UK.pad = function (n, w) { var s = String(n); while (s.length < (w || 2)) s = "0" + s; return s; };
UK.rng = function (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};
UK.has = function (arr, v) { for (var i = 0; i < arr.length; i++) if (arr[i] === v) return true; return false; };

/* ----------------------------------------------------------------- colors */
UK.rgb = function (hex) {
    if (hex instanceof Array) return [hex[0], hex[1], hex[2]];
    hex = String(hex).replace("#", "");
    if (hex.length === 3) hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
    var n = parseInt(hex, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
UK.rgba = function (hex) { var c = UK.rgb(hex); return [c[0], c[1], c[2], 1]; };
UK.mix = function (h1, h2, t) {
    var a = UK.rgb(h1), b = UK.rgb(h2);
    return [UK.lerp(a[0], b[0], t), UK.lerp(a[1], b[1], t), UK.lerp(a[2], b[2], t)];
};
UK.toHex = function (c) {
    var s = "#";
    for (var i = 0; i < 3; i++) { var v = Math.round(UK.clamp(c[i], 0, 1) * 255).toString(16); s += (v.length < 2 ? "0" : "") + v; }
    return s;
};

/* ------------------------------------------------------------ project/comp */
UK.comp = function (create) {
    var c = app.project.activeItem;
    if (c && c instanceof CompItem) return c;
    if (!create) throw new Error("Open a composition first (click inside its timeline).");
    c = app.project.items.addComp("Ultimate Kit Comp", 1920, 1080, 1, 15, 30);
    c.parentFolder = UK.folder();
    c.openInViewer();
    return c;
};
UK._findFolder = function (parent, name) {
    for (var i = 1; i <= parent.numItems; i++) {
        var it = parent.item(i);
        if (it instanceof FolderItem && it.name === name) return it;
    }
    return null;
};
/* a folder of After Effects itself ("Presets", "Plug-ins"). Windows: inside "Support Files" (Folder.appPackage); macOS: next to the
   .app, so it is looked for from the package upwards */
UK.appFolder = function (sub) {
    var f = Folder.appPackage;
    for (var i = 0; i < 4 && f; i++) {
        var d = new Folder(f.fsName + "/" + sub);
        if (d.exists) return d;
        f = f.parent;
    }
    return new Folder(Folder.appPackage.fsName + "/" + sub);
};
UK.folder = function (sub) {
    var root = UK._findFolder(app.project.rootFolder, UK.ROOT_FOLDER);
    if (!root) root = app.project.items.addFolder(UK.ROOT_FOLDER);
    if (!sub) return root;
    var f = UK._findFolder(root, sub);
    if (!f) { f = app.project.items.addFolder(sub); f.parentFolder = root; }
    return f;
};
UK.newComp = function (name, host, dur, sub, w, h) {
    var fr = host ? host.frameRate : 30;
    var minDur = 2 / fr;
    var c = app.project.items.addComp(name,
        Math.round(w || (host ? host.width : 1920)),
        Math.round(h || (host ? host.height : 1080)),
        host ? host.pixelAspect : 1, Math.max(minDur, dur), fr);
    c.parentFolder = UK.folder(sub);
    return c;
};
UK.uniqueName = function (base) {
    var used = {}, i;
    for (i = 1; i <= app.project.numItems; i++) used[app.project.item(i).name] = true;
    if (!used[base]) return base;
    for (i = 2; i < 9999; i++) if (!used[base + " (" + i + ")"]) return base + " (" + i + ")";
    return base;
};
UK.layerNames = function (comp) {
    var o = {};
    for (var i = 1; i <= comp.numLayers; i++) o[comp.layer(i).name] = true;
    return o;
};
UK.uniqueLayerName = function (comp, base) {
    var used = UK.layerNames(comp);
    if (!used[base]) return base;
    for (var i = 2; i < 999; i++) if (!used[base + " " + i]) return base + " " + i;
    return base;
};
UK.place = function (host, item, t) {
    var L = host.layers.add(item);
    L.startTime = t || 0;
    return L;
};
UK.frame = function (comp) { return comp.frameDuration; };
UK.snap = function (comp, t) { var f = comp.frameDuration; return Math.round(t / f) * f; };

/* --------------------------------------------------------- property paths */
UK.p = function (base) {
    var p = base;
    for (var i = 1; i < arguments.length; i++) {
        if (!p) return null;
        try { p = p.property(arguments[i]); } catch (e) { return null; }
    }
    return p;
};
UK.tr = function (L, what) { return L.property("ADBE Transform Group").property(what); };
UK.pos = function (L) { return UK.tr(L, "ADBE Position"); };
UK.scale = function (L) { return UK.tr(L, "ADBE Scale"); };
UK.rot = function (L) { return UK.tr(L, "ADBE Rotate Z"); };
UK.opac = function (L) { return UK.tr(L, "ADBE Opacity"); };
UK.anchor = function (L) { return UK.tr(L, "ADBE Anchor Point"); };

/* ----------------------------------------------------------------- effects */
UK.fx = function (L, matchName, name) {
    var e = L.property("ADBE Effect Parade").addProperty(matchName);
    if (name) e.name = name;
    return e;
};
UK.efx = function (L, name) { return L.property("ADBE Effect Parade").property(name); };
/* setValue that keeps a number inside the parameter's own range (AE throws "out of range" otherwise) */
UK.safeSet = function (prop, v) {
    try { if (typeof v === "number" && prop.hasMin) v = UK.clamp(v, prop.minValue, prop.maxValue); } catch (e) { }
    prop.setValue(v);
    return prop;
};
/* runs build(); if it throws, removes the layers (by Layer.id) and project items it had made, so a failed Apply
   leaves nothing half-built. Only for builders that don't move the user's own layers (no precompose). */
UK.atomic = function (comp, build) {
    var lay = {}, items = {}, i;
    for (i = 1; i <= comp.numLayers; i++) { try { lay[comp.layer(i).id] = true; } catch (e0) { } }
    for (i = 1; i <= app.project.numItems; i++) items[app.project.item(i).id] = true;
    try { return build(); }
    catch (err) {
        try {
            for (i = comp.numLayers; i >= 1; i--) { var L = comp.layer(i); if (L.id !== undefined && !lay[L.id]) { L.locked = false; L.remove(); } }
            for (i = app.project.numItems; i >= 1; i--) { var it = app.project.item(i); if (!items[it.id] && (it.usedIn === undefined || it.usedIn.length === 0) && !(it instanceof FolderItem && it.numItems > 0)) it.remove(); }
        } catch (e1) { }
        throw err;
    }
};
UK.fxv = function (eff, param, val) { eff.property(param).setValue(val); return eff; };
/* ---------------------------------------------------- 2D transforms / anchors
   (user request: a precomp's anchor sits in the centre of what it shows, and applying a preset never moves
    the layer on screen)                                                                                   */
UK.posAt = function (L, t) {
    var tr = L.property("ADBE Transform Group"), pp = tr.property("ADBE Position");
    if (pp.dimensionsSeparated) return [tr.property("ADBE Position_0").valueAtTime(t, false), tr.property("ADBE Position_1").valueAtTime(t, false)];
    return pp.valueAtTime(t, false);
};
/* a point of the layer (layer space) in its parent's space (the comp's when there is no parent); 2D */
UK.toParent = function (L, p, t) {
    var tr = L.property("ADBE Transform Group"), A = tr.property("ADBE Anchor Point").valueAtTime(t, false), S = tr.property("ADBE Scale").valueAtTime(t, false);
    var R = tr.property("ADBE Rotate Z").valueAtTime(t, false) * Math.PI / 180, P = UK.posAt(L, t);
    var x = (p[0] - A[0]) * S[0] / 100, y = (p[1] - A[1]) * S[1] / 100;
    return [P[0] + x * Math.cos(R) - y * Math.sin(R), P[1] + x * Math.sin(R) + y * Math.cos(R)];
};
UK.toCompPt = function (L, p, t) { var q = UK.toParent(L, p, t); return L.parent ? UK.toCompPt(L.parent, q, t) : q; };
/* move a layer by d (parent space): every key, or the static value; untouched when Position has an expression */
UK.shiftPos = function (L, d) {
    var tr = L.property("ADBE Transform Group"), pp = tr.property("ADBE Position"), k;
    var mv = function (prop, dv) {
        if (prop.expression !== "" && prop.expressionEnabled) return;
        if (prop.numKeys > 0) { for (k = 1; k <= prop.numKeys; k++) { var v = prop.keyValue(k); prop.setValueAtKey(k, dv.length ? [v[0] + dv[0], v[1] + dv[1]].concat(v.length > 2 ? [v[2]] : []) : v + dv); } }
        else { var w = prop.value; prop.setValue(dv.length ? [w[0] + dv[0], w[1] + dv[1]].concat(w.length > 2 ? [w[2]] : []) : w + dv); }
    };
    if (pp.dimensionsSeparated) { mv(tr.property("ADBE Position_0"), d[0]); mv(tr.property("ADBE Position_1"), d[1]); }
    else mv(pp, d);
};
/* bounds (comp space) of what a comp shows at time t: visible layers only (no adjustment, null, camera, light,
   guide or hidden layers); null when nothing is there */
UK.contentBounds = function (C, t) {
    var b = null, i, j;
    for (i = 1; i <= C.numLayers; i++) {
        var L = C.layer(i);
        try {
            if (!L.enabled || L.guideLayer || L.adjustmentLayer || L.nullLayer || L instanceof CameraLayer || L instanceof LightLayer) continue;
            if (t < L.inPoint || t >= L.outPoint) continue;
            var r = L.sourceRectAtTime(t, false);
            if (!(r.width > 0 && r.height > 0)) continue;
            var cs = [[r.left, r.top], [r.left + r.width, r.top], [r.left, r.top + r.height], [r.left + r.width, r.top + r.height]];
            for (j = 0; j < 4; j++) {
                var q = UK.toCompPt(L, cs[j], t);
                if (!b) b = [q[0], q[1], q[0], q[1]];
                else { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }
            }
        } catch (e) { }
    }
    return b;
};
/* put a precomp layer's anchor in the centre of its content without moving anything on screen */
UK.centerAnchor = function (PL, t) {
    try {
        var C = PL.source;
        if (!(C instanceof CompItem)) return;
        var tr = PL.property("ADBE Transform Group"), ap = tr.property("ADBE Anchor Point");
        if (ap.numKeys > 0 || (ap.expression !== "" && ap.expressionEnabled)) return;
        var tl = t === undefined ? (PL.inPoint + PL.outPoint) / 2 : t, tc = (tl - PL.startTime) * (PL.stretch ? 100 / PL.stretch : 1);
        var b = UK.contentBounds(C, tc);
        if (!b) return;
        var c = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], A = ap.value;
        if (Math.abs(c[0] - A[0]) < 0.5 && Math.abs(c[1] - A[1]) < 0.5) return;
        var before = UK.toParent(PL, c, tl);
        ap.setValue(A.length > 2 ? [c[0], c[1], A[2]] : c);
        var after = UK.toParent(PL, c, tl);
        UK.shiftPos(PL, [before[0] - after[0], before[1] - after[1]]);
    } catch (e) { }
};
UK.slider = function (L, name, val) {
    UK.fx(L, "ADBE Slider Control", name).property(1).setValue(val);
    return UK.efx(L, name).property(1);
};
UK.colorCtl = function (L, name, hex) {
    UK.fx(L, "ADBE Color Control", name).property(1).setValue(UK.rgba(hex));
    return UK.efx(L, name).property(1);
};
UK.checkCtl = function (L, name, on) {
    UK.fx(L, "ADBE Checkbox Control", name).property(1).setValue(on ? 1 : 0);
    return UK.efx(L, name).property(1);
};
UK.pointCtl = function (L, name, pt) {
    UK.fx(L, "ADBE Point Control", name).property(1).setValue(pt);
    return UK.efx(L, name).property(1);
};
UK.essential = function (comp, prop, name) {
    try { if (prop.canAddToMotionGraphicsTemplate(comp)) prop.addToMotionGraphicsTemplateAs(comp, name); } catch (e) { }
};
/* Null with color controls, used by generated precomps; returns the null. */
UK.controlNull = function (comp, name, colors, essentialNames) {
    var N = comp.layers.addNull();
    N.name = name || "CONTROLS";
    N.label = 2;
    var i;
    for (i = 0; i < colors.length; i++) UK.colorCtl(N, "Color " + (i + 1), colors[i]);
    for (i = 0; i < colors.length; i++) {
        UK.essential(comp, UK.efx(N, "Color " + (i + 1)).property(1), (essentialNames && essentialNames[i]) || ("Color " + (i + 1)));
    }
    return N;
};
UK.colorExpr = function (ctlName, idx) {
    return 'thisComp.layer("' + ctlName + '").effect("Color ' + idx + '")(1)';
};

/* -------------------------------------------------------------- keyframes */
/*  Curve = [outInfluence of the segment's first key, inInfluence of its last key,
             outSpeed, inSpeed]  — speeds are multiples of the segment's average speed.
    These reproduce the classic easing families (cubic / quint / expo) as real AE
    keyframe speed-ramps, so the Graph Editor shows clean, editable curves.        */
UK.CURVES = {
    ease: [33.34, 33.34, 0, 0],      // AE "Easy Ease"
    smooth: [42, 42, 0, 0],          // sine in-out
    inout: [65, 65, 0, 0],           // cubic in-out
    inoutStrong: [82, 82, 0, 0],     // quint in-out
    soft: [45, 70, 0, 0],
    out: [33, 32, 3.0, 0],           // cubic out: enters fast, long gentle settle
    outSoft: [40, 55, 1.6, 0],       // quad-ish out
    quint: [22, 64, 4.5, 0],         // quint out
    expo: [16, 70, 6.2, 0],          // expo out
    "in": [32, 33, 0, 3.0],          // cubic in: starts gently, leaves fast
    inSoft: [55, 40, 0, 1.6],
    quintIn: [64, 22, 0, 4.5],
    expoIn: [70, 16, 0, 6.2]
};
UK._segVel = function (prop, v0, v1, dt, n) {
    if (dt <= 0) return 0;
    if (typeof v0 === "number") return (v1 - v0) / dt;
    if (!(v0 instanceof Array)) return 0;
    if (prop.propertyValueType === PropertyValueType.COLOR) return 0;
    var k;
    if (prop.isSpatial) {
        var d = 0;
        for (k = 0; k < v0.length; k++) d += Math.pow((v1[k] || 0) - (v0[k] || 0), 2);
        return Math.sqrt(d) / dt;
    }
    var a = [];
    for (k = 0; k < n; k++) a.push(((v1[k] || 0) - (v0[k] || 0)) / dt);
    return a;
};
UK._easeFor = function (n, infl, factor, vel) {
    var a = [];
    for (var d = 0; d < n; d++) {
        var v = (vel instanceof Array) ? (vel[d] || 0) : vel;
        a.push(new KeyframeEase(factor ? factor * v : 0, UK.clamp(infl, 0.1, 100)));
    }
    return a;
};
UK.dims = function (prop) {
    if (prop.isSpatial) return 1;
    var t = prop.propertyValueType;
    if (t === PropertyValueType.TwoD) return 2;
    if (t === PropertyValueType.ThreeD) return 3;
    return 1;
};
UK.easeArr = function (n, infl, speed) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(new KeyframeEase(speed || 0, UK.clamp(infl, 0.1, 100)));
    return a;
};
UK._seg = function (curves, i) {
    var c = (curves instanceof Array) ? curves[Math.min(i, curves.length - 1)] : curves;
    if (c === undefined || c === null) c = "smooth";
    if (c instanceof Array) return c;
    if (c === "linear" || c === "hold") return c;
    return UK.CURVES[c] || UK.CURVES.smooth;
};
/*  keys: [[time, value], ...]   curves: name | [name per segment] | [outInfl,inInfl]
    opts.straight (default true for spatial): straight motion paths
    opts.expr: expression to set afterwards                                      */
UK.anim = function (prop, keys, curves, opts) {
    opts = opts || {};
    var i, idx = [], fd = UK._fd || (1 / 30);
    for (i = 1; i < keys.length; i++) {           // keep key times strictly increasing (short durations + frame snapping)
        if (keys[i][0] < keys[i - 1][0] + fd * 0.5) keys[i] = [keys[i - 1][0] + fd, keys[i][1]];
    }
    for (i = 0; i < keys.length; i++) prop.setValueAtTime(keys[i][0], keys[i][1]);
    for (i = 0; i < keys.length; i++) idx.push(prop.nearestKeyIndex(keys[i][0]));
    var n = UK.dims(prop);
    var B = KeyframeInterpolationType.BEZIER, LIN = KeyframeInterpolationType.LINEAR, H = KeyframeInterpolationType.HOLD;
    for (i = 0; i < keys.length; i++) {
        var k = idx[i];
        var cin = i > 0 ? UK._seg(curves, i - 1) : null;
        var cout = i < keys.length - 1 ? UK._seg(curves, i) : null;
        var inInfl = (cin instanceof Array) ? cin[1] : 33.34;
        var outInfl = (cout instanceof Array) ? cout[0] : 33.34;
        var inF = (cin instanceof Array) ? (cin[3] || 0) : 0;
        var outF = (cout instanceof Array) ? (cout[2] || 0) : 0;
        var vin = inF ? UK._segVel(prop, keys[i - 1][1], keys[i][1], keys[i][0] - keys[i - 1][0], n) : 0;
        var vout = outF ? UK._segVel(prop, keys[i][1], keys[i + 1][1], keys[i + 1][0] - keys[i][0], n) : 0;
        try { prop.setTemporalEaseAtKey(k, UK._easeFor(n, inInfl, inF, vin), UK._easeFor(n, outInfl, outF, vout)); }
        catch (e1) { try { prop.setTemporalEaseAtKey(k, UK.easeArr(n, inInfl), UK.easeArr(n, outInfl)); } catch (e1b) { } }
        var tin = (cin === "linear") ? LIN : B;
        var tout = (cout === "linear") ? LIN : (cout === "hold" ? H : B);
        if (cin === null) tin = (cout === "linear") ? LIN : B;
        if (cout === null) tout = (cin === "linear") ? LIN : B;
        try { prop.setInterpolationTypeAtKey(k, tin, tout); } catch (e2) { }
        if (prop.isSpatial && opts.straight !== false) {
            try {
                var z = (keys[i][1].length === 3) ? [0, 0, 0] : [0, 0];
                prop.setSpatialAutoBezierAtKey(k, false);
                prop.setSpatialContinuousAtKey(k, false);
                prop.setSpatialTangentsAtKey(k, z, z);
            } catch (e3) { }
        }
    }
    if (opts.expr) prop.expression = opts.expr;
    return prop;
};
/* Smooth continuous motion through all keys (floating/drifting). */
UK.float = function (prop, keys, loop) {
    var i;
    for (i = 0; i < keys.length; i++) prop.setValueAtTime(keys[i][0], keys[i][1]);
    for (i = 1; i <= prop.numKeys; i++) {
        try {
            prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            prop.setTemporalContinuousAtKey(i, true);
            prop.setTemporalAutoBezierAtKey(i, true);
            if (prop.isSpatial) { prop.setSpatialContinuousAtKey(i, true); prop.setSpatialAutoBezierAtKey(i, true); }
        } catch (e) { }
    }
    if (loop) prop.expression = 'loopOut("cycle")';
    return prop;
};
/* Enter -> hold -> exit helper: a single property going a -> b (in), b -> c (out) */
UK.inOut = function (prop, t0, t1, t2, t3, a, b, c, cin, cout) {
    var keys = [[t0, a], [t1, b]], curves = [cin || "out"];
    var hasOut = (t3 !== null && t3 !== undefined);
    if (hasOut && t2 > t1 + 0.0001) { keys.push([t2, b]); curves.push("linear"); }   // still segment between equal values
    if (hasOut) { keys.push([t3, c]); curves.push(cout || "in"); }
    return UK.anim(prop, keys, curves);
};

/* ------------------------------------------------------------------ shapes */
UK.shapeLayer = function (comp, name) { var L = comp.layers.addShape(); if (name) L.name = name; return L; };
UK.root = function (L) { return L.property("ADBE Root Vectors Group"); };
UK.group = function (contents, name) { var g = contents.addProperty("ADBE Vector Group"); if (name) g.name = name; return g; };
UK.vecs = function (g) { return g.property("ADBE Vectors Group"); };
UK.gtr = function (g, what) { var t = g.property("ADBE Vector Transform Group"); return what ? t.property(what) : t; };
UK.addRect = function (vecs, size, pos, round, name) {
    var r = vecs.addProperty("ADBE Vector Shape - Rect");
    if (name) r.name = name;
    r.property("ADBE Vector Rect Size").setValue(size);
    if (pos) r.property("ADBE Vector Rect Position").setValue(pos);
    if (round) r.property("ADBE Vector Rect Roundness").setValue(round);
    return r;
};
UK.addEllipse = function (vecs, size, pos, name) {
    var e = vecs.addProperty("ADBE Vector Shape - Ellipse");
    if (name) e.name = name;
    e.property("ADBE Vector Ellipse Size").setValue(size);
    if (pos) e.property("ADBE Vector Ellipse Position").setValue(pos);
    return e;
};
UK.addStar = function (vecs, o, name) {
    var s = vecs.addProperty("ADBE Vector Shape - Star");
    if (name) s.name = name;
    s.property("ADBE Vector Star Type").setValue(o.polygon ? 2 : 1);
    s.property("ADBE Vector Star Points").setValue(o.points || 5);
    s.property("ADBE Vector Star Outer Radius").setValue(o.outer || 100);
    if (!o.polygon) s.property("ADBE Vector Star Inner Radius").setValue(o.inner || 50);
    if (o.rotation) s.property("ADBE Vector Star Rotation").setValue(o.rotation);
    if (o.outerRound) s.property("ADBE Vector Star Outer Roundess").setValue(o.outerRound);
    if (o.innerRound && !o.polygon) s.property("ADBE Vector Star Inner Roundess").setValue(o.innerRound);
    if (o.pos) s.property("ADBE Vector Star Position").setValue(o.pos);
    return s;
};
UK.zeros = function (n) { var a = []; for (var i = 0; i < n; i++) a.push([0, 0]); return a; };
UK.makeShape = function (verts, inT, outT, closed) {
    var s = new Shape();
    s.vertices = verts;
    s.inTangents = inT || UK.zeros(verts.length);
    s.outTangents = outT || UK.zeros(verts.length);
    s.closed = (closed !== false);
    return s;
};
UK.addPath = function (vecs, verts, inT, outT, closed, name) {
    var p = vecs.addProperty("ADBE Vector Shape - Group");
    if (name) p.name = name;
    p.property("ADBE Vector Shape").setValue(UK.makeShape(verts, inT, outT, closed));
    return p;
};
UK.addFill = function (vecs, hex, opacity, name) {
    var f = vecs.addProperty("ADBE Vector Graphic - Fill");
    if (name) f.name = name;
    f.property("ADBE Vector Fill Color").setValue(UK.rgba(hex));
    if (opacity !== undefined && opacity !== null) f.property("ADBE Vector Fill Opacity").setValue(opacity);
    return f;
};
UK.addStroke = function (vecs, hex, width, o, name) {
    o = o || {};
    var s = vecs.addProperty("ADBE Vector Graphic - Stroke");
    if (name) s.name = name;
    s.property("ADBE Vector Stroke Color").setValue(UK.rgba(hex));
    s.property("ADBE Vector Stroke Width").setValue(width);
    if (o.cap) s.property("ADBE Vector Stroke Line Cap").setValue(o.cap);   // 1 butt 2 round 3 square
    if (o.join) s.property("ADBE Vector Stroke Line Join").setValue(o.join); // 1 miter 2 round 3 bevel
    if (o.opacity !== undefined) s.property("ADBE Vector Stroke Opacity").setValue(o.opacity);
    return s;
};
UK.addGradFill = function (vecs, radial, start, end, name) {
    var g = vecs.addProperty("ADBE Vector Graphic - G-Fill");
    if (name) g.name = name;
    g.property("ADBE Vector Grad Type").setValue(radial ? 2 : 1);
    g.property("ADBE Vector Grad Start Pt").setValue(start);
    g.property("ADBE Vector Grad End Pt").setValue(end);
    return g;
};
UK.addTrim = function (vecs, name) {
    var t = vecs.addProperty("ADBE Vector Filter - Trim");
    if (name) t.name = name;
    return t;
};
UK.addRepeater = function (vecs, copies, pos, name) {
    var r = vecs.addProperty("ADBE Vector Filter - Repeater");
    if (name) r.name = name;
    r.property("ADBE Vector Repeater Copies").setValue(copies);
    r.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue(pos);
    return r;
};
UK.addZigzag = function (vecs, size, ridges, smooth) {
    var z = vecs.addProperty("ADBE Vector Filter - Zigzag");
    z.property("ADBE Vector Zigzag Size").setValue(size);
    z.property("ADBE Vector Zigzag Detail").setValue(ridges);
    z.property("ADBE Vector Zigzag Points").setValue(smooth ? 2 : 1);
    return z;
};
UK.addRoughen = function (vecs, size, detail, wps, seed) {
    var r = vecs.addProperty("ADBE Vector Filter - Roughen");
    r.property("ADBE Vector Roughen Size").setValue(size);
    r.property("ADBE Vector Roughen Detail").setValue(detail);
    r.property("ADBE Vector Roughen Points").setValue(2);
    r.property("ADBE Vector Temporal Freq").setValue(wps);
    if (seed) r.property("ADBE Vector Random Seed").setValue(seed);
    return r;
};
/* Polygon helpers in local space */
UK.rotPt = function (p, deg) {
    var a = UK.rad(deg), c = Math.cos(a), s = Math.sin(a);
    return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
/* Screen extents along/perpendicular to a direction (deg) */
UK.extents = function (W, H, deg) {
    var a = UK.rad(deg), c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    return { along: W * c + H * s, across: W * s + H * c };
};

/* ------------------------------------------------------------------- text */
UK.FONT_CANDIDATES = ["Inter-SemiBold", "InterDisplay-SemiBold", "Inter-Bold", "Manrope-SemiBold", "PlusJakartaSans-SemiBold",
    "Poppins-SemiBold", "Montserrat-SemiBold", "SFProDisplay-Semibold", "HelveticaNeue-Medium", "SegoeUI-Semibold", "Arial-BoldMT"];
UK._font = null;
UK.font = function () {
    if (UK._font) return UK._font;
    var pick = "Arial-BoldMT";
    try {
        if (app.fonts && app.fonts.getFontsByPostScriptName) {
            for (var i = 0; i < UK.FONT_CANDIDATES.length; i++) {
                var a = app.fonts.getFontsByPostScriptName(UK.FONT_CANDIDATES[i]);
                if (a && a.length) { pick = UK.FONT_CANDIDATES[i]; break; }
            }
        }
    } catch (e) { }
    UK._font = pick;
    return pick;
};
UK.textDoc = function (L) { return L.property("ADBE Text Properties").property("ADBE Text Document"); };
UK.addText = function (comp, str, o) {
    o = o || {};
    var L = comp.layers.addText(str);
    var td = UK.textDoc(L);
    var d = td.value;
    try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e) { }
    d.font = o.font || UK.font();
    d.fontSize = o.size || Math.round(comp.height * 0.1);
    d.applyFill = true;
    d.fillColor = UK.rgb(o.color || "#FFFFFF");
    d.applyStroke = false;
    d.tracking = (o.tracking !== undefined) ? o.tracking : -10;
    d.justification = ParagraphJustification.CENTER_JUSTIFY;
    td.setValue(d);
    if (o.name) L.name = o.name;
    UK.centerText(L, comp, o.pos);
    return L;
};
UK.centerText = function (L, comp, pos) {
    var r = L.sourceRectAtTime(L.inPoint, false);
    UK.anchor(L).setValue([r.left + r.width / 2, r.top + r.height / 2]);
    UK.pos(L).setValue(pos || [comp.width / 2, comp.height / 2]);
};
UK.selectedTextLayers = function (comp) {
    var out = [], s = comp.selectedLayers;
    for (var i = 0; i < s.length; i++) if (s[i] instanceof TextLayer) out.push(s[i]);
    return out;
};

/* ----------------------------------------------------------- layer utils */
UK.bounds = function (L, t) {
    try {
        var r = L.sourceRectAtTime(t === undefined ? L.containingComp.time : t, false);
        if (r.width > 0 && r.height > 0) return r;
    } catch (e) { }
    if (L.source && L.source.width) return { left: 0, top: 0, width: L.source.width, height: L.source.height };
    return { left: -50, top: -50, width: 100, height: 100 };
};
/* Layer bounds in comp space (approx: uses current scale, ignores rotation) */
UK.compBounds = function (L, t) {
    var r = UK.bounds(L, t);
    var tt = (t === undefined) ? L.containingComp.time : t;
    var a = UK.anchor(L).valueAtTime(tt, false), p = UK.pos(L).valueAtTime(tt, false), s = UK.scale(L).valueAtTime(tt, false);
    var sx = s[0] / 100, sy = s[1] / 100;
    var x = p[0] + (r.left - a[0]) * sx, y = p[1] + (r.top - a[1]) * sy;
    return { left: x, top: y, width: r.width * Math.abs(sx), height: r.height * Math.abs(sy), cx: x + r.width * sx / 2, cy: y + r.height * sy / 2 };
};
UK.moveAfter = function (L, ref) { try { L.moveAfter(ref); } catch (e) { } };
UK.selectOnly = function (comp, layers) {
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    for (var j = 0; j < layers.length; j++) layers[j].selected = true;
};
UK.timeCTI = function (comp) { return UK.snap(comp, comp.time); };

/* ------------------------------------------------------- basic API calls */
UK.api.ping = function () {
    return { version: UK.VERSION, ae: app.version, font: UK.font() };
};
UK.api.listLayers = function () {
    var c = app.project.activeItem;
    if (!(c && c instanceof CompItem)) return { comp: null, layers: [] };
    var out = [];
    for (var i = 1; i <= c.numLayers; i++) {
        var L = c.layer(i);
        out.push({ index: i, name: L.name, selected: L.selected, type: (L instanceof TextLayer) ? "text" : (L instanceof ShapeLayer ? "shape" : (L.nullLayer ? "null" : "av")) });
    }
    return { comp: c.name, layers: out };
};

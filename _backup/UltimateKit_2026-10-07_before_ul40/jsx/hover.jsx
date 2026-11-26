/*  Ultimate Kit - Hover
    Make Layers Hover:
      selected layers -> precomp "Hover Group N" + a "HOVER CONTROLS" null inside it.
      Every hovered layer gets:
        UK Hover            slider: 0..100, how much the cursor is touching it (smoothed)
        UK Hover Fill       (optional) colour fill that fades in on hover
        UK Hover Gradient   (optional) gradient fill that fades in on hover
        UK Hover Transform  Transform effect: hovered scale, move up, push-away, click press
      and (optional) a stroke that grows on hover.
    The cursor is the layer named in the expressions (default "Cursor") in the main comp;
    "Make Cursor" creates it and relinks every hover group automatically.
    Defaults are measured from your layout, so nothing jumps or collapses when applied.  */

UK.HV = {};
UK.HV.CTRL = "HOVER CONTROLS";

UK.HV.header = function (main, group, cursor) {
    return 'var MAIN = "' + main.replace(/"/g, '\\"') + '", GROUP = "' + group.replace(/"/g, '\\"') + '", CURSOR = "' + cursor.replace(/"/g, '\\"') + '";\n';
};
UK.HV.isVector = function (L) { return (L instanceof ShapeLayer) || (L instanceof TextLayer); };

/* detect whether an effect's percentage parameter is stored 0..1 or 0..100 */
UK.HV.pctScale = function (prop) {
    try { prop.setValue(100); prop.setValue(0); return 100; } catch (e) { return 1; }
};

UK.HV.exprAmount = function (H) {
    return H + [
        'var C = thisComp.layer("' + UK.HV.CTRL + '");',
        'var R = Math.max(1, C.effect("Hover Radius")(1));',
        'var win = clamp(C.effect("Smoothness")(1), 0, 100) / 100 * 0.6;',
        'var fd = thisComp.frameDuration;',
        'var M = null, P = null, cur = null;',
        'try { M = comp(MAIN); P = M.layer(GROUP); cur = M.layer(CURSOR); } catch (err) { cur = null; }',
        'function prox(t) {',
        '  var tm = t + P.startTime;',
        '  var tip = cur.toComp(cur.transform.anchorPoint.valueAtTime(tm), tm);',
        '  var p = P.fromComp(tip, tm);',
        '  var r = sourceRectAtTime(t, false);',
        '  var a = toComp([r.left, r.top], t), b = toComp([r.left + r.width, r.top + r.height], t);',
        '  var dx = Math.max(Math.min(a[0], b[0]) - p[0], 0, p[0] - Math.max(a[0], b[0]));',
        '  var dy = Math.max(Math.min(a[1], b[1]) - p[1], 0, p[1] - Math.max(a[1], b[1]));',
        '  return clamp(1 - Math.sqrt(dx * dx + dy * dy) / R, 0, 1);',
        '}',
        'var h = 0;',
        'if (cur != null) {',
        '  var n = Math.max(1, Math.round(win / fd)), acc = 0, ws = 0;',
        '  for (var i = 0; i < n; i++) { var w = n - i; acc += prox(time - i * fd) * w; ws += w; }',
        '  h = acc / ws;',
        '  h = h * h * (3 - 2 * h);',
        '}',
        'h * 100;'
    ].join("\n");
};
UK.HV.exprCenter = function (vector) {
    return 'var r = sourceRectAtTime(time, false);\nvar c = [r.left + r.width / 2, r.top + r.height / 2];\n' + (vector ? 'toComp(c);' : 'c;');
};
UK.HV.exprPosition = function (H, vector) {
    return H + [
        'var C = thisComp.layer("' + UK.HV.CTRL + '");',
        'var h = effect("UK Hover")(1) / 100;',
        'var r = sourceRectAtTime(time, false);',
        'var c = [r.left + r.width / 2, r.top + r.height / 2];',
        'var me = toComp(c);',
        'var off = [0, -C.effect("Move Up")(1) * h];',
        'var amt = C.effect("Push Others")(1), Rr = Math.max(1, C.effect("Hover Radius")(1));',
        'if (amt != 0) {',
        '  for (var i = 1; i <= thisComp.numLayers; i++) {',
        '    if (i == index) continue;',
        '    var L = thisComp.layer(i), hv = 0;',
        '    try { hv = L.effect("UK Hover")(1) / 100; } catch (e) { hv = 0; }',
        '    if (hv < 0.001) continue;',
        '    var rr = L.sourceRectAtTime(time, false);',
        '    var oc = L.toComp([rr.left + rr.width / 2, rr.top + rr.height / 2]);',
        '    var d = sub(me, oc), len = length(d);',
        '    if (len < 0.001) continue;',
        '    var fall = clamp(1 - len / (Rr * 6 + rr.width * 2), 0, 1);',
        '    off = add(off, mul(d, amt * hv * fall / len));',
        '  }',
        '}',
        vector ? 'add(me, off);' : 'var s = transform.scale.value;\nadd(c, [off[0] / Math.max(0.01, s[0] / 100), off[1] / Math.max(0.01, s[1] / 100)]);'
    ].join("\n");
};
UK.HV.exprScale = function (H) {
    return H + [
        'var C = thisComp.layer("' + UK.HV.CTRL + '");',
        'var h = effect("UK Hover")(1) / 100;',
        'var ds = C.effect("Default Scale")(1), hs = C.effect("Hovered Scale")(1);',
        'var s = ds + (hs - ds) * h;',
        'var press = 0;',
        'try {',
        '  var M = comp(MAIN), P = M.layer(GROUP), cur = M.layer(CURSOR);',
        '  var tm = time + P.startTime;',
        '  if (h > 0.001 && cur.marker.numKeys > 0) {',
        '    var n = cur.marker.nearestKey(tm).index;',
        '    if (cur.marker.key(n).time > tm) n--;',
        '    if (n > 0) {',
        '      var pd = 0.3; try { pd = cur.effect("Press Duration")(1) / Math.max(0.01, cur.effect("Click Speed")(1) / 100); } catch (e2) { }',
        '      var u = (tm - cur.marker.key(n).time) / Math.max(0.05, pd * 1.3);',
        '      if (u >= 0 && u < 1) press = (0.5 - 0.5 * Math.cos(2 * Math.PI * u)) * C.effect("Click Press")(1) / 100 * h;',
        '    }',
        '  }',
        '} catch (e) { }',
        's * (1 - press);'
    ].join("\n");
};

/* ------------------------------------------------- per-layer installers */
UK.HV.installCore = function (L, H) {
    var vec = UK.HV.isVector(L);
    UK.slider(L, "UK Hover", 0);
    UK.efx(L, "UK Hover").property(1).expression = UK.HV.exprAmount(H);
    var T = UK.fx(L, "ADBE Geometry2", "UK Hover Transform");
    T = UK.efx(L, "UK Hover Transform");
    T.property("ADBE Geometry2-0001").expression = UK.HV.exprCenter(vec);
    T.property("ADBE Geometry2-0002").expression = UK.HV.exprPosition(H, vec);
    T.property("ADBE Geometry2-0003").expression = UK.HV.exprScale(H);
    try { T.property("ADBE Geometry2-0009").setValue(0); T.property("ADBE Geometry2-0010").setValue(180); } catch (e) { }
};
/*  Hover colour: a Gradient Ramp blended over the layer (it keeps the layer's alpha).
    Solid colour = both ramp colours equal; "Use Gradient" switches the end colour.      */
UK.HV.installFill = function (L) {
    if (UK.efx(L, "UK Hover Fill")) return;
    var vec = UK.HV.isVector(L);
    UK.fx(L, "ADBE Ramp", "UK Hover Fill");
    var sc = 100;                       // expressions use display units (percent), scripting uses 0..1
    var G = UK.efx(L, "UK Hover Fill");
    G.property("ADBE Ramp-0007").setValue(1);
    var C = 'thisComp.layer("' + UK.HV.CTRL + '")';
    var conv = vec ? 'toComp' : '';
    G.property("ADBE Ramp-0001").expression = 'var r = sourceRectAtTime(time, false);\n' + conv + '([r.left, r.top]);';
    G.property("ADBE Ramp-0003").expression = 'var r = sourceRectAtTime(time, false);\n' + conv + '([r.left + r.width, r.top + r.height]);';
    G.property("ADBE Ramp-0002").expression = C + '.effect("Fill Color")(1);';
    G.property("ADBE Ramp-0004").expression = 'var C = ' + C + ';\n(C.effect("Use Gradient")(1) == 1) ? C.effect("Fill Color 2")(1) : C.effect("Fill Color")(1);';
    G.property("ADBE Ramp-0007").expression = 'var C = ' + C + ';\nvar k = effect("UK Hover")(1) / 100 * C.effect("Hover Fill")(1) * C.effect("Fill Opacity")(1) / 100;\n(1 - clamp(k, 0, 1)) * ' + sc + ';';
    UK.efx(L, "UK Hover Fill").moveTo(2);
};
UK.HV.installGradient = UK.HV.installFill;
UK.HV.installStroke = function (L) {
    var C = 'thisComp.layer("' + UK.HV.CTRL + '")';
    if (L instanceof ShapeLayer) {
        // a stroke only reaches paths in its own group, so add one at the end of every top-level group
        var R = UK.root(L), targets = [], i;
        for (i = 1; i <= R.numProperties; i++) if (R.property(i).matchName === "ADBE Vector Group") targets.push(R.property(i).name);
        var wExpr = 'var C = ' + C + ';\nC.effect("Hover Stroke")(1) * C.effect("Stroke Width")(1) * effect("UK Hover")(1) / 100 / Math.max(0.01, transform.scale[0] / 100);';
        var addTo = function (vecs) {
            if (vecs.property("UK Hover Stroke")) return;
            UK.addStroke(vecs, "#FFFFFF", 0, { join: 2 }, "UK Hover Stroke");
            var s = vecs.property("UK Hover Stroke");
            s.property("ADBE Vector Stroke Color").expression = C + '.effect("Stroke Color")(1);';
            s.property("ADBE Vector Stroke Width").expression = wExpr;
        };
        for (i = 0; i < targets.length; i++) addTo(UK.vecs(UK.root(L).property(targets[i])));
        if (!targets.length) addTo(UK.root(L));
        return true;
    }
    if (L instanceof TextLayer) {
        if (UK.TX.animators(L).property("UK Hover Stroke")) return true;
        var td = UK.textDoc(L), d = td.value;
        d.applyStroke = true;
        try { d.strokeWidth = 0.01; d.strokeOverFill = false; } catch (e) { }
        td.setValue(d);
        var an = UK.TX.animator(L, "UK Hover Stroke", {}, { based: 1, shape: 1, start: 0, end: 100 });
        var P = function () { return an.group().property("ADBE Text Animator Properties"); };
        P().addProperty("ADBE Text Stroke Width");
        P().property("ADBE Text Stroke Width").expression = 'var C = ' + C + ';\nC.effect("Hover Stroke")(1) * C.effect("Stroke Width")(1) * effect("UK Hover")(1) / 100;';
        P().addProperty("ADBE Text Stroke Color");
        P().property("ADBE Text Stroke Color").expression = C + '.effect("Stroke Color")(1);';
        return true;
    }
    return false;
};

/* controls on the null */
UK.HV.ensureControls = function (N, a) {
    function sl(n, v) { if (!UK.efx(N, n)) UK.slider(N, n, v); }
    function cc(n, v) { if (!UK.efx(N, n)) UK.colorCtl(N, n, v); }
    function cb(n, v) { if (!UK.efx(N, n)) UK.checkCtl(N, n, v); }
    sl("Default Scale", 100);
    sl("Hovered Scale", a.hoveredScale || 112);
    sl("Hover Radius", a.radius || 60);
    sl("Smoothness", 45);
    sl("Move Up", a.moveUp || 8);
    sl("Push Others", a.push || 0);
    sl("Click Press", 8);
    if (a.fill || a.gradient) {
        cb("Hover Fill", true);
        cb("Use Gradient", !!a.gradient);
        cc("Fill Color", a.fillColor || "#7C5CFF");
        cc("Fill Color 2", a.fillColor2 || "#22D3EE");
        sl("Fill Opacity", 100);
    }
    if (a.stroke) {
        cb("Hover Stroke", true);
        cc("Stroke Color", a.strokeColor || "#FFFFFF");
        sl("Stroke Width", a.strokeWidth || 4);
    }
};

UK.HV.hoveredLayers = function (comp) {
    var out = [];
    for (var i = 1; i <= comp.numLayers; i++) if (UK.efx(comp.layer(i), "UK Hover")) out.push(comp.layer(i));
    return out;
};

/* ---------------------------------------------------------- Make Layers Hover */
UK.api.hoverMake = function (a) {
    var comp = UK.comp(false);
    var sel = comp.selectedLayers;
    if (!sel.length) throw new Error("Select the layers that should react to the cursor.");
    // measure the layout BEFORE precomposing
    var sw = 0, sh = 0, xs = [];
    for (var i = 0; i < sel.length; i++) {
        var b = UK.compBounds(sel[i]);
        sw += b.width; sh += b.height; xs.push(b);
    }
    var aw = sw / sel.length, ah = sh / sel.length;
    var gap = 0;
    if (sel.length > 1) {
        var best = 1e9;
        for (i = 0; i < xs.length; i++) for (var j = i + 1; j < xs.length; j++) {
            var dd = Math.sqrt(Math.pow(xs[i].cx - xs[j].cx, 2) + Math.pow(xs[i].cy - xs[j].cy, 2));
            if (dd < best) best = dd;
        }
        gap = best;
    }
    var idx = [];
    for (i = 0; i < sel.length; i++) idx.push(sel[i].index);
    var gname = UK.uniqueLayerName(comp, "Hover Group");
    var pname = UK.uniqueName(gname);
    var HC = comp.layers.precompose(idx, pname, true);
    HC.parentFolder = UK.folder("Hover");
    var GL = null;
    for (i = 1; i <= comp.numLayers; i++) if (comp.layer(i).source === HC) GL = comp.layer(i);
    GL.name = gname;
    var N = HC.layers.addNull();
    N.name = UK.HV.CTRL;
    N.label = 2;
    UK.HV.ensureControls(N, {
        hoveredScale: (Math.max(aw, ah) > 400) ? 108 : 114,
        radius: Math.round(UK.clamp(Math.min(aw, ah) * 0.5, 20, 400)),
        moveUp: Math.round(UK.clamp(ah * 0.07, 2, 60)),
        push: sel.length > 1 ? Math.round(UK.clamp(gap * 0.09, 2, 80)) : 0,
        fill: a.fill === "color" || a.fill === "gradient", gradient: a.fill === "gradient",
        fillColor: a.fillColor, fillColor2: a.fillColor2,
        stroke: !!a.stroke, strokeColor: a.strokeColor, strokeWidth: Number(a.strokeWidth) || 4
    });
    var H = UK.HV.header(comp.name, gname, a.cursor || UK.HV.findCursor(comp) || "Cursor");
    var skipped = [];
    for (i = 1; i <= HC.numLayers; i++) {
        var L = HC.layer(i);
        if (L.name === UK.HV.CTRL || L.nullLayer || (L instanceof CameraLayer) || (L instanceof LightLayer) || L.adjustmentLayer) continue;
        UK.HV.installCore(L, H);
        if (a.fill === "color" || a.fill === "gradient") { UK.HV.installFill(L); UK.HV.installGradient(L); }
        if (a.stroke && !UK.HV.installStroke(L)) skipped.push(L.name);
    }
    N.moveToBeginning();
    UK.selectOnly(comp, [GL]);
    return { group: gname, layers: sel.length, strokeSkipped: skipped, cursor: UK.HV.findCursor(comp) };
};

/* the cursor made by Make Cursor carries a "Press Duration" effect */
UK.HV.findCursor = function (comp) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var L = comp.layer(i);
        if (L.comment === "UK cursor") return L.name;
    }
    return null;
};

/* ------------------------------------------- add fill / stroke afterwards */
UK.HV.resolveGroup = function () {
    var comp = UK.comp(false);
    var sel = comp.selectedLayers;
    for (var i = 0; i < sel.length; i++) {
        if (sel[i].name === UK.HV.CTRL) return { hc: comp, N: sel[i] };
        if (sel[i].source && sel[i].source instanceof CompItem) {
            var s = sel[i].source;
            for (var k = 1; k <= s.numLayers; k++) if (s.layer(k).name === UK.HV.CTRL) return { hc: s, N: s.layer(k) };
        }
    }
    throw new Error("Select the HOVER CONTROLS null (or the Hover Group layer) first.");
};
UK.api.hoverAdd = function (a) {
    var r = UK.HV.resolveGroup();
    var what = a.what;
    UK.HV.ensureControls(r.N, {
        fill: what === "fill" || what === "gradient", gradient: what === "gradient",
        fillColor: a.fillColor, fillColor2: a.fillColor2,
        stroke: what === "stroke", strokeColor: a.strokeColor, strokeWidth: Number(a.strokeWidth) || 4
    });
    if (what === "gradient") UK.efx(r.N, "Use Gradient").property(1).setValue(1);
    var Ls = UK.HV.hoveredLayers(r.hc), skipped = [];
    for (var i = 0; i < Ls.length; i++) {
        if (what === "fill" || what === "gradient") { UK.HV.installFill(Ls[i]); UK.HV.installGradient(Ls[i]); }
        if (what === "stroke" && !UK.HV.installStroke(Ls[i])) skipped.push(Ls[i].name);
    }
    // keep the transform effect last so it scales the coloured result
    for (i = 0; i < Ls.length; i++) { var T = UK.efx(Ls[i], "UK Hover Transform"); if (T) T.moveTo(Ls[i].property("ADBE Effect Parade").numProperties); }
    return { layers: Ls.length, added: what, strokeSkipped: skipped };
};

/* ---------------------------------- point every hover group at the cursor */
UK.HV.relinkComp = function (comp, cursorName) {
    var n = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
        var GL = comp.layer(i);
        if (!(GL.source && GL.source instanceof CompItem)) continue;
        var hc = GL.source, has = false;
        for (var k = 1; k <= hc.numLayers; k++) if (hc.layer(k).name === UK.HV.CTRL) has = true;
        if (!has) continue;
        var H = UK.HV.header(comp.name, GL.name, cursorName);
        var Ls = UK.HV.hoveredLayers(hc);
        for (var j = 0; j < Ls.length; j++) {
            var props = [UK.efx(Ls[j], "UK Hover").property(1)];
            var T = UK.efx(Ls[j], "UK Hover Transform");
            if (T) { props.push(T.property("ADBE Geometry2-0002")); props.push(T.property("ADBE Geometry2-0003")); }
            for (var q = 0; q < props.length; q++) {
                var ex = props[q].expression;
                if (ex && ex.indexOf("var MAIN = ") === 0) { props[q].expression = H + ex.substr(ex.indexOf("\n") + 1); n++; }
            }
        }
    }
    return n;
};
UK.api.hoverRelink = function (a) {
    var comp = UK.comp(false);
    var cur = a.cursor || UK.HV.findCursor(comp);
    if (!cur) throw new Error("No cursor found. Use Make Cursor first.");
    return { updated: UK.HV.relinkComp(comp, cur), cursor: cur };
};

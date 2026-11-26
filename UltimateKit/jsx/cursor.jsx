/*  Ultimate Kit - Cursor + click effects
    Make Cursor:
      - the chosen layer is copied into a precomp "Cursor" (square, tip at the centre); its size is worked out so the
        whole cursor and the click effect at its biggest fit inside (nothing is ever cut off), and the click effect is
        scaled to the cursor's size (a big cursor in a big comp gets a big click)
      - inside: press animation (keyframes) + the chosen click effect (keyframes),
        all driven from a "CLICK CONTROLS" null (colours, size, opacity)
      - in your comp the precomp layer takes over the cursor's motion path, and its Time
        Remap replays the click every time you drop a layer marker on it.
      - every Hover Group in the comp is pointed at this cursor.                            */

/* copyToComp does not reliably put the copy at index 1, so find the layer that is new */
UK.copyInto = function (L, comp) {
    var before = [], i;
    for (i = 1; i <= comp.numLayers; i++) before.push(comp.layer(i));
    L.copyToComp(comp);
    for (i = 1; i <= comp.numLayers; i++) {
        var c = comp.layer(i), seen = false;
        for (var j = 0; j < before.length; j++) if (before[j] === c) { seen = true; break; }
        if (!seen) return c;
    }
    for (i = 1; i <= comp.numLayers; i++) if (comp.layer(i).name === L.name) return comp.layer(i);
    throw new Error("Could not copy the cursor artwork.");
};
UK.CU = {};
UK.CU.S = 1000;
/* how far each click effect reaches from the tip at its biggest (px at Click Size 100, for a cursor ~46 px tall),
   strokes, glows and blurs included */
UK.CU.REACH = { burst: 175, dots: 265, pixels: 180, particles: 305, spark: 80, simple: 92 };
UK.CU.BASE_H = 46;

/* copy keyframes with their easing from one property to another, mapping the values */
UK.copyKeys = function (src, dst, fn) {
    var i, n = src.numKeys;
    if (!n) { dst.setValue(fn(src.value)); return; }
    for (i = 1; i <= n; i++) dst.setValueAtTime(src.keyTime(i), fn(src.keyValue(i)));
    for (i = 1; i <= n; i++) {
        var k = dst.nearestKeyIndex(src.keyTime(i));
        try { dst.setTemporalEaseAtKey(k, src.keyInTemporalEase(i), src.keyOutTemporalEase(i)); } catch (e1) { }
        try { dst.setInterpolationTypeAtKey(k, src.keyInInterpolationType(i), src.keyOutInterpolationType(i)); } catch (e2) { }
        try { dst.setTemporalContinuousAtKey(k, src.keyTemporalContinuous(i)); dst.setTemporalAutoBezierAtKey(k, src.keyTemporalAutoBezier(i)); } catch (e3) { }
        if (src.isSpatial && dst.isSpatial) {
            try {
                dst.setSpatialTangentsAtKey(k, src.keyInSpatialTangent(i), src.keyOutSpatialTangent(i));
                dst.setSpatialContinuousAtKey(k, src.keySpatialContinuous(i));
                dst.setSpatialAutoBezierAtKey(k, src.keySpatialAutoBezier(i));
            } catch (e4) { }
        }
    }
};

/* ------------------------------------------------------------ FX helpers */
UK.CU.ctx = function (CC, N, t0) {
    var x = { c: CC, N: N, t0: t0 };
    x.layer = function (name) {
        var L = UK.shapeLayer(CC, name);
        L.parent = N;
        UK.pos(L).setValue([0, 0]);
        UK.anchor(L).setValue([0, 0]);
        L.startTime = 0;
        L.inPoint = Math.max(0, t0 - CC.frameDuration);   // hidden until the button is pressed
        return L;
    };
    x.col = function (i) { return 'thisComp.layer("CLICK CONTROLS").effect("Click Color' + (i === 2 ? ' 2' : '') + '")(1)'; };
    x.fill = function (v, i, op) { var f = UK.addFill(v, "#7C5CFF", op); f.property("ADBE Vector Fill Color").expression = x.col(i); return f; };
    x.stroke = function (v, i, w, o) { var s = UK.addStroke(v, "#7C5CFF", w, o); s.property("ADBE Vector Stroke Color").expression = x.col(i); return s; };
    // effect sizes in pixels (blur, glow) don't follow the parent's scale: they are multiplied by it
    x.k = 'value * thisComp.layer("CLICK CONTROLS").transform.scale[0] / 100;';
    // a blur / glow on a shape layer is cut off at the edge of its content: an invisible square (fill opacity 0) around
    // it gives the soft edge room to fade out
    x.room = function (L, size) { var g = UK.group(UK.root(L), "Glow Room"); UK.addRect(UK.vecs(g), [size, size], [0, 0], 0); UK.addFill(UK.vecs(UK.root(L).property("Glow Room")), "#000000", 0); };
    x.opacity = function (L) { UK.opac(L).expression = 'value * thisComp.layer("CLICK CONTROLS").effect("Click Opacity")(1) / 100;'; };
    return x;
};

UK.CU.FX = {};

/* 1. Shape Burst: circles + squares fly out, grow, then vanish; a ring pops behind them */
UK.CU.FX.burst = function (x) {
    var t0 = x.t0;
    var R = x.layer("Burst Ring");
    var e = UK.addEllipse(UK.vecs(UK.group(UK.root(R), "Ring")), [10, 10], [0, 0], "Ring Path");
    UK.anim(e.property("ADBE Vector Ellipse Size"), [[t0, [16, 16]], [t0 + 0.4, [150, 150]]], ["expo"]);
    var sk = x.stroke(UK.vecs(UK.root(R).property("Ring")), 1, 10);
    UK.anim(sk.property("ADBE Vector Stroke Width"), [[t0, 12], [t0 + 0.4, 0]], ["outSoft"]);
    x.opacity(R);
    var P = x.layer("Burst Shapes");
    for (var i = 0; i < 10; i++) {
        var ang = UK.rad(i * 36 + (i % 2) * 9 - 90), dist = 92 + 26 * ((i * 7) % 3);
        var gname = "Shape " + (i + 1);
        var g = UK.group(UK.root(P), gname);
        var v = UK.vecs(g);
        var kind = i % 3;
        if (kind === 0) { UK.addEllipse(v, [15, 15], [0, 0]); x.fill(v, i % 2 ? 2 : 1); }
        else if (kind === 1) { UK.addRect(v, [15, 15], [0, 0], 2); x.stroke(v, i % 2 ? 2 : 1, 3.5, { join: 2 }); }
        else { UK.addRect(v, [11, 11], [0, 0], 1.5); x.fill(v, i % 2 ? 2 : 1); }
        var tr = function () { return UK.gtr(UK.root(P).property(gname)); };
        var dx = Math.cos(ang), dy = Math.sin(ang), dl = (i % 2) * 0.03;
        UK.anim(tr().property("ADBE Vector Position"), [[t0 + dl, [dx * 14, dy * 14]], [t0 + dl + 0.5, [dx * dist, dy * dist]]], ["expo"]);
        UK.anim(tr().property("ADBE Vector Scale"), [[t0 + dl, [0, 0]], [t0 + dl + 0.12, [115, 115]], [t0 + dl + 0.5, [45, 45]]], ["out", "inSoft"]);
        UK.anim(tr().property("ADBE Vector Group Opacity"), [[t0 + dl + 0.26, 100], [t0 + dl + 0.52, 0]], ["in"]);
        if (kind !== 0) UK.anim(tr().property("ADBE Vector Rotation"), [[t0 + dl, 0], [t0 + dl + 0.52, (i % 2 ? -1 : 1) * 150]], ["expo"]);
    }
    x.opacity(P);
};

/* 2. Dot Matrix: a halftone dot grid lit by an expanding soft ring */
UK.CU.FX.dots = function (x) {
    var t0 = x.t0;
    var Wv = x.layer("Dot Wave (matte)");
    var e = UK.addEllipse(UK.vecs(UK.group(UK.root(Wv), "Wave")), [0, 0], [0, 0], "Wave Path");
    UK.anim(e.property("ADBE Vector Ellipse Size"), [[t0, [0, 0]], [t0 + 0.65, [300, 300]]], ["outSoft"]);
    var sk = UK.addStroke(UK.vecs(UK.root(Wv).property("Wave")), "#FFFFFF", 30);
    UK.anim(sk.property("ADBE Vector Stroke Width"), [[t0, 24], [t0 + 0.65, 70]], ["outSoft"]);
    UK.anim(UK.opac(Wv), [[t0 + 0.18, 100], [t0 + 0.6, 0]], ["inSoft"]);
    var bl = UK.fx(Wv, "ADBE Gaussian Blur 2", "Soft");
    UK.efx(Wv, "Soft").property(1).setValue(14);
    UK.efx(Wv, "Soft").property(1).expression = x.k;
    x.room(Wv, 620);
    var G = x.layer("Dot Grid");
    var g = UK.group(UK.root(G), "Dot");
    var v = UK.vecs(g);
    UK.addEllipse(v, [7, 7], [0, 0]);
    x.fill(v, 1);
    // the grid reaches past the wave at its widest, so the lit ring never meets the grid's square edge
    UK.addRepeater(v, 37, [18, 0], "Columns");
    UK.addRepeater(v, 37, [0, 18], "Rows");
    UK.gtr(UK.root(G).property("Dot")).property("ADBE Vector Position").setValue([-324, -324]);
    G.setTrackMatte(Wv, TrackMatteType.ALPHA);
    x.opacity(G);
    var C = x.layer("Center Glow");
    var ce = UK.addEllipse(UK.vecs(UK.group(UK.root(C), "Glow")), [0, 0], [0, 0], "Glow Path");
    UK.anim(ce.property("ADBE Vector Ellipse Size"), [[t0, [0, 0]], [t0 + 0.18, [56, 56]], [t0 + 0.5, [80, 80]]], ["out", "smooth"]);
    x.fill(UK.vecs(UK.root(C).property("Glow")), 2, 45);
    UK.anim(UK.opac(C), [[t0 + 0.12, 100], [t0 + 0.5, 0]], ["inSoft"]);
    UK.fx(C, "ADBE Gaussian Blur 2", "Soft");
    UK.efx(C, "Soft").property(1).setValue(10);
    UK.efx(C, "Soft").property(1).expression = x.k;
    x.room(C, 260);
};

/* 3. Pixel Bloom: square pixels flicker on around the click and fade out */
UK.CU.FX.pixels = function (x) {
    var t0 = x.t0, P = x.layer("Pixels"), r = UK.rng(42), cell = 22, n = 0;
    for (var gy = -5; gy <= 5; gy++) for (var gx = -5; gx <= 5; gx++) {
        var d = Math.sqrt(gx * gx + gy * gy) * cell;
        if (d < 18 || d > 125 || r() > 0.42) continue;
        n++;
        var gname = "Pixel " + n;
        var g = UK.group(UK.root(P), gname);
        var v = UK.vecs(g);
        var s = 14 + Math.round(r() * 8);
        UK.addRect(v, [s, s], [0, 0], 2);
        x.fill(v, r() > 0.5 ? 1 : 2);
        var tr = function () { return UK.gtr(UK.root(P).property(gname)); };
        tr().property("ADBE Vector Position").setValue([gx * cell, gy * cell]);
        var dl = d / 125 * 0.22 + r() * 0.06, life = 0.26 + r() * 0.16;
        UK.anim(tr().property("ADBE Vector Group Opacity"), [[t0 + dl, 0], [t0 + dl + 0.05, 100], [t0 + dl + life, 0]], ["out", "inSoft"]);
        UK.anim(tr().property("ADBE Vector Scale"), [[t0 + dl, [40, 40]], [t0 + dl + 0.1, [100, 100]], [t0 + dl + life, [70, 70]]], ["out", "smooth"]);
    }
    var gl = UK.fx(P, "ADBE Glo2", "Glow");
    gl = UK.efx(P, "Glow");
    gl.property("ADBE Glo2-0003").setValue(18);
    gl.property("ADBE Glo2-0003").expression = x.k;
    x.room(P, 400);
    gl.property("ADBE Glo2-0004").setValue(0.8);
    x.opacity(P);
};

/* 4. Particle Spray: tiny particles scatter with a little drift */
UK.CU.FX.particles = function (x) {
    var t0 = x.t0, P = x.layer("Particles"), r = UK.rng(7);
    for (var i = 0; i < 26; i++) {
        var gname = "Particle " + (i + 1);
        var g = UK.group(UK.root(P), gname);
        var v = UK.vecs(g);
        var s = 3 + Math.round(r() * 4);
        UK.addEllipse(v, [s, s], [0, 0]);
        x.fill(v, r() > 0.45 ? 1 : 2);
        var ang = r() * Math.PI * 2, sp = 110 + r() * 150, dx = Math.cos(ang), dy = Math.sin(ang);
        var tr = function () { return UK.gtr(UK.root(P).property(gname)); };
        var dl = r() * 0.05;
        UK.anim(tr().property("ADBE Vector Position"), [[t0 + dl, [dx * 8, dy * 8]], [t0 + dl + 0.28, [dx * sp * 0.72, dy * sp * 0.72 - 8]], [t0 + dl + 0.75, [dx * sp, dy * sp + 26]]], ["expo", "smooth"], { straight: false });
        UK.anim(tr().property("ADBE Vector Group Opacity"), [[t0 + dl + 0.3, 100], [t0 + dl + 0.75, 0]], ["inSoft"]);
        UK.anim(tr().property("ADBE Vector Scale"), [[t0 + dl, [130, 130]], [t0 + dl + 0.75, [40, 40]]], ["smooth"]);
    }
    x.opacity(P);
};

/* 5. Ring Spark: shock ring + spark lines shooting out */
UK.CU.FX.spark = function (x) {
    var t0 = x.t0;
    var R = x.layer("Spark Ring");
    var e = UK.addEllipse(UK.vecs(UK.group(UK.root(R), "Ring")), [20, 20], [0, 0], "Ring Path");
    UK.anim(e.property("ADBE Vector Ellipse Size"), [[t0, [20, 20]], [t0 + 0.38, [118, 118]]], ["expo"]);
    var sk = x.stroke(UK.vecs(UK.root(R).property("Ring")), 1, 5);
    UK.anim(sk.property("ADBE Vector Stroke Width"), [[t0, 6], [t0 + 0.38, 0]], ["outSoft"]);
    x.opacity(R);
    var S = x.layer("Sparks");
    for (var i = 0; i < 8; i++) {
        var ang = UK.rad(i * 45 - 90), c = Math.cos(ang), s = Math.sin(ang);
        var gname = "Spark " + (i + 1);
        var g = UK.group(UK.root(S), gname);
        var v = UK.vecs(g);
        UK.addPath(v, [[c * 26, s * 26], [c * 64, s * 64]], null, null, false);
        var tr = UK.addTrim(v, "Trim");
        UK.anim(tr.property("ADBE Vector Trim End"), [[t0, 0], [t0 + 0.2, 100]], ["out"]);
        UK.anim(tr.property("ADBE Vector Trim Start"), [[t0 + 0.08, 0], [t0 + 0.34, 100]], ["inSoft"]);
        x.stroke(v, i % 2 ? 2 : 1, 5, { cap: 2 });
    }
    x.opacity(S);
};

/* 6. Simple Ripple: two soft circles, the second one a few frames late */
UK.CU.FX.simple = function (x) {
    var t0 = x.t0, fd = x.c.frameDuration;
    function circle(name, ci, startOp, endSize, delay) {
        var L = x.layer(name);
        var e = UK.addEllipse(UK.vecs(UK.group(UK.root(L), "Circle")), [0, 0], [0, 0], "Circle Path");
        UK.anim(e.property("ADBE Vector Ellipse Size"), [[t0 + delay, [0, 0]], [t0 + delay + 0.45, [endSize, endSize]]], ["outSoft"]);
        x.fill(UK.vecs(UK.root(L).property("Circle")), ci);
        UK.anim(UK.opac(L), [[t0 + delay, startOp], [t0 + delay + 0.45, 0]], ["smooth"]);
        UK.opac(L).expression = 'value * thisComp.layer("CLICK CONTROLS").effect("Click Opacity")(1) / 100;';
        return L;
    }
    var B = circle("Ripple Light", 2, 45, 165, fd * 3);
    var A = circle("Ripple Dark", 1, 60, 140, 0);
    A.moveBefore(B);
};

/* ----------------------------------------------------------- Make Cursor */
UK.api.makeCursor = function (a) {
    var comp = UK.comp(false);
    UK._fd = comp.frameDuration;
    var L = null;
    if (a.layer) { for (var i = 1; i <= comp.numLayers; i++) if (comp.layer(i).name === a.layer) { L = comp.layer(i); break; } }
    if (!L && comp.selectedLayers.length) L = comp.selectedLayers[0];
    if (!L) throw new Error("Pick the cursor layer from the list (or select it).");
    if (L.comment === "UK cursor") throw new Error("This layer is already a cursor. Pick the original artwork layer.");
    var fx = UK.CU.FX[a.click || "simple"];
    if (!fx) throw new Error("Unknown click effect " + a.click);
    var press = UK.clamp((Number(a.pressMs) || 260) / 1000, 0.08, 2);
    var t = comp.time;
    // hotspot (cursor tip) in the layer's own space
    var r = UK.bounds(L, t), anc = UK.anchor(L).valueAtTime(t, false), hs;
    if (a.hotspot === "center") hs = [r.left + r.width / 2, r.top + r.height / 2];
    else if (a.hotspot === "anchor") hs = [anc[0], anc[1]];
    else hs = [r.left, r.top];
    // ---- how big: the click follows the cursor's size; the precomp holds the whole cursor and the click at its biggest
    var sc0 = UK.tr(L, "ADBE Scale").valueAtTime(t, false), sx = Math.abs(sc0[0]) / 100, sy = Math.abs(sc0[1]) / 100;
    var k = UK.clamp(r.height * sy / UK.CU.BASE_H, 0.4, 60);
    var artReach = 0, cs = [[r.left, r.top], [r.left + r.width, r.top], [r.left, r.top + r.height], [r.left + r.width, r.top + r.height]];
    for (i = 0; i < 4; i++) artReach = Math.max(artReach, Math.sqrt(Math.pow((cs[i][0] - hs[0]) * sx, 2) + Math.pow((cs[i][1] - hs[1]) * sy, 2)));
    var size0 = Math.max(100, Number(a.size) || 100) / 100;
    var reach = Math.max((UK.CU.REACH[a.click || "simple"] || 200) * k * size0 * 1.25, artReach * 1.15 + 8 * k);
    var S = Math.max(200, 2 * Math.ceil(reach + 16)), t0 = press * 0.38;
    var D = Math.max(press * 1.45, t0 + 0.95) + 0.25;
    var cname = UK.uniqueName("Cursor");
    var CC = UK.newComp(cname, comp, D, "Cursor", S, S);
    var N = CC.layers.addNull();
    N.name = "CLICK CONTROLS";
    N.label = 2;
    UK.anchor(N).setValue([0, 0]);
    UK.pos(N).setValue([S / 2, S / 2]);
    UK.colorCtl(N, "Click Color", a.color || "#7C5CFF");
    UK.colorCtl(N, "Click Color 2", a.color2 || "#C4B5FD");
    UK.slider(N, "Click Size", Number(a.size) || 100);
    UK.slider(N, "Click Opacity", 100);
    fx(UK.CU.ctx(CC, N, t0));
    // the size after the effect layers are parented (parenting to an already scaled null would shrink them back)
    UK.scale(N).expression = 'var s = effect("Click Size")(1) * ' + UK.round(k, 4) + ';\n[s, s];';
    // cursor artwork on top
    var art = UK.copyInto(L, CC);
    art.parent = null;
    var props = ["ADBE Anchor Point", "ADBE Position", "ADBE Scale", "ADBE Rotate Z", "ADBE Opacity"];
    var vals = {};
    for (i = 0; i < props.length; i++) vals[props[i]] = UK.tr(L, props[i]).valueAtTime(t, false);
    for (i = 0; i < props.length; i++) { var p = UK.tr(art, props[i]); try { while (p.numKeys) p.removeKey(1); p.expression = ""; } catch (e0) { } }
    try { art.threeDLayer = false; } catch (e3d) { }
    UK.anchor(art).setValue([hs[0], hs[1]]);
    UK.pos(art).setValue([S / 2, S / 2]);
    UK.rot(art).setValue(vals["ADBE Rotate Z"]);
    UK.opac(art).setValue(100);
    var sc = vals["ADBE Scale"];
    art.name = "Cursor Art";
    art.startTime = 0; art.inPoint = 0; art.outPoint = D;
    UK.anim(UK.scale(art), [[0, [sc[0], sc[1]]], [press * 0.45, [sc[0] * 0.84, sc[1] * 0.84]], [press, [sc[0] * 1.03, sc[1] * 1.03]], [press * 1.4, [sc[0], sc[1]]]], ["out", "outSoft", "smooth"]);
    art.moveToBeginning();
    N.moveToBeginning();
    UK.essential(CC, UK.efx(N, "Click Color").property(1), "Click Color");
    UK.essential(CC, UK.efx(N, "Click Color 2").property(1), "Click Color 2");
    UK.essential(CC, UK.efx(N, "Click Size").property(1), "Click Size");
    UK.essential(CC, UK.efx(N, "Click Opacity").property(1), "Click Opacity");
    // ---- the cursor layer in your comp
    var clName = UK.uniqueLayerName(comp, "Cursor");
    var CL = comp.layers.add(CC);
    CL.name = clName;
    CL.comment = "UK cursor";
    CL.moveBefore(L);
    CL.startTime = 0;
    // tip offset from the original layer's position (scale + rotation)
    var dx = (hs[0] - vals["ADBE Anchor Point"][0]) * sc[0] / 100, dy = (hs[1] - vals["ADBE Anchor Point"][1]) * sc[1] / 100;
    var rr = UK.rad(vals["ADBE Rotate Z"]);
    var off = [dx * Math.cos(rr) - dy * Math.sin(rr), dx * Math.sin(rr) + dy * Math.cos(rr)];
    if (L.parent) {
        CL.parent = L.parent;
    }
    var srcPos = UK.pos(L);
    if (srcPos.dimensionsSeparated) {
        UK.pos(CL).dimensionsSeparated = true;
        UK.copyKeys(UK.tr(L, "ADBE Position_0"), UK.tr(CL, "ADBE Position_0"), function (v) { return v + off[0]; });
        UK.copyKeys(UK.tr(L, "ADBE Position_1"), UK.tr(CL, "ADBE Position_1"), function (v) { return v + off[1]; });
    } else {
        UK.copyKeys(srcPos, UK.pos(CL), function (v) { return v.length === 3 ? [v[0] + off[0], v[1] + off[1], v[2]] : [v[0] + off[0], v[1] + off[1]]; });
    }
    UK.copyKeys(UK.opac(L), UK.opac(CL), function (v) { return v; });
    UK.anchor(CL).setValue([S / 2, S / 2]);
    // marker-driven clicks
    UK.slider(CL, "Click Speed", 100);
    UK.slider(CL, "Press Duration", Math.round(press * 1000) / 1000);
    CL.timeRemapEnabled = true;
    var TRp = CL.property("ADBE Time Remapping");
    TRp.expression = [
        '// Ultimate Kit: plays the click from every layer marker',
        'var sp = effect("Click Speed")(1) / 100;',
        'var t = 0;',
        'if (marker.numKeys > 0) {',
        '  var n = marker.nearestKey(time).index;',
        '  if (marker.key(n).time > time) n--;',
        '  if (n > 0) t = (time - marker.key(n).time) * sp;',
        '}',
        'clamp(t, 0, source.duration - source.frameDuration);'
    ].join("\n");
    CL.inPoint = L.inPoint;
    CL.outPoint = Math.max(L.outPoint, comp.duration);
    var mv = new MarkerValue("click");
    CL.property("ADBE Marker").setValueAtTime(UK.snap(comp, Math.min(comp.duration - press, t + 0.5)), mv);
    L.enabled = false;
    L.name = UK.uniqueLayerName(comp, L.name + " (original)");
    var linked = UK.HV.relinkComp(comp, CL.name);
    UK.selectOnly(comp, [CL]);
    return { cursor: CL.name, comp: cname, hoverLinked: linked };
};

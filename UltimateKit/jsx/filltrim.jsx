/*  Ultimate Kit - Fill Trim (2026-11-04): Trim Paths for filled shape layers. The panel (js/filltrim.js) works out the islands
    and the way each one fills; here:
      ftRead   the selected shape layers: their filled paths in layer coordinates (group transforms applied), bottom first
      ftSplit  a layer's islands, each on its own shape layer exactly over it (its transform, parent, times copied, the anchor
               in the middle of the island), the original switched off underneath
      ftApply  one Null "Fill Trim" (Start, End: the trim's place on the island, keyframed from where it begins to 0 and 100,
               both on the same two times, so both ends are reached together) and on each layer two masks per island, Add for
               End and Subtract for Start: the island's fill at a row of levels as keyframes on the mask's Path, past the end of
               the timeline, and a small expression that picks the level from the Null, so each island has its own 0..100 and all
               run from one control (a path built in the expression instead made a frame three times slower);
               a checkbox per island turns its direction round
      ftKeys   the control's keys, from the panel's sliders: the place the trim begins at, the duration, the speed ramp; each
               only what it was asked; and what they are now                                                          */
UK.FT = {};
UK.FT.hex = function (c) {
    var s = "#", i, v;
    for (i = 0; i < 3; i++) { v = Math.round(UK.clamp(c[i], 0, 1) * 255); s += (v < 16 ? "0" : "") + v.toString(16); }
    return s.toUpperCase();
};
/* a group's transform as [a, b, c, d, e, f] (x' = a x + c y + e, y' = b x + d y + f); skew is not read */
UK.FT.groupMatrix = function (g) {
    var T = g.property("ADBE Vector Transform Group");
    var A = T.property("ADBE Vector Anchor").value, P = T.property("ADBE Vector Position").value, S = T.property("ADBE Vector Scale").value, R = UK.rad(T.property("ADBE Vector Rotation").value);
    var c = Math.cos(R), s = Math.sin(R), sx = S[0] / 100, sy = S[1] / 100;
    var a = c * sx, b = s * sx, cc = -s * sy, d = c * sy;
    return [a, b, cc, d, P[0] - a * A[0] - cc * A[1], P[1] - b * A[0] - d * A[1]];
};
UK.FT.times = function (M, N) {
    return [M[0] * N[0] + M[2] * N[1], M[1] * N[0] + M[3] * N[1], M[0] * N[2] + M[2] * N[3], M[1] * N[2] + M[3] * N[3], M[0] * N[4] + M[2] * N[5] + M[4], M[1] * N[4] + M[3] * N[5] + M[5]];
};
/* the closed paths under vecs, a set per group that has paths, with the Fill that paints them (a recursive walk: own variables) */
UK.FT.collect = function (vecs, M, fill, out) {
    var i, p, f = fill, paths = [];
    for (i = 1; i <= vecs.numProperties; i++) {
        p = vecs.property(i);
        if (p.matchName === "ADBE Vector Graphic - Fill" && p.enabled) {
            var col = p.property("ADBE Vector Fill Color").value;
            f = { rgb: [col[0], col[1], col[2]], rule: p.property("ADBE Vector Fill Rule").value };
            break;
        }
        if (p.matchName === "ADBE Vector Graphic - G-Fill" && p.enabled) { f = { rgb: [0.5, 0.5, 0.5], rule: 1 }; break; }
    }
    for (i = 1; i <= vecs.numProperties; i++) {
        p = vecs.property(i);
        if (p.matchName === "ADBE Vector Group") {
            if (p.enabled) UK.FT.collect(p.property("ADBE Vectors Group"), UK.FT.times(M, UK.FT.groupMatrix(p)), f, out);
        } else if (p.matchName === "ADBE Vector Shape - Group" && p.enabled) {
            var S = p.property("ADBE Vector Shape").value, q, v = [], ti = [], to = [], n = S.vertices.length;
            if (!S.closed || n < 2) continue;
            for (q = 0; q < n; q++) {
                var V = S.vertices[q], I = S.inTangents[q], O = S.outTangents[q];
                v.push([UK.round(M[0] * V[0] + M[2] * V[1] + M[4], 3), UK.round(M[1] * V[0] + M[3] * V[1] + M[5], 3)]);
                ti.push([UK.round(M[0] * I[0] + M[2] * I[1], 3), UK.round(M[1] * I[0] + M[3] * I[1], 3)]);
                to.push([UK.round(M[0] * O[0] + M[2] * O[1], 3), UK.round(M[1] * O[0] + M[3] * O[1], 3)]);
            }
            paths.push({ v: v, i: ti, o: to, c: true });
        }
    }
    if (paths.length) {
        var u = f || { rgb: [1, 1, 1], rule: 2 };
        out.push({ hex: UK.FT.hex(u.rgb), rgb: u.rgb, rule: u.rule, paths: paths });
    }
};
UK.api.ftRead = function () {
    var comp = UK.comp(false), sel = comp.selectedLayers, items = [], i;
    for (i = 0; i < sel.length; i++) {
        if (!(sel[i] instanceof ShapeLayer)) continue;
        var out = [];
        UK.FT.collect(sel[i].property("ADBE Root Vectors Group"), [1, 0, 0, 1, 0, 0], null, out);
        out.reverse();          // (the first in the list is the top one)
        if (out.length) items.push({ id: sel[i].id, name: sel[i].name, fills: out });
    }
    if (!items.length) throw new Error("Select a shape layer with filled paths.");
    return { comp: comp.id, items: items };
};
UK.api.ftSplit = function (a) {
    var F = UK.P2S.find(a.comp, a.id), comp = F.comp, L = F.L, t = comp.time, isl = a.islands, made = [], i;
    if (!isl || isl.length < 2) throw new Error("This layer has only one island.");
    var base = String(L.name).replace(/\.[a-z0-9]{2,4}$/i, "");
    return UK.atomic(comp, function () {
        var below = L;
        for (i = 0; i < isl.length; i++) {
            var N = UK.P2S.layer(comp, L, base + " " + (i + 1)), g = N.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            g.name = "Island " + (i + 1);
            UK.P2S.paths(g.property("ADBE Vectors Group"), isl[i].paths);
            UK.P2S.fill(N.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"), isl[i].rgb);
            UK.W2P.centre(N, t);
            N.moveBefore(below); below = N;
            made.push(N);
        }
        L.enabled = false;
        L.comment = "Ultimate Kit Fill Trim: the original layer (switched off; its islands are above).";
        UK.selectOnly(comp, made);
        var names = []; for (i = 0; i < made.length; i++) names.push(made[i].name);
        return { layers: names };
    });
};
/* the mask's Path: the island at a row of levels, every vertex in every key (they slide along their ways back to the start) */
UK.FT.keys = function (P, P2, d, t0, fd) {
    var D = d.D, E = d.E, S = d.S, n = D.length / 4, m = E.length / 4, K = Math.max(12, Math.min(80, Math.round(S / 10))), k, i, o, p, s, q, f, cx = [], cy = [], x, y;
    for (k = 0; k <= K; k++) {
        var t = S * k / K, V = [];
        cx[0] = D[0]; cy[0] = D[1];
        for (i = 1; i < n; i++) {
            o = i * 4; p = i - D[o + 2]; s = D[o + 3]; q = D[p * 4 + 3];
            if (t >= s) { cx[i] = D[o]; cy[i] = D[o + 1]; }
            else if (t > q) { f = (t - q) / (s - q); cx[i] = D[p * 4] + (D[o] - D[p * 4]) * f; cy[i] = D[p * 4 + 1] + (D[o + 1] - D[p * 4 + 1]) * f; }
            else { cx[i] = cx[p]; cy[i] = cy[p]; }
        }
        for (i = 0; i < m; i++) {
            o = i * 4; p = E[o + 2]; s = E[o + 3]; q = D[p * 4 + 3];
            if (t >= s) { x = E[o]; y = E[o + 1]; }
            else if (t > q) { f = (t - q) / (s - q); x = D[p * 4] + (E[o] - D[p * 4]) * f; y = D[p * 4 + 1] + (E[o + 1] - D[p * 4 + 1]) * f; }
            else { x = cx[p]; y = cy[p]; }
            V.push([x, y]);
        }
        var sh = new Shape(); sh.vertices = V; sh.closed = true;
        P.setValueAtTime(t0 + k * fd, sh);
        P2.setValueAtTime(t0 + k * fd, sh);
    }
    return K;
};
/* what shows of the island: 0..A and Bb..C. Reverse: the same animation arriving at the place instead of leaving it */
UK.FT.exprHead = function (name, rev) {
    return [
        'var N = thisComp.layer("' + name + '"), SP = N.effect("Start")(1), EP = N.effect("End")(1), lo = clamp(SP.value, 0, 100) / 100, hi = clamp(EP.value, 0, 100) / 100, sw;',
        'if (lo > hi) { sw = lo; lo = hi; hi = sw; }',
        'var A = 0, Bb = lo, C = hi;',
        'if (effect("' + rev + '")(1) == 1) {',
        '  if (SP.numKeys || EP.numKeys) {',
        '    var a0 = clamp(SP.numKeys ? SP.key(1).value : SP.value, 0, 100) / 100, b0 = clamp(EP.numKeys ? EP.key(1).value : EP.value, 0, 100) / 100;',
        '    A = Math.max(0, a0 - lo); Bb = 1 - (hi - b0); C = 1 - Math.max(0, lo - a0);',
        '  } else { Bb = 1 - hi; C = 1 - lo; }',
        '}',
        'if (A >= Bb || C <= Bb) { if (C <= Bb) C = A; A = 0; Bb = 0; }',
        'var a = key(1).time, d = key(numKeys).time - a;'
    ].join("\n");
};
/* the Add mask: up to C (the whole island: a plain rectangle, the fill's own edge shows). Only Reverse with both ends open needs a path built here */
UK.FT.exprAdd = function (name, rev, B) {
    return UK.FT.exprHead(name, rev) + "\n" + [
        'if (C >= 1 && Bb <= 0) createPath([[' + B[0] + ',' + B[1] + '],[' + B[2] + ',' + B[1] + '],[' + B[2] + ',' + B[3] + '],[' + B[0] + ',' + B[3] + ']], [], [], true);',
        'else if (A > 0) {',
        '  var P = thisProperty.points(a + C * d), K = thisProperty.points(a + Bb * d), H = thisProperty.points(a + A * d), j;',
        '  P.push(P[0]); P.push(K[0]);',
        '  for (j = K.length - 1; j >= 0; j--) P.push(K[j]);',
        '  for (j = 0; j < H.length; j++) P.push(H[j]);',
        '  P.push(H[0]); P.push(K[0]);',
        '  createPath(P, [], [], true);',
        '}',
        'else thisProperty.valueAtTime(a + Math.max(C, 0) * d);'
    ].join("\n");
};
/* the Subtract mask: up to Bb */
UK.FT.exprCut = function (name, rev) {
    return UK.FT.exprHead(name, rev) + "\n" + 'thisProperty.valueAtTime(a + (A > 0 ? 0 : Math.max(Bb, 0)) * d);';
};
/* takes off an earlier Fill Trim of this layer; the names of the controls it read go into used */
UK.FT.clean = function (L, used) {
    var M = L.property("ADBE Mask Parade"), E = L.property("ADBE Effect Parade"), k;
    for (k = M.numProperties; k >= 1; k--) {
        var m = M.property(k);
        if (!/^Fill Trim \d+( cut)?$/.test(m.name)) continue;
        var f = /thisComp\.layer\("([^"]+)"\)/.exec(m.property("ADBE Mask Shape").expression);
        if (f) used[f[1]] = true;
        m.remove();
    }
    for (k = E.numProperties; k >= 1; k--) if (E.property(k).matchName === "ADBE Checkbox Control" && /^Reverse( \d+)?$/.test(E.property(k).name)) E.property(k).remove();
    /* (an Opacity that read the control, from a version that had it) */
    var O = L.property("ADBE Transform Group").property("ADBE Opacity");
    if (/^value \* clamp\(thisComp\.layer\("[^"]+"\)\.effect\("Opacity"\)\(1\), 0, 100\) \/ 100$/.test(O.expression)) O.expression = "";
};
/* a control nothing reads any more goes */
UK.FT.dropUnused = function (comp, names, keep) {
    var i, k, n;
    for (n in names) {
        if (n === keep) continue;
        var C = null;
        try { C = comp.layer(n); } catch (e0) { }
        if (!C || !C.nullLayer || !/^Ultimate Kit Fill Trim/.test(C.comment)) continue;
        var read = false, q = 'thisComp.layer("' + n + '")';
        for (i = 1; i <= comp.numLayers && !read; i++) {
            var M = comp.layer(i).property("ADBE Mask Parade");
            if (!M) continue;
            for (k = 1; k <= M.numProperties && !read; k++) if (M.property(k).property("ADBE Mask Shape").expression.indexOf(q) >= 0) read = true;
        }
        if (!read) C.remove();
    }
};
/* the control the selected layers read (or the selected control itself) */
UK.FT.selectedControl = function (comp) {
    var sel = comp.selectedLayers, i, k;
    for (i = 0; i < sel.length; i++) {
        if (sel[i].nullLayer && /^Ultimate Kit Fill Trim/.test(sel[i].comment)) return sel[i];
        var M = sel[i].property("ADBE Mask Parade");
        if (!M) continue;
        for (k = 1; k <= M.numProperties; k++) {
            if (!/^Fill Trim \d+$/.test(M.property(k).name)) continue;
            var f = /thisComp\.layer\("([^"]+)"\)/.exec(M.property(k).property("ADBE Mask Shape").expression);
            if (f) { try { return comp.layer(f[1]); } catch (e0) { } }
        }
    }
    return null;
};
/* a key moved in time, with its value, ease and types; its new index */
UK.FT.moveKey = function (P, k, t) {
    var v = P.keyValue(k), ie = P.keyInTemporalEase(k), oe = P.keyOutTemporalEase(k), it = P.keyInInterpolationType(k), ot = P.keyOutInterpolationType(k);
    P.removeKey(k);
    var n = P.addKey(t);
    P.setValueAtKey(n, v);
    P.setInterpolationTypeAtKey(n, it, ot);
    P.setTemporalEaseAtKey(n, ie, oe);
    return n;
};
/* Start or End at the first key: where the trim is on the island when the animation begins. Start at 0 needs no keys */
UK.FT.setPlace = function (C, what, v) {
    var P = UK.efx(C, what).property(1), E = UK.efx(C, "End").property(1), B = KeyframeInterpolationType.BEZIER;
    if (P.numKeys >= 1) {
        P.setValueAtKey(1, v);
        if (what === "Start" && v === 0 && P.numKeys === 2) { P.removeKey(2); P.removeKey(1); P.setValue(0); }
    } else if (what === "Start" && v > 0 && E.numKeys >= 2) {
        var n = E.numKeys;
        P.setValueAtTime(E.keyTime(1), v); P.setValueAtTime(E.keyTime(n), 0);
        P.setInterpolationTypeAtKey(1, B, B); P.setInterpolationTypeAtKey(2, B, B);
        P.setTemporalEaseAtKey(1, UK.easeArr(1, 33.34), UK.easeArr(1, E.keyOutTemporalEase(1)[0].influence));
        P.setTemporalEaseAtKey(2, UK.easeArr(1, E.keyInTemporalEase(n)[0].influence), UK.easeArr(1, 33.34));
    } else P.setValue(v);
};
UK.FT.readKeys = function (C) {
    var S = UK.efx(C, "Start").property(1), E = UK.efx(C, "End").property(1), n = E.numKeys;
    var r = { found: true, control: C.name, start: S.numKeys ? S.keyValue(1) : S.value, end: n ? E.keyValue(1) : E.value };
    if (n >= 2) { r.dur = E.keyTime(n) - E.keyTime(1); r.rampOut = E.keyOutTemporalEase(1)[0].influence; r.rampIn = E.keyInTemporalEase(n)[0].influence; }
    return r;
};
UK.api.ftKeys = function (a) {
    var comp = null, C = null, i, s = a.set || {}, B = KeyframeInterpolationType.BEZIER, names = ["Start", "End"];
    if (a.comp) { for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i).id === a.comp) comp = app.project.item(i); }
    if (!(comp instanceof CompItem)) comp = UK.comp(false);
    if (a.control) { try { C = comp.layer(a.control); } catch (e0) { } }
    if (!C || !C.nullLayer) C = UK.FT.selectedControl(comp);
    if (!C) return { found: false };
    if (s.start !== undefined) UK.FT.setPlace(C, "Start", Number(s.start));
    if (s.end !== undefined) UK.FT.setPlace(C, "End", Number(s.end));
    for (i = 0; i < 2; i++) {
        var P = UK.efx(C, names[i]).property(1), n = P.numKeys;
        if (n < 2) continue;
        if (s.dur !== undefined && n === 2) {
            var t2 = UK.snap(comp, P.keyTime(1) + Math.max(comp.frameDuration, Number(s.dur)));
            if (Math.abs(t2 - P.keyTime(2)) > 0.0005) UK.FT.moveKey(P, 2, t2);
        }
        if (s.ramp) {
            P.setInterpolationTypeAtKey(1, B, B);
            P.setInterpolationTypeAtKey(n, B, B);
            P.setTemporalEaseAtKey(1, P.keyInTemporalEase(1), UK.easeArr(1, s.ramp[0]));
            P.setTemporalEaseAtKey(n, UK.easeArr(1, s.ramp[1]), P.keyOutTemporalEase(n));
        }
    }
    return UK.FT.readKeys(C);
};
UK.api.ftApply = function (a) {
    var comp = null, i, k, used = {}, count = 0, L0;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i).id === a.comp) comp = app.project.item(i);
    if (!(comp instanceof CompItem)) throw new Error("The composition is gone.");
    var far = Math.max(comp.duration, comp.time) + 3600, fd = comp.frameDuration, name = "", N = null, n;
    /* applied again: the layers keep the control they had, with its Start and End as they were animated */
    for (i = 0; i < a.items.length; i++) { L0 = null; for (k = 1; k <= comp.numLayers; k++) if (comp.layer(k).id === a.items[i].id) L0 = comp.layer(k); if (L0) UK.FT.clean(L0, used); }
    for (n in used) {
        var C = null;
        try { C = comp.layer(n); } catch (e0) { }
        if (C && C.nullLayer && /^Ultimate Kit Fill Trim/.test(C.comment)) { N = C; name = n; break; }
    }
    if (!N) {
        var t0 = UK.snap(comp, comp.time), t2 = UK.snap(comp, t0 + Math.max(fd * 2, Number(a.dur) || 1.5)), rp = a.ramp || [66, 66], pl = a.place || [0, 0];
        name = UK.uniqueLayerName(comp, "Fill Trim"); N = comp.layers.addNull();
        N.name = name;
        N.comment = "Ultimate Kit Fill Trim: Start and End for every island of the layers that read this control.";
        UK._fd = fd;
        var SS = UK.slider(N, "Start", 0);
        if (pl[0] > 0) UK.anim(SS, [[t0, pl[0]], [t2, 0]], [[rp[0], rp[1]]]);
        UK.anim(UK.slider(N, "End", 0), [[t0, pl[1]], [t2, 100]], [[rp[0], rp[1]]]);
    }
    var oldOp = UK.efx(N, "Opacity");       // (from a version that had it)
    if (oldOp) oldOp.remove();
    for (i = 0; i < a.items.length; i++) {
        var it = a.items[i], L = null;
        for (k = 1; k <= comp.numLayers; k++) if (comp.layer(k).id === it.id) L = comp.layer(k);
        if (!L) continue;
        for (k = 0; k < it.islands.length; k++) UK.checkCtl(L, it.islands[k].rev, false);
        for (k = 0; k < it.islands.length; k++) {
            var base = "Fill Trim " + (k + 1), m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
            m.name = base; m.maskMode = MaskMode.ADD;
            var mc = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
            mc.name = base + " cut"; mc.maskMode = MaskMode.SUBTRACT;
            var P1 = L.property("ADBE Mask Parade").property(base).property("ADBE Mask Shape"), P2 = L.property("ADBE Mask Parade").property(base + " cut").property("ADBE Mask Shape");
            UK.FT.keys(P1, P2, it.islands[k], far, fd);
            P1.expression = UK.FT.exprAdd(name, it.islands[k].rev, it.islands[k].B);
            P2.expression = UK.FT.exprCut(name, it.islands[k].rev);
            if (P1.expressionError) throw new Error(L.name + ", island " + (k + 1) + ": " + P1.expressionError);
            if (P2.expressionError) throw new Error(L.name + ", island " + (k + 1) + ": " + P2.expressionError);
            count++;
        }
    }
    UK.FT.dropUnused(comp, used, name);
    UK.selectOnly(comp, [N]);
    return { control: name, masks: count, layers: a.items.length, keys: UK.FT.readKeys(N) };
};

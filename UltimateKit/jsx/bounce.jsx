/*  Ultimate Kit — Bounce
    Works on the keyframes you already have (Position / Scale / Rotation / Opacity or any
    selected property). Two modes:
      Live  : an expression + effect sliders on the layer ("Scale - Overshoot", ...).
      Keys  : real, editable overshoot / bounce keyframes are inserted after each landing
              keyframe, with continuous velocity and eased peaks (no expressions).          */

UK.BN = {};
UK.BN.PROPS = { position: "ADBE Position", scale: "ADBE Scale", rotation: "ADBE Rotate Z", rotX: "ADBE Rotate X", rotY: "ADBE Rotate Y", orientation: "ADBE Orientation", opacity: "ADBE Opacity" };
/* what each panel choice covers (3D layers: X / Y / Z Rotation and Orientation too, Position / Scale with their Z) */
UK.BN.GROUPS = { position: ["position"], scale: ["scale"], rotation: ["rotation"], "3d": ["rotX", "rotY", "rotation", "orientation"],
    all: ["position", "scale", "rotation", "rotX", "rotY", "orientation"] };

UK.BN.label = function (p) {
    var mn = p.matchName;
    var map = { "ADBE Position": "Position", "ADBE Position_0": "X Position", "ADBE Position_1": "Y Position", "ADBE Position_2": "Z Position",
        "ADBE Scale": "Scale", "ADBE Rotate Z": "Rotation", "ADBE Orientation": "Orientation", "ADBE Rotate X": "X Rotation", "ADBE Rotate Y": "Y Rotation", "ADBE Opacity": "Opacity", "ADBE Anchor Point": "Anchor" };
    return map[mn] || p.name;
};

/* which properties to work on */
UK.BN.targets = function (comp, which) {
    var out = [], i, j;
    function ok(p) { return p && p.numKeys >= 2 && p.canSetExpression && p.propertyValueType !== PropertyValueType.CUSTOM_VALUE && p.propertyValueType !== PropertyValueType.SHAPE; }
    function layerOf(p) { var q = p; while (q.parentProperty) q = q.parentProperty; return q; }
    if (!which || which === "auto") {
        var sp = comp.selectedProperties;
        for (i = 0; i < sp.length; i++) if (sp[i] instanceof Property && ok(sp[i])) out.push({ prop: sp[i], layer: layerOf(sp[i]) });
        if (out.length) return out;
    }
    var names = UK.BN.GROUPS[(which === "auto" || !which) ? "all" : which] || [which];
    var sel = comp.selectedLayers;
    for (i = 0; i < sel.length; i++) {
        for (j = 0; j < names.length; j++) {
            var p = null;
            try { p = UK.tr(sel[i], UK.BN.PROPS[names[j]]); } catch (e0) { p = null; }      // (a 2D layer has no X / Y Rotation / Orientation)
            if (names[j] === "position" && p && p.dimensionsSeparated) {
                var xs = ["ADBE Position_0", "ADBE Position_1", "ADBE Position_2"];
                for (var k = 0; k < xs.length; k++) { var q = UK.tr(sel[i], xs[k]); if (ok(q)) out.push({ prop: q, layer: sel[i] }); }
                continue;
            }
            if (ok(p)) out.push({ prop: p, layer: sel[i] });
        }
    }
    return out;
};

UK.BN.ensureSlider = function (L, name, val) {
    var e = UK.efx(L, name);
    if (!e) UK.slider(L, name, val);
    return name;
};

/* the speed arriving at a key, from two values of the keyframes just before it (velocityAtTime is not allowed on
   Orientation: "velocity is not supported for the orientation property"); wrap = angles go the short way round */
UK.BN.VEL = function (wrap) {
    if (wrap) return [                  // Orientation: from its two keys, the short way round, like a landing at 1.6 x the average speed
        'function vel(t) {',
        '  var a = key(n - 1).value, b = key(n).value, dt = Math.max(thisComp.frameDuration, key(n).time - key(n - 1).time), r = [];',
        '  for (var i = 0; i < a.length; i++) { var d = ((b[i] - a[i] + 180) % 360 + 360) % 360 - 180; r.push(d / dt * 1.6); }',
        '  return r;',
        '}'
    ].join("\n");
    return [
        'function vel(t) {',
        '  var h = thisComp.frameDuration / 10, a = valueAtTime(t - h), b = valueAtTime(t);',
        '  if (!(a instanceof Array)) return ' + (wrap ? '(((b - a + 180) % 360 + 360) % 360 - 180) / h;' : '(b - a) / h;'),
        '  var r = [];',
        '  for (var i = 0; i < a.length; i++) { var d = b[i] - a[i];' + (wrap ? ' d = ((d + 180) % 360 + 360) % 360 - 180;' : '') + ' r.push(d / h); }',
        '  return r;',
        '}'
    ].join("\n");
};
UK.BN.exprOvershoot = function (a, f, d, wrap) {
    return [
        '// Ultimate Kit overshoot',
        UK.BN.VEL(wrap),
        'var amp = effect("' + a + '")(1) / 1000;',
        'var freq = Math.max(0.1, effect("' + f + '")(1));',
        'var decay = effect("' + d + '")(1);',
        'var n = 0;',
        'if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }',
        'if (n > 1) {',
        '  var t = time - key(n).time;',
        '  var v = vel(key(n).time);',
        '  var k = amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);',
        '  (value instanceof Array) ? add(value, mul(v, k)) : value + v * k;',
        '} else { value; }'
    ].join("\n");
};
UK.BN.exprBounce = function (e, g, m, wrap) {
    return [
        '// Ultimate Kit bounce',
        UK.BN.VEL(wrap),
        'var el = clamp(effect("' + e + '")(1) / 100, 0, 0.98);',
        'var g = Math.max(1, effect("' + g + '")(1));',
        'var nMax = Math.round(effect("' + m + '")(1));',
        'var n = 0;',
        'if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }',
        'if (n > 1) {',
        '  var t = time - key(n).time;',
        '  var v = vel(key(n).time);',
        '  var isArr = (value instanceof Array);',
        '  var vl = isArr ? length(v) : Math.abs(v);',
        '  var vu = isArr ? (vl > 0 ? mul(normalize(v), -1) : mul(v, 0)) : (v > 0 ? -1 : 1);',
        '  vl *= el;',
        '  var tCur = 0, segDur = 2 * vl / g, tNext = segDur, nb = 1;',
        '  while (tNext < t && nb <= nMax) { vl *= el; segDur *= el; tCur = tNext; tNext += segDur; nb++; }',
        '  if (nb <= nMax && vl > 0) { var dt = t - tCur; var off = dt * (vl - g * dt / 2); isArr ? add(value, mul(vu, off)) : value + vu * off; } else { value; }',
        '} else { value; }'
    ].join("\n");
};

/* ---------- keyframe mode helpers */
UK.BN.vec = function (v) { return (v instanceof Array) ? v.slice(0) : [v]; };
UK.BN.len = function (a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s); };
UK.BN.out = function (proto, arr) { return (proto instanceof Array) ? arr : arr[0]; };
UK.BN.setSpeed = function (prop, k, vin, vout, inflIn, inflOut) {
    var n = UK.dims(prop), i;
    var mk = function (vel, infl) {
        var a = [];
        for (i = 0; i < n; i++) {
            var s = prop.isSpatial ? UK.BN.len(vel) : (vel[i] || 0);
            a.push(new KeyframeEase(s, UK.clamp(infl, 0.1, 100)));
        }
        return a;
    };
    try { prop.setTemporalEaseAtKey(k, mk(vin, inflIn), mk(vout, inflOut)); }
    catch (e) { n = 1; try { prop.setTemporalEaseAtKey(k, mk(vin, inflIn), mk(vout, inflOut)); } catch (e2) { } }   // (Orientation keeps one ease)
};
/*  Landing velocity. Eased keys arrive with ~0 speed, which leaves nothing to bounce, so
    for those we use the segment's average speed (x1.6) and give the key that incoming
    speed — the motion then flows into the overshoot instead of stopping first.          */
/* Orientation (3D layers) is a spatial property whose keys AE turns as one rotation: setSpatialTangentsAtKey wipes its
   Y / Z values (verified: [42,302,21] -> [42,0,0]) and its key speed is not per axis, so those calls are skipped for it */
UK.BN.isOri = function (prop) { return prop.matchName === "ADBE Orientation"; };
UK.BN.landing = function (prop, k, fix) {
    var fd = UK._fd || 1 / 30;
    var t = prop.keyTime(k), tp = prop.keyTime(k - 1);
    var V = UK.BN.vec(prop.keyValue(k)), V0 = UK.BN.vec(prop.keyValue(k - 1));
    var Vp = UK.BN.vec(prop.valueAtTime(t - fd * 0.25, true));
    var v = [], avg = [], i;
    var ang = UK.BN.isOri(prop), dif = function (a, b) { var d = a - b; if (ang) { d = ((d + 180) % 360 + 360) % 360 - 180; } return d; };   // Orientation turns the short way round
    for (i = 0; i < V.length; i++) { v.push(dif(V[i], Vp[i]) / (fd * 0.25)); avg.push(dif(V[i], V0[i]) / Math.max(fd, t - tp)); }
    if (UK.BN.len(avg) < 1e-3) return null;                       // a hold, nothing lands here
    if (ang) { for (i = 0; i < v.length; i++) v[i] = avg[i] * 1.6; return v; }
    if (UK.BN.len(v) < 0.35 * UK.BN.len(avg)) {
        for (i = 0; i < v.length; i++) v[i] = avg[i] * 1.6;
        if (fix) {
            var outE = prop.keyOutTemporalEase(k);
            var n = UK.dims(prop), inE = [];
            for (i = 0; i < n; i++) inE.push(new KeyframeEase(prop.isSpatial ? UK.BN.len(v) : (v[i] || 0), 40));
            try { prop.setTemporalEaseAtKey(k, inE, outE); } catch (e) { try { prop.setTemporalEaseAtKey(k, [inE[0]], outE); } catch (e3) { } }
        }
    }
    return v;
};
/* gravity that suits this property's own speed: the first bounce lasts ~0.25 s whatever the move's size (a fixed number
   made rotations / Orientation bounce well under a degree) */
UK.BN.autoGravity = function (p, e) {
    for (var k = 2; k <= p.numKeys; k++) {
        var v = null;
        try { v = UK.BN.landing(p, k, false); } catch (x) { v = null; }
        if (v) return Math.max(10, Math.round(8 * UK.BN.len(v) * e));
    }
    return UK.BN.gravity(p);
};
UK.BN.gravity = function (p) {
    var m = { "ADBE Scale": 1400, "ADBE Rotate Z": 2200, "ADBE Rotate X": 2200, "ADBE Rotate Y": 2200, "ADBE Orientation": 2200, "ADBE Opacity": 1200 };
    return m[p.matchName] || 6000;
};
UK.BN.prepLive = function (prop) {
    for (var k = 2; k <= prop.numKeys; k++) UK.BN.landing(prop, k, true);
};

UK.BN.bake = function (prop, type, o) {
    var fd = UK._fd || 1 / 30;
    var landings = [];
    for (var k = 2; k <= prop.numKeys; k++) {
        var t = prop.keyTime(k);
        var V = UK.BN.vec(prop.keyValue(k));
        var v = UK.BN.landing(prop, k, false);
        if (!v) continue;
        var next = (k < prop.numKeys) ? prop.keyTime(k + 1) : 1e9;
        landings.push({ t: t, V: V, v: v, next: next, proto: prop.keyValue(k) });
    }
    var added = 0;
    for (var li = landings.length - 1; li >= 0; li--) {      // from the end so key indices stay stable
        var Lg = landings[li], keys = [], speed = UK.BN.len(Lg.v), dir = [];
        for (var d = 0; d < Lg.v.length; d++) dir.push(Lg.v[d] / speed);
        if (type === "bounce") {
            var g = o.gravity, e = o.elasticity, vk = speed * e, tt = Lg.t;
            for (var b = 0; b < o.maxBounces && vk > speed * 0.03; b++) {
                var T = 2 * vk / g, h = vk * vk / (2 * g);
                if (tt + T > Lg.next - fd * 2) break;
                var apex = [], land = [];
                for (d = 0; d < Lg.V.length; d++) { apex.push(Lg.V[d] - dir[d] * h); land.push(Lg.V[d]); }
                keys.push({ t: tt + T / 2, v: apex, kind: "apex" });
                keys.push({ t: tt + T, v: land, kind: "hit", vin: vk, vout: vk * e });
                tt += T; vk *= e;
            }
        } else {
            var w = 2 * Math.PI * o.freq, lam = o.decay, amp = o.amount / 50;
            for (var p = 0; p < 6; p++) {
                var tp = (Math.PI / 2 + p * Math.PI) / w;
                var A = (speed / w) * Math.exp(-lam * tp) * amp;
                if (A < 0.4 || Lg.t + tp > Lg.next - fd * 3) break;
                var sg = (p % 2 === 0) ? 1 : -1, pk = [];
                for (d = 0; d < Lg.V.length; d++) pk.push(Lg.V[d] + dir[d] * A * sg);
                keys.push({ t: Lg.t + tp, v: pk, kind: "peak" });
            }
            if (keys.length) keys.push({ t: Math.min(Lg.next - fd, keys[keys.length - 1].t + Math.PI / w * 0.9), v: Lg.V.slice(0), kind: "rest" });
        }
        if (!keys.length) continue;
        // the landing key keeps flowing through instead of stopping dead
        var kIdx = prop.nearestKeyIndex(Lg.t), ori = UK.BN.isOri(prop);
        if (ori) { }
        else if (type !== "bounce") {
            var vin = Lg.v, vout = Lg.v;
            UK.BN.setSpeed(prop, kIdx, vin, vout, 33, 33);
        } else {
            var back = []; for (d = 0; d < dir.length; d++) back.push(-dir[d] * speed * o.elasticity);
            UK.BN.setSpeed(prop, kIdx, Lg.v, back, 33, 33);
        }
        for (var q = 0; q < keys.length; q++) {
            prop.setValueAtTime(keys[q].t, UK.BN.out(Lg.proto, keys[q].v));
            var ki = prop.nearestKeyIndex(keys[q].t);
            try { prop.setInterpolationTypeAtKey(ki, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); } catch (e1) { }
            var zero = []; for (d = 0; d < dir.length; d++) zero.push(0);
            if (keys[q].kind === "hit" && !ori) {
                var vi = [], vo = [];
                for (d = 0; d < dir.length; d++) { vi.push(dir[d] * keys[q].vin); vo.push(-dir[d] * keys[q].vout); }
                UK.BN.setSpeed(prop, ki, vi, vo, 33, 33);
            } else {
                UK.BN.setSpeed(prop, ki, zero, zero, keys[q].kind === "rest" ? 70 : 45, 45);
            }
            if (prop.isSpatial && !ori) { try { prop.setSpatialAutoBezierAtKey(ki, false); prop.setSpatialContinuousAtKey(ki, false); var z = (Lg.V.length === 3) ? [0, 0, 0] : [0, 0]; prop.setSpatialTangentsAtKey(ki, z, z); } catch (e2) { } }
            added++;
        }
    }
    return added;
};

UK.api.bounce = function (a) {
    var comp = UK.comp(false);
    UK._fd = comp.frameDuration;
    var T = UK.BN.targets(comp, a.prop || "auto");
    if (!T.length) throw new Error("Select a layer (or its keyframed property) with at least 2 keyframes.");
    var type = (a.type === "bounce") ? "bounce" : "overshoot";
    var strength = { soft: 0.6, medium: 1, strong: 1.6 }[a.strength || "medium"] || 1;
    var done = [];
    for (var i = 0; i < T.length; i++) {
        var p = T[i].prop, L = T[i].layer, lab = UK.BN.label(p);
        if (a.mode === "keys") {
            var n = UK.BN.bake(p, type, {
                amount: 50 * strength, freq: Number(a.freq) || 2.4, decay: Number(a.decay) || 5.5,
                gravity: Number(a.gravity) || UK.BN.autoGravity(p, UK.clamp((Number(a.elasticity) || 55) / 100 * Math.min(1.3, strength), 0.05, 0.9)), elasticity: UK.clamp((Number(a.elasticity) || 55) / 100 * Math.min(1.3, strength), 0.05, 0.9), maxBounces: 4
            });
            done.push(lab + " (+" + n + " keys)");
            continue;
        }
        UK.BN.prepLive(p);
        if (type === "bounce") {
            var e1 = UK.BN.ensureSlider(L, lab + " - Elasticity", Math.round(55 * Math.min(1.3, strength)));
            var e2 = UK.BN.ensureSlider(L, lab + " - Gravity", UK.BN.autoGravity(p, 0.55 * Math.min(1.3, strength)));
            var e3 = UK.BN.ensureSlider(L, lab + " - Max Bounces", 4);
            p.expression = UK.BN.exprBounce(e1, e2, e3, p.matchName === "ADBE Orientation");
            try { p.expressionEnabled = true; } catch (eE) { }
        } else {
            var o1 = UK.BN.ensureSlider(L, lab + " - Overshoot", Math.round(50 * strength));
            var o2 = UK.BN.ensureSlider(L, lab + " - Frequency", 2.4);
            var o3 = UK.BN.ensureSlider(L, lab + " - Decay", 5.5);
            p.expression = UK.BN.exprOvershoot(o1, o2, o3, p.matchName === "ADBE Orientation");
            try { p.expressionEnabled = true; } catch (eE2) { }
        }
        done.push(L.name + " > " + lab);
    }
    return { applied: done };
};

/* remove Ultimate Kit bounce from the selection */
UK.api.bounceRemove = function () {
    var comp = UK.comp(false);
    var T = UK.BN.targets(comp, "all"), n = 0;
    for (var i = 0; i < T.length; i++) {
        var p = T[i].prop;
        if (p.expression && p.expression.indexOf("// Ultimate Kit") === 0) { p.expression = ""; n++; }
        var lab = UK.BN.label(p), E = T[i].layer.property("ADBE Effect Parade");
        for (var k = E.numProperties; k >= 1; k--) if (E.property(k).name.indexOf(lab + " - ") === 0) E.property(k).remove();
    }
    return { removed: n };
};

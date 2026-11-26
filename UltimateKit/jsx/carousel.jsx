/*  Ultimate Kit - Carousel: the user's own rig (read from their project), for the photos they select.
      Carousel (3D Null)  Radius, Start Angle, Tilt X, Tilt Y (+ Spin, degrees per second), Photo Size, Card Ratio,
                          Corner, Keep Upright (moved here from the old Spin Carousel)
      each photo          3D, a rounded card (Scale + "Card" mask by expression), Position expression: on a ring of n
                          around the Null, idx * 360 / n apart from Start Angle, the ring tilted around X, then
                          around Y; level (Keep Upright) or turning with the ring (Z Rotation by its angle).       */
UK.CAR = { R: 650 / 1280, START: 348, TX: 82, TY: 410, SIZE: 532 / 1280 };
UK.CAR.expr = function (ctrl, n, idx) {
    return [
        'var ctrl = thisComp.layer("' + UK.WIPE.q(ctrl) + '");',
        'var r  = ctrl.effect("Radius")("ADBE Slider Control-0001");',
        'var sa = ctrl.effect("Start Angle")("ADBE Angle Control-0001") + ctrl.effect("Spin")("ADBE Slider Control-0001") * time;',
        'var tx = ctrl.effect("Tilt X")("ADBE Angle Control-0001");',
        'var ty = ctrl.effect("Tilt Y")("ADBE Angle Control-0001");',
        'var n = ' + n + '; var idx = ' + idx + ';',
        'var ang = degreesToRadians(sa + idx*360/n);',
        'var px = r*Math.sin(ang), py = 0, pz = r*Math.cos(ang);',
        'var ax = degreesToRadians(tx);',
        'var y1 = py*Math.cos(ax) - pz*Math.sin(ax);',
        'var z1 = py*Math.sin(ax) + pz*Math.cos(ax);',
        'py = y1; pz = z1;',
        'var ay = degreesToRadians(ty);',
        'var x1 = px*Math.cos(ay) + pz*Math.sin(ay);',
        'var z2 = -px*Math.sin(ay) + pz*Math.cos(ay);',
        'px = x1; pz = z2;',
        'var c = ctrl.transform.position;',
        '[c[0]+px, c[1]+py, c[2]+pz];'
    ].join("\n");
};
UK.CAR.build = function (comp, layers, a) {
    var W = comp.width, H = comp.height, K = UK.CAR, i;
    var N = comp.layers.addNull();
    N.name = UK.uniqueLayerName(comp, "Carousel");
    N.label = 1;
    N.threeDLayer = true;
    UK.pos(N).setValue([W / 2, H / 2, 0]);
    UK.slider(N, "Radius", Math.round((a.radius === undefined ? K.R : Number(a.radius) / 100) * W));        // a.radius / a.size: % of the comp width
    UK.fx(N, "ADBE Angle Control", "Start Angle").property(1).setValue(a.start === undefined ? K.START : Number(a.start));
    UK.fx(N, "ADBE Angle Control", "Tilt X").property(1).setValue(a.tiltX === undefined ? K.TX : Number(a.tiltX));
    UK.fx(N, "ADBE Angle Control", "Tilt Y").property(1).setValue(a.tiltY === undefined ? K.TY : Number(a.tiltY));
    UK.slider(N, "Spin", a.spin === undefined ? 0 : Number(a.spin));
    UK.slider(N, "Photo Size", UK.round(a.size === undefined ? K.SIZE * 100 : Number(a.size), 2));
    UK.slider(N, "Card Ratio", a.ratio === undefined ? 0 : Number(a.ratio));
    UK.slider(N, "Corner", a.corner === undefined ? 0 : Number(a.corner));
    UK.checkCtl(N, "Keep Upright", a.upright !== false);
    /* the card: Photo Size (% of the comp width) = its longer side; Card Ratio (height / width %, 0 = the photo's
       own); the photo scaled to cover it and cut to it by a rounded mask (Corner, px) */
    var q = UK.WIPE.q(N.name);
    var CARD = 'var C = thisComp.layer("' + q + '"), sz = C.effect("Photo Size")(1) / 100 * thisComp.width, rt = C.effect("Card Ratio")(1) / 100;\n' +
        'var w = Math.max(1, width), h = Math.max(1, height), cw, ch;\n' +
        'if (rt <= 0) { cw = w * sz / Math.max(w, h); ch = h * sz / Math.max(w, h); } else if (rt <= 1) { cw = sz; ch = sz * rt; } else { ch = sz; cw = sz / rt; }\n' +
        'var s = 100 * Math.max(cw / w, ch / h);\n';
    var MASK = CARD + 'var mw = cw * 100 / s, mh = ch * 100 / s, x0 = (w - mw) / 2, y0 = (h - mh) / 2, x1 = x0 + mw, y1 = y0 + mh;\n' +
        'var r = Math.max(0, Math.min(C.effect("Corner")(1) * 100 / s, mw / 2, mh / 2)), k = 0.5523 * r;\n' +
        'createPath([[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]],\n' +
        '  [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]],\n' +
        '  [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]], true)';
    var n = layers.length, top = null;
    for (i = 0; i < n; i++) {
        var L = layers[i];
        L.threeDLayer = true;
        try { L.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(1); } catch (e0) { }
        UK.scale(L).expression = CARD + '[s, s, s]';
        try {
            var Mk = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
            Mk.name = "Card";
            Mk.property("ADBE Mask Shape").expression = MASK;
        } catch (e1) { }
        UK.pos(L).expression = UK.CAR.expr(N.name, n, n - 1 - i);
        /* Keep Upright: the photos stay level; off: each one turns with the ring (by its angle on it) */
        UK.rot(L).expression = 'var C = thisComp.layer("' + q + '");\nC.effect("Keep Upright")(1) == 1 ? value : value + C.effect("Start Angle")(1) + C.effect("Spin")(1) * time + ' + (n - 1 - i) + ' * 360 / ' + n;
        if (!top || L.index < top.index) top = L;
    }
    N.moveBefore(top);
    var lo = 1e9, hi = -1e9;
    for (i = 0; i < n; i++) { lo = Math.min(lo, layers[i].inPoint); hi = Math.max(hi, layers[i].outPoint); }
    N.inPoint = Math.max(0, lo); N.outPoint = hi;
    N.comment = "Ultimate Kit Carousel: Radius, Start Angle, Tilt X, Tilt Y, Spin (degrees / second), Photo Size, Card Ratio (0 = the photo's own), Corner, Keep Upright. " + n + " photos.";
    return N;
};
/*  Path Carousel (cr02): the photos ride a path layer, after the user's own set-up (a 3D shape layer with a
    stroked bezier path, Orientation Y 329.6, Trim Paths End 0 > 34 > 46 > 100 with a speed ramp).
      Carousel Path  3D (or 2D) shape layer: Path, Stroke, Trim Paths (End keyframes) + controls as effects:
                     Spacing (% of the path between photos), Photo Size (% of comp width), Align (follow the
                     path's direction, %), Lift (out of the path's plane), Line Color, Line Width
      each photo     parented to the path (so it lies in the path's plane, not facing the camera); Position =
                     the point on the path at End - i * Spacing (+ Offset), Rotation = the path's direction * Align
    Edit the path, its Trim End keyframes / speed graph, Offset, or rotate the layer: the photos follow.        */
UK.CAR.TRIM = { keys: [[0, 0], [0.7667, 34], [3.0333, 46], [3.6333, 100]], dur: 3.6333,
    ease: [[null, [0, 33.3333]], [[1.6463, 94.5744], [1.6463, 33.3333]], [[2.6266, 33.3333], [2.6266, 89.9452]], [[0, 33.3333], null]] };
UK.CAR.shape = function (kind, W, H) {
    var s = W / 1280, k = 0.5523;
    switch (kind) {
        // (open paths reach past the frame on both sides: the photos come in from outside and leave it again)
        case "line": return { v: [[-0.68 * W, 0], [0.68 * W, 0]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], c: false };
        case "arc": return { v: [[-0.66 * W, 0.62 * H], [0, -0.2 * H], [0.66 * W, 0.62 * H]], i: [[0, 0], [-0.3 * W, 0], [-0.12 * W, -0.45 * H]], o: [[0.12 * W, -0.45 * H], [0.3 * W, 0], [0, 0]], c: false };
        case "wave": var v = [], ii = [], oo = [], n = 5, j;
            for (j = 0; j < n; j++) { v.push([-0.68 * W + j * 1.36 * W / (n - 1), (j % 2 ? -1 : 1) * 0.13 * H]); ii.push([-0.13 * W, 0]); oo.push([0.13 * W, 0]); }
            ii[0] = [0, 0]; oo[n - 1] = [0, 0];
            return { v: v, i: ii, o: oo, c: false };
        case "circle": var r = 0.3 * W;
            return { v: [[0, -r], [r, 0], [0, r], [-r, 0]], i: [[-k * r, 0], [0, -k * r], [k * r, 0], [0, k * r]], o: [[k * r, 0], [0, k * r], [-k * r, 0], [0, -k * r]], c: true };
        default:   // the user's S curve
            var V = [[-706.286, 406.857], [-292.571, 62.857], [245.715, -6.857], [598.857, -378.286]], I = [[0, 0], [-174.857, 17.143], [-122.286, 40], [-122.286, 2.286]], O = [[0, 0], [174.857, -17.143], [122.285, -40], [122.286, -2.286]];
            var sc = function (a) { var r2 = [], q; for (q = 0; q < a.length; q++) r2.push([a[q][0] * s * 1.3, a[q][1] * s * 1.3]); return r2; };   // 1.3: past the frame
            return { v: sc(V), i: sc(I), o: sc(O), c: false };
    }
};
/*  where photo i is: raw = End - i * Spacing - (its own size, so it starts just outside the path's start)
    + Start * (the whole train + Exit) + Offset. Trim End brings the photos in (and the line draws), Trim Start
    takes them out (and the line erases). Off the ends of an open path they keep going straight on along the
    end tangent, so they fly in from outside the frame and leave it completely.                               */
UK.CAR.pathExpr = function (pq, n, i, three, what) {
    if (what === "scale") return 'var P = thisComp.layer("' + pq + '"), s = P.effect("Photo Size")(1) / 100 * thisComp.width / Math.max(1, Math.max(width, height)) * 100;\n' + (three ? '[s, s, s]' : '[s, s]');
    var head = 'var P = thisComp.layer("' + pq + '"), sh = P.content("Path").content("Path 1").path, T = P.content("Trim Paths 1");\n' +
        'var n = ' + n + ', i = ' + i + ', gap = P.effect("Spacing")(1) / 100, L = 0, a = sh.pointOnPath(0), b, k;\n' +
        'for (k = 1; k <= 24; k++) { b = sh.pointOnPath(k / 24); L += length(a, b); a = b; }\n' +
        'var pre = sh.isClosed() ? 0 : 0.75 * P.effect("Photo Size")(1) / 100 * thisComp.width / Math.max(1, L);\n' +
        'var raw = T.end / 100 - i * gap - pre * (1 - T.end / 100) + T.start / 100 * ((n - 1) * gap + P.effect("Exit")(1) / 100) + T.offset / 360, p = raw;\n' +
        'if (sh.isClosed()) p = p - Math.floor(p);\n' +
        'var q = clamp(p, 0, 1), over = sh.isClosed() ? 0 : (p > 1 ? p - 1 : (p < 0 ? p : 0));\n';
    if (what === "pos") return head + 'var pt = sh.pointOnPath(q), tg = normalize(sh.tangentOnPath(q));\npt = pt + tg * over * L;\n' + (three ? '[pt[0], pt[1], -P.effect("Lift")(1)]' : '[pt[0], pt[1]]');
    if (what === "rot") return head + 'var tg = sh.tangentOnPath(q);\nradiansToDegrees(Math.atan2(tg[1], tg[0])) * P.effect("Align")(1) / 100';
    // opacity: on an open path the photos are simply outside the frame before / after; on a closed one they
    // appear as the trim head reaches them and fade out with Trim Start
    return head + 'sh.isClosed() ? 100 * clamp((T.end / 100 - i * gap) / 0.02, 0, 1) * (1 - T.start / 100) : 100';
};
UK.CAR.buildPath = function (comp, layers, a) {
    var W = comp.width, H = comp.height, fd = comp.frameDuration, three = a.mode !== "2d", K = UK.CAR.TRIM, i;
    var D = UK.clamp(Number(a.dur) || K.dur, 4 * fd, 120), t0 = UK.snap(comp, Number(a.t0 !== undefined ? a.t0 : comp.time)), n = layers.length;
    var sh = UK.CAR.shape(a.shape || "scurve", W, H);
    var P = UK.shapeLayer(comp, UK.uniqueLayerName(comp, "Carousel Path"));
    P.label = 8;
    P.threeDLayer = three;
    UK.pos(P).setValue(three ? [W / 2, H / 2, 0] : [W / 2, H / 2]);
    if (three) P.property("ADBE Transform Group").property("ADBE Orientation").setValue([0, 329.6, 0]);
    var g = UK.group(UK.root(P), "Path");
    var pp = UK.vecs(g).addProperty("ADBE Vector Shape - Group");
    pp.name = "Path 1";
    var S = new Shape(); S.vertices = sh.v; S.inTangents = sh.i; S.outTangents = sh.o; S.closed = sh.c;
    UK.root(P).property("Path").property("ADBE Vectors Group").property("Path 1").property("ADBE Vector Shape").setValue(S);
    UK.addStroke(UK.vecs(UK.root(P).property("Path")), "#FFFFFF", 18, { cap: 2, join: 2 }, "Stroke 1");
    UK.root(P).addProperty("ADBE Vector Filter - Trim");
    // controls on the path layer itself
    UK.slider(P, "Spacing", a.spacing === undefined ? Math.round(100 / n * 100) / 100 : Number(a.spacing));
    UK.slider(P, "Photo Size", a.size === undefined ? 22 : Number(a.size));
    UK.slider(P, "Align", a.align === undefined ? 0 : Number(a.align));
    UK.slider(P, "Lift", 0);
    UK.slider(P, "Exit", a.exit === undefined ? 60 : Number(a.exit));     // how far past the end the last photo goes (% of the path)
    if (three) UK.fx(P, "ADBE Angle Control", "Rotation Y").property(1).setValue(a.rotY === undefined ? 0 : Number(a.rotY));   // turns every photo around its own Y axis
    UK.colorCtl(P, "Line Color", a.lineColor || "#FFFFFF");
    UK.slider(P, "Line Width", a.lineW === undefined ? 18 : Number(a.lineW));
    var st = UK.root(P).property("Path").property("ADBE Vectors Group").property("Stroke 1");
    st.property("ADBE Vector Stroke Color").expression = 'effect("Line Color")(1)';
    st.property("ADBE Vector Stroke Width").expression = 'effect("Line Width")(1)';
    // Trim End: the user's keyframes and speed ramp, stretched to D
    var end = UK.root(P).property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End"), m = K.dur / D;
    for (i = 0; i < K.keys.length; i++) end.setValueAtTime(t0 + K.keys[i][0] / K.dur * D, K.keys[i][1]);
    for (i = 0; i < K.keys.length; i++) {
        var ei = K.ease[i][0] || K.ease[i][1], eo = K.ease[i][1] || K.ease[i][0];
        end.setTemporalEaseAtKey(i + 1, [new KeyframeEase(ei[0] * m, ei[1])], [new KeyframeEase(eo[0] * m, eo[1])]);
    }
    // Trim Start: the way out, as fast as the way in: from where the fast part starts (0.835 D) to 1.2 D,
    // leaving the slow part gently and speeding up (the mirror of the entry)
    var stp = UK.root(P).property("ADBE Vector Filter - Trim").property("ADBE Vector Trim Start");
    stp.setValueAtTime(t0 + 0.835 * D, 0); stp.setValueAtTime(t0 + 1.2 * D, 100);
    stp.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33.3333)], [new KeyframeEase(0, 85)]);
    stp.setTemporalEaseAtKey(2, [new KeyframeEase(0, 20)], [new KeyframeEase(0, 33.3333)]);
    // the photos
    var pq = UK.WIPE.q(P.name), top = null;
    for (i = 0; i < n; i++) {
        var L = layers[i];
        L.threeDLayer = three;
        try { L.setParentWithJump(P); } catch (e0) { L.parent = P; }
        var T = L.property("ADBE Transform Group");
        try { T.property("ADBE Anchor Point").setValue(three ? [L.width / 2, L.height / 2, 0] : [L.width / 2, L.height / 2]); } catch (e1) { }
        if (three) {
            T.property("ADBE Orientation").setValue([0, 0, 0]); T.property("ADBE Rotate X").setValue(0);
            T.property("ADBE Rotate Y").expression = 'thisComp.layer("' + pq + '").effect("Rotation Y")(1)';
            try { L.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(1); } catch (e2) { }
        }
        T.property("ADBE Position").expression = UK.CAR.pathExpr(pq, n, i, three, "pos");
        T.property("ADBE Rotate Z").expression = UK.CAR.pathExpr(pq, n, i, three, "rot");
        T.property("ADBE Scale").expression = UK.CAR.pathExpr(pq, n, i, three, "scale");
        T.property("ADBE Opacity").expression = UK.CAR.pathExpr(pq, n, i, three, "op");
        if (!top || L.index < top.index) top = L;
    }
    P.moveBefore(top);
    P.comment = "Ultimate Kit Path Carousel: Trim End brings the photos in, Trim Start takes them out (keyframes / speed graph), Offset moves them. Spacing, Photo Size, Align, Lift, Exit, Rotation Y, Line Color / Width are on this layer.";
    return P;
};
/*  Card Spin (cr04, from the user's reference video; look and timing: shared/cardspin.js). The selected photos are
    precomposed ("Card Spin"). Inside:
      Card Spin Controls  null with every control: Speed (cards / s, more = faster), Motion Blur %, Warp %, Hold (the
                          first photo stays), Spin Up (slow start, speeding up), Spin Time, Stop Time (the last photo
                          slowing down into the middle), End Hold, Card Size (% of the shorter side); "Distance" and
                          "Travel" (px, by expression from them); "Lift" = the first photo's jump up (keyframes)
      Lens                adjustment layer: Directional Blur across (from the speed) and up (from the jump), and
                          Bulge (the lens warp of the whole strip: big in the middle, curved and squeezed to the sides)
      the photos          upright cards: the first one in the middle, the stream behind it from the right edge (two
                          rows, the photos repeated), and the last photo after a gap; rounded by a mask             */UK.CAR.roundRect = function (x0, y0, w, h, r) {
    var k = 0.5523 * r, x1 = x0 + w, y1 = y0 + h;
    return UK.makeShape(
        [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]],
        [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]],
        [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]], true);
};
UK.CAR.buildCardSpin = function (comp, layers, a) {
    var D = UK_CSPIN.DEF, c = {}, k, i;
    for (k in D) c[k] = D[k];
    if (a.cs) for (k in a.cs) if (a.cs[k] !== undefined && a.cs[k] !== null && !isNaN(Number(a.cs[k]))) c[k] = Number(a.cs[k]);
    var n = layers.length, T = UK_CSPIN.times(c);
    var idx = []; for (i = 0; i < n; i++) idx.push(layers[i].index);
    idx.sort(function (x, y) { return x - y; });
    var t0 = comp.time;
    var Cc = comp.layers.precompose(idx, UK.uniqueName("Card Spin"), true);
    try { Cc.parentFolder = UK.folder("Carousel"); } catch (e0) { }
    Cc.duration = Math.max(Cc.duration, T.end + 0.5);
    var PL = comp.layer(idx[0]);
    PL.startTime = t0; PL.inPoint = t0; PL.outPoint = Math.min(comp.duration, t0 + T.end);
    UK._fd = Cc.frameDuration;
    var photos = [];
    for (i = 1; i <= Cc.numLayers; i++) photos.push(Cc.layer(i));       // top layer first = the first photo
    var W = Cc.width, H = Cc.height, G0 = UK_CSPIN.geo(c, W, H), K = UK_CSPIN.count(c, G0);
    /* the controls */
    var N = Cc.layers.addNull();
    N.name = "Card Spin Controls"; N.label = 2;
    var sl = function (nm, v) { UK.slider(N, nm, v); };
    sl("Speed", c.speed); sl("Motion Blur", c.blur); sl("Warp", c.warp);
    sl("Hold", c.hold); sl("Spin Up", c.up); sl("Spin Time", c.spin); sl("Stop Time", c.stop); sl("End Hold", c.endHold);
    sl("Card Size", c.size);
    var Wx = 'effect("Card Size")(1) / 100 * Math.min(thisComp.width, thisComp.height)';
    sl("Distance", 0);
    UK.efx(N, "Distance").property(1).expression = 'var w = ' + Wx + ';\n' + UK_CSPIN.DIST_EXPR('w * ' + (1 + UK_CSPIN.GAP), 'thisComp.width / 2 + w * 0.7 - w * ' + (1 + UK_CSPIN.GAP) + ' / 2', 'thisComp.width * 0.55 + w');
    sl("Travel", 0);
    UK.efx(N, "Travel").property(1).expression = UK_CSPIN.TRAVEL_EXPR();
    sl("Lift", 0);
    var LK = UK_CSPIN.liftKeys(G0, H), lk = [];
    for (i = 0; i < LK.length; i++) lk.push([LK[i][0], UK.round(LK[i][1], 2)]);
    UK.anim(UK.efx(N, "Lift").property(1), lk, ["out", "inout", "inout"]);
    var CT = 'thisComp.layer("Card Spin Controls")';
    /* shared heads of the card expressions: geometry, the run, the end */
    var GEO = 'var C = ' + CT + ', w = C.effect("Card Size")(1) / 100 * Math.min(thisComp.width, thisComp.height), h = w * ' + c.ratio + ', S = w * ' + (1 + UK_CSPIN.GAP) + ';\n' +
        'var E = thisComp.width / 2 + w * 0.7 - S / 2, gapEnd = thisComp.width * 0.55 + w, F = C.effect("Distance")(1), d = C.effect("Travel")(1);\n' +
        'var y0 = Math.min(thisComp.height * ' + UK_CSPIN.ROW_Y + ', thisComp.height - h * ' + UK_CSPIN.ROW2 + ' - h * 0.75);\n';
    var OUTS = 'var t4 = ' + UK_CSPIN.POP + ' + C.effect("Hold")(1) + Math.max(0.01, C.effect("Spin Up")(1)) + C.effect("Spin Time")(1) + Math.max(0.01, C.effect("Stop Time")(1)), tOut = t4 + C.effect("End Hold")(1);\n' +
        'function outS(t) { var u = (t - tOut) / ' + UK_CSPIN.OUT + '; if (u <= 0) return 1; if (u >= 1) return 0; if (u < 0.25) return 1 + 0.05 * Math.sin(u / 0.25 * Math.PI / 2); var b = (u - 0.25) / 0.75; return 1.05 * (1 - b * b * b); }\n';
    var card = function (L0, j, isEnd) {
        var Lr = L0;
        Lr.threeDLayer = false;
        Lr.inPoint = 0; Lr.outPoint = Cc.duration;
        var lw = Lr.width, lh = Lr.height, cw, ch;
        if (lh / lw > c.ratio) { cw = lw; ch = lw * c.ratio; } else { ch = lh; cw = lh / c.ratio; }
        var Ms = Lr.property("ADBE Mask Parade");
        while (Ms.numProperties) Ms.property(1).remove();
        Ms.addProperty("ADBE Mask Atom").name = "Card";
        Lr.property("ADBE Mask Parade").property("Card").property("ADBE Mask Shape").setValue(UK.CAR.roundRect((lw - cw) / 2, (lh - ch) / 2, cw, ch, cw * 0.07));
        var Tr = Lr.property("ADBE Transform Group");
        try { while (Tr.property("ADBE Position").numKeys) Tr.property("ADBE Position").removeKey(1); } catch (e1) { }
        try { Lr.parent = null; } catch (e2) { }
        UK.anchor(Lr).setValue([lw / 2, lh / 2]);
        UK.rot(Lr).setValue(0);
        var sc = 'var s = w / ' + UK.round(cw, 3) + ' * 100';
        if (isEnd) {
            UK.pos(Lr).expression = GEO + '[thisComp.width / 2 + F - d, y0]';
            UK.scale(Lr).expression = GEO + OUTS + 'var xo = F - d;\n' + UK_CSPIN.PLACE_EXPR(1) + sc + ' * ps * outS(time);\n[s, s]';
            Lr.comment = "Ultimate Kit Card Spin: the last photo";
        } else {
            var st = j === 0 ? '0' : 'E + ' + j + ' * S / 2', row = j % 2;
            UK.pos(Lr).expression = GEO + 'var x0 = ' + st + ';\n[thisComp.width / 2 + x0 - d, y0' + (row ? ' + h * ' + UK_CSPIN.ROW2 : '') + (j === 0 ? ' + C.effect("Lift")(1)' : '') + ']';
            UK.scale(Lr).expression = GEO + 'var xo = ' + st + ' - d;\n' + UK_CSPIN.PLACE_EXPR(j) + sc + ' * ps;\n[s, s]';
            if (j > 0) UK.opac(Lr).expression = GEO + '(E + ' + j + ' * S / 2 <= F - gapEnd) ? 100 : 0';
            Lr.comment = "Ultimate Kit Card Spin: card " + (j + 1);
        }
    };
    /* the last photo first (a copy of the bottom photo), then the stream (the photos repeated) */
    var endL = photos[n - 1].duplicate(); endL.name = photos[n - 1].name + " (end)";
    card(endL, 0, true);
    for (var j = 0; j < K; j++) {
        var src = photos[j % n], Lr;
        if (j < n) Lr = src; else { Lr = src.duplicate(); Lr.name = src.name + " " + (Math.floor(j / n) + 1); }
        card(Lr, j, false);
    }
    /* the lens: motion blur across (the run) and up (the jump), then the bulge over the whole strip */
    var Lz = Cc.layers.addSolid([1, 1, 1], "Lens", W, H, Cc.pixelAspect);
    Lz.adjustmentLayer = true; Lz.label = 2;
    Lz.inPoint = 0; Lz.outPoint = Cc.duration;
    var blurOf = function (nm, dir, prop) {
        UK.fx(Lz, "ADBE Motion Blur", nm);
        UK.efx(Lz, nm).property("ADBE Motion Blur-0001").setValue(dir);
        UK.efx(Lz, nm).property("ADBE Motion Blur-0002").expression = 'var C = ' + CT + ', fd = thisComp.frameDuration;\n' +
            'var v = Math.abs(C.effect("' + prop + '")(1) - C.effect("' + prop + '")(1).valueAtTime(time - fd));\n' +
            'Math.min(600, C.effect("Motion Blur")(1) / 100 * v * ' + UK_CSPIN.BLUR + ')';
    };
    blurOf("Motion Blur", 90, "Travel");
    blurOf("Rise Blur", 0, "Lift");
    UK.fx(Lz, "ADBE Bulge", "Warp");
    var GB = 'var C = ' + CT + ', w = C.effect("Card Size")(1) / 100 * Math.min(thisComp.width, thisComp.height), h = w * ' + c.ratio + ';\n';
    UK.efx(Lz, "Warp").property("ADBE Bulge-0001").expression = GB + 'Math.max(thisComp.width * ' + UK_CSPIN.LENS_RX + ', w * 2.2)';
    UK.efx(Lz, "Warp").property("ADBE Bulge-0002").expression = GB + 'h * ' + UK_CSPIN.LENS_RY;
    UK.efx(Lz, "Warp").property("ADBE Bulge-0003").expression = GB + '[thisComp.width / 2, Math.min(thisComp.height * ' + UK_CSPIN.ROW_Y + ', thisComp.height - h * ' + UK_CSPIN.ROW2 + ' - h * 0.75)]';
    UK.efx(Lz, "Warp").property("ADBE Bulge-0004").expression = GB + 'C.effect("Warp")(1) / 100';
    Lz.moveToBeginning(); N.moveToBeginning();
    N.comment = "Ultimate Kit Card Spin: Speed, Motion Blur, Warp, Hold, Spin Up, Spin Time, Stop Time, End Hold, Card Size; Lift = the first photo's jump (keyframes).";
    var eg = ["Speed", "Motion Blur", "Warp", "Hold", "Spin Up", "Spin Time", "Stop Time", "End Hold", "Card Size"];
    for (i = eg.length - 1; i >= 0; i--) UK.essential(Cc, UK.efx(N, eg[i]).property(1), eg[i]);
    PL.comment = "Ultimate Kit Card Spin: the controls are on 'Card Spin Controls' inside this precomp (and in Essential Properties).";
    return PL;
};
/*  cr05 "Photo Burst" (shared/burst.js): the selected photos are thrown up from under the frame as small cards and in
    one unbroken arc pour out towards the camera; then the "Last Image" card follows. Everything in one precomp:
      Last Image             (on top) a comp the size of a photo: a rounded "Image Shape" (white until an image is
                             matted into it) and a switched-off null "Place your image"
      Photo Burst Controls   null: Count (photos in the stream, the photos repeated; up to the cards built), Spacing
                             (time between photos, %), Speed (%), Rotation (%), Spread (%), Card Size (% of the shorter
                             side), Last Delay (s)
      the cards              keyframes with speed ramps: X / Y Position (separate), Scale, Rotation (shared/burst.js);
                             a short expression on each plays its keys by the controls. Rounded square mask, drop
                             shadow, motion blur.                                                                   */
UK.CAR.burstKeys = function (prop, K, e0, dims) {
    var m, B = KeyframeInterpolationType.BEZIER, ix = [];
    for (m = 0; m < K.length; m++) {
        var v = UK.round(K[m].v, 2);
        prop.setValueAtTime(e0 + K[m].t, dims === 2 ? [v, v] : v);
    }
    for (m = 0; m < K.length; m++) ix.push(prop.nearestKeyIndex(e0 + K[m].t));
    for (m = 0; m < K.length; m++) {
        var ei = [], eo = [], d, ne = prop.propertyValueType === PropertyValueType.ThreeD ? 3 : (prop.propertyValueType === PropertyValueType.TwoD ? 2 : 1);
        for (d = 0; d < ne; d++) {
            ei.push(new KeyframeEase(UK.round(K[m].inS, 3), UK.clamp(K[m].inI * 100, 0.1, 100)));
            eo.push(new KeyframeEase(UK.round(K[m].outS, 3), UK.clamp(K[m].outI * 100, 0.1, 100)));
        }
        prop.setInterpolationTypeAtKey(ix[m], B, B);
        prop.setTemporalEaseAtKey(ix[m], ei, eo);
    }
};
UK.CAR.buildBurst = function (comp, layers, a) {
    var D = UK_BURST.DEF, c = {}, k, i;
    for (k in D) c[k] = D[k];
    if (a.bs) for (k in a.bs) if (a.bs[k] !== undefined && a.bs[k] !== null && !isNaN(Number(a.bs[k]))) c[k] = Number(a.bs[k]);
    var n = layers.length, n0 = Math.max(1, Math.min(150, Math.round(c.count) > 0 ? Math.round(c.count) : n));
    var pool = Math.min(150, Math.max(n0 + 20, n0 * 2));
    var idx = []; for (i = 0; i < n; i++) idx.push(layers[i].index);
    idx.sort(function (x, y) { return x - y; });
    var t0 = comp.time, pw = layers[0].width, ph = layers[0].height;
    for (i = 0; i < n; i++) if (layers[i].index === idx[0]) { pw = layers[i].width; ph = layers[i].height; }
    var Cc = comp.layers.precompose(idx, UK.uniqueName("Photo Burst"), true);
    try { Cc.parentFolder = UK.folder("Carousel"); } catch (e0) { }
    var W = Cc.width, H = Cc.height, endT = UK_BURST.end(pool, c, W, H) + 0.5;
    Cc.duration = Math.max(Cc.duration, endT);
    Cc.motionBlur = true;
    var PL = comp.layer(idx[0]);
    PL.startTime = t0; PL.inPoint = t0; PL.outPoint = Math.min(comp.duration, t0 + Cc.duration);
    UK._fd = Cc.frameDuration;
    var photos = [];
    for (i = 1; i <= Cc.numLayers; i++) photos.push(Cc.layer(i));       // top layer first = the first photo
    /* the logo card: a comp the size of a photo with a rounded shape (white until the user's image is matted into it)
       and a switched-off null that names the place */
    var LI = app.project.items.addComp("Last Image", Math.max(4, Math.round(pw)), Math.max(4, Math.round(ph)), 1, Cc.duration, Cc.frameRate);
    try { LI.parentFolder = UK.folder("Carousel"); } catch (e1) { }
    var Sl = UK.shapeLayer(LI, "Image Shape"), Sg = UK.group(UK.root(Sl), "Shape");
    UK.addRect(UK.vecs(Sg), [LI.width, LI.height], [0, 0], UK.round(Math.min(LI.width, LI.height) * 0.08, 1), "Rectangle");
    UK.addFill(UK.vecs(Sg), "#FFFFFF", 100, "Fill");
    UK.pos(Sl).setValue([LI.width / 2, LI.height / 2]);
    var Gn = LI.layers.addNull(); Gn.name = "Place your image"; Gn.label = 2; Gn.enabled = false;
    Gn.inPoint = 0; Gn.outPoint = LI.duration;
    /* the controls */
    var N = Cc.layers.addNull();
    N.name = "Photo Burst Controls"; N.label = 2;
    N.inPoint = 0; N.outPoint = Cc.duration;
    var sl = function (nm, v) { UK.slider(N, nm, v); };
    sl("Count", n0); sl("Spacing", c.spacing); sl("Speed", c.speed); sl("Rotation", c.rotation); sl("Spread", c.spread);
    sl("Card Size", c.size); sl("Last Delay", c.lag);
    var CT = 'var C = thisComp.layer("Photo Burst Controls"), v = Math.max(1, C.effect("Speed")(1)) / 100, sp = Math.max(0, C.effect("Spacing")(1)) / 100;\n';
    var cards = [];
    var card = function (Lr, j, last) {
        Lr.threeDLayer = false;
        Lr.inPoint = 0; Lr.outPoint = Cc.duration;
        try { Lr.parent = null; } catch (e2) { }
        var lw = Lr.width, lh = Lr.height, side = Math.min(lw, lh);
        var Ms = Lr.property("ADBE Mask Parade");
        while (Ms.numProperties) Ms.property(1).remove();
        Ms.addProperty("ADBE Mask Atom").name = "Card";
        Ms.property("Card").property("ADBE Mask Shape").setValue(UK.CAR.roundRect((lw - side) / 2, (lh - side) / 2, side, side, side * 0.08));
        var Tr = Lr.property("ADBE Transform Group"), q, nm = ["ADBE Position", "ADBE Position_0", "ADBE Position_1", "ADBE Scale", "ADBE Rotate Z", "ADBE Opacity"];
        try { Tr.property("ADBE Position").dimensionsSeparated = false; } catch (e3a) { }
        for (q = 0; q < nm.length; q++) { var pr = Tr.property(nm[q]); try { pr.expression = ""; while (pr.numKeys) pr.removeKey(1); } catch (e3) { } }
        Tr.property("ADBE Position").dimensionsSeparated = true;
        UK.anchor(Lr).setValue([lw / 2, lh / 2]);
        UK.opac(Lr).setValue(100);
        var e0 = UK_BURST.launch(last ? n0 : j, n0, c), K = UK_BURST.card(last ? n0 : j, e0, c, W, H, last);
        var X = Tr.property("ADBE Position_0"), Y = Tr.property("ADBE Position_1"), S = UK.scale(Lr), Rz = UK.rot(Lr);
        UK.CAR.burstKeys(X, K.x, e0, 1);
        UK.CAR.burstKeys(Y, K.y, e0, 1);
        UK.CAR.burstKeys(S, K.s, e0, 2);
        UK.CAR.burstKeys(Rz, K.r, e0, 1);
        /* play the keys by the controls: card j launches at j x the spacing, the last card after the stream + Last Delay */
        var TL = last
            ? 'var n = Math.min(' + pool + ', Math.max(1, Math.round(C.effect("Count")(1))));\nvar tl = ' + UK.round(e0, 4) + ' + v * time - (n * ' + UK.round(UK_BURST.DT, 5) + ' * sp + C.effect("Last Delay")(1));\n'
            : 'var tl = ' + UK.round(e0, 4) + ' * (1 - sp) + v * time;\n';
        X.expression = CT + TL + 'var w = thisComp.width / 2;\nw + (valueAtTime(tl) - w) * C.effect("Spread")(1) / 100';
        Y.expression = CT + TL + 'valueAtTime(tl)';
        S.expression = CT + TL + 'var s = valueAtTime(tl), k = C.effect("Card Size")(1) / 100 * Math.min(thisComp.width, thisComp.height) / ' + side + ';\n[s[0] * k, s[1] * k]';
        Rz.expression = CT + TL + 'valueAtTime(tl) * C.effect("Rotation")(1) / 100';
        if (!last) UK.opac(Lr).expression = 'var C = thisComp.layer("Photo Burst Controls");\n' + j + ' < Math.round(C.effect("Count")(1)) ? value : 0';
        /* the soft shadow down to the left (kept there while the card turns) */
        var Sh = UK.fx(Lr, "ADBE Drop Shadow", "Shadow");
        UK.safeSet(Sh.property("ADBE Drop Shadow-0001"), [0, 0, 0, 1]);
        UK.safeSet(Sh.property("ADBE Drop Shadow-0002"), Sh.property("ADBE Drop Shadow-0002").maxValue > 100 ? 0.3 * 255 : 30);
        Sh.property("ADBE Drop Shadow-0003").expression = '225 - transform.rotation';
        UK.safeSet(Sh.property("ADBE Drop Shadow-0004"), UK.round(side * 0.16, 1));
        UK.safeSet(Sh.property("ADBE Drop Shadow-0005"), UK.round(side * 0.3, 1));
        try { Lr.motionBlur = true; } catch (e5) { }
        Lr.comment = "Ultimate Kit Photo Burst: " + (last ? "the last image (your image goes into the 'Last Image' comp)" : "card " + (j + 1));
        cards.push(Lr);
    };
    for (var j = 0; j < pool; j++) {
        var src = photos[j % n], Lr;
        if (j < n) Lr = src; else { Lr = src.duplicate(); Lr.name = src.name + " " + (Math.floor(j / n) + 1); }
        card(Lr, j, false);
    }
    var LL = Cc.layers.add(LI);
    card(LL, n0, true);
    /* the first card over the later ones; the controls, and the Last Image on the very top */
    for (j = pool - 1; j >= 0; j--) cards[j].moveToBeginning();
    N.moveToBeginning();
    LL.moveToBeginning();
    N.comment = "Ultimate Kit Photo Burst: Count (up to " + pool + "), Spacing, Speed, Rotation, Spread, Card Size, Last Delay.";
    var eg = ["Count", "Spacing", "Speed", "Rotation", "Spread", "Card Size", "Last Delay"];
    for (i = eg.length - 1; i >= 0; i--) UK.essential(Cc, UK.efx(N, eg[i]).property(1), eg[i]);
    PL.comment = "Ultimate Kit Photo Burst: the controls are on 'Photo Burst Controls' inside this precomp (and in Essential Properties); your image goes into the 'Last Image' comp.";
    return PL;
};/*  cr06 "Sphere Carousel" (shared/sphere.js): the cards on a 3D ball, turning to bring a card to the front.
    In the active comp, one precomp "Sphere Carousel":
      Carousel Controls   Focus (the card at the front: key it, the ball turns from card to card along the keys'
                          speed ramp), Distance (%: how far apart the cards are), Tilt (%: every card's random tilt;
                          each card's own X / Y / Z Rotation is added on top), Card Size (%), Entry (keys 0 -> 100:
                          the cards round the first one come in from outside)
      Carousel Camera     a wide camera (strong perspective)
      Sphere Center       the ball's centre; the cards turn round it (from Focus) and look at the camera
      Card 1 .. n         3D, on the ball, facing the camera (+ random Tilt); each is a "Photo k" precomp: a rounded "Card Shape" (track
                          matte) and the photo (or a coloured numbered proxy to replace)                          */
UK.CAR.SPH_COLS = [[0.49, 0.36, 1], [0.13, 0.83, 0.93], [0.96, 0.62, 0.04], [0.06, 0.73, 0.51], [0.96, 0.45, 0.71], [0.99, 0.57, 0.24], [0.23, 0.51, 0.96], [0.94, 0.27, 0.27]];
UK.CAR.photoComp = function (k, srcLayer, dur, fps, dims) {
    var S = dims || UK_SPHERE, pc = app.project.items.addComp(UK.uniqueName("Photo " + k), S.CW, S.CH, 1, dur, fps);     // (dims: { CW, CH, CORNER })
    try { pc.parentFolder = UK.folder("Carousel"); } catch (e0) { }
    var content = [];
    if (srcLayer) {
        srcLayer.copyToComp(pc);
        var P = pc.layer(1);
        try { P.parent = null; } catch (e1) { }
        P.threeDLayer = false; P.startTime = 0; P.inPoint = 0; P.outPoint = dur;
        var Tr = P.property("ADBE Transform Group");
        var nm = ["ADBE Position", "ADBE Scale", "ADBE Rotate Z", "ADBE Anchor Point", "ADBE Opacity"];
        for (var q = 0; q < nm.length; q++) { var pr = Tr.property(nm[q]); try { pr.expression = ""; while (pr.numKeys) pr.removeKey(1); } catch (e2) { } }
        Tr.property("ADBE Anchor Point").setValue([P.width / 2, P.height / 2]);
        Tr.property("ADBE Position").setValue([S.CW / 2, S.CH / 2]);
        var s = 100 * Math.max(S.CW / Math.max(1, P.width), S.CH / Math.max(1, P.height));
        Tr.property("ADBE Scale").setValue([s, s]);
        Tr.property("ADBE Rotate Z").setValue(0); Tr.property("ADBE Opacity").setValue(100);
        content.push(P);
    } else {
        var col = UK.CAR.SPH_COLS[(k - 1) % UK.CAR.SPH_COLS.length];
        var Px = UK.shapeLayer(pc, "Proxy"), g = UK.group(UK.root(Px), "Proxy");
        UK.addRect(UK.vecs(g), [S.CW, S.CH], [0, 0], 0, "Rect");
        var f = UK.vecs(g).addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue([col[0], col[1], col[2], 1]);
        UK.pos(Px).setValue([S.CW / 2, S.CH / 2]);
        var Nm = UK.addText(pc, String(k), { size: Math.round(S.CW * 0.5), name: "Number" });
        content.push(Px, Nm);
    }
    var Sh = UK.shapeLayer(pc, "Card Shape"), sg = UK.group(UK.root(Sh), "Card");
    UK.addRect(UK.vecs(sg), [S.CW, S.CH], [0, 0], S.CORNER, "Rect");
    UK.addFill(UK.vecs(sg), "#FFFFFF", 100, "Fill");
    UK.pos(Sh).setValue([S.CW / 2, S.CH / 2]);
    Sh.moveToBeginning();
    for (var j = 0; j < content.length; j++) {
        if (typeof content[j].setTrackMatte === "function") content[j].setTrackMatte(Sh, TrackMatteType.ALPHA);
        else { content[j].moveAfter(Sh); content[j].trackMatteType = TrackMatteType.ALPHA; }
    }
    Sh.enabled = false;
    return pc;
};
UK.CAR.buildSphere = function (comp, layers, a) {
    var S = UK_SPHERE, D = S.DEF, c = {}, k, i, j;
    for (k in D) c[k] = D[k];
    if (a.sp) for (k in a.sp) if (a.sp[k] !== undefined && a.sp[k] !== null && !isNaN(Number(a.sp[k]))) c[k] = Number(a.sp[k]);
    var np = layers.length, n = Math.round(c.count) > 0 ? Math.round(c.count) : (np || 12);
    n = Math.max(1, Math.min(S.MAX, n));
    var W = comp.width, H = comp.height, t0 = comp.time, fps = comp.frameRate;
    var dur = Math.max(comp.duration - t0, S.ENTRY + 1);
    /* the photos: one precomp each (the selected layers move into them), or numbered proxies */
    var photos = [], top = null;
    for (i = 0; i < np; i++) { photos.push(UK.CAR.photoComp(i + 1, layers[i], dur, fps)); if (!top || layers[i].index < top.index) top = layers[i]; }
    if (!np) for (i = 0; i < n; i++) photos.push(UK.CAR.photoComp(i + 1, null, dur, fps));
    var Cc = app.project.items.addComp(UK.uniqueName("Sphere Carousel"), W, H, comp.pixelAspect, dur, fps);
    try { Cc.parentFolder = UK.folder("Carousel"); } catch (e0) { }
    Cc.motionBlur = true;
    try { Cc.shutterAngle = 360; Cc.shutterPhase = -180; } catch (e1) { }
    UK._fd = Cc.frameDuration;
    /* the controls */
    var N = Cc.layers.addNull(); N.name = "Carousel Controls"; N.label = 2;
    var sl = function (nm, v) { return UK.slider(N, nm, v); };
    var FK = S.focusKeys(n, dur), Fp = sl("Focus", 1);
    for (i = 0; i < FK.length; i++) Fp.setValueAtTime(FK[i][0], FK[i][1]);
    for (i = 1; i <= Fp.numKeys; i++) {
        Fp.setInterpolationTypeAtKey(i, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        Fp.setTemporalEaseAtKey(i, [new KeyframeEase(0, S.EASE_IN)], [new KeyframeEase(0, S.EASE_OUT)]);
    }
    sl("Distance", c.distance); sl("Tilt", c.tilt); sl("Card Size", c.size);
    var Ep = sl("Entry", 0);
    UK.anim(Ep, [[0, 0], [S.ENTRY, 100]], "out");
    N.inPoint = 0; N.outPoint = dur;
    /* the camera: wide, looking at the front of the ball */
    var zoom = W * S.ZOOM, Cam = Cc.layers.addCamera("Carousel Camera", [W / 2, H / 2]);
    Cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(zoom);
    Cam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([W / 2, H / 2, 0]);
    Cam.property("ADBE Transform Group").property("ADBE Position").setValue([W / 2, H / 2, -zoom]);
    /* the ball: Pitch (X rotation) holding Yaw (Y rotation); the card under Focus turned to the front */
    var Rk = S.radius(n), dirs = [], AZ = [], EL = [];
    for (i = 0; i < n; i++) { var d = S.dir(i, n), ae = S.azel(d); dirs.push(d); AZ.push(UK.round(ae[0], 3)); EL.push(UK.round(ae[1], 3)); }
    var CT = 'var C = thisComp.layer("Carousel Controls");\n';
    var RX = 'var R = ' + UK.round(Rk, 4) + ' * thisComp.width * 0.5 * C.effect("Card Size")(1) / 100 * C.effect("Distance")(1) / 100;\n';
    var FOC = 'var AZ = [' + AZ.join(",") + '], EL = [' + EL.join(",") + '], n = ' + n + ';\n' +
        'function ix(v) { return Math.max(0, Math.min(n - 1, Math.round(v) - 1)); }\n' +
        'var F = C.effect("Focus")(1), a, b, p = 0;\n' +
        'if (F.numKeys < 1) { a = b = ix(F.value); }\n' +
        'else {\n  var k = F.nearestKey(time).index; if (F.key(k).time > time) k--;\n' +
        '  if (k < 1) { a = b = ix(F.key(1).value); }\n' +
        '  else if (k >= F.numKeys) { a = b = ix(F.key(F.numKeys).value); }\n' +
        '  else { var v0 = F.key(k).value, v1 = F.key(k + 1).value; a = ix(v0); b = ix(v1); p = (v1 == v0) ? 0 : (F.value - v0) / (v1 - v0); }\n}\n' +
        'var dA = AZ[b] - AZ[a]; dA = ((dA % 360) + 540) % 360 - 180;\n' +
        'var az = AZ[a] + dA * p, el = EL[a] + (EL[b] - EL[a]) * p;\n';
    /* the ball's centre (move it to move the whole ball); every card turns round it: Y by az, then X by el (the turn
       that brings the Focus card to the front), and looks at the camera */
    var Sc = Cc.layers.addNull(); Sc.name = "Sphere Center"; Sc.threeDLayer = true; Sc.label = 1;
    UK.anchor(Sc).setValue([0, 0, 0]);
    UK.pos(Sc).expression = CT + RX + '[thisComp.width / 2, thisComp.height / 2, R * ' + S.DEPTH + ']';
    Sc.inPoint = 0; Sc.outPoint = dur;
    var TURN = 'var ya = degreesToRadians(' + UK.CAR.SPH_YAW + ' * az), pa = degreesToRadians(' + UK.CAR.SPH_PITCH + ' * el);\n' +
        'function turn(v) { var x = v[0] * Math.cos(ya) + v[2] * Math.sin(ya), z = -v[0] * Math.sin(ya) + v[2] * Math.cos(ya), y = v[1];\n' +
        '  return [x, (y * Math.cos(pa) - z * Math.sin(pa)) * ' + UK.round(S.CH / S.CW, 4) + ', (y * Math.sin(pa) + z * Math.cos(pa)) * ' + S.DEPTH + ']; }\n';      // (the ball shaped like the cards: taller; and deep)
    /* the cards */
    var F0 = 'var F0 = C.effect("Focus")(1), f0 = Math.round(F0.numKeys ? F0.key(1).value : F0.value) - 1;\n';
    var cards = [];
    for (i = 0; i < n; i++) {
        var L = Cc.layers.add(photos[i % photos.length]);
        L.name = "Card " + (i + 1); L.threeDLayer = true; L.motionBlur = true;
        L.startTime = 0; L.inPoint = 0; L.outPoint = dur;
        var T = L.property("ADBE Transform Group"), dd = dirs[i], tl = S.tilt(i);
        var V = 'var E = C.effect("Entry")(1) / 100, m = (' + i + ' == f0) ? 1 : 1 + (1 - E) * 0.9;\n' +
            'var v = turn([' + UK.round(dd[0], 5) + ' * R * m, ' + UK.round(dd[1], 5) + ' * R * m, ' + UK.round(dd[2], 5) + ' * R * m]);\n';
        UK.anchor(L).setValue([S.CW / 2, S.CH / 2, 0]);
        UK.pos(L).expression = CT + RX + FOC + TURN + F0 + V + 'add(thisComp.layer("Sphere Center").transform.position, v)';
        T.property("ADBE Orientation").expression = 'lookAt(thisComp.layer("Carousel Camera").transform.position, transform.position)';
        T.property("ADBE Rotate X").expression = CT + 'value + ' + UK.round(tl[0], 2) + ' * C.effect("Tilt")(1) / 100';
        T.property("ADBE Rotate Y").expression = CT + 'value + ' + UK.round(tl[1], 2) + ' * C.effect("Tilt")(1) / 100';
        T.property("ADBE Rotate Z").expression = CT + 'value + ' + UK.round(tl[2], 2) + ' * C.effect("Tilt")(1) / 100';
        UK.scale(L).expression = CT + 'var s = thisComp.width * 0.5 * C.effect("Card Size")(1) / 100 / ' + S.CW + ' * 100;\n[s, s, s]';
        /* seen: the front half of the ball (the cards round the back fade out); the first ones in with the entry */
        UK.opac(L).expression = CT + RX + FOC + TURN + F0 + V + 'var o = (' + i + ' == f0) ? 100 : C.effect("Entry")(1);\n' +
            'o * clamp(-v[2] / Math.max(1, length(v)) * 2.5 + 0.6, 0, 1)';
        L.comment = "Ultimate Kit Sphere Carousel: card " + (i + 1) + " (its photo: " + photos[i % photos.length].name + "); its X / Y / Z Rotation adds to the random Tilt.";
        cards.push(L);
    }
    for (i = cards.length - 1; i >= 0; i--) cards[i].moveToBeginning();
    Sc.moveToBeginning(); Cam.moveToBeginning(); N.moveToBeginning();
    N.comment = "Ultimate Kit Sphere Carousel: Focus = the card at the front (key it: the ball turns along the keys), Distance, Tilt (random, every card), Card Size, Entry.";
    var eg = ["Focus", "Distance", "Tilt", "Card Size"];
    for (i = eg.length - 1; i >= 0; i--) UK.essential(Cc, UK.efx(N, eg[i]).property(1), eg[i]);
    /* into the comp: over the selected photos (which now live in the Photo precomps), from the time indicator */
    var PL = comp.layers.add(Cc);
    if (top) PL.moveBefore(top);
    PL.startTime = t0; PL.inPoint = t0; PL.outPoint = Math.min(comp.duration, t0 + dur);
    for (i = layers.length - 1; i >= 0; i--) { try { layers[i].remove(); } catch (e3) { } }
    PL.comment = "Ultimate Kit Sphere Carousel: the controls are on 'Carousel Controls' inside this precomp; each card's photo is its own 'Photo' precomp.";
    return PL;
};
/*  cr07 "Card Swap" (shared/swap.js): one big card in the middle, swapped to the next at every step by the chosen
    transition (or a random one at every swap), all chosen before Apply and baked as keyframes with speed ramps:
    Position, Scale, Rotation, Opacity (and Y Rotation for Flip, the cards then 3D). In the active comp, one precomp
    "Card Swap" holding Card 1 .. n; each card is a "Photo k" precomp (rounded "Card Shape" track matte over the photo
    or a coloured numbered proxy). Each card's layer is trimmed to the time it is seen.                        */
UK.CAR.buildSwap = function (comp, layers, a) {
    var S = UK_SWAP, D = S.DEF, c = {}, k, i;
    for (k in D) c[k] = D[k];
    if (a.sw) for (k in a.sw) if (a.sw[k] !== undefined && a.sw[k] !== null) c[k] = (k === "random") ? (a.sw[k] === true || a.sw[k] === "true") : Number(a.sw[k]);
    c.hold = Math.max(0, c.hold); c.dur = Math.max(2 / comp.frameRate, c.dur);
    var np = layers.length, n = Math.round(c.count) > 0 ? Math.round(c.count) : (np || 6);
    n = Math.max(1, Math.min(S.MAX, n));
    var W = comp.width, H = comp.height, t0 = comp.time, fps = comp.frameRate;
    var P = S.plan(c, n, c.seed || 1), dur = S.total(c, n), flip = false;      // (Random: the panel's Shuffle seed, so it matches the preview)
    for (i = 0; i < P.length; i++) if (P[i] === 7) flip = true;
    var dims = { CW: S.CW, CH: S.CH, CORNER: S.CORNER };
    var photos = [], top = null;
    for (i = 0; i < np; i++) { photos.push(UK.CAR.photoComp(i + 1, layers[i], dur, fps, dims)); if (!top || layers[i].index < top.index) top = layers[i]; }
    if (!np) for (i = 0; i < n; i++) photos.push(UK.CAR.photoComp(i + 1, null, dur, fps, dims));
    var Cc = app.project.items.addComp(UK.uniqueName("Card Swap"), W, H, comp.pixelAspect, dur, fps);
    try { Cc.parentFolder = UK.folder("Carousel"); } catch (e0) { }
    Cc.motionBlur = true;
    UK._fd = Cc.frameDuration;
    var cd = S.card(c, W, H), base = cd.w / S.CW * 100, B = KeyframeInterpolationType.BEZIER;
    var keyIt = function (prop, K, val, dims3) {
        var m, ix = [];
        for (m = 0; m < K.length; m++) prop.setValueAtTime(K[m][0], val(K[m][1]));
        for (m = 0; m < K.length; m++) ix.push(prop.nearestKeyIndex(K[m][0]));
        for (m = 0; m < ix.length; m++) {
            var ne = prop.isSpatial ? 1 : (prop.propertyValueType === PropertyValueType.ThreeD ? 3 : (prop.propertyValueType === PropertyValueType.TwoD ? 2 : 1)), ei = [], eo = [];
            for (var d = 0; d < ne; d++) { ei.push(new KeyframeEase(0, S.EASE_IN)); eo.push(new KeyframeEase(0, S.EASE_OUT)); }
            prop.setInterpolationTypeAtKey(ix[m], B, B);
            prop.setTemporalEaseAtKey(ix[m], ei, eo);
            if (prop.isSpatial) { try { prop.setSpatialAutoBezierAtKey(ix[m], false); prop.setSpatialContinuousAtKey(ix[m], false); prop.setSpatialTangentsAtKey(ix[m], dims3 ? [0, 0, 0] : [0, 0], dims3 ? [0, 0, 0] : [0, 0]); } catch (e1) { } }
        }
    };
    var cards = [];
    for (i = 0; i < n; i++) {
        var L = Cc.layers.add(photos[i % photos.length]);
        L.name = "Card " + (i + 1); L.motionBlur = true;
        if (flip) L.threeDLayer = true;
        var K = S.keys(i, n, P, c, W, H), T = L.property("ADBE Transform Group");
        UK.anchor(L).setValue(flip ? [S.CW / 2, S.CH / 2, 0] : [S.CW / 2, S.CH / 2]);
        keyIt(T.property("ADBE Position"), K, function (s) { return flip ? [UK.round(s.x, 2), UK.round(s.y, 2), 0] : [UK.round(s.x, 2), UK.round(s.y, 2)]; }, flip);
        keyIt(T.property("ADBE Scale"), K, function (s) { var v = UK.round(base * s.s / 100, 3); return flip ? [v, v, v] : [v, v]; });
        keyIt(T.property("ADBE Rotate Z"), K, function (s) { return s.r; });
        keyIt(T.property("ADBE Opacity"), K, function (s) { return s.o; });
        if (flip) keyIt(T.property("ADBE Rotate Y"), K, function (s) { return s.ry; });
        /* the layer is there only while it is seen */
        L.startTime = 0; L.inPoint = Math.max(0, K[0][0]); L.outPoint = Math.min(dur, K[K.length - 1][0] + Cc.frameDuration);
        L.comment = "Ultimate Kit Card Swap: card " + (i + 1) + " (its photo: " + photos[i % photos.length].name + ").";
        cards.push(L);
    }
    for (i = 0; i < cards.length; i++) cards[i].moveToBeginning();      // the later card on top
    var names = []; for (i = 1; i < P.length; i++) names.push(S.NAMES[P[i]]);
    var PL = comp.layers.add(Cc);
    if (top) PL.moveBefore(top);
    PL.startTime = t0; PL.inPoint = t0; PL.outPoint = Math.min(comp.duration, t0 + dur);
    for (i = layers.length - 1; i >= 0; i--) { try { layers[i].remove(); } catch (e3) { } }
    PL.comment = "Ultimate Kit Card Swap: " + n + " cards; swaps: " + names.join(", ") + ". Each card's photo is its own 'Photo' precomp.";
    return PL;
};
/*  cr08 "Card Deck" (shared/deck.js): the deck of landscape cards, the front one dropping behind a straight mask
    edge at every swap while the deck steps forward; the direction chosen before Apply, baked as keyframes with
    speed ramps (Position, Scale, Opacity). In the active comp, one precomp "Card Deck" (its layer carries the
    "Deck Mask": the edge the cards drop behind) holding Card 1 .. n; each card is a "Photo k" precomp (rounded
    "Card Shape" track matte over the photo or a coloured numbered proxy). Each card's layer is trimmed to the time
    it is seen.                                                                                                  */
UK.CAR.buildDeck = function (comp, layers, a) {
    var S = UK_DECK, D = S.DEF, c = {}, k, i;
    for (k in D) c[k] = D[k];
    if (a.dk) for (k in a.dk) if (a.dk[k] !== undefined && a.dk[k] !== null && !isNaN(Number(a.dk[k]))) c[k] = Number(a.dk[k]);
    c.hold = Math.max(0, c.hold); c.dur = Math.max(2 / comp.frameRate, c.dur); c.dir = Math.max(1, Math.min(8, Math.round(c.dir)));
    var np = layers.length, n = Math.round(c.count) > 0 ? Math.round(c.count) : (np || 6);
    n = Math.max(1, Math.min(S.MAX, n));
    var W = comp.width, H = comp.height, t0 = comp.time, fps = comp.frameRate, dur = S.total(c, n);
    var dims = { CW: S.CW, CH: S.CH, CORNER: S.CORNER };
    var photos = [], top = null;
    for (i = 0; i < np; i++) { photos.push(UK.CAR.photoComp(i + 1, layers[i], dur, fps, dims)); if (!top || layers[i].index < top.index) top = layers[i]; }
    if (!np) for (i = 0; i < n; i++) photos.push(UK.CAR.photoComp(i + 1, null, dur, fps, dims));
    var Cc = app.project.items.addComp(UK.uniqueName("Card Deck"), W, H, comp.pixelAspect, dur, fps);
    try { Cc.parentFolder = UK.folder("Carousel"); } catch (e0) { }
    Cc.motionBlur = true;
    UK._fd = Cc.frameDuration;
    var cd = S.card(c, W, H), base = cd.w / S.CW * 100, B = KeyframeInterpolationType.BEZIER;
    var keyIt = function (prop, K, val) {
        var m, ix = [];
        for (m = 0; m < K.length; m++) prop.setValueAtTime(K[m][0], val(K[m][1]));
        for (m = 0; m < K.length; m++) ix.push(prop.nearestKeyIndex(K[m][0]));
        for (m = 0; m < ix.length; m++) {
            var ne = prop.isSpatial ? 1 : (prop.propertyValueType === PropertyValueType.ThreeD ? 3 : (prop.propertyValueType === PropertyValueType.TwoD ? 2 : 1)), ei = [], eo = [];
            for (var d = 0; d < ne; d++) { ei.push(new KeyframeEase(0, K[m][2])); eo.push(new KeyframeEase(0, K[m][3])); }
            prop.setInterpolationTypeAtKey(ix[m], B, B);
            prop.setTemporalEaseAtKey(ix[m], ei, eo);
            if (prop.isSpatial) { try { prop.setSpatialAutoBezierAtKey(ix[m], false); prop.setSpatialContinuousAtKey(ix[m], false); prop.setSpatialTangentsAtKey(ix[m], [0, 0], [0, 0]); } catch (e1) { } }
        }
    };
    var cards = [];
    for (i = 0; i < n; i++) {
        var L = Cc.layers.add(photos[i % photos.length]);
        L.name = "Card " + (i + 1); L.motionBlur = true;
        var K = S.keys(i, n, c, W, H), T = L.property("ADBE Transform Group");
        UK.anchor(L).setValue([S.CW / 2, S.CH / 2]);
        keyIt(T.property("ADBE Position"), K, function (s) { return [UK.round(s.x, 2), UK.round(s.y, 2)]; });
        keyIt(T.property("ADBE Scale"), K, function (s) { var v = UK.round(base * s.s / 100, 3); return [v, v]; });
        keyIt(T.property("ADBE Opacity"), K, function (s) { return s.o; });
        /* seen: from when it fades in at the back (or the start) to the end of its drop */
        var tin = 0; for (var q = 0; q < K.length; q++) if (K[q][1].o > 0) { tin = q > 0 ? K[q - 1][0] : K[q][0]; break; }
        L.startTime = 0; L.inPoint = Math.max(0, tin); L.outPoint = Math.min(dur, K[K.length - 1][0] + Cc.frameDuration);
        L.comment = "Ultimate Kit Card Deck: card " + (i + 1) + " (its photo: " + photos[i % photos.length].name + ").";
        cards.push(L);
    }
    for (i = cards.length - 1; i >= 0; i--) cards[i].moveToBeginning();      // the front card on top
    var PL = comp.layers.add(Cc);
    if (top) PL.moveBefore(top);
    PL.startTime = t0; PL.inPoint = t0; PL.outPoint = Math.min(comp.duration, t0 + dur);
    /* the mask edge the cards drop behind (a half plane: the deck's side of the line) */
    var Ed = S.edge(c, W, H), e = Ed.e, p = Ed.p, tv = [-e[1], e[0]], BIG = 4 * Math.max(W, H);
    var mk = PL.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); mk.name = "Deck Mask";
    mk.property("ADBE Mask Shape").setValue(UK.makeShape([
        [p[0] + tv[0] * BIG, p[1] + tv[1] * BIG], [p[0] - tv[0] * BIG, p[1] - tv[1] * BIG],
        [p[0] - tv[0] * BIG - e[0] * BIG, p[1] - tv[1] * BIG - e[1] * BIG], [p[0] + tv[0] * BIG - e[0] * BIG, p[1] + tv[1] * BIG - e[1] * BIG]], null, null, true));
    for (i = layers.length - 1; i >= 0; i--) { try { layers[i].remove(); } catch (e3) { } }
    PL.comment = "Ultimate Kit Card Deck: " + n + " cards, from the " + S.NAMES[c.dir].toLowerCase() + ". 'Deck Mask' = the edge the cards drop behind. Each card's photo is its own 'Photo' precomp.";
    return PL;
};
/*  cr09 "Focus Carousel" (shared/focus.js): the user's own carousel, exactly as they built it. In the active comp one precomp
    "Focus Carousel" (its layer carries their Bezier Warp) holding "Carousel Null" and Card 1 .. n in a row parented to it.
    The Null's "Focus" slider says which card stands in the middle: its keys have the user's times and speed ramps, the
    Null's Position follows it. Each card is a "Card k" comp (500 x 600): the card in its own colour with its number (who
    it is), the photo over it in the card's rounded shape.                                                         */
UK.CAR.focusCard = function (k, srcLayer, dur, fps) {
    var F = UK_FOCUS, pc = app.project.items.addComp(UK.uniqueName("Card " + k), F.CW, F.CH, 1, dur, fps), cx = F.CW / 2, cy = F.CH / 2;
    try { pc.parentFolder = UK.folder("Carousel"); } catch (e0) { }
    var col = F.COLS[(k - 1) % F.COLS.length];
    var Co = UK.shapeLayer(pc, "Color"), g = UK.group(UK.root(Co), "Card");
    UK.addRect(UK.vecs(g), F.CARD, [0, 0], F.CORNER, "Rect");
    var f = UK.vecs(g).addProperty("ADBE Vector Graphic - Fill"); f.name = "Fill";
    f.property("ADBE Vector Fill Color").setValue([col[0], col[1], col[2], 1]);
    UK.pos(Co).setValue([cx, cy]);
    var Nm = UK.addText(pc, String(k), { size: 230, name: "Number" });
    Nm.moveBefore(Co);
    if (srcLayer) {
        srcLayer.copyToComp(pc);
        var P = pc.layer(1);
        try { P.parent = null; } catch (e1) { }
        P.threeDLayer = false; P.startTime = 0; P.inPoint = 0; P.outPoint = dur;
        var Tr = P.property("ADBE Transform Group"), nm = ["ADBE Position", "ADBE Scale", "ADBE Rotate Z", "ADBE Anchor Point", "ADBE Opacity"];
        for (var q = 0; q < nm.length; q++) { var pr = Tr.property(nm[q]); try { pr.expression = ""; while (pr.numKeys) pr.removeKey(1); } catch (e2) { } }
        Tr.property("ADBE Anchor Point").setValue([P.width / 2, P.height / 2]);
        Tr.property("ADBE Position").setValue([cx, cy]);
        var s = 100 * Math.max(F.CARD[0] / Math.max(1, P.width), F.CARD[1] / Math.max(1, P.height));
        Tr.property("ADBE Scale").setValue([s, s]);
        Tr.property("ADBE Rotate Z").setValue(0); Tr.property("ADBE Opacity").setValue(100);
        P.name = "Photo";
        /* the photo in the card's rounded shape */
        var Sh = UK.shapeLayer(pc, "Card Shape"), sg = UK.group(UK.root(Sh), "Card");
        UK.addRect(UK.vecs(sg), F.CARD, [0, 0], F.CORNER, "Rect");
        UK.addFill(UK.vecs(sg), "#FFFFFF", 100, "Fill");
        UK.pos(Sh).setValue([cx, cy]);
        Sh.moveBefore(P);
        if (typeof P.setTrackMatte === "function") P.setTrackMatte(Sh, TrackMatteType.ALPHA);
        else { P.moveAfter(Sh); P.trackMatteType = TrackMatteType.ALPHA; }
        Sh.enabled = false;
    }
    pc.comment = "Ultimate Kit Focus Carousel: card " + k + (srcLayer ? " (its photo: " + srcLayer.name + ")" : "") + ". 'Color' and 'Number' say which card it is.";
    return pc;
};
UK.CAR.buildFocus = function (comp, layers, a) {
    var F = UK_FOCUS, c = { count: 0, random: false, seed: 1 }, k, i;
    if (a.fc) { c.count = Number(a.fc.count) || 0; c.random = a.fc.random === true || a.fc.random === "true"; c.seed = Number(a.fc.seed) || 1; }
    var np = layers.length, n = Math.round(c.count) > 0 ? Math.round(c.count) : (np || 4);
    n = Math.max(1, Math.min(F.MAX, n));
    var W = comp.width, H = comp.height, t0 = comp.time, fps = comp.frameRate, sc = F.scale(W, H), gap = F.GAP * sc;
    var K = F.keys(n, c.random, c.seed), last = K[K.length - 1].t, dur = Math.max(comp.duration - t0, last + 1);
    var cards = [], top = null;
    for (i = 0; i < n; i++) { var src = i < np ? layers[i] : null; cards.push(UK.CAR.focusCard(i + 1, src, dur, fps)); if (src && (!top || src.index < top.index)) top = src; }
    var Cc = app.project.items.addComp(UK.uniqueName("Focus Carousel"), W, H, comp.pixelAspect, dur, fps);
    try { Cc.parentFolder = UK.folder("Carousel"); } catch (e0) { }
    UK._fd = Cc.frameDuration;
    /* the Null: Focus keys (the user's times and influences), Position from Focus */
    var N = Cc.layers.addNull(); N.name = "Carousel Null";
    N.startTime = 0; N.inPoint = 0; N.outPoint = dur;
    UK.anchor(N).setValue([0, 0]);
    var Fo = UK.slider(N, "Focus", K[0].v), B = KeyframeInterpolationType.BEZIER;
    if (K.length > 1) {
        for (i = 0; i < K.length; i++) Fo.setValueAtTime(UK.snap(Cc, K[i].t), K[i].v);
        for (i = 0; i < K.length; i++) {
            var ix2 = Fo.nearestKeyIndex(UK.snap(Cc, K[i].t));
            Fo.setInterpolationTypeAtKey(ix2, B, B);
            Fo.setTemporalEaseAtKey(ix2, [new KeyframeEase(0, K[i].inI)], [new KeyframeEase(0, K[i].outI)]);
        }
    }
    UK.pos(N).expression = 'var f = effect("Focus")(1);\n[thisComp.width / 2 - (f - 1) * ' + UK.round(gap, 4) + ', thisComp.height / 2]';
    N.comment = "Ultimate Kit Focus Carousel: 'Focus' = the number of the card in the middle. Its keys hold the order and the speed ramps; change a key's value to bring another card to the middle.";
    /* the cards in a row on the Null, card 1 at its place */
    for (i = n - 1; i >= 0; i--) {
        var L = Cc.layers.add(cards[i]);
        L.name = "Card " + (i + 1);
        L.startTime = 0; L.inPoint = 0; L.outPoint = dur;
        L.parent = N;
        UK.anchor(L).setValue([F.CW / 2, F.CH / 2]);
        UK.pos(L).setValue([UK.round(i * gap, 3), 0]);
        UK.scale(L).setValue([UK.round(100 * sc, 4), UK.round(100 * sc, 4)]);
        L.moveAfter(N);
    }
    var PL = comp.layers.add(Cc);
    if (top) PL.moveBefore(top);
    PL.startTime = t0; PL.inPoint = t0; PL.outPoint = Math.min(comp.duration, t0 + dur);
    /* their Bezier Warp, every point, for this frame's size */
    var BW = UK.fx(PL, "ADBE BEZMESH", "Bezier Warp"), sx = W / F.REF.W, sy = H / F.REF.H;
    for (i = 0; i < F.WARP.length; i++) BW.property("ADBE BEZMESH-" + UK.pad(i + 1, 4)).setValue([F.WARP[i][0] * sx, F.WARP[i][1] * sy]);
    try { BW.property("ADBE BEZMESH-0013").setValue(F.QUALITY); } catch (e4) { }
    for (i = layers.length - 1; i >= 0; i--) { try { layers[i].remove(); } catch (e3) { } }
    var ord = []; for (i = 0; i < K.length; i++) ord.push(K[i].v);
    PL.comment = "Ultimate Kit Focus Carousel: " + n + " cards, to the middle in the order " + ord.join(", ") + ". The order and the speed ramps: the 'Focus' keys on 'Carousel Null' inside.";
    return PL;
};
UK.CAR.SPH_PITCH = '1';      // (checked in AE: these signs bring the Focus card to the front)
UK.CAR.SPH_YAW = '1';
UK.api.carousel = function (a) {
    if (a.id === "cr06" || a.id === "cr07" || a.id === "cr08" || a.id === "cr09") {           // work with no selection too (numbered proxies)
        var c6 = UK.comp(false), s6 = c6.selectedLayers, L6 = [], q6;
        for (q6 = 0; q6 < s6.length; q6++) if (s6[q6] instanceof AVLayer && s6[q6].source && !s6[q6].nullLayer && !s6[q6].adjustmentLayer) L6.push(s6[q6]);
        L6.sort(function (x, y) { return x.index - y.index; });
        var N6;                      // (if / else: ExtendScript once ran both arms of a ?:)
        if (a.id === "cr09") N6 = UK.CAR.buildFocus(c6, L6, a);
        else if (a.id === "cr08") N6 = UK.CAR.buildDeck(c6, L6, a);
        else if (a.id === "cr07") N6 = UK.CAR.buildSwap(c6, L6, a);
        else N6 = UK.CAR.buildSphere(c6, L6, a);
        UK.selectOnly(c6, [N6]);
        return { name: N6.name, photos: L6.length };
    }
    var comp = UK.comp(false), sel = comp.selectedLayers, L = [], i;
    for (i = 0; i < sel.length; i++) if (sel[i] instanceof AVLayer && !sel[i].nullLayer && !sel[i].adjustmentLayer) L.push(sel[i]);
    if (L.length < 2) throw new Error("Select 2 or more photo layers.");
    L.sort(function (x, y) { return x.index - y.index; });        // top layer = last on the ring, as in the original
    var N;
    if (a.id === "cr02") N = UK.CAR.buildPath(comp, L, a);
    else if (a.id === "cr04") N = UK.CAR.buildCardSpin(comp, L, a);
    else if (a.id === "cr05") N = UK.CAR.buildBurst(comp, L, a);
    else N = UK.CAR.build(comp, L, a);
    UK.selectOnly(comp, [N]);
    return { name: N.name, photos: L.length };
};

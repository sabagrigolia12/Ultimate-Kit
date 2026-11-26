/*  Ultimate Kit - Ball: a still ball built the way a designer builds one (looks in shared/balls.js).
    Precomp "Ball - Name" (1600 x 1600, ball radius 400: room for the glow), top -> bottom:
      Ball Controls        Null: one Color Control per colour, Glow (on, intensity, size), Light Sweep (on, intensity,
                           width, angle, time per pass (0 = still), pause, colour), Stroke Width (Lens)
      Ring                 Lens only: the white stroke
      Light Sweep          solid, a thin feathered band (mask), Add, moved across by expression
      <light / shadow>     solids with feathered elliptical masks, Fill linked to the controls, blend modes
      Ball Matte           the ball's circle (hidden): alpha matte of the sweep and the light / shadow layers
      Ball                 the ball's circle, Fill + radial Gradient Ramp "Shading" (not on the Lens)
      <outside layers>
      Glow                 solid, the ball's circle expanded and feathered, Glow colour
    Only the sweep moves (Sweep Time 0 = no motion). In your comp the precomp is centred, scaled to the size.  */

UK.BALL = { S: 1600, R: 400 };
UK.BALL.ell = function (cx, cy, rx, ry) {
    var k = 0.5523, s = new Shape();
    s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-k * rx, 0], [0, -k * ry], [k * rx, 0], [0, k * ry]];
    s.outTangents = [[k * rx, 0], [0, k * ry], [-k * rx, 0], [0, -k * ry]];
    s.closed = true;
    return s;
};
UK.BALL.MODES = { normal: BlendingMode.NORMAL, screen: BlendingMode.SCREEN, multiply: BlendingMode.MULTIPLY, add: BlendingMode.ADD, overlay: BlendingMode.OVERLAY };
UK.BALL.CTL = 'thisComp.layer("Ball Controls")';
UK.BALL.ctl = function (name) { return UK.BALL.CTL + '.effect("' + name + '")(1)'; };

UK.api.ball = function (a) { return UK.BALL.build(UK.comp(true), a); };
UK.BALL.build = function (host, a) {
    var spec = UK_BALL.find(a.id);
    if (!spec) throw new Error("Unknown ball " + a.id);
    var S = UK.BALL.S, R = UK.BALL.R, c = S / 2, i, j, CT = UK.BALL.CTL;
    var X = function (u) { return c + u * R; };
    var F = {}, k;
    for (k in UK_BALL.FX) F[k] = UK_BALL.FX[k];
    if (spec.fx) for (k in spec.fx) F[k] = spec.fx[k];
    if (a.fx) for (k in a.fx) if (a.fx[k] !== undefined && a.fx[k] !== null) F[k] = a.fx[k];
    var dur = host.duration;
    var C = UK.newComp(UK.uniqueName("Ball - " + spec.name), host, dur, "Balls", S, S);
    var dest = UK.folder("Balls");
    var col = function (role) { return UK_BALL.color(spec, role, a.colors); };
    var solid = function (n) {
        var L = C.layers.addSolid([1, 1, 1], n, S, S, 1, dur);
        try { L.source.parentFolder = dest; } catch (e) { }
        return L;
    };
    var mask = function (L, mn, e, mode, f) {
        var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        m.name = mn;
        m.property("ADBE Mask Shape").setValue(UK.BALL.ell(X(e[0]), X(e[1]), e[2] * R, e[3] * R));
        m.property("ADBE Mask Feather").setValue([f * R, f * R]);
        m.maskMode = mode;
        return m;
    };
    var fill = function (L, hex, expr) {
        UK.fx(L, "ADBE Fill", "Fill");
        UK.efx(L, "Fill").property("ADBE Fill-0002").setValue(UK.rgba(hex));
        UK.efx(L, "Fill").property("ADBE Fill-0002").expression = expr;
    };
    var element = function (d) {
        var L = solid(d.n), f = d.f || 0;
        mask(L, "Mask", d.e, MaskMode.ADD, f);
        if (d.cut) mask(L, "Cut", d.cut, MaskMode.SUBTRACT, d.cf === undefined ? f : d.cf);
        fill(L, col(d.c), UK.BALL.ctl(d.c));
        if (d.rot) { UK.anchor(L).setValue([X(d.e[0]), X(d.e[1])]); UK.pos(L).setValue([X(d.e[0]), X(d.e[1])]); UK.rot(L).setValue(d.rot); }
        UK.opac(L).setValue(d.o === undefined ? 100 : d.o);
        L.blendingMode = UK.BALL.MODES[d.mode || "normal"];
        return L;
    };
    var circle = function (n, hex) {
        var L = UK.shapeLayer(C, n);
        UK.addEllipse(UK.vecs(UK.group(UK.root(L), "Ellipse 1")), [2 * R, 2 * R], [0, 0]);
        if (hex) UK.addFill(UK.vecs(UK.root(L).property("Ellipse 1")), hex);
        UK.pos(L).setValue([c, c]);
        return L;
    };

    /* bottom -> top: every new layer lands on top */
    var G = solid("Glow");
    var gm = mask(G, "Mask", [0, 0, 1, 1], MaskMode.ADD, 0);
    gm.property("ADBE Mask Feather").expression = 'var s = ' + UK.BALL.ctl("Glow Size") + ' / 100 * ' + R + ' * 1.2;\n[s, s]';
    gm.property("ADBE Mask Offset").expression = UK.BALL.ctl("Glow Size") + ' / 100 * ' + R + ' * 0.3';
    fill(G, col("Glow"), UK.BALL.ctl("Glow"));
    UK.opac(G).expression = 'var c = ' + CT + ';\nc.effect("Glow On")(1) == 1 ? c.effect("Glow Intensity")(1) : 0';
    for (i = spec.layers.length - 1; i >= 0; i--) if (spec.layers[i].out) element(spec.layers[i]);
    var b = spec.base, B = null;
    if (b) {
        B = circle("Ball", col(b.c2));
        UK.root(B).property("Ellipse 1").property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").expression = UK.BALL.ctl(b.c2);
        UK.fx(B, "ADBE Ramp", "Shading");
        var g = UK.efx(B, "Shading");
        g.property("ADBE Ramp-0001").setValue([X(b.s[0]), X(b.s[1])]);       // effect points of a shape layer: comp space
        g.property("ADBE Ramp-0003").setValue([X(b.s[0] + b.r), X(b.s[1])]);
        g.property("ADBE Ramp-0005").setValue(2);                            // radial
        g.property("ADBE Ramp-0002").setValue(UK.rgba(col(b.c1)));
        g.property("ADBE Ramp-0004").setValue(UK.rgba(col(b.c2)));
        g = UK.efx(B, "Shading");
        g.property("ADBE Ramp-0002").expression = UK.BALL.ctl(b.c1);
        g.property("ADBE Ramp-0004").expression = UK.BALL.ctl(b.c2);
        if (b.o !== undefined) UK.opac(B).setValue(b.o);
    }
    var M = circle("Ball Matte", "#FFFFFF");
    M.enabled = false;
    var inner = [];
    for (i = spec.layers.length - 1; i >= 0; i--) if (!spec.layers[i].out) inner.push(element(spec.layers[i]));

    /* Light Sweep: a thin band, feathered, crossing the ball along Sweep Angle */
    var W = solid("Light Sweep");
    var wm = mask(W, "Band", [0, 0, 0.05, 1.8], MaskMode.ADD, 0);
    wm.property("ADBE Mask Feather").expression = 'var w = ' + UK.BALL.ctl("Sweep Width") + ' / 100 * ' + R + ';\n[w, w]';
    fill(W, F.sweepColor, UK.BALL.ctl("Sweep Color"));
    W.blendingMode = BlendingMode.ADD;
    UK.rot(W).expression = UK.BALL.ctl("Sweep Angle");
    UK.pos(W).expression = 'var c = ' + CT + ', d = c.effect("Sweep Time")(1), z = Math.max(0, c.effect("Sweep Pause")(1));\n' +
        'var a = degreesToRadians(c.effect("Sweep Angle")(1)), p = 0.38;\n' +
        'if (d > 0) p = ease((time - inPoint) % (d + z), 0, d, 0, 1);\n' +
        'var o = (-1.75 + 3.5 * p) * ' + R + ';\n[' + c + ' + o * Math.cos(a), ' + c + ' + o * Math.sin(a)]';
    UK.opac(W).expression = 'var c = ' + CT + ';\nc.effect("Light Sweep")(1) == 1 ? c.effect("Sweep Intensity")(1) : 0';
    inner.push(W);
    for (i = 0; i < inner.length; i++) inner[i].setTrackMatte(M, TrackMatteType.ALPHA);

    /* Lens: the stroke on top */
    if (spec.ring) {
        var Rg = circle("Ring", null);
        UK.addStroke(UK.vecs(UK.root(Rg).property("Ellipse 1")), col(spec.ring.c), F.stroke);
        var st = UK.root(Rg).property("Ellipse 1").property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke");
        st.property("ADBE Vector Stroke Color").expression = UK.BALL.ctl(spec.ring.c);
        st.property("ADBE Vector Stroke Width").expression = UK.BALL.ctl("Stroke Width");
    }

    /* Ball Controls */
    var N = C.layers.addNull();
    N.name = "Ball Controls";
    N.label = 2;
    UK.pos(N).setValue([c, c]);
    var ess = [];
    for (j = 0; j < spec.colors.length; j++) { UK.colorCtl(N, spec.colors[j][0], col(spec.colors[j][0])); ess.push([spec.colors[j][0], spec.colors[j][0]]); }
    if (spec.ring) { UK.slider(N, "Stroke Width", F.stroke); ess.push(["Stroke Width", "Stroke Width"]); }
    UK.checkCtl(N, "Glow On", F.glow); UK.slider(N, "Glow Intensity", F.glowInt); UK.slider(N, "Glow Size", F.glowSize);
    UK.checkCtl(N, "Light Sweep", F.sweep); UK.slider(N, "Sweep Intensity", F.sweepInt); UK.slider(N, "Sweep Width", F.sweepWidth);
    UK.fx(N, "ADBE Angle Control", "Sweep Angle").property(1).setValue(F.sweepAngle);
    UK.slider(N, "Sweep Time", F.sweepTime); UK.slider(N, "Sweep Pause", F.sweepPause);
    UK.colorCtl(N, "Sweep Color", F.sweepColor);
    ess = ess.concat([["Glow On", "Glow"], ["Glow Intensity", "Glow Intensity"], ["Glow Size", "Glow Size"], ["Light Sweep", "Light Sweep"], ["Sweep Intensity", "Sweep Intensity"],
        ["Sweep Width", "Sweep Width"], ["Sweep Angle", "Sweep Angle"], ["Sweep Time", "Sweep Time (0 = still)"], ["Sweep Pause", "Sweep Pause"], ["Sweep Color", "Sweep Color"]]);
    /* Essential Properties: each new one lands on top, so add them backwards */
    for (j = ess.length - 1; j >= 0; j--) UK.essential(C, UK.efx(N, ess[j][0]).property(1), ess[j][1]);
    try { N.source.parentFolder = dest; } catch (e1) { }

    /* the ball in your comp */
    var ln = UK.uniqueLayerName(host, "Ball - " + spec.name), P = host.layers.add(C);
    P.name = ln;
    UK.pos(P).setValue([host.width / 2, host.height / 2]);
    var sz = UK.clamp(Number(a.size) || 50, 1, 300) / 100 * host.height / (2 * R) * 100;
    UK.scale(P).setValue([sz, sz]);
    UK.selectOnly(host, [P]);
    return { name: P.name };
};

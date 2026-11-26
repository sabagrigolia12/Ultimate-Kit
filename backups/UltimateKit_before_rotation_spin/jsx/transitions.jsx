/*  Ultimate Kit - Transitions: 50 shape transitions (designs: shared/transitions.js).
    Precomp "TR - <name>" exactly as long as the transition, put on your timeline so that its middle -
    the moment the shapes cover the whole frame - sits on the playhead (park it on the cut).
    Inside: one shape layer per colour part. The motion is keyframes only - layer / group Position,
    Scale and Rotation, and a keyframed outline where a shape really changes (clock, fan, blades) -
    with zero-speed eases. Colours: Controls null, in Essential Properties of the precomp layer.   */

UK.TRN = {};
UK.TRN.curve = function (name) {
    var e = UK_TR.EASE[name];
    if (!e) return "linear";
    return [e[0], e[1], 0, 0];
};
/* keys of one channel; `add` turns an offset into the real value (position = anchor + offset) */
UK.TRN.keys = function (prop, chn, add) {
    var k = [], c = [], i;
    for (i = 0; i < chn.k.length; i++) k.push([chn.k[i][0], add ? add(chn.k[i][1]) : chn.k[i][1]]);
    for (i = 0; i < chn.e.length; i++) c.push(UK.TRN.curve(chn.e[i]));
    if (k.length === 1) { prop.setValue(k[0][1]); return; }
    UK.anim(prop, k, c);
};
UK.TRN.colExpr = function (c) { return 'thisComp.layer("Controls").effect("' + ({ c1: "Color 1", c2: "Color 2", c3: "Color 3" }[c] || "Color 1") + '")(1)'; };

UK.TRN.layer = function (C, el, d) {
    var L = UK.shapeLayer(C, el.name), i;
    UK.group(UK.root(L), "Shape");
    var G = function () { return UK.root(L).property("Shape"); }, V = function () { return UK.vecs(G()); };
    var addShape = function (vecs, s) {
        if (s.ell) { UK.addEllipse(vecs, [s.ell[2] * 2, s.ell[3] * 2], [s.ell[0], s.ell[1]]); return; }
        var p = UK.addPath(vecs, s.pts || s.k[0][1], null, null, true);
        if (s.k) {
            var keys = [], cv = [], j;
            for (j = 0; j < s.k.length; j++) keys.push([s.k[j][0], UK.makeShape(s.k[j][1])]);
            for (j = 0; j < s.e.length; j++) cv.push(UK.TRN.curve(s.e[j]));
            UK.anim(p.property("ADBE Vector Shape"), keys, cv);
        }
    };
    for (i = 0; i < el.shapes.length; i++) {
        var s = el.shapes[i];
        if (!s.g) { addShape(V(), s); continue; }
        // a part with its own transform (pops, holes, keys): its own group
        var nm = "Part " + (i + 1);
        UK.group(V(), nm);
        var sub = function () { return V().property(nm); };
        addShape(UK.vecs(sub()), s);
        var gt = function (w) { return UK.gtr(sub(), w); }, ga = s.g.a || [0, 0];
        gt("ADBE Vector Anchor").setValue(ga);
        gt("ADBE Vector Position").setValue(ga);
        if (s.g.p) UK.TRN.keys(gt("ADBE Vector Position"), s.g.p, function (o) { return [ga[0] + o[0], ga[1] + o[1]]; });
        if (s.g.s) UK.TRN.keys(gt("ADBE Vector Scale"), s.g.s);
        if (s.g.r) UK.TRN.keys(gt("ADBE Vector Rotation"), s.g.r);
    }
    var F = UK.addFill(V(), "#FFFFFF", 100);
    F.property("ADBE Vector Fill Color").expression = UK.TRN.colExpr(el.col);
    if (el.eo) V().property(V().numProperties).property("ADBE Vector Fill Rule").setValue(2);
    // layer transform: anchor = el.a, position = el.a + offset
    var a = el.a;
    UK.anchor(L).setValue(a);
    UK.pos(L).setValue(a);
    if (el.p) UK.TRN.keys(UK.pos(L), el.p, function (o) { return [a[0] + o[0], a[1] + o[1]]; });
    if (el.s) UK.TRN.keys(UK.scale(L), el.s);
    if (el.r) UK.TRN.keys(UK.rot(L), el.r); else if (el.r0) UK.rot(L).setValue(el.r0);
    L.startTime = 0;
    var tin = (el.tIn === undefined) ? 0 : Math.max(0, el.tIn), tout = (el.tOut === undefined) ? d : Math.min(d, el.tOut);
    L.inPoint = tin;
    L.outPoint = Math.max(tin + C.frameDuration, tout);
    return L;
};

/* builds the transition precomp and places it in host so its middle sits on t (the cut) */
UK.TRN.build = function (host, a, t) {
    UK._fd = host.frameDuration;
    var spec = UK_CAT.find(UK_CAT.transitions, a.id);
    if (!spec) throw new Error("Unknown transition " + a.id);
    var d = UK.clamp(Number(a.dur) || 1.2, 0.4, 10), cols = a.colors || {};
    var sc = UK_TR.build(a.id, host.width, host.height, d);
    var C = UK.newComp(UK.uniqueName("TR - " + spec.name), host, d, "Transitions");
    UK._fd = C.frameDuration;
    var N = C.layers.addNull();
    N.name = "Controls";
    N.label = 2;
    UK.colorCtl(N, "Color 1", cols.c1 || "#FFC400");
    UK.colorCtl(N, "Color 2", cols.c2 || "#FFFFFF");
    UK.colorCtl(N, "Color 3", cols.c3 || "#141416");
    for (var i = sc.els.length - 1; i >= 0; i--) UK.TRN.layer(C, sc.els[i], d);   // last first: the first element ends on top
    N.moveToBeginning();
    var eg = [["Color 1", "Main Color"], ["Color 2", "Line Color"], ["Color 3", "Dark Color"]];
    for (i = eg.length - 1; i >= 0; i--) UK.essential(C, UK.efx(N, eg[i][0]).property(1), eg[i][1]);
    C.comment = "Ultimate Kit Transition: the frame is fully covered at the middle (" + UK.round(sc.cut, 2) + " s). Colours in Essential Properties of the precomp layer; timing = the keyframes.";
    var L = host.layers.add(C);
    L.startTime = t - sc.cut;
    L.name = UK.uniqueLayerName(host, "Transition - " + spec.name);
    L.comment = "Ultimate Kit: its middle sits on the cut. Colours in Essential Properties.";
    try { L.collapseTransformation = true; } catch (e) { }
    return L;
};
UK.api.transition = function (a) {
    var host = UK.comp(true), L = UK.TRN.build(host, a, UK.timeCTI(host));
    UK.selectOnly(host, [L]);
    return { name: L.name, comp: L.source.name };
};

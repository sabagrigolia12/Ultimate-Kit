/*  Ultimate Kit — vector import
    The panel parses SVG files (and traces PNG alpha) into plain path data; this file turns
    that data into a native, fully editable shape layer (groups, paths, fills, strokes).

    data = { w, h, groups: [ { name, opacity, evenOdd, fill:"#hex"|null, fillOpacity,
                               stroke:"#hex"|null, strokeWidth, strokeOpacity, cap, join,
                               paths:[ { v:[[x,y]...], i:[[dx,dy]...], o:[[dx,dy]...], c:true } ] } ] }   */

UK.SVG = {};

UK.SVG.build = function (comp, data, name) {
    var L = UK.shapeLayer(comp, name || "SVG");
    var groups = data.groups || [];
    // SVG paints later elements on top; in AE the first group in the list is on top
    for (var gi = groups.length - 1; gi >= 0; gi--) {
        var G = groups[gi];
        if (!G.paths || !G.paths.length) continue;
        var gname = (G.name || ("Shape " + (gi + 1))).substr(0, 60);
        var g = UK.group(UK.root(L), gname);
        var v = UK.vecs(g);
        for (var pi = 0; pi < G.paths.length; pi++) {
            var P = G.paths[pi];
            if (!P.v || P.v.length < 2) continue;
            UK.addPath(v, P.v, P.i, P.o, P.c !== false);
        }
        if (G.stroke && G.strokeWidth > 0) {
            var cap = { butt: 1, round: 2, square: 3 }[G.cap] || 1;
            var join = { miter: 1, round: 2, bevel: 3 }[G.join] || 1;
            UK.addStroke(v, G.stroke, G.strokeWidth, { cap: cap, join: join, opacity: (G.strokeOpacity === undefined ? 100 : G.strokeOpacity * 100) });
        }
        if (G.fill) {
            var f = UK.addFill(v, G.fill, (G.fillOpacity === undefined ? 100 : G.fillOpacity * 100));
            if (G.evenOdd) f.property("ADBE Vector Fill Rule").setValue(2);
        }
        if (G.opacity !== undefined && G.opacity < 1) UK.gtr(UK.root(L).property(gname)).property("ADBE Vector Group Opacity").setValue(G.opacity * 100);
    }
    var w = data.w || 100, h = data.h || 100;
    UK.anchor(L).setValue([w / 2, h / 2]);
    UK.pos(L).setValue([comp.width / 2, comp.height / 2]);
    return L;
};

/* Import button: build an SVG as a shape layer in the active comp (fit to 60% of the frame if bigger). */
UK.api.importSvg = function (a) {
    var comp = UK.comp(true);
    var data = a.data;
    if (!data || !data.groups) throw new Error("Nothing to import");
    var L = UK.SVG.build(comp, data, a.name || "SVG");
    var fit = Math.min(comp.width * 0.6 / data.w, comp.height * 0.6 / data.h);
    if (a.fit !== false && fit < 1) UK.scale(L).setValue([fit * 100, fit * 100]);
    L.startTime = 0;
    UK.selectOnly(comp, [L]);
    return { name: L.name, groups: data.groups.length };
};

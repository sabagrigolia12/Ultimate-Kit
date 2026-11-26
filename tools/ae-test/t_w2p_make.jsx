// Word to Path test, step 1 (run through the panel's evalScript): a 1080x1080 test comp WR_w2p with a shape layer
// "WR_word" holding four filled letter outlines as groups (N, O with its hole, T, L; orange fill), logged for
// cleanup; then UK.api.w2pRead on it (UK.comp pointed at the test comp). Returns the read JSON.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", before = {}, q;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var c = app.project.items.addComp("WR_w2p", 1080, 1080, 1, 3, 30);
    c.layers.addSolid([0.08, 0.08, 0.1], "WR_bg", 1080, 1080, 1);
    var L = UK.shapeLayer(c, "WR_word"), root = UK.root(L);
    var poly = function (pts) { var z = []; for (var k = 0; k < pts.length; k++) z.push([0, 0]); return UK.makeShape(pts, z, z, true); };
    var letter = function (name, shapes, ox) {
        var g = UK.group(root, name), v = UK.vecs(g);
        for (var k = 0; k < shapes.length; k++) { var p = v.addProperty("ADBE Vector Shape - Group"); p.property("ADBE Vector Shape").setValue(shapes[k]); }
        UK.addFill(v, "#FF7A1A", 100, "Fill 1");
        UK.gtr(g, "ADBE Vector Position").setValue([ox, 0]);
    };
    var ell = function (cx, cy, a, b, rev) { var K = 0.5523, s = rev ? -1 : 1; return UK.makeShape([[cx, cy - b], [cx + a * s, cy], [cx, cy + b], [cx - a * s, cy]], [[-a * K * s, 0], [0, -b * K], [a * K * s, 0], [0, b * K]], [[a * K * s, 0], [0, b * K], [-a * K * s, 0], [0, -b * K]], true); };
    letter("N", [poly([[0, 0], [44, 0], [126, 140], [126, 0], [170, 0], [170, 240], [126, 240], [44, 100], [44, 240], [0, 240]])], 60);
    letter("O", [ell(115, 120, 115, 124), ell(115, 120, 71, 80, true)], 270);
    letter("T", [poly([[0, 0], [190, 0], [190, 44], [117, 44], [117, 240], [73, 240], [73, 44], [0, 44]])], 540);
    letter("L", [poly([[0, 0], [44, 0], [44, 196], [150, 196], [150, 240], [0, 240]])], 770);
    UK.pos(L).setValue([50, 420]);
    for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
    L.selected = true;
    var keep = UK.comp; UK.comp = function () { return c; };
    var r; try { r = UK.api.w2pRead({}); } finally { UK.comp = keep; }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    $.global.W2P_TEST = UK.json(r);
})();

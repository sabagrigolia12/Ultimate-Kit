(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var before = {}, q; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var c = app.project.items.addComp("WR_dnd", 1920, 1080, 1, 6, 30);
    var mk = function (s, nm) { var T = c.layers.addText(s); if (nm) T.name = nm; var td = T.property("ADBE Text Properties").property("ADBE Text Document"), d = td.value; d.fontSize = 80; d.fillColor = [1, 1, 1]; td.setValue(d); return T; };
    c.layers.addSolid([0.2, 0.3, 0.6], "Solid Bottom", 600, 300, 1);
    mk("Second line");
    c.layers.addShape().name = "Shape Layer 1";
    mk("\u10E1\u10D0\u10D7\u10D0\u10E3\u10E0\u10D8");
    c.layers.addSolid([0.6, 0.3, 0.2], "BG Solid", 600, 300, 1);
    mk("Title Text");
    for (var i = 1; i <= c.numLayers; i++) c.layer(i).selected = false;
    c.openInViewer();
    var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close();
})();

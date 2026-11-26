// Grid effect Blending Mode indices are not readable: render a red solid with a white grid for each index
// (one comp each) to find Stencil Alpha (cells transparent, lines kept). Records created items.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/gm/", d = new Folder(OUT); if (!d.exists) d.create();
    var before = {}, i; for (i = 1; i <= app.project.numItems; i++) before[app.project.item(i).id] = true;
    for (i = 1; i <= 22; i++) {
        var c = app.project.items.addComp("UKDUMP_gm" + i, 200, 200, 1, 1, 30);
        var L = c.layers.addSolid([1, 0, 0], "gm", 200, 200, 1);
        var e = L.property("ADBE Effect Parade").addProperty("ADBE Grid");
        e.property("ADBE Grid-0001").setValue([0, 0]); e.property("ADBE Grid-0002").setValue(2);
        e.property("ADBE Grid-0004").setValue(100); e.property("ADBE Grid-0006").setValue(10);
        try { e.property("ADBE Grid-0014").setValue(i); } catch (x) { c.remove(); break; }
        c.saveFrameToPng(0, new File(OUT + "m" + i + ".png"));
    }
    var cf = new File("D:/Projects/Codex/tools/ae-test/out/sb_created.txt"); cf.open("a");
    for (i = 1; i <= app.project.numItems; i++) if (!before[app.project.item(i).id]) cf.writeln(app.project.item(i).id + "|" + app.project.item(i).name);
    cf.close();
})();

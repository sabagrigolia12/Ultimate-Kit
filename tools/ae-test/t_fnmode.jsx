// Fractal Noise Blending Mode indices (red solid: Multiply keeps G = 0 and darkens R) and Shift Channels
// "Take Alpha From" = 5 / 7 on a 50 % grey solid. One comp each; records created items.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/fn/", d = new Folder(OUT); if (!d.exists) d.create();
    var before = {}, i; for (i = 1; i <= app.project.numItems; i++) before[app.project.item(i).id] = true;
    for (i = 1; i <= 8; i++) {
        var c = app.project.items.addComp("UKDUMP_fn" + i, 100, 100, 1, 1, 30);
        var L = c.layers.addSolid([1, 0, 0], "fn", 100, 100, 1);
        var e = L.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
        e.property("ADBE Fractal Noise-0010").setValue(20);
        try { e.property("ADBE Fractal Noise-0030").setValue(i); } catch (x) { c.remove(); break; }
        c.saveFrameToPng(0, new File(OUT + "n" + i + ".png"));
    }
    var vals = [5, 7];
    for (i = 0; i < vals.length; i++) {
        var c2 = app.project.items.addComp("UKDUMP_sc" + vals[i], 100, 100, 1, 1, 30);
        var L2 = c2.layers.addSolid([0.5, 0.5, 0.5], "sc", 100, 100, 1);
        var e2 = L2.property("ADBE Effect Parade").addProperty("ADBE Shift Channels");
        e2.property("ADBE Shift Channels-0001").setValue(vals[i]);
        c2.saveFrameToPng(0, new File(OUT + "s" + vals[i] + ".png"));
    }
    var cf = new File("D:/Projects/Codex/tools/ae-test/out/sb_created.txt"); cf.open("a");
    for (i = 1; i <= app.project.numItems; i++) if (!before[app.project.item(i).id]) cf.writeln(app.project.item(i).id + "|" + app.project.item(i).name);
    cf.close();
})();

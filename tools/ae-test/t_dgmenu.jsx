// Deep Glow 2 dropdowns are not readable by script: render a grey square with each Glow Mode / Blend Mode index
// (one comp each, saveFrameToPng is asynchronous) to tell Screen / Add and Exponential apart. Logs created ids.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/dg/", d = new Folder(OUT); if (!d.exists) d.create();
    var before = {}, i; for (i = 1; i <= app.project.numItems; i++) before[app.project.item(i).id] = true;
    var combos = [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 1], [3, 1]], n = 0, log = new File(OUT + "info.txt"); log.open("w");
    for (i = 0; i < combos.length; i++) {
        var c = app.project.items.addComp("UKDUMP_dg" + i, 400, 200, 1, 1, 30);
        c.layers.addSolid([0.5, 0.5, 0.5], "bg", 400, 200, 1);
        var L = c.layers.addSolid([0.5, 0.5, 0.5], "sq", 60, 60, 1);
        var fx = L.property("ADBE Effect Parade").addProperty("PEDG2");
        fx.property("PEDG2-0017").setValue(40);
        try { fx.property("PEDG2-0103").setValue(combos[i][0]); fx.property("PEDG2-0024").setValue(combos[i][1]); }
        catch (e) { log.writeln("bad " + combos[i] + " " + e.toString()); continue; }
        c.saveFrameToPng(0, new File(OUT + "g" + combos[i][0] + "_b" + combos[i][1] + ".png")); n++;
    }
    log.writeln("saved " + n); log.close();
    var cf = new File("D:/Projects/Codex/tools/ae-test/out/sb_created.txt"); cf.open("a");
    for (i = 1; i <= app.project.numItems; i++) if (!before[app.project.item(i).id]) cf.writeln(app.project.item(i).id + "|" + app.project.item(i).name);
    cf.close();
})();

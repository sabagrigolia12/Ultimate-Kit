// Colorama preset palettes on the test photo (temp comp per palette, frames saved, then all temp items removed).
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/pal/", d = new Folder(OUT); if (!d.exists) d.create();
    var before = {}, q;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = 1;
    var ft = app.project.importFile(new ImportOptions(new File("D:/Projects/Codex/tools/ae-test/lab/land.png")));
    var log = new File(OUT + "log.txt"); log.open("w");
    for (var v = 1; v <= 40; v++) {
        var c = app.project.items.addComp("UKPAL_" + v, 480, 270, 1, 1, 30);
        var L = c.layers.add(ft); L.property("ADBE Transform Group").property("ADBE Scale").setValue([33.3, 33.3]);
        var e = L.property("ADBE Effect Parade").addProperty("APC Colorama");
        try { e.property("APC Colorama-0010").setValue(v); } catch (x) { log.writeln("stop at " + v + " " + x); c.remove(); break; }
        c.saveFrameToPng(0, new File(OUT + "p" + (v < 10 ? "0" : "") + v + ".png"));
    }
    log.close();
    $.sleep(4000);
    for (q = app.project.numItems; q >= 1; q--) { var it = app.project.item(q); if (!before[it.id]) try { it.remove(); } catch (e2) { } }
})();

// Builds the Color Wipe on lab/land.png in a WR_color host comp (no viewer), logs the structure and expression
// errors, saves frames to out/wipe/c_*.png, records created items.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/", LAB = "D:/Projects/Codex/tools/ae-test/lab/";
    var fo = new Folder(OUT + "wipe"); if (!fo.exists) fo.create();
    var out = new File(OUT + "t_wipe2_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var photo = app.project.importFile(new ImportOptions(new File(LAB + "land.png")));
        var c = app.project.items.addComp("WR_color", 1920, 1080, 1, 3, 30);
        var L = c.layers.add(photo);
        var sc = 100 * Math.max(1920 / photo.width, 1080 / photo.height); L.property("ADBE Transform Group").property("ADBE Scale").setValue([sc, sc]);
        var r = UK.WIPE.buildColor(c, L, { t0: 0 });
        for (var i = 1; i <= c.numLayers; i++) { var Y = c.layer(i); out.writeln("main " + i + " " + Y.name + " in=" + Y.inPoint.toFixed(3) + " out=" + Y.outPoint.toFixed(3) + " fx=" + Y.property("ADBE Effect Parade").numProperties); }
        var fx = r.top.property("ADBE Effect Parade");
        for (i = 1; i <= fx.numProperties; i++) for (var j = 1; j <= fx.property(i).numProperties; j++) {
            var p = fx.property(i).property(j);
            try { if (p.canSetExpression && p.expressionEnabled) out.writeln("  " + fx.property(i).name + "/" + p.name + " err='" + p.expressionError + "' v@0.5=" + p.valueAtTime(0.5, false)); } catch (e1) { }
        }
        var times = [0, 0.3, 0.5, 0.7, 1.0];
        for (i = 0; i < times.length; i++) c.saveFrameToPng(times[i], new File(OUT + "wipe/c_" + Math.round(times[i] * 100) + ".png"));
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    out.close();
})();

// Builds the Glass on lab/land.png in a WR_glass host comp (no viewer), logs layers and expression errors,
// saves a frame to out/glass.png, records created items.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/", LAB = "D:/Projects/Codex/tools/ae-test/lab/";
    var out = new File(OUT + "t_glass_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var photo = app.project.importFile(new ImportOptions(new File(LAB + "land.png")));
        var c = app.project.items.addComp("WR_glass", 1920, 1080, 1, 3, 30);
        var L = c.layers.add(photo);
        var sc = 100 * Math.max(1920 / photo.width, 1080 / photo.height); L.property("ADBE Transform Group").property("ADBE Scale").setValue([sc, sc]);
        var lv = Number((new File(OUT + "glass_cfg.txt")).exists ? (function(){ var f = new File(OUT + "glass_cfg.txt"); f.open("r"); var v = f.read(); f.close(); return v; })() : 250); var r = UK.GL.build(c, { lens: lv });
        for (var i = 1; i <= c.numLayers; i++) { var Y = c.layer(i); out.writeln(i + " " + Y.name + " adj=" + Y.adjustmentLayer + " parent=" + (Y.parent ? Y.parent.name : "-") + " fx=" + Y.property("ADBE Effect Parade").numProperties); }
        var chk = function (p, nm) { try { out.writeln(nm + " err='" + p.expressionError + "' v=" + p.valueAtTime(0, false)); } catch (e1) { out.writeln(nm + " ?? " + e1); } };
        chk(r.base.property("ADBE Effect Parade").property("Fast Box Blur").property("ADBE Box Blur2-0001"), "blur"); chk(r.base.property("ADBE Effect Parade").property("Edge Lens").property("CC Glass-0006"), "lens");
        var rim = c.layer("Glass Rim"); chk(rim.property("ADBE Effect Parade").property(1).property("ADBE Linear Wipe-0001"), "wipe");
        c.saveFrameToPng(0, new File(OUT + "glass_" + lv + ".png"));
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    out.close();
})();




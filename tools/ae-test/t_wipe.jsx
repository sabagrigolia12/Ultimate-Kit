// Builds the Wipe Reveal on lab/land.png in a WR_test host comp (no viewer), logs the structure and expression
// errors, saves frames to out/wipe/, records created items. out/wipe_cfg.txt (optional): "angle|radial|times".
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/", LAB = "D:/Projects/Codex/tools/ae-test/lab/";
    var fo = new Folder(OUT + "wipe"); if (!fo.exists) fo.create();
    var out = new File(OUT + "t_wipe_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var id = "wr01", angle = 90, radial = false, times = [0.2, 0.4, 0.6, 0.73, 0.8, 0.9, 1.1, 1.3, 1.6], cf = new File(OUT + "wipe_cfg.txt");
        if (cf.exists) { cf.open("r"); var s = cf.read().split("|"); cf.close(); angle = Number(s[0]); radial = s[1] === "1"; if (s[2]) times = s[2].split(","); if (s[3]) id = s[3]; }
        var photo = app.project.importFile(new ImportOptions(new File(LAB + "land.png")));
        var c = app.project.items.addComp("WR_test", 1920, 1080, 1, 5, 30);
        var L = c.layers.add(photo);
        var sc = 100 * Math.max(1920 / photo.width, 1080 / photo.height); L.property("ADBE Transform Group").property("ADBE Scale").setValue([sc, sc]);
        var t1 = new Date().getTime();
        var r = UK.WIPE.build(c, L, { t0: 0.2, angle: angle, radial: radial, id: id });
        out.writeln("built in " + (new Date().getTime() - t1) + "ms glow=" + r.glow);
        for (var i = 1; i <= c.numLayers; i++) { var Y = c.layer(i); out.writeln("main " + i + " " + Y.name + " start=" + Y.startTime.toFixed(3) + " in=" + Y.inPoint.toFixed(3) + " out=" + Y.outPoint.toFixed(3) + " fx=" + Y.property("ADBE Effect Parade").numProperties + " enabled=" + Y.enabled); }
        for (i = 1; i <= r.comp.numLayers; i++) { var Z = r.comp.layer(i); out.writeln("pre  " + i + " " + Z.name + " enabled=" + Z.enabled + " matte=" + Z.trackMatteType + " fx=" + Z.property("ADBE Effect Parade").numProperties); }
        var mp = r.comp.layer("Wipe Matte").property("ADBE Mask Parade").property(1).property("ADBE Mask Shape");
        out.writeln("mask exprErr='" + mp.expressionError + "' verts@0.73=" + mp.valueAtTime(0.73, false).vertices.toString());
        var rp = r.dots.property("ADBE Effect Parade").property(1).property("ADBE Ramp-0002");
        out.writeln("ramp exprErr='" + rp.expressionError + "' c1=" + rp.valueAtTime(1, false).toString());
        out.writeln("wipe@0.933=" + r.controls.property("ADBE Effect Parade").property("Wipe").property(1).valueAtTime(0.2 + 22 / 30, false));
        for (i = 0; i < times.length; i++) c.saveFrameToPng(Number(times[i]), new File(OUT + "wipe/" + id + "_" + (angle) + (radial ? "r" : "") + "_" + Math.round(Number(times[i]) * 100) + ".png"));
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    out.close();
})();

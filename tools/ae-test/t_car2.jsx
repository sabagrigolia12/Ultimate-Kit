// Builds the Path Carousel (cr02) on six lab pictures in WR_car2 host comps (1280x720), one per shape / mode
// given in out/car2_cfg.txt ("scurve|3d"), logs expression errors and photo positions, saves frames to out/car2/.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/", LAB = "D:/Projects/Codex/tools/ae-test/lab/";
    var fo = new Folder(OUT + "car2"); if (!fo.exists) fo.create();
    var out = new File(OUT + "t_car2_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var shape = "scurve", mode = "3d", rotY = 0, cf = new File(OUT + "car2_cfg.txt");
        if (cf.exists) { cf.open("r"); var s = cf.read().split("|"); cf.close(); shape = s[0]; mode = s[1]; if (s[2]) rotY = Number(s[2]); }
        var c = app.project.items.addComp("WR_car2", 1280, 720, 1, 5, 30);
        var files = ["land.png", "land2.png", "river.png", "river2.png", "peach_ref.png", "river_ref.png"], i, items = [];
        for (i = 0; i < files.length; i++) items.push(app.project.importFile(new ImportOptions(new File(LAB + files[i]))));
        for (i = 0; i < files.length; i++) c.layers.add(items[i]);
        var sel = []; for (i = 1; i <= c.numLayers; i++) sel.push(c.layer(i));
        var P = UK.CAR.buildPath(c, sel, { id: "cr02", shape: shape, mode: mode, t0: 0, rotY: rotY });
        var errs = 0;
        for (i = 1; i <= c.numLayers; i++) {
            var Y = c.layer(i), T = Y.property("ADBE Transform Group"), line = i + " " + Y.name + " parent=" + (Y.parent ? Y.parent.name : "-");
            var ps = ["ADBE Position", "ADBE Rotate Z", "ADBE Scale", "ADBE Opacity"];
            for (var k = 0; k < ps.length; k++) { var pr = T.property(ps[k]); if (pr.expression && pr.expressionError) { errs++; line += " ERR(" + ps[k] + ") " + pr.expressionError; } }
            line += " pos@2=" + T.property("ADBE Position").valueAtTime(2, false).toString() + " op@2=" + T.property("ADBE Opacity").valueAtTime(2, false);
            out.writeln(line);
        }
        out.writeln("errors " + errs);
        var fr = [50, 108];
        for (i = 0; i < fr.length; i++) c.saveFrameToPng(fr[i] / 30, new File(OUT + "car2/" + shape + "_" + mode + "_" + fr[i] + ".png"));
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    out.close();
})();



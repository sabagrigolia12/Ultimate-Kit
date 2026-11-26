// Builds the Carousel on six lab pictures in a WR_car host comp (1280x720 like the user's), logs the ring
// positions (idx 0 must match the user's [620.9, -269.6, 160.4] with their values), saves frames to out/car/.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/", LAB = "D:/Projects/Codex/tools/ae-test/lab/";
    var fo = new Folder(OUT + "car"); if (!fo.exists) fo.create();
    var out = new File(OUT + "t_car_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var c = app.project.items.addComp("WR_car", 1280, 720, 1, 4, 30);
        var files = ["land.png", "land2.png", "river.png", "river2.png", "peach_ref.png", "river_ref.png"], L = [], i;
        for (i = 0; i < files.length; i++) L.push(c.layers.add(app.project.importFile(new ImportOptions(new File(LAB + files[i])))));
        var sel = []; for (i = 1; i <= c.numLayers; i++) sel.push(c.layer(i));
        var N = UK.CAR.build(c, sel, { spin: 30 });
        for (i = 1; i <= c.numLayers; i++) { var Y = c.layer(i), p = Y.property("ADBE Transform Group").property("ADBE Position"); out.writeln(i + " " + Y.name + " 3D=" + Y.threeDLayer + " pos=" + p.valueAtTime(0, false).toString() + (p.expressionError ? " ERR " + p.expressionError : "")); }
        var fr = [0, 30, 60, 90];
        for (i = 0; i < fr.length; i++) c.saveFrameToPng(fr[i] / 30, new File(OUT + "car/f" + fr[i] + ".png"));
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    out.close();
})();

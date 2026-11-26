// Builds the Spin Carousel (cr03) on six lab pictures in a WR_car3 host comp (1280x720), logs the precomp's
// layers and expression errors, saves frames to out/car3/, records created items.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/", LAB = "D:/Projects/Codex/tools/ae-test/lab/";
    var fo = new Folder(OUT + "car3"); if (!fo.exists) fo.create();
    var out = new File(OUT + "t_car3_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var c = app.project.items.addComp("WR_car3", 1280, 720, 1, 6, 30);
        var files = ["land.png", "land2.png", "river.png", "river2.png", "peach_ref.png", "river_ref.png"], i, items = [];
        for (i = 0; i < files.length; i++) items.push(app.project.importFile(new ImportOptions(new File(LAB + files[i]))));
        for (i = 0; i < files.length; i++) c.layers.add(items[i]);
        var sel = []; for (i = 1; i <= c.numLayers; i++) sel.push(c.layer(i));
        var PL = UK.CAR.buildSpin(c, sel, { speed: 30 });
        var C = PL.source, errs = 0;
        out.writeln("main layers " + c.numLayers + " precomp '" + C.name + "' layers " + C.numLayers);
        var walk = function (p, path) {
            for (var j = 1; j <= p.numProperties; j++) {
                var x = p.property(j);
                if (x.propertyType === PropertyType.PROPERTY) { try { if (x.canSetExpression && x.expression !== "" && x.expressionError) { errs++; out.writeln("  ERR " + path + "/" + x.name + ": " + x.expressionError); } } catch (e1) { } }
                else walk(x, path + "/" + x.name);
            }
        };
        for (i = 1; i <= C.numLayers; i++) { var Y = C.layer(i); out.writeln(i + " " + Y.name + " parent=" + (Y.parent ? Y.parent.name : "-") + " matte=" + Y.trackMatteType + " enabled=" + Y.enabled); walk(Y, Y.name); }
        out.writeln("errors " + errs);
        var fr = [0, 45, 90];
        for (i = 0; i < fr.length; i++) c.saveFrameToPng(fr[i] / 30, new File(OUT + "car3/f" + fr[i] + ".png"));
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    out.close();
})();

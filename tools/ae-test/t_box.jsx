// Builds the Glow Box (gl02) in a WR_box host comp like the user's (1920x1080, 29.97 fps, black), logs layers and
// expression errors, saves frames 0/4/8/12/16/20/30/60 to out/box/, records created items.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "box"); if (!fo.exists) fo.create();
    var out = new File(OUT + "t_box_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var c = app.project.items.addComp("WR_box", 1920, 1080, 1, 4, 29.97);
        c.bgColor = [0, 0, 0];
        var r = UK.GL.buildBox(c, { t0: 0 });
        var errs = [];
        var walk = function (p, path) {
            for (var j = 1; j <= p.numProperties; j++) {
                var x = p.property(j);
                if (x.propertyType === PropertyType.PROPERTY) { try { if (x.canSetExpression && x.expression !== "" && x.expressionError) errs.push(path + "/" + x.name + ": " + x.expressionError); } catch (e1) { } }
                else walk(x, path + "/" + x.name);
            }
        };
        for (var i = 1; i <= c.numLayers; i++) { var Y = c.layer(i); out.writeln(i + " " + Y.name + " blend=" + Y.blendingMode + " fx=" + Y.property("ADBE Effect Parade").numProperties); walk(Y, Y.name); }
        var lv = c.layer("Shape Layer 2").property("ADBE Effect Parade").property("Levels"), lc = c.layer("glass storke").property("ADBE Effect Parade").property("Curves");
        out.writeln("glow levels: " + lv.property(1).value + " " + lv.property("ADBE Easy Levels2-0004").name + "=" + lv.property("ADBE Easy Levels2-0004").value + " | curve: " + lc.property("ADBE Easy Levels2-0005").name + "=" + lc.property("ADBE Easy Levels2-0005").value);
        out.writeln("expression errors: " + errs.length); for (i = 0; i < errs.length; i++) out.writeln("  " + errs[i]);
        var fr = [0, 4, 8, 12, 16, 20, 30, 60];
        for (i = 0; i < fr.length; i++) c.saveFrameToPng(fr[i] * c.frameDuration, new File(OUT + "box/f" + fr[i] + ".png"));
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    out.close();
})();


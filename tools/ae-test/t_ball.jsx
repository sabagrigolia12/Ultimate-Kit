// Builds every Ball look (UK.BALL.build) into WR_ball_<id> host comps (1920x1080, 30 fps, 2 s, size 80 %), logs layers and
// expression errors, renders 0.5 s to out/ball/<id>.png. Records created items in out/sb_created.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "ball"); if (!fo.exists) fo.create();
    var out = new File(OUT + "ball/t_ball_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [];
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        for (var k = 0; k < UK_BALL.LIST.length; k++) {
            var id = UK_BALL.LIST[k].id;
            var c = app.project.items.addComp("WR_ball_" + id, 1920, 1080, 1, 2, 30);
            c.bgColor = [0.12, 0.12, 0.14];
            try {
                var r = UK.BALL.build(c, { id: id, size: 80 });
                var C = c.layer(1).source, errs = [], names = [];
                var walk = function (p, path) { for (var j = 1; j <= p.numProperties; j++) { var x = p.property(j); if (x.propertyType === PropertyType.PROPERTY) { try { if (x.canSetExpression && x.expression !== "") { x.valueAtTime(0, false); if (x.expressionError) errs.push(path + ": " + x.expressionError); } } catch (e1) { } } else walk(x, path + "/" + x.name); } };
                for (var i = 1; i <= C.numLayers; i++) { var L = C.layer(i); names.push(L.name + (L.hasTrackMatte ? "(m)" : "") + (L.enabled ? "" : "(off)")); walk(L, L.name); }
                out.writeln(id + " '" + r.name + "' " + names.join(", ") + " | errors " + errs.length + " " + errs.join(" ; "));
                renders.push([c, OUT + "ball/" + id + ".png"]);
            } catch (e) { out.writeln(id + " ERR " + e.toString() + " line " + e.line); }
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    out.close();
    for (var n = 0; n < renders.length; n++) renders[n][0].saveFrameToPng(0.5, new File(renders[n][1]));
})();

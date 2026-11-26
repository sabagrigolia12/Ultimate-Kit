// Builds every SaaS BG (UK.SBG.build) into its own WR_sbg_<id> host comp (1920x1080, 30 fps, 40 s), logs the
// layers / expression errors, renders host frames at 1 s and 35 s to out/sbg/mine_<id>_<t>.png and the user's
// original comp at 1 s to out/sbg/orig_<id>_1.png (read only). Records created items in out/sb_created.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "sbg/t_sbg_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = app.project.item(q);
    var orig = {};
    for (q = 1; q <= app.project.numItems; q++) if (app.project.item(q) instanceof CompItem) orig[app.project.item(q).name] = app.project.item(q);
    var renders = [];
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var ids = ["sb01", "sb02", "sb03", "sb04", "sb05", "sb06", "sb07", "sb08", "sb09"], idf = new File(OUT + "sbg/ids.txt");
        if (idf.exists) { idf.open("r"); ids = idf.read().replace(/^\s+|\s+$/g, "").split(","); idf.close(); }
        for (var k = 0; k < ids.length; k++) {
            var id = ids[k], t0 = new Date().getTime();
            var c = app.project.items.addComp("WR_sbg_" + id, 1920, 1080, 1, 40, 30);
            try {
                var r = UK.SBG.build(c, id);
                var P = c.layer(c.numLayers), C = P.source, errs = 0, s = "";
                var walk = function (p) { for (var j = 1; j <= p.numProperties; j++) { var x = p.property(j); if (x.propertyType === PropertyType.PROPERTY) { try { if (x.canSetExpression && x.expression !== "") { x.valueAtTime(1, false); s += " [expr " + x.name + " on=" + x.expressionEnabled + " err=" + (x.expressionError ? "Y" : "n") + "]"; if (x.expressionEnabled && x.expressionError) errs++; } } catch (e1) { } } else walk(x); } };
                for (var i = 1; i <= C.numLayers; i++) walk(C.layer(i));
                out.writeln(id + " -> '" + r.name + "' comp " + C.name + " layers " + C.numLayers + " dur " + C.duration + " folder " + C.parentFolder.name + " ms " + (new Date().getTime() - t0) + " exprErrors " + errs + s);
                renders.push([c, 1, OUT + "sbg/mine_" + id + "_1.png"], [c, 35, OUT + "sbg/mine_" + id + "_35.png"], [orig[UK.SBG.COMPS[id]], 1, OUT + "sbg/orig_" + id + "_1.png"]);
            } catch (e) { out.writeln(id + " ERR " + e.toString() + " line " + e.line); }
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    var leftover = []; for (z = 1; z <= app.project.numItems; z++) { var it = app.project.item(z); if (!before[it.id]) leftover.push("[" + it.typeName + "] " + it.name + " in " + it.parentFolder.name); }
    out.writeln("new items: " + leftover.join(" | "));
    out.close();
    for (var n = 0; n < renders.length; n++) renders[n][0].saveFrameToPng(renders[n][1], new File(renders[n][2]));
})();

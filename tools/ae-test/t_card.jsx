// Builds Text Card presets in CD_<id> host comps (never opens a viewer / touches the active comp), sweeps expression errors,
// records created items. out/only.txt (optional): comma list of ids.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "t_card_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var onlyF = new File(OUT + "only.txt"), ONLY = null;
        if (onlyF.exists) { onlyF.open("r"); ONLY = onlyF.read().split(","); onlyF.close(); }
        var Ls = UK_CAT.cards;
        for (var i = 0; i < Ls.length; i++) {
            if (ONLY && !UK.has(ONLY, Ls[i].id)) continue;
            var c = app.project.items.addComp("CD_" + Ls[i].id, 1280, 720, 1, 5, 30);
            var A = c.layers.addSolid([0.45, 0.36, 0.95], "clip A", 1280, 720, 1); A.outPoint = 1;
            var B = c.layers.addSolid([0.16, 0.6, 0.55], "clip B", 1280, 720, 1); B.inPoint = 1;
            var t0 = new Date().getTime(), msg = "";
            try { UK.CARD.build(c, { id: Ls[i].id, inDur: 0.9, hold: 2, outDur: 0.8 }, 0.5); } catch (eb) { msg = eb.toString() + " line " + eb.line; }
            if (msg) { out.writeln("FAIL " + Ls[i].id + " " + Ls[i].name + " :: " + msg); continue; }
            var inner = c.layer(1).source, bad = 0;
            for (var li = 1; li <= inner.numLayers; li++) (function walk(g) { for (var k = 1; k <= g.numProperties; k++) { var pp = g.property(k); if (pp.propertyType !== PropertyType.PROPERTY) { walk(pp); continue; } if (pp.canSetExpression && pp.expression !== "") { try { pp.valueAtTime(1, false); } catch (ex) { if (String(ex.message).indexOf("invalid numeric") < 0) { bad++; out.writeln("   EXPR " + g.name + "/" + pp.name + " :: " + ex.message); } } if (pp.expressionError) { bad++; out.writeln("   EXPR ERR " + pp.name + " :: " + pp.expressionError); } } } })(inner.layer(li));
            out.writeln("OK   " + Ls[i].id + " " + Ls[i].name + " layers=" + inner.numLayers + " exprErr=" + bad + " " + (new Date().getTime() - t0) + "ms");
        }
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line + " " + e.fileName); }
    try { var cf = new File(OUT + "sb_created.txt"); cf.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cf.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cf.close(); } catch (e2) { }
    out.close();
})();
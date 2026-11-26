// 1) Frosted Glass and Glow Box with Edge Lens 620 (above CC Glass's 500) must build; 2) UK.atomic must remove what
// a failing build made. In a WR_gfix host comp; records created items.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "t_glassfix_out.txt"); out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var c = app.project.items.addComp("WR_gfix", 1920, 1080, 1, 3, 30);
        var r1 = UK.atomic(c, function () { return UK.GL.build(c, { lens: 620, lensW: 55 }); });
        out.writeln("frosted ok, displacement " + r1.base.property("ADBE Effect Parade").property("Edge Lens").property("CC Glass-0006").value + " layers " + c.numLayers);
        var r2 = UK.atomic(c, function () { return UK.GL.buildBox(c, { lens: 620, t0: 0 }); });
        out.writeln("box ok, layers " + c.numLayers);
        var n0 = c.numLayers, i0 = app.project.numItems;
        try { UK.atomic(c, function () { c.layers.addNull(); c.layers.addShape(); throw new Error("test failure"); }); } catch (ef) { out.writeln("failed as planned: " + ef.message); }
        out.writeln("after rollback layers " + c.numLayers + " (was " + n0 + "), items " + app.project.numItems + " (was " + i0 + ")");
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    out.close();
})();

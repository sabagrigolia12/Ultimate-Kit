// Builds Lower Third presets in LT_<id> host comps (never opens a viewer / touches the active comp), sweeps expression errors, records created items.
// out/only.txt (optional): comma list of ids to build.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "t_lt_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    function sweep(comp, times) {
        var bad = 0;
        function walk(g, path) {
            for (var k = 1; k <= g.numProperties; k++) {
                var p = g.property(k);
                if (p.propertyType !== PropertyType.PROPERTY) { walk(p, path + "/" + p.name); continue; }
                if (!p.canSetExpression || p.expression === "") continue;
                for (var ti = 0; ti < times.length; ti++) try { p.valueAtTime(times[ti], false); } catch (e) { if (String(e.message).indexOf("invalid numeric") < 0) { bad++; out.writeln("   EXPR THROW " + path + "/" + p.name + " :: " + e.message); break; } }
                if (p.expressionError) { bad++; out.writeln("   EXPR ERR " + path + "/" + p.name + " :: " + p.expressionError); }
            }
        }
        for (var j = 1; j <= comp.numLayers; j++) walk(comp.layer(j), comp.layer(j).name);
        return bad;
    }
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var onlyF = new File(OUT + "only.txt"), ONLY = null;
        if (onlyF.exists) { onlyF.open("r"); ONLY = onlyF.read().split(","); onlyF.close(); }
        var Ls = UK_CAT.lowerThird;
        for (var i = 0; i < Ls.length; i++) {
            if (ONLY && !UK.has(ONLY, Ls[i].id)) continue;
            var c = app.project.items.addComp("LT_" + Ls[i].id, 1280, 720, 1, 6, 30);
            c.layers.addSolid([0.07, 0.08, 0.12], "bg", 1280, 720, 1);
            var r = { ok: true }; try { UK.LT.build(c, { id: Ls[i].id, mode: "both", inDur: 1.2, hold: 2, outDur: 0.9, name: "Alex Morgan", title: "Creative Director" }, 0); } catch (eb) { r = { ok: false, error: eb.toString() + " line " + eb.line }; }
            if (!r.ok) { out.writeln("FAIL " + Ls[i].id + " " + Ls[i].name + " :: " + r.error); continue; }
            var inner = c.layer(1).source, b = sweep(inner, [0.3, 1.5]);
            out.writeln((b ? "WARN " : "OK   ") + Ls[i].id + " " + Ls[i].name + " layers=" + inner.numLayers + " egp=" + inner.motionGraphicsTemplateControllerCount + " exprErrors=" + b);
        }
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line + " " + e.fileName); }
    try { var cf = new File(OUT + "sb_created.txt"); cf.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cf.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cf.close(); } catch (e2) { }
    out.close();
})();

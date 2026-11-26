// Builds SaaS backgrounds into SB_<id> test comps and reports expression errors.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "t_saasbg_out.txt"); out.encoding = "UTF-8"; out.open("w");
    function log(s) { out.writeln(s); }
    function sweep(comp, depth) {
        var bad = 0;
        function walk(g, path) {
            for (var k = 1; k <= g.numProperties; k++) {
                var p = g.property(k);
                if (p.propertyType !== PropertyType.PROPERTY) { walk(p, path + "/" + p.name); continue; }
                if (!p.canSetExpression || p.expression === "") continue;
                try { p.valueAtTime(1.2, false); } catch (e) { if (String(e.message).indexOf("invalid numeric") < 0) { bad++; log("   EXPR THROW " + path + "/" + p.name + " :: " + e.message); } }
                if (p.expressionError) { bad++; log("   EXPR ERR " + path + "/" + p.name + " :: " + p.expressionError); }
            }
        }
        for (var j = 1; j <= comp.numLayers; j++) {
            walk(comp.layer(j), comp.name + ">" + comp.layer(j).name);
            if (depth < 2 && comp.layer(j).source instanceof CompItem) bad += sweep(comp.layer(j).source, depth + 1);
        }
        return bad;
    }
    try {
        var UK_ROOT = ROOT;
        $.evalFile(new File(ROOT + "jsx/host.jsx"));
        log("load error: '" + UK_LOAD_ERROR + "'");
        var onlyF = new File(OUT + "sb_only.txt"), ONLY = null;
        if (onlyF.exists) { onlyF.open("r"); ONLY = onlyF.read().split(","); onlyF.close(); }
        var Lst = UK_CAT.saasBg;
        /* remember every item that exists now: whatever is new afterwards was created by this test */
        var before = {};
        for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
        for (var i = 0; i < Lst.length; i++) {
            if (ONLY && !UK.has(ONLY, Lst[i].id)) continue;
            var c = app.project.items.addComp("SB_" + Lst[i].id, 1280, 720, 1, 6, 30);
            c.openInViewer();
            c.time = 0;
            var t0 = new Date().getTime();
            var r = UK.parse(UK.call("saasBg", UK.json({ id: Lst[i].id, speed: 100, grain: 6, sweep: 40, fullComp: true })));
            if (!r.ok) { log("FAIL " + Lst[i].id + " " + Lst[i].name + " :: " + r.error); continue; }
            var b = sweep(c, 0);
            log((b ? "WARN " : "OK   ") + Lst[i].id + " " + Lst[i].name + " layers=" + c.layer(1).source.numLayers + " exprErrors=" + b + " ms=" + (new Date().getTime() - t0));
        }
    } catch (e) { log("ERR " + e.toString() + " line " + e.line + " " + e.fileName); }
    try {
        var cf = new File(OUT + "sb_created.txt"); cf.open("a");
        for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cf.writeln(app.project.item(z).id + "|" + app.project.item(z).name);
        cf.close();
    } catch (e2) { }
    out.close();
})();

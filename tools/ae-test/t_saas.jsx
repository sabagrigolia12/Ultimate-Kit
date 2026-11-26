(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "t_saas_out.txt"); out.encoding = "UTF-8"; out.open("w");
    function log(s) { out.writeln(s); }
    function sweep(comp) {
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
            walk(comp.layer(j), comp.layer(j).name);
            if (comp.layer(j).source instanceof CompItem) bad += sweep(comp.layer(j).source);
        }
        return bad;
    }
    try {
        var UK_ROOT = ROOT;
        $.evalFile(new File(ROOT + "jsx/host.jsx"));
        log("load error: '" + UK_LOAD_ERROR + "'");
        var onlyF = new File(OUT + "only.txt"), ONLY = null;
        if (onlyF.exists) { onlyF.open("r"); ONLY = onlyF.read().split(","); onlyF.close(); }
        var L = UK_CAT.textSaas;
        var before = {};
        for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
        for (var i = 0; i < L.length; i++) {
            if (ONLY && !UK.has(ONLY, L[i].id)) continue;
            var c = app.project.items.addComp("ST_" + L[i].id, 1280, 720, 1, 5, 30);
            var bg = c.layers.addSolid([0.04, 0.05, 0.1], "bg", 1280, 720, 1);
            c.openInViewer();
            c.time = 0.3;
            UK.selectOnly(c, []);
            var r = UK.parse(UK.call("text", UK.json({ id: L[i].id, mode: "both", inDur: 1.0, outDur: 0.8, hold: 1.5 })));
            if (!r.ok) { log("FAIL " + L[i].id + " " + L[i].name + " :: " + r.error); continue; }
            var b = sweep(c);
            var pre = (c.numLayers > 1 && c.layer(1).source instanceof CompItem) ? " precomp(" + c.layer(1).source.numLayers + ")" : "";
            log((b ? "WARN " : "OK   ") + L[i].id + " " + L[i].name + " layers=" + c.numLayers + pre + " exprErrors=" + b);
            // re-apply on the same (selected) layer: must replace, not stack
            var r2 = UK.parse(UK.call("text", UK.json({ id: L[i].id, mode: "in", inDur: 0.8 })));
            if (!r2.ok) log("   REAPPLY FAIL " + r2.error);
            else { var b2 = sweep(c); if (b2) log("   REAPPLY exprErrors=" + b2); }
            // restore the both-mode version for rendering
            UK.parse(UK.call("text", UK.json({ id: L[i].id, mode: "both", inDur: 1.0, outDur: 0.8, hold: 1.5 })));
        }
    } catch (e) { log("ERR " + e.toString() + " line " + e.line + " " + e.fileName); }
    try { var cf = new File(OUT + 'sb_created.txt'); cf.open('a'); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cf.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cf.close(); } catch (e2) { }
    out.close();
})();

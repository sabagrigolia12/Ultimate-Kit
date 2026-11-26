// Lists the Essential Graphics controllers of the precomp inside ST_st21 and the outer layer's Essential Properties.
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/t_egp.txt"); out.open("w");
    try {
        for (var i = 1; i <= app.project.numItems; i++) {
            var c = app.project.item(i);
            if (!(c instanceof CompItem) || c.name !== "ST_st21") continue;
            var PL = c.layer(1), ic = PL.source;
            out.writeln("inner " + ic.name + " controllers " + ic.motionGraphicsTemplateControllerCount);
            for (var k = 1; k <= ic.motionGraphicsTemplateControllerCount; k++) out.writeln("  " + k + " " + ic.getMotionGraphicsTemplateControllerName(k));
            var ov = PL.property("ADBE Layer Overrides");
            out.writeln("outer overrides " + (ov ? ov.numProperties : "none"));
            if (ov) for (k = 1; k <= ov.numProperties; k++) { var p = ov.property(k), v = ""; try { v = p.value; } catch (e) { v = "?"; } out.writeln("  " + p.name + " = " + v); }
            // drive the outer overrides and check the inner result at the hold
            var T = UK_find(ic);
            out.writeln("text layer: " + (T ? T.name : "none"));
        }
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    function UK_find(ic) { for (var j = 1; j <= ic.numLayers; j++) if (ic.layer(j) instanceof TextLayer) return ic.layer(j); return null; }
    out.close();
})();

// Read-only: inspects the Lights layer of the Aurora Large test card (CD_cd16).
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/t_dbg.txt"); out.encoding = "UTF-8"; out.open("w");
    try {
        for (var i = 1; i <= app.project.numItems; i++) {
            var c = app.project.item(i);
            if (!(c instanceof CompItem) || c.name !== "CD_cd16") continue;
            var ic = c.layer(1).source;
            for (var j = 1; j <= ic.numLayers; j++) {
                var L = ic.layer(j);
                out.writeln(j + " " + L.name + " enabled " + L.enabled + " matte " + (L.hasTrackMatte ? L.trackMatteType : "-") + " mode " + L.blendingMode);
                if (L.name !== "Lights") continue;
                var R = L.property("ADBE Root Vectors Group");
                for (var k = 1; k <= R.numProperties; k++) {
                    var g = R.property(k), tr = g.property("ADBE Vector Transform Group"), V = g.property("ADBE Vectors Group");
                    var s = "";
                    for (var m = 1; m <= V.numProperties; m++) { var q = V.property(m); s += " [" + q.matchName; try { if (q.matchName === "ADBE Vector Shape - Ellipse") s += " size " + q.property("ADBE Vector Ellipse Size").value; if (q.matchName === "ADBE Vector Graphic - Fill") s += " col " + q.property("ADBE Vector Fill Color").value + " op " + q.property("ADBE Vector Fill Opacity").value; } catch (e0) { } s += "]"; }
                    var pv = "?"; try { pv = tr.property("ADBE Vector Position").valueAtTime(2, false); } catch (e1) { pv = "ERR " + e1; }
                    out.writeln("   " + g.name + " pos@2 " + pv + " op " + tr.property("ADBE Vector Group Opacity").valueAtTime(2, false) + " err '" + tr.property("ADBE Vector Position").expressionError + "'" + s);
                }
                var fx = L.property("ADBE Effect Parade");
                for (var e = 1; e <= fx.numProperties; e++) out.writeln("   fx " + fx.property(e).name);
            }
        }
    } catch (x) { out.writeln("ERR " + x.toString() + " line " + x.line); }
    out.close();
})();

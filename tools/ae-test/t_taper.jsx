// Checks the shape stroke Taper value ranges on a temp comp, then removes it.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var out = new File(OUT + "t_taper_out.txt"); out.open("w");
    var c = null;
    try {
        c = app.project.items.addComp("TAPER_tmp", 200, 200, 1, 1, 30);
        var L = c.layers.addShape();
        var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
        var s = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
        var T = s.property("ADBE Vector Stroke Taper");
        var tries = [["ADBE Vector Taper Length Units", 2], ["ADBE Vector Taper Start Length", 50], ["ADBE Vector Taper End Length", 0.5], ["ADBE Vector Taper Start Width", 40], ["ADBE Vector Taper Start Ease", 60], ["ADBE Vector Taper StartWidthPx", 30]];
        for (var i = 0; i < tries.length; i++) {
            var p = T.property(tries[i][0]), m = "";
            try { p.setValue(tries[i][1]); m = "set ok -> " + p.value; } catch (e) { m = "ERR " + e.toString(); }
            try { m += " | min " + p.minValue + " max " + p.maxValue; } catch (e3) { }
            out.writeln(tries[i][0] + " = " + tries[i][1] + " : " + m);
        }
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { if (c) c.remove(); } catch (e2) { }
    out.close();
})();

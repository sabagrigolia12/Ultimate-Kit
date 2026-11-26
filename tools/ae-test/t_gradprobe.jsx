// Probe: can a shape Gradient Fill's colours be set (setValue / expression) in this AE? Temp comp WR_grad.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var o = new File(OUT + "gradprobe.txt"); o.open("w");
    var before = {}, q; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var c = app.project.items.addComp("WR_grad", 200, 200, 1, 1, 30), L = c.layers.addShape();
        var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Graphic - G-Fill");
        var s = "props:";
        for (var i = 1; i <= g.numProperties; i++) { var p = g.property(i); s += " [" + p.matchName + " '" + p.name + "' type " + p.propertyValueType + " expr " + (p.canSetExpression ? 1 : 0) + "]"; }
        o.writeln(s);
        var gc = g.property("ADBE Vector Grad Colors");
        try { o.writeln("value: " + gc.value); } catch (e1) { o.writeln("value ERR " + e1); }
        try { gc.expression = "value"; o.writeln("expression set ok, err '" + gc.expressionError + "'"); } catch (e2) { o.writeln("expression ERR " + e2); }
    } catch (e0) { o.writeln("ERR " + e0); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    o.close();
})();

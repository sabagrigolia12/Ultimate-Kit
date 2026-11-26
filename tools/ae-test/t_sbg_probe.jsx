// READ ONLY: expression errors in the Gradient comps, plus one test frame of Gradient 1 -> out/sbg/probe.txt, out/sbg/probe.png
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/sbg/probe.txt"); o.encoding = "UTF-8"; o.open("w");
    var P = app.project, i, c, g = null;
    var walk = function (p, path) {
        for (var j = 1; j <= p.numProperties; j++) {
            var x = p.property(j);
            if (x.propertyType === PropertyType.PROPERTY) { try { if (x.canSetExpression && x.expression !== "") o.writeln(path + "/" + x.name + " enabled=" + x.expressionEnabled + " err='" + x.expressionError + "'"); } catch (e1) { } }
            else walk(x, path + "/" + x.name);
        }
    };
    for (i = 1; i <= P.numItems; i++) {
        c = P.item(i);
        if (!(c instanceof CompItem)) continue;
        if (c.name === "Gradient 1") g = c;
        for (var k = 1; k <= c.numLayers; k++) walk(c.layer(k), c.name + "/" + c.layer(k).name);
    }
    var t0 = new Date().getTime();
    g.saveFrameToPng(1, new File("D:/Projects/Codex/tools/ae-test/out/sbg/probe.png"));
    o.writeln("saveFrameToPng call ms " + (new Date().getTime() - t0));
    o.close();
})();

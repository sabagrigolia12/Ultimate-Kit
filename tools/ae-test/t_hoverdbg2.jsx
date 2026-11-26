(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/hover2/dbg2.txt"); out.open("w");
    var G = null; for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name.indexOf("Hover Group") === 0) G = app.project.item(i);
    var L = G.layer("Rect Stroke"), V = L.property("ADBE Root Vectors Group").property("Rectangle 1").property("ADBE Vectors Group"), t = 1.2;
    var p = V.property("UK Hover Stroke").property("ADBE Vector Stroke Width"), orig = p.expression;
    var tests = ['effect("UK Hover")(1)', 'thisComp.layer("HOVER CONTROLS").effect("Hover Stroke")(1)', 'thisComp.layer("HOVER CONTROLS").effect("Stroke Width")(1)', 'transform.scale[0]', 'thisLayer.transform.scale[0]'];
    for (var k = 0; k < tests.length; k++) { p.expression = tests[k]; var v; try { v = p.valueAtTime(t, false); } catch (e) { v = "ERR " + e; } out.writeln(tests[k] + " -> " + v + " err '" + p.expressionError + "'"); }
    p.expression = orig;
    out.close();
})();

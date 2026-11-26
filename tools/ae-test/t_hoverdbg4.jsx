(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/hover2/dbg4.txt"); out.open("w");
    var G = null; for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name.indexOf("Hover Group") === 0) G = app.project.item(i);
    var L = G.layer("Rect Stroke"), V = L.property("ADBE Root Vectors Group").property("Rectangle 1").property("ADBE Vectors Group"), t = 1.2;
    var p = V.property("UK Hover Fill").property("ADBE Vector Fill Opacity"), orig = p.expression;
    var C = 'var C = thisComp.layer("HOVER CONTROLS");\n';
    var tests = [C + 'C.effect("Use Gradient")(1) == 1 ? 77 : 33', C + 'C.effect("Use Gradient")(1).value', C + 'C.effect("Hover Fill")(1).value', C + 'C.effect("Fill Opacity")(1).value', C + 'effect("UK Hover")(1) / 100 * C.effect("Hover Fill")(1) * C.effect("Fill Opacity")(1) / 100 * 50', 'effect("UK Hover")(1) > 0.01 ? 100 : 0', 'effect("UK Hover")(1).value > 0.01 ? 100 : 0', C + 'var k = 0.5;\nif (C.effect("Use Gradient")(1) == 1) k = 0;\nclamp(k, 0, 1) * 100;'];
    for (var k = 0; k < tests.length; k++) { p.expression = tests[k]; var v; try { v = p.valueAtTime(t, false); } catch (e) { v = "ERR " + e; } out.writeln(tests[k].replace(/\n/g, " | ") + " -> " + v + " err '" + p.expressionError + "'"); }
    p.expression = orig;
    out.close();
})();

(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/hover2/dbg3.txt"); out.open("w");
    var G = null; for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name.indexOf("Hover Group") === 0) G = app.project.item(i);
    var L = G.layer("Rect Stroke"), V = L.property("ADBE Root Vectors Group").property("Rectangle 1").property("ADBE Vectors Group"), t = 1.2;
    var props = [["sw", V.property("UK Hover Stroke").property("ADBE Vector Stroke Width")], ["so", V.property("UK Hover Stroke").property("ADBE Vector Stroke Opacity")], ["fo", V.property("UK Hover Fill").property("ADBE Vector Fill Opacity")]];
    for (var k = 0; k < props.length; k++) { var p = props[k][1], v; try { v = p.valueAtTime(t, false); } catch (e) { v = "ERR " + e; } out.writeln(props[k][0] + " -> " + v + " err '" + p.expressionError + "' expr: " + p.expression.replace(/\n/g, " | ")); }
    out.close();
})();


(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/hover2/dbg.txt"); out.open("w");
    var G = null; for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name.indexOf("Hover Group") === 0) G = app.project.item(i);
    var L = G.layer("Rect Stroke"), V = L.property("ADBE Root Vectors Group").property("Rectangle 1").property("ADBE Vectors Group"), t = 1.2;
    out.writeln("hover " + L.property("ADBE Effect Parade").property("UK Hover").property(1).valueAtTime(t, false));
    var s = V.property("UK Hover Stroke"), f = V.property("UK Hover Fill");
    out.writeln("stroke w " + s.property("ADBE Vector Stroke Width").valueAtTime(t, false) + " op " + s.property("ADBE Vector Stroke Opacity").valueAtTime(t, false) + " col " + s.property("ADBE Vector Stroke Color").valueAtTime(t, false) + " enabled " + s.enabled);
    out.writeln("fill op " + f.property("ADBE Vector Fill Opacity").valueAtTime(t, false) + " col " + f.property("ADBE Vector Fill Color").valueAtTime(t, false) + " enabled " + f.enabled);
    var N = G.layer("HOVER CONTROLS").property("ADBE Effect Parade"), s2 = "";
    for (i = 1; i <= N.numProperties; i++) s2 += N.property(i).name + "=" + N.property(i).property(1).value + "; ";
    out.writeln(s2);
    out.close();
})();

// Read only: the CLICK CONTROLS scale expression of every Cursor precomp.
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/cursor2/dbg.txt"); out.open("w");
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (!(it instanceof CompItem) || it.name.indexOf("Cursor") !== 0) continue;
        var sc = it.layer("CLICK CONTROLS").property("ADBE Transform Group").property("ADBE Scale");
        var v = "?"; try { v = String(sc.valueAtTime(0.3, false)); } catch (e1) { v = "throws"; } var N = it.layer("CLICK CONTROLS"), cs = N.property("ADBE Effect Parade").property("Click Size").property(1); var cv = "?"; try { cv = cs.value; } catch (e2) { cv = "throws"; } out.writeln(it.name + " err '" + sc.expressionError + "' value " + v + " clickSize " + cv + " parentOf: " + (function () { var r = []; for (var j = 1; j <= it.numLayers; j++) if (it.layer(j).parent === N) r.push(it.layer(j).name); return r.join(","); })());
    }
    out.close();
})();

// READ ONLY: the open project's items, the active comp, and for every comp its layers with their effects
// (name + matchName) to out/projfx.txt. Changes nothing.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/projfx.txt"); o.encoding = "UTF-8"; o.open("w");
    o.writeln("project: " + (app.project.file ? app.project.file.fsName : "(unsaved)") + " dirty " + app.project.dirty + " bpc " + app.project.bitsPerChannel + " items " + app.project.numItems);
    var a = app.project.activeItem; o.writeln("active: " + (a ? a.name + " (" + a.typeName + ")" : "none"));
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        o.writeln("item " + i + " '" + it.name + "' " + it.typeName + (it instanceof CompItem ? " " + it.width + "x" + it.height + " dur " + it.duration : ""));
        if (!(it instanceof CompItem)) continue;
        for (var j = 1; j <= it.numLayers; j++) {
            var L = it.layer(j), fx = L.property("ADBE Effect Parade"), s = [];
            if (fx) for (var k = 1; k <= fx.numProperties; k++) s.push(fx.property(k).name + " [" + fx.property(k).matchName + "]" + (fx.property(k).enabled ? "" : " OFF"));
            var t = L instanceof ShapeLayer ? "Shape" : L instanceof TextLayer ? "Text" : L.nullLayer ? "Null" : L.adjustmentLayer ? "Adj" : "AV";
            o.writeln("   L" + j + " '" + L.name + "' " + t + (L.adjustmentLayer ? " (adjustment)" : "") + " blend " + L.blendingMode + " fx: " + s.join(", "));
        }
    }
    o.close();
})();

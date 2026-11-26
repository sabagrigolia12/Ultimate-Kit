// Dumps parameter matchNames / names / values of a few effects (adds a temp comp, removes it).
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/fxdump.txt"); out.encoding = "UTF-8"; out.open("w");
    var c = app.project.items.addComp("SB_FXDUMP", 640, 360, 1, 2, 30);
    var L = c.layers.addSolid([0, 0, 0], "x", 640, 360, 1);
    var list = ["ADBE 4ColorGradient", "CC Radial Fast Blur", "ADBE Polar Coordinates", "ADBE Radial Blur", "ADBE Venetian Blinds", "CC Light Rays"];
    for (var i = 0; i < list.length; i++) {
        try {
            var e = L.property("ADBE Effect Parade").addProperty(list[i]);
            out.writeln("== " + list[i] + " (" + e.name + ")");
            for (var k = 1; k <= e.numProperties; k++) {
                var p = e.property(k), v = "";
                try { v = (p.propertyValueType === PropertyValueType.NO_VALUE) ? "" : String(p.value); } catch (x) { v = "?"; }
                out.writeln("  " + k + " " + p.matchName + " | " + p.name + " = " + v);
            }
        } catch (err) { out.writeln("!! " + list[i] + " " + err.toString()); }
    }
    out.close();
    c.remove();
    // remove the solid created
    for (var j = app.project.numItems; j >= 1; j--) { var it = app.project.item(j); if (it instanceof FootageItem && it.name === "x" && it.usedIn.length === 0) it.remove(); }
})();

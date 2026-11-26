// Dumps (recursively) the parameters of a few effects on a temp solid; removes exactly the items it made.
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/fxdump4.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = 1;
    var c = app.project.items.addComp("UKDUMP_tmp", 640, 360, 1, 2, 30);
    var L = c.layers.addSolid([0, 0, 0], "UKDUMP_solid", 640, 360, 1);
    var list = ["ADBE CHANNEL MIXER"];
    function walk(g, ind) {
        for (var k = 1; k <= g.numProperties; k++) {
            var p = g.property(k), v = "";
            if (p.propertyType !== PropertyType.PROPERTY) { out.writeln(ind + k + " [" + p.matchName + "] " + p.name); walk(p, ind + "   "); continue; }
            try { v = (p.propertyValueType === PropertyValueType.NO_VALUE) ? "" : String(p.value); } catch (x) { v = "?"; }
            out.writeln(ind + k + " " + p.matchName + " | " + p.name + " = " + v);
        }
    }
    for (var i = 0; i < list.length; i++) {
        try { var e = L.property("ADBE Effect Parade").addProperty(list[i]); out.writeln("== " + list[i] + " (" + e.name + ")"); walk(e, "  "); }
        catch (err) { out.writeln("!! " + list[i] + " " + err.toString()); }
    }
    out.close();
    for (q = app.project.numItems; q >= 1; q--) { var it = app.project.item(q); if (!before[it.id]) try { it.remove(); } catch (e2) { } }
})();


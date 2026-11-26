// Wave World's parameters (index, name, matchName, value) on a solid in a temporary test comp WR_ww (logged for
// cleanup) to out/wwnames.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", before = {}, q;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var o = new File(OUT + "wwnames.txt"); o.encoding = "UTF-8"; o.open("w"); o.writeln("start " + app.version); o.close(); o.open("a");
    try {
        var c = app.project.items.addComp("WR_ww", 800, 500, 1, 2, 30), L = c.layers.addSolid([1, 1, 1], "WR_s", 800, 500, 1);
        o.writeln("comp ok, can add: " + L.property("ADBE Effect Parade").canAddProperty("APC Wave World")); o.close(); o.open("a");
        var e = L.property("ADBE Effect Parade").addProperty("APC Wave World");
        o.writeln("added " + e.name); o.close(); o.open("a");
        var walk = function (p, ind) { for (var i = 1; i <= p.numProperties; i++) { var y = p.property(i), v = ""; try { if (y.propertyType === PropertyType.PROPERTY && y.propertyValueType !== PropertyValueType.NO_VALUE) v = " = " + y.value; } catch (e2) { } o.writeln(ind + i + " " + y.name + " [" + y.matchName + "]" + v); if (y.propertyType !== PropertyType.PROPERTY) walk(y, ind + "  "); } };
        walk(e, "");
    } catch (e0) { try { o.writeln("ERR " + e0.toString() + " line " + e0.line); } catch (e1) { } }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    o.close();
})();

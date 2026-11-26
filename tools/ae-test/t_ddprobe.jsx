(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/slot/probe.txt"); o.open("w");
    for (var q = app.project.numItems; q >= 1; q--) if (app.project.item(q).name === "WR_probe" && app.project.item(q) instanceof CompItem) app.project.item(q).remove();
    var c = app.project.items.addComp("WR_probe", 100, 100, 1, 1, 30);
    try {
        var N = c.layers.addNull();
        var e = N.property("ADBE Effect Parade").addProperty("ADBE Dropdown Control"); e.name = "Icon";
        o.writeln("before: " + e.name + " p1=" + e.property(1).name);
        var r = null; try { r = N.property("ADBE Effect Parade").property(1).property(1).setPropertyParameters(["A", "B", "C"]); } catch (y) { o.writeln("SPP: " + y.toString()); }
        try { o.writeln("ret: " + (r ? r.name + "/" + r.matchName : "null")); } catch (z) { o.writeln("ret err " + z.toString()); }
        var fp = N.property("ADBE Effect Parade");
        for (var i = 1; i <= fp.numProperties; i++) { var s2 = i + ""; try { s2 += " " + fp.property(i).name; } catch (a1) { s2 += " name-err"; } try { s2 += " " + fp.property(i).matchName; } catch (a2) { s2 += " mn-err"; } try { fp.property(i).name = "Icon"; s2 += " renamed " + fp.property(i).name; } catch (a3) { s2 += " rename-err " + a3.toString(); } try { fp.property(i).property(1).setValue(2); s2 += " set ok " + fp.property(i).property(1).value; } catch (a4) { s2 += " set-err " + a4.toString(); } o.writeln(s2); }
    } catch (x) { o.writeln("ERR " + x.toString()); }
    c.remove(); o.close();
})();



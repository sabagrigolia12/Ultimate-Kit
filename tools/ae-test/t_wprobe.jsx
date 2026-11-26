// Lists the effects the Wipe Reveal needs (match names, property trees), in a temp comp it removes again.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var o = new File(OUT + "wprobe.txt"); o.encoding = "UTF-8"; o.open("w");
    var i, e = app.effects, before = {}, nBefore = app.project.numItems;
    for (i = 1; i <= nBefore; i++) before[app.project.item(i).id] = true;
    for (i = 0; i < e.length; i++) if (/glow|ball|turbulent|mosaic|ramp/i.test(e[i].displayName)) o.writeln("FX " + e[i].displayName + " | " + e[i].matchName + " | " + e[i].category);
    var c = app.project.items.addComp("UKDUMP_wipe", 1920, 1080, 1, 2, 30);
    var L = c.layers.addSolid([1, 1, 1], "probe", 1920, 1080, 1);
    var dump = function (p, ind) {
        for (var k = 1; k <= p.numProperties; k++) {
            var q = p.property(k), v = "";
            try { if (q.propertyType === PropertyType.PROPERTY && q.propertyValueType !== PropertyValueType.NO_VALUE && q.propertyValueType !== PropertyValueType.CUSTOM_VALUE) v = " = " + q.value.toString(); } catch (x) { v = " (?)"; }
            o.writeln(ind + k + " " + q.name + " | " + q.matchName + v);
            if (q.propertyType !== PropertyType.PROPERTY) dump(q, ind + "  ");
        }
    };
    var names = ["CC Glass", "ADBE Bulge", "ADBE Displacement Map"];
    for (i = 0; i < names.length; i++) {
        try { var fx = L.property("ADBE Effect Parade").addProperty(names[i]); o.writeln("== " + fx.name + " (" + names[i] + ")"); dump(fx, "  "); }
        catch (x2) { o.writeln("!! " + names[i] + " " + x2.toString()); }
    }
    var sol = L.source; c.remove(); try { if (sol.usedIn.length === 0) sol.remove(); } catch (x3) { }
    for (i = app.project.numItems; i >= 1; i--) { var it = app.project.item(i); if (!before[it.id] && it instanceof FolderItem && it.numItems === 0) it.remove(); }
    o.writeln("items " + app.project.numItems + " (before " + nBefore + ")");
    o.close();
})();

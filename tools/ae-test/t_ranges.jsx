// Prints the scripting ranges (hasMin / minValue / maxValue) of the params Glass and Carousel set, from a temp comp
// that it removes again (logged as well).
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/ranges.txt"); o.open("w");
    var before = {}, i; for (i = 1; i <= app.project.numItems; i++) before[app.project.item(i).id] = true;
    var c = app.project.items.addComp("UKDUMP_ranges", 400, 400, 1, 1, 30), L = c.layers.addShape();
    var fx = ["CC Glass", "CC Vector Blur", "CC Light Sweep", "ADBE Box Blur2", "ADBE Glo2", "ADBE Drop Shadow", "ADBE Linear Wipe", "ADBE Easy Levels2"];
    for (var f = 0; f < fx.length; f++) {
        var e = L.property("ADBE Effect Parade").addProperty(fx[f]);
        for (var j = 1; j <= e.numProperties; j++) {
            var p = e.property(j);
            try { if (p.propertyType === PropertyType.PROPERTY && p.hasMin) o.writeln(fx[f] + " / " + p.name + " [" + p.matchName + "] " + p.minValue + " .. " + p.maxValue); } catch (x) { }
        }
    }
    var sol = []; c.remove();
    for (i = app.project.numItems; i >= 1; i--) { var it = app.project.item(i); if (!before[it.id] && it instanceof FolderItem && it.numItems === 0) it.remove(); }
    o.close();
})();

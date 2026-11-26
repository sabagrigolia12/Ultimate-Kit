// Read-only effect facts for the new Pixel Wipe: adds a temporary comp WR_pxprops with a solid, lists the parameters of
// the effects it needs, removes the comp again. Writes out/px_props.txt
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", s = [], c = app.project.items.addComp("WR_pxprops", 200, 200, 1, 1, 30), solidsBefore = {}, i;
    for (i = 1; i <= app.project.numItems; i++) solidsBefore[app.project.item(i).id] = true;
    var L = c.layers.addSolid([1, 1, 1], "WR_px", 200, 200, 1);
    var list = ["PEDG2"];
    var walk = function (g, ind) {
        for (var k = 1; k <= g.numProperties; k++) {
            var p = g.property(k), v = "";
            if (p.propertyType === PropertyType.PROPERTY) {
                try { v = " = " + p.value + (p.hasMin ? " [" + p.minValue + ".." + p.maxValue + "]" : ""); } catch (e) { v = " (no value)"; }
                s.push(ind + p.matchName + " | " + p.name + v);
            } else { s.push(ind + p.matchName + " | " + p.name + " {"); walk(p, ind + "  "); s.push(ind + "}"); }
        }
    };
    for (i = 0; i < list.length; i++) {
        s.push("=== " + list[i]);
        try { var e = L.property("ADBE Effect Parade").addProperty(list[i]); walk(e, "  "); e.remove(); }
        catch (x) { s.push("  NOT AVAILABLE: " + x.message); }
    }
    var src = L.source;
    c.remove();
    try { if (src && src.usedIn.length === 0) src.remove(); } catch (e2) { }
    var f = new File(OUT + "px_props.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(s.join("\r")); f.close();
    $.global.PX_PROPS = "ok " + s.length;
})();

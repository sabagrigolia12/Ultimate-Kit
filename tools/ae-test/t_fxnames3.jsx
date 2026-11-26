// Read only on a temp comp: matchNames / parameter names of CC Toner, Set Matte, Solid Composite (logged to out/fxnames.txt).
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var o = new File(OUT + "fxnames.txt"); o.open("w");
    var before = {}, q; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var c = app.project.items.addComp("WR_fx", 100, 100, 1, 1, 30), L = c.layers.addShape();
        var list = ["ADBE BEZMESH", "ADBE Bezier Warp"];
        for (var i = 0; i < list.length; i++) {
            try {
                var e = L.property("ADBE Effect Parade").addProperty(list[i]), s = list[i] + " = '" + e.name + "':";
                for (var j = 1; j <= e.numProperties; j++) s += " [" + e.property(j).matchName + " " + e.property(j).name + "]";
                o.writeln(s);
            } catch (e1) { o.writeln(list[i] + " ERR " + e1); }
        }
    } catch (e0) { o.writeln("ERR " + e0); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    o.close();
})();


// Checks assets/drop/ukdrop.ffx: applyPreset on a text layer in a new comp WR_marker (no viewer), logs the effects it added.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var out = new File(OUT + "marker.txt"); out.open("w");
    var before = {}, q; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var c = app.project.items.addComp("WR_marker", 1920, 1080, 1, 5, 30);
        var L = c.layers.addText("Marker"); L.selected = true;
        L.applyPreset(new File("D:/Projects/Codex/UltimateKit/assets/drop/ukdrop.ffx"));
        var E = L.property("ADBE Effect Parade"), s = "effects:";
        for (var i = 1; i <= E.numProperties; i++) s += " " + E.property(i).name + " (" + E.property(i).matchName + ")";
        out.writeln(s + " layers " + c.numLayers);
    } catch (e) { out.writeln("ERR " + e + " " + e.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
})();

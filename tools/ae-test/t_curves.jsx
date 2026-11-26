// Measures the user's Curves (not readable by script) without touching their comp: duplicates 'box animation 2'
// (a copy that this script removes again), and in the copy's 'glass storke' layer turns every effect off except
// Curves, puts a black->white Gradient Ramp before it and a solid-white source, then renders frame 0 to
// out/curves.png. Logs the copy's id to sb_created.txt in case the removal fails.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", c = null, i;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === "box animation 2") c = app.project.item(i);
    var log = new File(OUT + "curves_log.txt"); log.open("w");
    if (!c) { log.write("not found"); log.close(); return; }
    var C = c.duplicate();
    C.name = "UKDUMP_curves";
    var cf = new File(OUT + "sb_created.txt"); cf.open("a"); cf.writeln(C.id + "|" + C.name); cf.close();
    try {
        for (i = 1; i <= C.numLayers; i++) if (C.layer(i).name !== "glass storke") C.layer(i).enabled = false;
        var L = C.layer("glass storke");
        L.blendingMode = BlendingMode.NORMAL;
        var fx = L.property("ADBE Effect Parade"), names = [];
        for (i = 1; i <= fx.numProperties; i++) { names.push(fx.property(i).name); if (fx.property(i).matchName !== "ADBE CurvesCustom") fx.property(i).enabled = false; }
        // a full-frame white rectangle as the source, then the ramp before Curves
        var root = L.property("ADBE Root Vectors Group");
        var g = root.addProperty("ADBE Vector Group"); g.name = "probe";
        var v = root.property("probe").property("ADBE Vectors Group");
        v.addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([4000, 4000]);
        v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);
        var r = fx.addProperty("ADBE Ramp");
        r.property("ADBE Ramp-0001").setValue([0, 540]); r.property("ADBE Ramp-0002").setValue([0, 0, 0, 1]);
        r.property("ADBE Ramp-0003").setValue([1920, 540]); r.property("ADBE Ramp-0004").setValue([1, 1, 1, 1]);
        r.moveTo(1);
        C.saveFrameToPng(0, new File(OUT + "curves.png"));
        log.writeln("effects: " + names.join(", ") + " | layer size " + L.width + "x" + L.height);
    } catch (e) { log.writeln("ERR " + e.toString() + " line " + e.line); }
    log.close();
})();

// Edge-lens test: a grid background and a rounded-rect ADJUSTMENT shape with CC Glass (bump = itself), one comp per
// variant (Property / Softness / Displacement), frame 0 -> out/lens/*.png. Records created items.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", d = new Folder(OUT + "lens"); if (!d.exists) d.create();
    var before = {}, i; for (i = 1; i <= app.project.numItems; i++) before[app.project.item(i).id] = true;
    var V = [[4, 20, 100], [6, 20, 100], [4, 40, 200], [4, 60, 400]];
    for (i = 0; i < V.length; i++) {
        var c = app.project.items.addComp("UKDUMP_lens" + i, 1280, 720, 1, 1, 30);
        var bg = c.layers.addSolid([0.1, 0.1, 0.15], "bg", 1280, 720, 1);
        var gx = bg.property("ADBE Effect Parade").addProperty("ADBE Grid");
        gx.property("ADBE Grid-0002").setValue(2); gx.property("ADBE Grid-0004").setValue(40); gx.property("ADBE Grid-0006").setValue(3);
        var L = c.layers.addShape();
        var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var r = g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
        r.property("ADBE Vector Rect Size").setValue([800, 260]); r.property("ADBE Vector Rect Roundness").setValue(60);
        L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
        var M = L.duplicate(); M.name = "map"; M.enabled = false; M.moveAfter(L);
        L.adjustmentLayer = true;
        var e = L.property("ADBE Effect Parade").addProperty("CC Glass");
        e.property("CC Glass-0002").setValue(c.layer("map").index);
        e.property("CC Glass-0003").setValue(V[i][0]);
        e.property("CC Glass-0004").setValue(V[i][1]);
        e.property("CC Glass-0006").setValue(V[i][2]);
        e.property("CC Glass-0009").setValue(0);       // no light
        e.property("CC Glass-0017").setValue(100); e.property("CC Glass-0018").setValue(0); e.property("CC Glass-0019").setValue(0);
        c.saveFrameToPng(0, new File(OUT + "lens/v" + i + ".png"));
    }
    var cf = new File(OUT + "sb_created.txt"); cf.open("a");
    for (i = 1; i <= app.project.numItems; i++) if (!before[app.project.item(i).id]) cf.writeln(app.project.item(i).id + "|" + app.project.item(i).name);
    cf.close();
})();


// saveFrameToPng in this (32 bpc) project writes darker values: render a black-to-white ramp (256 x 16) to
// calibrate a viewing LUT. Records created items for t_cleanup_created.jsx.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", before = {}, i;
    for (i = 1; i <= app.project.numItems; i++) before[app.project.item(i).id] = true;
    var c = app.project.items.addComp("UKDUMP_lut", 256, 16, 1, 1, 30);
    var L = c.layers.addSolid([0, 0, 0], "ramp", 256, 16, 1);
    var e = L.property("ADBE Effect Parade").addProperty("ADBE Ramp");
    e.property("ADBE Ramp-0001").setValue([0, 8]); e.property("ADBE Ramp-0002").setValue([0, 0, 0, 1]);
    e.property("ADBE Ramp-0003").setValue([255, 8]); e.property("ADBE Ramp-0004").setValue([1, 1, 1, 1]);
    c.saveFrameToPng(0, new File(OUT + "lut.png"));
    var cf = new File(OUT + "sb_created.txt"); cf.open("a");
    for (i = 1; i <= app.project.numItems; i++) if (!before[app.project.item(i).id]) cf.writeln(app.project.item(i).id + "|" + app.project.item(i).name);
    cf.close();
})();

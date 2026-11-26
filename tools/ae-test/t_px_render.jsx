// Pixel Wipe test, step 2: frames of the test comp as out/px/<tag>_<t * 100>.png (saveFrameToPng runs on after the
// script: poll the folder). $.global.PX_RENDER = { comp, tag, times }. Reads only the test comp.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/px/", o = $.global.PX_RENDER || {}, name = o.comp || "WR_px", c = null, i;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === name) c = app.project.item(i);
    if (!c) { $.global.PX_RENDER_R = "no " + name; return; }
    var dir = new Folder(OUT); if (!dir.exists) dir.create();
    var times = o.times || [0.6, 0.8, 1.07, 1.3, 4.0, 4.4, 4.7, 4.9];
    for (i = 0; i < times.length; i++) c.saveFrameToPng(times[i], new File(OUT + (o.tag || "ae") + "_" + Math.round(times[i] * 100) + ".png"));
    $.global.PX_RENDER_R = "rendering " + times.length;
})();

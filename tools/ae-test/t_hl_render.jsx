// Highlighter test, step 2: frames of the test comp WR_hl (made by t_highlight.jsx) at a few times, as
// out/hl_ae_<t>.png (saveFrameToPng runs on after the script: poll the folder). Reads nothing else.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", c = null, i;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === "WR_hl") c = app.project.item(i);
    if (!c) { $.global.HL_RENDER = "no WR_hl"; return; }
    var times = [0.62, 0.8, 1.1, 2.5, 4.75, 4.9];
    for (i = 0; i < times.length; i++) c.saveFrameToPng(times[i], new File(OUT + "hl_ae_" + Math.round(times[i] * 100) + ".png"));
    $.global.HL_RENDER = "rendering " + times.length;
})();

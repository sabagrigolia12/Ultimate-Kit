// READ ONLY: renders the user's comp (name in $.global.LQ_COMP, time in $.global.LQ_T) to out/hlref/lq_<tag>.png. Changes nothing.
(function () {
    var C = null, i;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === $.global.LQ_COMP) C = app.project.item(i);
    if (!C) return;
    var t = Math.round($.global.LQ_T / C.frameDuration) * C.frameDuration;
    C.saveFrameToPng(t, new File("D:/Projects/Codex/tools/ae-test/out/hlref/lq_" + $.global.LQ_TAG + ".png"));
})();

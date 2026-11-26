// The second render of t_p2s_build.jsx: only the per-colour shape layers of WR_p2s.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", q, c = null, T = $.global.P2S_T;
    for (q = 1; q <= app.project.numItems; q++) if (app.project.item(q) instanceof CompItem && app.project.item(q).name === "WR_p2s") c = app.project.item(q);
    if (!c || !T) return;
    for (q = 0; q < T.one.length; q++) c.layer(T.one[q]).enabled = false;
    for (q = 0; q < T.per.length; q++) c.layer(T.per[q]).enabled = true;
    c.saveFrameToPng(0, new File(OUT + "hlref/p2s_ae_plain.png"));
})();

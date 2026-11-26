// Fill Trim: how long a frame of my comp WR_ft takes: one frame saved to out/hlref/ft_bench_<frame>.png (the caller times the file). The masks stay as built. Result in out/ft_bench.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", q, c = null, frame = $.global.FT_FRAME, log = [];
    try {
        for (q = 1; q <= app.project.numItems; q++) if (app.project.item(q) instanceof CompItem && app.project.item(q).name === ($.global.FT_COMP || "WR_ft")) c = app.project.item(q);
        log.push("frame " + frame);
        c.saveFrameToPng(frame * c.frameDuration, new File(OUT + "hlref/ft_bench_" + frame + ".png"));
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    var f = new File(OUT + "ft_bench.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\r\n")); f.close();
})();

// Fill Trim end to end, step 4: expression errors of every mask in my comp WR_ft, the values End takes, frames saved to out/hlref/ft_f_<frame>.png. Result in out/ft_render.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [], q, c = null, k;
    try {
        for (q = 1; q <= app.project.numItems; q++) if (app.project.item(q) instanceof CompItem && app.project.item(q).name === "WR_ft") c = app.project.item(q);
        if (!c) throw new Error("no WR_ft");
        var errs = 0, masks = 0, maxLen = 0;
        for (q = 1; q <= c.numLayers; q++) {
            var M = c.layer(q).property("ADBE Mask Parade"); if (!M) continue;
            for (k = 1; k <= M.numProperties; k++) { var P = M.property(k).property("ADBE Mask Shape"); masks++; maxLen = Math.max(maxLen, P.expression.length); if (P.expressionError) { errs++; log.push("error on " + c.layer(q).name + " " + M.property(k).name + ": " + P.expressionError); } }
        }
        log.push("masks " + masks + ", expression errors " + errs + ", longest expression " + maxLen);
        var N = c.layer("Fill Trim"), E = N.effect("End")(1);
        log.push("End keys " + E.numKeys + ": " + E.keyTime(1) + " .. " + E.keyTime(2) + ", values " + E.keyValue(1) + " .. " + E.keyValue(2) + ", selected control " + N.selected);
        var frames = [6, 12, 18, 24, 30, 45, 60];
        for (q = 0; q < frames.length; q++) { var t = frames[q] * c.frameDuration; log.push("frame " + frames[q] + " End " + Math.round(E.valueAtTime(t, false) * 10) / 10); c.saveFrameToPng(t, new File(OUT + "hlref/ft_f_" + frames[q] + ".png")); }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    var f = new File(OUT + "ft_render.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\r\n")); f.close();
})();

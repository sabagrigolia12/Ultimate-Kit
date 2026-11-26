// Fill Trim checks on my comp WR_ft (own layers only): the keys past the timeline, the Null, frames in states the Null can be in. $.global.FT_STEP picks the state; frames to out/hlref/ft_c_<name>.png. Result in out/ft_checks.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [], q, c = null, step = $.global.FT_STEP;
    try {
        for (q = 1; q <= app.project.numItems; q++) if (app.project.item(q) instanceof CompItem && app.project.item(q).name === "WR_ft") c = app.project.item(q);
        var N = null; for (q = 1; q <= c.numLayers; q++) if (c.layer(q).nullLayer) { if (N) log.push("MORE THAN ONE NULL: " + c.layer(q).name); N = c.layer(q); }
        var Sv = N.effect("Start")(1), E = N.effect("End")(1), fd = c.frameDuration, layers = [];
        for (q = 1; q <= c.numLayers; q++) if (c.layer(q).property("ADBE Mask Parade") && c.layer(q).property("ADBE Mask Parade").numProperties) layers.push(c.layer(q));
        var snap = function (name, frame) { c.saveFrameToPng(frame * fd, new File(OUT + "hlref/ft_c_" + name + ".png")); };
        if (step === "info") {
            var P = layers[0].property("ADBE Mask Parade").property(1).property("ADBE Mask Shape");
            log.push("control " + N.name + ", layers with masks " + layers.length + ", first mask keys " + P.numKeys + ", " + P.keyTime(1) + " .. " + P.keyTime(P.numKeys) + ", in type " + P.keyInInterpolationType(2) + " (linear " + KeyframeInterpolationType.LINEAR + "), comp " + c.duration + " s");
            log.push("expression:\n" + P.expression);
            var errs = 0; for (q = 0; q < layers.length; q++) { var M = layers[q].property("ADBE Mask Parade"); for (var k = 1; k <= M.numProperties; k++) if (M.property(k).property("ADBE Mask Shape").expressionError) errs++; } log.push("expression errors " + errs);
        }
        if (step === "range") { Sv.setValue(35); E.setValueAtTime(30 * fd, 80); snap("range", 30); log.push("Start 35, End at frame 30 = " + E.valueAtTime(30 * fd, false)); }
        if (step === "swap") { Sv.setValue(70); snap("swap", 45); log.push("Start 70, End at frame 45 = " + Math.round(E.valueAtTime(45 * fd, false))); }
        if (step === "reverse") { Sv.setValue(0); for (q = 0; q < layers.length; q++) layers[q].effect("Reverse")(1).setValue(1); snap("reverse", 30); log.push("all reversed, End at frame 30 = " + Math.round(E.valueAtTime(30 * fd, false))); }
        if (step === "moved") {
            for (q = 0; q < layers.length; q++) layers[q].effect("Reverse")(1).setValue(0);
            var L = layers[0], tr = L.property("ADBE Transform Group");
            tr.property("ADBE Scale").setValue([140, 140]); tr.property("ADBE Rotate Z").setValue(15); L.startTime = 0.5;
            log.push(L.name + " scaled 140, rotated 15, start 0.5 s; its key 1 at " + L.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape").keyTime(1));
            snap("moved", 30);
        }
        if (step === "end0") { snap("end0", 0); log.push("End at frame 0 = " + E.valueAtTime(0, false)); }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    var f = new File(OUT + "ft_checks.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\n")); f.close();
})();

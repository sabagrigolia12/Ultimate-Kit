// Focus Carousel (cr09) on my own comp WR_fc (1920 x 1080, 29.97, like the user's): 4 own solids as the selected photos, order 1..4 (and a second comp
// WR_fc2 with no photos, random). Checks against the user's own Pre-comp 1 / Comp 2 (read only): the Focus keys' times and eases, the Null's motion
// frame by frame as a share of each move (theirs vs mine), the card in the middle at each key, the Bezier Warp. Frames to out/hlref/fc_<frame>.png.
// Every new item is logged in sb_created.txt. Step by $.global.FC_STEP: "build" / "frames" / "log". Result in out/fc.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [], keep = UK.comp, q, k;
    var J = function (v) { try { return (v instanceof Array) ? v.join(",") : String(v); } catch (e) { return "?"; } };
    var find = function (n) { for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === n) return app.project.item(i); return null; };
    var r3 = function (v) { return Math.round(v * 1000) / 1000; };
    try {
        var step = $.global.FC_STEP;
        if (step === "build") {
            var before = {}; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true; $.global.FC_BEFORE = before;
            log.push("project " + (app.project.file ? decodeURI(app.project.file.name) : "(unsaved)") + " items " + app.project.numItems);
            var c = app.project.items.addComp("WR_fc", 1920, 1080, 1, 30.03003003003, 29.9700012207031);
            for (q = 4; q >= 1; q--) { var Sd = c.layers.addSolid([0.2 * q, 0.5, 1 - 0.2 * q], "WR_photo " + q, 800, 1000, 1); }
            for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = true;
            c.time = 0;
            UK.comp = function () { return c; };
            var r = UK.api.carousel({ id: "cr09", fc: { count: 0, random: false, seed: 1 } });
            log.push("built " + r.name + " with " + r.photos + " photos; layers in comp now " + c.numLayers);
            var c2 = app.project.items.addComp("WR_fc2", 1080, 1920, 1, 30, 30);
            UK.comp = function () { return c2; };
            var r2 = UK.api.carousel({ id: "cr09", fc: { count: 6, random: true, seed: 7 } });
            log.push("vertical, 6 cards, random: " + r2.name + " | " + c2.layer(1).comment);
        }
        if (step === "check") {
            var mine = find("Focus Carousel"), N = mine.layer("Carousel Null"), Fo = N.effect("Focus")(1), P = N.property("ADBE Transform Group").property("ADBE Position");
            var th = find("Pre-comp 1"), TN = th.layer("Null 1"), TP = TN.property("ADBE Transform Group").property("ADBE Position");
            log.push("expression error '" + P.expressionError + "'");
            for (k = 1; k <= Fo.numKeys; k++) log.push("Focus key " + k + " t " + r3(Fo.keyTime(k)) + " (theirs " + r3(TP.keyTime(k)) + ") v " + Fo.keyValue(k) + " in " + r3(Fo.keyInTemporalEase(k)[0].influence) + " / " + r3(TP.keyInTemporalEase(k)[0].influence) + " out " + r3(Fo.keyOutTemporalEase(k)[0].influence) + " / " + r3(TP.keyOutTemporalEase(k)[0].influence));
            /* each move as a share of its way, frame by frame: mine against theirs */
            var fr = mine.frameDuration, worst = 0, at = "";
            for (k = 1; k < Fo.numKeys; k++) {
                var a = Fo.keyTime(k), b = Fo.keyTime(k + 1), x0 = P.valueAtTime(a, false)[0], x1 = P.valueAtTime(b, false)[0], y0 = TP.valueAtTime(a, false)[0], y1 = TP.valueAtTime(b, false)[0];
                for (var t = a; t <= b + 1e-6; t += fr) {
                    var u1 = (P.valueAtTime(t, false)[0] - x0) / (x1 - x0), u2 = (TP.valueAtTime(t, false)[0] - y0) / (y1 - y0);
                    if (Math.abs(u1 - u2) > worst) { worst = Math.abs(u1 - u2); at = "move " + k + " t " + r3(t); }
                }
            }
            log.push("the moves as a share of their way, mine vs theirs, frame by frame: largest difference " + Math.round(worst * 100000) / 1000 + " % (" + at + ")");
            /* the card in the middle at each key (comp x of its centre) */
            for (k = 1; k <= Fo.numKeys; k++) {
                var tk = Fo.keyTime(k), f = Fo.keyValue(k), card = mine.layer("Card " + f), nx = P.valueAtTime(tk, false)[0], cx = nx + card.property("ADBE Transform Group").property("ADBE Position").value[0];
                log.push("key " + k + ": card " + f + " centre x " + r3(cx) + " y " + r3(P.valueAtTime(tk, false)[1] + card.property("ADBE Transform Group").property("ADBE Position").value[1]));
            }
            var cl = []; for (k = 1; k <= mine.numLayers; k++) { var Lk = mine.layer(k); cl.push(Lk.name + (Lk.parent ? " <" + Lk.parent.name + ">" : "") + " x " + r3(Lk.property("ADBE Transform Group").property("ADBE Position").value[0]) + " s " + r3(Lk.property("ADBE Transform Group").property("ADBE Scale").value[0])); }
            log.push("layers: " + cl.join(" | "));
            var BW = find("WR_fc").layer(1).property("ADBE Effect Parade").property(1), TW = find("Comp 2").layer("Pre-comp 1").property("ADBE Effect Parade").property(1), diff = 0;
            for (k = 1; k <= 13; k++) { var va = BW.property(k).value, vb = TW.property(k).value; if (J(va) !== J(vb)) { diff++; log.push("warp differs at " + BW.property(k).name + ": " + J(va) + " vs " + J(vb)); } }
            log.push("bezier warp: " + (13 - diff) + " of 13 values equal to theirs");
            var C1 = find("Card 1"); var nm = []; for (k = 1; k <= C1.numLayers; k++) nm.push(C1.layer(k).name + (C1.layer(k).enabled ? "" : " (off)") + (C1.layer(k).hasTrackMatte ? " [matte " + C1.layer(k).trackMatteLayer.name + "]" : "")); log.push("Card 1 comp: " + C1.width + "x" + C1.height + " | " + nm.join(" | "));
            var V = find("WR_fc2"), VC = V.layer(1).source, VN = VC.layer("Carousel Null"), VF = VN.effect("Focus")(1), vs = []; for (k = 1; k <= VF.numKeys; k++) vs.push(VF.keyValue(k)); log.push("vertical random order " + vs.join(",") + " card scale " + r3(VC.layer("Card 1").property("ADBE Transform Group").property("ADBE Scale").value[0]) + " expression error '" + VN.property("ADBE Transform Group").property("ADBE Position").expressionError + "'");
        }
        if (step === "frames") {
            var cc = find("WR_fc"), fs = [0, 30, 59, 90, 119, 150, 182];
            for (k = 0; k < fs.length; k++) cc.saveFrameToPng(fs[k] * cc.frameDuration, new File(OUT + "hlref/fc_" + fs[k] + ".png"));
            var cv = find("WR_fc2"); cv.saveFrameToPng(60 * cv.frameDuration, new File(OUT + "hlref/fc_v60.png"));
            log.push("frames queued");
        }
        if (step === "log") {
            var bf = $.global.FC_BEFORE, cfo = new File(OUT + "sb_created.txt"), m = 0; cfo.open("a");
            for (q = 1; q <= app.project.numItems; q++) if (!bf[app.project.item(q).id]) { cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name); m++; }
            cfo.close(); log.push("logged " + m + " new items");
        }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    finally { UK.comp = keep; }
    var o = new File(OUT + "fc.txt"); o.encoding = "UTF-8"; o.open("w"); o.write(log.join("\r\n")); o.close();
})();

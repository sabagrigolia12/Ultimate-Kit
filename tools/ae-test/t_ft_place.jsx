// Fill Trim, Start and End as the trim's place on the island, on my own comp WR_ftp2, step by step ($.global.FT_STEP): setup, keys (UK.api.ftKeys, each read back; frames), log.
// Every new item is logged for t_cleanup_created.jsx. Result in out/ft_place.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", WEB = "D:/Projects/Codex/tools/ae-test/web/", log = [], keep = UK.comp, q, step = $.global.FT_STEP, c = null;
    var find = function () { for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === "WR_ftp2") return app.project.item(i); return null; };
    var rd = function (v) { return Math.round(v * 1000) / 1000; };
    var keys = function (P) { if (!P.numKeys) return "no keys, value " + rd(P.value); var s = [], n; for (n = 1; n <= P.numKeys; n++) s.push(rd(P.keyTime(n)) + "=" + rd(P.keyValue(n)) + " (in " + Math.round(P.keyInTemporalEase(n)[0].influence) + ", out " + Math.round(P.keyOutTemporalEase(n)[0].influence) + ")"); return s.join("  "); };
    var shape = function () { for (var i = 1; i <= c.numLayers; i++) if (c.layer(i).name === "WR_img - Shapes") return c.layer(i); return null; };
    try {
        if (step === "setup") {
            var before = {}; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true; $.global.FT_BEFORE = before;
            log.push("project " + decodeURI(app.project.file ? app.project.file.name : "(unsaved)") + " items " + app.project.numItems + " dirty " + app.project.dirty);
            var src = null;
            for (q = 1; q <= app.project.numItems; q++) { var it = app.project.item(q); if (it instanceof FootageItem && it.mainSource instanceof FileSource && it.mainSource.file && /packshot 30 weli/.test(decodeURI(it.mainSource.file.name))) src = it; }
            c = app.project.items.addComp("WR_ftp2", src.width, src.height, 1, 8, 30);
            var L = c.layers.add(src); L.name = "WR_img";
            var jf = new File(OUT + "hlref/ft_fills.json"); jf.encoding = "UTF-8"; jf.open("r"); var cols = eval("(" + jf.read() + ")"); jf.close();
            var r = UK.api.p2sBuild({ comp: c.id, id: L.id, result: "one", colors: cols });
            c.time = 1;
            UK.comp = function () { return c; };
            var S = c.layer(r.layers[0]);
            for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
            S.selected = true;
            /* as a layer from the version with Opacity: this expression must go, the Null's Opacity too */
            var R = UK.api.ftRead();
            var o = new File(WEB + "ft_read3.json"); o.encoding = "UTF-8"; o.open("w"); o.write(UK.json(R)); o.close();
            log.push("comp " + c.id + " layer " + S.name + " time " + c.time);
        }
        if (step === "keys") {
            c = find();
            var N = c.layer("Fill Trim"), Sv = N.effect("Start")(1), E = N.effect("End")(1), M = shape().property("ADBE Mask Parade");
            log.push("Null in " + N.inPoint + " | Start " + keys(Sv) + " | End " + keys(E));
            var errs = 0; for (q = 1; q <= M.numProperties; q++) if (M.property(q).property("ADBE Mask Shape").expressionError) errs++; log.push("masks " + M.numProperties + " expression errors " + errs + ", first two: " + M.property(1).name + " / " + M.property(2).name);
            var call = function (set) { var a = UK.api.ftKeys({ comp: c.id, control: N.name, set: set }); log.push("set " + UK.json(set) + " -> start " + rd(a.start) + " end " + rd(a.end) + " dur " + rd(a.dur) + " ramp " + Math.round(a.rampOut) + "/" + Math.round(a.rampIn)); log.push("   Start " + keys(Sv)); log.push("   End " + keys(E)); };
            call({ start: 0, end: 0 });
            call({ start: 30, end: 30 });
            call({ end: 60 });
            call({ dur: 2 });
            call({ ramp: [20, 95] });
            call({ start: 50, end: 50 });
            call({ dur: 1.5, ramp: [66, 66] });
            UK.comp = function () { return c; };
            for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
            log.push("nothing selected: " + UK.json(UK.api.ftKeys({ comp: c.id, control: "", set: { end: 9 } })) + " | End " + keys(E));
        }
        if (step === "frames") {
            /* the state is given: place p1, p2; frames at 0 %, 25 %, 50 % of the 1.5 s from time 1 */
            c = find();
            var tag = $.global.FT_TAG, pl = $.global.FT_PL, rv = $.global.FT_REV, Nn = c.layer("Fill Trim");
            UK.api.ftKeys({ comp: c.id, control: Nn.name, set: { start: pl[0], end: pl[1] } });
            var FX = shape().property("ADBE Effect Parade"); for (q = 1; q <= FX.numProperties; q++) if (FX.property(q).matchName === "ADBE Checkbox Control") FX.property(q).property(1).setValue(rv ? 1 : 0);
            var fr = [30, 38, 45, 75], E2 = Nn.effect("End")(1), S2 = Nn.effect("Start")(1);
            for (q = 0; q < fr.length; q++) { var t = fr[q] * c.frameDuration; log.push(tag + " frame " + fr[q] + ": Start " + rd(S2.valueAtTime(t, false)) + " End " + rd(E2.valueAtTime(t, false))); c.saveFrameToPng(t, new File(OUT + "hlref/ftp_" + tag + "_" + fr[q] + ".png")); }
        }
        if (step === "log") {
            var bf = $.global.FT_BEFORE, cfo = new File(OUT + "sb_created.txt"), m = 0; cfo.open("a");
            for (q = 1; q <= app.project.numItems; q++) if (!bf[app.project.item(q).id]) { cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name); m++; }
            cfo.close(); log.push("logged " + m + " new items");
        }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    finally { UK.comp = keep; }
    var f = new File(OUT + "ft_place.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\r\n")); f.close();
})();

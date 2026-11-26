// Fill Trim, From the center and the speed ramp, on my own comp WR_ftc, step by step ($.global.FT_STEP). setup: the comp and its shape layer, read to web/ft_read3.json. keys: the End keys after Apply,
// then UK.api.ftRamp, read back, frames saved. reverse: all islands turned round, a frame. log: every new item goes to sb_created.txt for t_cleanup_created.jsx. Result in out/ft_center.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", WEB = "D:/Projects/Codex/tools/ae-test/web/", log = [], keep = UK.comp, q, step = $.global.FT_STEP, c = null;
    var find = function () { for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === "WR_ftc") return app.project.item(i); return null; };
    var ease = function (P, n) { return "key " + n + " at " + (Math.round(P.keyTime(n) * 1000) / 1000) + " value " + P.keyValue(n) + " in " + Math.round(P.keyInTemporalEase(n)[0].influence) + " out " + Math.round(P.keyOutTemporalEase(n)[0].influence); };
    try {
        if (step === "setup") {
            var before = {}; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true; $.global.FT_BEFORE = before;
            log.push("project " + decodeURI(app.project.file ? app.project.file.name : "(unsaved)") + " items " + app.project.numItems + " dirty " + app.project.dirty);
            var src = null;
            for (q = 1; q <= app.project.numItems; q++) { var it = app.project.item(q); if (it instanceof FootageItem && it.mainSource instanceof FileSource && it.mainSource.file && /packshot 30 weli/.test(decodeURI(it.mainSource.file.name))) src = it; }
            c = app.project.items.addComp("WR_ftc", src.width, src.height, 1, 4, 30);
            var L = c.layers.add(src); L.name = "WR_img";
            var jf = new File(OUT + "hlref/ft_fills.json"); jf.encoding = "UTF-8"; jf.open("r"); var cols = eval("(" + jf.read() + ")"); jf.close();
            var r = UK.api.p2sBuild({ comp: c.id, id: L.id, result: "one", colors: cols });
            UK.comp = function () { return c; };
            var S = c.layer(r.layers[0]);
            for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
            S.selected = true;
            var R = UK.api.ftRead();
            var o = new File(WEB + "ft_read3.json"); o.encoding = "UTF-8"; o.open("w"); o.write(UK.json(R)); o.close();
            log.push("comp " + c.id + " layer " + S.name);
        }
        if (step === "keys") {
            c = find();
            var N = c.layer("Fill Trim"), E = N.effect("End")(1);
            log.push("after Apply: " + ease(E, 1) + " | " + ease(E, 2));
            var mid = []; for (q = 0; q <= 6; q++) mid.push(Math.round(E.valueAtTime(q * 10 * c.frameDuration, false)));
            log.push("End at frames 0,10..60: " + mid.join(", "));
            var r2 = UK.api.ftRamp({ comp: c.id, control: N.name, ramp: [20, 95], dur: 1.5 });
            log.push("ftRamp: " + UK.json(r2) + " -> " + ease(E, 1) + " | " + ease(E, 2));
            mid = []; for (q = 0; q <= 5; q++) mid.push(Math.round(E.valueAtTime(q * 9 * c.frameDuration, false)));
            log.push("End at frames 0,9..45: " + mid.join(", "));
            /* nothing selected reads a control: nothing changes */
            UK.comp = function () { return c; };
            for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
            var r3 = UK.api.ftRamp({ comp: c.id, control: "", ramp: [50, 50], dur: 3 });
            log.push("nothing selected: " + UK.json(r3) + " -> " + ease(E, 2));
            var fr = [3, 10, 20, 30, 45];
            for (q = 0; q < fr.length; q++) c.saveFrameToPng(fr[q] * c.frameDuration, new File(OUT + "hlref/ftc_f_" + fr[q] + ".png"));
        }
        if (step === "reverse") {
            c = find();
            var Lc = null; for (q = 1; q <= c.numLayers; q++) if (c.layer(q).property("ADBE Mask Parade") && c.layer(q).property("ADBE Mask Parade").numProperties) Lc = c.layer(q);
            var FX = Lc.property("ADBE Effect Parade"), nr = 0; for (q = 1; q <= FX.numProperties; q++) if (FX.property(q).matchName === "ADBE Checkbox Control" && /^Reverse/.test(FX.property(q).name)) { FX.property(q).property(1).setValue(1); nr++; }
            log.push("reversed " + nr + ", End at frame 30 = " + Math.round(c.layer("Fill Trim").effect("End")(1).valueAtTime(30 * c.frameDuration, false)));
            c.saveFrameToPng(30 * c.frameDuration, new File(OUT + "hlref/ftc_f_rev.png"));
        }
        if (step === "log") {
            var bf = $.global.FT_BEFORE, cfo = new File(OUT + "sb_created.txt"), n = 0; cfo.open("a");
            for (q = 1; q <= app.project.numItems; q++) if (!bf[app.project.item(q).id]) { cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name); n++; }
            cfo.close(); log.push("logged " + n + " new items");
        }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    finally { UK.comp = keep; }
    var f = new File(OUT + "ft_center.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\r\n")); f.close();
})();

// Auto Captions rig (jsx/autocap.jsx) through the real builder on an own comp WR_ac (1080 x 1920) with a made-up
// transcript (Georgian + Latin words). Steps by $.global.AC_STEP: build / check / render (AC_T, AC_TAG) / log.
// Results appended to out/ac_log.txt. Nothing of the user's is touched; no viewer, no active comp.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [];
    var find = function (n) { for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === n) return app.project.item(i); return null; };
    var G = function (a) { var s = ""; for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return s; };
    var errs = function (L) {
        var out = [], n = 0;
        var walk = function (p, path) {
            for (var k = 1; k <= p.numProperties; k++) {
                var q = p.property(k);
                if (q.propertyType === PropertyType.PROPERTY) {
                    try { if (q.canSetExpression && q.expression !== "") { n++; if (!q.expressionEnabled || q.expressionError !== "") out.push(path + "/" + q.name + ": " + (q.expressionEnabled ? "" : "DISABLED ") + String(q.expressionError).replace(/[\r\n]+/g, " ").substr(0, 200)); } } catch (e) { }
                } else walk(q, path + "/" + q.name);
            }
        };
        walk(L, L.name);
        return { n: n, bad: out };
    };
    try {
        var step = $.global.AC_STEP, C = find("WR_ac"), q;
        if (step === "build") {
            var before = {}; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true; $.global.AC_BEFORE = before;
            if (!C) { C = app.project.items.addComp("WR_ac", 1080, 1920, 1, 8, 30); var S = C.layers.addSolid([0.16, 0.2, 0.3], "WR_bg", 1080, 1920, 1); }
            var hello = G([4306, 4304, 4315, 4304, 4320, 4335, 4317, 4305, 4304]), es = G([4308, 4321]), aris = G([4304, 4320, 4312, 4321]), karaqi = G([4313, 4304, 4320, 4304, 4325, 4312]);
            var blocks = [
                { t0: 0.5, t1: 2.0, text: encodeURIComponent(hello + ", " + es + " " + aris + " Lurpak"), ws: [0.5, 0.9, 1.2, 1.5] },
                { t0: 2.0, t1: 3.7, text: encodeURIComponent(karaqi + ". It tastes great!"), ws: [2.0, 2.5, 2.8, 3.1] },
                { t0: 4.2, t1: 7.0, text: encodeURIComponent("And one more thing to check"), ws: [4.2, 4.6, 5.0, 5.4, 5.8, 6.2] }
            ];
            var a = $.global.AC_OPT || {};
            a._comp = C; a.blocks = blocks; a.src = { start: 0, stretch: 100, inPoint: 0, outPoint: 8 };
            var r = UK.api.autoCaption(a);
            log.push("built: captions " + r.captions + " keys " + r.words + " font " + r.font + " size " + r.size + " layers " + C.numLayers);
            var st = []; for (q = 1; q <= C.numLayers; q++) st.push(q + " " + C.layer(q).name + (C.layer(q).enabled ? "" : " (off)") + (C.layer(q).parent ? " > " + C.layer(q).parent.name : ""));
            log.push("stack: " + st.join(" | "));
        }
        if (step === "check") {
            var tb = 0, tn = 0;
            for (q = 1; q <= C.numLayers; q++) { var E = errs(C.layer(q)); tn += E.n; tb += E.bad.length; if (E.bad.length) log.push("EXPR " + E.bad.join(" ; ")); }
            log.push("check: expressions " + tn + ", problems " + tb);
            var T = C.layer("Captions"), WB = C.layer("Word Box"), times = [0.2, 0.6, 1.3, 1.52, 1.7, 2.6, 3.9, 5.1];
            for (q = 0; q < times.length; q++) {
                var tt = times[q], tx = String(T.property("ADBE Text Properties").property("ADBE Text Document").valueAtTime(tt, false).text).replace(/\r/g, " / ");
                var p = WB.property("ADBE Transform Group").property("ADBE Position").valueAtTime(tt, false), sz = WB.property("ADBE Root Vectors Group").property("Box").property("ADBE Vectors Group").property("Rect").property("ADBE Vector Rect Size").valueAtTime(tt, false);
                log.push("  t " + tt + " word " + C.layer("Caption Controls").property("ADBE Effect Parade").property("Word").property(1).valueAtTime(tt, false) + " | box pos " + Math.round(p[0]) + "," + Math.round(p[1]) + " size " + Math.round(sz[0]) + "x" + Math.round(sz[1]) + " | text has Georgian " + UK.AC.isGeo(tx) + " len " + tx.length + " lines " + tx.split(" / ").length);
            }
        }
        if (step === "render") { C.saveFrameToPng(Math.round($.global.AC_T / C.frameDuration) * C.frameDuration, new File(OUT + "hlref/ac_" + $.global.AC_TAG + ".png")); log.push("render " + $.global.AC_TAG + " t " + $.global.AC_T); }
        if (step === "log") {
            var bf = $.global.AC_BEFORE, cfo = new File(OUT + "sb_created.txt"), m = 0; cfo.open("a");
            for (q = 1; q <= app.project.numItems; q++) if (!bf[app.project.item(q).id]) { cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name); m++; }
            cfo.close(); log.push("logged " + m);
        }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    var o = new File(OUT + "ac_log.txt"); o.encoding = "UTF-8"; o.open("a"); o.writeln(log.join("\n")); o.close();
})();

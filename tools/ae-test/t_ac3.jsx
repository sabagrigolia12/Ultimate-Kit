// Auto Captions v3 rig (one text layer per caption) in an own comp WR_ac3 (1080 x 1920). Steps by $.global.AC3_STEP:
// build (AC3_OPT = style) / check / edit (longer text in caption 1: the box must widen) / render (AC3_T, AC3_TAG) /
// log. -> out/ac3_log.txt. Nothing of the user's is touched; no viewer, no active comp.
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
                    try { if (q.canSetExpression && q.expression !== "") { n++; if (!q.expressionEnabled || q.expressionError !== "") out.push(path + "/" + q.name + ": " + (q.expressionEnabled ? "" : "DISABLED ") + String(q.expressionError).replace(/[\r\n]+/g, " ").substr(0, 220)); } } catch (e) { }
                } else walk(q, path + "/" + q.name);
            }
        };
        walk(L, L.name);
        return { n: n, bad: out };
    };
    var box = function (C, nm, t) {
        var B = C.layer(nm); if (!B) return "-";
        var p = B.property("ADBE Transform Group").property("ADBE Position").valueAtTime(t, false), s = B.property("ADBE Root Vectors Group").property("Box").property("ADBE Vectors Group").property("Rect").property("ADBE Vector Rect Size").valueAtTime(t, false);
        return Math.round(p[0]) + "," + Math.round(p[1]) + " " + Math.round(s[0]) + "x" + Math.round(s[1]) + " op " + B.property("ADBE Transform Group").property("ADBE Opacity").valueAtTime(t, false);
    };
    try {
        var step = $.global.AC3_STEP, C = find("WR_ac3"), q;
        if (step === "build") {
            var before = {}; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true; $.global.AC3_BEFORE = before;
            if (!C) { C = app.project.items.addComp("WR_ac3", 1080, 1920, 1, 8, 30); C.layers.addSolid([0.32, 0.42, 0.55], "WR_bg3", 1080, 1920, 1); }
            var hello = G([4306, 4304, 4315, 4304, 4320, 4335, 4317, 4305, 4304]), es = G([4308, 4321]), aris = G([4304, 4320, 4312, 4321]), karaqi = G([4313, 4304, 4320, 4304, 4325, 4312]);
            var blocks = [
                { t0: 0.5, t1: 2.0, text: encodeURIComponent(hello + ", " + es + " " + aris + " Lurpak"), ws: [0.5, 0.9, 1.2, 1.5] },
                { t0: 2.0, t1: 3.7, text: encodeURIComponent(karaqi + ". It tastes great!"), ws: [2.0, 2.5, 2.8, 3.1] },
                { t0: 4.2, t1: 7.0, text: encodeURIComponent("And one more thing"), ws: [4.2, 4.6, 5.0, 5.4] }
            ];
            var a = $.global.AC3_OPT || {}, k2;
            var o = { _comp: C, blocks: blocks, src: { start: 0, stretch: 100, inPoint: 0, outPoint: 8 } };
            for (k2 in a) o[k2] = a[k2];
            var r = UK.api.autoCaption(o);
            log.push("built: captions " + r.captions + " font " + r.font + " size " + r.size + " | layers " + C.numLayers);
            var st = []; for (q = 1; q <= C.numLayers; q++) st.push(q + " " + C.layer(q).name + (C.layer(q).enabled ? "" : " (off)") + (C.layer(q).parent ? " > " + C.layer(q).parent.name : "") + " [" + Math.round(C.layer(q).inPoint * 100) / 100 + "-" + Math.round(C.layer(q).outPoint * 100) / 100 + "]");
            log.push("stack: " + st.join(" | "));
        }
        if (step === "check") {
            var tb = 0, tn = 0;
            for (q = 1; q <= C.numLayers; q++) { var E = errs(C.layer(q)); tn += E.n; tb += E.bad.length; if (E.bad.length) log.push("EXPR " + E.bad.join(" ; ")); }
            log.push("check: expressions " + tn + ", problems " + tb);
            var ts = [0.2, 0.6, 1.3, 1.6, 2.6, 4.0, 5.1];
            for (q = 0; q < ts.length; q++) log.push("  t " + ts[q] + " | caption box " + box(C, "Caption Box", ts[q]) + " | word box " + box(C, "Word Box", ts[q]));
        }
        if (step === "edit") {
            for (q = 1; q <= C.numLayers; q++) {
                var L = C.layer(q);
                if (L instanceof TextLayer && L.inPoint < 1 && L.enabled) {
                    var before2 = box(C, "Caption Box", 1.0), td = L.property("ADBE Text Properties").property("ADBE Text Document"), d = td.value;
                    d.text = d.text + " and a lot more words"; td.setValue(d);
                    log.push("edited '" + L.name + "' | box before " + before2 + " | after " + box(C, "Caption Box", 1.0));
                    break;
                }
            }
        }
        if (step === "render") { C.saveFrameToPng(Math.round($.global.AC3_T / C.frameDuration) * C.frameDuration, new File(OUT + "hlref/ac3_" + $.global.AC3_TAG + ".png")); log.push("render " + $.global.AC3_TAG); }
        if (step === "log") {
            var bf = $.global.AC3_BEFORE, cfo = new File(OUT + "sb_created.txt"), m = 0; cfo.open("a");
            for (q = 1; q <= app.project.numItems; q++) if (!bf[app.project.item(q).id]) { cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name); m++; }
            cfo.close(); log.push("logged " + m);
        }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    var f = new File(OUT + "ac3_log.txt"); f.encoding = "UTF-8"; f.open("a"); f.writeln(log.join("\n")); f.close();
})();

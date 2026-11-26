// Graphics (jsx/graphics.jsx) through the real builder on own comps WR_gfx_<w>x<h>. $.global.GFX_IDS = template ids,
// GFX_SIZES = [[w,h],...], GFX_PAL = palette index. Steps: build / render (GFX_T, tag) / log. -> out/gfx_log.txt
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [];
    var find = function (n) { for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === n) return app.project.item(i); return null; };
    var errs = function (C) {
        var bad = [], n = 0;
        var walk = function (p, path) {
            for (var k = 1; k <= p.numProperties; k++) {
                var q = p.property(k);
                if (q.propertyType === PropertyType.PROPERTY) { try { if (q.canSetExpression && q.expression !== "") { n++; if (!q.expressionEnabled || q.expressionError !== "") bad.push(path + "/" + q.name + ": " + String(q.expressionError).substr(0, 160)); } } catch (e) { } }
                else walk(q, path + "/" + q.name);
            }
        };
        for (var i = 1; i <= C.numLayers; i++) walk(C.layer(i), C.layer(i).name);
        return { n: n, bad: bad };
    };
    try {
        var step = $.global.GFX_STEP, ids = $.global.GFX_IDS || ["g01"], sizes = $.global.GFX_SIZES || [[1920, 1080]], q, i, j;
        if (step === "build") {
            var before = {}; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true; $.global.GFX_BEFORE = before;
            for (j = 0; j < sizes.length; j++) {
                var nm = "WR_gfx_" + sizes[j][0] + "x" + sizes[j][1], C = find(nm);
                if (!C) C = app.project.items.addComp(nm, sizes[j][0], sizes[j][1], 1, 10, 30);
                for (i = 0; i < ids.length; i++) {
                    C.time = 0;
                    var t0 = new Date().getTime();
                    try {
                        var r = UK.api.graphic({ _comp: C, id: ids[i], pal: UK_GFX.PALETTES[$.global.GFX_PAL || 0], texts: {}, overlay: "auto", edge: true, speed: 1, light: 1, dur: 0 });
                        var PC = find(r.comp), E = errs(PC);
                        C.layer(1).enabled = (i === ids.length - 1);
                        log.push(nm + " " + ids[i] + ": " + PC.numLayers + " layers, " + E.n + " expr, " + E.bad.length + " problems" + (E.bad.length ? " | " + E.bad.join(" ; ") : "") + " | " + (new Date().getTime() - t0) + " ms | dur " + Math.round(PC.duration * 100) / 100);
                    } catch (e1) { log.push(nm + " " + ids[i] + ": BUILD ERROR " + e1.message + " line " + e1.line); }
                }
            }
        }
        if (step === "render") {
            var C2 = find($.global.GFX_COMP);
            for (q = 1; q <= C2.numLayers; q++) C2.layer(q).enabled = (C2.layer(q).name === $.global.GFX_LAYER || (!$.global.GFX_LAYER && q === 1));
            C2.saveFrameToPng(Math.round($.global.GFX_T / C2.frameDuration) * C2.frameDuration, new File(OUT + "hlref/gfx_" + $.global.GFX_TAG + ".png"));
            log.push("render " + $.global.GFX_TAG);
        }
        if (step === "log") {
            var bf = $.global.GFX_BEFORE, cfo = new File(OUT + "sb_created.txt"), m = 0; cfo.open("a");
            for (q = 1; q <= app.project.numItems; q++) if (!bf[app.project.item(q).id]) { cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name); m++; }
            cfo.close(); log.push("logged " + m);
        }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    var f = new File(OUT + "gfx_log.txt"); f.encoding = "UTF-8"; f.open("a"); f.writeln(log.join("\n")); f.close();
})();

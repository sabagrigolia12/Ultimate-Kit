// Photo to Shape, the build, as the panel calls it: the colours traced in the test page (out/hlref/p2s_colors_*.json) on my own layers in my own comp WR_p2s
// (UK.comp pointed at it): WR_masked as one shape layer, WR_plain as a layer per colour, each alone in its own render comp afterwards. Result in out/p2s_build.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [], keep = UK.comp, q, c = null;
    var readJ = function (n) { var f = new File(OUT + "hlref/" + n); f.encoding = "UTF-8"; f.open("r"); var s = f.read(); f.close(); return eval("(" + s + ")"); };
    try {
        for (q = 1; q <= app.project.numItems; q++) if (app.project.item(q) instanceof CompItem && app.project.item(q).name === "WR_p2s") c = app.project.item(q);
        if (!c) throw new Error("no WR_p2s");
        UK.comp = function () { return c; };
        var LM = c.layer("WR_masked"), LP = c.layer("WR_plain"), LN = c.layer("WR_none");
        var r1 = UK.api.p2sBuild({ comp: c.id, id: LM.id, result: "one", colors: readJ("p2s_colors_masked.json") });
        log.push("one layer: " + r1.layers.join(", ") + " | colours " + r1.colors + " points " + r1.points + " | image on " + LM.enabled);
        var r2 = UK.api.p2sBuild({ comp: c.id, id: LP.id, result: "layers", colors: readJ("p2s_colors_plain.json") });
        log.push("per colour: " + r2.layers.join(", ") + " | colours " + r2.colors + " points " + r2.points + " | image on " + LP.enabled);
        LN.enabled = false;
        var names = []; for (q = 1; q <= c.numLayers; q++) names.push(c.layer(q).name + (c.layer(q).enabled ? "" : " (off)")); log.push(names.join(" | "));
        /* two passes of rendering come next: only the masked shapes, then only the per-colour ones */
        var S = c.layer(r1.layers[0]); var keys = S.property("ADBE Root Vectors Group"); log.push("groups in the one layer: " + keys.numProperties + ", first '" + keys.property(1).name + "' paths " + keys.property(1).property("ADBE Vectors Group").numProperties);
        for (q = 0; q < r2.layers.length; q++) c.layer(r2.layers[q]).enabled = false;
        c.saveFrameToPng(0, new File(OUT + "hlref/p2s_ae_masked.png"));
        log.push("rendering masked");
        $.global.P2S_T = { one: r1.layers, per: r2.layers };
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    finally { UK.comp = keep; }
    var f = new File(OUT + "p2s_build.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\r\n")); f.close();
})();

// Pixel Wipe, end to end as the panel calls it: UK.api.wipeReveal on the selected layer of an own comp (UK.comp pointed at it),
// from the host the panel loaded (no evalFile of the source). Logged for t_cleanup_created.jsx. Result in $.global.PX_API.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", before = {}, q, log = [];
    if (!app.project) { $.global.PX_API = "no project"; return; }
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var c = app.project.items.addComp("WR_pxapi", 1920, 1080, 1, 6, 30), keep = UK.comp;
    c.layers.addSolid([0.1, 0.1, 0.1], "WR_bg", 1920, 1080, 1);
    var L = c.layers.addSolid([0.9, 0.5, 0.2], "WR_clip", 1920, 1080, 1);
    L.startTime = 1; L.outPoint = 5; L.selected = true;
    c.time = 1;
    UK.comp = function () { return c; };
    try {
        var r = UK.api.wipeReveal({ id: "wr01", dur: 1, angle: 90, radial: false, c1: "#7CFFB6", c2: "#22D46E", glow: true, ending: "back" });
        log.push("result " + r.name + " / " + r.controls + " / glow " + r.glow + " / ending " + r.ending);
        var N = c.layer(r.controls), w = N.effect("Wipe")(1), e = N.effect("Wipe End")(1);
        log.push("Wipe " + w.keyTime(1).toFixed(3) + ".." + w.keyTime(2).toFixed(3) + ", End " + e.keyTime(1).toFixed(3) + ".." + e.keyTime(2).toFixed(3) + ", End Reverse " + N.effect("End Reverse")(1).value);
        var names = []; for (q = 1; q <= c.numLayers; q++) names.push(c.layer(q).name + (c.layer(q).selected ? " (selected)" : "")); log.push(names.join(", "));
    } catch (e1) { log.push("ERROR " + e1.message + " line " + e1.line); }
    finally { UK.comp = keep; }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    $.global.PX_API = log.join(" || ");
})();

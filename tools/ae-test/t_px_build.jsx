// Pixel Wipe test, step 1: a 1920x1080 test comp WR_px on black (as the preview) with the preview's own picture
// (out/hlref/wr_scene.png), built by UK.WIPE.buildPixel from the source file. No viewer, no active comp, nothing of the
// user's touched; everything is logged for t_cleanup_created.jsx. Options in $.global.PX_OPTS. Result: out/px_test.txt.
// Frames: t_px_render.jsx (a separate pass).
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", before = {}, q, log = [];
    if (!app.project) { $.global.PX_TEST = "no project"; return; }
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    $.evalFile(new File("D:/Projects/Codex/UltimateKit/jsx/wipe.jsx"));
    var o = $.global.PX_OPTS || {}, F = app.project.importFile(new ImportOptions(new File(OUT + "hlref/wr_scene.png")));
    var c = app.project.items.addComp(o.comp || "WR_px", 1920, 1080, 1, 6, 30);
    c.layers.addSolid([0, 0, 0], "WR_bg", 1920, 1080, 1);
    var L = c.layers.add(F);
    L.name = "WR_scene";
    log.push("deep glow installed: " + UK.WIPE.hasGlow());
    var a = { id: "wr01", t0: 0.4, dur: 1.33, angle: o.angle === undefined ? 90 : o.angle, radial: !!o.radial, c1: o.c1 || "#B67CFF", c2: o.c2 || "#8E33FF", glow: o.glow !== false, ending: o.ending || "same" };
    var r;
    try { r = UK.WIPE.buildPixel(c, L, a); log.push("built: controls " + r.controls.name + ", ending " + r.ending + ", glow " + r.glow); }
    catch (e1) { log.push("ERROR " + e1.message + " line " + e1.line); }
    /* every expression in the comp and the precomp: errors? */
    var errs = 0, nexp = 0;
    var walk = function (g, path) {
        for (var k = 1; k <= g.numProperties; k++) {
            var p = g.property(k);
            if (p.propertyType === PropertyType.PROPERTY) {
                if (p.canSetExpression && p.expression !== "") { nexp++; if (p.expressionError && p.expressionError !== "") { errs++; log.push("EXPR " + path + "/" + p.name + ": " + p.expressionError); } }
            } else walk(p, path + "/" + p.name);
        }
    };
    c.time = 1.0;
    for (q = 1; q <= c.numLayers; q++) walk(c.layer(q), c.layer(q).name);
    if (r) for (q = 1; q <= r.comp.numLayers; q++) walk(r.comp.layer(q), "P/" + r.comp.layer(q).name);
    log.push("expressions " + nexp + ", errors " + errs + ", layers " + c.numLayers);
    if (r) {
        var nn = r.dots.property("ADBE Effect Parade"), ef = [];
        for (q = 1; q <= nn.numProperties; q++) ef.push(nn.property(q).name);
        log.push("pixels effects: " + ef.join(", "));
        var w = r.controls.effect("Wipe")(1), we = r.controls.effect("Wipe End")(1);
        log.push("Wipe keys " + w.numKeys + " " + w.keyTime(1) + ".." + w.keyTime(2) + " | Wipe End keys " + we.numKeys + (we.numKeys ? " " + we.keyTime(1) + ".." + we.keyTime(2) : ""));
    }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    var f = new File(OUT + "px_test.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\n")); f.close();
    $.global.PX_TEST = log.join(" || ");
})();

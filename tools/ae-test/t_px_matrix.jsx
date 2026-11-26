// Pixel Wipe test matrix: cleanup, then one comp per case (directions, both endings, radial, a layer that starts late and is
// trimmed, a small layer with empty surroundings, a vertical comp, the other two looks of the same rig). Nothing of the
// user's touched; everything logged for t_cleanup_created.jsx. Frames: t_px_render with PX_RENDER, or $.global.PX_MATRIX_R below.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", before = {}, q, log = [];
    if (!app.project) { $.global.PX_MATRIX = "no project"; return; }
    $.evalFile(new File(OUT.replace("out/", "") + "t_cleanup_created.jsx"));
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    $.evalFile(new File("D:/Projects/Codex/UltimateKit/jsx/wipe.jsx"));
    var F = app.project.importFile(new ImportOptions(new File(OUT + "hlref/wr_scene.png")));
    var cases = [
        { c: "WR_pxA", ending: "same", angle: 90, t0: 0.4, id: "wr01" },
        { c: "WR_pxF", ending: "back", angle: 90, t0: 0.4, id: "wr01", small: true, bg: [0.15, 0.2, 0.3] },
        { c: "WR_pxH", ending: "off", angle: 90, t0: 0.4, id: "wr01" },
        { c: "WR_pxK", ending: "same", angle: 90, t0: 0.4, id: "wr01", noDG: true },
        { c: "WR_pxL", ending: "same", angle: 90, t0: 0.4, id: "wr01", noGlow: true },
        { c: "WR_pxM", ending: "back", angle: 90, t0: 0.4, id: "wr01", small: true, twice: true, bg: [0.15, 0.2, 0.3] }
    ];
    var walk = function (g, path, st) {
        for (var k = 1; k <= g.numProperties; k++) {
            var p = g.property(k);
            if (p.propertyType === PropertyType.PROPERTY) {
                if (p.canSetExpression && p.expression !== "") { st.n++; if (p.expressionError && p.expressionError !== "") { st.e++; log.push("EXPR " + path + "/" + p.name + ": " + p.expressionError); } }
            } else walk(p, path + "/" + p.name, st);
        }
    };
    for (var i = 0; i < cases.length; i++) {
        var K = cases[i], W = K.w || 1920, H = K.h || 1080;
        try {
            var c = app.project.items.addComp(K.c, W, H, 1, 6, 30), bg = K.bg || [0, 0, 0];
            c.layers.addSolid(bg, "WR_bg", W, H, 1);
            var L;
            if (K.small) { L = c.layers.addSolid([0.95, 0.8, 0.3], "WR_small", 800, 500, 1); }
            else { L = c.layers.add(F); L.name = "WR_scene"; var sc = Math.max(W / 1920, H / 1080) * 100; L.property("ADBE Transform Group").property("ADBE Scale").setValue([sc, sc]); }
            if (K.start) L.startTime = K.start;
            if (K.out) L.outPoint = K.out;
            var a = { id: K.id, t0: K.t0, dur: 1.33, angle: K.angle, radial: !!K.radial, c1: "#7CFFB6", c2: "#22D46E", glow: !K.noGlow, ending: K.ending };
            var keepG = UK.WIPE.hasGlow; if (K.noDG) UK.WIPE.hasGlow = function () { return false; };
            var r = K.id === "wr01" ? UK.WIPE.buildPixel(c, L, a) : UK.WIPE.build(c, L, a);
            UK.WIPE.hasGlow = keepG;
            if (K.twice) {
                var L2 = c.layers.addSolid([0.3, 0.8, 0.95], "WR_small2", 500, 300, 1);
                L2.property("ADBE Transform Group").property("ADBE Position").setValue([960, 900]);
                L2.moveToEnd(); L2.moveBefore(c.layer("WR_bg"));
                var r2 = UK.WIPE.buildPixel(c, L2, { id: "wr01", t0: 2, dur: 1, angle: 270, radial: false, c1: "#FF8080", c2: "#FF2020", glow: true, ending: "same" });
                var names = []; for (q = 1; q <= c.numLayers; q++) names.push(c.layer(q).name); log.push(K.c + " layers: " + names.join(", "));
            }
            var st = { n: 0, e: 0 };
            c.time = K.t0 + 0.6;
            for (q = 1; q <= c.numLayers; q++) walk(c.layer(q), c.layer(q).name, st);
            for (q = 1; q <= r.comp.numLayers; q++) walk(r.comp.layer(q), "P/" + r.comp.layer(q).name, st);
            var line = K.c + " " + K.id + ": layers " + c.numLayers + ", expressions " + st.n + ", errors " + st.e + ", ending " + r.ending;
            if (K.id === "wr01") {
                var w = r.controls.effect("Wipe")(1), we = r.controls.effect("Wipe End")(1);
                line += ", Wipe " + w.keyTime(1).toFixed(3) + ".." + w.keyTime(2).toFixed(3) + (we.numKeys ? ", End " + we.keyTime(1).toFixed(3) + ".." + we.keyTime(2).toFixed(3) : ", End none") + ", top start " + r.top.startTime.toFixed(3) + " in " + r.top.inPoint.toFixed(3) + " out " + r.top.outPoint.toFixed(3) + ", pixels in " + r.dots.inPoint.toFixed(3) + " out " + r.dots.outPoint.toFixed(3);
            }
            log.push(line);
        } catch (e1) { log.push(K.c + " ERROR " + e1.message + " line " + e1.line); }
    }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    var f = new File(OUT + "px_matrix.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\n")); f.close();
    $.global.PX_MATRIX = "cases " + cases.length;
})();

// Builds every Depth Reveal look on its reference photo (lab/<img>.png + <img>_depth.png) in DR_<id> host comps
// (no viewer), records created items. out/depth_img.txt (optional): "id=img,id=img"; out/only.txt: ids.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/", LAB = "D:/Projects/Codex/tools/ae-test/lab/";
    var out = new File(OUT + "t_depth_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var MAP = { dp01: "land2", dp02: "river", dp03: "river2" }, imgF = new File(OUT + "depth_img.txt");
        if (imgF.exists) { imgF.open("r"); var pr = imgF.read().split(","); imgF.close(); for (var m = 0; m < pr.length; m++) { var kv = pr[m].split("="); if (kv.length === 2) MAP[kv[0]] = kv[1]; } }
        var cache = {};
        var get = function (name) { if (!cache[name]) cache[name] = app.project.importFile(new ImportOptions(new File(LAB + name))); return cache[name]; };
        var onlyF = new File(OUT + "only.txt"), ONLY = null;
        if (onlyF.exists) { onlyF.open("r"); ONLY = onlyF.read().split(","); onlyF.close(); }
        var Ls = UK_CAT.depth;
        for (var i = 0; i < Ls.length; i++) {
            if (ONLY && !UK.has(ONLY, Ls[i].id)) continue;
            var img = MAP[Ls[i].id] || "land", photo = get(img + ".png"), depth = get(img + "_depth.png");
            var c = app.project.items.addComp("DR_" + Ls[i].id, photo.width, photo.height, 1, 5, 30);
            var L = c.layers.add(photo);
            try {
                var t1 = new Date().getTime(), r = UK.DEPTH.build(c, L, depth, { id: Ls[i].id, t0: 0.3, dur: 1.65 });
                var gw = r.copy.property("ADBE Effect Parade").property("Gradient Wipe"), sp = gw.property("ADBE Gradient Wipe-0002");
                out.writeln("OK   " + Ls[i].id + " " + Ls[i].name + " layers=" + c.numLayers + " softness value=" + sp.valueAtTime(1, false) + " exprErr='" + sp.expressionError + "' " + (new Date().getTime() - t1) + "ms");
            } catch (eb) { out.writeln("FAIL " + Ls[i].id + " :: " + eb.toString() + " line " + eb.line); }
        }
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cf = new File(OUT + "sb_created.txt"); cf.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cf.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cf.close(); } catch (e2) { }
    out.close();
})();

// Flag Wave: on a 1920x1080 test comp WR_wave, (1) a striped test "photo" (a WR_ precomp) selected, (2) on a second
// comp WR_wave2 nothing selected (a white rectangle is made). Logs layers / effects / errors, renders frames.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "wave"); if (!fo.exists) fo.create();
    var old = fo.getFiles("*.png"); for (var q0 = 0; q0 < old.length; q0++) old[q0].remove();
    var out = new File(OUT + "wave/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var mk = function (nm, photo) {
            var c = app.project.items.addComp(nm, 1920, 1080, 1, 5, 30);
            c.layers.addSolid([0.12, 0.13, 0.16], "WR_bg", 1920, 1080, 1);
            if (photo) {
                var pc = app.project.items.addComp("WR_wphoto", 1200, 800, 1, 5, 30), cols = [[0.95, 0.55, 0.15], [0.97, 0.95, 0.9], [0.1, 0.55, 0.25]];
                for (var s = 0; s < 3; s++) { var b = pc.layers.addSolid(cols[s], "band" + s, 1200, 267, 1); UK.pos(b).setValue([600, 133 + s * 267]); }
                UK.addText(pc, "PHOTO", { size: 150, color: "#203060" });
                var PLy = c.layers.add(pc);
                for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
                PLy.selected = true;
            } else for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
            c.time = 0;
            keep = UK.comp; UK.comp = function () { return c; };
            var r = UK.api.flagWave({});
            UK.comp = keep; keep = null;
            var ls = []; for (q = 1; q <= c.numLayers; q++) ls.push(c.layer(q).name + " (" + c.layer(q).blendingMode + ", fx " + c.layer(q).property("ADBE Effect Parade").numProperties + ")");
            var errs = []; for (q = 1; q <= c.numLayers; q++) { var e = c.layer(q).property("ADBE Effect Parade"); for (var k = 1; k <= e.numProperties; k++) if (e.property(k).matchName === "ADBE Displacement Map") ls.push("map layer " + e.property(k).property(1).value); }
            var MC = null; for (q = 1; q <= c.numLayers; q++) if (c.layer(q).name.indexOf("Wave Map") >= 0) MC = c.layer(q).source;
            var ww = MC.layer(1).property("ADBE Effect Parade").property(1);
            out.writeln(nm + ": " + UK.json(r) + " | " + ls.join(", ") + " | WW pos " + ww.property("APC Wave World-0044").value.join(",") + " view " + ww.property("APC Wave World-0002").value);
            var TT = [0, 0.5, 1, 2, 3, 4];
            for (q = 0; q < TT.length; q++) renders.push([c, TT[q], OUT + "wave/" + nm + "_" + Math.round(TT[q] * 10) + ".png"]);
        };
        mk("WR_wave", true);
        mk("WR_wave2", false);
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();

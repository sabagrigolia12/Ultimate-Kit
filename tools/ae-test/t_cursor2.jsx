// Make Cursor sizing: for each click effect, a 3000x4200 comp (like the user's) with a 160 px arrow and a 1920x1080 comp
// with a 44 px arrow; Make Cursor (UK.comp pointed at the test comp); logs the precomp size; renders the precomp at
// several times to out/cursor2/ so the edges can be checked for cut-offs.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "cursor2"); if (!fo.exists) fo.create();
    var out = new File(OUT + "cursor2/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var fxs = ["burst", "dots", "pixels", "particles", "spark", "simple"], setups = [["big", 3000, 4200, 160], ["hd", 1920, 1080, 44]];
        for (var s = 0; s < setups.length; s++) for (var f = 0; f < fxs.length; f++) {
            var su = setups[s], c = app.project.items.addComp("WR_cur_" + su[0] + "_" + fxs[f], su[1], su[2], 1, 4, 30);
            UK._fd = c.frameDuration;
            var A = UK.shapeLayer(c, "Arrow"), h = su[3], w = h * 0.62;
            UK.addPath(UK.vecs(UK.group(UK.root(A), "Arrow")), [[0, 0], [0, h], [w * 0.33, h * 0.74], [w * 0.55, h], [w * 0.7, h * 0.93], [w * 0.5, h * 0.68], [w, h * 0.66]], null, null, true);
            UK.addFill(UK.vecs(UK.root(A).property("Arrow")), "#FFFFFF");
            UK.addStroke(UK.vecs(UK.root(A).property("Arrow")), "#000000", h * 0.04);
            UK.pos(A).setValue([su[1] / 2, su[2] / 2]);
            for (var i = 1; i <= c.numLayers; i++) c.layer(i).selected = c.layer(i) === A;
            keep = UK.comp; UK.comp = function () { return c; };
            var r = UK.api.makeCursor({ layer: "Arrow", click: fxs[f], hotspot: "tl", pressMs: 260, size: 100 });
            UK.comp = keep; keep = null;
            var CC = null; for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name === r.comp) CC = app.project.item(i);
            out.writeln(su[0] + " " + fxs[f] + ": precomp " + CC.width + "x" + CC.height + " dur " + UK.round(CC.duration, 2));
            var T = [0.15, 0.25, 0.35, 0.5, 0.7, 0.9];
            for (i = 0; i < T.length; i++) renders.push([CC, T[i], OUT + "cursor2/" + su[0] + "_" + fxs[f] + "_" + Math.round(T[i] * 100) + ".png"]);
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();

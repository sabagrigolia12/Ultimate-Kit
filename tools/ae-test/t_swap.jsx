// Card Swap (cr07): for every transition 1..8 (and Random) builds it on its own 1080x1920 test comp WR_swapN (no
// selection: 4 numbered proxies, Hold 0.5 s), logs expression / key errors and the layers, renders frames of every
// comp to out/swap/ (t = 0 .. end every 0.1 s around the first swaps).
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "swap"); if (!fo.exists) fo.create();
    var old = fo.getFiles("*.png"); for (var q0 = 0; q0 < old.length; q0++) old[q0].remove();
    var out = new File(OUT + "swap/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var only = $.global.SWAP_ONLY || [1, 2, 3, 4, 5, 6, 7, 8, 0];
        for (var v = 0; v < only.length; v++) {
            var tr = only[v];
            var c = app.project.items.addComp("WR_swap" + tr, 1080, 1920, 1, 6, 30);
            c.layers.addSolid([0.02, 0.02, 0.03], "WR_bg", 1080, 1920, 1);
            for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
            c.time = 0;
            keep = UK.comp; UK.comp = function () { return c; };
            var r = UK.api.carousel({ id: "cr07", sw: { count: 4, trans: tr || 1, random: tr === 0, hold: 0.5, dur: 0.4 } });
            UK.comp = keep; keep = null;
            var P = c.layer(1).source, ls = [];
            for (q = 1; q <= P.numLayers; q++) ls.push(P.layer(q).name + " " + UK.round(P.layer(q).inPoint, 2) + "-" + UK.round(P.layer(q).outPoint, 2) + (P.layer(q).threeDLayer ? " 3D" : ""));
            out.writeln("trans " + tr + ": " + UK.json(r) + " dur " + UK.round(P.duration, 2) + " | " + ls.join(", ") + " | " + c.layer(1).comment.replace(/^.*swaps: /, ""));
            var TT = [0.1, 0.3, 0.45, 0.9, 1.0, 1.1, 1.2, 1.4];
            for (q = 0; q < TT.length; q++) renders.push([c, TT[q], OUT + "swap/v" + tr + "_" + ("00" + Math.round(TT[q] * 100)).slice(-3) + ".png"]);
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();

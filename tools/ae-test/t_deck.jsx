// Card Deck (cr08): for every direction 1..8 builds it on its own 1080x1920 test comp WR_deckN (no selection: 5
// numbered proxies), logs the layers / errors, renders frames to out/deck/ (entry, a swap, the last drop).
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "deck"); if (!fo.exists) fo.create();
    var old = fo.getFiles("*.png"); for (var q0 = 0; q0 < old.length; q0++) old[q0].remove();
    var out = new File(OUT + "deck/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var only = $.global.DECK_ONLY || [1, 2, 3, 4, 5, 6, 7, 8];
        for (var v = 0; v < only.length; v++) {
            var dr = only[v];
            var c = app.project.items.addComp("WR_deck" + dr, 1080, 1920, 1, 10, 30);
            c.layers.addSolid([0.02, 0.02, 0.03], "WR_bg", 1080, 1920, 1);
            for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
            c.time = 0;
            keep = UK.comp; UK.comp = function () { return c; };
            var r = UK.api.carousel({ id: "cr08", dk: { count: 5, dir: dr } });
            UK.comp = keep; keep = null;
            var P = c.layer(1).source, ls = [];
            for (q = 1; q <= P.numLayers; q++) ls.push(P.layer(q).name + " " + UK.round(P.layer(q).inPoint, 2) + "-" + UK.round(P.layer(q).outPoint, 2));
            out.writeln("dir " + dr + ": " + UK.json(r) + " dur " + UK.round(P.duration, 2) + " masks " + c.layer(1).property("ADBE Mask Parade").numProperties + " | " + ls.join(", "));
            var TT = [0, 0.2, 0.4, 1.0, 1.75, 1.85, 2.0, 2.3, 8.4];
            for (q = 0; q < TT.length; q++) renders.push([c, TT[q], OUT + "deck/v" + dr + "_" + ("00" + Math.round(TT[q] * 100)).slice(-3) + ".png"]);
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();

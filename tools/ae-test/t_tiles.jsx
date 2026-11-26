// Number Tiles card: builds 6 tiles (WR_tiles6) and 15 tiles (WR_tiles15) with UK.TILES.build, logs layers / expression
// errors / timing, renders frames to out/tiles/; then sets Count 9 on the 6-tile card (copy WR_tiles6b) and renders it.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "tiles"); if (!fo.exists) fo.create();
    var out = new File(OUT + "tiles/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [];
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var errs = function (C) {
            var e = [], walk = function (p, path) { for (var jj = 1; jj <= p.numProperties; jj++) { var y = p.property(jj); if (y.propertyType === PropertyType.PROPERTY) { try { if (y.canSetExpression && y.expression !== "") { y.valueAtTime(0.5, false); if (y.expressionError) e.push(path + "/" + y.name + ": " + y.expressionError); } } catch (e9) { } } else walk(y, path + "/" + y.name); } };
            for (var i = 1; i <= C.numLayers; i++) walk(C.layer(i), C.layer(i).name);
            return e;
        };
        var specs = [["WR_tiles6", { count: 6 }], ["WR_tiles15", { count: 15 }]];
        for (var k = 0; k < specs.length; k++) {
            var host = app.project.items.addComp(specs[k][0], 1920, 1080, 1, 8, 30);
            UK._fd = host.frameDuration;
            var t0 = new Date().getTime();
            var L = UK.TILES.build(host, { id: "cd32", inDur: 0.9, hold: 2.5, outDur: 0.8, tiles: specs[k][1] }, 0);
            var C = L.source, ls = [];
            for (var i = 1; i <= C.numLayers; i++) ls.push(C.layer(i).name);
            var e = errs(C);
            out.writeln(specs[k][0] + " build " + (new Date().getTime() - t0) + " ms, comp " + C.name + " dur " + UK.round(C.duration, 2) + " layers [" + ls.join(", ") + "] errors " + e.length + " " + e.slice(0, 5).join(" ; "));
            var T = [0.1, 0.25, 0.5, 1.2, 2.5];
            for (i = 0; i < T.length; i++) renders.push([host, T[i], OUT + "tiles/" + specs[k][0] + "_" + Math.round(T[i] * 100) + ".png"]);
            if (k === 0) {
                var h2 = host.duplicate(); h2.name = "WR_tiles6b";
                var C2 = C.duplicate(); C2.name = C.name + " b";
                h2.layer(1).replaceSource(C2, false);
                C2.layer("Controls").property("ADBE Effect Parade").property("Count").property(1).setValue(9);
                C2.layer("Controls").property("ADBE Effect Parade").property("Tile Color").property(1).setValue([0.2, 0.5, 1, 1]);
                renders.push([h2, 2.5, OUT + "tiles/WR_tiles6b_250.png"]);
            }
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var r = 0; r < renders.length; r++) renders[r][0].saveFrameToPng(renders[r][1], new File(renders[r][2]));
})();

// BG Overlay: every look (or $.global.BO_ONLY) on its own 1080x1920 test comp WR_bo<NN>: a warm background, the
// overlay applied over it (sample text on), a dark speaker silhouette on top. Logs layers / errors, renders frames.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "bgov"); if (!fo.exists) fo.create();
    var old = fo.getFiles("*.png"); for (var q0 = 0; q0 < old.length; q0++) old[q0].remove();
    var out = new File(OUT + "bgov/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var ids = $.global.BO_ONLY || []; if (!ids.length) for (q = 0; q < UK_BGOV.LOOKS.length; q++) ids.push(UK_BGOV.LOOKS[q].id);
        for (var v = 0; v < ids.length; v++) {
            var c = app.project.items.addComp("WR_" + ids[v], 1080, 1920, 1, 5, 30);
            var bg = c.layers.addSolid([0.36, 0.2, 0.12], "WR_bg", 1080, 1920, 1);
            var win = c.layers.addSolid([0.1, 0.22, 0.3], "WR_win", 300, 340, 1); UK.pos(win).setValue([300, 560]);
            var win2 = c.layers.addSolid([0.12, 0.3, 0.16], "WR_plant", 260, 520, 1); UK.pos(win2).setValue([880, 760]);
            var P = UK.shapeLayer(c, "WR_person"), g = UK.group(UK.root(P), "Body");
            UK.addEllipse(UK.vecs(g), [300, 380], [540, 760], "Head"); UK.addRect(UK.vecs(g), [760, 900], [540, 1420], 320, "Body"); UK.addFill(UK.vecs(g), "#16181C", 100, "Fill"); UK.pos(P).setValue([0, 0]);
            for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
            win2.selected = true;      // the overlay goes over the background (its top layer)
            c.time = 0;
            keep = UK.comp; UK.comp = function () { return c; };
            var r = UK.api.bgOverlay({ id: ids[v], text: true });
            UK.comp = keep; keep = null;
            P.moveToBeginning();
            var O = null; for (q = 1; q <= c.numLayers; q++) if (c.layer(q).source instanceof CompItem) O = c.layer(q).source;
            var errs = [], walk = function (p, path) { for (var jj = 1; jj <= p.numProperties; jj++) { var y = p.property(jj); if (y.propertyType === PropertyType.PROPERTY) { try { if (y.canSetExpression && y.expression !== "") { y.valueAtTime(1.5, false); if (y.expressionError) errs.push(path + "/" + y.name + ": " + y.expressionError); } } catch (e9) { } } else walk(y, path + "/" + y.name); } };
            for (q = 1; q <= O.numLayers; q++) walk(O.layer(q), O.layer(q).name);
            out.writeln(ids[v] + ": " + UK.json(r) + " errors " + errs.length + " " + errs.slice(0, 3).join(" ; "));
            var TT = [0.35, 0.9, 1.8, 3.2, 4.55];
            for (q = 0; q < TT.length; q++) renders.push([c, TT[q], OUT + "bgov/" + ids[v] + "_" + Math.round(TT[q] * 100) + ".png"]);
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();

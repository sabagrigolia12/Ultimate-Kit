// Center Build (st26): a new text layer in WR_tx (1920x1080, 30 fps, 8 s), applyOne in "both" mode, logs
// expression errors and keys, renders 0.15 / 0.55 / 1.05 / 1.55 / 2.2 / 4.6 s to out/st16/f<t>.png.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "st16"); if (!fo.exists) fo.create();
    var out = new File(OUT + "st16/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [];
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var c = app.project.items.addComp("WR_tx", 1920, 1080, 1, 8, 30);
        UK._fd = c.frameDuration;
        var L = UK.addText(c, "Value Created", { name: "T", size: 120 });
        L.startTime = 0; L.inPoint = 0; L.outPoint = 1 + 2 + 0.8;
        var x = UK.TX.applyOne({ id: "st16" }, UK.TX.P.st16, c, L, 0, true, 1.2, 0.8, 2, "#7C5CFF", "both");
        out.writeln("tIn " + x.tIn + " tOut " + x.tOut + " out " + L.outPoint);
        var errs = [], walk = function (p, path) { for (var jj = 1; jj <= p.numProperties; jj++) { var y = p.property(jj); if (y.propertyType === PropertyType.PROPERTY) { try { if (y.canSetExpression && y.expression !== "") { y.valueAtTime(0.5, false); if (y.expressionError) errs.push(path + "/" + y.name + ": " + y.expressionError); } } catch (e9) { } } else walk(y, path + "/" + y.name); } };
        for (var li = 1; li <= c.numLayers; li++) walk(c.layer(li), c.layer(li).name);
        out.writeln("layers " + c.numLayers + " expression errors " + errs.length + " " + errs.join(" ; "));
        var A = L.property("ADBE Text Properties").property("ADBE Text Animators"), i, j;
        for (i = 1; i <= A.numProperties; i++) {
            var an = A.property(i), s = an.name;
            var sels = an.property("ADBE Text Selectors");
            for (j = 1; j <= sels.numProperties; j++) { var se = sels.property(j); try { var ex = se.property("ADBE Text Expressible Amount"); if (ex) { ex.valueAtTime(0.5, false); s += " expr err='" + ex.expressionError + "'"; } } catch (e1) { } }
            try { var pp = an.property("ADBE Text Animator Properties").property("ADBE Text Position 3D"); if (pp) { s += " pos keys " + pp.numKeys; for (j = 1; j <= pp.numKeys; j++) s += " [" + UK.round(pp.keyTime(j), 2) + ": " + UK.round(pp.keyValue(j)[0], 1) + "]"; } } catch (e2) { }
            out.writeln(s);
        }
        var T = [0.4, 0.55, 0.7, 0.85, 1.05, 1.5];
        for (i = 0; i < T.length; i++) renders.push([c, T[i], OUT + "st16/f" + Math.round(T[i] * 100) + ".png"]);
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var r = 0; r < renders.length; r++) renders[r][0].saveFrameToPng(renders[r][1], new File(renders[r][2]));
})();




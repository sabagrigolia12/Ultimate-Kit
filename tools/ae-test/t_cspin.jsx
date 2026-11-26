// Card Spin (cr04): a 1080x1920 comp WR_cspin with 5 coloured "photos" (solids 720x1280 with a number), Card Spin built
// on them (UK.comp pointed at the test comp), logs layers / expression errors / the landing card, renders frames to
// out/cspin/.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "cspin"); if (!fo.exists) fo.create();
    var out = new File(OUT + "cspin/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var c = app.project.items.addComp("WR_cspin", 1080, 1920, 1, 7, 30);
        UK._fd = c.frameDuration;
        var cols = [[0.85, 0.25, 0.3], [0.2, 0.55, 0.95], [0.95, 0.75, 0.2], [0.25, 0.8, 0.45], [0.6, 0.3, 0.9]], ph = [];
        for (var i = 0; i < 5; i++) {
            var pc = app.project.items.addComp("WR_photo" + (i + 1), 720, 1280, 1, 7, 30);
            pc.layers.addSolid(cols[i], "bg", 720, 1280, 1);
            var tl = UK.addText(pc, String(i + 1), { size: 500 });
            ph.push(c.layers.add(pc));
        }
        for (i = 1; i <= c.numLayers; i++) c.layer(i).selected = true;
        c.time = 0;
        keep = UK.comp; UK.comp = function () { return c; };
        var r = UK.api.carousel({ id: "cr04", cs: {} });
        UK.comp = keep; keep = null;
        out.writeln("made " + UK.json(r));
        var P = null; for (i = 1; i <= c.numLayers; i++) if (c.layer(i).source instanceof CompItem && c.layer(i).source.name.indexOf("Card Spin") === 0) P = c.layer(i).source;
        var ls = []; for (i = 1; i <= P.numLayers; i++) ls.push(P.layer(i).name);
        var errs = [], walk = function (p, path) { for (var jj = 1; jj <= p.numProperties; jj++) { var y = p.property(jj); if (y.propertyType === PropertyType.PROPERTY) { try { if (y.canSetExpression && y.expression !== "") { y.valueAtTime(2.5, false); if (y.expressionError) errs.push(path + "/" + y.name + ": " + y.expressionError); } } catch (e9) { } } else walk(y, path + "/" + y.name); } };
        for (i = 1; i <= P.numLayers; i++) walk(P.layer(i), P.layer(i).name);
        out.writeln("precomp " + P.name + " dur " + UK.round(P.duration, 2) + " layers [" + ls.join(", ") + "] errors " + errs.length + " " + errs.slice(0, 6).join(" ; "));
        var sp = P.layer("Card Spin Controls").property("ADBE Effect Parade").property("Travel").property(1), s = "travel:";
        var T = [0.5, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.3, 5.0];
        for (i = 0; i < T.length; i++) s += " " + T[i] + "=" + UK.round(sp.valueAtTime(T[i], false), 1);
        out.writeln(s);
        var RT = [0.06, 0.15, 0.3, 1.0, 1.6, 2.0, 2.5, 3.0, 3.5, 3.9, 4.3, 4.9, 5.5, 5.7];
        for (i = 0; i < RT.length; i++) renders.push([c, RT[i], OUT + "cspin/f" + ("000" + Math.round(RT[i] * 100)).slice(-3) + ".png"]);
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();



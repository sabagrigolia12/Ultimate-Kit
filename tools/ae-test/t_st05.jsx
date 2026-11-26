// Char Color Cascade (st05) with the accent and with the colour switched off (noAccent): two comps WR_tx_a / WR_tx_b,
// renders 0.35 / 0.6 / 0.9 / 1.3 / 1.8 s to out/st05/<a|b><t>.png, logs expression errors and the accent animator.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "st05"); if (!fo.exists) fo.create();
    var out = new File(OUT + "st05/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [];
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var tag = ["a", "b"];
        for (var v = 0; v < 2; v++) {
            var c = app.project.items.addComp("WR_tx_" + tag[v], 1920, 1080, 1, 6, 30);
            UK._fd = c.frameDuration;
            var L = UK.addText(c, "more expensive", { name: "T", size: 140 });
            L.startTime = 0; L.inPoint = 0; L.outPoint = 4;
            var x = UK.TX.applyOne({ id: "st05", noAccent: v === 1 }, UK.TX.P.st05, c, L, 0, true, 1, 0.8, 2, "#7C5CFF", "in");
            var A = L.property("ADBE Text Properties").property("ADBE Text Animators"), s = tag[v] + " accent " + x.accent + " animators:";
            for (var i = 1; i <= A.numProperties; i++) s += " " + A.property(i).name;
            out.writeln(s);
            var T = [0.35, 0.6, 0.9, 1.3, 1.8];
            for (i = 0; i < T.length; i++) renders.push([c, T[i], OUT + "st05/" + tag[v] + Math.round(T[i] * 100) + ".png"]);
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var r = 0; r < renders.length; r++) renders[r][0].saveFrameToPng(renders[r][1], new File(renders[r][2]));
})();

// Word Pop Rise (st35): new text layer in WR_st35, In + Out; logs animators, the text centre over time (lift / stop /
// up), fill colour of the "UK Accent" amount (hold keys) and expression errors; renders frames to out/st35/.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "st35"); if (!fo.exists) fo.create();
    var out = new File(OUT + "st35/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [];
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var c = app.project.items.addComp("WR_st35", 1920, 1080, 1, 5, 30);
        UK._fd = c.frameDuration;
        var L = UK.addText(c, "It's really easy to manage.", { name: "T", size: 120 });
        L.startTime = 0; L.inPoint = 0; L.outPoint = 4;
        var x = UK.TX.applyOne({ id: "st35" }, UK.TX.P.st35, c, L, 0, true, 1, 0.8, 2, "#7C5CFF", "both");
        UK.TX.egp(c, L, x);
        var A = UK.TX.animators(L), s = "animators:";
        for (var i = 1; i <= A.numProperties; i++) s += " " + A.property(i).name;
        out.writeln(s);
        var E = L.property("ADBE Effect Parade"), fx = "fx:";
        for (i = 1; i <= E.numProperties; i++) fx += " " + E.property(i).name;
        out.writeln(fx + " tOut " + x.tOut);
        var acc = A.property("UK Accent").property("ADBE Text Selectors").property("Range").property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount");
        var T = [0, 0.1, 0.3, 0.5, 0.7, 0.83, 0.86, 1.0, 1.5, 3.2, 3.5, 3.8];
        for (i = 0; i < T.length; i++) {
            var r = L.sourceRectAtTime(T[i], false);
            out.writeln("t " + T[i] + " centreY " + UK.round(r.top + r.height / 2, 1) + " accentAmt " + UK.round(acc.valueAtTime(T[i], false), 1));
        }
        var T2 = [0.15, 0.4, 0.8, 0.9, 1.5, 3.5];
        for (i = 0; i < T2.length; i++) renders.push([c, T2[i], OUT + "st35/f" + Math.round(T2[i] * 100) + ".png"]);
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();

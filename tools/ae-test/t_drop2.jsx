(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "drop2.txt"); out.open("w");
    var before = {}, q; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx"));
        var ctr = function (L, t) { var r = L.sourceRectAtTime(t, false); return [UK.round(r.left + r.width / 2, 1), UK.round(r.top + r.height / 2, 1), UK.round(r.width, 1)].join(",") + " comp " + UK.toCompPt(L, [r.left + r.width / 2, r.top + r.height / 2], t).join(","); };
        var c = app.project.items.addComp("WR_drop_dbg", 1920, 1080, 1, 6, 30); UK._fd = c.frameDuration;
        var L = UK.addText(c, "Explode", { name: "T", size: 120, pos: [700, 400] }); L.startTime = 0; L.inPoint = 0; L.outPoint = 5;
        UK.TX.P.st34(L, { comp: c, fs: 120, doIn: true, doOut: true, tIn: 0, dIn: 1, tOut: 4.2, dOut: 0.8, hold: 2, accent: "#7C5CFF", noNull: true });
        var T = [0, 0.5, 1.0, 1.02, 1.5, 2, 3];
        for (var i = 0; i < T.length; i++) out.writeln(T[i] + " " + ctr(L, T[i]));
        out.writeln("pos " + UK.pos(L).value.join(",") + " anchor " + UK.anchor(L).value.join(","));
    } catch (e) { out.writeln("ERR " + e + " " + e.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
})();

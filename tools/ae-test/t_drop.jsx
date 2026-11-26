// Drag & drop host side, without clicking anything: (1) applyOne with drop (no null) for st34 / st11 on new text layers
// in WR_drop_<id> - logs the comp's layers, the text's scale keys / anchor and the text centre before / after;
// (2) UK.api.textDrop answers: no pick file -> wait, pick file "outside" -> where outside. Never touches the active comp.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "drop.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var ctr = function (L, t) { var r = L.sourceRectAtTime(t, false); return UK.toCompPt(L, [r.left + r.width / 2, r.top + r.height / 2], t); };
        var ids = ["st34", "st11", "st03"];
        for (var k = 0; k < ids.length; k++) {
            var c = app.project.items.addComp("WR_drop_" + ids[k], 1920, 1080, 1, 6, 30);
            UK._fd = c.frameDuration;
            var L = UK.addText(c, "Explode", { name: "T", size: 120, pos: [700, 400] });
            L.startTime = 0; L.inPoint = 0; L.outPoint = 5;
            var b0 = ctr(L, 3);
            UK.TX.applyOne({ id: ids[k], drop: true }, UK.TX.P[ids[k]], c, L, 0, false, 1, 0.8, 2, "#7C5CFF", "both");
            var b1 = ctr(L, 3), lays = [];
            for (var i = 1; i <= c.numLayers; i++) lays.push(c.layer(i).name + (c.layer(i).nullLayer ? "(null)" : ""));
            var S = UK.scale(L), sk = [];
            for (i = 1; i <= S.numKeys; i++) sk.push(UK.round(S.keyTime(i), 2) + ":" + UK.round(S.keyValue(i)[0], 1));
            out.writeln(ids[k] + " layers [" + lays.join(", ") + "] parent " + (L.parent ? L.parent.name : "none") + " scaleKeys [" + sk.join(" ") + "] anchor " + UK.anchor(L).value.join(",") +
                " centre " + UK.round(b0[0], 1) + "," + UK.round(b0[1], 1) + " -> " + UK.round(b1[0], 1) + "," + UK.round(b1[1], 1) + " at 0.33: " + ctr(L, 0.33).join(","));
        }
        var f = UK.TX.pickFile(); if (f.exists) f.remove();
        out.writeln("no file: " + UK.json(UK.api.textDrop({ id: "st03" })));
        f.open("w"); f.write("10,10|explorer|Shell_TrayWnd|outside"); f.close();
        out.writeln("outside: " + UK.json(UK.api.textDrop({ id: "st03" })) + " file left " + f.exists);
        // marker dropped on a text layer of a test comp: textDrop finds it, removes it, applies st35 there (no precomp)
        var cm = app.project.items.addComp("WR_drop_marker", 1920, 1080, 1, 6, 30), LM = UK.addText(cm, "Marker drop", { name: "T", size: 100 });
        LM.startTime = 0; LM.inPoint = 0; LM.outPoint = 5;
        for (var s2 = 1; s2 <= cm.numLayers; s2++) cm.layer(s2).selected = true;
        LM.applyPreset(new File(ROOT + "assets/drop/ukdrop.ffx"));
        f.open("w"); f.write("10,10|AfterFX|x|clicked"); f.close();
        var rr = UK.api.textDrop({ id: "st35", mode: "both", inDur: 1, outDur: 0.8, hold: 2, accent: "#7C5CFF" });
        var EM = LM.property("ADBE Effect Parade"), fxs = [], A2 = UK.TX.animators(LM), ans = [];
        for (s2 = 1; s2 <= EM.numProperties; s2++) fxs.push(EM.property(s2).name);
        for (s2 = 1; s2 <= A2.numProperties; s2++) ans.push(A2.property(s2).name);
        out.writeln("marker: " + UK.json(rr) + " layers " + cm.numLayers + " fx [" + fxs.join(", ") + "] animators [" + ans.join(", ") + "]");
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
})();

// Photo Burst (cr05): a 1920x1080 comp WR_burst with 6 coloured 500x500 "photos", Photo Burst built on them with
// Count 21 (like the reference) (UK.comp pointed at the test comp), logs layers / expression errors / the last card,
// renders frames to out/burst/ (white solid under it, like the reference).
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "burst"); if (!fo.exists) fo.create();
    var out = new File(OUT + "burst/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var CNT = $.global.BURST_COUNT === -1 ? 0 : ($.global.BURST_COUNT || 33), CW = $.global.BURST_W || 1920, CH = $.global.BURST_H || 1080;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var c = app.project.items.addComp("WR_burst", CW, CH, 1, 6, 30);
        UK._fd = c.frameDuration;
        var cols = [[0.85, 0.25, 0.3], [0.2, 0.55, 0.95], [0.95, 0.75, 0.2], [0.25, 0.8, 0.45], [0.6, 0.3, 0.9], [0.3, 0.3, 0.35]];
        for (var i = 0; i < cols.length; i++) {
            var pc = app.project.items.addComp("WR_photo" + (i + 1), 500, 500, 1, 6, 30);
            pc.layers.addSolid(cols[i], "bg", 500, 500, 1);
            UK.addText(pc, String(i + 1), { size: 260 });
            c.layers.add(pc);
        }
        for (i = 1; i <= c.numLayers; i++) c.layer(i).selected = true;
        c.time = 0;
        keep = UK.comp; UK.comp = function () { return c; };
        var r = UK.api.carousel({ id: "cr05", bs: { count: CNT } });
        UK.comp = keep; keep = null;
        out.writeln("made " + UK.json(r));
        var bgL = c.layers.addSolid([0.93, 0.93, 0.93], "WR_bg", CW, CH, 1); bgL.moveToEnd();
        var P = null; for (i = 1; i <= c.numLayers; i++) if (c.layer(i).source instanceof CompItem && c.layer(i).source.name.indexOf("Photo Burst") === 0) P = c.layer(i).source;
        out.writeln("precomp " + P.name + " " + P.width + "x" + P.height + " dur " + UK.round(P.duration, 2) + " layers " + P.numLayers + " first [" + P.layer(1).name + ", " + P.layer(2).name + ", " + P.layer(3).name + "] bottom " + P.layer(P.numLayers).name);
        var LIc = P.layer(1).source, ls = []; for (i = 1; i <= LIc.numLayers; i++) ls.push(LIc.layer(i).name + (LIc.layer(i).enabled ? "" : " (off)") + " fx" + LIc.layer(i).property("ADBE Effect Parade").numProperties);
        out.writeln("Last Image " + LIc.width + "x" + LIc.height + " [" + ls.join(", ") + "] posSeparated " + P.layer(3).property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated);
        var errs = [], walk = function (p, path) { for (var jj = 1; jj <= p.numProperties; jj++) { var y = p.property(jj); if (y.propertyType === PropertyType.PROPERTY) { try { if (y.canSetExpression && y.expression !== "") { y.valueAtTime(1.5, false); if (y.expressionError) errs.push(path + "/" + y.name + ": " + y.expressionError); } } catch (e9) { } } else walk(y, path + "/" + y.name); } };
        for (i = 1; i <= P.numLayers; i++) walk(P.layer(i), P.layer(i).name);
        out.writeln("errors " + errs.length + " " + errs.slice(0, 6).join(" ; "));
        var LL = P.layer(1), T = [2.0, 2.3, 2.6, 2.9, 3.1, 3.3, 3.5], s = "last:";
        for (i = 0; i < T.length; i++) s += " " + T[i] + "=" + UK.round(UK.pos(LL).valueAtTime(T[i], false)[0], 0) + "," + UK.round(UK.pos(LL).valueAtTime(T[i], false)[1], 0) + "/" + UK.round(UK.scale(LL).valueAtTime(T[i], false)[0], 0);
        out.writeln(s);
        var L2 = P.layer(3); s = "card1:";
        for (i = 0; i <= 18; i++) { var tt = i * 0.1; s += " " + UK.round(tt, 1) + "=" + UK.round(UK.pos(L2).valueAtTime(tt, false)[0], 0) + "," + UK.round(UK.pos(L2).valueAtTime(tt, false)[1], 0) + "/" + UK.round(UK.scale(L2).valueAtTime(tt, false)[0], 0); }
        out.writeln(s);
        s = "rot:"; for (i = 3; i <= 14; i++) { var Rz = UK.rot(P.layer(i)), X0 = P.layer(i).property("ADBE Transform Group").property("ADBE Position_0"); s += " [x" + UK.round(X0.keyValue(X0.numKeys) / P.width, 2) + " " + UK.round(Rz.keyValue(1), 0) + ">" + UK.round(Rz.keyValue(2), 0) + ">" + UK.round(Rz.keyValue(3), 0) + "]"; }
        out.writeln(s);
        var sh = UK.efx(L2, "Shadow"); out.writeln("shadow op " + sh.property(2).value + " (max " + sh.property(2).maxValue + ") dist " + sh.property(4).value + " soft " + sh.property(5).value);
        var NC = P.layer("Photo Burst Controls"), cnt = UK.efx(NC, "Count").property(1), n0 = cnt.value, lp = function () { return UK.round(UK.pos(LL).valueAtTime(2.9, false)[1], 0); };
        s = "count " + n0 + ": card" + n0 + " op " + UK.opac(P.layer(n0 + 3)).valueAtTime(1, false) + ", card" + (n0 - 1) + " op " + UK.opac(P.layer(n0 + 2)).valueAtTime(1, false) + ", last y@2.9 " + lp();
        cnt.setValue(12); s += " | count 12: card12 op " + UK.opac(P.layer(15)).valueAtTime(1, false) + ", card11 op " + UK.opac(P.layer(14)).valueAtTime(1, false) + ", last y@2.9 " + lp();
        cnt.setValue(n0 + 10); s += " | count " + (n0 + 10) + ": card" + (n0 + 9) + " op " + UK.opac(P.layer(n0 + 12)).valueAtTime(1, false) + ", last y@2.9 " + lp();
        cnt.setValue(n0); out.writeln(s);
        var RF = [2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 66, 72, 78, 84, 88, 92, 96, 100, 104, 108, 112];
        for (i = 0; i < RF.length; i++) renders.push([c, RF[i] / 30, OUT + "burst/f" + ("000" + RF[i]).slice(-3) + ".png"]);
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();


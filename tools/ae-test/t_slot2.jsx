// Plugin Slot icon / dot switches: builds the card in WR_slot2 (all on), then 3 copies of its precomp with Show Icon /
// Show Dot switched off on the Controls null (after Apply), logs expression errors, renders the hold to out/slot2/.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "slot2"); if (!fo.exists) fo.create();
    var out = new File(OUT + "slot2/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [];
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var host = app.project.items.addComp("WR_slot2", 1920, 1080, 1, 6, 30);
        UK._fd = host.frameDuration;
        var L = UK.SLOT.build(host, { id: "cd31", text: "HIGH-PASS", inDur: 0.9, hold: 2.5, outDur: 0.8 }, 0), C = L.source;
        var errs = [], walk = function (p, path) { for (var jj = 1; jj <= p.numProperties; jj++) { var y = p.property(jj); if (y.propertyType === PropertyType.PROPERTY) { try { if (y.canSetExpression && y.expression !== "") { y.valueAtTime(2, false); if (y.expressionError) errs.push(path + "/" + y.name + ": " + y.expressionError); } } catch (e9) { } } else walk(y, path + "/" + y.name); } };
        for (var i = 1; i <= C.numLayers; i++) walk(C.layer(i), C.layer(i).name);
        var fx = [], E = C.layer("Controls").property("ADBE Effect Parade");
        for (i = 1; i <= E.numProperties; i++) fx.push(E.property(i).name);
        out.writeln("controls [" + fx.join(", ") + "] errors " + errs.length + " " + errs.join(" ; "));
        renders.push([host, 2, OUT + "slot2/a_both.png"]);
        var vars = [["b_nodot", 1, 0], ["c_noicon", 0, 1], ["d_none", 0, 0]];
        for (var k = 0; k < vars.length; k++) {
            var h2 = host.duplicate(); h2.name = "WR_slot2_" + vars[k][0];
            var C2 = C.duplicate(); C2.name = C.name + " " + vars[k][0];
            h2.layer(1).replaceSource(C2, false);
            var E2 = C2.layer("Controls").property("ADBE Effect Parade");
            E2.property("Show Icon").property(1).setValue(vars[k][1]);
            E2.property("Show Dot").property(1).setValue(vars[k][2]);
            renders.push([h2, 2, OUT + "slot2/" + vars[k][0] + ".png"]);
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var r = 0; r < renders.length; r++) renders[r][0].saveFrameToPng(renders[r][1], new File(renders[r][2]));
})();

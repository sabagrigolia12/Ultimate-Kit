// Removes the UKDUMP_dg* probe comps and the solids that only they used, then a Solids folder left empty.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/cleanup_dg.txt"); o.open("w");
    var srcs = [], i, j, n = 0;
    for (i = app.project.numItems; i >= 1; i--) {
        var it = app.project.item(i);
        if (it instanceof CompItem && /^UKDUMP_dg\d*$/.test(it.name)) {
            for (j = 1; j <= it.numLayers; j++) if (it.layer(j).source) srcs.push(it.layer(j).source);
            it.remove(); n++;
        }
    }
    for (i = 0; i < srcs.length; i++) { try { if (srcs[i].usedIn.length === 0 && srcs[i].mainSource instanceof SolidSource) { srcs[i].remove(); n++; } } catch (e) { } }
    o.write("removed " + n + ", items " + app.project.numItems); o.close();
})();

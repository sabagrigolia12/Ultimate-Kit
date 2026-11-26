// Removes unused solids / nulls left by SaaS background tests, then empty Solids / Backgrounds folders.
(function () {
    var p = app.project, i, n = 0;
    for (i = p.numItems; i >= 1; i--) {
        var it = p.item(i);
        if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.usedIn.length === 0 && /^(Flow \d+|Smoke \d+|Gradient \d+|Ramp \d+|Fluted Glass|Null \d+|bg|x)$/.test(it.name)) { it.remove(); n++; }
    }
    for (i = p.numItems; i >= 1; i--) {
        var f = p.item(i);
        if (f instanceof FolderItem && (f.name === "Solids" || f.name === "Backgrounds") && f.numItems === 0) { f.remove(); n++; }
    }
    var o = new File("D:/Projects/Codex/tools/ae-test/out/cleanup.txt"); o.open("w"); o.write("removed " + n + ", left " + p.numItems); o.close();
})();

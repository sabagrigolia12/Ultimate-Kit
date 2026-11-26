// Removes the Graphics TEST items that got saved into the user's project (2026-11-26): the comp(s) "WR_gfx_*", the
// graphic precomps that only those test comps use, the "Background" solids nothing uses any more, then the "Graphics"
// folder if it is empty. A graphic the user applied into one of their own comps is kept. -> out/gfx_purge.txt
(function () {
    var gone = [], keep = [], i, k;
    var test = function (c) { return c instanceof CompItem && /^WR_gfx_/.test(c.name); };
    for (i = app.project.numItems; i >= 1; i--) {
        var it = app.project.item(i);
        if (!(it instanceof CompItem) || String(it.comment).indexOf("Ultimate Kit Graphic:") !== 0) continue;
        var others = 0;
        for (k = 0; k < it.usedIn.length; k++) if (!test(it.usedIn[k])) others++;
        if (others) { keep.push(it.name); continue; }
        gone.push("graphic " + it.name); it.remove();
    }
    for (i = app.project.numItems; i >= 1; i--) { var c = app.project.item(i); if (test(c)) { gone.push("comp " + c.name); c.remove(); } }
    for (i = app.project.numItems; i >= 1; i--) {
        var s = app.project.item(i);
        if (s instanceof FootageItem && s.mainSource instanceof SolidSource && s.usedIn.length === 0 && s.name === "Background") { gone.push("solid " + s.name); s.remove(); }
    }
    for (i = app.project.numItems; i >= 1; i--) { var f = app.project.item(i); if (f instanceof FolderItem && f.name === "Graphics" && f.numItems === 0) { gone.push("folder Graphics"); f.remove(); } }
    var o = new File("D:/Projects/Codex/tools/ae-test/out/gfx_purge.txt"); o.encoding = "UTF-8"; o.open("w");
    o.writeln("project " + (app.project.file ? decodeURI(app.project.file.name) : "(unsaved)") + " | removed " + gone.length + " | kept (used by the user's comps) " + keep.length + " " + keep.join(", ") + " | items now " + app.project.numItems);
    o.close();
})();

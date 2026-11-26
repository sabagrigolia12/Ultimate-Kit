// Removes what t_gfx.jsx built in THIS session only: items that did not exist before the build ($.global.GFX_BEFORE)
// and are clearly test items: the WR_gfx comps, graphic precomps (comment "Ultimate Kit Graphic:"), the unused solids
// they made, and then the folders they made if empty. Anything else new (the user's own work) is left alone.
(function () {
    var bf = $.global.GFX_BEFORE || {}, gone = [], i, pass;
    var isNew = function (it) { return !bf[it.id]; };
    for (pass = 0; pass < 3; pass++) {
        for (i = app.project.numItems; i >= 1; i--) {
            var it = app.project.item(i);
            if (!isNew(it)) continue;
            if (it instanceof CompItem && (/^WR_gfx_/.test(it.name) || String(it.comment).indexOf("Ultimate Kit Graphic:") === 0)) { gone.push("comp " + it.name); it.remove(); continue; }
            if (pass >= 1 && it instanceof FootageItem && it.usedIn.length === 0 && it.mainSource instanceof SolidSource) { gone.push("solid " + it.name); it.remove(); continue; }
            if (pass >= 2 && it instanceof FolderItem && it.numItems === 0 && /^(Graphics|Ultimate Kit|Solids)$/.test(it.name)) { gone.push("folder " + it.name); it.remove(); }
        }
    }
    var f = new File("D:/Projects/Codex/tools/ae-test/out/gfx_clean.txt"); f.encoding = "UTF-8"; f.open("w"); f.writeln("removed " + gone.length + " | items now " + app.project.numItems + "\n" + gone.slice(0, 40).join("\n")); f.close();
})();

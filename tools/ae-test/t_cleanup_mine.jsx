// Removes only items created by the test harness (ST_/GB_/CN_ comps, their "bg" solids,
// generated helper comps); everything else in the project is left untouched.
(function () {
    var p = app.project, i, removed = 0;
    // Ultimate Kit precomps (text wraps, SaaS backgrounds) that are used only inside test comps
    for (i = p.numItems; i >= 1; i--) {
        var u = p.item(i);
        if (!(u instanceof CompItem) || !u.usedIn.length) continue;
        if (u.comment !== "UK text precomp" && u.name.indexOf("BG SaaS - ") !== 0) continue;
        var mine = true;
        for (var k = 0; k < u.usedIn.length; k++) if (!/^(ST_|GB_|CN_|SB_|DDTEST)/.test(u.usedIn[k].name)) mine = false;
        if (mine) { u.remove(); removed++; }
    }
    for (i = p.numItems; i >= 1; i--) {
        var it = p.item(i);
        if (it instanceof CompItem && /^(ST_|GB_|CN_|SB_|DDTEST)/.test(it.name)) { it.remove(); removed++; }
    }
    for (i = p.numItems; i >= 1; i--) {
        var s = p.item(i);
        if (s instanceof FootageItem && s.mainSource instanceof SolidSource && (s.name === "bg" || s.name === "x") && s.usedIn.length === 0) { s.remove(); removed++; }
    }
    for (i = p.numItems; i >= 1; i--) {
        var f = p.item(i);
        if (f instanceof FolderItem && (f.name === "Solids" || f.name === "Ultimate Kit" || f.name === "Text") && f.numItems === 0) { f.remove(); removed++; }
    }
    var o = new File("D:/Projects/Codex/tools/ae-test/out/cleanup.txt"); o.open("w"); o.write("removed " + removed + ", left " + p.numItems); o.close();
})();


(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/rm.txt"); out.open("w");
    var n = app.project.itemByID(225); if (n && n.name === "Null 2" && n.usedIn.length === 0) { n.remove(); out.writeln("removed Null 2"); } else out.writeln("kept Null 2");
    var f = app.project.itemByID(221); if (f && f instanceof FolderItem && f.name === "Ultimate Kit" && f.numItems === 0) { f.remove(); out.writeln("removed empty Ultimate Kit folder"); } else out.writeln("kept folder (" + (f ? f.numItems : "?") + " items)");
    out.writeln("left " + app.project.numItems); out.close();
})();
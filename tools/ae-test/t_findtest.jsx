// Read only: lists project items whose names look like test items (WR_, ST_, ...), with id, type and usedIn count.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/findtest.txt"); o.encoding = "UTF-8"; o.open("w");
    var TEST = /^(WR_|ST_|SB_|UL_|LT_|TR_|CD_|DR_|T \(UK\)$|Ultimate Kit$)/;
    o.writeln("project '" + (app.project.file ? app.project.file.fsName : "untitled") + "' items " + app.project.numItems);
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (TEST.test(it.name)) o.writeln(it.id + "|" + it.name + " | " + it.typeName + (it instanceof CompItem ? " layers " + it.numLayers + " usedIn " + it.usedIn.length : ""));
    }
    o.close();
})();

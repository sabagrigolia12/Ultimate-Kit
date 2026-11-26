// Lists the project items (read only).
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/list.txt"); o.encoding = "UTF-8"; o.open("w");
    for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); o.writeln(it.id + " | " + it.name + " | " + it.typeName + (it.parentFolder ? " | in " + it.parentFolder.name : "")); }
    o.close();
})();

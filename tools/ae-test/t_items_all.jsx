(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/items_all.txt"); out.open("w");
    for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); out.writeln(it.id + " | " + it.name + " | " + it.typeName + " | in " + (it.parentFolder ? it.parentFolder.name : "")); }
    out.writeln("file: " + (app.project.file ? app.project.file.fsName : "(unsaved)"));
    out.close();
})();
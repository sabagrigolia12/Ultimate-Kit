// READ ONLY: every project item (id | type | name | parent folder | used in) -> out/items.txt
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/items.txt"); o.encoding = "UTF-8"; o.open("w");
    o.writeln("project " + (app.project.file ? decodeURI(app.project.file.name) : "(unsaved)") + " items " + app.project.numItems);
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i), ty = "footage";
        if (it instanceof CompItem) ty = "comp"; else if (it instanceof FolderItem) ty = "folder";
        var u = ""; try { if (!(it instanceof FolderItem)) u = " usedIn " + it.usedIn.length; } catch (e) { }
        o.writeln(it.id + " | " + ty + " | " + it.name + " | in " + (it.parentFolder ? it.parentFolder.name + " (" + it.parentFolder.id + ")" : "-") + u);
    }
    o.close();
})();

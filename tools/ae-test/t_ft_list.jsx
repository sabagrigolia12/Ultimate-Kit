// Read only: every item of the open project. Result in out/ft_list.txt.
(function () {
    var out = [], q;
    out.push("project " + (app.project.file ? decodeURI(app.project.file.name) : "(unsaved)") + " items " + app.project.numItems + " dirty " + app.project.dirty);
    for (q = 1; q <= app.project.numItems; q++) {
        var it = app.project.item(q), used = "";
        try { used = " usedIn " + it.usedIn.length; } catch (e) { }
        out.push(it.id + " | " + it.name + " | " + it.typeName + used + " | in " + it.parentFolder.name);
    }
    var f = new File("D:/Projects/Codex/tools/ae-test/out/ft_list.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(out.join("\r\n")); f.close();
})();

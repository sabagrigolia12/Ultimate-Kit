(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/projstate.txt"); o.open("w");
    o.writeln("items " + app.project.numItems + " file " + (app.project.file ? app.project.file.fsName : "(unsaved)") + " dirty? active=" + (app.project.activeItem ? app.project.activeItem.name : "none"));
    o.close();
})();
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var before = {}, q; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var c = app.project.items.addComp("WR_dnd", 1920, 1080, 1, 6, 30);
    var S = c.layers.addSolid([0.2, 0.3, 0.6], "Solid NOT text", 600, 300, 1);
    var T = c.layers.addText("Drop here"); T.name = "Text TARGET";
    var td = T.property("ADBE Text Properties").property("ADBE Text Document"), d = td.value; d.fontSize = 120; d.fillColor = [1, 1, 1]; td.setValue(d);
    T.property("ADBE Transform Group").property("ADBE Position").setValue([960, 540]);
    c.openInViewer();
    var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close();
})();

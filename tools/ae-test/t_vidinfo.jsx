// Read only: the active comp's layers and every footage item (file, size, duration, fps).
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/vidinfo.txt"); out.encoding = "UTF-8"; out.open("w");
    try {
        var a = app.project.activeItem;
        out.writeln("active " + (a ? a.name + " " + a.width + "x" + a.height + " dur " + a.duration + " fps " + a.frameRate : "-"));
        if (a instanceof CompItem) for (var i = 1; i <= a.numLayers; i++) {
            var L = a.layer(i);
            out.writeln("  layer " + i + " '" + L.name + "' src " + (L.source ? "'" + L.source.name + "' " + (L.source.file ? L.source.file.fsName : "") : "-") + " in " + L.inPoint + " out " + L.outPoint + " start " + L.startTime + " enabled " + L.enabled);
        }
        for (i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof FootageItem) out.writeln("footage '" + it.name + "' " + it.width + "x" + it.height + " dur " + it.duration + " fps " + it.frameRate + " file " + (it.file ? it.file.fsName : "-"));
            else if (it instanceof CompItem) out.writeln("comp '" + it.name + "' " + it.width + "x" + it.height + " dur " + it.duration);
        }
    } catch (e) { out.writeln("ERR " + e); }
    out.close();
})();

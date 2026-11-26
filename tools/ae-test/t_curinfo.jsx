// Read only: every Cursor precomp in the project - size, duration, the CLICK CONTROLS values and its effect layers.
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/curinfo.txt"); out.encoding = "UTF-8"; out.open("w");
    try {
        out.writeln("project '" + (app.project.file ? app.project.file.fsName : "untitled") + "' items " + app.project.numItems + " active " + (app.project.activeItem ? app.project.activeItem.name : "-"));
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (!(it instanceof CompItem)) continue;
            var N = null; for (var j = 1; j <= it.numLayers; j++) if (it.layer(j).name === "CLICK CONTROLS") N = it.layer(j);
            if (!N) { out.writeln("comp '" + it.name + "' " + it.width + "x" + it.height + " layers " + it.numLayers); continue; }
            var E = N.property("ADBE Effect Parade"), s = "";
            for (j = 1; j <= E.numProperties; j++) { try { s += E.property(j).name + "=" + E.property(j).property(1).value + "; "; } catch (e1) { s += E.property(j).name + "=?; "; } }
            var ls = []; for (j = 1; j <= it.numLayers; j++) ls.push(it.layer(j).name + (it.layer(j).parent ? "^" : ""));
            var sc = N.property("ADBE Transform Group").property("ADBE Scale");
            out.writeln("CURSOR '" + it.name + "' " + it.width + "x" + it.height + " dur " + it.duration + " fps " + it.frameRate + " | " + s + "| scale expr: " + sc.expression.replace(/\n/g, " ") + " | layers: " + ls.join(", "));
        }
    } catch (e) { out.writeln("ERR " + e + " " + e.line); }
    out.close();
})();

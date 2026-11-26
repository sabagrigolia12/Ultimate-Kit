// READ ONLY: every comp's layers with their timing and source (name, size, duration, fps) to out/lyrtime2.txt.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/lyrtime2.txt"); o.encoding = "UTF-8"; o.open("w");
    o.writeln("project: " + (app.project.file ? app.project.file.fsName : "(unsaved)") + " dirty " + app.project.dirty + " items " + app.project.numItems + " active " + (app.project.activeItem ? app.project.activeItem.name : "none"));
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (!(it instanceof CompItem)) { o.writeln("item '" + it.name + "' " + it.typeName + (it instanceof FootageItem && it.mainSource && !(it.mainSource instanceof SolidSource) ? " " + it.width + "x" + it.height + " dur " + it.duration + " fps " + it.frameRate : "")); continue; }
        o.writeln("COMP '" + it.name + "' " + it.width + "x" + it.height + " dur " + it.duration + " fps " + it.frameRate + " res " + it.resolutionFactor.join("x"));
        for (var j = 1; j <= it.numLayers; j++) {
            var L = it.layer(j);
            var s = "   L" + j + " '" + L.name + "'"; try { s += " start " + L.startTime + " in " + L.inPoint + " out " + L.outPoint; } catch (e1) { s += " (times ?)"; } try { s += " stretch " + L.stretch; } catch (e2) { } try { s += " enabled " + L.enabled + (L.source ? " src '" + L.source.name + "'" : ""); } catch (e3) { } try { s += " remap " + L.timeRemapEnabled; } catch (e4) { } try { s += " scale " + L.property("ADBE Transform Group").property("ADBE Scale").value; } catch (e5) { } o.writeln(s);
        }
    }
    o.close();
})();

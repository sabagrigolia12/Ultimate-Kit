// READ ONLY: lists every project item (type, folder, size, fps, duration, footage file) and each comp's layers
// (name, source item, blend, effects) -> out/projtree.txt.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/projtree.txt"); o.encoding = "UTF-8"; o.open("w");
    var P = app.project, i, j;
    try { o.writeln("file " + (P.file ? P.file.fsName : "-") + " bpc " + P.bitsPerChannel + " items " + P.numItems + " linearBlending " + P.linearBlending + " ws '" + P.workingSpace + "'"); } catch (e) { }
    for (i = 1; i <= P.numItems; i++) {
        var it = P.item(i), s = i + " id=" + it.id + " [" + it.typeName + "] '" + it.name + "' folder='" + (it.parentFolder ? it.parentFolder.name : "") + "'";
        try { if (it instanceof CompItem || it instanceof FootageItem) s += " " + it.width + "x" + it.height + " par " + it.pixelAspect + " dur " + it.duration + " fps " + it.frameRate; } catch (e1) { }
        try { if (it instanceof FootageItem) { s += " src=" + (it.file ? it.file.fsName : (it.mainSource instanceof SolidSource ? "solid " + it.mainSource.color.toString() : "?")); } } catch (e2) { }
        try { if (it instanceof CompItem) s += " bg " + it.bgColor.toString() + " layers " + it.numLayers + " workStart " + it.workAreaStart + " workDur " + it.workAreaDuration; } catch (e3) { }
        o.writeln(s);
        if (it instanceof CompItem) {
            for (j = 1; j <= it.numLayers; j++) {
                var L = it.layer(j), ls = "    " + j + " '" + L.name + "'";
                try { if (L.source) ls += " src='" + L.source.name + "' (id " + L.source.id + ")"; } catch (e4) { }
                try { ls += " type=" + L.matchName; } catch (e5) { }
                try { var fx = L.property("ADBE Effect Parade"), a = []; for (var k = 1; k <= fx.numProperties; k++) a.push(fx.property(k).name + "<" + fx.property(k).matchName + ">"); if (a.length) ls += " fx: " + a.join(", "); } catch (e6) { }
                o.writeln(ls);
            }
        }
    }
    o.close();
})();

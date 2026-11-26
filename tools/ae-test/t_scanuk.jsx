// Read only: every layer in the project carrying Ultimate Kit animators / effects (UK ...) or a UKMarker effect,
// plus the active comp, its selection and the current tool.
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/scanuk.txt"); out.encoding = "UTF-8"; out.open("w");
    try {
        var a = app.project.activeItem;
        out.writeln("active " + (a ? a.name : "none") + " sel " + (a && a.selectedLayers ? a.selectedLayers.length : 0) + " tool " + app.project.toolType);
        for (var i = 1; i <= app.project.numItems; i++) {
            var c = app.project.item(i); if (!(c instanceof CompItem)) continue;
            out.writeln("comp '" + c.name + "' layers " + c.numLayers);
            for (var j = 1; j <= c.numLayers; j++) {
                var L = c.layer(j), tags = [];
                var E = L.property("ADBE Effect Parade");
                if (E) for (var k = 1; k <= E.numProperties; k++) tags.push("fx:" + E.property(k).name);
                if (L instanceof TextLayer) { var A = L.property("ADBE Text Properties").property("ADBE Text Animators"); for (k = 1; k <= A.numProperties; k++) tags.push("an:" + A.property(k).name); }
                out.writeln("   " + j + " " + L.name + (L.selected ? " [selected]" : "") + " " + tags.join(", "));
            }
        }
    } catch (e) { out.writeln("ERR " + e); }
    out.close();
})();

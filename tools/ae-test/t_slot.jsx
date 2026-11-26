// Builds the Plugin Slot card (UK.SLOT.build) once per icon into WR_slot_<n> host comps (1920x1080, 30 fps, 6 s),
// logs layers / expression errors / the card size, renders 0.3 s and 1.2 s to out/slot/i<n>_<t>.png.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "slot"); if (!fo.exists) fo.create();
    var out = new File(OUT + "slot/t_slot_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [];
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "' font " + UK.SLOT.font());
        var texts = ["HIGH-PASS", "DOWNWARD EXPANDER", "DE-ESSER", "Compressor", "LIMITER"];
        for (var n = 1; n <= 5; n++) {
            var c = app.project.items.addComp("WR_slot_" + n, 1920, 1080, 1, 6, 30);
            try {
                var L = UK.SLOT.build(c, { id: "cd31", text: texts[n - 1], slot: { icon: n } }, 0);
                var C = L.source, errs = [], names = [];
                var walk = function (p, path) { for (var j = 1; j <= p.numProperties; j++) { var x = p.property(j); if (x.propertyType === PropertyType.PROPERTY) { try { if (x.canSetExpression && x.expression !== "") { x.valueAtTime(1.2, false); if (x.expressionError) errs.push(path + "/" + x.name + ": " + x.expressionError); } } catch (e1) { } } else walk(x, path + "/" + x.name); } };
                for (var i = 1; i <= C.numLayers; i++) { names.push(C.layer(i).name); walk(C.layer(i), C.layer(i).name); }
                var sz = C.layer("Card").property("ADBE Root Vectors Group").property("Card").property("ADBE Vectors Group").property(1).property("ADBE Vector Rect Size").valueAtTime(1.2, false);
                var line = n + ""; try { line += " " + L.name; } catch (q1) { line += " name?" } try { line += " dur " + C.duration; } catch (q2) { } line += " layers " + names.join(", "); try { line += " size " + sz[0] + "x" + sz[1]; } catch (q3) { line += " size? " + q3; } line += " | errors " + errs.length; for (var ee = 0; ee < errs.length; ee++) { try { line += " ; " + errs[ee]; } catch (q4) { line += " ; ?"; } } out.writeln(line);
                renders.push([c, 0.2, OUT + "slot/i" + n + "_02.png"], [c, 0.45, OUT + "slot/i" + n + "_045.png"], [c, 1.2, OUT + "slot/i" + n + "_12.png"]);
            } catch (e) { out.writeln(n + " ERR " + e.toString() + " line " + e.line + " file " + e.fileName + " src: " + String(e.source || "").split("\n")[e.line - 1]); }
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e2) { }
    out.close();
    for (var r = 0; r < renders.length; r++) renders[r][0].saveFrameToPng(renders[r][1], new File(renders[r][2]));
})();

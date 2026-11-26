// Liquid Glass (gl03): builds it on a 1080x1920 test comp WR_liquid over a coloured solid (selected), with the
// panel defaults (UK.comp pointed at the test comp), and compares every property of the new layer with the user's
// original "Shape Layer 1" in "Comp 1" (read only). Logs differences to out/liquid/out.txt, renders frames.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "liquid"); if (!fo.exists) fo.create();
    var out = new File(OUT + "liquid/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var flat = function (L) {
        var m = {}, walk = function (p, path) {
            for (var i = 1; i <= p.numProperties; i++) {
                var y = p.property(i), nm = path + "/" + y.matchName;
                if (y.propertyType === PropertyType.PROPERTY) {
                    try {
                        if (y.propertyValueType === PropertyValueType.NO_VALUE) continue;
                        var v = y.numKeys ? "keys" + y.numKeys : y.value;
                        var s = (v instanceof Array) ? v.join(",") : (v instanceof Shape ? "shape" : String(v));
                        for (var kk = 1; kk <= y.numKeys; kk++) { var ie = y.keyInTemporalEase(kk)[0], oe = y.keyOutTemporalEase(kk)[0]; s += " |" + Math.round(y.keyTime(kk) * 1e4) / 1e4 + "=" + y.keyValue(kk).join(",") + " in" + Math.round(ie.influence * 100) / 100 + " out" + Math.round(oe.influence * 100) / 100; }
                        m[nm] = s;
                    } catch (e) { }
                } else { var en = ""; try { if (y.canSetEnabled) en = y.enabled ? "" : "(off)"; } catch (e1) { } m[nm + "#enabled"] = en; walk(y, nm); }
            }
        };
        walk(L, ""); return m;
    };
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var orig = null;
        for (q = 1; q <= app.project.numItems; q++) { var it = app.project.item(q); if (it instanceof CompItem && it.name === "Comp 1") { for (var j = 1; j <= it.numLayers; j++) { var Lj = it.layer(j); try { if (Lj.property("ADBE Effect Parade").property("Liquid Glass")) orig = Lj; } catch (e) { } } } }
        out.writeln("original: " + (orig ? orig.name + " in " + orig.containingComp.name : "not found"));
        var c = app.project.items.addComp("WR_liquid", 1080, 1920, 1, 8, 29.97);
        var bg = c.layers.addSolid([0.2, 0.45, 0.85], "WR_bg", 1080, 1920, 1), vid = null;
        for (q = 1; q <= app.project.numItems; q++) if (app.project.item(q) instanceof FootageItem && app.project.item(q).name === "asda.mp4") vid = app.project.item(q);
        var t = UK.addText(c, "GLASS", { size: 300 }); t.moveToEnd(); bg.moveToEnd();
        for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
        t.selected = true;
        if (vid) { var VL = c.layers.add(vid); VL.moveToEnd(); bg.moveToEnd(); UK.scale(VL).setValue([150, 150]); t.selected = false; VL.selected = true; t.enabled = false; }
        c.time = 0;
        keep = UK.comp; UK.comp = function () { return c; };
        var r = UK.api.glass({ id: "gl03" });
        UK.comp = keep; keep = null;
        out.writeln("made " + UK.json(r) + " srcErr " + UK.GL._srcErr);
        var L = c.layer("Liquid Glass");
        out.writeln("layer index " + L.index + " of " + c.numLayers + ", source layer = " + L.property("ADBE Effect Parade").property(1).property("TFM LiquidGlass-0001").value + " (" + c.layer(L.index + 1).name + ")");
        if (orig) {
            var A = flat(orig), Bm = flat(L), diff = [], k;
            for (k in A) if (Bm[k] !== A[k] && k.indexOf("LiquidGlass-0001") < 0 && k.indexOf("ADBE Marker") < 0) diff.push(k + "  orig=" + A[k] + "  new=" + Bm[k]);
            for (k in Bm) if (A[k] === undefined) diff.push(k + "  (only new) " + Bm[k]);
            out.writeln("differences: " + diff.length);
            for (q = 0; q < diff.length; q++) out.writeln("  " + diff[q]);
        }
        var RT = [0, 0.8, 1.5682, 3, 4.9049, 5.5];
        for (q = 0; q < RT.length; q++) renders.push([c, RT[q], OUT + "liquid/t" + Math.round(RT[q] * 100) + ".png"]);
        if (orig) { renders.push([orig.containingComp, 5.5, OUT + "liquid/orig550.png"]); renders.push([orig.containingComp, 3, OUT + "liquid/orig300.png"]); }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();

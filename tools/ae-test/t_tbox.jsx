// Applies AE's own "2D Text Box (Shape)" preset to a shape layer in a temp comp (no viewer), links a text layer,
// reads the resulting box path; the temp comp is removed after.
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/t_tbox.txt"); out.encoding = "UTF-8"; out.open("w");
    var c = null;
    try {
        c = app.project.items.addComp("TBOX_tmp", 1280, 720, 1, 2, 30);
        var T = c.layers.addText("Fresh Ingredients");
        var L = c.layers.addShape();
        L.name = "Card";
        var f = new File(Folder.appPackage.fsName + "/Presets/Shapes/Elements/2D Text Box (Shape).ffx");
        out.writeln("preset exists " + f.exists);
        L.applyPreset(f);
        var E = L.property("ADBE Effect Parade"), i;
        for (i = 1; i <= E.numProperties; i++) out.writeln("fx " + i + " " + E.property(i).name + " / " + E.property(i).matchName);
        var R = L.property("ADBE Root Vectors Group");
        for (i = 1; i <= R.numProperties; i++) out.writeln("content " + i + " " + R.property(i).name + " / " + R.property(i).matchName);
        E.property(1).property(1).setValue(T.index);
        var tb = L.property("ADBE Effect Parade").property(2);
        tb.property("Pseudo/ADBE 2D Text Box-0001").setValue(1);
        tb.property("Pseudo/ADBE 2D Text Box-0002").setValue(0.5);
        tb.property("Pseudo/ADBE 2D Text Box-0010").setValue(20);
        var P = null;
        var G = R.property("Text Box").property("ADBE Vectors Group"); for (i = 1; i <= G.numProperties; i++) { out.writeln("  in group " + i + " " + G.property(i).name + " / " + G.property(i).matchName); if (G.property(i).matchName === "ADBE Vector Shape - Group") P = G.property(i).property("ADBE Vector Shape"); }
        var sh = P.valueAtTime(0.5, false), v = sh.vertices, b = [1e9, 1e9, -1e9, -1e9];
        for (i = 0; i < v.length; i++) { b[0] = Math.min(b[0], v[i][0]); b[1] = Math.min(b[1], v[i][1]); b[2] = Math.max(b[2], v[i][0]); b[3] = Math.max(b[3], v[i][1]); }
        out.writeln("box " + b.join(", ") + " verts " + v.length + " exprErr '" + P.expressionError + "'");
        var r = T.sourceRectAtTime(0.5, false), tp = T.property("ADBE Transform Group").property("ADBE Position").value;
        out.writeln("text rect " + [r.left, r.top, r.width, r.height].join(", ") + " pos " + tp + " shape pos " + L.property("ADBE Transform Group").property("ADBE Position").value);
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { if (c) c.remove(); } catch (e3) { }
    out.close();
})();

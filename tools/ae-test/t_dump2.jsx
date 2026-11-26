// READ ONLY: for 'box animation 2' prints the blending mode names and EVERY value (defaults too) of the effects
// and of each shape group's strokes / fills / trims, to out/dump2.txt.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/dump2.txt"); o.encoding = "UTF-8"; o.open("w");
    var c = null, i, k, want = "box animation 2", nf = new File("D:/Projects/Codex/tools/ae-test/out/dump_name.txt"); if (nf.exists) { nf.open("r"); want = nf.read().replace(/^\s+|\s+$/g, ""); nf.close(); }
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === want) c = app.project.item(i);
    if (!c) { o.write("not found"); o.close(); return; }
    var bm = {}; for (k in BlendingMode) bm[BlendingMode[k]] = k;
    var tm = {}; for (k in TrackMatteType) tm[TrackMatteType[k]] = k;
    var all = function (p, ind) {
        for (var j = 1; j <= p.numProperties; j++) {
            var q = p.property(j), v = "";
            if (q.propertyType === PropertyType.PROPERTY) {
                try { if (q.propertyValueType !== PropertyValueType.NO_VALUE && q.propertyValueType !== PropertyValueType.CUSTOM_VALUE) v = " = " + q.value.toString(); else v = " (custom/none)"; } catch (e) { v = " ?"; }
                o.writeln(ind + q.name + " [" + q.matchName + "]" + v);
            } else { o.writeln(ind + q.name + " [" + q.matchName + "]" + (q.canSetEnabled && !q.enabled ? " OFF" : "")); all(q, ind + "  "); }
        }
    };
    for (i = 1; i <= c.numLayers; i++) {
        var L = c.layer(i);
        var hd = "\n### " + i + " " + L.name;
        try { hd += " blend=" + bm[L.blendingMode] + " (" + L.blendingMode + ")"; } catch (e1) { hd += " blend?"; }
        try { hd += " matte=" + tm[L.trackMatteType]; } catch (e2) { }
        try { var T = L.property("ADBE Transform Group"); hd += " opacity=" + T.property("ADBE Opacity").value + " anchor=" + T.property("ADBE Anchor Point").value.toString() + " scale=" + T.property("ADBE Scale").value.toString(); } catch (e3) { hd += " transform? " + e3; }
        o.writeln(hd);
        var fx = L.property("ADBE Effect Parade");
        for (k = 1; k <= fx.numProperties; k++) { o.writeln("  FX " + fx.property(k).name + " [" + fx.property(k).matchName + "]" + (fx.property(k).enabled ? "" : " OFF")); all(fx.property(k), "    "); }
        if (L instanceof ShapeLayer) { o.writeln("  CONTENTS"); all(L.property("ADBE Root Vectors Group"), "    "); }
        if (L instanceof TextLayer) {
            var td = L.property("ADBE Text Properties").property("ADBE Text Document").value, ts = "  TEXT";
            var tk = ["font", "fontSize", "fillColor", "applyFill", "applyStroke", "tracking", "justification", "leading", "fauxBold"];
            for (var z = 0; z < tk.length; z++) { try { ts += " " + tk[z] + "=" + td[tk[z]]; } catch (ez) { ts += " " + tk[z] + "=?"; } }
            o.writeln(ts);
        }
    }
    o.close();
})();


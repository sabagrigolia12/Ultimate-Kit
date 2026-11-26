// Can this After Effects add "TFM LiquidGlass" right now? Adds nothing to the user's comps: an own comp + shape layer, removed in the same run
// (logged first so a crash still leaves it findable). Also counts third-party effects and lists what the open project is. Result in out/glass_fx2.txt.
(function () {
    var out = [], c = null, i;
    try {
        out.push("project " + (app.project.file ? decodeURI(app.project.file.name) : "(unsaved)") + " items " + app.project.numItems + " dirty " + app.project.dirty);
        var thirdParty = [];
        for (i = 0; i < app.effects.length; i++) {
            var m = app.effects[i].matchName;
            if (!/^(ADBE|CC |CS |APC|VIDEOCOPILOT|Mettle|Boris|BCC|Cycore|ADBE)/.test(m)) thirdParty.push(app.effects[i].displayName + " | " + m);
        }
        out.push("non-Adobe effects: " + thirdParty.length);
        for (i = 0; i < thirdParty.length && i < 60; i++) out.push("  " + thirdParty[i]);
        c = app.project.items.addComp("WR_fxprobe", 200, 200, 1, 1, 30);
        var cfo = new File("D:/Projects/Codex/tools/ae-test/out/sb_created.txt"); cfo.open("a"); cfo.writeln(c.id + "|" + c.name); cfo.close();
        var S = c.layers.addShape(), P = S.property("ADBE Effect Parade");
        out.push("canAdd TFM LiquidGlass: " + P.canAddProperty("TFM LiquidGlass"));
        out.push("canAdd PEDG2: " + P.canAddProperty("PEDG2"));
        out.push("canAdd ADBE Noise2: " + P.canAddProperty("ADBE Noise2"));
        out.push("canAdd Liquid Glass (display): " + P.canAddProperty("Liquid Glass"));
    } catch (e) { out.push("ERROR " + e.message + " line " + e.line); }
    try { if (c) { c.remove(); out.push("probe comp removed, items " + app.project.numItems); } } catch (e2) { out.push("REMOVE FAILED " + e2.message); }
    var f = new File("D:/Projects/Codex/tools/ae-test/out/glass_fx2.txt");
    f.encoding = "UTF-8"; f.open("w"); f.write(out.join("\r\n")); f.close();
})();

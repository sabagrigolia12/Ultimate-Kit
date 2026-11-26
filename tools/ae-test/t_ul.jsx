// Builds every Underline preset on a text layer in UL_<id> test comps; logs errors; records created items.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "t_ul_out.txt"); out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var Ls = UK_CAT.underline;
        for (var i = 0; i < Ls.length; i++) {
            var c = app.project.items.addComp("UL_" + Ls[i].id, 1280, 720, 1, 4, 30);
            c.layers.addSolid([0.04, 0.05, 0.1], "bg", 1280, 720, 1);
            var T = UK.addText(c, "Underline me", { size: 96 });
            c.openInViewer(); c.time = 0.3;
            UK.selectOnly(c, [T]);
            var r = UK.parse(UK.call("underline", UK.json({ id: Ls[i].id, color: "#8B7CFF", dur: 0.9, mode: "in" })));
            out.writeln((r.ok ? "OK   " : "FAIL ") + Ls[i].id + " " + Ls[i].name + (r.ok ? " " + r.data.layers.join(",") : " :: " + r.error));
        }
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cf = new File(OUT + "sb_created.txt"); cf.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cf.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cf.close(); } catch (e2) { }
    out.close();
})();

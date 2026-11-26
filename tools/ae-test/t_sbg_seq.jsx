// READ ONLY: renders 60 frames (every 2nd frame, 0..4 s) of each of the user's SaaS BG comps to out/sbg/seq/<id>/f<nn>.png
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/sbg/seq/";
    var map = { sb01: "Gradient 1", sb02: "Gradient 2", sb03: "Gradient 3", sb04: "Gradient 4", sb05: "Gradient 5", sb06: "Gradient 6", sb07: "Gradient 7", sb08: "Gradient 8", sb09: "Star Gradient" };
    var comps = {}, i;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem) comps[app.project.item(i).name] = app.project.item(i);
    for (var id in map) {
        var c = comps[map[id]]; if (!c) continue;
        var d = new Folder(OUT + id); if (!d.exists) d.create();
        for (i = 0; i < 60; i++) c.saveFrameToPng(i * 2 / 30, new File(OUT + id + "/f" + (i < 10 ? "0" : "") + i + ".png"));
    }
})();

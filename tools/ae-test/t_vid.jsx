// Imports the user's screen recording, saves frames every 0.5 s, then removes the items it created.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/vid/", d = new Folder(OUT); if (!d.exists) d.create();
    var log = new File(OUT + "info.txt"); log.open("w");
    var ft = app.project.importFile(new ImportOptions(new File("D:/obs/2026-10-07 22-17-45.mp4")));
    var c = app.project.items.addComp("UKVID_tmp", ft.width, ft.height, 1, ft.duration, ft.frameRate || 30);
    c.layers.add(ft);
    log.writeln(ft.width + "x" + ft.height + " dur " + ft.duration);
    var n = 0;
    for (var t = 0; t < ft.duration; t += 0.5) { c.saveFrameToPng(t, new File(OUT + "f" + (n < 10 ? "0" : "") + (n < 100 ? "0" : "") + n + ".png")); n++; }
    log.writeln("frames " + n);
    c.remove(); ft.remove();
    log.close();
})();

// Renders the source frames of the user's 3 clips (Video-13034.mp4, ranges in seconds below) at full resolution
// through my own test comp WR_bgref (logged for cleanup); the user's comp and footage are only read.
// Frames: out/bgref/s<source frame>.png
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", before = {}, q;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var fo = new Folder(OUT + "bgref"); if (!fo.exists) fo.create();
    var src = null; for (q = 1; q <= app.project.numItems; q++) if (app.project.item(q) instanceof FootageItem && app.project.item(q).name === "Video-13034.mp4") src = app.project.item(q);
    var t = app.project.items.addComp("WR_bgref", src.width, src.height, 1, src.duration, src.frameRate);
    t.layers.add(src);
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    var R = [[0, 3.5], [3.8, 7.1], [13.8, 15.45]], fps = src.frameRate;
    for (var r = 0; r < R.length; r++) for (var f = Math.round(R[r][0] * fps); f <= Math.round(R[r][1] * fps); f++) {
        var fl = new File(fo.fsName + "/s" + ("000" + f).slice(-3) + ".png");
        if (!fl.exists) t.saveFrameToPng(f / fps, fl);
    }
})();

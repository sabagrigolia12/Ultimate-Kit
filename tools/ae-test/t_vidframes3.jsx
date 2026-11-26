// Renders every frame of the footage on the user's active comp at FULL resolution, through a temporary test comp
// of my own (WR_vidref3, logged for cleanup): the user's comp and footage are only read. Frames to out/vidref3/.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", c = app.project.activeItem, before = {}, q;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var fo = new Folder(OUT + "vidref3"); if (!fo.exists) fo.create();
    var old = fo.getFiles("*.png"); for (q = 0; q < old.length; q++) old[q].remove();
    var src = null; for (q = 1; q <= c.numLayers; q++) if (c.layer(q).source instanceof FootageItem) { src = c.layer(q).source; break; }
    var o = new File(OUT + "vidref3/info.txt"); o.open("w");
    o.writeln("footage " + src.name + " " + src.width + "x" + src.height + " fps " + src.frameRate + " dur " + src.duration + " | comp res " + c.resolutionFactor.join("x"));
    var t = app.project.items.addComp("WR_vidref3", src.width, src.height, 1, src.duration, src.frameRate);
    t.layers.add(src);
    var n = Math.round(src.duration * src.frameRate);
    o.writeln("frames " + n); o.close();
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    for (var f = 0; f < n; f++) t.saveFrameToPng(f / src.frameRate, new File(fo.fsName + "/f" + ("000" + f).slice(-3) + ".png"));
})();

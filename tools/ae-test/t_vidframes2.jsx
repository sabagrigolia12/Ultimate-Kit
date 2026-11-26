(function () {
    var c = app.project.activeItem, fo = new Folder("D:/Projects/Codex/tools/ae-test/out/vidref2"); if (!fo.exists) fo.create();
    for (var f = 0; f < Math.round(c.duration * c.frameRate); f++) c.saveFrameToPng(f / c.frameRate, new File(fo.fsName + "/f" + ("000" + f).slice(-3) + ".png"));
})();

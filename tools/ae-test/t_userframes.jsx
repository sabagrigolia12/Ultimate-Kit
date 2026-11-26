// READ ONLY: renders 'box animation 2' at frames 0, 8, 12, 16, 30, 60 to out/userref/f<n>.png.
(function () {
    var d = new Folder("D:/Projects/Codex/tools/ae-test/out/userref"); if (!d.exists) d.create();
    var c = null, i;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === "box animation 2") c = app.project.item(i);
    var fr = [0, 8, 12, 16, 30, 60];
    for (i = 0; i < fr.length; i++) c.saveFrameToPng(fr[i] * c.frameDuration, new File(d.fsName + "/f" + fr[i] + ".png"));
})();

(function () {
    var SP = "D:/Projects/Codex/tools/ae-test/out/seq/", want = { "CD_cd07": 1, "CD_cd09": 1, "CD_cd04": 1, "CD_cd24": 1 }, ts = [0.75, 0.9, 1.05, 1.2, 1.4, 1.7, 2.6, 3.4, 3.6, 3.8];
    var dir = new Folder(SP); if (!dir.exists) dir.create();
    for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (!(it instanceof CompItem) || !want[it.name]) continue;
        for (var k = 0; k < ts.length; k++) it.saveFrameToPng(ts[k], new File(SP + it.name.substr(3) + "_" + k + ".png")); }
})();

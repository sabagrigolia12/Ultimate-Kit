// Renders frames for every comp whose name starts with PREFIX (set in render_cfg.txt: prefix|outdir|t1,t2,...)
(function () {
    var SP = "D:/Projects/Codex/tools/ae-test/out/";
    var cfgF = new File(SP + "render_cfg.txt"); cfgF.open("r"); var cfg = cfgF.read().split("|"); cfgF.close();
    var prefix = cfg[0], dir = new Folder(SP + cfg[1]), ts = cfg[2].split(",");
    if (!dir.exists) dir.create();
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (!(it instanceof CompItem) || it.name.indexOf(prefix) !== 0) continue;
        for (var k = 0; k < ts.length; k++) it.saveFrameToPng(Number(ts[k]), new File(dir.fsName + "/" + it.name.substr(prefix.length) + "_" + k + ".png"));
    }
})();

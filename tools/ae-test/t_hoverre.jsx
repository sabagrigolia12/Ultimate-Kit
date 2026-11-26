(function () {
    var c = null; for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name === "WR_hover") c = app.project.item(i);
    c.saveFrameToPng(1.2, new File("D:/Projects/Codex/tools/ae-test/out/hover2/re_rect.png"));
})();

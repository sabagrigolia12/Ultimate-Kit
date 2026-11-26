(function () {
    for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === "Cursor") { it.saveFrameToPng(29 / 30, new File("D:/Projects/Codex/tools/ae-test/out/cursor2/user_f29.png")); it.saveFrameToPng(20 / 30, new File("D:/Projects/Codex/tools/ae-test/out/cursor2/user_f20.png")); } }
})();

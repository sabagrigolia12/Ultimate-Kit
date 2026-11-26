// One-off: removes the two half-built precomps left by failed test builds (unused, no comment).
(function () {
    var names = { "BG SaaS - Neon Tube": 1, "BG SaaS - Colorful Swoosh": 1 }, n = 0;
    for (var i = app.project.numItems; i >= 1; i--) {
        var it = app.project.item(i);
        if (it instanceof CompItem && names[it.name] && it.usedIn.length === 0 && it.comment === "") { it.remove(); n++; }
    }
    var o = new File("D:/Projects/Codex/tools/ae-test/out/cleanup.txt"); o.open("w"); o.write("removed " + n); o.close();
})();

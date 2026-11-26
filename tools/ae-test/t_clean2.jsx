(function () {
    var n = 0, log = new File("D:/Projects/Codex/tools/ae-test/out/clean2.txt"); log.open("w");
    for (var q = app.project.numItems; q >= 1; q--) {
        var it = app.project.item(q);
        if (it instanceof CompItem && /^(DR_dr|UK Depth Frame)/.test(it.name)) { it.remove(); n++; continue; }
        if (it instanceof FootageItem && it.file && it.file.fsName.toLowerCase().indexOf("ae-test\\lab") >= 0 && it.usedIn.length === 0) { it.remove(); n++; }
    }
    log.writeln("removed " + n + " left " + app.project.numItems); log.close();
})();
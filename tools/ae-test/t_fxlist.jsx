// Read-only: lists installed effects whose name looks like a text box / box / shape helper.
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/t_fxlist.txt"); out.encoding = "UTF-8"; out.open("w");
    try {
        var E = app.effects, n = 0;
        for (var i = 0; i < E.length; i++) {
            var e = E[i], s = (e.displayName + " | " + e.matchName + " | " + e.category);
            if (/box|text|shape|2d/i.test(s)) { out.writeln(s); n++; }
        }
        out.writeln("total effects: " + E.length + ", listed " + n);
    } catch (x) { out.writeln("ERR " + x.toString()); }
    out.close();
})();

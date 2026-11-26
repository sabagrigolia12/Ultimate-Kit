// READ ONLY: which layer styles are on, per layer of 'box animation 2'.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/styles.txt"); o.open("w");
    var c = null, i, j;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === "box animation 2") c = app.project.item(i);
    for (i = 1; i <= c.numLayers; i++) {
        var S = c.layer(i).property("ADBE Layer Styles"), s = i + " " + c.layer(i).name + ": group enabled=" + S.enabled + " canSet=" + S.canSetEnabled;
        for (j = 1; j <= S.numProperties; j++) { var p = S.property(j); try { s += " | " + p.matchName + "=" + p.enabled + (p.canSetEnabled ? "" : "(fixed)"); } catch (e) { s += " | " + p.matchName + "=?"; } }
        o.writeln(s);
    }
    o.close();
})();

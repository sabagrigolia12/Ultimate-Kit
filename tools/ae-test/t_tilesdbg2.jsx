(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/tiles/dbg2.txt"); out.encoding = "UTF-8"; out.open("w");
    var C = null;
    for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name === "Tiles - 6") C = app.project.item(i);
    var L = C.layer("Numbers"), A = L.property("ADBE Text Properties").property("ADBE Text Animators");
    for (i = 1; i <= A.numProperties; i++) {
        var sels = A.property(i).property("ADBE Text Selectors");
        for (var j = 1; j <= sels.numProperties; j++) {
            var se = sels.property(j);
            out.writeln(A.property(i).name + " / " + se.name + " / " + se.matchName);
            if (se.matchName === "ADBE Text Expressible Selector") {
                var am = se.property("ADBE Text Expressible Amount");
                out.writeln("   enabled " + am.expressionEnabled + " err: " + am.expressionError);
            }
        }
    }
    out.writeln("doc expr err: " + L.property("ADBE Text Properties").property("ADBE Text Document").expressionError);
    out.close();
})();

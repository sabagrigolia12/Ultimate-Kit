// Read only: the Numbers layer of the first "Tiles - 6" comp: source text, rect, animator selector values at 2 s.
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/tiles/dbg.txt"); out.encoding = "UTF-8"; out.open("w");
    try {
        var C = null;
        for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name === "Tiles - 6") C = app.project.item(i);
        var L = C.layer("Numbers"), t = 2;
        out.writeln("text '" + String(L.property("ADBE Text Properties").property("ADBE Text Document").valueAtTime(t, false).text).replace(/\r/g, "|") + "' enabled " + L.enabled + " opacity " + L.property("ADBE Transform Group").property("ADBE Opacity").value);
        try { var r = L.sourceRectAtTime(t, false); out.writeln("rect " + r.left + "," + r.top + " " + r.width + "x" + r.height + " pos " + L.property("ADBE Transform Group").property("ADBE Position").value); } catch (eR) { out.writeln("rect ERR " + eR); }
        var A = L.property("ADBE Text Properties").property("ADBE Text Animators");
        for (i = 1; i <= A.numProperties; i++) {
            var an = A.property(i), sels = an.property("ADBE Text Selectors"), s = an.name + ":";
            for (var j = 1; j <= sels.numProperties; j++) { var se = sels.property(j); s += " sel " + se.name + " (" + se.matchName + ")"; try { var am = se.property("ADBE Text Expressible Amount"); s += " err '" + am.expressionError + "'"; s += " amt " + am.valueAtTime(t, false); } catch (e2) { s += " EX " + e2; } }
            out.writeln(s);
        }
        var E = L.property("ADBE Effect Parade"); for (i = 1; i <= E.numProperties; i++) out.writeln("fx " + E.property(i).name);
    } catch (e) { out.writeln("ERR " + e + " " + e.line); }
    out.close();
})();

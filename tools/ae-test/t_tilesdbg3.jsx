(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var out = new File(OUT + "tiles/dbg3.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var C = null;
    for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name === "Tiles - 6") C = app.project.item(i);
    var D = C.duplicate(); D.name = "WR_dbg_tiles";
    var L = D.layer("Numbers"), A = L.property("ADBE Text Properties").property("ADBE Text Animators");
    var test = function (label) { try { var r = L.sourceRectAtTime(2, false); out.writeln(label + ": rect " + Math.round(r.left) + "," + Math.round(r.top) + " " + Math.round(r.width) + "x" + Math.round(r.height)); } catch (e) { out.writeln(label + ": ERR"); } };
    test("all");
    A.property("UK Scale").enabled = false; test("no scale");
    A.property("UK Scale").enabled = true; A.property("UK Place").enabled = false; test("no place");
    A.property("UK Scale").enabled = false; test("none");
    var fx = L.property("ADBE Effect Parade"); fx.property(1).enabled = false; test("none, no fill fx");
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
})();

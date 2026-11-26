// Glow / accent controls after Apply: st16, st11, st12, st15, st05 on new text layers in WR_gc_<id>; logs the UK
// controls on the text layer, expression errors (text + helpers), x.egp; flips "UK Accent On" off on st05 and renders
// both states; renders st11 / st16 mid-animation to out/glowctl/.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "glowctl"); if (!fo.exists) fo.create();
    var out = new File(OUT + "glowctl/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [];
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var ids = ["st16", "st11", "st12", "st15", "st05"], txt = { st15: "$110,000+" };
        for (var k = 0; k < ids.length; k++) {
            var id = ids[k], c = app.project.items.addComp("WR_gc_" + id, 1920, 1080, 1, 6, 30);
            UK._fd = c.frameDuration;
            var L = UK.addText(c, txt[id] || "Value Created", { name: "T", size: 140 });
            L.startTime = 0; L.inPoint = 0; L.outPoint = 5;
            var x = UK.TX.applyOne({ id: id }, UK.TX.P[id], c, L, 0, true, 1, 0.8, 2, "#7C5CFF", "both");
            UK.TX.egp(c, L, x);
            var E = L.property("ADBE Effect Parade"), names = [], i;
            for (i = 1; i <= E.numProperties; i++) names.push(E.property(i).name);
            var errs = [], walk = function (p, path) { for (var jj = 1; jj <= p.numProperties; jj++) { var y = p.property(jj); if (y.propertyType === PropertyType.PROPERTY) { try { if (y.canSetExpression && y.expression !== "") { y.valueAtTime(0.6, false); if (y.expressionError) errs.push(path + "/" + y.name + ": " + y.expressionError); } } catch (e9) { } } else walk(y, path + "/" + y.name); } };
            var lays = [];
            for (i = 1; i <= c.numLayers; i++) { lays.push(c.layer(i).name); walk(c.layer(i), c.layer(i).name); }
            var eg = []; if (x.egp) for (i = 0; i < x.egp.length; i++) eg.push(x.egp[i][1]);
            out.writeln(id + " layers [" + lays.join(", ") + "] fx [" + names.join(", ") + "] egp [" + eg.join(", ") + "] errors " + errs.length + " " + errs.join(" ; "));
            if (id === "st11") renders.push([c, 0.7, OUT + "glowctl/st11_07.png"]);
            if (id === "st16") renders.push([c, 0.7, OUT + "glowctl/st16_07.png"]);
            if (id === "st05") {
                renders.push([c, 0.8, OUT + "glowctl/st05_on.png"]);
                var c2 = c.duplicate(); c2.name = "WR_gc_st05_off";
                c2.layer("T").property("ADBE Effect Parade").property("UK Accent On").property(1).setValue(0);
                renders.push([c2, 0.8, OUT + "glowctl/st05_off.png"]);
            }
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var r = 0; r < renders.length; r++) renders[r][0].saveFrameToPng(renders[r][1], new File(renders[r][2]));
})();

// Ring Carousel (cr01) with the controls moved from the old Spin Carousel: Photo Size, Card Ratio, Corner, Keep
// Upright. Two builds on 800x500 "photos": defaults (ratio 0 = the photo, the old look) and ratio 100 / corner 40 /
// upright off. Logs expression errors and scales, renders frames to out/ring2/.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "ring2"); if (!fo.exists) fo.create();
    var out = new File(OUT + "ring2/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var cols = [[0.85, 0.25, 0.3], [0.2, 0.55, 0.95], [0.95, 0.75, 0.2], [0.25, 0.8, 0.45], [0.6, 0.3, 0.9], [0.3, 0.3, 0.35]];
        var build = function (nm, args) {
            var c = app.project.items.addComp(nm, 1920, 1080, 1, 4, 30), i;
            c.layers.addSolid([0.93, 0.93, 0.93], "WR_bg", 1920, 1080, 1);
            for (i = 0; i < cols.length; i++) {
                var pc = app.project.items.addComp("WR_rphoto" + (i + 1), 800, 500, 1, 4, 30);
                pc.layers.addSolid(cols[i], "bg", 800, 500, 1);
                UK.addText(pc, String(i + 1), { size: 260 });
                c.layers.add(pc);
            }
            for (i = 1; i <= c.numLayers; i++) c.layer(i).selected = c.layer(i).name.indexOf("WR_rphoto") === 0;
            keep = UK.comp; UK.comp = function () { return c; };
            var r = UK.api.carousel(args);
            UK.comp = keep; keep = null;
            var errs = [], walk = function (p, path) { for (var jj = 1; jj <= p.numProperties; jj++) { var y = p.property(jj); if (y.propertyType === PropertyType.PROPERTY) { try { if (y.canSetExpression && y.expression !== "") { y.valueAtTime(1, false); if (y.expressionError) errs.push(path + "/" + y.name + ": " + y.expressionError); } } catch (e9) { } } else walk(y, path + "/" + y.name); } };
            for (i = 1; i <= c.numLayers; i++) walk(c.layer(i), c.layer(i).name);
            var L = c.layer("WR_rphoto1"), sc = UK.scale(L).valueAtTime(1, false), mk = L.property("ADBE Mask Parade").property("Card").property("ADBE Mask Shape").valueAtTime(1, false);
            out.writeln(nm + " made " + UK.json(r) + " errors " + errs.length + " " + errs.slice(0, 4).join(" ; ") + " | scale " + UK.round(sc[0], 2) + " mask v0 " + mk.vertices[0].join(",") + " v4 " + mk.vertices[4].join(",") + " rot " + UK.round(UK.rot(L).valueAtTime(1, false), 1));
            renders.push([c, 1, OUT + "ring2/" + nm + ".png"]);
        };
        build("WR_ring_def", { id: "cr01" });
        build("WR_ring_card", { id: "cr01", ratio: 100, corner: 40, upright: false, spin: 30 });
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();

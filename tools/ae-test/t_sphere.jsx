// Sphere Carousel (cr06): builds it on a 1080x1920 test comp WR_sphere (no selection: 12 numbered proxies; or, with
// $.global.SPH_PHOTOS, 3 coloured "photos" selected and count 7), logs expression errors and, at every Focus key,
// which card is nearest the camera and where it is on screen; renders frames to out/sphere/.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "sphere"); if (!fo.exists) fo.create();
    var old = fo.getFiles("*.png"); for (var q0 = 0; q0 < old.length; q0++) old[q0].remove();
    var out = new File(OUT + "sphere/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'"); if ($.global.SPH_SIGNS) { UK.CAR.SPH_YAW = $.global.SPH_SIGNS[0]; UK.CAR.SPH_PITCH = $.global.SPH_SIGNS[1]; out.writeln('signs ' + $.global.SPH_SIGNS.join(' ')); }
        var c = app.project.items.addComp("WR_sphere", 1080, 1920, 1, 5, 30);
        c.layers.addSolid([0.02, 0.02, 0.03], "WR_bg", 1080, 1920, 1);
        var args = { id: "cr06", sp: {} };
        if ($.global.SPH_PHOTOS) {
            var cols = [[0.85, 0.25, 0.3], [0.2, 0.55, 0.95], [0.95, 0.75, 0.2]];
            for (q = 0; q < 3; q++) { var pc = app.project.items.addComp("WR_sphoto" + (q + 1), 1200, 900, 1, 5, 30); pc.layers.addSolid(cols[q], "bg", 1200, 900, 1); UK.addText(pc, "P" + (q + 1), { size: 300 }); c.layers.add(pc); }
            for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = c.layer(q).name.indexOf("WR_sphoto") === 0;
            args.sp.count = 7;
        } else for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
        c.time = 0;
        keep = UK.comp; UK.comp = function () { return c; };
        var r = UK.api.carousel(args);
        UK.comp = keep; keep = null;
        out.writeln("made " + UK.json(r) + " | main comp layers: " + c.numLayers);
        var P = null; for (q = 1; q <= c.numLayers; q++) if (c.layer(q).source instanceof CompItem && c.layer(q).source.name.indexOf("Sphere Carousel") === 0) P = c.layer(q).source;
        var ls = []; for (q = 1; q <= P.numLayers; q++) ls.push(P.layer(q).name); out.writeln("inside: " + ls.join(", "));
        var errs = [], walk = function (p, path) { for (var jj = 1; jj <= p.numProperties; jj++) { var y = p.property(jj); if (y.propertyType === PropertyType.PROPERTY) { try { if (y.canSetExpression && y.expression !== "") { y.valueAtTime(1.2, false); if (y.expressionError) errs.push(path + "/" + y.name + ": " + y.expressionError); } } catch (e9) { } } else walk(y, path + "/" + y.name); } };
        for (q = 1; q <= P.numLayers; q++) walk(P.layer(q), P.layer(q).name);
        out.writeln("errors " + errs.length + " " + errs.slice(0, 5).join(" ; "));
        var ph = P.layer("Card 1").source, pl = []; for (q = 1; q <= ph.numLayers; q++) pl.push(ph.layer(q).name + (ph.layer(q).enabled ? "" : "(off)") + " matte:" + ph.layer(q).trackMatteType); out.writeln(ph.name + " " + ph.width + "x" + ph.height + ": " + pl.join(", "));
        /* a probe: every card's comp position / depth */
        var nCards = 0; for (q = 1; q <= P.numLayers; q++) if (P.layer(q).name.indexOf("Card ") === 0) nCards++;
        var pr = P.layers.addNull(); pr.name = "WR_probe"; pr.threeDLayer = true;
        var Fk = P.layer("Carousel Controls").property("ADBE Effect Parade").property("Focus").property(1);
        for (var kk = 1; kk <= Fk.numKeys; kk++) {
            var tt = Fk.keyTime(kk) + 0.01, best = null, bz = 1e9;
            for (var ci = 1; ci <= nCards; ci++) {
                UK.pos(pr).expression = 'thisComp.layer("Card ' + ci + '").toWorld(thisComp.layer("Card ' + ci + '").anchorPoint)';
                var v = UK.pos(pr).valueAtTime(tt, false);
                if (v[2] < bz) { bz = v[2]; best = [ci, Math.round(v[0]), Math.round(v[1]), Math.round(v[2])]; }
            }
            out.writeln("key " + kk + " t=" + UK.round(Fk.keyTime(kk), 2) + " focus=" + Fk.keyValue(kk) + " -> front card " + best.join(" / "));
        }
        pr.remove();
        var RT = [0, 0.1, 0.2, 0.33, 0.5, 0.7, 0.8, 0.9, 1.0, 1.2, 1.6, 1.8, 2.1];
        for (q = 0; q < RT.length; q++) renders.push([c, RT[q], OUT + "sphere/t" + ("00" + Math.round(RT[q] * 100)).slice(-3) + ".png"]);
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();

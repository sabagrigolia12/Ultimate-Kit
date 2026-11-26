// Fill Trim end to end, step 1: own comp WR_ft, the user's footage item on it (nothing of theirs changes), its shapes built from the colours the test page traced
// (out/hlref/ft_fills.json), through UK.api.p2sBuild. Then UK.api.ftRead on that shape layer (UK.comp pointed at the comp only inside this script): out to web/ft_read.json.
// Logged in sb_created.txt, removed by t_cleanup_created.jsx. Result in out/ft_setup.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", WEB = "D:/Projects/Codex/tools/ae-test/web/", log = [], keep = UK.comp, q;
    var save = function () { var f = new File(OUT + "ft_setup.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\r\n")); f.close(); };
    try {
        log.push("project " + (app.project.file ? app.project.file.name : "(unsaved)") + " items " + app.project.numItems + " dirty " + app.project.dirty);
        var src = null;
        for (q = 1; q <= app.project.numItems; q++) { var it = app.project.item(q); if (it instanceof FootageItem && it.mainSource instanceof FileSource && it.mainSource.file && /packshot 30 weli/.test(decodeURI(it.mainSource.file.name))) src = it; }
        if (!src) throw new Error("the footage item is not in this project");
        var c = app.project.items.addComp("WR_ft", src.width, src.height, 1, 4, 30);
        var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); cfo.writeln(c.id + "|" + c.name); cfo.close();
        var L = c.layers.add(src); L.name = "WR_img";
        var jf = new File(OUT + "hlref/ft_fills.json"); jf.encoding = "UTF-8"; jf.open("r"); var cols = eval("(" + jf.read() + ")"); jf.close();
        var r = UK.api.p2sBuild({ comp: c.id, id: L.id, result: "one", colors: cols });
        log.push("built " + r.layers.join(", ") + " colours " + r.colors + " points " + r.points);
        UK.comp = function () { return c; };
        var S = c.layer(r.layers[0]);
        for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
        S.selected = true;
        var R = UK.api.ftRead();
        log.push("read: comp " + R.comp + " items " + R.items.length + " fills " + R.items[0].fills.length);
        var o = new File(WEB + "ft_read.json"); o.encoding = "UTF-8"; o.open("w"); o.write(UK.json(R)); o.close();
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    finally { UK.comp = keep; }
    save();
})();

// Fill Trim on one layer without Split: own comp WR_ft1, the shapes from out/hlref/ft_fills.json as one layer, read to web/ft_read3.json (UK.comp pointed there only inside this script).
// Logged in sb_created.txt, removed by t_cleanup_created.jsx. Result in out/ft_single.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", WEB = "D:/Projects/Codex/tools/ae-test/web/", log = [], keep = UK.comp, q;
    try {
        var src = null;
        for (q = 1; q <= app.project.numItems; q++) { var it = app.project.item(q); if (it instanceof FootageItem && it.mainSource instanceof FileSource && it.mainSource.file && /packshot 30 weli/.test(decodeURI(it.mainSource.file.name))) src = it; }
        var c = app.project.items.addComp("WR_ft1", src.width, src.height, 1, 4, 30);
        var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); cfo.writeln(c.id + "|" + c.name); cfo.close();
        var L = c.layers.add(src); L.name = "WR_img";
        var jf = new File(OUT + "hlref/ft_fills.json"); jf.encoding = "UTF-8"; jf.open("r"); var cols = eval("(" + jf.read() + ")"); jf.close();
        var r = UK.api.p2sBuild({ comp: c.id, id: L.id, result: "one", colors: cols });
        UK.comp = function () { return c; };
        var S = c.layer(r.layers[0]);
        for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
        S.selected = true;
        var R = UK.api.ftRead();
        var o = new File(WEB + "ft_read3.json"); o.encoding = "UTF-8"; o.open("w"); o.write(UK.json(R)); o.close();
        log.push("comp " + c.id + " layer " + S.name + " fills " + R.items[0].fills.length);
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    finally { UK.comp = keep; }
    var f = new File(OUT + "ft_single.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\r\n")); f.close();
})();

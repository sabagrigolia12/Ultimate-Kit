// Fill Trim end to end, step 2: out/hlref/ft_split.json through UK.api.ftSplit on my own comp, then UK.api.ftRead on the new layers (UK.comp pointed there only inside this script): web/ft_read2.json. Result in out/ft_split.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", WEB = "D:/Projects/Codex/tools/ae-test/web/", log = [], keep = UK.comp, q, c = null;
    try {
        var jf = new File(OUT + "hlref/ft_split.json"); jf.encoding = "UTF-8"; jf.open("r"); var A = eval("(" + jf.read() + ")"); jf.close();
        for (q = 1; q <= app.project.numItems; q++) if (app.project.item(q).id === A.comp) c = app.project.item(q);
        if (!c || c.name !== "WR_ft") throw new Error("not my comp");
        var t0 = new Date().getTime();
        var r = UK.api.ftSplit(A);
        log.push("split into " + r.layers.length + " layers in " + (new Date().getTime() - t0) + " ms, first " + r.layers[0] + ", last " + r.layers[r.layers.length - 1]);
        var names = []; for (q = 1; q <= c.numLayers; q++) names.push(c.layer(q).name + (c.layer(q).enabled ? "" : " (off)") + (c.layer(q).selected ? " *" : "")); log.push(names.join(" | "));
        var L1 = c.layer(r.layers[0]); log.push("anchor " + L1.property("ADBE Transform Group").property("ADBE Anchor Point").value.join(",") + " position " + L1.property("ADBE Transform Group").property("ADBE Position").value.join(","));
        UK.comp = function () { return c; };
        var R = UK.api.ftRead();
        log.push("read items " + R.items.length);
        var o = new File(WEB + "ft_read2.json"); o.encoding = "UTF-8"; o.open("w"); o.write(UK.json(R)); o.close();
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    finally { UK.comp = keep; }
    var f = new File(OUT + "ft_split.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\r\n")); f.close();
})();

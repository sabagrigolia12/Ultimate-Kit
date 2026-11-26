// Photo to Shape, the masks: own comp WR_p2s holding the user's footage item twice (nothing of theirs changes), one layer with an Add and a
// feathered Subtract mask, one with a mask in None. p2sRead must say masked / not; p2sRender leaves the temp comp and the PNG (async, polled from outside).
// Logged in sb_created.txt, removed by t_cleanup_created.jsx. Result in out/p2s_mask.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [], keep = UK.comp, q;
    var save = function () { var f = new File(OUT + "p2s_mask.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\r\n")); f.close(); };
    try {
        log.push("project " + (app.project.file ? app.project.file.name : "(unsaved)") + " items " + app.project.numItems + " dirty " + app.project.dirty);
        var src = null;
        for (q = 1; q <= app.project.numItems; q++) { var it = app.project.item(q); if (it instanceof FootageItem && it.mainSource instanceof FileSource && it.mainSource.file && /packshot 30 weli/.test(decodeURI(it.mainSource.file.name))) src = it; }
        if (!src) throw new Error("the footage item is not in this project");
        var c = app.project.items.addComp("WR_p2s", src.width, src.height, 1, 2, 30);
        var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); cfo.writeln(c.id + "|" + c.name); cfo.close();
        var mk = function (L, pts, mode, feather) {
            var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), s = new Shape();
            s.vertices = pts; s.closed = true; m.property("ADBE Mask Shape").setValue(s); m.maskMode = mode;
            if (feather) m.property("ADBE Mask Feather").setValue([feather, feather]);
        };
        log.push("step none layer"); save();
        var L2 = c.layers.add(src); L2.name = "WR_none"; mk(L2, [[0, 0], [100, 0], [100, 100]], MaskMode.NONE);
        log.push("step plain layer"); save();
        var L0 = c.layers.add(src); L0.name = "WR_plain";
        log.push("step masked layer"); save();
        var L = c.layers.add(src); L.name = "WR_masked";
        log.push("step mask add"); save();
        mk(L, [[140, 640], [980, 590], [1000, 1040], [120, 1000]], MaskMode.ADD);
        log.push("step mask subtract"); save();
        mk(L, [[420, 760], [640, 760], [640, 900], [420, 900]], MaskMode.SUBTRACT, 8);
        log.push("step read"); save();
        UK.comp = function () { return c; };
        L.selected = true; L0.selected = false; L2.selected = false;
        var r1 = UK.api.p2sRead();
        log.push("masked layer: masked " + r1.items[0].masked + " sig " + r1.items[0].sig + " still " + r1.items[0].still);
        L.selected = false; L0.selected = true;
        var r0 = UK.api.p2sRead(); log.push("plain layer: masked " + r0.items[0].masked + " sig '" + r0.items[0].sig + "'");
        L0.selected = false; L2.selected = true;
        var rn = UK.api.p2sRead(); log.push("mask in None: masked " + rn.items[0].masked + " sig '" + rn.items[0].sig + "'");
        var R = UK.api.p2sRender({ comp: c.id, id: L.id });
        var tmp = null; for (q = 1; q <= app.project.numItems; q++) if (app.project.item(q).id === R.temp) tmp = app.project.item(q);
        var tl = tmp.layer(1), mp = tl.property("ADBE Mask Parade");
        log.push("temp comp " + tmp.name + " " + tmp.width + "x" + tmp.height + ", masks " + mp.numProperties + ": modes " + String(mp.property(1).maskMode) + "," + String(mp.property(2).maskMode) + " feather " + mp.property(2).property("ADBE Mask Feather").value.join(","));
        log.push("render path " + R.path);
        log.push("temp id " + R.temp + " comp id " + c.id + " layer id " + L.id);
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    finally { UK.comp = keep; }
    save();
})();

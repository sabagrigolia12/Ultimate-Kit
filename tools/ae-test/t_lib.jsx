// libSave / libApply round trip: a text animation onto another text layer, and a shape layer rebuild.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "t_lib_out.txt"); out.open("w");
    var before = {};
    for (var q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    function keysOf(L) { var n = 0; function w(g) { for (var i = 1; i <= g.numProperties; i++) { var p = g.property(i); if (p.propertyType === PropertyType.PROPERTY) n += p.numKeys; else w(p); } } w(L); return n; }
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var c = app.project.items.addComp("UL_libsrc", 1280, 720, 1, 5, 30); c.openInViewer(); c.time = 0.5;
        var T = UK.addText(c, "Saved preset", { size: 90 }); UK.selectOnly(c, [T]);
        UK.parse(UK.call("text", UK.json({ id: "st03", mode: "in", inDur: 1.0 })));
        T = c.layer(1); UK.selectOnly(c, [T]);
        var s = UK.parse(UK.call("libSave", UK.json({ name: "Test Pop" })));
        out.writeln("save ok=" + s.ok + (s.ok ? " layers=" + s.data.data.layers.length + " anim=" + s.data.data.anim + " srcKeys=" + keysOf(T) : " err=" + s.error));
        var d = UK.parse(UK.json(s.data.data));
        var c2 = app.project.items.addComp("UL_libdst", 1280, 720, 1, 5, 30); c2.openInViewer(); c2.time = 1.0;
        var T2 = UK.addText(c2, "Another title here", { size: 70 }); UK.selectOnly(c2, [T2]);
        var a = UK.parse(UK.call("libApply", UK.json({ data: d })));
        out.writeln("apply ok=" + a.ok + (a.ok ? " mode=" + a.data.mode + " dstKeys=" + keysOf(T2) + " text=" + UK.textDoc(T2).value.text + " animators=" + T2.property("ADBE Text Properties").property("ADBE Text Animators").numProperties : " err=" + a.error));
        // a shape layer (underline) -> rebuilt as layers in another comp
        UK.selectOnly(c2, [T2]);
        UK.parse(UK.call("underline", UK.json({ id: "ul10", color: "#ff8800", dur: 0.8, mode: "in" })));
        var U = c2.selectedLayers[0];
        var s2 = UK.parse(UK.call("libSave", UK.json({ name: "Test Circle" })));
        var c3 = app.project.items.addComp("UL_libdst2", 1280, 720, 1, 5, 30); c3.openInViewer(); c3.time = 0.2; var T3 = UK.addText(c3, "Circled words", { size: 80 }); UK.selectOnly(c3, [T3]);
        var a2 = UK.parse(UK.call("libApply", UK.json({ data: UK.parse(UK.json(s2.data.data)) })));
        out.writeln("shape save ok=" + s2.ok + " apply ok=" + a2.ok + (a2.ok ? " mode=" + a2.data.mode + " layers=" + c3.numLayers + " keys=" + keysOf(c3.layer(1)) + " parent=" + (c3.layer(1).parent ? c3.layer(1).parent.name : "none") + " srcKeys=" + keysOf(U) : " err=" + a2.error));
        c2.saveFrameToPng(1.6, new File(OUT + "lib_dst.png"));
        c3.saveFrameToPng(1.2, new File(OUT + "lib_dst2.png"));
    } catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    try { var cf = new File(OUT + "sb_created.txt"); cf.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cf.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cf.close(); } catch (e2) { }
    out.close();
})();

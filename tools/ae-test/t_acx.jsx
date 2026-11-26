// Audio extraction lab (own items only): imports a test sound, renders it to WAV through a temporary render-queue
// item, lists the output module's settings keys. Restores the user's render-queue flags. -> out/acx.txt
(function () {
    var o = [], before = {}, q, RQ = app.project.renderQueue, keepRender = [];
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var src = new File($.global.ACX_SRC);
        var F = app.project.importFile(new ImportOptions(src));
        o.push("imported " + F.name + " dur " + F.duration + " hasAudio " + F.hasAudio + " hasVideo " + F.hasVideo);
        var C = app.project.items.addComp("WR_acx", 64, 64, 1, Math.max(F.duration, 0.1), 30);
        C.layers.add(F);
        for (q = 1; q <= RQ.numItems; q++) { keepRender.push(RQ.item(q).render); }
        var it = RQ.items.add(C), om = it.outputModule(1);
        var all = om.getSettings(GetSettingsFormat.STRING_SETTABLE);
        var keys = []; for (var k in all) keys.push(k + "=" + (typeof all[k] === "object" ? JSON.stringify(all[k]) : all[k]));
        o.push("settable: " + keys.join(" | ").substr(0, 2500));
        try { o.push("templates: " + om.templates.join(" | ")); } catch (eT) { o.push("templates err " + eT.message); }
        var out = new File(Folder.temp.fsName + "/uk_acx_test.wav");
        if (out.exists) out.remove();
        var set = { "Format": "WAV", "Output Audio": "On", "Audio Sample Rate": 16000, "Audio Channels": "Mono", "Audio Bit Depth": "16 Bit" };
        try { om.setSettings(set); o.push("setSettings ok"); } catch (eS) { o.push("setSettings err " + eS.message); }
        try { om.file = out; } catch (eF) { o.push("file err " + eF.message); }
        var now = om.getSettings(GetSettingsFormat.STRING);
        o.push("now: Format " + now["Format"] + " | audio " + now["Output Audio"] + " | rate " + now["Audio Sample Rate"] + " | ch " + now["Audio Channels"] + " | file " + om.file.fsName);
        for (q = 1; q < RQ.numItems; q++) { try { if (RQ.item(q).status === RQItemStatus.QUEUED) RQ.item(q).render = false; } catch (eR) { } }
        var t0 = new Date().getTime();
        RQ.render();
        o.push("rendered in " + (new Date().getTime() - t0) + " ms, status " + it.status);
        var f2 = new File(om.file.fsName);
        o.push("output exists " + f2.exists + " size " + (f2.exists ? f2.length : 0) + " name " + f2.name);
        it.remove();
        for (q = 1; q <= Math.min(RQ.numItems, keepRender.length); q++) { try { RQ.item(q).render = keepRender[q - 1]; } catch (eR2) { } }
    } catch (e) { o.push("ERROR " + e.message + " line " + e.line); }
    var cfo = new File("D:/Projects/Codex/tools/ae-test/out/sb_created.txt"); cfo.open("a");
    for (q = 1; q <= app.project.numItems; q++) if (!before[app.project.item(q).id]) cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name);
    cfo.close();
    var f = new File("D:/Projects/Codex/tools/ae-test/out/acx.txt"); f.encoding = "UTF-8"; f.open("w"); f.writeln(o.join("\n")); f.close();
})();

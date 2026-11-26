// Debug: in my WR_box comp, renders the 'Glass Stroke' layer alone with its first k effects on (k = 0..n),
// one duplicated comp per step (all mine, logged), frame 0 -> out/boxdbg/k.png. Same for the user's comp copy.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", d = new Folder(OUT + "boxdbg"); if (!d.exists) d.create();
    var src = null, usr = null, i, k;
    for (i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === "WR_box") src = it; if (it instanceof CompItem && it.name === "box animation 2") usr = it; }
    var cf = new File(OUT + "sb_created.txt"); cf.open("a");
    var run = function (base, lname, tag, tm) {
        var n = base.layer(lname).property("ADBE Effect Parade").numProperties;
        for (k = 0; k <= n; k++) {
            var C = base.duplicate(); C.name = "UKDUMP_dbg_" + tag + k; cf.writeln(C.id + "|" + C.name);
            for (var j = 1; j <= C.numLayers; j++) if (C.layer(j).name !== lname) C.layer(j).enabled = false;
            var fx = C.layer(lname).property("ADBE Effect Parade");
            for (var e = 1; e <= fx.numProperties; e++) fx.property(e).enabled = e <= k;
            C.saveFrameToPng(tm || 0, new File(OUT + "boxdbg/" + tag + k + ".png"));
        }
    };
    if (src) { run(src, "Glass Stroke", "m"); run(src, "Glow Stroke", "gm", 20 * src.frameDuration); }
    if (usr) { run(usr, "glass storke", "u"); run(usr, "Shape Layer 2", "gu", 20 * usr.frameDuration); }
    cf.close();
})();

// READ ONLY: renders the user's Glow Box comp ("Comp 1") at 8 moments from the Glass Stroke trim's first key,
// to out/userbox/f<k>.png, and logs the key times.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/userbox.txt"); o.open("w");
    var d = new Folder("D:/Projects/Codex/tools/ae-test/out/userbox"); if (!d.exists) d.create();
    var c = null, i;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === "Comp 1") c = app.project.item(i);
    var L = c.layer("Glass Stroke"), off = L.property("ADBE Root Vectors Group").property("ADBE Vector Filter - Trim").property("ADBE Vector Trim Offset");
    var t0 = off.numKeys ? off.keyTime(1) : 0, t1 = off.numKeys > 1 ? off.keyTime(2) : t0 + 1.2;
    o.writeln("offset keys " + t0 + " .. " + t1 + " expr err '" + off.expressionError + "'");
    for (i = 0; i < 8; i++) { var t = t0 + (t1 - t0) * i / 6; c.saveFrameToPng(t, new File(d.fsName + "/f" + i + ".png")); }
    o.close();
})();

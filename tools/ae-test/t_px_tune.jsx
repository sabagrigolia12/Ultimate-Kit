// Pixel Wipe test: try values on the test comp's Pixels layer without rebuilding, then render a frame or two.
// $.global.PX_TUNE = { comp, set: [[effect name, match suffix or param index, value], ...], glow: "none"|"deep"|"ae", dg:[radius, exposure], ae:[[r,i],[r,i]], tag, times }
(function () {
    var o = $.global.PX_TUNE || {}, name = o.comp || "WR_px", c = null, i, log = [];
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === name) c = app.project.item(i);
    if (!c) { $.global.PX_TUNE_R = "no " + name; return; }
    var R = c.layer("Pixels"), fx = function () { return R.property("ADBE Effect Parade"); };
    var drop = function (n) { var e = fx().property(n); if (e) e.remove(); };
    if (o.glow) {
        drop("Deep Glow 2"); drop("Glow Near"); drop("Glow Wide");
        if (o.glow === "deep") {
            var d = fx().addProperty("PEDG2");
            d.property("PEDG2-0103").setValue(1); d.property("PEDG2-0024").setValue(1);
            d.property("PEDG2-0017").setValue(o.dg[0]); d.property("PEDG2-0018").setValue(o.dg[1]);
        }
        if (o.glow === "ae") {
            for (i = 0; i < o.ae.length; i++) {
                var g = fx().addProperty("ADBE Glo2"); g.name = i ? "Glow Wide" : "Glow Near";
                g = fx().property(g.name);
                g.property("ADBE Glo2-0002").setValue(o.ae[i][2] === undefined ? 0 : o.ae[i][2]); g.property("ADBE Glo2-0003").setValue(o.ae[i][0]); g.property("ADBE Glo2-0004").setValue(o.ae[i][1]); g.property("ADBE Glo2-0006").setValue(5);
            }
        }
    }
    if (o.bg) { for (i = 1; i <= c.numLayers; i++) if (c.layer(i).name === "WR_bg") c.layer(i).source.mainSource.color = o.bg; }
    if (o.off) for (i = 0; i < o.off.length; i++) fx().property(o.off[i]).enabled = false;
    if (o.on) for (i = 0; i < o.on.length; i++) fx().property(o.on[i]).enabled = true;
    if (o.set) for (i = 0; i < o.set.length; i++) {
        try { fx().property(o.set[i][0]).property(o.set[i][1]).setValue(o.set[i][2]); }
        catch (e1) { log.push("set " + o.set[i][0] + "/" + o.set[i][1] + ": " + e1.message); }
    }
    if (o.expr) for (i = 0; i < o.expr.length; i++) {
        try { fx().property(o.expr[i][0]).property(o.expr[i][1]).expression = o.expr[i][2]; }
        catch (e2) { log.push("expr " + o.expr[i][0] + ": " + e2.message); }
    }
    var dir = new Folder("D:/Projects/Codex/tools/ae-test/out/px/"); if (!dir.exists) dir.create();
    var times = o.times || [1.07];
    for (i = 0; i < times.length; i++) c.saveFrameToPng(times[i], new File(dir.fsName + "/" + (o.tag || "t") + "_" + Math.round(times[i] * 100) + ".png"));
    $.global.PX_TUNE_R = "ok " + log.join("; ");
})();

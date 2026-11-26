// Lab: how TFM Liquid Glass maps its Source Layer. Own comp WR_lq (2160 x 3840, Advanced 3D like the user's) with the user's photo
// footage as WR_bg (their footage item is only used, not changed) and a WR_glass shape layer; refraction, blur, highlights,
// aberration off so the inside of the glass is the source as the plug-in reads it. Steps by $.global.LQ_STEP:
//   "build"  - make it (every new item logged in sb_created.txt)
//   "set"    - $.global.LQ_CFG = { bg: [x, y], bgScale: s, glass: [x, y], group: [x, y], on: bool, adj: bool, src3d: bool }
//   "render" - frame 0 to out/hlref/lqlab_<$.global.LQ_TAG>.png
//   "log"    - log new items
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [];
    var J = function (v) { try { return (v instanceof Array) ? v.join(",") : String(v); } catch (e) { return "?"; } };
    var find = function (n) { for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === n) return app.project.item(i); return null; };
    try {
        var step = $.global.LQ_STEP, q;
        if (step === "build") {
            var before = {}; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true; $.global.LQ_BEFORE = before;
            var photo = null;
            for (q = 1; q <= app.project.numItems; q++) { var it = app.project.item(q); if (it instanceof FootageItem && it.width === 2160 && it.height === 3840 && /Still001/.test(it.name)) photo = it; }
            var c = app.project.items.addComp("WR_lq", 2160, 3840, 1, 5, 29.9700012207031);
            try { c.renderer = "ADBE Calder"; } catch (eR) { log.push("renderer " + eR.message); }
            var B = c.layers.add(photo); B.name = "WR_bg";
            var G = c.layers.addShape(); G.name = "WR_glass";
            var g = G.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); g.name = "Rectangle 1";
            var v = g.property("ADBE Vectors Group"), R = v.addProperty("ADBE Vector Shape - Rect");
            R.property("ADBE Vector Rect Size").setValue([900, 560]); R.property("ADBE Vector Rect Roundness").setValue(280);
            var F = v.addProperty("ADBE Vector Graphic - Fill"); F.property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);
            var E = G.property("ADBE Effect Parade").addProperty("TFM LiquidGlass");
            var set = { "0002": 4, "0004": 0, "0005": 100, "0006": 1, "0009": 0, "0011": 0, "0012": 100, "0015": 0, "0017": 0, "0023": 0, "0026": 0, "0027": 0, "0030": 0 };
            for (var k in set) { try { E.property("TFM LiquidGlass-" + k).setValue(set[k]); } catch (eS) { log.push("set " + k + " " + eS.message); } }
            G.property("ADBE Effect Parade").property(1).property("TFM LiquidGlass-0001").setValue(B.index);
            log.push("built: photo " + (photo ? photo.name : "NONE") + " | glass source " + G.property("ADBE Effect Parade").property(1).property("TFM LiquidGlass-0001").value + " | layers " + c.numLayers);
        }
        if (step === "set") {
            var C = find("WR_lq"), cf = $.global.LQ_CFG, Bg = C.layer("WR_bg"), Gl = C.layer("WR_glass");
            var T = function (L, p) { return L.property("ADBE Transform Group").property(p); };
            Bg.threeDLayer = !!cf.src3d;
            T(Bg, "ADBE Position").setValue(cf.bg.length === 2 && Bg.threeDLayer ? [cf.bg[0], cf.bg[1], 0] : cf.bg);
            T(Bg, "ADBE Scale").setValue(Bg.threeDLayer ? [cf.bgScale, cf.bgScale, 100] : [cf.bgScale, cf.bgScale]);
            T(Gl, "ADBE Position").setValue(cf.glass);
            Gl.property("ADBE Root Vectors Group").property(1).property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue(cf.group);
            Gl.enabled = !!cf.on;
            Gl.adjustmentLayer = !!cf.adj;
            log.push("set " + cf.tag + ": bg " + J(T(Bg, "ADBE Position").value) + " s " + cf.bgScale + " glass " + J(T(Gl, "ADBE Position").value) + " group " + J(cf.group) + " on " + Gl.enabled + " adj " + Gl.adjustmentLayer);
        }
        if (step === "render") {
            var C2 = find("WR_lq");
            C2.saveFrameToPng(0, new File(OUT + "hlref/lqlab_" + $.global.LQ_TAG + ".png"));
            log.push("render " + $.global.LQ_TAG);
        }
        if (step === "log") {
            var bf = $.global.LQ_BEFORE, cfo = new File(OUT + "sb_created.txt"), m = 0; cfo.open("a");
            for (q = 1; q <= app.project.numItems; q++) if (!bf[app.project.item(q).id]) { cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name); m++; }
            cfo.close(); log.push("logged " + m);
        }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    var o = new File(OUT + "lqlab.txt"); o.encoding = "UTF-8"; o.open("a"); o.writeln(log.join(" | ")); o.close();
})();

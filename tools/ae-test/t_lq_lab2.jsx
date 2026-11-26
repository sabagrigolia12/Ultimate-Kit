// Liquid Glass (gl03) through the real builder on an own comp WR_lq2 (2160 x 3840, Advanced 3D like the user's): the user's photo
// footage as WR_bg moved / scaled / turned like theirs, a text WR_logo on top, selected (= their logo). Checks where the glass
// went, its Glass Source, and (with refraction switched off) that the glass shows exactly what is behind it.
// Steps by $.global.LQ2_STEP: build / look (logo on, their look) / flat (refraction off, logo off) / glass (on|off) /
// bg ([x, y], scale, rot in $.global.LQ2_BG) / render (tag) / log.  Results appended to out/lqlab2.txt.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [], keep = UK.comp;
    var J = function (v) { try { return (v instanceof Array) ? v.join(",") : String(v); } catch (e) { return "?"; } };
    var find = function (n) { for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === n) return app.project.item(i); return null; };
    var TT = function (L, p) { return L.property("ADBE Transform Group").property(p); };
    var T6 = 6;
    try {
        var step = $.global.LQ2_STEP, q, C = find("WR_lq2");
        if (step === "build") {
            var before = {}; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true; $.global.LQ2_BEFORE = before;
            var photo = null;
            for (q = 1; q <= app.project.numItems; q++) { var it = app.project.item(q); if (it instanceof FootageItem && it.width === 2160 && it.height === 3840 && /Still001/.test(it.name)) photo = it; }
            C = app.project.items.addComp("WR_lq2", 2160, 3840, 1, 8, 29.9700012207031);
            try { C.renderer = "ADBE Calder"; } catch (eR) { }
            var B = C.layers.add(photo); B.name = "WR_bg";
            TT(B, "ADBE Position").setValue([1300, 2000]); TT(B, "ADBE Scale").setValue([85, 85]); TT(B, "ADBE Rotate Z").setValue(8);
            var A = C.layers.addSolid([0.2, 0.2, 0.2], "WR_adj", 2160, 3840, 1); A.adjustmentLayer = true; A.moveBefore(B);
            var Tx = C.layers.addText("WR_LOGO"); Tx.name = "WR_logo";
            var td = Tx.property("ADBE Text Properties").property("ADBE Text Document").value; td.fontSize = 260; td.fillColor = [1, 1, 1]; Tx.property("ADBE Text Properties").property("ADBE Text Document").setValue(td);
            for (q = 1; q <= C.numLayers; q++) C.layer(q).selected = false;
            Tx.selected = true;
            C.time = 0;
            UK.comp = function () { return C; };
            var r = UK.api.glass({ id: "gl03" });
            var st = []; for (q = 1; q <= C.numLayers; q++) st.push(q + " " + C.layer(q).name + (C.layer(q).enabled ? "" : " (off)"));
            log.push("built " + J(r.panel) + " | stack: " + st.join(" | "));
            var G = C.layer(r.panel), E = G.property("ADBE Effect Parade").property(1), sl = E.property("TFM LiquidGlass-0001").value;
            log.push("glass source = layer " + sl + " " + (sl ? C.layer(sl).name : "-") + " | comment: " + G.comment);
            var S = C.layer(sl), SC = S.source, D = SC.layer(1), ex = [];
            var names = ["ADBE Anchor Point", "ADBE Position", "ADBE Scale", "ADBE Rotate Z", "ADBE Opacity"];
            for (q = 0; q < names.length; q++) { var pr = TT(D, names[q]); ex.push(names[q].replace("ADBE ", "") + " " + J(pr.valueAtTime(T6, false)) + (pr.expressionError ? " ERR " + pr.expressionError : "")); }
            log.push("Glass Source comp " + SC.name + " " + SC.width + "x" + SC.height + " folder " + SC.parentFolder.name + " | copy " + D.name + ": " + ex.join(" | "));
            log.push("original: pos " + J(TT(B, "ADBE Position").value) + " scale " + J(TT(B, "ADBE Scale").value) + " rot " + TT(B, "ADBE Rotate Z").value);
            var P = TT(G, "ADBE Position").valueAtTime(T6, false), An = TT(G, "ADBE Anchor Point").value, off = G.property("ADBE Root Vectors Group").property(1).property("ADBE Vector Transform Group").property("ADBE Vector Position").value;
            $.global.LQ2_C = [P[0] - An[0] + off[0], P[1] - An[1] + off[1]];
            log.push("glass centre at " + T6 + " s: " + J($.global.LQ2_C) + " | position keys " + TT(G, "ADBE Position").numKeys);
        }
        var Gl = null; if (C) for (q = 1; q <= C.numLayers; q++) if (/^Liquid Glass/.test(C.layer(q).name)) Gl = C.layer(q);
        if (step === "flat") {
            var E2 = Gl.property("ADBE Effect Parade").property(1), set = { "0004": 0, "0005": 100, "0006": 1, "0009": 0, "0015": 0, "0023": 0, "0027": 0 };
            for (var k in set) { try { E2.property("TFM LiquidGlass-" + k).setValue(set[k]); } catch (eS) { log.push("set " + k + " " + eS.message); } }
            Gl.property("ADBE Effect Parade").property(2).enabled = false;
            C.layer("WR_logo").enabled = false; C.layer("WR_adj").enabled = false;
            log.push("flat");
        }
        if (step === "glass") { Gl.enabled = $.global.LQ2_ON; log.push("glass " + Gl.enabled); }
        if (step === "bg") { var b = $.global.LQ2_BG, Bg = C.layer("WR_bg"); TT(Bg, "ADBE Position").setValue(b[0]); TT(Bg, "ADBE Scale").setValue([b[1], b[1]]); TT(Bg, "ADBE Rotate Z").setValue(b[2]); log.push("bg " + J(b[0]) + " s " + b[1] + " r " + b[2]); }
        if (step === "render") { C.saveFrameToPng(Math.round(T6 / C.frameDuration) * C.frameDuration, new File(OUT + "hlref/lqlab2_" + $.global.LQ2_TAG + ".png")); log.push("render " + $.global.LQ2_TAG); }
        if (step === "log") {
            var bf = $.global.LQ2_BEFORE, cfo = new File(OUT + "sb_created.txt"), m = 0; cfo.open("a");
            for (q = 1; q <= app.project.numItems; q++) if (!bf[app.project.item(q).id]) { cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name); m++; }
            cfo.close(); log.push("logged " + m);
        }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    finally { UK.comp = keep; }
    var o = new File(OUT + "lqlab2.txt"); o.encoding = "UTF-8"; o.open("a"); o.writeln(log.join(" || ")); o.close();
})();

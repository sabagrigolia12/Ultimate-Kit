// Bounce on 3D properties (jsx/bounce.jsx) in an own comp WR_bn: a 3D solid with keys on Position, Scale, X / Y / Z
// Rotation and Orientation; live (expressions) on one layer, keyframes on a copy. Logs whether each property moves
// past its landing value after the last key. Results -> out/bn3d.txt; created items logged for cleanup.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [], keep = UK.comp, q, before = {};
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var C = app.project.items.addComp("WR_bn", 1080, 1080, 1, 4, 30);
        var mk = function (name) {
            var L = C.layers.addSolid([0.5, 0.6, 0.9], name, 300, 300, 1); L.threeDLayer = true;
            var T = function (m) { return L.property("ADBE Transform Group").property(m); };
            var two = function (m, a, b) { var p = T(m); p.setValueAtTime(0, a); p.setValueAtTime(1, b); for (var k = 1; k <= 2; k++) p.setTemporalEaseAtKey(k, p.isSpatial || p.propertyValueType === PropertyValueType.OneD ? [new KeyframeEase(0, 33)] : [new KeyframeEase(0, 33), new KeyframeEase(0, 33), new KeyframeEase(0, 33)]); };
            two("ADBE Position", [200, 540, 0], [540, 540, -200]);
            two("ADBE Scale", [40, 40, 40], [100, 100, 100]);
            two("ADBE Rotate X", 0, 60); two("ADBE Rotate Y", 0, -45); two("ADBE Rotate Z", 0, 30);
            two("ADBE Orientation", [0, 0, 0], [40, 300, 20]);
            return L;
        };
        var A = mk("WR_live"), B = mk("WR_keys");
        UK.comp = function () { return C; };
        var go = function (L, mode) {
            for (var i = 1; i <= C.numLayers; i++) C.layer(i).selected = false;
            L.selected = true;
            var r = UK.api.bounce({ prop: $.global.BN_PROP || "auto", type: $.global.BN_TYPE || "overshoot", strength: "medium", mode: mode });
            log.push(mode + ": " + r.applied.join(", "));
        };
        go(A, "live"); go(B, "keys");
        var names = ["ADBE Position", "ADBE Scale", "ADBE Rotate X", "ADBE Rotate Y", "ADBE Rotate Z", "ADBE Orientation"];
        var L2 = [A, B];
        for (var j = 0; j < 2; j++) for (q = 0; q < names.length; q++) {
            var p = L2[j].property("ADBE Transform Group").property(names[q]), end = p.keyValue(2), mx = 0, err = "";
            try { if (p.expression) err = (p.expressionEnabled ? "" : " DISABLED") + (p.expressionError ? " EXPR " + String(p.expressionError).replace(/[\r\n]+/g, " ").substr(0, 160) : " expr ok"); } catch (e1) { }
            for (var t = 1.03; t < 2.5; t += 1 / 30) {
                var v = p.valueAtTime(t, false), d = 0;
                var W = names[q] === "ADBE Orientation", df = function (x, y) { var z = x - y; if (W) z = ((z + 180) % 360 + 360) % 360 - 180; return Math.abs(z); };
                if (v instanceof Array) { for (var k = 0; k < v.length; k++) d = Math.max(d, df(v[k], end[k])); } else d = df(v, end);
                mx = Math.max(mx, d);
            }
            log.push(L2[j].name + " " + names[q].replace("ADBE ", "") + ": keys " + p.numKeys + ", max swing after landing " + Math.round(mx * 10) / 10 + err);
            if (names[q] === "ADBE Orientation") { var sm = []; for (var tq = 0.9; tq < 2.0; tq += 0.1) { var vq = p.valueAtTime(tq, false); sm.push(Math.round(tq * 10) / 10 + ":" + [Math.round(vq[0] * 10) / 10, Math.round(vq[1] * 10) / 10, Math.round(vq[2] * 10) / 10].join(",")); } log.push("    " + sm.join("  ")); }
        }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    UK.comp = keep;
    var cfo = new File(OUT + "sb_created.txt"); cfo.open("a");
    for (q = 1; q <= app.project.numItems; q++) if (!before[app.project.item(q).id]) cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name);
    cfo.close();
    var o = new File(OUT + "bn3d.txt"); o.encoding = "UTF-8"; o.open("a"); o.writeln("--- " + ($.global.BN_PROP || "auto") + " " + ($.global.BN_TYPE || "overshoot")); o.writeln(log.join("\n")); o.close();
})();

(function () {
    var o = [], C = app.project.items.addComp("WR_orient2", 500, 500, 1, 3, 30), L = C.layers.addSolid([1, 1, 1], "WR_probe2", 100, 100, 1);
    L.threeDLayer = true;
    var p = L.property("ADBE Transform Group").property("ADBE Orientation");
    try {
        p.setValueAtTime(0, [0, 0, 0]); p.setValueAtTime(1, [40, 300, 20]);
        o.push("dims " + UK.dims(p) + " spatial " + p.isSpatial + " type " + p.propertyValueType + " ease len " + p.keyInTemporalEase(2).length);
        p.setValueAtTime(1.5, [42, 302, 21]); o.push("set 42,302,21 -> " + p.keyValue(p.nearestKeyIndex(1.5)).join(","));
        var ki = p.nearestKeyIndex(1.5);
        try { p.setInterpolationTypeAtKey(ki, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); } catch (e1) { o.push("interp err " + e1.message); } o.push("after interp " + p.keyValue(ki).join(","));
        try { p.setTemporalEaseAtKey(ki, [new KeyframeEase(0, 45)], [new KeyframeEase(0, 45)]); } catch (e2) { o.push("ease err " + e2.message); } o.push("after ease " + p.keyValue(ki).join(","));
        try { p.setSpatialAutoBezierAtKey(ki, false); } catch (e3) { o.push("auto err " + e3.message); } o.push("after autobez " + p.keyValue(ki).join(","));
        try { p.setSpatialContinuousAtKey(ki, false); } catch (e4) { o.push("cont err " + e4.message); } o.push("after cont " + p.keyValue(ki).join(","));
        try { p.setSpatialTangentsAtKey(ki, [0, 0, 0], [0, 0, 0]); } catch (e5) { o.push("tan err " + e5.message); } o.push("after tangents " + p.keyValue(ki).join(","));
        p.removeKey(p.nearestKeyIndex(1.5));
        UK._fd = C.frameDuration; o.push("vec " + UK.BN.vec(p.keyValue(2)).join(",") + " landing " + UK.BN.landing(p, 2, false).join(",") + " pre " + p.valueAtTime(1 - UK._fd * 0.25, true).join(","));
        var n = UK.BN.bake(p, "overshoot", { amount: 50, freq: 2.4, decay: 5.5 });
        o.push("baked +" + n);
        for (var k = 1; k <= p.numKeys; k++) o.push("  key " + k + " t " + Math.round(p.keyTime(k) * 1000) / 1000 + " v " + p.keyValue(k).join(","));
    } catch (e) { o.push("ERR " + e.message + " line " + e.line); }
    var S = L.source; C.remove(); S.remove();
    var f = new File("D:/Projects/Codex/tools/ae-test/out/orient2.txt"); f.open("w"); f.writeln(o.join("\n")); f.close();
})();

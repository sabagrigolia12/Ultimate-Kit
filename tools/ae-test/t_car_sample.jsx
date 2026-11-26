// READ ONLY: the user's 'Pre-comp 1' carousel: Null 1's position keys in full (spatial tangents, types), its value at every frame 0..6.2 s,
// the layers' transforms, the precomp layer's Bezier Warp (all parameters) in 'Comp 2', and the card comps' track mattes and layer styles. -> out/car_sample.txt
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/car_sample.txt"); o.encoding = "UTF-8"; o.open("w");
    var J = function (v) { try { return (v instanceof Array) ? v.join(",") : String(v); } catch (e) { return "?"; } };     // (a string + an array throws in After Effects)
    var find = function (n) { for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === n) return app.project.item(i); return null; };
    var tr = function (L, p) { return J(L.property("ADBE Transform Group").property(p).value); };
    try {
        var P = find("Pre-comp 1"), N = P.layer("Null 1"), pos = N.property("ADBE Transform Group").property("ADBE Position"), q, k;
        o.writeln("null anchor " + tr(N, "ADBE Anchor Point") + " scale " + tr(N, "ADBE Scale") + " separated " + pos.dimensionsSeparated);
        for (k = 1; k <= pos.numKeys; k++) {
            var s = "key " + k + " t " + pos.keyTime(k) + " v " + J(pos.keyValue(k));
            try { s += " | spatial in " + J(pos.keyInSpatialTangent(k)) + " out " + J(pos.keyOutSpatialTangent(k)); } catch (e1) { s += " | spatial ? " + e1.message; }
            try { s += " | autoBez " + pos.keySpatialAutoBezier(k) + " cont " + pos.keySpatialContinuous(k) + " roving " + pos.keyRoving(k); } catch (e2) { s += " | flags ? " + e2.message; }
            o.writeln(s);
        }
        var fr = P.frameDuration, xs = [];
        for (q = 0; q <= Math.round(6.2 / fr); q++) { var v = pos.valueAtTime(q * fr, false); xs.push(String(Math.round(v[0] * 100) / 100) + (Math.abs(v[1] - 540) > 0.01 ? "/y" + String(Math.round(v[1] * 100) / 100) : "")); }
        o.writeln("x per frame (fps " + P.frameRate + "): " + xs.join(" "));
        for (k = 1; k <= P.numLayers; k++) { var L = P.layer(k); o.writeln("layer " + k + " " + L.name + " anchor " + tr(L, "ADBE Anchor Point") + " pos " + tr(L, "ADBE Position") + " scale " + tr(L, "ADBE Scale") + " rot " + tr(L, "ADBE Rotate Z") + " opacity " + tr(L, "ADBE Opacity")); }
        var W = find("Comp 2").layer("Pre-comp 1"), B = W.property("ADBE Effect Parade").property(1), bs = [];
        for (k = 1; k <= B.numProperties; k++) { try { bs.push(B.property(k).name + "=" + J(B.property(k).value)); } catch (e4) { } }
        o.writeln("bezier warp: " + bs.join(" | "));
        o.writeln("precomp layer anchor " + tr(W, "ADBE Anchor Point") + " pos " + tr(W, "ADBE Position") + " scale " + tr(W, "ADBE Scale"));
        var names = ["Comp 1", "Comp 3"];
        for (k = 0; k < 2; k++) {
            var C = find(names[k]);
            for (q = 1; q <= C.numLayers; q++) {
                var CL = C.layer(q), m = "";
                try { m = CL.hasTrackMatte ? " matte layer " + (CL.trackMatteLayer ? CL.trackMatteLayer.name : "?") + " type " + String(CL.trackMatteType) : ""; } catch (e5) { m = " matte ?"; }
                try { m += " | isTrackMatte " + CL.isTrackMatte; } catch (e6) { }
                o.writeln(names[k] + " layer " + q + " " + CL.name + m + " pos " + tr(CL, "ADBE Position") + " anchor " + tr(CL, "ADBE Anchor Point"));
            }
            var LS = C.layer("Shape Layer 1").property("ADBE Layer Styles");
            if (LS) { var st = []; for (q = 1; q <= LS.numProperties; q++) { var gs = LS.property(q); try { st.push(gs.name + (gs.canSetEnabled ? (gs.enabled ? " ON" : " off") : "")); } catch (e7) { } } o.writeln(names[k] + " Shape Layer 1 styles: " + st.join(", ")); }
        }
    } catch (e) { o.writeln("ERROR " + e.message + " line " + e.line); }
    o.close();
})();

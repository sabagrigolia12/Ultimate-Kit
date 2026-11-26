// READ ONLY: every layer carrying TFM Liquid Glass in the open project: its comp's layer stack, the glass layer's transform,
// contents, every effect parameter (Liquid Glass incl. Source Layer) -> out/lq_dump.txt. Changes nothing.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/lq_dump.txt"); o.encoding = "UTF-8"; o.open("w");
    var J = function (v) { try { return (v instanceof Array) ? v.join(",") : String(v); } catch (e) { return "?"; } };
    var bm = {}; for (var kb in BlendingMode) bm[BlendingMode[kb]] = kb;
    var tr = function (L, p) { try { var q = L.property("ADBE Transform Group").property(p); return J(q.value) + (q.numKeys ? " [" + q.numKeys + " keys" + (q.expression ? ", expr" : "") + "]" : "") + (q.expression ? " expr: " + q.expression.replace(/[\r\n]+/g, " ") : ""); } catch (e) { return "?"; } };
    var kind = function (L) { if (L instanceof ShapeLayer) return "shape"; if (L instanceof TextLayer) return "text"; if (L instanceof CameraLayer) return "camera"; if (L instanceof LightLayer) return "light"; try { if (L.nullLayer) return "null"; if (L.source instanceof CompItem) return "precomp " + L.source.width + "x" + L.source.height; if (L.source && L.source.mainSource instanceof SolidSource) return "solid " + L.source.width + "x" + L.source.height; if (L.source) return "footage " + L.source.width + "x" + L.source.height; } catch (e) { } return "?"; };
    var walk = function (p, ind) {
        for (var j = 1; j <= p.numProperties; j++) {
            var q = p.property(j);
            if (q.propertyType === PropertyType.PROPERTY) {
                var v = "";
                try { v = q.propertyValueType === PropertyValueType.NO_VALUE ? "(none)" : J(q.value); } catch (e) { v = "?"; }
                o.writeln(ind + q.name + " [" + q.matchName + "] = " + v + (q.numKeys ? " (" + q.numKeys + " keys)" : "") + (q.expression ? " EXPR: " + q.expression.replace(/[\r\n]+/g, " ") : ""));
            } else {
                var en = ""; try { if (q.canSetEnabled && !q.enabled) en = " OFF"; } catch (e2) { }
                o.writeln(ind + q.name + " [" + q.matchName + "]" + en);
                walk(q, ind + "  ");
            }
        }
    };
    o.writeln("project " + (app.project.file ? decodeURI(app.project.file.fsName) : "(unsaved)") + " items " + app.project.numItems + " bpc " + app.project.bitsPerChannel);
    var i, k, n = 0;
    for (i = 1; i <= app.project.numItems; i++) {
        var C = app.project.item(i);
        if (!(C instanceof CompItem)) continue;
        var has = [];
        for (k = 1; k <= C.numLayers; k++) { var fx = C.layer(k).property("ADBE Effect Parade"); if (!fx) continue; for (var e = 1; e <= fx.numProperties; e++) if (fx.property(e).matchName === "TFM LiquidGlass") has.push(k); }
        if (!has.length) continue;
        n++;
        o.writeln("\n=== COMP " + C.name + " (id " + C.id + ") " + C.width + "x" + C.height + " fps " + C.frameRate + " dur " + C.duration + " time " + C.time + " renderer " + C.renderer);
        for (k = 1; k <= C.numLayers; k++) {
            var L = C.layer(k), s = k + " " + L.name + " | " + kind(L);
            try { s += " | en " + L.enabled + " 3D " + L.threeDLayer + " adj " + L.adjustmentLayer + " blend " + bm[L.blendingMode] + " in " + L.inPoint + " out " + L.outPoint + " parent " + (L.parent ? L.parent.index : "-") + " matte " + String(L.trackMatteType) + (L.hasTrackMatte && L.trackMatteLayer ? " (" + L.trackMatteLayer.name + ")" : ""); } catch (e3) { }
            o.writeln(s);
            o.writeln("    anchor " + tr(L, "ADBE Anchor Point") + " | pos " + tr(L, "ADBE Position") + " | scale " + tr(L, "ADBE Scale") + " | rot " + tr(L, "ADBE Rotate Z") + " | opacity " + tr(L, "ADBE Opacity"));
            try { var r = L.sourceRectAtTime(C.time, false); o.writeln("    rect at CTI " + [r.left, r.top, r.width, r.height].join(",")); } catch (e4) { }
            var F = L.property("ADBE Effect Parade"); if (F) for (var f = 1; f <= F.numProperties; f++) o.writeln("    fx " + F.property(f).name + " [" + F.property(f).matchName + "]" + (F.property(f).enabled ? "" : " OFF"));
            try { if (L.property("ADBE Mask Parade").numProperties) o.writeln("    masks " + L.property("ADBE Mask Parade").numProperties); } catch (e5) { }
        }
        for (k = 0; k < has.length; k++) {
            var G = C.layer(has[k]);
            o.writeln("\n--- glass layer " + has[k] + " " + G.name + " comment: " + G.comment);
            if (G instanceof ShapeLayer) { o.writeln("  contents:"); walk(G.property("ADBE Root Vectors Group"), "    "); }
            o.writeln("  effects:"); walk(G.property("ADBE Effect Parade"), "    ");
            try { var P = G.property("ADBE Transform Group").property("ADBE Position"); for (var q = 1; q <= P.numKeys; q++) o.writeln("  pos key " + q + " t " + P.keyTime(q) + " v " + J(P.keyValue(q))); } catch (e6) { }
        }
    }
    o.writeln("\ncomps with Liquid Glass: " + n);
    o.close();
})();

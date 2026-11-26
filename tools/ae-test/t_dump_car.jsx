// READ ONLY: the modified properties (with keys, eases, spatial tangents, expressions) and switches of every layer of the comps named below -> out/dump_car.txt.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/dump_car.txt"); o.encoding = "UTF-8"; o.open("w");
    var wants = ["Comp 2", "Pre-comp 1", "Comp 1", "Comp 3"], i, k, w;
    var bm = {}; for (k in BlendingMode) bm[BlendingMode[k]] = k;
    var fmt = function (v) { try { if (v instanceof Shape) return "Shape(" + v.vertices.toString() + " | in " + v.inTangents.toString() + " | out " + v.outTangents.toString() + " closed " + v.closed + ")"; } catch (e) { } try { return v.toString(); } catch (e2) { return "?"; } };
    var keyInfo = function (p, n) {
        var s = "";
        try { s += " t=" + p.keyTime(n) + " v=" + fmt(p.keyValue(n)) + " int=" + p.keyInInterpolationType(n) + "/" + p.keyOutInterpolationType(n); } catch (e) { }
        try { var ie = p.keyInTemporalEase(n), oe = p.keyOutTemporalEase(n), a = []; for (var d = 0; d < ie.length; d++) a.push("in(" + ie[d].speed + "," + ie[d].influence + ") out(" + oe[d].speed + "," + oe[d].influence + ")"); s += " " + a.join(" "); } catch (e2) { }
        try { if (p.isSpatial) s += " spIn " + p.keyInSpatialTangent(n) + " spOut " + p.keyOutSpatialTangent(n) + " roving " + p.keyRoving(n) + " auto " + p.keySpatialAutoBezier(n) + " cont " + p.keySpatialContinuous(n); } catch (e3) { }
        try { s += " tcont " + p.keyTemporalContinuous(n) + " tauto " + p.keyTemporalAutoBezier(n); } catch (e4) { }
        return s;
    };
    var all = function (p, ind) {
        for (var j = 1; j <= p.numProperties; j++) {
            var q = p.property(j), v = "";
            if (q.propertyType === PropertyType.PROPERTY) {
                try { if (q.propertyValueType !== PropertyValueType.NO_VALUE && q.propertyValueType !== PropertyValueType.CUSTOM_VALUE) v = " = " + fmt(q.value); else v = " (custom/none)"; } catch (e) { v = " ?"; }
                var line = ind; try { line += q.name + " [" + q.matchName + "]" + v; } catch (en) { line += "(prop?)"; }
                try { if (q.expression) line += "  EXPR(" + q.expressionEnabled + "): " + q.expression.replace(/\r?\n/g, " \\n "); } catch (e1) { }
                var mod = false; try { mod = q.isModified || q.numKeys > 0 || q.expression !== ""; } catch (em) { mod = true; }
                if (mod) o.writeln(line);
                try { for (var n = 1; n <= q.numKeys; n++) o.writeln(ind + "  KEY" + n + keyInfo(q, n)); } catch (e2) { }
            } else {
                var gl = ind; try { gl += q.name + " [" + q.matchName + "]"; } catch (eg) { gl += "(group?)"; }
                try { if (q.canSetEnabled && !q.enabled) gl += " OFF"; } catch (eg2) { }
                o.writeln(gl);
                try { all(q, ind + "  "); } catch (eg3) { o.writeln(ind + "  (unreadable: " + eg3 + ")"); }
            }
        }
    };
    for (w = 0; w < wants.length; w++) {
        var c = null;
        for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === wants[w]) c = app.project.item(i);
        if (!c) { o.writeln("\n=== not found: " + wants[w]); continue; }
        var ch = "\n=================== COMP " + c.name + " " + c.width + "x" + c.height + " fps " + c.frameRate + " dur " + c.duration;
        try { ch += " bg " + c.bgColor.toString() + " mb " + c.motionBlur + " shutter " + c.shutterAngle + "/" + c.shutterPhase + " renderer " + c.renderer; } catch (ec) { }
        o.writeln(ch);
        for (i = 1; i <= c.numLayers; i++) {
            var L = c.layer(i), hd = "\n### " + i + " " + L.name;
            try { hd += " | blend " + bm[L.blendingMode] + " adj " + L.adjustmentLayer + " 3D " + L.threeDLayer + " mb " + L.motionBlur + " quality " + L.quality + " collapse " + L.collapseTransformation + " enabled " + L.enabled + " shy " + L.shy + " label " + L.label + " in " + L.inPoint + " out " + L.outPoint + " start " + L.startTime + " stretch " + L.stretch + " parent " + (L.parent ? L.parent.name + " (" + L.parent.index + ")" : "-") + " matte " + L.trackMatteType + " null " + L.nullLayer + " src " + (L.source ? L.source.name : "-"); } catch (e) { }
            o.writeln(hd);
            all(L, "  ");
        }
    }
    o.close();
})();

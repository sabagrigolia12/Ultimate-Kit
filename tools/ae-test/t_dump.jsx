// READ ONLY: dumps a comp of the user's project (name in out/dump_name.txt, default "box animation 2") and the
// comps it uses: every layer, switch, transform, effect, shape content, mask, keyframe (with easing) and
// expression, to out/dump.txt. Then saves frames (async) to out/dump/. Changes nothing in the project.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", want = "box animation 2";
    var nf = new File(OUT + "dump_name.txt"); if (nf.exists) { nf.open("r"); want = nf.read().replace(/^\s+|\s+$/g, ""); nf.close(); }
    var o = new File(OUT + "dump.txt"); o.encoding = "UTF-8"; o.open("w");
    var w = function (s) { o.writeln(s); };
    var fmt = function (v) {
        if (v === null || v === undefined) return String(v);
        if (v instanceof Array) { var a = []; for (var i = 0; i < v.length; i++) a.push(typeof v[i] === "number" ? Math.round(v[i] * 1000) / 1000 : fmt(v[i])); return "[" + a.join(",") + "]"; }
        if (typeof v === "number") return String(Math.round(v * 10000) / 10000);
        if (v instanceof Shape) return "Shape(" + v.vertices.length + " pts, closed " + v.closed + ": " + fmt(v.vertices) + " in " + fmt(v.inTangents) + " out " + fmt(v.outTangents) + ")";
        if (v instanceof TextDocument) return "Text('" + v.text + "' " + v.font + " " + v.fontSize + ")";
        return String(v);
    };
    var ease = function (p, k) {
        var s = "";
        try {
            var ii = p.keyInInterpolationType(k), oi = p.keyOutInterpolationType(k);
            s += " interp " + ii + "/" + oi;
            var ie = p.keyInTemporalEase(k), oe = p.keyOutTemporalEase(k), a = [];
            for (var d = 0; d < ie.length; d++) a.push("in(" + fmt(ie[d].speed) + "," + fmt(ie[d].influence) + ") out(" + fmt(oe[d].speed) + "," + fmt(oe[d].influence) + ")");
            s += " ease " + a.join(" ");
            if (p.isSpatial) { s += " spIn " + fmt(p.keyInSpatialTangent(k)) + " spOut " + fmt(p.keyOutSpatialTangent(k)); }
        } catch (e) { }
        return s;
    };
    var prop = function (p, ind) {
        var line = ind + p.name + " [" + p.matchName + "]";
        if (p.propertyType === PropertyType.PROPERTY) {
            var v = "";
            try { if (p.propertyValueType !== PropertyValueType.NO_VALUE) v = " = " + fmt(p.value); } catch (e) { v = " (no value)"; }
            var interesting = false;
            try { interesting = p.numKeys > 0 || (p.canSetExpression && p.expression !== "") || p.isModified; } catch (e2) { interesting = true; }
            if (!interesting) return;
            w(line + v);
            try { if (p.canSetExpression && p.expression !== "") w(ind + "  EXPR (" + (p.expressionEnabled ? "on" : "off") + "): " + p.expression.replace(/\r?\n|\r/g, "\n" + ind + "        ") + (p.expressionError ? "  !! " + p.expressionError : "")); } catch (e3) { }
            try { for (var k = 1; k <= p.numKeys; k++) w(ind + "  KEY " + k + " t=" + fmt(p.keyTime(k)) + " v=" + fmt(p.keyValue(k)) + ease(p, k)); } catch (e4) { }
            return;
        }
        var show = false;
        try { show = p.isModified || p.numProperties > 0; } catch (e5) { show = true; }
        if (!show) return;
        var en = ""; try { if (p.canSetEnabled) en = p.enabled ? "" : " (OFF)"; } catch (e6) { }
        w(line + en);
        for (var i = 1; i <= p.numProperties; i++) prop(p.property(i), ind + "  ");
    };
    var comps = [], seen = {};
    var dumpComp = function (c) {
        if (seen[c.id]) return; seen[c.id] = true; comps.push(c);
        w("\n================ COMP '" + c.name + "' id " + c.id + " " + c.width + "x" + c.height + " dur " + fmt(c.duration) + " fps " + fmt(c.frameRate) + " bg " + fmt(c.bgColor) + " workArea " + fmt(c.workAreaStart) + "+" + fmt(c.workAreaDuration) + " motionBlur " + c.motionBlur + " shy hidden " + c.hideShyLayers);
        var sub = [];
        for (var i = 1; i <= c.numLayers; i++) {
            var L = c.layer(i), t = "", src = "";
            if (L instanceof TextLayer) t = "Text"; else if (L instanceof ShapeLayer) t = "Shape"; else if (L instanceof CameraLayer) t = "Camera"; else if (L instanceof LightLayer) t = "Light"; else if (L.nullLayer) t = "Null"; else if (L.adjustmentLayer) t = "Adjustment"; else t = "AV";
            try { if (L.source) { src = " source '" + L.source.name + "'" + (L.source instanceof CompItem ? " (COMP)" : "") + (L.source.mainSource instanceof SolidSource ? " solid " + fmt(L.source.mainSource.color) + " " + L.source.width + "x" + L.source.height : ""); if (L.source instanceof CompItem) sub.push(L.source); } } catch (e) { }
            w("\n--- LAYER " + i + " '" + L.name + "' " + t + src);
            var sw = [];
            try { sw.push("in " + fmt(L.inPoint) + " out " + fmt(L.outPoint) + " start " + fmt(L.startTime) + " stretch " + fmt(L.stretch)); } catch (e) { }
            try { sw.push("enabled " + L.enabled + " solo " + L.solo + " shy " + L.shy + " locked " + L.locked + " label " + L.label); } catch (e) { }
            try { sw.push("blend " + L.blendingMode + " adj " + L.adjustmentLayer + " 3D " + L.threeDLayer + " mb " + L.motionBlur + " quality " + L.quality + " collapse " + L.collapseTransformation + " preserveTransp " + L.preserveTransparency); } catch (e) { }
            try { sw.push("trackMatte " + L.trackMatteType + (L.trackMatteLayer ? " from '" + L.trackMatteLayer.name + "'" : "") + " isTrackMatte " + L.isTrackMatte); } catch (e) { try { sw.push("trackMatte " + L.trackMatteType + " isTrackMatte " + L.isTrackMatte); } catch (e2) { } }
            try { if (L.parent) sw.push("parent '" + L.parent.name + "'"); } catch (e) { }
            try { if (L.comment) sw.push("comment '" + L.comment + "'"); } catch (e) { }
            w("  " + sw.join(" | "));
            for (var j = 1; j <= L.numProperties; j++) prop(L.property(j), "  ");
        }
        for (var s = 0; s < sub.length; s++) dumpComp(sub[s]);
    };
    var target = null, i;
    for (i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name.toLowerCase() === want.toLowerCase()) { target = it; break; } }
    if (!target) { w("comp not found: " + want); for (i = 1; i <= app.project.numItems; i++) w("  item " + app.project.item(i).name + " | " + app.project.item(i).typeName); o.close(); return; }
    w("project: " + (app.project.file ? app.project.file.fsName : "(unsaved)") + " bpc " + app.project.bitsPerChannel);
    dumpComp(target);
    o.close();
    // frames of the main comp every 2 frames over its work area (async; nothing in the project changes)
    var d = new Folder(OUT + "dump"); if (!d.exists) d.create();
    var fl = d.getFiles("*.png"); for (i = 0; i < fl.length; i++) fl[i].remove();
    var fd = target.frameDuration, t0 = target.workAreaStart, t1 = Math.min(target.workAreaStart + target.workAreaDuration, t0 + 8), n = 0;
    for (var tt = t0; tt < t1 - fd / 2; tt += fd * 2) { var fr = Math.round(tt / fd); target.saveFrameToPng(tt, new File(OUT + "dump/f" + (fr < 10 ? "00" : fr < 100 ? "0" : "") + fr + ".png")); n++; }
})();

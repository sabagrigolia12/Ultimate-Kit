(function () {
    var SP = "D:/Projects/Codex/tools/ae-test/out/";
    var ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(SP + "t_all_out.txt"); out.encoding = "UTF-8"; out.open("w");
    var fails = 0, oks = 0;
    function log(s) { out.writeln(s); }
    function R(label, fn, args) {
        var r = UK.parse(UK.call(fn, UK.json(args || {})));
        if (r.ok) oks++; else { fails++; log("FAIL " + label + " :: " + r.error); }
        return r;
    }
    function host(name, w, h, d) {
        var c = app.project.items.addComp(name, w || 1280, h || 720, 1, d || 8, 30);
        c.openInViewer(); c.time = 2;
        return c;
    }
    try {
        $.evalFile(new File(ROOT + "jsx/host.jsx"));
        log("load error: '" + UK_LOAD_ERROR + "'");
        var i, c;
        c = host("A_tr");
        for (i = 0; i < UK_CAT.sports.length; i++) R("sports " + UK_CAT.sports[i].id, "transition", { cat: "sports", id: UK_CAT.sports[i].id, duration: 0.3 + (i % 5) * 2, logo: i % 7 === 0 });
        for (i = 0; i < UK_CAT.saasTr.length; i++) if (!UK_CAT.saasTr[i].needsLayer) R("saas " + UK_CAT.saasTr[i].id, "transition", { cat: "saas", id: UK_CAT.saasTr[i].id, duration: 10, colors: ["#111111", "#ff0000", "#00ff00"] });
        var modes = ["in", "out", "both"];
        var lists = [UK_CAT.textSaas, UK_CAT.text];
        for (var li = 0; li < 2; li++) for (i = 0; i < lists[li].length; i++) {
            c = host("A_tx_" + lists[li][i].id);
            UK.selectOnly(c, []);
            R("text new " + lists[li][i].id, "text", { id: lists[li][i].id, mode: modes[i % 3], inDur: 0.6 + i * 0.1, outDur: 0.5 });
            // re-apply on the (now selected) layer with another mode
            R("text reapply " + lists[li][i].id, "text", { id: lists[li][i].id, mode: modes[(i + 1) % 3], inDur: 1, outDur: 1 });
        }
        c = host("A_bg", 960, 540, 6);
        for (i = 0; i < UK_CAT.halftone.length; i++) R("halftone " + UK_CAT.halftone[i].id, "halftone", { id: UK_CAT.halftone[i].id, spacing: 0.6 + (i % 4) * 0.4, dotColor: "#FFCC00", dotOpacity: 40 });
        for (i = 0; i < UK_CAT.gradients.length; i++) R("gradient " + UK_CAT.gradients[i].id, "gradient", { id: UK_CAT.gradients[i].id });
        c = host("A_3d");
        for (i = 0; i < UK_CAT.icons3d.length; i++) R("icon3d " + UK_CAT.icons3d[i].id, "icon3d", { id: UK_CAT.icons3d[i].id, inDur: 0.5, hold: 0, outDur: 0.5 });
        // bounce: all combos
        var types = ["overshoot", "bounce"], bmodes = ["live", "keys"];
        for (var ti = 0; ti < 2; ti++) for (var mi = 0; mi < 2; mi++) {
            c = host("A_bn_" + types[ti] + "_" + bmodes[mi]);
            var L = UK.shapeLayer(c, "Box");
            UK.addRect(UK.vecs(UK.group(UK.root(L), "Box")), [120, 120], [0, 0], 12);
            UK.addFill(UK.vecs(UK.root(L).property("Box")), "#7C5CFF");
            UK._fd = c.frameDuration;
            UK.anim(UK.pos(L), [[0.5, [200, 360]], [1.2, [900, 360]], [3, [900, 360]], [3.5, [400, 200]]], ["inout", "linear", "in"]);
            UK.anim(UK.scale(L), [[0.5, [0, 0]], [1.0, [100, 100]]], ["out"]);
            UK.anim(UK.rot(L), [[0.5, -90], [1.1, 0]], ["out"]);
            UK.selectOnly(c, [L]);
            var rb = R("bounce " + types[ti] + " " + bmodes[mi], "bounce", { prop: "all", type: types[ti], mode: bmodes[mi], strength: "strong" });
            if (rb.ok) log("  bounce " + types[ti] + "/" + bmodes[mi] + ": " + rb.data.applied.join(", ") + " | pos keys=" + UK.pos(L).numKeys + " scale keys=" + UK.scale(L).numKeys);
            if (bmodes[mi] === "live") R("bounceRemove", "bounceRemove", {});
        }
        // glass
        c = host("A_glass");
        var st = ["frosted", "liquid", "tint"];
        for (i = 0; i < 3; i++) { UK.selectOnly(c, []); R("glass " + st[i], "glass", { style: st[i], tint: "#22D3EE" }); }
        var shp = UK.shapeLayer(c, "Card Shape"); UK.addEllipse(UK.vecs(UK.group(UK.root(shp), "E")), [300, 200], [0, 0]); UK.addFill(UK.vecs(UK.root(shp).property("E")), "#ff0000");
        UK.selectOnly(c, [shp]); R("glass on shape", "glass", { style: "frosted" });
        // svg import
        c = host("A_svg");
        R("svg import", "importSvg", { name: "test", data: { w: 200, h: 100, groups: [{ name: "r", fill: "#ff6600", stroke: "#222222", strokeWidth: 2, paths: [{ v: [[0, 0], [80, 0], [80, 60], [0, 60]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], c: true }] }, { name: "hole", fill: "#14c878", evenOdd: true, opacity: 0.5, paths: [{ v: [[100, 0], [200, 0], [200, 100], [100, 100]], c: true }, { v: [[130, 30], [170, 30], [170, 70], [130, 70]], c: true }] }] } });
        // hover with gradient + stroke, add later, cursor of each type
        c = host("A_hover");
        var bs = [];
        for (i = 0; i < 3; i++) { var B = UK.shapeLayer(c, "Btn " + i); UK.addRect(UK.vecs(UK.group(UK.root(B), "G")), [200, 80], [0, 0], 20); UK.addFill(UK.vecs(UK.root(B).property("G")), "#333333"); UK.pos(B).setValue([300 + i * 300, 360]); bs.push(B); }
        var T = UK.addText(c, "Label", { size: 60, pos: [640, 560] }); bs.push(T);
        UK.selectOnly(c, bs);
        R("hoverMake", "hoverMake", { fill: "gradient", stroke: true });
        var A = UK.shapeLayer(c, "Arrow"); UK.addPath(UK.vecs(UK.group(UK.root(A), "A")), [[0, 0], [0, 40], [28, 28]]); UK.addFill(UK.vecs(UK.root(A).property("A")), "#ffffff");
        UK.anim(UK.pos(A), [[0, [100, 100]], [2, [600, 360]]], ["inout"]);
        R("makeCursor", "makeCursor", { layer: "Arrow", click: "spark", pressMs: 300 });
        var GL = null; for (i = 1; i <= c.numLayers; i++) if (c.layer(i).name.indexOf("Hover Group") === 0) GL = c.layer(i);
        UK.selectOnly(c, [GL]);
        R("hoverAdd fill", "hoverAdd", { what: "fill" });
        R("hoverAdd stroke", "hoverAdd", { what: "stroke" });
        R("hoverRelink", "hoverRelink", {});
        // expression sweep over the whole project
        var bad = 0, total = 0;
        function walk(g, path) {
            for (var k = 1; k <= g.numProperties; k++) {
                var p = g.property(k);
                if (p.numProperties !== undefined && p.propertyType !== PropertyType.PROPERTY) { walk(p, path + "/" + p.name); continue; }
                if (!p.canSetExpression || !p.expressionEnabled || p.expression === "") continue;
                total++;
                try { p.valueAtTime(1.5, false); } catch (e) { if (String(e.message).indexOf("invalid numeric") < 0) { bad++; log("  EXPR THROW " + path + "/" + p.name + " :: " + e.message); } }
                if (p.expressionError) { bad++; log("  EXPR ERR " + path + "/" + p.name + " :: " + p.expressionError); }
            }
        }
        for (i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem) for (var j = 1; j <= it.numLayers; j++) walk(it.layer(j), it.name + ":" + it.layer(j).name); }
        log("expressions checked=" + total + " errors=" + bad);
    } catch (e) { log("ERR " + e.toString() + " line " + e.line + " " + e.fileName); fails++; }
    log("TOTAL ok=" + oks + " fail=" + fails);
    out.close();
})();

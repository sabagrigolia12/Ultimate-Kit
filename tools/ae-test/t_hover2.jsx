// Hover fill + stroke: WR_hover with a rectangle (blue fill + thin red stroke), a second rectangle without stroke and a
// text, a "Cursor" shape over the first rectangle; Make Layers Hover (red fill, green 12 px stroke) on the 3 layers
// (UK.comp pointed at the test comp for the call, restored after); logs errors, renders out/hover2/.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "hover2"); if (!fo.exists) fo.create();
    var out = new File(OUT + "hover2/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [], keep = null;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var c = app.project.items.addComp("WR_hover", 1920, 1080, 1, 4, 30);
        UK._fd = c.frameDuration;
        var mkRect = function (name, x, stroke) {
            var L = UK.shapeLayer(c, name), g = UK.group(UK.root(L), "Rectangle 1");
            UK.addRect(UK.vecs(g), [360, 220], [0, 0], 24);
            if (stroke) UK.addStroke(UK.vecs(UK.root(L).property("Rectangle 1")), "#FF3030", 3);
            UK.addFill(UK.vecs(UK.root(L).property("Rectangle 1")), "#2050D0");
            UK.pos(L).setValue([x, 540]);
            return L;
        };
        var A = mkRect("Rect Stroke", 560, true), B = mkRect("Rect NoStroke", 1060, false);
        var T = UK.addText(c, "Label", { name: "Label", size: 90, pos: [1500, 540] });
        var Cu = UK.shapeLayer(c, "Cursor");
        UK.addEllipse(UK.vecs(UK.group(UK.root(Cu), "Dot")), [20, 20], [0, 0]); UK.addFill(UK.vecs(UK.root(Cu).property("Dot")), "#FFFF00");
        UK.anchor(Cu).setValue([0, 0]);
        UK.anim(UK.pos(Cu), [[0, [560, 540]], [1.4, [560, 540]], [1.6, [1060, 540]], [2.4, [1060, 540]], [2.6, [1500, 540]]], ["linear", "linear", "linear", "linear"]);
        for (var i = 1; i <= c.numLayers; i++) c.layer(i).selected = (c.layer(i) === A || c.layer(i) === B || c.layer(i) === T);
        keep = UK.comp; UK.comp = function () { return c; };
        var r = UK.api.hoverMake({ fill: "color", fillColor: "#FF2020", fillColor2: "#22D3EE", stroke: true, strokeColor: "#20FF60", strokeWidth: 12, cursor: "Cursor" });
        UK.comp = keep; keep = null;
        out.writeln("make " + UK.json(r));
        var G = null; for (i = 1; i <= c.numLayers; i++) if (c.layer(i).source instanceof CompItem) G = c.layer(i).source;
        var errs = [], walk = function (p, path) { for (var jj = 1; jj <= p.numProperties; jj++) { var y = p.property(jj); if (y.propertyType === PropertyType.PROPERTY) { try { if (y.canSetExpression && y.expression !== "") { y.valueAtTime(1, false); if (y.expressionError) errs.push(path + "/" + y.name + ": " + y.expressionError); } } catch (e9) { } } else walk(y, path + "/" + y.name); } };
        for (i = 1; i <= G.numLayers; i++) walk(G.layer(i), G.layer(i).name);
        var order = [], V = G.layer("Rect Stroke").property("ADBE Root Vectors Group").property("Rectangle 1").property("ADBE Vectors Group");
        for (i = 1; i <= V.numProperties; i++) order.push(V.property(i).name);
        out.writeln("errors " + errs.length + " " + errs.slice(0, 6).join(" ; ") + " | Rect Stroke group: " + order.join(", "));
        renders.push([c, 0.2, OUT + "hover2/f_start.png"], [c, 1.2, OUT + "hover2/f_rect.png"], [c, 2.2, OUT + "hover2/f_rect2.png"], [c, 3.5, OUT + "hover2/f_text.png"]);
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    if (keep) UK.comp = keep;
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var rr = 0; rr < renders.length; rr++) renders[rr][0].saveFrameToPng(renders[rr][1], new File(renders[rr][2]));
})();

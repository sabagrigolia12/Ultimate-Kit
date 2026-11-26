(function () {
    var C = null, i, o = [];
    C = app.project.items.addComp("WR_orient", 500, 500, 1, 3, 30);
    var L = C.layers.addSolid([1, 1, 1], "WR_probe", 100, 100, 1); L.threeDLayer = true;
    var p = L.property("ADBE Transform Group").property("ADBE Orientation");
    p.setValueAtTime(0, [0, 0, 0]); p.setValueAtTime(1, [40, 300, 20]);
    var ts = [0, 0.25, 0.5, 0.75, 0.9, 0.99, 0.999, 1];
    for (i = 0; i < ts.length; i++) o.push(ts[i] + ": " + p.valueAtTime(ts[i], true).join(","));
    p.setValueAtTime(2, [40, 370, -10]); o.push("set 370,-10 -> " + p.keyValue(3).join(","));
    L.remove(); C.remove();
    var f = new File("D:/Projects/Codex/tools/ae-test/out/orient.txt"); f.open("w"); f.writeln(o.join("\n")); f.close();
})();

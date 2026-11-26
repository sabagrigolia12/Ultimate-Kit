// READ ONLY: every property in the project carrying an Ultimate Kit bounce / overshoot expression, with its error,
// keys and layer kind -> out/bn_dump.txt
(function () {
    var o = [], i, j;
    var walk = function (L, p, path) {
        for (var k = 1; k <= p.numProperties; k++) {
            var q = p.property(k);
            if (q.propertyType === PropertyType.PROPERTY) {
                try {
                    if (q.expression && q.expression.indexOf("// Ultimate Kit") === 0) {
                        var v = q.value;
                        o.push("  " + path + "/" + q.name + " (" + q.matchName + ") keys " + q.numKeys + " | enabled " + q.expressionEnabled + " | error: " + (q.expressionError || "-") + " | value " + ((v instanceof Array) ? v.join(",") : v) + " | dims sep " + (q.dimensionsSeparated || false) + " | " + q.expression.split("\n")[0]);
                    }
                } catch (e) { o.push("  read error " + e.message); }
            } else walk(L, q, path + "/" + q.name);
        }
    };
    o.push("AE " + app.version + " items " + app.project.numItems);
    for (i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (!(it instanceof CompItem)) continue;
        for (j = 1; j <= it.numLayers; j++) {
            var L = it.layer(j), n = o.length;
            walk(L, L, "");
            if (o.length > n) o.splice(n, 0, "comp " + it.name + " | layer " + j + " " + L.name + " | 3D " + L.threeDLayer + " | " + (L instanceof ShapeLayer ? "shape" : (L instanceof TextLayer ? "text" : "av")) + " | effects: " + (function () { var a = [], E = L.property("ADBE Effect Parade"); for (var k = 1; k <= E.numProperties; k++) a.push(E.property(k).name); return a.join(", "); })());
        }
    }
    var f = new File("D:/Projects/Codex/tools/ae-test/out/bn_dump.txt"); f.encoding = "UTF-8"; f.open("w"); f.writeln(o.join("\n")); f.close();
})();

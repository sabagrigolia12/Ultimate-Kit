// Responsiveness check: longer name / title in the White Plate and News Plates test builds, then one frame each.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var want = { "LT_lt03": 1, "LT_lt12": 1, "LT_lt31": 1 };
    for (var i = 1; i <= app.project.numItems; i++) {
        var c = app.project.item(i);
        if (!(c instanceof CompItem) || !want[c.name]) continue;
        want[c.name] = 0;
        var ic = c.layer(1).source;
        for (var j = 1; j <= ic.numLayers; j++) {
            var L = ic.layer(j);
            if (L.name === "Name" || L.name === "Title") {
                var td = L.property("ADBE Text Properties").property("ADBE Text Document"), d = td.value;
                d.text = L.name === "Name" ? "Alexandra Morgan-Smith" : "Head of Product Design";
                td.setValue(d);
            }
        }
        c.saveFrameToPng(1.6, new File(OUT + "resp_" + c.name + ".png"));
    }
})();

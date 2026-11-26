// Changes the Text of a few test cards (inside their precomps) and renders one frame each, to check that the
// 2D Text Box card and every detail follow the new text.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var want = { "CD_cd02": "Champagne & Gold Leaf", "CD_cd04": "Runner", "CD_cd06": "Hand-picked Fresh Herbs", "CD_cd14": "Fresh\rBasil", "CD_cd25": "A much longer neon outline" };
    for (var i = 1; i <= app.project.numItems; i++) {
        var c = app.project.item(i);
        if (!(c instanceof CompItem) || !want[c.name]) continue;
        var ic = c.layer(1).source;
        for (var j = 1; j <= ic.numLayers; j++) {
            var L = ic.layer(j);
            if (L.name !== "Text") continue;
            var td = L.property("ADBE Text Properties").property("ADBE Text Document"), d = td.value;
            d.text = want[c.name];
            td.setValue(d);
        }
        c.saveFrameToPng(2.0, new File(OUT + "resp_" + c.name + ".png"));
    }
})();

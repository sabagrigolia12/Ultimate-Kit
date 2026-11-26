// Frames of the matrix comps (saveFrameToPng runs on after the script): out/px/<comp>_<frame>.png
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/px/", want = {
        WR_pxA: [12, 13, 14, 16, 32, 100], WR_pxF: [32, 100, 152], WR_pxH: [170], WR_pxK: [32, 152], WR_pxL: [32], WR_pxM: [32, 75, 100, 152]
    }, n = 0, i;
    for (i = 1; i <= app.project.numItems; i++) {
        var c = app.project.item(i);
        if (!(c instanceof CompItem) || !want[c.name]) continue;
        for (var k = 0; k < want[c.name].length; k++) { c.saveFrameToPng(want[c.name][k] / 30, new File(OUT + c.name + "_" + want[c.name][k] + ".png")); n++; }
    }
    $.global.PX_MATRIX_R = n;
})();

(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "t_cine_out.txt"); out.encoding = "UTF-8"; out.open("w");
    function log(s) { out.writeln(s); }
    try {
        var UK_ROOT = ROOT;
        $.evalFile(new File(ROOT + "jsx/host.jsx"));
        log("load error: '" + UK_LOAD_ERROR + "'");
        var L = UK_CAT.cinematic;
        for (var i = 0; i < L.length; i++) {
            var c = app.project.items.addComp("CN_" + L[i].id, 960, 540, 1, 20, 30);
            c.openInViewer();
            var r = UK.parse(UK.call("cinematic", UK.json({ id: L[i].id, fullComp: true, speed: 100, softness: 100, grain: 16 })));
            if (!r.ok) { log("FAIL " + L[i].id + " :: " + r.error); continue; }
            var Ly = c.layer(r.data.name);
            var tr = Ly.property("ADBE Time Remapping");
            log("OK " + L[i].id + " " + r.data.name + " in=" + Ly.inPoint + " out=" + Ly.outPoint + " tr(0)=" + tr.valueAtTime(0, false).toFixed(2) + " tr(19)=" + tr.valueAtTime(19, false).toFixed(2) + " err='" + tr.expressionError + "'");
        }
        // custom: speed 200, duration 5s from playhead, custom colours
        var c2 = app.project.items.addComp("CX_custom", 960, 540, 1, 20, 30);
        c2.openInViewer(); c2.time = 3;
        var r2 = UK.parse(UK.call("cinematic", UK.json({ id: "cb01", fullComp: false, duration: 5, speed: 200, softness: 50, grain: 25, colors: ["#000000", "#002244", "#0066CC", "#33CCFF", "#FFFFFF"] })));
        log("custom: " + (r2.ok ? UK.json(r2.data) + " in=" + c2.layer(r2.data.name).inPoint + " out=" + c2.layer(r2.data.name).outPoint : r2.error));
    } catch (e) { log("ERR " + e.toString() + " line " + e.line + " " + e.fileName); }
    out.close();
})();


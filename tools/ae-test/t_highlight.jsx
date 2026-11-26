// Highlighter test, step 1 (through the panel's evalScript or run-ae): a 1920x1080 test comp WR_hl with 30 words
// "Highlight" in a 5 x 6 grid on a dark ground, one look each (UK.api.highlight with UK.comp pointed at the test comp),
// then every expression checked for errors. Logs its items for t_cleanup_created.jsx; never touches other comps.
// Result in $.global.HL_TEST and out/hl_test.txt. Frames: t_hl_render.jsx (a separate pass).
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", before = {}, q, log = [];
    if (!app.project) { $.global.HL_TEST = "no project"; return; }
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    var c = app.project.items.addComp("WR_hl", 1920, 1080, 1, 6, 30), i;
    c.layers.addSolid([0.1, 0.1, 0.11], "WR_bg", 1920, 1080, 1);
    var keep = UK.comp, looks = UK_HL.LOOKS, words = [];
    UK.comp = function () { return c; };
    try {
        for (i = 0; i < looks.length; i++) {
            var col = i % 5, row = Math.floor(i / 5);
            var T = UK.addText(c, "Highlight", { size: 54, color: looks[i].bg === "light" ? "#1A1A1A" : "#FFFFFF", name: "W " + looks[i].id, tracking: 0, pos: [200 + col * 380, 110 + row * 172] });
            T.outPoint = 5;
            if (looks[i].bg === "light") {
                var S = c.layers.addSolid([0.92, 0.92, 0.92], "WR_light " + looks[i].id, 360, 160, 1);
                S.property("ADBE Transform Group").property("ADBE Position").setValue([200 + col * 380, 110 + row * 172]);
                S.moveBefore(c.layer("WR_bg"));          // (a light patch just over the dark ground, under everything else)
            }
            words.push(T);
        }
        c.time = 0.5;
        for (i = 0; i < looks.length; i++) {
            for (q = 1; q <= c.numLayers; q++) c.layer(q).selected = false;
            words[i].selected = true;
            try {
                var r = UK.api.highlight({ id: looks[i].id, mode: "both", dIn: 0.6, dOut: 0.45, pad: 100, round: null, reveal: true, ink: true, mb: true });
                log.push(looks[i].id + " ok " + r.layers.join(", "));
            } catch (e1) { log.push(looks[i].id + " ERROR " + e1.message + " line " + e1.line); }
        }
    } finally { UK.comp = keep; }
    /* every expression in the comp: errors? */
    var errs = 0, nexp = 0;
    var walk = function (g, path) {
        for (var k = 1; k <= g.numProperties; k++) {
            var p = g.property(k);
            if (p.propertyType === PropertyType.PROPERTY) {
                if (p.canSetExpression && p.expression !== "") { nexp++; if (p.expressionError && p.expressionError !== "") { errs++; log.push("EXPR " + path + "/" + p.name + ": " + p.expressionError); } }
            } else walk(p, path + "/" + p.name);
        }
    };
    c.time = 1.2;
    for (q = 1; q <= c.numLayers; q++) walk(c.layer(q), c.layer(q).name);
    log.push("expressions " + nexp + ", errors " + errs + ", layers " + c.numLayers);
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    var f = new File(OUT + "hl_test.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\n")); f.close();
    $.global.HL_TEST = log.join("\n");
})();

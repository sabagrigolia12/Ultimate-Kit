// Which text presets tint the text with the accent: applies every UK.TX.P preset to a new layer (one comp
// WR_acc, layers removed after each) and logs the ids whose result got the "UK Accent" control (linkAccent hit).
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var out = new File(OUT + "accentscan.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q;
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx"));
        var c = app.project.items.addComp("WR_acc", 1920, 1080, 1, 6, 30), yes = [], no = [], k;
        UK._fd = c.frameDuration;
        for (k in UK.TX.P) {
            if (!UK.TX.P.hasOwnProperty(k)) continue;
            try {
                var L = UK.addText(c, UK.TX.DEFAULT_TEXT[k] || "Value Created", { name: "T_" + k, size: 120 });
                L.startTime = 0; L.inPoint = 0; L.outPoint = 5;
                UK.TX.applyOne({ id: k }, UK.TX.P[k], c, L, 0, true, 1, 0.8, 2, "#7C5CFF", "both");
                (UK.efx(L, "UK Accent On") ? yes : no).push(k);
            } catch (e1) { no.push(k + "(err " + e1 + ")"); }
            for (var i = c.numLayers; i >= 1; i--) c.layer(i).remove();
        }
        out.writeln("accent: " + yes.sort().join(" "));
        out.writeln("none:   " + no.sort().join(" "));
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
})();

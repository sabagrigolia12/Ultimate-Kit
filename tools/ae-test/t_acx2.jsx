// Runs the plugin's own sound extraction (UK.api.acExtract) on the voice layer the panel finds, like Transcribe does,
// and reports the result or the error. The temporary comp / queue item are removed by acExtract itself. -> out/acx2.txt
(function () {
    var o = [];
    try {
        var s = UK.api.acSource({});
        o.push("source: " + decodeURIComponent(s.file) + " " + s.size + " bytes, video " + s.video);
        var t0 = new Date().getTime();
        var r = UK.api.acExtract({ path: s.path });
        o.push("extract: " + decodeURIComponent(r.path) + " " + r.size + " bytes in " + (new Date().getTime() - t0) + " ms");
    } catch (e) { o.push("ERROR " + e.message + " line " + e.line); }
    o.push("items now " + app.project.numItems + ", render queue " + app.project.renderQueue.numItems);
    var f = new File("D:/Projects/Codex/tools/ae-test/out/acx2.txt"); f.encoding = "UTF-8"; f.open("w"); f.writeln(o.join("\n")); f.close();
})();

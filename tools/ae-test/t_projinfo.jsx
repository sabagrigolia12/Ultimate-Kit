// Logs the project's colour settings and item count (read only).
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/projinfo.txt"); o.open("w");
    var P = app.project, s = "";
    try { s += "bpc " + P.bitsPerChannel + " linearBlending " + P.linearBlending + " linearize " + P.linearizeWorkingSpace + " ws '" + P.workingSpace + "' items " + P.numItems; } catch (e) { s += " err " + e; }
    try { s += " colorMgmt " + P.colorManagementSystem + " gamma " + P.workingGamma; } catch (e2) { }
    o.write(s); o.close();
})();

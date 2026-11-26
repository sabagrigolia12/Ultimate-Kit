// Loads the plugin's host.jsx and reports module load errors.
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/t_load.txt"); out.open("w");
    try { var UK_ROOT = "D:/Projects/Codex/UltimateKit"; $.evalFile(new File(UK_ROOT + "/jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'"); out.writeln("text presets: " + (function () { var n = 0; for (var k in UK.TX.P) n++; return n; })() + ", underline: " + (typeof UK.api.underline) + ", lib: " + (typeof UK.api.libSave)); }
    catch (e) { out.writeln("ERR " + e.toString() + " line " + e.line); }
    out.close();
})();

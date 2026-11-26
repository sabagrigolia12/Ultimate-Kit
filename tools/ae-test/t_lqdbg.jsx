// READ ONLY debug: what UK.api.glass is after loading the source host.
var UK_ROOT = "D:/Projects/Codex/UltimateKit/"; $.evalFile(new File(UK_ROOT + "jsx/host.jsx"));
var o=new File("D:/Projects/Codex/tools/ae-test/out/liquid/dbg.txt");o.open("w"); o.writeln("load " + UK_LOAD_ERROR + " | buildLiquid " + typeof UK.GL.buildLiquid + " | LQ " + typeof UK.GL.LQ); o.writeln(UK.api.glass.toString()); o.close();

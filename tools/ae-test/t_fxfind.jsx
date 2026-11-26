// READ ONLY: effects whose name contains "wave" or "displacement" (display name + matchName).
var o=new File("D:/Projects/Codex/tools/ae-test/out/fxfind.txt");o.open("w");for(var i=0;i<app.effects.length;i++){var e=app.effects[i];if(/wave|displacement map/i.test(e.displayName))o.writeln(e.displayName+" | "+e.matchName+" | "+e.category);}o.close();

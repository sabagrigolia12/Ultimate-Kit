// Removes only my test items WR_ww (comp), WR_s (solid, once unused) and an empty Solids folder. Logs what it removed.
(function(){ var o=new File("D:/Projects/Codex/tools/ae-test/out/rm_ww.txt"); o.open("w"); var i, it;
for(i=app.project.numItems;i>=1;i--){ it=app.project.item(i); if(it instanceof CompItem && it.name=="WR_ww"){ o.writeln("removed comp "+it.name); it.remove(); } }
for(i=app.project.numItems;i>=1;i--){ it=app.project.item(i); if(it instanceof FootageItem && it.name=="WR_s" && it.usedIn.length==0){ o.writeln("removed solid "+it.name); it.remove(); } }
for(i=app.project.numItems;i>=1;i--){ it=app.project.item(i); if(it instanceof FolderItem && it.name=="Solids" && it.numItems==0){ o.writeln("removed folder "+it.name); it.remove(); } }
o.writeln("items now "+app.project.numItems+" file "+(app.project.file?app.project.file.fsName:"(unsaved)")); o.close(); })();

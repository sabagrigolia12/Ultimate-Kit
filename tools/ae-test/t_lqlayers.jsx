// READ ONLY: layers of the WR_liquid test comp.
var o=new File("D:/Projects/Codex/tools/ae-test/out/liquid/layers.txt");o.open("w");for(var i=1;i<=app.project.numItems;i++){var it=app.project.item(i);if(it instanceof CompItem&&it.name=="WR_liquid"){for(var j=1;j<=it.numLayers;j++)o.writeln(j+" "+it.layer(j).name+" | "+it.layer(j).comment.substr(0,60));}}o.close();

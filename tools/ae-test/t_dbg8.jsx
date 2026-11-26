var f = new File("D:/Projects/Codex/tools/ae-test/out/dbg8.txt"); f.open("w");
var c = null; for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name === "ST_st08") c = app.project.item(i);
var L = c.layer(1); var A = L.property("ADBE Text Properties").property("ADBE Text Animators");
for (var a = 1; a <= A.numProperties; a++) {
  var an = A.property(a); f.writeln("animator " + an.name);
  var S = an.property("ADBE Text Selectors");
  for (var s = 1; s <= S.numProperties; s++) { var sel = S.property(s); f.writeln("  sel " + sel.name + " / " + sel.matchName);
    for (var q = 1; q <= sel.numProperties; q++) { var p = sel.property(q); var v = "?"; if (p.propertyType === PropertyType.PROPERTY) { try { v = String(p.value); } catch (e) { v = "?"; } } else { v = "(group " + p.numProperties + ")"; } f.writeln("     " + p.matchName + " = " + v + (p.expression ? "  EXPR(" + p.expressionError + ")" : "")); } }
}
f.close();
c.saveFrameToPng(0.32, new File("D:/Projects/Codex/tools/ae-test/out/st08_start.png"));


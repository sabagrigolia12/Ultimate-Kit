var f = new File("D:/Projects/Codex/tools/ae-test/out/dd.txt"); f.open("w");
var c = null; for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name === "ST_st15") c = app.project.item(i);
var L = c.layer(1), E = L.property("ADBE Effect Parade");
for (var k = 1; k <= E.numProperties; k++) { var e = E.property(k); f.writeln(k + " " + e.name + " / " + e.matchName); }
var dd = E.property("UK Currency"); f.writeln("dd=" + dd);
if (dd) { for (var q = 1; q <= dd.numProperties; q++) { var p = dd.property(q); var v = "?"; try { v = p.value; } catch (x) {} f.writeln("  " + p.matchName + " = " + v); } }
var tx = L.property("ADBE Text Properties").property("ADBE Text Document"); f.writeln("expr err: " + tx.expressionError); f.writeln("text: " + tx.valueAtTime(2, false).text);
try { var t2 = app.project.items.addComp("DDTEST", 100, 100, 1, 1, 30); var s = t2.layers.addSolid([0,0,0], "x", 100, 100, 1); var d2 = s.property("ADBE Effect Parade").addProperty("ADBE Dropdown Control"); var m = d2.property(1); f.writeln("menu prop: " + m.matchName + " canParams=" + (typeof m.setPropertyParameters)); m.setPropertyParameters(["None", "$", "E"]); f.writeln("set params ok"); s.property("ADBE Effect Parade").property(1).property(1).setValue(2); f.writeln("set value ok " + s.property("ADBE Effect Parade").property(1).property(1).value); t2.remove(); } catch (er) { f.writeln("ERR " + er.message); }
f.close();

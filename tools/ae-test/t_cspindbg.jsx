// Read only: transforms of the Card Spin rig at 1.2 s.
(function () {
    var out = new File("D:/Projects/Codex/tools/ae-test/out/cspin/dbg.txt"); out.open("w");
    var P = null; for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name === "Card Spin") P = app.project.item(i);
    var t = 1.2, g = function (L, m) { try { var v = L.property("ADBE Transform Group").property(m).valueAtTime(t, false); return (v instanceof Array) ? v.join(",") : v; } catch (e) { return "ERR " + e; } };
    var names = ["Ring Tilt", "Ring Spin", "WR_photo5", "WR_photo4"];
    for (i = 0; i < names.length; i++) {
        var L = P.layer(names[i]);
        out.writeln(names[i] + " 3d " + L.threeDLayer + " pos " + g(L, "ADBE Position") + " anc " + g(L, "ADBE Anchor Point") + " scale " + g(L, "ADBE Scale") + " rx " + g(L, "ADBE Rotate X") + " ry " + g(L, "ADBE Rotate Y") + " rz " + g(L, "ADBE Rotate Z") + " orient " + g(L, "ADBE Orientation") + " parent " + (L.parent ? L.parent.name : "-") + " size " + L.width + "x" + L.height);
    }
    var mk = P.layer("WR_photo5").property("ADBE Mask Parade"); out.writeln("masks " + mk.numProperties + (mk.numProperties ? " verts " + mk.property(1).property("ADBE Mask Shape").value.vertices.join(" ") : ""));
    out.close();
})();

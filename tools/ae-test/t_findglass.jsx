// READ ONLY: finds comps that hold a "Glass Base" layer (the user's own Apply), logs their glass layers' key values
// and saves the current frame of each to out/userglass_<n>.png.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/findglass.txt"); o.encoding = "UTF-8"; o.open("w");
    var n = 0;
    for (var i = 1; i <= app.project.numItems; i++) {
        var c = app.project.item(i);
        if (!(c instanceof CompItem)) continue;
        for (var j = 1; j <= c.numLayers; j++) {
            var L = c.layer(j);
            if (!/^Glass (Base|Rim|Frost)|^Lens Map/.test(L.name)) continue;
            var s = "comp '" + c.name + "' " + c.width + "x" + c.height + " t=" + c.time.toFixed(2) + " | " + j + " " + L.name + " adj=" + L.adjustmentLayer + " parent=" + (L.parent ? L.parent.name : "-");
            try { s += " pos=" + L.property("ADBE Transform Group").property("ADBE Position").value.toString() + " scale=" + L.property("ADBE Transform Group").property("ADBE Scale").value.toString(); } catch (e) { }
            try { var r = L.property("ADBE Root Vectors Group").property("Glass").property("ADBE Vectors Group").property("Rect"); s += " rect=" + r.property("ADBE Vector Rect Size").value.toString() + " round=" + r.property("ADBE Vector Rect Roundness").value; } catch (e2) { }
            try { var st = L.property("ADBE Root Vectors Group").property("Glass").property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke"); if (st) s += " strokeW=" + st.property("ADBE Vector Stroke Width").value; } catch (e3) { }
            o.writeln(s);
            if (/^Glass Base/.test(L.name)) { c.saveFrameToPng(c.time, new File("D:/Projects/Codex/tools/ae-test/out/userglass_" + n + ".png")); n++; }
        }
    }
    o.writeln("frames " + n);
    o.close();
})();

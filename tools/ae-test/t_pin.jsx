// Position pinning + precomp anchors. For st16 / st17 / st26 / st05 / tx01: an existing, centre-justified text layer at
// [520, 310] (WR_pin_<id>), applyOne (not new), compare the text box centre (comp space) before / after; st16 is
// then wrapped (UK.TX.wrap) and the precomp's anchor vs the text centre is logged. Renders f_<id>.png at 3 s.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", ROOT = "D:/Projects/Codex/UltimateKit/";
    var fo = new Folder(OUT + "pin"); if (!fo.exists) fo.create();
    var out = new File(OUT + "pin/out.txt"); out.encoding = "UTF-8"; out.open("w");
    var before = {}, q, renders = [];
    for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true;
    try {
        var UK_ROOT = ROOT; $.evalFile(new File(ROOT + "jsx/host.jsx")); out.writeln("load error: '" + UK_LOAD_ERROR + "'");
        var ids = ["st16", "st17", "st26", "st05", "tx01"];
        var ctr = function (L, t) { var r = L.sourceRectAtTime(t, false); return UK.toCompPt(L, [r.left + r.width / 2, r.top + r.height / 2], t); };
        for (var k = 0; k < ids.length; k++) {
            var c = app.project.items.addComp("WR_pin_" + ids[k], 1920, 1080, 1, 6, 30);
            UK._fd = c.frameDuration;
            var L = UK.addText(c, "Value Created", { name: "T", size: 120, pos: [520, 310] });
            L.startTime = 0; L.inPoint = 0; L.outPoint = 5;
            var b0 = ctr(L, 3);
            UK.TX.applyOne({ id: ids[k] }, UK.TX.P[ids[k]], c, L, 0, false, 1, 0.8, 2, "#7C5CFF", "both");
            var b1 = ctr(L, 3);
            var s = ids[k] + " before " + UK.round(b0[0], 1) + "," + UK.round(b0[1], 1) + " after " + UK.round(b1[0], 1) + "," + UK.round(b1[1], 1);
            if (ids[k] === "st16") {
                var PL = UK.TX.wrap(c, L);
                if (PL) {
                    var A = PL.property("ADBE Transform Group").property("ADBE Anchor Point").value, IL = UK.TX.wrapText(PL.source);
                    var ic = ctr(IL, 3), vis = UK.toParent(PL, ic, 3);
                    s += " | wrapped: anchor " + UK.round(A[0], 1) + "," + UK.round(A[1], 1) + " inner text centre " + UK.round(ic[0], 1) + "," + UK.round(ic[1], 1) + " on screen " + UK.round(vis[0], 1) + "," + UK.round(vis[1], 1);
                } else s += " | no wrap";
            }
            out.writeln(s);
            renders.push([c, 3, OUT + "pin/f_" + ids[k] + ".png"]);
        }
    } catch (e0) { out.writeln("ERR " + e0.toString() + " line " + e0.line + " " + e0.fileName); }
    try { var cfo = new File(OUT + "sb_created.txt"); cfo.open("a"); for (var z = 1; z <= app.project.numItems; z++) if (!before[app.project.item(z).id]) cfo.writeln(app.project.item(z).id + "|" + app.project.item(z).name); cfo.close(); } catch (e3) { }
    out.close();
    for (var r = 0; r < renders.length; r++) renders[r][0].saveFrameToPng(renders[r][1], new File(renders[r][2]));
})();

// Removes exactly the items the tests created, logged in out/sb_created.txt as "id" or "id|name" lines.
// Safety: an item is removed only if its id is logged AND (when a name was logged) its name still matches,
// and comps only when their name is a test name. If the project changed in between (other ids), nothing
// of the user's matches. Order: comps, then unused footage / solids, then empty folders.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/";
    var TEST = /^(SB_|ST_|UL_|LT_|TR_|CD_|DR_|UKDUMP|UKPAL|UKVID|UK Depth Frame|WR_|Wipe Reveal$|UKDUMP|Spin Carousel$|Gradient \d$|Star Gradient$|Ball - |Card - |Tiles - |Hover Group|Cursor \(\d+\)$|Card Spin( \(\d+\))?$|Photo Burst( \(\d+\))?$|Sphere Carousel( \(\d+\))?$|Card Swap( \(\d+\))?$|Card Deck( \(\d+\))?$|BG Overlay - |Text \d+( \(\d+\))?$|Flag( Flag| Wave Map)?( \(\d+\))?$|Photo \d+( \(\d+\))?$|Last Image$|T \(UK\)$|Focus Carousel( \(\d+\))?$|Card \d+( \(\d+\))?$|Glass Source( \(\d+\))?$)/;
    var f = new File(OUT + "sb_created.txt"), ids = {}, n = 0, i, pass, skipped = 0, gone = [];
    if (f.exists) {
        f.open("r"); var s = f.read(); f.close();
        var a = s.split(/[\r\n]+/);
        for (i = 0; i < a.length; i++) { if (!a[i]) continue; var bar = a[i].indexOf("|"); if (bar < 0) ids[Number(a[i])] = true; else ids[Number(a[i].substr(0, bar))] = a[i].substr(bar + 1); }
    }
    var mine = function (it) { var v = ids[it.id]; if (!v) return false; if (v !== true && v !== it.name) { skipped++; return false; } return true; };
    for (pass = 0; pass < 4; pass++) {
        for (i = app.project.numItems; i >= 1; i--) {
            var it = app.project.item(i);
            if (!mine(it)) continue;
            if (it instanceof CompItem) { if (TEST.test(it.name) && (pass === 0 || it.usedIn.length === 0)) { gone.push("comp " + it.id + " " + it.name); it.remove(); n++; } continue; }
            if (pass >= 1 && it instanceof FootageItem && it.usedIn.length === 0) { gone.push("footage " + it.id + " " + it.name); it.remove(); n++; continue; }
            if (pass >= 2 && it instanceof FolderItem && it.numItems === 0) { gone.push("folder " + it.id + " " + it.name); it.remove(); n++; }
        }
    }
    var left = 0; for (i = 1; i <= app.project.numItems; i++) if (ids[app.project.item(i).id] && mine(app.project.item(i))) left++;
    if (!left) { f.open("w"); f.write(""); f.close(); }
    var o = new File(OUT + "cleanup.txt"); o.open("w"); o.write("removed " + n + ", still mine " + left + ", name mismatches skipped " + skipped + ", project items " + app.project.numItems); o.close();
    var lg = new File(OUT + "cleanup_log.txt"); lg.encoding = "UTF-8"; lg.open("a"); var st = ""; try { st = new Date().toUTCString(); } catch (eD) { st = "?"; } lg.writeln("--- " + st + " removed: " + gone.join(" | ")); lg.close();
})();

/*  Ultimate Kit - SaaS BG: the user's own background comps (Gradient 1..8, Star Gradient), copied 1:1.
    Shape Gradient Fill colours and Layer Styles can't be set by script, so the comps ship unchanged in
    assets/saasbg/saasbg.aep (a copy of the user's project) and are imported from it. Apply keeps only the
    chosen comp (and the solids it uses) and puts it at the bottom of your comp, scaled to cover it.     */

UK.SBG = {
    FILE: "assets/saasbg/saasbg.aep",
    COMPS: { sb01: "Gradient 1", sb02: "Gradient 2", sb03: "Gradient 3", sb04: "Gradient 4", sb05: "Gradient 5",
        sb06: "Gradient 6", sb07: "Gradient 7", sb08: "Gradient 8", sb09: "Star Gradient" }
};
/* every item inside a folder, depth first */
UK.SBG.items = function (F, out) {
    out = out || [];
    for (var i = 1; i <= F.numItems; i++) { var it = F.item(i); out.push(it); if (it instanceof FolderItem) UK.SBG.items(it, out); }
    return out;
};
UK.SBG.drop = function (F) {
    var all = UK.SBG.items(F), i;
    for (i = all.length - 1; i >= 0; i--) { try { if (!(all[i] instanceof FolderItem)) all[i].remove(); } catch (e) { } }
    for (i = all.length - 1; i >= 0; i--) { try { all[i].remove(); } catch (e2) { } }
    try { F.remove(); } catch (e3) { }
};

UK.api.saasBg = function (a) { return UK.SBG.build(UK.comp(true), a.id); };
UK.SBG.build = function (host, id) {
    var want = UK.SBG.COMPS[id];
    if (!want) throw new Error("Unknown SaaS background " + id);
    var f = new File(UK_ROOT + "/" + UK.SBG.FILE);
    if (!f.exists) throw new Error("The SaaS BG template is missing: " + f.fsName);
    var io = new ImportOptions(f);
    io.importAs = ImportAsType.PROJECT;
    /* no "missing effects" warning when a plug-in of the original (Deep Glow) is not installed */
    var F, C = null, i;
    try { app.beginSuppressDialogs(); } catch (e0) { }
    try { F = app.project.importFile(io); } finally { try { app.endSuppressDialogs(false); } catch (e00) { } }
    try {
        var all = UK.SBG.items(F);
        for (i = 0; i < all.length; i++) if (all[i] instanceof CompItem && all[i].name === want) C = all[i];
        if (!C) throw new Error("\"" + want + "\" is not in the template");
        /* only the chosen comp and the solids it uses stay */
        for (i = 0; i < all.length; i++) if (all[i] instanceof CompItem && all[i] !== C) all[i].remove();
        all = UK.SBG.items(F);
        var dest = UK.folder("SaaS BG");
        for (i = 0; i < all.length; i++) {
            var it = all[i];
            if (it instanceof FolderItem) continue;
            if (it === C) it.parentFolder = dest;
            else if (it.usedIn && it.usedIn.length > 0) it.parentFolder = dest;
            else it.remove();
        }
        UK.SBG.drop(F); F = null;
        /* the original's Fill colour expressions point at a comp that doesn't exist (they never ran) */
        for (i = 1; i <= C.numLayers; i++) UK.SBG.offBroken(C.layer(i));
        /* longer comp: the background runs to its end */
        if (host.duration > C.duration) {
            var old = C.duration;
            C.duration = host.duration;
            for (i = 1; i <= C.numLayers; i++) { var L = C.layer(i); try { if (L.outPoint >= old - C.frameDuration / 2) L.outPoint = C.duration; } catch (e1) { } }
        }
        var P = host.layers.add(C);
        P.moveToEnd();
        P.startTime = 0;
        var s = Math.max(host.width / C.width, host.height / C.height) * 100;
        UK.pos(P).setValue([host.width / 2, host.height / 2]);
        P.property("ADBE Transform Group").property("ADBE Scale").setValue([s, s]);
        UK.selectOnly(host, [P]);
        return { name: P.name };
    } catch (err) {
        if (F) UK.SBG.drop(F);
        if (C) { try { C.remove(); } catch (e2) { } }
        throw err;
    }
};
/* switch off (keep) expressions that can only error: the original renders their static value */
UK.SBG.offBroken = function (p) {
    for (var j = 1; j <= p.numProperties; j++) {
        var x = p.property(j);
        if (x.propertyType === PropertyType.PROPERTY) {
            try { if (x.canSetExpression && x.expression !== "" && x.expressionEnabled) { x.valueAtTime(0, false); if (x.expressionError !== "") x.expressionEnabled = false; } } catch (e) { }
        } else UK.SBG.offBroken(x);
    }
};

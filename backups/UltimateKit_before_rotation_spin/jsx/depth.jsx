/*  Ultimate Kit - Depth Reveal (looks: shared/depth.js; the depth map is made in the panel: js/depth.js).
    On the selected layer:
      Depth Controls - <name>  Null: Softness slider (drives the wipe's Transition Softness)
      Depth Reveal - <name>    a copy of the layer, parented to it: Colorama (its phase turning two cycles) +
                               Channel Mixer (the palette) + Camera Lens Blur, and a Gradient Wipe driven by
                               the depth map whose Transition Completion keys dissolve it away by depth
      Depth Map - <name>       the depth map (white = near), hidden: only the wipe reads it
      <name>                   the layer itself, untouched                                                */
UK.DEPTH = {};
UK.DEPTH.p = function (e, n) { return e.property(e.matchName + "-" + UK.pad(n, 4)); };
/* the covering copy's effects for a look (add(matchName, name) -> effect, phase(colorama, from, turns), S = size, 1 = 1920 px) */
UK.DEPTH.look = function (look, a, add, phase, S, C) {
    var p = UK.DEPTH.p, e, i;
    var col = function (k) { return (a.colors && a.colors[k]) || (look.colors && look.colors[k]) || "#FFFFFF"; };
    switch (look.fx) {
        case "palette":
            // the colours: Colorama's wheel by brightness, turned by Phase Shift, through the palette's Channel Mixer
            var F = UK_DEPTH.fitOf(look.pal);
            e = add("APC Colorama", "Colorama");
            phase(e, F.phase, UK_DEPTH.TIME.turns);
            e = add("ADBE CHANNEL MIXER", "Palette");
            for (i = 0; i < 12; i++) p(e, i + 1).setValue(F.mix[Math.floor(i / 4)][i % 4]);
            e = add("ADBE Camera Lens Blur", "Camera Lens Blur");
            p(e, 1).setValue(Math.max(1, UK.round(3 * S, 1)));
            break;
        case "dream":
            // every colour of the hue wheel by brightness, washed out to pastel, drifting round
            e = add("APC Colorama", "Dream Colors");
            phase(e, 0, 1);
            e = add("ADBE Fill", "Pastel");
            p(e, 2).setValue([1, 1, 1, 1]); p(e, 5).setValue(0.7);
            e = add("ADBE Camera Lens Blur", "Soft");
            p(e, 1).setValue(Math.max(1, UK.round(3 * S, 1)));
            break;
        case "mono":
            add("ADBE Tint", "Mono");
            break;
        case "blur":
            e = add("ADBE Camera Lens Blur", "Defocus");
            p(e, 1).setValue(Math.round(34 * S));
            break;
        case "fog":
            e = add("ADBE Camera Lens Blur", "Haze");
            p(e, 1).setValue(Math.round(14 * S));
            e = add("ADBE Fill", "Fog");
            p(e, 2).setValue(UK.rgba(col(0))); p(e, 5).setValue(0.82);
            break;
        case "dark":
            e = add("ADBE Fill", "Dark");
            p(e, 2).setValue(UK.rgba(col(0)));
            break;
        case "thermal":
            add("APC Colorama", "Thermal");
            break;
        case "golden":
            e = add("APC Colorama", "Golden");
            p(e, 10).setValue(21);
            break;
        case "duo":
            e = add("ADBE Tint", "Duotone");
            p(e, 1).setValue(UK.rgba(col(0))); p(e, 2).setValue(UK.rgba(col(1)));
            break;
        case "neon":
            e = add("ADBE Find Edges", "Lines");
            p(e, 1).setValue(1);
            e = add("ADBE Tint", "Line Color");
            p(e, 1).setValue([0, 0, 0, 1]); p(e, 2).setValue(UK.rgba(col(0)));
            e = add("ADBE Glo2", "Line Glow");
            p(e, 2).setValue(70); p(e, 3).setValue(Math.round(14 * S)); p(e, 4).setValue(1.6);
            break;
        case "blueprint":
            e = add("ADBE Find Edges", "Lines");
            p(e, 1).setValue(1);
            e = add("ADBE Tint", "Blueprint");
            p(e, 1).setValue(UK.rgba(col(0))); p(e, 2).setValue(UK.rgba(col(1)));
            break;
        case "mosaic":
            e = add("ADBE Mosaic", "Pixels");
            p(e, 1).setValue(Math.max(4, Math.round(C.width / (60 * S)))); p(e, 2).setValue(Math.max(4, Math.round(C.height / (60 * S)))); p(e, 3).setValue(1);
            break;
        case "negative":
            add("ADBE Invert", "Negative");
            break;
    }
};
UK.DEPTH.build = function (comp, L, depthItem, a) {
    var look = UK_CAT.find(UK_CAT.depth, a.id) || UK_CAT.depth[0], T = UK_DEPTH.TIME, EZ = [[UK_DEPTH.EASE[0], UK_DEPTH.EASE[1], 0, 0]];
    var t0 = UK.snap(comp, Number(a.t0 !== undefined ? a.t0 : comp.time)), D = UK.clamp(Number(a.dur) || 1.65, 0.3, 30);
    var cover = a.mode === "cover", near = a.dir === "near", soft = UK.clamp(a.softness === undefined ? look.soft : Number(a.softness), 0, 100);
    var src = L.source, S = Math.max(src.width, src.height) / 1920, p = UK.DEPTH.p, i;
    UK._fd = comp.frameDuration;
    // the depth map (hidden; the wipe reads it)
    var DM = comp.layers.add(depthItem);
    DM.name = UK.uniqueLayerName(comp, "Depth Map - " + L.name);
    DM.moveBefore(L);
    DM.enabled = false;
    try { DM.guideLayer = true; } catch (e0) { }
    DM.inPoint = L.inPoint; DM.outPoint = L.outPoint;
    // the covering copy
    var C = L.duplicate();
    C.name = UK.uniqueLayerName(comp, "Depth Reveal - " + L.name);
    C.moveBefore(DM);
    C.label = 11;
    try { C.parent = L; } catch (e1) { }
    var add = function (mn, name) { UK.fx(C, mn, name); return UK.efx(C, name); }, e;
    // the look; Colorama phases turn with the timing (UK_DEPTH.TIME)
    var phase = function (eff, from, turns) {
        var k = [[t0 + T.phase[0] * D, from], [t0 + T.phase[1] * D, from + 360 * turns]];
        if (cover) k = [[k[0][0], k[1][1]], [k[1][0], k[0][1]]];
        UK.anim(p(eff, 8), k, EZ);
    };
    UK.DEPTH.look(look, a, add, phase, S, C);
    // the depth wipe
    e = add("ADBE Gradient Wipe", "Gradient Wipe");
    p(e, 3).setValue(DM.index);
    p(e, 4).setValue(3);                      // stretch the depth map to the layer
    p(e, 5).setValue(near ? 1 : 0);           // white = near: inverted, the near parts go first
    var wk = [[t0 + T.wipe[0] * D, cover ? 1 : 0], [t0 + T.wipe[1] * D, cover ? 0 : 1]];   // (0..1 = 0..100 %)
    UK.anim(p(e, 1), wk, EZ);
    // controls: a Null with the Softness slider
    var N = comp.layers.addNull();
    N.name = UK.uniqueLayerName(comp, "Depth Controls - " + L.name);
    N.label = 1;
    N.moveBefore(C);
    N.inPoint = L.inPoint; N.outPoint = L.outPoint;
    UK.slider(N, "Softness", soft);
    p(e, 2).setValue(soft / 100);
    p(e, 2).expression = 'clamp(thisComp.layer("' + N.name.replace(/"/g, '\\"') + '").effect("Softness")(1), 0, 100)';   // (expressions work in %)
    C.comment = "Ultimate Kit Depth Reveal (" + look.name + "): Gradient Wipe Transition Completion keyframes (and Colorama Phase Shift on colour looks); Softness on the Depth Controls null.";
    return { copy: C, depth: DM, controls: N };
};
/* 1) what to measure: the selected layer's image (a still file is read as it is, anything else is
      rendered to a PNG first) and where the depth map goes */
UK.api.depthPrepare = function (a) {
    var comp = UK.comp(false), sel = comp.selectedLayers;
    if (sel.length !== 1) throw new Error("Select one layer (a photo, a video or a precomp).");
    var L = sel[0];
    if (!(L instanceof AVLayer) || !L.source || L.source instanceof FootageItem && L.source.mainSource instanceof SolidSource) throw new Error("Select a photo, video or precomp layer.");
    var src = L.source, dir = null, stamp = new Date().getTime(), path = null, render = false;
    if (app.project.file) { dir = new Folder(app.project.file.parent.fsName + "/Ultimate Kit Depth"); if (!dir.exists && !dir.create()) dir = null; }
    if (!dir) { dir = new Folder(Folder.userData.fsName + "/UltimateKit/depth"); if (!dir.exists) { new Folder(Folder.userData.fsName + "/UltimateKit").create(); dir.create(); } }
    var safe = String(L.name).replace(/\.[^.]*$/, "").replace(/[^\w\-]+/g, "_").substr(0, 40) || "layer";
    if (src instanceof FootageItem && src.mainSource instanceof FileSource && src.mainSource.isStill && src.file && /\.(jpe?g|png|webp|bmp|gif)$/i.test(src.file.name)) path = src.file.fsName;
    else {
        // render the layer's source at the playhead to a PNG (a temp comp, removed by depthApply / depthCancel)
        var T = app.project.items.addComp("UK Depth Frame (temp)", src.width, src.height, 1, Math.max(src.duration || 1, 1), comp.frameRate);
        var TL = T.layers.add(src);
        TL.startTime = 0;
        var st = 0;
        try { st = L.sourceTime(comp.time); } catch (e) { st = 0; }
        path = dir.fsName + "/" + safe + "_frame_" + stamp + ".png";
        T.saveFrameToPng(UK.clamp(st, 0, T.duration - T.frameDuration), new File(path));
        render = T.id;
    }
    return { image: path.replace(/\\/g, "/"), render: render, out: (dir.fsName + "/" + safe + "_depth_" + stamp + ".png").replace(/\\/g, "/"), comp: comp.id, layer: L.index, name: L.name };
};
UK.DEPTH.dropTemp = function (id) {
    if (!id) return;
    try { var T = app.project.itemByID(Number(id)); if (T && T instanceof CompItem && T.name === "UK Depth Frame (temp)") T.remove(); } catch (e) { }
};
UK.api.depthCancel = function (a) { UK.DEPTH.dropTemp(a.render); return {}; };
/* 2) build it with the depth map the panel wrote */
UK.api.depthApply = function (a) {
    UK.DEPTH.dropTemp(a.render);
    var comp = app.project.itemByID(Number(a.comp));
    if (!comp || !(comp instanceof CompItem)) throw new Error("The composition is gone.");
    var L = comp.layer(Number(a.layer));
    if (!L || L.name !== a.name) { L = null; for (var i = 1; i <= comp.numLayers; i++) if (comp.layer(i).name === a.name) { L = comp.layer(i); break; } }
    if (!L) throw new Error("The layer \"" + a.name + "\" is gone.");
    var f = new File(a.depth);
    if (!f.exists) throw new Error("The depth map was not saved: " + a.depth);
    var item = app.project.importFile(new ImportOptions(f));
    item.parentFolder = UK.folder("Depth Maps");
    var r = UK.DEPTH.build(comp, L, item, a);
    UK.selectOnly(comp, [r.copy]);
    return { layer: r.copy.name, depth: r.depth.name };
};

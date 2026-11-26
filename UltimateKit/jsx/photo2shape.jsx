/*  Ultimate Kit - Photo to Shape (2026-10-30): the selected image layer (a PNG logo, an icon, a flat illustration)
    becomes vector shapes, one per colour, traced in the panel (js/trace.js) the way the pen would draw them.
      p2sRead     the selected image layers: their files (the panel reads and traces them)
      p2sRender   an image the panel cannot read itself (PSD, TIFF, AI, a video frame), or a layer with masks (only what
                  they leave is traced): its frame as a PNG in the temp folder, through a temporary comp holding the
                  image and a copy of its masks (removed by p2sCleanup once the file is written)
      p2sBuild    the shapes: one shape layer with a group per colour ("Color 1 #HEX": its paths, one Fill, even-odd),
                  or one shape layer per colour; exactly over the image (its transform, parent, times copied), the
                  anchor in the middle of the shapes, the image switched off underneath                         */
UK.P2S = {};
UK.P2S.isImage = function (L) {
    try { return (L instanceof AVLayer) && L.source && (L.source instanceof FootageItem) && (L.source.mainSource instanceof FileSource) && L.source.file && L.source.width > 0; } catch (e) { return false; }
};
/* the masks of L at comp time t that change what shows (mode None does nothing), as one short number; "" = none */
UK.P2S.maskSig = function (L, t) {
    var M = L.property("ADBE Mask Parade"), s = "", k, c, h = 7;
    if (!M || !M.numProperties) return "";
    for (k = 1; k <= M.numProperties; k++) {
        var m = M.property(k); if (m.maskMode === MaskMode.NONE) continue;
        var sh = m.property("ADBE Mask Shape").valueAtTime(t, false);
        s += String(m.maskMode) + "|" + m.inverted + "|" + m.property("ADBE Mask Feather").valueAtTime(t, false).join(",") + "|" + m.property("ADBE Mask Opacity").valueAtTime(t, false) + "|" + m.property("ADBE Mask Offset").valueAtTime(t, false) + "|" + sh.vertices.join(",") + "|" + sh.inTangents.join(",") + "|" + sh.outTangents.join(",") + ";";      // (a string + an array throws in After Effects: join)
    }
    if (!s) return "";
    for (c = 0; c < s.length; c++) h = (h * 31 + s.charCodeAt(c)) % 2147483647;
    return String(h);
};
/* the masks of the layer "from" as they are at comp time t, on the layer "to" */
UK.P2S.copyMasks = function (from, to, t) {
    var A = from.property("ADBE Mask Parade"), k;
    if (!A) return;
    for (k = 1; k <= A.numProperties; k++) {
        var m = A.property(k), n = to.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        n.property("ADBE Mask Shape").setValue(m.property("ADBE Mask Shape").valueAtTime(t, false));
        n.property("ADBE Mask Feather").setValue(m.property("ADBE Mask Feather").valueAtTime(t, false));
        n.property("ADBE Mask Opacity").setValue(m.property("ADBE Mask Opacity").valueAtTime(t, false));
        n.property("ADBE Mask Offset").setValue(m.property("ADBE Mask Offset").valueAtTime(t, false));
        n.maskMode = m.maskMode; n.inverted = m.inverted;
    }
};
UK.api.p2sRead = function () {
    var comp = UK.comp(false), sel = comp.selectedLayers, out = [], i;
    for (i = 0; i < sel.length; i++) {
        var L = sel[i]; if (!UK.P2S.isImage(L)) continue;
        var f = L.source.file, sig = UK.P2S.maskSig(L, comp.time);
        out.push({ id: L.id, name: L.name, path: f.fsName.replace(/\\/g, "/"), ext: String(f.name).replace(/^.*\./, "").toLowerCase(), w: L.source.width, h: L.source.height, still: !!L.source.mainSource.isStill, masked: !!sig, sig: sig });
    }
    if (!out.length) throw new Error("Select an image layer (PNG, JPG ...).");
    return { comp: comp.id, items: out };
};
UK.P2S.find = function (compId, layerId) {
    var comp = null, L = null, i;
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i).id === compId) comp = app.project.item(i);
    if (!(comp instanceof CompItem)) throw new Error("The composition is gone.");
    for (i = 1; i <= comp.numLayers; i++) if (comp.layer(i).id === layerId) L = comp.layer(i);
    if (!L) throw new Error("The image layer is gone.");
    return { comp: comp, L: L };
};
/* the image's own frame (at the time indicator for a video), as a PNG the panel can read */
UK.api.p2sRender = function (a) {
    var F = UK.P2S.find(a.comp, a.id), src = F.L.source, t = Math.max(0, F.comp.time - F.L.startTime);
    var C = app.project.items.addComp("UK Photo to Shape (temp)", src.width, src.height, src.pixelAspect || 1, Math.max(src.duration || 0, 1 / (src.frameRate || 30)) || 1, src.frameRate || 30);
    var L = C.layers.add(src); L.startTime = 0;
    UK.P2S.copyMasks(F.L, L, F.comp.time);
    var file = new File(Folder.temp.fsName + "/uk_p2s_" + new Date().getTime() + ".png");
    C.saveFrameToPng(Math.min(t, Math.max(0, C.duration - C.frameDuration)), file);
    return { path: file.fsName.replace(/\\/g, "/"), temp: C.id };
};
UK.api.p2sCleanup = function (a) {
    for (var i = app.project.numItems; i >= 1; i--) { var it = app.project.item(i); if (it.id === a.temp && it instanceof CompItem && it.name === "UK Photo to Shape (temp)") { it.remove(); break; } }
    if (a.path && /\/uk_p2s_\d+\.png$/.test(a.path)) { try { new File(a.path).remove(); } catch (e) { } }
    return {};
};
UK.P2S.paths = function (vecs, paths) {
    for (var q = 0; q < paths.length; q++) {
        var p = paths[q], sp = vecs.addProperty("ADBE Vector Shape - Group");
        sp.name = "Path " + (q + 1);
        sp.property("ADBE Vector Shape").setValue(UK.makeShape(p.v, p.i, p.o, true));
    }
};
UK.P2S.fill = function (vecs, rgb) {
    var f = vecs.addProperty("ADBE Vector Graphic - Fill"); f.name = "Fill 1";
    f.property("ADBE Vector Fill Color").setValue([rgb[0], rgb[1], rgb[2], 1]);
    try { f.property("ADBE Vector Fill Rule").setValue(2); } catch (e) { }       // even-odd: holes stay holes
};
/* a new shape layer exactly over the image layer L */
UK.P2S.layer = function (comp, L, name) {
    var N = comp.layers.addShape();
    N.name = UK.uniqueLayerName(comp, name);
    N.threeDLayer = L.threeDLayer;
    try { N.property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated = L.property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated; } catch (e0) { }
    UK.W2P.copyTree(L.property("ADBE Transform Group"), N.property("ADBE Transform Group"));
    try { if (L.parent) N.parent = L.parent; } catch (e1) { }
    N.startTime = L.startTime; N.inPoint = L.inPoint; N.outPoint = L.outPoint;
    try { N.blendingMode = L.blendingMode; } catch (e2) { }
    N.label = L.label;
    return N;
};
UK.api.p2sBuild = function (a) {
    var F = UK.P2S.find(a.comp, a.id), comp = F.comp, L = F.L, t = comp.time, cols = a.colors, made = [], pts = 0, i, k;
    if (!cols || !cols.length) throw new Error("Nothing to build: no colour areas were found.");
    for (i = 0; i < cols.length; i++) for (k = 0; k < cols[i].paths.length; k++) pts += cols[i].paths[k].v.length;
    var base = String(L.name).replace(/\.[a-z0-9]{2,4}$/i, "");
    return UK.atomic(comp, function () {
        if (a.result === "layers") {
            /* a shape layer per colour, the bottom colour lowest */
            var below = L;
            for (i = 0; i < cols.length; i++) {
                var N = UK.P2S.layer(comp, L, base + " - Color " + (i + 1)), g = N.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
                g.name = "Color " + (i + 1) + " " + cols[i].hex;
                UK.P2S.paths(g.property("ADBE Vectors Group"), cols[i].paths);
                UK.P2S.fill(N.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"), cols[i].rgb);
                UK.W2P.centre(N, t);
                N.moveBefore(below); below = N;
                N.comment = "Ultimate Kit Photo to Shape: colour " + (i + 1) + " (" + cols[i].hex + ") of '" + L.name + "' - " + cols[i].paths.length + " path(s), Fill in 'Color " + (i + 1) + "'.";
                made.push(N);
            }
        } else {
            /* one shape layer, a group per colour (the first group in the list is the top one) */
            var S = UK.P2S.layer(comp, L, base + " - Shapes"), root = S.property("ADBE Root Vectors Group");
            for (i = cols.length - 1; i >= 0; i--) {
                var gg = root.addProperty("ADBE Vector Group"); gg.name = "Color " + (i + 1) + " " + cols[i].hex;
                var gi = gg.propertyIndex;
                UK.P2S.paths(root.property(gi).property("ADBE Vectors Group"), cols[i].paths);
                UK.P2S.fill(root.property(gi).property("ADBE Vectors Group"), cols[i].rgb);
            }
            UK.W2P.centre(S, t);
            S.moveBefore(L);
            S.comment = "Ultimate Kit Photo to Shape: '" + L.name + "' as " + cols.length + " colour group(s) (Color 1 = the bottom one); each group has its paths and one Fill.";
            made.push(S);
        }
        L.enabled = false;
        L.comment = "Ultimate Kit Photo to Shape: the original image (switched off; its shapes are above).";
        UK.selectOnly(comp, made);
        var names = []; for (i = 0; i < made.length; i++) names.push(made[i].name);
        return { layers: names, colors: cols.length, points: pts };
    });
};

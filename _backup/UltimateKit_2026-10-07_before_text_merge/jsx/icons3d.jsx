/*  Ultimate Kit — 3D icons
    A precomp "3D Icon NN" using the Advanced 3D renderer (Cinema 4D renderer as fallback):
      ICON CTRL  (3D null)   carries the keyframed motion: position + Y-rotation spin,
                             plus the controls: Icon Color, Extrusion Depth, Bevel Depth
      ICON       (shape)     real extruded geometry (Geometry Options), parented to ICON CTRL
      lights                 ambient + key + rim so the extrusion reads as depth
    Swap: put any shape / text / SVG / PNG into the icon — it inherits the animation and
    the extrusion automatically because the motion lives on ICON CTRL.                    */

UK.I3 = {};
UK.I3.CTRL = "ICON CTRL";

UK.I3.renderer = function (c) {
    var pref = ["ADBE Calder", "ADBE Ernst"];          // Advanced 3D, then Cinema 4D
    for (var i = 0; i < pref.length; i++) if (UK.has(c.renderers, pref[i])) { c.renderer = pref[i]; return pref[i]; }
    return c.renderer;
};
UK.I3.geo = function (L) { return L.property("ADBE Extrsn Options Group"); };

/* make a layer an extruded 3D art layer driven by the controls on ICON CTRL */
UK.I3.rig = function (L, ctrl, opts) {
    opts = opts || {};
    L.threeDLayer = true;
    L.parent = ctrl;
    var r = UK.bounds(L, 0);
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    UK.anchor(L).setValue([cx, cy, 0]);
    UK.pos(L).setValue([0, 0, 0]);
    var target = opts.size || 300;
    var s = target / Math.max(1, Math.max(r.width, r.height)) * 100;
    UK.scale(L).setValue([s, s, s]);
    try { UK.tr(L, "ADBE Rotate X").setValue(0); UK.tr(L, "ADBE Rotate Y").setValue(0); UK.rot(L).setValue(0); UK.tr(L, "ADBE Orientation").setValue([0, 0, 0]); } catch (e0) { }
    var g = UK.I3.geo(L);
    if (g) {
        try { g.property("ADBE Bevel Styles").setValue(4); } catch (e1) { }
        g.property("ADBE Extrsn Depth").expression = 'var c = thisComp.layer("' + UK.I3.CTRL + '"); c.effect("Extrusion Depth")(1) / Math.max(0.001, transform.scale[2] / 100);';
        try { g.property("ADBE Bevel Depth").expression = 'var c = thisComp.layer("' + UK.I3.CTRL + '"); c.effect("Bevel Depth")(1) / Math.max(0.001, transform.scale[2] / 100);'; } catch (e2) { }
    }
    // rotate around the middle of the thickness, not the front face
    UK.anchor(L).expression = 'var d = thisLayer("ADBE Extrsn Options Group")("ADBE Extrsn Depth");\n[value[0], value[1], d / 2];';
    try {
        var m = L.property("ADBE Material Options Group");
        m.property("ADBE Specular Coefficient").setValue(55);
        m.property("ADBE Shininess Coefficient").setValue(35);
    } catch (e3) { }
    return L;
};

UK.I3.lights = function (C) {
    var W = C.width, H = C.height;
    var A = C.layers.addLight("Ambient", [W / 2, H / 2]);
    A.lightType = LightType.AMBIENT;
    A.property("ADBE Light Options Group").property("ADBE Light Intensity").setValue(52);
    var K = C.layers.addLight("Key Light", [W / 2, H / 2]);
    K.lightType = LightType.POINT;
    UK.pos(K).setValue([W * 0.2, H * 0.1, -1300]);
    K.property("ADBE Light Options Group").property("ADBE Light Intensity").setValue(115);
    var R = C.layers.addLight("Rim Light", [W / 2, H / 2]);
    R.lightType = LightType.PARALLEL;
    UK.pos(R).setValue([W * 0.95, H * 0.2, 1400]);
    R.property("ADBE Light Options Group").property("ADBE Light Intensity").setValue(55);
    R.property("ADBE Light Options Group").property("ADBE Light Color").setValue([0.85, 0.9, 1, 1]);
};

UK.api.icon3d = function (a) {
    var host = UK.comp(true);
    var spec = UK_CAT.find(UK_CAT.icons3d, a.id);
    if (!spec) throw new Error("Unknown 3D icon " + a.id);
    var num = UK.pad(parseInt(a.id.replace(/\D/g, ""), 10), 2);
    var tin = UK.clamp(Number(a.inDur) || 1.2, 0.2, 10), hold = UK.clamp(Number(a.hold) || 1.6, 0, 30), tout = UK.clamp(Number(a.outDur) || 1.2, 0.2, 10);
    var D = tin + hold + tout;
    var name = UK.uniqueName("3D Icon " + num);
    var C = UK.newComp(name, host, D, "3D Icons");
    UK._fd = C.frameDuration;
    var W = C.width, H = C.height, S = Math.round(H * 0.3);
    var rend = UK.I3.renderer(C);
    UK.I3.lights(C);
    var ctrl = C.layers.addNull();
    ctrl.name = UK.I3.CTRL;
    ctrl.label = 2;
    ctrl.threeDLayer = true;
    UK.colorCtl(ctrl, "Icon Color", a.color || "#7C5CFF");
    UK.slider(ctrl, "Extrusion Depth", Math.round(S * 0.24));
    UK.slider(ctrl, "Bevel Depth", Math.round(S * 0.05));
    // the default artwork: a circle
    var icon = UK.shapeLayer(C, "ICON");
    var g = UK.group(UK.root(icon), "Circle");
    var v = UK.vecs(g);
    UK.addEllipse(v, [S, S], [0, 0]);
    UK.addFill(v, a.color || "#7C5CFF").property("ADBE Vector Fill Color").expression = 'thisComp.layer("' + UK.I3.CTRL + '").effect("Icon Color")(1)';
    UK.I3.rig(icon, ctrl, { size: S });
    // ---- motion (on the control null)
    var cx = W / 2, cy = H / 2, ux = W / 2 + S * 1.1, uy = H / 2 + S * 1.1, uz = 2600;
    function at(d) { return [cx + d[0] * ux, cy + d[1] * uy, d[2] * uz * (d[2] < 0 ? 0.85 : 1)]; }
    var P0 = at(spec.from), P1 = [cx, cy, 0], P2 = at(spec.to);
    var t1 = tin, t2 = tin + hold, t3 = D;
    var pos = UK.pos(ctrl);
    if (spec.pop) {
        pos.setValue(P1);
        UK.anim(UK.scale(ctrl), [[0, [0, 0, 0]], [t1, [100, 100, 100]], [t2, [100, 100, 100]], [t3, [0, 0, 0]]], ["quint", "linear", "quintIn"]);
    } else {
        UK.anim(pos, [[0, P0], [t1, P1], [t2, P1], [t3, P2]], ["quint", "linear", "quintIn"], { straight: !spec.arc });
        if (spec.arc) {
            try {
                pos.setSpatialTangentsAtKey(1, [0, 0, 0], [W * 0.25, 0, -uz * 0.9]);
                pos.setSpatialTangentsAtKey(2, [-W * 0.18, 0, -uz * 0.25], [0, 0, 0]);
                pos.setSpatialTangentsAtKey(3, [0, 0, 0], [W * 0.18, 0, -uz * 0.25]);
                pos.setSpatialTangentsAtKey(4, [-W * 0.25, 0, -uz * 0.9], [0, 0, 0]);
            } catch (eA) { }
        }
    }
    var dirSign = (spec.from[0] > 0 || spec.from[1] > 0) ? -1 : 1;
    // it comes to rest at a slight 3/4 angle so the extrusion still reads while it holds
    var restY = (a.restY !== undefined) ? Number(a.restY) : 20, restX = (a.restX !== undefined) ? Number(a.restX) : 8;
    UK.anim(UK.tr(ctrl, "ADBE Rotate Y"), [[0, restY + dirSign * -360 * spec.spin[0]], [t1, restY], [t2, restY], [t3, restY + dirSign * 360 * spec.spin[1]]], ["quint", "linear", "quintIn"]);
    UK.anim(UK.tr(ctrl, "ADBE Rotate X"), [[0, restX - 16], [t1 + tin * 0.15, restX], [t2, restX], [t3, restX + 12]], ["outSoft", "linear", "inSoft"]);
    ctrl.moveToBeginning();
    C.motionBlur = true;
    try { C.shutterAngle = 180; C.motionBlurSamplesPerFrame = 16; } catch (eM) { }
    icon.motionBlur = true;
    // Essential Properties so the look can be changed from the main comp
    UK.essential(C, UK.efx(ctrl, "Icon Color").property(1), "Icon Color");
    UK.essential(C, UK.efx(ctrl, "Extrusion Depth").property(1), "Extrusion Depth");
    UK.essential(C, UK.efx(ctrl, "Bevel Depth").property(1), "Bevel Depth");
    var L = UK.place(host, C, UK.timeCTI(host));
    UK.selectOnly(host, [L]);
    return { name: name, renderer: rend };
};

/* ------------------------------------------------------------------ swap
   Selection: the "3D Icon" precomp layer + the artwork layer (any order), in the same comp.
   (Or: inside a 3D Icon comp, just select the artwork layer.)                            */
UK.I3.isIconComp = function (c) {
    if (!(c instanceof CompItem)) return false;
    for (var i = 1; i <= c.numLayers; i++) if (c.layer(i).name === UK.I3.CTRL) return true;
    return false;
};
UK.I3.resolve = function () {
    var comp = UK.comp(false);
    var sel = comp.selectedLayers, iconComp = null, art = null, iconLayer = null;
    if (UK.I3.isIconComp(comp)) {
        iconComp = comp;
        for (var i = 0; i < sel.length; i++) if (sel[i].name !== UK.I3.CTRL && !(sel[i] instanceof LightLayer)) art = sel[i];
    } else {
        for (var j = 0; j < sel.length; j++) {
            var L = sel[j];
            if (!iconComp && L.source && UK.I3.isIconComp(L.source)) { iconComp = L.source; iconLayer = L; }
            else art = L;
        }
    }
    if (!iconComp) throw new Error("Select the '3D Icon' layer together with your artwork layer.");
    if (!art) throw new Error("Also select the artwork layer (shape, text, SVG or PNG).");
    return { comp: comp, iconComp: iconComp, iconLayer: iconLayer, art: art };
};
UK.I3.artInfo = function (art) {
    if (art instanceof ShapeLayer) return { type: "shape" };
    if (art instanceof TextLayer) return { type: "text" };
    if (art.source && art.source instanceof FootageItem && art.source.mainSource && art.source.mainSource.file) {
        var f = art.source.mainSource.file;
        var ext = String(f.name).replace(/^.*\./, "").toLowerCase();
        return { type: "file", path: f.fsName, ext: ext, w: art.source.width, h: art.source.height };
    }
    if (art.source && art.source instanceof CompItem) return { type: "precomp" };
    return { type: "other" };
};
UK.api.icon3dInfo = function () {
    var r = UK.I3.resolve();
    var info = UK.I3.artInfo(r.art);
    info.iconComp = r.iconComp.name;
    info.art = r.art.name;
    return info;
};
UK.I3.replaceArt = function (iconComp, newLayer) {
    var ctrl = iconComp.layer(UK.I3.CTRL);
    // remove previous artwork (everything parented to the control except helper faces we are about to add)
    for (var i = iconComp.numLayers; i >= 1; i--) {
        var L = iconComp.layer(i);
        if (L !== newLayer && L.parent === ctrl && L.comment !== "UK keep") L.remove();
    }
    return ctrl;
};
UK.I3.targetSize = function (iconComp) { return Math.round(iconComp.height * 0.3); };
/* copyToComp does not reliably put the copy at index 1, so find the layer that is new */
UK.I3.copyInto = function (L, comp) {
    var before = [], i;
    for (i = 1; i <= comp.numLayers; i++) before.push(comp.layer(i));
    L.copyToComp(comp);
    for (i = 1; i <= comp.numLayers; i++) {
        var c = comp.layer(i), seen = false;
        for (var j = 0; j < before.length; j++) if (before[j] === c) { seen = true; break; }
        if (!seen) return c;
    }
    for (i = 1; i <= comp.numLayers; i++) if (comp.layer(i).name === L.name) return comp.layer(i);
    throw new Error("Could not copy the artwork into the icon comp.");
};

/* shape / text / vector-footage layers */
UK.api.icon3dSwap = function () {
    var r = UK.I3.resolve();
    var info = UK.I3.artInfo(r.art);
    var art = r.art;
    if (info.type === "file" && UK.has(["ai", "eps", "pdf"], info.ext)) {
        // let After Effects convert vector footage into a shape layer first
        UK.selectOnly(r.comp, [art]);
        var cmd = app.findMenuCommandId("Create Shapes from Vector Layer");
        if (cmd) app.executeCommand(cmd);
        var s = r.comp.selectedLayers;
        if (s.length && s[0] instanceof ShapeLayer) { art = s[0]; info = { type: "shape" }; }
    }
    if (info.type !== "shape" && info.type !== "text") {
        if (info.type === "file") return { needsTrace: true, path: info.path, ext: info.ext, w: info.w, h: info.h };
        throw new Error("This layer type can't be extruded. Use a shape layer, text, SVG or PNG.");
    }
    var ic = r.iconComp;
    if (art.containingComp === ic) {
        art.parent = null;
    } else {
        art = UK.I3.copyInto(art, ic);
    }
    var ctrl = UK.I3.replaceArt(ic, art);
    // strip transform animation from the copy — the motion comes from ICON CTRL
    var props = ["ADBE Position", "ADBE Scale", "ADBE Rotate Z", "ADBE Opacity", "ADBE Anchor Point"];
    for (var k = 0; k < props.length; k++) { var p = UK.tr(art, props[k]); try { while (p.numKeys) p.removeKey(1); p.expression = ""; } catch (e) { } }
    UK.opac(art).setValue(100);
    art.name = "ICON";
    UK.I3.rig(art, ctrl, { size: UK.I3.targetSize(ic) });
    art.moveAfter(ctrl);
    try { art.motionBlur = true; } catch (eMb) { }
    if (r.comp !== ic && art !== r.art) r.art.enabled = false;
    return { iconComp: ic.name, art: art.name };
};

/* traced PNG / parsed SVG: path data from the panel (+ optional PNG face layer) */
UK.api.icon3dSwapPaths = function (a) {
    var r = UK.I3.resolve();
    var ic = r.iconComp;
    var data = a.data;
    var L = UK.SVG.build(ic, data, "ICON");
    var ctrl = UK.I3.replaceArt(ic, L);
    UK.I3.rig(L, ctrl, { size: UK.I3.targetSize(ic) });
    L.moveAfter(ctrl);
    var face = null;
    if (a.face && r.art.source) {
        face = ic.layers.add(r.art.source);
        face.name = "ICON FACE (image)";
        face.threeDLayer = true;
        face.parent = L;                                    // rides on the extruded body
        UK.anchor(face).setValue([r.art.source.width / 2, r.art.source.height / 2, 0]);
        // child positions are relative to the parent's anchor (centre of the body, mid-thickness):
        // put the image just in front of the front face
        UK.pos(face).setValue([0, 0, 0]);
        UK.pos(face).expression = 'var d = parent("ADBE Extrsn Options Group")("ADBE Extrsn Depth");\nvar a = parent.transform.anchorPoint.value;\n[' +
            (data.w / 2) + ' - a[0], ' + (data.h / 2) + ' - a[1], -d / 2 - 0.6];';
        UK.scale(face).setValue([100 * data.w / r.art.source.width, 100 * data.h / r.art.source.height, 100]);
        face.comment = "UK keep";
        face.moveBefore(L);
        try { face.property("ADBE Material Options Group").property("ADBE Ambient Coefficient").setValue(100); } catch (eF) { }
        try { face.outPoint = ic.duration; } catch (eO) { }
    }
    if (r.comp !== ic) r.art.enabled = false;
    return { iconComp: ic.name, face: !!face };
};

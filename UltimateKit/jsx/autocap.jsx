/*  Ultimate Kit - Auto Captions: the words of the voice (transcribed in the panel, js/autocap.js) as text layers.
      "Captions" (null)          every switch / colour; move it to move all captions. The parent of everything below
      one TEXT LAYER per caption its own text (edit it like any text), trimmed to when it is said; its layer markers =
                                 when each word is said (drag them to retime). Animators: "Cap Word" (the spoken word:
                                 colour + scale), "Cap Upcoming" (words not said yet), "Cap In" (how a caption arrives)
      "Caption Box"              one rounded rectangle that fits whichever caption is showing (its text, font, size)
      "Word Box" + 3 hidden guide texts, only for styles with a box behind the spoken word
    Applying again replaces the rig (layers whose comment is UK.AC.TAG).                                             */
UK.AC = {};
UK.AC.TAG = "UK AutoCap";
UK.AC.GEO = ["FiraGO-Bold", "FiraGO-SemiBold", "NotoSansGeorgian-Bold", "BPGNinoMtavruli-Bold", "HelveticaNeueLTGEO-75Bold", "SegoeUI-Bold", "Sylfaen", "ArialUnicodeMS"];
UK.AC.font = function (georgian) {
    var list = georgian ? UK.AC.GEO : UK_CAP.FONTS.sans.ps, pick = georgian ? "SegoeUI-Bold" : list[list.length - 1], i;
    try {
        if (app.fonts && app.fonts.getFontsByPostScriptName) {
            for (i = 0; i < list.length; i++) { var a = app.fonts.getFontsByPostScriptName(list[i]); if (a && a.length) { pick = list[i]; break; } }
        }
    } catch (e) { }
    return pick;
};
UK.AC.isGeo = function (s) { for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); if ((c >= 4256 && c <= 4351) || (c >= 7312 && c <= 7359)) return true; } return false; };
UK.AC.file = function (L) { try { if (L.hasAudio && L.source && L.source.mainSource && L.source.mainSource.file) return L.source.mainSource.file; } catch (e) { } return null; };
/* the layer with the voice: the one of this file, else a selected one, else the first that plays sound */
UK.AC.audio = function (comp, path) {
    var s = comp.selectedLayers, i, f;
    if (path) for (i = 1; i <= comp.numLayers; i++) { f = UK.AC.file(comp.layer(i)); if (f && f.fsName.replace(/\\/g, "/") === path) return comp.layer(i); }
    for (i = 0; i < s.length; i++) if (UK.AC.file(s[i])) return s[i];
    for (i = 1; i <= comp.numLayers; i++) if (UK.AC.file(comp.layer(i)) && comp.layer(i).audioEnabled) return comp.layer(i);
    return null;
};
UK.api.acSource = function (a) {
    var comp = UK.comp(false), L = UK.AC.audio(comp, null);
    if (!L) throw new Error("Select the layer with the voice (an audio or video file).");
    var f = UK.AC.file(L), video = false;
    try { video = !!L.source.hasVideo && !L.source.mainSource.isStill; } catch (e) { }
    return { name: L.name, path: encodeURIComponent(f.fsName.replace(/\\/g, "/")), file: encodeURIComponent(decodeURI(f.name)), size: f.length, video: video,
        start: L.startTime, stretch: L.stretch, inPoint: L.inPoint, outPoint: L.outPoint, comp: comp.name, w: comp.width, h: comp.height };
};
/* the fonts After Effects has, for the panel's Character settings: [{ f: family, s: [[style, PostScript name], ...] }] */
UK.api.acFonts = function () {
    var out = [], all = [], i, k;
    try { all = app.fonts.allFonts; } catch (e) { return { fonts: [] }; }
    for (i = 0; i < all.length; i++) {
        var g = all[i], st = [];
        for (k = 0; k < g.length; k++) { try { st.push([String(g[k].styleName), String(g[k].postScriptName)]); } catch (e2) { } }
        if (st.length) out.push({ f: String(g[0].familyName), s: st });
    }
    out.sort(function (x, y) { return x.f.toLowerCase() < y.f.toLowerCase() ? -1 : 1; });
    return { fonts: out };
};
/* the active comp's frame at the playhead as a PNG for the panel's preview (written a moment after this returns) */
UK.api.acFrame = function () {
    var comp = UK.comp(false);
    if (!comp) return { path: "" };
    var d = new Folder(Folder.userData.fsName + "/UltimateKit/autocap");
    if (!d.exists) d.create();
    var f = new File(d.fsName + "/frame.png");
    try { if (f.exists) f.remove(); } catch (e0) { }
    comp.saveFrameToPng(UK.snap(comp, comp.time), f);
    var bpc = 8; try { bpc = app.project.bitsPerChannel; } catch (e1) { }
    return { path: encodeURIComponent(f.fsName.replace(/\\/g, "/")), w: comp.width, h: comp.height, bpc: bpc };
};
/* the sound of the voice layer's file as a small WAV (mono 16 kHz when After Effects takes those settings), rendered
   through a temporary render-queue item: the user's own queue items are switched off meanwhile and put back */
UK.api.acExtract = function (a) {
    var comp = UK.comp(false), L = UK.AC.audio(comp, decodeURIComponent(a.path || "")), RQ = app.project.renderQueue, keep = [], i;
    if (!L || !L.source) throw new Error("The voice layer was not found.");
    var F = L.source, C = null, it = null, out = null;
    var d = new Folder(Folder.temp.fsName + "/UltimateKit");
    if (!d.exists) d.create();
    try {
        C = app.project.items.addComp("UK Voice Sound", 100, 100, 1, Math.max(F.duration, 1), (F.frameRate > 0 ? F.frameRate : 30));
        var V = C.layers.add(F); V.startTime = 0;
        try { V.enabled = false; } catch (eV) { }                       // (sound only)
        try { V.audioEnabled = true; } catch (eA) { }
        for (i = 1; i <= RQ.numItems; i++) { var q = RQ.item(i); keep.push(q.render); try { if (q.status === RQItemStatus.QUEUED) q.render = false; } catch (eQ) { } }
        it = RQ.items.add(C);
        var om = it.outputModule(1), done = false, tries = [{ "Format": "WAV" }, { "Output Audio": "On" }, { "Audio Sample Rate": 16000 }, { "Audio Channels": "Mono" }, { "Audio Bit Depth": "16 Bit" }];
        for (i = 0; i < tries.length; i++) { try { om.setSettings(tries[i]); } catch (eS) { } }
        try { done = /wav|wave/i.test(String(om.getSettings(GetSettingsFormat.STRING)["Format"])); } catch (eG) { }
        if (!done) {                                                    // older / other settings: a sound template
            var T = []; try { T = om.templates; } catch (eT) { }
            for (i = 0; i < T.length && !done; i++) if (/aiff|wav/i.test(T[i])) { try { om.applyTemplate(T[i]); done = true; } catch (eT2) { } }
        }
        if (!done) throw new Error("no sound output format");
        out = new File(d.fsName + "/voice_" + new Date().getTime() + (/aiff/i.test(String(om.getSettings(GetSettingsFormat.STRING)["Format"])) ? ".aif" : ".wav"));
        om.file = out;
        var target = om.file.fsName;
        RQ.render();
        out = new File(target);
        if (!out.exists || out.length < 100) throw new Error("the sound file was not written");
        return { path: encodeURIComponent(out.fsName.replace(/\\/g, "/")), size: out.length };
    } finally {
        try { if (it) it.remove(); } catch (e1) { }
        for (i = 1; i <= Math.min(RQ.numItems, keep.length); i++) { try { if (RQ.item(i).render !== keep[i - 1]) RQ.item(i).render = keep[i - 1]; } catch (e2) { } }
        try { if (C) C.remove(); } catch (e3) { }
    }
};

UK.AC.q = function (s) { return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'; };
UK.AC.box = function (comp, name, N) {
    var B = UK.shapeLayer(comp, name), g = UK.group(UK.root(B), "Box");
    UK.addRect(UK.vecs(g), [100, 100], null, 0, "Rect");
    UK.addFill(UK.vecs(g), "#000000", 100, "Fill");
    B.parent = N;
    B.comment = UK.AC.TAG;
    return B;
};
UK.AC.PUNCT = ".,!?;:\"()[]" + String.fromCharCode(8230, 171, 187, 8220, 8221, 8222, 8216, 8217);
UK.AC.strip = function (s) { var r = "", i; for (i = 0; i < s.length; i++) if (UK.AC.PUNCT.indexOf(s.charAt(i)) < 0) r += s.charAt(i); return r; };
/* the Character settings of the panel on a text document (each one alone: an older After Effects skips what it lacks) */
UK.AC.character = function (d, a, fs, font) {
    var set = function (k, v) { try { d[k] = v; } catch (e) { } };
    set("font", font); set("fontSize", fs); set("applyFill", true); set("fillColor", UK.rgb(a.color || "#FFFFFF"));
    set("applyStroke", !!a.stroke && Number(a.strokeW) > 0);
    if (a.stroke && Number(a.strokeW) > 0) { set("strokeColor", UK.rgb(a.strokeColor || "#000000")); set("strokeWidth", Number(a.strokeW)); set("strokeOverFill", !!a.strokeOver); }
    set("tracking", Number(a.tracking) || 0);
    if (Number(a.leading) > 0) { set("autoLeading", false); set("leading", Number(a.leading)); } else set("autoLeading", true);
    set("fauxBold", !!a.fauxBold); set("fauxItalic", !!a.fauxItalic);
    set("horizontalScale", (Number(a.hScale) || 100) / 100); set("verticalScale", (Number(a.vScale) || 100) / 100);
    set("baselineShift", Number(a.baseline) || 0); set("tsume", (Number(a.tsume) || 0) / 100);
    try { d.fontCapsOption = a.caps === "all" ? FontCapsOption.FONT_ALL_CAPS : (a.caps === "small" ? FontCapsOption.FONT_SMALL_CAPS : FontCapsOption.FONT_NORMAL_CAPS); } catch (e1) { }
    try { d.fontBaselineOption = a.script === "super" ? FontBaselineOption.FONT_FAUXED_SUPERSCRIPT : (a.script === "sub" ? FontBaselineOption.FONT_FAUXED_SUBSCRIPT : FontBaselineOption.FONT_NORMAL_BASELINE); } catch (e2) { }
    try { d.autoKernType = a.kern === "optical" ? AutoKernType.OPTICAL_KERN : (a.kern === "none" ? AutoKernType.NO_AUTO_KERN : AutoKernType.METRIC_KERN); } catch (e3) { }
    try { d.justification = a.just === "left" ? ParagraphJustification.LEFT_JUSTIFY : (a.just === "right" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY); } catch (e4) { }
};

/* a: { blocks [{ t0, t1, text (URI-encoded), ws [word starts] }] in the file's seconds, path (URI-encoded, the voice
        file: its layer gives the offset), src { start, stretch, inPoint, outPoint } (fallback), the style of
        js/autocap.js (size % of the shorter side, posX / posY %, colours, boxes ...) and its Character settings
        (font = PostScript name or "" = a fitting one, tracking, leading, stroke, scales, caps ...) }
   The rig: a null "Captions" (every switch / colour; move it to move all captions), one TEXT LAYER PER CAPTION (its
   own text, edit it like any text; its markers = when each word is said, drag them to retime), a "Caption Box" that
   fits whichever caption is showing, a "Word Box" (+ two hidden guide texts that measure the word) only when the
   style uses it. Applying again replaces the rig (layers whose comment is UK.AC.TAG).                               */
UK.api.autoCaption = function (a) {
    var comp = a._comp || UK.comp(true), i, j;
    UK._fd = comp.frameDuration;
    var src = a.src || { start: 0, stretch: 100, inPoint: 0, outPoint: comp.duration };
    if (a.path && !a._comp) { var AL = UK.AC.audio(comp, decodeURIComponent(a.path)); if (AL && UK.AC.file(AL)) src = { start: AL.startTime, stretch: AL.stretch, inPoint: AL.inPoint, outPoint: AL.outPoint }; }
    var TM = function (t) { return src.start + t * (src.stretch || 100) / 100; };
    var blocks = [], all = "";
    for (i = 0; i < (a.blocks || []).length; i++) {
        var b = a.blocks[i], t0 = Math.max(0, TM(b.t0)), t1 = Math.min(comp.duration, TM(b.t1));
        if (t1 <= src.inPoint || t0 >= src.outPoint || t1 - t0 < comp.frameDuration) continue;
        var tx = decodeURIComponent(b.text), ws = [];
        if (a.punct === false) tx = UK.AC.strip(tx).replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        if (!tx) continue;
        for (j = 0; j < b.ws.length; j++) ws.push(Math.max(t0, TM(b.ws[j])));
        blocks.push({ t0: t0, t1: t1, text: tx, ws: ws }); all += tx;
    }
    if (!blocks.length) throw new Error("No words fall inside the voice layer. Transcribe first.");
    return UK.atomic(comp, function () {
        for (i = comp.numLayers; i >= 1; i--) if (comp.layer(i).comment === UK.AC.TAG) { comp.layer(i).locked = false; comp.layer(i).remove(); }
        var q = UK.AC.q, on = function (v, d) { return v === undefined ? d : !!v; }, num = function (v, d) { return (v === undefined || v === null || v === "") ? d : Number(v); };
        var fs = Math.max(6, Math.round(Math.min(comp.width, comp.height) * num(a.size, 6) / 100));
        var font = a.font || UK.AC.font(UK.AC.isGeo(all));
        var nN = UK.uniqueLayerName(comp, "Captions"), nP = [UK.uniqueLayerName(comp, "Guide Line"), UK.uniqueLayerName(comp, "Guide To Word"), UK.uniqueLayerName(comp, "Guide Word")];
        var useWbox = on(a.wbox, false);

        /* ---- the null: position of all captions + every control */
        var N = comp.layers.addNull(comp.duration);
        N.name = nN; N.comment = UK.AC.TAG; N.label = 2;
        var NA = UK.anchor(N).value;
        UK.pos(N).setValue([comp.width * num(a.posX, 50) / 100, comp.height * num(a.posY, 72) / 100]);
        UK.checkCtl(N, "Highlight", on(a.hl, false));
        UK.colorCtl(N, "Highlight Color", a.hlColor || "#FFD60A");
        UK.slider(N, "Word Scale", num(a.scale, 100));
        UK.slider(N, "Upcoming Opacity", num(a.upcoming, 100));
        UK.slider(N, "Glide", 3);
        UK.slider(N, "In Frames", a.entrance && a.entrance !== "none" ? 5 : 0);
        UK.checkCtl(N, "Shadow", on(a.shadow, false));
        UK.checkCtl(N, "Box", on(a.box, false));
        UK.colorCtl(N, "Box Color", a.boxColor || "#000000");
        UK.slider(N, "Box Opacity", num(a.boxOp, 50));
        UK.slider(N, "Box Roundness", num(a.boxRound, 40));
        UK.slider(N, "Box Padding X", UK.round(fs * 0.45, 1));
        UK.slider(N, "Box Padding Y", UK.round(fs * 0.3, 1));
        if (useWbox) {
            UK.checkCtl(N, "Word Box", true);
            UK.colorCtl(N, "Word Box Color", a.wboxColor || "#7C5CFF");
            UK.slider(N, "Word Box Opacity", num(a.wboxOp, 100));
            UK.slider(N, "Word Box Roundness", num(a.wboxRound, 35));
            UK.slider(N, "Word Box Padding X", UK.round(fs * 0.2, 1));
            UK.slider(N, "Word Box Padding Y", UK.round(fs * 0.08, 1));
        }

        /* ---- expressions shared by the boxes: the caption showing now (a text layer of this null that is active) */
        var NOW = "var C = parent, T = null, i;\n" +
            "for (i = 1; i <= thisComp.numLayers && !T; i++) { var L = thisComp.layer(i); if (L.index != index && L.hasParent && L.parent.index == C.index && L.active) { try { L.text.sourceText; T = L; } catch (e) { } } }\n";
        var MET = "function met(T) { var st = T.text.sourceText.style, fs = st.fontSize, ld = fs * 1.2; try { if (!st.autoLeading) ld = st.leading; } catch (e) { } return [fs, ld]; }\n";
        var CTL = function (nm) { return 'parent.effect("' + nm + '")(1)'; };
        var ROUND = function (nm) { return 'var s = content("Box").content("Rect").size;\nMath.min(s[0], s[1]) / 2 * clamp(' + CTL(nm) + ', 0, 100) / 100;'; };
        var RC = function (Ly) { return UK.root(Ly).property("Box").property("ADBE Vectors Group"); };
        var boxes = [];
        /* the caption box: fits the caption's width, a steady height from the font size, follows it wherever it goes */
        var BX = UK.AC.box(comp, UK.uniqueLayerName(comp, "Caption Box"), N);
        var BOXG = NOW + MET + "function g() {\n    if (!T) return null;\n    var r = T.sourceRectAtTime(time, false); if (r.width <= 0) return null;\n" +
            '    var m = met(T), n = ("" + T.text.sourceText).split("\\r").length, s = T.transform.scale.value;\n' +
            "    var c = parent.fromComp(T.toComp([r.left + r.width / 2, -m[0] * 0.34 + (n - 1) * m[1] / 2]));\n" +
            '    return [c[0], c[1], r.width * s[0] / 100 + 2 * ' + CTL("Box Padding X") + ', ((n - 1) * m[1] + m[0]) * s[1] / 100 + 2 * ' + CTL("Box Padding Y") + '];\n}\nvar G = g();\n';
        UK.pos(BX).expression = BOXG + "G ? [G[0], G[1]] : value;";
        RC(BX).property("Rect").property("ADBE Vector Rect Size").expression = BOXG + "G ? [G[2], G[3]] : [0, 0];";
        RC(BX).property("Rect").property("ADBE Vector Rect Roundness").expression = ROUND("Box Roundness");
        RC(BX).property("Fill").property("ADBE Vector Fill Color").expression = CTL("Box Color");
        RC(BX).property("Fill").property("ADBE Vector Fill Opacity").expression = CTL("Box Opacity");
        UK.opac(BX).expression = CTL("Box") + " == 1 ? 100 : 0";
        UK.anchor(BX).setValue([0, 0]);
        boxes.push(BX);
        /* the word box: two guide texts measure the line of the spoken word and the word; it glides from word to word */
        var WB = null, PR = [];
        if (useWbox) {
            WB = UK.AC.box(comp, UK.uniqueLayerName(comp, "Word Box"), N);
            var MODE = ["out = ln[i];", 'out = ws.slice(0, w - c).join(" ");', "out = ws[w - c - 1];"];
            var WORD = "function word(T, t) { var m = T.marker, w = 0; if (m.numKeys) { var k = m.nearestKey(t); w = k.time <= t ? k.index : k.index - 1; } return w; }\n";
            for (i = 0; i < 3; i++) {
                var P = comp.layers.addText("");
                P.name = nP[i]; P.comment = UK.AC.TAG; P.parent = N;
                var pd = UK.textDoc(P).value; pd.font = font; pd.fontSize = fs; pd.justification = ParagraphJustification.LEFT_JUSTIFY; UK.textDoc(P).setValue(pd);
                UK.textDoc(P).expression = NOW + WORD + 'var out = "";\nif (T) {\n    var w = word(T, time), ln = ("" + T.text.sourceText).split("\\r"), c = 0;\n' +
                    '    for (i = 0; i < ln.length; i++) { var ws = ln[i].split(" "); if (w >= 1 && w <= c + ws.length) { ' + MODE[i] + " break; } c += ws.length; }\n}\n" +
                    "var r = out;\nif (T) { try { r = T.text.sourceText.style.setText(out); } catch (e) { } }\nr;";
                P.enabled = false; P.guideLayer = true; P.shy = true;
                PR.push(P);
            }
            var WG = NOW + MET + WORD + "var PL = thisComp.layer(" + q(nP[0]) + "), PT = thisComp.layer(" + q(nP[1]) + "), PW = thisComp.layer(" + q(nP[2]) + ");\n" +
                'function geo(t) {\n    if (!T || !T.active) return null;\n    var w = word(T, t), ln = ("" + T.text.sourceText.valueAtTime(t)).split("\\r"), c = 0, m = met(T), s = T.transform.scale.valueAtTime(t);\n    if (w < 1) return null;\n' +
                '    for (var k = 0; k < ln.length; k++) {\n        var n = ln[k].split(" ").length;\n        if (w <= c + n) { var lw = PL.sourceRectAtTime(t, false).width, tw = PT.sourceRectAtTime(t, false).width, ww = PW.sourceRectAtTime(t, false).width; if (ww <= 0) return null;\n' +
                '            var x0 = ' + (a.just === "left" ? "0" : (a.just === "right" ? "-lw" : "-lw / 2")) + ';\n' +
                "            var p = parent.fromComp(T.toComp([x0 + tw - ww / 2, k * m[1] - m[0] * 0.34]));\n" +
                '            return [p[0], p[1], ww * s[0] / 100 + 2 * ' + CTL("Word Box Padding X") + ', m[0] * s[1] / 100 + 2 * ' + CTL("Word Box Padding Y") + '];\n        }\n        c += n;\n    }\n    return null;\n}\n' +
                "function now() {\n    var G = geo(time); if (!G) return null;\n    var m = T.marker, w = word(T, time), d = " + CTL("Glide") + " * thisComp.frameDuration;\n" +
                "    if (d > 0 && w > 1 && time < m.key(w).time + d) { var P0 = geo(m.key(w).time - thisComp.frameDuration); if (P0) { var u = ease(time, m.key(w).time, m.key(w).time + d, 0, 1); G = [P0[0] + (G[0] - P0[0]) * u, P0[1] + (G[1] - P0[1]) * u, P0[2] + (G[2] - P0[2]) * u, G[3]]; } }\n    return G;\n}\nvar G = now();\n";
            UK.pos(WB).expression = WG + "G ? [G[0], G[1]] : value;";
            RC(WB).property("Rect").property("ADBE Vector Rect Size").expression = WG + "G ? [G[2], G[3]] : [0, 0];";
            RC(WB).property("Rect").property("ADBE Vector Rect Roundness").expression = ROUND("Word Box Roundness");
            RC(WB).property("Fill").property("ADBE Vector Fill Color").expression = CTL("Word Box Color");
            RC(WB).property("Fill").property("ADBE Vector Fill Opacity").expression = CTL("Word Box Opacity");
            UK.opac(WB).expression = CTL("Word Box") + " == 1 ? 100 : 0";
            UK.anchor(WB).setValue([0, 0]);
            boxes.unshift(WB);                                          // (in front of the caption box)
        }

        /* ---- one text layer per caption (made from the last to the first, so the first ends up on top) */
        var ent = a.entrance || "none", texts = [];
        var SELW = "var m = thisLayer.marker, w = 0;\nif (m.numKeys) { var k = m.nearestKey(time); w = k.time <= time ? k.index : k.index - 1; }\n";
        for (i = blocks.length - 1; i >= 0; i--) {
            var B = blocks[i], T = comp.layers.addText(B.text), td = UK.textDoc(T), d = td.value;
            try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e0) { }
            UK.AC.character(d, a, fs, font);
            td.setValue(d);
            T.comment = UK.AC.TAG;
            T.parent = N;
            UK.anchor(T).setValue([0, 0]);
            UK.pos(T).setValue([NA[0], NA[1] + fs * 0.34]);           // the line's middle on the null
            T.startTime = 0; T.inPoint = B.t0; T.outPoint = B.t1;
            var MK = T.property("ADBE Marker");
            for (j = 0; j < B.ws.length; j++) MK.setValueAtTime(Math.min(B.t1 - comp.frameDuration / 2, Math.max(B.t0, B.ws[j]) + j * 0.0001), new MarkerValue(String(j + 1)));
            var an = UK.TX.animator(T, "Cap Word", { fill: a.hlColor || "#FFD60A", scale: [100, 100] }, { based: 3, shape: 1, start: 0, end: 100 });
            UK.TX.exprSel(an, 3, UK.TX.SEL + SELW + "var a = 0;\nif (textIndex == w) { a = 100; var g = 0; try { g = parent.effect(\"Glide\")(1) * thisComp.frameDuration; } catch (e) { }\n    if (g > 0 && w >= 1) a = ease(time, m.key(w).time, m.key(w).time + g, 0, 100); }\n[a, a, a];");
            var AP = function (nm) { return UK.TX.animators(T).property(nm).property("ADBE Text Animator Properties"); };
            AP("Cap Word").property("ADBE Text Fill Color").expression = 'var c = value;\ntry { c = parent.effect("Highlight Color")(1); if (parent.effect("Highlight")(1) == 0) { var f = text.sourceText.style.fillColor; c = [f[0], f[1], f[2], 1]; } } catch (e) { }\nc;';
            AP("Cap Word").property("ADBE Text Scale 3D").expression = 'var s = 100;\ntry { s = parent.effect("Word Scale")(1); } catch (e) { }\n[s, s, s];';
            an = UK.TX.animator(T, "Cap Upcoming", { opacity: 100 }, { based: 3, shape: 1, start: 0, end: 100 });
            UK.TX.exprSel(an, 3, UK.TX.SEL + SELW + "var a = (w > 0 && textIndex > w) ? 100 : 0;\n[a, a, a];");
            AP("Cap Upcoming").property("ADBE Text Opacity").expression = 'var o = 100;\ntry { o = parent.effect("Upcoming Opacity")(1); } catch (e) { }\no;';
            if (ent !== "none") {
                var ip = { opacity: 0 };
                if (ent === "rise") ip.pos = [0, fs * 0.35];
                if (ent === "slide") ip.pos = [-fs * 0.6, 0];
                if (ent === "pop") ip.scale = [70, 70];
                an = UK.TX.animator(T, "Cap In", ip, { based: 1, shape: 1, start: 0, end: 100 });
                an.range().property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount").expression =
                    'var d = 0;\ntry { d = parent.effect("In Frames")(1) * thisComp.frameDuration; } catch (e) { }\nd > 0 ? easeOut(time, inPoint, inPoint + d, 100, 0) : 0;';
            }
            var SH = UK.CAP.shadow(T, "Cap Shadow", "#000000", 60, 135, fs * 0.04, fs * 0.14);
            SH.property("ADBE Drop Shadow-0002").expression = 'var on = 0;\ntry { on = parent.effect("Shadow")(1); } catch (e) { }\nvalue * (on == 1 ? 1 : 0);';
            texts.push(T);
        }
        /* order: null, the captions, the boxes behind them, the guides last */
        var top = texts[texts.length - 1];
        N.moveBefore(top);
        var below = texts[0];
        for (i = 0; i < boxes.length; i++) { boxes[i].moveAfter(below); below = boxes[i]; }
        for (i = 0; i < PR.length; i++) { PR[i].moveAfter(below); below = PR[i]; }
        UK.selectOnly(comp, [N]);
        return { layers: [nN], captions: blocks.length, words: 0, font: font, size: fs };
    });
};

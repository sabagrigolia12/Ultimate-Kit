/*  Ultimate Kit - Auto Captions: the words of the voice (transcribed in the panel, js/autocap.js) as one small rig.
      "Caption Controls" (null)  every switch / colour / size, and "Word": which word of the caption is being said -
                                 one HOLD keyframe per spoken word (drag the keys to retime)
      "Captions" (text)          ONE text layer in ONE style (font, size, colour: the Character panel, any time). Its
                                 captions are its layer markers: marker = when, marker comment = the text (double-click
                                 a marker to correct it, drag it to retime). Animators: "Cap Word" (the spoken word:
                                 colour + scale), "Cap Upcoming" (words not said yet), "Cap In" (how a caption arrives)
      "Word Box" / "Caption Box" rounded rectangles that follow the spoken word / the whole caption by themselves,
                                 whatever the text, the font or the size becomes
      "Probe ..." (hidden)       three guide texts that measure where the spoken word stands
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
UK.AC.hold = function (prop, times, values) {
    if (!times.length) return;
    prop.setValuesAtTimes(times, values);
    for (var i = 1; i <= prop.numKeys; i++) prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
};
UK.AC.box = function (comp, name, parent) {
    var B = UK.shapeLayer(comp, name), g = UK.group(UK.root(B), "Box");
    UK.addRect(UK.vecs(g), [100, 100], null, 0, "Rect");
    UK.addFill(UK.vecs(g), "#000000", 100, "Fill");
    B.parent = parent;
    B.comment = UK.AC.TAG;
    return B;
};

/* a: { blocks [{ t0, t1, text (URI-encoded), ws [word starts] }] in the file's seconds, path (URI-encoded, the voice
        file: its layer gives the offset), src { start, stretch, inPoint, outPoint } (fallback), size (% of the shorter
        side), posY (%), color, maxChars, punct, hl, hlColor, scale, upcoming, entrance, shadow,
        wbox, wboxColor, wboxOp, wboxRound, box, boxColor, boxOp, boxRound }                                        */
UK.api.autoCaption = function (a) {
    var comp = a._comp || UK.comp(true), i, j;
    UK._fd = comp.frameDuration;
    var src = a.src || { start: 0, stretch: 100, inPoint: 0, outPoint: comp.duration };
    if (a.path && !a._comp) { var AL = UK.AC.audio(comp, decodeURIComponent(a.path)); if (AL && UK.AC.file(AL)) src = { start: AL.startTime, stretch: AL.stretch, inPoint: AL.inPoint, outPoint: AL.outPoint }; }
    var TM = function (t) { return src.start + t * (src.stretch || 100) / 100; };
    var blocks = [], all = "";
    for (i = 0; i < (a.blocks || []).length; i++) {
        var b = a.blocks[i], t0 = TM(b.t0), t1 = TM(b.t1);
        if (t1 <= src.inPoint || t0 >= src.outPoint || t0 >= comp.duration || t1 <= 0) continue;
        var tx = decodeURIComponent(b.text), ws = [];
        for (j = 0; j < b.ws.length; j++) ws.push(TM(b.ws[j]));
        blocks.push({ t0: t0, t1: t1, text: tx, ws: ws }); all += tx;
    }
    if (!blocks.length) throw new Error("No words fall inside the voice layer. Transcribe first.");
    return UK.atomic(comp, function () {
        for (i = comp.numLayers; i >= 1; i--) if (comp.layer(i).comment === UK.AC.TAG) { comp.layer(i).locked = false; comp.layer(i).remove(); }
        var nC = UK.uniqueLayerName(comp, "Caption Controls"), nT = UK.uniqueLayerName(comp, "Captions"), nW = UK.uniqueLayerName(comp, "Word Box"), nB = UK.uniqueLayerName(comp, "Caption Box");
        var nP = [UK.uniqueLayerName(comp, "Probe Line"), UK.uniqueLayerName(comp, "Probe To Word"), UK.uniqueLayerName(comp, "Probe Word")];
        var q = UK.AC.q, fs = Math.max(8, Math.round(Math.min(comp.width, comp.height) * (Number(a.size) || 6.5) / 100)), font = UK.AC.font(UK.AC.isGeo(all));
        var REF = "var L = thisComp.layer(" + q(nT) + "), C = thisComp.layer(" + q(nC) + ");\n";
        var KEY = "function key(P, t) { if (P.numKeys < 1) return null; var k = P.nearestKey(t); if (k.time > t) { if (k.index < 2) return null; k = P.key(k.index - 1); } return k; }\n";
        var BLK = KEY + "function blk(t) { var k = key(L.marker, t); if (k && k.duration > 0 && t >= k.time + k.duration) k = null; return k; }\n";

        /* ---- the text: one layer, one style; the captions are its markers */
        var T = comp.layers.addText("Caption"), td = UK.textDoc(T), d = td.value;
        try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e0) { }
        d.font = font; d.fontSize = fs; d.applyFill = true; d.fillColor = UK.rgb(a.color || "#FFFFFF"); d.applyStroke = false; d.tracking = 0;
        d.justification = ParagraphJustification.CENTER_JUSTIFY;
        td.setValue(d);
        T.name = nT; T.comment = UK.AC.TAG;
        UK.anchor(T).setValue([0, 0]);
        UK.pos(T).setValue([comp.width / 2, comp.height * (a.posY === undefined ? 72 : Number(a.posY)) / 100 + fs * 0.34]);
        try { var mo = T.property("ADBE Text Properties").property("ADBE Text More Options"); mo.property("ADBE Text Anchor Point Option").setValue(2); mo.property("ADBE Text Anchor Point Align").setValue([0, -40]); } catch (e1) { }
        var MK = T.property("ADBE Marker"), wt = [], wv = [], last = -1;
        var push = function (t, v) { if (t <= last) t = last + 0.001; wt.push(t); wv.push(v); last = t; };
        for (i = 0; i < blocks.length; i++) {
            var B0 = blocks[i], mv = new MarkerValue(B0.text);
            mv.duration = Math.max(comp.frameDuration, B0.t1 - B0.t0);
            MK.setValueAtTime(B0.t0, mv);
            for (j = 0; j < B0.ws.length; j++) push(j === 0 ? B0.t0 : B0.ws[j], j + 1);
            if (i === blocks.length - 1 || blocks[i + 1].t0 > B0.t1 + 0.02) push(B0.t1, 0);
        }
        if (a.shadow) UK.CAP.shadow(T, "Cap Shadow", "#000000", 55, 135, fs * 0.05, fs * 0.16);

        /* ---- the helpers */
        var WB = UK.AC.box(comp, nW, T), BX = UK.AC.box(comp, nB, T), PR = [];
        for (i = 0; i < 3; i++) {
            var P = comp.layers.addText("");
            P.name = nP[i]; P.comment = UK.AC.TAG;
            var pd = UK.textDoc(P).value; pd.font = font; pd.fontSize = fs; pd.justification = ParagraphJustification.LEFT_JUSTIFY; UK.textDoc(P).setValue(pd);
            P.enabled = false; P.guideLayer = true; P.shy = true;
            PR.push(P);
        }
        var N = comp.layers.addNull();
        N.name = nC; N.comment = UK.AC.TAG; N.label = 2;
        N.moveBefore(T); WB.moveAfter(T); BX.moveAfter(WB); PR[0].moveAfter(BX); PR[1].moveAfter(PR[0]); PR[2].moveAfter(PR[1]);

        /* ---- the controls */
        var on = function (v, def) { return v === undefined ? def : !!v; }, num = function (v, def) { return v === undefined ? def : Number(v); };
        UK.slider(N, "Word", 0);
        UK.checkCtl(N, "Punctuation", on(a.punct, true));
        UK.slider(N, "Line Length", num(a.maxChars, 22));
        UK.checkCtl(N, "Highlight", on(a.hl, true));
        UK.colorCtl(N, "Highlight Color", a.hlColor || "#FFD60A");
        UK.slider(N, "Word Scale", num(a.scale, 100));
        UK.slider(N, "Upcoming Opacity", num(a.upcoming, 100));
        UK.slider(N, "Glide", 3);
        var ent = a.entrance || "none";
        if (ent !== "none") UK.slider(N, "In Frames", 5);
        UK.checkCtl(N, "Word Box", on(a.wbox, false));
        UK.colorCtl(N, "Word Box Color", a.wboxColor || "#7C5CFF");
        UK.slider(N, "Word Box Opacity", num(a.wboxOp, 100));
        UK.slider(N, "Word Box Roundness", num(a.wboxRound, 30));
        UK.slider(N, "Word Box Padding X", UK.round(fs * 0.2, 1));
        UK.slider(N, "Word Box Padding Y", UK.round(fs * 0.08, 1));
        UK.checkCtl(N, "Box", on(a.box, false));
        UK.colorCtl(N, "Box Color", a.boxColor || "#000000");
        UK.slider(N, "Box Opacity", num(a.boxOp, 60));
        UK.slider(N, "Box Roundness", num(a.boxRound, 30));
        UK.slider(N, "Box Padding X", UK.round(fs * 0.45, 1));
        UK.slider(N, "Box Padding Y", UK.round(fs * 0.3, 1));
        UK.AC.hold(UK.efx(N, "Word").property(1), wt, wv);

        /* ---- the text's own expression: the caption of the moment, punctuation on / off, lines of Line Length */
        var PCH = '".,!?;:\\"()[]" + String.fromCharCode(8230, 171, 187, 8220, 8221, 8222, 8216, 8217)';
        td = UK.textDoc(T);
        td.expression = "var L = thisLayer, C = thisComp.layer(" + q(nC) + ");\n" + BLK +
            'var k = blk(time), txt = k ? k.comment : "", i;\n' +
            'if (C.effect("Punctuation")(1) == 0) { var bad = ' + PCH + ', o = ""; for (i = 0; i < txt.length; i++) if (bad.indexOf(txt.charAt(i)) < 0) o += txt.charAt(i); txt = o; }\n' +
            'var mx = Math.round(C.effect("Line Length")(1)), w = txt.split(" "), out = "", line = "";\n' +
            'for (i = 0; i < w.length; i++) { if (line.length && mx > 0 && (line + " " + w[i]).length > mx) { out += line + "\\r"; line = w[i]; } else line = line.length ? line + " " + w[i] : w[i]; }\n' +
            "out + line;";

        /* ---- the spoken word: colour + scale on it, the words still to come dimmed */
        var WSEL = UK.TX.SEL + "var C = thisComp.layer(" + q(nC) + '), W = C.effect("Word")(1), w = Math.round(W.value), a = 0;\n';
        var an = UK.TX.animator(T, "Cap Word", { fill: a.hlColor || "#FFD60A", scale: [100, 100] }, { based: 3, shape: 1, start: 0, end: 100 });
        UK.TX.exprSel(an, 3, WSEL + KEY + 'if (textIndex == w) { a = 100; var g = C.effect("Glide")(1) * thisComp.frameDuration, k = key(W, time); if (g > 0 && k) a = ease(time, k.time, k.time + g, 0, 100); }\n[a, a, a];');
        var AP = function (nm) { return UK.TX.animators(T).property(nm).property("ADBE Text Animator Properties"); };
        AP("Cap Word").property("ADBE Text Fill Color").expression = "var C = thisComp.layer(" + q(nC) + '), c = C.effect("Highlight Color")(1);\n' +
            'if (C.effect("Highlight")(1) == 0) { var f = text.sourceText.style.fillColor; c = [f[0], f[1], f[2], 1]; }\nc;';
        AP("Cap Word").property("ADBE Text Scale 3D").expression = "var s = thisComp.layer(" + q(nC) + ').effect("Word Scale")(1);\n[s, s, s];';
        an = UK.TX.animator(T, "Cap Upcoming", { opacity: 100 }, { based: 3, shape: 1, start: 0, end: 100 });
        UK.TX.exprSel(an, 3, WSEL + "a = (w > 0 && textIndex > w) ? 100 : 0;\n[a, a, a];");
        AP("Cap Upcoming").property("ADBE Text Opacity").expression = "thisComp.layer(" + q(nC) + ').effect("Upcoming Opacity")(1)';
        if (ent !== "none") {
            var ip = { opacity: 0 };
            if (ent === "rise") ip.pos = [0, fs * 0.35];
            if (ent === "slide") ip.pos = [-fs * 0.6, 0];
            if (ent === "pop") ip.scale = [70, 70];
            an = UK.TX.animator(T, "Cap In", ip, { based: 1, shape: 1, start: 0, end: 100 });
            an.range().property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount").expression = "var L = thisLayer, C = thisComp.layer(" + q(nC) + ");\n" + BLK +
                'var k = blk(time), d = C.effect("In Frames")(1) * thisComp.frameDuration, a = 0;\nif (k && d > 0) a = easeOut(time, k.time, k.time + d, 100, 0);\na;';
        }

        /* ---- the probes: the line of the spoken word, that line up to the word, the word (in the text's own style) */
        var MODE = ["out = ln[i];", 'out = ws.slice(0, w - c).join(" ");', "out = ws[w - c - 1];"];
        for (i = 0; i < 3; i++) {
            UK.textDoc(PR[i]).expression = REF + 'var w = Math.round(C.effect("Word")(1)), ln = ("" + L.text.sourceText.value).split("\\r"), c = 0, out = "", i;\n' +
                'for (i = 0; i < ln.length; i++) { var ws = ln[i].split(" "); if (w >= 1 && w <= c + ws.length) { ' + MODE[i] + " break; } c += ws.length; }\n" +
                "var r = out;\ntry { r = L.text.sourceText.style.setText(out); } catch (e) { }\nr;";
        }
        /* ---- the boxes */
        var MET = "var st = L.text.sourceText.style, fs = st.fontSize, ld = fs * 1.2;\ntry { if (!st.autoLeading) ld = st.leading; } catch (e) { }\n";
        var GEO = REF + "var PL = thisComp.layer(" + q(nP[0]) + "), PT = thisComp.layer(" + q(nP[1]) + "), PW = thisComp.layer(" + q(nP[2]) + ");\n" + MET + KEY +
            'function geo(t) {\n    var w = Math.round(C.effect("Word")(1).valueAtTime(t)), ln = ("" + L.text.sourceText.valueAtTime(t)).split("\\r"), c = 0, i;\n    if (w < 1) return null;\n' +
            '    for (i = 0; i < ln.length; i++) {\n        var n = ln[i].split(" ").length;\n        if (w <= c + n) { var lw = PL.sourceRectAtTime(t, false).width, tw = PT.sourceRectAtTime(t, false).width, ww = PW.sourceRectAtTime(t, false).width; if (ww <= 0) return null; return [tw - lw / 2 - ww / 2, i * ld - fs * 0.34, ww]; }\n        c += n;\n    }\n    return null;\n}\n' +
            'function now() {\n    var g = geo(time); if (!g) return null;\n    var W = C.effect("Word")(1), d = C.effect("Glide")(1) * thisComp.frameDuration, k = key(W, time);\n' +
            '    if (d > 0 && k && time < k.time + d) {\n        var tp = k.time - thisComp.frameDuration, p = geo(tp);\n        if (p && ("" + L.text.sourceText.valueAtTime(tp)) == ("" + L.text.sourceText.valueAtTime(time))) { var u = ease(time, k.time, k.time + d, 0, 1); g = [p[0] + (g[0] - p[0]) * u, p[1] + (g[1] - p[1]) * u, p[2] + (g[2] - p[2]) * u]; }\n    }\n    return g;\n}\n';
        var RC = function (Ly) { return UK.root(Ly).property("Box").property("ADBE Vectors Group"); };
        var ROUND = function (nm) { return "var C = thisComp.layer(" + q(nC) + '), s = content("Box").content("Rect").size;\nMath.min(s[0], s[1]) / 2 * clamp(C.effect("' + nm + '")(1), 0, 100) / 100;'; };
        var CTL = function (nm) { return "thisComp.layer(" + q(nC) + ').effect("' + nm + '")(1)'; };
        UK.pos(WB).expression = GEO + "var g = now();\ng ? [g[0], g[1]] : [0, 0];";
        RC(WB).property("Rect").property("ADBE Vector Rect Size").expression = GEO + 'var g = now();\ng ? [g[2] + 2 * C.effect("Word Box Padding X")(1), fs + 2 * C.effect("Word Box Padding Y")(1)] : [0, 0];';
        RC(WB).property("Rect").property("ADBE Vector Rect Roundness").expression = ROUND("Word Box Roundness");
        RC(WB).property("Fill").property("ADBE Vector Fill Color").expression = CTL("Word Box Color");
        RC(WB).property("Fill").property("ADBE Vector Fill Opacity").expression = CTL("Word Box Opacity");
        UK.opac(WB).expression = CTL("Word Box") + " == 1 ? 100 : 0";
        var HD = REF + MET + 'var r = L.sourceRectAtTime(time, false), n = ("" + L.text.sourceText.value).split("\\r").length;\n';
        UK.pos(BX).expression = HD + "[r.left + r.width / 2, (n - 1) * ld / 2 - fs * 0.34];";
        RC(BX).property("Rect").property("ADBE Vector Rect Size").expression = HD + 'r.width > 0 ? [r.width + 2 * C.effect("Box Padding X")(1), (n - 1) * ld + fs + 2 * C.effect("Box Padding Y")(1)] : [0, 0];';
        RC(BX).property("Rect").property("ADBE Vector Rect Roundness").expression = ROUND("Box Roundness");
        RC(BX).property("Fill").property("ADBE Vector Fill Color").expression = CTL("Box Color");
        RC(BX).property("Fill").property("ADBE Vector Fill Opacity").expression = CTL("Box Opacity");
        UK.opac(BX).expression = CTL("Box") + " == 1 ? 100 : 0";
        UK.selectOnly(comp, [N]);
        return { layers: [nT], captions: blocks.length, words: wt.length, font: font, size: fs };
    });
};

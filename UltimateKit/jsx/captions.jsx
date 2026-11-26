/*  Ultimate Kit - Captions (styles + entrances of shared/captions.js) on text layers.
    Everything stays on the text layer itself, native and editable:
      - the look: font / fill / stroke in the Character panel, then effects named "Cap ...": colour, gradient, glow
        controls first ("Cap Color 1", "Cap Color 2", "Cap Gradient", "Cap Angle", "Cap Accent", "Cap Glow",
        "Cap Glow Size", "Cap Glow Color"), then the effects that read them (Gradient Ramp, Glow / Drop Shadows ...)
      - the accent word / line: text animator "Cap Accent" (Range selector in words or lines: move Start / End to
        accent other words), rainbow: "Cap Rainbow" (Fill Hue along the letters)
      - the animation: text animators "UK In" / "UK Out" (+ "UK Bump") with keyframed, eased Range selectors, the
        same kind SaaS Text builds - so a SaaS Text preset can replace the animation and the look stays.
    Re-applying replaces the previous "Cap ..." effects / animators of the layer.                                */
UK.CAP = {};

UK.CAP._f = {};
UK.CAP.font = function (role) {
    if (UK.CAP._f[role]) return UK.CAP._f[role];
    var F = UK_CAP.FONTS[role] || UK_CAP.FONTS.sans, pick = F.ps[F.ps.length - 1], i;
    try {
        if (app.fonts && app.fonts.getFontsByPostScriptName) {
            for (i = 0; i < F.ps.length; i++) {
                var a = app.fonts.getFontsByPostScriptName(F.ps[i]);
                if (a && a.length) { pick = F.ps[i]; break; }
            }
        }
    } catch (e) { }
    UK.CAP._f[role] = pick;
    return pick;
};
UK.CAP.clean = function (L) {
    var i, E = L.property("ADBE Effect Parade"), A = UK.TX.animators(L);
    for (i = E.numProperties; i >= 1; i--) if (E.property(i).name.indexOf("Cap ") === 0) E.property(i).remove();
    for (i = A.numProperties; i >= 1; i--) if (A.property(i).name.indexOf("Cap ") === 0) A.property(i).remove();
};
/* a percent-like parameter, whatever range this After Effects gives it in scripting (0..1, 0..100 or 0..255) */
UK.CAP.pct = function (prop, v) {
    try {
        var m = prop.maxValue;
        if (m <= 1.5) v = v / 100; else if (m > 150) v = v * 2.55;
        UK.safeSet(prop, v);
    } catch (e) { }
};
UK.CAP.shadow = function (L, name, hex, opacity, dir, dist, soft) {
    var e = UK.fx(L, "ADBE Drop Shadow", name);
    e.property("ADBE Drop Shadow-0001").setValue(UK.rgba(hex));
    UK.CAP.pct(e.property("ADBE Drop Shadow-0002"), opacity);
    e.property("ADBE Drop Shadow-0003").setValue(dir);
    UK.safeSet(e.property("ADBE Drop Shadow-0004"), UK.round(dist, 1));
    UK.safeSet(e.property("ADBE Drop Shadow-0005"), UK.round(soft, 1));
    return e;
};

/* ------------------------------------------------------------------ the look */
UK.CAP.style = function (L, K, a) {
    UK.CAP.clean(L);
    var col = UK_CAP.colors(K, a.colors), td = UK.textDoc(L), d = td.value, e, fs = UK.TX.fontSize(L), useFont = a.font !== false;
    if (useFont) { try { d.font = UK.CAP.font(K.f); d.fontSize = fs; } catch (e0) { } }
    try { d.applyFill = !K.hollow; if (!K.hollow) d.fillColor = UK.rgb(col.fill); } catch (e1) { }
    try {
        if (K.stroke) {
            d.applyStroke = true;
            d.strokeColor = UK.rgb(K.hollow ? col.fill : K.stroke[0]);
            d.strokeWidth = Math.max(1, UK.round(K.stroke[1] * fs * (K.hollow ? 1 : 2), 1));
            d.strokeOverFill = false;
        } else d.applyStroke = false;
    } catch (e2) { }
    if (K.tr !== undefined) { try { d.tracking = K.tr; } catch (e3) { } }
    try { d.fontCapsOption = K.caps ? FontCapsOption.FONT_ALL_CAPS : FontCapsOption.FONT_NORMAL_CAPS; } catch (e4) { }
    td.setValue(d);
    var str = String(td.value.text), acc = UK_CAP.accent(str, K.acc);
    /* the accent in its own font / size (per-character styling: After Effects 24.3 and later; older: colour only) */
    if (acc && useFont && (K.acc.f || K.acc.sc)) {
        try {
            var d2 = td.value, rg = d2.characterRange(acc.s, acc.e);
            if (K.acc.f) rg.font = UK.CAP.font(K.acc.f);
            if (K.acc.sc) rg.fontSize = Math.round(fs * K.acc.sc);
            td.setValue(d2);
        } catch (e5) { }
    }
    var g = K.g || 0, amt = a.glow === undefined ? 100 : Number(a.glow);
    /* controls first: the effects below read them */
    if (g > 0) {
        UK.colorCtl(L, "Cap Color 1", col.c1);
        UK.colorCtl(L, "Cap Color 2", col.c2);
        UK.slider(L, "Cap Gradient", g);
        UK.fx(L, "ADBE Angle Control", "Cap Angle").property(1).setValue(K.ang || 0);
    }
    if (acc) UK.colorCtl(L, "Cap Accent", col.acc);
    if (K.glow) {
        UK.slider(L, "Cap Glow", UK.round(K.glow[0] * amt / 100, 1));
        UK.slider(L, "Cap Glow Size", 100);
        if (K.glow[2]) UK.colorCtl(L, "Cap Glow Color", col.glow);
    }
    /* gradient: a ramp across the text box (where it stands at rest), blended with the text's own colours */
    if (g > 0) {
        var head = 'var t = (inPoint + outPoint) / 2, r = sourceRectAtTime(t, false), a = effect("Cap Angle")(1) * Math.PI / 180;\n' +
            "var cx = r.left + r.width / 2, cy = r.top + r.height / 2, hx = Math.sin(a) * r.width / 2, hy = Math.cos(a) * r.height / 2;\n";
        e = UK.fx(L, "ADBE Ramp", "Cap Gradient Ramp");
        e.property("ADBE Ramp-0002").setValue(UK.rgba(col.c1));
        e.property("ADBE Ramp-0004").setValue(UK.rgba(col.c2));
        e.property("ADBE Ramp-0001").expression = head + "var p = toComp([cx - hx, cy - hy]);\n[p[0], p[1]];";
        e.property("ADBE Ramp-0003").expression = head + "var p = toComp([cx + hx, cy + hy]);\n[p[0], p[1]];";
        e.property("ADBE Ramp-0002").expression = 'effect("Cap Color 1")(1)';
        e.property("ADBE Ramp-0004").expression = 'effect("Cap Color 2")(1)';
        e.property("ADBE Ramp-0007").expression = '100 - clamp(effect("Cap Gradient")(1), 0, 100)';
    }
    if (K.bevel) {
        try {
            e = UK.fx(L, "ADBE Bevel Alpha", "Cap Bevel");
            UK.safeSet(e.property("ADBE Bevel Alpha-0001"), UK.round(fs * 0.035, 1));
            e.property("ADBE Bevel Alpha-0002").setValue(-60);
            UK.CAP.pct(e.property("ADBE Bevel Alpha-0004"), 55);
        } catch (eB) { }
    }
    if (K.lines) {
        try {
            e = UK.fx(L, "ADBE Venetian Blinds", "Cap Scan Lines");
            UK.CAP.pct(e.property("ADBE Venetian Blinds-0001"), 42);
            e.property("ADBE Venetian Blinds-0002").setValue(90);
            UK.safeSet(e.property("ADBE Venetian Blinds-0003"), Math.max(2, Math.round(fs * 0.032)));
        } catch (eL) { }
    }
    if (K.depth) UK.CAP.shadow(L, "Cap Depth", K.depth[0], 100, 135, K.depth[1] * fs, 0);
    if (K.split) {
        UK.CAP.shadow(L, "Cap Split Red", "#FF2A4D", 85, 270, K.split * fs, 0);
        UK.CAP.shadow(L, "Cap Split Cyan", "#22E5FF", 85, 90, K.split * fs, 0);
    }
    if (K.glow) {
        var size = (K.glow[1] || 1) * fs, AMT = ' * effect("Cap Glow")(1) / 100', SZ = 'value * effect("Cap Glow Size")(1) / 100', n;
        if (K.glow[2]) {                        // a glow of its own colour: two soft shadows right behind the text
            var hs = [["Cap Glow Tight", 70, 0.16], ["Cap Glow Wide", 55, 0.7]];
            for (n = 0; n < hs.length; n++) {
                e = UK.CAP.shadow(L, hs[n][0], col.glow, hs[n][1], 0, 0, size * hs[n][2]);
                e.property("ADBE Drop Shadow-0001").expression = 'effect("Cap Glow Color")(1)';
                e.property("ADBE Drop Shadow-0002").expression = "value" + AMT;
                e.property("ADBE Drop Shadow-0005").expression = SZ;
            }
        } else {                                // the text's own colours glow
            var gs = [["Cap Glow Tight", 0.8, 0.12], ["Cap Glow Wide", 0.6, 0.55]];
            for (n = 0; n < gs.length; n++) {
                e = UK.fx(L, "ADBE Glo2", gs[n][0]);
                UK.CAP.pct(e.property("ADBE Glo2-0002"), 15);
                try { e.property("ADBE Glo2-0005").setValue(1); } catch (eG) { }      // Composite Original: On Top (the letters keep their colours, the light is round them)
                UK.safeSet(e.property("ADBE Glo2-0003"), UK.round(size * gs[n][2], 1));
                UK.safeSet(e.property("ADBE Glo2-0004"), gs[n][1]);
                e.property("ADBE Glo2-0004").expression = "value" + AMT;
                e.property("ADBE Glo2-0003").expression = SZ;
            }
        }
    }
    /* the accent: its colour on a word / line range (index units, so it stays on that word when the text changes) */
    if (acc) {
        var byLine = acc.by === "l", i0 = byLine ? acc.l0 : acc.w0, i1 = byLine ? acc.l1 : acc.w1, tot = byLine ? acc.lines : acc.n;
        var an = UK.TX.animator(L, "Cap Accent", { fill: col.acc }, { based: byLine ? 4 : 3, shape: 1, start: i0 / tot * 100, end: i1 / tot * 100, smooth: 0 });
        var units = null;
        try {
            units = an.range().property("ADBE Text Range Advanced").property("ADBE Text Range Units");
            units.setValue(2);
            an.range().property("ADBE Text Index Start").setValue(i0);
            an.range().property("ADBE Text Index End").setValue(i1);
        } catch (eI) { try { if (units) units.setValue(1); } catch (eI2) { } }
        an.group().property("ADBE Text Animator Properties").property("ADBE Text Fill Color").expression = 'effect("Cap Accent")(1)';
    }
    /* rainbow: the hue turns along the letters; "spin" also turns it in time (two looping keys) */
    if (K.hue) {
        try {
            var HA = UK.TX.animators(L), hn = HA.addProperty("ADBE Text Animator");
            hn.name = "Cap Rainbow";
            var H = function () { return UK.TX.animators(L).property("Cap Rainbow"); };
            H().property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Hue");
            H().property("ADBE Text Animator Properties").property("ADBE Text Fill Hue").setValue(300);
            H().property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
            H().property("ADBE Text Selectors").property(1).property("ADBE Text Expressible Amount").expression =
                "var a = (textTotal > 1) ? (textIndex - 1) / (textTotal - 1) * 100 : 0;\n[a, a, a];";
            if (K.spin) {
                var sn = UK.TX.animators(L).addProperty("ADBE Text Animator");
                sn.name = "Cap Color Spin";
                var S = function () { return UK.TX.animators(L).property("Cap Color Spin"); };
                S().property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Hue");
                var hp = S().property("ADBE Text Animator Properties").property("ADBE Text Fill Hue");
                UK.anim(hp, [[L.inPoint, 0], [L.inPoint + K.spin, 360]], ["linear"], { expr: 'loopOut("cycle")' });
            }
        } catch (eH) { }
    }
};

/* ------------------------------------------------------------- the animation */
UK.CAP.props = function (p, fs, flip) {
    var o = UK.TX.em(p, fs);
    if (flip && o.pos) o.pos = [-o.pos[0], -o.pos[1]];
    return o;
};
UK.CAP.MID = UK.TX.SEL + "var p = 1 - s / 100, w = 0.5, d = Math.abs(textIndex - (textTotal + 1) / 2) / Math.max(0.5, textTotal / 2);\n" +
    "var a = clamp((d - (p * (1 + w) - w)) / w, 0, 1);\na = a * a * (3 - 2 * a) * 100;\n[a, a, a];";
UK.CAP.dir = function (L, x, A, dir, t0, dur) {
    var nm = dir === "in" ? "UK In" : "UK Out", props = UK.CAP.props(A.p, x.fs, dir === "out");
    if (A.kind === "all" || A.kind === "mid") {
        /* the whole text at once: the Range selector's Amount is keyed ("mid": an expression selector spreads it
           from the middle letters outwards) */
        var an = UK.TX.animator(L, nm, props, { based: 1, shape: 1, start: 0, end: 100 });
        var amt = an.range().property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount");
        if (dir === "in") UK.anim(amt, [[t0, 100], [t0 + dur, 0]], [A.curve || "outSoft"]);
        else UK.anim(amt, [[t0, 0], [t0 + dur, 100]], ["inSoft"]);
        if (A.kind === "mid") UK.TX.exprSel(an, 1, UK.CAP.MID);
        return;
    }
    var lin = A.curve === "linear", o = { based: A.based, W: A.W, seed: 7 };
    if (A.random) o.random = true;
    if (A.curve) o.curve = A.curve;
    if (lin) o.curveOut = "linear";
    UK.TX.cascade(L, dir, props, o, t0, dur);
    if (A.bump && dir === "in") {
        var b = { based: A.based, W: A.bump.W, Win: A.W, lag: A.bump.lag };
        if (A.curve) b.curve = A.curve;
        UK.TX.bump(L, "UK Bump", UK.TX.em(A.bump.p, x.fs), b, t0, dur);
    }
};
UK.CAP.animate = function (L, x, A) {
    if (A.group) UK.TX.setGroup(L, A.group);
    if (x.doIn) UK.CAP.dir(L, x, A, "in", x.tIn, x.dIn);
    if (x.doOut) UK.CAP.dir(L, x, A, "out", x.tOut, x.dOut);
};

/* ---------------------------------------------------------------------- entry
   a: { id look, anim (else the look's own), what "both" | "style" | "anim", mode "in" | "out" | "both", inDur, outDur,
        hold, text (new layer), font (false = keep the layer's font), glow %, colors { fill, c1, c2, acc, glow } }
   On the selected text layers; none selected = a new text layer with the look's sample text at the playhead.     */
UK.api.caption = function (a) {
    var comp = a._comp || UK.comp(true);
    UK._fd = comp.frameDuration;
    var K = UK_CAP.find(UK_CAP.LOOKS, a.id);
    if (!K) throw new Error("Unknown caption style " + a.id);
    var A = UK_CAP.anim(a.anim || K.a), what = a.what || "both", mode = a.mode || "in";
    var dIn = UK.clamp(Number(a.inDur) || 0.8, 0.1, 10), dOut = UK.clamp(Number(a.outDur) || 0.6, 0.1, 10), hold = UK.clamp(Number(a.hold) || 2, 0, 60);
    var cti = UK.timeCTI(comp);
    return UK.atomic(comp, function () {
        var targets = UK.selectedTextLayers(comp), isNew = false, done = [], i;
        if (!targets.length) {
            var str = String(a.text || K.t).replace(/\r\n|\n/g, "\r"), parts = str.split("\r"), longest = 1;
            for (i = 0; i < parts.length; i++) longest = Math.max(longest, parts[i].length);
            var size = Math.round(Math.min(comp.height * (parts.length > 1 ? 0.11 : 0.15), comp.width * 0.8 / (longest * 0.6)));
            var L0 = UK.addText(comp, str, { name: str.replace(/\r/g, " ").substr(0, 40), size: size, font: UK.CAP.font(K.f) });
            L0.startTime = 0;
            L0.inPoint = cti;
            if (mode !== "in") L0.outPoint = Math.min(comp.duration, cti + (mode === "both" ? dIn : 0) + hold + dOut);
            targets = [L0]; isNew = true; what = "both";
        }
        for (i = 0; i < targets.length; i++) {
            var L = targets[i], tRest = (L.inPoint + L.outPoint) / 2, par0 = L.parent, c0 = null, x = null;
            if (!isNew) { try { var r0 = L.sourceRectAtTime(tRest, false); if (r0.width > 0) c0 = UK.toParent(L, [r0.left + r0.width / 2, r0.top + r0.height / 2], tRest); } catch (e0) { } }
            if (what !== "anim") UK.CAP.style(L, K, a);
            if (isNew) UK.centerText(L, comp);                       // (before the animation: the box at rest)
            if (what !== "style") x = UK.TX.applyOne({ id: "cap" }, function (LL, xx) { UK.CAP.animate(LL, xx, A); }, comp, L, cti, isNew, dIn, dOut, hold, "#FFFFFF", mode);
            /* a look changes the font, so the box: the text stays centred where it was */
            if (c0 && L.parent === par0) {
                try {
                    var tm = tRest;
                    if (x) {
                        tm = x.doIn ? x.tIn + x.dIn + 0.4 : x.tIn;
                        if (x.doIn && x.doOut) tm = Math.max(x.tIn + x.dIn + 0.02, (x.tIn + x.dIn + x.tOut) / 2);
                        tm = Math.min(tm, L.outPoint - 0.02);
                        if (x.doOut) tm = Math.min(tm, Math.max(x.tIn, x.tOut - 0.02));
                    }
                    var r1 = L.sourceRectAtTime(tm, false);
                    if (r1.width > 0) {
                        var c1 = UK.toParent(L, [r1.left + r1.width / 2, r1.top + r1.height / 2], tm);
                        if (Math.abs(c1[0] - c0[0]) > 0.5 || Math.abs(c1[1] - c0[1]) > 0.5) UK.shiftPos(L, [c0[0] - c1[0], c0[1] - c1[1]]);
                    }
                } catch (eP) { }
            }
            done.push(L.name);
        }
        UK.selectOnly(comp, targets);
        return { layers: done, look: K.name, anim: A.name };
    });
};

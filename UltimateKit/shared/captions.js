/*  Ultimate Kit - Captions: caption / title styles (fonts, fill, gradient, glow, an accent word or line) and the
    entrance animations they come in with. One list, read by the panel preview (js/capprev.js) and by After Effects
    (jsx/captions.jsx), so it stays ES3. Sizes are in em (parts of the font size), colours are hex.

    Look:  t sample text (\r = new line) | f font role | a default animation | fill text colour
           c1 / c2 gradient top / bottom, g how much of it (0..100; 100 = the gradient alone, less = it only shades
           the text's own colours, so an accent keeps its colour), ang 0 = top to bottom, 90 = left to right
           acc { by: "w" word | "l" line, n: which (negative = from the end), col, f font role, sc size }
           glow [amount %, size, colour or null = the text's own colours] | stroke [colour, width] | hollow (outline only)
           depth [colour, distance] hard offset copy | split = red / cyan offset | lines = scan lines | bevel
           hue = rainbow along the letters, spin = seconds for one colour turn | caps | tr tracking
    Anim:  based 1 letters / 3 words / 4 lines, or kind "all" (whole text) / "mid" (from the middle outwards)
           W = how much of the text is on its way at once (%), p = the hidden state, bump = overshoot that follows,
           group = what turns / scales together (1 letter, 2 word, 3 line, 4 all)                                 */
var UK_CAP = (function () {
    var C = {};

    /* font roles: PostScript names for After Effects (the first installed one wins) + the same families for the panel */
    C.FONTS = {
        sans: { ps: ["Montserrat-ExtraBold", "Poppins-Bold", "Inter-Bold", "SFProDisplay-Bold", "SegoeUI-Bold", "Arial-BoldMT"], w: "800", fam: "Montserrat, Poppins, Inter, 'SF Pro Display', 'Segoe UI', Arial, sans-serif" },
        med: { ps: ["Montserrat-SemiBold", "Poppins-SemiBold", "Inter-SemiBold", "SFProDisplay-Semibold", "SegoeUI-Semibold", "Arial-BoldMT"], w: "600", fam: "Montserrat, Poppins, Inter, 'SF Pro Display', 'Segoe UI', Arial, sans-serif" },
        light: { ps: ["Montserrat-Light", "Poppins-Light", "Inter-Light", "SFProDisplay-Light", "SegoeUI-Light", "ArialMT"], w: "300", fam: "Montserrat, Poppins, Inter, 'SF Pro Display', 'Segoe UI', Arial, sans-serif" },
        ital: { ps: ["Montserrat-ExtraBoldItalic", "Poppins-BoldItalic", "Inter-BoldItalic", "SegoeUI-BoldItalic", "Arial-BoldItalicMT"], w: "800", it: 1, fam: "Montserrat, Poppins, Inter, 'Segoe UI', Arial, sans-serif" },
        script: { ps: ["Pacifico-Regular", "GreatVibes-Regular", "DancingScript-Bold", "Allura-Regular", "SegoeScript-Bold", "BrushScriptMT", "LucidaHandwriting-Italic", "SnellRoundhand-Bold", "Gabriola"], w: "700", fam: "Pacifico, 'Great Vibes', 'Dancing Script', Allura, 'Segoe Script', 'Brush Script MT', 'Lucida Handwriting', 'Snell Roundhand', cursive" },
        serif: { ps: ["PlayfairDisplay-Bold", "BodoniMT-Bold", "Didot-Bold", "Georgia-Bold", "TimesNewRomanPS-BoldMT"], w: "700", fam: "'Playfair Display', 'Bodoni MT', Didot, Georgia, 'Times New Roman', serif" },
        thin: { ps: ["PlayfairDisplay-Regular", "BodoniMT", "Didot", "Georgia", "TimesNewRomanPSMT"], w: "400", fam: "'Playfair Display', 'Bodoni MT', Didot, Georgia, 'Times New Roman', serif" },
        cond: { ps: ["BebasNeue-Regular", "Oswald-Bold", "Anton-Regular", "Impact"], w: "700", fam: "'Bebas Neue', Oswald, Anton, Impact, sans-serif" },
        round: { ps: ["Nunito-Black", "Fredoka-Bold", "ArialRoundedMTBold", "Poppins-Black", "SegoeUI-Black", "Arial-BoldMT"], w: "900", fam: "Nunito, Fredoka, 'Arial Rounded MT Bold', Poppins, 'Segoe UI', sans-serif" },
        mono: { ps: ["VCROSDMono", "Consolas-Bold", "CourierNewPS-BoldMT"], w: "700", fam: "'VCR OSD Mono', Consolas, 'Courier New', monospace" }
    };

    C.ANIMS = [
        { id: "blur", name: "Letter Blur", based: 1, W: 45, p: { opacity: 0, blur: [0.34, 0.34], scale: [112, 112] } },
        { id: "pop", name: "Word Pop", based: 3, W: 35, group: 2, p: { opacity: 0, scale: [40, 40] }, bump: { p: { scale: [116, 116] }, W: 45, lag: 0.16 } },
        { id: "rise", name: "Rise Up", based: 3, W: 60, p: { opacity: 0, pos: [0, 0.6], blur: [0, 0.2] } },
        { id: "drop", name: "Drop Down", based: 3, W: 60, p: { opacity: 0, pos: [0, -0.6], blur: [0, 0.2] } },
        { id: "left", name: "From Left", based: 3, W: 70, p: { opacity: 0, pos: [-0.9, 0], blur: [0.4, 0] } },
        { id: "right", name: "From Right", based: 3, W: 70, p: { opacity: 0, pos: [0.9, 0], blur: [0.4, 0] } },
        { id: "fade", name: "Soft Fade", based: 1, W: 100, p: { opacity: 0 } },
        { id: "zoomIn", name: "Zoom In", kind: "all", group: 4, curve: "quint", p: { opacity: 0, scale: [55, 55], blur: [0.25, 0.25] } },
        { id: "zoomOut", name: "Zoom Out", kind: "all", group: 4, curve: "quint", p: { opacity: 0, scale: [175, 175], blur: [0.3, 0.3] } },
        { id: "ladder", name: "Ladder", based: 3, W: 95, p: { opacity: 0, pos: [0, 1.0] } },
        { id: "middle", name: "From Middle", kind: "mid", p: { opacity: 0, blur: [0.3, 0.3], scale: [118, 118] } },
        { id: "bounce", name: "Bounce Drop", based: 1, W: 30, p: { opacity: 0, pos: [0, -1.1] }, bump: { p: { pos: [0, 0.13] }, W: 36, lag: 0.14 } },
        { id: "track", name: "Tracking In", kind: "all", curve: "quint", p: { opacity: 0, track: 45, blur: [0.3, 0] } },
        { id: "swing", name: "Swing", based: 1, W: 45, p: { opacity: 0, rot: -32, pos: [0, 0.35] }, bump: { p: { rot: 7 }, W: 40, lag: 0.15 } },
        { id: "wave", name: "Wave", based: 1, W: 60, p: { opacity: 0, pos: [0, 0.5] }, bump: { p: { pos: [0, -0.2] }, W: 55, lag: 0.12 } },
        { id: "stretch", name: "Stretch Up", based: 1, W: 40, p: { opacity: 0, scale: [100, 0] } },
        { id: "spin", name: "Spin In", based: 1, W: 50, p: { opacity: 0, rot: 90, scale: [0, 0] } },
        { id: "glitch", name: "Glitch", based: 1, W: 14, random: 1, curve: "linear", p: { opacity: 0, pos: [0.3, 0], scale: [135, 70] } },
        { id: "type", name: "Typewriter", based: 1, W: 2, curve: "linear", p: { opacity: 0 } }
    ];

    var SH1 = "#FFFFFF", SH2 = "#000000";      // "shade only" gradients: lighter top, deeper bottom, colours kept
    C.LOOKS = [
        { id: "cp01", name: "Clean Pop", t: "Make it\rpop", f: "med", a: "pop", fill: "#FFFFFF" },
        { id: "cp02", name: "Soft Blur", t: "Soft blur in", f: "med", a: "blur", fill: "#FFFFFF" },
        { id: "cp03", name: "Word Accent", t: "your text here", f: "sans", a: "pop", fill: "#FFFFFF", acc: { by: "w", n: 2, col: "#FFD60A" }, depth: ["#000000", 0.05] },
        { id: "cp04", name: "Yellow Punch", t: "THIS IS\rVIRAL", f: "sans", caps: 1, a: "pop", fill: "#FFD60A", c1: "#FFF3A6", c2: "#FF9F0A", g: 100, depth: ["#000000", 0.06], glow: [55, 1, "#FF9F0A"] },
        { id: "cp05", name: "Ice Duo", t: "Clean\rblue", f: "sans", a: "blur", fill: "#FFFFFF", c1: SH1, c2: SH2, g: 22, acc: { by: "l", n: 2, col: "#2F9BFF" }, glow: [110, 1, "#2F7BFF"] },
        { id: "cp06", name: "Script Accent", t: "Clean\rstyle", f: "sans", a: "blur", fill: "#FF8A2B", c1: SH1, c2: SH2, g: 24, acc: { by: "l", n: 2, col: "#FFFFFF", f: "script", sc: 1.15 }, glow: [85, 1, null] },
        { id: "cp07", name: "Neon Lime", t: "fluorescent", f: "sans", a: "blur", fill: "#C6FF00", c1: "#F4FF8A", c2: "#8FE600", g: 100, glow: [120, 1, null] },
        { id: "cp08", name: "Gold", t: "Gold text", f: "sans", a: "rise", fill: "#FFC83D", c1: "#FFF4B8", c2: "#F5A300", g: 100, glow: [90, 1, null] },
        { id: "cp09", name: "Fire", t: "FIRE", f: "ital", caps: 1, a: "stretch", fill: "#FF6A00", c1: "#FFE066", c2: "#FF2D00", g: 100, glow: [130, 1, null] },
        { id: "cp10", name: "Hot Orange", t: "Orange", f: "sans", a: "blur", fill: "#FF7A1A", c1: "#FFC46B", c2: "#FF3D2E", g: 100, glow: [130, 1, null] },
        { id: "cp11", name: "Aqua", t: "Water", f: "sans", a: "wave", fill: "#35B6FF", c1: "#C9F2FF", c2: "#1466FF", g: 100, glow: [100, 1, null] },
        { id: "cp12", name: "Emerald", t: "Emerald", f: "script", a: "blur", fill: "#19E38A", c1: "#B8FFD9", c2: "#00B36B", g: 100, glow: [100, 1, null] },
        { id: "cp13", name: "Royal Purple", t: "Purple", f: "ital", a: "right", fill: "#B14DFF", c1: "#EBC2FF", c2: "#8A2BE2", g: 100, glow: [120, 1, null] },
        { id: "cp14", name: "Blue & Orange", t: "blue\rand\rorange", f: "sans", a: "drop", fill: "#3D7BFF", c1: SH1, c2: SH2, g: 24, acc: { by: "l", n: 3, col: "#FF8A1F" }, glow: [110, 1, null] },
        { id: "cp15", name: "Pink Aesthetic", t: "aesthetic\rpurple", f: "sans", a: "blur", fill: "#FFFFFF", c1: SH1, c2: SH2, g: 18, acc: { by: "l", n: 2, col: "#D946EF" }, glow: [120, 1, "#C026D3"] },
        { id: "cp16", name: "Candy", t: "Clean gradient", f: "sans", a: "left", fill: "#FF8A3D", c1: "#FF9A3D", c2: "#B14DFF", g: 100, ang: 90, glow: [80, 1, null] },
        { id: "cp17", name: "Futurist", t: "Futurist", f: "sans", tr: 60, a: "track", fill: "#8B5CFF", c1: "#5CE1FF", c2: "#A64DFF", g: 100, ang: 90, glow: [120, 1, null] },
        { id: "cp18", name: "Rainbow", t: "rainbow\rclean text", f: "sans", a: "pop", fill: "#FF4D4D", hue: 1, c1: SH1, c2: SH2, g: 18, glow: [90, 1, null] },
        { id: "cp19", name: "Trippy", t: "Trippy Text", f: "sans", a: "blur", fill: "#FF4D4D", hue: 1, spin: 3, glow: [110, 1, null] },
        { id: "cp20", name: "Magenta Pop", t: "build\rhome", f: "sans", a: "pop", fill: "#E91E8C", c1: "#FF7AC6", c2: "#C2157A", g: 100, depth: ["#3A0A26", 0.05], glow: [40, 1, null] },
        { id: "cp21", name: "Money", t: "MONEY $100", f: "cond", caps: 1, a: "spin", fill: "#3DFF7A", c1: "#D4FF9E", c2: "#12C24F", g: 100, glow: [110, 1, null] },
        { id: "cp22", name: "Smooth Caps", t: "SMOOTH OPACITY", f: "cond", caps: 1, a: "fade", fill: "#7FD4FF", c1: "#D6F1FF", c2: "#3BA7FF", g: 100, glow: [80, 1, null] },
        { id: "cp23", name: "Fast", t: "FAST", f: "ital", caps: 1, a: "right", fill: "#FF3B30", c1: "#FF8A7A", c2: "#E01200", g: 100, glow: [100, 1, null] },
        { id: "cp24", name: "Error", t: "ERROR", f: "sans", caps: 1, a: "glitch", fill: "#FF2B2B", split: 0.035, glow: [90, 1, null] },
        { id: "cp25", name: "VHS", t: "VHS", f: "mono", caps: 1, a: "type", fill: "#FFFFFF", split: 0.05, glow: [40, 1, "#FFFFFF"] },
        { id: "cp26", name: "Old TV", t: "OLD TV", f: "sans", caps: 1, a: "glitch", fill: "#EAF2FF", lines: 1, glow: [140, 1, "#3D6BFF"] },
        { id: "cp27", name: "Bubble", t: "Bubble", f: "round", a: "bounce", fill: "#5CC8FF", c1: "#D9F4FF", c2: "#2F8FFF", g: 100, bevel: 1, glow: [70, 1, null] },
        { id: "cp28", name: "Elegant", t: "ELEGANT", f: "thin", caps: 1, tr: 160, a: "track", fill: "#FFFFFF", glow: [40, 1, "#FFFFFF"] },
        { id: "cp29", name: "Old Money", t: "OLD\rMoney", f: "thin", a: "blur", fill: "#F2EBD3", c1: SH1, c2: SH2, g: 22, acc: { by: "l", n: 2, col: "#C9B458", f: "script", sc: 1.1 }, glow: [50, 1, null] },
        { id: "cp30", name: "Signature", t: "Smooth up", f: "script", a: "rise", fill: "#FFFFFF", glow: [45, 1, "#FFFFFF"] },
        { id: "cp31", name: "Headline", t: "the\rPrincipal\rstory", f: "med", a: "rise", fill: "#CFCFCF", acc: { by: "l", n: 2, col: "#FFFFFF", f: "serif", sc: 1.9 } },
        { id: "cp32", name: "Light Air", t: "clean aesthetic light", f: "light", tr: 80, a: "track", fill: "#FFFFFF", glow: [70, 1, "#FFFFFF"] },
        { id: "cp33", name: "Steel", t: "Steel", f: "sans", a: "zoomIn", fill: "#C8D0DA", c1: "#FFFFFF", c2: "#6B7684", g: 100 },
        { id: "cp34", name: "Rebound", t: "Rebound", f: "med", a: "bounce", fill: "#D9D9D9", c1: "#FFFFFF", c2: "#9A9A9A", g: 100 },
        { id: "cp35", name: "Neon Outline", t: "OUTLINE", f: "sans", caps: 1, a: "blur", hollow: 1, fill: "#00E5FF", stroke: ["#00E5FF", 0.035], glow: [150, 1, null] },
        { id: "cp36", name: "3D Stack", t: "3D TEXT", f: "sans", caps: 1, a: "zoomOut", fill: "#FFFFFF", depth: ["#FF3B6B", 0.09] },
        { id: "cp37", name: "Step Up", t: "Step by step", f: "med", a: "ladder", fill: "#FFFFFF" },
        { id: "cp38", name: "Open Middle", t: "From the middle", f: "med", a: "middle", fill: "#FFFFFF" }
    ];

    C.find = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
    C.look = function (id) { return C.find(C.LOOKS, id) || C.LOOKS[0]; };
    C.anim = function (id) { return C.find(C.ANIMS, id) || C.ANIMS[0]; };

    /* the colours a look works with, with the panel's own choices (ov) on top */
    C.colors = function (L, ov) {
        ov = ov || {};
        var g = L.glow ? L.glow[2] : null;
        return {
            fill: ov.fill || L.fill, c1: ov.c1 || L.c1 || "#FFFFFF", c2: ov.c2 || L.c2 || "#000000",
            acc: ov.acc || (L.acc ? L.acc.col : "#FFD60A"), glow: ov.glow || g || L.fill
        };
    };
    /* which colour pickers a look offers: F fill, G gradient (c1 + c2), A accent, H glow colour */
    C.uses = function (L) {
        var u = "F";
        if ((L.g || 0) >= 100) u = "G";
        if (L.acc) u += "A";
        if (L.glow && L.glow[2]) u += "H";
        return u;
    };

    /* words of a text: { s, e } place in the string (e exclusive, a line break counts as one character), line, text */
    C.tokens = function (str) {
        var out = [], s = String(str).replace(/\r\n|\n/g, "\r"), i, line = 0, cur = null;
        for (i = 0; i <= s.length; i++) {
            var ch = i < s.length ? s.charAt(i) : "\r";
            if (ch === " " || ch === "\r" || ch === "\t") {
                if (cur) { cur.e = i; cur.text = s.substring(cur.s, i); out.push(cur); cur = null; }
                if (ch === "\r") line++;
            } else if (!cur) cur = { s: i, e: i, line: line };
        }
        return out;
    };
    /* the accent of a look on a text: null, or { w0, w1 words (w1 exclusive), l0, l1 lines, s, e characters, n words, lines } */
    C.accent = function (str, acc) {
        if (!acc) return null;
        var T = C.tokens(str), n = T.length, i, k = acc.n || 1;
        if (!n) return null;
        var lines = T[n - 1].line + 1;
        if (acc.by === "l" && lines === 1 && n > 1) return C.accent(str, { by: "w", n: -1 });      // one line: its last word
        if (acc.by === "l") {
            var li = k > 0 ? k - 1 : lines + k, a = -1, b = -1;
            if (li < 0 || li >= lines) return null;
            for (i = 0; i < n; i++) if (T[i].line === li) { if (a < 0) a = i; b = i; }
            if (a < 0) return null;
            return { w0: a, w1: b + 1, l0: li, l1: li + 1, s: T[a].s, e: T[b].e, n: n, lines: lines, by: "l" };
        }
        var wi = k > 0 ? k - 1 : n + k;
        if (wi < 0 || wi >= n) return null;
        return { w0: wi, w1: wi + 1, l0: T[wi].line, l1: T[wi].line + 1, s: T[wi].s, e: T[wi].e, n: n, lines: lines, by: "w" };
    };
    return C;
})();

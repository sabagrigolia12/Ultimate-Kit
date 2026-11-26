/*  Ultimate Kit - Lower Thirds (UK_LT). Name + title (profession) reveals. Shared by the panel preview
    and ExtendScript, so ES3 only.

    Every preset = two text lines + a few graphic elements. All graphics follow the text: their size
    comes from the text boxes (GEO below), so a longer name gives a longer plate / line. GEO is kept
    as source text: the panel runs it for the preview and After Effects puts the very same code into
    the shape expressions, so both always agree.

    preset fields
      al   "L" | "C" | "R"   alignment          ord  "nt" name over title | "tn" title (kicker) over name
      pal  default colours (D dark bg, W white plate, K dark plate, A accent plate); nc / tc / pc override
      cap  1 = title in capitals with wide tracking          lg  gap between the lines (font sizes)
      n, t [anim, start, length] for the name / the title (start, length = fractions of the In time)
           anims: rise riseChars drop slide slideR fadeUp blur fade track pop words wipe type flip hold
      e    elements, bottom to top: { t: type, on: "name" | "title" | (both), a: anim, at, len, col, op, ... }
           types: plate bar line outline block dot brackets slash corner flank
           anims: wipeL wipeR growX up down center scale pop draw drawR drawC block fade
           col: A accent, P plate, N name colour, T title colour                                    */
var UK_LT = (function () {
    var PAL = {
        D: { name: "#FFFFFF", title: "#B9B9C8", plate: "#FFFFFF" },
        W: { name: "#121218", title: "#4B4B5E", plate: "#FFFFFF" },
        K: { name: "#FFFFFF", title: "#A9A9BC", plate: "#22222C" },
        A: { name: "#FFFFFF", title: "#EEEAFF", plate: "#7C5CFF" }
    };
    /* metrics: cap height / descender share of the font size (used for every box) */
    var CAP = 0.72, DESC = 0.16;

    var GEO = [
        'function geo(e, M) {',
        '    var n = M.n, t = M.t, u = M.fs, up = M.first, lo = M.second, al = M.al, B;',
        '    if (e.on == "name") B = { l: n.l, r: n.r, t: n.t, b: n.b };',
        '    else if (e.on == "title") B = { l: t.l, r: t.r, t: t.t, b: t.b };',
        '    else B = { l: Math.min(n.l, t.l), r: Math.max(n.r, t.r), t: Math.min(n.t, t.t), b: Math.max(n.b, t.b) };',
        '    function v(k, d) { return (e[k] === undefined ? d : e[k]) * u; }',
        '    var cx = (B.l + B.r) / 2, cy = (B.t + B.b) / 2, px = v("px", 0.45), py = v("py", 0.3), ext = v("ext", 0);',
        '    var g = { l: B.l - px, r: B.r + px, t: B.t - py, b: B.b + py, p: [], rd: 0, x: 0, y: 0, d: 0 };',
        '    var T = e.t, x, y, L, x0, x1, gap;',
        '    if (T == "plate" || T == "outline") g.rd = (e.round || 0) * Math.min(g.r - g.l, g.b - g.t) / 2;',
        '    else if (T == "block") g.p = [[[g.l, cy], [g.r, cy]]];',
        '    else if (T == "bar") {',
        '        var w = v("w", 0.08); gap = v("gap", 0.35);',
        '        if (e.side == "R") { g.l = B.r + gap; g.r = g.l + w; } else { g.r = B.l - gap; g.l = g.r - w; }',
        '        g.t = B.t - ext; g.b = B.b + ext;',
        '    } else if (T == "line") {',
        '        gap = v("gap", 0.25); y = B.b + gap;',
        '        if (e.y == "over") y = B.t - gap;',
        '        else if (e.y == "mid") y = (up.b + lo.t) / 2;',
        '        else if (e.y == "under2") y = B.b + gap + u * 0.16;',
        '        else if (e.y == "marker") y = n.y - n.f * 0.16;',
        '        x0 = B.l - ext; x1 = B.r + ext;',
        '        if (e.ln) { L = e.ln * u; var ps = e.pos || al;',
        '            if (ps == "C") { x0 = cx - L / 2; x1 = cx + L / 2; } else if (ps == "R") { x1 = B.r; x0 = x1 - L; } else { x0 = B.l; x1 = x0 + L; } }',
        '        g.p = [[[x0, y], [x1, y]]]; g.l = x0; g.r = x1; g.t = y; g.b = y;',
        '    } else if (T == "dot") {',
        '        var D = (e.d == "fit") ? (B.b - B.t) + u * 0.25 : v("d", 0.25), ds = D * (e.k || 1);',
        '        gap = v("gap", 0.35);',
        '        x = (e.side == "R") ? B.r + gap + D / 2 : B.l - gap - D / 2;',
        '        if (e.y == "name") y = n.y - n.f * 0.36; else if (e.y == "base") y = n.y - ds / 2; else if (e.y == "mid") y = (up.b + lo.t) / 2; else y = cy;',
        '        g.x = x; g.y = y; g.d = ds; g.l = x - ds / 2; g.r = x + ds / 2; g.t = y - ds / 2; g.b = y + ds / 2;',
        '        var h = ds / 2;',
        '        if (e.shape == "diamond") { h *= 1.25; g.p = [[[x, y - h], [x + h, y], [x, y + h], [x - h, y]]]; }',
        '        else if (e.shape == "square") g.p = [[[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h]]];',
        '    } else if (T == "brackets") {',
        '        var a = Math.min(u * 0.32, (g.r - g.l) / 3);',
        '        g.p = [[[g.l + a, g.t], [g.l, g.t], [g.l, g.b], [g.l + a, g.b]], [[g.r - a, g.b], [g.r, g.b], [g.r, g.t], [g.r - a, g.t]]];',
        '    } else if (T == "slash") {',
        '        x = B.l - v("gap", 0.3);',
        '        g.p = [[[x - u * 0.34, B.b + u * 0.05], [x, B.t - u * 0.05]]];',
        '    } else if (T == "corner") {',
        '        x = B.l - v("gap", 0.3); y = B.b + u * 0.2;',
        '        g.p = [[[x, B.t - ext], [x, y], [B.r + ext, y]]];',
        '    } else if (T == "flank") {',
        '        L = v("ln", 1); gap = v("gap", 0.35); y = t.y - t.f * 0.36;',
        '        g.p = [[[t.l - gap, y], [t.l - gap - L, y]], [[t.r + gap, y], [t.r + gap + L, y]]];',
        '    }',
        '    var mx = (g.l + g.r) / 2, my = (g.t + g.b) / 2;',
        '    if (T == "dot") { mx = g.x; my = g.y; }',
        '    if (e.a == "wipeL") g.pv = [g.l, my]; else if (e.a == "wipeR") g.pv = [g.r, my];',
        '    else if (e.a == "up") g.pv = [mx, g.b]; else if (e.a == "down") g.pv = [mx, g.t]; else g.pv = [mx, my];',
        '    return g;',
        '}'
    ].join("\n");

    var D0 = { n: ["rise", 0.15, 0.6], t: ["rise", 0.3, 0.6] };
    var L = [
        { id: "lt01", name: "Accent Bar", pal: "D", n: ["slide", 0.2, 0.6], t: ["slide", 0.32, 0.6],
            e: [{ t: "bar", a: "up", at: 0, len: 0.5, col: "A", ext: 0.05 }] },
        { id: "lt02", name: "Split Line", pal: "D", lg: 0.55, n: ["rise", 0.2, 0.6], t: ["drop", 0.25, 0.6],
            e: [{ t: "line", y: "mid", a: "draw", at: 0, len: 0.55, col: "A", sw: 0.05, ext: 0.3 }] },
        { id: "lt03", name: "White Plate", pal: "W", n: ["slide", 0.25, 0.55], t: ["slide", 0.35, 0.55],
            e: [{ t: "plate", a: "wipeL", at: 0, len: 0.5, col: "P" }] },
        { id: "lt04", name: "Title Pill", pal: "D", tc: "#FFFFFF", lg: 0.4, n: ["fadeUp", 0, 0.6], t: ["fade", 0.4, 0.5],
            e: [{ t: "plate", on: "title", a: "wipeL", round: 1, px: 0.32, py: 0.16, col: "A", at: 0.25, len: 0.5 }] },
        { id: "lt05", name: "Block Wipe", pal: "D", lg: 0.35, n: ["hold", 0.3], t: ["hold", 0.45],
            e: [{ t: "block", on: "name", a: "block", at: 0, len: 0.6, col: "A", px: 0.18, py: 0.1 },
                { t: "block", on: "title", a: "block", at: 0.15, len: 0.6, col: "A", px: 0.18, py: 0.12 }] },
        { id: "lt06", name: "Blur Reveal", pal: "D", n: ["blur", 0, 0.75], t: ["blur", 0.25, 0.7], e: [] },
        { id: "lt07", name: "Dot Intro", pal: "D", n: ["slide", 0.2, 0.6], t: ["fadeUp", 0.35, 0.6],
            e: [{ t: "dot", shape: "circle", d: 0.26, y: "name", gap: 0.3, a: "pop", at: 0, len: 0.45, col: "A" }] },
        { id: "lt08", name: "Dark Card", pal: "K", n: ["riseChars", 0.2, 0.6], t: ["fade", 0.4, 0.5],
            e: [{ t: "plate", a: "up", at: 0, len: 0.5, col: "P", round: 0.25 }] },
        { id: "lt09", name: "Center Line", al: "C", pal: "D", lg: 0.55, n: ["rise", 0.2, 0.6], t: ["drop", 0.25, 0.6],
            e: [{ t: "line", y: "mid", a: "drawC", at: 0, len: 0.55, col: "A", sw: 0.04, ext: 0.4 }] },
        { id: "lt10", name: "Brackets", pal: "D", n: ["fade", 0.2, 0.6], t: ["fade", 0.35, 0.6],
            e: [{ t: "brackets", a: "drawC", at: 0, len: 0.6, col: "A", px: 0.35, py: 0.25, sw: 0.05 }] },
        { id: "lt11", name: "Outline Box", pal: "D", n: ["fadeUp", 0.2, 0.6], t: ["words", 0.35, 0.6],
            e: [{ t: "outline", a: "draw", at: 0, len: 0.7, col: "A", sw: 0.04 }] },
        { id: "lt12", name: "News Plates", pal: "W", tc: "#FFFFFF", lg: 0.45, n: ["slide", 0.2, 0.55], t: ["slide", 0.3, 0.55],
            e: [{ t: "plate", on: "name", a: "wipeL", at: 0, len: 0.45, col: "P", px: 0.35, py: 0.2 },
                { t: "plate", on: "title", a: "wipeL", at: 0.15, len: 0.45, col: "A", px: 0.35, py: 0.2 }] },
        { id: "lt13", name: "Corner Line", pal: "D", n: ["riseChars", 0.2, 0.6], t: ["fadeUp", 0.35, 0.6],
            e: [{ t: "corner", a: "draw", at: 0, len: 0.65, col: "A", sw: 0.045, gap: 0.3, ext: 0.2 }] },
        { id: "lt14", name: "Slash", pal: "D", n: ["slide", 0.15, 0.6], t: ["slide", 0.3, 0.6],
            e: [{ t: "slash", a: "draw", at: 0, len: 0.45, col: "A", sw: 0.06 }] },
        { id: "lt15", name: "Tracking", pal: "D", n: ["track", 0, 0.8], t: ["fade", 0.3, 0.6],
            e: [{ t: "line", y: "under", ln: 1.2, a: "draw", at: 0.35, len: 0.5, col: "A", sw: 0.05 }] },
        { id: "lt16", name: "Type On", pal: "D", n: ["type", 0.15, 0.6], t: ["type", 0.4, 0.5],
            e: [{ t: "bar", a: "up", w: 0.04, at: 0, len: 0.4, col: "A" }] },
        { id: "lt17", name: "Right Bar", al: "R", pal: "D", n: ["slideR", 0.2, 0.6], t: ["slideR", 0.32, 0.6],
            e: [{ t: "bar", side: "R", a: "down", at: 0, len: 0.5, col: "A", ext: 0.05 }] },
        { id: "lt18", name: "Pop Letters", pal: "D", n: ["pop", 0, 0.6], t: ["fadeUp", 0.3, 0.6],
            e: [{ t: "dot", on: "name", shape: "circle", d: 0.17, y: "base", side: "R", gap: 0.1, a: "pop", at: 0.5, len: 0.4, col: "A" }] },
        { id: "lt19", name: "Wipe Reveal", pal: "D", n: ["wipe", 0.2, 0.6], t: ["wipe", 0.35, 0.6],
            e: [{ t: "bar", a: "center", at: 0, len: 0.45, col: "A" }] },
        { id: "lt20", name: "Accent Plate", pal: "A", n: ["rise", 0.25, 0.55], t: ["rise", 0.35, 0.55],
            e: [{ t: "plate", a: "wipeL", at: 0, len: 0.5, col: "P", round: 0.15 }] },
        { id: "lt21", name: "Glass Card", pal: "D", n: ["blur", 0.2, 0.6], t: ["blur", 0.35, 0.6],
            e: [{ t: "plate", a: "scale", at: 0, len: 0.55, col: "P", op: 12, round: 0.3 },
                { t: "outline", a: "draw", at: 0.05, len: 0.7, col: "P", op: 40, round: 0.3, sw: 0.02 }] },
        { id: "lt22", name: "News Dark", pal: "K", lg: 0.45, n: ["slide", 0.2, 0.55], t: ["slide", 0.3, 0.55],
            e: [{ t: "plate", on: "name", a: "wipeL", at: 0, len: 0.45, col: "A", px: 0.35, py: 0.2 },
                { t: "plate", on: "title", a: "wipeL", at: 0.15, len: 0.45, col: "P", px: 0.35, py: 0.2 }] },
        { id: "lt23", name: "Flip Up", pal: "D", n: ["flip", 0.1, 0.7], t: ["flip", 0.3, 0.6],
            e: [{ t: "line", y: "under", a: "draw", at: 0.2, len: 0.6, col: "A", sw: 0.035 }] },
        { id: "lt24", name: "Center Pill", al: "C", pal: "K", n: ["fade", 0.25, 0.55], t: ["fade", 0.35, 0.55],
            e: [{ t: "plate", a: "growX", at: 0, len: 0.55, col: "P", round: 1, px: 0.75, py: 0.3 }] },
        { id: "lt25", name: "Word Cascade", pal: "D", n: ["words", 0.15, 0.65], t: ["words", 0.3, 0.6],
            e: [{ t: "bar", a: "up", w: 0.06, at: 0, len: 0.5, col: "A" }] },
        { id: "lt26", name: "Center Plate", al: "C", pal: "W", tc: "#D2D2DE", lg: 0.4, n: ["rise", 0.2, 0.55], t: ["fadeUp", 0.35, 0.6],
            e: [{ t: "plate", on: "name", a: "growX", at: 0, len: 0.5, col: "P", px: 0.4, py: 0.2 }] },
        { id: "lt27", name: "Two Lines", pal: "D", n: ["rise", 0.2, 0.6], t: ["rise", 0.3, 0.6],
            e: [{ t: "line", y: "over", a: "draw", at: 0, len: 0.55, col: "A", sw: 0.035, ext: 0.2 },
                { t: "line", y: "under", a: "drawR", at: 0.1, len: 0.55, col: "A", sw: 0.035, ext: 0.2 }] },
        { id: "lt28", name: "Name Block", pal: "D", n: ["hold", 0.3], t: ["slide", 0.45, 0.55],
            e: [{ t: "block", on: "name", a: "block", at: 0, len: 0.6, col: "A", px: 0.18, py: 0.1 }] },
        { id: "lt29", name: "Minimal Fade", pal: "D", n: ["fade", 0, 0.7], t: ["fade", 0.2, 0.7], e: [] },
        { id: "lt30", name: "Marker", pal: "D", n: ["fadeUp", 0, 0.6], t: ["fade", 0.35, 0.6],
            e: [{ t: "line", on: "name", y: "marker", a: "draw", at: 0.25, len: 0.5, col: "A", op: 85, sw: 0.34, ext: 0.08 }] },
        { id: "lt31", name: "Profile Circle", pal: "D", n: ["slide", 0.2, 0.6], t: ["slide", 0.32, 0.6],
            e: [{ t: "dot", shape: "circle", d: "fit", gap: 0.35, a: "pop", at: 0, len: 0.5, col: "A" }] },
        { id: "lt32", name: "Profile Ring", pal: "D", n: ["slide", 0.25, 0.6], t: ["slide", 0.37, 0.6],
            e: [{ t: "dot", shape: "ring", d: "fit", gap: 0.35, a: "draw", at: 0, len: 0.6, col: "A", sw: 0.05 },
                { t: "dot", shape: "circle", d: "fit", k: 0.62, gap: 0.35, a: "pop", at: 0.3, len: 0.4, col: "A" }] },
        { id: "lt33", name: "Drop Plate", pal: "K", n: ["drop", 0.2, 0.55], t: ["drop", 0.3, 0.55],
            e: [{ t: "plate", a: "down", at: 0, len: 0.5, col: "P" }] },
        { id: "lt34", name: "Bar Plate", pal: "W", n: ["slide", 0.3, 0.55], t: ["slide", 0.4, 0.55],
            e: [{ t: "plate", a: "wipeL", at: 0.1, len: 0.5, col: "P" },
                { t: "bar", a: "up", gap: 0.45, w: 0.12, ext: 0.3, at: 0, len: 0.45, col: "A" }] },
        { id: "lt35", name: "Plate and Pill", pal: "K", tc: "#FFFFFF", lg: 0.45, n: ["rise", 0.2, 0.55], t: ["fade", 0.4, 0.5],
            e: [{ t: "plate", on: "name", a: "wipeL", at: 0, len: 0.45, col: "P", px: 0.35, py: 0.2 },
                { t: "plate", on: "title", a: "wipeL", at: 0.2, len: 0.45, col: "A", round: 1, px: 0.32, py: 0.16 }] },
        { id: "lt36", name: "Right Plate", al: "R", pal: "W", n: ["slideR", 0.25, 0.55], t: ["slideR", 0.35, 0.55],
            e: [{ t: "plate", a: "wipeR", at: 0, len: 0.5, col: "P" }] },
        { id: "lt37", name: "Double Underline", pal: "D", n: ["blur", 0.2, 0.6], t: ["fade", 0.35, 0.55],
            e: [{ t: "line", y: "under", a: "draw", at: 0, len: 0.55, col: "A", sw: 0.04, ext: 0.15 },
                { t: "line", y: "under2", ln: 1.0, a: "draw", at: 0.15, len: 0.5, col: "A", sw: 0.04 }] },
        { id: "lt38", name: "Diamond", pal: "D", n: ["riseChars", 0.2, 0.6], t: ["rise", 0.35, 0.55],
            e: [{ t: "dot", shape: "diamond", d: 0.24, y: "name", gap: 0.35, a: "pop", at: 0, len: 0.45, col: "A" }] },
        { id: "lt39", name: "Square and Line", pal: "D", lg: 0.55, n: ["fadeUp", 0.2, 0.6], t: ["fadeUp", 0.3, 0.6],
            e: [{ t: "dot", shape: "square", d: 0.18, y: "mid", gap: 0.3, a: "pop", at: 0, len: 0.4, col: "A" },
                { t: "line", y: "mid", a: "draw", at: 0.15, len: 0.55, col: "A", sw: 0.03 }] },
        { id: "lt40", name: "Rounded Frame", pal: "D", n: ["rise", 0.25, 0.55], t: ["rise", 0.35, 0.55],
            e: [{ t: "outline", a: "draw", at: 0, len: 0.75, col: "A", round: 0.4, sw: 0.035 }] },
        { id: "lt41", name: "Center Brackets", al: "C", pal: "D", n: ["pop", 0.15, 0.6], t: ["fade", 0.35, 0.55],
            e: [{ t: "brackets", a: "drawC", at: 0, len: 0.6, col: "A", px: 0.4, py: 0.25, sw: 0.05 }] },
        { id: "lt42", name: "Center Underline", al: "C", pal: "D", n: ["blur", 0, 0.7], t: ["blur", 0.2, 0.65],
            e: [{ t: "line", y: "under", ln: 1.4, pos: "C", a: "drawC", at: 0.35, len: 0.5, col: "A", sw: 0.05 }] },
        { id: "lt43", name: "Double Block", pal: "D", lg: 0.35, n: ["hold", 0.3], t: ["hold", 0.45],
            e: [{ t: "block", on: "name", a: "block", at: 0, len: 0.6, col: "P", px: 0.18, py: 0.1 },
                { t: "block", on: "title", a: "block", at: 0.15, len: 0.6, col: "A", px: 0.18, py: 0.12 }] },
        { id: "lt44", name: "Kicker", ord: "tn", cap: 1, pal: "D", tc: "#A893FF", lg: 0.55, t: ["fadeUp", 0, 0.55], n: ["rise", 0.25, 0.6],
            e: [{ t: "line", y: "mid", ln: 0.9, a: "draw", at: 0.1, len: 0.5, col: "A", sw: 0.04 }] },
        { id: "lt45", name: "Kicker Pill", ord: "tn", cap: 1, pal: "D", tc: "#FFFFFF", lg: 0.4, t: ["fade", 0.25, 0.5], n: ["rise", 0.3, 0.6],
            e: [{ t: "plate", on: "title", a: "wipeL", round: 1, px: 0.3, py: 0.16, at: 0, len: 0.5, col: "A" }] },
        { id: "lt46", name: "Tall Line", pal: "D", n: ["slide", 0.25, 0.6], t: ["slide", 0.35, 0.6],
            e: [{ t: "bar", a: "up", w: 0.025, ext: 0.35, gap: 0.4, at: 0, len: 0.6, col: "A" }] },
        { id: "lt47", name: "Card Edge", pal: "K", n: ["rise", 0.3, 0.55], t: ["rise", 0.4, 0.55],
            e: [{ t: "plate", a: "wipeL", at: 0.1, len: 0.5, col: "P" },
                { t: "bar", a: "up", gap: 0.45, w: 0.08, ext: 0.3, at: 0, len: 0.45, col: "A" }] },
        { id: "lt48", name: "Rounded Card", pal: "W", n: ["fadeUp", 0.2, 0.6], t: ["fadeUp", 0.3, 0.6],
            e: [{ t: "plate", a: "scale", at: 0, len: 0.55, col: "P", round: 0.35, px: 0.55, py: 0.4 },
                { t: "dot", on: "name", shape: "circle", d: 0.16, y: "base", side: "R", gap: 0.1, a: "pop", at: 0.5, len: 0.35, col: "A" }] },
        { id: "lt49", name: "Center Track", al: "C", cap: 1, pal: "D", n: ["track", 0, 0.8], t: ["fade", 0.3, 0.6],
            e: [{ t: "line", y: "under", ln: 0.6, pos: "C", a: "drawC", at: 0.4, len: 0.45, col: "A", sw: 0.06 }] },
        { id: "lt50", name: "Cinematic", al: "C", cap: 1, pal: "D", n: ["track", 0, 0.9], t: ["fade", 0.3, 0.6],
            e: [{ t: "flank", ln: 1.0, gap: 0.35, a: "draw", at: 0.25, len: 0.6, col: "T", sw: 0.025 }] }
    ];
    var i;
    for (i = 0; i < L.length; i++) {
        if (!L[i].al) L[i].al = "L";
        if (!L[i].ord) L[i].ord = "nt";
        if (!L[i].n) L[i].n = D0.n;
        if (!L[i].t) L[i].t = D0.t;
    }
    /* default colours of a preset: { name, title, plate } */
    function colors(p) {
        var b = PAL[p.pal || "D"];
        return { name: p.nc || b.name, title: p.tc || b.title, plate: p.pc || b.plate };
    }
    /* layout in font sizes: where the second line's baseline sits under the first one */
    function lineGap(p, fs, ts) {
        var lg = (p.lg === undefined) ? 0.24 : p.lg;
        if (p.ord === "tn") return ts * DESC + lg * fs + fs * CAP;
        return fs * DESC + lg * fs + ts * CAP;
    }
    /* schedule of one item: in [a, a + l] of the In time, out mirrored inside the Out time */
    function sched(at, len, dIn, dOut) {
        at = at || 0; len = (len === undefined) ? 0 : len;
        return { a: at * dIn, d: Math.max(0.04, len * dIn), oa: Math.max(0, 1 - at - len) * dOut, od: Math.max(0.04, len * dOut) };
    }
    /* room the graphics need beside the text (font sizes): left of left-aligned text, right of right-aligned */
    function sidePad(p) {
        var m = 0, j, e, w, side = (p.al === "R") ? "R" : "L";
        function d(v, k) { return (v === undefined) ? k : v; }
        for (j = 0; j < p.e.length; j++) {
            e = p.e[j]; w = 0;
            if (e.t === "plate" || e.t === "outline" || e.t === "block" || e.t === "brackets") w = d(e.px, 0.45);
            else if (e.t === "bar" && (e.side || "L") === side) w = d(e.gap, 0.35) + d(e.w, 0.08);
            else if (e.t === "dot" && (e.side || "L") === side) w = d(e.gap, 0.35) + ((e.d === "fit") ? 1.9 : d(e.d, 0.25));
            else if (e.t === "slash") w = d(e.gap, 0.3) + 0.4;
            else if (e.t === "corner") w = d(e.gap, 0.3) + 0.05;
            else if (e.t === "line") w = d(e.ext, 0);
            m = Math.max(m, w);
        }
        return m;
    }
    /* where the Controls null sits (fractions of the frame + font sizes of side room) */
    function anchor(p, W, H, fs, gap) {
        var pad = sidePad(p) * fs, x = W * 0.06 + pad;
        if (p.al === "C") x = W / 2; else if (p.al === "R") x = W * 0.94 - pad;
        return [x, H * 0.86 - gap];
    }
    return { list: L, PAL: PAL, GEO: GEO, CAP: CAP, DESC: DESC, colors: colors, lineGap: lineGap, sched: sched, anchor: anchor };
})();
if (typeof UK_CAT !== "undefined") UK_CAT.lowerThird = UK_LT.list;

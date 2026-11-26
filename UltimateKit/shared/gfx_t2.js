/*  Ultimate Kit - Graphics templates 26..50 (see shared/graphics.js for the pieces). */
(function (G) {
    var E = G.E;

    /* 26 - an upload bar filling with its % and the file it carries */
    G.def("g26", "Upload Progress", [["title", "Title", "UPLOADING"], ["file", "File", "Brand_Film_Final.mp4"], ["value", "Percent", "100"], ["done", "Done text", "Ready to publish"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "lines", at: [c.cx, H * 0.5] });
        var bw = Math.min(W * 0.8, u * 100), bh = u * 2.6, by = H * 0.56, x0 = c.cx - bw / 2, v = G.num(c.tx("value"));
        var card = G.card(c, "Card", c.cx, H * 0.52, bw + u * 10, u * 34, { r: u * 3 });
        var ic = c.add("rect", { name: "File Icon", x: x0 + u * 3.5, y: H * 0.44, w: u * 7, h: u * 8.6, r: u * 1.2, fill: P.accent, grad: { c1: P.accent, c2: P.accent2, dir: "v" } });
        var title = G.text(c, "title", x0 + u * 9.5, H * 0.415, "head", u * 2.4, P.accent, { just: "left", track: 260 });
        var file = G.text(c, "file", x0 + u * 9.5, H * 0.465, "head", u * 3.6, P.text, { just: "left", maxW: bw * 0.62 });
        var pct = G.text(c, "", x0 + bw, H * 0.445, "tech", u * 6, P.text, { name: "Percent", just: "right", count: { f: "int", suf: "%" } });
        var track = c.add("rect", { name: "Track", x: x0, y: by, w: bw, h: bh, r: bh / 2, org: "l", fill: P.line });
        var fill = c.add("rect", { name: "Fill", x: x0, y: by, w: bw * v / 100, h: bh, r: bh / 2, org: "l", fill: P.accent, grad: { c1: P.accent2, c2: P.accent, dir: "h" } });
        var glow = c.add("rect", { name: "Fill Glow", x: x0, y: by, w: bw * v / 100, h: bh, r: bh / 2, org: "l", fill: P.glow, blur: u * 1.4, blend: "add", op: 60 });
        var done = G.text(c, "done", c.cx, H * 0.635, "body", u * 3, P.sub);
        var tick = G.icon(c, "check", c.cx - u * 15, H * 0.635, u * 3, P.accent, "Done Tick");
        G.edge(c, { op: 40 });
        G.rise(c, card, 0.1, 0.9, u * 8); G.pop(c, ic, 0.35); G.rise(c, title, 0.4); G.rise(c, file, 0.48); G.fade(c, track, 0.5, 0.5); G.rise(c, pct, 0.5);
        G.grow(c, fill, 0.6, 2.4, "x"); G.grow(c, glow, 0.6, 2.4, "x"); G.count(c, pct, 0.6, 2.4, 0, v);
        G.rise(c, done, 3.0); G.draw(c, tick, 3.0, 0.45);
    }, 5);

    /* 27 - three cards fanning out of a stack */
    G.def("g27", "Card Stack", [["head", "Headline", "Pick your style"], ["t1", "Card 1", "Minimal"], ["t2", "Card 2", "Bold"], ["t3", "Card 3", "Playful"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.55], orbs: [[0.5, 0.58, 64, "accent", 26]] });
        var head = G.text(c, "head", c.cx, H * (st ? 0.18 : 0.15), "display", u * 6.4, P.text, { maxW: W * 0.86 });
        var cw = st ? W * 0.42 : u * 34, ch = cw * 1.32, cy = H * 0.58, rots = [-14, 0, 14], dx = [-1, 0, 1], cards = [], labs = [], cols = [[P.accent2, P.panel], [P.accent, P.accent2], [P.glow, P.panel]];
        for (i = 0; i < 3; i++) {
            var x = c.cx + dx[i] * cw * 0.72, y = cy + (i === 1 ? -u * 2 : u * 3);
            cards.push(G.card(c, "Card " + (i + 1), x, y, cw, ch, { r: u * 3, rot: 0, grad: { c1: cols[i][0], c2: cols[i][1], dir: "v" }, stroke: P.line }));
            cards[i].rot = rots[i];
            labs.push(G.text(c, "t" + (i + 1), x, y + ch * 0.36, "head", u * 3.6, P.dark ? "#FFFFFF" : P.text, { maxW: cw * 0.84 }));
            labs[i].rot = rots[i];
        }
        G.edge(c, { op: 40 });
        G.rise(c, head, 0.1);
        for (i = 0; i < 3; i++) {
            var t0 = 0.3 + i * 0.12;
            G.key(cards[i], "pos", [[t0, [c.cx, cy + u * 14]], [t0 + 1.1, [cards[i].x, cards[i].y]]], E.out); G.key(cards[i], "rot", [[t0, 0], [t0 + 1.1, rots[i]]], E.out); G.fade(c, cards[i], t0, 0.5);
            G.key(labs[i], "pos", [[t0, [c.cx, cy + u * 14 + ch * 0.36]], [t0 + 1.1, [labs[i].x, labs[i].y]]], E.out); G.key(labs[i], "rot", [[t0, 0], [t0 + 1.1, rots[i]]], E.out); G.fade(c, labs[i], t0 + 0.3, 0.5);
        }
    }, 5);

    /* 28 - neon: an outline frame draws itself, the word flickers on and glows */
    G.def("g28", "Neon Sign", [["word", "Word", "OPEN 24/7"], ["sub", "Subline", "Studio always on"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H;
        G.back(c, { overlay: "grid", at: [c.cx, H * 0.5], reach: 0.6 });
        var fw = Math.min(W * 0.84, u * 110), fh = u * 34;
        var fg = c.add("rect", { name: "Frame Glow", x: c.cx, y: H * 0.47, w: fw, h: fh, r: u * 5, stroke: P.glow, sw: u * 1.6, blur: u * 2, blend: "add", op: 70 });
        var fr = c.add("rect", { name: "Frame", x: c.cx, y: H * 0.47, w: fw, h: fh, r: u * 5, stroke: P.accent, sw: u * 0.5 });
        var word = G.text(c, "word", c.cx, H * 0.47, "display", u * 13, P.text, { maxW: fw * 0.86, glow: { c: P.glow, r: u * 3, op: 90 }, track: 60 });
        var sub = G.text(c, "sub", c.cx, H * 0.47 + fh / 2 + u * 7, "head", u * 3.2, P.sub, { track: 200 });
        G.edge(c, { op: 50 });
        G.draw(c, fg, 0.1, 1.4); G.draw(c, fr, 0.1, 1.4);
        G.key(word, "op", [[0.9, 0], [1.0, 100], [1.08, 20], [1.18, 100], [1.26, 40], [1.4, 100]], "lin");
        G.rise(c, sub, 1.5);
    }, 5);

    /* 29 - four KPI tiles with counters and tiny sparklines */
    G.def("g29", "KPI Grid", [["head", "Headline", "This month"], ["l1", "Tile 1", "Users"], ["v1", "Value 1", "48200"], ["l2", "Tile 2", "Revenue"], ["v2", "Value 2", "126400"], ["l3", "Tile 3", "Growth"], ["v3", "Value 3", "34"], ["l4", "Tile 4", "Rating"], ["v4", "Value 4", "49"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por || c.sq, i;
        G.back(c, { overlay: "grid", at: [c.cx, H * 0.5] });
        var head = G.text(c, "head", c.cx, H * (st ? 0.13 : 0.15), "display", u * 6, P.text);
        var fm = [{ f: "k" }, { f: "k", pre: "$" }, { f: "int", pre: "+", suf: "%" }, { f: "int", suf: "" }], cols = st ? 2 : 4;
        var tw = st ? W * 0.42 : Math.min(W * 0.21, u * 40), th = st ? H * 0.28 : u * 36, list = [];
        for (i = 0; i < 4; i++) {
            var col = i % cols, rowi = Math.floor(i / cols), x = c.cx + (col - (cols - 1) / 2) * (tw + u * 3), y = (st ? H * 0.38 : H * 0.56) + rowi * (th + u * 3);
            var card = G.card(c, "Tile " + (i + 1), x, y, tw, th, { r: u * 2.4 });
            var lab = G.text(c, "l" + (i + 1), x - tw / 2 + u * 3, y - th * 0.3, "head", u * 2.6, P.sub, { just: "left", track: 120, caps: true });
            var num = G.text(c, "", x - tw / 2 + u * 3, y - th * 0.05, "display", u * 6.6, P.text, { just: "left", name: "Value " + (i + 1), count: fm[i], maxW: tw * 0.86 });
            var pts = [], k, sv = [0.3, 0.5, 0.4, 0.7, 0.6, 0.9];
            for (k = 0; k < 6; k++) pts.push([x - tw / 2 + u * 3 + (tw - u * 6) * k / 5, y + th * 0.34 - th * 0.22 * sv[(k + i) % 6]]);
            var sp = G.path(c, "Sparkline " + (i + 1), pts, { stroke: i % 2 ? P.accent2 : P.accent, sw: u * 0.4, smooth: true });
            list.push([card, lab, num, sp]);
        }
        G.edge(c, { op: 40 });
        G.rise(c, head, 0.1);
        for (i = 0; i < 4; i++) {
            var t0 = 0.3 + i * 0.12, L = list[i], v = G.num(c.tx("v" + (i + 1)));
            G.rise(c, L[0], t0); G.rise(c, L[1], t0 + 0.08); G.rise(c, L[2], t0 + 0.12); G.count(c, L[2], t0 + 0.12, 1.6, 0, i === 3 ? v / 10 : v); G.draw(c, L[3], t0 + 0.3, 1.2);
            if (i === 3) { L[2].count = { f: "dec1" }; }
        }
    }, 5);

    /* 30 - a sunrise over the horizon: the planet's rim lights up from the middle, the headline rises */
    G.def("g30", "Sunrise Horizon", [["title", "Title", "INTRODUCING"], ["head", "Headline", "A new dawn for creators"], ["sub", "Subline", "Version 3.0 is live"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.85], reach: 0.9 });
        var R = Math.max(W, H) * 0.9, py = H * (st ? 0.74 : 0.82) + R;
        var sun = c.add("ell", { name: "Sun Glow", x: c.cx, y: py - R, w: W * 0.7, h: u * 30, fill: P.glow, blur: u * 10, blend: "screen", op: 70 });
        var pl = G.planet(c, c.cx, py, R, { a0: -30, size: 10 });
        var title = G.text(c, "title", c.cx, H * (st ? 0.3 : 0.24), "head", u * 3, P.accent, { track: 360 });
        var head = G.text(c, "head", c.cx, H * (st ? 0.4 : 0.38), "display", u * (st ? 7 : 8), P.text, { maxW: W * 0.86, grad: [P.text, P.sub] });
        var sub = G.text(c, "sub", c.cx, H * (st ? 0.48 : 0.5), "body", u * 3.2, P.sub);
        G.edge(c, { op: 50 });
        for (var i = 0; i < pl.length; i++) G.rise(c, pl[i], 0.1, 1.4, u * 16);
        G.key(sun, "pos", [[0.4, [c.cx, py - R + u * 20]], [2.4, [c.cx, py - R]]], E.out); G.fade(c, sun, 0.4, 1.6);
        G.spin(c, pl[pl.length - 1], 0.6, c.dur, -30, 30);
        G.rise(c, title, 0.5); G.rise(c, head, 0.65, 1.1); G.rise(c, sub, 0.85);
    }, 6);

    /* 31 - radar: rings pulsing out of a centre icon, the headline under it */
    G.def("g31", "Radar Pulse", [["head", "Headline", "Now live near you"], ["sub", "Subline", "Find studios in 40 cities"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i, k;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.42] });
        var cy = H * (st ? 0.38 : 0.38), R = Math.min(W, H) * 0.22;
        for (i = 0; i < 3; i++) {
            var r = c.add("ring", { name: "Pulse " + (i + 1), x: c.cx, y: cy, R: R, sw: u * 0.4, c: P.accent });
            var ks = [], ko = [];
            for (k = 0; k < 3; k++) { var t0 = 0.4 + i * 0.6 + k * 1.8; ks.push([t0, 20], [t0 + 1.8, 130]); ko.push([t0, 90], [t0 + 1.8, 0]); }
            G.key(r, "sc", ks, E.gentle, "light"); G.key(r, "op", ko, E.gentle, "light");
        }
        var core = c.add("ell", { name: "Core", x: c.cx, y: cy, w: u * 14, h: u * 14, fill: P.accent, grad: { c1: P.accent, c2: P.accent2, dir: "v" } });
        var cg = c.add("ell", { name: "Core Glow", x: c.cx, y: cy, w: u * 18, h: u * 18, fill: P.glow, blur: u * 4, blend: "add", op: 70 });
        var pin = G.icon(c, "pin", c.cx, cy, u * 6.4, P.dark ? P.bg2 : "#FFFFFF", "Pin");
        var head = G.text(c, "head", c.cx, cy + R * 1.55, "display", u * 6.4, P.text, { maxW: W * 0.86 });
        var sub = G.text(c, "sub", c.cx, cy + R * 1.55 + u * 7, "body", u * 3.2, P.sub, { maxW: W * 0.84 });
        G.edge(c, { op: 45 });
        G.pop(c, cg, 0.15); G.pop(c, core, 0.2); G.pop(c, pin, 0.35); G.rise(c, head, 0.5); G.rise(c, sub, 0.62);
    }, 6);

    /* 32 - three big words, one by one from alternate sides, a marker bar behind the middle one */
    G.def("g32", "Kinetic Words", [["w1", "Word 1", "THINK"], ["w2", "Word 2", "CREATE"], ["w3", "Word 3", "REPEAT"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "lines", at: [c.cx, H * 0.5] });
        var sz = u * (st ? 13 : 15), gap = sz * 1.08, y0 = c.cy - gap;
        var bar = c.add("rect", { name: "Marker", x: c.cx, y: c.cy, w: Math.min(W * 0.84, sz * 4.4), h: sz * 0.9, r: u * 1, fill: P.accent, grad: { c1: P.accent, c2: P.accent2, dir: "h" } });
        var w1 = G.text(c, "w1", c.cx, y0, "display", sz, P.text, { track: 40 });
        var w2 = G.text(c, "w2", c.cx, c.cy, "display", sz, P.dark ? P.bg2 : "#FFFFFF", { track: 40 });
        var w3 = G.text(c, "w3", c.cx, c.cy + gap, "display", sz, P.text, { track: 40, op: 45 });
        G.edge(c, { op: 45 });
        G.slide(c, w1, 0.1, 0.8, -W * 0.3); G.grow(c, bar, 0.5, 0.7, "x"); G.slide(c, w2, 0.55, 0.8, W * 0.3); G.slide(c, w3, 0.9, 0.8, -W * 0.3);
    }, 4);

    /* 33 - price drop: the old price gets struck out, the new one counts down to its value */
    G.def("g33", "Price Drop", [["title", "Title", "PRICE DROP"], ["old", "Old price", "199"], ["now", "New price", "79"], ["note", "Note", "Ends at midnight"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.5], orbs: [[0.5, 0.56, 58, "accent", 26]] });
        var title = G.text(c, "title", c.cx, H * (st ? 0.24 : 0.18), "head", u * 3.6, P.accent, { track: 360 });
        var old = G.text(c, "", c.cx, H * (st ? 0.36 : 0.34), "display", u * 8, P.sub, { s: "$" + c.tx("old"), name: "Old Price", op: 70 });
        var ow = String(c.tx("old")).length * u * 6 + u * 8;
        var strike = G.path(c, "Strike", [[c.cx - ow / 2, old.y + u * 1], [c.cx + ow / 2, old.y - u * 1]], { stroke: P.accent, sw: u * 0.8 });
        var now = G.text(c, "", c.cx, H * (st ? 0.5 : 0.58), "display", u * (st ? 22 : 24), P.text, { name: "New Price", count: { f: "int", pre: "$" }, grad: [P.text, P.sub], glow: { c: P.glow, r: u * 3, op: 40 } });
        var note = G.text(c, "note", c.cx, H * (st ? 0.63 : 0.82), "body", u * 3.2, P.sub);
        G.edge(c, { op: 45 });
        G.rise(c, title, 0.1); G.rise(c, old, 0.25); G.draw(c, strike, 0.7, 0.45);
        G.rise(c, now, 0.9, 1); G.count(c, now, 0.9, 1.4, G.num(c.tx("old")), G.num(c.tx("now"))); G.rise(c, note, 1.2);
    }, 5);

    /* 34 - days left: a huge number in a ring, three day blocks */
    G.def("g34", "Days Left", [["value", "Days", "3"], ["label", "Label", "DAYS LEFT"], ["sub", "Subline", "Early bird pricing ends soon"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por || c.sq, i, v = Math.max(1, Math.min(7, G.num(c.tx("value")) || 3));
        G.back(c, { overlay: "grid", at: [st ? c.cx : W * 0.3, H * 0.5] });
        var rx = st ? c.cx : W * 0.32, ry = st ? H * 0.36 : H * 0.5, R = st ? W * 0.27 : H * 0.3;
        var ring = c.add("ring", { name: "Ring", x: rx, y: ry, R: R, sw: u * 1.6, c: P.accent, track: P.line });
        var num = G.text(c, "", rx, ry, "display", R * 1.1, P.text, { name: "Days", count: { f: "int" }, grad: [P.text, P.sub] });
        var tx = st ? c.cx : W * 0.6, just = st ? "center" : "left";
        var lab = G.text(c, "label", tx, st ? H * 0.66 : H * 0.38, "display", u * 7, P.text, { just: just, track: 60 });
        var sub = G.text(c, "sub", tx, st ? H * 0.72 : H * 0.48, "body", u * 3.2, P.sub, { just: just, maxW: st ? W * 0.86 : W * 0.36 });
        var blocks = [], bs = u * 7;
        for (i = 0; i < 7; i++) blocks.push(c.add("rect", { name: "Day " + (i + 1), x: (st ? c.cx - 3 * (bs + u * 1.4) : tx + bs / 2) + i * (bs + u * 1.4), y: st ? H * 0.8 : H * 0.62, w: bs, h: bs, r: u * 1.2, fill: i < v ? P.accent : P.line, op: i < v ? 100 : 60 }));
        G.edge(c, { op: 40 });
        G.fade(c, ring, 0.1, 0.4); G.draw(c, ring, 0.1, 1.4, 0, v / 7 * 100); G.zoom(c, num, 0.2, 0.9, 1.5); G.count(c, num, 0.2, 1.2, 9, v);
        G.rise(c, lab, 0.4); G.rise(c, sub, 0.5);
        for (i = 0; i < 7; i++) G.pop(c, blocks[i], 0.7 + i * 0.07, 0.5);
    }, 5);

    /* 35 - aurora: big soft glows drifting behind a centred title */
    G.def("g35", "Aurora Hero", [["title", "Title", "STUDIO 2026"], ["head", "Headline", "Design in motion"], ["cta", "Button", "Explore"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.5], dotOp: 22 });
        var orbs = [[0.3, 0.35, "accent", 9, 6], [0.72, 0.4, "accent2", -8, 5], [0.5, 0.75, "glow", 6, -6]], list = [];
        for (i = 0; i < 3; i++) {
            var o = orbs[i], b = c.add("ell", { name: "Aurora " + (i + 1), x: c.X(o[0]), y: c.Y(o[1]), w: Math.max(W, H) * 0.5, h: Math.max(W, H) * 0.34, fill: P[o[2]], blur: u * 14, blend: "screen", op: 55 });
            G.key(b, "pos", [[0, [b.x, b.y]], [c.dur, [b.x + u * o[3] * 2, b.y + u * o[4]]]], E.inout, "light");
            list.push(b);
        }
        var title = G.text(c, "title", c.cx, H * 0.38, "head", u * 3, P.text, { track: 400, op: 80 });
        var head = G.text(c, "head", c.cx, H * 0.49, "display", u * (st ? 8 : 10), P.text, { maxW: W * 0.88 });
        var cta = G.pill(c, "cta", c.cx, H * 0.63, u * 6.6, "#FFFFFF", "#0B0B12", { op: 95 });
        for (i = 0; i < 3; i++) G.fade(c, list[i], i * 0.2, 1.6);
        G.rise(c, title, 0.3); G.rise(c, head, 0.45, 1.1); G.rise(c, cta[0], 0.75); G.rise(c, cta[1], 0.8);
    }, 6);

    /* 36 - corner brackets drawing in around a title, an underline */
    G.def("g36", "Bracket Frame", [["title", "Title", "COMING SOON"], ["head", "Headline", "The Signature Series"], ["sub", "Caption", "Season 01"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, i;
        G.back(c, { overlay: "lines", at: [c.cx, H * 0.5] });
        var fw = Math.min(W * 0.82, u * 120), fh = u * 40, L = u * 8, x0 = c.cx - fw / 2, x1 = c.cx + fw / 2, y0 = c.cy - fh / 2, y1 = c.cy + fh / 2, br = [];
        var corners = [[[x0, y0 + L], [x0, y0], [x0 + L, y0]], [[x1 - L, y0], [x1, y0], [x1, y0 + L]], [[x1, y1 - L], [x1, y1], [x1 - L, y1]], [[x0 + L, y1], [x0, y1], [x0, y1 - L]]];
        for (i = 0; i < 4; i++) br.push(G.path(c, "Bracket " + (i + 1), corners[i], { stroke: P.accent, sw: u * 0.6, cap: "butt" }));
        var title = G.text(c, "title", c.cx, c.cy - fh * 0.24, "head", u * 2.8, P.accent, { track: 460 });
        var head = G.text(c, "head", c.cx, c.cy + fh * 0.02, "display", u * 7, P.text, { maxW: fw * 0.86 });
        var line = G.path(c, "Underline", [[c.cx - u * 10, c.cy + fh * 0.22], [c.cx + u * 10, c.cy + fh * 0.22]], { stroke: P.accent2, sw: u * 0.4 });
        var sub = G.text(c, "sub", c.cx, c.cy + fh * 0.33, "body", u * 2.8, P.sub, { track: 200 });
        G.edge(c, { op: 40 });
        for (i = 0; i < 4; i++) G.draw(c, br[i], 0.1 + i * 0.08, 0.8);
        G.rise(c, title, 0.5); G.rise(c, head, 0.6, 1); G.draw(c, line, 0.9, 0.7); G.rise(c, sub, 1.0);
    }, 5);

    /* 37 - social proof: overlapping avatars pop in a row, a counter of people joined */
    G.def("g37", "Social Proof", [["value", "Number", "12400"], ["label", "Label", "creators joined this month"], ["inits", "Initials (5)", "AN,ML,GK,TS,DB"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.45] });
        var ini = String(c.tx("inits")).split(","), s = u * 11, cols = [P.accent, P.accent2, P.glow, P.sub, P.accent], av = [];
        for (i = 0; i < 5; i++) {
            var x = c.cx + (i - 2) * s * 0.78;
            var a = c.add("ell", { name: "Avatar " + (i + 1), x: x, y: H * 0.4, w: s, h: s, fill: cols[i], stroke: P.bg2, sw: u * 0.7 });
            var t = G.text(c, "", x, H * 0.4, "head", u * 3.4, P.dark ? P.bg2 : "#FFFFFF", { s: (ini[i] || "").replace(/^\s+|\s+$/g, ""), name: "Initials " + (i + 1) });
            av.push([a, t]);
        }
        var num = G.text(c, "", c.cx, H * 0.56, "display", u * 12, P.text, { name: "Number", count: { f: "int", pre: "+" }, grad: [P.text, P.sub] });
        var lab = G.text(c, "label", c.cx, H * 0.66, "body", u * 3.4, P.sub, { maxW: W * 0.84 });
        G.edge(c, { op: 40 });
        for (i = 0; i < 5; i++) { G.pop(c, av[i][0], 0.15 + i * 0.1, 0.55); G.pop(c, av[i][1], 0.2 + i * 0.1, 0.55); }
        G.rise(c, num, 0.6); G.count(c, num, 0.6, 1.8, 0, G.num(c.tx("value"))); G.rise(c, lab, 0.75);
    }, 5);

    /* 38 - a spotlight beam swinging onto a product name, a pool of light under it */
    G.def("g38", "Spotlight", [["head", "Product", "AURA X"], ["sub", "Subline", "The new standard"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.7], reach: 0.6, dotOp: 20 });
        var beam = G.path(c, "Beam", [[c.cx - u * 3, -u * 4], [c.cx + u * 3, -u * 4], [c.cx + W * 0.2, H * 0.76], [c.cx - W * 0.2, H * 0.76]], { fill: P.glow, closed: true, blur: u * 5, blend: "screen", op: 45 });
        beam.x = c.cx; beam.y = -u * 4;
        var pool = c.add("ell", { name: "Light Pool", x: c.cx, y: H * 0.78, w: W * 0.5, h: u * 10, fill: P.glow, blur: u * 4, blend: "screen", op: 70 });
        var head = G.text(c, "head", c.cx, H * 0.56, "display", u * (st ? 14 : 16), P.text, { track: 120, maxW: W * 0.86, grad: [P.text, P.sub] });
        var sub = G.text(c, "sub", c.cx, H * 0.67, "head", u * 3.2, P.sub, { track: 300 });
        G.edge(c, { op: 40 });
        G.fade(c, beam, 0.1, 0.8); G.key(beam, "rot", [[0.1, 24], [1.6, 0]], E.out); G.fade(c, pool, 1.0, 0.8);
        G.zoom(c, head, 1.1, 1.1, 0.85); G.rise(c, sub, 1.4);
    }, 5);

    /* 39 - split screen: an accent panel sweeps in with a big number, text column beside it */
    G.def("g39", "Split Promo", [["big", "Big text", "40%"], ["small", "Under it", "OFF"], ["head", "Headline", "Summer Collection"], ["sub", "Subline", "Fresh styles, limited stock"], ["cta", "Button", "Shop now"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "lines", at: [W * 0.7, H * 0.5] });
        var pw = st ? W : W * 0.45, ph = st ? H * 0.48 : H;
        var panel = c.add("rect", { name: "Panel", x: 0, y: st ? 0 : H / 2, w: pw, h: ph, org: st ? "l" : "l", fill: P.accent, grad: { c1: P.accent, c2: P.accent2, dir: "v" } });
        if (st) panel.y = ph / 2;
        var bx = pw / 2, by = st ? ph * 0.45 : H * 0.46;
        var big = G.text(c, "big", bx, by, "display", st ? W * 0.3 : H * 0.34, P.dark ? P.bg2 : "#FFFFFF", { maxW: pw * 0.86 });
        var small = G.text(c, "small", bx, by + (st ? W * 0.2 : H * 0.22), "head", u * 5, P.dark ? P.bg2 : "#FFFFFF", { track: 400 });
        var tx = st ? c.cx : W * 0.53, just = st ? "center" : "left", mw = st ? W * 0.86 : W * 0.42;
        var head = G.text(c, "head", tx, st ? H * 0.62 : H * 0.36, "display", u * 6.6, P.text, { just: just, maxW: mw });
        var sub = G.text(c, "sub", tx, st ? H * 0.69 : H * 0.47, "body", u * 3.2, P.sub, { just: just, maxW: mw });
        var cta = G.pill(c, "cta", st ? c.cx : tx + u * 13, st ? H * 0.8 : H * 0.62, u * 7, P.accent, P.dark ? P.bg2 : "#FFFFFF");
        G.edge(c, { op: 40 });
        G.grow(c, panel, 0.1, 0.9, "x"); G.zoom(c, big, 0.5, 0.9, 1.3); G.rise(c, small, 0.65);
        G.slide(c, head, 0.5, 0.8, u * 6); G.slide(c, sub, 0.62, 0.8, u * 6); G.rise(c, cta[0], 0.8); G.rise(c, cta[1], 0.85);
    }, 5);

    /* 40 - a countdown ring emptying while the seconds count down */
    G.def("g40", "Countdown Ring", [["secs", "Seconds", "60"], ["label", "Label", "Offer ends in"], ["sub", "Subline", "Don't miss it"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, s = G.num(c.tx("secs")) || 60, d = c.dur;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.48], orbs: [[0.5, 0.48, 50, "glow", 30]] });
        var R = Math.min(W, H) * 0.28, cy = H * 0.5;
        var glow = c.add("ring", { name: "Ring Glow", x: c.cx, y: cy, R: R, sw: u * 3, c: P.glow, blur: u * 2, blend: "add", op: 55 });
        var ring = c.add("ring", { name: "Ring", x: c.cx, y: cy, R: R, sw: u * 2, c: P.accent, track: P.line });
        var num = G.text(c, "", c.cx, cy, "tech", R * 0.6, P.text, { name: "Time", count: { f: "ms" } });
        var lab = G.text(c, "label", c.cx, cy - R * 0.55, "head", u * 2.8, P.sub, { track: 160, caps: true });
        var sub = G.text(c, "sub", c.cx, cy + R * 1.35, "body", u * 3.2, P.sub);
        G.edge(c, { op: 45 });
        G.pop(c, ring, 0.1, 0.7); G.pop(c, glow, 0.1, 0.7); G.rise(c, num, 0.25); G.rise(c, lab, 0.35); G.rise(c, sub, 0.5);
        G.key(ring, "trim", [[0.5, 100], [d, 100 * Math.max(0, 1 - (d - 0.5) / s)]], "lin"); G.key(glow, "trim", [[0.5, 100], [d, 100 * Math.max(0, 1 - (d - 0.5) / s)]], "lin");
        G.key(num, "val", [[0.25, s], [d, s - (d - 0.25)]], "lin");
    }, 6);

    /* 41 - a checklist: boxes tick one after another */
    G.def("g41", "Checklist", [["head", "Headline", "Launch checklist"], ["i1", "Item 1", "Script approved"], ["i2", "Item 2", "Footage edited"], ["i3", "Item 3", "Captions added"], ["i4", "Item 4", "Ready to post"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "grid", at: [c.cx, H * 0.5] });
        var cw = Math.min(W * 0.84, u * 80), ch = u * 56, cy = H * 0.54, x0 = c.cx - cw / 2 + u * 6;
        var head = G.text(c, "head", c.cx, H * (st ? 0.2 : 0.15), "display", u * 6.4, P.text, { maxW: W * 0.86 });
        var card = G.card(c, "Card", c.cx, cy, cw, ch, { r: u * 3 });
        var rows = [];
        for (i = 0; i < 4; i++) {
            var y = cy - ch / 2 + ch * (0.17 + i * 0.22);
            var box = c.add("rect", { name: "Box " + (i + 1), x: x0, y: y, w: u * 5, h: u * 5, r: u * 1.2, stroke: P.accent, sw: u * 0.35 });
            var fill = c.add("rect", { name: "Box Fill " + (i + 1), x: x0, y: y, w: u * 5, h: u * 5, r: u * 1.2, fill: P.accent });
            var tk = G.icon(c, "check", x0, y, u * 3.4, P.dark ? P.bg2 : "#FFFFFF", "Tick " + (i + 1));
            var t = G.text(c, "i" + (i + 1), x0 + u * 6, y, "head", u * 3.6, P.text, { just: "left", maxW: cw * 0.72 });
            rows.push([box, fill, tk, t]);
        }
        G.edge(c, { op: 40 });
        G.rise(c, head, 0.1); G.rise(c, card, 0.2, 0.9, u * 8);
        for (i = 0; i < 4; i++) { var t0 = 0.5 + i * 0.4, R = rows[i]; G.fade(c, R[0], t0 - 0.2, 0.3); G.rise(c, R[3], t0 - 0.2); G.pop(c, R[1], t0, 0.45); G.draw(c, R[2], t0 + 0.15, 0.4); }
    }, 5);

    /* 42 - a donut: three parts drawing in turn, a legend, the total in the middle */
    G.def("g42", "Donut Chart", [["title", "Title", "AUDIENCE"], ["total", "Total", "84000"], ["l1", "Part 1", "Instagram"], ["p1", "Part 1 %", "52"], ["l2", "Part 2", "TikTok"], ["p2", "Part 2 %", "31"], ["l3", "Part 3", "YouTube"], ["p3", "Part 3 %", "17"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por || c.sq, i;
        G.back(c, { overlay: "dots", at: [st ? c.cx : W * 0.35, H * 0.5] });
        var rx = st ? c.cx : W * 0.34, ry = st ? H * 0.36 : H * 0.52, R = st ? W * 0.26 : H * 0.28, cols = [P.accent, P.accent2, P.glow], acc = 0, parts = [];
        for (i = 0; i < 3; i++) {
            var v = G.num(c.tx("p" + (i + 1)));
            var r = c.add("ring", { name: "Part " + (i + 1), x: rx, y: ry, R: R, sw: u * 4.4, c: cols[i], from: acc * 3.6, cap: "butt" });
            parts.push([r, v]); acc += v;
        }
        var num = G.text(c, "", rx, ry - u * 1.4, "display", R * 0.42, P.text, { name: "Total", count: { f: "k" } });
        var title = G.text(c, "title", rx, ry + R * 0.28, "head", u * 2.4, P.sub, { track: 260 });
        var leg = [], lx = st ? c.cx - W * 0.22 : W * 0.62;
        for (i = 0; i < 3; i++) {
            var ly = st ? H * (0.66 + i * 0.07) : H * (0.38 + i * 0.12);
            var dot = c.add("ell", { name: "Legend Dot " + (i + 1), x: lx, y: ly, w: u * 2.4, h: u * 2.4, fill: cols[i] });
            var lt = G.text(c, "l" + (i + 1), lx + u * 3, ly, "head", u * 3.4, P.text, { just: "left" });
            var lp = G.text(c, "", lx + (st ? W * 0.44 : W * 0.28), ly, "tech", u * 3.6, P.sub, { just: "right", name: "Part " + (i + 1) + " %", count: { f: "int", suf: "%" } });
            leg.push([dot, lt, lp]);
        }
        G.edge(c, { op: 40 });
        var t = 0.3;
        for (i = 0; i < 3; i++) { G.draw(c, parts[i][0], t, 0.8, 0, parts[i][1]); t += 0.55; }
        G.rise(c, num, 0.2); G.count(c, num, 0.2, 1.8, 0, G.num(c.tx("total"))); G.rise(c, title, 0.35);
        for (i = 0; i < 3; i++) { G.pop(c, leg[i][0], 0.5 + i * 0.55); G.slide(c, leg[i][1], 0.5 + i * 0.55, 0.7, u * 3); G.fade(c, leg[i][2], 0.55 + i * 0.55, 0.5); G.count(c, leg[i][2], 0.55 + i * 0.55, 0.8, 0, parts[i][1]); }
    }, 5);

    /* 43 - a scoreboard: two teams, scores counting, VS, match time (diagonal sport stripes) */
    G.def("g43", "Scoreboard", [["team1", "Team 1", "TBILISI"], ["s1", "Score 1", "3"], ["team2", "Team 2", "BATUMI"], ["s2", "Score 2", "1"], ["time", "Time", "FULL TIME"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "lines", at: [c.cx, H * 0.5] });
        var stripes = [];
        for (i = 0; i < 6; i++) stripes.push(c.add("rect", { name: "Stripe " + (i + 1), x: c.X(0.1 + i * 0.16), y: c.cy, w: u * 3, h: Math.max(W, H) * 1.4, fill: i % 2 ? P.accent : P.accent2, op: 7, rot: 24 }));
        var bw = Math.min(W * 0.9, u * 120), bh = u * 30, cy = H * 0.5;
        var board = G.card(c, "Board", c.cx, cy, bw, bh, { r: u * 2.4, grad: { c1: P.panel, c2: P.bg2, dir: "v" } });
        var mid = c.add("rect", { name: "Middle", x: c.cx, y: cy, w: u * 20, h: bh, fill: P.accent, grad: { c1: P.accent, c2: P.accent2, dir: "v" } });
        var vs = G.text(c, "", c.cx, cy, "display", u * 7, P.dark ? P.bg2 : "#FFFFFF", { s: "VS", name: "VS" });
        var t1 = G.text(c, "team1", c.cx - bw * 0.3, cy - bh * 0.24, "head", u * 3.4, P.sub, { track: 200, maxW: bw * 0.3 });
        var t2 = G.text(c, "team2", c.cx + bw * 0.3, cy - bh * 0.24, "head", u * 3.4, P.sub, { track: 200, maxW: bw * 0.3 });
        var s1 = G.text(c, "", c.cx - bw * 0.3, cy + bh * 0.1, "tech", u * 14, P.text, { name: "Score 1", count: { f: "int" } });
        var s2 = G.text(c, "", c.cx + bw * 0.3, cy + bh * 0.1, "tech", u * 14, P.text, { name: "Score 2", count: { f: "int" } });
        var time = G.pill(c, "time", c.cx, cy + bh / 2 + u * 7, u * 6, P.accent, P.dark ? P.bg2 : "#FFFFFF", { name: "Time", track: 200 });
        G.edge(c, { op: 45 });
        for (i = 0; i < 6; i++) G.fade(c, stripes[i], i * 0.05, 1);
        G.grow(c, board, 0.1, 0.8, "x"); G.grow(c, mid, 0.4, 0.6, "y"); G.pop(c, vs, 0.7);
        G.slide(c, t1, 0.5, 0.8, -u * 8); G.slide(c, t2, 0.5, 0.8, u * 8); G.rise(c, s1, 0.7); G.rise(c, s2, 0.75);
        G.count(c, s1, 0.8, 1.2, 0, G.num(c.tx("s1"))); G.count(c, s2, 0.8, 1.2, 0, G.num(c.tx("s2"))); G.pop(c, time[0], 1.3); G.pop(c, time[1], 1.35);
    }, 5);

    /* 44 - an equalizer pulsing under a big % */
    G.def("g44", "Equalizer Percent", [["big", "Big number", "75"], ["label", "Label", "of creators use sound design"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i, k;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.6] });
        var n = 17, x0 = c.cx - W * 0.4, x1 = c.cx + W * 0.4, base = H * 0.86, bw = (x1 - x0) / n * 0.55, bars = [];
        for (i = 0; i < n; i++) {
            var h = H * (0.14 + 0.2 * Math.abs(Math.sin(i * 1.7)));
            var b = c.add("rect", { name: "Bar " + (i + 1), x: x0 + (x1 - x0) * (i + 0.5) / n, y: base, w: bw, h: h, r: bw / 2, org: "b", fill: P.accent, grad: { c1: i % 2 ? P.accent2 : P.accent, c2: P.panel, dir: "v" }, op: 80 });
            var ks = [[0.2 + i * 0.03, [100, 0]]];
            for (k = 0; k < 8; k++) ks.push([0.9 + i * 0.03 + k * 0.6, [100, 40 + ((i * 37 + k * 53) % 60)]]);
            G.key(b, "sc", ks, E.inout, "light");
            bars.push(b);
        }
        var big = G.text(c, "", c.cx, H * (st ? 0.3 : 0.32), "display", u * (st ? 24 : 26), P.text, { name: "Percent", count: { f: "int", suf: "%" }, grad: [P.text, P.sub] });
        var lab = G.text(c, "label", c.cx, H * (st ? 0.42 : 0.5), "body", u * 3.6, P.sub, { maxW: W * 0.84 });
        G.edge(c, { op: 45 });
        G.rise(c, big, 0.1, 1); G.count(c, big, 0.1, 1.6, 0, G.num(c.tx("big"))); G.rise(c, lab, 0.3);
    }, 6);

    /* 45 - a light quote card: serif quote, an accent underline drawing, the author */
    G.def("g45", "Quote Card", [["quote", "Quote", "Simplicity is the ultimate sophistication."], ["author", "Author", "Leonardo da Vinci"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.4], dotOp: 18 });
        var cw = Math.min(W * 0.86, u * 120), ch = st ? H * 0.5 : u * 56;
        var card = G.card(c, "Card", c.cx, c.cy, cw, ch, { r: u * 3, fill: P.panel, stroke: P.line });
        var q = G.text(c, "quote", c.cx, c.cy - ch * 0.08, "serif", u * (st ? 5.4 : 6), P.text, { maxW: cw * 0.86 });
        var line = G.path(c, "Underline", [[c.cx - u * 12, c.cy + ch * 0.14], [c.cx + u * 12, c.cy + ch * 0.14]], { stroke: P.accent, sw: u * 0.6 });
        var au = G.text(c, "author", c.cx, c.cy + ch * 0.27, "head", u * 3, P.sub, { track: 160, caps: true });
        G.edge(c, { op: 30 });
        G.rise(c, card, 0.1, 1, u * 8); G.fade(c, q, 0.45, 1); G.draw(c, line, 1.1, 0.8); G.rise(c, au, 1.3);
    }, 5);

    /* 46 - a search bar: the query types itself, the cursor blinks, results slide in */
    G.def("g46", "Search Bar", [["query", "Search", "best motion design plugin"], ["r1", "Result 1", "Ultimate Kit for After Effects"], ["r2", "Result 2", "50 graphics, ready in one click"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "grid", at: [c.cx, H * 0.4] });
        var bw = Math.min(W * 0.86, u * 110), bh = u * 11, by = H * (st ? 0.36 : 0.32), x0 = c.cx - bw / 2;
        var bar = c.add("rect", { name: "Search Box", x: c.cx, y: by, w: bw, h: bh, r: bh / 2, fill: P.panel, stroke: P.accent, sw: u * 0.3 });
        var lens = c.add("ring", { name: "Lens", x: x0 + u * 5.6, y: by - u * 0.6, R: u * 1.7, sw: u * 0.5, c: P.sub });
        var handle = G.path(c, "Lens Handle", [[x0 + u * 6.8, by + u * 0.6], [x0 + u * 8, by + u * 1.8]], { stroke: P.sub, sw: u * 0.5 });
        var q = G.text(c, "query", x0 + u * 10.5, by, "body", u * 3.6, P.text, { just: "left", maxW: bw * 0.78 });
        var cur = c.add("rect", { name: "Cursor", x: x0 + u * 10.5, y: by, w: u * 0.3, h: u * 5, fill: P.accent });
        var rows = [];
        for (i = 0; i < 2; i++) {
            var y = by + bh + u * 5 + i * u * 11;
            var rc = G.card(c, "Result " + (i + 1), c.cx, y, bw, u * 9, { r: u * 2 });
            var rt = G.text(c, "r" + (i + 1), x0 + u * 5, y, "head", u * 3.2, i ? P.sub : P.text, { just: "left", maxW: bw * 0.86 });
            rows.push([rc, rt]);
        }
        G.edge(c, { op: 40 });
        G.pop(c, bar, 0.1, 0.6); G.pop(c, lens, 0.25); G.fade(c, handle, 0.3, 0.3); G.fade(c, q, 0.5, 0.1); G.typed(c, q, 0.5, 1.6);
        cur.after = { name: "Query", gap: u * 0.4 };
        G.pulse(c, cur, 0.4, 6, 0.5, 0);
        for (i = 0; i < 2; i++) { G.rise(c, rows[i][0], 2.3 + i * 0.15); G.rise(c, rows[i][1], 2.35 + i * 0.15); }
    }, 5);

    /* 47 - keyword tags popping into a cloud */
    G.def("g47", "Tag Cloud", [["head", "Headline", "What we do"], ["tags", "Tags (comma)", "Motion,Branding,3D,Editing,Captions,Color,Sound,Social"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.55] });
        var head = G.text(c, "head", c.cx, H * (st ? 0.2 : 0.17), "display", u * 6.4, P.text, { maxW: W * 0.86 });
        var tags = String(c.tx("tags")).split(","), list = [], perRow = st ? 2 : 4, rh = u * 11;
        var order = [3, 0, 6, 2, 7, 1, 5, 4];
        for (i = 0; i < tags.length && i < 12; i++) {
            var tx = tags[i].replace(/^\s+|\s+$/g, ""), row = Math.floor(i / perRow), col = i % perRow, inRow = Math.min(perRow, tags.length - row * perRow);
            var x = c.cx + (col - (inRow - 1) / 2) * (st ? W * 0.42 : W * 0.21) + (row % 2 ? u * 3 : -u * 3), y = H * (st ? 0.34 : 0.4) + row * rh * 1.25;
            var filled = i % 3 === 0, h = u * 8, w = Math.max(h * 2, tx.length * h * 0.36 + h * 1.4);
            var box = c.add("rect", { name: "Tag " + (i + 1) + " Box", x: x, y: y, w: w, h: h, r: h / 2, fill: filled ? P.accent : null, stroke: filled ? null : P.accent, sw: u * 0.3 });
            var t = G.text(c, "", x, y, "head", h * 0.4, filled ? (P.dark ? P.bg2 : "#FFFFFF") : P.text, { s: tx, name: "Tag " + (i + 1), maxW: w * 0.86 });
            list.push([box, t]);
        }
        G.edge(c, { op: 40 });
        G.rise(c, head, 0.1);
        for (i = 0; i < list.length; i++) { var k = order[i % order.length] + Math.floor(i / 8) * 8; G.pop(c, list[i][0], 0.4 + k * 0.1, 0.55); G.pop(c, list[i][1], 0.45 + k * 0.1, 0.55); }
    }, 5);

    /* 48 - a honeycomb of hexagons, some lit, pulsing; title over it */
    G.def("g48", "Hex Grid", [["title", "Title", "NETWORK"], ["head", "Headline", "Connected by design"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i, j, n = 0;
        G.back(c, { overlay: "none", at: [c.cx, H * 0.5] });
        var R = u * 7, dx = R * Math.sqrt(3), dy = R * 1.5;
        var grid = c.add("hexes", { name: "Hex Grid", R: R * 0.92, dx: dx, dy: dy, x0: -dx / 2, y0: -dy / 2, c: P.line, sw: Math.max(1, u * 0.15), op: 80 });
        G.fade(c, grid, 0, 1.2);
        var cols = Math.ceil(W / dx) + 2, rows = Math.ceil(H / dy) + 2;
        for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
            if (((i * 7 + j * 13) % 17) !== 0) continue;
            var x = i * dx + (j % 2 ? dx / 2 : 0) - dx / 2, y = j * dy - dy / 2;
            var hx = c.add("star", { name: "Lit Hex " + (++n), x: x, y: y, R: R * 0.92, n: 6, poly: true, fill: P.accent, op: 75 });
            var dist = Math.sqrt(Math.pow(x - c.cx, 2) + Math.pow(y - c.cy, 2)) / Math.max(W, H);
            G.pop(c, hx, 0.3 + dist * 1.4, 0.5);
            G.pulse(c, hx, 1.4 + dist, 3, 1.2, 25);
        }
        var plate = c.add("ell", { name: "Shade", x: c.cx, y: c.cy, w: W * 0.8, h: H * 0.5, fill: P.bg2, blur: u * 8, op: 85 });
        var title = G.text(c, "title", c.cx, c.cy - u * 7, "head", u * 3, P.accent, { track: 420 });
        var head = G.text(c, "head", c.cx, c.cy + u * 2, "display", u * 7.4, P.text, { maxW: W * 0.86 });
        G.edge(c, { op: 45 });
        G.fade(c, plate, 0.3, 0.8); G.rise(c, title, 0.6); G.rise(c, head, 0.72, 1);
    }, 5);

    /* 49 - a gift box pops and wobbles open, the bonus pill bounces in */
    G.def("g49", "Bonus Gift", [["head", "Headline", "A gift for you"], ["pill", "Bonus", "+30 DAYS FREE"], ["sub", "Subline", "When you upgrade today"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.45], orbs: [[0.5, 0.42, 50, "accent", 30]] });
        var gx = c.cx, gy = H * (st ? 0.38 : 0.4), s = u * 18;
        var box = c.add("rect", { name: "Box", x: gx, y: gy + s * 0.3, w: s, h: s * 0.8, r: u * 1.2, fill: P.accent, grad: { c1: P.accent, c2: P.accent2, dir: "v" } });
        var lid = c.add("rect", { name: "Lid", x: gx, y: gy - s * 0.16, w: s * 1.16, h: s * 0.26, r: u * 1.2, fill: P.accent2 });
        var rib = c.add("rect", { name: "Ribbon", x: gx, y: gy + s * 0.18, w: s * 0.16, h: s * 1.06, fill: P.text, op: 90 });
        var bow1 = c.add("ell", { name: "Bow Left", x: gx - s * 0.16, y: gy - s * 0.38, w: s * 0.36, h: s * 0.24, stroke: P.text, sw: u * 0.9, rot: -20 });
        var bow2 = c.add("ell", { name: "Bow Right", x: gx + s * 0.16, y: gy - s * 0.38, w: s * 0.36, h: s * 0.24, stroke: P.text, sw: u * 0.9, rot: 20 });
        var head = G.text(c, "head", c.cx, H * (st ? 0.58 : 0.66), "display", u * 6.4, P.text, { maxW: W * 0.86 });
        var pill = G.pill(c, "pill", c.cx, H * (st ? 0.66 : 0.77), u * 7, P.accent2, P.dark ? P.bg2 : "#FFFFFF", { name: "Bonus", track: 160 });
        var sub = G.text(c, "sub", c.cx, H * (st ? 0.73 : 0.87), "body", u * 3, P.sub);
        G.edge(c, { op: 45 });
        G.pop(c, box, 0.1); G.pop(c, rib, 0.15); G.pop(c, lid, 0.2); G.pop(c, bow1, 0.3); G.pop(c, bow2, 0.32);
        G.key(lid, "pos", [[0.9, [gx, lid.y]], [1.2, [gx, lid.y - u * 4]], [1.6, [gx, lid.y]]], [[30, 70], [40, 80]]);
        G.key(lid, "rot", [[0.9, 0], [1.1, -8], [1.3, 6], [1.5, -3], [1.7, 0]], E.inout);
        G.rise(c, head, 0.6); G.pop(c, pill[0], 1.0, 0.7); G.pop(c, pill[1], 1.05, 0.7); G.rise(c, sub, 1.2);
    }, 5);

    /* 50 - the year in review: the year counts up, three stats rise under it */
    G.def("g50", "Year Recap", [["year", "Year", "2026"], ["title", "Title", "YEAR IN REVIEW"], ["s1", "Stat 1", "320 videos"], ["s2", "Stat 2", "18M views"], ["s3", "Stat 3", "42 brands"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "grid", at: [c.cx, H * 0.35], orbs: [[0.5, 0.35, 60, "accent", 24]] });
        var y = G.num(c.tx("year")) || 2026;
        var title = G.text(c, "title", c.cx, H * (st ? 0.2 : 0.16), "head", u * 3, P.accent, { track: 420 });
        var year = G.text(c, "", c.cx, H * (st ? 0.33 : 0.36), "display", u * (st ? 22 : 26), P.text, { name: "Year", count: { f: "plain" }, grad: [P.text, P.sub] });
        var stats = [];
        for (i = 0; i < 3; i++) {
            var sx = st ? c.cx : c.cx + (i - 1) * W * 0.28, sy = st ? H * (0.55 + i * 0.1) : H * 0.7;
            var line = G.path(c, "Stat Line " + (i + 1), [[sx - u * 8, sy - u * 5], [sx + u * 8, sy - u * 5]], { stroke: P.accent, sw: u * 0.35 });
            var t = G.text(c, "s" + (i + 1), sx, sy, "display", u * 4.4, P.text, { maxW: st ? W * 0.8 : W * 0.26 });
            stats.push([line, t]);
        }
        G.edge(c, { op: 45 });
        G.rise(c, title, 0.1); G.zoom(c, year, 0.2, 1, 0.8); G.count(c, year, 0.2, 1.6, y - 6, y);
        for (i = 0; i < 3; i++) { G.draw(c, stats[i][0], 1.0 + i * 0.15, 0.6); G.rise(c, stats[i][1], 1.05 + i * 0.15); }
    }, 5);

})(UK_GFX);

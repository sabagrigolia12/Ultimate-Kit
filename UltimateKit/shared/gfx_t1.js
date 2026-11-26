/*  Ultimate Kit - Graphics templates 1..25 (see shared/graphics.js for the pieces). Each one is laid out for the comp
    it goes in: c.wide (landscape), c.sq (square-ish), c.por (portrait); u = 1 % of the comp's shorter side.          */
(function (G) {
    var E = G.E;

    /* 01 - the reference: big % behind a planet whose rim a light runs along, headline + live countdown on the right */
    G.def("g01", "Orbit Sale", [["title", "Title", "BLACK FRIDAY"], ["big", "Big number", "69%"], ["head", "Headline", "BLACK FRIDAY 69% OFF"], ["sub", "Subline", "The best prices in GenAI industry"], ["timer", "Countdown", "14:54:44"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, por = c.por || c.sq;          // (square comps stack like portrait ones)
        G.back(c, { at: por ? [c.cx, H * 0.45] : [W * 0.3, H * 0.75], reach: 0.8 });
        var lx = por ? c.cx : W * 0.28, bigY = por ? H * 0.25 : H * 0.52, bigS = por ? W * 0.34 : H * 0.44;
        var R = por ? W * 0.95 : H * 1.05, py = por ? H * 0.43 + R : H * 0.69 + R;
        var big = G.text(c, "big", lx, bigY, "tech", bigS, P.text, { grad: [P.sub, P.panel], maxW: por ? W * 0.86 : W * 0.46, op: 92 });
        var pl = G.planet(c, lx, py, R, { a0: -44, size: 7 });
        var title = G.text(c, "title", lx, por ? H * 0.08 : H * 0.17, "head", u * (por ? 5 : 4.6), P.sub, { track: 160, maxW: por ? W * 0.8 : W * 0.42 });
        var rx = por ? c.cx : W * 0.555, just = por ? "center" : "left", mw = por ? W * 0.86 : W * 0.4;
        var head = G.text(c, "head", rx, por ? H * 0.6 : H * 0.28, "head", u * (por ? 5.2 : 5.6), P.text, { just: just, maxW: mw });
        var sub = G.text(c, "sub", rx, por ? H * 0.655 : H * 0.4, "body", u * (por ? 3.2 : 2.9), P.accent, { just: just, maxW: mw });
        var tm = G.text(c, "", rx, por ? H * 0.77 : H * 0.66, "tech", u * (por ? 13 : 15), P.text, { name: "Countdown", just: just, grad: [P.text, P.sub], count: { f: "hms" }, track: 30 });
        var cs = G.text(c, "", rx, por ? H * 0.79 : H * 0.69, "tech", u * (por ? 5 : 5.6), P.sub, { name: "Hundredths", just: "left", count: { f: "cs", pre: "." }, op: 60 });
        cs.after = { name: "Countdown", gap: u * 0.6 };
        if (por) { tm.just = "center"; }
        G.edge(c);
        /* motion: everything rises in, the timer counts up to its value and then ticks, the light runs the rim */
        var d = c.dur;
        G.rise(c, title, 0.1, 0.9); G.rise(c, big, 0.25, 1.1, u * 9);
        for (var i = 0; i < pl.length - 1; i++) G.rise(c, pl[i], 0.35, 1.3, u * 14);
        G.rise(c, pl[pl.length - 1], 0.35, 1.3, u * 14);
        G.spin(c, pl[pl.length - 1], 0.9, d, -44, 44);
        G.rise(c, head, 0.45, 0.9); G.rise(c, sub, 0.58, 0.9); G.rise(c, tm, 0.7, 1.0); G.rise(c, cs, 0.78, 1.0);
        G.tick(c, tm, 0.7, 1.6, G.secs(c.tx("timer")), d);
        G.key(cs, "val", [[0.78, 69], [d, 69 - (d - 0.78) * 100]], "lin");
    }, 7);

    /* 02 - countdown blocks DD HH MM SS on cards, a light line sweeping over them */
    G.def("g02", "Launch Countdown", [["title", "Title", "LAUNCHING IN"], ["head", "Headline", "Something big is coming"], ["days", "Days", "03"], ["hours", "Hours", "12"], ["mins", "Minutes", "45"], ["secs", "Seconds", "30"], ["cta", "Button", "Join the waitlist"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por || c.sq, d = c.dur, i;
        G.back(c, { overlay: "grid", at: [c.cx, H * 0.55], reach: 0.7 });
        var title = G.text(c, "title", c.cx, H * (st ? 0.17 : 0.17), "head", u * 3.4, P.accent, { track: 260 });
        var head = G.text(c, "head", c.cx, H * (st ? 0.25 : 0.28), "display", u * (st ? 6.4 : 6.8), P.text, { maxW: W * 0.86 });
        var keys = ["days", "hours", "mins", "secs"], labels = ["DAYS", "HOURS", "MINUTES", "SECONDS"];
        var cw = st ? W * 0.36 : u * 23, ch = st ? cw * 0.92 : u * 25, gap = u * 3, cards = [], nums = [], labs = [];
        for (i = 0; i < 4; i++) {
            var x = st ? c.cx + (i % 2 ? 1 : -1) * (cw / 2 + gap / 2) : c.cx + (i - 1.5) * (cw + gap);
            var y = st ? H * 0.5 + (i < 2 ? -1 : 1) * (ch / 2 + gap / 2) : H * 0.58;
            cards.push(G.card(c, "Card " + labels[i], x, y, cw, ch, { r: u * 2.4, grad: { c1: P.panel, c2: P.bg2, dir: "v" } }));
            nums.push(G.text(c, "", x, y - ch * 0.08, "tech", ch * 0.5, P.text, { name: labels[i].charAt(0) + labels[i].substr(1).toLowerCase(), count: { f: "2d" }, grad: [P.text, P.sub] }));
            labs.push(G.text(c, "", x, y + ch * 0.32, "head", u * 2, P.sub, { s: labels[i], track: 200, name: labels[i].charAt(0) + labels[i].substr(1).toLowerCase() + " Label" }));
        }
        var sweep = c.add("rect", { name: "Light Sweep", x: c.cx - W * 0.45, y: st ? H * 0.5 - ch - gap : H * 0.58 - ch / 2, w: W * 0.28, h: u * 0.35, fill: P.glow, blur: u * 1.2, blend: "add", op: 90 });
        var cta = G.pill(c, "cta", c.cx, H * (st ? 0.84 : 0.85), u * 7, P.accent, P.dark ? P.bg2 : "#FFFFFF");
        G.edge(c, { op: 55 });
        G.rise(c, title, 0.1); G.rise(c, head, 0.22);
        for (i = 0; i < 4; i++) { G.rise(c, cards[i], 0.35 + i * 0.08, 0.9); G.rise(c, nums[i], 0.42 + i * 0.08, 0.9); G.rise(c, labs[i], 0.5 + i * 0.08, 0.9); }
        for (i = 0; i < 3; i++) G.count(c, nums[i], 0.42 + i * 0.08, 1.4, 0, G.num(c.tx(keys[i])));
        G.tick(c, nums[3], 0.66, 1.4, G.num(c.tx("secs")), d);
        G.rise(c, cta[0], 0.8); G.rise(c, cta[1], 0.85);
        G.key(sweep, "pos", [[1.2, [c.cx - W * 0.45, sweep.y]], [d, [c.cx + W * 0.45, sweep.y]]], E.inout, "light");
        G.key(sweep, "op", [[1.2, 0], [1.6, 90], [d - 0.4, 90], [d, 0]], E.soft, "light");
    }, 6);

    /* 03 - one big number counting up, its label, a growth line drawing itself, a +% pill */
    G.def("g03", "Stat Hero", [["value", "Number", "2400000"], ["label", "Label", "Monthly active users"], ["delta", "Change", "+38%"], ["title", "Title", "GROWTH 2026"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por || c.sq, i;
        G.back(c, { at: [W * 0.3, H * 0.4], orbs: [[0.25, 0.45, 60, "accent", 28], [0.8, 0.8, 50, "accent2", 22, 4]] });
        var lx = st ? c.cx : W * 0.08, just = st ? "center" : "left";
        var title = G.text(c, "title", lx, H * (st ? 0.18 : 0.24), "head", u * 3, P.accent, { just: just, track: 220 });
        var num = G.text(c, "", lx, H * (st ? 0.32 : 0.47), "display", u * (st ? 17 : 19), P.text, { name: "Number", just: just, count: { f: "k" }, grad: [P.text, P.sub] });
        var lab = G.text(c, "label", lx, H * (st ? 0.42 : 0.64), "body", u * 3.4, P.sub, { just: just, maxW: st ? W * 0.84 : W * 0.44 });
        var pts = [], n = 8, gx0 = st ? W * 0.1 : W * 0.55, gx1 = st ? W * 0.9 : W * 0.93, gy0 = st ? H * 0.82 : H * 0.72, gy1 = st ? H * 0.56 : H * 0.3;
        var vals = [0.1, 0.22, 0.18, 0.38, 0.34, 0.55, 0.7, 0.95];
        for (i = 0; i < n; i++) pts.push([gx0 + (gx1 - gx0) * i / (n - 1), gy0 + (gy1 - gy0) * vals[i]]);
        var glow = G.path(c, "Line Glow", pts, { stroke: P.glow, sw: u * 1.2, smooth: true, blur: u * 1.4, blend: "add", op: 70 });
        var line = G.path(c, "Growth Line", pts, { stroke: P.accent, sw: u * 0.5, smooth: true });
        var dot = c.add("ell", { name: "End Dot", x: pts[n - 1][0], y: pts[n - 1][1], w: u * 2.2, h: u * 2.2, fill: P.text, stroke: P.accent, sw: u * 0.5 });
        var pill = G.pill(c, "delta", pts[n - 1][0] - u * 6, pts[n - 1][1] - u * 6, u * 5.4, P.accent, P.dark ? P.bg2 : "#FFFFFF", { name: "Change" });
        G.edge(c, { op: 50 });
        G.rise(c, title, 0.1); G.rise(c, num, 0.2, 1); G.count(c, num, 0.2, 1.8, 0, G.num(c.tx("value"))); G.rise(c, lab, 0.35);
        G.draw(c, glow, 0.5, 1.6); G.draw(c, line, 0.5, 1.6); G.pop(c, dot, 2.0, 0.5); G.pop(c, pill[0], 2.2); G.pop(c, pill[1], 2.25);
    }, 6);

    /* 04 - a pricing card: plan, price counting, features with ticks, a button, a badge on top */
    G.def("g04", "Pricing Card", [["badge", "Badge", "MOST POPULAR"], ["plan", "Plan", "Pro"], ["price", "Price", "29"], ["per", "Per", "/month"], ["f1", "Feature 1", "Unlimited projects"], ["f2", "Feature 2", "4K exports"], ["f3", "Feature 3", "Team workspace"], ["f4", "Feature 4", "Priority support"], ["cta", "Button", "Get started"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, i;
        G.back(c, { at: [c.cx, H * 0.5], orbs: [[0.5, 0.5, 70, "accent", 30]] });
        var cw = Math.min(W * 0.84, u * 52), chh = Math.min(H * 0.8, u * 80), cy = H * 0.52, top = cy - chh / 2;
        var glow = c.add("rect", { name: "Card Glow", x: c.cx, y: cy, w: cw, h: chh, r: u * 3, fill: P.accent, blur: u * 6, op: 35, blend: "screen" });
        var card = G.card(c, "Card", c.cx, cy, cw, chh, { r: u * 3, stroke: P.accent, sw: u * 0.18, grad: { c1: P.panel, c2: P.bg2, dir: "v" } });
        var badge = G.pill(c, "badge", c.cx, top, u * 5.2, P.accent, P.dark ? P.bg2 : "#FFFFFF", { name: "Badge", track: 120 });
        var plan = G.text(c, "plan", c.cx, top + chh * 0.13, "head", u * 4.4, P.sub);
        var price = G.text(c, "", c.cx - u * 4, top + chh * 0.29, "display", u * 15, P.text, { name: "Price", count: { f: "int", pre: "$" }, grad: [P.text, P.sub] });
        var per = G.text(c, "per", c.cx, top + chh * 0.31, "body", u * 3, P.sub, { just: "left" });
        per.after = { name: "Price", gap: u * 1 };
        var feats = [], ticks = [];
        for (i = 0; i < 4; i++) {
            var fy = top + chh * (0.47 + i * 0.09), fx = c.cx - cw * 0.34;
            ticks.push(G.icon(c, "check", fx, fy, u * 3, P.accent, "Tick " + (i + 1)));
            feats.push(G.text(c, "f" + (i + 1), fx + u * 3.4, fy, "body", u * 3, P.text, { just: "left", maxW: cw * 0.62 }));
        }
        var cta = G.pill(c, "cta", c.cx, top + chh * 0.88, u * 7.2, P.accent, P.dark ? P.bg2 : "#FFFFFF", { w: cw * 0.78 });
        G.edge(c, { op: 45 });
        G.rise(c, glow, 0.1, 1.1, u * 10); G.rise(c, card, 0.1, 1.1, u * 10); G.pop(c, badge[0], 0.6); G.pop(c, badge[1], 0.65);
        G.rise(c, plan, 0.35); G.rise(c, price, 0.45); G.count(c, price, 0.45, 1.2, 0, G.num(c.tx("price"))); G.rise(c, per, 0.55);
        for (i = 0; i < 4; i++) { G.draw(c, ticks[i], 0.8 + i * 0.12, 0.45); G.slide(c, feats[i], 0.8 + i * 0.12, 0.7, -u * 3); }
        G.rise(c, cta[0], 1.35); G.rise(c, cta[1], 1.4);
    }, 6);

    /* 05 - headline over three feature cards with round icons */
    G.def("g05", "Feature Trio", [["head", "Headline", "Everything you need"], ["t1", "Card 1", "Fast"], ["d1", "Text 1", "Renders in seconds"], ["t2", "Card 2", "Secure"], ["d2", "Text 2", "Private by default"], ["t3", "Card 3", "Smart"], ["d3", "Text 3", "AI that helps"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.3] });
        var head = G.text(c, "head", c.cx, H * (st ? 0.14 : 0.2), "display", u * 6, P.text, { maxW: W * 0.86 });
        var icons = ["bolt", "check", "play"], cw = st ? W * 0.8 : Math.min(W * 0.28, u * 44), ch = st ? H * 0.19 : u * 46, list = [];
        for (i = 0; i < 3; i++) {
            var x = st ? c.cx : c.cx + (i - 1) * (cw + u * 3), y = st ? H * (0.33 + i * 0.22) : H * 0.6;
            var card = G.card(c, "Card " + (i + 1), x, y, cw, ch, { r: u * 2.6 });
            var ix = st ? x - cw * 0.32 : x, iy = st ? y : y - ch * 0.22;
            var circ = c.add("ell", { name: "Icon Circle " + (i + 1), x: ix, y: iy, w: u * 9, h: u * 9, fill: P.accent, grad: { c1: P.accent, c2: P.accent2, dir: "v" } });
            var ic = G.icon(c, icons[i], ix, iy, u * 4.4, P.dark ? P.bg2 : "#FFFFFF", "Icon " + (i + 1));
            var tx = st ? x - cw * 0.14 : x, ty = st ? y - ch * 0.14 : y + ch * 0.1, jj = st ? "left" : "center";
            var t = G.text(c, "t" + (i + 1), tx, ty, "head", u * 4, P.text, { just: jj, maxW: cw * 0.7 });
            var dd = G.text(c, "d" + (i + 1), tx, ty + u * 5, "body", u * 2.6, P.sub, { just: jj, maxW: cw * (st ? 0.6 : 0.84) });
            list.push([card, circ, ic, t, dd]);
        }
        G.edge(c, { op: 40 });
        G.rise(c, head, 0.1);
        for (i = 0; i < 3; i++) { var L = list[i], t0 = 0.35 + i * 0.15; G.rise(c, L[0], t0, 0.9); G.pop(c, L[1], t0 + 0.2); G.pop(c, L[2], t0 + 0.3); G.rise(c, L[3], t0 + 0.25); G.rise(c, L[4], t0 + 0.32); }
    }, 5);

    /* 06 - a ring filling up with the % counting inside */
    G.def("g06", "Progress Ring", [["value", "Percent", "87"], ["label", "Label", "Customer satisfaction"], ["title", "Title", "2026 REPORT"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por || c.sq;
        G.back(c, { at: [st ? c.cx : W * 0.32, H * 0.5], orbs: [[st ? 0.5 : 0.32, st ? 0.42 : 0.5, 46, "glow", 35]] });
        var R = st ? W * 0.3 : H * 0.3, rx = st ? c.cx : W * 0.32, ry = st ? H * 0.4 : H * 0.52, v = G.num(c.tx("value"));
        var glow = c.add("ring", { name: "Ring Glow", x: rx, y: ry, R: R, sw: u * 3, c: P.glow, blur: u * 2.2, blend: "add", op: 60 });
        var ring = c.add("ring", { name: "Ring", x: rx, y: ry, R: R, sw: u * 2.2, c: P.accent, track: P.line });
        var num = G.text(c, "", rx, ry, "display", R * 0.55, P.text, { name: "Percent", count: { f: "int", suf: "%" } });
        var tx = st ? c.cx : W * 0.58, just = st ? "center" : "left";
        var title = G.text(c, "title", tx, st ? H * 0.72 : H * 0.36, "head", u * 3, P.accent, { just: just, track: 220 });
        var lab = G.text(c, "label", tx, st ? H * 0.79 : H * 0.48, "display", u * (st ? 5 : 5.6), P.text, { just: just, maxW: st ? W * 0.86 : W * 0.38 });
        G.edge(c, { op: 45 });
        G.rise(c, ring, 0.1, 0.9); G.rise(c, glow, 0.1, 0.9); G.draw(c, ring, 0.3, 1.8, 0, v); G.draw(c, glow, 0.3, 1.8, 0, v);
        G.rise(c, num, 0.25); G.count(c, num, 0.3, 1.8, 0, v); G.rise(c, title, 0.5); G.rise(c, lab, 0.62);
    }, 5);

    /* 07 - bars growing in turn, a headline with a counting % */
    G.def("g07", "Bar Growth", [["title", "Title", "REVENUE"], ["value", "Growth", "128"], ["label", "Label", "year over year"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "grid", at: [W * 0.7, H * 0.8] });
        var n = 7, x0 = st ? W * 0.12 : W * 0.42, x1 = st ? W * 0.88 : W * 0.92, base = st ? H * 0.86 : H * 0.82, top = st ? H * 0.42 : H * 0.18;
        var bw = (x1 - x0) / n * 0.62, vals = [0.22, 0.3, 0.27, 0.45, 0.56, 0.7, 1], bars = [];
        var axis = G.path(c, "Baseline", [[x0 - u * 2, base], [x1 + u * 2, base]], { stroke: P.line, sw: Math.max(1, u * 0.2) });
        for (i = 0; i < n; i++) {
            var bh = (base - top) * vals[i];
            bars.push(c.add("rect", { name: "Bar " + (i + 1), x: x0 + (x1 - x0) * (i + 0.5) / n, y: base, w: bw, h: bh, r: u * 0.8, org: "b", fill: P.accent, grad: { c1: i === n - 1 ? P.accent : P.accent2, c2: P.panel, dir: "v" }, op: i === n - 1 ? 100 : 75 }));
        }
        var tx = st ? c.cx : W * 0.08, just = st ? "center" : "left";
        var title = G.text(c, "title", tx, st ? H * 0.12 : H * 0.3, "head", u * 3, P.accent, { just: just, track: 220 });
        var num = G.text(c, "", tx, st ? H * 0.23 : H * 0.46, "display", u * 16, P.text, { name: "Growth", just: just, count: { f: "int", pre: "+", suf: "%" }, grad: [P.text, P.sub] });
        var lab = G.text(c, "label", tx, st ? H * 0.32 : H * 0.6, "body", u * 3.4, P.sub, { just: just });
        G.edge(c, { op: 40 });
        G.fade(c, axis, 0.1); G.draw(c, axis, 0.1, 0.8);
        for (i = 0; i < n; i++) G.grow(c, bars[i], 0.3 + i * 0.09, 0.9);
        G.rise(c, title, 0.2); G.rise(c, num, 0.3); G.count(c, num, 0.3, 1.8, 0, G.num(c.tx("value"))); G.rise(c, lab, 0.45);
    }, 5);

    /* 08 - a coupon ticket: dashed outline, notches, a big code */
    G.def("g08", "Coupon Code", [["head", "Headline", "30% OFF EVERYTHING"], ["label", "Label", "USE CODE"], ["code", "Code", "SAVE30"], ["note", "Note", "Valid until Sunday"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.5], orbs: [[0.5, 0.55, 60, "accent", 25]] });
        var tw = Math.min(W * 0.84, u * 90), th = st ? u * 34 : u * 38, ty = H * 0.56;
        var head = G.text(c, "head", c.cx, H * (st ? 0.3 : 0.2), "display", u * 6.6, P.text, { maxW: W * 0.86 });
        var tick = G.card(c, "Ticket", c.cx, ty, tw, th, { r: u * 2.6, grad: { c1: P.panel, c2: P.bg2, dir: "v" }, stroke: P.accent, sw: u * 0.25 });
        var n1 = c.add("ell", { name: "Notch Left", x: c.cx - tw / 2, y: ty, w: u * 6, h: u * 6, fill: P.bg2 });
        var n2 = c.add("ell", { name: "Notch Right", x: c.cx + tw / 2, y: ty, w: u * 6, h: u * 6, fill: P.bg2 });
        var dash = G.path(c, "Cut Line", [[c.cx - tw / 2 + u * 5, ty + th * 0.22], [c.cx + tw / 2 - u * 5, ty + th * 0.22]], { stroke: P.line, sw: Math.max(1.5, u * 0.25), dash: [u * 1.2, u * 1.2], cap: "butt" });
        var lab = G.text(c, "label", c.cx, ty - th * 0.26, "head", u * 2.8, P.sub, { track: 300 });
        var code = G.text(c, "code", c.cx, ty - th * 0.02, "tech", u * 11, P.accent, { track: 120, glow: { c: P.glow, r: u * 2, op: 60 }, maxW: tw * 0.86 });
        var note = G.text(c, "note", c.cx, ty + th * 0.36, "body", u * 2.6, P.sub);
        G.edge(c, { op: 45 });
        G.rise(c, head, 0.1); G.pop(c, tick, 0.3, 0.7); G.pop(c, n1, 0.35, 0.6); G.pop(c, n2, 0.35, 0.6);
        G.rise(c, lab, 0.55); G.zoom(c, code, 0.65, 0.9, 1.3); G.fade(c, dash, 0.9, 0.6); G.rise(c, note, 1.0);
    }, 5);

    /* 09 - NEW badge, a headline a light sweeps across */
    G.def("g09", "New Feature", [["badge", "Badge", "NEW"], ["head", "Headline", "Meet Smart Edit"], ["sub", "Subline", "Cut, caption and color in one click"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "lines", at: [c.cx, H * 0.45], orbs: [[0.5, 0.45, 70, "accent2", 22]] });
        var badge = G.pill(c, "badge", c.cx, H * (st ? 0.36 : 0.3), u * 5.4, P.accent, P.dark ? P.bg2 : "#FFFFFF", { name: "Badge", track: 260 });
        var head = G.text(c, "head", c.cx, H * (st ? 0.46 : 0.48), "display", u * (st ? 8 : 10), P.text, { maxW: W * 0.88, grad: [P.text, P.sub] });
        var sweep = c.add("rect", { name: "Light Sweep", x: c.cx - W * 0.6, y: head.y, w: u * 3, h: u * 18, fill: P.text, rot: 18, blur: u * 1.6, blend: "add", op: 70 });
        var sub = G.text(c, "sub", c.cx, H * (st ? 0.55 : 0.62), "body", u * 3.2, P.sub, { maxW: W * 0.8 });
        G.edge(c, { op: 45 });
        G.pop(c, badge[0], 0.1); G.pop(c, badge[1], 0.15); G.rise(c, head, 0.3, 1); G.rise(c, sub, 0.5);
        G.key(sweep, "pos", [[1.2, [c.cx - W * 0.6, head.y]], [2.6, [c.cx + W * 0.6, head.y]]], E.inout, "light");
    }, 5);

    /* 10 - a testimonial: big quote mark, the quote, five stars, the name */
    G.def("g10", "Testimonial", [["quote", "Quote", "It cut our editing time in half."], ["name", "Name", "Ana Beridze"], ["role", "Role", "Creative Director"], ["init", "Initials", "AB"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.4] });
        var mark = G.text(c, "", c.cx, H * (st ? 0.27 : 0.22), "serif", u * 22, P.accent, { s: "\u201C", name: "Quote Mark", op: 80 });
        var q = G.text(c, "quote", c.cx, H * (st ? 0.42 : 0.44), "serif", u * (st ? 5.6 : 6), P.text, { maxW: W * 0.84 });
        var stars = [];
        for (i = 0; i < 5; i++) stars.push(c.add("star", { name: "Star " + (i + 1), x: c.cx + (i - 2) * u * 5.2, y: H * (st ? 0.53 : 0.59), R: u * 2.1, r: u * 0.95, n: 5, fill: P.accent2 }));
        var av = c.add("ell", { name: "Avatar", x: c.cx - u * 12, y: H * (st ? 0.66 : 0.76), w: u * 8, h: u * 8, fill: P.accent, grad: { c1: P.accent, c2: P.accent2, dir: "v" } });
        var ini = G.text(c, "init", av.x, av.y, "head", u * 3, P.dark ? P.bg2 : "#FFFFFF", { name: "Initials" });
        var name = G.text(c, "name", c.cx - u * 6.5, av.y - u * 1.8, "head", u * 3.2, P.text, { just: "left" });
        var role = G.text(c, "role", c.cx - u * 6.5, av.y + u * 2, "body", u * 2.4, P.sub, { just: "left" });
        G.edge(c, { op: 40 });
        G.zoom(c, mark, 0.1, 0.9, 1.4); G.rise(c, q, 0.3, 1);
        for (i = 0; i < 5; i++) G.pop(c, stars[i], 0.7 + i * 0.08, 0.5);
        G.pop(c, av, 1.1); G.pop(c, ini, 1.15); G.slide(c, name, 1.2, 0.7, u * 3); G.slide(c, role, 1.3, 0.7, u * 3);
    }, 5);

    /* 11 - an event: date card left, title / place / time right, a divider drawing */
    G.def("g11", "Event Date", [["day", "Day", "24"], ["month", "Month", "NOV"], ["title", "Event", "Creator Summit 2026"], ["place", "Place", "Tbilisi, Georgia"], ["time", "Time", "18:00 - 22:00"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por || c.sq;
        G.back(c, { overlay: "grid", at: [W * 0.3, H * 0.5] });
        var dx = st ? c.cx : W * 0.27, dy = st ? H * 0.3 : H * 0.5, cw = st ? W * 0.42 : u * 34, chh = cw * 1.1;
        var card = G.card(c, "Date Card", dx, dy, cw, chh, { r: u * 3, grad: { c1: P.accent, c2: P.accent2, dir: "v" }, stroke: null });
        var day = G.text(c, "day", dx, dy - chh * 0.06, "display", chh * 0.48, P.dark ? P.bg2 : "#FFFFFF", { name: "Day" });
        var mon = G.text(c, "month", dx, dy + chh * 0.3, "head", chh * 0.12, P.dark ? P.bg2 : "#FFFFFF", { track: 300, name: "Month" });
        var tx = st ? c.cx : W * 0.47, just = st ? "center" : "left", mw = st ? W * 0.86 : W * 0.46;
        var title = G.text(c, "title", tx, st ? H * 0.58 : H * 0.36, "display", u * 6, P.text, { just: just, maxW: mw });
        var line = G.path(c, "Divider", [[st ? c.cx - W * 0.3 : tx, st ? H * 0.645 : H * 0.46], [st ? c.cx + W * 0.3 : tx + W * 0.36, st ? H * 0.645 : H * 0.46]], { stroke: P.accent, sw: Math.max(1.5, u * 0.3) });
        var pin = G.icon(c, "pin", st ? c.cx - W * 0.25 : tx + u * 1.6, st ? H * 0.71 : H * 0.56, u * 3.4, P.accent, "Pin");
        var place = G.text(c, "place", st ? c.cx : tx + u * 4.4, st ? H * 0.71 : H * 0.56, "body", u * 3.2, P.text, { just: just });
        var time = G.text(c, "time", st ? c.cx : tx + u * 4.4, st ? H * 0.77 : H * 0.65, "tech", u * 3.6, P.sub, { just: just, track: 60 });
        G.edge(c, { op: 40 });
        G.pop(c, card, 0.1, 0.8); G.rise(c, day, 0.3); G.rise(c, mon, 0.4); G.rise(c, title, 0.5); G.draw(c, line, 0.7, 0.9);
        G.pop(c, pin, 0.9); G.rise(c, place, 0.9); G.rise(c, time, 1.0);
    }, 5);

    /* 12 - a milestone: counter, label, confetti bursting out */
    G.def("g12", "Milestone", [["value", "Number", "100"], ["suffix", "After the number", "K"], ["label", "Label", "FOLLOWERS"], ["thanks", "Line", "Thank you for being here"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.45], orbs: [[0.5, 0.45, 64, "accent", 30]] });
        var cy = H * (st ? 0.42 : 0.45), cols = [P.accent, P.accent2, P.glow, P.text, P.sub], bits = [];
        for (i = 0; i < 18; i++) {
            var a = i / 18 * Math.PI * 2 + (i % 3) * 0.2, r = u * (26 + (i * 7) % 18), sz = u * (0.9 + (i % 4) * 0.35);
            var b = c.add(i % 2 ? "rect" : "ell", { name: "Confetti " + (i + 1), x: c.cx + Math.cos(a) * r * (st ? 0.9 : 1.6), y: cy + Math.sin(a) * r, w: sz, h: i % 2 ? sz * 2.2 : sz, r: sz * 0.3, fill: cols[i % cols.length], rot: i * 37 });
            G.key(b, "pos", [[0.5, [c.cx, cy]], [1.4, [b.x, b.y]]], E.out); G.key(b, "op", [[0.5, 0], [0.6, 100], [3.2, 100], [4.2, 0]], E.soft); G.key(b, "rot", [[0.5, 0], [4.2, b.rot + 220]], E.out);
            bits.push(b);
        }
        var num = G.text(c, "", c.cx, cy, "display", u * (st ? 26 : 28), P.text, { name: "Number", count: { f: "int", suf: c.tx("suffix") }, grad: [P.text, P.sub], glow: { c: P.glow, r: u * 3, op: 45 } });
        var lab = G.text(c, "label", c.cx, cy + u * (st ? 17 : 18), "head", u * 3.6, P.accent, { track: 320 });
        var th = G.text(c, "thanks", c.cx, cy + u * (st ? 25 : 26), "body", u * 3, P.sub, { maxW: W * 0.84 });
        G.edge(c, { op: 45 });
        G.zoom(c, num, 0.2, 1, 0.6); G.count(c, num, 0.2, 1.6, 0, G.num(c.tx("value"))); G.rise(c, lab, 0.6); G.rise(c, th, 0.75);
    }, 5);

    /* 13 - before / after: two cards, values, an arrow between, a headline */
    G.def("g13", "Before After", [["head", "Headline", "Save 94% of your time"], ["l1", "Before label", "BEFORE"], ["v1", "Before", "12 hours"], ["l2", "After label", "AFTER"], ["v2", "After", "45 min"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "lines", at: [c.cx, H * 0.55] });
        var head = G.text(c, "head", c.cx, H * (st ? 0.16 : 0.2), "display", u * 6, P.text, { maxW: W * 0.86 });
        var cw = st ? W * 0.74 : Math.min(W * 0.36, u * 62), chh = st ? H * 0.22 : u * 36, y1 = st ? H * 0.37 : H * 0.58, y2 = st ? H * 0.7 : H * 0.58, x1 = st ? c.cx : c.cx - cw / 2 - u * 6, x2 = st ? c.cx : c.cx + cw / 2 + u * 6;
        var c1 = G.card(c, "Before Card", x1, y1, cw, chh, { r: u * 2.6 });
        var c2 = G.card(c, "After Card", x2, y2, cw, chh, { r: u * 2.6, stroke: P.accent, sw: u * 0.25, grad: { c1: P.panel, c2: P.bg2, dir: "v" } });
        var l1 = G.text(c, "l1", x1, y1 - chh * 0.2, "head", u * 2.6, P.sub, { track: 300 }), v1 = G.text(c, "v1", x1, y1 + chh * 0.12, "display", u * 8, P.sub, { maxW: cw * 0.86 });
        var l2 = G.text(c, "l2", x2, y2 - chh * 0.2, "head", u * 2.6, P.accent, { track: 300 }), v2 = G.text(c, "v2", x2, y2 + chh * 0.12, "display", u * 8, P.text, { maxW: cw * 0.86, grad: [P.text, P.accent] });
        var ar = c.add("ell", { name: "Arrow Circle", x: st ? c.cx : c.cx, y: st ? (y1 + y2) / 2 : y1, w: u * 9, h: u * 9, fill: P.accent });
        var chev = G.icon(c, st ? "chev" : "chev", ar.x, ar.y, u * 4.4, P.dark ? P.bg2 : "#FFFFFF", "Arrow");
        if (st) chev.rot = 90;
        G.edge(c, { op: 40 });
        G.rise(c, head, 0.1); G.rise(c, c1, 0.3); G.rise(c, l1, 0.4); G.rise(c, v1, 0.48); G.pop(c, ar, 0.8); G.pop(c, chev, 0.85);
        G.rise(c, c2, 0.95); G.rise(c, l2, 1.05); G.rise(c, v2, 1.12);
    }, 5);

    /* 14 - two app notifications dropping in, stacked */
    G.def("g14", "Notification", [["app", "App", "Ultimate"], ["init", "Icon letter", "U"], ["t1", "Title 1", "New order received"], ["m1", "Message 1", "Order #2481 - $129.00"], ["t2", "Title 2", "Payment confirmed"], ["m2", "Message 2", "Funds arrive tomorrow"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.35], orbs: [[0.5, 0.4, 60, "accent2", 20]] });
        var nw = Math.min(W * 0.86, u * 80), nh = u * 17, list = [];
        for (i = 0; i < 2; i++) {
            var y = (st ? H * 0.4 : H * 0.38) + i * (nh + u * 3), x = c.cx, lx = x - nw / 2 + u * 3;
            var card = G.card(c, "Notification " + (i + 1), x, y, nw, nh, { r: u * 3.2, fill: P.panel, fillOp: P.dark ? 92 : 100 });
            var ic = c.add("rect", { name: "App Icon " + (i + 1), x: lx + u * 4.5, y: y, w: u * 9, h: u * 9, r: u * 2.2, fill: P.accent, grad: { c1: P.accent, c2: P.accent2, dir: "v" } });
            var il = G.text(c, "init", ic.x, y, "display", u * 4.6, P.dark ? P.bg2 : "#FFFFFF", { name: "Icon Letter " + (i + 1) });
            var app = G.text(c, "app", lx + u * 11.5, y - u * 4.2, "head", u * 2.2, P.sub, { just: "left", name: "App " + (i + 1), caps: true, track: 120 });
            var now = G.text(c, "", x + nw / 2 - u * 3, y - u * 4.2, "body", u * 2.2, P.sub, { just: "right", s: i ? "1m ago" : "now", name: "Time " + (i + 1) });
            var t = G.text(c, "t" + (i + 1), lx + u * 11.5, y - u * 0.4, "head", u * 3.2, P.text, { just: "left", maxW: nw * 0.7 });
            var m = G.text(c, "m" + (i + 1), lx + u * 11.5, y + u * 3.6, "body", u * 2.6, P.sub, { just: "left", maxW: nw * 0.7 });
            list.push([card, ic, il, app, now, t, m]);
        }
        G.edge(c, { op: 40 });
        for (i = 0; i < 2; i++) { var t0 = 0.2 + i * 0.9; for (var k = 0; k < list[i].length; k++) G.drop(c, list[i][k], t0 + k * 0.03, 0.8); }
    }, 5);

    /* 15 - a chat: three bubbles left / right, typing dots before each */
    G.def("g15", "Chat Bubbles", [["m1", "Message 1", "Can you edit my reel today?"], ["m2", "Reply", "Done! Check your inbox"], ["m3", "Message 3", "Wow, that was fast"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.5] });
        var bw = Math.min(W * 0.62, u * 62), bh = u * 11, side = [-1, 1, -1], list = [];
        for (i = 0; i < 3; i++) {
            var y = H * (st ? 0.34 : 0.25) + i * (bh + u * 5), x = c.cx + side[i] * (Math.min(W * 0.84, u * 90) - bw) / 2;
            var me = side[i] > 0;
            var b = c.add("rect", { name: "Bubble " + (i + 1), x: x, y: y, w: bw, h: bh, r: bh / 2, fill: me ? P.accent : P.panel, stroke: me ? null : P.line, sw: Math.max(1, u * 0.12), grad: me ? { c1: P.accent, c2: P.accent2, dir: "h" } : null });
            var t = G.text(c, "m" + (i + 1), x, y, "body", u * 3, me ? (P.dark ? P.bg2 : "#FFFFFF") : P.text, { maxW: bw * 0.86 });
            list.push([b, t]);
        }
        var dots = [];
        for (i = 0; i < 3; i++) dots.push(c.add("ell", { name: "Typing Dot " + (i + 1), x: c.cx + (i - 1) * u * 2.4, y: H * (st ? 0.78 : 0.86), w: u * 1.4, h: u * 1.4, fill: P.sub }));
        G.edge(c, { op: 40 });
        for (i = 0; i < 3; i++) { G.pop(c, list[i][0], 0.3 + i * 0.75, 0.55); G.fade(c, list[i][1], 0.45 + i * 0.75, 0.4); }
        for (i = 0; i < 3; i++) { G.fade(c, dots[i], 2.6, 0.3); G.pulse(c, dots[i], 2.9 + i * 0.12, 4, 0.5, 25); }
    }, 5);

    /* 16 - steps on a line: the line draws, each step pops as it gets there */
    G.def("g16", "Timeline Steps", [["head", "Headline", "How it works"], ["s1", "Step 1", "Sign up"], ["s2", "Step 2", "Connect"], ["s3", "Step 3", "Create"], ["s4", "Step 4", "Launch"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "grid", at: [c.cx, H * 0.55] });
        var head = G.text(c, "head", c.cx, H * (st ? 0.12 : 0.2), "display", u * 6.4, P.text, { maxW: W * 0.86 });
        var a = st ? [W * 0.22, H * 0.26] : [W * 0.12, H * 0.56], b = st ? [W * 0.22, H * 0.86] : [W * 0.88, H * 0.56];
        var line = G.path(c, "Line", [a, b], { stroke: P.line, sw: u * 0.5 }), prog = G.path(c, "Progress", [a, b], { stroke: P.accent, sw: u * 0.5 });
        var nodes = [];
        for (i = 0; i < 4; i++) {
            var f = (i + 0.5) / 4, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
            var n = c.add("ell", { name: "Step " + (i + 1) + " Dot", x: x, y: y, w: u * 7, h: u * 7, fill: P.panel, stroke: P.accent, sw: u * 0.5 });
            var num = G.text(c, "", x, y, "head", u * 3, P.accent, { s: String(i + 1), name: "Step " + (i + 1) + " Number" });
            var lab = G.text(c, "s" + (i + 1), st ? x + u * 7 : x, st ? y : y + u * 8, "head", u * 3.4, P.text, { just: st ? "left" : "center", maxW: st ? W * 0.6 : W * 0.2 });
            nodes.push([n, num, lab, f]);
        }
        G.edge(c, { op: 40 });
        G.rise(c, head, 0.1); G.fade(c, line, 0.2, 0.4); G.draw(c, prog, 0.5, 2.4);
        for (i = 0; i < 4; i++) { var tt = 0.5 + 2.4 * nodes[i][3] - 0.15; G.pop(c, nodes[i][0], tt); G.pop(c, nodes[i][1], tt + 0.05); G.rise(c, nodes[i][2], tt + 0.1); }
    }, 5);

    /* 17 - a huge two-line headline over drifting glows and a turning ray fan */
    G.def("g17", "Glow Headline", [["l1", "Line 1", "Create"], ["l2", "Line 2", "without limits"], ["cta", "Button", "Try it free"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.5], orbs: [[0.35, 0.4, 60, "accent", 40, 6], [0.68, 0.6, 56, "accent2", 38, -5]] });
        var rays = [];
        for (i = 0; i < 5; i++) {
            var r = c.add("rect", { name: "Ray " + (i + 1), x: c.cx, y: H * 1.05, w: u * 1.2, h: Math.max(W, H) * 1.3, org: "b", fill: P.glow, op: 14, rot: -40 + i * 20, blur: u * 1.2, blend: "add" });
            G.key(r, "rot", [[0, r.rot - 6], [c.dur, r.rot + 6]], E.inout, "light"); rays.push(r);
        }
        var l1 = G.text(c, "l1", c.cx, H * (st ? 0.38 : 0.36), "display", u * (st ? 14 : 15), P.text, { maxW: W * 0.88, grad: [P.text, P.sub] });
        var l2 = G.text(c, "l2", c.cx, H * (st ? 0.48 : 0.53), "display", u * (st ? 7 : 8.4), P.accent, { maxW: W * 0.88 });
        var cta = G.pill(c, "cta", c.cx, H * (st ? 0.62 : 0.74), u * 7, P.text, P.bg2);
        G.edge(c, { op: 55 });
        for (i = 0; i < 5; i++) G.fade(c, rays[i], 0.1 + i * 0.05, 1.4);
        G.rise(c, l1, 0.2, 1.1, u * 10); G.rise(c, l2, 0.4, 1.1); G.rise(c, cta[0], 0.7); G.rise(c, cta[1], 0.75);
    }, 6);

    /* 18 - a leaderboard: three rows with rank, name, a growing bar and its score */
    G.def("g18", "Leaderboard", [["head", "Headline", "Top creators"], ["n1", "1st", "Nika"], ["v1", "1st score", "9820"], ["n2", "2nd", "Mariam"], ["v2", "2nd score", "8740"], ["n3", "3rd", "Luka"], ["v3", "3rd score", "7310"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "lines", at: [c.cx, H * 0.4] });
        var head = G.text(c, "head", c.cx, H * (st ? 0.2 : 0.17), "display", u * 6.4, P.text, { maxW: W * 0.86 });
        var rw = Math.min(W * 0.86, u * 100), rh = u * 13, x0 = c.cx - rw / 2, rows = [], top = G.num(c.tx("v1")) || 1;
        for (i = 0; i < 3; i++) {
            var y = H * (st ? 0.36 : 0.36) + i * (rh + u * 3.2), v = G.num(c.tx("v" + (i + 1)));
            var card = G.card(c, "Row " + (i + 1), c.cx, y, rw, rh, { r: u * 2.2, stroke: i === 0 ? P.accent : P.line, sw: u * (i === 0 ? 0.25 : 0.12) });
            var rank = G.text(c, "", x0 + u * 6, y, "display", u * 5, i === 0 ? P.accent : P.sub, { s: String(i + 1), name: "Rank " + (i + 1) });
            var nm = G.text(c, "n" + (i + 1), x0 + u * 12, y - u * 2.2, "head", u * 3.2, P.text, { just: "left", maxW: rw * 0.4 });
            var bar = c.add("rect", { name: "Bar " + (i + 1), x: x0 + u * 12, y: y + u * 2.6, w: (rw - u * 30) * v / top, h: u * 1.4, r: u * 0.7, org: "l", fill: P.accent, grad: { c1: P.accent2, c2: P.accent, dir: "h" } });
            var val = G.text(c, "", x0 + rw - u * 4, y, "tech", u * 4.6, P.text, { just: "right", name: "Score " + (i + 1), count: { f: "int" } });
            rows.push([card, rank, nm, bar, val, v]);
        }
        G.edge(c, { op: 40 });
        G.rise(c, head, 0.1);
        for (i = 0; i < 3; i++) { var t0 = 0.3 + i * 0.15, R = rows[i]; G.rise(c, R[0], t0); G.rise(c, R[1], t0 + 0.05); G.rise(c, R[2], t0 + 0.1); G.grow(c, R[3], t0 + 0.3, 1.2, "x"); G.fade(c, R[4], t0 + 0.2, 0.4); G.count(c, R[4], t0 + 0.3, 1.2, 0, R[5]); }
    }, 5);

    /* 19 - a rating: big score, five stars popping, a review count, a pill */
    G.def("g19", "Rating Score", [["score", "Score", "4.9"], ["reviews", "Reviews", "2925"], ["label", "After the count", " verified reviews"], ["pill", "Pill", "EXCELLENT"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.45], orbs: [[0.5, 0.42, 56, "accent2", 26]] });
        var pill = G.pill(c, "pill", c.cx, H * (st ? 0.27 : 0.2), u * 5.4, P.accent2, P.dark ? P.bg2 : "#FFFFFF", { name: "Pill", track: 260 });
        var sc = G.text(c, "", c.cx, H * (st ? 0.39 : 0.42), "display", u * (st ? 20 : 22), P.text, { name: "Score", count: { f: "dec1" }, grad: [P.text, P.sub] });
        var stars = [];
        for (i = 0; i < 5; i++) stars.push(c.add("star", { name: "Star " + (i + 1), x: c.cx + (i - 2) * u * 8, y: H * (st ? 0.5 : 0.64), R: u * 3.2, r: u * 1.45, n: 5, fill: P.accent2, rot: 0 }));
        var rv = G.text(c, "", c.cx, H * (st ? 0.58 : 0.78), "body", u * 3.2, P.sub, { name: "Reviews", count: { f: "int", suf: c.tx("label") } });
        G.edge(c, { op: 45 });
        G.pop(c, pill[0], 0.1); G.pop(c, pill[1], 0.15); G.zoom(c, sc, 0.25, 1, 0.7); G.count(c, sc, 0.25, 1.4, 0, G.num(c.tx("score")));
        for (i = 0; i < 5; i++) { G.pop(c, stars[i], 0.7 + i * 0.1, 0.55); G.key(stars[i], "rot", [[0.7 + i * 0.1, -70], [1.25 + i * 0.1, 0]], E.out); }
        G.rise(c, rv, 1.1); G.count(c, rv, 1.1, 1.4, 0, G.num(c.tx("reviews")));
    }, 5);

    /* 20 - download the app: a phone outline with a glowing screen, store buttons */
    G.def("g20", "Download App", [["head", "Headline", "Your studio in your pocket"], ["sub", "Subline", "Edit anywhere. Free on iOS and Android."], ["b1", "Button 1", "App Store"], ["b2", "Button 2", "Google Play"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por || c.sq, i;
        G.back(c, { overlay: "dots", at: [st ? c.cx : W * 0.7, H * 0.5], orbs: [[st ? 0.5 : 0.72, 0.5, 60, "accent", 34]] });
        var px = st ? c.cx : W * 0.72, py = st ? H * 0.66 : H * 0.55, ph = st ? H * 0.46 : H * 0.72, pw = ph * 0.5;
        var phone = c.add("rect", { name: "Phone", x: px, y: py, w: pw, h: ph, r: pw * 0.16, fill: P.bg2, stroke: P.sub, sw: u * 0.45 });
        var screen = c.add("rect", { name: "Screen", x: px, y: py, w: pw * 0.88, h: ph * 0.93, r: pw * 0.12, fill: P.accent, grad: { c1: P.accent, c2: P.accent2, dir: "v" }, op: 90 });
        var rows = [];
        for (i = 0; i < 4; i++) rows.push(c.add("rect", { name: "Screen Row " + (i + 1), x: px, y: py - ph * 0.22 + i * ph * 0.14, w: pw * (0.7 - (i % 2) * 0.16), h: ph * 0.06, r: ph * 0.02, fill: "#FFFFFF", op: 35 }));
        var tx = st ? c.cx : W * 0.08, just = st ? "center" : "left", mw = st ? W * 0.86 : W * 0.5;
        var head = G.text(c, "head", tx, st ? H * 0.14 : H * 0.32, "display", u * 6.4, P.text, { just: just, maxW: mw });
        var sub = G.text(c, "sub", tx, st ? H * 0.21 : H * 0.44, "body", u * 3, P.sub, { just: just, maxW: mw });
        var bw = u * 24, bh = u * 7.6, by = st ? H * 0.3 : H * 0.6;
        var b1 = c.add("rect", { name: "Button 1 Box", x: st ? c.cx - bw / 2 - u * 1.5 : tx + bw / 2, y: by, w: bw, h: bh, r: u * 1.8, fill: P.text });
        var b2 = c.add("rect", { name: "Button 2 Box", x: st ? c.cx + bw / 2 + u * 1.5 : tx + bw * 1.5 + u * 3, y: by, w: bw, h: bh, r: u * 1.8, stroke: P.text, sw: u * 0.25 });
        var t1 = G.text(c, "b1", b1.x, by, "head", u * 2.8, P.bg2, { name: "Button 1", maxW: bw * 0.86 }), t2 = G.text(c, "b2", b2.x, by, "head", u * 2.8, P.text, { name: "Button 2", maxW: bw * 0.86 });
        G.edge(c, { op: 45 });
        G.rise(c, phone, 0.3, 1.2, u * 16); G.rise(c, screen, 0.35, 1.2, u * 16);
        for (i = 0; i < 4; i++) G.slide(c, rows[i], 0.9 + i * 0.1, 0.6, -u * 4);
        G.rise(c, head, 0.1); G.rise(c, sub, 0.22); G.rise(c, b1, 0.4); G.rise(c, t1, 0.42); G.rise(c, b2, 0.5); G.rise(c, t2, 0.52);
    }, 5);

    /* 21 - a gauge: half ring, a needle turning to the value, the number */
    G.def("g21", "Speed Gauge", [["value", "Value", "92"], ["label", "Label", "Performance score"], ["title", "Title", "LIGHTHOUSE"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, v = Math.max(0, Math.min(100, G.num(c.tx("value"))));
        G.back(c, { overlay: "grid", at: [c.cx, H * 0.62] });
        var R = Math.min(W * 0.36, H * 0.42), gx = c.cx, gy = H * (st ? 0.52 : 0.66);
        var track = c.add("ring", { name: "Track", x: gx, y: gy, R: R, sw: u * 2.4, c: P.line, from: -90, te: 50 });
        var arc = c.add("ring", { name: "Value Arc", x: gx, y: gy, R: R, sw: u * 2.4, c: P.accent, from: -90 });
        var glow = c.add("ring", { name: "Arc Glow", x: gx, y: gy, R: R, sw: u * 3.4, c: P.glow, from: -90, blur: u * 2, blend: "add", op: 60 });
        var needle = c.add("rect", { name: "Needle", x: gx, y: gy, w: u * 0.8, h: R * 0.86, r: u * 0.4, org: "b", fill: P.text, rot: -90 });
        var hub = c.add("ell", { name: "Hub", x: gx, y: gy, w: u * 4, h: u * 4, fill: P.text });
        var num = G.text(c, "", gx, gy - R * 0.38, "display", R * 0.36, P.text, { name: "Value", count: { f: "int" } });
        var title = G.text(c, "title", c.cx, H * (st ? 0.2 : 0.14), "head", u * 3, P.accent, { track: 300 });
        var lab = G.text(c, "label", gx, gy + u * 7, "body", u * 3.4, P.sub);
        G.edge(c, { op: 40 });
        G.rise(c, title, 0.1); G.fade(c, track, 0.2, 0.5); G.draw(c, arc, 0.4, 1.6, 0, v / 2); G.draw(c, glow, 0.4, 1.6, 0, v / 2);
        G.pop(c, hub, 0.3); G.pop(c, needle, 0.3); G.key(needle, "rot", [[0.4, -90], [2.0, -90 + 180 * v / 100]], E.out);
        G.rise(c, num, 0.4); G.count(c, num, 0.4, 1.6, 0, v); G.rise(c, lab, 0.6);
    }, 5);

    /* 22 - a smooth line chart drawing over a grid, a value tag at its end */
    G.def("g22", "Line Chart", [["title", "Title", "ENGAGEMENT"], ["head", "Headline", "Up and to the right"], ["tag", "Tag", "+64%"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "grid", grid: 5, at: [W * 0.7, H * 0.4] });
        var x0 = W * 0.1, x1 = W * 0.9, y0 = H * (st ? 0.82 : 0.84), y1 = H * (st ? 0.42 : 0.36), vals = [0.08, 0.2, 0.15, 0.36, 0.3, 0.5, 0.62, 0.58, 0.85, 1], pts = [];
        for (i = 0; i < vals.length; i++) pts.push([x0 + (x1 - x0) * i / (vals.length - 1), y0 + (y1 - y0) * vals[i]]);
        var area = G.path(c, "Area", pts.concat([[x1, y0], [x0, y0]]), { fill: P.accent, op: 16, closed: true });
        var glow = G.path(c, "Line Glow", pts, { stroke: P.glow, sw: u * 1.4, smooth: true, blur: u * 1.6, blend: "add", op: 60 });
        var line = G.path(c, "Line", pts, { stroke: P.accent, sw: u * 0.6, smooth: true });
        var end = pts[pts.length - 1], dot = c.add("ell", { name: "End Dot", x: end[0], y: end[1], w: u * 2.6, h: u * 2.6, fill: P.text, stroke: P.accent, sw: u * 0.6 });
        var tag = G.pill(c, "tag", end[0] - u * 8, end[1] - u * 7, u * 5.6, P.accent, P.dark ? P.bg2 : "#FFFFFF", { name: "Tag" });
        var title = G.text(c, "title", x0, H * (st ? 0.14 : 0.14), "head", u * 3, P.accent, { just: "left", track: 260 });
        var head = G.text(c, "head", x0, H * (st ? 0.21 : 0.23), "display", u * 6, P.text, { just: "left", maxW: W * 0.8 });
        G.edge(c, { op: 40 });
        G.rise(c, title, 0.1); G.rise(c, head, 0.2); G.draw(c, glow, 0.4, 2); G.draw(c, line, 0.4, 2); G.fade(c, area, 1.2, 1.2);
        G.pop(c, dot, 2.3); G.pop(c, tag[0], 2.45); G.pop(c, tag[1], 2.5);
    }, 5);

    /* 23 - a big discount over a turning starburst */
    G.def("g23", "Discount Burst", [["top", "Top line", "LIMITED OFFER"], ["big", "Discount", "-50%"], ["sub", "Subline", "Only this weekend"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "dots", at: [c.cx, H * 0.48], reach: 0.6 });
        var R = Math.min(W, H) * 0.36, cy = H * 0.5;
        var burst2 = c.add("star", { name: "Burst Back", x: c.cx, y: cy, R: R * 1.08, r: R * 0.82, n: 24, fill: P.accent2, op: 50 });
        var burst = c.add("star", { name: "Burst", x: c.cx, y: cy, R: R, r: R * 0.8, n: 24, fill: P.accent, grad: { c1: P.accent, c2: P.accent2, kind: "rad", p1: [0, 0], p2: [0, R] } });
        var big = G.text(c, "big", c.cx, cy, "display", R * 0.62, P.dark ? P.bg2 : "#FFFFFF", { maxW: R * 1.5 });
        var top = G.text(c, "top", c.cx, cy - R * 1.32, "head", u * 3.4, P.text, { track: 300 });
        var sub = G.text(c, "sub", c.cx, cy + R * 1.32, "head", u * 3.4, P.sub);
        G.edge(c, { op: 50 });
        G.pop(c, burst2, 0.15, 0.8); G.pop(c, burst, 0.2, 0.8); G.key(burst, "rot", [[0.2, -30], [c.dur, 40]], E.inout, "light"); G.key(burst2, "rot", [[0.15, 20], [c.dur, -30]], E.inout, "light");
        G.zoom(c, big, 0.45, 0.8, 1.6); G.rise(c, top, 0.6); G.rise(c, sub, 0.7);
    }, 5);

    /* 24 - live webinar: LIVE pill with a pulsing dot, title, date, host */
    G.def("g24", "Live Webinar", [["live", "Pill", "LIVE"], ["title", "Title", "Motion Design Masterclass"], ["when", "Date", "Thursday, 19:00 GMT+4"], ["host", "Host", "with Saba Grigolia"], ["init", "Initials", "SG"], ["cta", "Button", "Save your seat"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por;
        G.back(c, { overlay: "lines", at: [c.cx, H * 0.4], orbs: [[0.5, 0.42, 58, "accent", 22]] });
        var py = H * (st ? 0.24 : 0.2), pill = c.add("rect", { name: "Live Box", x: c.cx, y: py, w: u * 17, h: u * 6, r: u * 3, fill: P.accent, op: 100 });
        var dot = c.add("ell", { name: "Live Dot", x: c.cx - u * 4.8, y: py, w: u * 1.8, h: u * 1.8, fill: "#FFFFFF" });
        var lt = G.text(c, "live", c.cx + u * 1.6, py, "head", u * 2.8, "#FFFFFF", { name: "Live", track: 260 });
        var title = G.text(c, "title", c.cx, H * (st ? 0.38 : 0.4), "display", u * (st ? 6.6 : 7.2), P.text, { maxW: W * 0.86 });
        var when = G.text(c, "when", c.cx, H * (st ? 0.46 : 0.53), "tech", u * 3.6, P.sub, { track: 60 });
        var av = c.add("ell", { name: "Host Photo", x: c.cx - u * 14, y: H * (st ? 0.58 : 0.68), w: u * 8, h: u * 8, fill: P.accent2, grad: { c1: P.accent2, c2: P.accent, dir: "v" } });
        var ini = G.text(c, "init", av.x, av.y, "head", u * 2.8, "#FFFFFF", { name: "Initials" });
        var host = G.text(c, "host", c.cx - u * 8.6, av.y, "head", u * 3, P.text, { just: "left" });
        var cta = G.pill(c, "cta", c.cx, H * (st ? 0.7 : 0.86), u * 7, P.text, P.bg2);
        G.edge(c, { op: 45 });
        G.pop(c, pill, 0.1); G.pop(c, dot, 0.15); G.pop(c, lt, 0.18); G.pulse(c, dot, 0.8, 8, 0.6, 20);
        G.rise(c, title, 0.3, 1); G.rise(c, when, 0.45); G.pop(c, av, 0.6); G.pop(c, ini, 0.65); G.slide(c, host, 0.65, 0.7, u * 3); G.rise(c, cta[0], 0.8); G.rise(c, cta[1], 0.85);
    }, 6);

    /* 25 - compare two plans: rows with ticks and dashes, the better column lit */
    G.def("g25", "Compare Plans", [["head", "Headline", "Why upgrade?"], ["c1", "Column 1", "Free"], ["c2", "Column 2", "Pro"], ["r1", "Row 1", "4K export"], ["r2", "Row 2", "No watermark"], ["r3", "Row 3", "AI captions"], ["r4", "Row 4", "Cloud storage"]], function (c) {
        var P = c.P, u = c.u, W = c.W, H = c.H, st = c.por, i;
        G.back(c, { overlay: "grid", at: [c.cx, H * 0.5] });
        var tw = Math.min(W * 0.9, u * 110), x0 = c.cx - tw / 2, cA = x0 + tw * 0.62, cB = x0 + tw * 0.86, rh = u * 10, y0 = H * (st ? 0.36 : 0.36);
        var head = G.text(c, "head", c.cx, H * (st ? 0.16 : 0.14), "display", u * 6.4, P.text, { maxW: W * 0.86 });
        var hl = G.card(c, "Pro Column", cB, y0 + rh * 1.9, tw * 0.2, rh * 5.4, { r: u * 2.6, stroke: P.accent, sw: u * 0.25, grad: { c1: P.panel, c2: P.bg2, dir: "v" } });
        var hA = G.text(c, "c1", cA, y0, "head", u * 3.4, P.sub, { name: "Column 1" }), hB = G.text(c, "c2", cB, y0, "head", u * 3.6, P.accent, { name: "Column 2" });
        var rows = [];
        for (i = 0; i < 4; i++) {
            var y = y0 + rh * (i + 1);
            var line = G.path(c, "Row Line " + (i + 1), [[x0, y - rh / 2], [x0 + tw, y - rh / 2]], { stroke: P.line, sw: Math.max(1, u * 0.12) });
            var t = G.text(c, "r" + (i + 1), x0 + u * 2, y, "body", u * 3.2, P.text, { just: "left", maxW: tw * 0.46 });
            var a = G.icon(c, i < 1 ? "check" : "dash", cA, y, u * 3.4, i < 1 ? P.sub : P.line, "Free " + (i + 1));
            var b = G.icon(c, "check", cB, y, u * 3.6, P.accent, "Pro " + (i + 1));
            rows.push([line, t, a, b]);
        }
        G.edge(c, { op: 40 });
        G.rise(c, head, 0.1); G.rise(c, hl, 0.3, 1, u * 8); G.rise(c, hA, 0.35); G.rise(c, hB, 0.4);
        for (i = 0; i < 4; i++) { var t0 = 0.55 + i * 0.12; G.draw(c, rows[i][0], t0, 0.6); G.rise(c, rows[i][1], t0); G.pop(c, rows[i][2], t0 + 0.15); G.draw(c, rows[i][3], t0 + 0.2, 0.4); }
    }, 5);

})(UK_GFX);

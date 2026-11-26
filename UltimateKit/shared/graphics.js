/*  Ultimate Kit - Graphics: ready-made promo / SaaS graphics (sale banners, countdowns, stats, cards, charts ...).
    One description, read by the panel preview (js/gfxprev.js) and by After Effects (jsx/graphics.jsx), so it stays ES3
    (no forEach / map / Object.keys / let). A template is a function of the comp size: every layout is worked out for
    the comp it is applied to (16:9, 9:16, 1:1 ...), so the same graphic fits a reel or a wide video.

    Spec = { W, H, dur, layers: [layer, ...] }  (first = bottom). Layer = { t: type, name, x, y, op, sc, rot, blend,
    blur, ...type fields, a: [anims] }. Anim = { p: "pos" | "op" | "sc" | "rot" | "trim" | "trimS" | "val", k: [[time,
    value], ...], e: [out influence, in influence] (After Effects key ease, speed 0) | "lin", tag: "light" }.
    Types: bg (gradient), dots, grid, edge (inner glow of the frame), rect, ell, path, ring, star, orbit (a light that
    turns round a centre), text (+ count: { f format, pre, suf } = a counter: its value is the "val" keys).
    Colours come from a palette's roles (G.ROLES); fonts from roles (G.FONTS).                                        */
var UK_GFX = (function () {
    var G = {};
    G.ROLES = ["bg1", "bg2", "panel", "accent", "accent2", "text", "sub", "glow", "dots", "line"];
    G.ROLE_NAMES = { bg1: "Background", bg2: "Background 2", panel: "Card", accent: "Accent", accent2: "Accent 2", text: "Text", sub: "Text 2", glow: "Light", dots: "Dots", line: "Lines" };
    /* the 10 colour moods every graphic starts with (luxe = the display font becomes a serif) */
    G.PALETTES = [
        { id: "p01", name: "Midnight Violet", dark: 1, bg1: "#0D0C24", bg2: "#03030A", panel: "#15153A", accent: "#A88BFF", accent2: "#3D5CFF", text: "#F4F3FF", sub: "#B39DFF", glow: "#4F6BFF", dots: "#8C8CFF", line: "#2A2A62" },
        { id: "p02", name: "Black Gold", dark: 1, luxe: 1, bg1: "#17130B", bg2: "#050403", panel: "#211B10", accent: "#E8C47C", accent2: "#B98A3C", text: "#FFF6E3", sub: "#D2BA8C", glow: "#F2C66D", dots: "#E6C27A", line: "#3D3220" },
        { id: "p03", name: "Royal Emerald", dark: 1, luxe: 1, bg1: "#073227", bg2: "#02130F", panel: "#0C3F33", accent: "#39E3A6", accent2: "#DDBA6B", text: "#F1FFF9", sub: "#94DCC2", glow: "#2FFFB0", dots: "#5FE3B5", line: "#14503F" },
        { id: "p04", name: "Clean Sky", dark: 0, bg1: "#FFFFFF", bg2: "#E2E9FF", panel: "#FFFFFF", accent: "#3B5BFF", accent2: "#7FA2FF", text: "#0E1330", sub: "#5B6690", glow: "#6D8BFF", dots: "#3B5BFF", line: "#C9D3F5" },
        { id: "p05", name: "Candy Pop", dark: 0, bg1: "#FFF3F8", bg2: "#FFD6EA", panel: "#FFFFFF", accent: "#FF3D8B", accent2: "#FFB300", text: "#2A0E1F", sub: "#B4467A", glow: "#FF6FAE", dots: "#FF3D8B", line: "#F7BCD8" },
        { id: "p06", name: "Sport Red", dark: 1, bg1: "#1A0707", bg2: "#050101", panel: "#260B0B", accent: "#FF2E2E", accent2: "#FFFFFF", text: "#FFFFFF", sub: "#FF8F8F", glow: "#FF3B3B", dots: "#FF5A5A", line: "#421515" },
        { id: "p07", name: "Neon Lime", dark: 1, bg1: "#0E1509", bg2: "#030502", panel: "#16210F", accent: "#B6FF3B", accent2: "#3BFFD2", text: "#F4FFE8", sub: "#AEDC82", glow: "#9CFF2E", dots: "#B6FF3B", line: "#25371B" },
        { id: "p08", name: "Ocean Cyan", dark: 1, bg1: "#04203B", bg2: "#010A14", panel: "#082C4B", accent: "#2FD3FF", accent2: "#3D7BFF", text: "#EAF8FF", sub: "#86CFEC", glow: "#26C6FF", dots: "#5ED8FF", line: "#103A5E" },
        { id: "p09", name: "Blush Rose", dark: 0, bg1: "#FFF7F8", bg2: "#F8DAE3", panel: "#FFFFFF", accent: "#E5578A", accent2: "#B08AFF", text: "#3B1424", sub: "#A8607A", glow: "#FF9EC0", dots: "#E5578A", line: "#F0C3D0" },
        { id: "p10", name: "Sunset Plum", dark: 1, bg1: "#2E1133", bg2: "#0E0410", panel: "#3C1742", accent: "#FF7A45", accent2: "#FF3D8B", text: "#FFF1EA", sub: "#FFB592", glow: "#FF6A3D", dots: "#FF8A5C", line: "#4E2254" }
    ];
    /* fonts by role: PostScript names for After Effects (the first installed one wins), a CSS stack for the panel */
    G.FONTS = {
        display: { ps: ["Montserrat-ExtraBold", "Poppins-Bold", "Inter-Bold", "SegoeUI-Black", "Arial-BoldMT"], css: "Montserrat, Poppins, Inter, 'Segoe UI', Arial, sans-serif", w: 800 },
        head: { ps: ["Montserrat-Bold", "Poppins-SemiBold", "Inter-SemiBold", "SegoeUI-Bold", "Arial-BoldMT"], css: "Montserrat, Poppins, Inter, 'Segoe UI', Arial, sans-serif", w: 700 },
        body: { ps: ["Montserrat-Medium", "Poppins-Medium", "Inter-Medium", "SegoeUI", "ArialMT"], css: "Montserrat, Poppins, Inter, 'Segoe UI', Arial, sans-serif", w: 500 },
        tech: { ps: ["Bahnschrift-SemiBold", "Bahnschrift", "DINAlternate-Bold", "Montserrat-SemiBold", "Arial-BoldMT"], css: "Bahnschrift, 'DIN Alternate', Montserrat, Arial, sans-serif", w: 600 },
        serif: { ps: ["PlayfairDisplay-Bold", "BodoniMT-Bold", "Didot-Bold", "Georgia-Bold", "TimesNewRomanPS-BoldMT"], css: "'Playfair Display', 'Bodoni MT', Didot, Georgia, serif", w: 700 }
    };
    G.role = function (r, P) { return (r === "display" && P && P.luxe) ? "serif" : (G.FONTS[r] ? r : "head"); };

    /* key eases: [out influence of a segment's first key, in influence of its last key] (speeds 0) */
    var E = G.E = { out: [18, 88], soft: [40, 80], inout: [62, 62], gentle: [33, 70], snap: [8, 96], lin: "lin" };

    /* counter formats: one source, run by the panel and embedded in the After Effects expression */
    G.FMT_SRC = "function fmt(v, f, pre, suf) {\n" +
        "  v = Number(v) || 0;\n" +
        "  var s = '', p2 = function (n) { n = Math.floor(n); return (n < 10 ? '0' : '') + n; };\n" +
        "  if (f == 'hms') { v = Math.max(0, v); s = p2(v / 3600) + ':' + p2((v % 3600) / 60) + ':' + p2(v % 60); }\n" +
        "  else if (f == 'dhms') { v = Math.max(0, v); s = p2(v / 86400) + ':' + p2((v % 86400) / 3600) + ':' + p2((v % 3600) / 60) + ':' + p2(v % 60); }\n" +
        "  else if (f == 'ms') { v = Math.max(0, v); s = p2(v / 60) + ':' + p2(v % 60); }\n" +
        "  else if (f == '2d') { s = p2(Math.max(0, v)); }\n" +
        "  else if (f == 'cs') { s = p2(((Math.floor(v) % 100) + 100) % 100); }\n" +
        "  else if (f == 'k') { var a = Math.abs(v); s = a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : (a >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : String(Math.round(v))); }\n" +
        "  else if (f == 'plain') { s = String(Math.round(v)); }\n" +
        "  else if (f == 'dec1') { s = v.toFixed(1); }\n" +
        "  else if (f == 'dec2') { s = v.toFixed(2); }\n" +
        "  else { var n = String(Math.round(Math.abs(v))), o = ''; while (n.length > 3) { o = ',' + n.substr(n.length - 3) + o; n = n.substr(0, n.length - 3); } s = (v < 0 ? '-' : '') + n + o; }\n" +
        "  return (pre || '') + s + (suf || '');\n" +
        "}";
    G.fmt = (function () { var fmt = null; eval(G.FMT_SRC); return fmt; })();

    /* ------------------------------------------------------------ building a spec */
    function ctx(W, H, P, T, o) {
        var c = { W: W, H: H, P: P, T: T || {}, o: o || {}, L: [], u: Math.min(W, H) / 100 };
        c.por = H > W * 1.15; c.sq = !c.por && H > W * 0.8; c.wide = !c.por && !c.sq;
        c.cx = W / 2; c.cy = H / 2;
        c.X = function (f) { return W * f; }; c.Y = function (f) { return H * f; };
        c.add = function (t, p) { var l = { t: t, a: [] }, k; for (k in p) if (p.hasOwnProperty(k)) l[k] = p[k]; c.L.push(l); return l; };
        c.tx = function (key) { return (c.T[key] !== undefined && c.T[key] !== null) ? String(c.T[key]) : ""; };
        return c;
    }
    G.key = function (l, p, keys, e, tag) { l.a.push({ p: p, k: keys, e: e || E.out, tag: tag }); return l; };
    /* entrances (t = start, d = length) */
    G.rise = function (c, l, t, d, dist) {
        d = d || 0.8; if (dist === undefined) dist = c.u * 6;
        G.key(l, "pos", [[t, [l.x, l.y + dist]], [t + d, [l.x, l.y]]], E.out);
        G.key(l, "op", [[t, 0], [t + d * 0.75, l.op === undefined ? 100 : l.op]], E.soft);
        return l;
    };
    G.drop = function (c, l, t, d) { return G.rise(c, l, t, d, -c.u * 6); };
    G.slide = function (c, l, t, d, dx) {
        d = d || 0.8;
        G.key(l, "pos", [[t, [l.x + dx, l.y]], [t + d, [l.x, l.y]]], E.out);
        G.key(l, "op", [[t, 0], [t + d * 0.7, l.op === undefined ? 100 : l.op]], E.soft);
        return l;
    };
    G.fade = function (c, l, t, d) { G.key(l, "op", [[t, 0], [t + (d || 0.8), l.op === undefined ? 100 : l.op]], E.soft); return l; };
    G.pop = function (c, l, t, d) {
        d = d || 0.6; var s = l.sc || 100;
        G.key(l, "sc", [[t, s * 0.4], [t + d * 0.62, s * 1.08], [t + d, s]], [[20, 75], [40, 70]]);
        G.key(l, "op", [[t, 0], [t + d * 0.4, l.op === undefined ? 100 : l.op]], E.soft);
        return l;
    };
    G.zoom = function (c, l, t, d, from) { d = d || 0.9; var s = l.sc || 100; G.key(l, "sc", [[t, s * (from || 1.25)], [t + d, s]], E.out); G.key(l, "op", [[t, 0], [t + d * 0.6, l.op === undefined ? 100 : l.op]], E.soft); return l; };
    G.grow = function (c, l, t, d, axis) {         // a rect grows from its origin side (org)
        d = d || 0.8; G.key(l, "sc", [[t, axis === "x" ? [0, 100] : [100, 0]], [t + d, [100, 100]]], E.out); return l;
    };
    G.draw = function (c, l, t, d, from, to) { G.key(l, "trim", [[t, from || 0], [t + (d || 1), to === undefined ? 100 : to]], E.inout); return l; };
    G.count = function (c, l, t, d, from, to) { G.key(l, "val", [[t, from], [t + (d || 1.4), to]], E.out); return l; };
    /* a live countdown: counts up to the value with the entrance, then ticks down one second per second */
    G.tick = function (c, l, t, d, to, dur) { G.key(l, "val", [[t, 0], [t + d, to], [dur, to - (dur - t - d)]], [E.out, "lin"]); return l; };
    G.spin = function (c, l, t0, t1, a0, a1, e) { G.key(l, "rot", [[t0, a0], [t1, a1]], e || E.inout, "light"); return l; };
    G.drift = function (c, l, t0, t1, dx, dy) { G.key(l, "pos", [[t0, [l.x, l.y]], [t1, [l.x + dx, l.y + dy]]], E.inout, "light"); return l; };
    G.pulse = function (c, l, t0, n, per, lo) {      // breathing opacity (keys, editable)
        var k = [], i, hi = l.op === undefined ? 100 : l.op;
        for (i = 0; i <= n * 2; i++) k.push([t0 + i * per / 2, i % 2 ? (lo === undefined ? hi * 0.35 : lo) : hi]);
        G.key(l, "op", k, E.inout, "light"); return l;
    };

    /* ------------------------------------------------------------ shared pieces */
    /* the backdrop: gradient + overlay (dots / grid / lines, the panel can change it) + inner glow of the frame */
    G.back = function (c, o) {
        o = o || {};
        var P = c.P, ov = c.o.overlay && c.o.overlay !== "auto" ? c.o.overlay : (o.overlay || "dots");
        var at = o.at || [c.cx, c.cy * 0.8];
        c.add("bg", { name: "Background", kind: o.kind || "rad", c1: P.bg1, c2: P.bg2, p1: at, p2: [at[0] + Math.max(c.W, c.H) * (o.reach || 0.75), at[1]] });
        var fade = o.fade === false ? null : { x: o.fadeAt ? o.fadeAt[0] : c.cx, y: o.fadeAt ? o.fadeAt[1] : c.cy, rx: c.W * (o.fadeR || 0.75), ry: c.H * (o.fadeR || 0.75) };
        if (ov === "dots") c.add("dots", { name: "Dot Overlay", gap: c.u * (o.gap || 1.6), r: c.u * (o.dot || 0.13), c: P.dots, op: o.dotOp || (P.dark ? 30 : 32), fade: fade });
        if (ov === "grid") c.add("grid", { name: "Grid Overlay", gap: c.u * (o.grid || 6), w: Math.max(1, c.u * 0.08), c: P.line, op: P.dark ? 70 : 80, fade: fade });
        if (ov === "lines") c.add("grid", { name: "Line Overlay", gap: c.u * (o.grid || 4), w: Math.max(1, c.u * 0.07), c: P.line, op: P.dark ? 75 : 85, rows: 1, fade: fade });
        if (o.orbs) {
            for (var i = 0; i < o.orbs.length; i++) {
                var b = o.orbs[i], g = c.add("ell", { name: "Glow " + (i + 1), x: c.X(b[0]), y: c.Y(b[1]), w: c.u * b[2], h: c.u * b[2], fill: b[3] ? P[b[3]] : P.glow, op: b[4] || 45, blur: c.u * b[2] * 0.35, blend: "screen" });
                if (b[5]) G.drift(c, g, 0, c.dur || 6, c.u * b[5], -c.u * b[5] * 0.6);
            }
        }
        return ov;
    };
    G.edge = function (c, o) {
        if (c.o.edge === false) return null;
        o = o || {};
        return c.add("edge", { name: "Edge Glow", c: o.c || c.P.glow, w: c.u * (o.w || 2.4), blur: c.u * (o.blur || 3.2), op: o.op || (c.P.dark ? 80 : 55) });
    };
    /* text: x / y = its anchor (middle of the line; left / centre / right edge by just) */
    G.text = function (c, key, x, y, role, size, col, o) {
        o = o || {};
        var p = { name: o.name || (key ? key.charAt(0).toUpperCase() + key.substr(1) : "Text"), s: key ? c.tx(key) : (o.s || ""), x: x, y: y, role: G.role(role, c.P), size: size, c: col,
            just: o.just || "center", track: o.track || 0, maxW: o.maxW || c.W * 0.86, caps: o.caps || false, op: o.op };
        if (o.grad) p.grad = o.grad;
        if (o.glow) p.glow = o.glow;
        if (o.count) p.count = o.count;
        if (o.lead) p.lead = o.lead;
        return c.add("text", p);
    };
    G.pill = function (c, key, x, y, h, fill, col, o) {
        o = o || {};
        var size = h * 0.42, w = o.w || Math.max(h * 2, (c.tx(key).length * size * 0.62) + h * 1.1);
        var r = c.add("rect", { name: (o.name || "Pill") + " Box", x: x, y: y, w: w, h: h, r: h / 2, fill: fill, stroke: o.stroke, sw: o.sw, op: o.op });
        var t = G.text(c, key, x, y, o.role || "head", size, col, { name: o.name || "Pill", track: o.track || 40, caps: o.caps });
        return [r, t];
    };
    /* a soft-shaded planet whose rim a light runs along (the look of the reference) */
    G.planet = function (c, cx, cy, R, o) {
        o = o || {};
        var P = c.P, list = [];
        list.push(c.add("ell", { name: "Planet", x: cx, y: cy, w: R * 2, h: R * 2, fill: P.bg2, grad: { c1: P.panel, c2: P.bg2, kind: "rad", p1: [0, -R], p2: [0, R * 0.4] } }));
        list.push(c.add("ell", { name: "Planet Rim Glow", x: cx, y: cy, w: R * 2, h: R * 2, stroke: P.accent2, sw: c.u * 0.9, blur: c.u * 1.6, op: 70, blend: "add" }));
        list.push(c.add("ell", { name: "Planet Rim", x: cx, y: cy, w: R * 2, h: R * 2, stroke: P.accent2, sw: Math.max(1.5, c.u * 0.18), op: 95 }));
        var L = c.add("orbit", { name: "Rim Light", x: cx, y: cy, R: R, c: P.text, c2: P.glow, size: c.u * (o.size || 7), rot: o.a0 === undefined ? -48 : o.a0, blend: "add" });
        list.push(L);
        return list;
    };

    /* "14:54:44" -> seconds; "2,400" -> 2400 */
    G.secs = function (s) { var p = String(s).split(":"), v = 0, i; for (i = 0; i < p.length; i++) v = v * 60 + (parseFloat(p[i]) || 0); return v; };
    G.num = function (s) { var v = parseFloat(String(s).replace(/[^0-9.\-]/g, "")); return isNaN(v) ? 0 : v; };
    /* a smooth path through points (Catmull-Rom as bezier tangents, the way After Effects stores them) */
    G.smooth = function (pts, k) {
        var I = [], O = [], n = pts.length, i; k = k === undefined ? 0.18 : k;
        for (i = 0; i < n; i++) {
            var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = (b[0] - a[0]) * k * 1.5, dy = (b[1] - a[1]) * k * 1.5;
            if (i === 0 || i === n - 1) { dx *= 0.5; dy *= 0.5; }
            I.push([-dx, -dy]); O.push([dx, dy]);
        }
        return { i: I, o: O };
    };
    G.path = function (c, name, pts, o) {
        o = o || {};
        var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, i;
        for (i = 0; i < pts.length; i++) { minx = Math.min(minx, pts[i][0]); maxx = Math.max(maxx, pts[i][0]); miny = Math.min(miny, pts[i][1]); maxy = Math.max(maxy, pts[i][1]); }
        var p = { name: name, x: (minx + maxx) / 2, y: (miny + maxy) / 2, v: pts, closed: !!o.closed, stroke: o.stroke, sw: o.sw, fill: o.fill, cap: o.cap, op: o.op, blur: o.blur, blend: o.blend, dash: o.dash };
        if (o.smooth) { var t = G.smooth(pts, o.smooth === true ? 0.18 : o.smooth); p.i = t.i; p.o = t.o; }
        return c.add("path", p);
    };

    /* rise a list one after another */
    G.stag = function (c, list, t0, gap, d, fn) { for (var i = 0; i < list.length; i++) if (list[i]) (fn || G.rise)(c, list[i], t0 + i * gap, d); return list; };
    /* a card: rounded panel with a hairline */
    G.card = function (c, name, x, y, w, h, o) {
        o = o || {};
        return c.add("rect", { name: name, x: x, y: y, w: w, h: h, r: o.r === undefined ? c.u * 2.2 : o.r, fill: o.fill || c.P.panel, fillOp: o.fillOp === undefined ? (c.P.dark ? 90 : 100) : o.fillOp,
            stroke: o.stroke === undefined ? c.P.line : o.stroke, sw: o.sw || Math.max(1, c.u * 0.12), org: o.org, op: o.op, grad: o.grad, blur: o.blur, blend: o.blend });
    };
    /* simple line icons (s = size) */
    G.icon = function (c, kind, x, y, s, col, name) {
        var P = [], sw = Math.max(1.5, s * 0.14), closed = false, fill = null, i;
        if (kind === "check") P = [[-0.42, 0.02], [-0.12, 0.32], [0.44, -0.3]];
        else if (kind === "chev") P = [[-0.18, -0.38], [0.2, 0], [-0.18, 0.38]];
        else if (kind === "up") P = [[-0.38, 0.18], [0, -0.2], [0.38, 0.18]];
        else if (kind === "x") P = [[-0.3, -0.3], [0.3, 0.3]];
        else if (kind === "dash") P = [[-0.3, 0], [0.3, 0]];
        else if (kind === "play") { P = [[-0.28, -0.38], [0.4, 0], [-0.28, 0.38]]; closed = true; fill = col; }
        else if (kind === "bolt") { P = [[0.08, -0.5], [-0.3, 0.06], [-0.02, 0.06], [-0.1, 0.5], [0.3, -0.08], [0.02, -0.08]]; closed = true; fill = col; }
        else if (kind === "pin") { P = [[0, 0.5], [-0.32, 0.02], [-0.3, -0.28], [0, -0.48], [0.3, -0.28], [0.32, 0.02]]; closed = true; fill = col; }
        var pts = []; for (i = 0; i < P.length; i++) pts.push([x + P[i][0] * s, y + P[i][1] * s]);
        var l = G.path(c, name || "Icon", pts, { stroke: fill ? null : col, sw: sw, closed: closed, fill: fill, smooth: kind === "pin" ? 0.25 : false });
        l.x = x; l.y = y;
        return l;
    };
    /* typing: the text appears letter by letter (Source Text keys in After Effects) */
    G.typed = function (c, l, t, d) { G.key(l, "chars", [[t, 0], [t + d, String(l.s).length]], "lin"); return l; };

    /* ------------------------------------------------------------ the templates */
    G.T = [];               // { id, name, fields: [[key, label, default]], dur, f: function (c) }
    G.def = function (id, name, fields, f, dur) { G.T.push({ id: id, name: name, fields: fields, f: f, dur: dur || 6 }); };
    G.find = function (id) { for (var i = 0; i < G.T.length; i++) if (G.T[i].id === id) return G.T[i]; return G.T[0]; };
    G.palette = function (id) { for (var i = 0; i < G.PALETTES.length; i++) if (G.PALETTES[i].id === id) return G.PALETTES[i]; return G.PALETTES[0]; };
    G.texts = function (t, T) { var r = {}, i; for (i = 0; i < t.fields.length; i++) r[t.fields[i][0]] = (T && T[t.fields[i][0]] !== undefined) ? T[t.fields[i][0]] : t.fields[i][2]; return r; };
    /* the spec of a template for a comp: o = { overlay, edge, dur } */
    G.spec = function (id, W, H, P, T, o) {
        var t = G.find(id), c = ctx(W, H, P, G.texts(t, T), o);
        c.dur = (o && o.dur) || t.dur;
        t.f(c);
        return { W: W, H: H, dur: c.dur, layers: c.L, id: t.id, name: t.name };
    };
    /* timing from the panel: speed scales every key time (and the length); light = how fast the "light" keys run */
    G.timed = function (S, speed, light) {
        var f = 1 / (speed || 1), lf = 1 / (light || 1), i, j, k;
        for (i = 0; i < S.layers.length; i++) {
            var A = S.layers[i].a;
            for (j = 0; j < A.length; j++) {
                var K = A[j].k, t0 = K[0][0];
                for (k = 0; k < K.length; k++) K[k][0] = A[j].tag === "light" ? t0 * f + (K[k][0] - t0) * lf : K[k][0] * f;
            }
        }
        S.dur = S.dur * f;
        return S;
    };
    return G;
})();

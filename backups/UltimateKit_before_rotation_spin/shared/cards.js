/*  Ultimate Kit - Text Cards (UK_CARD): premium cards that carry a word, a list item or a bigger text.
    Shared by the panel preview and ExtendScript, so ES3 only (non-ASCII only as \u escapes).

    A card opens from its centre (its rectangle Size is keyframed - or its outline draws and then it
    fills), the text reveals inside it, the details come in, and at the end everything leaves exactly
    the way it came in. Sizes are pixels of a 1080-high frame (scaled to the comp).

    preset { id, name, shape (SHAPES), pal (PALS), lay: center | bar | badge | dot (what sits left of
             the text), rev: pop | lineX | lineY | dot | wipe | unfold | outline, txt: fadeUp | blur |
             track | rise | pop | words, deco: [details], text }
    deco:  rim (light on the top edge), sweep (light crossing), center (light glowing in the middle),
           runner (a light running round the edge), glow (soft outer glow), corners (corner marks),
           inset (thin inner frame), underline (line under the text), back (a second card behind),
           shine (a light running through the text)                                                  */
var UK_CARD = (function () {
    /* w, h (px at 1080p), rd = corner roundness 0..1 (1 = pill), k = font size / card height */
    var SHAPES = {
        chip: { w: 400, h: 96, rd: 1, k: 0.38 },
        slim: { w: 1000, h: 92, rd: 1, k: 0.38 },
        pill: { w: 760, h: 128, rd: 1, k: 0.38 },
        tag: { w: 560, h: 112, rd: 0.3, k: 0.38 },
        bar: { w: 900, h: 124, rd: 0.22, k: 0.38 },
        card: { w: 860, h: 250, rd: 0.14, k: 0.26 },
        round: { w: 820, h: 250, rd: 0.5, k: 0.26 },
        square: { w: 600, h: 440, rd: 0.12, k: 0.19 },
        large: { w: 1040, h: 420, rd: 0.09, k: 0.18 },
        banner: { w: 1360, h: 160, rd: 0.12, k: 0.34 }
    };
    /* card colour, fill opacity, border [colour, opacity %, width px], rim light %, text colour, accent,
       shadow %, aurora = two soft colour clouds inside                                              */
    var PALS = {
        onyx: { card: "#0F0F12", fo: 100, border: ["#FFFFFF", 10, 1], rim: 55, text: "#F4F4F6", accent: "#D9C29C", shadow: 50 },
        graphite: { card: "#1C1D22", fo: 100, border: ["#FFFFFF", 12, 1], rim: 45, text: "#FFFFFF", accent: "#E5E7EB", shadow: 45 },
        glass: { card: "#FFFFFF", fo: 9, border: ["#FFFFFF", 32, 1], rim: 70, text: "#FFFFFF", accent: "#A5B4FC", shadow: 22 },
        ivory: { card: "#F6F3EC", fo: 100, border: ["#000000", 7, 1], rim: 0, text: "#18181B", accent: "#A8844F", shadow: 30 },
        midnight: { card: "#0A1222", fo: 100, border: ["#6EA8FF", 22, 1], rim: 40, text: "#EAF1FF", accent: "#6EA8FF", shadow: 50 },
        plum: { card: "#170E22", fo: 100, border: ["#C084FC", 24, 1], rim: 40, text: "#F6EEFF", accent: "#C084FC", shadow: 50 },
        emerald: { card: "#061A13", fo: 100, border: ["#34D399", 22, 1], rim: 35, text: "#E8FFF6", accent: "#34D399", shadow: 50 },
        rose: { card: "#1A1213", fo: 100, border: ["#E8B4A0", 30, 1], rim: 40, text: "#FBEDE7", accent: "#E8B4A0", shadow: 50 },
        violet: { card: "#6D4AFF", fo: 100, border: ["#FFFFFF", 22, 1], rim: 60, text: "#FFFFFF", accent: "#FFFFFF", shadow: 45 },
        aurora: { card: "#2A1F8F", fo: 100, border: ["#FFFFFF", 18, 1], rim: 60, text: "#FFFFFF", accent: "#FF8BD8", shadow: 45, aurora: 1 }
    };
    var EASE = { out: [18, 80], inout: [62, 62], over: [30, 78], settle: [45, 70], line: [55, 55], soft: [40, 40], lin: null };
    function P(id, name, shape, pal, lay, rev, txt, deco, text) { return { id: id, name: name, shape: shape, pal: pal, lay: lay, rev: rev, txt: txt, deco: deco, text: text }; }
    var W1 = "Designers", W2 = "Fresh Ingredients", W3 = "Programmers\rDesigners\rAdvertisers", W4 = "Ingredients", W5 = "Programmers  \u00B7  Designers  \u00B7  Advertisers";
    var L = [
        /* drawn and built by its own code: shared/tiles.js, js/tilesprev.js, jsx/tiles.jsx */
        { id: "cd32", name: "Number Tiles", kind: "tiles", shape: "bar", pal: "onyx", lay: "center", rev: "pop", txt: "fadeUp", deco: [], text: "" },
        /* drawn and built by its own code: shared/slotcard.js, js/slotprev.js, jsx/slotcard.jsx */
        { id: "cd31", name: "Plugin Slot", kind: "slot", shape: "bar", pal: "onyx", lay: "dot", rev: "pop", txt: "fadeUp", deco: [], text: "HIGH-PASS" },
        P("cd01", "Onyx Pill", "pill", "onyx", "center", "pop", "fadeUp", ["rim", "sweep"], W1),
        P("cd02", "Champagne Line", "slim", "onyx", "center", "lineX", "track", ["underline", "inset"], W1),
        P("cd03", "Glass Chip", "chip", "glass", "dot", "pop", "fadeUp", ["rim"], W1),
        P("cd04", "Neon Runner", "bar", "midnight", "center", "lineX", "blur", ["runner", "glow"], W1),
        P("cd05", "Ivory Tag", "tag", "ivory", "center", "wipe", "rise", ["inset"], W1),
        P("cd06", "Index Card", "card", "graphite", "badge", "pop", "fadeUp", ["rim", "sweep"], W2),
        P("cd07", "Gold Frame", "card", "onyx", "center", "outline", "blur", ["corners", "center"], W2),
        P("cd08", "Emerald Bar", "bar", "emerald", "bar", "lineY", "fadeUp", ["rim"], W1),
        P("cd09", "Plum Glow", "round", "plum", "center", "pop", "blur", ["center", "glow"], W2),
        P("cd10", "Glass Stack", "card", "glass", "center", "unfold", "fadeUp", ["back", "rim", "sweep"], W2),
        P("cd11", "Violet Shine", "pill", "violet", "center", "dot", "pop", ["rim", "shine"], W1),
        P("cd12", "Midnight Banner", "banner", "midnight", "center", "lineX", "words", ["runner"], W5),
        P("cd13", "Ivory Bar", "card", "ivory", "bar", "wipe", "fadeUp", ["underline"], W2),
        P("cd14", "Rose Corners", "square", "rose", "center", "pop", "blur", ["corners", "rim"], W4),
        P("cd15", "Graphite Slim", "slim", "graphite", "dot", "lineX", "track", ["rim"], W1),
        P("cd16", "Aurora Large", "large", "aurora", "center", "pop", "rise", ["rim", "center"], W3),
        P("cd17", "Onyx Index", "bar", "onyx", "badge", "lineX", "fadeUp", ["runner"], W1),
        P("cd18", "Glass Banner", "banner", "glass", "center", "wipe", "fadeUp", ["rim", "sweep"], W5),
        P("cd19", "Emerald Pulse", "pill", "emerald", "dot", "pop", "words", ["glow"], W1),
        P("cd20", "Champagne Card", "card", "onyx", "center", "outline", "rise", ["inset", "shine"], W2),
        P("cd21", "Midnight Large", "large", "midnight", "center", "lineY", "words", ["corners", "sweep"], W3),
        P("cd22", "Plum Stack", "card", "plum", "center", "pop", "fadeUp", ["back", "glow"], W2),
        P("cd23", "Ivory Banner", "banner", "ivory", "center", "lineX", "track", ["underline"], W5),
        P("cd24", "Graphite Square", "square", "graphite", "center", "unfold", "blur", ["rim", "center"], W4),
        P("cd25", "Neon Outline", "card", "midnight", "center", "outline", "track", ["runner", "glow"], W2),
        P("cd26", "Violet Index", "card", "violet", "badge", "pop", "fadeUp", ["rim", "shine"], W2),
        P("cd27", "Rose Pill", "pill", "rose", "center", "wipe", "blur", ["inset", "sweep"], W1),
        P("cd28", "Glass Large", "large", "glass", "center", "unfold", "fadeUp", ["back", "rim"], W3),
        P("cd29", "Emerald Card", "round", "emerald", "bar", "lineX", "rise", ["sweep"], W2),
        P("cd30", "Onyx Banner", "banner", "onyx", "dot", "lineX", "fadeUp", ["runner"], W5)
    ];
    function has(p, d) { for (var i = 0; i < p.deco.length; i++) if (p.deco[i] === d) return true; return false; }

    /* the card's final size and roundness (px of the comp) from the panel sliders (percent) */
    function dims(p, H, o) {
        var s = SHAPES[p.shape], u = H / 1080, w = s.w * u * (o && o.ws ? o.ws / 100 : 1), h = s.h * u * (o && o.hs ? o.hs / 100 : 1);
        var rd = (o && o.rd !== undefined && o.rd !== null) ? o.rd / 100 : s.rd;
        return { w: Math.round(w), h: Math.round(h), r: Math.round(rd * Math.min(w, h) / 2), rd: rd, fs: Math.round(s.h * u * (o && o.hs ? Math.min(o.hs, 160) / 100 : 1) * s.k), u: u };
    }
    /* what sits left of the text (x measured from the card's LEFT edge) and where the text starts:
       text.left = px from the card's left edge (null = centred), text.avail = the width it may use      */
    function layout(p, d) {
        var h = d.h, w = d.w, o = { text: { left: null, avail: w * 0.84 } };
        if (p.lay === "bar") { o.bar = { x: Math.max(h * 0.2, 18 * d.u), w: Math.max(3, Math.round(4 * d.u)), h: h * 0.5 }; o.text.left = o.bar.x + Math.max(h * 0.26, 22 * d.u); }
        else if (p.lay === "badge") { var bd = Math.min(h * 0.56, 130 * d.u); o.badge = { x: h * 0.22 + bd / 2, d: bd }; o.text.left = h * 0.22 + bd + Math.max(h * 0.16, 24 * d.u); }
        else if (p.lay === "dot") { var dd = Math.max(8 * d.u, h * 0.14); o.dot = { x: h * 0.38 + dd / 2, d: dd }; o.text.left = h * 0.38 + dd + h * 0.24; }
        if (o.text.left !== null) o.text.avail = w - o.text.left - h * 0.34;
        return o;
    }
    /* padding of the 2D Text Box around a text of width tw / height th (px): the design's size, but the side
       padding is capped (a short word gets a compact card, a longer text grows it evenly)               */
    function pads(p, d, lay, tw, th, ws) {
        var h = d.h, cap = h * 1.6 * (ws ? ws / 100 : 1), t = Math.max(h * 0.18, (h - th) / 2), l, r;
        if (lay.text.left !== null) { l = lay.text.left; r = Math.min(cap, Math.max(h * 0.34, d.w - l - tw)); }
        else { l = r = Math.min(cap, Math.max(h * 0.4, (d.w - tw) / 2)); }
        return { l: l, r: r, t: t, w: l + tw + r, h: th + 2 * t };
    }
    /* timing: in [0, dIn], hold, out [tO, tO + dOut]; card first in / last out, text and details inside */
    function times(dIn, hold, dOut) {
        var tO = dIn + hold;
        return {
            dIn: dIn, dOut: dOut, tO: tO, end: tO + dOut,
            card: [0, dIn * 0.72, tO + dOut * 0.3, tO + dOut],
            text: [dIn * 0.38, dIn, tO, tO + dOut * 0.62],
            deco: [dIn * 0.45, dIn * 0.95, tO, tO + dOut * 0.45],
            light: [dIn * 0.55, dIn, tO, tO + dOut * 0.5],
            sweep: [dIn * 0.85, dIn * 0.85 + Math.max(0.6, Math.min(1.4, hold * 0.6 + 0.4))],
            shine: [dIn, dIn + Math.max(0.7, Math.min(1.5, hold * 0.6 + 0.5))]
        };
    }
    /* keyframes of the card's Size: the reveal, a hold, the same reveal mirrored on the way out */
    function sizeKeys(p, d, T) {
        var w = d.w, h = d.h, a = T.card[0], b = T.card[1], c = T.card[2], e = T.card[3], line = Math.max(3, Math.round(4 * d.u)), dot = Math.round(Math.min(w, h) * 0.34);
        var inK, inE;
        switch (p.rev) {
            case "lineX": inK = [[0, [0, line]], [0.5, [w, line]], [1, [w, h]]]; inE = ["line", "out"]; break;
            case "lineY": inK = [[0, [line, 0]], [0.45, [line, h]], [1, [w, h]]]; inE = ["line", "out"]; break;
            case "dot": inK = [[0, [0, 0]], [0.32, [dot, dot]], [1, [w, h]]]; inE = ["settle", "out"]; break;
            case "wipe": inK = [[0, [0, h]], [1, [w, h]]]; inE = ["inout"]; break;
            case "unfold": inK = [[0, [w * 0.18, 0]], [1, [w, h]]]; inE = ["out"]; break;
            case "outline": inK = [[0, [w, h]], [1, [w, h]]]; inE = ["lin"]; break;   // the outline draws, then the card fills (outlineKeys)
            default: inK = [[0, [0, 0]], [0.68, [w * 1.035, h * 1.06]], [1, [w, h]]]; inE = ["over", "settle"];
        }
        var k = [], e2 = [], i;
        for (i = 0; i < inK.length; i++) { k.push([a + (b - a) * inK[i][0], inK[i][1]]); if (i) e2.push(inE[i - 1]); }
        e2.push("hold");
        for (i = inK.length - 1; i >= 0; i--) { k.push([c + (e - c) * (1 - inK[i][0]), inK[i][1]]); if (i < inK.length - 1) e2.push("~" + inE[i]); }
        return { k: k, e: e2 };
    }
    /* "outline" reveal: the edge draws first, then the card fills in (and back the same way) */
    function outlineKeys(T) {
        var a = T.card[0], b = T.card[1], c = T.card[2], e = T.card[3];
        return {
            draw: { k: [[a, 0], [a + (b - a) * 0.75, 100], [c + (e - c) * 0.25, 100], [e, 0]], e: ["inout", "hold", "~inout"] },
            fill: { k: [[a + (b - a) * 0.45, 0], [b, 100], [c, 100], [c + (e - c) * 0.55, 0]], e: ["out", "hold", "~out"] }
        };
    }
    function ease(name) {
        if (name === "hold") return [33, 33];
        var m = name.charAt(0) === "~", e = EASE[m ? name.substr(1) : name];
        if (!e) return null;
        return m ? [e[1], e[0]] : [e[0], e[1]];
    }
    return { list: L, SHAPES: SHAPES, PALS: PALS, has: has, dims: dims, layout: layout, pads: pads, times: times, sizeKeys: sizeKeys, outlineKeys: outlineKeys, ease: ease };
})();
if (typeof UK_CAT !== "undefined") UK_CAT.cards = UK_CARD.list;

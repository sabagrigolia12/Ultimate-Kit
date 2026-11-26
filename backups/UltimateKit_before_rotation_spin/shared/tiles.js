/*  Ultimate Kit - "Number Tiles" text card (user reference: glowing violet diamonds numbered 1..n in two interlocked
    rows). Shared by the panel preview (js/tilesprev.js) and After Effects (jsx/tiles.jsx), so it stays ES3.
    Units are px at a 1080-high frame.
    A tile = a diamond (a square on its corner, small round corners) with a soft violet gradient: a hot pink spot left
    of the centre, the base colour around it, a darker rim at the edges; a soft glow around it; the number in white.
    Layout: rows of `perRow` tiles, every other row shifted half a tile to the right so its diamonds sit in the gaps
    of the row above (the reference: 1 2 3 above, 4 5 6 below). Animation: every tile scales up from its own centre
    (a little past full size, then settles), the next one `delay` frames later; out = the same, shrinking. */
var UK_TILES = (function () {
    var T = {};
    T.DEF = {
        count: 6, perRow: 0,                    // perRow 0 = half of the tiles in the first row (2 rows)
        size: 220, gap: 26, corner: 14,         // size = the diamond's width (corner to corner)
        tile: "#B54EF9", hot: "#F7A6FF", glow: "#B65CFF", number: "#FFFFFF",
        glowAmt: 70, delay: 3                   // delay in frames between two tiles
    };
    T.MAX = 30;                                 // tiles built into the card (more if the count asks for more)
    T.FONTS = ["ArialRoundedMTBold", "Nunito-Black", "Montserrat-ExtraBold", "Poppins-Bold", "Arial-BoldMT"];
    T.FS = 0.42;                                // number size / tile size
    T.HOT = { x: -0.11, y: 0.05, r: 0.21 };     // the hot spot, in tile sizes from the centre
    T.SPOT = 0.22;                              // gradient softness (blur), in tile sizes
    T.TILE_TIME = 0.42;                         // one tile's scale-in, seconds (the panel's In time scales it)

    T.per = function (n, per) { per = Math.round(per || 0); if (per < 1) per = Math.ceil(n / 2); return Math.max(1, Math.min(per, n)); };
    /* centre of tile i (0-based) of n, relative to the middle of the whole group */
    T.pos = function (i, n, per, size, gap) {
        per = T.per(n, per);
        var S = size + gap * 1.41421, V = S / 2, rows = Math.ceil(n / per);
        var col = i % per, row = Math.floor(i / per);
        var w = (Math.min(per, n) - 1) * S + (rows > 1 ? S / 2 : 0), h = (rows - 1) * V;
        return [col * S + (row % 2) * S / 2 - w / 2, row * V - h / 2];
    };
    /* the same as an After Effects expression (n, per, size, gap, i are variables there) */
    T.POS_EXPR = "var pr = Math.round(per); if (pr < 1) pr = Math.ceil(n / 2); pr = Math.max(1, Math.min(pr, n));\n" +
        "var S = size + gap * 1.41421, V = S / 2, rows = Math.ceil(n / pr), col = i % pr, row = Math.floor(i / pr);\n" +
        "var w = (Math.min(pr, n) - 1) * S + (rows > 1 ? S / 2 : 0), h = (rows - 1) * V;\n" +
        "var px = col * S + (row % 2) * S / 2 - w / 2, py = row * V - h / 2;\n";
    /* scale (0..~1.08..1) of tile i: in (tt seconds, from tIn + i * dl), out (to seconds, from tOut + i * dl) */
    T.back = function (x) { x = Math.max(0, Math.min(1, x)); var k = 1.55, y = x - 1; return 1 + (k + 1) * y * y * y + k * y * y; };
    T.SCALE_EXPR = "function bk(x) { x = Math.max(0, Math.min(1, x)); var k = 1.55, y = x - 1; return 1 + (k + 1) * y * y * y + k * y * y; }\n" +
        "function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }\n" +
        "var sc = bk((time - tIn - i * dl) / tt) * (1 - sm((time - tOut - i * dl) / to));\n";
    T.scale = function (t, i, tIn, tOut, dl, tt, to) {
        var sm = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
        return T.back((t - tIn - i * dl) / tt) * (1 - sm((t - tOut - i * dl) / to));
    };
    /* the timeline of a card: tiles in from 0, out at tOut; total length */
    T.times = function (n, delayFrames, fps, inDur, hold, outDur) {
        var dl = delayFrames / fps, tt = T.TILE_TIME * (inDur || 0.9) / 0.9, to = T.TILE_TIME * (outDur || 0.8) / 0.9;
        var inEnd = (n - 1) * dl + tt, tOut = inEnd + (hold === undefined ? 2.5 : hold);
        return { dl: dl, tt: tt, to: to, tIn: 0, tOut: tOut, end: tOut + (n - 1) * dl + to + 0.1 };
    };
    return T;
})();

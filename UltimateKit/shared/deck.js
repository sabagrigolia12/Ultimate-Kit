/*  Ultimate Kit - "Card Deck" carousel (cr08, from the user's reference video, 2026-10-25). A deck of landscape
    cards: the front card big, the next ones behind it, each a step smaller and showing a strip above it. It starts
    with the first card a little bigger, which shrinks into place while the cards behind it fan out. At every swap
    the front card drops down (growing a little, as if coming at you) behind a straight mask edge across the frame
    and is gone; the deck steps forward and a new card fades in at the back. The last card drops the same way.
    Shared by the panel preview (js/carouselprev.js drawDeck) and After Effects (jsx/carousel.jsx buildDeck), ES3.

    Directions (chosen before Apply): where the deck shows and the new cards come from; the front card drops out
    to the other side, into the mask on that side:
      1 top (the reference) 2 bottom 3 right 4 left 5 top-right 6 top-left 7 bottom-right 8 bottom-left
    Measured from the reference (720 x 1280 frame of a 1080 x 1920 edit): the front card 0.86 of the width, 16 : 9,
    its centre at 0.49 of the height; behind it scales 0.837 and 0.72 with strips of 0.18 and 0.32 card heights;
    the mask edge 0.32 card heights past the front card; the drop to 1.07; the entry from 1.14 in ~0.7 s.      */
var UK_DECK = (function () {
    var C = {};
    C.DEF = { count: 0, dir: 1, hold: 1.0, dur: 0.45, size: 100 };
    C.MAX = 30;
    C.CW = 1600; C.CH = 900; C.CORNER = 50;
    C.NAMES = ["", "Top", "Bottom", "Right", "Left", "Top-right", "Top-left", "Bottom-right", "Bottom-left"];
    C.DIRS = { 1: [0, -1], 2: [0, 1], 3: [1, 0], 4: [-1, 0], 5: [1, -1], 6: [-1, -1], 7: [1, 1], 8: [-1, 1] };
    C.SC = [1, 0.837, 0.72, 0.62];             // slot scales (0 = front)
    C.STRIP = [0, 0.1825, 0.317, 0.43];        // how far each slot shows past the front card, in card heights
    C.GAP = 0.32;                              // the mask edge past the front card, in card heights
    C.START = 114;                             // the first card's start size (%)
    C.DROP = 107;                              // the dropping card's end size (%)
    C.ENTRY = 0.7;                             // the entry (s)
    C.Y = 0.4875;                              // the front card's centre, in comp heights (the reference; 0.5 for side decks)
    C.rnd = function (i, k) { var x = Math.sin((i + 1) * 12.9898 + (k + 1) * 78.233) * 43758.5453; return x - Math.floor(x); };
    C.card = function (c, W, H) { var w = Math.min(W * 0.86, H * 0.5 * C.CW / C.CH) * c.size / 100; return { w: w, h: w * C.CH / C.CW }; };
    C.centre = function (c, W, H) { var d = C.DIRS[c.dir] || C.DIRS[1]; return [W / 2, H * (d[0] === 0 ? (d[1] < 0 ? C.Y : 1 - C.Y) : 0.5)]; };
    function st(x, y, s, o) { return { x: x, y: y, s: s, o: o === undefined ? 100 : o }; }
    /* slot k of the deck (0 front .. 3 hidden at the back) */
    C.slot = function (k, c, W, H) {
        var d = C.DIRS[c.dir] || C.DIRS[1], cd = C.card(c, W, H), P = C.centre(c, W, H), q = Math.min(3, k), s = C.SC[q];
        var ox = d[0] ? d[0] * (cd.w * (1 - s) / 2 + C.STRIP[q] * cd.h) : 0, oy = d[1] ? d[1] * (cd.h * (1 - s) / 2 + C.STRIP[q] * cd.h) : 0;
        return st(P[0] + ox, P[1] + oy, s * 100, k >= 3 ? 0 : 100);
    };
    /* the mask edge: a line across the frame past the front card, on the drop side; the deck is seen on the other side.
       Returns { p: a point on the edge, e: the unit drop direction (px) } */
    C.edge = function (c, W, H) {
        var d = C.DIRS[c.dir] || C.DIRS[1], cd = C.card(c, W, H), P = C.centre(c, W, H);
        var ex = -d[0], ey = -d[1], L = Math.sqrt(ex * ex + ey * ey); ex /= L; ey /= L;
        var m = Math.abs(ex) * cd.w / 2 + Math.abs(ey) * cd.h / 2 + C.GAP * cd.h;       // the front card's far corner along the drop, + the gap
        return { p: [P[0] + ex * m, P[1] + ey * m], e: [ex, ey], m: m };
    };
    /* where the front card ends its drop: fully past the mask edge */
    C.drop = function (c, W, H) {
        var E = C.edge(c, W, H), cd = C.card(c, W, H), k = C.DROP / 100, P = C.centre(c, W, H);
        var far = E.m + (Math.abs(E.e[0]) * cd.w / 2 + Math.abs(E.e[1]) * cd.h / 2) * k * 1.05;
        return st(P[0] + E.e[0] * far, P[1] + E.e[1] * far, C.DROP);
    };
    C.swapAt = function (c, k) { return C.ENTRY + k * c.hold + (k - 1) * c.dur; };    // swap k (1 .. n) starts here
    C.total = function (c, n) { return C.swapAt(c, n) + c.dur + 0.1; };
    /* card j's keys: [[time, state, inInfluence, outInfluence], ...] */
    C.ADV = [85, 40];                          // the deck stepping forward: a quick start, a long settle
    C.FALL = [15, 65];                         // the drop: a slow start, faster and faster
    C.keys = function (j, n, c, W, H) {
        var K = [], E = C.ENTRY, d = c.dur, k, pre;
        /* the entry: card 0 shrinks into place, cards 1 and 2 fan out from behind it (2 a little later) */
        if (j === 0) { var s0 = C.slot(0, c, W, H); K.push([0, st(s0.x, s0.y, C.START), 33, 40]); K.push([E, s0, 85, 40]); }
        else if (j <= 2) { K.push([j === 1 ? 0.1 * E : 0.3 * E, C.slot(0, c, W, H), 33, 40]); K.push([E, C.slot(j, c, W, H), 85, 40]); }
        else K.push([0, C.slot(3, c, W, H), 33, 40]);
        /* the swaps: swap k drops card k - 1 and steps the deck forward */
        for (k = 1; k <= n; k++) {
            var t = C.swapAt(c, k);
            if (j === k - 1) { K.push([t, C.slot(0, c, W, H), 85, C.FALL[1]]); K.push([t + d, C.drop(c, W, H), C.FALL[0], 40]); break; }
            if (j >= k && j - k + 1 <= 3) {
                pre = C.slot(j - k + 1, c, W, H);
                K.push([t, pre, 85, C.ADV[1]]);
                K.push([t + d, C.slot(j - k, c, W, H), C.ADV[0], 40]);
            }
        }
        return K;
    };
    /* the ease of a move from key a (out influence) to key b (in influence), speed 0 at both (the AE keys) */
    C.ease = function (x, outI, inI) {
        var a = outI / 100, b = 1 - inI / 100, lo = 0, hi = 1, u = 0.5;
        for (var q = 0; q < 22; q++) { u = (lo + hi) / 2; var m = 1 - u, xu = 3 * m * m * u * a + 3 * m * u * u * b + u * u * u; if (xu < x) lo = u; else hi = u; }
        return 3 * (1 - u) * u * u + u * u * u;
    };
    C.at = function (K, t) {
        if (t <= K[0][0]) return K[0][1];
        for (var i = 1; i < K.length; i++) if (t < K[i][0]) {
            var a = K[i - 1][1], b = K[i][1], e = C.ease((t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]), K[i - 1][3], K[i][2]);
            return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, s: a.s + (b.s - a.s) * e, o: a.o + (b.o - a.o) * e };
        }
        return K[K.length - 1][1];
    };
    return C;
})();

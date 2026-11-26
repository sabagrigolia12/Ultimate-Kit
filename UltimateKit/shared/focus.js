/*  Ultimate Kit - Focus Carousel (cr09, 2026-11-09): the user's own carousel (their project's "Comp 2" / "Pre-comp 1",
    read only), exactly: a row of 500 x 600 cards parented to a Null; the Null moves so one card after another stands in
    the middle, every move with the user's own speed ramp (their keys 0 / 1.9686 / 3.9706 / 6.0727 s and influences);
    the precomp layer carries their Bezier Warp. Here the Null's Position is driven by a "Focus" slider (the number of
    the card in the middle), so the order can be changed on the Null; its keys have the user's times and eases.
    Order: 1, 2, 3 ... or random (always starting with card 1).
    Shared by jsx/carousel.jsx (UK.CAR.buildFocus) and the panel's preview (js/carouselprev.js drawFocus); ES3.  */
var UK_FOCUS = (function () {
    var F = {};
    F.REF = { W: 1920, H: 1080 };                // their frame; other sizes scale by min(W / 1920, H / 1080)
    F.CW = 500; F.CH = 600;                      // a card's comp
    F.CARD = [432.5, 519]; F.CORNER = 56;        // the card in it (their "Shape Layer 1")
    F.GAP = 538.3333333;                         // card to card (theirs: -869, -346, 204, 746)
    F.TIMES = [1.96863530196864, 2.002002002, 2.1021021021];     // between their keys; after the third, again from the first
    F.EASE_FIRST = 85.3214371042736;             // out of the first key
    F.EASE_LAST = 79.9045211518364;              // into the last key
    F.EASE_MID = [[80.8878935651254, 90.1850616479473], [82.2330805594282, 87.4778364742355]];     // [in, out] of the keys between, in turn
    /* their Bezier Warp in a 1920 x 1080 layer, every point (matchName ADBE BEZMESH-0001 .. 0012), Quality 8 */
    F.WARP = [[0, 0], [623.93603515625, 92], [1283.8720703125, 116], [1920, 0], [1920, 359.964019775391], [1920, 719.928039550781],
        [1920, 1080], [1267.8720703125, 996], [635.93603515625, 972], [0, 1080], [0, 719.928039550781], [0, 359.964019775391]];
    F.QUALITY = 8;
    F.MAX = 40;
    F.DEF = { count: 0, random: false, seed: 1 };
    F.COLS = [[0.49, 0.36, 1], [0.13, 0.83, 0.93], [0.96, 0.62, 0.04], [0.06, 0.73, 0.51], [0.96, 0.45, 0.71], [0.99, 0.57, 0.24], [0.23, 0.51, 0.96], [0.94, 0.27, 0.27]];
    F.scale = function (W, H) { return Math.min(W / F.REF.W, H / F.REF.H); };
    /* the cards in the order they come to the middle: 1 .. n, or 1 then the others shuffled (seeded): no card is followed by the
       next number (as the user's own 1, 3, 2, 4), as far as that can be */
    F.order = function (n, random, seed) {
        var o = [], i;
        for (i = 1; i <= n; i++) o.push(i);
        if (!random || n < 3) return o;
        var s = (Math.floor(seed) >>> 0) || 1, rnd = function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
        var best = null, bestBad = 1e9;
        for (var tries = 0; tries < 300 && bestBad > 0; tries++) {
            for (i = n - 1; i >= 2; i--) { var j = 1 + Math.floor(rnd() * i), t = o[i]; o[i] = o[j]; o[j] = t; }
            var bad = 0; for (i = 1; i < n; i++) if (o[i] === o[i - 1] + 1) bad++;
            if (bad < bestBad) { bestBad = bad; best = o.slice(); }
        }
        return best;
    };
    /* the Focus keys: [{ t, v (card number), inI, outI }] */
    F.keys = function (n, random, seed) {
        var o = F.order(n, random, seed), K = [], t = 0, m;
        for (m = 0; m < o.length; m++) {
            if (m > 0) t += F.TIMES[(m - 1) % F.TIMES.length];
            var inI = 33.333333, outI = 16.666666667;
            if (m === 0) outI = F.EASE_FIRST;
            else if (m === o.length - 1) inI = F.EASE_LAST;
            else { var e = F.EASE_MID[(m - 1) % F.EASE_MID.length]; inI = e[0]; outI = e[1]; }
            if (m === 0 && o.length === 1) outI = F.EASE_FIRST;
            K.push({ t: t, v: o[m], inI: inI, outI: outI });
        }
        return K;
    };
    F.total = function (n) { var t = 0; for (var m = 1; m < n; m++) t += F.TIMES[(m - 1) % F.TIMES.length]; return t; };
    /* the Focus value at time t, as After Effects eases it between two keys (speed 0 at both, the influences as the bezier's handles) */
    F.at = function (K, t) {
        if (t <= K[0].t || K.length < 2) return K[0].v;
        for (var m = 0; m < K.length - 1; m++) {
            var a = K[m], b = K[m + 1];
            if (t > b.t) continue;
            var X = (t - a.t) / (b.t - a.t), x1 = a.outI / 100, x2 = 1 - b.inI / 100, lo = 0, hi = 1, u = 0.5;
            for (var it = 0; it < 30; it++) { var x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u; if (x < X) lo = u; else hi = u; u = (lo + hi) / 2; }
            return a.v + (b.v - a.v) * (3 * (1 - u) * u * u + u * u * u);
        }
        return K[K.length - 1].v;
    };
    return F;
})();

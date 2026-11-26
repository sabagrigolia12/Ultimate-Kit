/*  Ultimate Kit - "Card Swap" carousel (cr07, from the user's reference video, 2026-10-25). One big rounded portrait
    card in the middle; at every swap it shrinks off towards a side or corner and out of the frame while the next
    one comes in from the opposite side and grows into the middle (only one card is seen between swaps). The
    first card comes in from the right, the last one leaves to the left. Shared by the panel preview
    (js/carouselprev.js drawSwap) and After Effects (jsx/carousel.jsx buildSwap), so ES3.

    Transitions (chosen before Apply; Random = a different one at every swap):
      1 ul   out to the top-left, in from the bottom-right (the reference)
      2 l    out to the left, in from the right (the reference)
      3 dl   out to the bottom-left, in from the top-right
      4 ur   out to the top-right, in from the bottom-left
      5 u    out to the top, in from the bottom
      6 zoom the card flies past the camera (bigger, fading), the next one grows from small in the middle
      7 flip a 3D turn: the card turns away to the left, the next one turns in from the right
      8 stack the next card drops in from above onto the pile, the old one sinks back and fades
    Measured from the reference (1080 x 1920, 30 fps): the card 0.78 of the width, 0.83 of the height; a swap 12
    frames (a slow start, fast, a long settle); a card going out / coming in at half size.                 */
var UK_SWAP = (function () {
    var C = {};
    C.DEF = { count: 0, trans: 1, random: false, seed: 1, hold: 1.0, dur: 0.4, size: 100 };      // seed: the Random mix (Shuffle)
    C.MAX = 30;
    C.CW = 900; C.CH = 1600; C.CORNER = 70;
    C.NAMES = ["", "Up-left", "Left", "Down-left", "Up-right", "Up", "Zoom", "Flip", "Stack"];
    C.DIRS = { 1: [-1, -1], 2: [-1, 0], 3: [-1, 1], 4: [1, -1], 5: [0, -1] };
    C.EDGE = 0.5;            // a card waiting at the edge: its scale
    C.EASE_OUT = 40; C.EASE_IN = 85;
    C.rnd = function (i, k) { var x = Math.sin((i + 1) * 12.9898 + (k + 1) * 78.233) * 43758.5453; return x - Math.floor(x); };
    /* the card's size at 100 % (comp px) */
    C.card = function (c, W, H) { var w = Math.min(W * 0.78, H * 0.83 * C.CW / C.CH) * c.size / 100; return { w: w, h: w * C.CH / C.CW }; };
    /* the transition of every swap k = 0 .. n (swap k brings card k to the middle; swap n takes the last one out) */
    C.plan = function (c, n, seed) {
        var p = [];
        for (var k = 0; k <= n; k++) {
            var t = c.random ? 1 + Math.floor(C.rnd(k, seed || 1) * 8) : Math.round(c.trans) || 1;
            if (k === 0 || k === n) t = 2;            // in from the right at the start, out to the left at the end
            p.push(t);
        }
        return p;
    };
    C.times = function (c, k) { return k * (c.hold + c.dur); };           // swap k starts here
    C.total = function (c, n) { return C.times(c, n) + c.dur + 0.1; };
    /* states (comp px, scale %, rotation, Y rotation, opacity) */
    function st(x, y, s, r, ry, o) { return { x: x, y: y, s: s, r: r || 0, ry: ry || 0, o: o === undefined ? 100 : o }; }
    function side(u, W, H, cd, far) {      // a card at the edge (half out) or fully out, towards direction u
        var s = C.EDGE * 100, hw = cd.w * C.EDGE / 2, hh = cd.h * C.EDGE / 2, kx = far ? hw * 1.3 : -hw * 0.7, ky = far ? hh * 1.3 : -hh * 0.7;     // (edge: ~35 % of it in the frame)
        return st(W / 2 + u[0] * (W / 2 + hw + kx), H / 2 + u[1] * (H / 2 + hh + ky), s);
    }
    /* where a card is before swap k brings it in ("wait", seen at the edge only for the side swaps) and where swap k
       sends the card in the middle ("gone": waits at the edge for the side swaps, then "away" at swap k + 1) */
    C.wait = function (t, W, H, cd, far) {
        var u = C.DIRS[t];
        if (u) return side([-u[0], -u[1]], W, H, cd, far);
        if (t === 6) return st(W / 2, H / 2, 55, 0, 0, 0);
        if (t === 7) return st(W / 2 + cd.w * 0.55, H / 2, 92, 0, 90, 100);
        return st(W / 2, H / 2 - H * 0.5 - cd.h * 0.6, 100, -8, 0, 100);      // 8: above the frame
    };
    C.gone = function (t, W, H, cd, far) {
        var u = C.DIRS[t];
        if (u) return side(u, W, H, cd, far);
        if (t === 6) return st(W / 2, H / 2, 175, 0, 0, 0);
        if (t === 7) return st(W / 2 - cd.w * 0.55, H / 2, 92, 0, -90, 100);
        return st(W / 2, H / 2 + H * 0.03, 86, 3, 0, 0);                       // 8: sinks back
    };
    C.mid = function (W, H) { return st(W / 2, H / 2, 100); };
    /* card j's keys: [[time, state], ...] (swap j brings it in, swap j + 1 takes it out) */
    C.keys = function (j, n, P, c, W, H) {
        var cd = C.card(c, W, H), K = [], tin = C.times(c, j), tout = C.times(c, j + 1), d = c.dur;
        var tIn = P[j], tOut = P[j + 1];
        /* (user, 2026-10-25: only one card in the frame, as in the video - the next one is out of the frame until its
           swap, the old one leaves it completely: both are seen only during the swap) */
        K.push([tin, C.wait(tIn, W, H, cd, true)]);
        K.push([tin + d, C.mid(W, H)]);
        K.push([tout, C.mid(W, H)]);
        K.push([tout + d, C.gone(tOut, W, H, cd, true)]);
        return K;
    };
    /* the ease of every move (keys with speed 0: a slow start, fast, a long settle) */
    C.ease = function (x) {
        var a = C.EASE_OUT / 100, b = 1 - C.EASE_IN / 100, lo = 0, hi = 1, u = 0.5;
        for (var q = 0; q < 22; q++) { u = (lo + hi) / 2; var m = 1 - u, xu = 3 * m * m * u * a + 3 * m * u * u * b + u * u * u; if (xu < x) lo = u; else hi = u; }
        return 3 * (1 - u) * u * u + u * u * u;
    };
    C.at = function (K, t) {
        if (t <= K[0][0]) return K[0][1];
        for (var i = 1; i < K.length; i++) if (t < K[i][0]) {
            var a = K[i - 1][1], b = K[i][1], e = C.ease((t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]));
            return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, s: a.s + (b.s - a.s) * e, r: a.r + (b.r - a.r) * e, ry: a.ry + (b.ry - a.ry) * e, o: a.o + (b.o - a.o) * e };
        }
        return K[K.length - 1][1];
    };
    return C;
})();

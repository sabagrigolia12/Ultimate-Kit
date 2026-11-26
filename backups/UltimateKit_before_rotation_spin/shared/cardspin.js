/*  Ultimate Kit - "Card Spin" carousel (cr04, from the user's reference video). Upright photo cards in two rows (the
    lower row half a card behind) run from right to left, seen through one lens warp (Bulge: big in the middle,
    squeezed and curved towards the sides). Shared by the panel preview (js/carouselprev.js drawCardSpin) and After
    Effects (jsx/carousel.jsx), so ES3.

    The story (user's notes, 2026-10-15):
      1  the first photo jumps up from fully below the frame (unseen before), with a smooth bounce and vertical blur
      2  it holds, then starts to move left slowly, speeding up; the other photos pour in from the right edge behind it
      3  the stream races past and leaves the frame; after a gap one last photo comes in from the right, slowing down
         smoothly onto the middle, holds, and scales down to nothing

    The travel (px) is one function of time and the controls (the AE expression of the controls' "Travel" slider):
    still until the run starts, a smooth speed-up (Spin Up), full Speed for Spin Time, a smooth slow-down (Stop Time).
    "Distance" (the whole run) = where the last photo starts: it lands in the middle exactly when the run ends.     */
var UK_CSPIN = (function () {
    var C = {};
    C.DEF = {
        speed: 7,            // cards per second at full speed (more = faster)
        blur: 100,           // motion blur, % (0 = none)
        warp: 100,           // the lens warp over the whole strip, %
        hold: 0.8,           // the first photo stays (s) after jumping up
        up: 0.9,             // speed-up time (s): slow at first, then faster
        spin: 1.0,           // full-speed time (s)
        stop: 1.4,           // slow-down time, the last photo coming in (s)
        endHold: 0.8,        // the last photo stays (s) before scaling down
        size: 24,            // card width, % of the comp's shorter side
        ratio: 1.3           // card height / width
    };
    C.GAP = 1.05;            // space between cards, in card widths
    C.BLUR = 1.4;            // motion blur length at 100 % = this x the distance moved in one frame (the reference streaks hard)
    C.POP = 0.55;            // the jump up (s)
    C.OUT = 0.4;             // the scale-down at the end (s)
    C.ROW_Y = 0.68;          // the top row's centre, in comp heights (less in a wide comp: both rows stay inside, see geo)
    C.ROW2 = 1.0;            // the lower row's offset, in card heights
    C.LENS_RX = 0.62;        // the warp's reach: across (comp widths) and up / down (card heights), centred on the top row
    C.LENS_RY = 1.9;
    /* geometry for a comp W x H: card size, one card step (S, top row; the lower row sits at S/2), where the stream
       starts (E: the first card behind the photo starts just past the right edge) and the gap before the last photo */
    C.geo = function (c, W, H) {
        var w = c.size / 100 * Math.min(W, H), h = w * c.ratio, S = w * (1 + C.GAP);
        var y0 = Math.min(H * C.ROW_Y, H - h * C.ROW2 - h * 0.75);    // a tall comp: low like the reference; a wide one: both rows fit
        return { w: w, h: h, S: S, y0: y0, y1: y0 + h * C.ROW2, E: W / 2 + w * 0.7 - S / 2, gapEnd: W * 0.55 + w };
    };
    C.times = function (c) {
        var t1 = C.POP + c.hold, t2 = t1 + c.up, t3 = t2 + c.spin, t4 = t3 + c.stop;
        return { t1: t1, t2: t2, t3: t3, t4: t4, out: t4 + c.endHold, end: t4 + c.endHold + C.OUT + 0.1 };
    };
    /* the whole run (px): what Speed covers in the given times, at least enough for the stream to leave the frame */
    C.distance = function (c, G) {
        var up = Math.max(0.01, c.up), dn = Math.max(0.01, c.stop), V = c.speed * G.S / 2;
        return Math.max(G.E + G.S + G.gapEnd, V * (up / 2 + c.spin + dn / 2));
    };
    /* the travel (px) at time t */
    C.travel = function (t, c, G) {
        var T = C.times(c), up = Math.max(0.01, c.up), dn = Math.max(0.01, c.stop), F = C.distance(c, G);
        var v = F / (up / 2 + c.spin + dn / 2);
        var I = function (u) { return u * u * u - u * u * u * u / 2; };       // integral of smoothstep
        if (t <= T.t1) return 0;
        if (t <= T.t2) return v * up * I((t - T.t1) / up);
        if (t <= T.t3) return v * up / 2 + v * (t - T.t2);
        if (t <= T.t4) { var u = (t - T.t3) / dn; return v * up / 2 + v * c.spin + v * dn * (u - I(u)); }
        return F;
    };
    /* the same as AE expressions on the controls null: "Distance" and "Travel" (S, E, GAP = expressions / numbers) */
    C.DIST_EXPR = function (S, E, gapEnd) {
        return 'var S = ' + S + ', E = ' + E + ', G = ' + gapEnd + ';\n' +
            'var up = Math.max(0.01, effect("Spin Up")(1)), dn = Math.max(0.01, effect("Stop Time")(1)), V = effect("Speed")(1) * S / 2;\n' +
            'Math.max(E + S + G, V * (up / 2 + effect("Spin Time")(1) + dn / 2));';
    };
    C.TRAVEL_EXPR = function () {
        return 'var F = effect("Distance")(1), hold = effect("Hold")(1), up = Math.max(0.01, effect("Spin Up")(1)), sp = effect("Spin Time")(1), dn = Math.max(0.01, effect("Stop Time")(1));\n' +
            'var t1 = ' + C.POP + ' + hold, t2 = t1 + up, t3 = t2 + sp, t4 = t3 + dn, v = F / (up / 2 + sp + dn / 2);\n' +
            'function I(u) { return u * u * u - u * u * u * u / 2; }\n' +
            'var d = 0;\n' +
            'if (time <= t1) d = 0;\n' +
            'else if (time <= t2) d = v * up * I((time - t1) / up);\n' +
            'else if (time <= t3) d = v * up / 2 + v * (time - t2);\n' +
            'else if (time <= t4) { var u = (time - t3) / dn; d = v * up / 2 + v * sp + v * dn * (u - I(u)); }\n' +
            'else d = F;\n' +
            'd;';
    };
    /* where stream card j starts (px right of the middle): card 0 = the first photo in the middle, the others behind
       it from just past the right edge (top row even j, lower row odd j, half a step apart); a card is in the stream
       only while it starts before the gap in front of the last photo */
    C.start = function (j, G) { return j === 0 ? 0 : G.E + j * G.S / 2; };
    C.inStream = function (j, G, F) { return j === 0 || C.start(j, G) <= F - G.gapEnd; };
    /* how many stream cards to build (room for the run to get 60 % longer after Apply) */
    C.count = function (c, G) { return Math.max(4, Math.min(90, Math.ceil((C.distance(c, G) * 1.6 - G.E) / (G.S / 2)) + 2)); };
    /* the jump up: lift (px below the row, keyed) from just under the frame, a smooth overshoot and settle */
    C.liftKeys = function (G, H) {
        var D0 = H - G.y0 + G.h * 0.62;
        return [[0, D0], [0.3, -0.045 * G.h], [0.43, 0.012 * G.h], [C.POP, 0]];
    };
    C.liftAt = function (t, G, H) {          // the preview's version of those keys (ease out, then ease in-out)
        var K = C.liftKeys(G, H);
        if (t <= 0) return K[0][1];
        for (var i = 1; i < K.length; i++) if (t <= K[i][0]) {
            var u = (t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]);
            u = i === 1 ? 1 - Math.pow(1 - u, 3) : u * u * (3 - 2 * u);
            return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * u;
        }
        return 0;
    };
    /* the size by place: a card grows from its own start size at the frame's edge (0, 30, 40 % ...) to 100 % in the
       middle (x = px from the middle, before the lens) */
    C.EDGE = [0, 0.3, 0.4, 0.15, 0.35];
    C.placeScale = function (j, x, W) {
        var f = 1 - Math.min(1, Math.abs(x) / (W / 2)), s0 = C.EDGE[j % C.EDGE.length];
        return s0 + (1 - s0) * f * f * (3 - 2 * f);
    };
    C.PLACE_EXPR = function (j) {
        return 'var f = 1 - Math.min(1, Math.abs(xo) / (thisComp.width / 2)), s0 = ' + C.EDGE[j % C.EDGE.length] + ';\nvar ps = s0 + (1 - s0) * f * f * (3 - 2 * f);\n';
    };
    /* the end: a tiny lift, then down to 0 (ease in) */
    C.outScale = function (t, c) {
        var T = C.times(c), u = (t - T.out) / C.OUT;
        if (u <= 0) return 1;
        if (u >= 1) return 0;
        if (u < 0.25) { var a = u / 0.25; return 1 + 0.05 * Math.sin(a * Math.PI / 2); }
        var b = (u - 0.25) / 0.75; return 1.05 * (1 - b * b * b);
    };
    /* the lens warp (preview): like AE's Bulge over the strip - magnifies round the centre, squeezes towards the rim.
       Maps a point (px from the bulge centre) to where it shows; k = Warp / 100 */
    C.lens = function (x, y, rx, ry, k) {
        var u = x / rx, v = y / ry, r = Math.sqrt(u * u + v * v);
        if (r >= 1 || k <= 0) return [x, y];
        var m = 1 + 0.4 * k * (1 - r) * (1 - r);
        var s = Math.min(m, 1 / Math.max(0.0001, r));
        return [x * s, y * s];
    };
    return C;
})();

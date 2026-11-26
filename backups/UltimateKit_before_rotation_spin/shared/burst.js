/*  Ultimate Kit - "Photo Burst" carousel (cr05, from the user's reference video). Small photo cards are thrown up one
    after another from under the middle of the frame, far away, and in one unbroken arc (a fountain) pour out towards
    the camera: up the middle, over the top of the dome, out and down, growing all the way (position + scale, no 3D),
    and leave the frame. The "Last Image" (the logo card) follows a moment after the last photo, straight at the
    camera. Shared by the panel preview (js/carouselprev.js drawBurst) and After Effects (jsx/carousel.jsx
    buildBurst), so ES3.

    Each card is keyed like a motion designer would (Position in separate dimensions):
      X Position   2 keys: launch -> out, almost even (a throw), a little faster at the end (it comes closer)
      Y Position   3 keys: launch -> top -> out; up fast and easing into the top, down from it faster and faster,
                   never stopping (X keeps moving through the top)
      Scale        2 keys: small far away -> big at the camera, growing faster and faster
      Rotation     2 keys: a slow turn on the way
    Every key here carries its AE temporal ease (speed in units / s, influence 0..1), so the preview draws exactly the
    AE curves. Measured from the reference (30 fps, 1920 x 1080): a card every 2 frames, ~110 px at launch (11 % of
    the height at 90 %), the top ~0.55 s after launch at 0.42 of the height (the first ones) up to 0.28 (the dome),
    out ~0.6 s later at 3-4x the size; the last card goes 0.15 s after the last photo.                         */
var UK_BURST = (function () {
    var C = {};
    C.DEF = {
        count: 0,            // photos in the stream (0 = as many as selected; more = the photos repeated)
        spacing: 100,        // the time between two photos, % (less = closer together)
        speed: 100,          // %
        rotation: 100,       // the cards' tilt, %
        spread: 100,         // how wide the cards fly out, %
        size: 11,            // card size (100 % scale), % of the comp's shorter side
        lag: 0.15            // the last image starts (s) after the last photo
    };
    C.DT = 2 / 30;           // the time between two photos at 100 %
    C.CLUSTER = 1.3;         // by this launch time (s) the fountain has opened into the full dome
    /* a fixed random number in 0..1 for card i, use k */
    C.rnd = function (i, k) {
        var x = Math.sin((i + 1) * 12.9898 + (k + 1) * 78.233) * 43758.5453;
        return x - Math.floor(x);
    };
    /* the card size (px) at 100 % scale */
    C.px = function (c, W, H) { return c.size / 100 * Math.min(W, H); };
    /* a key: time, value, in speed / influence, out speed / influence */
    function key(t, v, inS, inI, outS, outI) { return { t: t, v: v, inS: inS, inI: inI, outS: outS, outI: outI }; }
    /* two keys a -> b over d s with an ease: start speed f0 x and end speed f1 x the average speed */
    function two(t0, v0, t1, v1, f0, i0, f1, i1) {
        var avg = (v1 - v0) / (t1 - t0);
        return [key(t0, v0, 0, 0.33, avg * f0, i0), key(t1, v1, avg * f1, i1, 0, 0.33)];
    }
    /* card i's keys (launched at e s at the default spacing / speed; last = the logo card); times from its launch */
    C.card = function (i, e, c, W, H, last) {
        var R = C.rnd, g = Math.min(1, e / C.CLUSTER), cp = C.px(c, W, H);
        var side = (i % 2 ? 1 : -1) * (R(i, 1) < 0.18 ? -1 : 1);
        var x0, x1, ta, T, yA, s0 = 90, sEnd, r0, r1;
        if (last) {
            x0 = W * 0.5; x1 = W * 0.515;
            ta = 0.55; T = ta + 0.85;
            yA = H * (0.4 - 0.14 * g);
            sEnd = 650; r0 = -8; r1 = 30;
        } else {
            var dx = W * (0.12 + 0.3 * R(i, 3)) * (0.7 + 0.3 * g);
            x0 = W * (0.5 + (R(i, 2) - 0.5) * 0.03);
            x1 = x0 + side * dx;
            ta = 0.55 + (R(i, 4) - 0.5) * 0.06;
            T = ta + 0.6 + 0.12 * R(i, 5);
            yA = H * (0.4 - 0.14 * g + (R(i, 6) - 0.5) * 0.07 + 0.1 * dx / (0.42 * W));
            sEnd = 240 + 60 * g + 50 * R(i, 7);
            r0 = (R(i, 8) * 2 - 1) * 32;
            r1 = r0 + (R(i, 9) < 0.5 ? -1 : 1) * (8 + 22 * R(i, 10));
        }
        var y0 = H + cp * s0 / 100 * 0.8, y1 = H + cp * sEnd / 100 * 0.78;
        var up = (yA - y0) / ta, dn = (y1 - yA) / (T - ta);
        return {
            T: T,
            x: two(0, x0, T, x1, 0.75, 0.33, 1.3, 0.33),
            y: [key(0, y0, 0, 0.33, up * 2.5, 0.3), key(ta, yA, 0, 0.5, 0, 0.4), key(T, y1, dn * 2.6, 0.3, 0, 0.33)],
            s: last ? two(0, s0, T, sEnd, 0.25, 0.33, 2.2, 0.33) : two(0, s0, T, sEnd, 0.6, 0.33, 1.5, 0.33),
            r: two(0, r0, T, r1, 0.6, 0.33, 1.4, 0.33)
        };
    };
    /* launch times at the given count n (default spacing / speed): photos every DT, the last card after lag */
    C.launch = function (i, n, c) { return i < n ? i * C.DT : n * C.DT + c.lag; };
    C.end = function (n, c, W, H) { var e = C.launch(n, n, c); return e + C.card(n, e, c, W, H, true).T; };
    /* the value of keys K at time t: AE's temporal bezier (value-time curve through the eases) */
    C.val = function (K, t) {
        if (t <= K[0].t) return K[0].v;
        var n = K.length - 1;
        if (t >= K[n].t) return K[n].v;
        var j = 0; while (j < n - 1 && t > K[j + 1].t) j++;
        var a = K[j], b = K[j + 1], d = b.t - a.t;
        var t1 = a.t + a.outI * d, v1 = a.v + a.outS * a.outI * d, t2 = b.t - b.inI * d, v2 = b.v - b.inS * b.inI * d;
        var lo = 0, hi = 1, u = 0.5;
        for (var q = 0; q < 24; q++) {
            u = (lo + hi) / 2;
            var w = 1 - u, tu = w * w * w * a.t + 3 * w * w * u * t1 + 3 * w * u * u * t2 + u * u * u * b.t;
            if (tu < t) lo = u; else hi = u;
        }
        var m = 1 - u;
        return m * m * m * a.v + 3 * m * m * u * v1 + 3 * m * u * u * v2 + u * u * u * b.v;
    };
    /* card state at local time tl (s from its launch) */
    C.at = function (K, tl) { return { x: C.val(K.x, tl), y: C.val(K.y, tl), s: C.val(K.s, tl), r: C.val(K.r, tl) }; };
    return C;
})();

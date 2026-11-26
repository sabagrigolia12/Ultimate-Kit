/*  Ultimate Kit - "Sphere Carousel" (cr06, from the user's reference video, 2026-10-25). Portrait photo cards on a
    3D ball seen from the front by a wide camera: the front card big and straight, the others smaller and leaning
    away as the ball curves, each with its own random tilt. The ball turns about its centre to bring another card
    to the front (heavy motion blur, a quick start and a long settle); at the start the cards round the first one
    come in from outside, large and blurred, and settle onto the ball. Shared by the panel preview
    (js/carouselprev.js drawSphere) and After Effects (jsx/carousel.jsx buildSphere), so ES3.

    Measured from the reference (1080 x 1920, 30 fps): the front card ~0.5 of the width, its neighbours ~0.7 of its
    size with small gaps; the entry 14 frames; a turn 12 frames, then 16 frames still.                       */
var UK_SPHERE = (function () {
    var C = {};
    C.DEF = {
        count: 0,            // photos (0 = as many as selected, or 12 proxies)
        distance: 100,       // how far apart the cards are (the ball's radius), %
        tilt: 40,            // random tilt of every card, %
        size: 100            // card size, % (100 = half the comp width)
    };
    C.MAX = 30;
    C.CW = 600; C.CH = 800;  // the photo precomps (3 : 4) and their rounded corner
    C.CORNER = 48;
    C.ENTRY = 14 / 30;       // the entry (s)
    C.TURN = 12 / 30;        // one turn to the next card (s)
    C.HOLD = 16 / 30;        // still on a card (s)
    C.FIRST = 6 / 30;        // still after the entry, before the first turn
    C.TILT = [30, 30, 12];   // the largest random tilt at 100 %: X, Y, Z rotation (deg)
    C.ZOOM = 0.9;            // camera zoom, in comp widths (wide: strong perspective)
    C.DEPTH = 3;             // the ball stretched away from the camera: the cards round the front get small fast
    C.EASE_OUT = 40;         // the turn's keyframe influences: a quick start ...
    C.EASE_IN = 85;          // ... and a long settle
    C.rnd = function (i, k) { var x = Math.sin((i + 1) * 12.9898 + (k + 1) * 78.233) * 43758.5453; return x - Math.floor(x); };
    /* the ball's radius in card widths (at Distance 100 %): one size, so the curve looks the same for any count */
    C.R = 3.2;
    C.radius = function (n) { return C.R; };
    C.AREA = 4.0;            // room per card, in card areas (the gaps)
    /* where card i of n sits: a unit vector (x right, y down, z away from the camera); card 0 at the front, the
       others round it in a spiral (card 2 next to card 1, ...), over as much of the ball as n cards need */
    C.dir = function (i, n) {
        var cap = Math.max(-1, 1 - n * C.AREA * (C.CH / C.CW) / (2 * Math.PI * C.R * C.R));     // cos of the cap's edge
        var t = i === 0 ? 0 : Math.acos(1 - (1 - cap) * (i + 0.5) / n), p = i * 2.39996323;     // even spread, golden angle
        return [Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p), -Math.cos(t)];
    };
    /* the ball's turn that brings direction d to the front: yaw (Y rotation of the inner null) then pitch */
    C.azel = function (d) {
        var az = Math.atan2(d[0], -d[2]) * 180 / Math.PI, el = Math.atan2(-d[1], Math.sqrt(d[0] * d[0] + d[2] * d[2])) * 180 / Math.PI;
        return [az, el];
    };
    /* card i's random tilt (deg) at 100 % */
    C.tilt = function (i) { return [(C.rnd(i, 1) * 2 - 1) * C.TILT[0], (C.rnd(i, 2) * 2 - 1) * C.TILT[1], (C.rnd(i, 3) * 2 - 1) * C.TILT[2]]; };
    /* the default Focus keys: card 1, then on to the next cards (times from the start) */
    C.focusKeys = function (n, dur) {
        var k = [[0, 1]], t = C.ENTRY + C.FIRST, c = 1;
        while (c < n && t + C.TURN <= dur + 0.001) { k.push([t, c]); c++; k.push([t + C.TURN, c]); t += C.TURN + C.HOLD; }
        return k;
    };
    return C;
})();

// Panel test (eval'd through cdp): UKCenter.piece on hand-made letter outlines (the shapes of t_w2p_make.jsx: N, O,
// T, L, plus a t with a short bar end and an n with its arch), drawn filled (grey) with the rebuilt stroke (blue)
// and the centre line + points (red / white).
(function () {
    var load = function (f) { var x = new XMLHttpRequest(); x.open("GET", f, false); x.send(); (0, eval)(x.responseText); };
    load("shared/pathsimp.js"); load("js/centerline.js");
    var Z = function (n) { var z = []; for (var k = 0; k < n; k++) z.push([0, 0]); return z; };
    var poly = function (pts, dx) { return { v: pts.map(function (p) { return [p[0] + dx, p[1]]; }), i: Z(pts.length), o: Z(pts.length), c: true }; };
    var ell = function (cx, cy, a, b, rev) { var K = 0.5523, s = rev ? -1 : 1; return { v: [[cx, cy - b], [cx + a * s, cy], [cx, cy + b], [cx - a * s, cy]], i: [[-a * K * s, 0], [0, -b * K], [a * K * s, 0], [0, b * K]], o: [[a * K * s, 0], [0, b * K], [-a * K * s, 0], [0, -b * K]], c: true }; };
    var arch = function (dx) {      // an n: stem + arch (the arch as a thick curved band)
        var K = 0.5523;
        return { v: [[dx, 0], [dx + 44, 0], [dx + 44, 30], [dx + 100, 0], [dx + 170, 70], [dx + 170, 240], [dx + 126, 240], [dx + 126, 80], [dx + 95, 44], [dx + 44, 80], [dx + 44, 240], [dx, 240]],
            i: [[0, 0], [0, 0], [0, 0], [-35, 0], [0, -40], [0, 0], [0, 0], [0, 0], [20, 0], [10, -20], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [10, -20], [40, 0], [0, 0], [0, 0], [0, 0], [0, -20], [-20, 0], [0, 0], [0, 0], [0, 0]], c: true };
    };
    var pieces = [
        ["N", [poly([[0, 0], [44, 0], [126, 140], [126, 0], [170, 0], [170, 240], [126, 240], [44, 100], [44, 240], [0, 240]], 0)]],
        ["O", [ell(115, 120, 115, 124), ell(115, 120, 71, 80, true)]],
        ["T", [poly([[0, 0], [190, 0], [190, 44], [117, 44], [117, 240], [73, 240], [73, 44], [0, 44]], 0)]],
        ["L", [poly([[0, 0], [44, 0], [44, 196], [150, 196], [150, 240], [0, 240]], 0)]],
        ["t", [poly([[40, 0], [84, 0], [84, 60], [130, 60], [130, 100], [84, 100], [84, 240], [40, 240], [40, 100], [10, 100], [10, 60], [40, 60]], 0)]],
        ["n", [arch(0)]]
    ];
    var cell = 260, out = document.createElement("canvas"); out.width = cell * pieces.length; out.height = 340;
    var g = out.getContext("2d"); g.fillStyle = "#111"; g.fillRect(0, 0, out.width, out.height);
    var info = [];
    pieces.forEach(function (pc, idx) {
        var comps = UKCenter.piece({ paths: pc[1], rule: 1 });
        g.save(); g.translate(idx * cell + 30, 40);
        var P = new Path2D(); pc[1].forEach(function (p) { var n = p.v.length; P.moveTo(p.v[0][0], p.v[0][1]); for (var j = 0; j < n; j++) { var j1 = (j + 1) % n; P.bezierCurveTo(p.v[j][0] + p.o[j][0], p.v[j][1] + p.o[j][1], p.v[j1][0] + p.i[j1][0], p.v[j1][1] + p.i[j1][1], p.v[j1][0], p.v[j1][1]); } P.closePath(); });
        g.fillStyle = "#555"; g.fill(P, "nonzero");
        var pts = 0;
        comps.forEach(function (c) {
            var path = new Path2D();
            c.paths.forEach(function (p) { pts += p.v.length; path.moveTo(p.v[0][0], p.v[0][1]); var n = p.v.length, last = p.c ? n : n - 1; for (var j = 0; j < last; j++) { var j1 = (j + 1) % n; path.bezierCurveTo(p.v[j][0] + p.o[j][0], p.v[j][1] + p.o[j][1], p.v[j1][0] + p.i[j1][0], p.v[j1][1] + p.i[j1][1], p.v[j1][0], p.v[j1][1]); } if (p.c) path.closePath(); });
            g.strokeStyle = "rgba(60,140,255,0.6)"; g.lineWidth = c.width; g.lineCap = c.cap === 2 ? "round" : "butt"; g.lineJoin = "miter"; g.miterLimit = 2; g.stroke(path);
            g.strokeStyle = "#FF3344"; g.lineWidth = 2; g.stroke(path);
            c.paths.forEach(function (p) { p.v.forEach(function (v) { g.fillStyle = "#FFF"; g.fillRect(v[0] - 3, v[1] - 3, 6, 6); }); });
        });
        g.fillStyle = "#FF0"; g.font = "14px sans-serif"; g.fillText(pc[0] + ": " + pts + " pts, " + comps.map(function (c) { return c.paths.length + " path w" + Math.round(c.width); }).join(", "), 0, 285);
        g.restore();
        info.push(pc[0] + "=" + pts);
    });
    return info.join(" ") + "|" + out.toDataURL();
})();

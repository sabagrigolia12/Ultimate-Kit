// READ ONLY (no project change): shared/pathsimp.js on test outlines - a circle of 16 arcs, a TrueType-like circle
// (8 quadratic pieces), a square with points along its sides, an "N" outline with extra points, a rounded rectangle
// with each corner split in 3, an "O" (two rings). Logs points before / after, the largest deviation, the time.
(function () {
    var o = new File("D:/Projects/Codex/tools/ae-test/out/psimp.txt"); o.encoding = "UTF-8"; o.open("w");
    try {
        $.evalFile(new File("D:/Projects/Codex/UltimateKit/shared/pathsimp.js"));
        var K = 0.5522847498;
        var circle = function (cx, cy, r, n, rev) {      // n exact cubic arcs
            var p = { v: [], i: [], o: [], c: true }, a = 2 * Math.PI / n, h = 4 / 3 * Math.tan(a / 4) * r * (rev ? -1 : 1);
            for (var k = 0; k < n; k++) { var t = (rev ? -1 : 1) * k * a, x = cx + r * Math.cos(t), y = cy + r * Math.sin(t), tx = -Math.sin(t), ty = Math.cos(t); p.v.push([x, y]); p.i.push([-tx * h, -ty * h]); p.o.push([tx * h, ty * h]); }
            return p;
        };
        var quadCircle = function (cx, cy, r) {          // TrueType: 8 on-curve points, quadratic pieces (as AE converts them)
            var p = { v: [], i: [], o: [], c: true }, n = 8, a = 2 * Math.PI / n;
            for (var k = 0; k < n; k++) {
                var t = k * a, x = cx + r * Math.cos(t), y = cy + r * Math.sin(t), rc = r / Math.cos(a / 2);
                var cxa = cx + rc * Math.cos(t + a / 2), cya = cy + rc * Math.sin(t + a / 2), cxb = cx + rc * Math.cos(t - a / 2), cyb = cy + rc * Math.sin(t - a / 2);
                p.v.push([x, y]); p.o.push([(cxa - x) * 2 / 3, (cya - y) * 2 / 3]); p.i.push([(cxb - x) * 2 / 3, (cyb - y) * 2 / 3]);
            }
            return p;
        };
        var poly = function (pts) { var p = { v: [], i: [], o: [], c: true }; for (var k = 0; k < pts.length; k++) { p.v.push(pts[k]); p.i.push([0, 0]); p.o.push([0, 0]); } return p; };
        var dense = function (pts, per) { var r = []; for (var k = 0; k < pts.length; k++) { var a = pts[k], b = pts[(k + 1) % pts.length]; for (var s = 0; s < per; s++) r.push([a[0] + (b[0] - a[0]) * s / per, a[1] + (b[1] - a[1]) * s / per]); } return r; };
        var N = [[0, 0], [18, 0], [62, 72], [62, 0], [80, 0], [80, 100], [62, 100], [18, 28], [18, 100], [0, 100]];
        var rrect = function () {                         // corners of radius 20, each quarter split in 3 arcs, sides straight
            var p = { v: [], i: [], o: [], c: true }, C = [[180, 20, 20], [180, 80, 20], [20, 80, 20], [20, 20, 20]], st = [-90, 0, 90, 180];
            for (var q = 0; q < 4; q++) for (var s = 0; s <= 3; s++) {
                var t = (st[q] + s * 30) * Math.PI / 180, r = C[q][2], a = 30 * Math.PI / 180, h = 4 / 3 * Math.tan(a / 4) * r;
                var x = C[q][0] + r * Math.cos(t), y = C[q][1] + r * Math.sin(t), tx = -Math.sin(t), ty = Math.cos(t);
                p.v.push([x, y]); p.i.push(s === 0 ? [0, 0] : [-tx * h, -ty * h]); p.o.push(s === 3 ? [0, 0] : [tx * h, ty * h]);
            }
            return p;
        };
        var tests = [["circle 16 arcs", [circle(0, 0, 100, 16)]], ["TrueType circle", [quadCircle(0, 0, 100)]], ["square + side points", [poly(dense([[0, 0], [100, 0], [100, 100], [0, 100]], 4))]],
            ["N outline + extra points", [poly(dense(N, 2))]], ["rounded rect 3-split corners", [rrect()]], ["O (two TrueType rings)", [quadCircle(0, 0, 50), quadCircle(0, 0, 36)]]];
        /* the deviation: the old outline sampled densely against the new one */
        var dev = function (A, B) { var NS = 20;
            var e = 0, pa = function (p) { var r = []; for (var k = 0; k < p.v.length; k++) { var k1 = (k + 1) % p.v.length, P = [p.v[k], [p.v[k][0] + p.o[k][0], p.v[k][1] + p.o[k][1]], [p.v[k1][0] + p.i[k1][0], p.v[k1][1] + p.i[k1][1]], p.v[k1]]; for (var s = 0; s < NS; s++) { var t = s / NS, m = 1 - t; r.push([m * m * m * P[0][0] + 3 * m * m * t * P[1][0] + 3 * m * t * t * P[2][0] + t * t * t * P[3][0], m * m * m * P[0][1] + 3 * m * m * t * P[1][1] + 3 * m * t * t * P[2][1] + t * t * t * P[3][1]]); } } return r; };
            var a = pa(A); NS = 200; var b = pa(B); b.push(b[0]);
            for (var i = 0; i < a.length; i++) { var best = 1e9; for (var j = 0; j < b.length - 1; j++) { var ux = b[j + 1][0] - b[j][0], uy = b[j + 1][1] - b[j][1], l2 = ux * ux + uy * uy, tt = l2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((a[i][0] - b[j][0]) * ux + (a[i][1] - b[j][1]) * uy) / l2)), dx = a[i][0] - b[j][0] - ux * tt, dy = a[i][1] - b[j][1] - uy * tt, d = dx * dx + dy * dy; if (d < best) best = d; } if (best > e) e = best; }
            return Math.sqrt(e);
        };
        for (var t = 0; t < tests.length; t++) {
            var paths = tests[t][1], tol = UK_PSIMP.TOL * UK_PSIMP.size(paths), t0 = new Date().getTime(), s = [], before = 0, after = 0, worst = 0;
            for (var q = 0; q < paths.length; q++) { var r = UK_PSIMP.simplify(paths[q], tol); before += paths[q].v.length; after += r.v.length; worst = Math.max(worst, dev(paths[q], r)); s.push(r.v.length); }
            o.writeln(tests[t][0] + ": " + before + " -> " + after + " points (" + s.join(" + ") + "), deviation " + Math.round(worst * 1000) / 1000 + " px of " + Math.round(UK_PSIMP.size(paths)) + " (tol " + Math.round(tol * 1000) / 1000 + "), " + (new Date().getTime() - t0) + " ms");
        }
    } catch (e) { o.writeln("ERR " + e.toString() + " line " + e.line); }
    o.close();
})();

/*  Ultimate Kit - path simplifier (Word to Path, 2026-10-25): takes the outline of a letter as After Effects makes it
    from a font (often far more points than needed: TrueType curves arrive as chains of short pieces, straight
    sides with points along them) and keeps only the points a designer would draw with the pen:
      - corners always stay
      - a point on a straight run goes
      - a smooth point goes when one curve through its two neighbours, starting and ending in the same directions,
        stays within the tolerance of the original (a circle ends up as 4 points)
      - points at the curve's extremes (horizontal / vertical tangent) stay, as a designer keeps them
    The result looks the same (differences below a fraction of a pixel). ES3: used by After Effects
    (jsx/word2path.jsx) and testable in the panel.
    A path: { v: [[x, y], ...], i: [[x, y], ...] (in tangents, relative), o: [...] (out tangents), c: closed }   */
var UK_PSIMP = (function () {
    var S = {};
    S.EPS = 1e-3;
    function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
    function mul(a, k) { return [a[0] * k, a[1] * k]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
    function len(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1]); }
    function nrm(a) { var l = len(a); return l < 1e-12 ? [0, 0] : [a[0] / l, a[1] / l]; }
    function bez(P, t) {
        var m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
        return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
    }
    function bezD(P, t) {             // first derivative
        var m = 1 - t;
        return [3 * m * m * (P[1][0] - P[0][0]) + 6 * m * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]),
            3 * m * m * (P[1][1] - P[0][1]) + 6 * m * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1])];
    }
    function bezDD(P, t) {
        var m = 1 - t;
        return [6 * m * (P[2][0] - 2 * P[1][0] + P[0][0]) + 6 * t * (P[3][0] - 2 * P[2][0] + P[1][0]),
            6 * m * (P[2][1] - 2 * P[1][1] + P[0][1]) + 6 * t * (P[3][1] - 2 * P[2][1] + P[1][1])];
    }
    function segOf(p, k) { var n = p.v.length, k1 = (k + 1) % n; return [p.v[k], add(p.v[k], p.o[k]), add(p.v[k1], p.i[k1]), p.v[k1]]; }
    function distLine(q, a, b) { var d = sub(b, a), l = len(d); if (l < 1e-9) return len(sub(q, a)); return Math.abs(d[0] * (q[1] - a[1]) - d[1] * (q[0] - a[0])) / l; }
    function straight(P, tol) { return distLine(P[1], P[0], P[3]) <= tol && distLine(P[2], P[0], P[3]) <= tol; }
    /* the closest point on cubic Q to s, starting from parameter u (Newton) */
    function closest(Q, s, u) {
        for (var it = 0; it < 4; it++) {
            var p = bez(Q, u), d1 = bezD(Q, u), d2 = bezDD(Q, u), r = sub(p, s);
            var num = dot(r, d1), den = dot(d1, d1) + dot(r, d2);
            if (Math.abs(den) < 1e-12) break;
            u = Math.max(0, Math.min(1, u - num / den));
        }
        return u;
    }
    /* one cubic from a to b with start / end directions d0 / d3 through the samples (least squares, Schneider) */
    function fit(a, b, d0, d3, pts) {
        var n = pts.length, u = [0], tot = 0, i;
        for (i = 1; i < n; i++) { tot += len(sub(pts[i], pts[i - 1])); u.push(tot); }
        if (tot < 1e-9) return null;
        for (i = 0; i < n; i++) u[i] /= tot;
        var Q = null;
        for (var round = 0; round < 3; round++) {
            var c11 = 0, c12 = 0, c22 = 0, x1 = 0, x2 = 0;
            for (i = 0; i < n; i++) {
                var t = u[i], m = 1 - t, b0 = m * m * m, b1 = 3 * m * m * t, b2 = 3 * m * t * t, b3 = t * t * t;
                var A1 = mul(d0, b1), A2 = mul(d3, b2);
                c11 += dot(A1, A1); c12 += dot(A1, A2); c22 += dot(A2, A2);
                var tmp = sub(pts[i], add(mul(a, b0 + b1), mul(b, b2 + b3)));
                x1 += dot(tmp, A1); x2 += dot(tmp, A2);
            }
            var det = c11 * c22 - c12 * c12, al, be, ch = len(sub(b, a));
            if (Math.abs(det) > 1e-12) { al = (x1 * c22 - x2 * c12) / det; be = (c11 * x2 - c12 * x1) / det; } else { al = be = ch / 3; }
            if (!(al > ch * 1e-3) || !(be > ch * 1e-3) || al > ch * 3 || be > ch * 3) { al = be = ch / 3; }
            Q = [a, add(a, mul(d0, al)), add(b, mul(d3, be)), b];
            for (i = 1; i < n - 1; i++) u[i] = closest(Q, pts[i], u[i]);
        }
        return Q;
    }
    /* how far the cubic Q strays from the samples (both ways) */
    function err(Q, pts) {
        var e = 0, n = pts.length, i, j, k = 0;
        for (i = 0; i < n; i++) {               // the old points to the new curve (they come in order along it)
            var u = i / (n - 1), best = 1e9;
            u = closest(Q, pts[i], u);
            best = len(sub(bez(Q, u), pts[i]));
            for (j = 0; j <= 4; j++) { var u2 = closest(Q, pts[i], j / 4), d2 = len(sub(bez(Q, u2), pts[i])); if (d2 < best) best = d2; }
            if (best > e) e = best;
        }
        for (i = 1; i < 12; i++) {              // the new curve to the old polyline (no bulge between the samples)
            var q = bez(Q, i / 12), bd = 1e9;
            for (k = 0; k < n - 1; k++) {
                var A = pts[k], B = pts[k + 1], d = sub(B, A), l2 = dot(d, d), tt = l2 < 1e-12 ? 0 : Math.max(0, Math.min(1, dot(sub(q, A), d) / l2));
                var dd = len(sub(q, add(A, mul(d, tt)))); if (dd < bd) bd = dd;
            }
            if (bd > e) e = bd;
        }
        return e;
    }
    function samples(P, from, to, n) { var r = []; for (var k = 0; k <= n; k++) { var t = from + (to - from) * k / n; r.push(bez(P, t)); } return r; }
    /* the direction a segment leaves its start / arrives at its end */
    function startDir(P) { var d = sub(P[1], P[0]); if (len(d) < S.EPS) d = sub(P[2], P[0]); if (len(d) < S.EPS) d = sub(P[3], P[0]); return nrm(d); }
    function endDir(P) { var d = sub(P[2], P[3]); if (len(d) < S.EPS) d = sub(P[1], P[3]); if (len(d) < S.EPS) d = sub(P[0], P[3]); return nrm(d); }
    function smoothAt(p, k) {
        var a = p.i[k], b = p.o[k];
        if (len(a) < S.EPS || len(b) < S.EPS) return false;
        return dot(nrm(mul(a, -1)), nrm(b)) > Math.cos(4 * Math.PI / 180);
    }
    function axisAt(p, k) { var d = nrm(len(p.o[k]) > S.EPS ? p.o[k] : mul(p.i[k], -1)); return Math.abs(d[0]) < 0.009 || Math.abs(d[1]) < 0.009; }
    function copyPath(p) { var r = { v: [], i: [], o: [], c: p.c }; for (var k = 0; k < p.v.length; k++) { r.v.push([p.v[k][0], p.v[k][1]]); r.i.push([p.i[k][0], p.i[k][1]]); r.o.push([p.o[k][0], p.o[k][1]]); } return r; }
    function removeAt(p, k) { p.v.splice(k, 1); p.i.splice(k, 1); p.o.splice(k, 1); }
    /* try to take out vertex k: returns true (and changes p) when it went */
    function tryRemove(p, k, tol) {
        var n = p.v.length, ka = (k - 1 + n) % n, kb = (k + 1) % n;
        var A = segOf(p, ka), B = segOf(p, k), a = p.v[ka], b = p.v[kb];
        /* a point on a straight run */
        if (straight(A, tol) && straight(B, tol) && distLine(p.v[k], a, b) <= tol && dot(sub(p.v[k], a), sub(b, p.v[k])) > 0) {
            p.o[ka] = [0, 0]; p.i[kb] = [0, 0]; removeAt(p, k); return true;
        }
        if (!smoothAt(p, k) || axisAt(p, k)) return false;
        var pts = samples(A, 0, 1, 8).concat(samples(B, 0, 1, 8).slice(1));
        var Q = fit(a, b, startDir(A), endDir(B), pts);
        if (!Q || err(Q, pts) > tol) return false;
        p.o[ka] = sub(Q[1], a); p.i[kb] = sub(Q[2], b); removeAt(p, k);
        return true;
    }
    /* the simplified path (tol in px) */
    S.simplify = function (path, tol) {
        var p = copyPath(path), k, changed = true, guard = 0;
        /* points on top of each other */
        for (k = p.v.length - 1; k >= 1; k--) if (len(sub(p.v[k], p.v[k - 1])) < tol * 0.05) { p.o[k - 1] = p.o[k]; removeAt(p, k); }
        if (p.c && p.v.length > 1 && len(sub(p.v[0], p.v[p.v.length - 1])) < tol * 0.05) { p.i[0] = p.i[p.v.length - 1]; removeAt(p, p.v.length - 1); }
        var minN = p.c ? 3 : 2;
        while (changed && guard++ < 200) {
            changed = false;
            var from = p.c ? 0 : 1;
            for (k = from; k < p.v.length - (p.c ? 0 : 1) && p.v.length > minN; k++) {
                if (tryRemove(p, k, tol)) { changed = true; k--; }
            }
        }
        return p;
    };
    /* the size of a set of paths (for the tolerance): the larger side of their bounds */
    S.size = function (paths) {
        var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (var q = 0; q < paths.length; q++) for (var k = 0; k < paths[q].v.length; k++) { var v = paths[q].v[k]; x0 = Math.min(x0, v[0]); y0 = Math.min(y0, v[1]); x1 = Math.max(x1, v[0]); y1 = Math.max(y1, v[1]); }
        return Math.max(1, x1 - x0, y1 - y0);
    };
    S.TOL = 0.0025;          // the tolerance, as a part of the letter's size (0.25 %: invisible)
    return S;
})();

/*  Ultimate Kit - Fill Trim (2026-11-04): Trim Paths for filled shapes. The fill itself stays as it is (exact); a mask per
    island (a letter, an ornament: an outline with its holes, touching nothing else) shows the part between Start and End,
    and every island runs its own 0..100 along its own length, all from one Start / End.
      1  islands(): the paths of a layer, sorted into outer outlines and their holes
      2  build(): the island drawn on a grid; each hole gets a cut to the outline (a closed loop has a beginning and an end
         that way, as a stroke round a ring has); the two ends of the island's longest way are found and one of them is its 0 %
         (From). The distance inside the shape from there to every point (fast marching) is the island's measure, 0..100 %:
         a line of equal distance is a place on it, as far along on both sides of a stroke, also round a bend. Start and End
         are two such places, and the part between them shows, as with Trim Paths
      3  every point of the island's edge has its way back to the start (a tree, the ways join): at a level t a point
         further than t sits where its way crosses t, a point nearer sits on the edge. So one closed polygon, with the same
         points at every level, moving smoothly. Its edge points lie a little outside the fill (the fill's own edge shows)
      4  polygon(): the preview. In After Effects (jsx/filltrim.jsx) the same polygon at a row of levels becomes keyframes on the
         mask's Path, far past the end of the timeline, and a small expression picks the level from Start and End (a long
         expression made a frame take seconds). Start and End together: the polygon at End with the one at Start cut out of
         it (one path: a keyhole of no width) */
var UKFillTrim = (function () {
    var OUTSIDE = 1.5;      // px: how far the mask's edge lies outside the fill
    var MAXPTS = 320;       // points of an island's edge

    /* ------------------------------------------------------------------ paths */
    function segPts(a, b, c, d, step, out) {
        var L = Math.hypot(b[0] - a[0], b[1] - a[1]) + Math.hypot(c[0] - b[0], c[1] - b[1]) + Math.hypot(d[0] - c[0], d[1] - c[1]);
        var n = Math.max(1, Math.ceil(L / step));
        for (var k = 0; k < n; k++) {
            var t = k / n, u = 1 - t;
            out.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]);
        }
    }
    /* a closed path as points (its own vertices are among them: a sharp tip stays a point) */
    function flatten(p, step) {
        var n = p.v.length, out = [];
        for (var j = 0; j < n; j++) {
            var j1 = (j + 1) % n, a = p.v[j], d = p.v[j1];
            segPts(a, [a[0] + p.o[j][0], a[1] + p.o[j][1]], [d[0] + p.i[j1][0], d[1] + p.i[j1][1]], d, step, out);
        }
        return out;
    }
    function area(P) { var a = 0, n = P.length; for (var i = 0; i < n; i++) { var A = P[i], B = P[(i + 1) % n]; a += A[0] * B[1] - B[0] * A[1]; } return a / 2; }
    function perimeter(P) { var L = 0, n = P.length; for (var i = 0; i < n; i++) L += Math.hypot(P[(i + 1) % n][0] - P[i][0], P[(i + 1) % n][1] - P[i][1]); return L; }
    function bbox(P) { var b = [1e9, 1e9, -1e9, -1e9]; for (var i = 0; i < P.length; i++) { b[0] = Math.min(b[0], P[i][0]); b[1] = Math.min(b[1], P[i][1]); b[2] = Math.max(b[2], P[i][0]); b[3] = Math.max(b[3], P[i][1]); } return b; }
    function inside(q, P) {
        var c = false, n = P.length, x = q[0], y = q[1];
        for (var i = 0, j = n - 1; i < n; j = i++) { var A = P[i], B = P[j]; if ((A[1] > y) !== (B[1] > y) && x < (B[0] - A[0]) * (y - A[1]) / (B[1] - A[1]) + A[0]) c = !c; }
        return c;
    }

    /* ------------------------------------------------------------------ 1: islands */
    /* fills: [{ hex, rgb, rule (2 even-odd, 1 non-zero), paths: [{ v, i, o, c }] }], bottom first -> [{ fill, hex, rgb, rule, paths, outer, holes, box }] */
    function islands(fills) {
        var res = [];
        fills.forEach(function (f, fi) {
            var items = [];
            f.paths.forEach(function (p) { if (p.v.length < 2 || p.c === false) return; var P = flatten(p, 2); items.push({ p: p, P: P, a: area(P), box: bbox(P), depth: 0, kids: [] }); });
            items.forEach(function (A, i) {
                items.forEach(function (B, j) {
                    if (i === j) return;
                    if (A.box[0] < B.box[0] || A.box[1] < B.box[1] || A.box[2] > B.box[2] || A.box[3] > B.box[3]) return;
                    if (inside(A.P[0], B.P)) { A.depth++; if (!A.up || Math.abs(B.a) < Math.abs(A.up.a)) A.up = B; }
                });
            });
            var nz = f.rule === 1;
            items.forEach(function (A) {
                if (A.depth % 2 === 0) return;
                /* (a hole of the outline round it; with the non-zero rule a path turning the same way fills nothing new) */
                if (A.up) { A.up.kids.push(A); A.hole = !nz || (A.a > 0) !== (A.up.a > 0); }
            });
            items.forEach(function (A) {
                if (A.depth % 2 !== 0) return;
                var holes = A.kids.filter(function (k) { return k.hole; });
                res.push({ fill: fi, hex: f.hex, rgb: f.rgb, rule: f.rule || 2, paths: [A.p].concat(holes.map(function (k) { return k.p; })), outer: A.p, holes: holes.map(function (k) { return k.p; }), box: A.box });
            });
        });
        /* in reading order within a colour: rows, then from the left */
        var hs = res.map(function (r) { return r.box[3] - r.box[1]; }).sort(function (a, b) { return a - b; }), rowH = Math.max(1, (hs[hs.length >> 1] || 1) * 1.4);
        res.forEach(function (r) { r.row = Math.floor((r.box[1] + r.box[3]) / 2 / rowH); });
        res.sort(function (a, b) { return a.fill - b.fill || a.row - b.row || a.box[0] - b.box[0]; });
        return res;
    }

    /* ------------------------------------------------------------------ 2: the distance inside the shape */
    function Heap(s) { this.a = []; this.s = s; }
    Heap.prototype.push = function (i) { var a = this.a, s = this.s, k = a.length; a.push(i); while (k > 0) { var p = (k - 1) >> 1; if (s[a[p]] <= s[i]) break; a[k] = a[p]; k = p; } a[k] = i; };
    Heap.prototype.pop = function () {
        var a = this.a, s = this.s, top = a[0], last = a.pop(), n = a.length;
        if (n) { var k = 0; for (;;) { var c = 2 * k + 1; if (c >= n) break; if (c + 1 < n && s[a[c + 1]] < s[a[c]]) c++; if (s[a[c]] >= s[last]) break; a[k] = a[c]; k = c; } a[k] = last; }
        return top;
    };
    function march(dom, W, H, src) {
        var N = W * H, s = new Float32Array(N).fill(Infinity), done = new Uint8Array(N), hp = new Heap(s), i;
        s[src] = 0; hp.push(src);
        var val = function (q) { return (q >= 0 && q < N && dom[q] && done[q]) ? s[q] : Infinity; };
        while (hp.a.length) {
            i = hp.pop(); if (done[i]) continue; done[i] = 1;
            var x = i % W, y = (i / W) | 0;
            for (var k = 0; k < 4; k++) {
                var q = k === 0 ? (x > 0 ? i - 1 : -1) : (k === 1 ? (x < W - 1 ? i + 1 : -1) : (k === 2 ? (y > 0 ? i - W : -1) : (y < H - 1 ? i + W : -1)));
                if (q < 0 || !dom[q] || done[q]) continue;
                var qx = q % W, a = Math.min(qx > 0 ? val(q - 1) : Infinity, qx < W - 1 ? val(q + 1) : Infinity), b = Math.min(val(q - W), val(q + W)), u;
                if (a === Infinity) u = b + 1; else if (b === Infinity) u = a + 1;
                else { var df = a - b; u = Math.abs(df) >= 1 ? Math.min(a, b) + 1 : (a + b + Math.sqrt(2 - df * df)) / 2; }
                if (u < s[q]) { s[q] = u; hp.push(q); }
            }
        }
        return s;
    }
    function farthest(s) { var best = -1, m = -1; for (var i = 0; i < s.length; i++) if (s[i] !== Infinity && s[i] > m) { m = s[i]; best = i; } return best; }

    /* the island on a grid: 1 inside (a little over: a thin neck stays joined); cuts for the holes come off it */
    var CV = null;
    function grid(isl, g, pad) {
        var b = isl.box, W = Math.ceil((b[2] - b[0]) * g) + 2 * pad, H = Math.ceil((b[3] - b[1]) * g) + 2 * pad, ox = b[0] - pad / g, oy = b[1] - pad / g;
        if (!CV) CV = document.createElement("canvas");
        CV.width = W; CV.height = H;
        var c = CV.getContext("2d", { willReadFrequently: true }), P = new Path2D();
        var X = function (x) { return (x - ox) * g; }, Y = function (y) { return (y - oy) * g; };
        [isl.outer].concat(isl.holes).forEach(function (p) {
            var n = p.v.length; P.moveTo(X(p.v[0][0]), Y(p.v[0][1]));
            for (var j = 0; j < n; j++) { var j1 = (j + 1) % n; P.bezierCurveTo(X(p.v[j][0] + p.o[j][0]), Y(p.v[j][1] + p.o[j][1]), X(p.v[j1][0] + p.i[j1][0]), Y(p.v[j1][1] + p.i[j1][1]), X(p.v[j1][0]), Y(p.v[j1][1])); }
            P.closePath();
        });
        c.fillStyle = "#fff"; c.strokeStyle = "#fff"; c.lineWidth = 1; c.fill(P, "evenodd"); c.stroke(P);
        var d = c.getImageData(0, 0, W, H).data, dom = new Uint8Array(W * H);
        for (var i = 0; i < W * H; i++) dom[i] = d[i * 4 + 3] >= 128 ? 1 : 0;
        return { dom: dom, W: W, H: H, ox: ox, oy: oy, g: g };
    }
    function cutLine(G, A, B) {
        /* (a grid line, four-way closed, running a little past both edges) */
        var ax = (A[0] - G.ox) * G.g, ay = (A[1] - G.oy) * G.g, bx = (B[0] - G.ox) * G.g, by = (B[1] - G.oy) * G.g, L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L;
        var tot = Math.ceil((L + 6) * 2.5), lx = -1, ly = -1;
        for (var k = 0; k <= tot; k++) {
            var t = -3 + k / 2.5, x = Math.floor(ax + ux * t), y = Math.floor(ay + uy * t);
            if (x < 0 || y < 0 || x >= G.W || y >= G.H) continue;
            if (lx >= 0 && x !== lx && y !== ly) G.dom[y * G.W + lx] = 0;       // (no way past a diagonal step)
            G.dom[y * G.W + x] = 0; lx = x; ly = y;
        }
    }

    /* ------------------------------------------------------------------ 3: the edge and the ways back */
    /* the outline with its holes as one line: outer turning with the fill on its right, holes joined by a cut walked in and out.
       Each point: [x, y, cut?]; a point on a cut also [direction x, y, a point of the fill's side to read the distance from].
       The cut runs a little past both edges and is walked twice on exactly the same points: where both sides are filled
       it has no width at all */
    function edgeLine(isl, G, h) {
        var make = function (p, outer) {
            var P = flatten(p, h), a = area(P);
            if ((outer && a < 0) || (!outer && a > 0)) P.reverse();
            return P.map(function (q) { return [q[0], q[1], 0]; });
        };
        var E = make(isl.outer, true), rest = isl.holes.map(function (p) { return make(p, false); });
        while (rest.length) {
            var bd = 1e18, bi = 0, bj = 0, bh = 0;
            rest.forEach(function (H, hi) {
                var stepI = Math.max(1, E.length >> 9), stepJ = Math.max(1, H.length >> 8);
                for (var i = 0; i < E.length; i += stepI) { if (E[i][2]) continue; for (var j = 0; j < H.length; j += stepJ) { var dx = E[i][0] - H[j][0], dy = E[i][1] - H[j][1], d = dx * dx + dy * dy; if (d < bd) { bd = d; bi = i; bj = j; bh = hi; } } }
            });
            var H = rest.splice(bh, 1)[0], A = E[bi], B = H[bj], L = Math.sqrt(bd), m = Math.max(1, Math.round(L / h)), walkIn = [], walkOut = [], k;
            var ux = L > 0 ? (B[0] - A[0]) / L : 1, uy = L > 0 ? (B[1] - A[1]) / L : 0, cell2 = 2 / G.g;
            cutLine(G, A, B);
            for (k = 1; k < m; k++) { var wx = A[0] + (B[0] - A[0]) * k / m, wy = A[1] + (B[1] - A[1]) * k / m; walkIn.push([wx, wy, 1, ux, uy, wx, wy]); walkOut.unshift([wx, wy, 1, -ux, -uy, wx, wy]); }
            var ax0 = A[0] - ux * OUTSIDE, ay0 = A[1] - uy * OUTSIDE, bx0 = B[0] + ux * OUTSIDE, by0 = B[1] + uy * OUTSIDE;
            var ab = [A[0] + ux * cell2, A[1] + uy * cell2], bb = [B[0] - ux * cell2, B[1] - uy * cell2];
            E = E.slice(0, bi).concat([[ax0, ay0, 1, ux, uy, ab[0], ab[1]]], walkIn, [[bx0, by0, 1, ux, uy, bb[0], bb[1]]], H.slice(bj + 1), H.slice(0, bj), [[bx0, by0, 1, -ux, -uy, bb[0], bb[1]]], walkOut, [[ax0, ay0, 1, -ux, -uy, ab[0], ab[1]]], E.slice(bi + 1));
        }
        return E;
    }
    /* the data for polygon(). o.from: which end is 0 %: "left" | "right" | "top" | "bottom" ("center": as "left") */
    function build(isl, o) {
        o = o || {};
        var b = isl.box, mx = Math.max(b[2] - b[0], b[3] - b[1], 1), g = Math.max(0.5, Math.min(3, 900 / mx)), pad = 4, G = grid(isl, g, pad), W = G.W, H = G.H, dom = G.dom, N = W * H, i, k;
        var per = perimeter(flatten(isl.outer, 2)); isl.holes.forEach(function (p) { per += perimeter(flatten(p, 2)); });
        var h = Math.max(1.25, per / MAXPTS), E = edgeLine(isl, G, h);
        /* the two ends of the island's longest way: one of them is the start */
        var from = o.from || "left", ax = (from === "top" || from === "bottom") ? 1 : 0, sgn = (from === "right" || from === "bottom") ? -1 : 1;
        var key = function (c) { var x = c % W, y = (c / W) | 0; return (ax === 0 ? x : y) * sgn; };
        var seed = -1, sk = 1e18; for (i = 0; i < N; i++) if (dom[i] && key(i) < sk) { sk = key(i); seed = i; }
        if (seed < 0) return null;
        var A = farthest(march(dom, W, H, seed)), sA = march(dom, W, H, A), Bc = farthest(sA), src = A, s = sA;
        if (key(Bc) < key(A) - 0.08 * (ax === 0 ? W : H)) { src = Bc; s = march(dom, W, H, Bc); }
        /* the ways back: down the distance from each edge point, joining where they meet */
        var nx = [], ny = [], ns = [], np = [], at = new Int32Array(N).fill(-1);
        var addNode = function (x, y, c) { nx.push(x); ny.push(y); ns.push(s[c]); np.push(-1); return nx.length - 1; };
        var srcX = src % W + 0.5, srcY = ((src / W) | 0) + 0.5; at[src] = addNode(srcX, srcY, src);
        var ok = function (c) { return c >= 0 && c < N && dom[c] && s[c] !== Infinity; };
        var stepDown = function (c) {
            /* the lowest neighbour (not through the corner of a cut) */
            var x = c % W, y = (c / W) | 0, best = -1, bv = s[c];
            for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
                if (!dx && !dy) continue; var X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
                var q = Y * W + X; if (!ok(q)) continue;
                if (dx && dy && !ok(y * W + X) && !ok(Y * W + x)) continue;
                if (s[q] < bv) { bv = s[q]; best = q; }
            }
            return best;
        };
        var walkDown = function (c0) {
            var chain = [], c = c0, px = c % W + 0.5, py = ((c / W) | 0) + 0.5, guard = 0;
            while (at[c] < 0 && guard++ < 40000) {
                var id = addNode(px, py, c); at[c] = id; chain.push(id);
                /* along the slope, by less than a cell; the neighbour if that fails */
                var x = c % W, y = (c / W) | 0, L = (x > 0 && ok(c - 1)) ? s[c - 1] : null, R = (x < W - 1 && ok(c + 1)) ? s[c + 1] : null, Up = (y > 0 && ok(c - W)) ? s[c - W] : null, Dn = (y < H - 1 && ok(c + W)) ? s[c + W] : null;
                var gx = (L !== null && R !== null) ? (R - L) / 2 : (R !== null ? R - s[c] : (L !== null ? s[c] - L : 0)), gy = (Up !== null && Dn !== null) ? (Dn - Up) / 2 : (Dn !== null ? Dn - s[c] : (Up !== null ? s[c] - Up : 0)), gl = Math.hypot(gx, gy);
                var next = -1;
                if (gl > 1e-6) {
                    for (var tr = 0; tr < 3; tr++) {
                        px -= gx / gl * 0.8; py -= gy / gl * 0.8;
                        var q = Math.floor(py) * W + Math.floor(px);
                        if (q === c) continue;
                        if (ok(q) && s[q] < s[c]) { var qx = q % W, qy = (q / W) | 0; if (qx === x || qy === y || ok(y * W + qx) || ok(qy * W + x)) next = q; }
                        break;
                    }
                }
                if (next < 0) { next = stepDown(c); if (next < 0) break; px = next % W + 0.5; py = ((next / W) | 0) + 0.5; }
                c = next;
            }
            var par = at[c]; if (par < 0) par = 0;
            for (var q2 = chain.length - 1; q2 >= 0; q2--) { if (chain[q2] !== par) { np[chain[q2]] = par; par = chain[q2]; } }
            return at[c0] >= 0 ? at[c0] : 0;
        };
        /* each edge point: the inside cell next to it (on its right), its way, and where it stands (outside the fill) */
        var n = E.length, leaves = [], reach = [1, 1.5, 2, 3, 4, 6];
        for (i = 0; i < n; i++) {
            var P = E[i], Q = E[(i + 1) % n], Z = E[(i - 1 + n) % n], tx = Q[0] - Z[0], ty = Q[1] - Z[1], tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
            if (P[2]) { tx = P[3]; ty = P[4]; }
            var cx = ((P[2] ? P[5] : P[0]) - G.ox) * g, cy = ((P[2] ? P[6] : P[1]) - G.oy) * g, cell = -1;
            for (k = 0; k < reach.length && cell < 0; k++) { var qc = Math.floor(cy + tx * reach[k]) * W + Math.floor(cx - ty * reach[k]); if (qc >= 0 && qc < N && ok(qc)) cell = qc; }
            if (cell < 0) for (var r = 1; r < 14 && cell < 0; r++) { var bd2 = 1e18; for (var dy2 = -r; dy2 <= r; dy2++) for (var dx2 = -r; dx2 <= r; dx2++) { if (Math.max(Math.abs(dx2), Math.abs(dy2)) !== r) continue; var yy = Math.floor(cy) + dy2, xx = Math.floor(cx) + dx2; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; var c2 = yy * W + xx; if (ok(c2) && dx2 * dx2 + dy2 * dy2 < bd2) { bd2 = dx2 * dx2 + dy2 * dy2; cell = c2; } } }
            var par = cell >= 0 ? walkDown(cell) : 0;
            /* outside the fill (not along a cut: its two sides must meet exactly) */
            var qx2 = P[0], qy2 = P[1];
            if (!P[2]) { qx2 += ty * OUTSIDE; qy2 -= tx * OUTSIDE; }
            leaves.push({ x: qx2, y: qy2, cx: (qx2 - G.ox) * g, cy: (qy2 - G.oy) * g, p: par });
        }
        /* few nodes: the kept ones are the root, where ways join and the leaves; a chain between keeps what its shape needs */
        var count = new Int32Array(nx.length), keep = new Uint8Array(nx.length), M = nx.length;
        for (i = 1; i < M; i++) if (np[i] >= 0) count[np[i]]++;
        leaves.forEach(function (l) { count[l.p]++; });
        keep[0] = 1; for (i = 1; i < M; i++) if (count[i] >= 2) keep[i] = 1;
        var rp = new Int32Array(M).fill(-1);
        var dp = function (chain, a, b) {
            if (b - a < 2) return;
            var A0 = chain[a], B0 = chain[b], ux = nx[B0] - nx[A0], uy = ny[B0] - ny[A0], l = Math.hypot(ux, uy) || 1, far = -1, m = Math.max(0.35, 0.3 * g);
            for (var j = a + 1; j < b; j++) { var C = chain[j], d = Math.abs(ux * (ny[C] - ny[A0]) - uy * (nx[C] - nx[A0])) / l; if (d > m) { m = d; far = j; } }
            if (far >= 0) { keep[chain[far]] = 1; dp(chain, a, far); dp(chain, far, b); }
        };
        var chainUp = function (s0) { var ch = [s0], c = np[s0], g2 = 0; while (c >= 0 && !keep[c] && g2++ < 80000) { ch.push(c); c = np[c]; } if (c >= 0) ch.push(c); return ch; };
        var starts = []; for (i = 1; i < M; i++) if (keep[i]) starts.push(i);
        leaves.forEach(function (l) { if (!keep[l.p]) { keep[l.p] = 1; } });
        /* (a node that only carries one leaf and one way up can go: the leaf then runs on to the next kept node) */
        for (i = 1; i < M; i++) if (keep[i] && count[i] < 2 && starts.indexOf(i) < 0) starts.push(i);
        starts.forEach(function (st) { var ch = chainUp(st); if (ch.length > 2) dp(ch, 0, ch.length - 1); });
        /* the kept nodes in order of distance, parents first */
        var order = []; for (i = 0; i < M; i++) if (keep[i]) order.push(i);
        order.sort(function (a, c) { return ns[a] - ns[c] || a - c; });
        var idx = new Int32Array(M).fill(-1); order.forEach(function (q, j) { idx[q] = j; });
        var keptUp = function (q) { var c = np[q], g3 = 0; while (c >= 0 && !keep[c] && g3++ < 80000) c = np[c]; return c < 0 ? order[0] : c; };
        var f1 = function (v) { return Math.round(v * 10) / 10; }, D = [];
        var LX = function (c) { return c / g + G.ox; }, LY = function (c) { return c / g + G.oy; };
        order.forEach(function (q, j) { D.push(f1(LX(nx[q])), f1(LY(ny[q])), j === 0 ? 0 : j - idx[keptUp(q)], f1(ns[q] / g)); });
        var Ed = [], S = 0;
        leaves.forEach(function (l) {
            var par = idx[l.p]; if (par < 0) par = 0;
            var pq = order[par], sv = ns[pq] / g + Math.hypot(l.x - LX(nx[pq]), l.y - LY(ny[pq]));
            Ed.push(f1(l.x), f1(l.y), par, f1(sv)); if (sv > S) S = sv;
        });
        return { D: D, E: Ed, S: f1(S) + 0.1, B: [f1(b[0] - OUTSIDE - 1), f1(b[1] - OUTSIDE - 1), f1(b[2] + OUTSIDE + 1), f1(b[3] + OUTSIDE + 1)], nodes: order.length, pts: n };
    }

    /* ------------------------------------------------------------------ 4: the polygon at Start lo .. End hi (0..1) */
    function level(d, t) {
        var D = d.D, E = d.E, n = D.length / 4, cx = [D[0]], cy = [D[1]], i, o, p, s, q, f, R = [], m = E.length / 4, lx = 1e9, ly = 1e9, x = D[0], y = D[1];
        for (i = 1; i < n; i++) {
            o = i * 4; p = i - D[o + 2]; s = D[o + 3]; q = D[p * 4 + 3];
            if (t >= s) { cx[i] = D[o]; cy[i] = D[o + 1]; }
            else if (t > q) { f = (t - q) / (s - q); cx[i] = D[p * 4] + (D[o] - D[p * 4]) * f; cy[i] = D[p * 4 + 1] + (D[o + 1] - D[p * 4 + 1]) * f; }
            else { cx[i] = cx[p]; cy[i] = cy[p]; }
        }
        for (i = 0; i < m; i++) {
            o = i * 4; p = E[o + 2]; s = E[o + 3]; q = D[p * 4 + 3];
            if (t >= s) { x = E[o]; y = E[o + 1]; }
            else if (t > q) { f = (t - q) / (s - q); x = D[p * 4] + (E[o] - D[p * 4]) * f; y = D[p * 4 + 1] + (E[o + 1] - D[p * 4 + 1]) * f; }
            else { x = cx[p]; y = cy[p]; }
            if (x !== lx || y !== ly) { R.push([x, y]); lx = x; ly = y; }
        }
        if (R.length < 3) R = [[x, y], [x + 0.01, y], [x, y + 0.01]];
        return R;
    }
    function polygon(d, lo, hi) {
        var B = d.B;
        if (hi >= 1 && lo <= 0) return [[B[0], B[1]], [B[2], B[1]], [B[2], B[3]], [B[0], B[3]]];
        if (hi <= lo) return level(d, 0);
        var P = level(d, hi * d.S);
        if (lo > 0) { var K = level(d, lo * d.S), j; P.push(P[0]); P.push(K[0]); for (j = K.length - 1; j >= 0; j--) P.push(K[j]); }
        return P;
    }
    return { islands: islands, build: build, polygon: polygon, flatten: flatten };
})();

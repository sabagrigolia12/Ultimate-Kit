/*  Ultimate Kit - centre lines (Word to Path, 2026-10-25): a filled letter (or any filled shape) becomes the path a
    designer would draw with the pen through its middle, plus the stroke width that gives it back its thickness.
      1  the shape is drawn big on a canvas (its own fill rule)
      2  the distance of every inside pixel to the edge (exact Euclidean distance transform)
      3  the shape is thinned to a one-pixel skeleton (Zhang-Suen), little spurs into the corners and stroke ends
         are pruned (their tips are close to the edge), the rest is read as strokes between ends and junctions
      4  at a junction the strokes that run straight on are joined (the bar of a T is one path, the stem another),
         a stroke that ends free is lengthened to the shape's edge (butt cap)
      5  each stroke is cut at its corners and fitted with as few cubic curves as it needs (Schneider), then the
         smooth points that are not needed go (shared/pathsimp.js): an O is 4 points, an N 4
      6  a dot (the i's, the full stop) becomes a short line as long and as thick as the dot
    Width = twice the typical distance to the edge along the skeleton. Coordinates in and out are the layer's.
    piece: { paths: [{ v, i, o, c }], rule: 1 non-zero | 2 even-odd } -> [{ paths: [...], width, cap: 1 butt | 2 round }] */
var UKCenter = (function () {
    var RES = 520, PAD = 10, TRACE = null;
    function bounds(paths) {
        var x0 = 1e18, y0 = 1e18, x1 = -1e18, y1 = -1e18, q, k, P = function (x, y) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; };
        for (q = 0; q < paths.length; q++) { var p = paths[q]; for (k = 0; k < p.v.length; k++) { P(p.v[k][0], p.v[k][1]); P(p.v[k][0] + p.i[k][0], p.v[k][1] + p.i[k][1]); P(p.v[k][0] + p.o[k][0], p.v[k][1] + p.o[k][1]); } }
        return { x0: x0, y0: y0, w: Math.max(1e-6, x1 - x0), h: Math.max(1e-6, y1 - y0) };
    }
    /* 1: the shape on a canvas -> a 0 / 1 image and how layer units map to it */
    function raster(piece) {
        var b = bounds(piece.paths), sc = RES / Math.max(b.w, b.h);
        var W = Math.ceil(b.w * sc) + 2 * PAD, H = Math.ceil(b.h * sc) + 2 * PAD;
        if (W * H > 900000) { var k = Math.sqrt(900000 / (W * H)); sc *= k; W = Math.ceil(b.w * sc) + 2 * PAD; H = Math.ceil(b.h * sc) + 2 * PAD; }
        var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        var g = cv.getContext("2d"), ox = PAD - b.x0 * sc, oy = PAD - b.y0 * sc, P2 = new Path2D(), q, j;
        var X = function (x) { return x * sc + ox; }, Y = function (y) { return y * sc + oy; };
        for (q = 0; q < piece.paths.length; q++) {
            var p = piece.paths[q], n = p.v.length; if (!n) continue;
            P2.moveTo(X(p.v[0][0]), Y(p.v[0][1]));
            for (j = 0; j < n; j++) {
                var j1 = (j + 1) % n; if (j1 === 0 && !p.c && false) break;
                if (j === n - 1 && !p.c) break;
                P2.bezierCurveTo(X(p.v[j][0] + p.o[j][0]), Y(p.v[j][1] + p.o[j][1]), X(p.v[j1][0] + p.i[j1][0]), Y(p.v[j1][1] + p.i[j1][1]), X(p.v[j1][0]), Y(p.v[j1][1]));
            }
            P2.closePath();
        }
        g.fillStyle = "#000"; g.fill(P2, piece.rule === 2 ? "evenodd" : "nonzero");
        var d = g.getImageData(0, 0, W, H).data, bin = new Uint8Array(W * H);
        for (q = 0; q < W * H; q++) bin[q] = d[q * 4 + 3] > 127 ? 1 : 0;
        return { W: W, H: H, bin: bin, sc: sc, ox: ox, oy: oy };
    }
    /* 2: exact Euclidean distance to the nearest outside pixel (Felzenszwalb) */
    function dt1(f, n, d, v, z) {
        var k = 0, q, s; v[0] = 0; z[0] = -1e30; z[1] = 1e30;
        for (q = 1; q < n; q++) {
            s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
            while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
            k++; v[k] = q; z[k] = s; z[k + 1] = 1e30;
        }
        k = 0;
        for (q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    }
    function edt(bin, W, H) {
        var g = new Float64Array(W * H), M = Math.max(W, H), f = new Float64Array(M), d = new Float64Array(M), v = new Int32Array(M), z = new Float64Array(M + 1), x, y, i;
        for (i = 0; i < W * H; i++) g[i] = bin[i] ? 1e20 : 0;
        for (x = 0; x < W; x++) { for (y = 0; y < H; y++) f[y] = g[y * W + x]; dt1(f, H, d, v, z); for (y = 0; y < H; y++) g[y * W + x] = d[y]; }
        for (y = 0; y < H; y++) { for (x = 0; x < W; x++) f[x] = g[y * W + x]; dt1(f, W, d, v, z); for (x = 0; x < W; x++) g[y * W + x] = Math.sqrt(d[x]); }
        return g;
    }
    /* 3a: thinning to a one-pixel skeleton */
    function thin(bin, W, H) {
        var img = new Uint8Array(bin), del = [], changed = true, pass, x, y, i, list = [];
        for (i = 0; i < W * H; i++) if (img[i]) list.push(i);
        while (changed) {
            changed = false;
            for (pass = 0; pass < 2; pass++) {
                del.length = 0;
                for (var q = 0; q < list.length; q++) {
                    i = list[q]; if (!img[i]) continue;
                    var p2 = img[i - W], p3 = img[i - W + 1], p4 = img[i + 1], p5 = img[i + W + 1], p6 = img[i + W], p7 = img[i + W - 1], p8 = img[i - 1], p9 = img[i - W - 1];
                    var B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
                    if (B < 2 || B > 6) continue;
                    var A = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
                    if (A !== 1) continue;
                    if (pass === 0) { if (p2 && p4 && p6) continue; if (p4 && p6 && p8) continue; }
                    else { if (p2 && p4 && p8) continue; if (p2 && p6 && p8) continue; }
                    del.push(i);
                }
                for (q = 0; q < del.length; q++) img[del[q]] = 0;
                if (del.length) changed = true;
            }
            var nl = []; for (q = 0; q < list.length; q++) if (img[list[q]]) nl.push(list[q]); list = nl;
        }
        /* the pixels thinning leaves two deep (staircases): a pixel goes when its neighbours still touch each other
           without it and it is not the end of a line */
        var again = true, rounds = 0;
        while (again && rounds++ < 8) {
            again = false;
            for (q = 0; q < list.length; q++) {
                i = list[q]; if (!img[i]) continue;
                var cnt = img[i - W] + img[i + 1] + img[i + W] + img[i - 1] + img[i - W + 1] + img[i + W + 1] + img[i + W - 1] + img[i - W - 1];
                if (cnt >= 2 && groups(img, W, i) === 1) { img[i] = 0; again = true; }
            }
        }
        return img;
    }
    var OFF = null;
    function nb(img, W, i, out) {
        if (!OFF || OFF.W !== W) OFF = { W: W, d: [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1] };
        out.length = 0;
        for (var k = 0; k < 8; k++) if (img[i + OFF.d[k]]) out.push(i + OFF.d[k]);
        return out;
    }
    /* how many separate groups the 8 neighbours form (a staircase pixel on a diagonal line: 2 = a line pixel) */
    var RING = null;
    function groups(img, W, i) {
        if (!RING || RING.W !== W) RING = { W: W, d: [-W, -W + 1, 1, W + 1, W, W - 1, -1, -W - 1] };
        var on = [], k, par = [0, 1, 2, 3, 4, 5, 6, 7], n = 0;
        for (k = 0; k < 8; k++) on.push(img[i + RING.d[k]] ? 1 : 0);
        var find = function (x) { while (par[x] !== x) x = par[x] = par[par[x]]; return x; }, join = function (a, b) { if (on[a] && on[b]) par[find(a)] = find(b); };
        for (k = 0; k < 8; k++) join(k, (k + 1) % 8);
        join(0, 2); join(2, 4); join(4, 6); join(6, 0);
        for (k = 0; k < 8; k++) if (on[k] && find(k) === k) n++;
        return n;
    }
    /* 3b: the skeleton as strokes between ends / junctions: { nodes: [{ x, y, px }], edges: [{ a, b, px: [...] }] } */
    function graph(img, W, H) {
        var deg = new Uint8Array(W * H), i, q, sk = [];
        var tmp = [];      /* (after the clean-up a line pixel has exactly two neighbours: more = a junction, one = an end) */
        for (i = 0; i < W * H; i++) if (img[i]) { sk.push(i); deg[i] = nb(img, W, i, tmp).length; }
        var node = new Int32Array(W * H); for (i = 0; i < W * H; i++) node[i] = -1;
        var nodes = [];
        for (q = 0; q < sk.length; q++) {
            i = sk[q]; if (deg[i] === 2 || node[i] >= 0) continue;
            var id = nodes.length, st = [i], px = [], sx = 0, sy = 0;
            node[i] = id;
            while (st.length) {
                var c = st.pop(); px.push(c); sx += c % W; sy += Math.floor(c / W);
                if (deg[c] >= 3) { var ns = nb(img, W, c, []); for (var t = 0; t < ns.length; t++) if (deg[ns[t]] >= 3 && node[ns[t]] < 0) { node[ns[t]] = id; st.push(ns[t]); } }
            }
            nodes.push({ x: sx / px.length, y: sy / px.length, px: px, deg: 0 });
        }
        var vis = new Uint8Array(W * H), edges = [], seen = {};
        var orth = function (a, b) { var d = Math.abs(a - b); return d === 1 || d === W; };
        for (var n = 0; n < nodes.length; n++) for (q = 0; q < nodes[n].px.length; q++) {
            var s = nodes[n].px[q], nn = nb(img, W, s, []);
            for (var k = 0; k < nn.length; k++) {
                var j = nn[k];
                if (node[j] === n) continue;
                if (node[j] >= 0) { var key = Math.min(n, node[j]) + "_" + Math.max(n, node[j]); if (!seen[key]) { seen[key] = 1; edges.push({ a: n, b: node[j], px: [] }); } continue; }
                if (vis[j]) continue;
                var chain = [], prev = s, cur = j, end = -1;
                while (true) {
                    vis[cur] = 1; chain.push(cur);
                    var cn = nb(img, W, cur, []), cand = [];
                    for (var m = 0; m < cn.length; m++) {
                        var x = cn[m];
                        if (x === prev) continue;
                        if (node[x] >= 0) { if (node[x] !== n || chain.length > 2) end = node[x]; continue; }
                        if (!vis[x]) cand.push(x);
                    }
                    if (end >= 0 || !cand.length) break;
                    var nx = cand[0];
                    for (m = 1; m < cand.length; m++) if (orth(cand[m], cur) && !orth(nx, cur)) nx = cand[m];
                    for (m = 0; m < cand.length; m++) if (cand[m] !== nx && (orth(cand[m], nx) || orth(cand[m], cur))) vis[cand[m]] = 1;     // the other step of a staircase
                    prev = cur; cur = nx;
                }
                if (end < 0) end = n;
                if (end === n && chain.length < 3) continue;
                edges.push({ a: n, b: end, px: chain });
            }
        }
        /* rings with no end or junction (an O) */
        for (q = 0; q < sk.length; q++) {
            i = sk[q]; if (vis[i] || node[i] >= 0) continue;
            var ring = [], p0 = -1, cu = i;
            while (cu >= 0 && !vis[cu]) {
                vis[cu] = 1; ring.push(cu);
                var rn = nb(img, W, cu, []), c2 = [];
                for (var r = 0; r < rn.length; r++) if (!vis[rn[r]] && rn[r] !== p0) c2.push(rn[r]);
                var nx2 = c2.length ? c2[0] : -1;
                for (r = 1; r < c2.length; r++) if (orth(c2[r], cu) && !orth(nx2, cu)) nx2 = c2[r];
                for (r = 0; r < c2.length; r++) if (c2[r] !== nx2 && (orth(c2[r], nx2) || orth(c2[r], cu))) vis[c2[r]] = 1;
                p0 = cu; cu = nx2;
            }
            if (ring.length > 6) edges.push({ a: -1, b: -1, px: ring, ring: true });
        }
        return { nodes: nodes, edges: edges };
    }    function xy(i, W) { return [i % W, Math.floor(i / W)]; }
    function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.floor(b.length / 2)]; }
    /* an edge as points (from node a to node b) */
    function edgePts(e, G, W) {
        var r = [], q;
        if (e.a >= 0) r.push([G.nodes[e.a].x, G.nodes[e.a].y]);
        for (q = 0; q < e.px.length; q++) r.push(xy(e.px[q], W));
        if (e.b >= 0) r.push([G.nodes[e.b].x, G.nodes[e.b].y]);
        return r;
    }
    /* 3c: prune spurs; merge strokes through nodes left with two strokes */
    function prune(G, D, W, medD) {
        var changed = true, e, q;
        var count = function () { for (q = 0; q < G.nodes.length; q++) G.nodes[q].deg = 0; for (q = 0; q < G.edges.length; q++) { e = G.edges[q]; if (e.dead || e.ring) continue; G.nodes[e.a].deg++; G.nodes[e.b].deg++; } };
        var guard = 0;
        while (changed && guard++ < 50) {
            changed = false; count();
            for (q = 0; q < G.edges.length; q++) {
                e = G.edges[q]; if (e.dead || e.ring || e.a === e.b) continue;
                var la = G.nodes[e.a].deg === 1, lb = G.nodes[e.b].deg === 1;
                if (la === lb) continue;                       // both free (a lone stroke) or both joined: keep
                var leaf = la ? G.nodes[e.a] : G.nodes[e.b], jn = la ? G.nodes[e.b] : G.nodes[e.a], tipD = D[leaf.px[0]], len = e.px.length + 1;
                var Dj = Math.max(D[jn.px[0]], 1), reach = Math.sqrt(Math.pow(leaf.x - jn.x, 2) + Math.pow(leaf.y - jn.y, 2)) + tipD;
                /* a spur into a corner: its tip stays inside the junction's own thickness */
                var tipCorner = false;
                if (!(reach < 1.55 * Dj) && reach < 3.2 * Dj && jn.deg === 3) {
                    /* (the tip of a sharp corner two strokes come into together - an M's top: the two leave it close
                       together, away from the tip - is a corner, not a stroke of its own) */
                    var jid = la ? e.b : e.a, dirs = [], sd = [leaf.x - jn.x, leaf.y - jn.y];
                    for (var q7 = 0; q7 < G.edges.length; q7++) {
                        var e7 = G.edges[q7]; if (e7 === e || e7.dead || e7.ring) continue;
                        if (e7.a !== jid && e7.b !== jid) continue;
                        var px7 = e7.a === jid ? e7.px : e7.px.slice().reverse(), i7 = px7[Math.min(px7.length - 1, Math.round(6 * medD))];
                        dirs.push(nrm([i7 % W - jn.x, Math.floor(i7 / W) - jn.y]));
                    }
                    if (dirs.length === 2) {
                        var sdn = nrm(sd), c7 = dirs[0][0] * dirs[1][0] + dirs[0][1] * dirs[1][1];
                        tipCorner = c7 > Math.cos(60 * Math.PI / 180) && dirs[0][0] * sdn[0] + dirs[0][1] * sdn[1] < -0.5 && dirs[1][0] * sdn[0] + dirs[1][1] * sdn[1] < -0.5;
                    }
                }
                if (TRACE && !(reach < 1.55 * Dj)) TRACE.push({ prune: [leaf.x, leaf.y], jn: [jn.x, jn.y], deg: jn.deg, reach: reach, Dj: Dj, tipCorner: tipCorner });
                if (reach < 1.55 * Dj || len < 0.35 * medD || tipCorner) { e.dead = true; changed = true; count(); (G.cornerPts = G.cornerPts || []).push([jn.x, jn.y]); }
            }
            /* a node with exactly two strokes: one stroke through it */
            for (var n = 0; n < G.nodes.length; n++) {
                if (G.nodes[n].deg !== 2) continue;
                var two = [];
                for (q = 0; q < G.edges.length; q++) { e = G.edges[q]; if (e.dead || e.ring) continue; if (e.a === n) two.push([e, 0]); if (e.b === n && e.a !== n) two.push([e, 1]); }
                if (two.length !== 2 || two[0][0] === two[1][0]) {
                    if (two.length === 2 && two[0][0] === two[1][0]) { var lp = two[0][0]; lp.ring = true; lp.loopNode = n; G.nodes[n].deg = 0; changed = true; }
                    continue;
                }
                var A = two[0][0], B = two[1][0];
                var pa = A.a === n ? A.px.slice().reverse() : A.px.slice(), pb = B.a === n ? B.px.slice() : B.px.slice().reverse();
                var na = A.a === n ? A.b : A.a, nbn = B.a === n ? B.b : B.a;
                var mid = G.nodes[n].px[0];
                (G.cornerPts = G.cornerPts || []).push([G.nodes[n].x, G.nodes[n].y]);
                A.px = pa.concat([mid]).concat(pb); A.a = na; A.b = nbn; A.via = (A.via || []).concat([[G.nodes[n].x, G.nodes[n].y]]);
                B.dead = true; changed = true; count();
                if (A.a === A.b) { A.ring = true; A.loopNode = A.a; }
            }
        }
        G.edges = G.edges.filter(function (x) { return !x.dead; });
    }
    /* 3d: junctions joined by a short piece are one junction (the centre of an X, where a K's arm and leg meet) */
    function collapse(G, medD) {
        var again = true, guard = 0, q;
        while (again && guard++ < 50) {
            again = false;
            var deg = {}; for (q = 0; q < G.edges.length; q++) { var e = G.edges[q]; if (e.dead || e.ring) continue; deg[e.a] = (deg[e.a] || 0) + 1; deg[e.b] = (deg[e.b] || 0) + 1; }
            for (q = 0; q < G.edges.length; q++) {
                var s = G.edges[q]; if (s.dead || s.ring || s.a === s.b) continue;
                if ((deg[s.a] || 0) < 3 || (deg[s.b] || 0) < 3 || s.px.length > 1.2 * medD) continue;
                var A = G.nodes[s.a], B = G.nodes[s.b], na = A.px.length, nb2 = B.px.length;
                A.x = (A.x * na + B.x * nb2) / (na + nb2); A.y = (A.y * na + B.y * nb2) / (na + nb2); A.px = A.px.concat(B.px);
                s.dead = true;
                for (var k = 0; k < G.edges.length; k++) { var e2 = G.edges[k]; if (e2.dead) continue; if (e2.a === s.b) e2.a = s.a; if (e2.b === s.b) e2.b = s.a; }
                again = true; break;
            }
        }
        G.edges = G.edges.filter(function (x) { return !x.dead; });
    }
    /* 4: strokes into paths: straight-on strokes joined at junctions, free ends lengthened to the edge */
    function assemble(G, D, W, medD, R, S) {
        var UU = Math.max(2 * medD, 0.15 * (S || 0));
        var E = G.edges, P = [], q, n;
        var ends = {};             // node -> [[edge, side]]
        for (q = 0; q < E.length; q++) { var e = E[q]; e.pts = edgePts(e, G, W); if (e.ring) continue; (ends[e.a] = ends[e.a] || []).push([q, 0]); (ends[e.b] = ends[e.b] || []).push([q, 1]); }
        var link = {}, cornerLink = {}, dirAt = function (ei, side) {
            var p = E[ei].pts, L = 0, k, a = side ? p[p.length - 1] : p[0], b = a;
            for (k = 1; k < p.length; k++) { var c = side ? p[p.length - 1 - k] : p[k]; L += Math.sqrt(Math.pow(c[0] - b[0], 2) + Math.pow(c[1] - b[1], 2)); b = c; if (L > 1.4 * medD) break; }
            var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1; return [dx / l, dy / l];
        };
        for (n in ends) {
            var list = ends[n]; if (list.length < 2) continue;
            var pairs = [];
            for (var a = 0; a < list.length; a++) for (var b = a + 1; b < list.length; b++) {
                if (list[a][0] === list[b][0]) continue;
                var da = dirAt(list[a][0], list[a][1]), db = dirAt(list[b][0], list[b][1]);
                pairs.push([-(da[0] * db[0] + da[1] * db[1]), a, b]);       // 1 = straight on
            }
            pairs.sort(function (x, y) { return y[0] - x[0]; });
            var used = {};
            for (q = 0; q < pairs.length; q++) {
                if (pairs[q][0] < Math.cos(55 * Math.PI / 180) || used[pairs[q][1]] || used[pairs[q][2]]) continue;
                used[pairs[q][1]] = used[pairs[q][2]] = 1;
                var A = list[pairs[q][1]], B = list[pairs[q][2]];
                link[A[0] + ":" + A[1]] = B; link[B[0] + ":" + B[1]] = A;
            }
        }
        /* a corner, not a crossing: a short end piece runs straight on from a long stroke while a third stroke is left
           without a partner (N: the stem's top above the diagonal, n: above the arch) -> the long stroke turns into the
           third one, the piece goes (the corner is then moved to where the lines meet) */
        var plen = function (pt) { var L = 0; for (var k = 1; k < pt.length; k++) L += Math.sqrt(Math.pow(pt[k][0] - pt[k - 1][0], 2) + Math.pow(pt[k][1] - pt[k - 1][1], 2)); return L; };
        var shortLeaf = function (en) {
            var e = E[en[0]], other = en[1] ? e.a : e.b;
            if (e.ring || e.dead || !ends[other] || ends[other].length !== 1) return false;
            return plen(e.pts) + D[G.nodes[other].px[0]] < 4.4 * medD;
        };
        /* the straight line a stroke leaves a node along (fitted between 1.2 and 4 widths... of half widths from it) */
        var lineFrom = function (en) {
            var p = E[en[0]].pts, seq = en[1] ? p.slice().reverse() : p, L = 0, P = [], k;
            for (k = 1; k < seq.length; k++) { L += Math.sqrt(Math.pow(seq[k][0] - seq[k - 1][0], 2) + Math.pow(seq[k][1] - seq[k - 1][1], 2)); if (L >= 1.2 * medD && L <= 4 * medD) P.push(seq[k]); }
            if (P.length < 3) return null;
            var mx = 0, my = 0; for (k = 0; k < P.length; k++) { mx += P[k][0]; my += P[k][1]; } mx /= P.length; my /= P.length;
            var xx = 0, yy = 0, xy2 = 0; for (k = 0; k < P.length; k++) { var dx = P[k][0] - mx, dy = P[k][1] - my; xx += dx * dx; yy += dy * dy; xy2 += dx * dy; }
            var an = 0.5 * Math.atan2(2 * xy2, xx - yy); return { p: [mx, my], d: [Math.cos(an), Math.sin(an)] };
        };
        for (n in ends) {
            var lst = ends[n], unp = [];
            for (q = 0; q < lst.length; q++) if (!link[lst[q][0] + ":" + lst[q][1]]) unp.push(lst[q]);
            if (unp.length !== 1) continue;
            for (q = 0; q < lst.length; q++) {
                var A2 = lst[q], B2 = link[A2[0] + ":" + A2[1]];
                if (!B2 || !shortLeaf(A2) || shortLeaf(B2)) continue;
                /* only when the piece's tip is where the long stroke and the third one meet (N's stem top: yes; R's
                   lower stem, a k's stem: no, the leg's line is far from their tips) */
                var LB = lineFrom(B2), LU = lineFrom(unp[0]);
                if (!LB || !LU) continue;
                var dB = dirAt(B2[0], B2[1]), dU = dirAt(unp[0][0], unp[0][1]);
                if (dB[0] * dU[0] + dB[1] * dU[1] < Math.cos(65 * Math.PI / 180)) continue;      // (not sharp: a branch, like the n's arch)
                var dn = LB.d[0] * LU.d[1] - LB.d[1] * LU.d[0];
                if (Math.abs(dn) < 0.05) continue;
                var tt2 = ((LU.p[0] - LB.p[0]) * LU.d[1] - (LU.p[1] - LB.p[1]) * LU.d[0]) / dn, XX = [LB.p[0] + LB.d[0] * tt2, LB.p[1] + LB.d[1] * tt2];
                var eA = E[A2[0]], tipN = G.nodes[A2[1] ? eA.a : eA.b];
                if (Math.sqrt(Math.pow(XX[0] - tipN.x, 2) + Math.pow(XX[1] - tipN.y, 2)) > 1.6 * medD) continue;
                delete link[A2[0] + ":" + A2[1]]; delete link[B2[0] + ":" + B2[1]];
                E[A2[0]].dead = true;
                (G.cornerPts = G.cornerPts || []).push([G.nodes[n].x, G.nodes[n].y]);
                link[B2[0] + ":" + B2[1]] = unp[0]; link[unp[0][0] + ":" + unp[0][1]] = B2;
                cornerLink[B2[0] + ":" + B2[1]] = cornerLink[unp[0][0] + ":" + unp[0][1]] = 1;
                break;
            }
        }
        var done = {};
        for (q = 0; q < E.length; q++) if (E[q].dead) done[q] = 1;
        var walk = function (ei, side, closedStart) {
            var pts = [], via = [], freeStart = !link[ei + ":" + side], startNode = side ? E[ei].b : E[ei].a, cur = ei, s = side, guard = 0;
            while (guard++ < 1000) {
                done[cur] = 1;
                var p = E[cur].pts, seq = s ? p.slice().reverse() : p.slice();
                if (pts.length) {
                    seq = seq.slice(1);
                    var jn = s ? E[cur].b : E[cur].a, jc = jn >= 0 ? [G.nodes[jn].x, G.nodes[jn].y] : null, jr = jn >= 0 ? 1.4 * D[G.nodes[jn].px[0]] : 0;
                    if (jc && !cornerLink[cur + ":" + s]) {
                        var dj = function (q2) { return Math.sqrt(Math.pow(q2[0] - jc[0], 2) + Math.pow(q2[1] - jc[1], 2)); };
                        while (pts.length > 2 && dj(pts[pts.length - 1]) < jr) pts.pop();
                        while (seq.length > 2 && dj(seq[0]) < jr) seq.shift();
                    }
                }
                pts = pts.concat(seq);
                var other = s ? 0 : 1, nx = link[cur + ":" + other];
                if (!nx || done[nx[0]]) { var endNode = other ? E[cur].b : E[cur].a; return { pts: pts, via: via, closed: !!(nx && done[nx[0]] && nx[0] === ei && closedStart), a: startNode, b: endNode, freeA: freeStart, freeB: !nx }; }
                via.push(other ? E[cur].b : E[cur].a);
                cur = nx[0]; s = nx[1];
            }
            return { pts: pts, via: via, closed: false, a: startNode, b: -1, freeA: freeStart, freeB: true };
        };
        for (q = 0; q < E.length; q++) if (!done[q] && !E[q].ring) { if (!link[q + ":0"]) P.push(walk(q, 0)); else if (!link[q + ":1"]) P.push(walk(q, 1)); }
        for (q = 0; q < E.length; q++) if (!done[q] && !E[q].ring) P.push(walk(q, 0, true));
        for (q = 0; q < E.length; q++) if (E[q].ring) { done[q] = 1; var rp = E[q].pts.slice(); P.push({ pts: rp, closed: true, via: [] }); }
        /* a stroke that ends at a junction: straight into the junction's centre, without the bend the skeleton has there */
        for (q = 0; q < P.length; q++) {
            var pj = P[q]; if (pj.closed || pj.pts.length < 3) continue;
            var into = function (atStart, node) {
                if (node < 0 || !G.nodes[node]) return;
                var nd = G.nodes[node], c = [nd.x, nd.y], r = 1.2 * D[nd.px[0]], p = atStart ? pj.pts.slice().reverse() : pj.pts.slice();
                var dd = function (z) { return Math.sqrt(Math.pow(z[0] - c[0], 2) + Math.pow(z[1] - c[1], 2)); };
                while (p.length > 2 && dd(p[p.length - 1]) < r) p.pop();
                p.push(c);
                pj.pts = atStart ? p.reverse() : p;
            };
            var dg = {}; for (var z2 = 0; z2 < E.length; z2++) if (!E[z2].ring && !E[z2].dead) { dg[E[z2].a] = (dg[E[z2].a] || 0) + 1; dg[E[z2].b] = (dg[E[z2].b] || 0) + 1; }
            if (pj.a >= 0 && (dg[pj.a] || 0) >= 3) into(true, pj.a);
            if (pj.b >= 0 && (dg[pj.b] || 0) >= 3) into(false, pj.b);
        }
        /* a stroke's end as a designer has it: the skeleton bends near an end (towards a corner of a slanted cut, into a
           junction), so the end goes on from the longest straight piece that reaches (nearly) to it, in its direction;
           that piece's points go to the middle between its edges first (the skeleton runs up to a pixel off), and a
           piece within 12 degrees of level / upright is made so (a t's foot, a stem). null: no straight piece */
        var deg = {}; for (q = 0; q < E.length; q++) if (!E[q].ring && !E[q].dead) { deg[E[q].a] = (deg[E[q].a] || 0) + 1; deg[E[q].b] = (deg[E[q].b] || 0) + 1; }
        var wR = 2 * medD;
        var ins = function (x, y) { var xi = Math.round(x), yi = Math.round(y); return xi >= 0 && yi >= 0 && xi < W && yi < R.H && !!R.bin[yi * W + xi]; };
        var reach = function (x, y, dx, dy, mx) { var s = 0; while (s < mx && ins(x + dx * (s + 0.25), y + dy * (s + 0.25))) s += 0.25; return s; };
        var endFit = function (pts, atStart, maxS, minLen, free) {
            var p0 = atStart ? pts.slice().reverse() : pts.slice(), p = [p0[0]], n, k, acc = [], L = 0;
            for (k = 1; k < p0.length; k++) {          // (1 px apart: the points jump across a junction)
                var sx = p0[k][0] - p0[k - 1][0], sy = p0[k][1] - p0[k - 1][1], ns = Math.max(1, Math.round(Math.sqrt(sx * sx + sy * sy)));
                for (var k8 = 1; k8 <= ns; k8++) p.push([p0[k - 1][0] + sx * k8 / ns, p0[k - 1][1] + sy * k8 / ns]);
            }
            n = p.length;
            acc[n - 1] = 0; for (k = n - 2; k >= 0; k--) { L += Math.sqrt(Math.pow(p[k][0] - p[k + 1][0], 2) + Math.pow(p[k][1] - p[k + 1][1], 2)); acc[k] = L; }
            var res = { p: p, acc: acc, n: n, L: L, line: null };
            /* (how wide the shape is across each point: a piece that runs where two strokes merge is no stroke end) */
            var wide = [];
            for (k = 0; k < n; k++) { var dk = nrm(sub(p[Math.min(n - 1, k + 3)], p[Math.max(0, k - 3)])); wide.push(reach(p[k][0], p[k][1], -dk[1], dk[0], 2 * wR) + reach(p[k][0], p[k][1], dk[1], -dk[0], 2 * wR)); }
            /* (a free end may skip the skeleton's bend into the cut: where the largest circle inside shrinks) */
            var s0 = 0;
            if (free) {
                var dv = [], lo = [];
                for (k = 0; k < n; k++) { dv.push(D[Math.round(p[k][1]) * W + Math.round(p[k][0])] || 0); if (acc[k] >= 0.8 * wR && acc[k] <= 1.6 * wR) lo.push(dv[k]); }
                var Dl = lo.length ? median(lo) : Math.max.apply(null, dv), e0 = n - 1;
                while (e0 > 2 && dv[e0] < 0.85 * Dl) e0--;
                maxS = Math.max(maxS, n - 1 - e0 + 0.1 * wR); res.e0 = e0;
            }
            var lim = Math.max(1, 0.05 * wR), best = null, s, e, j;
            for (s = s0; s <= s0 + maxS && n - 1 - s > 2; s++) {
                /* (the line of the piece's last bit, then back as far as the points stay on it: a fitted line would lean
                   into the curve before it) */
                e = n - 1 - s; var a2 = e; while (a2 > 0 && acc[a2] - acc[e] < 0.5 * wR) a2--;
                if (a2 >= e - 1) continue;
                var an2 = lineFit(p, a2, e); if (an2.dev > lim) continue;
                j = a2; while (j > 0 && Math.abs((p[j - 1][0] - an2.c[0]) * an2.d[1] - (p[j - 1][1] - an2.c[1]) * an2.d[0]) <= lim) j--;
                while (j < a2 && bent(p, j, e) > 6) j = Math.min(a2, j + Math.max(1, Math.round(0.1 * wR)));
                if (bent(p, j, e) > 6) continue;
                var len = acc[j] - acc[e], score = len - 1.2 * (s - s0);
                if (median(wide.slice(j, e + 1)) > 1.25 * wR) continue;
                if (!best || score > best.score) best = { s: s, e: e, j: j, len: len, score: score };
            }
            if (!best || best.len < minLen) return res;
            var fl = lineFit(p, best.j, best.e), Nn = [-fl.d[1], fl.d[0]], cen = [], wd = [];
            for (k = best.j; k <= best.e; k++) {
                var l2 = reach(p[k][0], p[k][1], Nn[0], Nn[1], 2 * wR), r2 = reach(p[k][0], p[k][1], -Nn[0], -Nn[1], 2 * wR);
                wd.push(l2 + r2); cen.push([p[k][0] + Nn[0] * (l2 - r2) / 2, p[k][1] + Nn[1] * (l2 - r2) / 2]);
            }
            var mw = median(wd), good = cen.filter(function (z, i3) { return Math.abs(wd[i3] - mw) <= 0.12 * mw; });
            /* (the line of its last two thirds: the first may still lean into the curve before it - a t's foot) */
            var G2 = good.length >= 6 ? good : cen, t1 = Math.floor(G2.length / 3);
            var fT = G2.length - t1 >= 3 ? lineFit(G2, t1, G2.length - 1) : lineFit(G2, 0, G2.length - 1);
            if (fT.d[0] * fl.d[0] + fT.d[1] * fl.d[1] > 0.85) fl = fT;
            var ax3 = Math.abs(fl.d[0]) > Math.abs(fl.d[1]) ? 0 : 1, tilt = Math.abs(fl.d[1 - ax3]), level = tilt < Math.sin(12 * Math.PI / 180);
            if (level && tilt > 1e-9) {
                var tail2 = G2.slice(Math.floor(G2.length / 2)), mo = 0;
                for (k = 0; k < tail2.length; k++) mo += tail2[k][1 - ax3]; mo /= tail2.length;
                fl = { c: ax3 === 0 ? [fl.c[0], mo] : [mo, fl.c[1]], d: ax3 === 0 ? [fl.d[0] < 0 ? -1 : 1, 0] : [0, fl.d[1] < 0 ? -1 : 1], dev: fl.dev };
            }
            res.line = fl; res.cutAt = best.e; res.len = best.len; res.S0 = onLine(fl, p[best.e]);
            /* (a piece that still turns at its end as before it - a c's end - goes on round as it turns, from its own
               last point; one whose end only turns is the skeleton's bend into the cut) */
            if (G2.length >= 12 && !level) {
                var t2 = Math.floor(2 * G2.length / 3), hA = lineFit(G2, t1, t2), hB = lineFit(G2, t2, G2.length - 1);
                var th3 = Math.atan2(hA.d[0] * hB.d[1] - hA.d[1] * hB.d[0], hA.d[0] * hB.d[0] + hA.d[1] * hB.d[1]);
                if (Math.abs(th3) > 3 * Math.PI / 180) {
                    var kw = th3 / Math.max(1, (acc[best.j] - acc[best.e]) / 3), jq = best.j, kp = 0;
                    while (jq > 0 && acc[jq] - acc[best.j] < wR) jq--;
                    if (best.j - jq >= 8) {
                        var mq = Math.round((jq + best.j) / 2), pA = lineFit(p, jq, mq), pB = lineFit(p, mq, best.j);
                        kp = Math.atan2(pA.d[0] * pB.d[1] - pA.d[1] * pB.d[0], pA.d[0] * pB.d[0] + pA.d[1] * pB.d[1]) / Math.max(1, (acc[jq] - acc[best.j]) / 2);
                    }
                    if (kp * kw > 0 && Math.abs(kp) >= 0.4 * Math.abs(kw)) { res.kap = Math.max(-Math.abs(kp) * 1.5, Math.min(Math.abs(kp) * 1.5, kw)); res.tdir = Math.atan2(hB.d[1], hB.d[0]) + th3 / 2; res.S0 = p[best.e]; }
                    else {
                        var pm = Math.round((best.j + best.e) / 2), fh = lineFit(p, best.j, pm);
                        res.line = fh; res.cutAt = pm; res.S0 = onLine(fh, p[pm]);
                    }
                }
            }
            return res;
        };
        /* free ends (a leaf: one stroke there) reach out to the edge; a stroke curved up to its end goes on along its
           tangent there */
        for (q = 0; q < P.length; q++) {
            var path = P[q]; if (path.closed || path.pts.length < 2) continue;
            var ext = function (atStart) {
                var f = endFit(path.pts, atStart, 0.3 * wR, 0.35 * wR, true), p = f.p, acc = f.acc, n = f.n, T, S0, cutAt;
                if (f.line && f.kap === undefined) { T = f.line.d; S0 = f.S0; cutAt = f.cutAt; }
                else if (f.line) {
                    var an4 = f.tdir, cur4 = f.S0, arc4 = [cur4];
                    if (TRACE) TRACE.push({ ext: atStart, kapArc: f.kap, tdir: f.tdir, from: f.S0 });
                    for (var st4 = 0; st4 < 4 * wR; st4++) { var nx4 = [cur4[0] + Math.cos(an4), cur4[1] + Math.sin(an4)]; if (!ins(nx4[0], nx4[1])) break; arc4.push(nx4); cur4 = nx4; an4 += f.kap; }
                    p = p.slice(0, f.cutAt).concat(arc4).concat([[cur4[0] + Math.cos(an4) * 0.5, cur4[1] + Math.sin(an4) * 0.5]]);
                    path.pts = atStart ? p.reverse() : p;
                    return;
                } else {
                    cutAt = n - 1; while (cutAt > 2 && acc[cutAt] < 0.3 * wR) cutAt--;
                    if (f.e0 !== undefined && f.e0 > 2 && f.e0 < cutAt) cutAt = f.e0;          // (before the skeleton's bend into the cut)
                    var i1 = cutAt; while (i1 > 0 && acc[i1] - acc[cutAt] < 0.4 * wR) i1--;
                    var fq = cutAt - i1 >= 3 ? lineFit(p, i1, cutAt) : null, c1 = sub(p[cutAt], p[Math.max(0, cutAt - 3)]);
                    var an3 = fq ? Math.atan2(fq.d[1], fq.d[0]) : Math.atan2(c1[1], c1[0]);
                    /* (round its curve only where the stroke has turned evenly for a while - a c's end; after a bend it
                       goes on straight - a t's foot - level / upright when it nearly is) */
                    var curv = function (a, b) { var m = Math.round((a + b) / 2), A1 = lineFit(p, a, m), B1 = lineFit(p, m, b); return Math.atan2(A1.d[0] * B1.d[1] - A1.d[1] * B1.d[0], A1.d[0] * B1.d[0] + A1.d[1] * B1.d[1]) / Math.max(1, (acc[a] - acc[b]) / 2); };
                    var i2 = i1; while (i2 > 0 && acc[i2] - acc[cutAt] < 1.2 * wR) i2--;
                    var kA = i1 - i2 >= 8 ? curv(i2, i1) : 0, kB = cutAt - i1 >= 8 ? curv(i1, cutAt) : 0;
                    var kap = kA * kB > 0 && Math.min(Math.abs(kA), Math.abs(kB)) >= 0.6 * Math.max(Math.abs(kA), Math.abs(kB)) ? (kA + kB) / 2 : 0;
                    if (!kap) { var sn = Math.round(an3 / (Math.PI / 2)) * (Math.PI / 2); if (Math.abs(an3 - sn) < 12 * Math.PI / 180) an3 = sn; }
                    else an3 += kap * (acc[i1] - acc[cutAt]) / 2;
                    var arc = [p[cutAt]], cur3 = p[cutAt], turned = 0;
                    for (var st3 = 0; st3 < 4 * wR; st3++) {
                        var nx3 = [cur3[0] + Math.cos(an3), cur3[1] + Math.sin(an3)];
                        if (!ins(nx3[0], nx3[1])) break;
                        arc.push(nx3); cur3 = nx3;
                        if (Math.abs(turned) < Math.PI / 3) { an3 += kap; turned += kap; }
                    }
                    var lastA = [cur3[0] + Math.cos(an3) * 0.5, cur3[1] + Math.sin(an3) * 0.5];
                    if (TRACE) TRACE.push({ ext: atStart, arc: true, n: n, cutAt: cutAt, an: an3, kap: kap, from: p[cutAt], to: lastA, arcN: arc.length });
                    p = p.slice(0, cutAt).concat(arc).concat([lastA]);
                    path.pts = atStart ? p.reverse() : p;
                    return;
                }
                var e1 = reach(S0[0], S0[1], T[0], T[1], 3 * wR), E2 = [S0[0] + T[0] * (e1 + 0.5), S0[1] + T[1] * (e1 + 0.5)];
                if (TRACE) TRACE.push({ ext: atStart, n: n, len: f.len, T: T, S0: S0, E: E2, kap: f.kap });
                p = p.slice(0, cutAt).concat([S0, E2]);
                path.pts = atStart ? p.reverse() : p;
            };
            if (path.a >= 0 && deg[path.a] === 1) ext(true);
            if (path.b >= 0 && deg[path.b] === 1) ext(false);
        }
        /* the order a designer draws in (the user's letters): a branch starts where it leaves its stroke (n's arch);
           a stroke that comes back into itself starts at its free end (P); a straight one goes left to right or
           bottom to top, a curved one from its upper end; a ring goes from its top, counter-clockwise */
        for (q = 0; q < P.length; q++) {
            var pp = P[q], vv = pp.via || [], rv = false, pa = pp.pts;
            if (pp.closed) {
                var ar = 0; for (var k3 = 0; k3 < pa.length; k3++) { var u1 = pa[k3], u2 = pa[(k3 + 1) % pa.length]; ar += u1[0] * u2[1] - u2[0] * u1[1]; }
                if (ar > 0) pa.reverse();
                continue;
            }
            var la = pp.a >= 0 && deg[pp.a] === 1, lb = pp.b >= 0 && deg[pp.b] === 1;
            if (!la && lb) rv = vv.indexOf(pp.a) >= 0;
            else if (la && !lb) rv = vv.indexOf(pp.b) < 0;
            else {
                var p0 = pa[0], p1 = pa[pa.length - 1], ch = 0, cx = p1[0] - p0[0], cy = p1[1] - p0[1], cl = Math.sqrt(cx * cx + cy * cy) || 1;
                for (k3 = 1; k3 < pa.length - 1; k3++) ch = Math.max(ch, Math.abs(cx * (pa[k3][1] - p0[1]) - cy * (pa[k3][0] - p0[0])) / cl);
                if (ch < 0.15 * medD) rv = Math.abs(cx) > Math.abs(cy) ? cx < 0 : cy > 0;
                else rv = Math.abs(cy) < 0.6 * medD ? cx < 0 : cy < 0;
            }
            if (rv) { pa.reverse(); var ta = pp.a; pp.a = pp.b; pp.b = ta; }
            pp.startJ = pp.a >= 0 && deg[pp.a] >= 2 && vv.indexOf(pp.a) < 0; pp.endJ = pp.b >= 0 && deg[pp.b] >= 2 && vv.indexOf(pp.b) < 0;
        }
        /* a branch starts (or ends) exactly on the stroke it leaves: a straight branch (a k's arm and leg, a y's arm)
           goes on in its own direction up to that stroke's line, a curved one (n's arch) goes onto it the shortest way.
           Twice round: a k's leg ends on the arm, which is straight only after its own turn */
        var strokeLine = function (Q, c, tight) {
            var near = []; for (var k4 = 0; k4 < Q.pts.length; k4++) if (Math.sqrt(Math.pow(Q.pts[k4][0] - c[0], 2) + Math.pow(Q.pts[k4][1] - c[1], 2)) < 2.5 * medD) near.push(Q.pts[k4]);
            if (near.length < 6) return null;
            var f = lineFit(near, 0, near.length - 1);
            if (f.dev <= (tight ? 0.08 : 0.2) * medD) return f;
            if (tight) return null;
            /* (a curved stroke there - an R's bowl where the leg leaves it: its tangent close by) */
            near = near.filter(function (z) { return Math.sqrt(Math.pow(z[0] - c[0], 2) + Math.pow(z[1] - c[1], 2)) < 1.3 * medD; });
            if (near.length < 5) return null;
            f = lineFit(near, 0, near.length - 1);
            return f.dev > 0.25 * medD ? null : f;
        };
        var onto = function (pp, atStart, last) {
            var nd = atStart ? pp.a : pp.b; if (nd < 0 || deg[nd] === 1 || !G.nodes[nd] || pp[atStart ? "doneA" : "doneB"]) return;
            var c = [G.nodes[nd].x, G.nodes[nd].y];
            for (var z = 0; z < P.length; z++) {
                var Q = P[z]; if (Q === pp || (Q.via || []).indexOf(nd) < 0) continue;
                var QL = strokeLine(Q, c, !last); if (!QL) continue;
                var f = endFit(pp.pts, atStart, 4 * medD, 1.0 * wR);
                if (TRACE) TRACE.push({ onto: atStart, last: last, c: c, line: f.line, len: f.len, S0: f.S0, QL: QL });
                if (f.line && f.kap === undefined) {
                    var d = f.line.d, dn = d[0] * QL.d[1] - d[1] * QL.d[0];
                    if (Math.abs(dn) > Math.sin(20 * Math.PI / 180)) {
                        var tt = ((QL.c[0] - f.S0[0]) * QL.d[1] - (QL.c[1] - f.S0[1]) * QL.d[0]) / dn, X = [f.S0[0] + d[0] * tt, f.S0[1] + d[1] * tt];
                        var xi5 = Math.round(X[0]), yi5 = Math.round(X[1]), inX = xi5 >= 0 && yi5 >= 0 && xi5 < W && yi5 < R.H && !!R.bin[yi5 * W + xi5];
                        if (tt > -0.5 * wR && inX && Math.sqrt(Math.pow(X[0] - c[0], 2) + Math.pow(X[1] - c[1], 2)) < 5 * medD) {
                            var p2 = f.p.slice(0, f.cutAt).concat([f.S0, X]);
                            pp.pts = atStart ? p2.reverse() : p2;
                            pp[atStart ? "doneA" : "doneB"] = true;
                            return;
                        }
                    }
                }
                if (!last) return;
                var e = atStart ? pp.pts[0] : pp.pts[pp.pts.length - 1], np = onLine(QL, e);
                if (atStart) pp.pts[0] = np; else pp.pts[pp.pts.length - 1] = np;
                pp[atStart ? "doneA" : "doneB"] = true;
                return;
            }
        };
        for (var round = 0; round < 2; round++) for (q = 0; q < P.length; q++) if (!P[q].closed) { onto(P[q], true, round === 1); onto(P[q], false, round === 1); }
        return P;
    }
    /* 5: fit: cut at corners, few cubics per run (Schneider), then the needless smooth points go */
    function resample(pts, step, closed) {
        var r = [pts[0]], acc = 0, q, a = pts[0], src = closed ? pts.concat([pts[0]]) : pts;
        for (q = 1; q < src.length; q++) {
            var b = src[q], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy);
            while (acc + l >= step && l > 0) { var t = (step - acc) / l; a = [a[0] + dx * t, a[1] + dy * t]; r.push(a); dx = b[0] - a[0]; dy = b[1] - a[1]; l = Math.sqrt(dx * dx + dy * dy); acc = 0; }
            acc += l; a = b;
        }
        if (!closed) { var last = pts[pts.length - 1], pl = r[r.length - 1]; if (Math.abs(pl[0] - last[0]) + Math.abs(pl[1] - last[1]) > 0.3) r.push(last); else r[r.length - 1] = last; }
        else if (r.length > 2) { var f = r[0], lr = r[r.length - 1]; if (Math.abs(f[0] - lr[0]) + Math.abs(f[1] - lr[1]) < step * 0.5) r.pop(); }
        return r;
    }
    function smooth(pts, closed, passes) {
        var n = pts.length, q, k;
        for (k = 0; k < 2 * passes; k++) {
            var r = [];
            for (q = 0; q < n; q++) {
                if (!closed && (q === 0 || q === n - 1)) { r.push(pts[q]); continue; }
                var a = pts[(q - 1 + n) % n], b = pts[q], c = pts[(q + 1) % n], f = k % 2 ? -0.53 : 0.5;
                r.push([b[0] + f * ((a[0] + c[0]) / 2 - b[0]), b[1] + f * ((a[1] + c[1]) / 2 - b[1])]);
            }
            pts = r;
        }
        return pts;
    }
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
    function nrm(a) { var l = Math.sqrt(a[0] * a[0] + a[1] * a[1]) || 1; return [a[0] / l, a[1] / l]; }
    function bez(Q, t) { var m = 1 - t; return [m * m * m * Q[0][0] + 3 * m * m * t * Q[1][0] + 3 * m * t * t * Q[2][0] + t * t * t * Q[3][0], m * m * m * Q[0][1] + 3 * m * m * t * Q[1][1] + 3 * m * t * t * Q[2][1] + t * t * t * Q[3][1]]; }
    function fitCubic(pts, t1, t2, tol, out, depth) {
        var n = pts.length, q;
        if (n < 2) return;
        var a = pts[0], b = pts[n - 1], ch = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
        if (n === 2) { out.push([a, [a[0] + t1[0] * ch / 3, a[1] + t1[1] * ch / 3], [b[0] + t2[0] * ch / 3, b[1] + t2[1] * ch / 3], b]); return; }
        var u = [0], L = 0;
        for (q = 1; q < n; q++) { L += Math.sqrt(Math.pow(pts[q][0] - pts[q - 1][0], 2) + Math.pow(pts[q][1] - pts[q - 1][1], 2)); u.push(L); }
        for (q = 0; q < n; q++) u[q] /= L || 1;
        var Q, maxE = 0, split = Math.floor(n / 2);
        for (var it = 0; it < 4; it++) {
            var c11 = 0, c12 = 0, c22 = 0, x1 = 0, x2 = 0;
            for (q = 0; q < n; q++) {
                var t = u[q], m = 1 - t, b0 = m * m * m, b1 = 3 * m * m * t, b2 = 3 * m * t * t, b3 = t * t * t;
                var A1 = [t1[0] * b1, t1[1] * b1], A2 = [t2[0] * b2, t2[1] * b2];
                c11 += A1[0] * A1[0] + A1[1] * A1[1]; c12 += A1[0] * A2[0] + A1[1] * A2[1]; c22 += A2[0] * A2[0] + A2[1] * A2[1];
                var tx = pts[q][0] - (a[0] * (b0 + b1) + b[0] * (b2 + b3)), ty = pts[q][1] - (a[1] * (b0 + b1) + b[1] * (b2 + b3));
                x1 += tx * A1[0] + ty * A1[1]; x2 += tx * A2[0] + ty * A2[1];
            }
            var det = c11 * c22 - c12 * c12, al = ch / 3, be = ch / 3;
            if (Math.abs(det) > 1e-9) { al = (x1 * c22 - x2 * c12) / det; be = (c11 * x2 - c12 * x1) / det; }
            if (!(al > ch * 1e-3) || !(be > ch * 1e-3) || al > ch * 2 || be > ch * 2) { al = be = ch / 3; }
            Q = [a, [a[0] + t1[0] * al, a[1] + t1[1] * al], [b[0] + t2[0] * be, b[1] + t2[1] * be], b];
            maxE = 0;
            for (q = 1; q < n - 1; q++) {
                /* closest parameter (one Newton step) and the error */
                var tt = u[q], p = bez(Q, tt), m2 = 1 - tt;
                var d1 = [3 * m2 * m2 * (Q[1][0] - Q[0][0]) + 6 * m2 * tt * (Q[2][0] - Q[1][0]) + 3 * tt * tt * (Q[3][0] - Q[2][0]), 3 * m2 * m2 * (Q[1][1] - Q[0][1]) + 6 * m2 * tt * (Q[2][1] - Q[1][1]) + 3 * tt * tt * (Q[3][1] - Q[2][1])];
                var dd = d1[0] * d1[0] + d1[1] * d1[1];
                if (dd > 1e-12) { u[q] = Math.max(0, Math.min(1, tt - ((p[0] - pts[q][0]) * d1[0] + (p[1] - pts[q][1]) * d1[1]) / dd)); p = bez(Q, u[q]); }
                var e = Math.sqrt(Math.pow(p[0] - pts[q][0], 2) + Math.pow(p[1] - pts[q][1], 2));
                if (e > maxE) { maxE = e; split = q; }
            }
            if (maxE <= tol) break;
        }
        if (maxE <= tol || depth > 10 || n < 6) { out.push(Q); return; }
        split = Math.max(2, Math.min(n - 3, split));
        var tc = nrm(sub(pts[Math.min(n - 1, split + 2)], pts[Math.max(0, split - 2)]));
        fitCubic(pts.slice(0, split + 1), t1, [-tc[0], -tc[1]], tol, out, depth + 1);
        fitCubic(pts.slice(split), tc, t2, tol, out, depth + 1);
    }
    function tangentAt(pts, q, dir, span) {        // direction along pts from q (dir +1 / -1) over span points
        var n = pts.length, k = Math.max(0, Math.min(n - 1, q + dir * span));
        if (k === q) k = Math.max(0, Math.min(n - 1, q + dir));
        return nrm(sub(pts[k], pts[q]));
    }
    function fitPath(path, medD, step, R, CE, S) {
        var pts = smooth(resample(path.pts, step, path.closed), path.closed, 2), n = pts.length, q;
        if (n < 2) return null;
        /* corners: where the line turns sharply over about half a stroke width */
        var span = Math.max(2, Math.round(0.55 * medD / step)), turn = [], cs = [];
        for (q = 0; q < n; q++) {
            if (!path.closed && (q < span || q > n - 1 - span)) { turn.push(0); continue; }
            var a = pts[(q - span + n) % n], b = pts[q], c = pts[(q + span) % n], u = nrm(sub(b, a)), v = nrm(sub(c, b));
            turn.push(Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))));
        }
        /* a corner only where the letter's outline has one: where a spur into it was pruned or strokes were re-joined
           (an arch turns as much, but its outline is round: no spur) */
        var nearCE = function (q2) { for (var z = 0; z < CE.length; z++) if (Math.sqrt(Math.pow(pts[q2][0] - CE[z][0], 2) + Math.pow(pts[q2][1] - CE[z][1], 2)) < 2.5 * medD) return true; return false; };
        for (q = 0; q < n; q++) {
            if (turn[q] < 38 * Math.PI / 180) continue;
            if (!nearCE(q)) continue;
            var best = true;
            for (var k = -span; k <= span; k++) { var j = path.closed ? (q + k + n) % n : q + k; if (j < 0 || j >= n || j === q) continue; if (turn[j] > turn[q] || (turn[j] === turn[q] && j < q)) { best = false; break; } }
            if (best) cs.push(q);
        }
        /* a corner between two straight strokes sits where their centre lines meet (the N's top, an L's elbow):
           the skeleton rounds it off, a pen corner with a miter join fills it */
        var drop = {}, wrap = function (k) { return path.closed ? (k + n) % n : k; };
        var lineFit = function (P) {
            var mx = 0, my = 0, k; for (k = 0; k < P.length; k++) { mx += P[k][0]; my += P[k][1]; } mx /= P.length; my /= P.length;
            var xx = 0, yy = 0, xy2 = 0; for (k = 0; k < P.length; k++) { var dx = P[k][0] - mx, dy = P[k][1] - my; xx += dx * dx; yy += dy * dy; xy2 += dx * dy; }
            var an = 0.5 * Math.atan2(2 * xy2, xx - yy), d = [Math.cos(an), Math.sin(an)], dev = 0;
            for (k = 0; k < P.length; k++) dev = Math.max(dev, Math.abs((P[k][0] - mx) * d[1] - (P[k][1] - my) * d[0]));
            return { p: [mx, my], d: d, dev: dev };
        };
        /* corners close together (a junction bends the skeleton between them) are one corner */
        var gap = Math.max(3, Math.round(3 * medD / step)), grp = [], cg = null;
        for (q = 0; q < cs.length; q++) { if (cg && cs[q] - cg[cg.length - 1] <= gap) cg.push(cs[q]); else { cg = [cs[q]]; grp.push(cg); } }
        if (path.closed && grp.length > 1) { var gl = grp[grp.length - 1], g0 = grp[0]; if ((g0[0] - gl[gl.length - 1] + n) % n <= gap) { grp[0] = gl.concat(g0); grp.pop(); } }
        var ncs = [];
        for (q = 0; q < grp.length; q++) {
            var G0 = grp[q], c1 = G0[0], c2 = G0[G0.length - 1], pg = grp[(q - 1 + grp.length) % grp.length], ng = grp[(q + 1) % grp.length];
            var span12 = (c2 - c1 + n) % n;
            var lo = path.closed ? (grp.length > 1 ? (c1 - pg[pg.length - 1] + n) % n : n - span12) : c1 - (q > 0 ? pg[pg.length - 1] : 0);
            var hi = path.closed ? (grp.length > 1 ? (ng[0] - c2 + n) % n : n - span12) : (q < grp.length - 1 ? ng[0] : n - 1) - c2;
            var s1 = Math.max(2, Math.round(0.8 * medD / step)), s2 = Math.max(s1 + 3, Math.round(2.6 * medD / step));
            var A = [], B = [], fa, fb, pass2, ok = false, X = null;
            for (pass2 = 0; pass2 < 2; pass2++) {
                A = []; B = [];
                for (k = s1; k <= s2; k++) { if (k < lo - 2) A.push(pts[wrap(c1 - k)]); if (k < hi - 2) B.push(pts[wrap(c2 + k)]); }
                if (A.length < 3 || B.length < 3) break;
                fa = lineFit(A); fb = lineFit(B);
                if (pass2) break;
                var cosT = Math.abs(fa.d[0] * fb.d[0] + fa.d[1] * fb.d[1]), half = Math.acos(Math.min(1, cosT)) / 2, th = Math.PI / 2 - half;
                var r0 = Math.min(4 * medD, Math.max(0.8 * medD, medD / Math.tan(Math.max(0.2, th / 2))));
                s1 = Math.max(2, Math.round(r0 / step)); s2 = s1 + Math.max(3, Math.round(2 * medD / step));
            }
            if (A.length >= 3 && B.length >= 3 && fa.dev <= 0.18 * medD && fb.dev <= 0.18 * medD) {
                var den = fa.d[0] * fb.d[1] - fa.d[1] * fb.d[0];
                if (Math.abs(den) >= 0.05) {
                    var tq = ((fb.p[0] - fa.p[0]) * fb.d[1] - (fb.p[1] - fa.p[1]) * fb.d[0]) / den;
                    X = [fa.p[0] + fa.d[0] * tq, fa.p[1] + fa.d[1] * tq];
                    ok = Math.sqrt(Math.pow(X[0] - pts[c1][0], 2) + Math.pow(X[1] - pts[c1][1], 2)) <= 7 * medD;
                    var inL = function (z) { var xi = Math.round(z[0]), yi = Math.round(z[1]); return xi >= 0 && yi >= 0 && xi < R.W && yi < R.H && !!R.bin[yi * R.W + xi]; };
                    var cutFlat = false;
                    if (ok && R && inL(X)) {
                        /* (the lines meet inside, but the letter's corner is cut off well before where a sharp corner
                           would reach - an M's foot: flat as well) */
                        var da0 = nrm(sub(pts[c1], fa.p)), db0 = nrm(sub(pts[c2], fb.p)), o0 = nrm([da0[0] + db0[0], da0[1] + db0[1]]), cs0 = Math.abs(da0[0] * db0[0] + da0[1] * db0[1]);
                        var th0 = Math.acos(Math.max(-1, Math.min(1, -(da0[0] * db0[0] + da0[1] * db0[1])))), tip = medD / Math.max(0.1, Math.sin(th0 / 2)), tX = 0;
                        while (tX < tip + medD && inL([X[0] + o0[0] * (tX + 0.5), X[1] + o0[1] * (tX + 0.5)])) tX += 0.5;
                        if (th0 < 75 * Math.PI / 180 && tX < 0.6 * tip) cutFlat = true;
                    }
                    if (ok && R && (!inL(X) || cutFlat)) {
                        /* the lines meet outside the letter: its corner is cut flat (an A's top, a V's foot), so the pen
                           goes there in two corners with the flat between them, a stroke's half width inside the cut */
                        ok = false;
                        var da = nrm(sub(pts[c1], fa.p)), db = nrm(sub(pts[c2], fb.p)), o = nrm([da[0] + db[0], da[1] + db[1]]), Cc = pts[Math.round((c1 + (c1 + span12)) / 2) % n], tO = 0;
                        if (da[0] * fa.d[0] + da[1] * fa.d[1] < 0) fa.d = [-fa.d[0], -fa.d[1]];
                        if (db[0] * fb.d[0] + db[1] * fb.d[1] < 0) fb.d = [-fb.d[0], -fb.d[1]];
                        while (tO < 6 * medD && inL([Cc[0] + o[0] * (tO + 0.5), Cc[1] + o[1] * (tO + 0.5)])) tO += 0.5;
                        var Pc = [Cc[0] + o[0] * (tO - medD), Cc[1] + o[1] * (tO - medD)], ld = [-o[1], o[0]];
                        var meet = function (f) { var dd = f.d[0] * ld[1] - f.d[1] * ld[0]; if (Math.abs(dd) < 0.1) return null; var t2 = ((Pc[0] - f.p[0]) * ld[1] - (Pc[1] - f.p[1]) * ld[0]) / dd; return [f.p[0] + f.d[0] * t2, f.p[1] + f.d[1] * t2]; };
                        var Xa = meet(fa), Xb = meet(fb), c3 = c1 + 1 < n - 1 ? (span12 > 0 ? c2 : c1 + 1) : -1;
                        if (Xa && Xb && c3 > c1 && (path.closed || c3 < n - 1) && inL([(Xa[0] + Xb[0]) / 2, (Xa[1] + Xb[1]) / 2])) {
                            if (Math.sqrt(Math.pow(Xa[0] - Xb[0], 2) + Math.pow(Xa[1] - Xb[1], 2)) < 0.4 * medD) X = [(Xa[0] + Xb[0]) / 2, (Xa[1] + Xb[1]) / 2], ok = true;
                            else {
                                pts[c1] = Xa; pts[c3] = Xb; ncs.push(c1); ncs.push(c3);
                                for (k = -s1 + 1; k <= span12 + s1 - 1; k++) { var ix1 = wrap(c1 + k); if (ix1 !== c1 && ix1 !== c3 && ix1 >= 0 && ix1 < n) drop[ix1] = 1; }
                                continue;
                            }
                        }
                    }
                }
            }
            if (!ok) { ncs = ncs.concat(G0); continue; }
            pts[c1] = X; ncs.push(c1);
            for (k = -s1 + 1; k <= span12 + s1 - 1; k++) { var ix0 = wrap(c1 + k); if (ix0 !== c1 && ix0 >= 0 && ix0 < n) drop[ix0] = 1; }
        }
        cs = ncs.sort(function (x, y) { return x - y; });
        if (!path.closed) cs = cs.filter(function (x) { return x > 0 && x < n - 1; });
        /* the designer's fit (the user's own letters, 2026-10-25): every run between corners gets points only where a
           pen would put them - where a straight part turns into a curve and at the curve's extremes (handles exactly
           level / upright there) - and one smooth cubic between each two */
        /* sizes from the letter as well as from its stroke (a thin font's stroke says little about where points go) */
        var w = 2 * medD, U = Math.max(w, 0.15 * (S || 0)), tol = Math.max(0.8, 0.06 * w, 0.014 * (S || 0)), segs = [], heavy = Math.max(2, Math.min(16, Math.round(0.12 * U / step)));
        /* a branch's first bit bends towards the junction it leaves: skip it (the curve goes straight from the stroke) */
        var trimJ = function (r, atStart) { var A0 = arcs(atStart ? r : r.slice().reverse()), k5 = 1; while (k5 < r.length - 2 && A0[k5] < 0.8 * U) k5++; return atStart ? [r[0]].concat(r.slice(k5)) : r.slice(0, r.length - k5).concat([r[r.length - 1]]); };
        var runs = [], runOf = function (ix) { var r = []; for (var m = 0; m < ix.length; m++) if (m === 0 || m === ix.length - 1 || !drop[ix[m]]) r.push(pts[ix[m]]); return r; };
        if (path.closed && !cs.length) {              // a ring (O): an open path from its top round to its top, round caps
            var sm = smooth(pts, true, heavy), top = 0;
            for (q = 1; q < sm.length; q++) if (sm[q][1] < sm[top][1]) top = q;
            var ring = sm.slice(top).concat(sm.slice(0, top)); ring.push(ring[0]);
            var hz = sub(ring[Math.min(3, ring.length - 1)], ring[0]), th = [hz[0] < 0 ? -1 : 1, 0];
            designRun(ring, U, tol, th, th, segs, step);
            var res = snapAxis(toAE(segs, false)); res.cap = 2; return res;
        }
        if (path.closed) {
            for (q = 0; q < cs.length; q++) { var a0 = cs[q], b0 = cs[(q + 1) % cs.length], ix = []; for (k = a0; ; k = (k + 1) % n) { ix.push(k); if (k === b0 && ix.length > 1) break; } runs.push(runOf(ix)); }
        } else {
            var cut = [0].concat(cs).concat([n - 1]);
            for (q = 0; q < cut.length - 1; q++) { var ix2 = []; for (k = cut[q]; k <= cut[q + 1]; k++) ix2.push(k); runs.push(runOf(ix2)); }
        }
        for (q = 0; q < runs.length; q++) {
            if (runs[q].length < 2) continue;
            var rq = smooth(runs[q], false, heavy);
            if (!path.closed && q === 0 && path.startJ && rq.length > 4) rq = trimJ(rq, true);
            if (!path.closed && q === runs.length - 1 && path.endJ && rq.length > 4) rq = trimJ(rq, false);
            designRun(rq, U, tol, (!path.closed && q === 0 && path.startJ) ? "J" : null, null, segs, step);
        }
        var outp = snapAxis(toAE(segs, path.closed)); outp.cap = 1;
        return outp;
    }
    /* the best straight line through r[i..j] (principal axis): centre, direction (from i towards j), largest distance */
    function lineFit(r, i, j) {
        var n = j - i + 1, mx = 0, my = 0, k;
        for (k = i; k <= j; k++) { mx += r[k][0]; my += r[k][1]; } mx /= n; my /= n;
        var xx = 0, yy = 0, xy = 0; for (k = i; k <= j; k++) { var dx = r[k][0] - mx, dy = r[k][1] - my; xx += dx * dx; yy += dy * dy; xy += dx * dy; }
        var an = 0.5 * Math.atan2(2 * xy, xx - yy), d = [Math.cos(an), Math.sin(an)], dev = 0;
        if ((r[j][0] - r[i][0]) * d[0] + (r[j][1] - r[i][1]) * d[1] < 0) d = [-d[0], -d[1]];
        for (k = i; k <= j; k++) dev = Math.max(dev, Math.abs((r[k][0] - mx) * d[1] - (r[k][1] - my) * d[0]));
        return { c: [mx, my], d: d, dev: dev };
    }
    /* how much r[i..j] turns: the angle (degrees) between the lines of its two halves (a gentle curve keeps within a
       pixel of a line for a stroke width or more, but it turns) */
    function bent(r, i, j) {
        if (j - i < 7) return 0;
        var m = Math.round((i + j) / 2), a = lineFit(r, i, m), b = lineFit(r, m, j);
        return Math.acos(Math.max(-1, Math.min(1, Math.abs(a.d[0] * b.d[0] + a.d[1] * b.d[1])))) * 180 / Math.PI;
    }
    function onLine(f, z) { var tq = (z[0] - f.c[0]) * f.d[0] + (z[1] - f.c[1]) * f.d[1]; return [f.c[0] + f.d[0] * tq, f.c[1] + f.d[1] * tq]; }
    function arcs(r) { var a = [0]; for (var k = 1; k < r.length; k++) a.push(a[k - 1] + Math.sqrt(Math.pow(r[k][0] - r[k - 1][0], 2) + Math.pow(r[k][1] - r[k - 1][1], 2))); return a; }
    function devLine(r, i, j) {
        var a = r[i], b = r[j], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy), m = 0;
        for (var k = i + 1; k < j; k++) { var d = l < 1e-9 ? Math.sqrt(Math.pow(r[k][0] - a[0], 2) + Math.pow(r[k][1] - a[1], 2)) : Math.abs(dx * (r[k][1] - a[1]) - dy * (r[k][0] - a[0])) / l; if (d > m) m = d; }
        return m;
    }
    /* one run: straight lead-in / lead-out (a stem going into a curve), the extremes in between, one cubic each */
    function designRun(r, w, tol, tS, tE, segs, step) {
        var n = r.length, A = arcs(r), L = A[n - 1], k;
        var line = function (i, j) { segs.push([r[i], r[i], r[j], r[j]]); };
        var dataT = function (i, dir) { var j = i, s = 0; while (j + dir >= 0 && j + dir < n && s < 0.3 * w) { s += Math.sqrt(Math.pow(r[j + dir][0] - r[j][0], 2) + Math.pow(r[j + dir][1] - r[j][1], 2)); j += dir; } var d = nrm(sub(r[j], r[i])); return dir > 0 ? d : [-d[0], -d[1]]; };
        if (n < 3 || (!tS && !tE && devLine(r, 0, n - 1) <= tol)) { line(0, n - 1); return; }
        if (!tS && !tE && n > 8) {                // (a straight stroke the skeleton bends a little where it crosses another - an x)
            var fS = lineFit(r, 0, n - 1);
            if (fS.dev <= 0.6 * tol && bent(r, 0, n - 1) < 3) { r = r.slice(); r[0] = onLine(fS, r[0]); r[n - 1] = onLine(fS, r[n - 1]); line(0, n - 1); return; }
        }
        if (tS === "J") {                         // a branch (n's arch): no straight lead-in, it leaves its stroke in one curve
            if (devLine(r, 0, n - 1) <= tol) { line(0, n - 1); return; }
            var jj = 0, ss = 0; while (jj < n - 1 && ss < 0.6 * w) { ss += Math.sqrt(Math.pow(r[jj + 1][0] - r[jj][0], 2) + Math.pow(r[jj + 1][1] - r[jj][1], 2)); jj++; }
            tS = nrm(sub(r[jj], r[0]));
        }
        var k1 = 0, k2 = n - 1, f1 = null, f2 = null, fl;
        /* a straight lead-in / lead-out: as long as the points keep close to their best line (its ends go onto it) */
        /* (from the line of the end's own last bit, refitted on what it reaches: a line fitted to it all would lean
           into the curve that follows, a t's level foot would tilt) */
        var dl = function (f, z) { return Math.abs((z[0] - f.c[0]) * f.d[1] - (z[1] - f.c[1]) * f.d[0]); };
        var lead = function (fromStart) {
            var at = function (m) { return fromStart ? m : n - 1 - m; }, len = function (m) { return fromStart ? A[m] : L - A[m]; }, m0 = 0, f, m, got = 0;
            while (m0 < n - 1 && (len(at(m0)) < 0.5 * w || m0 < 3)) m0++;
            if (m0 >= n - 1) return null;
            f = fromStart ? lineFit(r, 0, m0) : lineFit(r, n - 1 - m0, n - 1);
            if (f.dev > tol * 0.5) return null;
            for (var it = 0; it < 3; it++) {
                for (m = 1; m < n; m++) if (dl(f, r[at(m)]) > tol * 0.6) break;
                got = m - 1;
                while (got > 2 && (fromStart ? bent(r, 0, got) : bent(r, n - 1 - got, n - 1)) > 5) got--;
                if (got < 2) return null;
                f = fromStart ? lineFit(r, 0, got) : lineFit(r, n - 1 - got, n - 1);
            }
            while (got > 0 && len(at(got)) > L) got--;
            return len(at(got)) >= 0.8 * w ? { k: at(got), f: f } : null;
        };
        if (!tS) { fl = lead(true); if (fl) { k1 = fl.k; f1 = fl.f; } }
        if (!tE) { fl = lead(false); if (fl) { k2 = fl.k; f2 = fl.f; } }
        if (f1 || f2) { r = r.slice(); if (f1) { r[0] = onLine(f1, r[0]); r[k1] = onLine(f1, r[k1]); } if (f2 && k2 > k1) { r[n - 1] = onLine(f2, r[n - 1]); r[k2] = onLine(f2, r[k2]); } }
        if (TRACE) TRACE.push({ n: n, L: Math.round(L), k1: k1, A1: Math.round(A[k1]), k2: k2, A2: Math.round(A[k2]), tol: Math.round(tol * 10) / 10, w: Math.round(w), r: r.map(function (z) { return [Math.round(z[0]), Math.round(z[1])]; }) });
        if (k1 >= k2) { if (k1 > 0 && k1 < n - 1) { line(0, k1); line(k1, n - 1); } else line(0, n - 1); return; }
        var split = [{ i: 0, t: tS || (k1 > 0 ? nrm(sub(r[k1], r[0])) : dataT(0, 1)) }];
        if (k1 > 0) split.push({ i: k1, t: nrm(sub(r[k1], r[0])), lineBefore: true });
        /* the extremes: the curve's left / right / top / bottom (prominent, a little away from the other points) */
        var m = Math.max(2, Math.round(0.35 * w / step)), cand = [];
        for (var ax = 0; ax < 2; ax++) {
            /* an extreme may be a flat run (a pixel row of the skeleton): take its middle */
            for (k = k1 + 1; k < k2; k++) {
                var v = r[k][ax], p0 = k, p1 = k;
                while (p1 + 1 < k2 && Math.abs(r[p1 + 1][ax] - v) < 0.06) p1++;
                var b0 = p0 - m, b1 = p1 + m;
                if (b0 < k1 || b1 > k2) { k = p1; continue; }
                var lo0 = r[b0][ax], lo1 = r[b1][ax], isMax = true, isMin = true;
                for (var j = b0; j <= b1; j++) { if (r[j][ax] > v + 0.06) isMax = false; if (r[j][ax] < v - 0.06) isMin = false; }
                if ((isMax || isMin) && Math.min(Math.abs(v - lo0), Math.abs(v - lo1)) >= 0.004 * w) {
                    var mid = Math.round((p0 + p1) / 2), o = 1 - ax, sg = r[Math.min(n - 1, b1)][o] - r[Math.max(0, b0)][o] < 0 ? -1 : 1;
                    cand.push({ i: mid, t: ax === 0 ? [0, sg] : [sg, 0] });
                }
                k = p1;
            }
        }
        cand.sort(function (x, y) { return x.i - y.i; });
        var lastA = A[split[split.length - 1].i];
        for (k = 0; k < cand.length; k++) {
            var c = cand[k];
            if (A[c.i] - lastA < 0.5 * w || A[k2] - A[c.i] < 0.4 * w) continue;
            split.push(c); lastA = A[c.i];
        }
        if (k2 < n - 1) split.push({ i: k2, t: nrm(sub(r[n - 1], r[k2])), lineAfter: true });
        split.push({ i: n - 1, t: tE || (k2 < n - 1 ? nrm(sub(r[n - 1], r[k2])) : dataT(n - 1, -1)) });
        for (k = 0; k < split.length - 1; k++) {
            var a = split[k], b = split[k + 1];
            if (b.i <= a.i) continue;
            if ((a.i === 0 && b.lineBefore) || a.lineAfter) { line(a.i, b.i); continue; }
            fitCubic(r.slice(a.i, b.i + 1), a.t, [-b.t[0], -b.t[1]], tol, segs, 0);
        }
    }
    /* a straight piece within 3 degrees of upright / level is made exactly so */
    function snapAxis(p) {
        var n = p.v.length, z = function (h) { return Math.abs(h[0]) + Math.abs(h[1]) < 1e-6; };
        for (var k = 0; k < n - (p.c ? 0 : 1); k++) {
            var k1 = (k + 1) % n; if (!z(p.o[k]) || !z(p.i[k1])) continue;
            var dx = p.v[k1][0] - p.v[k][0], dy = p.v[k1][1] - p.v[k][1];
            if (Math.abs(dx) < Math.abs(dy) * 0.052) { var mx = (p.v[k][0] + p.v[k1][0]) / 2; p.v[k] = [mx, p.v[k][1]]; p.v[k1] = [mx, p.v[k1][1]]; }
            else if (Math.abs(dy) < Math.abs(dx) * 0.052) { var my = (p.v[k][1] + p.v[k1][1]) / 2; p.v[k] = [p.v[k][0], my]; p.v[k1] = [p.v[k1][0], my]; }
        }
        return p;
    }    function toAE(segs, closed) {
        var p = { v: [], i: [], o: [], c: closed }, q;
        for (q = 0; q < segs.length; q++) {
            var Q = segs[q];
            if (q === 0) { p.v.push(Q[0]); p.i.push([0, 0]); }
            p.o[p.o.length] = [Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]];
            if (q === segs.length - 1 && closed) { p.i[0] = [Q[2][0] - Q[3][0], Q[2][1] - Q[3][1]]; }
            else { p.v.push(Q[3]); p.i.push([Q[2][0] - Q[3][0], Q[2][1] - Q[3][1]]); }
        }
        while (p.o.length < p.v.length) p.o.push([0, 0]);
        return p;
    }
    /* 6: a dot: a filled ellipse (round) or rectangle, as the designer makes the i's dot */
    function dot(blob, W) {
        var n = blob.length, sx = 0, sy = 0, q;
        for (q = 0; q < n; q++) { sx += blob[q] % W; sy += Math.floor(blob[q] / W); }
        var cx = sx / n, cy = sy / n, xx = 0, yy = 0, xy2 = 0;
        for (q = 0; q < n; q++) { var dx = blob[q] % W - cx, dy = Math.floor(blob[q] / W) - cy; xx += dx * dx; yy += dy * dy; xy2 += dx * dy; }
        var ang = 0.5 * Math.atan2(2 * xy2, xx - yy), ux = Math.cos(ang), uy = Math.sin(ang), a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
        for (q = 0; q < n; q++) { var px = blob[q] % W - cx, py = Math.floor(blob[q] / W) - cy, a = px * ux + py * uy, b = -px * uy + py * ux; if (a < a0) a0 = a; if (a > a1) a1 = a; if (b < b0) b0 = b; if (b > b1) b1 = b; }
        var L = a1 - a0 + 1, m = b1 - b0 + 1, round = n / (L * m) < 0.86, mid = (a0 + a1) / 2, ccx = cx + ux * mid, ccy = cy + uy * mid, len = round ? Math.max(0.3, L - m) : L;
        return { dot: { c: [ccx, ccy], size: round ? [Math.max(L, m), Math.max(L, m)] : [L, m], round: round, angle: ang * 180 / Math.PI }, paths: [], width: m };
    }
    /* the whole piece */
    function fromRaster(R) {
        var W = R.W, H = R.H, bin = R.bin, D = edt(bin, W, H), sk = thin(bin, W, H), i, q;
        /* the blobs (separate parts: the i's dot) */
        var lab = new Int32Array(W * H), blobs = [], st;
        for (i = 0; i < W * H; i++) if (bin[i] && !lab[i]) {
            var id = blobs.length + 1, px = []; st = [i]; lab[i] = id;
            while (st.length) { var c = st.pop(); px.push(c); var ns = [c - 1, c + 1, c - W, c + W]; for (q = 0; q < 4; q++) if (bin[ns[q]] && !lab[ns[q]]) { lab[ns[q]] = id; st.push(ns[q]); } }
            blobs.push(px);
        }
        var out = [];
        for (var bi = 0; bi < blobs.length; bi++) {
            if (blobs[bi].length < 6) continue;
            var img = new Uint8Array(W * H), dl = [], tot = 0;
            for (q = 0; q < blobs[bi].length; q++) { i = blobs[bi][q]; if (sk[i]) { img[i] = 1; dl.push(D[i]); tot++; } }
            var medD = median(dl), w = Math.max(1, 2 * medD - 0.5), bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
            for (q = 0; q < blobs[bi].length; q++) { var xq = blobs[bi][q] % W, yq = Math.floor(blobs[bi][q] / W); if (xq < bx0) bx0 = xq; if (xq > bx1) bx1 = xq; if (yq < by0) by0 = yq; if (yq > by1) by1 = yq; }
            var S = Math.max(bx1 - bx0, by1 - by0);
            if (tot < 1.1 * w || !tot) { var d0 = dot(blobs[bi], W); out.push(d0); continue; }
            var G = graph(img, W, H);
            prune(G, D, W, medD);
            collapse(G, medD);
            var P = assemble(G, D, W, medD, R, S), paths = [];
            for (q = 0; q < P.length; q++) {
                if (P[q].pts.length < 2) continue;
                var fp = fitPath(P[q], medD, 1.5, R, G.cornerPts || [], S);
                if (!fp || fp.v.length < 2) continue;
                ends(fp, R, w);
                paths.push(fp);
            }
            if (paths.length) out.push({ paths: paths, width: w, cap: 1 });
        }
        return out;
    }
    /* the stroke's ends and corners as the letter has them: a square end -> butt cap, a round one -> round cap; a
       sharp corner -> miter join, a rounded one -> round, a cut-off one -> bevel (looked up in the original shape) */
    function ends(p, R, w) {
        var inside = function (x, y) { var xi = Math.round(x), yi = Math.round(y); return xi >= 0 && yi >= 0 && xi < R.W && yi < R.H && !!R.bin[yi * R.W + xi]; };
        var n = p.v.length, k, hw = w / 2;
        var tanOut = function (k2) { var o = p.o[k2]; if (Math.abs(o[0]) + Math.abs(o[1]) > 1e-6) return nrm(o); return nrm(sub(p.v[(k2 + 1) % n], p.v[k2])); };
        var tanIn = function (k2) { var i2 = p.i[k2]; if (Math.abs(i2[0]) + Math.abs(i2[1]) > 1e-6) return nrm([-i2[0], -i2[1]]); return nrm(sub(p.v[k2], p.v[(k2 - 1 + n) % n])); };
        if (p.cap !== 2 && !p.c) {
            var roundEnd = function (E, t) {           // t: the direction the stroke leaves the end with (into the letter)
                /* (against the stroke's own width a little way in: a thin bar is no round end) */
                var nx = -t[1], ny = t[0], M = [E[0] + t[0] * 0.7 * w, E[1] + t[1] * 0.7 * w], s1 = 0, s2 = 0;
                while (s1 < 2 * w && inside(M[0] + nx * (s1 + 0.25), M[1] + ny * (s1 + 0.25))) s1 += 0.25;
                while (s2 < 2 * w && inside(M[0] - nx * (s2 + 0.25), M[1] - ny * (s2 + 0.25))) s2 += 0.25;
                var hl = (s1 + s2) / 2, off = (s1 - s2) / 2;
                if (hl < 1) return false;
                /* (round: narrow near the tip on both sides alike, full a little further in; a slanted cut is narrow
                   on one side only) */
                var half = function (d, sg) { var C = [E[0] + nx * off + t[0] * d, E[1] + ny * off + t[1] * d], s = 0; while (s < 1.5 * hl && inside(C[0] + sg * nx * (s + 0.25), C[1] + sg * ny * (s + 0.25))) s += 0.25; return s; };
                var a1 = half(0.15 * hl, 1), a2 = half(0.15 * hl, -1), b1 = half(0.6 * hl, 1), b2 = half(0.6 * hl, -1);
                return a1 < 0.75 * hl && a2 < 0.75 * hl && Math.abs(a1 - a2) < 0.25 * hl && b1 > 0.75 * hl && b2 > 0.75 * hl;
            };
            var t0 = tanOut(0), t1 = tanIn(n - 1);
            p.cap = (roundEnd(p.v[0], t0) && roundEnd(p.v[n - 1], [-t1[0], -t1[1]])) ? 2 : 1;
            if (p.cap === 2) {                     // (a round cap reaches half a stroke past its end: the end goes in that much)
                var segL = function (a, b) { return Math.sqrt(Math.pow(p.v[a][0] - p.v[b][0], 2) + Math.pow(p.v[a][1] - p.v[b][1], 2)); };
                if (segL(0, 1) > 1.5 * w) p.v[0] = [p.v[0][0] + t0[0] * hw, p.v[0][1] + t0[1] * hw];
                if (segL(n - 1, n - 2) > 1.5 * w) p.v[n - 1] = [p.v[n - 1][0] - t1[0] * hw, p.v[n - 1][1] - t1[1] * hw];
            }
        }
        var votes = [0, 0, 0, 0];
        for (k = p.c ? 0 : 1; k < (p.c ? n : n - 1); k++) {
            var a1 = tanIn(k), b1 = tanOut(k);
            if (a1[0] * b1[0] + a1[1] * b1[1] > Math.cos(25 * Math.PI / 180)) continue;           // smooth: no join
            var back = [-a1[0], -a1[1]], inner = nrm([back[0] + b1[0], back[1] + b1[1]]), outer = [-inner[0], -inner[1]];
            var th = Math.acos(Math.max(-1, Math.min(1, back[0] * b1[0] + back[1] * b1[1]))), dM = hw / Math.max(0.15, Math.sin(th / 2)), X = p.v[k];
            if (inside(X[0] + outer[0] * 0.85 * dM, X[1] + outer[1] * 0.85 * dM)) votes[1]++;
            else if (inside(X[0] + outer[0] * 0.9 * hw, X[1] + outer[1] * 0.9 * hw)) votes[2]++;
            else votes[3]++;
        }
        p.join = votes[2] > votes[1] && votes[2] >= votes[3] ? 2 : (votes[3] > votes[1] ? 3 : 1);
        if (!p.cap) p.cap = 1;
        return p;
    }
    /* raster px -> layer units */
    function back(comps, R) {
        var k = 1 / R.sc, X = function (p) { return [(p[0] - R.ox) * k, (p[1] - R.oy) * k]; }, T = function (p) { return [p[0] * k, p[1] * k]; };
        for (var q = 0; q < comps.length; q++) {
            comps[q].width *= k;
            if (comps[q].dot) { comps[q].dot.c = X(comps[q].dot.c); comps[q].dot.size = T(comps[q].dot.size); }
            for (var j = 0; j < comps[q].paths.length; j++) { var p = comps[q].paths[j]; p.v = p.v.map(X); p.i = p.i.map(T); p.o = p.o.map(T); }
        }
        return comps;
    }
    function piece(pc) { var R = raster(pc); return back(fromRaster(R), R); }
    /* for the tests: a letter drawn with a canvas font */
    function fromText(ch, font, size) {
        var mw = /^(\d+|bold|normal)\s+(.*)$/.exec(font), css = mw ? mw[1] + " " + size + "px " + mw[2] : size + "px " + font;
        var cv = document.createElement("canvas"), g = cv.getContext("2d"); g.font = css;
        var m = g.measureText(ch), W = Math.ceil(m.width + 2 * PAD + size * 0.2), H = Math.ceil(size * 1.4 + 2 * PAD);
        cv.width = W; cv.height = H; g = cv.getContext("2d"); g.font = css; g.textBaseline = "alphabetic"; g.fillStyle = "#000"; g.fillText(ch, PAD + size * 0.1, PAD + size * 1.05);
        var d = g.getImageData(0, 0, W, H).data, bin = new Uint8Array(W * H); for (var q = 0; q < W * H; q++) bin[q] = d[q * 4 + 3] > 127 ? 1 : 0;
        return { W: W, H: H, bin: bin, sc: 1, ox: 0, oy: 0, cv: cv };
    }
    /* for the tests: the skeleton and the graph after pruning (the largest blob) */
    function debug(R) {
        var W = R.W, H = R.H, D = edt(R.bin, W, H), sk = thin(R.bin, W, H), dl = [], i;
        for (i = 0; i < W * H; i++) if (sk[i]) dl.push(D[i]);
        var medD = median(dl), G = graph(sk, W, H), raw = G.edges.length;
        prune(G, D, W, medD);
        for (i = 0; i < G.edges.length; i++) G.edges[i].pts = edgePts(G.edges[i], G, W);
        return { sk: sk, nodes: G.nodes, edges: G.edges, medD: medD, raw: raw };
    }
    return { piece: piece, fromRaster: fromRaster, fromText: fromText, raster: raster, debug: debug, trace: function (on) { TRACE = on ? [] : null; return TRACE; } };
})();

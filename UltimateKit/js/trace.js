/*  Ultimate Kit - Photo to Shape tracer (2026-10-30): an image (a PNG logo, an icon, a flat illustration ...) becomes
    one filled vector shape per colour, traced the way a designer would with the pen: corners where the picture has
    corners, smooth curves elsewhere, points only at corners, at a curve's extremes (level / upright handles) and where
    one curve is not enough.
      1  the image is drawn big (small images up to 4x: their soft edges then say where an edge lies between pixels)
      2  its colours: the flat parts of the picture are clustered (Lab, the colours an eye tells apart); "auto" keeps
         every colour that covers a real area, or exactly N
      3  every pixel gets its colour: flat pixels the nearest one, the soft edge pixels between two colours grow from
         their neighbours (so no thin line of an in-between colour along an edge); specks below the clean-up size go to
         the colour round them
      4  each colour's area (bottom = the largest; in "Separate" it reaches a little under the colours above it, so no
         seam shows; in "Stacked" it is everything from it upwards) becomes a field: how much of each pixel belongs to it.
         An antialiased pixel says that itself (how far its colour lies between the two sides), so the outline is the
         field's middle line, BETWEEN the pixels: a clean curve, not the pixel steps
      5  each outline: corners found (sharp turns, not tight curves) and put where their sides meet, the runs between them
         smoothed along their length (Smooth; ends and size stay), fitted with as few cubic curves as the tolerance allows
         (Schneider), then needless points taken out (shared/pathsimp.js) and straight sides nearly level / upright made
         exactly so. Detail only says how closely the curves follow that smooth line, so it never brings the steps back.
    Out: { w, h (source px), colors: [{ hex, rgb [0..1], area, paths: [{ v, i, o, c }] }] bottom first, points, paths } */
var UKTrace = (function () {
    /* ------------------------------------------------------------------ colour */
    function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    var LIN = new Float32Array(256); for (var q0 = 0; q0 < 256; q0++) LIN[q0] = lin(q0);
    function fl(t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; }
    function lab(r, g, b) {
        var R = LIN[r], G = LIN[g], B = LIN[b];
        var x = fl((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047), y = fl(R * 0.2126 + G * 0.7152 + B * 0.0722), z = fl((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883);
        return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    }
    function labInto(r, g, b, A, o) {
        var R = LIN[r], G = LIN[g], B = LIN[b];
        var x = fl((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047), y = fl(R * 0.2126 + G * 0.7152 + B * 0.0722), z = fl((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883);
        A[o] = 116 * y - 16; A[o + 1] = 500 * (x - y); A[o + 2] = 200 * (y - z);
    }
    function d2(a, b) { var x = a[0] - b[0], y = a[1] - b[1], z = a[2] - b[2]; return x * x + y * y + z * z; }
    function hex(r, g, b) { var h = function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? "0" : "") + v.toString(16); }; return ("#" + h(r) + h(g) + h(b)).toUpperCase(); }

    /* ------------------------------------------------------------------ 1: the working raster */
    function prepare(img, o) {
        o = o || {};
        var W = img.naturalWidth || img.width, H = img.naturalHeight || img.height, M = Math.max(W, H);
        var s = Math.min(4, (o.target || 1600) / M); if (s < 1) s = Math.max(s, (o.maxSide || 2048) / M);
        if (s > 1 && s < 1.2) s = 1;
        var w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s));
        var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        var g = cv.getContext("2d"); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
        g.drawImage(img, 0, 0, w, h);
        return { data: g.getImageData(0, 0, w, h).data, w: w, h: h, s: w / W, W: W, H: H, masked: !!o.masked };
    }

    /* ------------------------------------------------------------------ 2 + 3: colours and labels */
    function palette(R, o) {
        var d = R.data, w = R.w, h = R.h, N = w * h, p, i, k;
        var op = new Uint8Array(N), flat = new Uint8Array(N);
        for (p = 0; p < N; p++) op[p] = d[p * 4 + 3] >= 128 ? 1 : 0;
        var tf = 14;                             // "flat": every 4-neighbour within this (each channel)
        for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) {
            p = y * w + x; if (d[p * 4 + 3] < 250) continue;
            var ok = true, a = p * 4;
            for (k = 0; k < 4 && ok; k++) { var b = (k === 0 ? p - 1 : (k === 1 ? p + 1 : (k === 2 ? p - w : p + w))) * 4; if (d[b + 3] < 250 || Math.abs(d[a] - d[b]) > tf || Math.abs(d[a + 1] - d[b + 1]) > tf || Math.abs(d[a + 2] - d[b + 2]) > tf) ok = false; }
            if (ok) flat[p] = 1;
        }
        R.bg = null;
        if (o.ignoreBg) {                        // the colour round the border (a white / plain background) is no shape
            var bc = {}, bn = 0, best = null;
            var take = function (q) { if (!op[q]) return; var key = (d[q * 4] >> 3) + "," + (d[q * 4 + 1] >> 3) + "," + (d[q * 4 + 2] >> 3); bc[key] = (bc[key] || 0) + 1; bn++; };
            for (x = 0; x < w; x++) { take(x); take((h - 1) * w + x); }
            for (y = 0; y < h; y++) { take(y * w); take(y * w + w - 1); }
            if (R.masked) for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) { p = y * w + x; if (op[p] && !(op[p - 1] && op[p + 1] && op[p - w] && op[p + w])) take(p); }   // (round what the mask leaves)
            for (var kk in bc) if (!best || bc[kk] > bc[best]) best = kk;
            if (best && bc[best] > bn * 0.5) R.bg = best.split(",").map(function (v) { return Number(v) * 8 + 4; });
        }
        /* histogram of the flat colours (5 bits a channel) */
        var cnt = new Float64Array(32768), sr = new Float64Array(32768), sg = new Float64Array(32768), sb = new Float64Array(32768), nf = 0;
        for (p = 0; p < N; p++) if (flat[p]) { var j = ((d[p * 4] >> 3) << 10) | ((d[p * 4 + 1] >> 3) << 5) | (d[p * 4 + 2] >> 3); cnt[j]++; sr[j] += d[p * 4]; sg[j] += d[p * 4 + 1]; sb[j] += d[p * 4 + 2]; nf++; }
        if (!nf) for (p = 0; p < N; p++) if (op[p]) { var j2 = ((d[p * 4] >> 3) << 10) | ((d[p * 4 + 1] >> 3) << 5) | (d[p * 4 + 2] >> 3); cnt[j2]++; sr[j2] += d[p * 4]; sg[j2] += d[p * 4 + 1]; sb[j2] += d[p * 4 + 2]; nf++; flat[p] = 1; }
        var bins = [];
        for (j = 0; j < 32768; j++) if (cnt[j]) bins.push({ n: cnt[j], r: sr[j] / cnt[j], g: sg[j] / cnt[j], b: sb[j] / cnt[j] });
        bins.sort(function (A, B) { return B.n - A.n; });
        for (i = 0; i < bins.length; i++) bins[i].L = lab(Math.round(bins[i].r), Math.round(bins[i].g), Math.round(bins[i].b));
        var minN = Math.max(Math.pow(2.2 * R.s, 2), nf * (o.minShare || 0.0004));
        /* leader clustering at a colour distance T (Lab units) */
        var cluster = function (T) {
            var cl = [], T2 = T * T;
            for (i = 0; i < bins.length; i++) {
                var bi = bins[i], bestc = -1, bd = 1e18;
                for (k = 0; k < cl.length; k++) { var dd = d2(bi.L, cl[k].L); if (dd < bd) { bd = dd; bestc = k; } }
                if (bestc >= 0 && bd < T2) { var c = cl[bestc], t = c.n + bi.n; c.r = (c.r * c.n + bi.r * bi.n) / t; c.g = (c.g * c.n + bi.g * bi.n) / t; c.b = (c.b * c.n + bi.b * bi.n) / t; c.n = t; }
                else cl.push({ n: bi.n, r: bi.r, g: bi.g, b: bi.b, L: bi.L });
            }
            return cl;
        };
        var want = o.colors > 0 ? o.colors : 0, cl = cluster(want ? 6 : (o.colorTol || 9));
        if (want) { var T = 6; while (cl.length < want && T > 1.5) { T *= 0.7; cl = cluster(T); } }
        /* drop colours with no real area (their pixels go to the nearest one), then merge down to N */
        cl = cl.filter(function (c) { return c.n >= minN; });
        if (!cl.length) cl = cluster(40).slice(0, 1);
        for (i = 0; i < cl.length; i++) cl[i].L = lab(Math.round(cl[i].r), Math.round(cl[i].g), Math.round(cl[i].b));
        var cap = want || (o.maxColors || 40);
        while (cl.length > cap) {
            var bi2 = 0, bj = 1, bd2 = 1e18;
            for (i = 0; i < cl.length; i++) for (k = i + 1; k < cl.length; k++) { var dd2 = d2(cl[i].L, cl[k].L) * Math.min(cl[i].n, cl[k].n); if (dd2 < bd2) { bd2 = dd2; bi2 = i; bj = k; } }
            var A1 = cl[bi2], B1 = cl[bj], tt = A1.n + B1.n;
            A1.r = (A1.r * A1.n + B1.r * B1.n) / tt; A1.g = (A1.g * A1.n + B1.g * B1.n) / tt; A1.b = (A1.b * A1.n + B1.b * B1.n) / tt; A1.n = tt;
            A1.L = lab(Math.round(A1.r), Math.round(A1.g), Math.round(A1.b)); cl.splice(bj, 1);
        }
        /* a few rounds of k-means over the flat pixels (photos: the means move; flat graphics: they stay) */
        var PL = new Float32Array(N * 3);
        for (p = 0; p < N; p++) if (op[p]) labInto(d[p * 4], d[p * 4 + 1], d[p * 4 + 2], PL, p * 3);
        var near = function (p2, list) { var bk = 0, bdd = 1e18, a = PL[p2 * 3], b = PL[p2 * 3 + 1], cc = PL[p2 * 3 + 2]; for (var q = 0; q < list.length; q++) { var c = list[q].L, x2 = a - c[0], y2 = b - c[1], z2 = cc - c[2], v = x2 * x2 + y2 * y2 + z2 * z2; if (v < bdd) { bdd = v; bk = q; } } return bk; };
        for (var it = 0; it < 3; it++) {
            var acc = cl.map(function () { return [0, 0, 0, 0]; });
            for (p = 0; p < N; p++) if (flat[p]) { var kq = near(p, cl), A2 = acc[kq]; A2[0] += d[p * 4]; A2[1] += d[p * 4 + 1]; A2[2] += d[p * 4 + 2]; A2[3]++; }
            for (k = 0; k < cl.length; k++) if (acc[k][3]) { cl[k].r = acc[k][0] / acc[k][3]; cl[k].g = acc[k][1] / acc[k][3]; cl[k].b = acc[k][2] / acc[k][3]; cl[k].L = lab(Math.round(cl[k].r), Math.round(cl[k].g), Math.round(cl[k].b)); }
        }
        return { op: op, flat: flat, PL: PL, cl: cl, near: near };
    }
    /* how far a pixel's colour lies from A towards B (0..1), -1 if it is not on the way between them */
    function between2(d, o4, A, B) {
        var ux = B.r - A.r, uy = B.g - A.g, uz = B.b - A.b, L2 = ux * ux + uy * uy + uz * uz;
        if (L2 < 150) return -1;
        var vx = d[o4] - A.r, vy = d[o4 + 1] - A.g, vz = d[o4 + 2] - A.b, t = (vx * ux + vy * uy + vz * uz) / L2, ex = vx - t * ux, ey = vy - t * uy, ez = vz - t * uz;
        if (ex * ex + ey * ey + ez * ez > 0.2 * L2) return -1;
        return t < 0 ? 0 : (t > 1 ? 1 : t);
    }
    function labels(R, P, o) {
        var w = R.w, h = R.h, N = w * h, lb = new Uint8Array(N), p, k, cl = P.cl, op = P.op, PL = P.PL;
        lb.fill(255);
        var bgk = -1;
        if (R.bg) { var bl = lab(R.bg[0], R.bg[1], R.bg[2]), bd = 1e18; for (k = 0; k < cl.length; k++) { var dd = d2(bl, cl[k].L); if (dd < bd) { bd = dd; bgk = k; } } if (bd > 400) bgk = -1; }
        for (p = 0; p < N; p++) if (op[p] && P.flat[p]) lb[p] = P.near(p, cl);
        /* the soft edges grow from both sides: each pixel takes the neighbouring colour nearest its own */
        var qa = new Int32Array(N), qn = 0, inq = new Uint8Array(N), x, y;
        for (p = 0; p < N; p++) if (op[p] && lb[p] === 255) {
            x = p % w; y = (p / w) | 0;
            if ((x > 0 && lb[p - 1] !== 255) || (x < w - 1 && lb[p + 1] !== 255) || (y > 0 && lb[p - w] !== 255) || (y < h - 1 && lb[p + w] !== 255)) { qa[qn++] = p; inq[p] = 1; }
        }
        var head = 0;
        while (head < qn) {
            p = qa[head++]; x = p % w; y = (p / w) | 0;
            var bk = -1, bdd = 1e18, i, pa = PL[p * 3], pb = PL[p * 3 + 1], pc = PL[p * 3 + 2];
            for (i = 0; i < 4; i++) {
                var q = i === 0 ? (x > 0 ? p - 1 : -1) : (i === 1 ? (x < w - 1 ? p + 1 : -1) : (i === 2 ? (y > 0 ? p - w : -1) : (y < h - 1 ? p + w : -1)));
                if (q < 0) continue;
                if (lb[q] !== 255) { var c = cl[lb[q]].L, x2 = pa - c[0], y2 = pb - c[1], z2 = pc - c[2], v = x2 * x2 + y2 * y2 + z2 * z2; if (v < bdd) { bdd = v; bk = lb[q]; } }
            }
            if (bk < 0) bk = P.near(p, cl);
            lb[p] = bk;
            if (x > 0 && op[p - 1] && lb[p - 1] === 255 && !inq[p - 1]) { qa[qn++] = p - 1; inq[p - 1] = 1; }
            if (x < w - 1 && op[p + 1] && lb[p + 1] === 255 && !inq[p + 1]) { qa[qn++] = p + 1; inq[p + 1] = 1; }
            if (y > 0 && op[p - w] && lb[p - w] === 255 && !inq[p - w]) { qa[qn++] = p - w; inq[p - w] = 1; }
            if (y < h - 1 && op[p + w] && lb[p + w] === 255 && !inq[p + w]) { qa[qn++] = p + w; inq[p + w] = 1; }
        }
        for (p = 0; p < N; p++) if (op[p] && lb[p] === 255) lb[p] = P.near(p, cl);
        /* (who reached a soft pixel first must not decide: along an edge each pixel takes the side it holds more of) */
        var dd0 = R.data;
        for (var sweep = 0; sweep < 3; sweep++) {
            var moved = 0;
            for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
                p = y * w + x; var la = lb[p]; if (la === 255) continue;
                for (k = 0; k < 4; k++) {
                    var q2 = k === 0 ? (x > 0 ? p - 1 : -1) : (k === 1 ? (x < w - 1 ? p + 1 : -1) : (k === 2 ? (y > 0 ? p - w : -1) : (y < h - 1 ? p + w : -1)));
                    if (q2 < 0 || lb[q2] === la || lb[q2] === 255) continue;
                    var e0 = between2(dd0, p * 4, cl[la], cl[lb[q2]]);
                    if (e0 > 0.5) { lb[p] = lb[q2]; moved++; break; }
                }
            }
            if (!moved) break;
        }
        if (bgk >= 0) for (p = 0; p < N; p++) if (lb[p] === bgk) lb[p] = 255;
        /* specks: a patch smaller than the clean-up size takes the colour it sits in (transparent ones too) */
        var minA = Math.max(1, (o.minArea || 4) * R.s * R.s), seen = new Int32Array(N), stamp = 0, st = new Int32Array(N), comp = new Int32Array(N), AR = new Int32Array(256), TOUCH = [];
        for (var pass = 0; pass < 2; pass++) {
            stamp++;
            for (p = 0; p < N; p++) {
                if (seen[p] === stamp) continue;
                var L0 = lb[p], sp = 0, cn = 0, big = false; st[sp++] = p; seen[p] = stamp;
                while (sp) {
                    var c0 = st[--sp]; if (cn < minA) comp[cn] = c0; cn++; x = c0 % w; y = (c0 / w) | 0;
                    for (k = 0; k < 4; k++) {
                        var q3 = k === 0 ? (x > 0 ? c0 - 1 : -1) : (k === 1 ? (x < w - 1 ? c0 + 1 : -1) : (k === 2 ? (y > 0 ? c0 - w : -1) : (y < h - 1 ? c0 + w : -1)));
                        if (q3 < 0) { if (!big) { if (!AR[255]) TOUCH.push(255); AR[255]++; } continue; }
                        if (lb[q3] === L0) { if (seen[q3] !== stamp) { seen[q3] = stamp; st[sp++] = q3; } }
                        else if (!big) { if (!AR[lb[q3]]) TOUCH.push(lb[q3]); AR[lb[q3]]++; }
                    }
                    if (cn >= minA) big = true;
                }
                var to = -1, tn = 0;
                for (k = 0; k < TOUCH.length; k++) { if (AR[TOUCH[k]] > tn) { tn = AR[TOUCH[k]]; to = TOUCH[k]; } AR[TOUCH[k]] = 0; }
                TOUCH.length = 0;
                if (big || to < 0) continue;
                for (k = 0; k < cn; k++) lb[comp[k]] = to;
            }
        }
        return lb;
    }

    /* ------------------------------------------------------------------ 4: the outlines, between the pixels */
    /* work arrays, kept with the raster. F has a row / column of 0 round the frame: sample (x, y) = F[(y + 1) * PW + x + 1] */
    function work(R) {
        if (R.work) return R.work;
        var w = R.w, h = R.h, N = w * h, PW = w + 2, PN = PW * (h + 2);
        var nx = new Int32Array(2 * PN + 2); nx.fill(-1);
        return (R.work = { F: new Float32Array(PN), T: new Float32Array(PN), ring: new Uint8Array(N), pa: new Uint8Array(N), pb: new Uint8Array(N), q: new Int32Array(N), next: nx });
    }
    /* F = how much of each pixel belongs to the area in mask: 1 / 0 away from its edge; along the edge (rings pixels deep)
       what the pixel itself says: its alpha at a transparent edge, how far its colour is between the two sides elsewhere */
    function softEdge(R, lb, cl, mask, rc, rings, W) {
        var d = R.data, w = R.w, h = R.h, PW = w + 2, F = W.F, ring = W.ring, pa = W.pa, pb = W.pb, q = W.q, qn = 0, x, y, p, i, me, oth;
        for (y = rc[1]; y <= rc[3]; y++) for (x = rc[0]; x <= rc[2]; x++) {
            p = y * w + x; me = mask[p]; F[(y + 1) * PW + x + 1] = me; oth = -1;
            if (x > 0) { if (mask[p - 1] !== me) oth = lb[p - 1]; } else if (me) oth = 255;
            if (x < w - 1) { if (mask[p + 1] !== me) oth = lb[p + 1]; } else if (me) oth = 255;
            if (y > 0) { if (mask[p - w] !== me) oth = lb[p - w]; } else if (me) oth = 255;
            if (y < h - 1) { if (mask[p + w] !== me) oth = lb[p + w]; } else if (me) oth = 255;
            if (oth < 0) continue;
            ring[p] = 1; q[qn++] = p;
            if (me) { pa[p] = lb[p]; pb[p] = oth; } else { pa[p] = oth; pb[p] = lb[p]; }
        }
        for (var head = 0; head < qn; head++) {
            p = q[head]; var r = ring[p]; if (r >= rings) continue;
            x = p % w; y = (p / w) | 0;
            for (i = 0; i < 4; i++) {
                var n = i === 0 ? (x > rc[0] ? p - 1 : -1) : (i === 1 ? (x < rc[2] ? p + 1 : -1) : (i === 2 ? (y > rc[1] ? p - w : -1) : (y < rc[3] ? p + w : -1)));
                if (n < 0 || ring[n]) continue;
                ring[n] = r + 1; q[qn++] = n;
                if (mask[n]) { pa[n] = lb[n]; pb[n] = pb[p]; } else { pa[n] = pa[p]; pb[n] = lb[n]; }
            }
        }
        for (i = 0; i < qn; i++) {
            p = q[i]; ring[p] = 0; me = mask[p];
            var a = pa[p], b = pb[p], m = me;
            if (b === 255) m = d[p * 4 + 3] / 255;
            else { var t = between2(d, p * 4, cl[a], cl[b]); if (t >= 0) m = 1 - t; }
            /* (the two sides stay what the labels say: the line passes between an inside and an outside pixel) */
            if (me) { if (m < 0.5) m = 0.5; else if (m > 1) m = 1; } else if (m > 0.5) m = 0.5;
            F[((p / w) | 0) * PW + PW + (p % w) + 1] = m;
        }
    }
    /* a slight blur of the field (it loses what the pixel grid still leaves, not the place of an edge) */
    function blurField(R, W, rc, sg) {
        var w = R.w, h = R.h, PW = w + 2, F = W.F, T = W.T, kr = Math.max(1, Math.ceil(sg * 2.5)), K = [], ks = 0, x, y, j, v, i;
        for (j = -kr; j <= kr; j++) { v = Math.exp(-j * j / (2 * sg * sg)); K.push(v); ks += v; }
        for (j = 0; j < K.length; j++) K[j] /= ks;
        for (y = rc[1]; y <= rc[3]; y++) for (x = rc[0]; x <= rc[2]; x++) {
            i = (y + 1) * PW + x + 1; v = 0;
            var j0 = Math.max(-kr, -x - 1), j1 = Math.min(kr, w - x);
            for (j = j0; j <= j1; j++) v += K[j + kr] * F[i + j];
            T[i] = v;
        }
        for (y = rc[1]; y <= rc[3]; y++) for (x = rc[0]; x <= rc[2]; x++) {
            i = (y + 1) * PW + x + 1; v = 0;
            var j2 = Math.max(-kr, -y - 1), j3 = Math.min(kr, h - y);
            for (j = j2; j <= j3; j++) v += K[j + kr] * T[i + j * PW];
            F[i] = v;
        }
    }
    /* this colour reaches under the colours above it (px steps of the field, only where those colours are) */
    function underAbove(R, lb, z, level, W, rc, steps) {
        var w = R.w, PW = w + 2, F = W.F, T = W.T, x, y, it, i, p;
        for (it = 0; it < steps; it++) {
            for (y = rc[1]; y <= rc[3]; y++) for (x = rc[0]; x <= rc[2]; x++) {
                i = (y + 1) * PW + x + 1; p = y * w + x; var v = F[i];
                if (lb[p] !== 255 && z[lb[p]] > level) { if (F[i - 1] > v) v = F[i - 1]; if (F[i + 1] > v) v = F[i + 1]; if (F[i - PW] > v) v = F[i - PW]; if (F[i + PW] > v) v = F[i + PW]; }
                T[i] = v;
            }
            for (y = rc[1]; y <= rc[3]; y++) for (x = rc[0]; x <= rc[2]; x++) { i = (y + 1) * PW + x + 1; F[i] = T[i]; }
        }
    }
    /* the closed lines where F crosses one half (marching squares), inside on the right. A line: points in pixel-edge
       coordinates (the frame is 0..w, 0..h), between the samples where the field says */
    function middleLines(R, W, rc) {
        var w = R.w, PW = w + 2, F = W.F, nx = W.next, starts = [], res = [], L = 0.5, cx, cy;
        var seg = function (a, b) { nx[a] = b; starts.push(a); };
        for (cy = rc[1]; cy <= rc[3] + 1; cy++) for (cx = rc[0]; cx <= rc[2] + 1; cx++) {
            var i = cy * PW + cx, a = F[i], b = F[i + 1], c = F[i + PW + 1], d = F[i + PW];
            var id = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
            if (id === 0 || id === 15) continue;
            var T = i * 2, B = (i + PW) * 2, Lf = i * 2 + 1, R2 = (i + 1) * 2 + 1;
            switch (id) {
                case 8: seg(T, Lf); break;
                case 4: seg(R2, T); break;
                case 2: seg(B, R2); break;
                case 1: seg(Lf, B); break;
                case 12: seg(R2, Lf); break;
                case 6: seg(B, T); break;
                case 3: seg(Lf, R2); break;
                case 9: seg(T, B); break;
                case 14: seg(B, Lf); break;
                case 13: seg(R2, B); break;
                case 11: seg(T, R2); break;
                case 7: seg(Lf, T); break;
                case 10: if ((a + b + c + d) / 4 > L) { seg(T, R2); seg(B, Lf); } else { seg(T, Lf); seg(B, R2); } break;
                default: if ((a + b + c + d) / 4 > L) { seg(Lf, T); seg(R2, B); } else { seg(R2, T); seg(Lf, B); }
            }
        }
        var where = function (e) {
            var k = e >> 1, sx = k % PW, sy = (k / PW) | 0, v1 = F[k], v2 = (e & 1) ? F[k + PW] : F[k + 1], t = (L - v1) / (v2 - v1);
            return (e & 1) ? [sx - 0.5, sy + t - 0.5] : [sx + t - 0.5, sy - 0.5];
        };
        for (var q = 0; q < starts.length; q++) {
            var s0 = starts[q]; if (nx[s0] < 0) continue;
            var e = s0, pts = [], guard = 0;
            do { pts.push(where(e)); var n = nx[e]; nx[e] = -1; e = n; } while (e >= 0 && e !== s0 && guard++ < 4e6);
            if (e === s0 && pts.length >= 3) res.push(pts);
        }
        return res;
    }
    /* true: the picture's edges are hard steps (nearly no pixel along them lies between its two sides) */
    function softness(R, lb, cl) {
        if (R.s > 1.2) return false;          // (an enlarged image is soft by itself)
        var d = R.data, w = R.w, h = R.h, n = 0, m = 0, x, y, p, b, t;
        for (y = 0; y < h - 1; y++) for (x = 0; x < w - 1; x++) {
            p = y * w + x; var a = lb[p];
            for (var k = 0; k < 2; k++) {
                b = k ? lb[p + w] : lb[p + 1]; if (a === b) continue;
                n++;
                if (a === 255 || b === 255) { var A = Math.max(d[p * 4 + 3], d[(k ? p + w : p + 1) * 4 + 3]), I = Math.min(d[p * 4 + 3], d[(k ? p + w : p + 1) * 4 + 3]); if ((A > 25 && A < 230) || (I > 25 && I < 230)) m++; }
                else { t = between2(d, p * 4, cl[a], cl[b]); if (t > 0.08 && t < 0.92) m++; else { t = between2(d, (k ? p + w : p + 1) * 4, cl[b], cl[a]); if (t > 0.08 && t < 0.92) m++; } }
            }
        }
        return n > 200 && m / n < 0.2;
    }
    function clearField(R, W, rc) {
        var PW = R.w + 2, F = W.F;
        for (var y = rc[1]; y <= rc[3]; y++) { var a = (y + 1) * PW + rc[0] + 1; F.fill(0, a, a + rc[2] - rc[0] + 1); }
    }
    function area(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var A = pts[i], B = pts[(i + 1) % n]; a += A[0] * B[1] - B[0] * A[1]; } return a / 2; }

    /* ------------------------------------------------------------------ 5: the pen fit */
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
    function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
    function mul(a, k) { return [a[0] * k, a[1] * k]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
    function len(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1]); }
    function nrm(a) { var l = len(a); return l < 1e-12 ? [0, 0] : [a[0] / l, a[1] / l]; }
    function bez(Q, t) { var m = 1 - t; return [m * m * m * Q[0][0] + 3 * m * m * t * Q[1][0] + 3 * m * t * t * Q[2][0] + t * t * t * Q[3][0], m * m * m * Q[0][1] + 3 * m * m * t * Q[1][1] + 3 * m * t * t * Q[2][1] + t * t * t * Q[3][1]]; }
    function bezD(Q, t) { var m = 1 - t; return [3 * m * m * (Q[1][0] - Q[0][0]) + 6 * m * t * (Q[2][0] - Q[1][0]) + 3 * t * t * (Q[3][0] - Q[2][0]), 3 * m * m * (Q[1][1] - Q[0][1]) + 6 * m * t * (Q[2][1] - Q[1][1]) + 3 * t * t * (Q[3][1] - Q[2][1])]; }
    function bezDD(Q, t) { var m = 1 - t; return [6 * m * (Q[2][0] - 2 * Q[1][0] + Q[0][0]) + 6 * t * (Q[3][0] - 2 * Q[2][0] + Q[1][0]), 6 * m * (Q[2][1] - 2 * Q[1][1] + Q[0][1]) + 6 * t * (Q[3][1] - 2 * Q[2][1] + Q[1][1])]; }
    /* Schneider: one cubic with the given end tangents through pts (chord-length start, Newton refinement),
       split at the worst point while it is off by more than tol */
    function fitCubic(pts, t1, t2, tol, out, depth) {
        var n = pts.length;
        if (n === 2 || depth > 12) { var dl = len(sub(pts[n - 1], pts[0])) / 3; out.push([pts[0], add(pts[0], mul(t1, dl)), add(pts[n - 1], mul(t2, dl)), pts[n - 1]]); return; }
        var u = [0], i;
        for (i = 1; i < n; i++) u.push(u[i - 1] + len(sub(pts[i], pts[i - 1])));
        var tot = u[n - 1] || 1; for (i = 0; i < n; i++) u[i] /= tot;
        var Q = null, errMax = 0, split = (n / 2) | 0;
        for (var round = 0; round < 6; round++) {
            Q = gen(pts, u, t1, t2);
            var r = maxErr(pts, Q, u); errMax = r[0]; split = r[1];
            if (errMax <= tol) { out.push(Q); return; }
            if (errMax > tol * 16) break;
            for (i = 0; i < n; i++) u[i] = newton(Q, pts[i], u[i]);
        }
        split = Math.max(1, Math.min(n - 2, split));
        var tc = nrm(sub(pts[Math.min(n - 1, split + 1)], pts[Math.max(0, split - 1)]));
        fitCubic(pts.slice(0, split + 1), t1, mul(tc, -1), tol, out, depth + 1);
        fitCubic(pts.slice(split), tc, t2, tol, out, depth + 1);
    }
    function gen(pts, u, t1, t2) {
        var n = pts.length, C = [[0, 0], [0, 0]], X = [0, 0], P0 = pts[0], P3 = pts[n - 1], i;
        for (i = 0; i < n; i++) {
            var t = u[i], m = 1 - t, b0 = m * m * m, b1 = 3 * m * m * t, b2 = 3 * m * t * t, b3 = t * t * t;
            var A1 = mul(t1, b1), A2 = mul(t2, b2);
            C[0][0] += dot(A1, A1); C[0][1] += dot(A1, A2); C[1][1] += dot(A2, A2);
            var tmp = sub(pts[i], add(mul(P0, b0 + b1), mul(P3, b2 + b3)));
            X[0] += dot(A1, tmp); X[1] += dot(A2, tmp);
        }
        C[1][0] = C[0][1];
        var det = C[0][0] * C[1][1] - C[0][1] * C[1][0], a1 = 0, a2 = 0, seg = len(sub(P3, P0));
        if (Math.abs(det) > 1e-12) { a1 = (X[0] * C[1][1] - X[1] * C[0][1]) / det; a2 = (C[0][0] * X[1] - C[1][0] * X[0]) / det; }
        if (a1 < seg * 1e-3 || a2 < seg * 1e-3 || a1 > seg * 1.6 || a2 > seg * 1.6) { a1 = a2 = seg / 3; }
        return [P0, add(P0, mul(t1, a1)), add(P3, mul(t2, a2)), P3];
    }
    function maxErr(pts, Q, u) { var m = 0, k = (pts.length / 2) | 0; for (var i = 1; i < pts.length - 1; i++) { var e = len(sub(bez(Q, u[i]), pts[i])); if (e > m) { m = e; k = i; } } return [m, k]; }
    function newton(Q, P, u) { var d = sub(bez(Q, u), P), d1 = bezD(Q, u), d2v = bezDD(Q, u), num = dot(d, d1), den = dot(d1, d1) + dot(d, d2v); if (Math.abs(den) < 1e-12) return u; var r = u - num / den; return r < 0 ? 0 : (r > 1 ? 1 : r); }
    function lineFit(P, a, b) {
        var n = b - a + 1, mx = 0, my = 0, i;
        for (i = a; i <= b; i++) { mx += P[i][0]; my += P[i][1]; } mx /= n; my /= n;
        var xx = 0, yy = 0, xy = 0; for (i = a; i <= b; i++) { var dx = P[i][0] - mx, dy = P[i][1] - my; xx += dx * dx; yy += dy * dy; xy += dx * dy; }
        var an = 0.5 * Math.atan2(2 * xy, xx - yy), d = [Math.cos(an), Math.sin(an)], dev = 0;
        for (i = a; i <= b; i++) dev = Math.max(dev, Math.abs((P[i][0] - mx) * d[1] - (P[i][1] - my) * d[0]));
        return { c: [mx, my], d: d, dev: dev };
    }
    /* points every h along a line */
    function resample(P, h, closed) {
        var n = P.length, m = closed ? n : n - 1, out = [P[0].slice()], need = h, i;
        for (i = 0; i < m; i++) {
            var A = P[i], B = P[(i + 1) % n], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.sqrt(dx * dx + dy * dy), at = 0;
            while (L - at >= need) { at += need; out.push([A[0] + dx * at / L, A[1] + dy * at / L]); need = h; }
            need -= L - at;
        }
        if (closed) { var e = out[out.length - 1], z = out[0]; if (out.length > 3 && Math.abs(e[0] - z[0]) + Math.abs(e[1] - z[1]) < h * 0.5) out.pop(); }
        else out[out.length - 1] = P[n - 1].slice();
        return out;
    }
    /* a gaussian along a line. Closed: round; open: its ends stay where they are and keep their direction */
    function gauss(P, sg, closed) {
        var n = P.length, rad = Math.ceil(sg * 3), K = [], ks = 0, k, i, out = [];
        if (sg < 0.05 || n < 3) return P.map(function (a) { return a.slice(); });
        if (!closed && rad > n - 1) rad = n - 1;
        for (k = -rad; k <= rad; k++) { var v = Math.exp(-k * k / (2 * sg * sg)); K.push(v); ks += v; }
        for (i = 0; i < n; i++) {
            var sx = 0, sy = 0;
            for (k = -rad; k <= rad; k++) {
                var j = i + k, wk = K[k + rad], qx, qy;
                if (closed) { var q = P[(j % n + n) % n]; qx = q[0]; qy = q[1]; }
                else if (j < 0) { qx = 2 * P[0][0] - P[-j][0]; qy = 2 * P[0][1] - P[-j][1]; }
                else if (j >= n) { var r = 2 * (n - 1) - j; qx = 2 * P[n - 1][0] - P[r][0]; qy = 2 * P[n - 1][1] - P[r][1]; }
                else { qx = P[j][0]; qy = P[j][1]; }
                sx += qx * wk; sy += qy * wk;
            }
            out.push([sx / ks, sy / ks]);
        }
        return out;
    }
    /* the small waves go, the shape and its size stay (2G - GG: a gaussian alone would shrink tight curves) */
    function smoothLine(P, sg, closed) {
        var n = P.length;
        sg = closed ? Math.min(sg, 0.1 * n) : Math.min(sg, (n - 1) / 6);
        if (sg < 0.2) return P;
        var G = gauss(P, sg, closed), GG = gauss(G, sg, closed), out = [];
        for (var i = 0; i < n; i++) out.push([2 * G[i][0] - GG[i][0], 2 * G[i][1] - GG[i][1]]);
        return out;
    }
    /* a quadratic through samples at 0, 1, 2 ... (least squares): coefficients [c0, c1, c2] for one coordinate */
    function quad(P, ax) {
        var n = P.length, S0 = 0, S1 = 0, S2 = 0, S3 = 0, S4 = 0, Y0 = 0, Y1 = 0, Y2 = 0, i;
        for (i = 0; i < n; i++) { var j2 = i * i, y = P[i][ax]; S0++; S1 += i; S2 += j2; S3 += j2 * i; S4 += j2 * j2; Y0 += y; Y1 += y * i; Y2 += y * j2; }
        var a = S0, b = S1, c = S2, d = S1, e = S2, f = S3, g = S2, h = S3, k = S4;
        var det = a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g);
        if (Math.abs(det) < 1e-9) return [Y0 / n, 0, 0];
        return [(Y0 * (e * k - f * h) - b * (Y1 * k - f * Y2) + c * (Y1 * h - e * Y2)) / det,
            (a * (Y1 * k - f * Y2) - Y0 * (d * k - f * g) + c * (d * Y2 - Y1 * g)) / det,
            (a * (e * Y2 - Y1 * h) - b * (d * Y2 - Y1 * g) + Y0 * (d * h - e * g)) / det];
    }
    /* where two sides of a corner meet: A and B run away from it (sample 0 nearest); each side continued as its curve */
    function meetSides(A, B) {
        var ax = quad(A, 0), ay = quad(A, 1), bx = quad(B, 0), by = quad(B, 1), s = 0, t = 0;
        /* (the two go back through parameter 0 to negative values: Newton from the meeting of their tangents) */
        for (var it = 0; it < 6; it++) {
            var fx = ax[0] + ax[1] * s + ax[2] * s * s - (bx[0] + bx[1] * t + bx[2] * t * t), fy = ay[0] + ay[1] * s + ay[2] * s * s - (by[0] + by[1] * t + by[2] * t * t);
            var a11 = ax[1] + 2 * ax[2] * s, a12 = -(bx[1] + 2 * bx[2] * t), a21 = ay[1] + 2 * ay[2] * s, a22 = -(by[1] + 2 * by[2] * t), det = a11 * a22 - a12 * a21;
            if (Math.abs(det) < 0.04) return null;      // (near parallel: no clear meeting)
            var ds = (fx * a22 - fy * a12) / det, dt = (a11 * fy - a21 * fx) / det;
            s -= ds; t -= dt;
            if (s > 2 || t > 2 || s < -40 || t < -40) return null;
        }
        return [ax[0] + ax[1] * s + ax[2] * s * s, ay[0] + ay[1] * s + ay[2] * s * s];
    }
    /* one closed outline (between the pixels, working px) -> an AE path (working px) */
    function fitContour(poly, sc, o) {
        var P = resample(poly, 1, true), n = P.length, i, k;
        if (n < 8) return null;
        /* corners: a sharp turn (most of it within half the window), the highest around */
        var sg0 = Math.max(0.8, 0.8 * sc), S = gauss(P, Math.min(sg0, 0.1 * n), true);
        var win = Math.max(4, Math.round(2.5 * sc + 3 * sg0)), hw = Math.max(2, Math.round(win * 0.45)), ang = new Float32Array(n), cs = [];
        var turn = function (i2, m) { var a = S[(i2 - m + n) % n], b = S[i2], c = S[(i2 + m) % n], u = nrm(sub(b, a)), v = nrm(sub(c, b)); return Math.acos(Math.max(-1, Math.min(1, dot(u, v)))) * (u[0] * v[1] - u[1] * v[0] < 0 ? -1 : 1); };
        var th = (o.corner || 50) * Math.PI / 180, wide = n > 8 * win;
        if (n > 4 * win) for (i = 0; i < n; i++) {
            var t1 = turn(i, win); if (Math.abs(t1) <= th) continue;
            var t2 = turn(i, hw); if (t1 * t2 <= 0 || Math.abs(t2) <= 0.62 * Math.abs(t1)) continue;
            if (wide) { var t3 = turn(i, 2 * win); if (t1 * t3 <= 0 || Math.abs(t3) <= 0.6 * th) continue; }      // (a wave in the line is gone at twice the distance, a corner is not)
            ang[i] = Math.abs(t1);
        }
        for (i = 0; i < n; i++) {
            if (!ang[i]) continue;
            var top = true; for (k = -win; k <= win && top; k++) { var j = (i + k + n) % n; if (j !== i && (ang[j] > ang[i] || (ang[j] === ang[i] && k < 0))) top = false; }
            if (top) cs.push(i);
        }
        /* each corner where its two sides meet: the field rounds a corner off, the sides do not know that */
        var C = [], u1 = Math.max(1, sc), tN = Math.max(2, Math.round(2.5 * u1 + 0.5));
        for (k = 0; k < cs.length; k++) {
            var ci = cs[k], gapA = cs.length > 1 ? (ci - cs[(k - 1 + cs.length) % cs.length] + n) % n : n, gapB = cs.length > 1 ? (cs[(k + 1) % cs.length] - ci + n) % n : n;
            var ina = nrm(sub(S[ci], S[(ci - win + n) % n])), outa = nrm(sub(S[(ci + win) % n], S[ci])), dirO = nrm(sub(ina, outa));
            /* the tip the outline itself reaches */
            var tip = P[ci], tb = -1e18;
            for (i = -hw; i <= hw; i++) { var pi = P[(ci + i + n) % n], de = dot(pi, dirO); if (de > tb) { tb = de; tip = pi; } }
            var pt = tip, span = Math.min(tN + Math.round(9 * u1) + 3, Math.floor(gapA / 2), Math.floor(gapB / 2));
            if (span >= tN + 3) {
                var pa = [], pb = [];
                for (i = tN; i <= span; i++) { pa.push(P[(ci - i + n) % n]); pb.push(P[(ci + i) % n]); }
                var X = meetSides(pa, pb);
                if (X) {
                    /* (the sharper the corner, the further the field has cut it back; no further than that) */
                    var sa = nrm(sub(pa[0], pa[pa.length - 1])), sb = nrm(sub(pb[pb.length - 1], pb[0])), cosT = Math.max(-1, Math.min(1, dot(sa, sb)));
                    var halfIn = Math.max(0.03, (Math.PI - Math.acos(cosT)) / 2), reach = u1 * Math.min(3.2, 0.35 + 0.35 / Math.tan(halfIn)), toX = sub(X, tip), lx = len(toX);
                    /* (far beyond that the sides only look like meeting: the blunt end of a stroke, its sides nearly parallel) */
                    if (dot(toX, dirO) > -0.75 * u1 && lx <= 2 * reach) pt = lx <= reach ? X : add(tip, mul(toX, reach / lx));
                }
            }
            C.push({ i: ci, p: pt });
        }
        var sgS = Math.max(0.3, (o.smooth === undefined ? 2.5 : o.smooth) * sc), tol = o.tol * sc, segs = [];
        if (C.length) {
            for (k = 0; k < C.length; k++) {
                var a2 = C[k], b2 = C[(k + 1) % C.length], e = b2.i > a2.i ? b2.i : b2.i + n, r = [a2.p];
                for (i = a2.i + tN; i <= e - tN; i++) r.push(P[i % n]);
                r.push(b2.p);
                var ru = r.length > 3 ? smoothLine(resample(r, 1, false), sgS, false) : r;
                fitRun(ru, true, tol, sc, segs);
            }
        } else {
            var Sm = smoothLine(P, sgS, true), tp = 0, r2 = [];
            for (i = 1; i < n; i++) if (Sm[i][1] < Sm[tp][1]) tp = i;
            for (i = 0; i <= n; i++) r2.push(Sm[(tp + i) % n]);
            fitRun(r2, false, tol, sc, segs);
        }
        if (!segs.length) return null;
        var p = { v: [], i: [], o: [], c: true };
        for (k = 0; k < segs.length; k++) { var Qk = segs[k]; p.v.push(Qk[0]); p.o.push(sub(Qk[1], Qk[0])); p.i.push(k ? sub(segs[k - 1][2], segs[k - 1][3]) : sub(segs[segs.length - 1][2], segs[segs.length - 1][3])); }
        return p;
    }
    /* a run from one corner (or split) to the next: straight if it is; else points at its extremes (level / upright
       handles) and one curve between each two (split further only if the tolerance needs it) */
    function fitRun(r, corner, tol, sc, segs) {
        var n = r.length, i, k;
        if (n < 2) return;
        var line = lineFit(r, 0, n - 1);
        var dl = 0, ch = sub(r[n - 1], r[0]), cl = len(ch);
        for (i = 1; i < n - 1; i++) dl = Math.max(dl, cl > 1e-9 ? Math.abs(ch[0] * (r[i][1] - r[0][1]) - ch[1] * (r[i][0] - r[0][0])) / cl : len(sub(r[i], r[0])));
        if (n < 4 || dl <= tol) { segs.push([r[0], r[0], r[n - 1], r[n - 1]]); return; }
        var A = [0]; for (i = 1; i < n; i++) A.push(A[i - 1] + len(sub(r[i], r[i - 1])));
        var Ltot = A[n - 1], m = Math.max(2, Math.round(1.2 * sc + 1)), cand = [], ax;
        for (ax = 0; ax < 2; ax++) {
            for (i = m; i < n - m; i++) {
                var v0 = r[i][ax], p0 = i, p1 = i;
                while (p1 + 1 < n - m && Math.abs(r[p1 + 1][ax] - v0) < 0.05) p1++;
                var lo = r[p0 - m][ax], hi2 = r[Math.min(n - 1, p1 + m)][ax], isMax = true, isMin = true;
                for (k = p0 - m; k <= Math.min(n - 1, p1 + m); k++) { if (r[k][ax] > v0 + 0.05) isMax = false; if (r[k][ax] < v0 - 0.05) isMin = false; }
                if ((isMax || isMin) && Math.min(Math.abs(v0 - lo), Math.abs(v0 - hi2)) > 0.02 * sc) {
                    var mid = (p0 + p1) >> 1, o2 = 1 - ax, sgn = r[Math.min(n - 1, p1 + m)][o2] - r[p0 - m][o2] < 0 ? -1 : 1;
                    cand.push({ i: mid, t: ax === 0 ? [0, sgn] : [sgn, 0] });
                }
                i = p1;
            }
        }
        cand.sort(function (a, b) { return a.i - b.i; });
        var dataT = function (i0, dir) { var j = i0, s = 0; while (j + dir >= 0 && j + dir < n && s < 2.5 * sc + 2) { s += len(sub(r[j + dir], r[j])); j += dir; } var d = nrm(sub(r[j], r[i0])); return dir > 0 ? d : mul(d, -1); };
        var split = [{ i: 0, t: dataT(0, 1) }], gap = Math.max(2 * sc, 0.06 * Ltot), last = 0;
        if (!corner) {                           // a loop with no corners: it starts at its top, level
            var tl = sub(r[Math.min(n - 1, m)], r[0]); split[0].t = [tl[0] < 0 ? -1 : 1, 0];
        }
        for (k = 0; k < cand.length; k++) { if (A[cand[k].i] - A[split[split.length - 1].i] < gap || Ltot - A[cand[k].i] < gap) continue; split.push(cand[k]); }
        split.push({ i: n - 1, t: corner ? dataT(n - 1, -1) : split[0].t });
        for (k = 0; k < split.length - 1; k++) {
            var a = split[k], b = split[k + 1]; if (b.i <= a.i) continue;
            var seg = r.slice(a.i, b.i + 1);
            var dl2 = 0, c2 = sub(seg[seg.length - 1], seg[0]), cl2 = len(c2);
            for (i = 1; i < seg.length - 1; i++) dl2 = Math.max(dl2, cl2 > 1e-9 ? Math.abs(c2[0] * (seg[i][1] - seg[0][1]) - c2[1] * (seg[i][0] - seg[0][0])) / cl2 : 0);
            if (dl2 <= tol * 0.5 && seg.length < 6 * sc + 8) { segs.push([seg[0], seg[0], seg[seg.length - 1], seg[seg.length - 1]]); continue; }
            fitCubic(seg, a.t, mul(b.t, -1), tol, segs, 0);
        }
    }
    /* a straight piece within 2.5 degrees of level / upright made exactly so */
    function snapAxis(p) {
        var n = p.v.length, z = function (hh) { return Math.abs(hh[0]) + Math.abs(hh[1]) < 1e-6; };
        for (var k = 0; k < n; k++) {
            var k1 = (k + 1) % n; if (!z(p.o[k]) || !z(p.i[k1])) continue;
            var dx = p.v[k1][0] - p.v[k][0], dy = p.v[k1][1] - p.v[k][1];
            if (Math.abs(dx) < Math.abs(dy) * 0.044) { var mx = (p.v[k][0] + p.v[k1][0]) / 2; p.v[k] = [mx, p.v[k][1]]; p.v[k1] = [mx, p.v[k1][1]]; }
            else if (Math.abs(dy) < Math.abs(dx) * 0.044) { var my = (p.v[k][1] + p.v[k1][1]) / 2; p.v[k] = [p.v[k][0], my]; p.v[k1] = [p.v[k1][0], my]; }
        }
        return p;
    }

    /* ------------------------------------------------------------------ the whole picture */
    /* o: { colors (0 = auto), tol (source px), corner (degrees), minArea (source px), mode "separate" | "stacked",
            ignoreBg, smooth (source px) } */
    function run(R, o) {
        o = o || {};
        var t0 = performance.now(), P = palette(R, o), tP = performance.now(), lb = labels(R, P, o), tL = performance.now(), w = R.w, h = R.h, N = w * h, p, k, i, cl = P.cl, tFit = 0, tLoop = 0;
        /* areas and bounds per colour; bottom = the largest */
        var cnt = new Float64Array(cl.length), bbs = [];
        for (k = 0; k < cl.length; k++) bbs.push([w, h, -1, -1]);
        for (p = 0; p < N; p++) { var L = lb[p]; if (L === 255) continue; cnt[L]++; var x = p % w, y = (p / w) | 0, b = bbs[L]; if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; }
        var order = []; for (k = 0; k < cl.length; k++) if (cnt[k] > 0) order.push(k);
        order.sort(function (a, b) { return cnt[b] - cnt[a]; });
        var z = new Int16Array(256).fill(-1); for (i = 0; i < order.length; i++) z[order[i]] = i;
        var hard = softness(R, lb, cl), mask = new Uint8Array(N), W = work(R), res = { w: R.W, h: R.H, colors: [], points: 0, paths: 0, ms: 0 }, rr = Math.max(2, Math.round(1.2 * R.s)) + Math.round(0.35 * (o.smooth === undefined ? 2.5 : o.smooth) * R.s);
        for (i = 0; i < order.length; i++) {
            var K = order[i], bb = [w, h, -1, -1];
            mask.fill(0);
            for (p = 0; p < N; p++) {
                var Lp = lb[p]; if (Lp === 255) continue;
                if (Lp === K || (o.mode === "stacked" && z[Lp] > i)) { mask[p] = 1; var xx = p % w, yy = (p / w) | 0; if (xx < bb[0]) bb[0] = xx; if (yy < bb[1]) bb[1] = yy; if (xx > bb[2]) bb[2] = xx; if (yy > bb[3]) bb[3] = yy; }
            }
            if (bb[2] < 0) continue;
            var tq0 = performance.now(), paths = [], sep = o.mode !== "stacked" && i < order.length - 1;
            /* the field of this colour; a little under the colours above it (no seams) */
            var sgF = 0.6 * Math.max(1, Math.sqrt(R.s)), rings = Math.max(2, Math.ceil(1.5 * R.s)), mg = rings + Math.ceil(Math.max(sgF, 1.1 * Math.max(1, R.s)) * 2.5) + rr + 3;
            var rc = [Math.max(0, bb[0] - mg), Math.max(0, bb[1] - mg), Math.min(w - 1, bb[2] + mg), Math.min(h - 1, bb[3] + mg)];
            softEdge(R, lb, cl, mask, rc, rings, W);
            blurField(R, W, rc, hard ? Math.max(sgF, 1.1 * Math.max(1, R.s)) : sgF);
            if (sep) underAbove(R, lb, z, i, W, rc, rr);
            var lp = middleLines(R, W, rc);
            clearField(R, W, rc);
            tLoop += performance.now() - tq0; tq0 = performance.now();
            for (k = 0; k < lp.length; k++) {
                if (Math.abs(area(lp[k])) < Math.max(2, (o.minArea || 4) * R.s * R.s * 0.5)) continue;
                var tolS = o.tol || 0.5, smS = o.smooth === undefined ? 2.5 : o.smooth;
                if (hard) { tolS = Math.max(tolS, 0.6); smS = Math.max(smS * 1.6, 3); }
                var pa = fitContour(lp[k], R.s, { tol: tolS * 0.8, corner: o.corner || 35, smooth: smS });
                if (!pa) continue;
                pa = snapAxis(UK_PSIMP.simplify(pa, tolS * R.s * 0.4));
                /* back to source pixels */
                var f = 1 / R.s;
                for (var v = 0; v < pa.v.length; v++) { pa.v[v] = [pa.v[v][0] * f, pa.v[v][1] * f]; pa.i[v] = [pa.i[v][0] * f, pa.i[v][1] * f]; pa.o[v] = [pa.o[v][0] * f, pa.o[v][1] * f]; }
                paths.push(pa); res.points += pa.v.length;
            }
            tFit += performance.now() - tq0;
            if (!paths.length) continue;
            var c = cl[K];
            res.colors.push({ hex: hex(c.r, c.g, c.b), rgb: [c.r / 255, c.g / 255, c.b / 255], area: cnt[K] / (R.s * R.s), paths: paths });
            res.paths += paths.length;
        }
        res.ms = Math.round(performance.now() - t0); res.t = { palette: Math.round(tP - t0), labels: Math.round(tL - tP), loops: Math.round(tLoop), fit: Math.round(tFit) };
        return res;
    }
    /* the earlier one-colour API (src: a data URL): { w, h, color, groups: [{ name, fill, evenOdd, paths }] } */
    function trace(src, opts) {
        return new Promise(function (res, rej) {
            var im = new Image();
            im.onload = function () {
                try {
                    var R = prepare(im), r = run(R, { colors: 1, tol: (opts && opts.tol) || 0.8 }), c = r.colors[0];
                    if (!c) throw new Error("The image is completely transparent.");
                    res({ w: r.w, h: r.h, color: c.hex, groups: [{ name: "Traced", fill: c.hex, evenOdd: true, paths: c.paths }] });
                } catch (e) { rej(e); }
            };
            im.onerror = function () { rej(new Error("Could not read the image")); };
            im.src = src;
        });
    }
    var UKTrace = { prepare: prepare, run: run, trace: trace };
    return UKTrace;
})();

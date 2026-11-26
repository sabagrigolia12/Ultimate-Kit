/*  Ultimate Kit - PNG alpha tracer
    Traces the opaque area of an image into smooth closed paths (holes included) plus the
    image's dominant colour, in the image's own pixel coordinates.                       */
var UKTrace = (function () {
    function loadImage(src) {
        return new Promise(function (res, rej) {
            var im = new Image();
            im.onload = function () { res(im); };
            im.onerror = function () { rej(new Error("Could not read the image")); };
            im.src = src;
        });
    }
    /* directed boundary edges around inside pixels, chained into loops */
    function loops(mask, W, H) {
        var edges = {}, count = 0;
        function inside(x, y) { return x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x]; }
        function add(x1, y1, x2, y2) {
            var k = x1 + "," + y1;
            (edges[k] = edges[k] || []).push([x2, y2]);
            count++;
        }
        for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
            if (!mask[y * W + x]) continue;
            if (!inside(x, y - 1)) add(x, y, x + 1, y);
            if (!inside(x + 1, y)) add(x + 1, y, x + 1, y + 1);
            if (!inside(x, y + 1)) add(x + 1, y + 1, x, y + 1);
            if (!inside(x - 1, y)) add(x, y + 1, x, y);
        }
        var out = [];
        for (var key in edges) {
            while (edges[key] && edges[key].length) {
                var p = key.split(",").map(Number), loop = [p], cur = p, guard = 0, prevDir = null;
                while (guard++ < 200000) {
                    var k2 = cur[0] + "," + cur[1], list = edges[k2];
                    if (!list || !list.length) break;
                    var pick = 0;
                    if (list.length > 1 && prevDir) {           // at a saddle prefer turning right (keeps loops separate)
                        for (var q = 0; q < list.length; q++) {
                            var d = [list[q][0] - cur[0], list[q][1] - cur[1]];
                            if (prevDir[0] * d[1] - prevDir[1] * d[0] > 0) { pick = q; break; }
                        }
                    }
                    var nx = list.splice(pick, 1)[0];
                    prevDir = [nx[0] - cur[0], nx[1] - cur[1]];
                    if (nx[0] === p[0] && nx[1] === p[1]) break;
                    loop.push(nx);
                    cur = nx;
                }
                if (loop.length >= 4) out.push(loop);
            }
        }
        return out;
    }
    function collinear(pts) {
        var out = [], n = pts.length;
        for (var i = 0; i < n; i++) {
            var a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
            if ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) !== 0) out.push(b);
        }
        return out;
    }
    /* soften the pixel staircase (keeps real corners mostly sharp after RDP) */
    function relax(pts, iterations) {
        var p = pts.slice(0), n = p.length;
        for (var it = 0; it < iterations; it++) {
            var q = [];
            for (var i = 0; i < n; i++) {
                var a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n];
                q.push([(a[0] + 2 * b[0] + c[0]) / 4, (a[1] + 2 * b[1] + c[1]) / 4]);
            }
            p = q;
        }
        return p;
    }
    function rdp(pts, eps) {
        if (pts.length < 3) return pts;
        var dmax = 0, idx = 0, a = pts[0], b = pts[pts.length - 1];
        var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
        for (var i = 1; i < pts.length - 1; i++) {
            var d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len;
            if (d > dmax) { dmax = d; idx = i; }
        }
        if (dmax > eps) {
            var l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps);
            return l.slice(0, -1).concat(r);
        }
        return [a, b];
    }
    function simplifyClosed(pts, eps) {
        // split the loop at its two farthest points so RDP works on open chains
        var far = 0, fi = 0;
        for (var i = 1; i < pts.length; i++) { var d = Math.pow(pts[i][0] - pts[0][0], 2) + Math.pow(pts[i][1] - pts[0][1], 2); if (d > far) { far = d; fi = i; } }
        var a = rdp(pts.slice(0, fi + 1), eps), b = rdp(pts.slice(fi).concat([pts[0]]), eps);
        return a.slice(0, -1).concat(b.slice(0, -1));
    }
    /* Catmull-Rom tangents, but sharp corners (> ~55 deg turn) keep zero tangents */
    function smooth(pts, scale) {
        var n = pts.length, v = [], ii = [], oo = [];
        for (var i = 0; i < n; i++) {
            var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
            var ax = p1[0] - p0[0], ay = p1[1] - p0[1], bx = p2[0] - p1[0], by = p2[1] - p1[1];
            var la = Math.sqrt(ax * ax + ay * ay) || 1, lb = Math.sqrt(bx * bx + by * by) || 1;
            var cos = (ax * bx + ay * by) / (la * lb);
            v.push([p1[0] * scale, p1[1] * scale]);
            if (cos < 0.45) { ii.push([0, 0]); oo.push([0, 0]); continue; }
            var tx = (p2[0] - p0[0]), ty = (p2[1] - p0[1]), tl = Math.sqrt(tx * tx + ty * ty) || 1;
            tx /= tl; ty /= tl;
            ii.push([-tx * la / 3 * scale, -ty * la / 3 * scale]);
            oo.push([tx * lb / 3 * scale, ty * lb / 3 * scale]);
        }
        return { v: v, i: ii, o: oo, c: true };
    }
    function hex2(n) { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? "0" : "") + n.toString(16); }

    /* src: data URL. returns Promise<{ w, h, groups }> */
    function trace(src, opts) {
        opts = opts || {};
        return loadImage(src).then(function (im) {
            var W0 = im.naturalWidth, H0 = im.naturalHeight;
            var maxSide = opts.maxSide || 600, s = Math.min(1, maxSide / Math.max(W0, H0));
            var W = Math.max(2, Math.round(W0 * s)), H = Math.max(2, Math.round(H0 * s));
            var cv = document.createElement("canvas");
            cv.width = W; cv.height = H;
            var g = cv.getContext("2d");
            g.drawImage(im, 0, 0, W, H);
            var data = g.getImageData(0, 0, W, H).data;
            var mask = new Uint8Array(W * H), r = 0, gg = 0, b = 0, n = 0, opaque = 0;
            for (var i = 0; i < W * H; i++) {
                var a = data[i * 4 + 3];
                if (a > 127) { mask[i] = 1; opaque++; }
                if (a > 200) { r += data[i * 4]; gg += data[i * 4 + 1]; b += data[i * 4 + 2]; n++; }
            }
            if (opaque === W * H) {
                // fully opaque image: use its rectangle (rounded a little)
                for (i = 0; i < W * H; i++) mask[i] = 1;
            }
            if (!opaque) throw new Error("The image is completely transparent.");
            var L = loops(mask, W, H), paths = [];
            var eps = Math.max(0.9, Math.max(W, H) / 450);
            for (var k = 0; k < L.length; k++) {
                if (L[k].length < 8) continue;                    // ignore specks
                var pts = relax(L[k], 2);
                var simp = simplifyClosed(pts, eps);
                if (simp.length < 3) continue;
                paths.push(smooth(simp, 1 / s));
            }
            var col = n ? "#" + hex2(r / n) + hex2(gg / n) + hex2(b / n) : "#7c5cff";
            return { w: W0, h: H0, color: col, groups: [{ name: "Traced", fill: col, evenOdd: true, paths: paths }] };
        });
    }
    return { trace: trace };
})();

/*  Ultimate Kit - Wipe Reveal preview (canvas), built like the AE layers (jsx/wipe.jsx). Pixel Wipe: the picture through
    a hard 100 x 56 cell matte whose edge is broken up by moving turbulence; under it the same matte Pixel Band frames
    ahead (coming in) or behind (the ending) as a glowing field of cells: fill Color 1 -> Color 2, flicker, a bright dot. */
var UKWipePrev = (function () {
    var cl = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var GX = 100, GY = 50, SS = 3, CW = 1920, CH = 1080;
    var pic = null, field = null, tile = null, bufs = {};
    function picture() {
        if (pic) return pic;
        var S = UKDepthPrev.scene(), W = UKDepthPrev.IW, H = UKDepthPrev.IH, n = W * H, i;
        pic = document.createElement("canvas"); pic.width = W; pic.height = H;
        var g = pic.getContext("2d"), im = g.createImageData(W, H);
        for (i = 0; i < n; i++) { im.data[i * 4] = S.rgb[i * 3]; im.data[i * 4 + 1] = S.rgb[i * 3 + 1]; im.data[i * 4 + 2] = S.rgb[i * 3 + 2]; im.data[i * 4 + 3] = 255; }
        g.putImageData(im, 0, 0);
        return pic;
    }
    function hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, y) {
        var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
        var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
        return (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy) * 2 - 1;
    }
    /* the turbulence that breaks the edge, sampled SS x SS per block (comp pixels, pinned at the frame edges) */
    function getField() {
        if (field) return field;
        var nx = GX * SS, ny = GY * SS, X = new Float32Array(nx * ny), Y = new Float32Array(nx * ny), D = new Float32Array(nx * ny), Ds = new Float32Array(nx * ny), i, j;
        for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
            var k = j * nx + i, x = (i + 0.5) / nx * CW, y = (j + 0.5) / ny * CH;
            var pin = Math.min(1, Math.min(x, CW - x, y, CH - y) / 40);
            X[k] = x; Y[k] = y;
            D[k] = pin * (62 * noise(x / 64 + 3.1, y / 64 + 7.7) + 30 * noise(x / 23 + 11.3, y / 23 + 1.9));
            Ds[k] = pin * 75 * noise(x / 320 + 5.3, y / 320 + 2.1);     // Sparkle Wipe: long smooth waves
        }
        field = { X: X, Y: Y, D: D, Ds: Ds, n: nx * ny, nx: nx };
        return field;
    }
    /* block coverage (Mosaic averages the matte) for wipe s 0..1 */
    function coverage(s, o, out) {
        var F = getField(), k, i;
        for (i = 0; i < GX * GY; i++) out[i] = 0;
        if (s <= 0) return out;
        if (s >= 1) { for (i = 0; i < GX * GY; i++) out[i] = 1; return out; }
        var cx = CW / 2, cy = CH / 2, radial = !!o.radial, a = (o.angle === undefined ? 90 : o.angle) * Math.PI / 180;
        var dx = Math.sin(a), dy = -Math.cos(a), R = (Math.abs(dx) * CW + Math.abs(dy) * CH) / 2, f = -R + 2 * R * s, r = s * Math.sqrt(CW * CW + CH * CH) / 2;
        var w = 1 / (SS * SS), DD = o.look === "sparkle" ? F.Ds : F.D;
        for (k = 0; k < F.n; k++) {
            var x = F.X[k] - cx, y = F.Y[k] - cy, u = radial ? Math.sqrt(x * x + y * y) - r : x * dx + y * dy - f;
            if (u + DD[k] < 0) { var col = Math.floor((k % F.nx) / SS), row = Math.floor(Math.floor(k / F.nx) / SS); out[row * GX + col] += w; }
        }
        return out;
    }
    function maskCanvas(key, cov) {
        var m = bufs[key] || (bufs[key] = (function () { var c = document.createElement("canvas"); c.width = GX; c.height = GY; return c; })());
        var g = m.getContext("2d"), im = g.createImageData(GX, GY), i;
        for (i = 0; i < GX * GY; i++) { im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 255; im.data[i * 4 + 3] = Math.round(cov[i] * 255); }
        g.putImageData(im, 0, 0);
        return m;
    }
    function buf(key, w, h) {
        var c = bufs[key] || (bufs[key] = document.createElement("canvas"));
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        var g = c.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.filter = "none"; g.clearRect(0, 0, w, h);
        return c;
    }
    /* one bright ball per block (CC Ball Action, seen at preview size) */
    function dotTile() {
        if (tile) return tile;
        tile = document.createElement("canvas"); tile.width = tile.height = 32;
        var g = tile.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 9);
        r.addColorStop(0, "rgba(255,255,255,0.95)"); r.addColorStop(0.45, "rgba(255,255,255,0.55)"); r.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = r; g.fillRect(0, 0, 32, 32);
        return tile;
    }
    function hex(h) { var n = parseInt(String(h || "#fff").replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    function rgb(c, k) { return "rgb(" + Math.round(c[0] * k) + "," + Math.round(c[1] * k) + "," + Math.round(c[2] * k) + ")"; }
    var covA = new Float32Array(GX * GY), covB = new Float32Array(GX * GY);
    /* o: { look pixel|color, dur, angle, radial, c1, c2, glow, maxW, thumb } */
    function draw(cv, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(cw * dpr)), H = Math.round(W * ch / cw);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var D = cl(o.dur || 1.333, 0.2, 4), lead = 0.4, ends = (!o.look || o.look === "pixel") && (o.ending === "same" || o.ending === "back"), cyc = ends ? lead + D + 0.7 + D + 0.5 : lead + D + 0.1 + 1.1, tt = o.thumb ? lead + D * 0.5 : t % cyc, sm = function (x) { x = cl(x, 0, 1); return x * x * (3 - 2 * x); };
        var s = sm((tt - lead) / D), s2 = sm((tt + 0.1 - lead) / D);
        var x = cv.getContext("2d");
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.filter = "none";
        x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
        // the comp is 16:9: fit it in the canvas
        var vw = Math.min(W, H * 16 / 9), vh = vw * 9 / 16, ox = (W - vw) / 2, oy = (H - vh) / 2;
        if (o.look === "color") { drawColor(x, W, H, vw, vh, ox, oy, s, o); return; }
        if (o.look === "sparkle") { drawSparkle(x, W, H, vw, vh, ox, oy, s, sm((tt + 0.034 - lead) / D), tt, o); return; }
        if (o.look === "grid") { drawGrid(x, W, H, vw, vh, ox, oy, s, sm((tt + 0.133 - lead) / D), o); return; }
        drawPixel(x, W, H, vw, vh, ox, oy, tt, lead, D, ends ? lead + D + 0.7 : -1, sm, o);
    }
    /* Pixel Wipe. One sample per cell (AE: Mosaic with Sharp Colors and hard alpha): a cell is in or out. The edge is
       broken up by two noises that keep changing (AE: two Turbulent Displace, their Evolution running). */
    var PX = 100, PY = 56, PAD = 110, BAND = 5 / 30, pxF = null;
    function pxField() {
        if (pxF) return pxF;
        var n = PX * PY, f = { x: new Float32Array(n), y: new Float32Array(n), pin: new Float32Array(n), a1: new Float32Array(n), b1: new Float32Array(n), a2: new Float32Array(n), b2: new Float32Array(n), fr: new Float32Array(n), ph: new Float32Array(n) }, i, j;
        for (j = 0; j < PY; j++) for (i = 0; i < PX; i++) {
            var k = j * PX + i, X = (i + 0.5) / PX * CW, Y = (j + 0.5) / PY * CH;
            f.x[k] = X - CW / 2; f.y[k] = Y - CH / 2; f.pin[k] = Math.min(1, Math.min(X, CW - X, Y, CH - Y) / 40);
            f.a1[k] = noise(X / 64 + 3.1, Y / 64 + 7.7); f.b1[k] = noise(X / 64 + 21.4, Y / 64 + 2.6);
            f.a2[k] = noise(X / 23 + 11.3, Y / 23 + 1.9); f.b2[k] = noise(X / 23 + 4.7, Y / 23 + 15.2);
            f.fr[k] = 1.4 + 2.6 * hash(i * 1.7, j * 2.3); f.ph[k] = hash(i * 3.3, j * 0.9);
        }
        return (pxF = f);
    }
    /* si / so: the wipe and its ending at this moment; the cells inside go to out (1 / 0) */
    function pxCover(si, so, rev, T, o, out) {
        var F = pxField(), n = PX * PY, a = (o.angle === undefined ? 90 : o.angle) * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), radial = !!o.radial, k;
        var R = (Math.abs(dx) * CW + Math.abs(dy) * CH) / 2 + PAD, Rr = Math.sqrt(CW * CW + CH * CH) / 2 + PAD;
        var sI = rev ? si * (1 - so) : si, sO = rev ? 0 : so;
        var fI = radial ? sI * Rr : -R + 2 * R * sI, fO = radial ? sO * Rr : -R + 2 * R * sO;
        var c1 = Math.cos(T * 6.283), s1 = Math.sin(T * 6.283), c2 = Math.cos(T * 9.08), s2 = Math.sin(T * 9.08);
        for (k = 0; k < n; k++) {
            if (sI <= 0) { out[k] = 0; continue; }
            var u = radial ? Math.sqrt(F.x[k] * F.x[k] + F.y[k] * F.y[k]) : F.x[k] * dx + F.y[k] * dy;
            var d = F.pin[k] * (62 * (F.a1[k] * c1 + F.b1[k] * s1) + 30 * (F.a2[k] * c2 + F.b2[k] * s2));
            out[k] = u + d < fI && (sO <= 0 || u + d >= fO) ? 1 : 0;
        }
        return out;
    }
    var pxA = new Uint8Array(100 * 56), pxB = new Uint8Array(100 * 56);
    function pxCanvas(key) { var c = bufs[key] || (bufs[key] = (function () { var m = document.createElement("canvas"); m.width = PX; m.height = PY; return m; })()); return c; }
    function drawPixel(x, W, H, vw, vh, ox, oy, tt, lead, D, E0, sm, o) {
        var rev = o.ending === "back", E1 = E0 + D, ends = E0 >= 0;
        var si = function (T) { return sm((T - lead) / D); }, so = function (T) { return ends ? sm((T - E0) / D) : 0; };
        // the pixels' own time: ahead coming in (from nothing at the start), behind in the ending (down to nothing at its end)
        var mid = ends ? (lead + D + E0) / 2 : 1e9, tp = tt < mid ? tt + Math.min(BAND, Math.max(tt, 0)) : tt - Math.min(BAND, Math.max(E1 - tt, 0));
        pxCover(si(tp), so(tp), rev, tp, o, pxB);
        var c1 = hex(o.c1 || "#B67CFF"), c2 = hex(o.c2 || "#8E33FF"), F = pxField(), m = pxCanvas("pxB"), mg = m.getContext("2d"), im = mg.createImageData(PX, PY), i, j;
        for (j = 0; j < PY; j++) for (i = 0; i < PX; i++) {
            var k = j * PX + i, q = k * 4;
            if (!pxB[k]) { im.data[q + 3] = 0; continue; }
            var v = (j + 0.5) / PY, fl = (0.72 + 0.14 * Math.sin((tt * F.fr[k] + F.ph[k]) * 6.283)) * 0.86;   // AE: Fractal Noise in Multiply, a cell at a time
            im.data[q] = (c1[0] + (c2[0] - c1[0]) * v) * fl; im.data[q + 1] = (c1[1] + (c2[1] - c1[1]) * v) * fl; im.data[q + 2] = (c1[2] + (c2[2] - c1[2]) * v) * fl; im.data[q + 3] = 255;
        }
        mg.putImageData(im, 0, 0);
        var B = buf("dots", W, H), g = B.getContext("2d"), bw = vw / PX, bh = vh / PY;
        g.imageSmoothingEnabled = false;
        g.drawImage(m, ox, oy, vw, vh);
        var pt = g.createPattern(dotTile(), "repeat");
        if (pt.setTransform) pt.setTransform(new DOMMatrix([bw / 32, 0, 0, bh / 32, ox, oy]));
        g.globalCompositeOperation = "source-atop"; g.fillStyle = pt; g.fillRect(ox, oy, vw, vh);
        if (o.glow !== false) {
            x.globalCompositeOperation = "screen";
            x.filter = "blur(" + Math.max(2, vw * 0.06).toFixed(1) + "px)"; x.globalAlpha = 0.85; x.drawImage(B, 0, 0);
            x.filter = "blur(" + Math.max(1, vw * 0.012).toFixed(1) + "px)"; x.globalAlpha = 0.7; x.drawImage(B, 0, 0);
            x.filter = "none"; x.globalAlpha = 1;
        }
        x.globalCompositeOperation = "source-over";
        x.drawImage(B, 0, 0);
        // the picture through the same cells, on time
        pxCover(si(tt), so(tt), rev, tt, o, pxA);
        var a = pxCanvas("pxA"), ag = a.getContext("2d"), am = ag.createImageData(PX, PY);
        for (i = 0; i < PX * PY; i++) { am.data[i * 4] = am.data[i * 4 + 1] = am.data[i * 4 + 2] = 255; am.data[i * 4 + 3] = pxA[i] ? 255 : 0; }
        ag.putImageData(am, 0, 0);
        var P = buf("pic", W, H), q2 = P.getContext("2d");
        picTo(q2, vw, vh, ox, oy);
        q2.globalCompositeOperation = "destination-in"; q2.imageSmoothingEnabled = false;
        q2.drawImage(a, ox, oy, vw, vh);
        x.drawImage(P, 0, 0);
    }
    /* Color Wipe: the picture, over it the Color 1 -> Color 2 ramp along the angle, taken away by a soft
       Linear Wipe (feather 27 % of the width; AE's threshold c (1 + f) - f)                          */
    function drawColor(x, W, H, vw, vh, ox, oy, s, o) {
        var im = picture(), sc = Math.max(vw / im.width, vh / im.height);
        x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
        x.drawImage(im, ox + (vw - im.width * sc) / 2, oy + (vh - im.height * sc) / 2, im.width * sc, im.height * sc);
        if (s >= 1) return;
        var a = (o.angle === undefined ? 90 : o.angle) * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), k = vw / CW;
        var R = (Math.abs(dx) * CW + Math.abs(dy) * CH) / 2 * k, cx = ox + vw / 2, cy = oy + vh / 2;
        var P = function (t) { return [cx + dx * R * (2 * t - 1), cy + dy * R * (2 * t - 1)]; };
        var f = 0.27 * vw / (2 * R), th = s * (1 + f) - f, p0 = P(0), p1 = P(1), q0 = P(th), q1 = P(th + f);
        var B = buf("ramp", W, H), g = B.getContext("2d");
        var gr = g.createLinearGradient(p0[0], p0[1], p1[0], p1[1]); gr.addColorStop(0, o.c1 || "#FFFFFF"); gr.addColorStop(1, o.c2 || "#BE11FF");
        g.fillStyle = gr; g.fillRect(ox, oy, vw, vh);
        var m = g.createLinearGradient(q0[0], q0[1], q1[0], q1[1]); m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(1, "rgba(0,0,0,1)");
        g.globalCompositeOperation = "destination-in"; g.fillStyle = m; g.fillRect(0, 0, W, H);
        x.drawImage(B, 0, 0);
    }
    function picTo(g, vw, vh, ox, oy) {
        var im = picture(), sc = Math.max(vw / im.width, vh / im.height);
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
        g.drawImage(im, ox + (vw - im.width * sc) / 2, oy + (vh - im.height * sc) / 2, im.width * sc, im.height * sc);
    }
    function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    /* Sparkle Wipe: the picture through a soft wavy edge, a seam of light just ahead of it (added, glowing) and
       fine four-point glints that pop in and out along the front, each at a new place every cycle (as the
       AE shape layer "Glints" does it)                                                                   */
    function star(g, x, y, R, r, rot) {
        g.beginPath();
        for (var k = 0; k < 8; k++) {
            var a = rot + k * Math.PI / 4, d = k % 2 ? r : R;
            if (k) g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); else g.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
        }
        g.closePath(); g.fill();
    }
    function seeded(n) { return function () { n++; return hash(n * 1.37, n * 0.71 + 3.3); }; }
    function drawSparkle(x, W, H, vw, vh, ox, oy, s, s2, tt, o) {
        var k = vw / CW, c1 = o.c1 || "#FFF3DC", c2 = o.c2 || "#F2C27B", i;
        // the seam
        coverage(s2, o, covB);
        var B = buf("dots", W, H), g = B.getContext("2d");
        var gr = g.createLinearGradient(0, oy, 0, oy + vh); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
        g.fillStyle = gr; g.fillRect(ox, oy, vw, vh);
        g.globalCompositeOperation = "destination-in"; g.imageSmoothingEnabled = true;
        g.filter = "blur(" + Math.max(1, vw * 0.012).toFixed(1) + "px)";
        g.drawImage(maskCanvas("mB", covB), ox, oy, vw, vh);
        g.filter = "none";
        if (o.glow !== false) {
            x.globalCompositeOperation = "lighter";
            x.filter = "blur(" + Math.max(2, vw * 0.05).toFixed(1) + "px)"; x.globalAlpha = 0.8; x.drawImage(B, 0, 0);
            x.filter = "none"; x.globalAlpha = 1;
        }
        x.globalCompositeOperation = "lighter"; x.drawImage(B, 0, 0); x.globalCompositeOperation = "source-over";
        // the picture
        coverage(s, o, covA);
        var P = buf("pic", W, H), q = P.getContext("2d");
        picTo(q, vw, vh, ox, oy);
        q.globalCompositeOperation = "destination-in"; q.imageSmoothingEnabled = true;
        q.drawImage(maskCanvas("mA", covA), ox, oy, vw, vh);
        x.drawImage(P, 0, 0);
        // the glints
        if (s <= 0 || s >= 1) return;
        var G = buf("glints", W, H), gg = G.getContext("2d"), win = cl(s * 12, 0, 1) * cl((1 - s) * 8, 0, 1);
        var a = (o.angle === undefined ? 90 : o.angle) * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), pad = CW * 0.035 / 2;
        var R = (Math.abs(dx) * CW + Math.abs(dy) * CH) / 2 + pad, L = Math.abs(dy) * CW + Math.abs(dx) * CH;
        gg.fillStyle = c1;
        for (i = 1; i <= 26; i++) {
            var per = 0.5 + 0.45 * ((i * 0.618034) % 1), ph = (i * 0.381966) % 1, cyc = Math.floor(tt / per + ph), kk = (tt / per + ph) % 1;
            var rnd = seeded(i * 97 + cyc * 13), u = (rnd() * 0.075 - 0.015) * CW, v = rnd() - 0.5, th = rnd() * 6.283, z = (0.3 + rnd() * 0.7) * Math.pow(Math.sin(Math.PI * kk), 4) * win;
            if (z < 0.03) continue;
            var px, py;
            if (o.radial) { var r = s * (Math.sqrt(CW * CW + CH * CH) / 2 + pad) + u; px = CW / 2 + r * Math.cos(th); py = CH / 2 + r * Math.sin(th); }
            else { var f = -R + 2 * R * s + u; px = CW / 2 + dx * f - dy * v * L; py = CH / 2 + dy * f + dx * v * L; }
            px = ox + px * k; py = oy + py * k;
            var rot = (hash(i, 31) - 0.5) * 0.9 + tt * 0.2, sz = z * k * 1.4;
            star(gg, px, py, 46 * sz, 2.2 * sz, rot);
            star(gg, px, py, 17 * sz, 1.6 * sz, rot + Math.PI / 4);
            gg.beginPath(); gg.arc(px, py, 3.5 * sz, 0, 6.283); gg.fill();
        }
        if (o.glow !== false) {
            x.globalCompositeOperation = "lighter";
            x.filter = "blur(" + Math.max(1, vw * 0.006).toFixed(1) + "px)"; x.drawImage(G, 0, 0);
            x.filter = "none";
        }
        x.globalCompositeOperation = "lighter"; x.drawImage(G, 0, 0); x.globalCompositeOperation = "source-over";
    }
    /* Grid Wipe: 16 cells across fade in one after another (feathered front + per-cell offset); glowing grid
       lines 4 frames ahead                                                                                */
    function cells(s, o, nx, ny, out) {
        var a = (o.angle === undefined ? 90 : o.angle) * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), F = 0.35, i, j;
        var R = (Math.abs(dx) * CW + Math.abs(dy) * CH) / 2, D2 = Math.sqrt(CW * CW + CH * CH) / 2;
        for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
            var x0 = (i + 0.5) / nx * CW - CW / 2, y0 = (j + 0.5) / ny * CH - CH / 2;
            var t = o.radial ? Math.sqrt(x0 * x0 + y0 * y0) / D2 : (x0 * dx + y0 * dy + R) / (2 * R);
            t = t * 0.8 + hash(i * 3.1, j * 7.7) * 0.2;
            out[j * nx + i] = s <= 0 ? 0 : s >= 1 ? 1 : cl((s * (1 + F) - t) / F, 0, 1);
        }
        return out;
    }
    var cA = new Float32Array(16 * 16), cB = new Float32Array(16 * 16);
    function drawGrid(x, W, H, vw, vh, ox, oy, s, s2, o) {
        var nx = 16, ny = 9, cw = vw / nx, ch = vh / ny, i, j, c1 = hex(o.c1 || "#6EE7FF"), c2 = hex(o.c2 || "#3B5BFF");
        cells(s2, o, nx, ny, cB);
        var B = buf("dots", W, H), g = B.getContext("2d");
        g.lineWidth = Math.max(1, vw / 480);
        for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
            var a = cB[j * nx + i]; if (a <= 0) continue;
            var c = mix(c1, c2, (j + 0.5) / ny);
            g.strokeStyle = "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + a.toFixed(3) + ")";
            g.strokeRect(ox + i * cw, oy + j * ch, cw, ch);
        }
        if (o.glow !== false) {
            x.globalCompositeOperation = "screen";
            x.filter = "blur(" + Math.max(1.5, vw * 0.012).toFixed(1) + "px)"; x.drawImage(B, 0, 0); x.drawImage(B, 0, 0);
            x.filter = "none";
        }
        x.globalCompositeOperation = "lighter"; x.drawImage(B, 0, 0); x.globalCompositeOperation = "source-over";
        cells(s, o, nx, ny, cA);
        var m = bufs.mG || (bufs.mG = document.createElement("canvas")); m.width = nx; m.height = ny;
        var mg = m.getContext("2d"), im = mg.createImageData(nx, ny);
        for (i = 0; i < nx * ny; i++) { im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 255; im.data[i * 4 + 3] = Math.round(cA[i] * 255); }
        mg.putImageData(im, 0, 0);
        var P = buf("pic", W, H), q = P.getContext("2d");
        picTo(q, vw, vh, ox, oy);
        q.globalCompositeOperation = "destination-in"; q.imageSmoothingEnabled = false;
        q.drawImage(m, ox, oy, vw, vh);
        x.drawImage(P, 0, 0);
    }
    function Player(cv) { this.cv = cv; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (o) { if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.restart = function () { this.t = 0; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) { if (!self.running) return; self.t += Math.min(0.1, (now - last) / 1000); last = now; if (document.body.contains(self.cv)) draw(self.cv, self.t, self.o); requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player };
})();

/*  Ultimate Kit - SaaS background preview (canvas). Mirrors jsx/saasbg.jsx: the same element list
    from UK_CAT.saasBg, intro (0..T0) then the float cycle (Catmull-Rom like AE auto-bezier), blur and
    blend modes. Gradient looks are drawn from the sampled mesh; noise layers are approximated.     */
var UKSaas = (function () {
    var BLUR = 0.28;   // AE Gaussian Blur: sigma = 0.28 x Blurriness (measured) -> canvas blur radius
    var MODES = { add: "lighter", screen: "screen", normal: "source-over", multiply: "multiply", overlay: "overlay", soft: "soft-light" };
    function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
    function hex3(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
    function cr(a, b, c, d, f) {
        if (typeof b === "number") return b + 0.5 * f * (c - a + f * (2 * a - 5 * b + 4 * c - d + f * (3 * (b - c) + d - a)));
        var o = [];
        for (var i = 0; i < b.length; i++) o.push(cr(a[i], b[i], c[i], d[i], f));
        return o;
    }
    function lerp(a, b, e) {
        if (typeof a === "number") return a + (b - a) * e;
        var o = []; for (var i = 0; i < a.length; i++) o.push(lerp(a[i], b[i], e)); return o;
    }
    function ease(x) { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    /* value of a key list: intro (0..T0) then the periodic cycle */
    function val(vals, X, ph, iv, pts) {
        var list = (vals instanceof Array && (pts ? vals[0] instanceof Array && vals[0][0] instanceof Array : (vals[0] instanceof Array || typeof vals[0] === "number"))) ? vals : [vals];
        var n = list.length;
        var at = function (u) {
            if (n === 1) return list[0];
            var s = u * n + (ph || 0), i = Math.floor(s), f = s - i;
            var g = function (k) { return list[((k % n) + n) % n]; };
            return cr(g(i - 1), g(i), g(i + 1), g(i + 2), f);
        };
        if (X.tl < X.T0) { var v0 = at(0); return (iv !== undefined && iv !== null) ? lerp(iv, v0, ease(X.tl / X.T0)) : v0; }
        return at(((X.tl - X.T0) % X.P) / X.P);
    }
    function bez(ctx, pts, closed, U) {
        var n = pts.length, v = [], i;
        for (i = 0; i < n; i++) v.push([pts[i][0] * U, pts[i][1] * U]);
        var tan = function (i) {
            var a = v[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = v[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
            var m = (!closed && (i === 0 || i === n - 1)) ? 2 : 1;
            return [(b[0] - a[0]) / 6 * m, (b[1] - a[1]) / 6 * m];
        };
        ctx.moveTo(v[0][0], v[0][1]);
        var last = closed ? n : n - 1;
        for (i = 0; i < last; i++) {
            var j = (i + 1) % n, t0 = tan(i), t1 = tan(j);
            ctx.bezierCurveTo(v[i][0] + t0[0], v[i][1] + t0[1], v[j][0] - t1[0], v[j][1] - t1[1], v[j][0], v[j][1]);
        }
        if (closed) ctx.closePath();
    }
    function rrect(ctx, w, h, r) {
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        ctx.moveTo(-w / 2 + r, -h / 2);
        ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, r); ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
        ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r); ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r);
        ctx.closePath();
    }
    var tmp = document.createElement("canvas"), small = document.createElement("canvas");

    /* the sampled C x R colour layout (16 x 9 up to 48 x 27), palette-linked (same mixing as the AE expressions) */
    function meshImage(key, cols) {
        var MD = UK_CAT.saasMesh[key], C = MD.c || 16, R = MD.r || 9, i, j;
        small.width = C + 2; small.height = R + 2;
        var g = small.getContext("2d"), id = g.createImageData(C + 2, R + 2), pal = [];
        for (i = 0; i < cols.length; i++) pal.push(hex3(cols[i]));
        for (var y = -1; y <= R; y++) for (var x = -1; x <= C; x++) {
            var cx = Math.max(0, Math.min(C - 1, x)), cy = Math.max(0, Math.min(R - 1, y)), s = MD.cells.substr((cy * C + cx) * 4, 4);
            var a = pal[+s.charAt(0)], b = pal[+s.charAt(1)], t = +s.substr(2) / 99, o = ((y + 1) * (C + 2) + (x + 1)) * 4;
            id.data[o] = a[0] + (b[0] - a[0]) * t; id.data[o + 1] = a[1] + (b[1] - a[1]) * t; id.data[o + 2] = a[2] + (b[2] - a[2]) * t; id.data[o + 3] = 255;
        }
        g.putImageData(id, 0, 0);
        return small;
    }
    /* 4-Color Gradient (inverse distance weighting, like AE's blend) */
    function g4Image(pts, cols, W, H) {
        var w = 48, h = 27, g, id, x, y, k;
        small.width = w; small.height = h; g = small.getContext("2d"); id = g.createImageData(w, h);
        var c = []; for (k = 0; k < 4; k++) c.push(hex3(cols[k]));
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
            var px = (x + 0.5) / w, py = (y + 0.5) / h, sw = 0, r = 0, gg = 0, b = 0;
            for (k = 0; k < 4; k++) {
                var dx = (px - pts[k][0]) * W / H, dy = py - pts[k][1], d2 = dx * dx + dy * dy + 1e-4, wt = 1 / (d2 * d2);
                sw += wt; r += c[k][0] * wt; gg += c[k][1] * wt; b += c[k][2] * wt;
            }
            var o = (y * w + x) * 4; id.data[o] = r / sw; id.data[o + 1] = gg / sw; id.data[o + 2] = b / sw; id.data[o + 3] = 255;
        }
        g.putImageData(id, 0, 0);
        return small;
    }

    function element(g, d, X) {
        var W = X.W, H = X.H, U = X.U, cols = X.cols, ph = d.ph || 0, iv = d.i || {};
        var at = d.at ? val(d.at, X, ph, iv.at) : [0.5, 0.5];
        var sc = (d.sc || iv.sc !== undefined) ? val(d.sc || 100, X, ph, iv.sc) / 100 : 1;
        var rot = (d.r0 || 0) + (typeof d.rot === "number" ? 360 * d.rot * (Math.max(0, X.tl - X.T0) / X.P) : ((d.rot || iv.rot !== undefined) ? val(d.rot || 0, X, ph, iv.rot) : 0));
        var op = (d.op instanceof Array && d.t !== "dots") || iv.op !== undefined ? val(d.op === undefined ? 100 : d.op, X, ph, iv.op) : (typeof d.op === "number" ? d.op : 100);
        g.save();
        g.globalCompositeOperation = MODES[d.m || "normal"] || "source-over";
        g.globalAlpha = Math.max(0, Math.min(1, op / 100));
        g.filter = d.blur ? "blur(" + (d.blur * U * BLUR).toFixed(1) + "px)" : "none";
        var i, k, x, y;
        switch (d.t) {
            case "mesh":
                var MDk = UK_CAT.saasMesh[d.key], img = meshImage(d.key, cols), cw = W / (MDk.c || 16), ch = H / (MDk.r || 9);
                g.filter = "blur(" + ((d.blur || 0.11) * U * BLUR).toFixed(1) + "px)";
                g.imageSmoothingEnabled = (MDk.c || 16) > 16;   // high-res meshes: smooth upscaling, as the AE maps
                g.translate(at[0] * W, at[1] * H); g.rotate(rot * Math.PI / 180); g.scale(sc, sc); g.translate(-W / 2, -H / 2);
                g.drawImage(img, -cw, -ch, W + 2 * cw, H + 2 * ch);
                break;
            case "g4":
                var pts = d.drift ? val(d.drift, X, 0, d.i && d.i.pts, true) : d.pts;
                var gcols = []; for (k = 0; k < 4; k++) gcols.push(cols[d.cols[k]]);
                g.filter = "blur(" + (W * 0.02).toFixed(1) + "px)";
                g.drawImage(g4Image(pts, gcols, W, H), -W * 0.02, -H * 0.02, W * 1.04, H * 1.04);
                break;
            case "ramp":
                var fr = val(d.from, X, 0), to = val(d.to, X, 0), gr;
                if (d.radial) gr = g.createRadialGradient(fr[0] * W, fr[1] * H, 0, fr[0] * W, fr[1] * H, Math.hypot((to[0] - fr[0]) * W, (to[1] - fr[1]) * H));
                else gr = g.createLinearGradient(fr[0] * W, fr[1] * H, to[0] * W, to[1] * H);
                gr.addColorStop(0, cols[d.cols[0]]); gr.addColorStop(1, cols[d.cols[1]]);
                g.fillStyle = gr; g.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2);
                break;
            case "blob": case "ring": case "rect": case "frame":
                g.translate(at[0] * W, at[1] * H); g.rotate(rot * Math.PI / 180); g.scale(sc, sc);
                if (d.off) g.translate(d.off[0] * U, d.off[1] * U);
                g.beginPath();
                if (d.t === "frame") {
                    g.rect(-2 * U, -2 * U, 4 * U, 4 * U); rrect(g, d.sz[0] * U, d.sz[1] * U, (d.round || 0) * U);
                    g.fillStyle = cols[d.c]; g.fill("evenodd");
                } else if (d.t === "rect") {
                    rrect(g, d.sz[0] * U, d.sz[1] * U, (d.round || 0) * U);
                    if (d.fc !== undefined) { g.fillStyle = cols[d.fc]; g.save(); g.globalAlpha *= (d.fop === undefined ? 1 : d.fop / 100); g.fill(); g.restore(); }
                    if (d.w) { g.strokeStyle = cols[d.c]; g.lineWidth = Math.max(0.6, d.w * U); g.save(); g.globalAlpha *= (d.sop === undefined ? 1 : d.sop / 100); g.stroke(); g.restore(); }
                    else if (d.fc === undefined) { g.fillStyle = cols[d.c]; g.fill(); }
                } else {
                    var rx = d.s * U / 2, ry = rx * (d.a || 1);
                    if (d.t === "ring" && d.arc) { var h0 = d.arc * 1.8 * Math.PI / 180, a0 = (-90 + (d.arcRot || 0)) * Math.PI / 180; g.ellipse(0, 0, rx, ry, 0, a0 - h0, a0 + h0); }
                    else g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
                    if (d.t === "blob") { g.fillStyle = cols[d.c]; g.fill(); }
                    else { g.strokeStyle = cols[d.c]; g.lineWidth = Math.max(0.6, d.w * U); g.lineCap = "round"; g.stroke(); }
                }
                break;
            case "path":
                var pp = val(d.pk || [d.pts], X, ph, d.i && d.i.pk, true);
                g.translate(at[0] * W, at[1] * H); g.rotate(rot * Math.PI / 180); g.scale(sc, sc);
                g.lineCap = "round"; g.lineJoin = "round";
                g.beginPath(); bez(g, pp, !!d.closed, U);
                if (d.fc !== undefined) { g.fillStyle = cols[d.fc]; g.fill(); }
                if (d.w) { g.strokeStyle = cols[d.c]; g.lineWidth = Math.max(0.6, d.w * U); g.stroke(); }
                break;
            case "rays":
                g.translate(at[0] * W, at[1] * H); g.rotate(rot * Math.PI / 180);
                g.fillStyle = cols[d.c];
                for (k = 0; k < d.n; k++) {
                    g.save(); g.rotate(((d.a0 || 0) + k * (d.step || 30)) * Math.PI / 180); g.translate(d.r * U + d.len * U / 2, 0);
                    g.beginPath(); rrect(g, d.len * U, d.wd * U, d.wd * U / 2); g.fill(); g.restore();
                }
                break;
            case "burst":
                var nw = d.waves || 3, R0 = (d.R || 0.5) * U, tt = Math.max(0, X.tl - X.T0) / X.P;
                g.translate(W / 2, H / 2);
                g.filter = "blur(" + Math.max(1, U * 0.006).toFixed(1) + "px)";
                for (k = 0; k < nw; k++) {
                    var ph2 = (tt - k / nw) % 1; if (ph2 < 0) ph2 += 1;
                    var s2 = (d.max || 420) / 100 * ph2 * ph2, o2 = ph2 < 0.12 ? ph2 / 0.12 : (ph2 > 0.75 ? (1 - ph2) / 0.25 : 1);
                    g.save(); g.globalAlpha = o2; g.scale(s2, s2); g.rotate(k * 13 * Math.PI / 180 + tt * 2 * Math.PI * (d.spin || 0.1));
                    for (i = 0; i < d.cols.length; i++) {
                        var ro = R0 * (1 - i * 0.17), ri = ro * (d.inner || 0.62), np = d.points || 9;
                        g.beginPath();
                        for (var q = 0; q < np * 2; q++) { var rr = q % 2 ? ri : ro, an = q * Math.PI / np - Math.PI / 2; if (q) g.lineTo(rr * Math.cos(an), rr * Math.sin(an)); else g.moveTo(rr * Math.cos(an), rr * Math.sin(an)); }
                        g.closePath(); g.fillStyle = cols[d.cols[i]]; g.fill();
                    }
                    g.restore();
                }
                break;
            case "sweep":
                var u2 = X.tl < X.T0 ? -1 : ((X.tl - X.T0) % X.P) / X.P, a1 = d.from || 0.1, a2 = d.to || 0.6;
                if (u2 >= a1 && u2 <= a2) {
                    var f = ease((u2 - a1) / (a2 - a1));
                    g.globalCompositeOperation = MODES[d.m || "add"]; g.globalAlpha = (d.op === undefined ? 50 : d.op) / 100;
                    g.filter = "blur(" + ((d.blur || 0.07) * U * BLUR).toFixed(1) + "px)";
                    g.translate(-0.3 * W + 1.6 * W * f, H / 2); g.rotate((d.ang === undefined ? 22 : d.ang) * Math.PI / 180);
                    g.beginPath(); rrect(g, (d.wd || 0.2) * U, 2.6 * U, 0.1 * U); g.fillStyle = cols[d.c]; g.fill();
                }
                break;
            case "noise":
                noise(g, d, X);
                break;
            case "dots": case "bubbles":
                var Rn = rng(d.seed || 1), ar = d.area || [0, 0, 1, 1], n = d.n || 30, TP = 2 * Math.PI * (X.tl - X.T0) / X.P;
                for (i = 0; i < n; i++) {
                    var x0 = (ar[0] + Rn() * (ar[2] - ar[0])) * W, y0 = (ar[1] + Rn() * (ar[3] - ar[1])) * H;
                    var sz = (d.smin + Rn() * (d.smax - d.smin)) * U, am = (d.amp || 0.01) * U;
                    var ax = am * (0.5 + Rn()), ay = am * (0.5 + Rn()), m1 = 1 + Math.floor(Rn() * 2), m2 = 1 + Math.floor(Rn() * 2), p1 = Rn() * 6.28, p2 = Rn() * 6.28;
                    x = x0 + ax * Math.sin(TP * m1 + p1); y = y0 + ay * Math.cos(TP * m2 + p2);
                    if (d.t === "dots") {
                        var ob = d.op || [30, 80];
                        g.globalAlpha = val([ob[0], ob[1], (ob[0] + ob[1]) / 2, ob[1]], X, i % 3) / 100;
                        g.fillStyle = cols[d.c]; g.beginPath(); g.arc(x, y, Math.max(0.5, sz / 2), 0, 7); g.fill();
                    } else {
                        g.beginPath(); g.arc(x, y, sz / 2, 0, 7);
                        g.globalAlpha = (d.fop || 18) / 100; g.fillStyle = cols[d.fc !== undefined ? d.fc : d.c]; g.fill();
                        g.globalAlpha = (d.sop || 60) / 100; g.strokeStyle = cols[d.c]; g.lineWidth = Math.max(0.6, U * (d.sw || 0.0012)); g.stroke();
                        if (d.shine !== false) { g.globalAlpha = (d.shop || 45) / 100; g.beginPath(); g.ellipse(x - sz * 0.18, y - sz * 0.26, sz * 0.18, sz * 0.1, 0, 0, 7); g.fillStyle = cols[d.c]; g.fill(); }
                    }
                }
                break;
            case "grid": case "nodes":
                var gp = d.gap * W, pn = d.pan || [0, 0], fl = Math.max(0, X.tl - X.T0) / X.P;
                var px = ((pn[0] * gp * fl) % gp + gp) % gp, py = ((pn[1] * gp * fl) % gp + gp) % gp;
                if (d.t === "grid") {
                    g.strokeStyle = cols[d.c]; g.lineWidth = Math.max(0.5, d.w * U);
                    g.beginPath();
                    for (x = px - gp; x < W + gp; x += gp) { g.moveTo(x, 0); g.lineTo(x, H); }
                    for (y = py - gp; y < H + gp; y += gp) { g.moveTo(0, y); g.lineTo(W, y); }
                    g.stroke();
                    if (d.diag) {
                        g.globalAlpha *= d.diag / 100; g.beginPath();
                        for (x = px - gp; x < W + gp; x += gp) for (y = py - gp; y < H + gp; y += gp) { g.moveTo(x, y); g.lineTo(x + gp, y + gp); g.moveTo(x + gp, y); g.lineTo(x, y + gp); }
                        g.stroke();
                    }
                } else {
                    var ns = Math.max(1, d.size * U), mc = d.matte ? val(d.matte.at, X, 0) : null, base = g.globalAlpha;
                    g.fillStyle = cols[d.c];
                    if (d.glow) { g.shadowColor = cols[d.c]; g.shadowBlur = d.glow * U * 2; }
                    for (x = px - gp; x < W + gp; x += gp) for (y = py - gp; y < H + gp; y += gp) {
                        var a = 1;
                        if (mc) {
                            var dx = (x - mc[0] * W) / (d.matte.s * U / 2), dy = (y - mc[1] * H) / (d.matte.s * U * (d.matte.a || 1) / 2);
                            a = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)); a = a * a * (3 - 2 * a);
                        }
                        if (a <= 0.01) continue;
                        g.globalAlpha = base * a;
                        if (d.cross) { g.fillRect(x - ns / 2, y - ns * 0.14, ns, ns * 0.28); g.fillRect(x - ns * 0.14, y - ns / 2, ns * 0.28, ns); }
                        else if ((d.round || 0) >= 0.4) { g.beginPath(); g.arc(x, y, ns / 2, 0, 7); g.fill(); }
                        else g.fillRect(x - ns / 2, y - ns / 2, ns, ns);
                    }
                }
                break;
            case "flute":
                var rw = Math.max(2, d.w * U);
                g.globalCompositeOperation = "soft-light"; g.globalAlpha = (d.op || 45) / 100; g.filter = "none";
                for (x = -rw; x < W + rw; x += rw) {
                    var lg = g.createLinearGradient(x, 0, x + rw, 0);
                    lg.addColorStop(0, "#fff"); lg.addColorStop(1, "#000");
                    g.fillStyle = lg; g.fillRect(x, 0, rw, H);
                }
                break;
        }
        g.restore();
    }
    /* soft approximation of the Fractal Noise layers */
    function noise(g, d, X) {
        var W = X.W, H = X.H, U = X.U, cols = X.cols, tc = d.cols || [0, 1, 2], R = rng(7 + (d.cx || 3)), i, TP = Math.PI * 2 * Math.max(0, X.tl - X.T0) / X.P;
        g.filter = "blur(" + Math.max(1, U * 0.012).toFixed(1) + "px)";
        if (d.polar) {
            g.translate(W / 2, H / 2);
            for (i = 0; i < 140; i++) {
                var an = R() * Math.PI * 2, fl = 0.5 + 0.5 * Math.sin(TP * (1 + Math.floor(R() * 3)) + R() * 6.28);
                g.globalAlpha = (0.25 + 0.6 * fl) * ((d.op === undefined ? 100 : d.op) / 100);
                g.strokeStyle = cols[R() < 0.5 ? tc[1] : tc[2]]; g.lineWidth = 1 + R() * U * 0.006;
                g.beginPath(); g.moveTo(Math.cos(an) * U * 0.12, Math.sin(an) * U * 0.12); g.lineTo(Math.cos(an) * U, Math.sin(an) * U); g.stroke();
            }
            return;
        }
        var streak = (d.sh || 100) > (d.sw || 100) * 3;
        var mk = d.mask, cx = mk ? mk.at[0] * W : W / 2, cy = mk ? mk.at[1] * H : H / 2, hw = mk ? mk.sz[0] * U / 2 : W, hh = mk ? mk.sz[1] * U / 2 : H;
        if (streak) {
            for (i = 0; i < 70; i++) {
                var x = cx + (R() * 2 - 1) * hw, y = cy + (R() * 2 - 1) * hh * 0.6, h = hh * (0.4 + R());
                var dr = Math.min(1, Math.hypot((x - cx) / hw, (y - cy) / hh)), fl2 = 0.5 + 0.5 * Math.sin(TP * (1 + Math.floor(R() * 2)) + R() * 6.28);
                g.globalAlpha = (1 - dr) * (0.3 + 0.6 * fl2); g.fillStyle = cols[R() < 0.6 ? tc[1] : tc[2]];
                g.fillRect(x, y - h / 2, 2 + R() * U * 0.01, h);
            }
            return;
        }
        for (i = 0; i < 10; i++) {
            var bx = (0.1 + R() * 0.8) * W + Math.sin(TP + R() * 6.28) * W * 0.08, by = (0.1 + R() * 0.8) * H + Math.cos(TP + R() * 6.28) * H * 0.08;
            g.filter = "blur(" + (U * 0.05).toFixed(1) + "px)";
            g.globalAlpha = 0.5 + R() * 0.35; g.fillStyle = cols[i % 3 === 0 ? tc[2] : tc[1]];
            g.beginPath(); g.ellipse(bx, by, U * (0.12 + R() * 0.16), U * (0.08 + R() * 0.12), R() * 3, 0, 7); g.fill();
        }
    }

    function draw(cv, spec, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, CW = cv.clientWidth || 96, CH = cv.clientHeight || 54;
        var W = Math.min(o.maxW || 360, Math.round(CW * dpr)), H = Math.round(W * CH / CW);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var g = cv.getContext("2d"), U = Math.max(W, H), P = spec.P || 18, T0 = o.intro === false ? 0 : (spec.T0 || 0);
        var cols = (o.colors && o.colors.length === spec.colors.length) ? o.colors : spec.colors;
        var tt = Math.max(0, t * (o.speed === undefined ? 100 : o.speed) / 100);
        var tl = (T0 > 0 && tt < T0 + P) ? tt : (T0 + P + (((T0 > 0 ? tt - T0 - P : tt) % P) + P) % P);
        var X = { W: W, H: H, U: U, P: P, T0: T0, tl: tl, cols: cols };
        g.save();
        g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.filter = "none";
        g.fillStyle = cols[0]; g.fillRect(0, 0, W, H);
        for (var i = 0; i < spec.els.length; i++) {
            var d = spec.els[i];
            if (d.slices) {
                tmp.width = W; tmp.height = H;
                var tg = tmp.getContext("2d"); tg.clearRect(0, 0, W, H);
                element(tg, d, X);
                var sw = d.slices.w * U, sh = d.slices.h * U, u = (tl % P) / P;
                g.save(); g.globalCompositeOperation = MODES[d.m || "normal"];
                for (var y = 0, k = 0; y < H; y += sw / 2, k++) g.drawImage(tmp, 0, y, W, sw / 2, ((k + Math.floor(u * 2)) % 2 ? 1 : -1) * sh, y, W, sw / 2);
                g.restore();
            } else element(g, d, X);
        }
        g.restore();
    }
    function Player(cv) { this.cv = cv; this.spec = null; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (spec, o) { if (spec && spec !== this.spec) { this.spec = spec; this.t = 0; } if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.restart = function () { this.t = 0; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now(), acc = 0;
        function frame(now) {
            if (!self.running) return;
            var dt = Math.min(0.1, (now - last) / 1000); last = now;
            self.t += dt; acc += dt;
            if (acc >= 1 / 30) { acc = 0; if (self.spec && document.body.contains(self.cv)) draw(self.cv, self.spec, self.t, self.o); }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player };
})();

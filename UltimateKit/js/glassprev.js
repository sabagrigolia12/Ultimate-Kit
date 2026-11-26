/*  Ultimate Kit - Glass preview (canvas): the painted landscape, and on it the rounded rectangle as AE builds it
    (jsx/glass.jsx): what is inside is blurred (Fast Box Blur on the adjustment base), a white Frost tint and a
    white rim that is full at the top and fades down. Sizes are comp pixels of a 1920 x 1080 comp.          */
var UKGlassPrev = (function () {
    var pic = null, buf = null;
    function picture() {
        if (pic) return pic;
        var S = UKDepthPrev.scene(), W = UKDepthPrev.IW, H = UKDepthPrev.IH, n = W * H, i;
        pic = document.createElement("canvas"); pic.width = W; pic.height = H;
        var g = pic.getContext("2d"), im = g.createImageData(W, H);
        for (i = 0; i < n; i++) { im.data[i * 4] = S.rgb[i * 3]; im.data[i * 4 + 1] = S.rgb[i * 3 + 1]; im.data[i * 4 + 2] = S.rgb[i * 3 + 2]; im.data[i * 4 + 3] = 255; }
        g.putImageData(im, 0, 0);
        return pic;
    }
    function rr(g, x, y, w, h, r) {
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    }
    /* o: { w, h, round, blur, frost 0..100, light 0..100, lightW px, maxW } */
    function draw(cv, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(cw * dpr)), H = Math.round(W * ch / cw);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var x = cv.getContext("2d"), vw = Math.min(W, H * 16 / 9), vh = vw * 9 / 16, ox = (W - vw) / 2, oy = (H - vh) / 2, k = vw / 1920;
        var im = picture(), sc = Math.max(vw / im.width, vh / im.height);
        var paint = function (g) { g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(im, ox + (vw - im.width * sc) / 2, oy + (vh - im.height * sc) / 2, im.width * sc, im.height * sc); };
        x.setTransform(1, 0, 0, 1, 0, 0); x.filter = "none"; x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
        x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
        paint(x);
        var w = (o.w || 1440) * k, h = (o.h || 432) * k, r = (o.round === undefined ? 36 : o.round) * k, rx = ox + (vw - w) / 2, ry = oy + (vh - h) / 2;
        // inside: blurred (edge pixels repeated, as Repeat Edge Pixels does)
        x.save(); rr(x, rx, ry, w, h, r); x.clip();
        var b = (o.blur === undefined ? 6 : o.blur) * k * 1.6;
        if (b > 0.2) { x.filter = "blur(" + b.toFixed(2) + "px)"; paint(x); x.filter = "none"; }
        // the magnifying edge (CC Glass): along the rim the picture is drawn magnified around the centre
        var lz = (o.lens === undefined ? 400 : o.lens) / 3500, lwid = Math.max(1, (o.lensW === undefined ? 55 : o.lensW) * k * 1.4);
        if (lz > 0.001) {
            // the magnified picture, kept only in a soft band along the edge (a blurred wide stroke as its mask)
            if (!buf) buf = document.createElement("canvas");
            if (buf.width !== W || buf.height !== H) { buf.width = W; buf.height = H; }
            var bg = buf.getContext("2d");
            bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalCompositeOperation = "source-over"; bg.filter = "none"; bg.clearRect(0, 0, W, H);
            bg.save(); bg.translate(rx + w / 2, ry + h / 2); bg.scale(1 + lz, 1 + lz); bg.translate(-(rx + w / 2), -(ry + h / 2));
            if (b > 0.2) bg.filter = "blur(" + b.toFixed(2) + "px)";
            paint(bg); bg.restore(); bg.filter = "none";
            bg.globalCompositeOperation = "destination-in";
            bg.filter = "blur(" + (lwid * 0.45).toFixed(1) + "px)";
            bg.lineWidth = lwid * 2; bg.strokeStyle = "#000"; rr(bg, rx, ry, w, h, r); bg.stroke();
            bg.filter = "none"; bg.globalCompositeOperation = "source-over";
            x.drawImage(buf, 0, 0);
        }
        x.globalAlpha = Math.max(0, Math.min(1, (o.frost === undefined ? 12 : o.frost) / 100));
        x.fillStyle = "#FFFFFF"; x.fillRect(rx, ry, w, h);
        x.restore();
        // the rim: just outside the glass edge (the path pushed out by half the width), all round, fading towards
        // the bottom by Light Fade
        var L = Math.max(0, Math.min(1, (o.light === undefined ? 80 : o.light) / 100)), fd = Math.max(0, Math.min(1, (o.fade || 0) / 100));
        if (L > 0) {
            var lwp = Math.max(0.5, (o.lightW === undefined ? 4 : o.lightW) * k * 1.4), hw = lwp / 2;
            var gr = x.createLinearGradient(0, ry, 0, ry + h);
            gr.addColorStop(0, "rgba(255,255,255," + L + ")"); gr.addColorStop(0.25, "rgba(255,255,255," + L + ")"); gr.addColorStop(1, "rgba(255,255,255," + (L * (1 - fd)).toFixed(3) + ")");
            x.strokeStyle = gr; x.lineWidth = lwp;
            rr(x, rx - hw, ry - hw, w + lwp, h + lwp, r + hw); x.stroke();
        }
    }
    /* Glow Box (jsx/glass.jsx buildBox): coloured light behind (the soft drop shadows), the black box with its
       dark-red / magenta inner glow, the tapered white rim turning (Trim Offset 0 -> 540), the blurred coloured
       stroke drawing on (End 0 -> 100, Offset 0 -> 180) and the light sweep crossing.
       o: { w, h, round, text, c1, c2, hi, dur, lightW, lightI, refr, spin, maxW } */
    var tmp = null;
    function hex(h) { var n = parseInt(String(h || "#fff").replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    function rgba(c, a) { return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + a.toFixed(3) + ")"; }
    function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    /* a point on the pill's outline, u 0..1 clockwise from the top centre (like the rectangle path) */
    function pillPt(cx, cy, w, h, r, u) {
        var sw = w - 2 * r, sh = h - 2 * r, arc = Math.PI * r / 2, P = 2 * sw + 2 * sh + 4 * arc, d = ((u % 1) + 1) % 1 * P, segs = [sw / 2, arc, sh, arc, sw, arc, sh, arc, sw / 2], i;
        var x0 = cx, y0 = cy - h / 2;
        for (i = 0; i < segs.length; i++) {
            if (d <= segs[i] || i === segs.length - 1) break;
            d -= segs[i];
        }
        var L = cx - w / 2, R = cx + w / 2, T = cy - h / 2, B = cy + h / 2;
        switch (i) {
            case 0: return [cx + d, T];
            case 1: var a1 = -Math.PI / 2 + d / r; return [R - r + Math.cos(a1) * r, T + r + Math.sin(a1) * r];
            case 2: return [R, T + r + d];
            case 3: var a3 = d / r; return [R - r + Math.cos(a3) * r, B - r + Math.sin(a3) * r];
            case 4: return [R - r - d, B];
            case 5: var a5 = Math.PI / 2 + d / r; return [L + r + Math.cos(a5) * r, B - r + Math.sin(a5) * r];
            case 6: return [L, B - r - d];
            case 7: var a7 = Math.PI + d / r; return [L + r + Math.cos(a7) * r, T + r + Math.sin(a7) * r];
            default: return [L + r + d, T];
        }
    }
    function comet(g, cx, cy, w, h, r, from, len, width, col, taperS, taperE) {
        var n = 220, i, p0 = pillPt(cx, cy, w, h, r, from), u, p1;
        g.lineCap = "round";
        for (i = 1; i <= n; i++) {
            u = i / n; p1 = pillPt(cx, cy, w, h, r, from + len * u);
            var tw = Math.min(1, taperS > 0 ? u / taperS : 1, taperE > 0 ? (1 - u) / taperE : 1);
            if (tw > 0.01) { g.strokeStyle = col(u); g.lineWidth = Math.max(0.3, width * tw); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
            p0 = p1;
        }
    }
    function easeKey(x) { x = Math.max(0, Math.min(1, x)); var a = 1 - x; return 1 - a * a * a; }   // Easy Ease out, 100 % into the end
    function drawBox(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(cw * dpr)), H = Math.round(W * ch / cw);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var x = cv.getContext("2d"), vw = Math.min(W, H * 16 / 9), vh = vw * 9 / 16, ox = (W - vw) / 2, oy = (H - vh) / 2, k = vw / 1920;
        var c1 = hex(o.c1 || "#FF0000"), c2 = hex(o.c2 || "#0006FF"), hi = hex(o.hi || "#00D6FF");
        var bw = (o.w || 1221) * k, bh = (o.h || 215) * k, r = Math.min((o.round === undefined ? 132 : o.round) * k, bw / 2, bh / 2), cx = ox + vw / 2, cy = oy + vh / 2;
        var D = Math.max(0.2, o.dur || 1.2346), cyc = 0.3 + D + 1.4, tt = o.thumb ? 0.3 + D * 0.45 : t % cyc, p = (tt - 0.3) / D, e = easeKey(p);
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.filter = "none";
        x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
        if (!tmp) tmp = document.createElement("canvas");
        if (tmp.width !== W || tmp.height !== H) { tmp.width = W; tmp.height = H; }
        var g = tmp.getContext("2d");
        // the light behind: the box offset (red up-left, blue down-right, a little white) and blurred a lot
        x.globalCompositeOperation = "screen";
        var back = function (col, a, dx, dy) { x.filter = "blur(" + (vw * 0.07).toFixed(1) + "px)"; x.fillStyle = rgba(col, a); rr(x, cx - bw / 2 + dx, cy - bh / 2 + dy, bw, bh, r); x.fill(); };
        back(c1, 0.5, -22 * k, -47 * k); back(mixc(c2, [26, 0, 255], 0.5), 0.5, 10 * k, 51 * k); back([255, 255, 255], 0.15, -34 * k, 0);
        x.filter = "none"; x.globalCompositeOperation = "source-over";
        // the box: black, with its inner glow (dark red at the sides, magenta along the bottom)
        x.save(); rr(x, cx - bw / 2, cy - bh / 2, bw, bh, r); x.clip();
        x.fillStyle = "#000"; x.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
        var mag = mixc(mixc(c1, c2, 0.4), [255, 255, 255], 0.12);
        var gb = x.createLinearGradient(0, cy - bh / 2, 0, cy + bh / 2);
        gb.addColorStop(0, rgba(mixc(c1, [0, 0, 0], 0.45), 1)); gb.addColorStop(0.35, rgba(mixc(c1, [0, 0, 0], 0.75), 1)); gb.addColorStop(0.6, rgba(mixc(c1, c2, 0.3), 0.55)); gb.addColorStop(1, rgba(mag, 1));
        x.fillStyle = gb; x.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
        // the dark core, kept away from the edges
        x.filter = "blur(" + (bh * 0.16).toFixed(1) + "px)";
        x.fillStyle = "rgba(0,0,0,0.92)"; rr(x, cx - bw / 2 + bh * 0.22, cy - bh / 2 + bh * 0.18, bw - bh * 0.44, bh * 0.52, bh * 0.26); x.fill();
        x.filter = "none";
        // the light sweep crossing (between 0.216 and 0.757 of the duration)
        var ls = ((tt - 0.3) / D - 0.216) / (0.757 - 0.216);
        if (ls > 0 && ls < 1) {
            // the original Center keys: x from -778 to +690 round the box centre (1221 wide)
            var sx = cx + (-778 + 1468 * easeKey(ls)) * (bw / 1221), lw = Math.max(1, (o.lightW === undefined ? 50 : o.lightW) * k * 1.6), li = Math.max(0, (o.lightI === undefined ? 25 : o.lightI) / 25);
            x.save(); x.translate(sx, cy); x.rotate(30 * Math.PI / 180);
            var sg = x.createLinearGradient(-lw, 0, lw, 0); sg.addColorStop(0, "rgba(255,250,240,0)"); sg.addColorStop(0.5, "rgba(255,250,240," + Math.min(1, 0.45 * li).toFixed(3) + ")"); sg.addColorStop(1, "rgba(255,250,240,0)");
            x.fillStyle = sg; x.fillRect(-lw, -bh, lw * 2, bh * 2); x.restore();
        }
        x.restore();
        // the blurred coloured stroke (Tritone: highlight / colour 1 / colour 2)
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.filter = "none";
        var endG = p <= 0 ? 0 : e, offG = 180 / 360 * e * (o.spin === undefined ? 1 : o.spin / 100);
        if (endG > 0.005) comet(g, cx, cy, bw, bh, r, offG, endG, 10 * k * 1.4, function (u) { return rgba(u > 0.7 ? mixc(c1, hi, (u - 0.7) / 0.3 * 0.6) : mixc(c2, c1, u / 0.7), 1); }, 1, 0.23);
        x.globalCompositeOperation = "screen";
        x.filter = "blur(" + Math.max(1, 15 * k * 1.2).toFixed(1) + "px)"; x.drawImage(tmp, 0, 0); x.drawImage(tmp, 0, 0); x.filter = "none";
        // the white glass rim, turning
        g.clearRect(0, 0, W, H);
        var offT = 540 / 360 * Math.max(0, e) * (o.spin === undefined ? 1 : o.spin / 100);
        comet(g, cx, cy, bw, bh, r, offT, 1, 10 * k * 1.1, function (u) { return "rgba(255,255,255," + (0.35 + 0.65 * u).toFixed(3) + ")"; }, 1, 0.23);
        x.filter = "blur(" + Math.max(1, 6 * k).toFixed(1) + "px)"; x.drawImage(tmp, 0, 0); x.filter = "none";
        x.drawImage(tmp, 0, 0);
        x.globalCompositeOperation = "source-over";
        // the text
        if (o.text) {
            x.fillStyle = "#FFFFFF"; x.textAlign = "center"; x.textBaseline = "middle";
            x.font = Math.round(76 * k) + "px 'SF Pro Display', 'Segoe UI', system-ui, sans-serif";
            x.fillText(o.text, cx, cy + 2 * k);
        }
    }
    /* Liquid Glass (jsx/glass.jsx buildLiquid, the user's set-up): a 1080 x 1920 frame, the tall rounded glass rising
       from under it (the original's 3 keys, each easing in at 100 %), refracting the picture (magnified inside,
       bent harder along the rim, Thickness blur), bright rim lights at -18 deg, a hint of colour fringe and Noise.
       o: { w, h, noise, thumb, maxW } */
    var noiseCv = null, lqBuf = null;
    function noiseTile() {
        if (noiseCv) return noiseCv;
        noiseCv = document.createElement("canvas"); noiseCv.width = noiseCv.height = 128;
        var g = noiseCv.getContext("2d"), im = g.createImageData(128, 128);
        for (var i = 0; i < 128 * 128; i++) { var v = Math.random() * 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
        g.putImageData(im, 0, 0);
        return noiseCv;
    }
    function keySeg(t, t0, t1, v0, v1) {      // one segment: out ease 33.3 % (speed 0) -> in ease 100 % (speed 0)
        var d = t1 - t0, x = (t - t0) / d, lo = 0, hi = 1, u = 0.5;
        for (var q = 0; q < 22; q++) { u = (lo + hi) / 2; var m = 1 - u, xu = 3 * m * m * u * 0.3333 + 3 * m * u * u * 0 + u * u * u; if (xu < x) lo = u; else hi = u; }
        var m2 = 1 - u, f = 3 * m2 * u * u + u * u * u;      // value control points 0, 0, 1, 1
        return v0 + (v1 - v0) * f;
    }
    function drawLiquid(cv, t, o) {
        var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 90;
        var Wc = Math.min(o.maxW || 640, Math.round(cw * dpr)), Hc = Math.round(Wc * ch / cw);
        if (cv.width !== Wc || cv.height !== Hc) { cv.width = Wc; cv.height = Hc; }
        var x = cv.getContext("2d");
        x.setTransform(1, 0, 0, 1, 0, 0); x.filter = "none"; x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
        x.fillStyle = "#0B0B10"; x.fillRect(0, 0, Wc, Hc);
        var CW = 1080, CH = 1920, k = Math.min(Wc / CW, Hc / CH), fw = CW * k, fh = CH * k, ox = (Wc - fw) / 2, oy = (Hc - fh) / 2;
        var im = picture(), sc = Math.max(fw / im.width, fh / im.height);
        var paint = function (g, mag, cx, cy) {
            g.save(); g.beginPath(); g.rect(ox, oy, fw, fh); g.clip();
            if (mag) { g.translate(cx, cy); g.scale(mag, mag); g.translate(-cx, -cy); }
            g.imageSmoothingEnabled = true; g.drawImage(im, ox + (fw - im.width * sc) / 2, oy + (fh - im.height * sc) / 2, im.width * sc, im.height * sc);
            g.restore();
        };
        paint(x);
        // the rise (comp px): 0 s from under the frame, 1.5682 s half way, 4.9049 s in place; then hold, loop
        var w = (o.w || 701.43) * k, h = (o.h || 1398.42) * k, r = Math.min(378 * k, w / 2, h / 2);
        var T = o.thumb ? 99 : t % 6.4, ex = 553.247, ey = 1012.145, sx = 568.247, sy = 1920 + (o.h || 1398.42) / 2 + 55.548, my = sy + (ey - sy) * 0.50199;
        var px, py;
        if (T <= 1.5682) { px = sx; py = keySeg(T, 0, 1.5682, sy, my); }
        else if (T <= 4.9049) { px = keySeg(T, 1.5682, 4.9049, sx, ex); py = keySeg(T, 1.5682, 4.9049, my, ey); }
        else { px = ex; py = ey; }
        var cx = ox + px * k, cy = oy + py * k, rx = cx - w / 2, ry = cy - h / 2;
        x.save(); x.beginPath(); x.rect(ox, oy, fw, fh); x.clip();
        // inside: magnified (refraction) and softened (Thickness)
        x.save(); rr(x, rx, ry, w, h, r); x.clip();
        x.filter = "blur(" + Math.max(0.3, 9 * k * 0.9).toFixed(2) + "px)"; paint(x, 1.12, cx, cy); x.filter = "none";
        // along the rim the picture bends harder (a stronger lens in a soft band), with a faint colour fringe
        if (!lqBuf) lqBuf = document.createElement("canvas");
        if (lqBuf.width !== Wc || lqBuf.height !== Hc) { lqBuf.width = Wc; lqBuf.height = Hc; }
        var bg = lqBuf.getContext("2d"), band = Math.max(2, Math.min(w, h) * 0.16);
        bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalCompositeOperation = "source-over"; bg.filter = "none"; bg.clearRect(0, 0, Wc, Hc);
        paint(bg, 1.32, cx, cy);
        bg.globalCompositeOperation = "destination-in"; bg.filter = "blur(" + (band * 0.35).toFixed(1) + "px)";
        bg.lineWidth = band * 2; bg.strokeStyle = "#000"; rr(bg, rx, ry, w, h, r); bg.stroke();
        bg.filter = "none"; bg.globalCompositeOperation = "source-over";
        x.drawImage(lqBuf, 0, 0);
        x.globalCompositeOperation = "screen"; x.lineWidth = Math.max(1, 3 * k);
        x.strokeStyle = "rgba(255,40,40,0.35)"; rr(x, rx + 1.2 * k * 2, ry, w, h, r); x.stroke();
        x.strokeStyle = "rgba(40,90,255,0.35)"; rr(x, rx - 1.2 * k * 2, ry, w, h, r); x.stroke();
        x.globalCompositeOperation = "source-over";
        // Noise
        var nz = Math.max(0, Math.min(100, o.noise === undefined ? 2 : o.noise));
        if (nz > 0) { x.globalAlpha = Math.min(1, nz / 100 * 6); x.globalCompositeOperation = "overlay"; x.fillStyle = x.createPattern(noiseTile(), "repeat"); x.fillRect(rx, ry, w, h); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; }
        x.restore();
        // the rim lights: Light Angle -18 deg, bright on the two edges facing along it, Edge Width 8
        var a = -18 * Math.PI / 180, dx = Math.cos(a) * w / 2, dy = Math.sin(a) * h / 2;
        var gr = x.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
        gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(0.22, "rgba(255,255,255,0.15)"); gr.addColorStop(0.5, "rgba(255,255,255,0)");
        gr.addColorStop(0.78, "rgba(255,255,255,0.15)"); gr.addColorStop(1, "rgba(255,255,255,0.85)");
        x.strokeStyle = gr; x.lineWidth = Math.max(1, 8 * k * 0.7); rr(x, rx, ry, w, h, r); x.stroke();
        x.restore();
    }
    return { draw: draw, drawBox: drawBox, drawLiquid: drawLiquid };
})();

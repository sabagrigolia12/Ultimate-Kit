/*  Ultimate Kit - tiny procedural thumbnails for preset tiles */
var UKThumbs = (function () {
    function rgba(hex, a) {
        var n = parseInt(String(hex).replace("#", ""), 16);
        return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + (a === undefined ? 1 : a) + ")";
    }
    function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function prep(cv) {
        var dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 96, H = cv.clientHeight || 54;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        var g = cv.getContext("2d");
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { g: g, W: W, H: H };
    }
    function transition(cv, p, pal) {
        var c = prep(cv), g = c.g, W = c.W, H = c.H, r = p.r, q = p.p || {};
        g.fillStyle = "#1b1b1f"; g.fillRect(0, 0, W, H);
        var C1 = pal[0], C2 = pal[1], C3 = pal[2];
        g.save();
        if (r === "panels") {
            var dir = q.dir || 0, n = q.n || 1, cols = n === 1 ? [C1] : (n === 2 ? [C2, C1] : [C3, C2, C1]);
            g.translate(W / 2, H / 2); g.rotate(dir * Math.PI / 180);
            var sk = Math.tan((q.skew || 0) * Math.PI / 180) * H * 0.6;
            for (var i = 0; i < cols.length; i++) {
                var x0 = -W * 0.9 + i * W * 0.16, x1 = x0 + W * 0.95;
                g.beginPath(); g.moveTo(x0 + sk, -H); g.lineTo(x1 + sk, -H); g.lineTo(x1 - sk, H); g.lineTo(x0 - sk, H); g.closePath();
                if (q.shape === "chevron") { g.beginPath(); g.moveTo(x0, -H); g.lineTo(x1 - H * 0.4, -H); g.lineTo(x1, 0); g.lineTo(x1 - H * 0.4, H); g.lineTo(x0, H); g.lineTo(x0 + H * 0.4, 0); g.closePath(); }
                if (q.shape === "round") { rr(g, x0, -H * 0.62, x1 - x0, H * 1.24, 8); }
                g.fillStyle = cols[i]; g.fill();
            }
            if (q.stripes) for (var s = 0; s < q.stripes; s++) { g.fillStyle = s % 2 ? C2 : C3; g.fillRect(W * 0.12 + s * 6, -H, 3, H * 2); }
        } else if (r === "stripes") {
            g.translate(W / 2, H / 2); g.rotate((q.angle || 0) * Math.PI / 180);
            var n2 = Math.min(q.n || 6, 10), cs = q.colors || [1, 2], L = Math.sqrt(W * W + H * H);
            for (var k = 0; k < n2; k++) {
                var y = -L / 2 + (k + 0.5) * L / n2, len = L * (0.35 + 0.65 * ((k * 37) % 10) / 10);
                g.fillStyle = pal[cs[k % cs.length] - 1];
                if (q.grow === "center") g.fillRect(-len / 2, y - L / n2 / 2, len, L / n2 + 1);
                else g.fillRect(-L / 2, y - L / n2 / 2, len, L / n2 + 1);
            }
        } else if (r === "iris" || r === "clock") {
            var at = q.at || [0.5, 0.5], px = at[0] * W, py = at[1] * H, nn = q.n || 2, cc = nn === 1 ? [C1] : (nn === 2 ? [C2, C1] : [C3, C2, C1]);
            for (var m = 0; m < cc.length; m++) {
                var rad = Math.max(W, H) * (0.9 - m * 0.2);
                g.beginPath();
                if (r === "clock") { g.moveTo(px, py); g.arc(px, py, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * (1.3 - m * 0.3)); g.closePath(); }
                else g.arc(px, py, rad * 0.6, 0, 7);
                g.fillStyle = cc[m]; g.fill();
            }
        } else if (r === "doors") {
            g.fillStyle = C2;
            if (q.mode === "v") { g.fillRect(0, 0, W, H * 0.3); g.fillRect(0, H * 0.7, W, H * 0.3); g.fillStyle = C1; g.fillRect(0, 0, W, H * 0.22); g.fillRect(0, H * 0.78, W, H * 0.22); }
            else if (q.mode === "diag") { g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.7, 0); g.lineTo(0, H * 0.9); g.fill(); g.beginPath(); g.moveTo(W, H); g.lineTo(W * 0.3, H); g.lineTo(W, H * 0.1); g.fill(); }
            else if (q.mode === "quad") { g.fillStyle = C1; g.fillRect(0, 0, W * 0.38, H * 0.36); g.fillRect(W * 0.62, 0, W * 0.38, H * 0.36); g.fillRect(0, H * 0.64, W * 0.38, H * 0.36); g.fillRect(W * 0.62, H * 0.64, W * 0.38, H * 0.36); }
            else { g.fillRect(0, 0, W * 0.32, H); g.fillRect(W * 0.68, 0, W * 0.32, H); g.fillStyle = C1; g.fillRect(0, 0, W * 0.24, H); g.fillRect(W * 0.76, 0, W * 0.24, H); }
            g.fillStyle = C3; if (q.mode === "v") g.fillRect(0, H / 2 - 1, W, 2); else if (!q.mode || q.mode === "h") g.fillRect(W / 2 - 1, 0, 2, H);
        } else if (r === "diamond") {
            g.translate(W / 2, H / 2); g.rotate((q.rot === undefined ? 45 : q.rot) * Math.PI / 180);
            var dd = [C3, C2, C1];
            for (var j = 0; j < 3; j++) { var z = H * (1.1 - j * 0.3); g.fillStyle = dd[j]; g.fillRect(-z / 2, -z / 2, z, z); }
        } else if (r === "grid") {
            var cw = W / 8, ch = H / 5;
            for (var gy = 0; gy < 5; gy++) for (var gx = 0; gx < 8; gx++) {
                var f = Math.max(0, Math.min(1, 1.6 - (gx + gy) / 7));
                if (f <= 0) continue;
                g.fillStyle = (gx + gy) % 2 && q.colors ? C2 : C1;
                var sz = f * 0.95;
                rr(g, gx * cw + cw * (1 - sz) / 2, gy * ch + ch * (1 - sz) / 2, cw * sz, ch * sz, q.round ? 3 : 0.5); g.fill();
            }
        } else if (r === "pill") {
            var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, C1); gr.addColorStop(1, C2);
            g.fillStyle = gr; rr(g, W * 0.18, H * 0.25, W * 0.64, H * 0.5, H * 0.25); g.fill();
        } else if (r === "softwipe") {
            var gr2 = g.createLinearGradient(0, 0, W, 0); gr2.addColorStop(0, rgba(C1, 1)); gr2.addColorStop(0.55, rgba(C2, 1)); gr2.addColorStop(0.75, rgba(C3, 0.9)); gr2.addColorStop(1, rgba(C3, 0));
            g.fillStyle = gr2; g.fillRect(0, 0, W, H);
        } else if (r === "columns") {
            for (var cI = 0; cI < 6; cI++) { g.fillStyle = cI % 2 ? C2 : C1; rr(g, cI * W / 6, H * (0.15 + 0.12 * cI), W / 6 + 1, H * 1.2, 5); g.fill(); }
        } else if (r === "blob") {
            g.fillStyle = C2; g.beginPath(); g.arc(0, H, W * 0.85, 0, 7); g.fill();
            g.fillStyle = C1; g.beginPath(); g.arc(0, H, W * 0.68, 0, 7); g.fill();
        } else if (r === "card") {
            g.fillStyle = rgba(C2, 0.6); g.fillRect(0, 0, W, H);
            g.fillStyle = C1; g.shadowColor = "rgba(0,0,0,0.5)"; g.shadowBlur = 8; rr(g, W * 0.25, H * 0.22, W * 0.5, H * 0.56, 6); g.fill();
        } else if (r === "wipeReveal" || r === "depthReveal") {
            g.fillStyle = "#3a3a44"; g.fillRect(0, 0, W, H);
            var gr3 = r === "wipeReveal" ? g.createLinearGradient(W * 0.35, 0, W * 0.75, 0) : g.createRadialGradient(W / 2, H / 2, 2, W / 2, H / 2, W * 0.5);
            gr3.addColorStop(0, "rgba(0,0,0,0)"); gr3.addColorStop(0.45, C2); gr3.addColorStop(0.7, C1); gr3.addColorStop(1, "rgba(0,0,0,0)");
            g.fillStyle = gr3; g.fillRect(0, 0, W, H);
            g.fillStyle = "rgba(255,255,255,0.85)";
            if (r === "wipeReveal") g.fillRect(0, 0, W * 0.4, H); else { g.beginPath(); g.arc(W / 2, H / 2, H * 0.22, 0, 7); g.fill(); }
        }
        g.restore();
    }
    function icon3d(cv, p) {
        var c = prep(cv), g = c.g, W = c.W, H = c.H;
        g.fillStyle = "#1b1b1f"; g.fillRect(0, 0, W, H);
        var cx = W / 2, cy = H / 2;
        function arrowLine(x1, y1, x2, y2, col) {
            g.strokeStyle = col; g.lineWidth = 1.5; g.setLineDash([3, 2]); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
            var a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 5 * Math.cos(a - 0.5), y2 - 5 * Math.sin(a - 0.5)); g.lineTo(x2 - 5 * Math.cos(a + 0.5), y2 - 5 * Math.sin(a + 0.5)); g.closePath(); g.fillStyle = col; g.fill();
        }
        var f = p.from, t = p.to, s = 0.42;
        if (!p.pop) {
            var fx = cx + f[0] * W * s, fy = cy + f[1] * H * s - f[2] * 4, tx = cx + t[0] * W * s, ty = cy + t[1] * H * s - t[2] * 4;
            if (f[0] === t[0] && f[1] === t[1] && f[2] === t[2]) { tx = fx + (f[1] ? 6 : 0); ty = fy + (f[0] ? 6 : 0); }
            arrowLine(fx, fy, cx - (f[0] ? f[0] * 12 : 0), cy - (f[1] ? f[1] * 10 : 0) + (f[2] ? 10 : 0), "rgba(255,255,255,0.35)");
            arrowLine(cx + (t[0] ? t[0] * 12 : 0), cy + (t[1] ? t[1] * 10 : 0) - (t[2] ? 10 : 0), tx, ty, "rgba(255,255,255,0.35)");
        }
        g.fillStyle = "#4c3bb5"; g.beginPath(); g.ellipse(cx + 3, cy, H * 0.22, H * 0.26, 0, 0, 7); g.fill();
        g.fillStyle = "#7c5cff"; g.beginPath(); g.ellipse(cx, cy, H * 0.2, H * 0.26, 0, 0, 7); g.fill();
        g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.ellipse(cx - 3, cy - 4, H * 0.06, H * 0.1, -0.4, 0, 7); g.fill();
    }
    function text(cv, p, saas) {
        var c = prep(cv), g = c.g, W = c.W, H = c.H;
        g.fillStyle = "#14141a"; g.fillRect(0, 0, W, H);
        var accent = "#8b7cff", white = "#f4f4f5", grey = "rgba(244,244,245,0.35)";
        var F = function (px, w) { g.font = (w || 700) + " " + Math.round(px) + "px Inter, Segoe UI, sans-serif"; };
        g.textBaseline = "middle"; g.textAlign = "center";
        var cx = W / 2, cy = H / 2, s = H * 0.34;
        if (!saas) {
            F(H * 0.42); g.fillStyle = white;
            if (p.id === "tx14") g.fillStyle = accent;
            if ({ tx02: 1, tx10: 1 }[p.id]) { g.save(); g.globalAlpha = 0.25; g.filter = "blur(2px)"; g.fillText("Aa", cx, cy + 5); g.restore(); }
            if ({ tx01: 1, tx05: 1, tx09: 1 }[p.id]) { g.save(); g.globalAlpha = 0.25; g.fillText("Aa", cx, cy + 9); g.restore(); }
            g.fillText(p.id === "tx03" ? "Aa|" : "Aa", cx, cy + 1);
            return;
        }
        var look = p.look || "zoom";
        var word = function (txt, x, y, col, px, alpha, blur) {
            g.save(); F(px || s); g.fillStyle = col || white; g.globalAlpha = alpha === undefined ? 1 : alpha;
            if (blur) g.filter = "blur(" + blur + "px)";
            g.fillText(txt, x, y); g.restore();
        };
        switch (look) {
            case "zoom": word("Clean", cx, cy, grey, s * 1.5, 0.5, 1.5); word("Clean", cx, cy, white); break;
            case "zoomAccent": word("preset", cx, cy, accent, s * 1.6, 0.4, 2); word("preset", cx, cy, white); break;
            case "words": word("easy", cx - W * 0.18, cy, white, s * 0.7); word("to", cx + W * 0.06, cy, white, s * 0.55, 0.6); word("go", cx + W * 0.24, cy, white, s * 0.4, 0.3); break;
            case "randomWords": word("good", cx - W * 0.2, cy, white, s * 0.6); word("text", cx, cy, accent, s * 0.6); word("design", cx + W * 0.24, cy, grey, s * 0.6); break;
            case "cascade": g.textAlign = "left"; word("mor", W * 0.18, cy, white, s * 0.8); word("e", W * 0.52, cy, accent, s * 0.8); word("x", W * 0.66, cy, accent, s * 0.8, 0.35); break;
            case "rise": word("Rise", cx, cy, white); g.save(); var gr = g.createLinearGradient(0, cy, 0, cy + s * 0.6); gr.addColorStop(0, "rgba(20,20,26,0)"); gr.addColorStop(1, "#14141a"); g.fillStyle = gr; g.fillRect(0, cy, W, s * 0.6); g.restore(); break;
            case "swing": g.save(); g.translate(cx - W * 0.12, cy); word("Re", 0, 0, white, s * 0.8); g.restore(); g.save(); g.translate(cx + W * 0.16, cy - H * 0.16); g.rotate(-0.6); word("al", 0, 0, white, s * 0.8, 0.6); g.restore(); break;
            case "stair": ["we", "draw", "you"].forEach(function (w, i) { word(w, W * (0.25 + i * 0.25), cy + (i - 1) * H * 0.2, white, s * 0.5); }); break;
            case "wave": word("Just", cx - W * 0.2, cy, white, s * 0.55); word("what", cx + W * 0.02, cy, accent, s * 0.55); word("I", cx + W * 0.22, cy, accent, s * 0.55, 0.5); break;
            case "blast": word("GO", cx, cy, white, s * 2.4, 0.18, 3); word("GO", cx, cy, white, s * 1.1); break;
            case "sparkle": g.textAlign = "left"; word("Spark", W * 0.14, cy, white, s * 0.7); g.save(); g.translate(W * 0.72, cy); g.fillStyle = "#fff"; g.shadowColor = accent; g.shadowBlur = 8; g.beginPath(); for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4, r = i % 2 ? 2 : 9; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.restore(); break;
            case "assemble": [["T", -0.3, -0.2, -0.5], ["h", -0.1, 0.25, 0.4], ["i", 0.08, -0.25, 0.9], ["n", 0.28, 0.15, -0.3]].forEach(function (q) { g.save(); g.translate(cx + q[1] * W, cy + q[2] * H); g.rotate(q[3]); g.shadowColor = accent; g.shadowBlur = 6; word(q[0], 0, 0, white, s * 0.75); g.restore(); }); break;
            case "decode": g.textAlign = "left"; word("Bui", W * 0.14, cy, white, s * 0.7); word("#x%", W * 0.5, cy, accent, s * 0.7); break;
            case "echo": for (var e = 4; e >= 0; e--) word("Work", cx, cy - H * 0.2 + e * H * 0.13, e ? accent : white, s * 0.55, e ? 0.8 - e * 0.15 : 1); break;
            case "count": g.save(); g.shadowColor = accent; g.shadowBlur = 10; word("$110K", cx, cy, "#c4b5fd", s * 0.75); g.restore(); break;
            case "caret": g.textAlign = "left"; word("Value", W * 0.18, cy, white, s * 0.7); g.save(); g.fillStyle = "#fff"; g.shadowColor = "#fff"; g.shadowBlur = 6; g.fillRect(W * 0.72, cy - s * 0.4, 2, s * 0.8); g.restore(); break;
            case "block": g.textAlign = "left"; word("sync", W * 0.18, cy, white, s * 0.7); g.fillStyle = accent; g.fillRect(W * 0.66, cy - s * 0.3, s * 0.4, s * 0.55); break;
            case "oneword": word("ONE", cx, cy, white, s * 1.1); break;
            case "bloom": g.save(); g.shadowColor = accent; g.shadowBlur = 14; word("Glow", cx, cy, "#ddd6fe", s * 0.9); g.restore(); break;
            case "bounce": word("B", cx - W * 0.14, cy + H * 0.06, white, s); word("u", cx, cy - H * 0.14, white, s); word("t", cx + W * 0.13, cy + H * 0.02, white, s); break;
            case "list": ["Title", "Motion", "Text"].forEach(function (w, i) { word(w, cx + 4, cy + (i - 1) * H * 0.26, i === 1 ? white : grey, s * (i === 1 ? 0.55 : 0.45)); }); g.fillStyle = accent; g.beginPath(); g.arc(cx - W * 0.25, cy, 2.5, 0, 7); g.fill(); break;
            case "roll": word("Any", cx, cy - H * 0.06, white, s * 0.8); g.fillStyle = "#14141a"; g.fillRect(0, cy + s * 0.32, W, H); word("Any", cx, cy + H * 0.36, white, s * 0.8, 0.25); break;
            case "underline": word("Meet", cx, cy - 2, white, s * 0.75); g.strokeStyle = accent; g.lineWidth = 2; g.lineCap = "round"; g.beginPath(); g.moveTo(W * 0.24, cy + s * 0.48); g.quadraticCurveTo(cx, cy + s * 0.32, W * 0.76, cy + s * 0.42); g.stroke(); break;
            case "circle": word("today?", cx, cy, white, s * 0.6); g.strokeStyle = accent; g.lineWidth = 1.8; g.beginPath(); g.ellipse(cx, cy, W * 0.36, H * 0.26, -0.06, 0, Math.PI * 2.1); g.stroke(); break;
            case "glitch": g.globalCompositeOperation = "screen"; word("NO?", cx - 2, cy, "#ff2e4c", s * 0.9); word("NO?", cx + 2, cy, "#22e5ff", s * 0.9); g.globalCompositeOperation = "source-over"; word("NO?", cx, cy, white, s * 0.9, 0.85); break;
            case "slide": word("moves", cx - W * 0.06, cy, white, s * 0.7); word("fast", cx + W * 0.3, cy, grey, s * 0.7, 0.6, 2); break;
            case "scatter": word("Text", cx - W * 0.25, cy - H * 0.22, white, s * 0.5); word("SaaS", cx + W * 0.2, cy + H * 0.25, white, s * 0.5); word("Anim", cx + W * 0.28, cy - H * 0.15, white, s * 0.5, 0.5); break;
            case "push": word("Less", cx, cy, white, s * 0.9); g.strokeStyle = grey; g.lineWidth = 1; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (d) { g.beginPath(); g.moveTo(cx + d[0] * W * 0.36, cy + d[1] * H * 0.3); g.lineTo(cx + d[0] * W * 0.46, cy + d[1] * H * 0.42); g.stroke(); }); break;
            default: word("Aa", cx, cy, white);
        }
        g.fillStyle = accent; g.fillRect(W / 2 - 8, H - 6, 16, 2);
    }
    return { transition: transition, icon3d: icon3d, text: text };
})();

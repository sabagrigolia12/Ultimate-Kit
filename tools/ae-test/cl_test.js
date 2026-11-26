// Panel test (eval'd through cdp): centre lines of canvas-font letters; draws the letter (grey), the rebuilt stroke
// (blue, its width) and the centre line with its points (red) for every letter, returns a data URL + point counts.
(function () {
    var load = function (f) { var x = new XMLHttpRequest(); x.open("GET", f, false); x.send(); (0, eval)(x.responseText); };
    load("shared/pathsimp.js"); load("js/centerline.js");
    var letters = (window.CL_LETTERS || "NOTEaeiSRB8&kw").split(""), font = window.CL_FONT || "900 Arial", size = window.CL_SIZE || 220, cell = Math.round(size * 1.18), cols = window.CL_COLS || 7;
    var out = document.createElement("canvas"); out.width = cell * Math.min(cols, letters.length); out.height = cell * 1.45 * Math.ceil(letters.length / cols);
    var g = out.getContext("2d"); g.fillStyle = "#111"; g.fillRect(0, 0, out.width, out.height);
    var info = [], t0 = performance.now();
    letters.forEach(function (ch, idx) {
        /* CL_REAL: the letter drawn as big as Word to Path draws a piece (its larger side 520 px), shown at the cell size */
        var R = UKCenter.fromText(ch, font, size), kz = 1;
        if (window.CL_REAL) {
            var bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1; for (var q0 = 0; q0 < R.W * R.H; q0++) if (R.bin[q0]) { var xq = q0 % R.W, yq = Math.floor(q0 / R.W); if (xq < bx0) bx0 = xq; if (xq > bx1) bx1 = xq; if (yq < by0) by0 = yq; if (yq > by1) by1 = yq; }
            kz = 520 / Math.max(1, bx1 - bx0, by1 - by0); R = UKCenter.fromText(ch, font, size * kz);
        }
        var comps = UKCenter.fromRaster(R);
        var ox = (idx % cols) * cell, oy = Math.floor(idx / cols) * cell * 1.45;
        /* the comparison: the stroke rendered alone, then glyph and stroke as colours - both grey, only the glyph orange
           (the stroke misses it), only the stroke cyan (the stroke goes past it) */
        var sc = document.createElement("canvas"); sc.width = R.W; sc.height = R.H; var sg = sc.getContext("2d");
        comps.forEach(function (c) {
            if (c.dot) { sg.fillStyle = "#000"; sg.beginPath(); if (c.dot.round) sg.ellipse(c.dot.c[0], c.dot.c[1], c.dot.size[0] / 2, c.dot.size[1] / 2, 0, 0, Math.PI * 2); else sg.rect(c.dot.c[0] - c.dot.size[0] / 2, c.dot.c[1] - c.dot.size[1] / 2, c.dot.size[0], c.dot.size[1]); sg.fill(); return; }
            c.paths.forEach(function (p) {
                var pa = new Path2D(), n = p.v.length, last = p.c ? n : n - 1; pa.moveTo(p.v[0][0], p.v[0][1]);
                for (var j = 0; j < last; j++) { var j1 = (j + 1) % n; pa.bezierCurveTo(p.v[j][0] + p.o[j][0], p.v[j][1] + p.o[j][1], p.v[j1][0] + p.i[j1][0], p.v[j1][1] + p.i[j1][1], p.v[j1][0], p.v[j1][1]); }
                if (p.c) pa.closePath();
                sg.strokeStyle = "#000"; sg.lineWidth = c.width; sg.lineCap = p.cap === 2 ? "round" : "butt"; sg.lineJoin = p.join === 2 ? "round" : (p.join === 3 ? "bevel" : "miter"); sg.miterLimit = 4; sg.stroke(pa);
            });
        });
        var sd = sg.getImageData(0, 0, R.W, R.H), cmp = sg.createImageData(R.W, R.H), miss = 0, over = 0, tot2 = 0;
        for (var q = 0; q < R.W * R.H; q++) {
            var A = R.bin[q], B = sd.data[q * 4 + 3] > 127, o = q * 4;
            if (A) tot2++;
            if (A && B) { cmp.data[o] = 70; cmp.data[o + 1] = 70; cmp.data[o + 2] = 80; cmp.data[o + 3] = 255; }
            else if (A) { cmp.data[o] = 255; cmp.data[o + 1] = 140; cmp.data[o + 2] = 0; cmp.data[o + 3] = 255; miss++; }
            else if (B) { cmp.data[o] = 0; cmp.data[o + 1] = 200; cmp.data[o + 2] = 255; cmp.data[o + 3] = 255; over++; }
        }
        sg.putImageData(cmp, 0, 0);
        g.save(); g.translate(ox, oy); g.scale(1 / kz, 1 / kz); g.drawImage(sc, 0, 0);
        var pts = 0, ws = [];
        comps.forEach(function (c) {
            if (c.dot) { g.fillStyle = "rgba(60,140,255,0.75)"; g.beginPath(); if (c.dot.round) g.ellipse(c.dot.c[0], c.dot.c[1], c.dot.size[0] / 2, c.dot.size[1] / 2, 0, 0, Math.PI * 2); else g.rect(c.dot.c[0] - c.dot.size[0] / 2, c.dot.c[1] - c.dot.size[1] / 2, c.dot.size[0], c.dot.size[1]); g.fill(); return; }
            ws.push(Math.round(c.width));
            c.paths.forEach(function (p) {
                var path = new Path2D();
                pts += p.v.length; path.moveTo(p.v[0][0], p.v[0][1]);
                var n = p.v.length, last = p.c ? n : n - 1;
                for (var j = 0; j < last; j++) { var j1 = (j + 1) % n; path.bezierCurveTo(p.v[j][0] + p.o[j][0], p.v[j][1] + p.o[j][1], p.v[j1][0] + p.i[j1][0], p.v[j1][1] + p.i[j1][1], p.v[j1][0], p.v[j1][1]); }
                if (p.c) path.closePath();
                g.strokeStyle = "#FF3344"; g.lineWidth = 1.5 * kz; g.lineCap = "round"; g.lineJoin = "round"; g.stroke(path);
            });
            c.paths.forEach(function (p, pi) { p.v.forEach(function (v, vi) { g.fillStyle = vi === 0 ? "#3F3" : "#FFF"; g.fillRect(v[0] - 3 * kz, v[1] - 3 * kz, 6 * kz, 6 * kz); }); });
        });
        var mp = Math.round(100 * miss / Math.max(1, tot2)), op = Math.round(100 * over / Math.max(1, tot2));
        g.setTransform(1, 0, 0, 1, ox, oy); g.fillStyle = "#FF0"; g.font = "14px sans-serif"; g.fillText(ch + ": " + pts + " pts, w " + ws.join("/") + "  -" + mp + "% +" + op + "%", 4, cell * 1.4);
        g.restore();
        info.push(ch + "=" + pts + "(-" + mp + "+" + op + ")");
    });
    return info.join(" ") + " | " + Math.round(performance.now() - t0) + " ms|" + out.toDataURL();
})();

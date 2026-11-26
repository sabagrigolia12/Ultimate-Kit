// Panel debug (eval'd through cdp): for a few letters draws the thinned skeleton (white) and the graph after pruning
// (edges in colours, nodes as yellow dots), returns a data URL.
(function () {
    var load = function (f) { var x = new XMLHttpRequest(); x.open("GET", f, false); x.send(); (0, eval)(x.responseText); };
    load("shared/pathsimp.js"); load("js/centerline.js");
    var letters = (window.CL_LETTERS || "Nkw&").split(""), font = "900 Arial", size = 220, cell = 300;
    var out = document.createElement("canvas"); out.width = cell * letters.length; out.height = cell * 1.3;
    var g = out.getContext("2d"); g.fillStyle = "#111"; g.fillRect(0, 0, out.width, out.height);
    var info = [];
    letters.forEach(function (ch, idx) {
        var R = UKCenter.fromText(ch, font, size), dbg = UKCenter.debug(R);
        g.save(); g.translate(idx * cell, 0); g.globalAlpha = 0.3; g.drawImage(R.cv, 0, 0); g.globalAlpha = 1;
        var im = g.getImageData(idx * cell, 0, R.W, R.H);
        for (var i = 0; i < R.W * R.H; i++) if (dbg.sk[i]) { im.data[i * 4] = 255; im.data[i * 4 + 1] = 255; im.data[i * 4 + 2] = 255; im.data[i * 4 + 3] = 255; }
        g.putImageData(im, idx * cell, 0);
        var cols = ["#f44", "#4f4", "#48f", "#f4f", "#4ff", "#fa4", "#fff"];
        dbg.edges.forEach(function (e, k) { g.strokeStyle = cols[k % cols.length]; g.lineWidth = 3; g.beginPath(); e.pts.forEach(function (p, j) { if (j) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke(); });
        dbg.nodes.forEach(function (n) { g.fillStyle = "#ff0"; g.fillRect(n.x - 3, n.y - 3, 6, 6); });
        g.fillStyle = "#FF0"; g.font = "13px sans-serif"; g.fillText(ch + ": edges " + dbg.edges.length + " raw " + dbg.raw + " medD " + Math.round(dbg.medD), 4, cell * 1.25);
        g.restore();
        info.push(ch + ": " + dbg.edges.map(function (e) { return e.a + "-" + e.b + "(" + e.px.length + (e.ring ? "R" : "") + ")"; }).join(" "));
    });
    return info.join(" | ") + "|" + out.toDataURL();
})();

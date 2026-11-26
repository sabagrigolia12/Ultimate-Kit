/*  Ultimate Kit - Depth Reveal (UK_DEPTH): a photo is revealed (or covered) by its own depth. The depth map
    is made in the panel (js/depth.js); After Effects gets: a Null "Depth Controls" (Softness slider), a copy
    of the photo with a cycling colour look (Colorama + Channel Mixer + Camera Lens Blur) that a Gradient Wipe
    driven by the depth map dissolves away, the depth map itself (hidden) and the photo.
    Shared by the panel and ExtendScript, so ES3 only.

    look { id, name, fx: "palette" (a cycling palette, pal = PALETTES key) or another look (jsx/depth.jsx),
           colors: [..] the colours a look uses (editable in the panel), soft: default softness % }          */
var UK_DEPTH = (function () {
    function P(id, name, fx, o) {
        o = o || {};
        return { id: id, name: name, fx: fx, pal: o.pal || null, colors: o.colors || null, note: o.note || "", soft: o.soft || (fx === "palette" ? 100 : 60) };
    }
    /* cycling palettes (Colorama-style: brightness -> colour, the phase turns it round): keys [brightness 0..1, colour],
       sampled from the reference looks */
    var PALETTES = {
        ice: [[0.02, "#E6F2FA"], [0.15, "#E7F0F9"], [0.27, "#DFE8F3"], [0.40, "#DAE9F1"], [0.52, "#DCEDEE"], [0.65, "#E4EFE9"],
            [0.77, "#DAEDEE"], [0.90, "#CEEBF3"], [0.98, "#D7EFF7"]],
        violet: [[0.02, "#E16CF1"], [0.11, "#E6A0FC"], [0.20, "#D294F8"], [0.30, "#B470E7"], [0.42, "#944FCB"], [0.52, "#7E3DB5"],
            [0.61, "#6B308D"], [0.65, "#6A2D7C"], [0.73, "#8D269D"], [0.80, "#A71BAD"], [0.89, "#CD11D0"]],
        peach: [[0.02, "#EBE6EA"], [0.10, "#F8EEE3"], [0.19, "#F9E2BC"], [0.27, "#F7CD93"], [0.35, "#F5BC79"], [0.44, "#F4AC69"],
            [0.52, "#F4A162"], [0.65, "#F19E70"], [0.77, "#EBA592"], [0.85, "#D5B2CA"], [0.90, "#CEB5D1"]]
    };
    var L = [
        P("dp01", "Pastel Ice", "palette", { pal: "ice", note: "pale ice-blue pastel that shimmers away" }),
        P("dp02", "Violet Haze", "palette", { pal: "violet", note: "violet, magenta and lavender cycling away" }),
        P("dp03", "Peach Glow", "palette", { pal: "peach", note: "cream, peach and lavender cycling away" }),
        P("dr01", "Pastel Dream", "dream", { note: "iridescent pastel haze that shimmers" }),
        P("dr02", "Mono", "mono", { note: "black & white, colour arrives with depth" }),
        P("dr03", "Focus Pull", "blur", { note: "out of focus, sharpens with depth" }),
        P("dr04", "White Fog", "fog", { colors: ["#FFFFFF"], note: "soft white fog lifting" }),
        P("dr05", "Dark", "dark", { colors: ["#000000"], note: "out of the dark" }),
        P("dr06", "Thermal", "thermal", { note: "heat-camera colours" }),
        P("dr07", "Golden", "golden", { note: "warm golden wash" }),
        P("dr08", "Duotone", "duo", { colors: ["#1B1446", "#FF7AB8"], note: "two-colour print" }),
        P("dr09", "Neon Lines", "neon", { colors: ["#7C5CFF"], note: "glowing outlines on black" }),
        P("dr10", "Blueprint", "blueprint", { colors: ["#0B2A5B", "#BFE3FF"], note: "white lines on blueprint blue" }),
        P("dr11", "Mosaic", "mosaic", { note: "big pixels resolving" }),
        P("dr12", "Negative", "negative", { note: "inverted colours" })
    ];
    /* timing (as a fraction of the wipe's duration D, from the playhead): the colours turn two full cycles
       from 0 to 1.03 D, the depth wipe runs from 0.224 D to 1.224 D; every key is an Easy Ease */
    var TIME = { phase: [0, 1.03], wipe: [0.224, 1.224], turns: 2 };
    var EASE = [33.34, 33.34];
    /* After Effects can't script Colorama's own palette, so a palette is made from what can be set:
       Colorama's default hue wheel (red, yellow, green, cyan, blue, magenta by brightness, turned by Phase
       Shift) and a Channel Mixer whose 12 numbers are fitted here (least squares) so that
       mixer(wheel(brightness + phase)) follows the palette's colours. Turning the phase then cycles the
       palette exactly like Colorama does. Returns { phase (degrees), mix: [[r,g,b,const] x 3] (percent), rms } */
    function wheel(h) {
        h = h - Math.floor(h);
        var c = function (v) { return v < 0 ? 0 : (v > 1 ? 1 : v); };
        return [c(Math.abs(6 * h - 3) - 1), c(2 - Math.abs(6 * h - 2)), c(2 - Math.abs(6 * h - 4))];
    }
    function rgb(hex) { var n = parseInt(String(hex).replace("#", ""), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
    function samples(keys) {
        var s = [], i, k, n = keys.length;
        for (i = 0; i < 96; i++) {
            var x = (i + 0.5) / 96, a = null, b = null;
            for (k = 0; k < n; k++) {
                var ka = keys[k], kb = keys[(k + 1) % n], xa = ka[0], xb = kb[0] + (k === n - 1 ? 1 : 0), xx = x < xa ? x + 1 : x;
                if (xx >= xa && xx <= xb) { a = ka; b = kb; var f = (xx - xa) / Math.max(1e-6, xb - xa), ca = rgb(a[1]), cb = rgb(b[1]); s.push([x, ca[0] + (cb[0] - ca[0]) * f, ca[1] + (cb[1] - ca[1]) * f, ca[2] + (cb[2] - ca[2]) * f]); break; }
            }
        }
        return s;
    }
    function solve4(A, b) {
        var M = [], i, j, k;
        for (i = 0; i < 4; i++) M.push([A[i][0], A[i][1], A[i][2], A[i][3], b[i]]);
        for (i = 0; i < 4; i++) {
            var p = i;
            for (j = i + 1; j < 4; j++) if (Math.abs(M[j][i]) > Math.abs(M[p][i])) p = j;
            var t = M[i]; M[i] = M[p]; M[p] = t;
            for (j = i + 1; j < 4; j++) { var f = M[j][i] / M[i][i]; for (k = i; k < 5; k++) M[j][k] -= f * M[i][k]; }
        }
        var x = [0, 0, 0, 0];
        for (i = 3; i >= 0; i--) { var sm = M[i][4]; for (k = i + 1; k < 4; k++) sm -= M[i][k] * x[k]; x[i] = sm / M[i][i]; }
        return x;
    }
    function fit(keys) {
        var S = samples(keys), best = null, p, ch, i, j, q, pass, list;
        for (pass = 0; pass < 2; pass++) {    // every 6 degrees, then every degree round the best
        list = [];
        if (!pass) for (p = 0; p < 360; p += 6) list.push(p); else for (p = best.phase - 5; p <= best.phase + 5; p++) list.push((p + 360) % 360);
        for (var pi = 0; pi < list.length; pi++) {
            p = list[pi];
            var phi = p / 360, mix = [], err = 0;
            for (ch = 0; ch < 3; ch++) {
                var A = [[0.02, 0, 0, 0], [0, 0.02, 0, 0], [0, 0, 0.02, 0], [0, 0, 0, 0.02]], b = [0, 0, 0, 0];
                for (q = 0; q < S.length; q++) {
                    var x = wheel(S[q][0] + phi); x.push(1);
                    for (i = 0; i < 4; i++) { b[i] += x[i] * S[q][1 + ch]; for (j = 0; j < 4; j++) A[i][j] += x[i] * x[j]; }
                }
                var m = solve4(A, b);
                mix.push(m);
                for (q = 0; q < S.length; q++) {
                    var w = wheel(S[q][0] + phi), v = m[0] * w[0] + m[1] * w[1] + m[2] * w[2] + m[3];
                    v = v < 0 ? 0 : (v > 1 ? 1 : v);
                    err += (v - S[q][1 + ch]) * (v - S[q][1 + ch]);
                }
            }
            if (!best || err < best.err) best = { err: err, phase: p, mix: mix };
        }
        }
        var pct = [];
        for (ch = 0; ch < 3; ch++) pct.push([Math.round(best.mix[ch][0] * 1000) / 10, Math.round(best.mix[ch][1] * 1000) / 10, Math.round(best.mix[ch][2] * 1000) / 10, Math.round(best.mix[ch][3] * 1000) / 10]);
        return { phase: best.phase, mix: pct, rms: Math.sqrt(best.err / (S.length * 3)) * 255 };
    }
    // fitted once (fit(PALETTES[k])) - fitting takes seconds in ExtendScript; refit after changing a palette
    var FITS = {
        ice: { phase: 159, mix: [[2.4, 1.5, 4.5, 82.6], [0.5, 1.9, 0.7, 91.3], [-2, 1.3, 2.9, 93.7]] },
        violet: { phase: 252, mix: [[8.3, -18.5, 23.1, 61.4], [24.8, -17.4, 5.4, 24.9], [18.2, -17.6, 13.9, 72.3]] },
        peach: { phase: 281, mix: [[7.7, 6.1, -1.6, 87.1], [16.2, -11.4, 4.6, 69.6], [7.9, -28.6, 18.9, 63.4]] }
    };
    function fitOf(pal) { return FITS[pal] || (FITS[pal] = fit(PALETTES[pal])); }
    return { list: L, EASE: EASE, TIME: TIME, PALETTES: PALETTES, fit: fit, fitOf: fitOf, wheel: wheel };
})();
if (typeof UK_CAT !== "undefined") UK_CAT.depth = UK_DEPTH.list;

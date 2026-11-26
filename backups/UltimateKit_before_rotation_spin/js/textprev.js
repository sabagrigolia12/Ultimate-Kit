/*  Ultimate Kit - animated previews for the text presets (canvas). Not a renderer: each look is a
    close sketch of what the preset builds in After Effects, timed by the panel's In / Out / Hold
    settings, so hovering a tile shows how it moves before it goes on the timeline.               */
var UKTextPrev = (function () {
    var cl = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var E = {
        out: function (x) { x = cl(x, 0, 1); return 1 - Math.pow(1 - x, 3); },
        out5: function (x) { x = cl(x, 0, 1); return 1 - Math.pow(1 - x, 5); },
        expo: function (x) { x = cl(x, 0, 1); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); },
        inout: function (x) { x = cl(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
        sine: function (x) { x = cl(x, 0, 1); return 0.5 - Math.cos(Math.PI * x) / 2; },
        "in": function (x) { x = cl(x, 0, 1); return x * x * x; }
    };
    function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
    function hex(h) { var n = parseInt(String(h).replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    function mix(a, b, k) { return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * k) + "," + Math.round(a[1] + (b[1] - a[1]) * k) + "," + Math.round(a[2] + (b[2] - a[2]) * k) + ")"; }
    var WHITE = [244, 244, 245], GREY = [130, 130, 140];
    var TEXT = {
        tx01: "Motion Made Simple", tx02: "Clear and calm", tx04: "Pop!", tx06: "Focus", tx07: "Flip the script", tx08: "Make some waves",
        tx09: "Drop in", tx10: "Softly random", tx11: "Stretch", tx12: "Center stage", tx13: "Slide right in",
        st01: "Clean", st02: "preset", st03: "It's really easy", st35: "It's really easy", st04: "Good text design", st05: "more expensive", st06: "message", st07: "Really smooth.",
        st08: "we draw attention", st32: "we lift what matters", st09: "Just what I needed", st10: "Launch", st11: "Perfect for SaaS", st12: "Think Faster",
        st13: "Built for agents", st14: "Automate Work", st29: "Automate Work", st30: "Automate Work", st31: "Automate Work", st15: "$110,000+",
        st16: "Value Created", st17: "Everything in sync", st18: "Stand out with agents", st19: "Get it now!", st20: "But", st21: "Title\nMotion\nText",
        st22: "Any brand", st23: "Meet SaaS Presets", st24: "Deadline today?", st25: "No presentation?", st26: "Everything moves faster", st27: "Text SaaS Animation",
        st28: "Less effort.", st33: "Break the rules", st34: "Explode"
    };
    /* -------------------------------------------------------------- layout */
    function layout(g, text, W, H, lines) {
        var rows = String(text).split(/\r|\n/), fs = H * (rows.length > 1 ? 0.16 : 0.24), i, j;
        g.font = "700 " + fs + "px Inter, 'Segoe UI', sans-serif";
        var longest = 0;
        for (i = 0; i < rows.length; i++) longest = Math.max(longest, g.measureText(rows[i]).width);
        if (longest > W * 0.84) { fs *= W * 0.84 / longest; g.font = "700 " + fs + "px Inter, 'Segoe UI', sans-serif"; }
        var chars = [], word = 0, lh = fs * 1.25, y0 = H / 2 - (rows.length - 1) * lh / 2 + fs * 0.34;
        for (j = 0; j < rows.length; j++) {
            var row = rows[j], rw = g.measureText(row).width, x = W / 2 - rw / 2, prevSpace = true;
            for (i = 0; i < row.length; i++) {
                var ch = row[i], w = g.measureText(ch).width;
                if (ch !== " " && prevSpace && chars.length) word++;
                prevSpace = ch === " ";
                chars.push({ ch: ch, x: x + w / 2, y: y0 + j * lh, w: w, word: word, line: j });
                x += w;
            }
            word++;
        }
        var left = 1e9, right = -1e9;
        for (i = 0; i < chars.length; i++) { left = Math.min(left, chars[i].x - chars[i].w / 2); right = Math.max(right, chars[i].x + chars[i].w / 2); }
        return { chars: chars, fs: fs, words: word, lines: rows.length, left: left, right: right, cx: (left + right) / 2, cy: y0 + (rows.length - 1) * lh / 2 - fs * 0.34 };
    }
    /* cascade like a range selector: unit k of n, time u 0..1, ramp width W (%), 1 = revealed */
    function cas(k, n, u, W, curve) {
        var O = -W + (100 + W) * (curve || E.out)(u), pos = (k + 0.5) / n * 100;
        return E.sine((O - pos + W) / W);
    }
    function perm(n, seed) { var r = rng(seed), a = [], i; for (i = 0; i < n; i++) a.push(i); for (i = n - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } var inv = []; for (i = 0; i < n; i++) inv[a[i]] = i; return inv; }
    function base() { return { dx: 0, dy: 0, s: 1, sx: 1, sy: 1, r: 0, op: 1, blur: 0, col: 0, grey: 0 }; }
    function hide(st, h, P, fs) {   // move a char toward the hidden state P by h (0..1)
        if (P.op !== undefined) st.op *= 1 - h * (1 - P.op);
        if (P.dx) st.dx += P.dx * fs * h;
        if (P.dy) st.dy += P.dy * fs * h;
        if (P.s !== undefined) st.s *= 1 + (P.s - 1) * h;
        if (P.sx !== undefined) st.sx *= 1 + (P.sx - 1) * h;
        if (P.sy !== undefined) st.sy *= 1 + (P.sy - 1) * h;
        if (P.r) st.r += P.r * h;
        if (P.blur) st.blur += P.blur * fs * h;
        if (P.grey) st.grey = Math.max(st.grey, h * P.grey);
        if (P.col) st.col = Math.max(st.col, h * P.col);
        return st;
    }
    /* generic cascade looks: [based (c chars / w words), W, in-state, out-state, flags] */
    var GEN = {
        fadeUp: ["c", 40, { op: 0, dy: 0.55 }, { op: 0, dy: -0.45 }],
        blurIn: ["c", 55, { op: 0, blur: 0.35 }, { op: 0, blur: 0.35 }],
        rise: ["c", 35, { dy: 1.0 }, { dy: 1.0 }, { clip: true }],
        roll: ["c", 40, { dy: 1.45, sy: 0.2 }, { dy: -1.7, sy: 0.2 }, { clip: true }],
        words: ["w", 18, { op: 0, s: 0.55, dy: 0.18 }, { op: 0, s: 0.7, dy: -0.15 }],
        wordsRise: ["w", 18, { op: 0, s: 0.55, dy: 0.18 }, { op: 0, s: 0.7, dy: -0.15 }, { lift: 0.3 }],
        slide: ["w", 55, { op: 0, dx: 1.4, blur: 0.3, grey: 1 }, { op: 0, dx: -1.2, blur: 0.3 }],
        wordSlide: ["w", 65, { op: 0, dx: 0.7, blur: 0.2 }, { op: 0, dx: -0.7, blur: 0.2 }],
        wordFadeUp: ["w", 50, { op: 0, blur: 0.1, dy: 0.12 }, { op: 0, blur: 0.12, dy: -0.25 }],
        wordBlurIn: ["w", 55, { op: 0, blur: 0.22, s: 0.92 }, { op: 0, blur: 0.22, s: 0.92 }],
        cascade: ["c", 22, { op: 0, dy: 0.12, blur: 0.06 }, { op: 0, dy: 0.2 }, { trail: true, trailW: 80, trailK: 0.54 }],
        wave: ["w", 45, { op: 0, blur: 0.1, dy: 0.12, col: 1 }, { op: 0, blur: 0.12, dy: -0.25 }, { trail: true }],
        randomWords: ["w", 30, { op: 0, blur: 0.15, col: 1 }, { op: 0, blur: 0.15 }, { random: 5, trail: true }],
        randomFade: ["c", 60, { op: 0, blur: 0.25, s: 0.88 }, { op: 0, blur: 0.25, s: 0.88 }, { random: 7, slow: 1.5, curve: E.sine }],
        swing: ["c", 30, { dy: -1.1, r: -40, op: 0 }, { dy: -0.8, r: 35, op: 0 }],
        flip: ["c", 45, { op: 0, sy: 0.05, dy: 0.25 }, { op: 0, sy: 0.05, dy: -0.25 }],
        popScale: ["c", 45, { s: 0, op: 0 }, { s: 0, op: 0 }, { bump: { s: 1.12 }, curve: E.sine }],
        bounceDrop: ["c", 38, { dy: -1.4, op: 0 }, { dy: 0.9, op: 0 }, { bump: { dy: -0.22 }, bump2: { dy: -0.07 }, curve: E.sine }],
        elastic: ["c", 42, { sy: 0, op: 0 }, { sy: 0, op: 0 }, { bump: { sx: 0.94, sy: 1.18 }, curve: E.sine, baseline: true }],
        bounce: ["c", 28, { dy: 1.5, op: 0 }, { dy: 1.5, op: 0 }, { depth: true, bump: { dy: -0.28 } }],
        push: ["w", 60, { op: 0, blur: 0.15 }, { op: 0, blur: 0.12 }, { grow: 1.12 }],
        split: ["c", 50, { op: 0, s: 0.7, blur: 0.12 }, { op: 0, s: 0.7, blur: 0.12 }, { center: true }],
        assemble: ["c", 70, { op: 0, blur: 0.14, scatter: true, r: 60 }, { op: 0, blur: 0.14, scatter: true, r: 60 }, { random: 11, slow: 2.2, curve: E.out, glow: true }]
    };
    function stateGen(L, look, phase, u, o) {
        var G = GEN[look], fl = G[4] || {}, n = G[0] === "w" ? L.words : L.chars.length, out = [], i;
        var order = fl.random ? perm(n, fl.random) : null;
        for (i = 0; i < L.chars.length; i++) {
            var c = L.chars[i], k = G[0] === "w" ? c.word : i, kk = order ? order[k] : k;
            if (fl.center) kk = Math.abs((G[0] === "w" ? c.word : i) - (n - 1) / 2) * 2;
            var st = base(), W = G[1], uu = cl(u * (phase === "in" && fl.slow ? 1 : 1), 0, 1);
            var p = cas(fl.center ? kk / 2 : kk, fl.center ? Math.ceil(n / 2) : n, uu, W, phase === "in" ? (fl.curve || E.out) : E.inout);
            var P = phase === "in" ? G[2] : G[3];
            if (phase === "in") {
                if (fl.depth) { var dr = rng(i * 7 + 3); P = { dy: P.dy * (0.4 + dr() * 1.1), op: 0 }; }
                if (P.scatter) { var sr = rng(i * 13 + 1); P = { op: 0, blur: P.blur, dx: (sr() * 2 - 1) * 2.2, dy: (sr() * 2 - 1) * 1.6, r: (sr() * 2 - 1) * 60 }; }
                hide(st, 1 - p, P, L.fs);
                if (fl.bump) { var b = Math.sin(Math.PI * cl((p - 0.35) / 0.65, 0, 1)); hide(st, b, fl.bump, L.fs); }
                if (fl.bump2) { var b2 = Math.sin(Math.PI * cl((p - 0.75) / 0.25, 0, 1)); hide(st, b2, fl.bump2, L.fs); }
                if (fl.trail) st.col = Math.max(st.col, 1 - cas(kk, n, cl((o.el !== undefined ? o.el / o.inDur : u) * (fl.trailK || 0.8), 0, 1), fl.trailW || 50, E.sine));
            } else if (phase === "hold" && fl.trail && o.el !== undefined) {
                st.col = 1 - cas(kk, n, cl(o.el / o.inDur * (fl.trailK || 0.8), 0, 1), fl.trailW || 50, E.sine);   // the colour keeps fading into the hold
            } else if (phase === "out") {
                if (P.scatter) { var so = rng(i * 13 + 1); P = { op: 0, blur: P.blur, dx: (so() * 2 - 1) * 2.2, dy: (so() * 2 - 1) * 1.6, r: (so() * 2 - 1) * 60 }; }
                hide(st, cas(kk, n, u, W, E.inout), P, L.fs);
            }
            if (fl.lift) {   // the whole line rises a little (flat accent until it stops), goes up on exit
                if (phase === "in") { st.dy += fl.lift * L.fs * (1 - E.out(cl(u / 0.6, 0, 1))); st.col = u < 0.55 ? 1 : 0; }
                else if (phase === "out") st.dy -= fl.lift * L.fs * E["in"](u);
            }
            if (fl.grow) st.s *= 1 + (fl.grow - 1) * o.life;
            st.clip = fl.clip; st.baseline = fl.baseline; st.glow = fl.glow ? (phase === "in" ? 1 - u * 0.7 : 0.3) : 0;
            out.push(st);
        }
        return out;
    }
    /* ---------------------------------------------------------- special looks */
    function whole(L, f) { var a = [], i; for (i = 0; i < L.chars.length; i++) a.push(f(base(), L.chars[i], i)); return a; }
    function special(L, look, phase, u, o, spec) {
        var n = L.chars.length, fs = L.fs, i;
        switch (look) {
            case "zoom": case "zoomAccent": case "blast": case "bloom":
                var S0 = { zoom: 1.45, zoomAccent: 1.7, blast: 8, bloom: 1.15 }[look];
                return whole(L, function (st, c) {
                    if (phase === "in") { var e = (look === "bloom" ? E.out : E.expo)(u); st.s = S0 + (1 - S0) * e; st.op = E.out(u * (look === "blast" ? 4 : 1.4)); st.blur = (1 - e) * fs * (look === "bloom" ? 0.6 : 0.12); st.grey = look === "zoom" ? 1 - e : 0; st.col = look === "zoomAccent" || look === "bloom" ? 1 - E.sine(u * 0.8) : 0; st.glow = look === "bloom" ? 1 - u * 0.7 : 0; }
                    else if (phase === "out") { var e2 = E["in"](u); st.s = 1 - 0.15 * e2; st.op = 1 - e2; st.blur = e2 * fs * 0.1; }
                    else if (look === "zoom" || look === "zoomAccent") st.s = 1 - 0.07 * o.life;
                    st.group = true; return st;
                });
            case "tracking":
                return whole(L, function (st, c) {
                    var h = phase === "in" ? 1 - E.out5(u) : (phase === "out" ? E["in"](u) : 0);
                    st.dx = (c.x - L.cx) * 1.2 * h; st.op = 1 - h; st.blur = h * fs * 0.2; return st;
                });
            case "caret":
                // smooth typing (as in AE): the caret glides, the letters fade in just behind it (no blur, nothing ahead of it)
                var SW = Math.min(16, 130 / n), GW = Math.min(80, Math.max(30, 600 / n)), tp = phase === "in" ? E.sine(u) : (phase === "out" ? 1 - E.sine(u) : 1), O = -SW + (100 + SW) * tp;
                var arrT = whole(L, function (st, c, k) {
                    var pos = (k + 0.5) / n * 100, h = cl((pos - O) / SW, 0, 1); h = h * h * (3 - 2 * h);
                    st.op = 1 - h;
                    // white far behind -> accent at the caret (smooth ramp, as in AE)
                    var a = cl((pos - (O + SW - GW)) / GW, 0, 1);
                    st.col = phase === "in" ? a * a * (3 - 2 * a) : 0;
                    return st;
                });
                // on the letter edges: index f between the left edges of letter i and i + 1
                var fI = cl((O + SW) / 100, 0, 1) * n, iI = Math.min(n - 1, Math.floor(fI)), ed = function (k) { return k >= n ? L.chars[n - 1].x + L.chars[n - 1].w / 2 : L.chars[k].x - L.chars[k].w / 2; };
                arrT.caretX = ed(iI) + (ed(iI + 1) - ed(iI)) * (fI - iI);
                return arrT;
            case "block":
                var shown = phase === "in" ? Math.round(E.inout(u) * n) : (phase === "out" ? Math.round((1 - E.inout(u)) * n) : n);
                return whole(L, function (st, c, k) { st.op = k < shown ? 1 : 0; st.col = (phase === "in" && k >= shown - 2 && k < shown) ? 1 : 0; st.caret = k === Math.max(0, shown - 1) ? (look === "block" ? 2 : 1) : 0; st.caretOn = shown === 0 && k === 0; return st; });
            case "count":
                var arrC = whole(L, function (st) { if (phase === "in") { st.op = E.out(u * 1.3); st.dy = (1 - E.out5(u)) * fs * 0.3; st.blur = (1 - E.out(u)) * fs * 0.2; st.col = 1 - u * 0.7; st.glow = 0.4 + 0.6 * Math.sin(u * Math.PI); } else if (phase === "out") { st.op = 1 - E.sine(u); st.blur = u * fs * 0.2; } st.group = true; return st; });
                /* the number counts up (eased) to the value written in the text, with its separators */
                var raw = L.chars.map(function (c) { return c.ch; }).join(""), num = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
                var pre = (raw.match(/^[^0-9]*/) || [""])[0], suf = raw.replace(/^[^0-9]*[0-9.,]+/, "");
                var val = Math.round(num * (phase === "in" ? E.inout(u) : 1));
                arrC.countText = pre + String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suf;
                return arrC;
            case "decode":
                var rr = rng(Math.floor(o.time * 18) + 1), glyph = "#%&@$x?!<>/";
                return whole(L, function (st, c, k) {
                    var front = phase === "in" ? E.inout(cl((u - 0.25) / 0.75, 0, 1)) * n : (phase === "out" ? (1 - E.inout(cl(u / 0.6, 0, 1))) * n : n);
                    st.op = phase === "in" ? cl(u * 3 - k / n, 0, 1) : (phase === "out" ? 1 - cl((u - 0.3) * 2 - k / n, 0, 1) : 1);
                    if (k >= front && c.ch !== " ") { st.glyph = glyph[Math.floor(rr() * glyph.length)]; st.col = 1; }
                    return st;
                });
            case "stair": case "stairUp":
                var sg = look === "stair" ? -1 : 1;
                return whole(L, function (st, c) {
                    var k = 1 - c.word / Math.max(1, L.words) * 0.8, p = phase === "in" ? cas(c.word, L.words, u * 0.87, 80, E.out) : (phase === "out" ? 1 - cas(c.word, L.words, u, 80, E.inout) : 1);
                    st.dy = sg * fs * 1.5 * k * (1 - p); st.op = phase === "in" ? cas(c.word, L.words, cl(u / 0.45, 0, 1), 30, E.out5) : (phase === "out" ? 1 - cas(c.word, L.words, cl((u - 0.3) / 0.7, 0, 1), 45, E.inout) : 1);
                    return st;
                });
            case "centerBuild":
                // the words arrive one by one; the line keeps itself centred (the words already there move left)
                var nw = Math.max(1, L.words), wr = [], q2;
                for (q2 = 0; q2 < nw; q2++) wr[q2] = L.left;
                for (i = 0; i < n; i++) if (L.chars[i].ch !== " ") wr[L.chars[i].word] = Math.max(wr[L.chars[i].word], L.chars[i].x + L.chars[i].w / 2);
                var full = L.right - L.left, sdx = function (k) { return (full - (wr[k] - L.left)) / 2; }, stp = 1 / nw, shift = 0;
                if (phase === "in") {
                    shift = sdx(0);
                    for (q2 = 1; q2 < nw; q2++) { var m = E.inout(cl((u - q2 * stp) / (stp * 0.85), 0, 1)); if (m > 0) shift = sdx(q2 - 1) + (sdx(q2) - sdx(q2 - 1)) * m; }
                }
                return whole(L, function (st, c) {
                    if (phase === "in") {
                        var pk = E.out(cl((u - c.word * stp) / (stp * 0.75), 0, 1));
                        st.dx = shift + (1 - pk) * fs * 0.35; st.op = pk; st.blur = (1 - pk) * fs * 0.25;
                    } else if (phase === "out") hide(st, cas(c.word, nw, u, 55, E["in"]), { op: 0, dx: -1.2, blur: 0.3 }, fs);
                    return st;
                });
            case "scatter":
                return whole(L, function (st, c) {
                    var r = rng(c.word * 31 + 5), p = phase === "in" ? cas(c.word, L.words, u, 85, E.out) : (phase === "out" ? 1 - cas(c.word, L.words, u, 85, E["in"]) : 1);
                    st.dx = (r() * 2 - 1) * fs * 3.2 * (1 - p); st.dy = (r() * 2 - 1) * fs * 2.3 * (1 - p); st.r = 18 * (1 - p); st.blur = (1 - p) * fs * 0.12; st.op = cl(p * 1.6, 0, 1); return st;
                });
            case "sparkle":
                var sp = phase === "in" ? E.inout(u) : (phase === "out" ? 1 : 1.2), gap = fs * 0.62, sx = L.left - gap + (L.right - L.left + gap * 2) * sp;
                var arr = whole(L, function (st, c) { if (phase === "in") { var d = sx - c.x; st.op = E.sine(d / (gap * 0.6)); st.col = 1 - E.sine(d / (gap * 0.95)); st.blur = (1 - st.op) * fs * 0.08; } else if (phase === "out") { st.op = 1 - cas(L.chars.indexOf(c), n, u, 25, E.inout); } return st; });
                arr.star = phase === "in" || (phase === "hold" && o.life < 0.15) ? { x: sx, y: L.cy, s: phase === "in" ? E.out(u * 5) : 1 - o.life / 0.15, r: u * 3 } : null;
                return arr;
            case "oneword":
                var nw = L.words, beat = 1 / (nw + 1), idx = phase === "in" ? Math.min(nw, Math.floor(u / beat)) : nw, lu = phase === "in" ? (u - idx * beat) / beat : 1;
                return whole(L, function (st, c) {
                    if (idx < nw) { st.op = c.word === idx ? 1 : 0; st.dx = (L.cx - c.x) * 0 + 0; st.solo = true; st.s = 1.35 - 0.35 * E.expo(lu * 1.2); }
                    else { st.s = 1 + 0.35 * (1 - E.expo(lu)); if (phase === "out") st.op = 1 - E.sine(u); }
                    st.group = idx >= nw; return st;
                });
            case "echo":
                var dir = spec.dir || [1, 0];
                var arr2 = whole(L, function (st) {
                    var off = phase === "in" ? 1 - E.out5(u / 1.1) : (phase === "out" ? -E["in"](u) : 0);
                    st.dx = dir[0] * off * L.fs * 9; st.dy = dir[1] * off * L.fs * 5; st.op = phase === "in" ? cl(u * 6, 0, 1) : 1; st.group = true; return st;
                });
                arr2.echo = { dir: dir, phase: phase, u: u };
                return arr2;
            case "list":
                // same as After Effects: one eased step per line (hold, then a long soft move), the other
                // lines dimmed / blurred / smaller and pushed `Range` away from the active one
                var lines = L.lines, sl = phase === "hold" ? o.life * (lines - 1) : (phase === "out" ? lines - 1 : 0), ia = Math.floor(sl);
                var act = Math.min(lines - 1, ia + E.inout(cl((sl - ia - 0.4) / 0.6, 0, 1))), R = fs * 0.2;
                var arr5 = whole(L, function (st, c) {
                    var dd = cl(Math.abs(c.line - act), 0, 1), e = dd * dd * (3 - 2 * dd);
                    st.dy = -act * fs * 1.25 + R * cl(c.line - act, -1, 1); st.op = 1 - 0.7 * e; st.s = 1 - 0.12 * e; st.blur = e * fs * 0.04;
                    if (phase === "in") { st.op *= E.out(u); st.dy += (1 - E.out(u)) * fs * 0.3; }
                    if (phase === "out") st.op *= 1 - E.sine(u);
                    return st;
                });
                var bs = phase === "in" ? E.out(cl((u - 0.4) / 0.6, 0, 1)) : (phase === "out" ? 1 - E.sine(cl(u / 0.6, 0, 1)) : 1);
                arr5.ball = { x: L.left - fs * 0.45, y: L.chars[0].y - fs * 0.34, r: fs * 0.11 * bs };
                return arr5;
            case "glitch":
                var jr = rng(Math.floor(o.time * 24) + 3);
                var arr3 = whole(L, function (st, c, k) { var on = phase === "in" ? jr() < u * 1.6 : (phase === "out" ? jr() > u * 1.3 : true); st.op = on ? 1 : 0; if (on && phase !== "hold") st.dx = (jr() - 0.5) * fs * 0.25; return st; });
                arr3.rgb = phase === "in" ? 1 - u : (phase === "out" ? u : 0);
                return arr3;
            case "waveLoop":
                return whole(L, function (st, c, k) { st.dy = -Math.sin(o.time * Math.PI * 2 / 1.6 - k * 0.55) * fs * 0.22; return st; });
            case "explode":
                var D = o.inDur, f = D / 30, tt = phase === "in" ? u * (D + 2 * f * n) : 1e3;
                // (kept inside the small preview frame)
                var RX = Math.min(o.W * 0.34, Math.max((L.right - L.left) * 0.68, fs * 1.8)), RY = Math.min(o.W * 0.15, Math.max(fs * 1.3, Math.min(RX * 0.7, fs * 1.9)));
                var arr4 = whole(L, function (st, c, k) {
                    var lt = cl((tt - k * 2 * f) / D, 0, 1), r = rng(k * 17 + 3), uu = (k + 0.5) / n;
                    var a = (k % 2 === 0 ? Math.PI * (1 + uu) : Math.PI * (1 - uu)) + (r() - 0.5) * 0.24, gr = 0.88 + r() * 0.24;
                    var g = lt < 0.5 ? 1 - E.out(lt * 2) : 0, sc = lt < 0.5 ? 1 - E.out(lt * 2) * 1.5 : -0.5 + 0.5 * E.inout((lt - 0.5) * 2);
                    var sct = lt < 0.5 ? E.out(lt * 2) : 1 - E.inout((lt - 0.5) * 2);
                    st.dx = g * (L.cx - c.x) + sct * (Math.cos(a) * RX * gr - (c.x - L.cx)); st.dy = sct * Math.sin(a) * RY * gr;
                    st.s = 1 - sc; st.r = (rng(k * 29 + 1)() * 2 - 1) * 50 * sct;
                    if (phase === "out") { st.op = 1 - E.sine(u); st.blur = u * fs * 0.12; }
                    return st;
                });
                var tb = phase === "in" ? u * D : 1e3, ns = tb < 10 * f ? 1 : tb < 20 * f ? 1 + 0.2 * E.sine((tb - 10 * f) / (10 * f)) : tb < 35 * f ? 1.2 - 0.4 * E.sine((tb - 20 * f) / (15 * f)) : tb < 40 * f ? 0.8 + 0.2 * E.sine((tb - 35 * f) / (5 * f)) : 1;
                arr4.groupScale = ns;
                return arr4;
            case "explodeOut":
                var Dx = Math.max(0.9, o.outDur * 1.3), f2 = 1 / 30, T2 = Dx + 2 * f2 * n;
                return whole(L, function (st, c, k) {
                    if (phase === "in") { st.op = E.out(u * 1.2); st.s = 0.85 + 0.15 * E.out(u); return st; }
                    if (phase !== "out") return st;
                    var lt = cl((u * T2 - k * 2 * f2) / Dx, 0, 1), p = Math.pow(lt, 2.2), r = rng(k * 23 + 5), side = (c.x - L.cx) / Math.max(1, (L.right - L.left) / 2);
                    var a = Math.atan2(r() * 2 - 1, side + (r() - 0.5) * 1.4), far = o.W * 1.4;
                    st.dx = Math.cos(a) * far * p; st.dy = Math.sin(a) * far * p; st.s = 1 + 0.6 * p; st.r = (rng(k * 41 + 2)() * 2 - 1) * 180 * p; return st;
                });
        }
        return null;
    }
    /* ---------------------------------------------------------------- draw */
    function draw(cv, spec, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, CW = cv.clientWidth || 160, CH = cv.clientHeight || 90;
        var Wd = Math.min(o.maxW || 640, Math.round(CW * dpr)), Hd = Math.round(Wd * CH / CW);
        if (cv.width !== Wd || cv.height !== Hd) { cv.width = Wd; cv.height = Hd; }
        var g = cv.getContext("2d"), W = Wd, H = Hd;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = "#14141a"; g.fillRect(0, 0, W, H);
        var mode = o.mode || "both", inD = o.inDur || 1, outD = o.outDur || 0.8, hold = o.hold === undefined ? 1.2 : o.hold;
        var look = spec.look || "fadeUp", loop = !!spec.loop;
        if (look === "explodeOut" && mode === "in") mode = "both";
        var tin = mode === "out" ? 0 : inD, tout = mode === "in" || loop ? 0 : outD * (look === "explodeOut" ? 2.2 : 1);
        if (look === "centerBuild" && tin) tin = inD * Math.max(1, String(o.text || TEXT[spec.id] || spec.name || "").split(/\s+/).filter(Boolean).length / 2);   // In time = the pace of 2 words
        var total = tin + hold + tout + 0.5, tt = loop ? t : (t % total), phase, u, life = 0;
        if (tt < tin) { phase = "in"; u = tt / tin; }
        else if (tt < tin + hold) { phase = "hold"; u = 1; life = (tt - tin) / Math.max(0.01, hold); }
        else if (tt < tin + hold + tout) { phase = "out"; u = (tt - tin - hold) / tout; life = 1; }
        else { phase = "gone"; u = 1; }
        if (mode === "out" && phase === "in") phase = "hold";
        var txt = o.text || TEXT[spec.id] || spec.name || "Text";
        var L = layout(g, txt, W, H);
        var ctx = { time: t, life: life, inDur: inD, outDur: outD, W: W, el: mode === "out" ? 1e3 : tt };
        var S = GEN[look] ? stateGen(L, look, phase === "gone" ? "out" : phase, phase === "gone" ? 1 : u, ctx) : special(L, look, phase === "gone" ? "out" : phase, phase === "gone" ? 1 : u, ctx, spec);
        if (!S) S = whole(L, function (st) { return st; });
        if (phase === "gone") for (var q = 0; q < S.length; q++) S[q].op = 0;
        var acc = hex(o.accent || "#8B7CFF"), i;
        g.save();
        if (S.groupScale) { g.translate(L.cx, L.cy); g.scale(S.groupScale, S.groupScale); g.translate(-L.cx, -L.cy); }
        if (S.echo && phase !== "hold" && phase !== "gone") {
            for (var e = 6; e >= 1; e--) {
                var lag = e * 0.045, eu = cl(S.echo.u - lag / Math.max(0.3, inD), 0, 1);
                var off = S.echo.phase === "in" ? 1 - E.out5(eu / 1.1) : -E["in"](eu);
                g.globalAlpha = (0.78 - e * 0.1) * (S.echo.phase === "in" ? 1 - eu * 0.6 : eu);
                g.fillStyle = mix(acc, acc, 0); g.font = "700 " + L.fs + "px Inter, 'Segoe UI', sans-serif"; g.textAlign = "center";
                for (i = 0; i < L.chars.length; i++) g.fillText(L.chars[i].ch, L.chars[i].x + S.echo.dir[0] * off * L.fs * 9, L.chars[i].y + S.echo.dir[1] * off * L.fs * 5);
            }
            g.globalAlpha = 1;
        }
        if (S[0] && S[0].clip) { g.beginPath(); g.rect(0, 0, W, L.chars[0].y + L.fs * 0.2); g.clip(); }
        g.font = "700 " + L.fs + "px Inter, 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "alphabetic";
        if (S.countText !== undefined) {   // counter: one string (its length changes while counting)
            var s0 = S[0];
            g.save(); g.translate(L.cx, L.chars[0].y + s0.dy); g.globalAlpha = cl(s0.op, 0, 1);
            if (s0.blur > 0.3) g.filter = "blur(" + s0.blur.toFixed(1) + "px)";
            if (s0.glow) { g.shadowColor = mix(acc, acc, 0); g.shadowBlur = L.fs * 0.5 * s0.glow; }
            g.fillStyle = mix(WHITE, acc, cl(s0.col, 0, 1)); g.fillText(S.countText, 0, 0); g.restore();
            g.restore();
            return;
        }
        for (i = 0; i < L.chars.length; i++) {
            var c = L.chars[i], st = S[i];
            if (!st || st.op <= 0.003 || c.ch === " ") continue;
            var py = c.y - L.fs * 0.34, px = c.x;
            if (st.solo) { /* one word alone, centred */ var wl = 1e9, wr = -1e9; for (var j = 0; j < L.chars.length; j++) if (L.chars[j].word === c.word) { wl = Math.min(wl, L.chars[j].x - L.chars[j].w / 2); wr = Math.max(wr, L.chars[j].x + L.chars[j].w / 2); } px = c.x - (wl + wr) / 2 + W / 2; }
            g.save();
            if (st.group) { g.translate(L.cx, L.cy); g.scale(st.s, st.s); g.translate(-L.cx, -L.cy); g.translate(px + st.dx, py + st.dy); }
            else { g.translate(px + st.dx, (st.baseline ? c.y : py) + st.dy); g.rotate(st.r * Math.PI / 180); g.scale(st.s * st.sx, st.s * st.sy); if (st.baseline) g.translate(0, -L.fs * 0.34); }
            g.globalAlpha = cl(st.op, 0, 1);
            if (st.blur > 0.3) g.filter = "blur(" + st.blur.toFixed(1) + "px)";
            if (st.glow) { g.shadowColor = mix(acc, acc, 0); g.shadowBlur = L.fs * 0.5 * st.glow; }
            var base0 = st.grey ? [WHITE[0] + (GREY[0] - WHITE[0]) * st.grey, WHITE[1] + (GREY[1] - WHITE[1]) * st.grey, WHITE[2] + (GREY[2] - WHITE[2]) * st.grey] : WHITE;
            g.fillStyle = mix(base0, acc, cl(st.col, 0, 1));
            var ch = st.glyph || c.ch;
            if (st.count !== undefined && /[0-9]/.test(c.ch)) ch = String(Math.floor(st.count * 9.99 * (1 + i)) % 10);
            g.fillText(ch, 0, L.fs * 0.34);
            g.restore();
            if (st.caret) { g.save(); g.fillStyle = st.caret === 2 ? mix(acc, acc, 0) : "#fff"; var cxp = c.x + c.w / 2 + L.fs * 0.06; if (st.caret === 2) g.fillRect(cxp, c.y - L.fs * 0.62, L.fs * 0.42, L.fs * 0.7); else { g.globalAlpha = (Math.floor(t * 2) % 2 || phase === "in") ? 1 : 0.15; g.fillRect(cxp, c.y - L.fs * 0.78, Math.max(1.5, L.fs * 0.06), L.fs * 0.95); } g.restore(); }
        }
        if (S.caretX !== undefined) { g.save(); g.fillStyle = "#fff"; g.globalAlpha = (phase === "in" || phase === "out" || Math.floor(t * 2) % 2) ? 1 : 0.15; g.fillRect(S.caretX + L.fs * 0.15, L.chars[0].y - L.fs * 0.78, Math.max(1.5, L.fs * 0.06), L.fs * 0.95); g.restore(); }
        if (S.ball && S.ball.r > 0.3) { g.save(); g.fillStyle = mix(acc, acc, 0); g.beginPath(); g.arc(S.ball.x, S.ball.y, S.ball.r, 0, Math.PI * 2); g.fill(); g.restore(); }
        if (S.rgb) {
            g.globalCompositeOperation = "screen";
            for (var ch2 = 0; ch2 < 2; ch2++) { g.globalAlpha = 0.85 * S.rgb; g.fillStyle = ch2 ? "#22e5ff" : "#ff2e4c"; for (i = 0; i < L.chars.length; i++) g.fillText(L.chars[i].ch, L.chars[i].x + (ch2 ? -1 : 1) * L.fs * 0.12 * S.rgb * 2, L.chars[i].y); }
            g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
        }
        if (S.star) {
            g.save(); g.translate(S.star.x, S.star.y); g.rotate(S.star.r); var R = L.fs * 0.45 * cl(S.star.s, 0, 1);
            g.shadowColor = mix(acc, acc, 0); g.shadowBlur = L.fs * 0.6; g.fillStyle = "#fff"; g.beginPath();
            for (var p = 0; p < 8; p++) { var a = p * Math.PI / 4, rr2 = p % 2 ? R * 0.14 : R; g.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
            g.closePath(); g.fill(); g.restore();
        }
        g.restore();
    }
    function Player(cv) { this.cv = cv; this.spec = null; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (spec, o) { if (spec && spec !== this.spec) { this.spec = spec; this.t = 0; } if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.restart = function () { this.t = 0; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) {
            if (!self.running) return;
            self.t += Math.min(0.1, (now - last) / 1000); last = now;
            if (self.spec && document.body.contains(self.cv)) draw(self.cv, self.spec, self.t, self.o);
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player, TEXT: TEXT };
})();

/*  Underline previews: the same strokes as After Effects (shared/underline.js), drawn on in time */
var UKULPrev = (function () {
    var cl = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var ein = function (x) { x = cl(x, 0, 1); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
    function partial(g, pts, a, b) {
        var L = [0], i, tot;
        for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        tot = L[L.length - 1];
        if (tot <= 0 || b <= a) return;
        var s0 = a * tot, s1 = b * tot, started = false;
        g.beginPath();
        for (i = 1; i < pts.length; i++) {
            if (L[i] < s0) continue;
            var seg = L[i] - L[i - 1] || 1, p0 = pts[i - 1], p1 = pts[i];
            var f0 = cl((s0 - L[i - 1]) / seg, 0, 1), f1 = cl((s1 - L[i - 1]) / seg, 0, 1);
            if (!started) { g.moveTo(p0[0] + (p1[0] - p0[0]) * f0, p0[1] + (p1[1] - p0[1]) * f0); started = true; }
            g.lineTo(p0[0] + (p1[0] - p0[0]) * f1, p0[1] + (p1[1] - p0[1]) * f1);
            if (L[i] >= s1) break;
        }
        g.stroke();
    }
    /* the visible part a..b of a polyline, resampled every ~1.5 px; each point carries its distance
       along the whole path (so ragged edges stay put while the stroke draws on) */
    function visible(pts, a, b) {
        var L = [0], i, out = [];
        for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        var tot = L[L.length - 1];
        if (tot <= 0 || b <= a) return out;
        var s0 = a * tot, s1 = b * tot, n = Math.max(2, Math.ceil((s1 - s0) / 1.5)), j = 1;
        for (i = 0; i <= n; i++) {
            var s = s0 + (s1 - s0) * i / n;
            while (j < pts.length - 1 && L[j] < s) j++;
            var seg = (L[j] - L[j - 1]) || 1, f = cl((s - L[j - 1]) / seg, 0, 1);
            out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f, s]);
        }
        return out;
    }
    /* AE-like stroke Taper on the drawn part (+ optional Roughen Edges look): a filled outline */
    function tapered(g, pts, a, b, w, tp, rough) {
        var P = visible(pts, a, b), n = P.length, i, Lv;
        if (n < 2) return;
        Lv = Math.max(1e-3, P[n - 1][2] - P[0][2]);
        function shape(x, e) { x = cl(x, 0, 1); var k = cl(Math.abs(e) / 100, 0, 1); return x * (1 - k) + Math.sin(x * Math.PI / 2) * k; }
        function wid(t) {
            var f = 1;
            if (tp[0] > 0 && t < tp[0] / 100) f = Math.min(f, tp[2] / 100 + (1 - tp[2] / 100) * shape(t / (tp[0] / 100), tp[4]));
            if (tp[1] > 0 && t > 1 - tp[1] / 100) f = Math.min(f, tp[3] / 100 + (1 - tp[3] / 100) * shape((1 - t) / (tp[1] / 100), tp[5]));
            return w * f / 2;
        }
        function nz(s, k) { return rough ? (Math.sin(s * 0.31 / rough.f + k) * 0.5 + Math.sin(s * 0.83 / rough.f + 2 * k) * 0.3 + Math.sin(s * 2.1 / rough.f + 3 * k) * 0.2) * rough.b : 0; }
        var left = [], right = [];
        for (i = 0; i < n; i++) {
            var p0 = P[Math.max(0, i - 1)], p1 = P[Math.min(n - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1;
            var nx = -dy / l, ny = dx / l, hw = wid((P[i][2] - P[0][2]) / Lv);
            var hl = hw - Math.min(hw * 0.6, Math.abs(nz(P[i][2], 1))), hr = hw - Math.min(hw * 0.6, Math.abs(nz(P[i][2], 4)));
            left.push([P[i][0] + nx * hl, P[i][1] + ny * hl]); right.push([P[i][0] - nx * hr, P[i][1] - ny * hr]);
        }
        g.beginPath();
        g.moveTo(left[0][0], left[0][1]);
        for (i = 1; i < n; i++) g.lineTo(left[i][0], left[i][1]);
        for (i = n - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
        g.closePath();
        g.fill();
        var r0 = wid(0), r1 = wid(1);   // round caps
        if (r0 > 0.5) { g.beginPath(); g.arc(P[0][0], P[0][1], r0, 0, Math.PI * 2); g.fill(); }
        if (r1 > 0.5) { g.beginPath(); g.arc(P[n - 1][0], P[n - 1][1], r1, 0, Math.PI * 2); g.fill(); }
    }
    function draw(cv, spec, t, o) {
        o = o || {};
        var dpr = window.devicePixelRatio || 1, CW = cv.clientWidth || 160, CH = cv.clientHeight || 90;
        var W = Math.min(o.maxW || 640, Math.round(CW * dpr)), H = Math.round(W * CH / CW);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        var g = cv.getContext("2d");
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = "#14141a"; g.fillRect(0, 0, W, H);
        var fs = H * 0.2, txt = o.text || "Your text";
        g.font = "700 " + fs + "px Inter, 'Segoe UI', sans-serif";
        var tw = g.measureText(txt).width;
        if (tw > W * 0.6) { fs *= W * 0.6 / tw; g.font = "700 " + fs + "px Inter, 'Segoe UI', sans-serif"; tw = g.measureText(txt).width; }
        var r = { left: W / 2 - tw / 2, top: H / 2 - fs * 0.72, width: tw, height: fs * 0.95 };
        var geo = UK_UL.build(spec.id, r, fs), dur = o.dur || 0.8, outD = o.outDur || 0.6, both = o.mode === "both";
        var total = dur + 1.0 + (both ? outD : 0) + 0.4, tt = t % total;
        function strokes() {
            g.save(); g.translate(geo.pivot[0], geo.pivot[1]); g.rotate((geo.rot || 0) * Math.PI / 180);
            g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = g.fillStyle = o.color || "#8B7CFF";
            var rough = geo.rough ? { b: geo.rough.border * 0.8, f: Math.max(0.5, fs * 0.04) } : null;
            for (var j = 0; j < geo.strokes.length; j++) {
                var s = geo.strokes[j], a0 = s.delay * dur, d = Math.max(0.05, s.dur * dur), p = ein((tt - a0) / d), q = 0;
                if (both) { var b0 = dur + 1.0 + j * outD * 0.08, bd = outD * (1 - 0.08 * (geo.strokes.length - 1)); q = cl((tt - b0) / bd, 0, 1); q = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; }
                g.save(); g.rotate((s.rot || 0) * Math.PI / 180); g.lineWidth = s.w * (fs / Math.max(1, fs)); g.globalAlpha = s.op / 100;
                var pts = UK_UL.sample(s);
                if (s.taper || rough) tapered(g, pts, q, p, s.w, s.taper || [0, 0, 100, 100, 0, 0], rough);
                else if (s.center) partial(g, pts, 0.5 - p / 2 + q / 2, 0.5 + p / 2 - q / 2); else partial(g, pts, q, p);
                g.restore();
            }
            g.restore();
        }
        if (geo.behind) strokes();
        g.fillStyle = "#f4f4f5"; g.textAlign = "center"; g.textBaseline = "alphabetic";
        g.fillText(txt, W / 2, r.top + fs * 0.75);
        if (!geo.behind) strokes();
    }
    function Player(cv) { this.cv = cv; this.spec = null; this.o = {}; this.t = 0; this.running = false; }
    Player.prototype.set = function (spec, o) { if (spec && spec !== this.spec) { this.spec = spec; this.t = 0; } if (o) for (var k in o) this.o[k] = o[k]; };
    Player.prototype.restart = function () { this.t = 0; };
    Player.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        var self = this, last = performance.now();
        function frame(now) { if (!self.running) return; self.t += Math.min(0.1, (now - last) / 1000); last = now; if (self.spec && document.body.contains(self.cv)) draw(self.cv, self.spec, self.t, self.o); requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
    };
    Player.prototype.stop = function () { this.running = false; };
    return { draw: draw, Player: Player };
})();

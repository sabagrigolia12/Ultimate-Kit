/*  Ultimate Kit — preset catalog.
    Shared by the panel (HTML) and the host scripts (ExtendScript), so it must stay ES3:
    no trailing commas, no let/const, no arrow functions.                               */
var UK_CAT = (function () {
    var C = {};

    /* ------------------------------------------------------------ palettes */
    // [main, second, accent] - the first colour is the default text accent
    C.saasPal = [
        ["#7C5CFF", "#4F46E5", "#F5F3FF"],  // 0 violet
        ["#3B82F6", "#22D3EE", "#EFF6FF"],  // 1 ocean
        ["#EC4899", "#8B5CF6", "#FDF2F8"],  // 2 candy
        ["#FB923C", "#F43F5E", "#FFF7ED"],  // 3 peach
        ["#10B981", "#14B8A6", "#ECFDF5"],  // 4 mint
        ["#0B0B12", "#27272A", "#FAFAFA"]   // 5 mono
    ];

    /* ------------------------------------------------------------- text
       One list (the old "Text" presets merged in), ordered from the most used SaaS-style text
       animations to the most special ones. look = the panel's animated preview.                */
    C.textSaas = [
        { id: "tx01", name: "Fade Up", look: "fadeUp" },
        { id: "tx02", name: "Blur In", look: "blurIn" },
        { id: "st06", name: "Soft Mask Rise", look: "rise" },
        { id: "st03", name: "Word Pop", look: "words" },
        { id: "st35", name: "Word Pop Rise", look: "wordsRise", accent: true },
        { id: "st26", name: "Center Build", look: "centerBuild" },
        { id: "st01", name: "Focus Pop", look: "zoom" },
        { id: "st05", name: "Char Color Cascade", look: "cascade", accent: true },
        { id: "st16", name: "Type Line Cursor", look: "caret", accent: true },
        { id: "tx06", name: "Tracking In", look: "tracking" },
        { id: "st09", name: "Accent Word Wave", look: "wave", accent: true },
        { id: "tx04", name: "Pop Scale", look: "popScale" },
        { id: "tx13", name: "Word Slide", look: "wordSlide" },
        { id: "st23", name: "Word Fade Up", look: "wordFadeUp" },
        { id: "st24", name: "Word Blur In", look: "wordBlurIn" },
        { id: "st15", name: "Glow Counter", look: "count", accent: true },
        { id: "st10", name: "Zoom Blast", look: "blast" },
        { id: "st27", name: "Scatter Align", look: "scatter" },
        { id: "st28", name: "Slow Push", look: "push" },
        { id: "st22", name: "Line Roll", look: "roll" },
        { id: "st13", name: "Decode", look: "decode", accent: true },
        { id: "st04", name: "Random Glow Words", look: "randomWords", accent: true },
        { id: "st12", name: "Glow Assemble", look: "assemble", accent: true },
        { id: "st34", name: "Explode", look: "explode" },
        { id: "st33", name: "Explode Out", look: "explodeOut" },
        { id: "st19", name: "Blur Bloom", look: "bloom", accent: true },
        { id: "tx12", name: "Split Center", look: "split" },
        { id: "st08", name: "Stair Words", look: "stair" },
        { id: "st32", name: "Stair Words Up", look: "stairUp" },
        { id: "st02", name: "Accent Zoom", look: "zoomAccent", accent: true },
        { id: "st11", name: "Sparkle Reveal", look: "sparkle", accent: true },
        { id: "st18", name: "One Word Kinetic", look: "oneword" },
        { id: "st17", name: "Type Block Cursor", look: "block", accent: true },
        { id: "tx10", name: "Random Fade", look: "randomFade" },
        { id: "st07", name: "Letter Drop Swing", look: "swing" },
        { id: "st20", name: "Bounce Letters", look: "bounce" },
        { id: "tx09", name: "Bounce Drop", look: "bounceDrop" },
        { id: "tx11", name: "Elastic Stretch", look: "elastic" },
        { id: "tx07", name: "3D Flip", look: "flip" },
        { id: "st14", name: "Echo 1 Right", look: "echo", dir: [1, 0], accent: true },
        { id: "st29", name: "Echo 2 Left", look: "echo", dir: [-1, 0], accent: true },
        { id: "st30", name: "Echo 3 Up", look: "echo", dir: [0, 1], accent: true },
        { id: "st31", name: "Echo 4 Down", look: "echo", dir: [0, -1], accent: true },
        { id: "st21", name: "List Picker", look: "list", accent: true },
        { id: "st25", name: "Glitch RGB", look: "glitch" },
        { id: "tx08", name: "Wave Loop", look: "waveLoop", loop: true }
    ];

    /* ------------------------------------------------------- underline (40)
       Hand-drawn style strokes drawn on with Trim Paths (round caps, smooth speed-ramps); pen and
       brush looks use the stroke's Taper (pointed tips) and Roughen Edges (ragged paint).
       Geometry: shared/underline.js (same in the panel preview and in After Effects).        */
    C.underline = [
        { id: "ul01", name: "Clean Underline" },
        { id: "ul02", name: "Double Underline" },
        { id: "ul03", name: "Swoosh" },
        { id: "ul04", name: "Wavy Line" },
        { id: "ul05", name: "Center Out" },
        { id: "ul06", name: "Highlighter" },
        { id: "ul07", name: "Strike Through" },
        { id: "ul08", name: "Overline" },
        { id: "ul09", name: "Over and Under" },
        { id: "ul10", name: "Hand Circle" },
        { id: "ul11", name: "Double Circle" },
        { id: "ul12", name: "Clean Ellipse" },
        { id: "ul13", name: "Rounded Box" },
        { id: "ul14", name: "Corner Brackets" },
        { id: "ul21", name: "Side Brackets" },
        { id: "ul22", name: "Two Corners" },
        { id: "ul23", name: "Round Corners" },
        { id: "ul24", name: "Focus Corners" },
        { id: "ul16", name: "Emphasis Marks" },
        { id: "ul25", name: "Emphasis Left" },
        { id: "ul26", name: "Double Emphasis" },
        { id: "ul27", name: "Burst Marks" },
        { id: "ul28", name: "Side Marks" },
        { id: "ul17", name: "Tilted Underline" },
        { id: "ul18", name: "Short Underline" },
        { id: "ul20", name: "Arrow Swoosh" },
        { id: "ul29", name: "Straight Arrow" },
        { id: "ul30", name: "Curved Arrow" },
        { id: "ul31", name: "Tapered Arrow" },
        { id: "ul32", name: "Tapered Swoosh" },
        { id: "ul33", name: "Triple Swoosh" },
        { id: "ul34", name: "Zigzag Scribble" },
        { id: "ul35", name: "Dashed Taper" },
        { id: "ul36", name: "Tapered Line" },
        { id: "ul37", name: "Quick Return" },
        { id: "ul38", name: "Swoosh Pair" },
        { id: "ul39", name: "Dry Brush" },
        { id: "ul40", name: "Brush Line" },
        { id: "ul41", name: "Brush Arc" },
        { id: "ul42", name: "Brush Highlight" }
    ];

    /* ---------------------------------------------- cinematic backgrounds */
    /*  White light-shapes on black, heavily softened, then mapped through 5 colours
        (shadows -> darks -> midtones -> brights -> highlights) with film grain.
        Shape layer fields (sizes are fractions of the frame's long side U,
        positions fractions of width / height):
          t    blob | orb | ring | rays | petal | tri | beam | band | swoosh | pulse
          at   positions the shape floats through (loops seamlessly)
          s    size   w  stroke width   n  points / count   inner  inner radius ratio
          arc  ring trim (%)   aspect  ellipse height ratio   round  corner roundness
          sc   scale cycle (%)   op  opacity or opacity cycle   rot  turns per loop (number)
               or a rotation cycle in degrees (array)   r0 start angle   ph  phase shift
          blur extra softness for that layer   col 0 = dark (cuts the light)            */
    C.cinePal = {
        ember: ["#050201", "#5A0A02", "#E0400A", "#FF9A1A", "#FFE45C"],
        magma: ["#040104", "#4A0526", "#C8164F", "#FF6A3D", "#FFD3A1"],
        ocean: ["#010208", "#071D52", "#1660D8", "#3FC2FF", "#E2F7FF"],
        violet: ["#030108", "#2A0A5E", "#7B2CF0", "#D06BFF", "#FBE6FF"],
        ice: ["#010406", "#0A2F3A", "#178A9C", "#6FE6E0", "#F2FFFE"],
        gold: ["#040201", "#3D2205", "#A8670E", "#F2B33A", "#FFF2C2"],
        rose: ["#060103", "#4D0A2C", "#E0337E", "#FF8FB8", "#FFF0F5"],
        lava: ["#000000", "#3A0000", "#B30000", "#FF4D00", "#FFB199"],
        cobalt: ["#000105", "#00144D", "#0038C7", "#4D8BFF", "#D9E6FF"],
        sunset: ["#05010A", "#3D0B4E", "#E04A5F", "#FFA552", "#FFF0B3"],
        forest: ["#010301", "#08261A", "#1F7A4D", "#7ED9A0", "#EFFFF4"],
        neon: ["#020108", "#1A0B6B", "#0CC6FF", "#FF2BD6", "#FFFFFF"],
        crimson: ["#030000", "#5C0012", "#D61F3C", "#FFB020", "#FFF6CF"],
        candy: ["#05020A", "#3B1270", "#E0418F", "#FF9E6B", "#FFF1A8"],
        mono: ["#000000", "#262626", "#7A7A7A", "#CFCFCF", "#FFFFFF"],
        tealOrange: ["#020405", "#0B3B47", "#1C8C96", "#FF8A3D", "#FFE0B0"],
        acid: ["#010401", "#0B3A12", "#25B23A", "#A8FF3C", "#F6FFD0"],
        plum: ["#040105", "#33093F", "#8C2D8C", "#F28DB2", "#FFE8EE"],
        peach: ["#060202", "#4A1C14", "#E06A4F", "#FFB38A", "#FFF0E0"],
        aqua: ["#000403", "#003B3A", "#00A39B", "#7CFF6B", "#F4FFE0"]
    };
    function orbit(cx, cy, rx, ry, n, a0) {
        var p = [];
        for (var i = 0; i < n; i++) { var a = (a0 || 0) + i / n * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
        return p;
    }
    C.cinematic = [
        { id: "cb01", name: "Solar Flare", pal: "ember", P: 14, soft: 0.055, layers: [
            { t: "rays", at: [[0.5, 0.56], [0.53, 0.5], [0.47, 0.53]], s: 2.4, n: 9, inner: 0.12, rot: 0.25, sc: [100, 112, 95], op: 80 },
            { t: "orb", at: [[0.5, 0.56], [0.52, 0.52]], s: 0.6, sc: [100, 125, 105] }] },
        { id: "cb02", name: "Swoosh", pal: "magma", P: 12, soft: 0.04, layers: [
            { t: "blob", at: [[0.85, 0.2], [0.75, 0.32], [0.92, 0.36]], s: 0.5, op: 60, blur: 0.05 },
            { t: "ring", at: [[0.45, 0.6], [0.55, 0.5], [0.5, 0.64]], s: 1.1, w: 0.08, arc: 55, aspect: 0.5, rot: 1, sc: [100, 115, 90], r0: -20 }] },
        { id: "cb03", name: "Drift", pal: "ocean", P: 16, soft: 0.08, layers: [
            { t: "blob", at: [[0.2, 0.3], [0.4, 0.7], [0.15, 0.6]], s: 0.45, op: 85 },
            { t: "blob", at: [[0.8, 0.7], [0.6, 0.3], [0.85, 0.42]], s: 0.42, aspect: 0.8, op: 75 },
            { t: "blob", at: [[0.5, 0.1], [0.62, 0.9], [0.3, 0.5]], s: 0.3, op: 60 }] },
        { id: "cb04", name: "Prism", pal: "violet", P: 14, soft: 0.06, layers: [
            { t: "orb", at: [[0.5, 0.52]], s: 0.4, op: 80, sc: [90, 115] },
            { t: "tri", at: [[0.5, 0.56], [0.53, 0.5], [0.48, 0.53]], s: 0.72, op: 80, round: 22, rot: 0.5, sc: [100, 128, 104] }] },
        { id: "cb05", name: "Halo", pal: "ice", P: 10, soft: 0.045, layers: [
            { t: "orb", at: [[0.5, 0.5]], s: 0.4, sc: [80, 112], op: 85 },
            { t: "ring", at: [[0.5, 0.5], [0.51, 0.49]], s: 0.78, w: 0.09, sc: [90, 115, 96] }] },
        { id: "cb06", name: "Light Beams", pal: "gold", P: 12, soft: 0.045, layers: [
            { t: "beam", at: [[0.04, 1.04]], n: 5, spread: 15, s: 1.8, w: 0.075, rot: [-55, -38, -48], r0: 0, op: 90 },
            { t: "orb", at: [[0.04, 1.0], [0.08, 0.96]], s: 0.7, sc: [100, 118] }] },
        { id: "cb07", name: "Bloom", pal: "rose", P: 16, soft: 0.06, layers: [
            { t: "petal", at: [[0.5, 0.5], [0.52, 0.53]], s: 1.0, op: 85, n: 6, inner: 0.28, round: 90, rot: 0.2, sc: [100, 116, 95] },
            { t: "blob", at: [[0.5, 0.5]], s: 0.3, sc: [90, 120] }] },
        { id: "cb08", name: "Eclipse", pal: "lava", P: 14, soft: 0.06, layers: [
            { t: "orb", at: [[0.5, 0.5]], s: 1.05, sc: [100, 108, 103] },
            { t: "blob", col: 0, at: [[0.28, 0.46], [0.5, 0.5], [0.72, 0.55], [0.52, 0.47]], s: 0.62, blur: 0.02 }] },
        { id: "cb09", name: "Waves", pal: "cobalt", P: 12, soft: 0.04, layers: [
            { t: "swoosh", at: [[0.5, 0.36], [0.5, 0.46], [0.5, 0.3]], s: 1.6, w: 0.085, rot: [-8, 6, -3] },
            { t: "swoosh", at: [[0.5, 0.72], [0.5, 0.62], [0.5, 0.76]], s: 1.7, w: 0.055, flip: true, rot: [10, -4, 6], op: 80 }] },
        { id: "cb10", name: "Corner Burst", pal: "sunset", P: 18, soft: 0.05, layers: [
            { t: "rays", at: [[0.0, 1.0], [0.03, 0.97]], s: 3.2, n: 12, inner: 0.07, rot: 0.15, op: 80 },
            { t: "orb", at: [[0.0, 1.0]], s: 0.75, sc: [100, 120] }] },
        { id: "cb11", name: "Aurora", pal: "forest", P: 16, soft: 0.07, layers: [
            { t: "band", at: [[0.5, 0.3], [0.5, 0.4], [0.5, 0.26]], s: 0.22, op: 85, rot: [-10, -4, -13] },
            { t: "band", at: [[0.5, 0.68], [0.5, 0.58], [0.5, 0.72]], s: 0.14, rot: [8, 14, 5], op: 70 }] },
        { id: "cb12", name: "Orbit", pal: "neon", P: 12, soft: 0.07, layers: [
            { t: "blob", at: orbit(0.5, 0.5, 0.26, 0.24, 6, 0), s: 0.32, op: 85 },
            { t: "blob", at: orbit(0.5, 0.5, 0.22, 0.3, 6, 0), ph: 3, s: 0.26, op: 75 }] },
        { id: "cb13", name: "Pulse", pal: "crimson", P: 6, soft: 0.04, layers: [
            { t: "orb", at: [[0.5, 0.5]], s: 0.3, sc: [90, 115] },
            { t: "pulse", at: [[0.5, 0.5]], n: 3, s: 1.7, w: 0.065 }] },
        { id: "cb14", name: "Spiral Star", pal: "candy", P: 14, soft: 0.05, layers: [
            { t: "ring", at: [[0.5, 0.5]], s: 0.45, w: 0.07, sc: [95, 110] },
            { t: "petal", at: [[0.5, 0.5]], s: 1.25, n: 7, inner: 0.22, round: 40, rot: 0.35, sc: [100, 110, 96], op: 75 }] },
        { id: "cb15", name: "Mono Glow", pal: "mono", P: 14, soft: 0.06, layers: [
            { t: "blob", at: [[0.82, 0.24], [0.72, 0.34], [0.88, 0.3]], s: 0.4, op: 80 },
            { t: "blob", at: [[0.15, 0.84], [0.25, 0.74], [0.1, 0.78]], s: 0.36, op: 70 },
            { t: "swoosh", at: [[0.45, 0.5], [0.55, 0.45], [0.5, 0.56]], s: 1.3, w: 0.08, rot: [20, 34, 24] }] },
        { id: "cb16", name: "Tidal", pal: "tealOrange", P: 16, soft: 0.075, layers: [
            { t: "blob", at: [[0.5, 1.2], [0.44, 1.02], [0.56, 1.14]], s: 1.0, aspect: 0.7, op: 90 },
            { t: "blob", at: [[1.08, -0.05], [0.98, 0.06], [1.12, 0.02]], s: 0.6, op: 75 }] },
        { id: "cb17", name: "Shards", pal: "acid", P: 14, soft: 0.05, layers: [
            { t: "tri", at: [[0.25, 0.36], [0.3, 0.3], [0.22, 0.32]], s: 0.36, round: 15, rot: 0.4, op: 85 },
            { t: "tri", at: [[0.75, 0.62], [0.7, 0.68], [0.78, 0.66]], s: 0.44, round: 15, rot: -0.3, op: 85 },
            { t: "tri", at: [[0.55, 0.15], [0.5, 0.22], [0.58, 0.2]], s: 0.24, round: 15, rot: 0.6, op: 80 }] },
        { id: "cb18", name: "Nebula", pal: "plum", P: 20, soft: 0.09, layers: [
            { t: "blob", at: [[0.2, 0.25], [0.35, 0.5], [0.15, 0.4]], s: 0.36, op: 85 },
            { t: "blob", at: [[0.8, 0.3], [0.65, 0.2], [0.75, 0.45]], s: 0.34, aspect: 0.7, op: 80 },
            { t: "blob", at: [[0.5, 0.75], [0.6, 0.6], [0.4, 0.85]], s: 0.4, aspect: 0.6, op: 75 },
            { t: "blob", at: [[0.1, 0.9], [0.25, 0.8], [0.05, 0.7]], s: 0.24, op: 65 },
            { t: "blob", at: [[0.9, 0.85], [0.8, 0.95], [0.95, 0.7]], s: 0.24, op: 65 }] },
        { id: "cb19", name: "Sunrise", pal: "peach", P: 16, soft: 0.05, layers: [
            { t: "rays", at: [[0.5, 0.95], [0.5, 0.78], [0.5, 0.88]], s: 2.6, n: 14, inner: 0.1, rot: 0.1, op: 40 },
            { t: "orb", at: [[0.5, 0.95], [0.5, 0.78], [0.5, 0.88]], s: 0.95 }] },
        { id: "cb20", name: "Vortex", pal: "aqua", P: 12, soft: 0.035, layers: [
            { t: "ring", at: [[0.5, 0.5]], s: 1.15, w: 0.055, arc: 32, rot: 0.5, r0: 200 },
            { t: "ring", at: [[0.5, 0.5]], s: 0.82, w: 0.065, arc: 58, rot: -0.75, r0: 60 },
            { t: "ring", at: [[0.5, 0.5]], s: 0.5, w: 0.07, arc: 42, rot: 1, r0: 0 }] }
    ];

    /* ----------------------------------------------- gradient backgrounds */
    /*  Built like a hand-made mesh gradient: big circles (shape layers) with wiggle() on
        Position (amplitude 60-80, each its own speed), all parented to "Null 1" whose
        Rotation is time*10, an Adjustment Layer with Fast Box Blur 150 on top and a
        Background colour underneath. Colours come from these palettes:
          purple  #f6f3ff #cbb6fc #a176f7 #8b3dea #7c2bd6 #551f93 #351164
          chartr. #feffe5 #fbffc6 #f5ff94 #e9ff56 #dcf83a #bade04 #91b200
          carnat. #fef2f2 #fea4a3 #fc6f6d #f55553 #e12321 #bd1a18 #821b1a
          spray   #ecffff #8ff5fc #66effa #21dcef #05bfd5 #0799b3 #0d7991
          gray    #fcfcfd #f2f4f7 #d0d5dd #98a2b3 #667085 #344054 #161616         */
    C.gradBg = [
        { id: "gb01", name: "Prism Glow", bg: "#8b3dea", colors: ["#05bfd5", "#e9ff56", "#feffe5", "#f55553", "#7c2bd6"], mode: "spread", seed: 11 },
        { id: "gb02", name: "Lime Dream", bg: "#bade04", colors: ["#e9ff56", "#21dcef", "#feffe5", "#a176f7"], mode: "corners", seed: 4 },
        { id: "gb03", name: "Violet Flame", bg: "#551f93", colors: ["#a176f7", "#f55553", "#fea4a3", "#8b3dea"], mode: "diag", seed: 7 },
        { id: "gb04", name: "Lagoon", bg: "#0799b3", colors: ["#21dcef", "#8ff5fc", "#a176f7", "#ecffff"], mode: "ring", seed: 3 },
        { id: "gb05", name: "Coral Sunset", bg: "#e12321", colors: ["#fc6f6d", "#fea4a3", "#e9ff56", "#8b3dea"], mode: "spread", seed: 21 },
        { id: "gb06", name: "Mint Lemon", bg: "#05bfd5", colors: ["#e9ff56", "#66effa", "#feffe5", "#bade04"], mode: "cluster", seed: 9 },
        { id: "gb07", name: "Lilac Mist", bg: "#cbb6fc", colors: ["#f6f3ff", "#a176f7", "#fea4a3", "#8ff5fc"], mode: "corners", seed: 14 },
        { id: "gb08", name: "Night Purple", bg: "#351164", colors: ["#7c2bd6", "#21dcef", "#f55553", "#551f93"], mode: "diag", seed: 5 },
        { id: "gb09", name: "Candy", bg: "#fc6f6d", colors: ["#a176f7", "#fbffc6", "#66effa", "#fea4a3"], mode: "ring", seed: 17 },
        { id: "gb10", name: "Acid", bg: "#91b200", colors: ["#e9ff56", "#8b3dea", "#21dcef", "#f5ff94"], mode: "spread", seed: 31 },
        { id: "gb11", name: "Cloud", bg: "#d0d5dd", colors: ["#fcfcfd", "#cbb6fc", "#8ff5fc", "#fea4a3"], mode: "cluster", seed: 2 },
        { id: "gb12", name: "Graphite", bg: "#161616", colors: ["#344054", "#8b3dea", "#05bfd5", "#667085"], mode: "corners", seed: 8 },
        { id: "gb13", name: "Berry", bg: "#7c2bd6", colors: ["#f55553", "#e9ff56", "#a176f7", "#fc6f6d"], mode: "diag", seed: 12 },
        { id: "gb14", name: "Aqua Lime", bg: "#0d7991", colors: ["#21dcef", "#dcf83a", "#66effa", "#feffe5"], mode: "spread", seed: 41 },
        { id: "gb15", name: "Peach", bg: "#fea4a3", colors: ["#fef2f2", "#f55553", "#e9ff56", "#cbb6fc"], mode: "ring", seed: 6 },
        { id: "gb16", name: "Neon", bg: "#551f93", colors: ["#21dcef", "#e9ff56", "#f55553", "#8b3dea"], mode: "cluster", seed: 19 },
        { id: "gb17", name: "Ice", bg: "#8ff5fc", colors: ["#ecffff", "#a176f7", "#05bfd5", "#f6f3ff"], mode: "corners", seed: 23 },
        { id: "gb18", name: "Red Velvet", bg: "#821b1a", colors: ["#e12321", "#fc6f6d", "#8b3dea", "#fea4a3"], mode: "diag", seed: 15 },
        { id: "gb19", name: "Spring", bg: "#e9ff56", colors: ["#66effa", "#fbffc6", "#a176f7", "#fea4a3"], mode: "spread", seed: 27 },
        { id: "gb20", name: "Slate", bg: "#344054", colors: ["#98a2b3", "#a176f7", "#21dcef", "#f2f4f7"], mode: "ring", seed: 33 }
    ];
    /*  8 circles for a preset (same result in the panel preview and in After Effects).
        x, y: fraction of the frame   s: diameter as fraction of the width
        c: colour index   f: wiggle frequency (speed)   a: wiggle amplitude (60-80 px at 1920)  */
    C.gradLayout = function (spec) {
        var s = (spec.seed || 1) * 9301 + 49297;
        function r() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
        var pts = [], i, n = 8;
        if (spec.mode === "corners") pts = [[0.08, 0.1], [0.92, 0.1], [0.08, 0.9], [0.92, 0.9], [0.5, 0.5], [0.3, 0.45], [0.7, 0.55], [0.5, 0.15]];
        else if (spec.mode === "diag") for (i = 0; i < n; i++) pts.push([0.05 + i / (n - 1) * 0.9, 0.12 + i / (n - 1) * 0.76 + (i % 2 ? 0.14 : -0.14)]);
        else if (spec.mode === "ring") { for (i = 0; i < n - 1; i++) { var a = i / (n - 1) * Math.PI * 2; pts.push([0.5 + Math.cos(a) * 0.36, 0.5 + Math.sin(a) * 0.38]); } pts.push([0.5, 0.5]); }
        else if (spec.mode === "cluster") for (i = 0; i < n; i++) pts.push([0.3 + r() * 0.4, 0.25 + r() * 0.5]);
        else { var cells = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]]; cells.splice(Math.floor(r() * 9), 1); for (i = 0; i < n; i++) pts.push([(cells[i][0] + 0.5) / 3, (cells[i][1] + 0.5) / 3]); }
        var out = [], nc = spec.colors.length;
        for (i = 0; i < n; i++) {
            out.push({
                x: Math.max(-0.05, Math.min(1.05, pts[i][0] + (r() - 0.5) * 0.12)),
                y: Math.max(-0.05, Math.min(1.05, pts[i][1] + (r() - 0.5) * 0.12)),
                s: (spec.mode === "cluster" ? 0.3 : 0.34) + r() * 0.24,
                c: (i + (spec.seed || 0)) % nc,
                f: Math.round((0.35 + r() * 0.85) * 100) / 100,
                a: 60 + Math.round(r() * 20)
            });
        }
        return out;
    };

    /* ---------------------------------------------------------- click FX */
    C.clicks = [
        { id: "burst", name: "Shape Burst", desc: "Circles and squares fly out, grow and vanish" },
        { id: "dots", name: "Dot Matrix", desc: "A wave of halftone dots ripples out" },
        { id: "pixels", name: "Pixel Bloom", desc: "Square pixels flicker on and fade" },
        { id: "particles", name: "Particle Spray", desc: "Tiny particles scatter with drift" },
        { id: "spark", name: "Ring Spark", desc: "Shock ring with spark lines" },
        { id: "simple", name: "Simple Ripple", desc: "Two soft circles, the second a few frames late" }
    ];

    /* default order: the most used looks first (the panel's Edit lets everyone reorder their own) */
    function reorder(list, ids) {
        var out = [], used = {}, i, j;
        for (i = 0; i < ids.length; i++) for (j = 0; j < list.length; j++) if (list[j].id === ids[i] && !used[ids[i]]) { out.push(list[j]); used[ids[i]] = 1; }
        for (j = 0; j < list.length; j++) if (!used[list[j].id]) out.push(list[j]);
        return out;
    }
    C.cinematic = reorder(C.cinematic, ["cb03", "cb18", "cb05", "cb12", "cb16", "cb15", "cb11", "cb09", "cb04", "cb07", "cb06", "cb19", "cb01", "cb02", "cb08", "cb13", "cb20", "cb10", "cb14", "cb17"]);
    C.gradBg = reorder(C.gradBg, ["gb08", "gb03", "gb12", "gb07", "gb04", "gb01", "gb20", "gb11", "gb16", "gb13", "gb05", "gb09", "gb17", "gb15", "gb18", "gb14", "gb06", "gb02", "gb19", "gb10"]);

    C.find = function (list, id) {
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return null;
    };
    return C;
})();

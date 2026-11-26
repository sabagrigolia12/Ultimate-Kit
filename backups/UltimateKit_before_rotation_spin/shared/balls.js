/*  Ultimate Kit - Ball looks (shared by the panel preview js/ballprev.js and the AE builder jsx/ball.jsx; ES3).
    Units: the ball's radius = 1, centre (0, 0), y down.
    base   the "Ball" shape layer, a radial Gradient Ramp from colour c1 at s to colour c2 at radius r (o = opacity).
           Missing on the Lens, which is only its Shade layer and a Ring.
    ring   { c, w }  a stroked circle on top (colour role, width in px at radius 400)
    layers (top first): a solid with elliptical masks, named n, filled with colour role c:
        e   [cx, cy, rx, ry]  the mask (Add)        cut [cx, cy, rx, ry]  a second mask (Subtract): crescents, rings, fades
        f   feather (both masks; cf = the cut's own)   o opacity %   mode normal|screen|multiply|add|overlay   rot (deg)
        out true = outside the ball, below it; otherwise clipped to the ball (alpha matte "Ball Matte")
    fx     defaults of the Glow and the Light Sweep (both are on every ball, switchable on Ball Controls)
    colors [role, hex], shown in the panel and in Essential Properties in this order. "Glow" colours the glow.  */
var UK_BALL = {
    /* the soft gradient orb (the user's first reference): o = the look's own offsets */
    orb: function (o) {
        var L = o.light || [0.5, -0.5], B = o.bloom || [-0.35, 0.55], D = o.deep || [0.22, 0.18];
        return [
            { n: "Specular", c: "Bloom", e: [-0.42, -0.5, 0.15, 0.085], rot: -38, f: 0.1, o: o.spec === undefined ? 55 : o.spec, mode: "screen" },
            { n: "Edge Light", c: "Bloom", e: [0, 0, 1.0, 1.0], cut: [0.035, 0.045, 0.975, 0.975], f: 0.02, o: 60, mode: "screen" },
            { n: "Light Glow", c: "Light", e: [L[0], L[1], 0.58, 0.52], f: 0.85, o: 70, mode: "screen" },
            { n: "Bloom", c: "Bloom", e: [B[0], B[1], 0.6, 0.42], rot: o.bloomRot === undefined ? 25 : o.bloomRot, f: 0.85, o: o.bloomO || 90 },
            { n: "Deep", c: "Deep", e: [D[0], D[1], 0.42, 0.36], rot: -20, f: 0.75, o: 82 },
            { n: "Edge Shade", c: "Deep", e: [0, 0, 1.05, 1.05], cut: [0, 0, 0.78, 0.78], f: 0.35, o: 35, mode: "multiply" }
        ];
    },
    /* the glossy ball (the second reference) */
    gloss: function () {
        return [
            { n: "Specular", c: "Specular", e: [-0.4, -0.5, 0.19, 0.12], rot: -38, f: 0.07, o: 96 },
            { n: "Specular Glow", c: "Specular", e: [-0.38, -0.45, 0.42, 0.32], rot: -38, f: 0.45, o: 32, mode: "screen" },
            { n: "Edge Light", c: "Specular", e: [0, 0, 1.0, 1.0], cut: [0.035, 0.045, 0.975, 0.975], f: 0.02, o: 45, mode: "screen" },
            { n: "Rim Light", c: "Rim", e: [0, 0, 1.03, 1.03], cut: [-0.13, -0.13, 1.0, 1.0], f: 0.11, o: 92, mode: "screen" },
            { n: "Core Shadow", c: "Shadow", e: [0.5, 0.55, 1.05, 1.05], f: 0.7, o: 92, mode: "multiply" }
        ];
    },
    LIST: null,
    find: function (id) { for (var i = 0; i < UK_BALL.LIST.length; i++) if (UK_BALL.LIST[i].id === id) return UK_BALL.LIST[i]; return null; },
    /* colour of a role: the panel's colours (same order as spec.colors) or the look's own */
    color: function (spec, role, cols) {
        for (var i = 0; i < spec.colors.length; i++) if (spec.colors[i][0] === role) return (cols && cols[i]) || spec.colors[i][1];
        return "#FFFFFF";
    },
    /* Glow and Light Sweep defaults (the panel's starting values; the same controls on Ball Controls) */
    FX: { glow: true, glowInt: 55, glowSize: 45, sweep: true, sweepInt: 70, sweepWidth: 22, sweepAngle: 25, sweepTime: 1.2, sweepPause: 2.5, sweepColor: "#FFFFFF", stroke: 10 }
};
UK_BALL.LIST = [
    { id: "ba01", name: "Lens", colors: [["Stroke", "#FFFFFF"], ["Shade", "#0E2240"], ["Glow", "#BFD9FF"]],
        ring: { c: "Stroke", w: 10 }, fx: { glow: false, sweep: false },
        layers: [
            { n: "Shade", c: "Shade", e: [0, 0, 1.0, 1.0], cut: [0, 0, 0.68, 0.68], f: 0, cf: 0.62, o: 60 }
        ] },
    { id: "ba02", name: "Azure Orb", colors: [["Base", "#2F7DF3"], ["Light", "#46E0FF"], ["Deep", "#1F2FD0"], ["Bloom", "#FFFFFF"], ["Glow", "#3C8BFF"]],
        base: { c1: "Light", c2: "Base", s: [0.55, -0.55], r: 1.9 }, layers: UK_BALL.orb({}) },
    { id: "ba03", name: "Violet Orb", colors: [["Base", "#7B4DFF"], ["Light", "#F07BFF"], ["Deep", "#3A1AB8"], ["Bloom", "#FFFFFF"], ["Glow", "#8B5CFF"]],
        base: { c1: "Light", c2: "Base", s: [0.5, -0.6], r: 1.9 }, layers: UK_BALL.orb({ light: [0.45, -0.55], bloom: [-0.3, 0.6], deep: [0.25, 0.25] }) },
    { id: "ba04", name: "Aqua Orb", colors: [["Base", "#13A9D6"], ["Light", "#8BFFE0"], ["Deep", "#0B4FB0"], ["Bloom", "#FFFFFF"], ["Glow", "#22D3EE"]],
        base: { c1: "Light", c2: "Base", s: [-0.5, -0.55], r: 1.9 }, layers: UK_BALL.orb({ light: [-0.45, -0.5], bloom: [0.35, 0.55], deep: [-0.15, 0.25], bloomRot: -25 }) },
    { id: "ba05", name: "Sunset Orb", colors: [["Base", "#FF6A5C"], ["Light", "#FFD36E"], ["Deep", "#C2185B"], ["Bloom", "#FFF3E0"], ["Glow", "#FF7A59"]],
        base: { c1: "Light", c2: "Base", s: [0.1, -0.75], r: 1.9 }, layers: UK_BALL.orb({ light: [0.15, -0.6], bloom: [-0.4, 0.5], deep: [0.3, 0.3] }) },
    { id: "ba06", name: "Aurora Orb", colors: [["Base", "#3D5AFE"], ["Light", "#5CFFB0"], ["Deep", "#7A1FFF"], ["Bloom", "#E8FFFF"], ["Glow", "#4C6FFF"]],
        base: { c1: "Light", c2: "Base", s: [0.55, -0.45], r: 1.9 }, layers: UK_BALL.orb({ light: [0.5, -0.45], bloom: [-0.4, 0.45], deep: [0.15, 0.35] }) },
    { id: "ba07", name: "Pastel Orb", colors: [["Base", "#B9A8FF"], ["Light", "#9EEBFF"], ["Deep", "#7C63F0"], ["Bloom", "#FFFFFF"], ["Glow", "#B9A8FF"]],
        base: { c1: "Light", c2: "Base", s: [0.5, -0.55], r: 1.9 }, layers: UK_BALL.orb({ bloom: [-0.3, 0.5], deep: [0.25, 0.2], spec: 70 }) },
    { id: "ba08", name: "Glossy Emerald", colors: [["Base", "#27C47E"], ["Light", "#7CF0B6"], ["Shadow", "#071A2B"], ["Rim", "#39F0A8"], ["Specular", "#FFFFFF"], ["Glow", "#2EE59D"]],
        base: { c1: "Light", c2: "Base", s: [-0.45, -0.5], r: 1.5 }, layers: UK_BALL.gloss() },
    { id: "ba09", name: "Glossy Sapphire", colors: [["Base", "#2563EB"], ["Light", "#7FB5FF"], ["Shadow", "#060C2B"], ["Rim", "#38BDF8"], ["Specular", "#FFFFFF"], ["Glow", "#3B82F6"]],
        base: { c1: "Light", c2: "Base", s: [-0.45, -0.5], r: 1.5 }, layers: UK_BALL.gloss() },
    { id: "ba10", name: "Glass Bubble", colors: [["Tint", "#2B8FE0"], ["Edge", "#E9FBFF"], ["Caustic", "#B5F3FF"], ["Shade", "#10456E"], ["Specular", "#FFFFFF"], ["Glow", "#7CC8FF"]],
        base: { c1: "Tint", c2: "Edge", s: [0.05, 0.05], r: 1.05, o: 55 },
        layers: [
            { n: "Specular", c: "Specular", e: [-0.4, -0.5, 0.22, 0.12], rot: -35, f: 0.05, o: 100 },
            { n: "Specular 2", c: "Specular", e: [0.5, 0.45, 0.07, 0.05], rot: -35, f: 0.03, o: 85 },
            { n: "Edge Ring", c: "Edge", e: [0, 0, 1.0, 1.0], cut: [0, 0, 0.91, 0.91], f: 0.07, o: 85, mode: "screen" },
            { n: "Caustic", c: "Caustic", e: [0.15, 0.62, 0.5, 0.22], rot: -15, f: 0.3, o: 85, mode: "screen" },
            { n: "Shade", c: "Shade", e: [0.5, 0.5, 1.0, 1.0], f: 0.8, o: 30, mode: "multiply" }
        ] }
];

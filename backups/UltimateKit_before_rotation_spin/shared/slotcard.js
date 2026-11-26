/*  Ultimate Kit - "Plugin Slot" text card (a row of an audio plugin chain): a dark rounded rectangle with a
    dark-yellow stroke, an icon on the left (5 variants), a green dot and the text in wide-tracked capitals.
    It scales up from its centre and back down at the end. Shared by the panel preview (js/slotprev.js) and the
    AE builder (jsx/slotcard.jsx); ES3. Sizes are px of a 1080-high frame.                                  */
var UK_SLOT = {
    DEF: { fill: "#1A1208", stroke: "#E39B1B", sw: 4.5, dot: "#3DDC97", iconColor: "#8E8E8E", text: "#FFFFFF", icon: 1, corner: 16, height: 120, showIcon: true, showDot: true },
    /* left padding, icon box, gap, dot, gap, right padding; font size and tracking */
    PADL: 40, ICONW: 44, G1: 28, DOT: 20, G2: 34, PADR: 62, FS: 50, TRACK: 120, ISW: 4.4, IS: 1.3,
    FONTS: ["SpaceMono-Bold", "JetBrainsMono-Bold", "RobotoMono-Bold", "IBMPlexMono-Bold", "Consolas-Bold"],
    /* icon parts, px around the icon's centre (times IS): line [x1, y1, x2, y2] (stroke), dot [x, y, r], bar [x, y, w, h],
       arc [r, start %, end %] (a trimmed circle, stroke), poly [[x, y], ...] (open, stroke)                 */
    ICONS: [
        { name: "Lines", line: [[-15, -9, 15, -9], [-15, 0, 15, 0], [-15, 9, 15, 9]] },
        { name: "Grip", dot: [[-5, -9, 2.8], [5, -9, 2.8], [-5, 0, 2.8], [5, 0, 2.8], [-5, 9, 2.8], [5, 9, 2.8]] },
        { name: "Bars", bar: [[-9, 0, 4.6, 14], [0, 0, 4.6, 26], [9, 0, 4.6, 18]] },
        { name: "Power", arc: [[12, 9, 91]], line: [[0, -15, 0, -3]] },
        { name: "Chevron", poly: [[[-5, -10], [5, 0], [-5, 10]]] }
    ],
    /* x of the text's left edge from the card's left edge, and the fixed part of the card's width (px @1080).
       The icon and the dot can be switched off (si / sd false): the text then moves left into their room, and with
       neither of them the text sits in the middle (the right padding on both sides). Same formula in AE (LEFT_EXPR). */
    textLeft: function (si, sd) {
        si = si !== false; sd = sd !== false;
        if (!si && !sd) return UK_SLOT.PADR;
        return UK_SLOT.PADL + (si ? UK_SLOT.ICONW + UK_SLOT.G1 : 0) + (sd ? UK_SLOT.DOT + UK_SLOT.G2 : 0);
    },
    pad: function (si, sd) { return UK_SLOT.textLeft(si, sd) + UK_SLOT.PADR; },
    iconX: function () { return UK_SLOT.PADL + UK_SLOT.ICONW / 2; },
    dotX: function (si) { return UK_SLOT.PADL + (si !== false ? UK_SLOT.ICONW + UK_SLOT.G1 : 0) + UK_SLOT.DOT / 2; },
    /* the reveal of card 29 (Emerald Card, lineX) on the card's times (UK_CARD.times): w = width fraction (the line
       grows across), h = height fraction (then it opens); the end is the mirror */
    reveal: function (T) {
        var a = T.card[0], b = T.card[1], c = T.card[2], e = T.card[3];
        return { w: [[a, 0], [a + (b - a) * 0.5, 1], [c + (e - c) * 0.5, 1], [e, 0]], h: [[a + (b - a) * 0.5, 0], [b, 1], [c, 1], [c + (e - c) * 0.5, 0]] };
    }
};

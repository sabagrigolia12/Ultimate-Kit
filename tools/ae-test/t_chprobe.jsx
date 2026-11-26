// Which TextDocument character / paragraph settings this After Effects can set by script, and the font list shape.
// Own temporary comp, removed at the end. -> out/chprobe.txt
(function () {
    var o = [], C = app.project.items.addComp("WR_ch", 400, 400, 1, 2, 30);
    try {
        var L = C.layers.addText("Test text"), P = L.property("ADBE Text Properties").property("ADBE Text Document"), d = P.value;
        var tries = [
            ["font", "Arial-BoldMT"], ["fontSize", 50], ["fillColor", [1, 0, 0]], ["applyStroke", true], ["strokeColor", [0, 0, 1]], ["strokeWidth", 4], ["strokeOverFill", true],
            ["tracking", 40], ["autoLeading", false], ["leading", 70], ["fauxBold", true], ["fauxItalic", true], ["horizontalScale", 1.2], ["verticalScale", 0.9],
            ["baselineShift", 5], ["tsume", 0.3], ["fontCapsOption", FontCapsOption.FONT_ALL_CAPS], ["fontBaselineOption", FontBaselineOption.FONT_SUPERSCRIPT],
            ["autoKernType", AutoKernType.OPTICAL_KERN], ["justification", ParagraphJustification.RIGHT_JUSTIFY], ["allCaps", true], ["smallCaps", true]
        ];
        for (var i = 0; i < tries.length; i++) {
            var d2 = P.value, k = tries[i][0];
            try { d2[k] = tries[i][1]; P.setValue(d2); var back = P.value[k]; o.push(k + ": ok -> " + ((back instanceof Array) ? back.join(",") : String(back))); }
            catch (e) { o.push(k + ": ERR " + e.message); }
        }
        try {
            var all = app.fonts.allFonts, n = 0, fam = all.length, ex = [];
            for (var f = 0; f < all.length; f++) { n += all[f].length; if (f < 3) ex.push(all[f][0].familyName + " / " + all[f][0].styleName + " / " + all[f][0].postScriptName + " x" + all[f].length); }
            o.push("fonts: families " + fam + " fonts " + n + " | " + ex.join(" | "));
            var g = app.fonts.getFontsByFamilyNameAndStyleName ? "has getFontsByFamilyNameAndStyleName" : "no by-family";
            o.push(g);
        } catch (eF) { o.push("fonts ERR " + eF.message); }
        try { o.push("FontStyle? " + typeof L.text.sourceText.value.fontObject); } catch (eO) { }
    } catch (e0) { o.push("ERROR " + e0.message + " line " + e0.line); }
    C.remove();
    var f2 = new File("D:/Projects/Codex/tools/ae-test/out/chprobe.txt"); f2.encoding = "UTF-8"; f2.open("w"); f2.writeln(o.join("\n")); f2.close();
})();

/*  Ultimate Kit - host entry point (loaded by the panel through the manifest ScriptPath).
    Files are evaluated at global scope so the panel can call UK.call(...) afterwards.     */
/* the panel sets UK_ROOT (its extension folder) before evaluating this file */
if (typeof UK_ROOT === "undefined" || !UK_ROOT) var UK_ROOT = File($.fileName).parent.parent.fsName;
var UK_FILES = ["jsx/core.jsx", "shared/catalog.js", "shared/underline.js", "shared/lowerthird.js", "shared/transitions.js", "shared/cards.js", "shared/slotcard.js", "shared/tiles.js", "shared/cardspin.js", "shared/burst.js", "shared/sphere.js", "shared/swap.js", "shared/deck.js", "shared/focus.js", "shared/wave.js", "shared/bgov.js", "shared/highlight.js", "shared/captions.js", "shared/pathsimp.js", "shared/depth.js", "shared/balls.js", "jsx/text.jsx", "jsx/underline.jsx", "jsx/lowerthird.jsx", "jsx/transitions.jsx", "jsx/cards.jsx", "jsx/slotcard.jsx", "jsx/tiles.jsx", "jsx/depth.jsx", "jsx/wipe.jsx", "jsx/carousel.jsx", "jsx/wave.jsx", "jsx/bgov.jsx", "jsx/highlight.jsx", "jsx/captions.jsx", "jsx/autocap.jsx", "shared/graphics.js", "shared/gfx_t1.js", "shared/gfx_t2.js", "jsx/graphics.jsx", "jsx/word2path.jsx", "jsx/photo2shape.jsx", "jsx/filltrim.jsx", "jsx/saasbg.jsx", "jsx/ball.jsx",
    "jsx/backgrounds.jsx", "jsx/gradientbg.jsx", "jsx/svg.jsx", "jsx/bounce.jsx", "jsx/glass.jsx", "jsx/hover.jsx", "jsx/cursor.jsx", "jsx/library.jsx"];
var UK_LOAD_ERROR = "";
for (var UK_i = 0; UK_i < UK_FILES.length; UK_i++) {
    try { $.evalFile(new File(UK_ROOT + "/" + UK_FILES[UK_i])); }
    catch (UK_e) { UK_LOAD_ERROR += UK_FILES[UK_i] + ": " + UK_e.message + " (line " + UK_e.line + ")\n"; }
}

/* import a file (used by drag & drop) and add it to the active comp, keeping the current selection */
UK.api.importFile = function (a) {
    var comp = UK.comp(true);
    var keep = comp.selectedLayers;
    var f = new File(a.path);
    if (!f.exists) throw new Error("File not found: " + a.path);
    var item = app.project.importFile(new ImportOptions(f));
    item.parentFolder = UK.folder("Imported");
    var L = comp.layers.add(item);
    L.startTime = 0;
    var sel = [L];
    if (a.keepSelection) for (var i = 0; i < keep.length; i++) sel.push(keep[i]);
    UK.selectOnly(comp, sel);
    return { layer: L.name };
};
/* the system's own open dialog (the same kind After Effects uses); a.types: extensions, e.g. ["svg"] */
UK.api.pickFile = function (a) {
    var t = a.types || [], list = [], i, filter;
    for (i = 0; i < t.length; i++) list.push("*." + t[i]);
    if ($.os.indexOf("Windows") >= 0) filter = list.length ? (t.join(", ").toUpperCase() + " files:" + list.join(";") + ",All files:*.*") : "All files:*.*";
    else filter = function (f) { if (f instanceof Folder) return true; if (!t.length) return true; for (var k = 0; k < t.length; k++) if (new RegExp("\\." + t[k] + "$", "i").test(f.name)) return true; return false; };
    var f = File.openDialog(a.title || "Import File", filter, false);
    return { path: f ? f.fsName.replace(/\\/g, "/") : null };
};
UK.api.loadStatus = function () {
    return { error: UK_LOAD_ERROR, version: UK.VERSION, ae: app.version, font: UK.font() };
};

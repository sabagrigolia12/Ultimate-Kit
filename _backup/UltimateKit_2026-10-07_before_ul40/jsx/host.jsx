/*  Ultimate Kit - host entry point (loaded by the panel through the manifest ScriptPath).
    Files are evaluated at global scope so the panel can call UK.call(...) afterwards.     */
/* the panel sets UK_ROOT (its extension folder) before evaluating this file */
if (typeof UK_ROOT === "undefined" || !UK_ROOT) var UK_ROOT = File($.fileName).parent.parent.fsName;
var UK_FILES = ["jsx/core.jsx", "shared/catalog.js", "shared/saasbg_mesh.js", "shared/saasbg_blobs.js", "shared/saasbg.js", "shared/underline.js", "jsx/text.jsx", "jsx/underline.jsx",
    "jsx/backgrounds.jsx", "jsx/gradientbg.jsx", "jsx/saasbg.jsx", "jsx/svg.jsx", "jsx/bounce.jsx", "jsx/glass.jsx", "jsx/hover.jsx", "jsx/cursor.jsx", "jsx/library.jsx"];
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
UK.api.loadStatus = function () {
    return { error: UK_LOAD_ERROR, version: UK.VERSION, ae: app.version, font: UK.font() };
};

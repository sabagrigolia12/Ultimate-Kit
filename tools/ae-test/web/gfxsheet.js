/* Contact sheets of the Graphics templates for checking (loaded into the panel page in the browser preview).
   window.__sheet(ids, w, h, palStart, t (undefined = end), cols) */
window.__sheet = function (ids, w, h, pal, t, cols) {
    var ov = document.getElementById("__ov");
    if (!ov) { ov = document.createElement("div"); ov.id = "__ov"; document.body.appendChild(ov); }
    ov.style.cssText = "position:fixed;inset:0;background:#111;z-index:99999;display:grid;grid-template-columns:repeat(" + cols + ",1fr);gap:3px;padding:3px;align-content:start;overflow:hidden";
    ov.innerHTML = "";
    var errs = [];
    ids.forEach(function (id, k) {
        var c = document.createElement("canvas");
        c.style.cssText = "width:100%;aspect-ratio:" + w + "/" + h + ";display:block";
        ov.appendChild(c);
        try {
            var S = UK_GFX.timed(UK_GFX.spec(id, w, h, UK_GFX.PALETTES[(pal + k) % 10], {}, {}), 1, 1);
            UKGfxPrev.draw(c, S, t === undefined ? S.dur : t);
            var g = c.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#ff0"; g.font = "11px sans-serif"; g.fillText(id, 3, 11);
        } catch (e) { errs.push(id + ": " + e.message); }
    });
    return "ok " + errs.join(" | ");
};

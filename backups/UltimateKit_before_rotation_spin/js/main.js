/*  Ultimate Kit - panel UI */
(function () {
    "use strict";
    var CEP = window.__adobe_cep__;
    var C = UK_CAT;
    var view = document.getElementById("view");
    var bar = document.getElementById("bar");
    var btnApply = document.getElementById("btnApply");
    var btnBack = document.getElementById("btnBack");
    var titleEl = document.getElementById("pageTitle");
    var statusEl = document.getElementById("status");
    var preview = null;

    /* ============================================================ bridge */
    var hostReady = null;
    function extDir() {
        var root = "";
        try { root = CEP.getSystemPath("extension"); } catch (e) { }
        return decodeURI(String(root).replace(/^file:\/+/, "")).replace(/\\/g, "/");
    }
    function loadHost() {
        if (hostReady) return hostReady;
        hostReady = new Promise(function (resolve) {
            if (!CEP) { resolve(true); return; }
            var root = "";
            try { root = CEP.getSystemPath("extension"); } catch (e) { }
            root = decodeURI(String(root).replace(/^file:\/+/, "")).replace(/\\/g, "/");
            var js = "var UK_ROOT = " + JSON.stringify(root) + "; $.evalFile(new File(UK_ROOT + '/jsx/host.jsx')); typeof UK === 'object' ? 'ok' : 'missing';";
            CEP.evalScript(js, function (r) { resolve(r === "ok"); });
        });
        return hostReady;
    }
    function call(fn, args) {
        return loadHost().then(function () { return callNow(fn, args); });
    }
    function callNow(fn, args) {
        return new Promise(function (resolve) {
            if (!CEP) { console.log("[UK mock]", fn, args); setTimeout(function () { resolve(mock(fn, args)); }, 250); return; }
            var script = "UK.call(" + JSON.stringify(fn) + "," + JSON.stringify(JSON.stringify(args || {})) + ")";
            CEP.evalScript(script, function (res) {
                var r;
                try { r = JSON.parse(res); }
                catch (e) { r = { ok: false, error: (res === "EvalScript error." || !res) ? "After Effects did not answer. Close and reopen the panel (Window > Extensions > Ultimate Kit)." : String(res) }; }
                resolve(r);
            });
        });
    }
    function mock(fn, args) {
        if (fn === "listLayers") return { ok: true, data: { comp: "Main Comp", layers: [{ index: 1, name: "Arrow Cursor", type: "shape" }, { index: 2, name: "Button", type: "shape" }, { index: 3, name: "Title", type: "text" }] } };
        if (fn === "loadStatus") return { ok: true, data: { error: "", version: "1.0.0", ae: "preview" } };
        if (fn === "libSave") return { ok: true, data: { data: { v: 1, name: args.name, layers: [{ type: "text", name: args.name }], anim: true } } };
        return { ok: true, data: {} };
    }

    /* ============================================================ files */
    var fs = window.cep && window.cep.fs;
    function userDir(sub) {
        var base = "";
        try { base = CEP.getSystemPath("userData"); } catch (e) { }
        var dir = base.replace(/\\/g, "/") + "/UltimateKit/" + sub;
        try { fs.makedir(base.replace(/\\/g, "/") + "/UltimateKit"); fs.makedir(dir); } catch (e2) { }
        return dir;
    }
    function userTemp() { return userDir("import"); }
    /* a file chooser: in After Effects its own (modern Windows / macOS) open dialog via ExtendScript */
    function pickFile(types, title) {
        if (CEP) {
            return call("pickFile", { title: title || "Import File", types: types }).then(function (r) { return r.ok && r.data && r.data.path ? r.data.path : null; });
        }
        return new Promise(function (res) {      // browser fallback (preview)
            var inp = document.createElement("input");
            inp.type = "file"; inp.accept = types.map(function (t) { return "." + t; }).join(",");
            inp.onchange = function () { res(inp.files[0] || null); };
            inp.click();
        });
    }
    function readText(src) {
        if (typeof src === "string") {
            var r = fs.readFile(src);
            if (r.err) return Promise.reject(new Error("Could not read " + src));
            return Promise.resolve(r.data);
        }
        return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsText(src); });
    }
    function mimeOf(name) {
        var e = String(name).toLowerCase().replace(/^.*\./, "");
        return { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", bmp: "image/bmp", tif: "image/tiff", tiff: "image/tiff", psd: "image/png" }[e] || "image/png";
    }
    function readDataURL(src) {
        if (typeof src === "string") {
            var r = fs.readFile(src, window.cep.encoding.Base64);
            if (r.err) return Promise.reject(new Error("Could not read " + src));
            return Promise.resolve("data:" + mimeOf(src) + ";base64," + r.data);
        }
        return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(src); });
    }
    /* dropped File -> saved copy on disk (After Effects needs a path to import) */
    function saveDropped(file) {
        return readDataURL(file).then(function (url) {
            var path = userTemp() + "/" + Date.now() + "_" + file.name.replace(/[^\w.\-]+/g, "_");
            var r = fs.writeFile(path, url.split(",")[1], window.cep.encoding.Base64);
            if (r.err) throw new Error("Could not save the dropped file");
            return path;
        });
    }

    /* ============================================================ helpers */
    function h(tag, attrs) {
        var el = document.createElement(tag), i;
        attrs = attrs || {};
        for (var k in attrs) {
            var v = attrs[k];
            if (v === undefined || v === null || v === false) continue;
            if (k === "class") el.className = v;
            else if (k === "html") el.innerHTML = v;
            else if (k === "text") el.textContent = v;
            else if (k.indexOf("on") === 0) el.addEventListener(k.substr(2), v);
            else el.setAttribute(k, v === true ? "" : v);
        }
        for (i = 2; i < arguments.length; i++) {
            var c = arguments[i];
            if (c === null || c === undefined || c === false) continue;
            if (Array.isArray(c)) c.forEach(function (x) { if (x) el.appendChild(typeof x === "string" ? document.createTextNode(x) : x); });
            else el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
        }
        return el;
    }
    var STORE = {};
    try { STORE = JSON.parse(localStorage.getItem("uk_state") || "{}"); } catch (e) { STORE = {}; }
    function state(id, defs) {
        var s = STORE[id] || {};
        for (var k in defs) if (s[k] === undefined) s[k] = defs[k];
        STORE[id] = s;
        return s;
    }
    function save() { try { localStorage.setItem("uk_state", JSON.stringify(STORE)); } catch (e) { } }
    function status(msg, kind) {
        if (kind === "ok") msg = "";            // no success text next to Apply (user request): only warnings and errors
        statusEl.textContent = msg || "";
        statusEl.className = "status" + (kind ? " " + kind : "");
        statusEl.title = msg || "";
    }
    function run(fn, args, okMsg, btn) {
        if (btn) btn.classList.add("busy");
        status("Working...");
        return call(fn, args).then(function (r) {
            if (btn) btn.classList.remove("busy");
            if (r.ok) status(typeof okMsg === "function" ? okMsg(r.data) : (okMsg || "Done"), "ok");
            else status(r.error, "err");
            return r;
        });
    }

    /* ============================================================ icons */
    var IC = {
        sparkT: '<path d="M4 6h9M8.5 6v12"/><path d="M17 3.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/><path d="M15 14h5M17.5 14v6"/>',
        underline: '<path d="M7 4v6a5 5 0 0010 0V4"/><path d="M4 20c4-1.6 12-1.6 16 0"/>',
        card: '<rect x="3" y="7" width="18" height="10" rx="3"/><path d="M7.5 12h9" opacity=".7"/><path d="M14 7l-3 10" opacity=".35"/>',
        transition: '<rect x="3" y="5" width="18" height="14" rx="2.5" opacity=".45"/><path d="M9 5l-4 14"/><path d="M15 5l-4 14"/><path d="M21 5l-4 14"/>',
        depth: '<path d="M2.5 18.5l5.5-7.5 3.5 4.5 3-3.5 7 6.5z"/><path d="M2.5 21h19" opacity=".5"/><circle cx="16.5" cy="6.5" r="2"/>',
        wipe: '<rect x="3" y="5" width="18" height="14" rx="2.5" opacity=".45"/><path d="M11 5v3h1.5v3H11v3h1.5v3H11v2"/><path d="M3.5 15.5l3.5-4 2.5 3"/><circle cx="15.5" cy="9" r=".6"/><circle cx="15.5" cy="12" r=".6"/><circle cx="15.5" cy="15" r=".6"/>',
        carousel: '<ellipse cx="12" cy="12.5" rx="9" ry="3.5" opacity=".45"/><rect x="9.5" y="6" width="5" height="7" rx="1"/><rect x="3" y="9" width="3.5" height="5" rx=".8" opacity=".7"/><rect x="17.5" y="9" width="3.5" height="5" rx=".8" opacity=".7"/>',
        lowerthird: '<path d="M4 9.5v7"/><path d="M7.5 11h10"/><path d="M7.5 15.5h6.5"/><rect x="2.5" y="5" width="19" height="14" rx="2.5" opacity=".45"/>',
        flare: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M18.7 5.3l-2.8 2.8M8.1 15.9l-2.8 2.8"/>',
        gradient: '<circle cx="12" cy="12" r="8"/><path d="M8 18.9A8 8 0 0018.9 8"/><path d="M6 15.5a8 8 0 009.5-9.5" opacity=".6"/>',
        horizon: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 16.5c3.5-3 14.5-3 18 0"/><path d="M7.5 9.5l9-3" opacity=".6"/>',
        ball: '<circle cx="12" cy="12" r="8.5"/><path d="M7.5 9.5a5 5 0 014-3.2" opacity=".7"/><path d="M8 18.2a8.5 8.5 0 0011.6-6.6" opacity=".45"/>',
        saasbg: '<rect x="3" y="5" width="18" height="14" rx="2.5" opacity=".45"/><path d="M5 16.5c3-4.5 6 .5 9-2.5s3.5-2.5 5-1.5"/><circle cx="15" cy="9.5" r="2.2"/>',
        cursor: '<path d="M5 3l14 7-6 1.5L10.5 18z"/><path d="M13 11.5l5 5"/>',
        bounce: '<circle cx="15" cy="7" r="3"/><path d="M3 20h18"/><path d="M5 16c1.5-6 3-9 6-9" stroke-dasharray="2 2.4"/>',
        glass: '<rect x="4" y="5" width="16" height="14" rx="3.5"/><path d="M8 9.5l3-3M8 13l6-6"/>',
        search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
        star: '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
        plus: '<path d="M12 6v12M6 12h12"/>',
        x: '<path d="M7 7l10 10M17 7L7 17"/>',
        chevR: '<path d="M9 6l6 6-6 6"/>',
        chevD: '<path d="M6 9l6 6 6-6"/>'
    };
    function svgIcon(name) { return '<svg viewBox="0 0 24 24">' + IC[name] + '</svg>'; }

    /* ============================================================ controls */
    function row(name) {
        var r = h("div", { class: "row" });
        if (name !== null) r.appendChild(h("div", { class: "name", text: name }));
        for (var i = 1; i < arguments.length; i++) if (arguments[i]) r.appendChild(arguments[i]);
        return r;
    }
    function seg(opts, value, onChange) {
        var s = h("div", { class: "seg" });
        opts.forEach(function (o) {
            var b = h("button", { class: o[0] === value ? "on" : "", text: o[1], title: o[2] || null });
            b.addEventListener("click", function () {
                Array.prototype.forEach.call(s.children, function (c) { c.classList.remove("on"); });
                b.classList.add("on");
                onChange(o[0]);
            });
            s.appendChild(b);
        });
        return s;
    }
    function slider(min, max, step, value, unit, onChange, zeroText) {
        var val = h("span", { class: "val" });
        var fmt = function (v) { if (zeroText && Number(v) === 0) return zeroText; return (step < 1 ? Number(v).toFixed(step < 0.1 ? 2 : 1) : Math.round(v)) + (unit || ""); };
        var inp = h("input", { type: "range", min: min, max: max, step: step, value: value });
        var fill = function () { inp.style.setProperty("--p", ((Number(inp.value) - min) / ((max - min) || 1) * 100) + "%"); };   // the track is filled up to the thumb
        val.textContent = fmt(value); fill();
        inp.addEventListener("input", function () { val.textContent = fmt(inp.value); fill(); onChange(Number(inp.value)); });
        return h("div", { class: "range" }, inp, val);
    }
    function swatch(value, onChange, title) {
        var dot = h("span"); dot.style.background = value;
        var inp = h("input", { type: "color", value: value, title: title || "Pick a colour" });
        inp.addEventListener("input", function () { dot.style.background = inp.value; onChange(inp.value); });
        var w = h("label", { class: "swatch", title: title || null }, dot, inp);
        w.set = function (v) { dot.style.background = v; inp.value = v; };
        return w;
    }
    function toggle(value, onChange) {
        var t = h("div", { class: "toggle" + (value ? " on" : ""), role: "switch" });
        t.addEventListener("click", function () { t.classList.toggle("on"); onChange(t.classList.contains("on")); });
        return t;
    }
    function section(label) {
        var s = h("div", { class: "section" });
        if (label) s.appendChild(h("div", { class: "label", text: label }));
        for (var i = 1; i < arguments.length; i++) if (arguments[i]) s.appendChild(arguments[i]);
        return s;
    }
    function dropZone(text, onFiles) {
        var d = h("div", { class: "drop", text: text });
        d.addEventListener("dragover", function (e) { e.preventDefault(); d.classList.add("over"); });
        d.addEventListener("dragleave", function () { d.classList.remove("over"); });
        d.addEventListener("drop", function (e) {
            e.preventDefault(); d.classList.remove("over");
            if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files[0]);
        });
        return d;
    }

    /* ============================================================ my presets (files) */
    /* userData/UltimateKit/presets/<category>/<id>.json (+ <id>.png thumbnail). In the browser
       preview (no CEP) they live in localStorage instead.                                      */
    var MY = {
        dir: function (cat) { return userDir("presets") + "/" + cat; },
        list: function (cat) {
            if (!fs) return (STORE.myMock && STORE.myMock[cat]) || [];
            var d = MY.dir(cat), r;
            try { fs.makedir(d); r = fs.readdir(d); } catch (e) { return []; }
            if (!r || r.err || !r.data) return [];
            return r.data.filter(function (f) { return /\.json$/i.test(f); }).map(function (f) {
                var id = f.replace(/\.json$/i, ""), name = id;
                try { name = JSON.parse(fs.readFile(d + "/" + f).data).name || id; } catch (e2) { }
                return { id: id, name: name, custom: true, file: d + "/" + f, thumb: d + "/" + id + ".png" };
            });
        },
        read: function (cat, p) {
            if (!fs) return Promise.resolve(p.data);
            var r = fs.readFile(p.file);
            if (r.err) return Promise.reject(new Error("Could not read the preset file"));
            return Promise.resolve(JSON.parse(r.data));
        },
        write: function (cat, id, data) {
            if (!fs) { STORE.myMock = STORE.myMock || {}; (STORE.myMock[cat] = STORE.myMock[cat] || []).push({ id: id, name: data.name, custom: true, data: data }); save(); return; }
            var r = fs.writeFile(MY.dir(cat) + "/" + id + ".json", JSON.stringify(data));
            if (r.err) throw new Error("Could not save the preset file");
        },
        remove: function (cat, p) {
            if (!fs) { STORE.myMock[cat] = (STORE.myMock[cat] || []).filter(function (q) { return q.id !== p.id; }); save(); return; }
            try { fs.deleteFile(p.file); } catch (e) { }
            try { fs.deleteFile(p.thumb); } catch (e2) { }
        }
    };
    function isMine(id) { return /^my_/.test(String(id)); }

    /* ============================================================ preset library grid
       Every preset category uses this: search (name or number), favourites (star, first in the
       numbering), your own presets (+ tile), Edit (drag to reorder, delete your own), hover preview.
       o: { draw(cv, p) still thumbnail, anim(cv, p, t) animated frame (hover), onPick(p),
            onHover(p | null), filter(p) extra filter (e.g. a pack),
            onCarry(p, tile) a tile dragged out of the panel: returns { drop(), cancel() } }   */
    function library(cat, st, o) {
        STORE.fav = STORE.fav || {}; STORE.order = STORE.order || {};
        var favs = STORE.fav[cat.id] = STORE.fav[cat.id] || [];
        var wrap = h("div", { class: "lib" });
        var q = h("input", { type: "text", placeholder: "Search by name or number", value: st.q || "" });
        var editBtn = h("button", { class: "btn small", text: "Edit" });
        var tools = h("div", { class: "libbar" }, h("span", { class: "sic", html: svgIcon("search") }), q, editBtn);
        var grid = h("div", { class: "grid" });
        var editing = false, mine = [];
        wrap.appendChild(tools); wrap.appendChild(grid);
        function all() { return cat.list.concat(mine); }
        function find(id) { var a = all(), i; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
        /* user order: saved id list first (unknown / new ids keep their default place at the end) */
        function ordered() {
            var a = all(), ord = STORE.order[cat.id] || [], pos = {}, i;
            for (i = 0; i < ord.length; i++) pos[ord[i]] = i;
            var def = a.map(function (p, k) { return { p: p, k: k }; });
            def.sort(function (x, y) {
                var px = pos[x.p.id], py = pos[y.p.id];
                if (px !== undefined && py !== undefined) return px - py;
                if (px !== undefined) return -1;
                if (py !== undefined) return 1;
                return x.k - y.k;
            });
            var list = def.map(function (d) { return d.p; }), F = [], R = [];
            list.forEach(function (p) { if (favs.indexOf(p.id) >= 0) F.push(p); else R.push(p); });
            F.sort(function (x, y) { return favs.indexOf(x.id) - favs.indexOf(y.id); });
            return F.concat(R);
        }
        function thumbFor(tile, cv, p) {
            if (p.custom) {
                // a letter tile until the frame After Effects renders for it has been written
                var ph = h("div", { class: "thumb mine", text: p.name.charAt(0).toUpperCase() });
                cv.replaceWith(ph);
                if (!fs) return;
                var img = new Image(), tries = 0;
                var load = function () { img.src = "file:///" + p.thumb.replace(/^\/+/, "") + "?v=" + Date.now(); };
                img.onload = function () { img.className = "thumb"; if (ph.parentNode) ph.replaceWith(img); };
                img.onerror = function () { if (++tries < 10) setTimeout(load, 1500); };
                load();
                return;
            }
            requestAnimationFrame(function () { try { o.draw(cv, p); } catch (e) { } });
        }
        function build() {
            grid.innerHTML = "";
            var list = ordered(), term = q.value.trim().toLowerCase();
            list.forEach(function (p, i) {
                var num = i + 1;
                if (term && !(String(num) === term || String(num).indexOf(term) === 0 && /^\d+$/.test(term) || p.name.toLowerCase().indexOf(term) >= 0)) return;
                if (o.filter && !o.filter(p)) return;
                var cv = h("canvas"), fav = favs.indexOf(p.id) >= 0;
                var star = h("button", { class: "star" + (fav ? " on" : ""), title: fav ? "Remove from favourites" : "Add to favourites", html: svgIcon("star") });
                var del = p.custom ? h("button", { class: "del", title: "Delete this preset", html: svgIcon("x") }) : null;
                var tile = h("div", { class: "preset" + (st.sel === p.id ? " on" : "") + (p.custom ? " custom" : ""), title: p.name, "data-id": p.id },
                    cv, star, del, h("div", { class: "pn", html: "<b>" + num + "</b>" + p.name.replace(/</g, "&lt;") }));
                star.addEventListener("click", function (e) {
                    e.stopPropagation();
                    var k = favs.indexOf(p.id);
                    if (k >= 0) favs.splice(k, 1); else favs.push(p.id);
                    save(); build();
                });
                if (del) del.addEventListener("click", function (e) {
                    e.stopPropagation();
                    if (!confirm("Delete your preset \"" + p.name + "\"?")) return;
                    MY.remove(cat.id, p); reloadMine(); build();
                });
                tile.addEventListener("click", function () {
                    if (tile.dataset.carried) { delete tile.dataset.carried; return; }   // the end of a carry, not a click
                    if (editing) return;
                    Array.prototype.forEach.call(grid.querySelectorAll(".preset"), function (c) { c.classList.remove("on"); });
                    tile.classList.add("on");
                    st.sel = p.id; save();
                    if (o.onPick) o.onPick(p);
                });
                tile.addEventListener("dblclick", function () { if (!editing) btnApply.click(); });
                var raf = 0;   // this tile's own hover loop
                tile.addEventListener("mouseenter", function () {
                    if (editing) return;
                    if (o.onHover) o.onHover(p);
                    if (o.anim && !p.custom) {
                        var t0 = performance.now();
                        var step = function () { try { o.anim(cv, p, (performance.now() - t0) / 1000); } catch (e2) { } raf = requestAnimationFrame(step); };
                        cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
                    }
                });
                tile.addEventListener("mouseleave", function () {
                    cancelAnimationFrame(raf); raf = 0;
                    if (o.anim && !p.custom) { try { o.draw(cv, p); } catch (e) { } }
                    if (o.onHover) o.onHover(null);
                });
                // edit mode: drag to reorder
                tile.draggable = editing;
                tile.addEventListener("dragstart", function (e) { tile.classList.add("dragging"); e.dataTransfer.setData("text/plain", p.id); });
                tile.addEventListener("dragend", function () { tile.classList.remove("dragging"); });
                // otherwise (o.onCarry) the tile can be carried out of the panel onto a layer in After Effects
                if (o.onCarry) tile.addEventListener("pointerdown", function (e) {
                    if (editing || e.button !== 0 || e.target.closest(".star, .del")) return;
                    var sx = e.screenX, sy = e.screenY, carry = null, pid = e.pointerId;
                    try { tile.setPointerCapture(pid); } catch (x) { }
                    var move = function (ev) {
                        if (!carry && Math.abs(ev.screenX - sx) + Math.abs(ev.screenY - sy) > 8) { carry = o.onCarry(p, tile) || null; if (carry) tile.classList.add("dragging"); }
                    };
                    var end = function (ev) {
                        tile.removeEventListener("pointermove", move); tile.removeEventListener("pointerup", end); tile.removeEventListener("pointercancel", end);
                        try { tile.releasePointerCapture(pid); } catch (x) { }
                        if (!carry) return;
                        tile.classList.remove("dragging"); tile.dataset.carried = "1";
                        if (ev.type === "pointerup") carry.drop();   // (a cancelled pointer = the helper took over: it reports the release)
                    };
                    tile.addEventListener("pointermove", move); tile.addEventListener("pointerup", end); tile.addEventListener("pointercancel", end);
                });
                tile.addEventListener("dragover", function (e) { if (editing) { e.preventDefault(); tile.classList.add("dropto"); } });
                tile.addEventListener("dragleave", function () { tile.classList.remove("dropto"); });
                tile.addEventListener("drop", function (e) {
                    e.preventDefault(); tile.classList.remove("dropto");
                    var from = e.dataTransfer.getData("text/plain"); if (!from || from === p.id) return;
                    var ids = ordered().map(function (x) { return x.id; }), fi = ids.indexOf(from), ti = ids.indexOf(p.id);
                    ids.splice(fi, 1); ids.splice(ti, 0, from);
                    // a favourite dropped among the others stays a favourite: favourites keep their own order
                    var fv = ids.filter(function (id) { return favs.indexOf(id) >= 0; });
                    favs.length = 0; fv.forEach(function (id) { favs.push(id); });
                    STORE.order[cat.id] = ids; save(); build();
                });
                grid.appendChild(tile);
                thumbFor(tile, cv, p);
            });
            if (!term) grid.appendChild(plusTile());
        }
        /* the + tile: name it, then save the selected layer(s) as your own preset */
        function plusTile() {
            var t = h("div", { class: "preset plus", title: "Add your own preset from the selected layer(s)" }, h("div", { class: "plusbox", html: svgIcon("plus") }), h("div", { class: "pn", text: "Add my preset" }));
            t.addEventListener("click", function () {
                if (t.classList.contains("open")) return;
                t.classList.add("open");
                t.innerHTML = "";
                var nm = h("input", { type: "text", placeholder: "Preset name" });
                var ok = h("button", { class: "btn small primary", text: "Save" }), no = h("button", { class: "btn small", text: "Cancel" });
                t.appendChild(h("div", { class: "plusform" }, nm, h("div", { class: "btns" }, ok, no)));
                nm.focus();
                no.addEventListener("click", function (e) { e.stopPropagation(); build(); });
                var doSave = function (e) {
                    if (e) e.stopPropagation();
                    var id = "my_" + Date.now(), name = nm.value.trim() || "My preset";
                    var thumb = fs ? MY.dir(cat.id) + "/" + id + ".png" : "";
                    run("libSave", { name: name, thumb: thumb }, "Saved \"" + name + "\" to " + cat.name, ok).then(function (r) {
                        if (!r.ok) return;
                        r.data.data.name = name; r.data.data.cat = cat.id;
                        try { MY.write(cat.id, id, r.data.data); } catch (e2) { status(e2.message, "err"); return; }
                        reloadMine(); st.sel = id; save(); build();
                    });
                };
                ok.addEventListener("click", doSave);
                nm.addEventListener("keydown", function (e) { if (e.key === "Enter") doSave(e); if (e.key === "Escape") build(); });
            });
            return t;
        }
        function reloadMine() { mine = MY.list(cat.id); }
        q.addEventListener("input", function () { st.q = q.value; save(); build(); });
        editBtn.addEventListener("click", function () {
            editing = !editing;
            editBtn.textContent = editing ? "Done" : "Edit";
            editBtn.classList.toggle("primary", editing);
            wrap.classList.toggle("editing", editing);
            build();
        });
        reloadMine();
        build();
        wrap.rebuild = build;
        wrap.find = find;
        return wrap;
    }
    /* Apply: your own presets go through the library, the built-in ones through `builtin` */
    function applyWith(cat, st, builtin) {
        return function () {
            if (isMine(st.sel)) {
                var p = MY.list(cat.id).filter(function (x) { return x.id === st.sel; })[0];
                if (!p) { status("Preset not found", "err"); return; }
                MY.read(cat.id, p).then(function (data) {
                    return run("libApply", { data: data }, function (d) { return (d.mode === "animation" ? "Animated: " : "Added: ") + (d.layers || []).join(", "); }, btnApply);
                }).catch(function (e) { status(e.message, "err"); });
                return;
            }
            builtin();
        };
    }

    /* ============================================================ categories */
    /* Wipe Reveal looks (jsx/wipe.jsx builds them by id) */
    var WIPES = [
        { id: "wr01", name: "Pixel Wipe", look: "pixel", dur: 1.33, c1: "#B67CFF", c2: "#8E33FF" },
        { id: "wr02", name: "Color Wipe", look: "color", dur: 1.0, c1: "#FFFFFF", c2: "#BE11FF" },
        { id: "wr03", name: "Sparkle Wipe", look: "sparkle", dur: 1.5, c1: "#FFF3DC", c2: "#F2C27B" },
        { id: "wr04", name: "Grid Wipe", look: "grid", dur: 1.5, c1: "#6EE7FF", c2: "#3B5BFF" }
    ];
    /* Carousel looks (jsx/carousel.jsx: cr01 build, cr02 buildPath) */
    var CARS = [
        { id: "cr01", name: "Ring Carousel", look: "ring" },
        { id: "cr02", name: "Path Carousel", look: "path" },
        { id: "cr03", name: "Spin Carousel", look: "spin" },
        { id: "cr04", name: "Card Spin", look: "cardspin" },
        { id: "cr05", name: "Photo Burst", look: "burst" }
    ];
    /* SaaS BG: the original comps, imported 1:1 from assets/saasbg/saasbg.aep (jsx/saasbg.jsx) */
    var SAASBG = [
        { id: "sb01", name: "Gradient 1" }, { id: "sb02", name: "Gradient 2" }, { id: "sb03", name: "Gradient 3" },
        { id: "sb04", name: "Gradient 4" }, { id: "sb05", name: "Gradient 5" }, { id: "sb06", name: "Gradient 6" },
        { id: "sb07", name: "Gradient 7" }, { id: "sb08", name: "Gradient 8" }, { id: "sb09", name: "Star Gradient" }
    ];
    /* Glass looks (jsx/glass.jsx: gl01 build, gl02 buildBox) */
    var GLASSES = [
        { id: "gl01", name: "Frosted Glass", look: "frost" },
        { id: "gl02", name: "Glow Box", look: "box" }
    ];
    var CATS = [
        { id: "saasText", name: "SaaS Text", icon: "sparkT", list: C.textSaas, page: pageText },
        { id: "hover", name: "Hover & Cursor", icon: "cursor", page: pageHover },
        { id: "bounce", name: "Bounce", icon: "bounce", page: pageBounce },
        { id: "glass", name: "Glass", icon: "glass", list: GLASSES, page: pageGlass },
        { id: "depth", name: "Depth Reveal", icon: "depth", list: C.depth, page: pageDepth },
        { id: "underline", name: "Underline", icon: "underline", list: C.underline, page: pageUnderline },
        { id: "lowerThird", name: "Lower Third", icon: "lowerthird", list: C.lowerThird, page: pageLowerThird },
        { id: "cards", name: "Text Cards", icon: "card", list: C.cards, page: pageCards },
        { id: "transitions", name: "Transitions", icon: "transition", list: C.transitions, page: pageTransitions },
        { id: "cine", name: "Cinematic Background", icon: "flare", list: C.cinematic, page: pageCine },
        { id: "gradbg", name: "Gradient Background", icon: "gradient", list: C.gradBg, page: pageGradBg },
        { id: "wipe", name: "Wipe Reveal", icon: "wipe", list: WIPES, page: pageWipe },
        { id: "carousel", name: "Carousel", icon: "carousel", list: CARS, page: pageCarousel },
        { id: "saasbg", name: "SaaS BG", icon: "saasbg", list: SAASBG, page: pageSaasBg },
        { id: "ball", name: "Ball", icon: "ball", list: UK_BALL.LIST, page: pageBall }
    ];

    function home() {
        if (preview) { preview.stop(); preview = null; }
        titleEl.textContent = "Ultimate Kit";
        btnBack.hidden = true;
        bar.classList.add("hidden");
        view.innerHTML = "";
        var grid = h("div", { class: "home-grid" });
        CATS.forEach(function (c) {
            var t = h("div", { class: "tile", title: c.name },
                h("div", { class: "ic", html: svgIcon(c.icon) }),
                h("div", { class: "nm", text: c.name }),
                c.list ? h("div", { class: "ct", text: String(c.list.length) }) : null,
                h("div", { class: "go", html: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>' }));
            t.addEventListener("click", function () { open(c); });
            grid.appendChild(t);
        });
        view.appendChild(grid);
        STORE.last = null; save();
    }
    function open(cat) {
        if (preview) { preview.stop(); preview = null; }
        titleEl.textContent = cat.name;
        btnBack.hidden = false;
        bar.classList.remove("hidden");
        btnApply.textContent = "Apply";
        btnApply.onclick = null;
        status("");
        view.innerHTML = "";
        view.scrollTop = 0;
        cat.page(cat);
        dockPreview();
        STORE.last = cat.id; save();
    }
    /* the big preview of a page stays docked at the top (compact, sticky, one size), so it can be watched
       while the sliders below are moved                                                               */
    function dockPreview() {
        var pv = null, i;
        for (i = 0; i < view.children.length; i++) if (view.children[i].tagName === "CANVAS" && view.children[i].classList.contains("preview")) { pv = view.children[i]; break; }
        if (!pv) return;
        var wrap = h("div", { class: "pvdock", "data-size": "M" });
        view.insertBefore(wrap, pv);
        wrap.appendChild(pv);
    }
    btnBack.addEventListener("click", home);
    document.getElementById("brand").addEventListener("click", home);

    /* ------------------------------------------------------------- text */
    /* a text preset tile carried out of the panel onto a text layer in the timeline. bin/ukdrag.exe reads the timeline
       row under the mouse (layer number + name); dragHover selects that layer while it is a text layer (the row turns
       white). The pointer tells the rest, icons only: the drag icon anywhere, a green + over a text layer, a red x over
       any other layer. On release over a text layer the preset goes on it (no precomp, no null). */
    var dragIconCss = null;
    function dragIcon() {           // the same drag pointer as the helper's, for while the mouse is still over the panel
        if (dragIconCss) return dragIconCss;
        var c = document.createElement("canvas"); c.width = c.height = 32;
        var g = c.getContext("2d"), pts = [[1, 1], [1, 22], [6, 17], [10, 26], [13, 25], [9, 16], [16, 16]];
        g.beginPath(); pts.forEach(function (q, i) { if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath();
        g.fillStyle = "#fff"; g.fill(); g.lineWidth = 1.3; g.strokeStyle = "#000"; g.stroke();
        g.beginPath(); g.arc(24, 24, 8.3, 0, Math.PI * 2); g.fillStyle = "rgba(20,20,24,0.9)"; g.fill();
        g.beginPath(); g.arc(24, 24, 7.5, 0, Math.PI * 2); g.fillStyle = "#7C5CFF"; g.fill();
        g.strokeStyle = "#fff"; g.lineWidth = 1.7; g.lineCap = "round";
        g.beginPath(); g.moveTo(24, 20); g.lineTo(24, 25.2); g.moveTo(21.6, 22.8); g.lineTo(24, 25.2); g.lineTo(26.4, 22.8); g.moveTo(20, 27.6); g.lineTo(28, 27.6); g.stroke();
        return (dragIconCss = "url(" + c.toDataURL() + ") 1 1, copy");
    }
    function carryText(cat, p, args, tile) {
        var P = window.cep && window.cep.process;
        if (!CEP || !P || !/^win/i.test(navigator.platform)) { status("Drag & drop needs After Effects on Windows", "err"); return null; }
        var r = P.createProcess(extDir() + "/bin/ukdrag.exe", "carry"), pid = r && r.data;
        if (!pid || r.err) { status("Drag & drop helper did not start", "err"); return null; }
        var cur = { state: "none" }, seq = 0, done = false, buf = "", lastLine = "", shown = "";
        var send = function (t) { try { P.stdin(pid, t + "\n"); } catch (e) { } };
        var pointer = function (k) { if (k !== shown) { shown = k; send(k); } };   // "drop" | "ok" | "no"
        document.documentElement.style.cursor = tile.style.cursor = dragIcon();
        call("dragBegin", {});
        var hover = function (line) {
            var my = ++seq, bar = line.indexOf("|"), head = line.substr(0, bar), words = line.substr(bar + 1), n = 0;
            if (head === "none") {
                var had = cur.state === "text";
                cur = { state: "none" };
                pointer("drop");
                if (had) call("dragHover", {});   // the layer it just left is no longer highlighted
                return;
            }
            if (head.indexOf("row ") === 0) n = parseInt(head.substr(4), 10) || 0;
            call("dragHover", { n: n, words: words }).then(function (res) {
                if (done || my !== seq || !res.ok) return;
                cur = res.data || { state: "none" };
                pointer(cur.state === "text" ? "ok" : (cur.state === "nottext" ? "no" : "drop"));
            });
        };
        var read = function () {   // CEP hands over one chunk per registered callback: register again after each
            P.stdout(pid, function (out) {
                buf += out;
                var parts = buf.split(/\r?\n/); buf = parts.pop();
                parts.forEach(function (ln) {
                    if (!ln || done) return;
                    if (ln === "up") { api.drop(); return; }          // the button was released outside the panel
                    if (ln === "esc") { api.cancel(); return; }
                    if (ln !== lastLine) { lastLine = ln; hover(ln); }
                });
                if (!done) setTimeout(read, 0);
            });
        };
        read();
        var finish = function () { done = true; send("quit"); document.documentElement.style.cursor = ""; tile.style.cursor = ""; };
        var api = {
            drop: function () {
                if (done) return;
                var st = cur; finish();
                if (st.state === "text") {
                    var go = function (a) {
                        a.idx = st.idx;
                        run("dragDrop", a, function (d) { return d.where === "nottext" ? "Drop it on a text layer" : "Animated: " + (d.layers || []).join(", "); });
                    };
                    if (p.custom) {
                        var mp = MY.list(cat.id).filter(function (x) { return x.id === p.id; })[0];
                        if (mp) MY.read(cat.id, mp).then(function (data) { go({ data: data }); }).catch(function (e) { status(e.message, "err"); });
                    } else go(JSON.parse(JSON.stringify(args)));
                    return;
                }
                call("dragCancel", {});
                if (st.state === "nottext") status("Only a text layer can take this animation", "err");
            },
            cancel: function () { if (done) return; finish(); call("dragCancel", {}); }
        };
        return api;
    }    function pageText(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, mode: "both", inDur: 1.0, outDur: 0.8, hold: 2, text: "", accent: "#7C5CFF" });
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var outRow, accRow;
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKTextPrev.Player(cv);
        preview = player;
        if (st.useAccent === undefined) st.useAccent = true;
        var acc = function () { return st.useAccent ? st.accent : "#FFFFFF"; };   // colour off: the text keeps its own colour
        var opts = function () { return { mode: st.mode, inDur: st.inDur, outDur: st.outDur, hold: Math.min(1.5, st.hold), accent: acc(), text: st.text, maxW: 640 }; };
        var selSpec = function () { return C.find(cat.list, st.sel) || cat.list[0]; };
        player.set(selSpec(), opts());
        view.appendChild(cv);
        var upd = function () { save(); player.set(null, opts()); };
        view.appendChild(section("Animation",
            h("div", { class: "card" },
                row("Play", seg([["in", "In"], ["out", "Out"], ["both", "In + Out"]], st.mode, function (v) { st.mode = v; outRow.style.display = v === "in" ? "none" : ""; upd(); player.restart(); })),
                row("In time", slider(0.2, 3, 0.05, st.inDur, "s", function (v) { st.inDur = v; upd(); })),
                (outRow = row("Out time", slider(0.2, 3, 0.05, st.outDur, "s", function (v) { st.outDur = v; upd(); }))),
                (accRow = row("Accent", h("div", { class: "row grow", style: "gap:10px;min-height:0" },
                    swatch(st.accent, function (v) { st.accent = v; upd(); lib.rebuild(); }, "Accent colour (highlights, caret, colour sweep)"),
                    toggle(st.useAccent, function (v) { st.useAccent = v; upd(); lib.rebuild(); })))),
                row("New text", (function () { var i = h("input", { type: "text", value: st.text, placeholder: "used only for a new layer" }); i.addEventListener("input", function () { st.text = i.value; upd(); }); return i; })())
            )));
        if (st.mode === "in") outRow.style.display = "none";
        // the colour row only for presets that colour the text (a white-only preset has nothing to switch)
        var showAcc = function (p) { accRow.style.display = (p && (p.custom || p.accent)) ? "" : "none"; };
        showAcc(isMine(st.sel) ? { custom: true } : selSpec());
        var lib = library(cat, st, {
            draw: function (c, p) { UKTextPrev.draw(c, p, (p.loop ? 0.6 : st.inDur * 0.98 + 0.05), { mode: "in", inDur: 1, outDur: 0.8, hold: 1, accent: acc(), maxW: 260 }); },
            anim: function (c, p, t) { UKTextPrev.draw(c, p, t, { mode: st.mode, inDur: st.inDur, outDur: st.outDur, hold: 0.8, accent: acc(), maxW: 260 }); },
            onPick: function (p) { showAcc(p); if (!p.custom) { player.set(p, opts()); player.restart(); } },
            onCarry: function (p, tile) { return carryText(cat, p, { id: p.id, mode: st.mode, inDur: st.inDur, outDur: st.outDur, hold: st.hold, accent: st.accent, noAccent: !st.useAccent }, tile); },
            onHover: function (p) { player.set(p && !p.custom ? p : selSpec(), opts()); }
        });
        view.appendChild(section("Presets", lib));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("text", { id: st.sel, mode: st.mode, inDur: st.inDur, outDur: st.outDur, hold: st.hold, text: st.text, accent: st.accent, noAccent: !st.useAccent },
                function (d) { return "Animated: " + (d.layers || []).join(", "); }, btnApply);
        });
    }

    /* -------------------------------------------------------- underline */
    function pageUnderline(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, mode: "in", dur: 0.8, outDur: 0.6, color: "#8B7CFF" });
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKULPrev.Player(cv);
        preview = player;
        var opts = function () { return { mode: st.mode, dur: st.dur, outDur: st.outDur, color: st.color, maxW: 640 }; };
        var selSpec = function () { return C.find(cat.list, st.sel) || cat.list[0]; };
        player.set(selSpec(), opts());
        view.appendChild(cv);
        var outRow, upd = function () { save(); player.set(null, opts()); };
        view.appendChild(section("Stroke", h("div", { class: "card" },
            row("Play", seg([["in", "Draw on"], ["both", "Draw on + off"]], st.mode, function (v) { st.mode = v; outRow.style.display = v === "both" ? "" : "none"; upd(); player.restart(); })),
            row("Draw time", slider(0.2, 3, 0.05, st.dur, "s", function (v) { st.dur = v; upd(); })),
            (outRow = row("Off time", slider(0.2, 3, 0.05, st.outDur, "s", function (v) { st.outDur = v; upd(); }))),
            row("Color", swatch(st.color, function (v) { st.color = v; upd(); })))));
        if (st.mode !== "both") outRow.style.display = "none";
        view.appendChild(section("Presets", library(cat, st, {
            draw: function (c, p) { UKULPrev.draw(c, p, st.dur * 1.05 + 0.05, { mode: "in", dur: st.dur, color: st.color, maxW: 260 }); },
            anim: function (c, p, t) { UKULPrev.draw(c, p, t, { mode: st.mode, dur: st.dur, outDur: st.outDur, color: st.color, maxW: 260 }); },
            onPick: function (p) { if (!p.custom) { player.set(p, opts()); player.restart(); } },
            onHover: function (p) { player.set(p && !p.custom ? p : selSpec(), opts()); }
        })));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("underline", { id: st.sel, mode: st.mode, dur: st.dur, outDur: st.outDur, color: st.color }, function (d) { return "Added " + (d.layers || []).join(", "); }, btnApply);
        });
    }

    /* ------------------------------------------------------ lower third */
    function pageLowerThird(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, mode: "both", inDur: 1.2, hold: 3, outDur: 0.9, name: "Alex Morgan", title: "Creative Director", accent: "#7C5CFF", colors: null, colorsFor: "" });
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var reset = function () { var d = UK_LT.colors(find(st.sel)); st.colors = { name: d.name, title: d.title, plate: d.plate }; st.colorsFor = st.sel; };
        if (!st.colors || st.colorsFor !== st.sel) reset();
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKLTPrev.Player(cv);
        preview = player;
        var cols = function () { return { name: st.colors.name, title: st.colors.title, plate: st.colors.plate, accent: st.accent }; };
        // tiles show every preset in its own colours (the selected one in the edited colours)
        var own = function (p) { if (p.id === st.sel) return cols(); var d = UK_LT.colors(p); return { name: d.name, title: d.title, plate: d.plate, accent: st.accent }; };
        var opts = function () { return { mode: st.mode, inDur: st.inDur, hold: Math.min(1.6, st.hold), outDur: st.outDur, name: st.name, title: st.title, colors: cols(), zoom: 1.5, maxW: 640 }; };
        player.set(find(st.sel), opts());
        view.appendChild(cv);
        var outRow, upd = function () { save(); player.set(null, opts()); };
        var input = function (k, ph) { var i = h("input", { type: "text", value: st[k], placeholder: ph }); i.addEventListener("input", function () { st[k] = i.value; upd(); }); return i; };
        var sw = {};
        var swRow = h("div", { class: "row grow", style: "gap:5px;min-height:0;flex-wrap:wrap" },
            (sw.name = swatch(st.colors.name, function (v) { st.colors.name = v; upd(); }, "Name")),
            (sw.title = swatch(st.colors.title, function (v) { st.colors.title = v; upd(); }, "Title")),
            swatch(st.accent, function (v) { st.accent = v; upd(); }, "Accent"),
            (sw.plate = swatch(st.colors.plate, function (v) { st.colors.plate = v; upd(); }, "Plate")));
        view.appendChild(section("Text", h("div", { class: "card" },
            row("Name", input("name", "Name Surname")),
            row("Title", input("title", "Profession")))));
        view.appendChild(section("Animation", h("div", { class: "card" },
            row("Play", seg([["in", "In"], ["both", "In + Out"]], st.mode, function (v) { st.mode = v; outRow.style.display = v === "both" ? "" : "none"; upd(); player.restart(); })),
            row("In time", slider(0.4, 3, 0.05, st.inDur, "s", function (v) { st.inDur = v; upd(); })),
            row("Hold", slider(0, 15, 0.5, st.hold, "s", function (v) { st.hold = v; upd(); })),
            (outRow = row("Out time", slider(0.3, 3, 0.05, st.outDur, "s", function (v) { st.outDur = v; upd(); }))),
            row("Colors", swRow))));
        if (st.mode !== "both") outRow.style.display = "none";
        view.appendChild(section("Presets", library(cat, st, {
            draw: function (c, p) { UKLTPrev.draw(c, p, st.inDur + 0.4, { mode: "in", inDur: st.inDur, hold: 2, name: st.name, title: st.title, colors: own(p), zoom: 2.1, maxW: 260 }); },
            anim: function (c, p, t) { UKLTPrev.draw(c, p, t, { mode: "both", inDur: st.inDur, hold: 1, outDur: st.outDur, name: st.name, title: st.title, colors: own(p), zoom: 2.1, maxW: 260 }); },
            onPick: function (p) { if (p.custom) return; reset(); sw.name.set(st.colors.name); sw.title.set(st.colors.title); sw.plate.set(st.colors.plate); upd(); player.set(p, opts()); player.restart(); },
            onHover: function (p) { player.set(p && !p.custom ? p : find(st.sel), p && !p.custom ? (function () { var o = opts(); o.colors = own(p); return o; })() : opts()); }
        })));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("lowerThird", { id: st.sel, mode: st.mode, inDur: st.inDur, hold: st.hold, outDur: st.outDur, name: st.name, title: st.title, colors: cols() },
                function (d) { return "Added " + d.name; }, btnApply);
        });
    }

    /* ------------------------------------------------------ transitions */
    function pageTransitions(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, dur: 1.2, c1: "#FFC400", c2: "#FFFFFF", c3: "#141416" });
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKTRPrev.Player(cv);
        preview = player;
        var cols = function () { return { c1: st.c1, c2: st.c2, c3: st.c3 }; };
        var opts = function () { return { dur: st.dur, colors: cols(), maxW: 640 }; };
        player.set(find(st.sel), opts());
        view.appendChild(cv);
        var upd = function () { save(); player.set(null, opts()); };
        view.appendChild(section("Transition", h("div", { class: "card" },
            row("Duration", slider(0.4, 10, 0.05, st.dur, "s", function (v) { st.dur = v; upd(); })),
            row("Colors", h("div", { class: "row grow", style: "gap:5px;min-height:0;flex-wrap:wrap" },
                swatch(st.c1, function (v) { st.c1 = v; upd(); }, "Main"),
                swatch(st.c2, function (v) { st.c2 = v; upd(); }, "Line"),
                swatch(st.c3, function (v) { st.c3 = v; upd(); }, "Dark"))))));
        view.appendChild(section("Presets", library(cat, st, {
            draw: function (c, p) { UKTRPrev.draw(c, p, 0, { dur: st.dur, colors: cols(), thumb: true, maxW: 260 }); },
            anim: function (c, p, t) { UKTRPrev.draw(c, p, t, { dur: st.dur, colors: cols(), maxW: 260 }); },
            onPick: function (p) { if (!p.custom) { player.set(p, opts()); player.restart(); } },
            onHover: function (p) { player.set(p && !p.custom ? p : find(st.sel), opts()); }
        })));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("transition", { id: st.sel, dur: st.dur, colors: cols() }, function (d) { return "Added " + d.name; }, btnApply);
        });
    }

    /* ----------------------------------------------------- depth reveal */
    function pageDepth(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, mode: "reveal", dir: "far", dur: 1.65, softness: 100, c0: null, c1: null, colorsFor: "", v: 2 });
        if (st.v !== 2) { st.v = 2; st.dir = "far"; st.dur = 1.65; st.softness = 100; }
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var reset = function () { var p = find(st.sel); st.c0 = p.colors ? p.colors[0] : null; st.c1 = p.colors && p.colors[1] ? p.colors[1] : null; st.colorsFor = st.sel; };
        if (st.colorsFor !== st.sel) reset();
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKDepthPrev.Player(cv);
        preview = player;
        var cols = function () { return [st.c0, st.c1]; };
        var opts = function () { return { dur: st.dur, softness: st.softness, mode: st.mode, dir: st.dir, colors: cols(), maxW: 640 }; };
        player.set(find(st.sel), opts());
        view.appendChild(cv);
        var upd = function () { save(); player.set(null, opts()); };
        var sw0 = swatch(st.c0 || "#FFFFFF", function (v) { st.c0 = v; upd(); }, "Colour 1"), sw1 = swatch(st.c1 || "#FFFFFF", function (v) { st.c1 = v; upd(); }, "Colour 2");
        var colRow = row("Colors", h("div", { class: "row grow", style: "gap:5px;min-height:0" }, sw0, sw1));
        var showCols = function () { var p = find(st.sel); colRow.style.display = p.colors ? "" : "none"; sw1.style.display = p.colors && p.colors[1] ? "" : "none"; if (st.c0) sw0.set(st.c0); if (st.c1) sw1.set(st.c1); };
        var softSl = slider(0, 100, 1, st.softness, "%", function (v) { st.softness = v; upd(); });
        var setSoft = function (v) { var inp = softSl.querySelector("input"); inp.value = v; inp.dispatchEvent(new Event("input")); };
        view.appendChild(section("Depth Reveal", h("div", { class: "card" },
            row("Play", seg([["reveal", "Reveal"], ["cover", "Cover"]], st.mode, function (v) { st.mode = v; upd(); player.restart(); })),
            row("Order", seg([["far", "Far first"], ["near", "Near first"]], st.dir, function (v) { st.dir = v; upd(); player.restart(); })),
            row("Duration", slider(0.5, 10, 0.05, st.dur, "s", function (v) { st.dur = v; upd(); })),
            row("Softness", softSl),
            colRow)));
        showCols();
        view.appendChild(section("Looks", library(cat, st, {
            draw: function (c, p) { UKDepthPrev.draw(c, p, 0, { dur: st.dur, softness: p.id === st.sel ? st.softness : p.soft, mode: st.mode, dir: st.dir, colors: p.id === st.sel ? cols() : p.colors, thumb: true, maxW: 260 }); },
            anim: function (c, p, t) { UKDepthPrev.draw(c, p, t, { dur: st.dur, softness: p.id === st.sel ? st.softness : p.soft, mode: st.mode, dir: st.dir, colors: p.id === st.sel ? cols() : p.colors, maxW: 260 }); },
            onPick: function (p) { if (p.custom) return; reset(); showCols(); setSoft(p.soft); upd(); player.set(p, opts()); player.restart(); },
            onHover: function (p) { player.set(p && !p.custom ? p : find(st.sel), opts()); }
        })));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            depthRun({ id: st.sel, mode: st.mode, dir: st.dir, dur: st.dur, softness: st.softness, colors: find(st.sel).colors ? cols() : null });
        });
    }    /* depth: the selected layer's picture -> depth map (js/depth.js, here in the panel) -> saved PNG -> AE */
    function waitFile(path, ms) {
        return new Promise(function (ok, no) {
            var t0 = Date.now(), last = -1;
            (function poll() {
                var r = fs.readFile(path, window.cep.encoding.Base64), n = (!r.err && r.data) ? r.data.length : -1;
                if (n > 0 && n === last) { ok(); return; }
                last = n;
                if (Date.now() - t0 > ms) { no(new Error("After Effects did not render the frame in time.")); return; }
                setTimeout(poll, 400);
            })();
        });
    }
    function loadImg(url) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { no(new Error("Could not read the picture.")); }; i.src = url; }); }
    function depthRun(args) {
        if (!CEP || !fs) { status("Depth Reveal works inside After Effects.", "err"); return; }
        var P = null, t0 = Date.now();
        btnApply.classList.add("busy");
        status("Reading the layer...");
        call("depthPrepare", {}).then(function (r) {
            if (!r.ok) throw new Error(r.error);
            P = r.data;
            // the same still again: its depth map is reused
            STORE.depthCache = STORE.depthCache || {};
            var st0 = P.render ? null : fs.stat(P.image), key = P.image + "|" + (st0 && !st0.err && st0.data ? st0.data.mtime : "");
            var hit = !P.render && STORE.depthCache[key];
            if (hit && !fs.stat(hit).err) { P.out = hit; return null; }
            return waitFile(P.image, P.render ? 30000 : 2000).then(function () {
                status("Measuring depth...");
                return readDataURL(P.image);
            }).then(loadImg).then(function (img) {
                return UKDepth.estimate(img, {});
            }).then(function (map) {
                var w = fs.writeFile(P.out, map.toDataURL("image/png").split(",")[1], window.cep.encoding.Base64);
                if (w.err) throw new Error("Could not save the depth map: " + P.out);
                if (!P.render) { STORE.depthCache[key] = P.out; save(); }
            });
        }).then(function () {
            status("Building...");
            var a = { comp: P.comp, layer: P.layer, name: P.name, render: P.render, depth: P.out };
            for (var k in args) a[k] = args[k];
            return call("depthApply", a);
        }).then(function (r) {
            btnApply.classList.remove("busy");
            if (!r.ok) { status(r.error, "err"); return; }
            status("Depth Reveal on " + P.name + " (" + ((Date.now() - t0) / 1000).toFixed(1) + " s, " + UKDepth.info().threads + " threads)", "ok");
        }).catch(function (e) {
            btnApply.classList.remove("busy");
            if (P && P.render) call("depthCancel", { render: P.render });
            status(e && e.message ? e.message : String(e), "err");
        });
    }

    /* ------------------------------------------------------ wipe reveal */
    function pageWipe(cat) {
        var st = state(cat.id, { sel: "wr01", dir: "90", dur: 1.33, c1: "#B67CFF", c2: "#8E33FF", glow: true, colorsFor: "wr01" });
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKWipePrev.Player(cv);
        preview = player;
        var dirOf = function (p) { return p.look === "color" && st.dir === "radial" ? "90" : st.dir; };
        var optsFor = function (p, own) {
            var d = dirOf(p), mine = own || p.id === st.sel;
            return { look: p.look, dur: mine ? st.dur : p.dur, angle: d === "radial" ? 90 : Number(d), radial: d === "radial", c1: mine ? st.c1 : p.c1, c2: mine ? st.c2 : p.c2, glow: st.glow };
        };
        var opts = function () { return optsFor(find(st.sel), true); };
        player.set(opts());
        view.appendChild(cv);
        var upd = function () { save(); player.set(opts()); lib.rebuild(); };
        var sw1 = swatch(st.c1, function (v) { st.c1 = v; upd(); }, "Color 1"), sw2 = swatch(st.c2, function (v) { st.c2 = v; upd(); }, "Color 2");
        var durSl = slider(0.3, 5, 0.01, st.dur, "s", function (v) { st.dur = v; upd(); });
        var setDur = function (v) { var inp = durSl.querySelector("input"); inp.value = v; inp.dispatchEvent(new Event("input")); };
        var dirSeg = seg([["90", "→", "Left to right"], ["270", "←", "Right to left"], ["180", "↓", "Top to bottom"], ["0", "↑", "Bottom to top"], ["radial", "◎", "Radial, from the centre"]], st.dir, function (v) { st.dir = v; upd(); player.restart(); });
        var glowRow = row("Deep Glow 2", toggle(st.glow, function (v) { st.glow = v; upd(); }));
        var showFor = function () {
            var p = find(st.sel);
            glowRow.style.display = p.look !== "color" ? "" : "none";
            dirSeg.lastChild.style.display = p.look !== "color" ? "" : "none";     // Color Wipe is linear only
        };
        view.appendChild(section("Wipe Reveal", h("div", { class: "card" },
            row("Direction", dirSeg),
            row("Duration", durSl),
            row("Colors", h("div", { class: "row grow", style: "gap:5px;min-height:0" }, sw1, sw2)),
            glowRow)));
        showFor();
        var lib = library(cat, st, {
            draw: function (c, p) { var o = optsFor(p); o.thumb = true; o.maxW = 260; UKWipePrev.draw(c, 0, o); },
            anim: function (c, p, t) { var o = optsFor(p); o.maxW = 260; UKWipePrev.draw(c, t, o); },
            onPick: function (p) {
                if (p.custom) return;
                st.c1 = p.c1; st.c2 = p.c2; st.colorsFor = p.id; sw1.set(p.c1); sw2.set(p.c2);
                showFor(); setDur(p.dur); upd(); player.restart();
            },
            onHover: function (p) { player.set(p && !p.custom ? optsFor(p) : opts()); }
        });
        view.appendChild(section("Looks", lib));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            var o = opts();
            run("wipeReveal", { id: st.sel, dur: o.dur, angle: o.angle, radial: o.radial, c1: o.c1, c2: o.c2, glow: o.glow },
                function (d) { return find(st.sel).name + ": " + d.name + " (" + d.controls + ")" + (o.look !== "color" && st.glow && !d.glow ? (o.look === "pixel" ? " - Deep Glow 2 is not installed, added without glow" : " - Deep Glow 2 is not installed, AE Glow used") : ""); }, btnApply);
        });
    }

    /* --------------------------------------------------------- carousel */
    function pageCarousel(cat) {
        var carDraw = function (p) { return p.look === "path" ? UKCarPrev.drawPath : (p.look === "spin" ? UKCarPrev.drawSpin : (p.look === "cardspin" ? UKCarPrev.drawCardSpin : (p.look === "burst" ? UKCarPrev.drawBurst : UKCarPrev.draw))); };
        var st = state(cat.id, { sel: "cr01", radius: 50.8, start: 348, tiltX: 82, tiltY: 50, spin: 0, size: 41.6 });
        var dflt = { sel: "cr01", shape: "scurve", mode: "3d", pdur: 3.63, spacing: 0, psize: 22, align: 0, rotY: 0, sSpeed: 30, sRadius: 36, sSize: 22, sRatio: 62, sCorner: 14, sUpright: true };
        for (var dk in dflt) if (st[dk] === undefined) st[dk] = dflt[dk];
        if (!st.cs || st.cs.warp === undefined || st.cs.v !== 3) { st.cs = {}; for (var ck in UK_CSPIN.DEF) st.cs[ck] = UK_CSPIN.DEF[ck]; st.cs.v = 3; }
        if (!st.bs || st.bs.v !== 1) { st.bs = {}; for (var bk in UK_BURST.DEF) st.bs[bk] = UK_BURST.DEF[bk]; st.bs.v = 1; }
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKCarPrev.Player(cv);
        preview = player;
        var optsFor = function (p) {
            if (p.look === "spin") return { look: "spin", speed: st.sSpeed, radius: st.sRadius, size: st.sSize, ratio: st.sRatio, corner: st.sCorner, upright: st.sUpright };
            if (p.look === "burst") { var ob = { look: "burst" }; for (var kb in st.bs) ob[kb] = st.bs[kb]; return ob; }
            if (p.look === "cardspin") { var oc = { look: "cardspin" }; for (var kc in st.cs) oc[kc] = st.cs[kc]; return oc; }
            return p.look === "path" ? { look: "path", shape: st.shape, mode: st.mode, dur: st.pdur, spacing: st.spacing, size: st.psize, align: st.align, rotY: st.rotY }
                : { look: "ring", radius: st.radius, start: st.start, tiltX: st.tiltX, tiltY: st.tiltY, spin: st.spin, size: st.size };
        };
        var opts = function () { var o = optsFor(find(st.sel)); o.maxW = 640; return o; };
        player.set(opts());
        view.appendChild(cv);
        var set = function (k) { return function (v) { st[k] = v; save(); player.set(opts()); }; };
        var ringCard = h("div", { class: "card" },
            row("Radius", slider(5, 150, 0.1, st.radius, "%", set("radius"))),
            row("Start Angle", slider(0, 360, 1, st.start, "°", set("start"))),
            row("Tilt X", slider(-90, 90, 1, st.tiltX, "°", set("tiltX"))),
            row("Tilt Y", slider(-180, 180, 1, st.tiltY, "°", set("tiltY"))),
            row("Spin", slider(-180, 180, 1, st.spin, "°/s", set("spin"))),
            row("Photo size", slider(5, 100, 0.1, st.size, "%", set("size"))));
        var rotRow, pathCard = h("div", { class: "card" },
            row("Path", seg([["scurve", "S-Curve"], ["line", "Line"], ["arc", "Arc"], ["wave", "Wave"], ["circle", "Circle"]], st.shape, function (v) { st.shape = v; save(); player.set(opts()); player.t = 0; })),
            row("Space", seg([["3d", "3D"], ["2d", "2D"]], st.mode, function (v) { st.mode = v; save(); rotRow.style.display = v === "2d" ? "none" : ""; player.set(opts()); player.t = 0; })),
            row("Duration", slider(0.5, 20, 0.01, st.pdur, "s", set("pdur"))),
            row("Spacing", slider(0, 50, 0.5, st.spacing, "%", set("spacing"))),
            row("Photo size", slider(5, 100, 0.5, st.psize, "%", set("psize"))),
            row("Align", slider(0, 100, 1, st.align, "%", set("align"))),
            (rotRow = row("Rotation Y", slider(-180, 180, 1, st.rotY, "\u00B0", set("rotY")))));
        var spinCard = h("div", { class: "card" },
            row("Speed", slider(-360, 360, 1, st.sSpeed, "\u00B0/s", set("sSpeed"))),
            row("Radius", slider(5, 100, 0.5, st.sRadius, "%", set("sRadius"))),
            row("Photo size", slider(5, 60, 0.5, st.sSize, "%", set("sSize"))),
            row("Card ratio", slider(20, 150, 1, st.sRatio, "%", set("sRatio"))),
            row("Corner", slider(0, 200, 1, st.sCorner, "px", set("sCorner"))),
            row("Keep upright", toggle(st.sUpright, function (v) { st.sUpright = v; save(); player.set(opts()); })));
        var cset = function (k) { return function (v) { st.cs[k] = v; save(); player.set(opts()); }; };
        var cardSpinCard = h("div", { class: "card" },
            row("Speed", slider(1, 30, 0.5, st.cs.speed, "", cset("speed"))),
            row("Motion blur", slider(0, 200, 1, st.cs.blur, "%", cset("blur"))),
            row("Warp", slider(0, 200, 1, st.cs.warp, "%", cset("warp"))),
            row("Hold", slider(0, 5, 0.05, st.cs.hold, "s", cset("hold"))),
            row("Spin up", slider(0.1, 3, 0.05, st.cs.up, "s", cset("up"))),
            row("Spin time", slider(0, 8, 0.05, st.cs.spin, "s", cset("spin"))),
            row("Stop time", slider(0.2, 4, 0.05, st.cs.stop, "s", cset("stop"))),
            row("End hold", slider(0, 5, 0.05, st.cs.endHold, "s", cset("endHold"))),
            row("Card size", slider(10, 80, 0.5, st.cs.size, "%", cset("size"))));
        var bset = function (k) { return function (v) { st.bs[k] = v; save(); player.set(opts()); }; };
        var burstCard = h("div", { class: "card" },
            row("Count", slider(0, 150, 1, st.bs.count, "", bset("count"), "Auto")),
            row("Spacing", slider(20, 300, 1, st.bs.spacing, "%", bset("spacing"))),
            row("Speed", slider(20, 300, 1, st.bs.speed, "%", bset("speed"))),
            row("Rotation", slider(0, 200, 1, st.bs.rotation, "%", bset("rotation"))),
            row("Spread", slider(20, 200, 1, st.bs.spread, "%", bset("spread"))),
            row("Card size", slider(4, 40, 0.5, st.bs.size, "%", bset("size"))),
            row("Last delay", slider(0, 3, 0.05, st.bs.lag, "s", bset("lag"))));
        var showFor = function () { var p = find(st.sel); ringCard.style.display = p.look === "ring" ? "" : "none"; pathCard.style.display = p.look === "path" ? "" : "none"; spinCard.style.display = p.look === "spin" ? "" : "none"; cardSpinCard.style.display = p.look === "cardspin" ? "" : "none"; burstCard.style.display = p.look === "burst" ? "" : "none"; };
        view.appendChild(section("Carousel", ringCard, pathCard, spinCard, cardSpinCard, burstCard));
        if (st.mode === "2d") rotRow.style.display = "none";
        showFor();
        view.appendChild(section("Looks", library(cat, st, {
            draw: function (c, p) { var o = optsFor(p); o.thumb = true; o.maxW = 260; carDraw(p)(c, 0.6, o); },
            anim: function (c, p, t) { var o = optsFor(p); o.maxW = 260; carDraw(p)(c, t, o); },
            onPick: function (p) { if (p.custom) return; showFor(); player.set(opts()); player.t = 0; },
            onHover: function (p) { var o = optsFor(p && !p.custom ? p : find(st.sel)); o.maxW = 640; player.set(o); }
        })));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            var p = find(st.sel), a = p.look === "burst" ? { id: "cr05", bs: st.bs } : p.look === "cardspin" ? { id: "cr04", cs: st.cs } : p.look === "spin" ? { id: "cr03", speed: st.sSpeed, radius: st.sRadius, size: st.sSize, ratio: st.sRatio, corner: st.sCorner, upright: st.sUpright } : p.look === "path"
                ? { id: "cr02", shape: st.shape, mode: st.mode, dur: st.pdur, spacing: st.spacing > 0 ? st.spacing : undefined, size: st.psize, align: st.align, rotY: st.rotY }
                : { id: "cr01", radius: st.radius, start: st.start, tiltX: st.tiltX, tiltY: st.tiltY, spin: st.spin, size: st.size };
            run("carousel", a, function (d) { return p.name + ": " + d.photos + " photos (" + d.name + ")"; }, btnApply);
        });
    }

    /* ----------------------------------------------------------- saas bg */
    function pageSaasBg(cat) {
        var st = state(cat.id, { sel: cat.list[0].id });
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKSaasPrev.Player(cv);
        preview = player;
        player.set(isMine(st.sel) ? cat.list[0].id : st.sel, { maxW: 640 });
        view.appendChild(cv);
        view.appendChild(section("Backgrounds", library(cat, st, {
            draw: function (c, p) { UKSaasPrev.draw(c, p.id, 0, { thumb: true, maxW: 260 }); },
            anim: function (c, p, t) { UKSaasPrev.draw(c, p.id, t, { maxW: 260 }); },
            onPick: function (p) { if (p.custom) return; player.set(p.id); player.restart(); },
            onHover: function (p) { player.set(p && !p.custom ? p.id : (isMine(st.sel) ? null : find(st.sel).id)); }
        })));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("saasBg", { id: st.sel }, function (d) { return "Added " + d.name; }, btnApply);
        });
    }

    /* -------------------------------------------------------------- ball */
    function pageBall(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, size: 50, colors: null, colorsFor: "", fx: null, fxFor: "" });
        if (!isMine(st.sel) && !UK_BALL.find(st.sel)) st.sel = cat.list[0].id;
        var find = function (id) { return UK_BALL.find(id) || cat.list[0]; };
        var own = function (p) { return p.colors.map(function (c) { return c[1]; }); };
        var ownFx = function (p) { return UKBallPrev.settings(p, {}); };
        var cur = function () { return isMine(st.sel) ? cat.list[0] : find(st.sel); };
        if (st.colorsFor !== st.sel || !st.colors || st.colors.length !== cur().colors.length) { st.colors = own(cur()); st.colorsFor = st.sel; }
        if (st.fxFor !== st.sel || !st.fx) { st.fx = ownFx(cur()); st.fxFor = st.sel; }
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKBallPrev.Player(cv);
        preview = player;
        var opts = function () { return { colors: st.colors, size: st.size, fx: st.fx, maxW: 640 }; };
        player.set(cur(), opts());
        view.appendChild(cv);
        var upd = function () { save(); player.set(null, opts()); };
        var swWrap = h("div", { class: "row grow", style: "gap:5px;min-height:0;flex-wrap:wrap" });
        function buildSwatches() {
            swWrap.innerHTML = "";
            cur().colors.forEach(function (c, k) {
                swWrap.appendChild(swatch(st.colors[k], function (v) { st.colors[k] = v; upd(); lib.rebuild(); }, c[0]));
            });
        }
        buildSwatches();
        var fxCard = h("div", { class: "card" });
        function buildFx() {
            var F = st.fx, set = function (key) { return function (v) { F[key] = v; upd(); }; };
            fxCard.innerHTML = "";
            [row("Glow", toggle(F.glow, set("glow"))),
                row("Glow intensity", slider(0, 100, 1, F.glowInt, "%", set("glowInt"))),
                row("Glow size", slider(0, 100, 1, F.glowSize, "%", set("glowSize"))),
                row("Light Sweep", toggle(F.sweep, set("sweep"))),
                row("Sweep intensity", slider(0, 100, 1, F.sweepInt, "%", set("sweepInt"))),
                row("Sweep width", slider(2, 100, 1, F.sweepWidth, "%", set("sweepWidth"))),
                row("Sweep angle", slider(-90, 90, 1, F.sweepAngle, "\u00B0", set("sweepAngle"))),
                row("Sweep time", slider(0, 5, 0.05, F.sweepTime, "s", set("sweepTime"))),
                row("Sweep pause", slider(0, 10, 0.1, F.sweepPause, "s", set("sweepPause"))),
                row("Sweep color", swatch(F.sweepColor, set("sweepColor"), "Sweep color")),
                cur().ring ? row("Stroke width", slider(1, 60, 0.5, F.stroke, "px", set("stroke"))) : null
            ].forEach(function (r) { if (r) fxCard.appendChild(r); });
        }
        buildFx();
        view.appendChild(section("Ball", h("div", { class: "card" },
            row("Size", slider(5, 100, 1, st.size, "%", function (v) { st.size = v; upd(); })),
            row("Colors", swWrap))));
        view.appendChild(section("Glow & Light Sweep", fxCard));
        var lib = library(cat, st, {
            draw: function (c, p) { UKBallPrev.draw(c, p, 0, { colors: p.id === st.sel ? st.colors : null, fx: p.id === st.sel ? st.fx : null, size: 72, maxW: 260 }); },
            anim: function (c, p, t) { UKBallPrev.draw(c, p, t, { colors: p.id === st.sel ? st.colors : null, fx: p.id === st.sel ? st.fx : null, size: 72, maxW: 260 }); },
            onPick: function (p) { if (p.custom) return; st.colors = own(p); st.colorsFor = p.id; st.fx = ownFx(p); st.fxFor = p.id; save(); buildSwatches(); buildFx(); player.set(p, opts()); player.restart(); },
            onHover: function (p) { if (p && !p.custom) player.set(p, { colors: p.id === st.sel ? st.colors : own(p), fx: p.id === st.sel ? st.fx : ownFx(p), size: st.size, maxW: 640 }); else player.set(cur(), opts()); }
        });
        view.appendChild(section("Looks", lib));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("ball", { id: st.sel, colors: st.colors, size: st.size, fx: st.fx }, function (d) { return "Added " + d.name; }, btnApply);
        });
    }

    /* ------------------------------------------------------- text cards */
    function pageCards(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, text: "", ws: 100, hs: 100, rd: null, inDur: 0.9, hold: 2.5, outDur: 0.8, accent: null, cardColor: null, textColor: null, colorsFor: "", v: 2 });
        if (!st.slot) { st.slot = {}; for (var sk in UK_SLOT.DEF) st.slot[sk] = UK_SLOT.DEF[sk]; }
        if (!st.tiles) { st.tiles = {}; for (var tk in UK_TILES.DEF) st.tiles[tk] = UK_TILES.DEF[tk]; }
        var isSlot = function (p) { return !!(p && p.kind === "slot"); }, isTiles = function (p) { return !!(p && p.kind === "tiles"); };
        var prevOf = function (p) { return isSlot(p) ? UKSlotPrev : (isTiles(p) ? UKTilesPrev : UKCardPrev); };
        if (st.v !== 2) { st.v = 2; st.colorsFor = ""; }
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var reset = function () { var p = find(st.sel), S = UK_CARD.PALS[p.pal]; st.cardColor = S.card; st.textColor = S.text; st.accent = S.accent; st.rd = Math.round(UK_CARD.SHAPES[p.shape].rd * 100); st.colorsFor = st.sel; };
        if (st.colorsFor !== st.sel || !st.cardColor || !st.accent) reset();
        var cv = h("canvas", { class: "preview cine" });
        /* the Plugin Slot card has its own preview: one player in front of both */
        var cardPlayer = new UKCardPrev.Player(cv), slotPlayer = new UKSlotPrev.Player(cv), tilesPlayer = new UKTilesPrev.Player(cv);
        var player = {
            cur: null, p: null, on: false,
            set: function (p, o) {
                if (p) this.p = p;
                var np = isSlot(this.p) ? slotPlayer : (isTiles(this.p) ? tilesPlayer : cardPlayer);
                if (np !== this.cur) { if (this.cur) this.cur.stop(); this.cur = np; if (this.on) np.start(); }
                np.set(p, o);
            },
            restart: function () { cardPlayer.restart(); slotPlayer.restart(); tilesPlayer.restart(); },
            start: function () { this.on = true; if (this.cur) this.cur.start(); },
            stop: function () { this.on = false; cardPlayer.stop(); slotPlayer.stop(); tilesPlayer.stop(); }
        };
        preview = player;
        var opts = function (p) {
            var mine = !p || p.id === st.sel, S = p ? UK_CARD.PALS[p.pal] : null;
            return { text: st.text, ws: st.ws, hs: st.hs, rd: mine ? st.rd : null, inDur: st.inDur, hold: Math.min(1.6, st.hold), outDur: st.outDur, accent: mine ? st.accent : S.accent,
                cardColor: mine ? st.cardColor : S.card, textColor: mine ? st.textColor : S.text, slot: st.slot, tiles: st.tiles, maxW: 640 };
        };
        player.set(find(st.sel), opts());
        view.appendChild(cv);
        var upd = function () { save(); player.set(null, opts()); };
        var ta = h("textarea", { rows: "3", placeholder: "Your word, list item or text (Enter = new line). Empty = the preset's example" });
        ta.value = st.text;
        ta.addEventListener("input", function () { st.text = ta.value; upd(); });
        var rdS, swC, swT, swA;
        var textSec = section("Text", h("div", { class: "card" }, ta));
        view.appendChild(textSec);
        var S2 = st.slot, sset = function (key) { return function (v) { S2[key] = v; upd(); lib.rebuild(); }; };
        var slotSec = section("Plugin Slot", h("div", { class: "card" },
            row("Icon", toggle(S2.showIcon !== false, sset("showIcon")), seg(UK_SLOT.ICONS.map(function (ic, i) { return [String(i + 1), ic.name]; }), String(S2.icon), function (v) { S2.icon = Number(v); upd(); lib.rebuild(); })),
            row("Fill", swatch(S2.fill, sset("fill"), "Fill")),
            row("Stroke", swatch(S2.stroke, sset("stroke"), "Stroke")),
            row("Stroke width", slider(0, 20, 0.5, S2.sw, "px", sset("sw"))),
            row("Corner", slider(0, 60, 1, S2.corner, "px", sset("corner"))),
            row("Height", slider(40, 200, 1, S2.height, "px", sset("height"))),
            row("Dot", toggle(S2.showDot !== false, sset("showDot")), swatch(S2.dot, sset("dot"), "Dot")),
            row("Icon color", swatch(S2.iconColor, sset("iconColor"), "Icon")),
            row("Text color", swatch(S2.text, sset("text"), "Text"))));
        view.appendChild(slotSec);
        /* Number Tiles: how many (typed), the layout and the colours */
        var T2 = st.tiles, tset = function (key) { return function (v) { T2[key] = v; upd(); lib.rebuild(); }; };
        var cnt = h("input", { type: "number", min: "1", max: "200", step: "1", value: String(T2.count) });
        cnt.addEventListener("input", function () { var v = Math.round(Number(cnt.value)); if (v >= 1 && v <= 200) { T2.count = v; upd(); lib.rebuild(); } });
        var tilesSec = section("Number Tiles", h("div", { class: "card" },
            row("Count", cnt),
            row("Per row", slider(0, 30, 1, T2.perRow, "", tset("perRow"), "Auto")),
            row("Tile size", slider(40, 400, 1, T2.size, "px", tset("size"))),
            row("Gap", slider(0, 80, 1, T2.gap, "px", tset("gap"))),
            row("Corner", slider(0, 60, 1, T2.corner, "px", tset("corner"))),
            row("Delay", slider(0, 15, 1, T2.delay, "fr", tset("delay"))),
            row("Glow", slider(0, 100, 1, T2.glowAmt, "%", tset("glowAmt"))),
            row("Colors", h("div", { class: "row grow", style: "gap:5px;min-height:0;flex-wrap:wrap" },
                swatch(T2.tile, tset("tile"), "Tile"), swatch(T2.hot, tset("hot"), "Highlight"),
                swatch(T2.glow, tset("glow"), "Glow"), swatch(T2.number, tset("number"), "Number")))));
        view.appendChild(tilesSec);
        var cardSec = section("Card", h("div", { class: "card" },
            row("Width", slider(40, 250, 1, st.ws, "%", function (v) { st.ws = v; upd(); })),
            row("Height", slider(40, 250, 1, st.hs, "%", function (v) { st.hs = v; upd(); })),
            (rdS = row("Roundness", slider(0, 100, 1, st.rd, "%", function (v) { st.rd = v; upd(); }))),
            row("Colors", h("div", { class: "row grow", style: "gap:5px;min-height:0;flex-wrap:wrap" },
                (swC = swatch(st.cardColor, function (v) { st.cardColor = v; upd(); }, "Card")),
                (swT = swatch(st.textColor, function (v) { st.textColor = v; upd(); }, "Text")),
                (swA = swatch(st.accent, function (v) { st.accent = v; upd(); }, "Accent / light"))))));
        view.appendChild(cardSec);
        var showFor = function () {
            var p0 = isMine(st.sel) ? null : find(st.sel), sl = isSlot(p0), tl = isTiles(p0);
            slotSec.style.display = sl ? "" : "none"; tilesSec.style.display = tl ? "" : "none";
            cardSec.style.display = sl || tl ? "none" : ""; textSec.style.display = tl ? "none" : "";
        };
        showFor();
        view.appendChild(section("Animation", h("div", { class: "card" },
            row("In time", slider(0.3, 3, 0.05, st.inDur, "s", function (v) { st.inDur = v; upd(); })),
            row("Hold", slider(0, 20, 0.5, st.hold, "s", function (v) { st.hold = v; upd(); })),
            row("Out time", slider(0.3, 3, 0.05, st.outDur, "s", function (v) { st.outDur = v; upd(); })))));
        var lib = library(cat, st, {
            draw: function (c, p) { var o = opts(p); o.thumb = true; o.maxW = 260; prevOf(p).draw(c, p, 0, o); },
            anim: function (c, p, t) { var o = opts(p); o.maxW = 260; o.hold = 0.8; prevOf(p).draw(c, p, t, o); },
            onPick: function (p) {
                if (p.custom) return;
                reset(); showFor();
                swC.set(st.cardColor); swT.set(st.textColor); swA.set(st.accent);
                var nr = row("Roundness", slider(0, 100, 1, st.rd, "%", function (v) { st.rd = v; upd(); }));
                rdS.parentNode.replaceChild(nr, rdS); rdS = nr;
                upd(); player.set(p, opts()); player.restart();
            },
            onHover: function (p) { player.set(p && !p.custom ? p : find(st.sel), p && !p.custom ? opts(p) : opts()); }
        });
        view.appendChild(section("Presets", lib));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("card", { id: st.sel, text: st.text, ws: st.ws, hs: st.hs, rd: st.rd, inDur: st.inDur, hold: st.hold, outDur: st.outDur, accent: st.accent, cardColor: st.cardColor, textColor: st.textColor, slot: st.slot, tiles: st.tiles },
                function (d) { return "Added " + d.name; }, btnApply);
        });
    }

    /* ------------------------------------------------------- backgrounds */
    function pageCine(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, full: true, duration: 10, speed: 100, softness: 100, grain: 16, custom: false, colors: null });
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var palOf = function (id) { return C.cinePal[find(id).pal].slice(); };
        if (!st.colors || st.colors.length !== 5) st.colors = palOf(st.sel);
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKCine.Player(cv);
        preview = player;
        var opts = function () { return { speed: st.speed, softness: st.softness, grain: st.grain, colors: st.colors }; };
        player.set(find(st.sel), opts());
        view.appendChild(cv);
        var sw = [];
        var labels = ["Shadows", "Darks", "Midtones", "Brights", "Highlights"];
        for (var i = 0; i < 5; i++) (function (k) {
            sw.push(swatch(st.colors[k], function (v) { st.colors[k] = v; save(); player.set(null, opts()); }, labels[k]));
        })(i);
        view.appendChild(section("Options", h("div", { class: "card" },
            row("Duration", slider(1, 120, 0.5, st.duration, "s", function (v) { st.duration = v; save(); })),
            row("Speed", slider(10, 300, 5, st.speed, "%", function (v) { st.speed = v; save(); player.set(null, opts()); })),
            row("Softness", slider(20, 250, 5, st.softness, "%", function (v) { st.softness = v; save(); player.set(null, opts()); })),
            row("Grain", slider(0, 40, 1, st.grain, "%", function (v) { st.grain = v; save(); player.set(null, opts()); })),
            row("Colors", h("div", { class: "row grow", style: "gap:5px;min-height:0" }, sw)))));
        view.appendChild(section("Presets", library(cat, st, {
            draw: function (c, p) { UKCine.draw(c, p, 0.3, { maxW: 200 }); },
            onPick: function (p) { if (p.custom) return; st.colors = palOf(p.id); sw.forEach(function (s, k) { s.set(st.colors[k]); }); save(); player.set(p, opts()); },
            onHover: function (p) { player.set(p && !p.custom ? p : find(st.sel), p && !p.custom ? { speed: st.speed, softness: st.softness, grain: st.grain, colors: C.cinePal[p.pal].slice() } : opts()); }
        })));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("cinematic", { id: st.sel, fullComp: false, duration: st.duration, speed: st.speed, softness: st.softness, grain: st.grain, colors: st.colors },
                function (d) { return "Added " + d.name + " (loop " + d.loop + " s)"; }, btnApply);
        });
    }
    function pageGradBg(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, full: true, duration: 10, grain: 6, custom: false, bg: null, colors: null });
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var reset = function () { var p = find(st.sel); st.bg = p.bg; st.colors = p.colors.slice(); };
        if (!st.colors || !st.bg || st.colors.length !== find(st.sel).colors.length) reset();
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKGrad.Player(cv);
        preview = player;
        var opts = function () { return { grain: st.grain, bg: st.bg, colors: st.colors }; };
        player.set(find(st.sel), opts());
        view.appendChild(cv);
        var swWrap = h("div", { class: "row grow", style: "gap:5px;min-height:0;flex-wrap:wrap" });
        function buildSwatches() {
            swWrap.innerHTML = "";
            swWrap.appendChild(swatch(st.bg, function (v) { st.bg = v; save(); player.set(null, opts()); }, "Background"));
            st.colors.forEach(function (c, k) {
                swWrap.appendChild(swatch(c, function (v) { st.colors[k] = v; save(); player.set(null, opts()); }, "Color " + (k + 1)));
            });
        }
        buildSwatches();
        view.appendChild(section("Options", h("div", { class: "card" },
            row("Duration", slider(1, 120, 0.5, st.duration, "s", function (v) { st.duration = v; save(); })),
            row("Grain", slider(0, 30, 1, st.grain, "%", function (v) { st.grain = v; save(); player.set(null, opts()); })),
            row("Colors", swWrap))));
        view.appendChild(section("Presets", library(cat, st, {
            draw: function (c, p) { UKGrad.draw(c, p, 2, { maxW: 200 }); },
            onPick: function (p) { if (p.custom) return; reset(); buildSwatches(); save(); player.set(p, opts()); },
            onHover: function (p) { player.set(p && !p.custom ? p : find(st.sel), p && !p.custom ? { grain: st.grain, bg: p.bg, colors: p.colors.slice() } : opts()); }
        })));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("gradientBg", { id: st.sel, fullComp: false, duration: st.duration, grain: st.grain, bg: st.bg, colors: st.colors },
                function (d) { return "Added " + d.name; }, btnApply);
        });
    }

    /* ------------------------------------------------------ hover/cursor */
    function fold(title, sub, open, body) {
        var f = h("div", { class: "fold" + (open ? " open" : "") });
        var head = h("div", { class: "head" }, h("span", { class: "chev", html: svgIcon("chevR") }), h("span", { text: title }), sub ? h("span", { class: "sub", text: sub }) : null);
        head.addEventListener("click", function () { f.classList.toggle("open"); });
        f.appendChild(head);
        f.appendChild(h("div", { class: "body" }, body));
        return f;
    }
    function pageHover(cat) {
        bar.classList.add("hidden");
        var st = state(cat.id, {
            fill: "color", fillColor: "#7C5CFF", fillColor2: "#22D3EE", stroke: false, strokeColor: "#FFFFFF", strokeWidth: 4,
            cursor: "", hotspot: "tl", press: 260, click: "burst", c1: "#7C5CFF", c2: "#C4B5FD", size: 100, layerOpen: true, cursorOpen: true
        });
        /* ---- LAYER */
        var fill2;
        var layerBody = h("div", {},
            row("Fill", seg([["none", "None"], ["color", "Color"], ["gradient", "Gradient"]], st.fill, function (v) { st.fill = v; save(); fill2.style.display = v === "gradient" ? "" : "none"; }),
                swatch(st.fillColor, function (v) { st.fillColor = v; save(); }, "Hover fill colour"),
                (fill2 = swatch(st.fillColor2, function (v) { st.fillColor2 = v; save(); }, "Gradient end colour"))),
            row("Stroke", toggle(st.stroke, function (v) { st.stroke = v; save(); }), swatch(st.strokeColor, function (v) { st.strokeColor = v; save(); }, "Hover stroke colour"),
                slider(1, 24, 0.5, st.strokeWidth, "px", function (v) { st.strokeWidth = v; save(); })),
            (function () {
                var b = h("button", { class: "btn primary block", text: "Make Layers Hover" });
                b.addEventListener("click", function () {
                    run("hoverMake", { fill: st.fill, fillColor: st.fillColor, fillColor2: st.fillColor2, stroke: st.stroke, strokeColor: st.strokeColor, strokeWidth: st.strokeWidth },
                        function (d) { return "Made " + d.group + " (" + d.layers + " layers)" + (d.strokeSkipped && d.strokeSkipped.length ? " - stroke works on shape/text only" : "") + (d.cursor ? "" : ". Now make a cursor below."); }, b);
                });
                return b;
            })());
        if (st.fill !== "gradient") fill2.style.display = "none";
        var lf = fold("Layer", "make layers hoverable", st.layerOpen, layerBody);
        lf.querySelector(".head").addEventListener("click", function () { st.layerOpen = lf.classList.contains("open"); save(); });
        view.appendChild(lf);

        /* ---- CURSOR */
        var ddLabel = h("span", { text: st.cursor || "Choose layer..." });
        var menu = h("div", { class: "menu" });
        var dd = h("div", { class: "dd" }, (function () {
            var b = h("button", {}, ddLabel, h("span", { html: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>' }));
            b.style.paddingRight = "6px";
            b.addEventListener("click", function () {
                if (dd.classList.contains("open")) { dd.classList.remove("open"); return; }
                menu.innerHTML = "<div class='empty'>Loading layers...</div>";
                dd.classList.add("open");
                call("listLayers", {}).then(function (r) {
                    menu.innerHTML = "";
                    var Ls = (r.ok && r.data.layers) || [];
                    if (!Ls.length) { menu.appendChild(h("div", { class: "empty", text: r.ok && r.data.comp ? "No layers in " + r.data.comp : "Open a composition first" })); return; }
                    Ls.forEach(function (L) {
                        var it = h("div", {}, h("span", { class: "t", text: "#" + L.index }), h("span", { text: L.name }));
                        it.addEventListener("click", function () { st.cursor = L.name; ddLabel.textContent = L.name; save(); dd.classList.remove("open"); });
                        menu.appendChild(it);
                    });
                });
            });
            return b;
        })(), menu);
        if (window.__ukDocClick) document.removeEventListener("click", window.__ukDocClick);
        window.__ukDocClick = function (e) { if (!dd.contains(e.target)) dd.classList.remove("open"); };
        document.addEventListener("click", window.__ukDocClick);
        var cv = h("canvas", { class: "preview" });
        preview = new UKClick.Preview(cv);
        preview.set({ id: st.click, press: st.press / 1000, c1: st.c1, c2: st.c2, size: st.size / 100 });
        var fxl = h("div", { class: "fxlist" });
        C.clicks.forEach(function (fx) {
            var it = h("div", { class: "fxitem" + (fx.id === st.click ? " on" : "") }, h("div", { class: "n", text: fx.name }), h("div", { class: "d", text: fx.desc }));
            it.addEventListener("mouseenter", function () { preview.set({ id: fx.id }); });
            it.addEventListener("mouseleave", function () { preview.set({ id: st.click }); });
            it.addEventListener("click", function () {
                Array.prototype.forEach.call(fxl.children, function (c) { c.classList.remove("on"); });
                it.classList.add("on"); st.click = fx.id; save(); preview.set({ id: fx.id });
            });
            fxl.appendChild(it);
        });
        var cursorBody = h("div", {},
            row("Cursor", dd),
            row("Tip", seg([["tl", "Top-left"], ["center", "Center"], ["anchor", "Anchor"]], st.hotspot, function (v) { st.hotspot = v; save(); })),
            row("Press", slider(80, 800, 10, st.press, "ms", function (v) { st.press = v; save(); preview.set({ press: v / 1000 }); })),
            h("div", { class: "divider" }),
            h("div", { class: "label", text: "Click effect" }),
            fxl, cv,
            row("Colors", swatch(st.c1, function (v) { st.c1 = v; save(); preview.set({ c1: v }); }), swatch(st.c2, function (v) { st.c2 = v; save(); preview.set({ c2: v }); }),
                h("span", { class: "hint", style: "margin:0 0 0 6px", text: "Size" }), slider(50, 200, 5, st.size, "%", function (v) { st.size = v; save(); preview.set({ size: v / 100 }); })),
            (function () {
                var b = h("button", { class: "btn primary block", text: "Make Cursor", style: "margin-top:10px" });
                b.addEventListener("click", function () {
                    run("makeCursor", { layer: st.cursor, click: st.click, pressMs: st.press, hotspot: st.hotspot, color: st.c1, color2: st.c2, size: st.size },
                        function (d) { return "Cursor ready" + (d.hoverLinked ? " and linked to hover groups" : "") + ". Add layer markers on it to click."; }, b);
                });
                return b;
            })(),
            (function () {
                var b = h("button", { class: "btn small", text: "Re-link hover groups to the cursor" });
                b.title = "Use after renaming the comp, the Hover Group or the Cursor layer";
                b.addEventListener("click", function () { run("hoverRelink", {}, function (d) { return "Re-linked " + d.updated + " expressions to " + d.cursor; }, b); });
                return b;
            })());
        var cf = fold("Cursor", "click + interaction", st.cursorOpen, cursorBody);
        cf.querySelector(".head").addEventListener("click", function () { st.cursorOpen = cf.classList.contains("open"); save(); });
        view.appendChild(cf);
        preview.start();
        bar.classList.remove("hidden");
        btnApply.style.display = "none";
    }

    /* ------------------------------------------------------------- bounce */
    function pageBounce(cat) {
        var st = state(cat.id, { prop: "auto", type: "overshoot", strength: "medium", mode: "live" });
        if (st.prop === "opacity" || st.prop === "all") st.prop = "auto";
        var sel = h("select", {});
        [["auto", "Selected keyframes (auto)"], ["position", "Position"], ["scale", "Scale"], ["rotation", "Rotation"]].forEach(function (o) {
            var op = h("option", { value: o[0], text: o[1] }); if (o[0] === st.prop) op.selected = true; sel.appendChild(op);
        });
        sel.addEventListener("change", function () { st.prop = sel.value; save(); });
        view.appendChild(section("Bounce", h("div", { class: "card" },
            row("Property", sel),
            row("Type", seg([["overshoot", "Overshoot", "Elastic overshoot past each keyframe"], ["bounce", "Bounce", "Hits the value and bounces back"]], st.type, function (v) { st.type = v; save(); })),
            row("Strength", seg([["soft", "Soft"], ["medium", "Medium"], ["strong", "Strong"]], st.strength, function (v) { st.strength = v; save(); })),
            row("Mode", seg([["live", "Live sliders", "Expression + effect sliders you can tweak/keyframe"], ["keys", "Keyframes", "Bakes real overshoot keyframes"]], st.mode, function (v) { st.mode = v; save(); })))));
        var rm = h("button", { class: "btn block", text: "Remove bounce from selection" });
        rm.addEventListener("click", function () { run("bounceRemove", {}, function (d) { return "Removed from " + d.removed + " properties"; }, rm); });
        view.appendChild(rm);
        btnApply.onclick = function () {
            run("bounce", { prop: st.prop, type: st.type, strength: st.strength, mode: st.mode }, function (d) { return "Bounce on: " + (d.applied || []).join(", "); }, btnApply);
        };
    }

    /* -------------------------------------------------------------- glass */
    function pageGlass(cat) {
        var st = state(cat.id, { sel: "gl01", w: 1440, h: 432, round: 36, blur: 6, frost: 12, light: 80, lightW: 4, v: 2,
            bw: 1221, bh: 215, bround: 132, text: "Make the glow look great", c1: "#FF0000", c2: "#0006FF", hi: "#00D6FF", dur: 1.23, sweepW: 50, sweepI: 25, refr: 80 });
        if (st.v !== 2) { st.v = 2; st.w = 1440; st.h = 432; st.round = 36; st.blur = 6; st.frost = 12; st.light = 80; }
        if (st.lightW === undefined) st.lightW = 4;
        var dflt = { sel: "gl01", fade: 0, trimLight: 100, trimLen: 45, lens: 400, lensW: 55, blens: 300, blensW: 45, bw: 1221, bh: 215, bround: 132, text: "Make the glow look great", c1: "#FF0000", c2: "#0006FF", hi: "#00D6FF", dur: 1.23, sweepW: 50, sweepI: 25, refr: 80 };
        for (var dk in dflt) if (st[dk] === undefined) st[dk] = dflt[dk];
        st.lens = Math.min(500, st.lens); st.blens = Math.min(500, st.blens);     // CC Glass Displacement stops at 500
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var cv = h("canvas", { class: "preview cine" });
        view.appendChild(cv);
        var frostO = function () { return { w: st.w, h: st.h, round: st.round, blur: st.blur, frost: st.frost, light: st.light, lightW: st.lightW, fade: st.fade, lens: st.lens, lensW: st.lensW }; };
        var boxO = function () { return { w: st.bw, h: st.bh, round: st.bround, text: st.text, c1: st.c1, c2: st.c2, hi: st.hi, dur: st.dur, lightW: st.sweepW, lightI: st.sweepI, refr: st.refr }; };
        var drawP = function (c, p, t, thumb, maxW) {
            if (p.look === "box") { var o = boxO(); o.thumb = thumb; o.maxW = maxW; UKGlassPrev.drawBox(c, t, o); }
            else { var f = frostO(); f.maxW = maxW; UKGlassPrev.draw(c, f); }
        };
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var t0 = performance.now(), running = true, hoverP = null;
        var loop = function () {
            if (!running) return;
            if (document.body.contains(cv)) { try { drawP(cv, hoverP || find(st.sel), (performance.now() - t0) / 1000, false, 640); } catch (e) { } }
            requestAnimationFrame(loop);
        };
        preview = { stop: function () { running = false; } };
        requestAnimationFrame(loop);
        var set = function (k) { return function (v) { st[k] = v; save(); }; };
        var input = function (k, ph) { var i = h("input", { type: "text", value: st[k], placeholder: ph }); i.addEventListener("input", function () { st[k] = i.value; save(); }); return i; };
        var frostCard = h("div", { class: "card" },
            row("Width", slider(100, 3840, 2, st.w, "px", set("w"))),
            row("Height", slider(40, 2160, 2, st.h, "px", set("h"))),
            row("Corner", slider(0, 300, 1, st.round, "px", set("round"))),
            row("Blur", slider(0, 60, 0.5, st.blur, "", set("blur"))),
            row("Frost", slider(0, 60, 1, st.frost, "%", set("frost"))),
            row("Light", slider(0, 100, 1, st.light, "%", set("light"))),
            row("Light Width", slider(0.5, 20, 0.5, st.lightW, "px", set("lightW"))),
            row("Light Fade", slider(0, 100, 1, st.fade, "%", set("fade"))),
            row("Edge Lens", slider(0, 500, 5, st.lens, "", set("lens"))),
            row("Lens Width", slider(0, 200, 1, st.lensW, "", set("lensW"))));
        var boxCard = h("div", { class: "card" },
            row("Text", input("text", "empty: no text layer")),
            row("Width", slider(100, 3840, 1, st.bw, "px", set("bw"))),
            row("Height", slider(40, 2160, 1, st.bh, "px", set("bh"))),
            row("Corner", slider(0, 600, 1, st.bround, "px", set("bround"))),
            row("Colors", h("div", { class: "row grow", style: "gap:5px;min-height:0" },
                swatch(st.c1, set("c1"), "Color 1"), swatch(st.c2, set("c2"), "Color 2"), swatch(st.hi, set("hi"), "Highlight"))),
            row("Trim time", slider(0.3, 6, 0.01, st.dur, "s", set("dur"))),
            row("Light Width", slider(5, 300, 1, st.sweepW, "", set("sweepW"))),
            row("Light Intensity", slider(0, 100, 1, st.sweepI, "", set("sweepI"))),
            row("Refraction", slider(0, 200, 1, st.refr, "", set("refr"))));
        var showFor = function () { var p = find(st.sel); frostCard.style.display = p.look === "box" ? "none" : ""; boxCard.style.display = p.look === "box" ? "" : "none"; };
        view.appendChild(section("Glass", frostCard, boxCard));
        showFor();
        view.appendChild(section("Looks", library(cat, st, {
            draw: function (c, p) { drawP(c, p, 0, true, 260); },
            anim: function (c, p, t) { drawP(c, p, t, false, 260); },
            onPick: function (p) { if (p.custom) return; showFor(); t0 = performance.now(); },
            onHover: function (p) { hoverP = p && !p.custom ? p : null; }
        })));
        btnApply.onclick = applyWith(cat, st, function () {
            var p = find(st.sel), a = p.look === "box"
                ? { id: "gl02", w: st.bw, h: st.bh, round: st.bround, text: st.text, c1: st.c1, c2: st.c2, hi: st.hi, dur: st.dur, lightW: st.sweepW, lightI: st.sweepI, refr: st.refr }
                : { id: "gl01", w: st.w, h: st.h, round: st.round, blur: st.blur, frost: st.frost, light: st.light, lightW: st.lightW, fade: st.fade, lens: st.lens, lensW: st.lensW };
            run("glass", a, function (d) { return p.name + ": " + d.panel + " (" + d.controls + ")"; }, btnApply);
        });
    }

    /* ---------------------------------------------------------------- svg (header button) */
    function importSvgFrom(src, name) {
        status("Reading SVG...");
        return readText(src).then(function (txt) {
            var data = UKSvg.parse(txt);
            return run("importSvg", { data: data, name: (name || "SVG").replace(/\.svg$/i, ""), fit: true }, function (d) { return "Imported " + d.name + " (" + d.groups + " shapes)"; });
        }).catch(function (e) { status(e.message, "err"); });
    }
    var btnSvg = document.getElementById("btnSvg");
    btnSvg.addEventListener("click", function () {
        if (bar.classList.contains("hidden")) bar.classList.remove("hidden");
        pickFile(["svg"], "Import SVG").then(function (f) {
            if (!f) return;
            importSvgFrom(f, typeof f === "string" ? f.replace(/^.*[\\\/]/, "") : f.name);
        });
    });
    /* an SVG file dropped anywhere on the panel imports it too */
    document.addEventListener("dragover", function (e) { if (e.dataTransfer && Array.prototype.some.call(e.dataTransfer.items || [], function (it) { return it.kind === "file"; })) e.preventDefault(); });
    document.addEventListener("drop", function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!f || !/\.svg$/i.test(f.name) || e.defaultPrevented) return;
        e.preventDefault();
        if (bar.classList.contains("hidden")) bar.classList.remove("hidden");
        importSvgFrom(f, f.name);
    });

    /* ============================================================ start */
    function boot() {
        var last = STORE.last && CATS.filter(function (c) { return c.id === STORE.last; })[0];
        if (last) open(last); else home();
        call("loadStatus", {}).then(function (r) {
            if (!r.ok) status(r.error, "err");
            else if (r.data.error) status("Some modules failed to load: " + r.data.error, "err");
        });
    }
    var _open = open;
    open = function (c) { btnApply.style.display = ""; _open(c); };
    boot();
})();

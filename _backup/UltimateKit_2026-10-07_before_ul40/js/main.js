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
    function pickFile(types) {
        if (fs && fs.showOpenDialogEx) {
            var r = fs.showOpenDialogEx(false, false, "Choose a file", "", types);
            return Promise.resolve(r && r.data && r.data.length ? r.data[0] : null);
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
        flare: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M18.7 5.3l-2.8 2.8M8.1 15.9l-2.8 2.8"/>',
        gradient: '<circle cx="12" cy="12" r="8"/><path d="M8 18.9A8 8 0 0018.9 8"/><path d="M6 15.5a8 8 0 009.5-9.5" opacity=".6"/>',
        horizon: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 16.5c3.5-3 14.5-3 18 0"/><path d="M7.5 9.5l9-3" opacity=".6"/>',
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
    function slider(min, max, step, value, unit, onChange) {
        var val = h("span", { class: "val" });
        var fmt = function (v) { return (step < 1 ? Number(v).toFixed(step < 0.1 ? 2 : 1) : Math.round(v)) + (unit || ""); };
        var inp = h("input", { type: "range", min: min, max: max, step: step, value: value });
        val.textContent = fmt(value);
        inp.addEventListener("input", function () { val.textContent = fmt(inp.value); onChange(Number(inp.value)); });
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
    function hint(t) { return h("div", { class: "hint", html: t }); }
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
            onHover(p | null), filter(p) extra filter (e.g. SaaS BG pack)                          */
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
                t.appendChild(h("div", { class: "plusform" }, hint("Select the animated layer(s) in your comp, name it, Save."), nm, h("div", { class: "btns" }, ok, no)));
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
    var CATS = [
        { id: "saasText", name: "SaaS Text", icon: "sparkT", list: C.textSaas, page: pageText },
        { id: "underline", name: "Underline", icon: "underline", list: C.underline, page: pageUnderline },
        { id: "cine", name: "Cinematic Background", icon: "flare", list: C.cinematic, page: pageCine },
        { id: "gradbg", name: "Gradient Background", icon: "gradient", list: C.gradBg, page: pageGradBg },
        { id: "saasbg", name: "SaaS BG", icon: "horizon", list: C.saasBg, page: pageSaasBg },
        { id: "hover", name: "Hover & Cursor", icon: "cursor", page: pageHover },
        { id: "bounce", name: "Bounce", icon: "bounce", page: pageBounce },
        { id: "glass", name: "Glass", icon: "glass", page: pageGlass }
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
                c.list ? h("div", { class: "ct", text: c.list.length + " presets" }) : null);
            t.addEventListener("click", function () { open(c); });
            grid.appendChild(t);
        });
        view.appendChild(grid);
        view.appendChild(h("div", { class: "home-note", html: "Everything is built from editable keyframes with smooth speed-ramps. Pick a category, choose a preset, press <b>Apply</b> (or double-click a preset). Hover a preset to see it move; the star keeps your favourites first." }));
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
        STORE.last = cat.id; save();
    }
    btnBack.addEventListener("click", home);
    document.getElementById("brand").addEventListener("click", home);

    /* ------------------------------------------------------------- text */
    function pageText(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, mode: "both", inDur: 1.0, outDur: 0.8, hold: 2, text: "", accent: "#7C5CFF" });
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var outRow;
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKTextPrev.Player(cv);
        preview = player;
        var opts = function () { return { mode: st.mode, inDur: st.inDur, outDur: st.outDur, hold: Math.min(1.5, st.hold), accent: st.accent, text: st.text, maxW: 640 }; };
        var selSpec = function () { return C.find(cat.list, st.sel) || cat.list[0]; };
        player.set(selSpec(), opts());
        view.appendChild(cv);
        var upd = function () { save(); player.set(null, opts()); };
        view.appendChild(section("Animation",
            h("div", { class: "card" },
                row("Play", seg([["in", "In"], ["out", "Out"], ["both", "In + Out"]], st.mode, function (v) { st.mode = v; outRow.style.display = v === "in" ? "none" : ""; upd(); player.restart(); })),
                row("In time", slider(0.2, 3, 0.05, st.inDur, "s", function (v) { st.inDur = v; upd(); })),
                (outRow = row("Out time", slider(0.2, 3, 0.05, st.outDur, "s", function (v) { st.outDur = v; upd(); }))),
                row("Accent", swatch(st.accent, function (v) { st.accent = v; upd(); }, "Accent colour (highlights, caret, colour sweep)")),
                row("New text", (function () { var i = h("input", { type: "text", value: st.text, placeholder: "used only for a new layer" }); i.addEventListener("input", function () { st.text = i.value; upd(); }); return i; })())
            )));
        if (st.mode === "in") outRow.style.display = "none";
        view.appendChild(hint("Select text layers to animate them, or select nothing to create a ready-made text layer at the playhead. Re-applying replaces the previous animation. Hover a preset to preview it; the preview follows the settings above."));
        view.appendChild(section("Presets", library(cat, st, {
            draw: function (c, p) { UKTextPrev.draw(c, p, (p.loop ? 0.6 : st.inDur * 0.98 + 0.05), { mode: "in", inDur: 1, outDur: 0.8, hold: 1, accent: st.accent, maxW: 260 }); },
            anim: function (c, p, t) { UKTextPrev.draw(c, p, t, { mode: st.mode, inDur: st.inDur, outDur: st.outDur, hold: 0.8, accent: st.accent, maxW: 260 }); },
            onPick: function (p) { if (!p.custom) { player.set(p, opts()); player.restart(); } },
            onHover: function (p) { player.set(p && !p.custom ? p : selSpec(), opts()); }
        })));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("text", { id: st.sel, mode: st.mode, inDur: st.inDur, outDur: st.outDur, hold: st.hold, text: st.text, accent: st.accent },
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
        view.appendChild(hint("Select the text layer(s) to decorate, put the playhead where the stroke should start, Apply. The stroke is its own shape layer parented to the text: round caps, Trim Paths keyframes with smooth speed-ramps, colour in Effect Controls (<b>Color</b>). Tilted marks keep their angle on the layer's Rotation."));
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
        view.appendChild(hint("Starts at the playhead. After Apply everything stays editable on the layer in <b>Effect Controls</b>: <b>Speed</b>, <b>Softness</b>, <b>Light</b>, <b>Colors</b> (5 colours) and <b>Grain</b>. The float loops seamlessly for any length."));
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
        view.appendChild(hint("Inside the precomp: circles with <b>wiggle()</b> on Position (60-80, different speeds), parented to <b>Null 1</b> (Rotation <b>time*10</b>) and an Adjustment Layer with <b>Fast Box Blur 150</b>. On the precomp layer: colours in <b>Essential Properties</b>, <b>Grain</b> in Effect Controls."));
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

    function pageSaasBg(cat) {
        var st = state(cat.id, { sel: cat.list[0].id, speed: 100, intro: true, pack: "", colors: null, colorsFor: "" });
        if (!isMine(st.sel) && !C.find(cat.list, st.sel)) st.sel = cat.list[0].id;
        var find = function (id) { return C.find(cat.list, id) || cat.list[0]; };
        var reset = function () { st.colors = find(st.sel).colors.slice(); st.colorsFor = st.sel; };
        if (!st.colors || st.colorsFor !== st.sel || st.colors.length !== find(st.sel).colors.length) reset();
        var cv = h("canvas", { class: "preview cine" });
        var player = new UKSaas.Player(cv);
        preview = player;
        var opts = function () { return { speed: st.speed, intro: st.intro, colors: st.colors }; };
        player.set(find(st.sel), opts());
        view.appendChild(cv);
        var swWrap = h("div", { class: "row grow", style: "gap:5px;min-height:0;flex-wrap:wrap" });
        function buildSwatches() {
            swWrap.innerHTML = "";
            var mesh = find(st.sel).mesh;
            st.colors.forEach(function (c, k) {
                swWrap.appendChild(swatch(c, function (v) { st.colors[k] = v; save(); player.set(null, opts()); }, mesh ? "Color " + (k + 1) : (k === 0 ? "Background" : "Color " + k)));
            });
        }
        buildSwatches();
        /* pack filter: every preset copies a background from one of the Envato SaaS packs */
        var packSel = h("select");
        packSel.appendChild(h("option", { value: "", text: "All packs (" + cat.list.length + ")" }));
        var seen = {};
        cat.list.forEach(function (p) {
            if (seen[p.src]) { seen[p.src]++; return; }
            seen[p.src] = 1;
        });
        Object.keys(seen).forEach(function (k) { packSel.appendChild(h("option", { value: k, text: (C.saasPacks[k] || k) + " - " + k + " (" + seen[k] + ")" })); });
        packSel.value = st.pack || "";
        view.appendChild(section("Options", h("div", { class: "card" },
            row("Speed", slider(10, 300, 5, st.speed, "%", function (v) { st.speed = v; save(); player.set(null, opts()); })),
            row("Intro", toggle(st.intro, function (v) { st.intro = v; save(); player.set(null, opts()); player.restart(); }), h("span", { class: "hint", style: "margin:0", text: "plays the preview's opening move first" })),
            row("Colors", swWrap))));
        view.appendChild(hint("Every background copies one look from the SaaS packs' previews (colours sampled from the frames). It starts at the playhead, plays its intro once and then floats seamlessly for any length. Built like a motion designer would: every colour area is its own blurred ellipse layer (Fill colour + Gaussian Blur) that floats on its own, so the colours flow while the layers stay. After Apply, everything is in the layer's <b>Essential Properties</b>: <b>Speed</b> (higher = faster, 0 = still), <b>Intro</b> and the colours. Every move is one loop of a few keyframes with a <b>loopOut</b> expression - move the keyframes closer together to make that move faster."));
        var lib = library(cat, st, {
            draw: function (c, p) { UKSaas.draw(c, p, (p.T0 || 0) + (p.P || 18) * 1.2, { maxW: 200 }); },
            filter: function (p) { return !st.pack || p.custom || p.src === st.pack; },
            onPick: function (p) { if (p.custom) return; reset(); buildSwatches(); save(); player.set(p, opts()); },
            onHover: function (p) { player.set(p && !p.custom ? p : find(st.sel), p && !p.custom ? { speed: st.speed, intro: st.intro, colors: p.colors.slice() } : opts()); }
        });
        packSel.addEventListener("change", function () { st.pack = packSel.value; save(); lib.rebuild(); });
        view.appendChild(section("Presets", row("Pack", packSel), lib));
        player.start();
        btnApply.onclick = applyWith(cat, st, function () {
            run("saasBg", { id: st.sel, fullComp: false, speed: st.speed, intro: st.intro, colors: st.colors },
                function (d) { return "Added " + d.name + " (loop " + d.loop + " s)"; }, btnApply);
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
            hint("Fill/stroke fade in smoothly when the cursor touches a layer. With both off the layers only scale and lift."),
            (function () {
                var b = h("button", { class: "btn primary block", text: "Make Layers Hover" });
                b.addEventListener("click", function () {
                    run("hoverMake", { fill: st.fill, fillColor: st.fillColor, fillColor2: st.fillColor2, stroke: st.stroke, strokeColor: st.strokeColor, strokeWidth: st.strokeWidth },
                        function (d) { return "Made " + d.group + " (" + d.layers + " layers)" + (d.strokeSkipped && d.strokeSkipped.length ? " - stroke works on shape/text only" : "") + (d.cursor ? "" : ". Now make a cursor below."); }, b);
                });
                return b;
            })(),
            h("div", { class: "divider" }),
            hint("Add later: select the group's <b>HOVER CONTROLS</b> null (or the Hover Group layer), then:"),
            (function () {
                var wrap = h("div", { class: "btns" });
                [["fill", "+ Fill"], ["gradient", "+ Gradient"], ["stroke", "+ Stroke"]].forEach(function (o) {
                    var b = h("button", { class: "btn small", text: o[1] });
                    b.addEventListener("click", function () {
                        run("hoverAdd", { what: o[0], fillColor: st.fillColor, fillColor2: st.fillColor2, strokeColor: st.strokeColor, strokeWidth: st.strokeWidth },
                            function (d) { return "Added " + d.added + " to " + d.layers + " layers"; }, b);
                    });
                    wrap.appendChild(b);
                });
                return wrap;
            })(),
            hint("Controls on the null: Default Scale, Hovered Scale, Hover Radius, Smoothness, Move Up, Push Others, Click Press (+ fill/stroke). All keyframable."));
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
            hint("Clicks: put a layer marker (<b>*</b> on the numpad) on the <b>Cursor</b> layer wherever it should click. Colours, size and opacity are in its Essential Properties; <b>Click Speed</b> is an effect on the layer."),
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
        view.appendChild(hint("Select the keyframes (or the layers) you want to bounce. <b>Live sliders</b> adds effect sliders such as <i>Scale - Overshoot / Frequency / Decay</i> in Effect Controls. <b>Keyframes</b> inserts real, editable keyframes with smooth speed-ramps instead."));
        var rm = h("button", { class: "btn block", text: "Remove bounce from selection" });
        rm.addEventListener("click", function () { run("bounceRemove", {}, function (d) { return "Removed from " + d.removed + " properties"; }, rm); });
        view.appendChild(rm);
        btnApply.onclick = function () {
            run("bounce", { prop: st.prop, type: st.type, strength: st.strength, mode: st.mode }, function (d) { return "Bounce on: " + (d.applied || []).join(", "); }, btnApply);
        };
    }

    /* -------------------------------------------------------------- glass */
    function pageGlass(cat) {
        var st = state(cat.id, { style: "frosted", tint: "#7C5CFF" });
        view.appendChild(section("Glass", h("div", { class: "card" },
            row("Style", seg([["frosted", "Frosted"], ["liquid", "Liquid"], ["tint", "Tinted"]], st.style, function (v) { st.style = v; save(); })),
            row("Tint", swatch(st.tint, function (v) { st.tint = v; save(); }), h("span", { class: "hint", style: "margin:0", text: "used by Tinted" })))));
        view.appendChild(hint("Select a shape layer to turn it into glass, or select nothing to create a new rounded glass panel. It frosts whatever is behind it; Frost, Brightness, Edge Light and Shadow are sliders on the panel."));
        btnApply.onclick = function () { run("glass", { style: st.style, tint: st.style === "tint" ? st.tint : null }, function (d) { return "Glass: " + d.panel; }, btnApply); };
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
        pickFile(["svg"]).then(function (f) {
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

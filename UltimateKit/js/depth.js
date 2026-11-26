/*  Ultimate Kit - depth maps made in the panel, on this machine (no internet, no Python):
    Depth Anything V2 Small (Apache 2.0, lib/depth) run by ONNX Runtime Web (MIT, WebAssembly).
    UKDepth.estimate(img, o) -> Promise<canvas>: a grayscale depth map the size of the image, white = near.  */
var UKDepth = (function () {
    var BASE = "lib/depth/", MODEL = "depth_anything_v2_small_q8.onnx", MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];
    var session = null, loading = null, f16in = false;
    function bin(url, text) {
        return new Promise(function (ok, no) {
            var x = new XMLHttpRequest();
            x.open("GET", url, true);
            x.responseType = text ? "text" : "arraybuffer";
            x.onload = function () { if ((x.status === 200 || x.status === 0) && x.response && (text ? x.response.length : x.response.byteLength)) ok(x.response); else no(new Error("Could not read " + url)); };
            x.onerror = function () { no(new Error("Could not read " + url)); };
            x.send();
        });
    }
    /* loads the runtime and the model once (a few seconds the first time) */
    function load(root, model) {
        if (model && model !== MODEL) { MODEL = model; session = null; loading = null; f16in = false; }
        if (session) return Promise.resolve(session);
        if (loading) return loading;
        root = root || "";
        // the runtime's glue module is read as text and imported from a Blob URL (works from file:// in the panel)
        var mjs;
        var here = new URL(root + BASE + "ort-wasm-simd-threaded.mjs", location.href).href;
        loading = bin(here, true).then(function (js) {
            // (from a Blob URL its own address would be the blob's: point it back to its real place)
            // (its worker threads start from the same Blob: globalThis.__ukOrtMjs, set below, only exists here)
            js = js.split("new URL(import.meta.url)").join("new URL(globalThis.__ukOrtMjs || " + JSON.stringify(here) + ")");
            js = js.split("import.meta.url").join(JSON.stringify(here));
            mjs = URL.createObjectURL(new Blob([js], { type: "text/javascript" }));
            window.__ukOrtMjs = mjs;
            return bin(root + BASE + "ort-wasm-simd-threaded.wasm");
        }).then(function (wb) {
            ort.env.wasm.wasmPaths = { mjs: mjs, wasm: URL.createObjectURL(new Blob([wb], { type: "application/wasm" })) };
            ort.env.wasm.wasmBinary = wb;
            ort.env.wasm.numThreads = threads();
            ort.env.wasm.proxy = false;
            return bin(root + BASE + MODEL);
        }).then(function (mb) {
            var make = function () { return ort.InferenceSession.create(new Uint8Array(mb), { executionProviders: ["wasm"], graphOptimizationLevel: "all" }); };
            // several CPU threads when this browser allows shared memory; otherwise (or if that fails) one
            return make().catch(function (e) { if (ort.env.wasm.numThreads === 1) throw e; ort.env.wasm.numThreads = 1; return make(); });
        }).then(function (s) { session = s; return s; }, function (e) { loading = null; throw e; });
        return loading;
    }
    function threads() {
        try { new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }); } catch (e) { return 1; }
        if (typeof SharedArrayBuffer === "undefined") return 1;
        return Math.max(1, Math.min(8, (navigator.hardwareConcurrency || 4) - 1));
    }
    function info() { return { threads: (typeof ort !== "undefined" && ort.env.wasm.numThreads) || 1, model: MODEL }; }
    /* float32 -> IEEE half (for a model whose input is float16) */
    function half(v) {
        var f = new Float32Array(1), i = new Int32Array(f.buffer);
        f[0] = v;
        var x = i[0], s = (x >>> 16) & 0x8000, e = ((x >>> 23) & 0xff) - 112, m = x & 0x7fffff;
        if (e <= 0) return s;
        if (e >= 31) return s | 0x7c00;
        return s | (e << 10) | (m >>> 13);
    }
    function tensor(data, w, h) {
        if (!f16in) return new ort.Tensor("float32", data, [1, 3, h, w]);
        var u = new Uint16Array(data.length), k;
        for (k = 0; k < data.length; k++) u[k] = half(data[k]);
        return new ort.Tensor("float16", u, [1, 3, h, w]);
    }
    function fromHalf(h) {
        var s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, m = h & 0x3ff;
        if (e === 0) return s * m * Math.pow(2, -24);
        if (e === 31) return m ? NaN : s * Infinity;
        return s * (1 + m / 1024) * Math.pow(2, e - 15);
    }
    /* img: <img> / <canvas>. o.res: the model's short side (multiple of 14, default 518), o.max: the map's long side */
    function estimate(img, o) {
        o = o || {};
        var IW = img.naturalWidth || img.width, IH = img.naturalHeight || img.height;
        var res = o.res || 518, sc = res / Math.min(IW, IH);
        if (Math.max(IW, IH) * sc > res * 2) sc = res * 2 / Math.max(IW, IH);
        var w = Math.max(14, Math.round(IW * sc / 14) * 14), h = Math.max(14, Math.round(IH * sc / 14) * 14);
        return load(o.root).then(function (S) {
            var c = document.createElement("canvas");
            c.width = w; c.height = h;
            var g = c.getContext("2d");
            g.imageSmoothingQuality = "high";
            g.drawImage(img, 0, 0, w, h);
            var px = g.getImageData(0, 0, w, h).data, n = w * h, data = new Float32Array(3 * n), k, ch;
            for (k = 0; k < n; k++) for (ch = 0; ch < 3; ch++) data[ch * n + k] = (px[k * 4 + ch] / 255 - MEAN[ch]) / STD[ch];
            var feeds = {};
            feeds[S.inputNames[0]] = tensor(data, w, h);
            return S.run(feeds).catch(function (e) {
                if (f16in || !/float16|type/i.test(String(e && e.message))) throw e;
                f16in = true;
                feeds[S.inputNames[0]] = tensor(data, w, h);
                return S.run(feeds);
            }).then(function (out) {
                var t = out[S.outputNames[0]], d = t.data, dims = t.dims, ow = dims[dims.length - 1], oh = dims[dims.length - 2];
                var v = new Float32Array(ow * oh), lo = Infinity, hi = -Infinity;
                for (k = 0; k < v.length; k++) { v[k] = (t.type === "float16") ? fromHalf(d[k]) : d[k]; if (v[k] < lo) lo = v[k]; if (v[k] > hi) hi = v[k]; }
                var m = document.createElement("canvas");
                m.width = ow; m.height = oh;
                var mg = m.getContext("2d"), im = mg.createImageData(ow, oh), sp = Math.max(1e-6, hi - lo);
                // the model's values crowd the far distance together; blending with an equalised version spreads
                // them so a wipe through the depth moves evenly (o.eq 0 = raw, 1 = fully equalised)
                var eq = o.eq === undefined ? 0.6 : o.eq, hist = new Float64Array(1024), cdf = new Float64Array(1024), acc = 0, b;
                for (k = 0; k < v.length; k++) { v[k] = (v[k] - lo) / sp; hist[Math.min(1023, Math.floor(v[k] * 1024))]++; }
                // (share of pixels further away; every bin capped so one big flat area - a sky - can't open a
                //  jump that turns the noise along its edge into speckles)
                var cap = 5 * v.length / 1024, tot = 0;
                for (b = 0; b < 1024; b++) { hist[b] = Math.min(hist[b], cap); tot += hist[b]; }
                for (b = 0; b < 1024; b++) { cdf[b] = acc / tot; acc += hist[b]; }
                for (k = 0; k < v.length; k++) {
                    var q = Math.round(255 * ((1 - eq) * v[k] + eq * cdf[Math.min(1023, Math.floor(v[k] * 1024))]));
                    im.data[k * 4] = im.data[k * 4 + 1] = im.data[k * 4 + 2] = q; im.data[k * 4 + 3] = 255;
                }
                mg.putImageData(im, 0, 0);
                // up to the image's size (capped), smoothly
                var mx = o.max || 2048, s2 = Math.min(1, mx / Math.max(IW, IH)), fw = Math.round(IW * s2), fh = Math.round(IH * s2);
                var f = document.createElement("canvas");
                f.width = fw; f.height = fh;
                var fg = f.getContext("2d");
                fg.imageSmoothingEnabled = true; fg.imageSmoothingQuality = "high";
                fg.drawImage(m, 0, 0, fw, fh);
                return f;
            });
        });
    }
    return { load: load, estimate: estimate, info: info };
})();

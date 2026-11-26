/* Blob decomposition for the SaaS BG lab: a background frame (the text-free mesh) is rebuilt the way a
   motion designer builds a soft gradient background - a solid plus a few blurred ellipses (shape layer +
   Gaussian Blur), each with its own colour from a small palette. The fit is gradient descent (Adam) on
   the composite; tracking the blobs through the shot gives real keyframes for every blob.
   Blob params p = [x, y, ln rx, ln ry, angle, ln sigma, logit opacity] in fit-grid pixels.            */
(function () {
  function erfc(x) {   // Numerical Recipes erfc, |error| < 1.2e-7
    const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  /* opacity field of one blurred ellipse, as AE draws it (shape ellipse + Gaussian Blur): the edge is a
     gaussian step over the pixel distance to the ellipse (same width all round), and a blob that is
     small next to its blur loses peak opacity like a real blurred disc                                */
  function field(p, W, H, out) {
    const rx = Math.exp(p[2]), ry = Math.exp(p[3]), c = Math.cos(p[4]), s = Math.sin(p[4]), sg = Math.exp(p[5]), op = 1 / (1 + Math.exp(-p[6]));
    const q = 1 / (sg * Math.SQRT2), rm = Math.min(rx, ry);
    const peak = (1 - Math.exp(-rm * rm / (2 * sg * sg))) / (0.5 * erfc(-rm * q));
    let i = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - p[0], dy = y + 0.5 - p[1], X = dx * c + dy * s, Y = -dx * s + dy * c, u = X / rx, v = Y / ry;
      const rho = Math.sqrt(u * u + v * v), gr = Math.sqrt(u * u / (rx * rx) + v * v / (ry * ry)) / Math.max(rho, 1e-6);
      const dist = rho > 1e-6 ? (rho - 1) / Math.max(gr, 1e-6) : -rm;
      out[i++] = op * peak * 0.5 * erfc(Math.max(dist, -rm) * q);
    }
    return out;
  }
  /* composite: bg, then each blob in order (normal blend) */
  function render(M, W, H, img) {
    const P = W * H, A = new Float32Array(P);
    for (let i = 0; i < P; i++) { img[i * 3] = M.pal[M.bg][0]; img[i * 3 + 1] = M.pal[M.bg][1]; img[i * 3 + 2] = M.pal[M.bg][2]; }
    for (const b of M.blobs) {
      field(b.p, W, H, A); const c = M.pal[b.c];
      for (let i = 0; i < P; i++) { const a = A[i]; img[i * 3] += (c[0] - img[i * 3]) * a; img[i * 3 + 1] += (c[1] - img[i * 3 + 1]) * a; img[i * 3 + 2] += (c[2] - img[i * 3 + 2]) * a; }
    }
    return img;
  }
  const LR = [0.25, 0.25, 0.03, 0.03, 0.03, 0.03, 0.06];
  /* n iterations of Adam on all blob params (and the palette unless fixPal) */
  function optimise(M, T, W, H, n, fixPal) {
    const P = W * H, N = M.blobs.length, A = [], pre = [], img = new Float32Array(P * 3), G = new Float32Array(P * 3), S = new Float32Array(P), ga = new Float32Array(P), Ap = new Float32Array(P);
    for (let i = 0; i < N; i++) { A.push(new Float32Array(P)); pre.push(new Float32Array(P * 3)); }
    M.m = M.m || {}; M.v = M.v || {};
    let err = 0;
    for (let it = 0; it < n; it++) {
      M.step = (M.step || 0) + 1;
      /* forward */
      for (let i = 0; i < P; i++) { img[i * 3] = M.pal[M.bg][0]; img[i * 3 + 1] = M.pal[M.bg][1]; img[i * 3 + 2] = M.pal[M.bg][2]; }
      for (let b = 0; b < N; b++) {
        field(M.blobs[b].p, W, H, A[b]); pre[b].set(img); const c = M.pal[M.blobs[b].c], a = A[b];
        for (let i = 0; i < P; i++) { img[i * 3] += (c[0] - img[i * 3]) * a[i]; img[i * 3 + 1] += (c[1] - img[i * 3 + 1]) * a[i]; img[i * 3 + 2] += (c[2] - img[i * 3 + 2]) * a[i]; }
      }
      err = 0;
      for (let i = 0; i < P * 3; i++) { const d = img[i] - T[i]; err += d * d; G[i] = 2 * d / (P * 3); }
      /* backward */
      S.fill(1);
      const gpal = M.pal.map(() => [0, 0, 0]);
      for (let b = N - 1; b >= 0; b--) {
        const c = M.pal[M.blobs[b].c], a = A[b], pr = pre[b], gc = gpal[M.blobs[b].c];
        for (let i = 0; i < P; i++) {
          const g0 = G[i * 3], g1 = G[i * 3 + 1], g2 = G[i * 3 + 2];
          ga[i] = (g0 * (c[0] - pr[i * 3]) + g1 * (c[1] - pr[i * 3 + 1]) + g2 * (c[2] - pr[i * 3 + 2])) * S[i];
          const w = a[i] * S[i]; gc[0] += g0 * w; gc[1] += g1 * w; gc[2] += g2 * w;
          S[i] *= 1 - a[i];
        }
        const p = M.blobs[b].p, gp = [];
        for (let j = 0; j < 7; j++) {
          const e = j < 2 ? 0.05 : 0.002, o = p[j]; p[j] = o + e; field(p, W, H, Ap); p[j] = o;
          let s = 0; for (let i = 0; i < P; i++) s += ga[i] * (Ap[i] - a[i]); gp.push(s / e);
        }
        adam(M, 'b' + b, p, gp, LR);
      }
      for (let i = 0; i < P; i++) { const w = S[i], gc = gpal[M.bg]; gc[0] += G[i * 3] * w; gc[1] += G[i * 3 + 1] * w; gc[2] += G[i * 3 + 2] * w; }
      if (!fixPal) for (let k = 0; k < M.pal.length; k++) { adam(M, 'c' + k, M.pal[k], gpal[k], [3, 3, 3]); for (let ch = 0; ch < 3; ch++) M.pal[k][ch] = Math.max(0, Math.min(255, M.pal[k][ch])); }
      /* keep blobs sane: centre near the frame, radius within limits, blur not below 4 % of the radius */
      for (const bl of M.blobs) {
        const p = bl.p; p[0] = Math.max(-0.5 * W, Math.min(1.5 * W, p[0])); p[1] = Math.max(-0.5 * H, Math.min(1.5 * H, p[1]));
        p[2] = Math.max(Math.log(0.6), Math.min(Math.log(2.5 * W), p[2])); p[3] = Math.max(Math.log(0.6), Math.min(Math.log(2.5 * W), p[3]));
        p[5] = Math.max(Math.log(0.25), Math.min(Math.log(1.5 * W), p[5])); p[6] = Math.max(-6, Math.min(6, p[6]));
      }
    }
    return Math.sqrt(err / (P * 3));
  }
  function adam(M, key, p, g, lr) {
    const m = M.m[key] || (M.m[key] = new Float64Array(p.length)), v = M.v[key] || (M.v[key] = new Float64Array(p.length)), t = M.step;
    for (let j = 0; j < p.length; j++) {
      m[j] = 0.9 * m[j] + 0.1 * g[j]; v[j] = 0.999 * v[j] + 0.001 * g[j] * g[j];
      const mh = m[j] / (1 - Math.pow(0.9, t)), vh = v[j] / (1 - Math.pow(0.999, t));
      p[j] -= lr[j] * mh / (Math.sqrt(vh) + 1e-8);
    }
  }
  function blur3(R, W, H) {
    const o = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; s += R[yy * W + xx]; n++; } o[y * W + x] = s / n; }
    return o;
  }
  function kmeans(cols, K) {
    const lum = c => c[0] + c[1] + c[2], s = cols.slice().sort((a, b) => lum(a) - lum(b)); let C = [];
    for (let i = 0; i < K; i++) C.push(s[Math.round(i * (s.length - 1) / Math.max(1, K - 1))].slice());
    let lab = [];
    for (let it = 0; it < 30; it++) {
      lab = cols.map(c => { let b = 0, bd = 1e12; C.forEach((q, i) => { const d = (c[0] - q[0]) ** 2 + (c[1] - q[1]) ** 2 + (c[2] - q[2]) ** 2; if (d < bd) { bd = d; b = i; } }); return b; });
      C = C.map((q, i) => { const m = cols.filter((c, j) => lab[j] === i); return m.length ? [0, 1, 2].map(ch => m.reduce((s, c) => s + c[ch], 0) / m.length) : q; });
    }
    return { C, lab };
  }
  /* fit a still frame: greedy blob insertion at the largest error, then joint refinement, then the
     blob colours are merged into a K-colour palette (the editable colours) and refined once more    */
  window.__blobFit = function (T, W, H, opt) {
    opt = Object.assign({ N: 10, K: 6, iters: 60, final: 400 }, opt || {});
    const P = W * H, img = new Float32Array(P * 3);
    /* background = the most common (median-luminance of the darkest third) colour: start from the mean */
    let bg = [0, 0, 0]; for (let i = 0; i < P; i++) for (let ch = 0; ch < 3; ch++) bg[ch] += T[i * 3 + ch] / P;
    const M = { pal: [bg], bg: 0, blobs: [] };
    let e = optimise(M, T, W, H, 20, false);
    for (let n = 0; n < opt.N; n++) {
      render(M, W, H, img);
      const R = new Float32Array(P); for (let i = 0; i < P; i++) R[i] = Math.abs(img[i * 3] - T[i * 3]) + Math.abs(img[i * 3 + 1] - T[i * 3 + 1]) + Math.abs(img[i * 3 + 2] - T[i * 3 + 2]);
      const Rb = blur3(R, W, H); let bi = 0; for (let i = 1; i < P; i++) if (Rb[i] > Rb[bi]) bi = i;
      if (Rb[bi] < 6) break;
      const x = bi % W, y = (bi / W) | 0, r = W * 0.12;
      M.pal.push([T[bi * 3], T[bi * 3 + 1], T[bi * 3 + 2]]);
      M.blobs.push({ p: Float64Array.from([x + 0.5, y + 0.5, Math.log(r), Math.log(r), 0, Math.log(r * 0.6), 1.5]), c: M.pal.length - 1 });
      e = optimise(M, T, W, H, opt.iters, false);
    }
    e = optimise(M, T, W, H, opt.final, false);
    /* merge colours into K palette entries */
    const K = Math.min(opt.K, M.pal.length), km = kmeans(M.pal, K);
    M.pal = km.C; M.bg = km.lab[M.bg]; M.blobs.forEach(b => { b.c = km.lab[b.c]; });
    M.m = {}; M.v = {}; M.step = 0;
    e = optimise(M, T, W, H, opt.final, false);
    M.err = +e.toFixed(2);
    return M;
  };
  /* follow the same blobs to another frame (palette fixed so the colour controls stay global) */
  window.__blobTrack = function (M, T, W, H, n) {
    const C = { pal: M.pal, bg: M.bg, blobs: M.blobs.map(b => ({ p: Float64Array.from(b.p), c: b.c })) };
    C.err = +optimise(C, T, W, H, n || 150, true).toFixed(2);
    return C;
  };
  /* the shot around time t in a preview: walk until a cut (big frame change) or +-maxS seconds */
  window.__shot = async function (pack, t, maxS) {
    maxS = maxS || 6;
    const v = await __getV(pack), c = document.createElement('canvas'); c.width = 32; c.height = 18; const g = c.getContext('2d', { willReadFrequently: true });
    async function fr(x) { await __seek(v, Math.max(0.05, Math.min(v.duration - 0.05, x))); g.drawImage(v, 0, 0, 32, 18); return g.getImageData(0, 0, 32, 18).data; }
    function diff(a, b) { let s = 0; for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return s / (a.length / 4 * 3); }
    const st = 0.2, base = await fr(t); let a = t, b = t, prev = base;
    for (let x = t - st; x > Math.max(0.05, t - maxS); x -= st) { const f = await fr(x); if (diff(f, prev) > 22) break; a = x; prev = f; }
    prev = base;
    for (let x = t + st; x < Math.min(v.duration - 0.05, t + maxS); x += st) { const f = await fr(x); if (diff(f, prev) > 22) break; b = x; prev = f; }
    return [+(a + 0.1).toFixed(2), +(b - 0.1).toFixed(2)];
  };
  /* blobs through the shot: fit at the reference time, then track forward and backward every dt s */
  window.__blobMotion = async function (id, opt) {
    opt = Object.assign({ dt: 0.4, N: 10, K: 6, maxS: 6 }, opt || {});
    const r = __REF.find(x => x[0] === id), sh = await __shot(r[1], r[2], opt.maxS), W = 48, H = 27;
    const M0 = __blobFit(await __target(id), W, H, opt), frames = [{ t: r[2], M: M0 }];
    let M = M0;
    for (let t = r[2] + opt.dt; t <= sh[1]; t += opt.dt) { M = __blobTrack(M, await __target(id, t - r[2]), W, H, 120); frames.push({ t: +t.toFixed(2), M }); }
    M = M0;
    for (let t = r[2] - opt.dt; t >= sh[0]; t -= opt.dt) { M = __blobTrack(M, await __target(id, t - r[2]), W, H, 120); frames.unshift({ t: +t.toFixed(2), M }); }
    return { id, shot: sh, W, H, pal: M0.pal.map(c => c.map(Math.round)), bg: M0.bg, err: M0.err, frames };
  };
  /* targets: the stored text-free mesh, or a fresh one from the preview at ref time + dt */
  window.__meshTarget = function (id) { const M = UK_CAT.saasMesh[id], D = __decode(M), T = new Float32Array(M.c * M.r * 3); D.forEach((c, i) => { T[i * 3] = c[0]; T[i * 3 + 1] = c[1]; T[i * 3 + 2] = c[2]; }); return T; };
  window.__target = async function (id, dt) { const r = __REF.find(x => x[0] === id), o = Object.assign({}, __OPT[id] || {}, { C: 48, R: 27, S: 8, k: 'auto', maxK: 9 }); const M = await __meshT(r[1], r[2] + (dt || 0), o), D = __decode(M), T = new Float32Array(48 * 27 * 3); D.forEach((c, i) => { T[i * 3] = c[0]; T[i * 3 + 1] = c[1]; T[i * 3 + 2] = c[2]; }); return T; };
  window.__tcv = function (T, W, H) { const ta = document.createElement('canvas'); ta.width = 320; ta.height = 180; const tt = document.createElement('canvas'); tt.width = W; tt.height = H; const g = tt.getContext('2d'), id2 = g.createImageData(W, H); for (let i = 0; i < W * H; i++) { id2.data[i * 4] = T[i * 3]; id2.data[i * 4 + 1] = T[i * 3 + 1]; id2.data[i * 4 + 2] = T[i * 3 + 2]; id2.data[i * 4 + 3] = 255; } g.putImageData(id2, 0, 0); const c = ta.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(tt, 0, 0, 320, 180); return ta; };
  /* fit many backgrounds from their stored meshes; result -> out/sink/<name> */
  window.__BL = {};
  window.__fitAll = function (ids, name, opt) {
    window.__ST = 'run ' + name;
    (async () => {
      try {
        const o = __grid(6);
        for (const id of ids) {
          const MD = UK_CAT.saasMesh[id], T = __meshTarget(id), M = __blobFit(T, MD.c, MD.r, Object.assign({ N: 12, K: 6 }, opt || {}));
          M.W = MD.c; M.H = MD.r; __BL[id] = M;
          __cell(o, __tcv(T, MD.c, MD.r), id); const a = document.createElement('canvas'); a.width = 320; a.height = 180; __blobDraw(a, M, MD.c, MD.r); __cell(o, a, 'n' + M.blobs.length + ' e' + M.err);
          __ST = 'run ' + name + ' ' + id;
          await Promise.resolve();   // no timers: hidden tabs throttle them to once a minute
        }
        const out = {};
        for (const id of ids) { const M = __BL[id]; out[id] = { W: M.W, H: M.H, pal: M.pal.map(c => c.map(v => Math.round(v))), bg: M.bg, err: M.err, blobs: M.blobs.map(b => [b.c].concat(Array.from(b.p).map(v => +v.toFixed(4)))) }; }
        await __sink(name, JSON.stringify(out)); __ST = 'done ' + name;
      } catch (e) { __ST = 'err ' + e + ' ' + e.stack; }
    })();
    return __ST;
  };
  window.__blobRender = function (M, W, H) { return render(M, W, H, new Float32Array(W * H * 3)); };
  /* draw a fitted model to a canvas (any size) */
  window.__blobDraw = function (cv, M, W, H) {
    const img = render(M, W, H, new Float32Array(W * H * 3)), t = document.createElement('canvas'); t.width = W; t.height = H;
    const g = t.getContext('2d'), id = g.createImageData(W, H);
    for (let i = 0; i < W * H; i++) { id.data[i * 4] = img[i * 3]; id.data[i * 4 + 1] = img[i * 3 + 1]; id.data[i * 4 + 2] = img[i * 3 + 2]; id.data[i * 4 + 3] = 255; }
    g.putImageData(id, 0, 0); const cg = cv.getContext('2d'); cg.imageSmoothingEnabled = true; cg.imageSmoothingQuality = 'high'; cg.drawImage(t, 0, 0, cv.width, cv.height);
  };
})();

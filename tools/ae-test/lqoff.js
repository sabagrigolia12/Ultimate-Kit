// node lqoff.js ref.png glass.png cx cy  - where the inside of the glass (a patch round comp point cx, cy) came from in the
// reference frame (glass off): prints the offset dx, dy (source point = glass point + offset) and the match error (0..255).
const { read } = require('./pngcrop.js');
const [, , ra, ga, cxs, cys] = process.argv, A = read(ra), G = read(ga), cx = Number(cxs), cy = Number(cys);
const gray = (I) => { const g = new Float32Array(I.w * I.h); for (let i = 0; i < I.w * I.h; i++) g[i] = (I.rgb[i * 3] + I.rgb[i * 3 + 1] + I.rgb[i * 3 + 2]) / 3; return g; };
const down = (g, w, h, f) => { const W = Math.floor(w / f), H = Math.floor(h / f), o = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) s += g[(y * f + j) * w + x * f + i]; o[y * W + x] = s / (f * f); } return { g: o, w: W, h: H }; };
const a = gray(A), g = gray(G), F = 4, a4 = down(a, A.w, A.h, F), g4 = down(g, G.w, G.h, F);
const cost = (P, Q, w, h, px, py, hw, hh, dx, dy, st) => { let s = 0, n = 0; for (let y = py - hh; y <= py + hh; y += st) for (let x = px - hw; x <= px + hw; x += st) { const sx = x + dx, sy = y + dy; if (sx < 0 || sy < 0 || sx >= w || sy >= h) return 1e9; s += Math.abs(Q[y * w + x] - P[sy * w + sx]); n++; } return s / n; };
let best = 1e9, bx = 0, by = 0; const R = 220, px = Math.round(cx / F), py = Math.round(cy / F);
for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const c = cost(a4.g, g4.g, a4.w, a4.h, px, py, 30, 15, dx, dy, 2); if (c < best) { best = c; bx = dx; by = dy; } }
let fb = 1e9, fx = bx * F, fy = by * F;
for (let dy = by * F - 6; dy <= by * F + 6; dy++) for (let dx = bx * F - 6; dx <= bx * F + 6; dx++) { const c = cost(a, g, A.w, A.h, Math.round(cx), Math.round(cy), 120, 60, dx, dy, 3); if (c < fb) { fb = c; fx = dx; fy = dy; } }
const zero = cost(a, g, A.w, A.h, Math.round(cx), Math.round(cy), 120, 60, 0, 0, 3);
console.log('offset ' + fx + ',' + fy + ' error ' + fb.toFixed(2) + ' (error at 0,0: ' + zero.toFixed(2) + ')');

// node pngdiff.js a.png b.png  - how far two same-size PNG frames are apart: pixels that differ by more than 2 levels, the largest difference
const { read } = require('./pngcrop.js');
const [, , a, b] = process.argv, A = read(a), B = read(b);
if (A.w !== B.w || A.h !== B.h) { console.log('sizes differ', A.w, A.h, B.w, B.h); process.exit(1); }
let n = 0, mx = 0;
for (let i = 0; i < A.w * A.h; i++) {
    const d = Math.max(Math.abs(A.rgb[i * 3] - B.rgb[i * 3]), Math.abs(A.rgb[i * 3 + 1] - B.rgb[i * 3 + 1]), Math.abs(A.rgb[i * 3 + 2] - B.rgb[i * 3 + 2]));
    if (d > 2) n++;
    if (d > mx) mx = d;
}
console.log('pixels differing by more than 2 levels: ' + n + ' of ' + A.w * A.h + ', largest difference ' + mx);

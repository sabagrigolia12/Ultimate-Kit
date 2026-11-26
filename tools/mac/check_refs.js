// node check_refs.js - the plugin's references to its own files, compared letter by letter (a Mac disk can be case-sensitive, Windows hides such mistakes).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', 'UltimateKit');
process.chdir(ROOT);
const real = new Set();
const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = d === '.' ? e.name : d + '/' + e.name; if (e.isDirectory()) walk(f); else real.add(f); } };
walk('.');
const refs = [];
const ix = fs.readFileSync('index.html', 'utf8');
for (const m of ix.matchAll(/(?:src|href)="([^"#:]+)"/g)) refs.push(['index.html', m[1]]);
const hs = fs.readFileSync('jsx/host.jsx', 'utf8');
for (const m of hs.matchAll(/"((?:jsx|shared)\/[^"]+)"/g)) refs.push(['jsx/host.jsx', m[1]]);
for (const f of real) {
    if (!/\.(js|jsx|css)$/.test(f) || /ort\.wasm|ort-wasm/.test(f)) continue;
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/["'(]((?:\.\/)?(?:assets|lib|bin|js|jsx|shared|css)\/[A-Za-z0-9_\-./]+\.[a-z0-9]+)["')]/g)) refs.push([f, m[1]]);
}
const lower = new Map([...real].map(r => [r.toLowerCase(), r]));
let bad = 0;
for (const [from, r] of refs) {
    const n = r.replace(/^\.\//, '');
    if (real.has(n)) continue;
    const alt = lower.get(n.toLowerCase());
    if (/^bin\//.test(n)) continue;
    bad++; console.log(alt ? 'CASE' : 'MISSING', from, '->', r, alt ? '(real ' + alt + ')' : '');
}
const names = [...real].map(r => r.toLowerCase());
console.log('references checked', refs.length, '| problems', bad, '| names differing only by case', names.length - new Set(names).size, '| non-ascii file names', [...real].filter(r => /[^\x20-\x7e]/.test(r)).length);
process.exit(bad ? 1 : 0);

const M = require('./motif.js');
const D = { 0: '###/#.#/#.#/#.#/###', 1: '.#./##./.#./.#./###', 2: '###/..#/###/#../###', 5: '###/#../###/..#/###' };
const n = 11, digits = process.argv[2] || '200', r0 = +(process.argv[3] || 3);
const W = digits.length * 3 + (digits.length - 1), c0 = Math.floor((n - W) / 2);
const fixed = [...digits].map((d, k) => M.place(n, M.art(D[d]), r0, c0 + k * 4));
const t0 = Date.now(); const out = [];
for (let s = 1; out.length < 5 && Date.now() - t0 < 90000; s++) { const lv = M.make(n, fixed, s, 30); if (lv) { out.push(lv); console.log('found seed', s, 'score', lv.score, JSON.stringify(lv.used), Math.round((Date.now() - t0) / 1000) + 's'); } }
require('fs').writeFileSync(`num-${digits}.json`, JSON.stringify(out));
console.log('total', out.length);

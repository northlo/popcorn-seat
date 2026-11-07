const M = require('./motif.js'), gen = require('../gen.js');
const D = { 0: '###/#.#/#.#/#.#/###', 1: '.#./##./.#./.#./###', 2: '###/..#/###/#../###', 5: '###/#../###/..#/###' };
const n = 11, digits = process.argv[2] || '200';
const offs = JSON.parse(process.argv[3] || '[2,3,4]');
const fixed = [...digits].map((d, k) => M.place(n, M.art(D[d]), offs[k], k * 4 + Math.floor((n - (digits.length * 4 - 1)) / 2)));
const r = M.rng(+(process.argv[4] || 5)); const c = { build: 0, rep: 0, uniq: 0, logic: 0 }; const found = []; const t0 = Date.now();
for (let t = 0; t < 100000 && Date.now() - t0 < 150000 && found.length < 4; t++) {
  const b = M.build(n, fixed, r); if (!b) continue; c.build++;
  if (!M.repair(n, b.reg, b.sol, b.F, r, 200)) continue; c.rep++;
  const s = gen.solveAll(n, b.reg, 2); if (s.length !== 1) continue; c.uniq++;
  const lr = gen.logicSolve(n, b.reg); if (lr.solved) { c.logic++; found.push({ n, reg: b.reg, sol: s[0], F: b.F, used: lr.used, score: gen.score(n, lr.used), digits, offs }); }
}
console.log(digits, JSON.stringify(offs), c, found.map(f => f.score).join(','), Math.round((Date.now() - t0) / 1000) + 's');
require('fs').writeFileSync(`num-${digits}-${offs.join('')}.json`, JSON.stringify(found));

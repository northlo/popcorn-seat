const M = require('./motif.js'), gen = require('../gen.js');
const D = { 0: '###/#.#/#.#/#.#/###', 2: '###/..#/###/#../###' };
const n = 11, fixed = [...'200'].map((d, k) => M.place(n, M.art(D[d]), 3, k * 4));
const r = M.rng(5); const c = { build: 0, rep: 0, uniq: 0, logic: 0, nosol: 0 };
for (let t = 0; t < 60; t++) {
  const b = M.build(n, fixed, r); if (!b) continue; c.build++;
  const ok = M.repair(n, b.reg, b.sol, b.F, r, 200); if (!ok) { continue; } c.rep++;
  const s = gen.solveAll(n, b.reg, 2); if (s.length !== 1) continue; c.uniq++;
  if (gen.logicSolve(n, b.reg).solved) c.logic++;
}
console.log(c);

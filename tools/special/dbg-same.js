const M = require('./motif.js'), gen = require('../gen.js');
const { slots } = require('./slots.js');
const s = slots.find(x => x.id === 25), r = M.rng(99);
// 复用 gen-special 里的布局函数
const src = require('fs').readFileSync('gen-special.js', 'utf8'); const fixedFor = eval('(' + src.match(/function fixedFor[\s\S]*?\n}\n/)[0] + ')');
const c = { lay: 0, build: 0, rep: 0, uniq: 0, logic: 0, small: 0 }; const t0 = Date.now();
while (Date.now() - t0 < 40000) {
  const fixed = fixedFor(s, r); if (!fixed) continue; c.lay++;
  for (let t = 0; t < 30; t++) { const b = M.build(s.n, fixed, r); if (!b) continue; c.build++;
    if (!M.repair(s.n, b.reg, b.sol, b.F, r, 200)) continue; c.rep++;
    if (gen.solveAll(s.n, b.reg, 2).length !== 1) continue; c.uniq++;
    if (!gen.logicSolve(s.n, b.reg).solved) continue; c.logic++;
    const sz = {}; b.reg.forEach(g => sz[g] = (sz[g] || 0) + 1); if (Object.entries(sz).some(([g, v]) => +g >= b.F && v < 2)) { c.small++; continue; } break; }
}
console.log(c);

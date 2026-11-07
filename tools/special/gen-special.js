// 生成特殊关候选：node gen-special.js <slotId,...> <每关秒数>
const M = require('./motif.js'), gen = require('../gen.js'), fs = require('fs');
const { slots, DIG } = require('./slots.js');
const ids = process.argv[2].split(',').map(Number), secs = +(process.argv[3] || 60);
function fixedFor(s, r) {
  const n = s.n;
  if (s.t === 'num') {
    const W = s.digits.length * 4 - 1, c0 = Math.floor((n - W) / 2);
    const waves = s.digits.length === 2 ? [[2, 4], [4, 2], [3, 3]] : [[2, 3, 4], [4, 3, 2], [3, 4, 3], [4, 2, 4]];
    const offs = waves[Math.floor(r() * waves.length)];
    return [...s.digits].map((d, k) => M.place(n, M.art(DIG[d]), offs[k], c0 + k * 4));
  }
  const cells = M.art(s.art), h = Math.max(...cells.map(c => c[0])) + 1, w = Math.max(...cells.map(c => c[1])) + 1;
  if (s.t === 'pic') { const r0 = Math.floor((n - h) / 2) + (r() < .5 ? 0 : (n - h) % 2), c0 = Math.floor((n - w) / 2) + (r() < .5 ? 0 : (n - w) % 2); return [M.place(n, cells, r0, c0)]; }
  for (let tries = 0; tries < 500; tries++) {
    const taken = new Set(), res = [];
    for (let k = 0; k < s.k; k++) {
      let ok = false;
      for (let a = 0; a < 80 && !ok; a++) {
        const r0 = Math.floor(r() * (n - h + 1)), c0 = Math.floor(r() * (n - w + 1)), pc = M.place(n, cells, r0, c0);
        const near = pc.some(i => { const R = Math.floor(i / n), C = i % n; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (taken.has((R + dr) * n + C + dc)) return true; return false; });
        if (near) continue; pc.forEach(i => taken.add(i)); res.push(pc); ok = true;
      }
      if (!ok) break;
    }
    if (res.length === s.k) return res;
  }
  return null;
}
for (const id of ids) {
  const s = slots.find(x => x.id === id), r = M.rng(id * 101 + 7 + (+process.argv[4] || 0)), out = [], t0 = Date.now();
  const want = s.hard ? 4 : 3;
  while (Date.now() - t0 < secs * 1000 && out.length < want) {
    const fixed = fixedFor(s, r); if (!fixed) continue;
    for (let t = 0; t < 30; t++) {
      const b = M.build(s.n, fixed, r); if (!b) continue;
      if (!M.repair(s.n, b.reg, b.sol, b.F, r, 200)) continue;
      const so = gen.solveAll(s.n, b.reg, 2); if (so.length !== 1) continue;
      const lr = gen.logicSolve(s.n, b.reg); if (!lr.solved) continue;
      const sz = {}; b.reg.forEach(g => sz[g] = (sz[g] || 0) + 1);
      if (Object.entries(sz).filter(([g, v]) => +g >= b.F && v < 2).length > 1) continue;      // 只剩 1 格的自由区最多一个
      out.push({ ...s, reg: b.reg, sol: so[0], F: b.F, used: lr.used, score: gen.score(s.n, lr.used) }); break;
    }
  }
  console.log(id, s.t, s.name, 'found', out.length, out.map(o => o.score).join(','), Math.round((Date.now() - t0) / 1000) + 's');
  fs.writeFileSync(`out/sp-${id}.json`, JSON.stringify(out));
}

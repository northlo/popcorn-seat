// 通用：按“规格”生成图案关候选。规格：{ name, n, motifs:[{art, r, c}] } 或 { name, n, copies:{art,k} }
const M = require('./motif.js'), gen = require('../gen.js'), fs = require('fs');
const SPECS = {
  cat4: { n: 9, copies: { art: '#.#/###/###', k: 4 } },
  cat5: { n: 10, copies: { art: '#.#/###/###', k: 5 } },
  fish3: { n: 10, copies: { art: '.##.#/#####/.##.#', k: 3 } },
  heart4: { n: 9, copies: { art: '#.#/###/.#.', k: 4 } },
  bigheart: { n: 10, motifs: [{ art: '.##.##./#######/#######/.#####./..###../...#...', r: 2, c: 1 }] },
  bigcat: { n: 10, motifs: [{ art: '#.....#/##...##/#######/#######/#######/.#####.', r: 2, c: 1 }] },
};
const name = process.argv[2], secs = +(process.argv[3] || 120), seed0 = +(process.argv[4] || 1);
const spec = SPECS[name], n = spec.n, out = [], t0 = Date.now();
const r = M.rng(seed0 * 7777);
function layout() {
  if (spec.motifs) return spec.motifs.map(m => M.place(n, M.art(m.art), m.r, m.c));
  // 随机摆 k 个同样的图案，彼此至少隔一格；方向统一（看起来像一排一样的图案）
  const cells = M.art(spec.copies.art), h = Math.max(...cells.map(c => c[0])) + 1, w = Math.max(...cells.map(c => c[1])) + 1;
  for (let tries = 0; tries < 500; tries++) {
    const taken = new Set(), res = [];
    for (let k = 0; k < spec.copies.k; k++) {
      let ok = false;
      for (let a = 0; a < 80 && !ok; a++) {
        const r0 = Math.floor(r() * (n - h + 1)), c0 = Math.floor(r() * (n - w + 1)), pc = M.place(n, cells, r0, c0);
        const near = pc.some(i => { const R = Math.floor(i / n), C = i % n; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (taken.has((R + dr) * n + C + dc)) return true; return false; });
        if (near) continue; pc.forEach(i => taken.add(i)); res.push(pc); ok = true;
      }
      if (!ok) break;
    }
    if (res.length === spec.copies.k) return res;
  }
  return null;
}
const c = { lay: 0, build: 0, rep: 0, ok: 0 };
while (Date.now() - t0 < secs * 1000 && out.length < 6) {
  const fixed = layout(); if (!fixed) continue; c.lay++;
  for (let t = 0; t < 40; t++) {
    const b = M.build(n, fixed, r); if (!b) continue; c.build++;
    if (!M.repair(n, b.reg, b.sol, b.F, r, 200)) continue; c.rep++;
    const s = gen.solveAll(n, b.reg, 2); if (s.length !== 1) continue;
    const lr = gen.logicSolve(n, b.reg); if (!lr.solved) continue; c.ok++;
    out.push({ name, n, reg: b.reg, sol: s[0], F: b.F, used: lr.used, score: gen.score(n, lr.used) }); break;
  }
}
console.log(name, JSON.stringify(c), out.map(o => o.score).join(','), Math.round((Date.now() - t0) / 1000) + 's');
fs.writeFileSync(`sp-${name}.json`, JSON.stringify(out));

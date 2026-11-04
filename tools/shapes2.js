// 形状关 v2：一块大的“底色区” + 其余 n-1 块全是同一类形状（T / L / 方块），每块形状正好盖住一只猫
const fs = require('fs');
const gen = require('./gen.js');
const { FAMILIES, rng, genSol } = require('./shapes.js');
function build(n, shapes, r) {
  const sol = genSol(n, r); if (!sol) return null;
  const N = n * n, reg = new Array(N).fill(-1), cats = sol.map((c, row) => row * n + c);
  const bg = Math.floor(r() * n);                 // 哪只猫留在底色区
  let k = 0;
  const order = [...Array(n).keys()].filter(x => x !== bg).sort(() => r() - .5);
  for (const row of order) {
    const cat = cats[row], cr = Math.floor(cat / n), cc = cat % n;
    let placed = false;
    const combos = []; shapes.forEach((s, si) => s.forEach((_, ai) => combos.push([si, ai, r()]))); combos.sort((a, b) => a[2] - b[2]);
    for (const [si, ai] of combos) { if (placed) break;
      const s = shapes[si], [ar, ac] = s[ai];
      const cells = [];
      let ok = true;
      for (const [dr, dc] of s) { const R = cr + dr - ar, C = cc + dc - ac; const i = R * n + C;
        if (R < 0 || R >= n || C < 0 || C >= n || reg[i] !== -1 || (i !== cat && cats.includes(i))) { ok = false; break; } cells.push(i); }
      if (!ok) continue;
      cells.forEach(i => reg[i] = k); k++; placed = true;
    }
    if (!placed) return null;
  }
  // 剩下的格子是底色区，必须连成一片
  const rest = []; for (let i = 0; i < N; i++) if (reg[i] === -1) rest.push(i);
  const seen = new Set([rest[0]]), q = [rest[0]];
  while (q.length) { const i = q.pop(), R = Math.floor(i / n), C = i % n;
    for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const j = (R + dr) * n + C + dc; if (R + dr >= 0 && R + dr < n && C + dc >= 0 && C + dc < n && reg[j] === -1 && !seen.has(j)) { seen.add(j); q.push(j); } } }
  if (seen.size !== rest.length) return null;
  rest.forEach(i => reg[i] = k);
  // 区号按出现顺序重排
  const map = {}; let m = 0; const out = reg.map(g => map[g] ?? (map[g] = m++));
  return { reg: out, sol };
}
module.exports = { build };
if (require.main === module) {
  const fam = process.argv[2] || 'T', n = +(process.argv[3] || 9), want = +(process.argv[4] || 5), seed0 = +(process.argv[5] || 1), secs = +(process.argv[6] || 100);
  const shapes = FAMILIES[fam]().filter(s => s.length >= 3 && s.length <= Math.max(5, n - 2));
  const out = []; let tries = 0, built = 0, uniq = 0, big = 0, nolog = 0; const t0 = Date.now();
  for (let s = seed0; out.length < want && Date.now() - t0 < secs * 1000; s++) {
    tries++; const b = build(n, shapes, rng(s)); if (!b) continue; built++;
    const sols = gen.solveAll(n, b.reg, 2); if (sols.length !== 1) continue; uniq++;
    const sz = Array(n).fill(0); b.reg.forEach(g => sz[g]++);
    if (Math.max(...sz) > n * n * .5) { big++; continue; }
    const res = gen.logicSolve(n, b.reg); if (!res.solved) { nolog++; continue; }
    out.push({ fam, n, seed: s, reg: b.reg, sol: sols[0], used: res.used, score: gen.score(n, res.used) });
  }
  console.log(fam, n, 'tries', tries, 'built', built, 'unique', uniq, 'big', big, 'nolog', nolog, 'found', out.length, Math.round((Date.now() - t0) / 1000) + 's', out.map(o => o.score).join(','));
  fs.writeFileSync(`${__dirname}/shape-${fam}-${n}.json`, JSON.stringify(out));
}

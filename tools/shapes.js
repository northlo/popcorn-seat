// 形状关：所有颜色区域都是同一类规律形状（T 形 / L 形 / 方块），先随机拼出分区，再筛出唯一解、能纯推理解开的
const fs = require('fs');
const gen = require('./gen.js');
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const norm = cells => { const mr = Math.min(...cells.map(c => c[0])), mc = Math.min(...cells.map(c => c[1])); return cells.map(([r, c]) => [r - mr, c - mc]).sort((x, y) => x[0] - y[0] || x[1] - y[1]); };
const rot = cells => cells.map(([r, c]) => [c, -r]);
const flip = cells => cells.map(([r, c]) => [r, -c]);
function variants(base, mirror) {
  const out = new Map(); let s = base;
  for (let k = 0; k < 4; k++) { for (const v of mirror ? [s, flip(s)] : [s]) { const nv = norm(v); out.set(JSON.stringify(nv), nv); } s = rot(s); }
  return [...out.values()];
}
const FAMILIES = {
  T: () => { const L = []; for (let a = 3; a <= 7; a++) for (let p = 1; p <= a - 2; p++) for (let b = 1; b <= 5; b++) { if (a + b > 11) continue; const cs = []; for (let c = 0; c < a; c++) cs.push([0, c]); for (let r = 1; r <= b; r++) cs.push([r, p]); L.push(...variants(cs, true)); } return L; },
  L: () => { const L = []; for (let a = 2; a <= 6; a++) for (let b = 2; b <= 6; b++) { const cs = []; for (let r = 0; r < a; r++) cs.push([r, 0]); for (let c = 1; c < b; c++) cs.push([a - 1, c]); L.push(...variants(cs, true)); } return L; },
  R: () => { const L = []; for (let h = 1; h <= 5; h++) for (let w = 1; w <= 5; w++) { if (h * w < 2 || h * w > 15) continue; const cs = []; for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cs.push([r, c]); L.push(cs); } return L; },
};
function partition(n, shapes, r, sol) {
  const isCat = i => sol && sol[Math.floor(i / n)] === i % n;
  const N = n * n, reg = new Array(N).fill(-1);
  const sizes = shapes.map(s => s.length), smin = Math.min(...sizes), smax = Math.max(...sizes);
  let steps = 0;
  function rec(k) {
    if (++steps > 4000) return false;
    let u = reg.indexOf(-1);
    const left = N - reg.filter(x => x >= 0).length, regsLeft = n - k;
    if (u < 0) return k === n;
    if (regsLeft <= 0 || left < regsLeft * smin || left > regsLeft * smax) return false;
    const ur = Math.floor(u / n), uc = u % n;
    const order = shapes.map((s, i) => [r(), i]).sort((a, b) => a[0] - b[0]).map(x => shapes[x[1]]);
    for (const s of order) {
      const [r0, c0] = s[0];      // 第一格对准 u（u 是阅读顺序上第一个空格）
      const cells = [];
      let ok = true;
      for (const [dr, dc] of s) { const R = ur + dr - r0, C = uc + dc - c0; if (R < 0 || R >= n || C < 0 || C >= n || reg[R * n + C] !== -1) { ok = false; break; } cells.push(R * n + C); }
      if (!ok) continue;
      if (sol && cells.filter(isCat).length !== 1) continue;   // 每块正好盖住一只猫（先定答案再拼形状）
      cells.forEach(i => reg[i] = k);
      if (rec(k + 1)) return true;
      cells.forEach(i => reg[i] = -1);
    }
    return false;
  }
  return rec(0) ? reg : null;
}
function genSol(n, r) { // 随机答案：相邻两行的猫列差 > 1
  const sol = [], used = new Array(n).fill(false);
  const bt = row => { if (row === n) return true; const cols = [...Array(n).keys()].sort(() => r() - .5);
    for (const c of cols) { if (used[c] || (row && Math.abs(c - sol[row - 1]) <= 1)) continue; used[c] = true; sol[row] = c; if (bt(row + 1)) return true; used[c] = false; } return false; };
  return bt(0) ? sol : null;
}
module.exports = { FAMILIES, partition, rng, genSol };
if (require.main === module) {
  const fam = process.argv[2] || 'T', n = +(process.argv[3] || 8), want = +(process.argv[4] || 3), seed0 = +(process.argv[5] || 1);
  const shapes = FAMILIES[fam]();
  const out = []; let tries = 0, parts = 0; const t0 = Date.now();
  for (let s = seed0; out.length < want && Date.now() - t0 < 240000; s++) {
    tries++;
    const r = rng(s), sol0 = genSol(n, r); if (!sol0) continue;
    const reg = partition(n, shapes, r, sol0); if (!reg) continue; parts++;
    const sols = gen.solveAll(n, reg, 2); if (sols.length !== 1) continue;
    const res = gen.logicSolve(n, reg); if (!res.solved) continue;
    out.push({ fam, n, seed: s, reg, sol: sols[0], used: res.used, score: gen.score(n, res.used) });
  }
  console.log(fam, n, 'tries', tries, 'partitions', parts, 'found', out.length, Math.round((Date.now() - t0) / 1000) + 's', out.map(o => o.score).join(','));
  fs.writeFileSync(`/tmp/shape-${fam}-${n}.json`, JSON.stringify(out));
}

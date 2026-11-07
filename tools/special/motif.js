// 图案关生成器：先把“图案区”（数字、爱心、猫头……）钉死在棋盘上，剩下的格子分给几块“自由区”；
// 先定答案（每个区正好一只猫），再长出自由区，最后只挪自由区的边界格来保证唯一解、能靠推理解开。
const gen = require('../gen.js');
function rng(s) { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function art(s) { const cells = []; s.split('/').forEach((line, r) => [...line].forEach((ch, c) => { if (ch === '#') cells.push([r, c]); })); return cells; }

/* fixed: [[i,...], ...] 每块图案区的格子；返回 { reg, sol, fixedCount } 或 null */
function build(n, fixed, r, opts = {}) {
  const N = n * n, F = fixed.length, owner = new Array(N).fill(-1);
  fixed.forEach((cells, k) => cells.forEach(i => owner[i] = k));
  // 非图案格子的连通块（被图案围住的“洞”也算一块，必须各自至少有一只猫）
  const comp = new Array(N).fill(-1); let nc = 0;
  for (let i = 0; i < N; i++) if (owner[i] < 0 && comp[i] < 0) {
    const st = [i]; comp[i] = nc;
    while (st.length) { const j = st.pop(), R = Math.floor(j / n), C = j % n; for (const [dr, dc] of N4) { const a = R + dr, b = C + dc, k = a * n + b; if (a >= 0 && b >= 0 && a < n && b < n && owner[k] < 0 && comp[k] < 0) { comp[k] = nc; st.push(k); } } }
    nc++;
  }
  const free = n - F; if (free < nc) return null;
  // 1. 随机答案：每块图案区正好 1 只，每个连通块至少 1 只
  const sol = [], usedC = new Array(n).fill(false), inFix = new Array(F).fill(0), inComp = new Array(nc).fill(0);
  let steps = 0;
  const bt = row => {
    if (++steps > 400000) return false;
    if (row === n) return inFix.every(v => v === 1) && inComp.every(v => v >= 1);
    // 剪枝：剩下的行数要够填满还没猫的图案区
    const need = inFix.filter(v => v === 0).length; if (need > n - row) return false;
    for (const c of shuffle([...Array(n).keys()], r)) {
      if (usedC[c] || (row && Math.abs(c - sol[row - 1]) <= 1)) continue;
      const i = row * n + c, f = owner[i];
      if (f >= 0 && inFix[f]) continue;
      usedC[c] = true; sol[row] = c; if (f >= 0) inFix[f]++; else inComp[comp[i]]++;
      if (bt(row + 1)) return true;
      usedC[c] = false; if (f >= 0) inFix[f]--; else inComp[comp[i]]--;
    }
    return false;
  };
  if (!bt(0)) return null;
  // 2. 自由区：从图案区外的每只猫开始，随机往外长
  const reg = owner.slice(), cats = sol.map((c, row) => row * n + c);
  let k = F; const seeds = [];
  for (const i of cats) if (owner[i] < 0) { reg[i] = k++; seeds.push(i); }
  const frontier = seeds.slice();
  let guard = 0;
  while (reg.includes(-1) && guard++ < N * 20) {
    // 随机挑一个已有区的格子，往旁边空格长一格（偏向小的区，避免一块独大）
    const i = frontier[Math.floor(r() * frontier.length)], R = Math.floor(i / n), C = i % n;
    const opts4 = shuffle(N4.slice(), r);
    for (const [dr, dc] of opts4) { const a = R + dr, b = C + dc, j = a * n + b; if (a >= 0 && b >= 0 && a < n && b < n && reg[j] === -1) { reg[j] = reg[i]; frontier.push(j); break; } }
  }
  if (reg.includes(-1)) return null;
  return { reg, sol, F };
}
/* 只在自由区之间挪格子，修到唯一解 */
function repair(n, reg, sol, F, r, maxSteps = 120) {
  const isSeed = new Set(sol.map((c, row) => row * n + c));
  for (let step = 0; step < maxSteps; step++) {
    const alt = gen.solveAll(n, reg, 1, sol); if (!alt.length) return true;
    const cand = shuffle(alt[0].map((c, row) => row * n + c).filter(i => !isSeed.has(i) && reg[i] >= F), r);
    let moved = false;
    for (const i of cand) {
      const R = Math.floor(i / n), C = i % n;
      const nb = shuffle(N4.map(([dr, dc]) => [R + dr, C + dc]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n).map(([a, b]) => reg[a * n + b]).filter(g => g !== reg[i] && g >= F), r);
      if (!nb.length || !connectedWithout(n, reg, i)) continue;
      if (reg.filter(g => g === reg[i]).length <= 2) continue;   // 别把自由区挪成只剩 1 格
      reg[i] = nb[0]; moved = true; break;
    }
    if (!moved) return false;
  }
  return false;
}
function connectedWithout(n, reg, i) {
  const g = reg[i], cells = []; for (let j = 0; j < n * n; j++) if (j !== i && reg[j] === g) cells.push(j);
  if (!cells.length) return false;
  const seen = new Set([cells[0]]), st = [cells[0]];
  while (st.length) { const j = st.pop(), R = Math.floor(j / n), C = j % n; for (const [dr, dc] of N4) { const a = R + dr, b = C + dc, k = a * n + b; if (a >= 0 && b >= 0 && a < n && b < n && k !== i && reg[k] === g && !seen.has(k)) { seen.add(k); st.push(k); } } }
  return seen.size === cells.length;
}
function make(n, fixed, seed, tries = 400) {
  const r = rng(seed);
  for (let t = 0; t < tries; t++) {
    const b = build(n, fixed, r); if (!b) continue;
    if (!repair(n, b.reg, b.sol, b.F, r)) continue;
    const sols = gen.solveAll(n, b.reg, 2); if (sols.length !== 1) continue;
    const lr = gen.logicSolve(n, b.reg); if (!lr.solved) continue;
    // 自由区别太碎：每块至少 3 格
    const sz = {}; b.reg.forEach(g => sz[g] = (sz[g] || 0) + 1);
    if (Object.entries(sz).some(([g, s]) => +g >= b.F && s < 3 && !opts_allowSmall)) continue;
    return { n, reg: b.reg, sol: sols[0], F: b.F, used: lr.used, score: gen.score(n, lr.used) };
  }
  return null;
}
let opts_allowSmall = true;
/* 把图案画到棋盘指定位置 */
function place(n, cells, r0, c0) { return cells.map(([r, c]) => (r + r0) * n + (c + c0)); }
module.exports = { art, build, repair, make, place, rng };

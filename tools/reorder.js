// 按难度重新排 500 关：levels-v3.json → levels-v4.json
// 用法：node tools/reorder.js <小游戏项目>/js
//
// 节奏：
// - 整体越来越难，但曲线跟着现有题目的难度分布走，不会突然陡增
// - 每 10 关一个「困难」关（第 10、20…关），比附近普通关难大约一半
// - 困难关后面接两关明显轻松的，让人缓一口气
// - 金关只有 1 颗心，难度放在中等偏下
// - 第 1～3 关（教学关）和所有图案关（同形、图案、纪念数字）位置不动
// - 位置固定的图案关：比附近难很多的标「困难」，后面也接缓冲关；不够难的不标
//   第 x0 关是图案关又不够难时，这一段的困难关挪到第 x8 关
// - 前 40 关控制棋盘大小（前 20 关最多 9×9，21～40 关最多 10×10），别一上来就吓到新手
const fs = require('fs'), path = require('path');
const { countSolutions, makeRater } = require('./rate');
const gameJs = process.argv[2];
if (!gameJs) { console.error('用法：node tools/reorder.js <小游戏项目>/js'); process.exit(1); }
const rate = makeRater(gameJs);

const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels-v3.json'), 'utf8'));
const N = src.length;
const parse = l => ({ ...l, regA: l.reg.split(',').map(Number), solA: l.sol.split(',').map(Number), given: l.given || [] });
const L = src.map(parse);
const scoreOf = l => rate(l.n, l.regA, l.solA, l.given).score;
L.forEach(l => { l.score = scoreOf(l); });

// ---- 1. 给每个位置定角色 ----
const GOLD_POS = [6, 3, 8];   // 和 main.js 里一致
const isFixed = p => p <= 3 || !!L[p - 1].sp;
const role = new Array(N + 1).fill('normal');
for (let p = 1; p <= N; p++) if (isFixed(p)) role[p] = 'fixed';
// 先算一遍基础曲线，用来判断图案关够不够难
const pool0 = L.filter((l, i) => !isFixed(i + 1)).map(l => l.score).sort((a, b) => a - b);
const base0 = p => { let s = 0, c = 0; for (let q = Math.max(1, p - 15); q <= Math.min(N, p + 15); q++) { s += pool0[Math.round((q - 1) / (N - 1) * (pool0.length - 1))]; c++; } return s / c; };
const fixedHard = new Set();
for (let p = 4; p <= N; p++) if (L[p - 1].sp && L[p - 1].score >= base0(p) * 1.3) fixedHard.add(p);
const hardSlots = [];
for (let b = 1; b * 10 <= N; b++) {
  let p = b * 10;
  if (isFixed(p)) { if (fixedHard.has(p)) { hardSlots.push(p); continue; } p -= 2; }
  hardSlots.push(p); role[p] = 'hard';
}
for (const p of fixedHard) if (!hardSlots.includes(p)) hardSlots.push(p);
hardSlots.sort((a, b) => a - b);
const isGoldPos = p => p > 10 && (p - 1) % 10 === GOLD_POS[Math.floor((p - 1) / 10) % 3];
for (let p = 1; p <= N; p++) if (role[p] === 'normal' && isGoldPos(p)) role[p] = 'gold';
for (const h of hardSlots) {
  let k = 0;
  for (let p = h + 1; p <= Math.min(N, h + 4) && k < 2; p++) if (role[p] === 'normal') { role[p] = k === 0 ? 'rest1' : 'rest2'; k++; }
}

// ---- 2. 目标难度：基础曲线 × 角色系数 ----
const pool = L.filter((l, i) => role[i + 1] !== 'fixed');
const sorted = pool.map(l => l.score).sort((a, b) => a - b);
const rawBase = p => sorted[Math.round((p - 1) / (N - 1) * (sorted.length - 1))];
const base = p => { let s = 0, c = 0; for (let q = Math.max(1, p - 15); q <= Math.min(N, p + 15); q++) { s += rawBase(q); c++; } return s / c; };
const MULT = { hard: 1.5, rest1: 0.55, rest2: 0.7, gold: 0.95 };
const target = p => base(p) * (MULT[role[p]] || (0.88 + 0.025 * ((p - 1) % 10)));

// ---- 3. 按目标从易到难，把题目从易到难一一对上 ----
const slots = []; for (let p = 1; p <= N; p++) if (role[p] !== 'fixed') slots.push(p);
slots.sort((a, b) => target(a) - target(b) || a - b);
const byScore = pool.slice().sort((a, b) => a.score - b.score || a.n - b.n || a.id - b.id);
const out = new Array(N + 1);
for (let p = 1; p <= N; p++) if (role[p] === 'fixed') out[p] = L[p - 1];
slots.forEach((p, k) => { out[p] = byScore[k]; });
const cap = p => p <= 20 ? 9 : p <= 40 ? 10 : 99;
for (let p = 4; p <= 40; p++) {
  if (role[p] === 'fixed' || out[p].n <= cap(p)) continue;
  let best = -1, bd = 1e9;
  for (let q = p + 1; q <= N; q++) {
    if (role[q] === 'fixed' || out[q].n > cap(p) || out[p].n > cap(q)) continue;
    const d = Math.abs(out[q].score - out[p].score); if (d < bd) { bd = d; best = q; }
  }
  if (best > 0) [out[p], out[best]] = [out[best], out[p]];
}

// ---- 4. 困难关去掉开局给的猫（仍唯一解才去），普通关不标困难，纪念数字关不标困难 ----
for (let p = 1; p <= N; p++) {
  const l = out[p] = { ...out[p] };
  if (role[p] === 'hard') {
    l.hard = true;
    if (l.given.length && countSolutions(l.n, l.regA, []).count === 1) {
      const s2 = rate(l.n, l.regA, l.solA, []).score;
      if (s2 <= base(p) * 2.2) { l.given = []; l.score = s2; }
    }
  } else if (role[p] !== 'fixed') l.hard = false;
  if (l.sp) l.hard = fixedHard.has(p);
}

// ---- 5. 复查 + 写出 ----
let bad = 0;
for (let p = 1; p <= N; p++) {
  const l = out[p], { count, first } = countSolutions(l.n, l.regA, l.given);
  if (count !== 1 || first.join() !== l.solA.join()) { bad++; console.error('第' + p + '关唯一解检查失败'); }
}
if (bad) process.exit(1);
const res = [];
for (let p = 1; p <= N; p++) {
  const { regA, solA, ...l } = out[p];
  const o = { ...l, id: p, given: l.given, hard: !!l.hard };
  res.push(o);
}
fs.writeFileSync(path.join(__dirname, 'levels-v4.json'), JSON.stringify(res));

// 简单报告
const avg = a => (a.reduce((s, x) => s + x, 0) / a.length).toFixed(0);
console.log('区间    平均  困难关平均  缓冲关平均');
for (let s = 1; s <= N; s += 50) {
  const ps = []; for (let p = s; p < s + 50; p++) ps.push(p);
  const sc = r => ps.filter(p => role[p] === r || (r === 'rest' && /rest/.test(role[p]))).map(p => out[p].score);
  console.log(`${s}-${s + 49}`.padEnd(8), avg(ps.map(p => out[p].score)).padStart(4), avg(sc('hard')).padStart(8), avg(sc('rest')).padStart(9));
}
console.log('写出 levels-v4.json，共', res.length, '关，全部唯一解');

// 关卡 v3：500 关。1–200 关沿用 v2（特殊关位置换掉），201–500 关按同样的节奏往后排；
// 30 个特殊关：纪念关（50、100…500，拼出关卡数，困难）、同形关（25、75…）、图案关（35、85…）
const fs = require('fs');
const v2 = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));
const { slots } = require('./special/slots.js');
const hardOk = l => l.used.T_confineK >= 1 || l.used.T_lookahead >= 1;
// ---- 题库（去掉 1–200 已经用过的）----
const usedKey = new Set(v2.map(l => l.reg));
const pools = {};
for (const n of [7, 8, 9, 10, 11]) {
  const seen = new Set(), all = [];
  const files = [`pools-straight/pool-${n}.json`, `pools-more/pool-${n}.json`, `pools/pool-${n}.json`]
    .concat(fs.readdirSync(__dirname + '/pools-v3').filter(f => f.startsWith(`pool-${n}-`)).map(f => 'pools-v3/' + f));
  for (const p of files) { let arr = []; try { arr = JSON.parse(fs.readFileSync(__dirname + '/' + p, 'utf8')); } catch (e) {}
    for (const l of arr) { const k = l.reg.join(','); if (seen.has(k) || usedKey.has(k)) continue; seen.add(k); all.push(l); } }
  pools[n] = all.sort((a, b) => a.score - b.score);
}
console.log('pool sizes', Object.fromEntries(Object.entries(pools).map(([k, v]) => [k, v.length + '/' + v.filter(hardOk).length + 'H'])));
// ---- 201–500 的尺寸安排：和 v2 后半段一样的节奏，11 格占比在 55%–70% 之间起伏 ----
const OFF = [0, -.08, .06, .14, -.18, .05, .12, .18, -.15];
const plan = [];
for (let b = 20; b < 50; b++) {
  const n11 = [4, 5, 4, 5, 5][b % 5];
  const big = OFF.map((o, p) => ({ o, p })).filter(x => x.p !== 4 && x.p !== 8).sort((x, y) => y.o - x.o);
  const sizes = new Array(9);
  sizes[4] = b % 2 ? 9 : 8; sizes[8] = b % 2 ? 8 : 9;
  big.forEach((x, k) => { sizes[x.p] = k < n11 ? 11 : 10; });
  sizes.forEach((n, p) => plan.push({ n, hard: false, off: OFF[p], relax: p === 4 || p === 8, b }));
  plan.push({ n: b % 2 ? 10 : 11, hard: true, b });
}
const appear = {}; plan.forEach(s => { const k = s.n + (s.hard ? 'H' : ''); s.idx = appear[k] = (appear[k] || 0) + 1; });
const used = new Set();
const pick = (list, q) => { let i = Math.round(q * (list.length - 1));
  for (let d = 0; d < list.length; d++) for (const j of [i + d, i - d]) if (j >= 0 && j < list.length && !used.has(list[j])) { used.add(list[j]); return list[j]; }
  throw new Error('pool exhausted'); };
const out = v2.map(l => ({ ...l }));
// 后 300 关难度：每种尺寸先算要用几关，从题库中段到最难的一段里均匀挑出这么多关，按出现顺序从易到难排（不会挤在最难的那头撞车）
const need = {}; plan.forEach(s => { const k = s.n + (s.hard ? 'H' : '') + (s.relax ? 'R' : ''); need[k] = (need[k] || 0) + 1; });
const chosen = {};
for (const k of Object.keys(need)) {
  const n = parseInt(k), hard = k.includes('H'), relax = k.includes('R');
  const list = (hard ? pools[n].filter(hardOk) : pools[n]).filter(l => !used.has(l));
  const lo = Math.floor(list.length * (hard ? .65 : relax ? .42 : .64)), hi = list.length - 1, m = need[k];
  const start = Math.max(0, Math.min(lo, hi + 1 - m));
  const picks = [];
  for (let j = 0; j < m; j++) { let idx = Math.round(start + (hi - start) * (m > 1 ? j / (m - 1) : .5)); while (used.has(list[idx]) && idx > 0) idx--; while (used.has(list[idx])) idx++; used.add(list[idx]); picks.push(list[idx]); }
  chosen[k] = picks.sort((a, b) => a.score - b.score);
}
plan.forEach((s, k) => {
  const id = 201 + k, key = s.n + (s.hard ? 'H' : '') + (s.relax ? 'R' : ''), lv = chosen[key].shift();
  out.push({ id, n: lv.n, hard: s.hard, reg: lv.reg.join(','), sol: lv.sol.join(','), score: lv.score, tech: lv.used, given: [] });
});
// ---- 特殊关：换进去，颜色指定好（图案用鲜艳色，其余区用淡色）----
const STRONG = [5, 0, 1, 4, 10, 2, 6, 8];
let nsp = 0;
for (const s of slots) {
  let cands = []; try { cands = JSON.parse(fs.readFileSync(`${__dirname}/special/out/sp-${s.id}.json`, 'utf8')); } catch (e) {}
  if (!cands.length) { console.log('!! no candidate for', s.id, s.t, s.name); continue; }
  const old = out[s.id - 1];
  let best;
  if (s.hard) best = cands.filter(hardOk).sort((a, b) => b.score - a.score)[0] || cands.sort((a, b) => b.score - a.score)[0];
  else best = cands.sort((a, b) => Math.abs(a.score - old.score) - Math.abs(b.score - old.score))[0];
  const colors = []; for (let g = 0; g < best.n; g++) colors.push(g < best.F ? STRONG[g % STRONG.length] : 12 + (g - best.F));
  // 前 30 关的普通关开局送一只：送在淡色区里
  let given = [];
  if (!s.hard && s.id <= 30) { const row = best.sol.findIndex((c, r) => best.reg[r * best.n + c] >= best.F); if (row >= 0) given = [row * best.n + best.sol[row]]; }
  out[s.id - 1] = { id: s.id, n: best.n, hard: s.hard, reg: best.reg.join(','), sol: best.sol.join(','), score: best.score, tech: best.used, given,
    sp: { t: s.t, name: s.name, F: best.F }, colors };
  nsp++;
}
fs.writeFileSync(__dirname + '/levels-v3.json', JSON.stringify(out));
console.log('levels', out.length, 'special', nsp);
const bySize = {}; out.slice(200).forEach(l => bySize[l.n + (l.hard ? 'H' : '')] = (bySize[l.n + (l.hard ? 'H' : '')] || 0) + 1); console.log('201-500 sizes', bySize);
console.log('201-500 scores by 50:', [...Array(6).keys()].map(k => { const a = out.slice(200 + k * 50, 250 + k * 50); return Math.round(a.reduce((s, l) => s + l.score, 0) / a.length); }).join(' '));

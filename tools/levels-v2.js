// 关卡 v2：200 关，每 10 关一组，第 10 关是困难关
// 1–30 关：7/8/9/10 格轮换；31–50：偏 9/10；51 关起 8 格起步，每组固定有 1 个 8 格、1 个 9 格放松关，10/11 格的比例越往后越高
// 难度“松弛有度”：同一组里难一关、松一关交替；同尺寸的题按出现顺序慢慢变难
const fs = require('fs');
const load = p => { try { return JSON.parse(fs.readFileSync(__dirname + '/' + p, 'utf8')); } catch (e) { return []; } };
const pools = {};
for (const n of [7, 8, 9, 10, 11]) {
  const seen = new Set(), all = [];
  for (const p of [`pools-straight/pool-${n}.json`, `pools-more/pool-${n}.json`]) for (const l of load(p)) { const k = l.reg.join(','); if (!seen.has(k)) { seen.add(k); all.push(l); } }
  pools[n] = all.sort((a, b) => a.score - b.score);
}
const hardOk = l => l.used.T_confineK >= 1 || l.used.T_lookahead >= 1;
const isSimple = l => !l.used.T_confineK && !l.used.T_lookahead;
// ---- 每组的尺寸安排 ----
const OFF = [0, -.08, .06, .14, -.18, .05, .12, .18, -.15];   // 组内难度起伏：第 5、9 关是放松关
const early = [
  [7, 7, 7, 8, 7, 8, 7, 9, 8], [7, 8, 9, 8, 7, 9, 10, 8, 9], [8, 9, 10, 7, 9, 10, 8, 9, 10],
  [9, 8, 10, 9, 7, 10, 9, 10, 8], [9, 10, 8, 10, 9, 10, 7, 10, 9]];
const HARD = [8, 9, 10, 10, 11];
const BLOCKS = 20, plan = [];
for (let b = 0; b < BLOCKS; b++) {
  let sizes;
  if (b < 5) sizes = early[b];
  else {
    const r = .3 + .55 * (b - 5) / (BLOCKS - 6);             // 11 格的占比 30% → 85%
    const n11 = Math.round(7 * r);
    const big = OFF.map((o, p) => ({ o, p })).filter(x => x.p !== 4 && x.p !== 8).sort((x, y) => y.o - x.o);
    sizes = new Array(9);
    sizes[4] = b % 2 ? 9 : 8; sizes[8] = b % 2 ? 8 : 9;    // 两个放松关：一个 8 格、一个 9 格
    big.forEach((x, k) => { sizes[x.p] = k < n11 ? 11 : 10; });
  }
  sizes.forEach((n, p) => plan.push({ n, hard: false, off: OFF[p], relax: p === 4 || p === 8, b }));
  plan.push({ n: b < 5 ? HARD[b] : (b < 9 && b % 2 ? 10 : 11), hard: true, b });
}
// ---- 按尺寸分配题目 ----
const used = new Set();
const pick = (list, q) => {
  let i = Math.round(q * (list.length - 1));
  for (let d = 0; d < list.length; d++) for (const j of [i + d, i - d]) if (j >= 0 && j < list.length && !used.has(list[j])) { used.add(list[j]); return list[j]; }
  throw new Error('pool exhausted');
};
const appear = {}; plan.forEach(s => { const k = s.n + (s.hard ? 'H' : ''); s.idx = appear[k] = (appear[k] || 0) + 1; });
const total = {}; Object.assign(total, appear);
const out = [];
plan.forEach((s, i) => {
  const key = s.n + (s.hard ? 'H' : ''), t = total[key] > 1 ? (s.idx - 1) / (total[key] - 1) : .5;
  let lv;
  if (i < 3) lv = pick(pools[7].filter(isSimple), i * .05);                     // 教学关：最简单的 7×7
  else if (s.hard) lv = pick(pools[s.n].filter(hardOk), (s.b < 2 ? .08 : .25) + .7 * t);
  else {
    let list = pools[s.n];
    if (s.b < 3) list = list.filter(l => !l.used.T_lookahead || l.used.T_lookahead <= 1);
    let q = .03 + .8 * t + s.off * .5;
    if (s.relax) q = Math.min(q, .55);
    if (s.n === 7) q = Math.min(q, .35);                                          // 小棋盘在后面出现时当放松关
    lv = pick(list, Math.max(0, Math.min(.97, q)));
  }
  out.push({ lv, hard: s.hard });
});
const givenOf = lv => { const sz = Array(lv.n).fill(0); lv.reg.forEach(g => sz[g]++); let best = 0;
  for (let r = 1; r < lv.n; r++) if (sz[lv.reg[r * lv.n + lv.sol[r]]] > sz[lv.reg[best * lv.n + lv.sol[best]]]) best = r; return best * lv.n + lv.sol[best]; };
const levels = out.map(({ lv, hard }, i) => ({ id: i + 1, n: lv.n, hard, reg: lv.reg.join(','), sol: lv.sol.join(','), score: lv.score, tech: lv.used, given: (hard || i < 30) ? [givenOf(lv)] : [] }));
fs.writeFileSync(__dirname + '/levels.json', JSON.stringify(levels));
console.log('levels', levels.length);
for (let b = 0; b < BLOCKS; b++) console.log(String(b * 10 + 1).padStart(3), levels.slice(b * 10, b * 10 + 10).map(l => `${l.n}${l.hard ? 'H' : ''}:${l.score}`).join(' '));

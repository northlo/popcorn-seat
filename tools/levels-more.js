// 第 56–110 关：5 组，每组 = 1 个 11×11 困难关 + 3 个 10×10 + 7 个 11×11；难度跨组慢慢升
// 只从新题库 pools-more 里挑，和前 55 关不会重复；前 55 关保持不变
const fs = require('fs');
const base = require('./levels.json').slice(0, 55);
const seen = new Set(base.map(l => l.reg));
const load = n => JSON.parse(fs.readFileSync(`${__dirname}/pools-more/pool-${n}.json`, 'utf8')).filter(l => !seen.has(l.reg.join(','))).sort((a, b) => a.score - b.score);
const p10 = load(10), p11 = load(11);
const GROUPS = 5;
const spread = (list, count, lo, hi) => { // 在排好序的列表 [lo, hi) 分位之间均匀挑 count 个
  const out = [], a = Math.floor(lo * list.length), b = Math.ceil(hi * list.length) - 1;
  for (let k = 0; k < count; k++) out.push(list[Math.round(a + (b - a) * k / Math.max(1, count - 1))]);
  return out;
};
const hard = spread(p11.slice(Math.floor(p11.length * .72)), GROUPS, 0, 1);
const used = new Set(hard);
const n11 = spread(p11.filter(l => !used.has(l)), GROUPS * 7, 0, .82);
const n10 = spread(p10, GROUPS * 3, 0, .8);
if (new Set(n11).size !== n11.length || new Set(n10).size !== n10.length) throw new Error('duplicate pick, need more pool');
const givenOf = lv => { const sz = Array(lv.n).fill(0); lv.reg.forEach(g => sz[g]++); let best = 0;
  for (let r = 1; r < lv.n; r++) if (sz[lv.reg[r * lv.n + lv.sol[r]]] > sz[lv.reg[best * lv.n + lv.sol[best]]]) best = r; return best * lv.n + lv.sol[best]; };
const out = base.slice();
for (let g = 0; g < GROUPS; g++) {
  const seq = [{ lv: hard[g], hard: true }, ...n10.slice(g * 3, g * 3 + 3).map(lv => ({ lv })), ...n11.slice(g * 7, g * 7 + 7).map(lv => ({ lv }))];
  for (const { lv, hard: h } of seq) out.push({ id: out.length + 1, n: lv.n, hard: !!h, reg: lv.reg.join(','), sol: lv.sol.join(','), score: lv.score, tech: lv.used, given: h ? [givenOf(lv)] : [] });
}
fs.writeFileSync(__dirname + '/levels.json', JSON.stringify(out));
console.log('levels', out.length);
console.log(out.slice(55).map(l => `${l.id}:${l.n}${l.hard ? 'H' : ''}:${l.score}`).join(' '));

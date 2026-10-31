// 每日挑战题库：和主线关卡用不同的种子，保证不重复
// 一周节奏：周一二 8×8，周三四五 9×9，周六日 10×10；题库用完后客户端会旋转/翻转棋盘再循环
const fs = require('fs');
const gen = require('./gen.js');
gen.setStraight(6);
const NEED = { 8: 52, 9: 78, 10: 52 };   // 26 周
const isSimple = lv => lv.used.T_lookahead === 0 && lv.used.T_confineK === 0;
const mildOk = lv => lv.used.T_lookahead === 0 && lv.used.T_confineK <= 1;
const shapeOk = lv => {
  const sz = Array(lv.n).fill(0); lv.reg.forEach(g => sz[g]++);
  return sz.filter(x => x === 1).length <= 1 && Math.max(...sz) <= lv.n * lv.n * 0.32;
};
const givenOf = lv => {
  const sz = Array(lv.n).fill(0); lv.reg.forEach(g => sz[g]++);
  let best = 0;
  for (let r = 1; r < lv.n; r++) if (sz[lv.reg[r * lv.n + lv.sol[r]]] > sz[lv.reg[best * lv.n + lv.sol[best]]]) best = r;
  return best * lv.n + lv.sol[best];
};
const out = {};
const t0 = Date.now();
for (const n of [8, 9, 10]) {
  const file = __dirname + `/daily-${n}.json`;
  let list = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  let s = list.length ? list[list.length - 1].seed + 1 : 9000000 + n * 100000;
  const ok = lv => shapeOk(lv) && (n >= 10 ? mildOk(lv) : isSimple(lv));
  while (list.length < NEED[n]) {
    const lv = gen.makeLevel(n, s);
    if (lv && ok(lv)) { list.push({ seed: s, n, reg: lv.reg.map(g => g.toString(36)).join(''), sol: lv.sol.map(g => g.toString(36)).join(''), given: givenOf(lv), score: lv.score }); fs.writeFileSync(file, JSON.stringify(list)); }
    s++;
  }
  out[n] = list.map(l => [l.reg, l.sol, l.given]);
  console.log('daily', n, list.length, 'scores', Math.min(...list.map(l => l.score)), Math.max(...list.map(l => l.score)), Math.round((Date.now() - t0) / 1000) + 's');
}
fs.writeFileSync(__dirname + '/daily.json', JSON.stringify(out));

// 追加题库：只生成新的 10×10、11×11 候选，存到 pools-more/，不动原来的题库（保证前 55 关不变）
const fs = require('fs');
const gen = require('./gen.js'); gen.setStraight(6);
const shapeOk = lv => { const sz = Array(lv.n).fill(0); lv.reg.forEach(g => sz[g]++); return sz.filter(x => x === 1).length <= 1 && Math.max(...sz) <= lv.n * lv.n * 0.32; };
const dir = __dirname + '/pools-more'; if (!fs.existsSync(dir)) fs.mkdirSync(dir);
const NEED = { 10: 40, 11: 90 };
const t0 = Date.now();
for (const n of [10, 11]) {
  const file = `${dir}/pool-${n}.json`;
  let pool = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  let s = pool.length ? Math.max(...pool.map(p => p.seed)) + 1 : 7000000 + n * 100000;
  while (pool.length < NEED[n]) {
    const lv = gen.makeLevel(n, s);
    if (lv && shapeOk(lv)) { pool.push(Object.assign(lv, { seed: s })); fs.writeFileSync(file, JSON.stringify(pool)); console.log(n, pool.length, Math.round((Date.now() - t0) / 1000) + 's'); }
    s++;
  }
}
console.log('done');

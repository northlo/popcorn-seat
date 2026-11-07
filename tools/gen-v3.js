// 给 500 关补题：生成更多 n×n 普通关，存到 pools-v3/
const gen = require('./gen.js'), fs = require('fs');
gen.setStraight(6);
const n = +process.argv[2], want = +process.argv[3], seed0 = +process.argv[4];
const file = `${__dirname}/pools-v3/pool-${n}-${seed0}.json`;
const shapeOk = lv => { const sz = Array(lv.n).fill(0); lv.reg.forEach(g => sz[g]++); return sz.filter(x => x === 1).length <= 1 && Math.max(...sz) <= lv.n * lv.n * 0.32; };
const out = []; const t0 = Date.now();
for (let s = seed0; out.length < want; s++) {
  const lv = gen.makeLevel(n, s);
  if (lv && shapeOk(lv)) { out.push(Object.assign(lv, { seed: s })); if (out.length % 20 === 0) { fs.writeFileSync(file, JSON.stringify(out)); console.log(n, out.length, Math.round((Date.now() - t0) / 1000) + 's'); } }
}
fs.writeFileSync(file, JSON.stringify(out)); console.log('done', n, out.length);

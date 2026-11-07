// 扫描所有 n 格形状：能不能铺满 n×n，铺出来的题有没有唯一解、能不能推理解开
const gen = require('../gen.js'), fs = require('fs');
const { orients, tileOnce, rng } = require('./tile.js');
const n = +process.argv[2], part = +(process.argv[3] || 0), parts = +(process.argv[4] || 1), ms = +(process.argv[5] || 1500);
const shapes = JSON.parse(fs.readFileSync(`polys-${n}.json`)).filter((_, i) => i % parts === part);
const res = [], stat = { t: 0, z: 0, u: 0, tileable: 0 };
for (const [si, shape] of shapes.entries()) {
  const ors = orients(shape), t0 = Date.now(), seen = new Set(), found = [];
  let fails = 0, zero = 0, uniq = 0;
  for (let s = 1; Date.now() - t0 < ms; s++) {
    const reg = tileOnce(n, ors, rng(s * 2654435761 + si), 30000);
    if (!reg) { if (++fails > 25 && !seen.size) break; continue; }
    const k = reg.join(','); if (seen.has(k)) continue; seen.add(k);
    const nsol = gen.solveAll(n, reg, 2).length; if (nsol === 0) zero++; if (nsol !== 1) continue; uniq++;
    const lr = gen.logicSolve(n, reg); if (!lr.solved) continue;
    found.push({ reg, used: lr.used, score: gen.score(n, lr.used) });
    if (found.length >= 6) break;
  }
  stat.t += seen.size; stat.z += zero; stat.u += uniq; if (seen.size) stat.tileable++;
  if (found.length) res.push({ shape, tilings: seen.size, found });
}
fs.writeFileSync(`scan-${n}-${part}.json`, JSON.stringify(res));
console.log(n, part, "shapes", shapes.length, "good", res.length, JSON.stringify(stat));

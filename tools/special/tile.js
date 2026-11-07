// 同形关试验：用同一种形状（可旋转、翻转）把 n×n 棋盘铺满，n 块正好 n 个区；挑出唯一解且能靠推理解开的
const gen = require('../gen.js');
function rng(s) { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function norm(cells) { const mr = Math.min(...cells.map(c => c[0])), mc = Math.min(...cells.map(c => c[1])); return cells.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); }
function orients(shape) {
  const out = new Map(); let s = shape;
  for (let f = 0; f < 2; f++) { for (let k = 0; k < 4; k++) { s = s.map(([r, c]) => [c, -r]); const n = norm(s); out.set(JSON.stringify(n), n); } s = s.map(([r, c]) => [r, -c]); }
  return [...out.values()];
}
function parse(art) { const cells = []; art.trim().split('\n').forEach((line, r) => [...line.trim()].forEach((ch, c) => { if (ch === '#') cells.push([r, c]); })); return cells; }
function tileOnce(n, ors, r, budget) {
  const reg = new Array(n * n).fill(-1); let k = 0, steps = 0;
  const order = ors.map(o => o);   // 每个方向的锚点：按行序第一个格子
  function rec() {
    if (++steps > budget) return false;
    let i = reg.indexOf(-1); if (i < 0) return true;
    const R = Math.floor(i / n), C = i % n;
    const cand = order.slice().sort(() => r() - .5);
    for (const o of cand) {
      const [ar, ac] = o[0]; let ok = true; const cells = [];
      for (const [dr, dc] of o) { const rr = R + dr - ar, cc = C + dc - ac; if (rr < 0 || cc < 0 || rr >= n || cc >= n || reg[rr * n + cc] !== -1) { ok = false; break; } cells.push(rr * n + cc); }
      if (!ok) continue;
      cells.forEach(j => reg[j] = k); k++;
      if (rec()) return true;
      k--; cells.forEach(j => reg[j] = -1);
    }
    return false;
  }
  return rec() ? reg : null;
}
module.exports = { orients, parse, tileOnce, rng };
if (require.main === module) {
  const n = +process.argv[2], art = process.argv[3].replace(/\|/g, '\n'), secs = +(process.argv[4] || 30);
  const shape = parse(art); if (shape.length !== n) throw new Error('shape size ' + shape.length + ' != ' + n);
  const ors = orients(shape); const t0 = Date.now(); let tiled = 0, uniq = 0, logic = 0; const seen = new Set(), found = [];
  for (let s = 1; Date.now() - t0 < secs * 1000; s++) {
    const reg = tileOnce(n, ors, rng(s * 7919), 20000); if (!reg) continue;
    const key = reg.join(','); if (seen.has(key)) continue; seen.add(key); tiled++;
    const sols = gen.solveAll(n, reg, 2); if (sols.length !== 1) continue; uniq++;
    const res = gen.logicSolve(n, reg); if (!res.solved) continue; logic++;
    found.push({ reg, sol: sols[0], used: res.used, score: gen.score(n, res.used) });
  }
  console.log(JSON.stringify({ n, tiled, uniq, logic, scores: found.map(f => f.score).slice(0, 10) }));
  require('fs').writeFileSync(`found-${n}-${process.argv[5] || 'x'}.json`, JSON.stringify(found));
}

// 生成所有 n 格的自由多联骨牌（旋转、翻转算同一种）
const { orients } = require('./tile.js');
const key = cells => orients(cells).map(o => JSON.stringify(o)).sort()[0];
function polys(n) {
  let cur = new Map([[key([[0, 0]]), [[0, 0]]]]);
  for (let s = 2; s <= n; s++) {
    const next = new Map();
    for (const cells of cur.values()) {
      const has = new Set(cells.map(c => c.join(',')));
      for (const [r, c] of cells) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = [r + dr, c + dc]; if (has.has(nc.join(','))) continue;
        const nxt = [...cells, nc]; const k = key(nxt); if (!next.has(k)) next.set(k, JSON.parse(k));
      }
    }
    cur = next;
  }
  return [...cur.values()];
}
module.exports = { polys };
if (require.main === module) { const n = +process.argv[2]; const p = polys(n); console.log(n, p.length); require('fs').writeFileSync(`polys-${n}.json`, JSON.stringify(p)); }

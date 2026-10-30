// 独立复查：用最朴素的逐行回溯（和生成器的求解器写法不同），数每关有几个解
const L = require('./levels.json');
let bad = 0;
for (const l of L) {
  const n = l.n, reg = l.reg.split(',').map(Number), sol = l.sol.split(',').map(Number);
  let cnt = 0;
  const usedC = Array(n).fill(false), usedR = Array(n).fill(false), perm = [];
  (function bt(r) {
    if (cnt > 1) return;
    if (r === n) { cnt++; return; }
    for (let c = 0; c < n; c++) {
      if (usedC[c] || (r > 0 && Math.abs(perm[r - 1] - c) <= 1)) continue;
      const g = reg[r * n + c];
      if (usedR[g]) continue;
      usedC[c] = usedR[g] = true; perm[r] = c;
      bt(r + 1);
      usedC[c] = usedR[g] = false;
    }
  })(0);
  const solOk = new Set(sol.map((c, r) => reg[r * n + c])).size === n &&
    new Set(sol).size === n && sol.every((c, r) => r === 0 || Math.abs(sol[r - 1] - c) > 1);
  const givenOk = (l.given || []).every(i => sol[Math.floor(i / n)] === i % n);
  if (cnt !== 1 || !solOk || !givenOk) { bad++; console.log('BAD', l.id, cnt, solOk, givenOk); }
}
console.log('total', L.length, 'bad', bad);

const L = require('./levels.json');
let bad = 0;
for (const l of L) {
  const n = l.n, reg = l.reg.split('').map(Number), sol = l.sol.split('').map(Number);
  // brute force all permutations count
  let cnt = 0;
  const perm = [], used = Array(n).fill(false);
  (function bt(r){ if(r===n){ const regs=new Set(perm.map((c,i)=>reg[i*n+c])); if(regs.size===n) cnt++; return;}
    for(let c=0;c<n;c++){ if(used[c]) continue; if(r>0&&Math.abs(perm[r-1]-c)<=1) continue; used[c]=true; perm[r]=c; bt(r+1); used[c]=false; } })(0);
  const sizes = Array(n).fill(0); reg.forEach(g=>sizes[g]++);
  const solOk = new Set(sol.map((c,r)=>reg[r*n+c])).size===n;
  if (cnt!==1||!solOk) { bad++; console.log('BAD', l.id, cnt); }
  if (l.id<=3||l.id%10===0) console.log(l.id, n, 'solutions', cnt, 'region sizes', sizes.join(','));
}
console.log('total', L.length, 'bad', bad);

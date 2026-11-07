// 检查 500 关：每关唯一解、能纯推理解开、答案对得上、开局送的猫在答案上、特殊关颜色不重复
const gen = require('./gen.js');
const L = require('./levels-v3.json');
let bad = 0;
L.forEach((l, k) => {
  const reg = l.reg.split(',').map(Number), sol = l.sol.split(',').map(Number), n = l.n;
  const sols = gen.solveAll(n, reg, 2);
  const err = [];
  if (sols.length !== 1) err.push('解的个数=' + sols.length);
  else if (sols[0].join() !== sol.join()) err.push('答案不符');
  if (!gen.logicSolve(n, reg).solved) err.push('推理解不开');
  for (const g of l.given || []) if (sol[Math.floor(g / n)] !== g % n) err.push('送的猫不在答案上');
  if (new Set(reg).size !== n) err.push('区数不对');
  if (l.colors && new Set(l.colors).size !== n) err.push('颜色重复');
  if (err.length) { bad++; console.log(k + 1, err.join('，')); }
});
console.log('checked', L.length, 'bad', bad, 'special', L.filter(l => l.sp).length);

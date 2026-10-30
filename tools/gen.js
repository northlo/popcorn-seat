// 爆米花找座位 关卡生成器
// 规则：N×N 棋盘，N 个颜色区；每行、每列、每区各 1 只猫；猫不能相邻（含斜角）
// 生成的关卡保证：唯一解，并且只用推理技巧就能解开（不需要猜）

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, r) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 随机答案：sol[row] = col，行列各一且相邻行列差 > 1
function genSolution(n, r) {
  const sol = [];
  const used = new Array(n).fill(false);
  function bt(row) {
    if (row === n) return true;
    const cols = shuffle([...Array(n).keys()], r);
    for (const c of cols) {
      if (used[c]) continue;
      if (row > 0 && Math.abs(sol[row - 1] - c) <= 1) continue;
      used[c] = true; sol[row] = c;
      if (bt(row + 1)) return true;
      used[c] = false;
    }
    return false;
  }
  return bt(0) ? sol : null;
}

// 以每只猫为种子随机长出颜色区
function genRegions(n, sol, r) {
  const reg = new Array(n * n).fill(-1);
  for (let row = 0; row < n; row++) reg[row * n + sol[row]] = row;
  let left = n * n - n;
  const size = new Array(n).fill(1);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // 每个区一个“性格”：有的爱长、有的偏小，让形状大小有变化但不至于一家独大
  const appetite = [...Array(n)].map(() => 0.4 + r() * 1.6);
  while (left > 0) {
    // 找出每个区可以长进去的空格
    const frontier = [...Array(n)].map(() => []);
    for (let i = 0; i < n * n; i++) {
      if (reg[i] < 0) continue;
      const rr = Math.floor(i / n), cc = i % n;
      for (const d of dirs) {
        const nr = rr + d[0], nc = cc + d[1];
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
        const j = nr * n + nc;
        if (reg[j] < 0) frontier[reg[i]].push(j);
      }
    }
    // 小的区更容易被选中长大
    const w = frontier.map((f, g) => (f.length ? appetite[g] / Math.pow(size[g], 0.9) : 0));
    const tot = w.reduce((a, b) => a + b, 0);
    let x = r() * tot, g = 0;
    while (g < n - 1 && x > w[g]) { x -= w[g]; g++; }
    if (!frontier[g].length) continue;
    const j = frontier[g][Math.floor(r() * frontier[g].length)];
    reg[j] = g; size[g]++; left--;
  }
  return reg;
}

// 数解的个数（最多数到 cap）
function countSolutions(n, reg, cap = 2) {
  let count = 0;
  const usedC = new Array(n).fill(false);
  const usedR = new Array(n).fill(false);
  function bt(row, prev) {
    if (count >= cap) return;
    if (row === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (usedC[c]) continue;
      if (prev >= 0 && Math.abs(prev - c) <= 1) continue;
      const g = reg[row * n + c];
      if (usedR[g]) continue;
      usedC[c] = usedR[g] = true;
      bt(row + 1, c);
      usedC[c] = usedR[g] = false;
    }
  }
  bt(0, -1);
  return count;
}

// 找一个和标准答案不同的解（没有就返回 null）
function findAlt(n, reg, sol) {
  const usedC = new Array(n).fill(false), usedR = new Array(n).fill(false);
  const cur = [];
  let found = null;
  function bt(row, prev) {
    if (found) return;
    if (row === n) { if (cur.some((c, r) => c !== sol[r])) found = cur.slice(); return; }
    for (let c = 0; c < n; c++) {
      if (usedC[c] || (prev >= 0 && Math.abs(prev - c) <= 1)) continue;
      const g = reg[row * n + c];
      if (usedR[g]) continue;
      usedC[c] = usedR[g] = true; cur[row] = c;
      bt(row + 1, c);
      usedC[c] = usedR[g] = false;
      if (found) return;
    }
  }
  bt(0, -1);
  return found;
}

// 去掉格子 i 后，它原来的区是否仍然连成一片
function stillConnected(n, reg, i) {
  const g = reg[i];
  const cells = [];
  for (let j = 0; j < n * n; j++) if (j !== i && reg[j] === g) cells.push(j);
  if (!cells.length) return false;
  const seen = new Set([cells[0]]), stack = [cells[0]];
  while (stack.length) {
    const j = stack.pop(), r = Math.floor(j / n), c = j % n;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
      const k = nr * n + nc;
      if (k !== i && reg[k] === g && !seen.has(k)) { seen.add(k); stack.push(k); }
    }
  }
  return seen.size === cells.length;
}

// 有多解时，把“别的解”用到的格子划给相邻的区，直到只剩唯一解
function repairUnique(n, reg, sol, r, maxSteps = 80) {
  const isSeed = new Set(sol.map((c, row) => row * n + c));
  for (let step = 0; step < maxSteps; step++) {
    const alt = findAlt(n, reg, sol);
    if (!alt) return true;
    const cand = shuffle(alt.map((c, row) => row * n + c).filter(i => !isSeed.has(i)), r);
    let moved = false;
    for (const i of cand) {
      const row = Math.floor(i / n), col = i % n;
      const nbrs = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [row + dr, col + dc])
        .filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n)
        .map(([a, b]) => reg[a * n + b])
        .filter(g => g !== reg[i]), r);
      if (!nbrs.length || !stillConnected(n, reg, i)) continue;
      reg[i] = nbrs[0];
      moved = true;
      break;
    }
    if (!moved) return false;
  }
  return false;
}

// ---------- 模拟人类推理的求解器 ----------
// 状态：0 未知，1 排除(×)，2 猫
function logicSolve(n, reg) {
  const N = n * n;
  const st = new Array(N).fill(0);
  const used = { T_single: 0, T_confine: 0, T_confineK: 0, T_lookahead: 0 };
  const rowOf = i => Math.floor(i / n), colOf = i => i % n;

  const groups = [];
  for (let k = 0; k < n; k++) {
    groups.push({ kind: 'row', cells: [...Array(n).keys()].map(c => k * n + c) });
    groups.push({ kind: 'col', cells: [...Array(n).keys()].map(r => r * n + k) });
  }
  for (let g = 0; g < n; g++) {
    groups.push({ kind: 'reg', cells: [...Array(N).keys()].filter(i => reg[i] === g) });
  }

  function place(s, i) {
    s[i] = 2;
    const r = rowOf(i), c = colOf(i), g = reg[i];
    for (let j = 0; j < N; j++) {
      if (j === i || s[j] !== 0) continue;
      const rj = rowOf(j), cj = colOf(j);
      if (rj === r || cj === c || reg[j] === g || (Math.abs(rj - r) <= 1 && Math.abs(cj - c) <= 1)) s[j] = 1;
    }
  }
  function groupDead(s) {
    for (const gr of groups) {
      let ok = false;
      for (const i of gr.cells) if (s[i] !== 1) { ok = true; break; }
      if (!ok) return true;
    }
    return false;
  }
  const solved = s => s.filter(v => v === 2).length === n;

  let guard = 0;
  while (!solved(st) && guard++ < 500) {
    // 1. 唯一候选：某行/列/区只剩一个空格
    let progress = false;
    for (const gr of groups) {
      if (gr.cells.some(i => st[i] === 2)) continue;
      const cand = gr.cells.filter(i => st[i] === 0);
      if (cand.length === 1) { place(st, cand[0]); used.T_single++; progress = true; break; }
    }
    if (progress) continue;

    // 2. 区被锁在一行/一列 → 那一行/列的其它格排除；行/列被锁在一个区 → 那个区其它格排除
    for (const gr of groups) {
      if (gr.cells.some(i => st[i] === 2)) continue;
      const cand = gr.cells.filter(i => st[i] === 0);
      if (cand.length === 0) continue;
      const tryLock = (keyFn, kindName) => {
        const k = keyFn(cand[0]);
        if (!cand.every(i => keyFn(i) === k)) return false;
        let did = false;
        for (let j = 0; j < N; j++) {
          if (st[j] !== 0 || cand.includes(j)) continue;
          if (keyFn(j) === k) { st[j] = 1; did = true; }
        }
        return did;
      };
      if (gr.kind === 'reg') {
        if (tryLock(rowOf) || tryLock(colOf)) { used.T_confine++; progress = true; break; }
      } else {
        if (tryLock(i => reg[i])) { used.T_confine++; progress = true; break; }
      }
    }
    if (progress) continue;

    // 3. 多区锁定：k 个区的候选格全部落在同样的 k 行（或 k 列）里 → 这些行的其它格排除
    outer3:
    for (const axis of [rowOf, colOf]) {
      const regs = [];
      for (let g = 0; g < n; g++) {
        const cells = groups[2 * n + g].cells;
        if (cells.some(i => st[i] === 2)) continue;
        const lines = new Set(cells.filter(i => st[i] === 0).map(axis));
        regs.push({ g, lines });
      }
      // 只试 2 和 3 个区的组合
      for (let a = 0; a < regs.length; a++) for (let b = a + 1; b < regs.length; b++) {
        const combos = [[a, b]];
        for (let c = b + 1; c < regs.length; c++) combos.push([a, b, c]);
        for (const combo of combos) {
          const lines = new Set();
          combo.forEach(x => regs[x].lines.forEach(l => lines.add(l)));
          if (lines.size !== combo.length) continue;
          const gs = new Set(combo.map(x => regs[x].g));
          let did = false;
          for (let j = 0; j < N; j++) {
            if (st[j] === 0 && lines.has(axis(j)) && !gs.has(reg[j])) { st[j] = 1; did = true; }
          }
          if (did) { used.T_confineK++; progress = true; break outer3; }
        }
      }
    }
    if (progress) continue;

    // 4. 往前看一步：在某格放猫会让某行/列/区无处可放 → 这格排除
    for (let i = 0; i < N; i++) {
      if (st[i] !== 0) continue;
      const s2 = st.slice();
      place(s2, i);
      if (groupDead(s2)) { st[i] = 1; used.T_lookahead++; progress = true; break; }
    }
    if (!progress) break;
  }
  return { solved: solved(st), used, cats: st };
}

function score(n, used) {
  return used.T_single * 1 + used.T_confine * 2 + used.T_confineK * 5 + used.T_lookahead * 7 + n * 2;
}

function makeLevel(n, seed) {
  const r = rng(seed);
  for (let attempt = 0; attempt < 200; attempt++) {
    const sol = genSolution(n, r);
    if (!sol) continue;
    const reg = genRegions(n, sol, r);
    if (!repairUnique(n, reg, sol, r)) continue;
    if (countSolutions(n, reg, 2) !== 1) continue;
    const res = logicSolve(n, reg);
    if (!res.solved) continue;
    // 每个区至少 2 格，避免太送分（教学关除外由调用方决定）
    return { n, reg, sol, used: res.used, score: score(n, res.used) };
  }
  return null;
}

// 生成某尺寸的一批候选，按难度挑 count 关
function pickLevels(n, count, seedBase, pool, filter = () => true) {
  const cands = [];
  for (let s = 0; cands.length < pool && s < pool * 20; s++) {
    const lv = makeLevel(n, seedBase + s);
    if (lv && filter(lv)) cands.push(lv);
  }
  cands.sort((a, b) => a.score - b.score);
  // 按分位数挑，覆盖从易到难
  const out = [];
  for (let k = 0; k < count; k++) {
    const idx = Math.round((k / Math.max(1, count - 1)) * (cands.length - 1) * 0.9);
    out.push(cands[idx]);
  }
  return out;
}

// 锯齿排列：每 5 关里第 5 关是小难关
function sawtooth(levels) {
  const sorted = levels.slice().sort((a, b) => a.score - b.score);
  const out = [];
  const easy = sorted.slice(0, Math.ceil(sorted.length * 0.8));
  const hard = sorted.slice(easy.length);
  let e = 0, h = 0;
  while (out.length < sorted.length) {
    for (let k = 0; k < 4 && e < easy.length; k++) out.push(easy[e++]);
    if (h < hard.length) out.push(hard[h++]);
    else if (e < easy.length) out.push(easy[e++]);
  }
  return out;
}

module.exports = { makeLevel, pickLevels, sawtooth, countSolutions, logicSolve };

if (require.main === module) {
  const t0 = Date.now();
  // 教学关：3 关 5×5，只用简单推理就能解
  const tutorial = pickLevels(5, 3, 2000, 60, lv => lv.used.T_lookahead === 0 && lv.used.T_confineK === 0);
  // 正式关：最多 1 个单格区，最大的区不超过棋盘的 35%
  const shapeOk = lv => {
    const sz = Array(lv.n).fill(0); lv.reg.forEach(g => sz[g]++);
    return sz.filter(x => x === 1).length <= 1 && Math.max(...sz) <= lv.n * lv.n * 0.35;
  };
  const ch1 = sawtooth(pickLevels(5, 12, 5000, 150, shapeOk));
  const ch2 = sawtooth(pickLevels(6, 15, 9000, 150, shapeOk));
  const ch3 = sawtooth(pickLevels(7, 15, 15000, 150, shapeOk));
  const ch4 = sawtooth(pickLevels(8, 5, 21000, 60, shapeOk));
  const all = [...tutorial, ...ch1, ...ch2, ...ch3, ...ch4];
  // 前期关卡（教学 + 第1、2章）开局送 1 只爆米花，放在最大的颜色区里，尽量不让题目变得太简单
  const GIVEN_UNTIL = tutorial.length + ch1.length + ch2.length;
  const givenOf = lv => {
    const sz = Array(lv.n).fill(0); lv.reg.forEach(g => sz[g]++);
    let best = 0;
    for (let r = 1; r < lv.n; r++) if (sz[lv.reg[r * lv.n + lv.sol[r]]] > sz[lv.reg[best * lv.n + lv.sol[best]]]) best = r;
    return best * lv.n + lv.sol[best];
  };
  const levels = all.map((lv, i) => ({
    id: i + 1, n: lv.n, reg: lv.reg.join(''), sol: lv.sol.join(''), score: lv.score,
    given: i < GIVEN_UNTIL ? [givenOf(lv)] : []
  }));
  require('fs').writeFileSync(__dirname + '/levels.json', JSON.stringify(levels));
  console.log('levels', levels.length, 'time', Date.now() - t0, 'ms');
  console.log(levels.map(l => `${l.id}:${l.n}x${l.n}:${l.score}`).join('  '));
}

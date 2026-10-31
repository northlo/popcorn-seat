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
let STRAIGHT = 6;
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
    // 往哪长：优先“顺着直线接着长”，让颜色区多是长条、L 形，看起来整齐
    const cand = [...new Set(frontier[g])];
    const cw = cand.map(j => {
      const jr = Math.floor(j / n), jc = j % n;
      let straight = 0, same = 0;
      for (const [dr, dc] of dirs) {
        const r1 = jr + dr, c1 = jc + dc, r2 = jr + 2 * dr, c2 = jc + 2 * dc;
        if (r1 < 0 || c1 < 0 || r1 >= n || c1 >= n) continue;
        if (reg[r1 * n + c1] === g) {
          same++;
          if (r2 >= 0 && c2 >= 0 && r2 < n && c2 < n && reg[r2 * n + c2] === g) straight = 1;
        }
      }
      return 1 + STRAIGHT * straight + (same >= 2 ? 1.5 : 0);
    });
    const ct = cw.reduce((a, b) => a + b, 0);
    let y = r() * ct, ci = 0;
    while (ci < cand.length - 1 && y > cw[ci]) { y -= cw[ci]; ci++; }
    const j = cand[ci];
    reg[j] = g; size[g]++; left--;
  }
  return reg;
}

// ---------- 快速求解器：每次挑候选最少的行/列/区来试 ----------
// 返回最多 limit 个解（每个解是 sol[row] = col）
function solveAll(n, reg, limit, skipSol) {
  const N = n * n;
  const groups = [];
  for (let k = 0; k < n; k++) {
    groups.push([...Array(n).keys()].map(c => k * n + c));
    groups.push([...Array(n).keys()].map(r => r * n + k));
  }
  for (let g = 0; g < n; g++) groups.push([...Array(N).keys()].filter(i => reg[i] === g));
  // 每个格子会排除掉哪些格子
  const kills = [];
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / n), c = i % n, out = [];
    for (let j = 0; j < N; j++) {
      if (j === i) continue;
      const rj = Math.floor(j / n), cj = j % n;
      if (rj === r || cj === c || reg[j] === reg[i] || (Math.abs(rj - r) <= 1 && Math.abs(cj - c) <= 1)) out.push(j);
    }
    kills.push(out);
  }
  const sols = [];
  const cats = [];
  function rec(avail, done) {
    if (sols.length >= limit) return;
    // 挑一个还没完成、候选最少的组
    let best = null, bestCnt = 1e9;
    for (let gi = 0; gi < groups.length; gi++) {
      if (done[gi]) continue;
      let cnt = 0;
      for (const i of groups[gi]) if (avail[i]) cnt++;
      if (cnt === 0) return;          // 某组无处可放，死路
      if (cnt < bestCnt) { bestCnt = cnt; best = gi; }
    }
    if (best === null) {
      const sol = new Array(n);
      for (const i of cats) sol[Math.floor(i / n)] = i % n;
      if (!skipSol || sol.some((c, r) => c !== skipSol[r])) sols.push(sol);
      return;
    }
    for (const i of groups[best]) {
      if (!avail[i]) continue;
      const a2 = avail.slice();
      a2[i] = 0;
      for (const j of kills[i]) a2[j] = 0;
      const d2 = done.slice();
      const r = Math.floor(i / n), c = i % n;
      d2[r * 2] = 1; d2[c * 2 + 1] = 1; d2[2 * n + reg[i]] = 1;
      cats.push(i);
      rec(a2, d2);
      cats.pop();
      if (sols.length >= limit) return;
    }
  }
  rec(new Uint8Array(N).fill(1), new Uint8Array(groups.length));
  return sols;
}

// 数解的个数（最多数到 cap）
function countSolutions(n, reg, cap = 2) {
  return solveAll(n, reg, cap).length;
}

// 找一个和标准答案不同的解（没有就返回 null）
function findAlt(n, reg, sol) {
  const s = solveAll(n, reg, 1, sol);
  return s.length ? s[0] : null;
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

module.exports = { setStraight: v => { STRAIGHT = v; }, makeLevel, pickLevels, sawtooth, countSolutions, logicSolve };

if (require.main === module) {
  const t0 = Date.now();
  const fs = require('fs');
  STRAIGHT = 6;
  // 关卡顺序：棋盘随关卡号慢慢变大，每种尺寸 10 关，难度在同尺寸里一点点往上；每 11 关插一个“大一号 + 更难”的困难关
  // 1–3 教学(7×7) · 4–10 7×7 · 11 困难8×8 · 12–21 8×8 · 22 困难9×9 · 23–32 9×9 · 33 困难10×10 · 34–43 10×10 · 44 困难11×11 · 45–54 11×11 · 55 困难11×11
  const PLAN = [];
  for (let k = 0; k < 10; k++) PLAN.push({ n: 7, hard: false });
  for (const n of [8, 9, 10, 11]) { PLAN.push({ n, hard: true }); for (let k = 0; k < 10; k++) PLAN.push({ n, hard: false }); }
  PLAN.push({ n: 11, hard: true });
  const isSimple = lv => lv.used.T_lookahead === 0 && lv.used.T_confineK === 0;
  const mildOk = lv => lv.used.T_lookahead === 0 && lv.used.T_confineK <= 1;
  const hardOk = lv => lv.used.T_confineK >= 1 || lv.used.T_lookahead >= 1;
  const shapeOk = lv => {
    const sz = Array(lv.n).fill(0); lv.reg.forEach(g => sz[g]++);
    return sz.filter(x => x === 1).length <= 1 && Math.max(...sz) <= lv.n * lv.n * 0.32;
  };
  const cacheDir = __dirname + '/pools-straight';
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  function getPool(n, need) {
    const file = `${cacheDir}/pool-${n}.json`;
    let pool = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
    let s = pool.length ? Math.max(...pool.map(p => p.seed)) + 1 : 500000 * n;
    while (!need(pool) && s < 500000 * n + 4000) {
      const lv = makeLevel(n, s);
      if (lv && shapeOk(lv)) pool.push(Object.assign(lv, { seed: s }));
      s++;
    }
    fs.writeFileSync(file, JSON.stringify(pool));
    pool.sort((a, b) => a.score - b.score);
    console.log('pool', n, pool.length, 'simple', pool.filter(isSimple).length, 'mild', pool.filter(mildOk).length, 'hard', pool.filter(hardOk).length, Math.round((Date.now() - t0) / 1000) + 's');
    return pool;
  }
  const cnt = (pool, f) => pool.filter(f).length;
  const pools = {
    7: getPool(7, p => cnt(p, isSimple) >= 18),
    8: getPool(8, p => cnt(p, isSimple) >= 16 && cnt(p, hardOk) >= 4),
    9: getPool(9, p => cnt(p, isSimple) >= 16 && cnt(p, hardOk) >= 4),
    10: getPool(10, p => cnt(p, isSimple) >= 10 && cnt(p, mildOk) >= 16 && cnt(p, hardOk) >= 4),
    11: getPool(11, p => cnt(p, isSimple) >= 6 && cnt(p, mildOk) >= 16 && cnt(p, hardOk) >= 6),
  };
  const used = new Set();
  const seenN = {};
  const all = [];
  for (const step of PLAN) {
    const pool = pools[step.n];
    let lv;
    if (step.hard) {
      const c = pool.filter(l => hardOk(l) && !used.has(l));
      lv = c[Math.min(c.length - 1, Math.floor(c.length * 0.35))];
    } else {
      const k = seenN[step.n] = (seenN[step.n] || 0) + 1;   // 这是该尺寸的第几关（1–10）
      // 前面几关只用最简单的推理，后几关才允许“两区锁两行”
      let c = pool.filter(l => isSimple(l) && !used.has(l));
      if (step.n >= 10 && (k > 6 || c.length < 3)) c = pool.filter(l => mildOk(l) && !used.has(l));
      const q = 0.05 + 0.6 * (k - 1) / 9;
      lv = c[Math.min(c.length - 1, Math.floor(q * c.length))];
    }
    used.add(lv); all.push({ lv, hard: step.hard });
  }
  const givenOf = lv => {
    const sz = Array(lv.n).fill(0); lv.reg.forEach(g => sz[g]++);
    let best = 0;
    for (let r = 1; r < lv.n; r++) if (sz[lv.reg[r * lv.n + lv.sol[r]]] > sz[lv.reg[best * lv.n + lv.sol[best]]]) best = r;
    return best * lv.n + lv.sol[best];
  };
  const levels = all.map(({ lv, hard }, i) => ({
    id: i + 1, n: lv.n, hard, reg: lv.reg.join(','), sol: lv.sol.join(','), score: lv.score,
    tech: lv.used, given: (hard || i < 30) ? [givenOf(lv)] : []
  }));
  fs.writeFileSync(__dirname + '/levels.json', JSON.stringify(levels));
  console.log('levels', levels.length, 'time', Math.round((Date.now() - t0) / 1000) + 's');
  console.log(levels.map(l => `${l.id}:${l.n}${l.hard ? 'H' : ''}:${l.score}${l.tech.T_confineK ? 'K' : ''}${l.tech.T_lookahead ? 'L' : ''}`).join(' '));
}

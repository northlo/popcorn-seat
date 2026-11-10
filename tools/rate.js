// 关卡评分：数解 + 用游戏自己的提示推理（小游戏 js/logic.js）从头解到尾打难度分
// 用法：const { makeRater } = require('./rate'); const rate = makeRater('<小游戏项目>/js');
const path = require('path');

function countSolutions(n, reg, given, limit = 2) {
  const fixedCol = new Array(n).fill(-1);
  for (const i of given) fixedCol[Math.floor(i / n)] = i % n;
  const colUsed = new Array(n).fill(false), regUsed = new Array(64).fill(false);
  let count = 0, first = null; const cur = [];
  (function go(r, prevC) {
    if (count >= limit) return;
    if (r === n) { count++; if (!first) first = cur.slice(); return; }
    for (let c = 0; c < n; c++) {
      if (fixedCol[r] >= 0 && c !== fixedCol[r]) continue;
      if (colUsed[c] || (prevC >= 0 && Math.abs(c - prevC) <= 1)) continue;
      const g = reg[r * n + c]; if (regUsed[g]) continue;
      colUsed[c] = regUsed[g] = true; cur.push(c);
      go(r + 1, c);
      colUsed[c] = regUsed[g] = false; cur.pop();
    }
  })(0, -1);
  return { count, first };
}

// 技巧分档（越往后越难），权重是每用一次加的分
const TECH = [
  ['single', '只剩一格', /只剩下这一格/, 1],
  ['regLine', '颜色挤在一行/列', /能坐的格子都在/, 2],
  ['lineReg', '一行/列全是一色', /能坐的格子全是/, 2],
  ['subset', '几色占几行/列', /全挤在第/, 0],
  ['trial', '试放排除', /假如这一格坐了猫/, 6],
  ['stuck', '推不动(直接给座位)', /直接告诉你一个座位/, 20],
];

function makeRater(gameJsDir) {
  const { hint } = require(path.resolve(gameJsDir, 'logic.js'));
  return function rate(n, reg, sol, given) {
    const g = { n, reg, sol, st: new Array(n * n).fill(0), bad: new Array(n * n).fill(false), colors: [...Array(n).keys()] };
    for (const i of given) g.st[i] = 2;
    const used = {}; let score = 0, steps = 0, maxTier = 0;
    for (let guard = 0; guard < 400; guard++) {
      if (g.st.filter(v => v === 2).length === n) break;
      const res = hint(g); steps++;
      const k = TECH.findIndex(t => t[2].test(res.text));
      const t = TECH[k] || ['other', '其他', null, 3];
      let w = t[3];
      if (t[0] === 'subset') { const m = res.text.match(/这(\d)/); const size = m ? +m[1] : 2; w = size * 2; used['subset' + size] = (used['subset' + size] || 0) + 1; }
      else used[t[0]] = (used[t[0]] || 0) + 1;
      score += w; maxTier = Math.max(maxTier, k);
      (res.clear || []).forEach(i => g.st[i] = 0);
      (res.mark || []).forEach(i => { if (g.st[i] === 0) g.st[i] = 1; });
      if (res.place != null && res.place >= 0) g.st[res.place] = 2;
      if (res.place == null && !(res.mark || []).length && !(res.clear || []).length) { used.loop = 1; break; }
    }
    return { score, steps, used, maxTier };
  };
}

module.exports = { countSolutions, makeRater, TECH };

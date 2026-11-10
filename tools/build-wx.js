// 把 levels-v4.json 打包成小游戏用的 js/data.js（每日挑战沿用原 data.js 里的 DAILY）
// 用法：node tools/build-wx.js <小游戏项目>/js
const fs = require('fs'), path = require('path');
const out = process.argv[2];
if (!out) { console.error('用法：node tools/build-wx.js <小游戏项目>/js'); process.exit(1); }
const file = path.resolve(out, 'data.js');
const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels-v4.json'), 'utf8'));
const old = require(file);
const b36 = a => a.map(v => (+v).toString(36)).join('');
const L = levels.map(l => { const o = { n: l.n, h: l.hard ? 1 : 0, r: b36(l.reg.split(',')), s: b36(l.sol.split(',')), g: l.given || [] };
  if (l.sp) { o.p = l.sp; o.c = b36(l.colors); } return o; });
fs.writeFileSync(file, '// 关卡数据（由 popcorn-seat/tools/build-wx.js 生成，不要手改）\nmodule.exports = ' + JSON.stringify({ LEVELS: L, DAILY: old.DAILY }) + ';\n');
console.log('wrote', L.length, 'levels', fs.statSync(file).size, 'bytes');

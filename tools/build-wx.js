// 把 levels-v3.json + daily.json 打包成小游戏用的 js/data.js
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync(__dirname + '/levels-v3.json', 'utf8'));
const old = require('/home/claude/popcorn-wx/js/data.js');
const b36 = a => a.map(v => (+v).toString(36)).join('');
const L = levels.map(l => { const o = { n: l.n, h: l.hard ? 1 : 0, r: b36(l.reg.split(',')), s: b36(l.sol.split(',')), g: l.given || [] };
  if (l.sp) { o.p = l.sp; o.c = b36(l.colors); } return o; });
fs.writeFileSync('/home/claude/popcorn-wx/js/data.js', '// 关卡数据（由 popcorn-seat/tools/build-wx.js 生成，不要手改）\nmodule.exports = ' + JSON.stringify({ LEVELS: L, DAILY: old.DAILY }) + ';\n');
console.log('wrote', L.length, 'levels', fs.statSync('/home/claude/popcorn-wx/js/data.js').size, 'bytes');

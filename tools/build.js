const fs = require('fs');
const L = require('./levels.json').map(l => ({ n: l.n, reg: l.reg, sol: l.sol }));
const t = fs.readFileSync(__dirname + '/../src/template.html', 'utf8');
if (!t.includes('/*LEVELS*/[]')) throw new Error('placeholder missing');
fs.writeFileSync(__dirname + '/../index.html', t.replace('/*LEVELS*/[]', JSON.stringify(L)));
console.log('built', fs.statSync(__dirname + '/../index.html').size, 'bytes');

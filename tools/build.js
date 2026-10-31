const fs = require('fs');
const L = require('./levels.json').map(l => ({ n: l.n, hard: l.hard, reg: l.reg, sol: l.sol, given: l.given }));
const t = fs.readFileSync(__dirname + '/../src/template.html', 'utf8');
if (!t.includes('/*LEVELS*/[]')) throw new Error('placeholder missing');
const cats = fs.readFileSync(__dirname + '/../art/cat-assets.json', 'utf8');
fs.writeFileSync(__dirname + '/../index.html', t.replace('/*LEVELS*/[]', JSON.stringify(L)).replace('/*CATIMG*/{}', cats));
console.log('built', fs.statSync(__dirname + '/../index.html').size, 'bytes');

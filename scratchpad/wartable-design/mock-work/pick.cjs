const fs = require('fs');
let src = fs.readFileSync(__dirname + '/gen-search.cjs', 'utf8');
src = src.split('const out = [];')[0];
eval(src + `
const good = [];
for (let s = 1; s <= 600; s++) { const r = gen(s); if (r.ok && r.across.length && r.closed.length && r.ashfenNbAsh) good.push(r); }
for (const r of good) { console.log('seed', r.seedArg, 'ashfen', r.ashfen, 'across', r.across, 'closed', r.closed); console.log(r.grid); }
`);

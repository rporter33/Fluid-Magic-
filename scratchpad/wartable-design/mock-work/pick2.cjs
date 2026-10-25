const fs = require('fs');
let src = fs.readFileSync(__dirname + '/gen-search.cjs', 'utf8');
src = src.split('const out = [];')[0];
eval(src + `
for (const s of process.argv.slice(2).map(Number)) { const r = gen(s); console.log('seed', s, 'ok', r.ok, 'ashfen', r.ashfen, 'across', r.across, 'closed', r.closed); console.log(r.grid); }
`);

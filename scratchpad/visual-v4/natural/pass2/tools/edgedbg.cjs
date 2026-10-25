const { launch, open, ev, mev, PAGE } = require('./lib.cjs'); const fs = require('fs');
const [look, A, B, hov = '', sel = '', view = ''] = process.argv.slice(2);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1200, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 894);
  if (view) { await ev(p, view); await p.waitForTimeout(1200); }
  const src = fs.readFileSync(__dirname + '/edgedbg.js', 'utf8').replace('EA', JSON.stringify(A)).replace('EB', JSON.stringify(B)).replace(/HOV/g, JSON.stringify(hov)).replace(/SEL/g, JSON.stringify(sel));
  console.log(JSON.stringify(await mev(p, src))); await b.close(); })();

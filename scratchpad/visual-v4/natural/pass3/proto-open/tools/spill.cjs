const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 300 });
  const r = await ev(p, '({ spill: m.reliefWildSpill(), look: m.reliefWildLook(), times: m.ev("({ shared: RB.t, nat: RB.L.natural.t, cpu: RB.L.natural.cpu })") })'); console.log(JSON.stringify(r, null, 1)); fs.writeFileSync(OUT + 'spill.json', JSON.stringify(r, null, 1));
  console.log('errors', log.pageErrors.length); await b.close(); })();

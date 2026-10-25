const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 0, wait: false });
  for (let t = 0; t < 60; t++) { await p.waitForTimeout(2000); const r = await p.evaluate(() => window.__mock && window.__mock.ev ? window.__mock.ev('({ ready: RB.ready, running: RB.running, t: RB.t, nat: RB.L.natural && RB.L.natural.t, cpu: RB.L.natural && RB.L.natural.cpu })') : null); if (log.pageErrors.length || (r && r.ready)) { console.log(JSON.stringify(r)); break; } }
  console.log('errors', log.pageErrors.slice(0, 5).join('\n')); console.log('console', log.console.slice(0, 5).join('\n')); await b.close(); })();

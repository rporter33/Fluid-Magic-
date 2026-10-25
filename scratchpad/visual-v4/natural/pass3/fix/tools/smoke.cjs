const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1000 });
  console.log('ready ms', p.__readyMs); console.log(JSON.stringify(await p.evaluate(() => Object.keys(window.__mock))));
  console.log(JSON.stringify(await ev(p, 'm.reliefTimes()')).slice(0, 1500));
  console.log('errors', JSON.stringify(log.pageErrors), 'console', JSON.stringify(log.console.slice(0, 5)), 'requests', JSON.stringify(log.requests)); await b.close(); })();

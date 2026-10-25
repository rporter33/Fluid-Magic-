const { launch, open, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.argv[2] || PAGE, { log, wait: false, settle: 0, q: process.argv[3] || '' });
  for (let k = 0; k < 60; k++) { await p.waitForTimeout(1000); const r = await p.evaluate(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady()); if (r || log.pageErrors.length) break; }
  console.log('ready', await p.evaluate(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady()), 'errors', JSON.stringify(log.pageErrors.slice(0, 4)), JSON.stringify(log.console.slice(0, 6))); await b.close(); })();

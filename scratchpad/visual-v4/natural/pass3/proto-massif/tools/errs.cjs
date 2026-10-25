const { launch, open } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, require('./lib.cjs').PAGE, { log, wait: false, settle: Number(process.argv[2] || 30000) });
  const r = await p.evaluate(() => ({ ready: !!(window.__mock && window.__mock.reliefReady && window.__mock.reliefReady()) }));
  console.log(JSON.stringify(r), JSON.stringify(log.pageErrors.slice(0, 3)), JSON.stringify(log.console.slice(0, 5))); await b.close(); })();

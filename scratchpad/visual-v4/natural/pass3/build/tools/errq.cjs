// quick: open the page, wait up to N s for ready, print page errors and console errors
const { launch, open, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, wait: false, settle: 100, q: process.env.Q || '' }); let ready = false;
  for (let t = 0; t < (+process.argv[2] || 90); t++) { await p.waitForTimeout(1000); ready = await p.evaluate(() => !!(window.__mock && window.__mock.reliefReady && window.__mock.reliefReady())); if (ready || log.pageErrors.length) break; }
  console.log('ready', ready); console.log(log.pageErrors.join('\n').slice(0, 2000)); console.log(log.console.filter((c) => /error/.test(c)).join('\n').slice(0, 1500)); await b.close(); })();

// node probe.cjs "<expr>" [page]: evaluate expressions in window.__mock.ev context after ready
const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.argv[3] || PAGE, { log, settle: 800, q: process.env.Q || '' });
  for (const e of process.argv[2].split(';;')) { try { console.log(JSON.stringify(await mev(p, e))); } catch (err) { console.log('ERR', err.message.slice(0, 300)); } }
  console.log('pageErrors', log.pageErrors.length, log.pageErrors.slice(0, 3).join('\n')); await b.close(); })();

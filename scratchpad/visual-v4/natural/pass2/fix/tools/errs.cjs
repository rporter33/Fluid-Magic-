const { launch, open, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, wait: false, settle: 15000, q: process.argv[2] || '' }); console.log(JSON.stringify(log.pageErrors.slice(0, 5)), JSON.stringify(log.console.slice(0, 5))); await b.close(); })();

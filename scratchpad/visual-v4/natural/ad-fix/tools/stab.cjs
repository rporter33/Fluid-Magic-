const { launch, open, PAGE } = require('./nlib2.cjs');
(async () => { const b = await launch(), errors = [];
  for (const q of ['', '?terrain=clear']) { const p = await open(b, PAGE, { errors, settle: 1000, q }); const r = await p.evaluate(() => window.__mock.reliefStable(true)); console.log(q || 'natural', JSON.stringify(r)); await p.context().close(); }
  await b.close(); })();

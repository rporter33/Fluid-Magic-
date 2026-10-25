const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await b.close();
  const b2 = await launch(); const p = await open(b2, PAGE, { settle: 300, q: '' });
  console.log(JSON.stringify(await mev(p, `(() => { RL_DBG.keepMs = true; return 1; })()`)));
  await b2.close(); })();

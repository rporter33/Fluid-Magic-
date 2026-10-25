const { launch, open, PAGE } = require('./vlib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGE, {});
  for (const [t, s] of [['start', null], ['m40', 'm.setMonth(40)'], ['m40mid', 'm.setScale(1.0, 900, 500)']]) { if (s) { await p.evaluate((s) => { const m = window.__mock; eval(s); }, s); await p.waitForTimeout(1000); } const r = await p.evaluate(() => window.__mock.reliefMeans()); console.log(t, 'page check worst', r.worstDE, JSON.stringify(r.overBudget), 'pairs under', r.pairs.under2012, r.pairs.worstNormal.v, r.pairs.worstCvd.v); }
  await b.close(); })();

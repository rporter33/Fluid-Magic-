const { launch, open, BEFORE: PAGE } = require('./nlib.cjs');
(async () => {
  const b = await launch(), errors = [];
  for (const q of ['']) { const p = await open(b, PAGE, { errors, settle: 1200, q });
    await p.evaluate(() => { window.__mock.setMonth(40); }); await p.waitForTimeout(800); await p.evaluate(() => window.__mock.setScale(1.0, 900, 500)); await p.waitForTimeout(1500);
    
    const M = await p.evaluate(() => window.__mock.reliefMeans()); console.log('means', M.applicable === false ? 'n/a' : JSON.stringify({ worst: M.worstDE, over: M.overBudget }));
    await p.context().close(); }
  await b.close();
})();

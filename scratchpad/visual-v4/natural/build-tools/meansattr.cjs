const { launch, open, PAGE } = require('./nlib.cjs');
(async () => {
  const b = await launch(), errors = []; const p = await open(b, PAGE, { errors, settle: 1200, q: '?terrain=clear' });
  const view = async () => { await p.evaluate(() => { window.__mock.setMonth(40); }); await p.waitForTimeout(800); await p.evaluate(() => window.__mock.setScale(1.0, 900, 500)); await p.waitForTimeout(1500); return p.evaluate(() => { const M = window.__mock.reliefMeans(); return { worst: M.worstDE, over: M.overBudget, ashfen: null }; }); };
  console.log('clamped', JSON.stringify(await view()));
  for (const flag of ['gamut3']) {
    await p.evaluate((f) => window.__mock.ev(`(RL_GAMUT_PASSES = 3, RB.L.clear = null, RL_SNOWC.clear(), rlEnsureLook('clear'), 0)`), flag);
    await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 150000, polling: 300 }); await p.evaluate(() => window.__mock.ev('(RCK = null, RL_LINES.cache.clear(), draw(), 0)'));
    console.log(flag, JSON.stringify(await view()));
  }
  await b.close();
})();

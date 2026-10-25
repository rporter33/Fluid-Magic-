const { launch, open, OUT, realErrors } = require('./nlib.cjs');
(async () => { const b = await launch(), errors = [];
  for (const [q, pre] of [['?terrain=clear', ''], ['?terrain=clear', 'm.setMonth(40)'], ['?terrain=clear', 'm.setMonth(40); m.setScale(1.0, 900, 500)'], ['', "m.ev(\"setMode('terrain')\"); m.setMonth(40)"]]) {
    const p = await open(b, OUT + 'page-residual.html', { errors, settle: 1200, q }); if (pre) { await p.evaluate((s) => { const m = window.__mock; return eval(s); }, pre); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 150000, polling: 300 }); await p.waitForTimeout(1500); }
    const r = await p.evaluate(() => { const m = window.__mock, d = m.reliefDesign(), M = m.reliefMeans(), S = m.reliefSnow('clear'); return { residual: d.meanResidualL, rulesAll: d.reliefRulesPass.all, means: [M.worstDE, M.overBudget, M.pairs.under2012, M.pairs.worstNormal.v, M.pairs.worstCvd.v], snow: S.pass, snowMin: Object.fromEntries(Object.entries(S.byTerrain).map(([t, v]) => [t, [v.minNormal, v.minCvd]])) }; });
    console.log(q, pre, JSON.stringify(r)); await p.context().close(); }
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close(); })();

// after the fixes, fix 3: the design's relief numbers (core swing, escarpment, invariants), province means and rails at the start view
const { launch, open } = require('../tools/lib.cjs');
const FILE = process.argv[2] || __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const r = await page.evaluate(() => { const m = window.__mock, d = m.reliefDesign(), me = m.reliefMeans(), ra = m.reliefRails(); return { coreSwing: d.coreSwing, escarpment: d.escarpment, rulesPass: d.reliefRulesPass, own: d.ownTerrainShare, glowCore: d.glowCore, means: { worst: me.worstDE, over: me.overBudget, pairs: me.pairs }, rails: { n: ra.samples, fails: ra.fails, worst: ra.worstContrast, at: ra.worstAt } }; });
  console.log(JSON.stringify(r, null, 1)); console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

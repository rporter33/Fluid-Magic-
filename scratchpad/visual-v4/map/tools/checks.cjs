// node checks.cjs <html> <out.json> [w h dpr]: the relief checks at the start zoom, at Far, Mid and Near, the rail rule at dpr 1 and 2, memory and times
const { launch, open } = require('./lib.cjs'); const fs = require('fs');
const [file, outFile, w = 1440, h = 900] = process.argv.slice(2);
(async () => {
  const b = await launch(), errors = [], out = {};
  let page = await open(b, file, +w, +h, '', errors);
  const ev = (s) => page.evaluate(s);
  out.start = await ev(() => window.__mock.reliefChecks());
  out.stableWithRebake = await ev(() => window.__mock.reliefStable(true));
  const bands = {};
  bands.far = await ev(() => { window.__mock.setScale(window.__mock.minScale(), 800, 520); return window.__mock.reliefLayout(); });
  bands.mid = await ev(() => { window.__mock.setScale(1.0, 640, 480); return window.__mock.reliefLayout(); });
  bands.midRails = await ev(() => window.__mock.reliefRails());
  bands.near = await ev(() => { window.__mock.setScale(window.__mock.maxScale() * 0.9, 620, 470); return window.__mock.reliefLayout(); });
  bands.nearMeans = await ev(() => window.__mock.reliefMeans());
  bands.nearRails = await ev(() => window.__mock.reliefRails());
  bands.nearHit = await ev(() => window.__mock.reliefHit());
  bands.nearEast = await ev(() => { window.__mock.setScale(window.__mock.maxScale() * 0.9, 1300, 420); return window.__mock.reliefLayout(); });
  out.bands = bands;
  out.modes = {}; for (const m of ['dominion', 'supply', 'unrest', 'population', 'springs']) out.modes[m] = await ev((mm) => { window.__mock.ev(`state.mode = '${mm}'; updateDeco(); decoAlpha = decoTo; RCK = null; draw()`); return window.__mock.reliefStable(false).identical; }, m);
  await page.close();
  page = await open(b, file, +w, +h, '', errors, { dpr: 2 });
  out.dpr2 = { rails: await page.evaluate(() => window.__mock.reliefRails()), railsNear: await page.evaluate(() => { window.__mock.setScale(window.__mock.maxScale() * 0.9, 620, 470); return window.__mock.reliefRails(); }) };
  await page.close();
  out.errors = errors; fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  const s = out.start; console.log(JSON.stringify({ hit: s.hit, names: s.layout.names, lp: s.layout.labelPieceOverlaps, pp: s.layout.pieceOverlaps, ll: s.layout.labelOverlaps, meansWorst: s.means.worstDE, over: s.means.overBudget.length, pairs: s.means.pairs, rails: [s.rails.samples, s.rails.fails, s.rails.worstContrast], stable: s.stable.identical, rebake: out.stableWithRebake.bake, errors: errors.length }));
  await b.close();
})();

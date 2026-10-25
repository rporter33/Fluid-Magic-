// node tlapse.cjs <html>: the layout check through the time-lapse (every 4th month) at the start view, Mid and Near; the means at month 70
const { launch, open } = require('./lib.cjs');
const [file] = process.argv.slice(2);
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, file, 1440, 900, '', errors), out = [];
  for (const [n, s] of [['start', null], ['mid', 1.0], ['near', 'max']]) {
    const r = await page.evaluate(([s]) => { const m = window.__mock, res = []; if (s) m.setScale(s === 'max' ? m.maxScale() * 0.9 : s, 640, 480);
      for (let M = 3; M <= 70; M += 4) { m.setMonth(M); const v = m.reliefLayout(); if (v.labelOverlaps || v.labelPieceOverlaps || v.pieceOverlaps || v.armiesOutsideInset) res.push({ M, ll: v.labelOverlaps, lp: v.labelPieceOverlaps, pp: v.pieceOverlaps, out: v.armiesOutsideInset, ex: v.examples }); }
      return res; }, [s]);
    out.push([n, r]);
  }
  for (const [n, r] of out) console.log(n, r.length ? JSON.stringify(r) : 'clean');
  await page.evaluate(() => window.__mock.ev('fitToCloth()')); await page.waitForTimeout(600);
  console.log('means@70', JSON.stringify(await page.evaluate(() => { window.__mock.setMonth(70); const v = window.__mock.reliefMeans(); return { worst: v.worstDE, over: v.overBudget, pairs: v.pairs.under2012 }; })));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

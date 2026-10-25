// the readers on the phone (390 x 844, dpr 3): node phonereaders.cjs <pagefile|-> <tag>
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const file = process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : PAGE, tag = process.argv[3] || 'now';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, w: 390, h: 844, dpr: 3, settle: 1500, mobile: !!process.env.MOBILE }); const rows = [];
  const V = [['start', 'm.ev("fit(); draw()")'], ['far', 'm.setScale(60 / m.ev("MED_DIAM"), 800, 500)'], ['least', 'm.setScale(m.minScale(), 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['back3', 'm.ev("fit(); draw()"); m.setMonth(3)']];
  for (const [v, src] of V) { await ev(p, src); await p.waitForTimeout(1500);
    const R = await ev(p, '(() => { try { const R = m.reliefNatural(true).readers; return { Dpx: R.Dpx, views: R.views, provinces: R.provinces, pass: R.pass, farPass: R.farPass, N: [R.normal.lightness.patches, R.normal.lightness.patchAcc, R.normal.lightness.provinces, R.normal.lightness.provinceAcc, R.normal.lightness.missed], U: [R.normal.unexplored.patchAcc, R.normal.unexplored.provinceAcc, R.normal.unexplored.missed], V: { unexp: R.verifier.unexplored, control: R.verifier.unexploredInSightControl, forced: R.verifier.forcedUnexplored, all: R.verifier.all } }; } catch (e) { return { ERR: e.message }; } })()');
    rows.push({ view: v, ...R }); console.log(tag, v, JSON.stringify(R)); }
  fs.writeFileSync(`${OUT}phonereaders-${tag}.json`, JSON.stringify(rows, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();

// sweep.cjs <dpr>: the in-page wild edge sweep (30 seeded cameras, closest zooms, sub-pixel pans), footprint and interaction on the live page -> out/final/sweep-dpr<d>.json
const { launch, open, ev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const dpr = +(process.argv[2] || 1), b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, dpr, settle: 1500 }); await p.mouse.move(720, 896);
  const t0 = Date.now(), sw = await ev(p, 'm.reliefWildSweep()'), ms = Date.now() - t0, fp = await ev(p, 'm.reliefWildFootprint()'), it = await ev(p, 'm.reliefWildInteract()');
  const out = { dpr, ms, sweep: { views: sw.views, samples: sw.samples, fails: sw.fails, under110: sw.samplesUnder110, min: sw.minRatio, worst: sw.worst, pans: sw.pans, pass: sw.pass, rows: sw.rows }, footprint: fp, interact: it, pageErrors: log.pageErrors };
  console.log('dpr', dpr, 'sweep', JSON.stringify({ views: sw.views, samples: sw.samples, fails: sw.fails, under110: sw.samplesUnder110, min: sw.minRatio, worst: sw.worst, pans: sw.pans, pass: sw.pass }));
  console.log('footprint', JSON.stringify(fp)); console.log('interact', JSON.stringify(it)); console.log('pageErrors', log.pageErrors.length);
  fs.writeFileSync(`${OUT}final/sweep-dpr${dpr}.json`, JSON.stringify(out, null, 1)); await b.close(); })();

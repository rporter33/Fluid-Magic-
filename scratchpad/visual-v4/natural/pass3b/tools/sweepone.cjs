// the in-page sweep (every edge as if in focus) on one page: node sweepone.cjs <tag> <pagefile> [dpr]
const { launch, open, ev } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.argv[3], { log, dpr: Number(process.argv[4] || 1), settle: 1000 }); await p.mouse.move(720, 896);
  const t0 = Date.now(), S = await ev(p, 'm.reliefWildSweep()'); console.log(process.argv[2], JSON.stringify({ views: S.views, samples: S.samples, fails: S.fails, under110: S.samplesUnder110, min: S.minRatio, worst: S.worst, pass: S.pass, ms: Date.now() - t0 }), 'pageErrors', log.pageErrors.length); await b.close(); })();

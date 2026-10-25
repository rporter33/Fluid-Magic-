const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : PAGE, { log, settle: 1000 });
  for (const px of (process.argv[3] || '60').split(',').map(Number)) { await ev(p, `m.setScale(${px} / m.ev("MED_DIAM"), ${process.env.CX || 720}, ${process.env.CY || 450})`); await p.waitForTimeout(1500);
    const R = await ev(p, '(() => { const R = m.reliefNatural(true).readers; return { Dpx: R.Dpx, farPass: R.farPass, N: [R.normal.lightness.patchAcc, R.normal.lightness.provinceAcc], U: [R.normal.unexplored.patchAcc, R.normal.unexplored.provinceAcc], V: R.verifier }; })()');
    console.log(px, JSON.stringify(R)); }
  await b.close(); })();

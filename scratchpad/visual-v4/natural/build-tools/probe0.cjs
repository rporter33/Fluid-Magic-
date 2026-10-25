const { launch, open, PAGE, realErrors } = require('./nlib.cjs');
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 1500 });
  const r = await p.evaluate(() => window.__mock.ev(`({ ready: performance.now(), fonts: [...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+' '+f.weight).slice(0,12), W, H, MED_DIAM, TX: RB.TX, BW: RB.BW, s: cam.s, fit: fitScale, Dpx: cam.s*MED_DIAM, band: bandOf(cam.s), t: RB.t, total: RB.total, wall: RB.wall, redCap, varoAt: cmd.varo.at, N, provs: provs.length })`));
  console.log(JSON.stringify(r, null, 1), 'readyMs', p.__readyMs);
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();

const { launch, open, PAGE, SHOTS, realErrors } = require('./nlib.cjs');
(async () => {
  const b = await launch(), errors = [];
  const q = process.argv[2] || '', tag = process.argv[3] || 'smoke';
  const p = await open(b, PAGE, { errors, q, settle: 1500 });
  const r = await p.evaluate(() => window.__mock.ev(`({ look: window.__mock.look(), s: cam.s, Dpx: cam.s*MED_DIAM, band: bandOf(cam.s), times: window.__mock.reliefTimes(), lines: RL_LINES.stats, nat: RB.nat ? { field: RB.nat.nField, canopy: RB.nat.nCanopy } : null })`));
  console.log(JSON.stringify(r, null, 1), 'readyMs', p.__readyMs);
  await p.screenshot({ path: SHOTS + tag + '.png' });
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();

// baseline numbers: geometry, render time at views, pan stats at Near (dpr from env)
const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = []; const dpr = Number(process.env.DPR || 1);
  const p = await open(b, process.env.PAGE || PAGE, { errors, settle: 1500, reducedMotion: 'reduce', dpr });
  await p.mouse.move(700, 880);
  console.log(JSON.stringify(await ev(p, 'm.ev("({ W, H, MED_DIAM, TX: RB.TX, RLK, maxScale, fit: cam.s, band: bandOf(cam.s) })")')));
  for (const [vn, src] of [['start', 'm.ev("fit(); draw()")'], ['ref', 'm.setScale(1.142, 700, 560)'], ['near', 'm.zoomTo(m.maxScale()*0.85, "Kharnath")'], ['nearMax', 'm.zoomTo(m.maxScale(), "Wyrford")']]) {
    await ev(p, src); await p.waitForTimeout(400);
    const r = await ev(p, `m.ev("(() => { const t = []; for (let k = 0; k < 4; k++) { RCK = null; const t0 = performance.now(); draw(); t.push(+(performance.now() - t0).toFixed(1)); } return { s: cam.s, Dpx: cam.s * MED_DIAM, tpp: cam.s * RB.TX, renders: t }; })()")`);
    const ps = await ev(p, 'm.panStats(6, 90)');
    console.log(vn, JSON.stringify(r), JSON.stringify(ps));
  }
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

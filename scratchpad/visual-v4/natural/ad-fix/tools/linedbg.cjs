// the worst hairline segments in a data mode at Mid (dpr from env): their bevel and the ground quantiles
const { launch, open, PAGE, realErrors } = require('./nlib2.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = []; const p = await open(b, PAGE, { errors, settle: 1200, reducedMotion: 'reduce', dpr: Number(process.env.DPR || 1) }); await p.mouse.move(700, 880);
  for (const mode of (process.env.MODES || 'dominion,springs').split(',')) {
    await ev(p, `m.ev("setMode('${mode}')")`); await ev(p, 'm.setScale(1.0, 640, 480)'); await p.waitForTimeout(900);
    const L = await ev(p, 'm.reliefLines()'); console.log(mode, JSON.stringify({ hair: L.hairline, worst: L.worst.hair, bevel: L.bevel, pass: L.pass }));
    const w = L.worst.hair; if (!w) continue; const [a, bq] = w.at.split('/');
    const d = await ev(p, `m.ev(${JSON.stringify(`(() => { const i = names.indexOf(${JSON.stringify(a)}), j = names.indexOf(${JSON.stringify(bq)}), e = [...EDGE.values()].find((q) => (q.i === i && q.j === j) || (q.i === j && q.j === i)); const st = rlSegStyles(e, 'hair', rlLineCtx()); return { soft: st.soft, stepUps: st.stepUps, segs: st.segs.map((s) => [s.bevel.ul.key, +s.bevel.ul.a.toFixed(2), s.bevel.ul.w, s.bevel.lr.key, +s.bevel.lr.a.toFixed(2), s.bevel.lr.w, s.bevel.soft]) }; })()`)})`);
    console.log(' edge', JSON.stringify(d));
  }
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

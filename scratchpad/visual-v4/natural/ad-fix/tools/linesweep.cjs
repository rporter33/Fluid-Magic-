// the line check across views (start, Mid, ref-2's zoom, Near x2) in one look and dpr: node linesweep.cjs <q> <dpr> [pre]
const { launch, open, PAGE, realErrors } = require('./nlib2.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [], q = process.argv[2] || '', dpr = Number(process.argv[3] || 1), pre = process.argv[4] || '';
  const p = await open(b, PAGE, { errors, settle: 1200, reducedMotion: 'reduce', dpr, q }); await p.mouse.move(700, 880);
  if (pre) { await ev(p, pre); await p.waitForFunction(() => window.__mock.look().clear || !/terrain/.test(window.__mock.ev('state.mode')), null, { timeout: 150000, polling: 300 }); }
  for (const [vn, src] of [['start', 'm.ev("fit(); draw()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['nearW', 'm.setScale(m.maxScale() * 0.9, 300, 470)'], ['nearN', 'm.setScale(m.maxScale() * 0.9, 980, 170)']]) {
    await ev(p, src); await p.waitForTimeout(500);
    const L = await ev(p, 'm.reliefLines()');
    console.log(q || 'natural', 'dpr' + dpr, vn, JSON.stringify({ look: L.look, hair: [L.hairline.samples, L.hairline.min, L.hairline.median, L.hairline.under], int: [L.internal.min, L.internal.under], flips: L.keylineFlipsAlongEdges, w: L.maxHairWidthPx, bevel: L.bevel, worst: L.worst.hair, pass: L.pass }));
  }
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 1500, reducedMotion: 'reduce' });
  await p.mouse.move(700, 880);
  const out = {};
  for (const [vn, vs] of [['start', 'm.ev("fit(); draw()")'], ['mid100', 'm.setScale(0.62, 800, 500)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['near', 'm.zoomTo(m.maxScale()*0.85, "Kharnath")']]) {
    await ev(p, vs); await p.waitForTimeout(300);
    out[vn] = await ev(p, '({ band: m.band(), scale: m.scale(), seats: m.reliefSeats(), chips: m.reliefHoverChips(), layout: m.reliefLayout() })');
  }
  out.snow = await ev(p, 'm.reliefSnow()');
  out.cliff = await ev(p, '(m.ev("fit(); draw()"), m.reliefCliff())');
  console.log(JSON.stringify(out, null, 1).slice(0, 9000));
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();

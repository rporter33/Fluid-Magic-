// AD fixes 11 and 12: day chips against names (after Varo's move, at every band down to the minimum zoom) and names against the alerts ribbon, at three window sizes
const { launch, open, PAGE, OUT, realErrors } = require('./nlib2.cjs'); const fs = require('fs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [], res = {};
  for (const [w, h] of [[1440, 900], [1280, 720], [1024, 768]]) {
    const p = await open(b, PAGE, { errors, w, h, settle: 1200, reducedMotion: 'reduce' }); await p.mouse.move(5, h - 20);
    const tgt = await ev(p, 'm.across()'); await ev(p, 'm.ev("orderMove(0, 0, acrossTarget)")'); await p.waitForTimeout(500);
    for (const [vn, src] of [['start', ''], ['mid075', 'm.setScale(0.75, 760, 480)'], ['far04', 'm.setScale(0.4, 800, 520)'], ['far03', 'm.setScale(0.3, 800, 520)'], ['min', 'm.setScale(m.minScale(), 800, 500)'], ['mid', 'm.setScale(1.0, 500, 360)'], ['ref', 'm.setScale(1.142, 600, 400)']]) {
      if (src) await ev(p, src); await p.waitForTimeout(600);
      const r = await ev(p, '({ band: m.band(), day: m.reliefDayChips(), hover: (() => { const x = m.reliefHoverChips(); return { pass: x.pass, namesOverAChip: x.namesOverAChip, dayChipsOverNames: x.dayChipsOverNames }; })(), ribbon: m.reliefLayout().namesUnderRibbon, thread: m.ev("RL_THREAD_CHIPS.list") })');
      res[`${w}x${h}/${vn}`] = r; console.log(w, h, vn, tgt, JSON.stringify(r));
    }
    await p.context().close();
  }
  fs.writeFileSync(OUT + 'chipcheck.json', JSON.stringify(res, null, 1));
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

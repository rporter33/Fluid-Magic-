// node layout.cjs <html> [w h]: the layout check at the start view and in each band
const { launch, open } = require('./lib.cjs');
const [file, w = 1440, h = 900] = process.argv.slice(2);
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, file, +w, +h, '', errors), ev = (f, a) => page.evaluate(f, a), pick = (v) => ({ band: v.band, s: v.scale, names: v.names, chips: v.numberChips, ll: v.labelOverlaps, lp: v.labelPieceOverlaps, pp: v.pieceOverlaps, out: v.armiesOutsideInset, ex: v.examples });
  console.log('start', JSON.stringify(pick(await ev(() => window.__mock.reliefLayout()))));
  for (const [n, s, x, y] of [['far', 'min', 800, 520], ['mid', 1.0, 640, 480], ['near', 'max', 620, 470], ['nearEast', 'max', 1300, 420], ['nearSouth', 'max', 700, 900], ['nearWest', 'max', 250, 500]])
    console.log(n, JSON.stringify(pick(await ev(([s, x, y]) => { const m = window.__mock; m.setScale(s === 'min' ? m.minScale() : s === 'max' ? m.maxScale() * 0.9 : s, x, y); return m.reliefLayout(); }, [s, x, y]))));
  await ev(() => window.__mock.ev('fitToCloth()')); await page.waitForTimeout(600);
  console.log('numbers@start', JSON.stringify(pick(await ev(() => { window.__mock.ev('RL_NUMBERS.on = true'); const v = window.__mock.reliefLayout(); return v; }))));
  for (const [n, s, x, y] of [['numbers@mid', 1.0, 520, 420], ['numbers@midEast', 1.0, 1250, 600], ['numbers@far', 'min', 800, 520]]) console.log(n, JSON.stringify(pick(await ev(([s, x, y]) => { const m = window.__mock; m.setScale(s === 'min' ? m.minScale() : s, x, y); return m.reliefLayout(); }, [s, x, y]))));
  await ev(() => window.__mock.ev('RL_NUMBERS.on = false; fitToCloth()')); await page.waitForTimeout(600);
  const across = await ev(() => window.__mock.across()), [x, y] = await ev((n) => window.__mock.at(n), across); await page.mouse.click(x, y, { button: 'right' }); await page.waitForTimeout(600);
  console.log('path@start', JSON.stringify(pick(await ev(() => window.__mock.reliefLayout()))));
  for (const [n, s, x, y] of [['path@mid', 1.0, 520, 400], ['path@near', 'max', 420, 330]]) console.log(n, JSON.stringify(pick(await ev(([s, x, y]) => { const m = window.__mock; m.setScale(s === 'max' ? m.maxScale() * 0.9 : s, x, y); return m.reliefLayout(); }, [s, x, y]))));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

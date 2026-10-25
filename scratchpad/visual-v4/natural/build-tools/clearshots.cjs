// the Clear and Terrain shots again (after a Clear-only change): 21, 22, 30 to 33
const { launch, open, PAGE, SHOTS, realErrors } = require('./nlib.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  const shot = async (p, name, src, wait = 1100) => { if (src) await ev(p, src); await p.waitForTimeout(wait); await p.screenshot({ path: SHOTS + name + '.png' }); console.log('shot', name); };
  let p = await open(b, PAGE, { errors, settle: 1800, reducedMotion: 'reduce' });
  await ev(p, 'm.ev("fit(); draw()")'); await ev(p, 'm.ev("orderMove(0, 0, acrossTarget)")');
  await ev(p, 'm.ev("setMode(\'terrain\')")'); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 150000, polling: 300 });
  await shot(p, '21-mode-terrain', '', 1200); await shot(p, '22-mode-terrain-mid', 'm.setScale(1.0, 640, 480)');
  await p.context().close();
  p = await open(b, PAGE, { errors, settle: 1800, reducedMotion: 'reduce', q: '?terrain=clear' });
  await shot(p, '30-clear-start', ''); await shot(p, '31-clear-mid', 'm.setScale(1.0, 640, 480)'); await shot(p, '32-clear-near-west', 'm.setScale(m.maxScale() * 0.9, 300, 470)');
  await ev(p, 'm.ev("fit(); draw()")');
  for (const v of ['deutan', 'tritan']) { await p.evaluate((v) => { const s = document.getElementById('vision'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await shot(p, `33-clear-${v}`, '', 900); }
  await p.context().close();
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

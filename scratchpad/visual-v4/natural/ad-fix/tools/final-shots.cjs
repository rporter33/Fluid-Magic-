// the deliverable shots (natural/shots): views, regions, a wild, fog, a path, each mode, Clear, deutan and tritan, window sizes
const { launch, open, PAGE, SHOTS, realErrors } = require('./nlib2.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  const shot = async (p, name, src, wait = 1100) => { if (src) await ev(p, src); await p.waitForTimeout(wait); await p.screenshot({ path: SHOTS + name + '.png' }); console.log('shot', name); };
  // natural, 1440 x 900, reduced motion so every frame is settled
  let p = await open(b, PAGE, { errors, settle: 1800, reducedMotion: 'reduce' });
  await shot(p, '01-start', '');
  await shot(p, '02-far', 'm.setScale(0.3, 800, 540)');
  await shot(p, '03-mid', 'm.setScale(1.0, 640, 480)');
  await shot(p, '04-near-west', 'm.setScale(m.maxScale() * 0.9, 300, 470)');
  await shot(p, '05-near-centre', 'm.setScale(m.maxScale() * 0.9, 800, 560)');
  await shot(p, '06-near-east-fog', 'm.setScale(m.maxScale() * 0.9, 1250, 420)');
  await shot(p, '07-near-south', 'm.setScale(m.maxScale() * 0.9, 560, 860)');
  await shot(p, '08-near-north', 'm.setScale(m.maxScale() * 0.9, 980, 170)');
  await shot(p, '09-wild-ashspine', 'm.setScale(m.maxScale() * 0.7, 560, 230)');
  await shot(p, '10-wild-still-mere', 'm.setScale(m.maxScale() * 0.7, 900, 560)');
  await shot(p, '11-fog-frontier-mid', 'm.setScale(1.0, 1250, 480)');
  await shot(p, '12-ref-zoom', 'm.setScale(1.142, 700, 560)');
  await shot(p, '13-cliff-start', 'm.setScale(0.55, 800, 900)');
  await ev(p, 'm.ev("fit(); draw()")'); await ev(p, 'm.ev("orderMove(0, 0, acrossTarget)")'); await shot(p, '14-path-start', '');
  await shot(p, '15-path-mid', 'm.setScale(1.0, 500, 360)');
  await ev(p, 'm.ev("fit(); draw()")');
  for (const [k, mode] of [['16', 'dominion'], ['17', 'supply'], ['18', 'unrest'], ['19', 'population'], ['20', 'springs']]) await shot(p, `${k}-mode-${mode}`, `m.ev("setMode('${mode}')")`, 900);
  await ev(p, 'm.ev("setMode(\'terrain\')")'); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 150000, polling: 300 });
  await shot(p, '21-mode-terrain', '', 1200);
  await shot(p, '22-mode-terrain-mid', 'm.setScale(1.0, 640, 480)');
  await ev(p, 'm.ev("fit(); setMode(\'ownership\'); draw()")');
  for (const v of ['deutan', 'tritan']) { await p.evaluate((v) => { const s = document.getElementById('vision'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await shot(p, `23-natural-${v}`, '', 900); await shot(p, `24-natural-${v}-mid`, 'm.setScale(1.0, 640, 480)'); await ev(p, 'm.ev("fit(); draw()")'); }
  await p.evaluate(() => { const s = document.getElementById('vision'); s.value = 'normal'; s.dispatchEvent(new Event('change')); });
  await ev(p, 'm.setMonth(40)'); await shot(p, '25-month40', '', 1500);
  await p.context().close();
  // Clear terrain colours (?terrain=clear)
  p = await open(b, PAGE, { errors, settle: 1800, reducedMotion: 'reduce', q: '?terrain=clear' });
  await shot(p, '30-clear-start', ''); await shot(p, '31-clear-mid', 'm.setScale(1.0, 640, 480)'); await shot(p, '32-clear-near-west', 'm.setScale(m.maxScale() * 0.9, 300, 470)');
  await ev(p, 'm.ev("fit(); draw()")');
  for (const v of ['deutan', 'tritan']) { await p.evaluate((v) => { const s = document.getElementById('vision'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await shot(p, `33-clear-${v}`, '', 900); }
  await p.context().close();
  // window sizes
  for (const [w, h, n] of [[1280, 720, '40-1280x720'], [1024, 768, '41-1024x768'], [390, 844, '42-phone-390x844'], [1920, 1080, '43-1920x1080']]) { p = await open(b, PAGE, { errors, settle: 1800, reducedMotion: 'reduce', w, h }); await shot(p, n, ''); await p.context().close(); }
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

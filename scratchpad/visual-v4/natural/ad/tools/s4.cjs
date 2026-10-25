const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const OUT = __dirname + '/../shots/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 1500, reducedMotion: 'reduce' });
  await p.mouse.move(700, 880);
  await ev(p, 'm.setScale(0.75, 800, 520)'); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'd01-mid075.png' });
  console.log(JSON.stringify(await ev(p, '({ band: m.band(), lay: m.reliefLayout(), seats: m.reliefSeats() })')).slice(0, 900));
  // hover the Kharnath stack, feed link hover
  await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(500);
  const pk = await ev(p, 'm.pieceAt("varo")');
  let [x, y] = await ev(p, 'm.at("Kharnath")'); await p.mouse.move(x + 8, y - 34); await p.waitForTimeout(1200); await p.screenshot({ path: OUT + 'd02-hover-kharnath-stack.png' });
  const link = p.locator('[data-go]:visible').first(); if (await link.count()) { await link.hover({ timeout: 5000 }); await p.waitForTimeout(1200); await p.screenshot({ path: OUT + 'd03-feed-link-hover.png' }); }
  // hover a wild
  const wa = await ev(p, 'm.wildAt("ashspine")'); await p.mouse.move(wa[0], wa[1]); await p.waitForTimeout(1200); await p.screenshot({ path: OUT + 'd04-hover-wild.png' });
  // passability button
  await p.mouse.move(700, 880); await p.evaluate(() => document.getElementById('btnPass').click()); await p.waitForTimeout(1000); await p.screenshot({ path: OUT + 'd05-passability.png' }); await p.evaluate(() => document.getElementById('btnPass').click());
  // vision deutan at ref zoom
  await ev(p, 'm.setScale(1.142, 700, 560)'); await p.evaluate(() => { const s = document.getElementById('vision'); s.value = 'deutan'; s.dispatchEvent(new Event('change')); }); await p.waitForTimeout(1000); await p.screenshot({ path: OUT + 'd06-ref-deutan.png' });
  await p.evaluate(() => { const s = document.getElementById('vision'); s.value = 'normal'; s.dispatchEvent(new Event('change')); });
  // Painted v3 switch and back
  await ev(p, 'm.ev("fit(); draw()")'); await ev(p, 'm.setView("look","v3")'); await p.waitForTimeout(2500); await p.screenshot({ path: OUT + 'd07-v3.png' });
  await ev(p, 'm.setView("look","relief")'); await p.waitForTimeout(2500); await p.screenshot({ path: OUT + 'd08-back-relief.png' });
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();

// the time-lapse slider dragged to Y6 M10 by hand with the controls opened (they start folded under Relief, fix 6), then back to M3
const { launch, open } = require('../tools/lib.cjs');
const FILE = process.argv[2] || __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  await page.click('#headMore > summary'); await page.waitForTimeout(800);
  const tl = await page.$('#tl'); const bb = await tl.boundingBox();
  await page.mouse.move(bb.x + 3, bb.y + bb.height / 2); await page.mouse.down();
  for (let k = 1; k <= 20; k++) { await page.mouse.move(bb.x + 3 + (bb.width - 6) * k / 20, bb.y + bb.height / 2); await page.waitForTimeout(120); }
  await page.mouse.up(); await page.waitForTimeout(1500); await page.mouse.move(5, 890); await page.waitForTimeout(400);
  console.log('month', await page.evaluate(() => document.getElementById('tlv').textContent), 'controls open', await page.evaluate(() => document.getElementById('headMore').open), 'Dpx', await page.evaluate(() => window.__mock.ev('rlDpx().toFixed(1)')));
  await page.screenshot({ path: __dirname + '/after/after-tl-end.png' });
  console.log('layout at the end', JSON.stringify(await page.evaluate(() => { const v = window.__mock.reliefLayout(); return { ll: v.labelOverlaps, lp: v.labelPieceOverlaps, pp: v.pieceOverlaps, out: v.armiesOutsideInset, names: v.names }; })));
  await page.evaluate(() => window.__mock.setMonth(3)); await page.waitForTimeout(1200);
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

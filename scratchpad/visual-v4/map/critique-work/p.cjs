// critique pass P: the planned path's day chip at a fresh 1280 x 720 load and at 1440 x 900: inside the model? clear of the alerts ribbon?
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  for (const [w, h] of [[1280, 720], [1440, 900], [1024, 768]]) {
    const page = await open(b, FILE, w, h, '', errors);
    const across = await page.evaluate(() => window.__mock.across()); const [x, y] = await page.evaluate((nm) => window.__mock.at(nm), across);
    await page.mouse.click(x, y, { button: 'right' }); await page.mouse.move(5, h - 10); await page.waitForTimeout(800);
    const info = await page.evaluate(() => { const m = window.__mock, cr = m.ev('canvas.getBoundingClientRect()'), [mx0, my0] = m.ev('toScreen(0, 0)'), [mx1, my1] = m.ev('toScreen(W, H)'), rb = document.getElementById('ribbon').getBoundingClientRect();
      return { model: [cr.left + mx0, cr.top + my0, cr.left + mx1, cr.top + my1].map(Math.round), ribbon: [rb.left, rb.top, rb.right, rb.bottom].map(Math.round) }; });
    await page.screenshot({ path: `${OUT}/p-chip-${w}.png` });
    console.log(w, h, JSON.stringify(info));
    await page.close();
  }
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

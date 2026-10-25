// after the fixes, fix 11: the planned path's final day chip on the model and clear of the alerts ribbon, at 1280 x 720, 1440 x 900, 1024 x 768, and 1920 resized to 1280
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = process.argv[2] || __dirname + '/../game-screen-v4.html';
const probe = (page) => page.evaluate(() => { const m = window.__mock, cr = m.ev('canvas.getBoundingClientRect()'), [mx0, my0] = m.ev('toScreen(0, 0)'), [mx1, my1] = m.ev('toScreen(W, H)'), rb = document.getElementById('ribbon').getBoundingClientRect(), chips = m.ev('RL_THREAD_CHIPS.list');
  const last = chips[chips.length - 1], b = last.box, rib = [rb.left - cr.left, rb.top - cr.top, rb.right - cr.left, rb.bottom - cr.top];
  return { text: last.text, chip: b, model: [mx0, my0, mx1, my1].map(Math.round), onModel: b[0] >= mx0 + 4 && b[1] >= my0 + 4 && b[2] <= mx1 - 4 && b[3] <= my1 - 4, clearOfRibbon: !(rb.width && b[2] > rib[0] && b[0] < rib[2] && b[3] > rib[1] && b[1] < rib[3]), path: m.ev('moveLine.path.map((i) => names[i]).join(" > ")') }; });
(async () => {
  const b = await launch(), errors = [];
  for (const [w, h, rw, rh] of [[1280, 720], [1440, 900], [1024, 768], [1920, 1080, 1280, 720]]) {
    const page = await open(b, FILE, w, h, '', errors);
    if (rw) { await page.setViewportSize({ width: rw, height: rh }); await page.waitForTimeout(1500); }
    const across = await page.evaluate(() => window.__mock.across()), [x, y] = await page.evaluate((nm) => window.__mock.at(nm), across);
    const [vx, vy] = await page.evaluate(() => window.__mock.pieceAt('varo')); await page.mouse.click(vx, vy); await page.waitForTimeout(200);
    await page.mouse.click(x, y, { button: 'right' }); await page.mouse.move(5, (rh || h) - 10); await page.waitForTimeout(800);
    console.log(`${w}x${h}${rw ? ' -> ' + rw + 'x' + rh : ''}`, JSON.stringify(await probe(page)));
    await page.screenshot({ path: `${OUT}/v11-chip-${w}${rw ? '-to-' + rw : ''}.png` });
    await page.close();
  }
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

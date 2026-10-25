// critique pass C: valid moves, modes at Mid, fog at Near, time-lapse drag, toggles, v3 round trip, resize
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  const at = (n) => page.evaluate((nm) => window.__mock.at(nm), n);
  // valid move: adjacent Tormere? use across target Ashvale
  const across = await page.evaluate(() => window.__mock.across());
  let [x, y] = await at(across); await page.mouse.move(x, y); await page.waitForTimeout(700); await shot('c01-cursor-across');
  await page.mouse.click(x, y, { button: 'right' }); await page.waitForTimeout(900); await shot('c02-path-across');
  console.log('path', await mock('moveLine && moveLine.path.map((i) => names[i]).join(" > ")'));
  // move to adjacent province Briardale
  [x, y] = await at('Briardale'); await page.mouse.click(x + 5, y + 20, { button: 'right' }); await page.waitForTimeout(900); await shot('c03-path-briardale');
  console.log('path2', await mock('moveLine && moveLine.path.map((i) => names[i]).join(" > ")'));
  await page.mouse.move(700, 880);
  // modes at start view
  for (const m of ['dominion', 'supply', 'population']) { await page.click(`.modebtn[data-m="${m}"]`); await page.mouse.move(1120, 700); await page.waitForTimeout(900); await shot(`c10-mode-${m}`); }
  await page.$eval('.modebtn[data-m=ownership]', (e) => e.click()); await page.waitForTimeout(600); await shot('c11-back-ownership');
  // time-lapse: drag the slider to the end
  const tl = await page.$('#tl'); const bb = await tl.boundingBox();
  await page.mouse.move(bb.x + 3, bb.y + bb.height / 2); await page.mouse.down();
  for (let k = 1; k <= 20; k++) { await page.mouse.move(bb.x + 3 + (bb.width - 6) * k / 20, bb.y + bb.height / 2); await page.waitForTimeout(120); }
  await page.mouse.up(); await page.waitForTimeout(1500); await shot('c20-timelapse-end');
  console.log('month', await mock('document.getElementById("tlv").textContent'));
  // mid month
  await page.evaluate(() => window.__mock.setMonth(36)); await page.waitForTimeout(1200); await shot('c21-month36');
  await page.evaluate(() => window.__mock.setMonth(3)); await page.waitForTimeout(1200); await shot('c22-month3-back');
  // realm tint 8%
  await page.evaluate(() => window.__mock.setView('tint', 'on')); await page.waitForTimeout(1200); await shot('c30-tint8');
  await page.evaluate(() => window.__mock.setView('tint', 'off')); await page.waitForTimeout(800);
  // table simple / off
  await page.evaluate(() => window.__mock.setView('table', 'simple')); await page.waitForTimeout(900); await shot('c31-table-simple');
  await page.evaluate(() => window.__mock.setView('table', 'off')); await page.waitForTimeout(900); await shot('c32-table-off');
  await page.evaluate(() => window.__mock.setView('table', 'full')); await page.waitForTimeout(900);
  // detail reduced
  await page.evaluate(() => window.__mock.setView('detail', 'reduced')); await page.waitForTimeout(900); await shot('c33-detail-reduced');
  await page.evaluate(() => window.__mock.setView('detail', 'full')); await page.waitForTimeout(900);
  // v3 round trip
  await page.evaluate(() => window.__mock.setView('look', 'v3')); await page.waitForTimeout(2500); await shot('c40-to-v3');
  await page.evaluate(() => window.__mock.setView('look', 'relief')); await page.waitForTimeout(2500); await shot('c41-back-relief');
  // resize to 1920x1080 and 1280x720
  await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(1500); await shot('c50-1920');
  await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(1500); await shot('c51-1280');
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

// hover tint, link hover, wild hover, selection + path at the start view
const { launch, open } = require('./lib.cjs'); const fs = require('fs');
const [file, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, file, 1440, 900, '', errors);
  const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
  const at = (n) => page.evaluate((nm) => window.__mock.at(nm), n);
  let [x, y] = await at('Kharnath'); await page.mouse.move(x - 25, y + 25); await page.waitForTimeout(250); await shot('hover');
  [x, y] = await at('Stagmoor'); await page.mouse.move(x, y); await page.waitForTimeout(250); await shot('hover-indep');
  await page.click('#railFeed'); await page.waitForTimeout(300);
  const link = await page.$('#msgs .link'); const bb = await link.boundingBox(); await page.mouse.move(bb.x + 5, bb.y + 5); await page.waitForTimeout(300); await shot('link'); await page.click('#railFeed'); await page.waitForTimeout(300);
  const across = await page.evaluate(() => window.__mock.across());
  [x, y] = await at(across); await page.mouse.click(x, y, { button: 'right' }); await page.waitForTimeout(700); await shot('path');
  const [wx, wy] = await page.evaluate(() => window.__mock.wildAt('ashspine')); await page.mouse.move(wx, wy); await page.waitForTimeout(1200); await shot('wild');
  [x, y] = await at('Ashmoor'); await page.mouse.move(x, y + 10); await page.mouse.click(x, y + 10); await page.waitForTimeout(600); await shot('select-prov');
  const [kx, ky] = await page.evaluate(() => { const L = window.__mock.ev('RL_PIECE_CACHE.get("L")'); const a = L.armies.find((q) => q.kind === 'stack'); const r = document.getElementById('map').getBoundingClientRect(); return [r.left + a.x + window.__mock.ev('cam.x'), r.top + a.y + window.__mock.ev('cam.y') - 10]; });
  await page.mouse.move(kx, ky); await page.waitForTimeout(700); await shot('fan');
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

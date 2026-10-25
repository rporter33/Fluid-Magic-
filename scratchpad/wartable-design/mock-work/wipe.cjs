const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [file, outDir] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  await page.evaluate(() => window.__mock.zoomTo(1.1, 'Ashfen')); await page.waitForTimeout(600);
  await page.check('#wipe');
  await page.evaluate(() => window.__mock.setMonth(31)); await page.waitForTimeout(250); await page.screenshot({ path: outDir + '/w-mid.png' });
  await page.waitForTimeout(700); await page.screenshot({ path: outDir + '/w-end.png' });
  // slider drag across the range
  const box = await page.locator('#tl').boundingBox();
  await page.mouse.move(box.x + 2, box.y + box.height / 2); await page.mouse.down();
  for (let k = 0; k <= 30; k++) { await page.mouse.move(box.x + 2 + (box.width - 4) * k / 30, box.y + box.height / 2); await page.waitForTimeout(30); }
  await page.mouse.up(); await page.waitForTimeout(800);
  console.log('tl', await page.locator('#tlv').textContent(), 'date', await page.locator('#date').textContent());
  // ambience: run the clock for 3 s with the table in view
  await page.keyboard.press('z'); await page.waitForTimeout(400); await page.keyboard.press('Space'); await page.waitForTimeout(3000); await page.keyboard.press('Space');
  console.log('date after run', await page.locator('#date').textContent());
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();

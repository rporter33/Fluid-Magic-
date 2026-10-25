const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [file, outDir] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  const info = await page.evaluate(() => window.__mock.info());
  const shots = [[14, info.pillage, 'pillage'], [21, info.burn, 'burn'], [36, info.ashRain, 'ashrain'], [10, 'Deepmoss', 'fertile'], [62, 'Deepmoss', 'siege'], [17, info.sunmere, 'claim'], [4, 'Morholt', 'scar'], [8, 'Morholt', 'cairns'], [48, 'Kharnath', 'walls']];
  for (const [m, name, tag] of shots) {
    await page.evaluate((mm) => window.__mock.setMonth(mm), m); await page.waitForTimeout(700);
    await page.evaluate((n) => window.__mock.zoomTo(1.6, n), name); await page.waitForTimeout(900);
    const [x, y] = await page.evaluate((n) => window.__mock.at(n), name);
    await page.screenshot({ path: `${outDir}/e-${tag}.png`, clip: { x: Math.max(0, x - 260), y: Math.max(160, y - 200), width: 520, height: 400 } });
  }
  console.log(JSON.stringify(info), 'errors', JSON.stringify(errors));
  await browser.close();
})();

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('console', (m) => console.log('CONSOLE', m.text()));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  await page.evaluate(() => window.__mock.zoomTo(window.__mock.maxScale() * 0.85, 'Kharnath'));
  for (let k = 0; k < 6; k++) { await page.waitForTimeout(300); console.log(JSON.stringify(await page.evaluate(() => [window.__mock.reb(), window.__mock.sprInfo()]))); }
  await browser.close();
})();

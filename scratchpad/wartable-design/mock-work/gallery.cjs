const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [file, out, h = '2100'] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: Number(h) } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' }); await page.waitForTimeout(700);
  await page.click('#btnPortraits'); await page.waitForTimeout(500);
  await page.locator('.modal').screenshot({ path: out });
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();

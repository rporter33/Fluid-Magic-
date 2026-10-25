const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' }); await page.waitForTimeout(900);
  const badges = await page.$$eval('.badge', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [e.dataset.tip, Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }));
  console.log(JSON.stringify(badges));
  console.log(JSON.stringify(await page.evaluate(() => window.__mock.lbl ? window.__mock.lbl() : null)));
  const c = await page.$eval('#map', (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top]; }); console.log('canvas', c);
  await browser.close();
})();

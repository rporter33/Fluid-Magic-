// node hash.cjs <html> [query]: the start view's canvas hash and __mock.checks() (baseline for "Bright is unchanged")
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file, q = ''] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  const ck = await page.evaluate(() => window.__mock.checks());
  console.log(JSON.stringify({ stable: ck.stable, hit: ck.hit, labels: ck.labels }));
  console.log('ERRORS ' + JSON.stringify(errors));
  await browser.close();
})();

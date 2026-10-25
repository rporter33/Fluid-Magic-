const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const open = async (q = '') => { const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' })); await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); return page; };
  for (const q of ['', '', '', '']) for (const wait of [300, 4000]) {
    const page = await open(q); await page.evaluate(() => window.__mock.tryArt('broadleaf')); await page.waitForTimeout(wait);
    console.log(q || 'bright', wait, await page.evaluate(() => window.__mock.checks().stable.first)); await page.close();
  }
  await browser.close();
})();

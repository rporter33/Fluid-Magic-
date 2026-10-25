const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HTML = process.argv[2];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.goto('file://' + HTML, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  const out = await page.evaluate(() => { const { cam, provs, MED_DIAM } = window.__j2; return { camS: cam.s, MED_DIAM, startMedPx: cam.s * MED_DIAM, provs: provs.length }; });
  console.log(JSON.stringify(out)); await browser.close();
})();

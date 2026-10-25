const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const file = process.argv[2];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.continue());
  await page.goto('file://' + file, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errors.push('goto: ' + e.message));
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => ({ MED_DIAM, U, s: cam.s, band: bandOf(cam.s), fit: fitScale, n: provs.length, terr: provs.map((p) => [p.i, p.terrain, p.owner, fogOf(p.i), p.cap ? 1 : 0]), fontsReady, typeofPG: typeof paintGround, winPG: typeof window.paintGround, PAINT, mb: MODE_BASE }));
  console.log(JSON.stringify(info));
  console.log(JSON.stringify(errors));
  await browser.close();
})();

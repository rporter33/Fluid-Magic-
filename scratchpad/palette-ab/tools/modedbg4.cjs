const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  await page.keyboard.press('Shift+Digit3'); await page.waitForTimeout(2000);
  const H = `(() => { invalidateBakes(); firstPaint = true; CK = null; draw(); const c = document.getElementById('map'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; })()`;
  console.log('bright scratch', await page.evaluate((h) => window.__mock.ev(h), H));
  console.log(await page.evaluate(() => window.__mock.ev("setPalette('painted'); view.palette + ' ' + TERRAIN.farmland.fill")));
  console.log('painted scratch (same page)', await page.evaluate((h) => window.__mock.ev(h), H));
  await page.waitForTimeout(2000);
  console.log('painted scratch after 2 s', await page.evaluate((h) => window.__mock.ev(h), H));
  await browser.close();
})();

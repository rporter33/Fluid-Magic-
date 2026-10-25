const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file + '?palette=painted', { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  const info = await page.evaluate(() => window.__mock.ev(`({ MED_DIAM, s: cam.s, fit: fitScale, min: minScale, max: maxScale, band: bandOf(cam.s), fonts: [...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+' '+f.weight).slice(0,20), fontsReady, provs: provList.map(i => [names[i], prov[i].terrain, prov[i].owner || '', fogOf(i)]) , info: window.__mock.info()})`));
  console.log(JSON.stringify(info));
  console.log(JSON.stringify(errors));
  await browser.close();
})();

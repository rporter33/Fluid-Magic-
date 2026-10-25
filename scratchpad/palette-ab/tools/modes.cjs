// node modes.cjs <html> <outDir>: Supply mode in both palettes (fresh pages), and the deco fade state
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file, out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  for (const [pal, q] of [['bright', ''], ['painted', '?palette=painted']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    await page.keyboard.press('Shift+Digit3'); await page.waitForTimeout(3000);
    console.log(pal, await page.evaluate(() => window.__mock.ev('state.mode + " decoTo " + decoTo + " decoAlpha " + decoAlpha.toFixed(2) + " base " + JSON.stringify(MODE_BASE)')));
    await page.screenshot({ path: `${out}/${pal}-supply.png` });
    await page.keyboard.press('Shift+Digit1'); await page.waitForTimeout(1500);
    await page.close();
  }
  console.log('ERRORS ' + JSON.stringify(errors)); await browser.close();
})();

// node vision.cjs <html> <outDir>: Painted vision and Supply shots on a fresh page (the same state as the Bright vision shots)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file, out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file + '?palette=painted', { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  for (const v of ['deutan', 'tritan', 'protan']) { await page.selectOption('#vision', v); await page.waitForTimeout(700); await page.screenshot({ path: `${out}/painted-${v}.png` }); }
  await page.selectOption('#vision', 'normal');
  await page.keyboard.press('Shift+Digit3'); await page.waitForTimeout(1200); await page.screenshot({ path: `${out}/painted-supply.png` });
  console.log('ERRORS ' + JSON.stringify(errors)); await browser.close();
})();

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const [file] = process.argv.slice(2);
const FIXSRC = fs.readFileSync(path.join(__dirname, '../override/fixes.js'), 'utf8');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (let rep = 0; rep < 2; rep++) for (const fx of [[], ['F1', 'F2', 'F3', 'F4', 'F5', 'F6b', 'F8', 'F9b']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + '?palette=painted', { waitUntil: 'load', timeout: 90000 }); await page.waitForTimeout(5000);
    await page.evaluate(([f, src]) => { window.__FIX = f; return window.__mock.ev(src); }, [fx, FIXSRC]); await page.waitForTimeout(2000);
    const d = await page.evaluate(() => window.__mock.density());
    console.log(rep, fx.length ? 'proposed' : 'asbuilt', JSON.stringify(d.bake));
    await page.close();
  }
  await browser.close();
})();

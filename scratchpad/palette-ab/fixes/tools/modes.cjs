// node modes.cjs <before.html> <after.html> <outDir>: the five data modes (Shift+2 to Shift+6) at the start view in both palettes, before and
// after the fixes: full-page shots for modes.py to compare, and the mode and deco fade state
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [before, after, out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [], info = {};
  for (const [tag, file] of [['before', before], ['after', after]]) for (const [pal, q] of [['bright', ''], ['painted', '?palette=painted']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (e) => errors.push(`${tag} ${pal} pageerror: ` + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag} ${pal} console: ` + m.text()); });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); await page.mouse.move(1000, 885);
    for (const d of [2, 3, 4, 5, 6]) {
      await page.keyboard.press('Shift+Digit' + d); await page.waitForTimeout(3000);
      const k = `${tag}-${pal}-m${d}`;
      info[k] = await page.evaluate(() => window.__mock.ev('state.mode + " decoAlpha " + decoAlpha.toFixed(2)'));
      await page.screenshot({ path: `${out}/${k}.png` });
    }
    await page.keyboard.press('Shift+Digit1'); await page.waitForTimeout(800); await page.close();
  }
  fs.writeFileSync(`${out}/modes.json`, JSON.stringify({ info, errors }, null, 1));
  console.log(JSON.stringify(info)); console.log('ERRORS ' + JSON.stringify(errors)); await browser.close();
})();

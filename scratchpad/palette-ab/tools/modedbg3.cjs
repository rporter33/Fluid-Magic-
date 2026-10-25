const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  await page.keyboard.press('Shift+Digit3'); await page.waitForTimeout(2000);
  const r = await page.evaluate(() => window.__mock.ev(`(() => {
    const grab = () => { invalidateBakes(); firstPaint = true; CK = null; draw(); const c = document.getElementById('map'); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data.slice(); };
    const diff = (a, b) => { let n = 0; for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 6) n++; return n; };
    const out = {};
    for (const skip of [[], ['deco'], ['deco', 'marks'], ['deco', 'marks', 'wilds', 'labels'], ['deco', 'marks', 'wilds', 'labels', 'scene', 'table']]) {
      SKIP.clear(); for (const s of skip) SKIP.add(s);
      setPalette('bright'); const A = grab(); setPalette('painted'); const B = grab(); setPalette('bright');
      out[skip.join('+') || 'none'] = diff(A, B);
    }
    SKIP.clear(); out.decoAlpha = decoAlpha; out.mode = state.mode; return JSON.stringify(out); })()`));
  console.log(r);
  await browser.close();
})();

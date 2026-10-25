// node fadebug.cjs <html> [query]: after a switch to Supply, is the live canvas the same as a from-scratch render? (the fade's last frame)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file, q = ''] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  const H = `(() => { const c = document.getElementById('map'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; })()`;
  for (const [key, back] of [['Shift+Digit3', 'Shift+Digit1'], ['Shift+Digit2', 'Shift+Digit1']]) {
    await page.keyboard.press(key); await page.waitForTimeout(2000);
    const live = await page.evaluate((h) => window.__mock.ev(h), H);
    const scratch = await page.evaluate((h) => window.__mock.ev('invalidateBakes(); firstPaint = true; CK = null; draw(); ' + h), H);
    console.log(key, 'live', live, 'scratch', scratch, live === scratch ? 'same' : 'DIFFERENT');
    await page.keyboard.press(back); await page.waitForTimeout(2500);
    const live2 = await page.evaluate((h) => window.__mock.ev(h), H);
    const scratch2 = await page.evaluate((h) => window.__mock.ev('invalidateBakes(); firstPaint = true; CK = null; draw(); ' + h), H);
    console.log(back, 'live', live2, 'scratch', scratch2, live2 === scratch2 ? 'same' : 'DIFFERENT');
  }
  await browser.close();
})();

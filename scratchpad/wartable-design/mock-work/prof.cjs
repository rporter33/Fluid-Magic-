const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  console.log('fit', JSON.stringify(await page.evaluate(() => window.__mock.prof(10))), 'panFps ms/frame', await page.evaluate(() => window.__mock.panFps(3, 60)));
  await page.evaluate(() => window.__mock.zoomTo(window.__mock.maxScale() * 0.85, 'Kharnath')); await page.waitForTimeout(1500);
  console.log('near', JSON.stringify(await page.evaluate(() => window.__mock.prof(10))), 'panFps', await page.evaluate(() => window.__mock.panFps(3, 60)));
  await page.evaluate(() => window.__mock.zoomTo(0.21, 'Kharnath')); await page.waitForTimeout(1500);
  console.log('lean', JSON.stringify(await page.evaluate(() => window.__mock.prof(10))), 'panFps', await page.evaluate(() => window.__mock.panFps(3, 60)));
  const idle = await page.evaluate(() => new Promise((res) => { let k = 0, t0 = 0; const st = (now) => { if (k === 1) t0 = now; if (k > 60) { res((now - t0) / 60); return; } k++; requestAnimationFrame(st); }; requestAnimationFrame(st); })); console.log('idle rAF ms', idle);
  console.log(await page.evaluate(() => navigator.userAgent), await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl'); return c ? c.getParameter(c.RENDERER) : 'no webgl'; }));
  await browser.close();
})();

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' }); await page.waitForTimeout(900);
  const out = {};
  out.fitPan = await page.evaluate(() => window.__mock.panFps(3, 90));
  const r0 = await page.evaluate(() => window.__mock.reb());
  out.rebuildAvgMs = r0.ms / r0.n;
  // hover: move across provinces
  const t0 = Date.now(); for (let k = 0; k < 40; k++) { await page.mouse.move(300 + k * 12, 400 + (k % 5) * 20); } out.hover40ms = Date.now() - t0;
  await page.evaluate(() => window.__mock.zoomTo(window.__mock.maxScale() * 0.85, 'Kharnath')); await page.waitForTimeout(2500);
  out.nearPan = await page.evaluate(() => window.__mock.panFps(3, 90));
  await page.evaluate(() => window.__mock.zoomTo(0.26, 'Kharnath')); await page.waitForTimeout(1500);
  out.leanPan = await page.evaluate(() => window.__mock.panFps(3, 90));
  const r1 = await page.evaluate(() => window.__mock.reb()); out.rebuilds = r1.n; out.rebuildAvgMsAll = r1.ms / r1.n;
  console.log(JSON.stringify(out, (k, v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v)));
  await browser.close();
})();

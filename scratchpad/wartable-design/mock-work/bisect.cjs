const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  const z = process.argv[3]; if (z) { await page.evaluate((s) => window.__mock.zoomTo(window.__mock.maxScale() * s, 'Kharnath'), Number(z)); await page.waitForTimeout(1500); }
  const res = {}; console.log('reb0', JSON.stringify(await page.evaluate(() => window.__mock.reb())));
  res.all = await page.evaluate(() => window.__mock.panFps(3, 40)); console.log('reb1', JSON.stringify(await page.evaluate(() => window.__mock.reb())), await page.evaluate(() => window.__mock.sprInfo()));
  for (const k of ['scene', 'table', 'cloth', 'deco', 'labels', 'badges']) { await page.evaluate((kk) => window.__mock.skip(kk, true), k); res['-' + k] = await page.evaluate(() => window.__mock.panFps(3, 40)); await page.evaluate((kk) => window.__mock.skip(kk, false), k); }
  for (const k of ['scene', 'deco', 'wilds', 'labels', 'badges', 'marks']) await page.evaluate((kk) => window.__mock.skip(kk, true), k);
  res.none = await page.evaluate(() => window.__mock.panFps(3, 40));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(res).map(([k, v]) => [k, +v.toFixed(1)]))));
  await browser.close();
})();

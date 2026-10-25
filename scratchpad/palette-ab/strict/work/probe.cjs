const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [file] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({ terr: typeof TERRAIN, paint: typeof paintGround, cams: cam.s, med: typeof MED_DIAM !== 'undefined' ? MED_DIAM : null, U: typeof U !== 'undefined' ? U : null, dark: [...DARK_T], hand: view.hand, farm: view.farm, mb: MODE_BASE, reset: typeof resetGeometryCaches, inv: typeof invalidateBakes, band: bandOf(cam.s), provs: provs.length, owners: provs.filter((p) => p.owner).length, fog: provs.map((p) => fogOf(p.i)).reduce((o, f) => ((o[f] = (o[f] ?? 0) + 1), o), {}) }));
  console.log(JSON.stringify(r, null, 1), errors);
  await browser.close();
})();

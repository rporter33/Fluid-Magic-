// Shoots ../pilot/formation-test.html at each camera preset (Playwright; the Pixi CDN routed to the repo's copy).
// Usage: node shoot_pilot.cjs OUTDIR [WIDTH HEIGHT]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const PAGE = path.resolve(__dirname, '..', 'pilot', 'formation-test.html');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
(async () => {
  const out = process.argv[2];
  const W = +(process.argv[3] || 1600), H = +(process.argv[4] || 900);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.googleapis|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 120000 });
  const presets = await page.evaluate(async () => (await window.__pilot.ready).presets);
  const shots = [];
  for (const p of presets) {
    const r = await page.evaluate((n) => window.__pilot.ready.then((P) => P.view(n)), p);
    await page.waitForTimeout(400);
    const f = path.join(out, `formation-${p}.png`);
    await page.screenshot({ path: f });
    shots.push({ ...r, file: f });
  }
  const errs = await page.evaluate(() => (window.__errors || []).slice());
  console.log(JSON.stringify({ shots, errors: errors.concat(errs) }, null, 1));
  await browser.close();
})();

// Shoots ../pilot/ad/formation-test-ad.html at each camera preset, and the 'motion' preset at 8 times
// (Playwright; the Pixi CDN routed to the repo's copy). Usage: node ad_shoot.cjs OUTDIR [WIDTH HEIGHT]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const PAGE = path.resolve(__dirname, '..', 'pilot', 'ad', 'formation-test-ad.html');
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
  await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 180000 });
  const presets = await page.evaluate(async () => (await window.__ad.ready).presets);
  const shots = [];
  for (const p of presets) {
    if (p === 'motion') continue;
    const r = await page.evaluate((n) => window.__ad.ready.then((P) => P.view(n)), p);
    await page.waitForTimeout(400);
    const f = path.join(out, `ad-${p}.png`);
    await page.screenshot({ path: f });
    shots.push({ ...r, file: f });
  }
  await page.evaluate(() => window.__ad.ready.then((P) => P.view('motion', { still: true })));
  for (let i = 0; i < 8; i++) {
    const t = i * 0.225;
    await page.evaluate((tt) => window.__ad.ready.then((P) => P.setTime(tt)), t);
    await page.waitForTimeout(150);
    const f = path.join(out, `ad-motion-${i}.png`);
    await page.screenshot({ path: f });
    shots.push({ name: 'motion', t, file: f });
  }
  const errs = await page.evaluate(() => (window.__errors || []).slice());
  const anchors = await page.evaluate(() => window.__ad.ready.then((P) => P.anchors));
  console.log(JSON.stringify({ shots: shots.map((s) => s.file), anchors, errors: errors.concat(errs) }, null, 1));
  await browser.close();
})();

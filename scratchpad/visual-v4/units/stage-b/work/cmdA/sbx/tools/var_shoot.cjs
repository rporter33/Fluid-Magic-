// Shoots ../../page/variation.html (Playwright; the Pixi CDN routed to the repo's copy).
// Usage: node var_shoot.cjs OUTDIR    Writes var-<view>-<ground>.png, motion frames, layout JSON and perf.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const PAGE = path.resolve(__dirname, '..', '..', 'page', 'variation.html');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
(async () => {
  const out = process.argv[2];
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => (window.__var && window.__var.ready) || window.__varError, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.__varError || null);
  if (err) { console.log(JSON.stringify({ error: err, errors })); await browser.close(); return; }
  const res = { shots: [], layouts: {}, errors };
  const shots = [['play', '#A8A784'], ['play', '#8E8E78'], ['play40', '#A8A784'], ['close', '#A8A784'], ['lineup', '#A8A784']];
  for (const [v, g] of shots) {
    await page.evaluate(([vv, gg]) => window.__var.view(vv, gg), [v, g]);
    await page.waitForTimeout(200);
    const f = path.join(out, `var-${v}-${g.slice(1)}.png`);
    await page.screenshot({ path: f });
    res.shots.push(f);
    res.layouts[`${v}-${g.slice(1)}`] = await page.evaluate(() => window.__var.layout());
  }
  await page.evaluate(() => window.__var.view('motion', '#A8A784'));
  for (let i = 0; i < 6; i++) {
    await page.evaluate((t) => window.__var.setTime(t), i * 0.21);
    const f = path.join(out, `var-motion-${i}.png`);
    await page.screenshot({ path: f }); res.shots.push(f);
  }
  await page.evaluate(() => window.__var.view('play', '#A8A784'));
  res.perfPlay = await page.evaluate(() => window.__var.perf(120));
  res.limits = await page.evaluate(() => window.__var.limits);
  fs.writeFileSync(path.join(out, 'var-shots.json'), JSON.stringify(res, null, 1));
  console.log(JSON.stringify({ shots: res.shots.length, errors, perf: res.perfPlay }));
  await browser.close();
})();

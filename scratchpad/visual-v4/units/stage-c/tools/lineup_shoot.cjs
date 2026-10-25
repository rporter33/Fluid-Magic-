// Shots of stage-c/lineup.html: 1440 x 900 (all, each size range, back view) and 390 x 844 (phone, DPR 2).
//   node lineup_shoot.cjs <lineup.html> <outdir>
const fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const [FILE, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const log = {};
  for (const [name, vp] of [['1440', { width: 1440, height: 900, dpr: 1 }], ['390', { width: 390, height: 844, dpr: 2, touch: true }]]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, hasTouch: !!vp.touch, isMobile: !!vp.touch });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
    await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto('file://' + FILE, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__lineup && (window.__lineup.ready || window.__lineup.error), null, { timeout: 120000 });
    await wait(400);
    await page.screenshot({ path: path.join(OUT, `lineup-${name}-all.png`) });
    for (const f of ['1,2', '3,4', '5,6']) { await page.evaluate((ff) => window.__lineup.frameBy(ff), f); await wait(300); await page.screenshot({ path: path.join(OUT, `lineup-${name}-size${f.replace(',', '-')}.png`) }); }
    await page.evaluate(() => { window.__lineup.setView('back'); window.__lineup.frameBy('all'); }); await wait(300);
    await page.screenshot({ path: path.join(OUT, `lineup-${name}-all-back.png`) });
    await page.evaluate(() => { window.__lineup.setView('front'); window.__lineup.frameBy('all'); });
    log[name] = { errors, state: await page.evaluate(() => ({ entries: window.__lineup.entries, textures: window.__lineup.textures ? window.__lineup.textures() : null, err: window.__lineup.error || null })) };
    await ctx.close();
  }
  console.log(JSON.stringify(log));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

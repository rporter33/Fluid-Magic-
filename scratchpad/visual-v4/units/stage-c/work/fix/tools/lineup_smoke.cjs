// Stage C fix pass: lineup smoke: loads the page, reports errors, the load time, the tier swap and tier H loading on a
// focused figure, the legend's portraits, and the commander entries.   node lineup_smoke.cjs <lineup.html>
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const out = {};
  for (const [name, vp] of [['1440', { width: 1440, height: 900, dpr: 1 }], ['390', { width: 390, height: 844, dpr: 3, touch: true }]]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, hasTouch: !!vp.touch, isMobile: !!vp.touch });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
    await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const t0 = Date.now();
    await page.goto('file://' + process.argv[2], { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.__lineup && (window.__lineup.ready || window.__lineup.error), null, { timeout: 900000 });
    const loadS = (Date.now() - t0) / 1000;
    const a = await page.evaluate(() => ({ tier: window.__lineup.tier(), h: window.__lineup.hLoaded(), tex: window.__lineup.textures(), entries: window.__lineup.entries,
      portraits: document.querySelectorAll('#legend li img').length, legend: document.querySelectorAll('#legend li').length,
      cmd: window.__lineup.ids().filter((i) => i.startsWith('cmd-')).length, err: window.__lineup.error || null }));
    await page.evaluate(() => window.__lineup.focusId('oakheart'));
    for (let i = 0; i < 60; i++) { await wait(200); if (await page.evaluate(() => window.__lineup.hLoaded() > 0)) break; }
    await wait(300);
    const b = await page.evaluate(() => ({ tier: window.__lineup.tier(), h: window.__lineup.hLoaded(), focus: document.getElementById('focus').classList.contains('on'),
      overflowX: document.documentElement.scrollWidth > window.innerWidth }));
    await page.evaluate(() => window.__lineup.focusId('elderWyrm-thornwood'));
    await wait(400);
    b.legendScroll = await page.evaluate(() => { const ol = document.getElementById('list'), li = [...ol.children].find((x) => x.classList.contains('on'));
      if (!li) return null; const r = li.getBoundingClientRect(), o = ol.getBoundingClientRect(); return { scrollTop: ol.scrollTop, liVisible: r.top >= o.top - 1 && r.bottom <= o.bottom + 1 }; });
    await page.evaluate(() => window.__lineup.frameBy('all'));
    await wait(300);
    const c = await page.evaluate(() => ({ tier: window.__lineup.tier(), focus: document.getElementById('focus').classList.contains('on') }));
    out[name] = { loadS, atLoad: a, focused: b, afterAll: c, errors };
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

// Stage C fix pass: the lineup focused on each fixed figure (front and back), as the critique's [09] and [21] views:
// 1440 x 900 at DPR 1 and DPR 2 (the owner's close look), for the old and the new page alike (the old page has no
// focusId: its data gives the index). Also the size 1-2 frame at play zoom (a man 28 px) for the riders and gods.
//   node lineup_focus.cjs <lineup.html> <outdir> <prefix>
const fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const [FILE, OUT, PRE] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const IDS = ['oakheart', 'hornetSwarm', 'ashRider', 'wolfRider', 'wolf', 'treant-04', 'treant-02', 'ascendedHero-cinderHorde', 'oracle-cinderHorde',
  'wildSpirit-thornwood', 'ashColossus-cinderHorde', 'livingMonolith-cinderHorde', 'livingMonolith-thornwood', 'hornedHunter-thornwood'];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const log = { errors: [], shots: [] };
  for (const dpr of [1, 2]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => log.errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) log.errors.push(m.text()); });
    page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) log.errors.push('requestfailed ' + r.url().slice(0, 80)); });
    await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto('file://' + FILE, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__lineup && (window.__lineup.ready || window.__lineup.error), null, { timeout: 900000 });
    for (const v of ['front', 'back']) {
      for (const id of IDS) {
        const ok = await page.evaluate(([id, v]) => {
          const L = window.__lineup; L.setView(v);
          const figs = JSON.parse(document.getElementById('lineup-data').textContent).figures;
          const f = figs.find((x) => x.id === id);
          if (!f || !f.views[v]) return false;
          if (L.focusId) L.focusId(id); else L.focusOn(figs.indexOf(f));
          return true;
        }, [id, v]);
        if (!ok) continue;
        // wait for tier H (the new page loads it on first use)
        for (let i = 0; i < 40; i++) { await wait(150); const st = await page.evaluate(() => (window.__lineup.tier ? window.__lineup.tier() : 'S')); if (st === 'S' || i > 4) break; }
        await wait(500);
        const p = path.join(OUT, `${PRE}-focus-${id}-${v}-dpr${dpr}.png`);
        await page.screenshot({ path: p, timeout: 240000 });
        log.shots.push({ id, v, dpr, tier: await page.evaluate(() => (window.__lineup.tier ? window.__lineup.tier() : 'S (tier S only)')) });
      }
    }
    if (dpr === 1) {
      for (const v of ['front', 'back']) {
        await page.evaluate((v) => { window.__lineup.setView(v); window.__lineup.frameBy('1,2'); }, v); await wait(400);
        await page.screenshot({ path: path.join(OUT, `${PRE}-size1-2-${v}.png`), timeout: 240000 });
        await page.evaluate((v) => { window.__lineup.setView(v); window.__lineup.frameBy('3,4'); }, v); await wait(400);
        await page.screenshot({ path: path.join(OUT, `${PRE}-size3-4-${v}.png`), timeout: 240000 });
      }
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, `${PRE}-focus.json`), JSON.stringify(log, null, 1));
  console.log(JSON.stringify({ errors: log.errors, n: log.shots.length }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

// node preview.cjs <html> <outDir> <candidates.json>: renders candidate Painted fills in the built page at runtime (PALETTES.painted is
// overwritten in the page through the review hook, then setPalette runs as the Palette control would; no part file is edited), shoots the
// start view, Near views, the reference scale and the CVD previews, and runs the page's paint check (Far full-decoration pairs) and checks().
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [file, out, candFile] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(candFile, 'utf8'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const res = {};
  const hash = (page) => page.evaluate(() => window.__mock.ev(`(() => { invalidateBakes(); firstPaint = true; CK = null; draw(); const c = document.getElementById('map'), cp = document.createElement('canvas'); cp.width = c.width; cp.height = c.height; const g = cp.getContext('2d', { willReadFrequently: true }); g.drawImage(c, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let h = 2166136261 >>> 0; for (let k = 0; k < d.length; k += 3) h = Math.imul(h ^ d[k], 16777619) >>> 0; return h; })()`));
  for (const [name, pal] of Object.entries(C)) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + '?palette=painted', { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    await page.mouse.move(1000, 885);
    const before = await hash(page);
    await page.evaluate((p) => window.__mock.ev(`setPalette('bright'); Object.assign(PALETTES.painted, ${JSON.stringify(p)}); setPalette('painted'); invalidateBakes(); firstPaint = true; draw()`), pal);
    await page.waitForTimeout(2500);
    const after = await hash(page);
    const r = { fills: await page.evaluate(() => window.__mock.ev('Object.fromEntries(Object.entries(TERRAIN).map(([t, d]) => [t, d.fill]))')), hashBefore: before, hashAfter: after };
    await page.screenshot({ path: `${out}/${name}-start.png` });
    for (const v of ['deutan', 'tritan', 'protan']) { await page.selectOption('#vision', v); await page.waitForTimeout(800); await page.screenshot({ path: `${out}/${name}-start-${v}.png` }); }
    await page.selectOption('#vision', 'normal'); await page.waitForTimeout(600);
    for (const [s, n] of [[2.04, 'Brambarrow'], [2.04, 'Redbarrow'], [1.4, 'Halebrook'], [2.04, 'Rookmere'], [0.957, 'Elmwick']]) {
      await page.evaluate(([s, n]) => window.__mock.zoomTo(s, n), [s, n]); await page.waitForTimeout(3000);
      await page.screenshot({ path: `${out}/${name}-${s}-${n}.png` });
    }
    await page.keyboard.press('z'); await page.waitForTimeout(1500);
    const pc = await page.evaluate(() => window.__mock.paintcheck());
    r.paint = pc.paint.map((q) => `${q.terrain} ${q.worstDE}${q.pass ? '' : ' FAIL'}`).join(', ');
    r.farPairsUnder = pc.farPairsUnder.length;
    const mins = { normal: 1e9, protan: 1e9, deutan: 1e9, tritan: 1e9 }, at = {};
    for (const q of pc.farPairs) for (const k of Object.keys(mins)) if (q[k] < mins[k]) { mins[k] = q[k]; at[k] = q.pair; }
    r.farClosest = Object.keys(mins).map((k) => `${k} ${mins[k]} (${at[k]})`).join('; ');
    const ck = await page.evaluate(() => window.__mock.checks());
    r.checks = { hitWrong: ck.hit.wrong + '/' + ck.hit.samples, labels: ck.labels.pct, overTokens: ck.labels.namesOverTokens, stable: ck.stable.identical };
    const tc = await page.evaluate(() => window.__mock.trackcheck()); r.tracks = tc.trackSummary;
    r.errors = errors; res[name] = r; console.log(name, JSON.stringify(r));
    await page.close();
  }
  fs.writeFileSync(`${out}/preview.json`, JSON.stringify(res, null, 1));
  await browser.close();
})();

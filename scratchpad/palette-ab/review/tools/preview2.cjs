// node preview2.cjs <html> <outDir> <configs.json>: each config = { palette, fix: [...] }; applies override/fixes.js at runtime, shoots and checks.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const [file, out, cfgFile] = process.argv.slice(2);
const CFG = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const FIXSRC = fs.readFileSync(path.join(__dirname, '../override/fixes.js'), 'utf8');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const res = {};
  for (const [name, c] of Object.entries(CFG)) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + (c.palette === 'painted' ? '?palette=painted' : ''), { waitUntil: 'load', timeout: 90000 }); await page.waitForTimeout(5000);
    await page.mouse.move(1000, 885);
    await page.evaluate(([fx, src]) => { window.__FIX = fx; return window.__mock.ev(src); }, [c.fix, FIXSRC]);
    await page.waitForTimeout(2500);
    const r = { fix: c.fix };
    await page.screenshot({ path: `${out}/${name}-start.png` });
    for (const v of ['deutan', 'tritan']) { await page.selectOption('#vision', v); await page.waitForTimeout(800); await page.screenshot({ path: `${out}/${name}-start-${v}.png` }); }
    await page.selectOption('#vision', 'normal'); await page.waitForTimeout(600);
    for (const [s, n] of [[0.957, 'Elmwick'], [1.4, 'Stagmoor'], [2.04, 'Redbarrow'], [2.04, 'Brambarrow'], [2.04, 'Rookmere'], [1.4, 'Halebrook']]) {
      await page.evaluate(([s, n]) => window.__mock.zoomTo(s, n), [s, n]); await page.waitForTimeout(3000);
      await page.screenshot({ path: `${out}/${name}-${s}-${n}.png` });
    }
    await page.keyboard.press('z'); await page.waitForTimeout(1500);
    const pc = await page.evaluate(() => window.__mock.paintcheck());
    r.paint = pc.paint.map((q) => `${q.terrain} ${q.worstDE}${q.pass ? '' : ' FAIL'}`).join(', ');
    r.farPairsUnder = pc.farPairsUnder.map((q) => q.pair + ' ' + [q.normal, q.protan, q.deutan, q.tritan].join('/'));
    const mins = { normal: 1e9, protan: 1e9, deutan: 1e9, tritan: 1e9 }, at = {};
    for (const q of pc.farPairs) for (const k of Object.keys(mins)) if (q[k] < mins[k]) { mins[k] = q[k]; at[k] = q.pair; }
    r.farClosest = Object.keys(mins).map((k) => `${k} ${mins[k]} (${at[k]})`).join('; ');
    const ck = await page.evaluate(() => window.__mock.checks());
    r.checks = { hitWrong: ck.hit.wrong + '/' + ck.hit.samples, labels: ck.labels.pct, overTokens: ck.labels.namesOverTokens, zones: ck.zones.stamps, stable: ck.stable.identical };
    const tc = await page.evaluate(() => window.__mock.trackcheck()); r.tracks = { peak: +tc.trackSummary.medianPeak.toFixed(2), avg: +tc.trackSummary.medianAvg.toFixed(2) };
    r.canopy = await page.evaluate(() => window.__mock.ev("(() => { const f = provList.filter((i) => terr[i] === 'forest'); const cov = (b) => f.map((i) => canopyFor(i, b).reduce((s, q) => s + Math.PI * q.r * q.r, 0) / areaOf[i]); const m = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3); return { midCov: m(cov('mid')), nearCov: m(cov('near')), midClumps: m(f.map((i) => canopyClumps(i, 'mid', canopyFor(i, 'mid')).length)) }; })()"));
    r.density = await page.evaluate(() => { const d = window.__mock.density(); return JSON.stringify({ midForest: d.bands.mid.forest, nearForest: d.bands.near.forest, nearPlains: d.bands.near.plains, bake: d.bake }); });
    r.errors = errors; res[name] = r; console.log(name, JSON.stringify(r));
    await page.close();
  }
  fs.writeFileSync(`${out}/preview2.json`, JSON.stringify(res, null, 1));
  await browser.close();
})();

// The mockup's own ?paintcheck (painted mean vs fill at Mid, and the Far full-decoration pairs) and __mock.checks-style hit/label
// numbers, run on the proposed fills (and the companion paint changes) set at runtime in this headless session only.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [file, palJson, compJson] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  const ev = (src) => page.evaluate((s) => window.__mock.ev(s), src);
  if (palJson !== 'none') await ev(`(() => { const P = ${palJson}; for (const t in P) TERRAIN[t].fill = P[t]; FILLMEMO.clear(); FACEMEMO.clear(); resetGeometryCaches(false); })()`);
  if (compJson) await ev(JSON.parse(compJson).src);
  const out = await page.evaluate(() => { const r = window.__mock.paintcheck(); return { paint: r.paint, farPairsUnder: r.farPairsUnder, worst: ['normal', 'protan', 'deutan', 'tritan'].map((k) => { const p = [...r.farPairs].sort((a, b) => a[k] - b[k])[0]; return `${k} ${p[k]} (${p.pair})`; }) }; });
  console.log(JSON.stringify(out, null, 1)); console.log('errors', JSON.stringify(errors));
  await browser.close();
})();

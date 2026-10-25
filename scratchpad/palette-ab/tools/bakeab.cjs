// node bakeab.cjs <html>: Near and Mid bake time per province, palettes alternated in one page (B P B P B P), to separate a real cost from load noise
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  const r = await page.evaluate(() => window.__mock.ev(`(() => { const out = { bright: { mid: [], near: [] }, painted: { mid: [], near: [] } };
    for (let round = 0; round < 3; round++) for (const pal of ['bright', 'painted']) { setPalette(pal);
      for (const band of ['mid', 'near']) { let tot = 0, n = 0; for (const i of provList) { if (fogOf(i) === 'unexplored') continue; const G = geo(i), bb = [G.bb[0] - 2, G.bb[1] - 30, G.bb[2] + 2, G.bb[3] + 8], t0 = performance.now(); bakeWorld(bb, spriteRes(band), (g) => drawProvinceDeco(g, i, band), true); tot += performance.now() - t0; n++; } out[pal][band].push(+(tot / n).toFixed(2)); } }
    setPalette('bright'); return JSON.stringify(out); })()`));
  console.log('mean ms per province bake, three alternating rounds:', r);
  await browser.close();
})();

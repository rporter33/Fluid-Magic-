const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [pal, q] of [['bright', ''], ['painted', '?palette=painted']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    await page.keyboard.press('Shift+Digit3'); await page.waitForTimeout(3000);
    console.log(pal, await page.evaluate(() => window.__mock.ev(`(() => { const c = document.getElementById('map'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, out = {};
      for (const nm of ['Thornbrook', 'Halebrook', 'Elmwick', 'Sundale', 'Morholt', 'Duskholt']) { const i = names.indexOf(nm), p = prov[i], G = geo(i), hs = hex2rgb(fillFor(p)), tf = hex2rgb(TERRAIN[p.terrain].fill); let n = 0, acc = [0, 0, 0], same = 0;
        for (let k = 0; k < 400; k++) { const x = G.bb[0] + ((k % 20) + 0.5) / 20 * (G.bb[2] - G.bb[0]), y = G.bb[1] + (Math.floor(k / 20) + 0.5) / 20 * (G.bb[3] - G.bb[1]); if (!inPoly(G.poly, x, y) || distToEdge(cells[i], x, y) < 15) continue; const [sx, sy] = toScreen(x, y), o = (Math.round(sy * dpr) * c.width + Math.round(sx * dpr)) * 4; const px = [d[o], d[o + 1], d[o + 2]]; n++; if (Math.abs(px[0] - hs[0]) + Math.abs(px[1] - hs[1]) + Math.abs(px[2] - hs[2]) <= 6) same++; for (let j = 0; j < 3; j++) acc[j] += px[j]; }
        const m = acc.map((v) => Math.round(v / n)); const a = [0, 1, 2].map((j) => (tf[j] - hs[j]) ? (m[j] - hs[j]) / (tf[j] - hs[j]) : 0); out[nm] = { heat: fillFor(p), fill: TERRAIN[p.terrain].fill, mean: m.join(','), shareAtHeat: +(same / n).toFixed(2), alphaEst: a.map((v) => +v.toFixed(2)).join('/') }; }
      return JSON.stringify(out); })()`)));
    await page.close();
  }
  await browser.close();
})();

// Renders the v3 mockup at the start zoom with the approved fills and with a proposed palette, by overriding the fills at
// runtime in this headless session only (no part file is edited). Writes full-view PNGs and the screen polygons of one
// representative province per terrain for the swatch sheet.
// Usage: D3_LOCAL=... node render.cjs <game-screen.html> <outDir> '<palette json>' [dpr] ['<companions json>']
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const [file, outDir, palJson, dprArg, compJson] = process.argv.slice(2);
  const PAL = JSON.parse(palJson), COMP = compJson ? JSON.parse(compJson) : null, dpr = Number(dprArg || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const ev = (src) => page.evaluate((s) => window.__mock.ev(s), src);
  const settle = async () => { for (let k = 0; k < 40; k++) { await page.waitForTimeout(250); const p = await ev('bakesPending'); if (!p) break; await ev('draw()'); } await page.waitForTimeout(400); };
  await settle();
  const info = await ev(`(() => { const r = canvas.getBoundingClientRect(), v = viewRect();
    return { scale: cam.s, band: bandOf(cam.s), hand: view.hand, view: v, provs: provList.map((i) => { const p = prov[i]; const poly = geo(i).poly.map(([x, y]) => { const [sx, sy] = toScreen(x, y); return [r.left + sx, r.top + sy]; });
      return { i, name: names[i], terrain: p.terrain, owner: p.owner ?? null, fog: fogOf(i), area: areaOf[i], poly }; }) }; })()`);
  fs.writeFileSync(outDir + '/provs.json', JSON.stringify(info));
  await page.screenshot({ path: outDir + '/start-approved.png' });
  // the proposed fills, and everything the page derives from them (mode bases, stamp faces, fill memo, bakes)
  await ev(`(() => { const P = ${JSON.stringify(PAL)}; for (const t in P) TERRAIN[t].fill = P[t];
    const liftTo = (f) => { let b = desat(f, 0.8), k = 0; while (rgb2lab(hex2rgb(b))[0] < 50 && k < 1) { k += 0.01; b = mix(desat(f, 0.8), '#E8DCC2', k); } return b; };
    for (const t in P) MODE_BASE[t] = liftTo(P[t]);
    FILLMEMO.clear(); FACEMEMO.clear(); resetGeometryCaches(false); })()`);
  await settle();
  await page.screenshot({ path: outDir + '/start-proposed.png' });
  if (COMP) { await ev(COMP.src); await settle(); await page.screenshot({ path: outDir + '/start-companions.png' }); }
  console.log(JSON.stringify({ scale: info.scale, band: info.band, hand: info.hand, errors }));
  await browser.close();
})();

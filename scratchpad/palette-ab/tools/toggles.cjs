// node toggles.cjs <html> <outDir>: every other control under Painted (no page errors; back to the same hash), Hand v2 + Painted shot,
// and owner art: a sample sheet taken on Bright, then Palette: Painted, against a fresh ?palette=painted page with the same sheet
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file, out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [], log = [];
  const open = async (q = '') => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (e) => errors.push(q + ' pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join('|')));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(q + ' console: ' + m.text()); });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); return page;
  };
  const scratch = (page) => page.evaluate(() => window.__mock.checks().stable.first);
  const set = async (page, k, v) => { await page.click(`#mockctl [data-ctl="${k}"] [data-v="${v}"]`); await page.mouse.move(700, 20); await page.waitForTimeout(1500); };
  let page = await open('?palette=painted');
  const h0 = await scratch(page);
  for (const [k, v, back] of [['hand', 'v2', 'painted'], ['labels', 'approved', 'ink'], ['borders', 'straight', 'wobble'], ['bandCap', 'v2', 'capped'], ['tracks', 'crossings', 'full'], ['detail', 'reduced', 'full'], ['table', 'simple', 'full']]) {
    await set(page, k, v); if (k === 'hand') await page.screenshot({ path: `${out}/painted-hand-v2.png` }); if (k === 'labels') await page.screenshot({ path: `${out}/painted-labels-approved.png` });
    log.push(`${k}=${v} ${await scratch(page)}`); await set(page, k, back);
  }
  const h1 = await scratch(page); log.push(`Painted after every toggle and back: ${h1} (start ${h0}) ${h0 === h1 ? 'same' : 'DIFFERENT'}`);
  const farmClick = await page.evaluate(() => { const b = document.querySelector('#mockctl [data-ctl="farm"] [data-v="deep"]'); b.click(); return window.__mock.ev('view.farm + " " + TERRAIN.farmland.fill'); });
  log.push(`Farmland #EDB141 clicked under Painted (disabled): ${farmClick}`);
  await page.close();
  // owner art
  page = await open('');
  log.push('art on Bright: ' + await page.evaluate(() => window.__mock.tryArt('broadleaf')));
  await page.waitForTimeout(1500);
  await set(page, 'palette', 'painted'); await page.waitForTimeout(1500);
  const a1 = await page.evaluate(() => window.__mock.ev(`(() => { const f = view.art.broadleaf.frames[0], g = f.getContext('2d'), d = g.getImageData(0, 0, f.width, f.height).data; const F = faces(TERRAIN.forest.fill); let n = 0, lit = 0; const L = hex2rgb(F.lit); for (let k = 0; k < d.length; k += 4) { if (!d[k + 3]) continue; n++; if (Math.abs(d[k] - L[0]) + Math.abs(d[k + 1] - L[1]) + Math.abs(d[k + 2] - L[2]) < 4) lit++; } return 'frames ' + view.art.broadleaf.frames.length + ', painted lit face ' + F.lit + ' on ' + lit + ' of ' + n + ' px'; })()`));
  log.push('after Palette: Painted, ' + a1);
  const hs = await scratch(page); await page.close();
  page = await open('?palette=painted');
  await page.evaluate(() => window.__mock.tryArt('broadleaf')); await page.waitForTimeout(1500);
  const hf = await scratch(page); log.push(`art then switch ${hs} vs fresh painted then art ${hf}: ${hs === hf ? 'same' : 'DIFFERENT'}`);
  await page.evaluate(() => window.__mock.zoomTo(0.85, 'Redwick')); await page.waitForTimeout(3000); await page.screenshot({ path: `${out}/painted-tryart.png` });
  await page.close();
  console.log(log.join('\n')); console.log('ERRORS ' + JSON.stringify(errors));
  await browser.close();
})();

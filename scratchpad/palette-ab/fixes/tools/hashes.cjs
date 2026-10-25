// node hashes.cjs <html> <bright|painted> <out.json>: canvas hashes (shown, and a from-scratch redraw) at nine views, for "Bright is unchanged"
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [file, pal, outFile] = process.argv.slice(2);
const q = pal === 'painted' ? '?palette=painted' : '';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join('|')));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  const shown = () => page.evaluate(() => { const c = document.getElementById('map'), cp = document.createElement('canvas'); cp.width = c.width; cp.height = c.height; const g = cp.getContext('2d', { willReadFrequently: true }); g.drawImage(c, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; });
  const fresh = () => page.evaluate(() => window.__mock.checks().stable.first);
  const views = [['start', null], ['mid-ashfen', [0.75, 'Ashfen']], ['s0.957-elmwick', [0.957, 'Elmwick']], ['s1.4-stagmoor', [1.4, 'Stagmoor']], ['s2.04-redbarrow', [2.04, 'Redbarrow']], ['s2.04-brambarrow', [2.04, 'Brambarrow']], ['near-kharnath', ['near', 'Kharnath']], ['near-rookmere', ['near', 'Rookmere']], ['far', [0.3, 'Stagmoor']]];
  const out = {};
  for (const [n, v] of views) {
    if (v) await page.evaluate(([s, nm]) => window.__mock.zoomTo(s === 'near' ? window.__mock.maxScale() * 0.85 : s, nm), v); else await page.keyboard.press('z');
    await page.mouse.move(700, 20); await page.waitForTimeout(v && v[0] === 'near' ? 4500 : 3000);
    out[n] = { shown: await shown(), fresh: await fresh() };
  }
  fs.writeFileSync(outFile, JSON.stringify({ palette: pal, views: out, errors }, null, 1));
  console.log(pal, Object.entries(out).map(([n, h]) => `${n} ${h.shown}/${h.fresh}`).join('  '), '| errors', errors.length);
  await browser.close();
})();

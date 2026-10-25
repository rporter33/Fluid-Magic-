// node ident.cjs <html>: a redraw after switching the Palette is identical to a fresh load with ?palette=painted (and back), at four views
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  const open = async (q = '') => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (e) => errors.push(q + ' pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join('|')));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(q + ' console: ' + m.text()); });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); return page;
  };
  const shown = (page) => page.evaluate(() => { const c = document.getElementById('map'), cp = document.createElement('canvas'); cp.width = c.width; cp.height = c.height; const g = cp.getContext('2d', { willReadFrequently: true }); g.drawImage(c, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; });
  const fresh = (page) => page.evaluate(() => window.__mock.checks().stable.first);
  const views = [['start', null], ['mid-ashfen', [0.75, 'Ashfen']], ['near-kharnath', ['near', 'Kharnath']], ['far', [0.3, 'Stagmoor']]];
  const go = async (page, v) => { if (v) await page.evaluate(([s, n]) => window.__mock.zoomTo(s === 'near' ? window.__mock.maxScale() * 0.85 : s, n), v); else { await page.keyboard.press('z'); } await page.mouse.move(700, 20); await page.waitForTimeout(v && v[0] === 'near' ? 4000 : 2500); };
  const clickCtl = async (page, k, v) => { await page.click(`#mockctl [data-ctl="${k}"] [data-v="${v}"]`); await page.mouse.move(700, 20); await page.waitForTimeout(2500); };
  const run = async (label, q, steps) => { const page = await open(q); for (const [k, v] of steps) await clickCtl(page, k, v); const out = {}; for (const [n, v] of views) { await go(page, v); out[n] = { shown: await shown(page), fresh: await fresh(page) }; } await page.close(); return [label, out]; };
  const res = Object.fromEntries([
    await run('fresh ?palette=painted', '?palette=painted', []),
    await run('Bright -> Painted', '', [['palette', 'painted']]),
    await run('Farmland #EDB141 -> Painted', '', [['farm', 'deep'], ['palette', 'painted']]),
    await run('fresh Bright', '', []),
    await run('?palette=painted -> Bright', '?palette=painted', [['palette', 'bright']]),
    await run('Painted -> Bright -> Painted -> Bright', '', [['palette', 'painted'], ['palette', 'bright'], ['palette', 'painted'], ['palette', 'bright']]),
    await run('fresh Farmland #EDB141', '', [['farm', 'deep']]),
    await run('#EDB141 -> Painted -> Bright', '', [['farm', 'deep'], ['palette', 'painted'], ['palette', 'bright']]),
  ]);
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(42), Object.entries(v).map(([n, h]) => `${n} ${h.shown}/${h.fresh}`).join('  '));
  const same = (a, b) => Object.keys(res[a]).every((n) => res[a][n].shown === res[b][n].shown && res[a][n].fresh === res[b][n].fresh);
  console.log('switch == fresh painted:', same('Bright -> Painted', 'fresh ?palette=painted'), '| from #EDB141:', same('Farmland #EDB141 -> Painted', 'fresh ?palette=painted'));
  console.log('back == fresh bright:', same('?palette=painted -> Bright', 'fresh Bright'), '| round trip:', same('Painted -> Bright -> Painted -> Bright', 'fresh Bright'), '| #EDB141 kept:', same('#EDB141 -> Painted -> Bright', 'fresh Farmland #EDB141'));
  console.log('ERRORS ' + JSON.stringify(errors));
  await browser.close();
})();

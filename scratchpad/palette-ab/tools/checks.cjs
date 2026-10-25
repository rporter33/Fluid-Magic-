// node checks.cjs <html> <bright|painted> <out.txt>: every page check in one palette (fresh pages at the start zoom)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [file, pal, outFile] = process.argv.slice(2);
const q = pal === 'painted' ? '?palette=painted' : '';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  const open = async (extra = '') => {
    const query = q + (extra ? (q ? '&' : '?') + extra : '');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (e) => errors.push(query + ' pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join('|')));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(query + ' console: ' + m.text()); });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + query, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); return page;
  };
  const J = (x) => JSON.stringify(x, null, 1);
  let page = await open();
  const pv = await page.evaluate(() => window.__mock.ev(`({ palette: view.palette, fills: Object.fromEntries(Object.entries(TERRAIN).map(([t, d]) => [t, d.fill])), modeBase: { ...MODE_BASE }, farmDisabled: [...document.querySelectorAll('#mockctl [data-ctl="farm"] button')].every((b) => b.disabled) })`));
  const pc = await page.evaluate(() => window.__mock.paintcheck());
  const tc = await page.evaluate(() => window.__mock.trackcheck());
  const ck = await page.evaluate(() => window.__mock.checks());
  const ft = await page.evaluate(() => window.__mock.feats());
  await page.close();
  page = await open();
  const dn = await page.evaluate(() => window.__mock.density());
  await page.close();
  page = await open('silhouettes'); await page.waitForTimeout(1500);
  const sil = await page.evaluate(() => document.querySelector('.silsheet header')?.textContent); await page.close();
  const lines = [
    `Palette: ${pv.palette}. Fills ${JSON.stringify(pv.fills)}. Data-mode bases ${JSON.stringify(pv.modeBase)}. Farmland control disabled: ${pv.farmDisabled}.`, '',
    'Paint check (?paintcheck): each province baked at Mid with stamps, water and settlements off; painted mean against its terrain fill in the active palette (CIEDE2000, budget 2.0).', J(pc.paint), '',
    'At Far with the full decoration: terrain pairs between the provinces\' full means (normal, Protan, Deutan, Tritan); pairs under 20 / 12:', JSON.stringify(pc.farPairsUnder), J(pc.farPairs), '',
    'Track check at the start zoom (Mountains track halves; median of dot-peak and line-average WCAG ratios), with the R34 footpath on the same ground:', J({ tracks: tc.trackSummary, footpath: tc.footpathSummary, scale: tc.scale }), '',
    'Checks: hit tests near wobbling borders, the label test at the start zoom, the zones, a redraw from scratch:', J(ck), '',
    'Density (§5.4; bake times are noisy: the machine is shared with a test job):', J(dn), '',
    'Silhouettes:', sil, '', 'Features:', J(ft), '', 'Page errors: ' + JSON.stringify(errors),
  ];
  fs.writeFileSync(outFile, lines.join('\n'));
  console.log(pal, 'paint worst', pc.paint.map((r) => r.terrain + ' ' + r.worstDE).join(', '), '| farUnder', pc.farPairsUnder.length, '| hit', ck.hit.wrong + '/' + ck.hit.samples, '| labels', ck.labels.pct + '%', 'overTokens', ck.labels.namesOverTokens, '| stable', ck.stable.identical, ck.stable.first, '| zones', JSON.stringify(ck.zones.stamps), '| sil', (sil || '').slice(0, 200), '| errors', errors.length);
  await browser.close();
})();

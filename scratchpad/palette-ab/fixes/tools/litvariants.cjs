// node litvariants.cjs <html> <out.json>: under Painted, the Forest crown lit lift at runtime (+22 as built, +17, +12 = coverage alone) and
// the full-decoration terrain pairs at Mid and Near that involve Forest (the report midpairs.cjs makes); no part file is touched
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [file, outFile] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file + '?palette=painted', { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  const res = {};
  for (const lift of [22, 17, 12]) {
    res['lit+' + lift] = await page.evaluate((lift) => window.__mock.ev(`(() => { forestLit22 = (f) => mix(shadeL(f, ${lift}), '#F6D9A0', 0.12); FACEMEMO.clear(); const out = {};
      for (const band of ['mid', 'near']) {
        const means = {}; for (const i of provList) { if (fogOf(i) === 'unexplored') continue; (means[terr[i]] ??= []).push(meanRgbIn(i, band, {})); }
        const tm = Object.fromEntries(Object.entries(means).map(([t, a]) => [t, [0, 1, 2].map((c) => l2s(a.reduce((s, q) => s + s2l(q[c]), 0) / a.length))]));
        const row = (x, y) => { const A = tm[x], B = tm[y], r = { normal: +dE2000(rgb2lab(A), rgb2lab(B)).toFixed(1) }; for (const [k, m] of Object.entries(CVD)) r[k] = +dE2000(rgb2lab(cvdRgb(A, m)), rgb2lab(cvdRgb(B, m))).toFixed(1); return [r.normal, r.protan, r.deutan, r.tritan].join(' / '); };
        out[band] = { 'forest/hills': row('forest', 'hills'), 'forest/swamp': row('forest', 'swamp'), forestMean: rgb2hex(tm.forest), lit: forestLit22(TERRAIN.forest.fill) };
      }
      return out; })()`), lift);
    console.log('lit +' + lift, JSON.stringify(res['lit+' + lift]));
  }
  fs.writeFileSync(outFile, JSON.stringify({ res, errors }, null, 1)); console.log('ERRORS ' + JSON.stringify(errors));
  await browser.close();
})();

// node midpairs.cjs <before.html> <after.html> <out.json>: the paint check's Far full-decoration pair report (p86 paintCheck part 2), run at
// Mid and Near too, for both palettes before and after the fixes: terrain pairs between the provinces' full means (normal and under each
// deficiency, the page's own dE2000 and CVD matrices). A report, as at Far; docs/09's 20 / 12 is a rule on the fills.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [before, after, outFile] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const res = {}, errors = [];
  for (const [tag, file] of [['before', before], ['after', after]]) for (const [pal, q] of [['bright', ''], ['painted', '?palette=painted']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (e) => errors.push(`${tag} ${pal}: ` + e.message));
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    res[`${tag}-${pal}`] = await page.evaluate(() => window.__mock.ev(`(() => { const out = {};
      for (const band of ['far', 'mid', 'near']) {
        const means = {}; for (const i of provList) { if (fogOf(i) === 'unexplored') continue; (means[terr[i]] ??= []).push(meanRgbIn(i, band, {})); }
        const tm = Object.fromEntries(Object.entries(means).map(([t, a]) => [t, [0, 1, 2].map((c) => l2s(a.reduce((s, q) => s + s2l(q[c]), 0) / a.length))]));
        const pairs = [], ts = Object.keys(tm);
        for (let a = 0; a < ts.length; a++) for (let b = a + 1; b < ts.length; b++) { const A = tm[ts[a]], B2 = tm[ts[b]], row = { pair: ts[a] + '/' + ts[b], normal: +dE2000(rgb2lab(A), rgb2lab(B2)).toFixed(1) };
          for (const [k, m] of Object.entries(CVD)) row[k] = +dE2000(rgb2lab(cvdRgb(A, m)), rgb2lab(cvdRgb(B2, m))).toFixed(1); pairs.push(row); }
        const mins = {}; for (const k of ['normal', 'protan', 'deutan', 'tritan']) { const r = pairs.reduce((x, y) => (y[k] < x[k] ? y : x)); mins[k] = r[k] + ' (' + r.pair + ')'; }
        const fh = pairs.find((r) => r.pair === 'forest/hills' || r.pair === 'hills/forest');
        out[band] = { closest: mins, under: pairs.filter((r) => r.normal < 20 || r.protan < 12 || r.deutan < 12 || r.tritan < 12).map((r) => r.pair + ' ' + [r.normal, r.protan, r.deutan, r.tritan].join('/')), forestHills: fh, means: Object.fromEntries(Object.entries(tm).map(([t, c]) => [t, rgb2hex(c)])) };
      }
      return out; })()`));
    console.log(tag, pal, JSON.stringify(Object.fromEntries(Object.entries(res[`${tag}-${pal}`]).map(([b, v]) => [b, { closest: v.closest, under: v.under, forestHills: v.forestHills }]))));
    await page.close();
  }
  fs.writeFileSync(outFile, JSON.stringify({ res, errors }, null, 1)); console.log('ERRORS ' + JSON.stringify(errors));
  await browser.close();
})();

// Judge 2: place-name widths at the start zoom, v2 (Alegreya Sans, labelFs) vs the spec (Alegreya 13/14 px, 3.5 px halo).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const F = process.env.FONTS, HTML = process.argv[2];
const css = `@font-face{font-family:'Alegreya';font-weight:400 900;src:url(https://fonts.gstatic.com/x/alegreya.woff2) format('woff2')}
@font-face{font-family:'Alegreya Sans';font-weight:500;src:url(https://fonts.gstatic.com/x/alegreyasans500.woff2) format('woff2')}
@font-face{font-family:'Alegreya Sans';font-weight:600;src:url(https://fonts.gstatic.com/x/alegreyasans500.woff2) format('woff2')}`;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ body: css, contentType: 'text/css' }));
  await page.route(/fonts\.gstatic\.com\/x\//, (r) => r.fulfill({ path: F + '/' + r.request().url().split('/').pop(), contentType: 'font/woff2' }));
  await page.goto('file://' + HTML, { waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
  const out = await page.evaluate(async () => {
    await document.fonts.load("500 13px 'Alegreya'"); await document.fonts.load("700 14px 'Alegreya'"); await document.fonts.load("500 10px 'Alegreya Sans'");
    const ok = document.fonts.check("500 13px 'Alegreya'") && document.fonts.check("500 10px 'Alegreya Sans'");
    const c = document.createElement('canvas').getContext('2d'); const W = (t, f) => { c.font = f; return c.measureText(t).width; };
    const { cam, provs, cells, cent, MED_DIAM, labelFs, nameFont, bandOf } = window.__j2; const s = cam.s, med = MED_DIAM * s, fsV2 = labelFs(s);
    const span = (i) => { // horizontal extent of the cell through the label's y (the centroid)
      const poly = cells[i], y = cent[i][1]; const xs = [];
      for (let k = 0; k < poly.length - 1; k++) { const [ax, ay] = poly[k], [bx, by] = poly[k + 1]; if ((ay - y) * (by - y) <= 0 && ay !== by) xs.push(ax + (y - ay) / (by - ay) * (bx - ax)); }
      return xs.length >= 2 ? (Math.max(...xs) - Math.min(...xs)) * s : 0; };
    const rows = provs.map((p) => { const v2 = W(p.name, nameFont(p, fsV2)) + 6; const fsN = Math.max(11, Math.min(13, 11 + 2 * (med - 70) / 110)); const nw = W(p.name, `${p.cap ? 700 : 500} ${p.cap ? fsN + 1 : fsN}px 'Alegreya', Georgia, serif`) + 3; return { n: p.name, v2, nw, sp: span(p.i) }; });
    const over = (k, m) => rows.filter((r) => r[k] > r.sp * m).length;
    const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
    return { fontsOk: ok, provinces: rows.length, camS: s, medianProvincePx: med, band: bandOf(s), v2FontPx: fsV2, specFontPx: Math.max(11, Math.min(13, 11 + 2 * (med - 70) / 110)),
      meanWidthV2: mean('v2'), meanWidthSpec: mean('nw'), ratio: mean('nw') / mean('v2'), meanSpan: mean('sp'),
      widerThan80pctOfSpan: { v2: over('v2', 0.8), spec: over('nw', 0.8) }, widerThanSpan: { v2: over('v2', 1), spec: over('nw', 1) },
      widest: rows.sort((a, b) => b.nw - a.nw).slice(0, 4).map((r) => `${r.n} ${r.nw.toFixed(0)} px (v2 ${r.v2.toFixed(0)}) in ${r.sp.toFixed(0)} px`) };
  });
  console.log(JSON.stringify(out, (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v), 1));
  await browser.close();
})();

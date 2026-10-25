// The start view at each window size: as built (the fit) and with the design's rule (at least 96 px a province, centred on the capital, clamped)
const { launch, open, PAGE } = require('./natpage.cjs');
const OUT = __dirname + '/../proto/renders/';
(async () => {
  const b = await launch(), errors = [], rows = [];
  for (const [w, h] of [[1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080], [390, 844]]) {
    const p = await open(b, PAGE, w, h, '', errors, { settle: 1500 });
    const asBuilt = await p.evaluate(() => window.__mock.ev(`({ s: cam.s, fit: fitScale, Dpx: MED_DIAM * cam.s, band: bandOf(cam.s), cw, ch })`));
    const rule = await p.evaluate(() => window.__mock.ev(`(() => {
      const s0 = Math.max(fitScale, 96 / MED_DIAM), v = viewRect(), hw = (v.r - v.l) / 2 / s0, hh = (v.b - v.t) / 2 / s0, [kx, ky] = cent[redCap], B = MODEL_BOX;
      const cl = (c, a, b, h) => (b - a <= 2 * h ? (a + b) / 2 : Math.max(a + h, Math.min(b - h, c))); window.__mock.setScale(s0, cl(kx, B[0], B[2], hw), cl(ky, B[1], B[3], hh)); const cx = kx, cy = ky;
      const [sx, sy] = toScreen(cx, cy), [m0x, m0y] = toScreen(0, 0), [m1x, m1y] = toScreen(W, H), r = canvas.getBoundingClientRect();
      const vis = (Math.max(0, Math.min(cw, m1x) - Math.max(0, m0x)) * Math.max(0, Math.min(ch, m1y) - Math.max(0, m0y))) / (cw * ch);
      const inView = provList.filter((i) => { const [x, y] = toScreen(...cent[i]); return x > 0 && y > 0 && x < cw && y < ch; }).length;
      return { s: cam.s, Dpx: MED_DIAM * cam.s, band: bandOf(cam.s), capital: [Math.round(sx), Math.round(sy)], capitalOnScreen: sx > 40 && sy > 40 && sx < cw - 40 && sy < ch - 40, modelShareOfView: +vis.toFixed(2), provincesInView: inView };
    })()`));
    await p.screenshot({ path: `${OUT}startrule-${w}x${h}.png` });
    rows.push({ size: `${w}x${h}`, asBuilt: { Dpx: +asBuilt.Dpx.toFixed(1), band: asBuilt.band }, rule: { ...rule, Dpx: +rule.Dpx.toFixed(1) } });
    await p.context().close();
  }
  console.log(JSON.stringify(rows, null, 1));
  require('fs').writeFileSync(OUT + 'startzoom.json', JSON.stringify(rows, null, 1));
  console.log('errors', JSON.stringify(errors.filter((x) => !/software WebGL|willReadFrequently/.test(x))));
  await b.close();
})();

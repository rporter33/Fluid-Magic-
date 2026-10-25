// fix 3, the relief floor's premise: §4.3 states the floor at 0.4 of the swing because half a province's pixels lie inside it. Measured on the bake:
// per terrain, over pure-core texels, the share of the lightness change (relief + detail + shadow + valley, after the mean removal) as a fraction of
// its side of the range (-A below, +0.6 A above); p50 is the k inside which half the pixels lie; also the share beyond 1 (outside the stated extremes)
const { launch, open } = require('../tools/lib.cjs');
(async () => {
  const b = await launch(), errors = [];
  for (const file of process.argv.slice(2)) {
    const page = await open(b, file, 1440, 900, '', errors);
    const r = await page.evaluate(() => window.__mock.ev(`(() => { const { BW, BH, LT, DL, pure } = RB, by = {}; for (let k = 0; k < BW * BH; k += 3) { if (!pure[k]) continue; const t = RL_T[LT[k]], A = RL_CAP[t], v = DL[k], f = v < 0 ? -v / A : v / (0.6 * A); (by[t] ??= []).push(f); }
      const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))]; return Object.fromEntries(Object.entries(by).map(([t, a]) => { a.sort((x, y) => x - y); return [t, { p50: +q(a, 0.5).toFixed(2), p75: +q(a, 0.75).toFixed(2), p90: +q(a, 0.9).toFixed(2), beyond1: +(a.filter((x) => x > 1).length / a.length).toFixed(3) }]; })); })()`));
    console.log(file.split('/').pop(), JSON.stringify(r)); await page.close();
  }
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

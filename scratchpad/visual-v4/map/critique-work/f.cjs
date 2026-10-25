// critique pass F: what the bake's lightness is made of, per terrain (relief vs cast shadow vs valley vs detail)
const { launch, open } = require('../tools/lib.cjs');
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const r = await page.evaluate(() => window.__mock.ev(`(() => {
    const o = RB, HW = o.HW, HH = o.HH, BW = o.BW, BH = o.BH, q = (a, p) => { if (!a.length) return null; const s = Float64Array.from(a).sort(); return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2); };
    const res = {};
    for (let t = 0; t < 9; t++) {
      const rel = [], cast = [], val = [], dl = [], slope = [];
      for (let k = 0; k < HW * HH; k += 3) { if (o.hLT[k] !== t || o.hid[k] === 255) continue; if (t < 7) { rel.push(RL_CAP[RL_T[t]] * o.fS[k]); cast.push(RL_P.castL * o.shd[k]); val.push(RL_P.valleyL * o.ao[k]); } slope.push(o.sS[k]); }
      if (t < 7) for (let k = 0; k < BW * BH; k += 7) if (o.LT[k] === t) dl.push(o.DL[k]);
      const sd = (a) => { if (!a.length) return null; let m = 0; for (const v of a) m += v; m /= a.length; let s = 0; for (const v of a) s += (v - m) ** 2; return +Math.sqrt(s / a.length).toFixed(2); };
      const absRel = rel.map(Math.abs);
      res[t < 7 ? RL_T[t] : t === 7 ? 'peaks' : 'mere'] = t < 7 ? { n: rel.length, relief_p5: q(rel, 0.05), relief_p95: q(rel, 0.95), relief_absMedian: q(absRel, 0.5), share_relief_over_1L: +(absRel.filter((v) => v > 1).length / absRel.length).toFixed(3), cast_p95: q(cast, 0.95), cast_share_over_0_5: +(cast.filter((v) => v > 0.5).length / cast.length).toFixed(3), valley_p95: q(val, 0.95), DL_p5: q(dl, 0.05), DL_p95: q(dl, 0.95), DL_sd: sd(dl), shade_s_p5: q(slope, 0.05), shade_s_p95: q(slope, 0.95) } : { shade_s_p5: q(slope, 0.05), shade_s_p95: q(slope, 0.95) };
    }
    return res; })()`));
  console.log(JSON.stringify(r, null, 1));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

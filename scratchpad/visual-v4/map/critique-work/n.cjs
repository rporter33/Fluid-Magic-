// critique pass N: simulate a per-terrain shade gain on the live bake's shade (s), core p90 |relief| vs cap, and the lightness sd with the detail rebalanced
const { launch, open } = require('../tools/lib.cjs');
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const r = await page.evaluate(() => window.__mock.ev(`(() => {
    const o = RB, q = (a, p) => { const s = Float64Array.from(a).sort(); return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2); };
    const sd = (a) => { let m = 0; for (const v of a) m += v; m /= a.length; let s = 0; for (const v of a) s += (v - m) ** 2; return +Math.sqrt(s / a.length).toFixed(2); };
    const res = {};
    for (const [tn, gains] of Object.entries({ plains: [1, 2, 2.6, 3], farmland: [1, 3, 3.6, 4.5], swamp: [1, 2.2, 2.8], forest: [1, 1.4, 1.8], wasteland: [1, 1.2] })) {
      const t = RL_TI[tn], cap = RL_CAP[tn], sv = [], dl = [];
      for (let k = 0; k < o.BW * o.BH; k += 5) { if (!o.pure[k] || o.LT[k] !== t) continue; const hx = ((k % o.BW) + 0.5) / 2, hy = (Math.floor(k / o.BW) + 0.5) / 2; sv.push(rlBilin(o.sS, o.HW, o.HH, hx, hy)); dl.push(o.DL[k] - cap * rlBilin(o.fS, o.HW, o.HH, hx, hy)); }
      res[tn] = { cap, detailOnlySd: sd(dl), totalSdNow: null, gains: {} };
      for (const g of gains) { const rel = sv.map((s) => { let v = rlTanh(3.2 * g * (s - RL_SIN_EL)); v = v < -1 ? -1 : v > RL_P.litCap ? RL_P.litCap : v; return cap * v; });
        res[tn].gains[g] = { coreP90abs: q(rel.map(Math.abs), 0.9), relSd: sd(rel), sdWithDetail: sd(rel.map((v, k) => v + dl[k])), sdWithDetailHalved: sd(rel.map((v, k) => v + 0.55 * dl[k])) }; }
    }
    return res; })()`));
  console.log(JSON.stringify(r, null, 1));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

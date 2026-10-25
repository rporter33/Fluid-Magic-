const { launch, open, PAGE } = require('./nlib.cjs');
(async () => {
  const b = await launch(), errors = []; const p = await open(b, PAGE, { errors, settle: 300, q: '?terrain=clear' });
  const r = await p.evaluate(() => window.__mock.ev(`(() => { const L = RB.L.clear, d = L.img.data, d0 = null, LT = RB.LT, BW = RB.BW, out = [], cnt = {};
    for (let k = 0; k < LT.length; k++) { if (LT[k] >= 7) continue; const rgb = [d[k*4], d[k*4+1], d[k*4+2]]; if (d[k*4+3] < 255) continue; const lab = rgb2lab(rgb); if (lab[0] < 66) continue; const e = rlPairDE(rgb, hex2rgb(RL_C.snow)); if (e.normal < 20 || e.cvd < 12) { const t = RL_T[LT[k]]; cnt[t] = (cnt[t] ?? 0) + 1; let wildN = 0; for (const o of [-2, 2, -2*BW, 2*BW]) if (LT[k+o] >= 7) wildN++; cnt[t + (wildN ? ':nearWild' : '')] = (cnt[t + (wildN ? ':nearWild' : '')] ?? 0) + 1; if (out.length < 12) out.push([t, rgb2hex(rgb), lab.map(v => +v.toFixed(1)), +e.normal.toFixed(1), +e.cvd.toFixed(1), wildN]); } }
    return { cnt, out }; })()`));
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();

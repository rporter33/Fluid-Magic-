const { launch, open, PAGE } = require('./nlib.cjs');
(async () => {
  const b = await launch(), errors = []; const p = await open(b, PAGE, { errors, settle: 300 });
  const r = await p.evaluate(() => window.__mock.ev(`(() => { const res = {}; for (const [tag, lo] of [['litOnly', false], ['both', true]]) { RL_DBG.clampLow = lo; const o = {}; for (const _ of rlSharedGen(o)) void _; for (const _ of rlClearGen(o)) void _;
    const d = o.L.clear.img.data, LT = o.LT, sn = rgb2lab(hex2rgb(RL_C.snow)), memo = new Map(); let near = 0, n = 0, maxL = 0;
    for (let k = 0; k < LT.length; k += 2) { if (LT[k] !== 4) continue; n++; const key = (d[k*4] << 16) | (d[k*4+1] << 8) | d[k*4+2]; let v = memo.get(key); if (!v) { const rgb = [d[k*4], d[k*4+1], d[k*4+2]], e = rlPairDE(rgb, hex2rgb(RL_C.snow)); v = [e.normal < 20 || e.cvd < 12 ? 1 : 0, rgb2lab(rgb)[0]]; memo.set(key, v); } near += v[0]; maxL = Math.max(maxL, v[1]); }
    res[tag] = { clampLow: o.clampN[0], clampHigh: o.clampN[1], clampAfter: o.clampN[2], texels: LT.length, mountainTexels: n, mountainNearSnow2012: near, maxMountainL: +maxL.toFixed(1) }; } RL_DBG.clampLow = false; return res; })()`));
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();

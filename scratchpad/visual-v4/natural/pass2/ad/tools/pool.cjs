const { launch, open, ev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 800 });
  const code = `(() => { const { LT, BW, BH, TX } = RB, Tp = rlNatT('pool'); let n = 0, p50 = 0, pAny = 0, shrub = 0; const Tsc = rlNatT('scrub');
    for (let ty = 0; ty < BH; ty += 3) for (let tx = 0; tx < BW; tx += 3) { const k = ty * BW + tx; if (LT[k] !== 5) continue; const u = (tx + 0.5) / TX / RLK, v = (ty + 0.5) / TX / RLK; const f = rlFbm(Tp, u / 9, v / 9, 3); const pool = Math.max(0, Math.min(1, (f - 0.40) / 0.08)); n++; if (pool >= 0.5) p50++; if (pool > 0) pAny++; if ((1 - pool) * 0.6 * rlRamp(rlVN(Tsc, u / 1.3 + 3, v / 1.3), 0.66, 0.84) > 0.3) shrub++; }
    return { swampTexels: n, poolHalfShare: +(p50 / n).toFixed(3), poolAnyShare: +(pAny / n).toFixed(3), shrubShare: +(shrub / n).toFixed(3) }; })()`;
  console.log(JSON.stringify(await ev(p, `m.ev(${JSON.stringify(code)})`))); await b.close();
})();

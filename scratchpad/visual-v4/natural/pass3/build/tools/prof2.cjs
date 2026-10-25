// the wild steps' times in isolation, best of N runs in one page: node prof2.cjs [N] [page]
const { launch, open, mev, PAGE, BEFORE } = require('./lib.cjs');
(async () => { const N = Number(process.argv[2] || 3), base = process.argv[3] === 'base', b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, base ? BEFORE : PAGE, { log, settle: 500 });
  const r = await mev(p, `(() => { const best = {}, put = (k, v) => { best[k] = Math.min(best[k] ?? 1e9, +v.toFixed(1)); };
    for (let n = 0; n < ${N}; n++) { let t = performance.now();
      if (${base}) { for (const _ of rlNatWildGen(RB)); put('gen', performance.now() - t); t = performance.now(); const d8 = RB.L.natural.img.data.slice(), cap = RB.nwCap.cap; RB.nwTL = rlNatWildApron(RB, d8, cap); for (let ty = 0, k = 0; ty < RB.BH; ty++) for (let tx = 0; tx < RB.BW; tx++, k++) { const lt = RB.LT[k]; if (lt === 7 || lt === 8) rlNatWildTexel(RB, lt, tx, ty, d8, k * 4, cap); } put('colour', performance.now() - t); }
      else { for (const _ of rlMsGen(RB)); put('gen', performance.now() - t); for (const [k, v] of Object.entries(RB.msT)) put(k, v); t = performance.now(); for (const _ of rlMsColour(RB, RB.nwCap.cap)); put('colour', performance.now() - t); } }
    best.total = +(best.gen + best.colour).toFixed(1); best.bakeNatural = RB.L.natural.t; best.cpu = RB.L.natural.cpu; return best; })()`);
  console.log(base ? 'base' : 'proto', JSON.stringify(r)); await b.close(); })();

const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, settle: 1000, q: '?keepms' });
  const r = await mev(p, `(() => { const out = {}; for (const B of RB.ms.boxes) { const ins = [], sp = [], FT = RB.TX * RL_MS.F; for (let q = 0; q < B.nw * B.nh; q += 7) { const wd = B.wd[q]; if (wd > 0.008 * RLD && wd < 0.012 * RLD) { ins.push((wd - B.tp[q]) / RLD); if (B.s01) sp.push(B.s01[q]); } } ins.sort((a, b) => a - b); sp.sort((a, b) => a - b); const pc = (a, f) => a.length ? +a[Math.floor(f * (a.length - 1))].toFixed(4) : null; out[B.w.name] = { n: ins.length, ins: [0.1, 0.25, 0.5, 0.75, 0.9].map((f) => pc(ins, f)), sp: [0.1, 0.5, 0.9].map((f) => pc(sp, f)) }; } return out; })()`);
  console.log(JSON.stringify(r, null, 1)); console.log('pageErrors', log.pageErrors.length, log.pageErrors.slice(0, 2)); await b.close();
})();

// Clear is v4's bake: the new Clear pass without the snow clamp must equal the v4 bake texel for texel; with the clamp, how many texels change
const { launch, open, PAGE, BEFORE, realErrors } = require('./nlib.cjs');
const H = `((d) => { let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; })`;
(async () => {
  const b = await launch(), errors = [];
  let p = await open(b, BEFORE, { errors, settle: 500 });
  const before = await p.evaluate((H) => window.__mock.ev(`(${H})(RB.img.data)`), H); await p.context().close();
  p = await open(b, PAGE, { errors, settle: 500 });
  const after = await p.evaluate((H) => window.__mock.ev(`(() => { const hf = ${H}; RL_DBG.noSnowClamp = true; const o = {}; for (const _ of rlSharedGen(o)) void _; for (const _ of rlClearGen(o)) void _; RL_DBG.noSnowClamp = false;
    const o2 = {}; for (const _ of rlSharedGen(o2)) void _; for (const _ of rlClearGen(o2)) void _; const a = o.L.clear.img.data, c = o2.L.clear.img.data; let diff = 0, maxd = 0; for (let k = 0; k < a.length; k += 4) { const d = Math.abs(a[k] - c[k]) + Math.abs(a[k + 1] - c[k + 1]) + Math.abs(a[k + 2] - c[k + 2]); if (d) { diff++; maxd = Math.max(maxd, d); } }
    return { noClamp: hf(a), clamped: hf(c), texelsChangedByClamp: diff, share: +(diff / (a.length / 4)).toFixed(4), maxSumDiff: maxd }; })()`), H);
  console.log(JSON.stringify({ v4bake: before, ...after, identicalWithoutClamp: before === after.noClamp }, null, 1));
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

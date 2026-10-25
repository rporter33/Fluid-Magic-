// AD fix 4 leaves cls (the rule-bearing cover raster, N4) unchanged: the before page's covers against the new page's with the field geometry of v4 (bend 1.6, depth 2.5 over 9)
const { launch, open, PAGE } = require('./nlib2.cjs');
const BEFORE = __dirname + '/../game-screen-v4.before-ad.html';
const src = `(() => { const o = {}, lap = () => 0; for (const _ of rlSharedGen(o)) void _; for (const _ of rlNatCoverGen(o, lap)) void _; let h = 0x811c9dc5; const c = o.nat.cls; for (let k = 0; k < c.length; k++) { h ^= c[k]; h = Math.imul(h, 0x01000193); } const n = {}; for (let k = 0; k < c.length; k++) n[c[k]] = (n[c[k]] || 0) + 1; return { hash: h >>> 0, counts: n }; })()`;
(async () => {
  const b = await launch(); const out = {};
  for (const [tag, file, pre] of [['before', BEFORE, ''], ['after-v4fields', PAGE, 'RL_NAT.field.bend = 1.6; RL_NAT.field.depthJ = 2.5; RL_NAT.field.depthU = 9;'], ['after', PAGE, '']]) {
    const p = await open(b, file, { settle: 500 }); out[tag] = await p.evaluate((s) => window.__mock.ev(s), pre + src); console.log(tag, JSON.stringify(out[tag])); await p.context().close();
  }
  console.log('cls identical (fix 4 alone):', out.before.hash === out['after-v4fields'].hash); await b.close();
})();

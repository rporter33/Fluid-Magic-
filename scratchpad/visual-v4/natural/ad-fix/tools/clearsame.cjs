// the Clear bake (the Clear setting and the Terrain mode) is unchanged by the AD fixes: its pixels hashed on the before page and the new page
const { launch, open, PAGE } = require('./nlib2.cjs');
const BEFORE = __dirname + '/../game-screen-v4.before-ad.html';
const H = `(() => { const d = RB.L.clear.img.data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return { hash: h >>> 0, mip1: (() => { const e = RB.L.clear.mb1.data; let g = 0x811c9dc5; for (let k = 0; k < e.length; k++) { g ^= e[k]; g = Math.imul(g, 0x01000193); } return g >>> 0; })() }; })()`;
(async () => { const b = await launch(), out = {};
  for (const [tag, file] of [['before', BEFORE], ['after', PAGE]]) { const p = await open(b, file, { settle: 500, q: '?terrain=clear' }); out[tag] = await p.evaluate((s) => window.__mock.ev(s), H); console.log(tag, JSON.stringify(out[tag])); await p.context().close(); }
  console.log('clear bake identical:', out.before.hash === out.after.hash && out.before.mip1 === out.after.mip1); await b.close(); })();

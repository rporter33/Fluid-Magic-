// dump the wilds' fine rasters (p58y) as PNGs: node fine.cjs <outdir>
const { launch, open, mev } = require('./lib.cjs'); const fs = require('fs');
(async () => {
  const dir = process.argv[2]; fs.mkdirSync(dir, { recursive: true }); const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, require('./lib.cjs').PAGE, { log, settle: 500 });
  const r = await mev(p, `RB.ms.boxes.map((B) => ({ id: B.w.id, w: B.nw, h: B.nh, url: B.cv.toDataURL('image/png'), hMax: B.hMax }))`);
  for (const q of r) { fs.writeFileSync(`${dir}/fine-${q.id}.png`, Buffer.from(q.url.split(',')[1], 'base64')); console.log(q.id, q.w, q.h, q.hMax); }
  const t = await mev(p, `({ nat: RB.L.natural.t, cpu: RB.L.natural.cpu, mw: { snow: RB.mw.snowTexels, rock: RB.mw.rockTexels, over: RB.mw.snowOverCap, Lmax: RB.mw.snowLmax }, cap: RB.nwCap })`); console.log(JSON.stringify(t));
  console.log('pageErrors', log.pageErrors.length); await b.close();
})();

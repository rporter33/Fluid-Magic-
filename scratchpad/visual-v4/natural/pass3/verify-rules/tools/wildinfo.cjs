const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 500 });
  const r = await mev(p, '({ wilds: WILDS.map((w) => ({ id: w.id, name: w.name, kind: w.kind, cells: w.cells, terr: w.cells.map((i) => terr[i]) })), RL_P_wildRim: RL_P.wildRim, nw: typeof RL_NW !== "undefined" ? JSON.stringify(RL_NW).slice(0, 1500) : null })');
  console.log(JSON.stringify(r, null, 1)); fs.writeFileSync(OUT + 'wildinfo.json', JSON.stringify(r, null, 1)); await b.close(); })();

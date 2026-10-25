const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const t0 = Date.now();
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 1500 });
  console.log('ready ms', p.__readyMs);
  const r = await mev(p, `({ RLD, RLK, MED_DIAM, TX: RB.TX, BW: RB.BW, BH: RB.BH, W, H, s: cam.s, min: minScale, max: maxScale, fit: fitScale, start: startScale(), dpx: cam.s*MED_DIAM, wilds: WILDS.map(w => ({ id: w.id, name: w.name, kind: w.kind, cells: w.cells, n: rlWildOutline(w).length, nb: [...new Set(rlWildOutline(w).map(e=>e.j))].map(j=>names[j]+':'+terr[j]+':'+(prov[j].owner||'')) })), times: window.__mock.reliefTimes(), fr: RL_P.farRelief, nd: RL_P.nearDetail })`);
  console.log(JSON.stringify(r, null, 1));
  console.log('pageErrors', log.pageErrors.length, log.pageErrors.slice(0, 3)); await b.close();
})();

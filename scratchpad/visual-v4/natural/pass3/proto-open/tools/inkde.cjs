const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 300 });
  const r = await mev(p, `((process_ink) => { const ink = hex2rgb(process_ink), out = {}; const M = RL_NAT.mat; const cols = { plains: M.plains.ground, farm: M.farmland.ground, ripe: M.farmland.ripe, forestG: M.forest.ground, canopy: M.forest.canopy, conifer: M.forest.conifer, hills: M.hills.ground, turf: M.hills.turf, mtn: M.mountains.ground, swamp: M.swamp.ground, pool: M.swamp.pool, waste: M.wasteland.ground };
    for (const [k, lab] of Object.entries(cols)) { const row = []; for (const dl of [-6, -3, 0, 3]) { const c = [0,0,0]; rlLabTo(lab[0] + dl, lab[1], lab[2], c, 0); const q = rlPairDE(ink, c); row.push((lab[0]+dl) + ':' + q.normal.toFixed(1) + '/' + q.cvd.toFixed(1)); } out[k] = row.join('  '); }
    for (const L of [20, 25, 30, 35, 40, 45]) { const c = [0,0,0]; rlLabTo(L, 0, 0, c, 0); const q = rlPairDE(ink, c); out['grey' + L] = q.normal.toFixed(1) + '/' + q.cvd.toFixed(1); }
    return out; })(INK)`.replace('INK', JSON.stringify(process.argv[2] || '#1C1A17')));
  console.log(JSON.stringify(r, null, 1)); await b.close(); })();

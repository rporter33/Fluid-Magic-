const { launch, open, ev, mev } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE, { log, q: process.argv[2] || '', settle: 1500 }); await p.mouse.move(720, 896);
  const r = await mev(p, `(() => { const a = names.indexOf('Morholt'), c = names.indexOf('Briardale'), k = ekey(a, c), e = EDGE.get(k), ent = RL_WAT.edge && RL_WAT.edge.get(k); rlRiverGeo(); const ent2 = RL_WAT.edge.get(k), R = rlRiverGeo()[ent2.r];
    return { k, river: rlWorld4().riverOf.get(k), ent: ent2, rname: R.name, S: ent2.idx.map((q) => toScreen(...R.S[q]).map((v) => +v.toFixed(1))), ea: toScreen(...e.a), eb: toScreen(...e.b), pts: (p4BankPts(e, null) || []).filter((_, n) => n % 10 === 0).map((q) => q.map((v) => +v.toFixed(2))), camS: cam.s }; })()`);
  console.log(JSON.stringify(r)); await b.close(); })();

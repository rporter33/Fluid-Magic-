const { launch, open, ev, mev, PAGE, BEFORE } = require('./lib.cjs');
(async () => { const which = process.argv[2] === 'before' ? BEFORE : PAGE, n = Number(process.argv[3] || 1);
  for (let i = 0; i < n; i++) { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, which, { log, settle: 300 });
    const t = await mev(p, '({ ready: 0, nat: RB.L.natural.t, cpu: RB.L.natural.cpu, sharedCpu: RB.total && Math.round(RB.total), wall: Math.round(RB.wall), nw: RB.nw && RB.nw.t })'); t.readyMs = p.__readyMs; console.log(process.argv[2] || 'now', JSON.stringify(t)); await b.close(); } })();

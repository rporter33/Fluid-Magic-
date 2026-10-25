const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 300 });
  for (const v of (process.argv[2] || '1.2,1.1,1.05,1.0').split(',')) {
    console.log(v, JSON.stringify(await mev(p, `(() => { RL_QE.m = ${v}; RL_WRIM.key = ''; RL_QE.memo = new Map(); rlQuietEdgeMap(); return { share: +rlQuietShare().toFixed(3), ms: RL_QE.ms }; })()`)));
  }
  await b.close(); })();

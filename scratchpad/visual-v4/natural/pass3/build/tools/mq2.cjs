const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 300 });
  for (const [ink, m] of [['#0B0A09', 1.2], ['#000000', 1.2], ['#000000', 1.15], ['#000000', 1.1], ['#0B0A09', 1.1]]) {
    console.log(ink, m, JSON.stringify(await mev(p, `(() => { RL_QE_INK[0] = ${parseInt(ink.slice(1,3),16)}; RL_QE_INK[1] = ${parseInt(ink.slice(3,5),16)}; RL_QE_INK[2] = ${parseInt(ink.slice(5,7),16)}; RL_QE.m = ${m}; RL_WRIM.key = ''; RL_QE.memo = new Map(); rlQuietEdgeMap(); return { share: +rlQuietShare().toFixed(3) }; })()`)));
  }
  await b.close(); })();

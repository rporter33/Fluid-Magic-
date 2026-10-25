const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 500 });
  console.log(JSON.stringify(await mev(p, `RB.ms.boxes.map((B) => ({ w: B.w.name, holes: B.holes, edges: (B.mft || []).map((E) => names[E.e.j] + ':' + terr[E.e.j] + ' d' + (E.dark[0].reduce((a, v) => a + v, 0) / E.n).toFixed(2) + ' n' + Math.max(...E.need[0])) }))`), null, 1));
  await b.close(); })();

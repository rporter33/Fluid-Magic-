const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 500 });
  console.log(JSON.stringify(await mev(p, `(() => { const r = {}; for (const m of [0, 40, 70]) { setMonth(m); r[m] = provList.filter((i) => !isWild(i) && prov[i].owner && !RL_EDGES[i].some((e) => isRealmEdge(i, e))).map((i) => names[i]); } setMonth(3); return r; })()`)));
  await b.close(); })();

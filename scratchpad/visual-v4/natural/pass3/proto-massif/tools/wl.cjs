const { launch, open, mev, ev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 300 });
  const r = await mev(p, `(() => { let s = 0, n = 0; for (const v of RB.mw.snow8) { if (v) n++; s += v; } let f = 0; for (const v of RB.nw.F) if (v > 0.9) f++; return { snow8n: n, snow8sum: s, Fwater: f, mw: { snow: RB.mw.snowTexels, over: RB.mw.snowOverCap }, look: rlWildLookCheck() }; })()`);
  console.log(JSON.stringify(r)); await b.close(); })();

// each wild's whole-outline foot / shore statistics (p92 rlWildFootStats) on a page: node footstats.cjs <tag> <pagefile>
const { launch, open, ev, mev } = require('./lib.cjs');
const tag = process.argv[2], file = process.argv[3];
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 300 });
  const r = await mev(p, 'WILDS.map((w) => { const S = rlWildFootStats(w); return [w.name.replace("The ", ""), w.kind, w.cells.length, S && [S.samples, S.p50D, S.p90D, S.within, S.pass]]; })');
  console.log(tag, JSON.stringify(r), 'pageErrors', log.pageErrors.length); await b.close(); })();

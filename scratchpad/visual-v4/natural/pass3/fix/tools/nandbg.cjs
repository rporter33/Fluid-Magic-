const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.argv[2] || PAGE, { log, settle: 500 });
  console.log(await mev(p, `(() => { const c = (a) => { if (!a) return 'none'; let n = 0, mx = -1e9, mn = 1e9; for (const v of a) { if (Number.isNaN(v)) n++; else { mx = Math.max(mx, v); mn = Math.min(mn, v); } } return n + ' nan, ' + mn.toFixed(3) + '..' + mx.toFixed(3); }; return JSON.stringify({ hX: c(RB.nw.hX), hXl: c(RB.nw.hXl), F: c(RB.nw.F), shd: c(RB.nw.shd), mft2: RB.mft2 ? c(RB.mft2) : 'none', hh: c(RB.hh) }); })()`));
  await b.close(); })();

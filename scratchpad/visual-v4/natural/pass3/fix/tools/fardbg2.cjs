const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.argv[2] || PAGE, { log, settle: 500 });
  const st = `(() => { RL_FR.cv = null; RL_FR.ver = -1; rlFarRaster(); const d = RL_FR.img.data; let s = 0, n = 0; for (let k = 0; k < d.length; k += 4) if (d[k + 3]) { s += d[k]; n++; } return +(s / n).toFixed(1); })()`;
  console.log('now', await mev(p, st));
  console.log('no mft2', await mev(p, `(() => { const m = RB.mft2; RB.mft2 = null; const v = ${st}; RB.mft2 = m; return v; })()`));
  console.log('no hXl', await mev(p, `(() => { const m = RB.nw.hXl; RB.nw.hXl = null; const v = ${st}; RB.nw.hXl = m; return v; })()`));
  console.log('muB', await mev(p, `(() => { const a = RL_FR.mu; let s = 0, n = 0, mn = 1e9, mx = -1e9; for (const v of a) { s += v; n++; mn = Math.min(mn, v); mx = Math.max(mx, v); } return [s / n, mn, mx]; })()`));
  await b.close(); })();

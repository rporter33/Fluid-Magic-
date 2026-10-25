const { launch, open, ev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 1200 });
  const r = await ev(p, `m.ev("(() => { let mx = 0, n = 0, np = 0; for (const [, e] of EDGE) { n++; const P = e.wobble || []; np += P.length; const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay) || 1; for (const [x, y] of P) { const d = Math.abs((x - ax) * (by - ay) - (y - ay) * (bx - ax)) / L; if (d > mx) mx = d; } } const S = rlSegStyles ? null : null; return { edges: n, wobblePts: np, maxDevWorld: +mx.toFixed(2), medDiam: MED_DIAM }; })()")`);
  console.log(JSON.stringify(r)); await b.close();
})();

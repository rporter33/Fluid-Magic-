const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 300 });
  if (process.argv[2]) await mev(p, process.argv[2]);
  console.log(JSON.stringify(await mev(p, `(() => { const m = rlQuietEdgeMap(), ink = RL_QE_INK, r = { pieces: 0, bad: 0, why: {} }; const ex = [];
    for (const [k, E] of m) for (let pc = 0; pc < E.np; pc++) { if (!E.seen[pc]) continue; r.pieces++; if (!E.bad[pc]) continue; r.bad++; const f = E.fails[pc]; if (!f.length) { r.why.wet = (r.why.wet || 0) + 1; continue; }
      const W = f[0], G = f[3], pw = rlPairDE(W, G), iw = rlPairDE(ink, W), ig = rlPairDE(ink, G), tag = (pw.normal >= 24 && pw.cvd >= 14.4 ? "P" : "p") + (iw.normal >= 22 && iw.cvd >= 13.2 ? "W" : "w") + (ig.normal >= 22 && ig.cvd >= 13.2 ? "G" : "g"); r.why[tag] = (r.why[tag] || 0) + 1;
      if (ex.length < 40) ex.push([k, pc, tag, rgb2lab(W).map(Math.round), rgb2lab(G).map(Math.round), +pw.normal.toFixed(1), +pw.cvd.toFixed(1), +iw.normal.toFixed(1), +ig.normal.toFixed(1), +ig.cvd.toFixed(1)]); }
    r.ex = ex; return r; })()`)));
  await b.close(); })();

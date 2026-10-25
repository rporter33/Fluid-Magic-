const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 300 });
  const r = await mev(p, `(() => { const B = RB.ms.boxes.find((q) => q.w.kind === 'mere'); let mx = -9, pos = 0; for (const v of B.m) { if (v > mx) mx = v; if (v > 0) pos++; } let f = 0, fmax = 0; for (const v of RB.nw.F) { if (v > 0) f++; fmax = Math.max(fmax, v); }
    return { mmax: mx, pos, Fpos: f, fmax, box: [B.X0, B.Y0, B.nw, B.nh, B.bx0, B.by0, B.bw, B.bh] }; })()`);
  console.log(JSON.stringify(r)); await b.close(); })();

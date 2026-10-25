const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 300 });
  console.log(JSON.stringify(await mev(p, `(() => { const ink = hex2rgb('#0B0A09'), out = []; for (const [a, bb] of [[-8, 25], [-14, 20], [2, 18], [0, 0]]) for (let L = 26; L <= 56; L += 3) { const c = [0,0,0]; rlLabTo(L, a, bb, c, 0); const q = rlPairDE(ink, c); out.push([a, bb, L, +q.normal.toFixed(1), +q.cvd.toFixed(1)]); } return out; })()`)));
  // and the failing pieces' W and G at the start view
  console.log(JSON.stringify(await mev(p, `(() => { const m = rlQuietEdgeMap(); const r = []; for (const [k, E] of m) { for (let pc = 0; pc < E.np; pc++) if (E.bad[pc] && E.fails[pc].length) { const f = E.fails[pc]; r.push([k, ...[f[0], f[3]].map((c) => c ? rgb2lab(c).map((v) => Math.round(v)) : null)]); } } return r.slice(0, 60); })()`)));
  await b.close(); })();

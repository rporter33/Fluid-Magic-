const { launch, open, ev, mev } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE, { log, q: process.argv[2] || '', settle: 1500 }); await p.mouse.move(720, 896);
  if (process.argv[6]) await ev(p, process.argv[6]); await p.waitForTimeout(1500);
  const r = await mev(p, `(() => { const a = names.indexOf('${process.argv[3]}'), c = names.indexOf('${process.argv[4]}'), side = names.indexOf('${process.argv[5]}'), k = ekey(a, c), e = EDGE.get(k), st = rlBankStyle(e, k, side, rlLineCtx()); const R = rlRiverGeo()[RL_WAT.edge.get(k).r], idx = RL_WAT.edge.get(k).idx;
    return { key: st.key, swapped: st.swapped, partners: st.partners, waterOK: st.waterOK, seg: st.seg.map((s, m) => [m, toScreen(...R.S[idx[m]]).map((v) => Math.round(v)), s.i && [s.i[0], +s.i[1].toFixed(2)], s.o && [s.o[0], +s.o[1].toFixed(2)]]), s: cam.s }; })()`);
  console.log(JSON.stringify(r)); await b.close(); })();

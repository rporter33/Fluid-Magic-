const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 300 });
  const r = await mev(p, `(() => { const B = RB.ms.boxes.find((q) => q.w.kind === 'mere'), out = []; const PR = new Float64Array(7); for (const f of [0.1, 0.3, 0.5, 0.7, 0.9]) { const x = (B.X0 + B.nw * f) / (RB.TX * 2), y = (B.Y0 + B.nh * 0.5) / (RB.TX * 2); rlMsPresence(RB.wch, RB.QW, RB.QH, x * RB.TX / 4, y * RB.TX / 4, PR); out.push([...PR].map((v) => +v.toFixed(2)), [0,1,2,3,4,5,6].map((t) => +rlBilin(RB.wch[t], RB.QW, RB.QH, x * RB.TX / 4, y * RB.TX / 4).toFixed(3))); } return out; })()`);
  console.log(JSON.stringify(r)); await b.close(); })();

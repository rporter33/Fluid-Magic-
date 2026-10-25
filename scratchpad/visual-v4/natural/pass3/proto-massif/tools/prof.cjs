const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 500 });
  const r = await mev(p, `(() => { const o = {}; let t = performance.now(); for (const _ of rlMsGen(RB)); o.gen = performance.now() - t; o.msT = RB.msT; t = performance.now(); for (const _ of rlMsColour(RB, RB.nwCap.cap)); o.colour = performance.now() - t;
    t = performance.now(); let s = 0; for (let k = 0; k < 1e6; k++) s += rlRidged(RB.ms.T.spur, k * 0.013, k * 0.007, 3, 0.5); o.ridged1M = performance.now() - t;
    t = performance.now(); const d = [0,0,0,0]; for (let k = 0; k < 1e6; k++) rlLabTo(40 + (k % 30), 3, 8, d, 0); o.lab1M = performance.now() - t;
    t = performance.now(); for (let k = 0; k < 1e6; k++) s += rlFbm(RB.ms.T.sil, k * 0.013, k * 0.007, 3); o.fbm1M = performance.now() - t;
    o.texels = RB.ms.boxes.map((B) => B.nw * B.nh); return o; })()`);
  console.log(JSON.stringify(r)); await b.close(); })();

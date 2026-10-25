// mere edges: the land G of every decision sample on the Still Mere's outline at a few zooms, and whether water colours pass against it (x1.2)
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.argv[2] || PAGE, { log, settle: 1200 });
  for (const [v, src] of [['start', null], ['far', 'm.setScale(60 / m.ev("MED_DIAM"), 720, 450)'], ['mid', 'm.setScale(1.0, 911, 588)'], ['near', 'm.setScale(m.maxScale() * 0.8, 911, 588)']]) { if (src) await ev(p, src); await p.waitForTimeout(1000);
    console.log(v, JSON.stringify(await mev(p, `(() => { RL_WRIM.lru.clear(); RL_DBG.qeSamples = []; RCK = null; draw(); const S = RL_DBG.qeSamples; RL_DBG.qeSamples = null; const mere = WILDS.find((w) => w.kind === 'mere');
      const ok = (a, b, m) => { const q = rlPairDE(a, b); return q.normal >= 20 * m && q.cvd >= 12 * m; }; const o = [0, 0, 0], lab = (L, a, bb) => { const r = [0, 0, 0]; rlLabTo(L, a, bb, r, 0); return r; };
      const Ws = { nat: hex2rgb(RL_C.waterNat), L42: lab(42, -21, 1), L46: lab(46, -21, 3), shelf: lab(50, -21, 6), deep: lab(28, -20, -7), L32: lab(32, -20, -4) }; const res = {}; let n = 0, inkok = 0;
      for (const [x, y, nx, ny, W, G] of S) { if (provinceAt(x - nx * 3 / cam.s, y - ny * 3 / cam.s) < 0 || !mere.cells.includes(provinceAt(x - nx * 3 / cam.s, y - ny * 3 / cam.s))) continue; n++; if (ok(RL_QE_INK, G, 1.1)) inkok++; for (const [k, c] of Object.entries(Ws)) if (ok(c, G, 1.2)) res[k] = (res[k] || 0) + 1; }
      return { n, inkOkG: inkok, pass: res }; })()`))); }
  await b.close(); })();

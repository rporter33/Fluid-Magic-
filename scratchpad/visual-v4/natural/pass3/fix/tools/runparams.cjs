const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.argv[2] || PAGE, { log, settle: 1000 });
  for (const [v, src] of [['start', null], ['far', 'm.setScale(60 / m.ev("MED_DIAM"), 720, 450)'], ['mid', 'm.setScale(1.0, 640, 480)']]) { if (src) await ev(p, src); await p.waitForTimeout(1000);
    console.log(v, JSON.stringify(await mev(p, `(() => { RL_WRIM.lru.clear(); RCK = null; draw(); const o = {}; const keep = { ...RL_QE };
      for (const [pad, gap, mr] of [[2, 4, 0], [2, 8, 12], [2, 12, 16], [2, 16, 24], [1, 16, 24], [2, 12, 24], [2, 16, 16]]) { Object.assign(RL_QE, { padPx: pad, gapPx: gap, minRunPx: mr }); for (const E of RL_WRIM.map.values()) E.runs = null; let runs = 0, short = 0; for (const E of RL_WRIM.map.values()) { const R = rlQuietRuns(E); runs += R.length; short += R.filter(([a, b2]) => (b2 - a) * E.Lpx < 12).length; } o[pad + '/' + gap + '/' + mr] = [+rlQuietShare().toFixed(3), runs, short]; }
      Object.assign(RL_QE, keep); for (const E of RL_WRIM.map.values()) E.runs = null; return o; })()`))); }
  await b.close(); })();

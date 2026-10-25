// pass 3b timings: bake (fresh load), zoom settles (the static re-render per settle, with the wild edge decision), hover frames; node perf.cjs <tag> <pagefile> [dpr]
const { launch, open, ev, mev, OUT } = require('./lib.cjs'); const fs = require('fs');
const tag = process.argv[2] || 'now', file = process.argv[3], dpr = Number(process.argv[4] || 1);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, file, { log, dpr, settle: 2500 }); await p.mouse.move(700, 450);
  const t = await ev(p, 'm.reliefTimes()'); const bake = { readyMs: p.__readyMs, bakeCpu: t.bakeCpuMs, bakeWall: t.bakeWallMs, steps: t.naturalStepsMs, shared: t.sharedStepsMs };
  console.log(tag, 'bake', JSON.stringify(bake));
  const snap = () => mev(p, '({ n: RREB.n, ms: RREB.ms, qn: RL_QE.n, qms: RL_WRIM.ms, Dpx: +(cam.s * MED_DIAM).toFixed(1) })');
  const rows = [];
  const act = async (nm, f) => { await p.waitForTimeout(300); const a = await snap(); await f(); await p.waitForTimeout(900); const z = await snap(); const r = { nm, Dpx: z.Dpx, renders: z.n - a.n, renderMs: +(z.ms - a.ms).toFixed(1), decided: z.qn > a.qn ? z.qms : 0 }; rows.push(r); console.log(tag, JSON.stringify(r)); await p.waitForTimeout(900); };
  const wheel = (dy, x = 700, y = 450) => async () => { await p.mouse.move(x, y); await p.mouse.wheel(0, dy); };
  for (let k = 0; k < 6; k++) await act('wheel in ' + (k + 1), wheel(-100));
  for (let k = 0; k < 4; k++) await act('wheel out ' + (k + 1), wheel(100, 500, 300));
  await act('Fit', () => ev(p, 'm.setScale(m.fitScale(), 720, 450)')); await act('least', () => ev(p, 'm.setScale(m.minScale(), 720, 450)')); await act('Mid 1.0', () => ev(p, 'm.setScale(1.0, 640, 480)'));
  for (let k = 0; k < 4; k++) await act('wheel in ' + (k + 1), wheel(-100, 400, 300)); await act('max', () => ev(p, 'm.setScale(m.maxScale(), 600, 400)'));
  for (let k = 0; k < 3; k++) await act('wheel out ' + (k + 1), wheel(100, 900, 600));
  // hover frames (the live layer): a wild, its neighbours, other provinces, at the start view and at Mid on the Ashspine
  const hov = {};
  for (const [v, src] of [['start', 'm.ev("fit(); draw()")'], ['midAsh', 'm.setScale(1.0, ...m.ev("[cent[WILDS[0].cells[0]][0], cent[WILDS[0].cells[0]][1]]"))']]) { await ev(p, src); await p.waitForTimeout(1500);
    hov[v] = await mev(p, `(() => { const nb = [...new Set(rlWildOutline(WILDS[0]).map((e) => e.j))], out = {}; for (const [k, list] of [['wild', [WILDS[0].cells[0], WILDS[1].cells[0], WILDS[2].cells[0]]], ['nb', nb.slice(0, 6)], ['other', provList.filter((i) => !nb.includes(i)).slice(0, 6)]]) { const t = []; for (const i of list) for (let r = 0; r < 2; r++) { hoverProv = i; const t0 = performance.now(); draw(); t.push(+(performance.now() - t0).toFixed(2)); } t.sort((a, b) => a - b); out[k] = { med: t[t.length >> 1], max: t[t.length - 1] }; } hoverProv = -1; draw(); return out; })()`); console.log(tag, 'hover', v, JSON.stringify(hov[v])); }
  const R = rows.map((r) => r.renderMs).sort((a, b) => a - b), Q = rows.map((r) => r.decided).sort((a, b) => a - b);
  const sum = { tag, dpr, bake, settles: rows.length, renderMedian: R[R.length >> 1], renderMax: R[R.length - 1], decidedLive: rows.filter((r) => r.decided > 0).length, decidedMedian: Q[Q.length >> 1], hover: hov, pageErrors: log.pageErrors.length };
  console.log('SUMMARY', JSON.stringify(sum)); fs.writeFileSync(`${OUT}perf-${tag}-dpr${dpr}.json`, JSON.stringify({ sum, rows }, null, 1)); await b.close(); })();

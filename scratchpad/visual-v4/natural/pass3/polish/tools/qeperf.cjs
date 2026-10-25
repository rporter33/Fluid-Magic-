// the wild edge decision's cost each time a zoom settles (RL_WRIM.ms when it is recomputed), over zooms and positions, twice: node qeperf.cjs [dpr]
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const dpr = Number(process.argv[2] || 1), tag = (process.env.TAG || 'now') + '-dpr' + dpr;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, settle: 1500 }); await p.mouse.move(720, 895);
  const D = await mev(p, 'MED_DIAM'), wc = await mev(p, 'WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [x / w.cells.length, y / w.cells.length]; })');
  const Z = [['least', 'm.minScale()', 800, 500], ['far60', 60 / D, 720, 450], ['start', 'm.startScale()', null, null], ['fit', 'm.fitScale()', 720, 450], ['mid', 1.0, 640, 480], ['ref', 1.142, 700, 560], ['near', 336 / D, ...wc[0]], ['near2', 300 / D, ...wc[2]], ['max', 420 / D, ...wc[0]], ['maxM', 420 / D, ...wc[1]], ['mid2', 1.07, 600, 420], ['ref2', 1.25, 760, 520]];
  await ev(p, 'm.ev("RL_WRIM.key = \'\'")'); const rows = [];
  for (const rep of [0, 1]) for (const [nm, s, x, y] of Z) { const src = nm === 'start' ? 'm.ev("fit(); draw()")' : `m.setScale(${typeof s === 'string' ? s : s + (rep ? 0.0001 : 0)}, ${x}, ${y})`;
    const t0 = Date.now(); await ev(p, src); const r = await mev(p, '({ ms: RL_WRIM.ms, n: RL_QE.n, edges: RL_WRIM.edges, Dpx: +(cam.s * MED_DIAM).toFixed(1), share: rlQuietShare() })'); rows.push({ rep, nm, ...r, wall: Date.now() - t0 }); console.log(rep, nm, JSON.stringify(r), 'wall', Date.now() - t0); await p.waitForTimeout(150); }
  const ms = rows.map((r) => r.ms).sort((a, b) => a - b); console.log('SUMMARY', tag, 'median', ms[ms.length >> 1], 'max', ms[ms.length - 1], 'pageErrors', log.pageErrors.length);
  fs.writeFileSync(`${OUT}qeperf-${tag}.json`, JSON.stringify(rows, null, 1)); await b.close(); })();

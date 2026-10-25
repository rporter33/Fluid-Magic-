// the wild edge decision's cost each time a zoom settles, as a player zooms: wheel notches (deltaY 100) at the pointer and the band jumps, with idle time between (IDLE ms)
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const dpr = Number(process.argv[2] || 1), IDLE = Number(process.env.IDLE || 1200), tag = (process.env.TAG || 'now') + '-dpr' + dpr;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, settle: 2500 }); await p.mouse.move(700, 450);
  const rows = []; const snap = () => mev(p, '({ n: RL_QE.n, ms: RL_WRIM.ms, Dpx: +(cam.s * MED_DIAM).toFixed(1), pre: RL_QE.pre ? { n: RL_QE.pre.n, ms: Math.round(RL_QE.pre.ms) } : null })');
  const act = async (nm, f) => { const a = await snap(); await f(); await p.waitForTimeout(400); const z = await snap(); const live = z.n > a.n ? z.ms : 0; rows.push({ nm, Dpx: z.Dpx, live, pre: z.pre }); console.log(nm, z.Dpx, 'live ms', live, 'prefetch', JSON.stringify(z.pre)); await p.waitForTimeout(IDLE); };
  const wheel = (dy, x = 700, y = 450) => async () => { await p.mouse.move(x, y); await p.mouse.wheel(0, dy); await p.waitForTimeout(450); };
  for (let k = 0; k < 6; k++) await act('wheel in ' + (k + 1), wheel(-100));
  for (let k = 0; k < 4; k++) await act('wheel out ' + (k + 1), wheel(100, 500, 300));
  await act('Fit', () => ev(p, 'm.setScale(m.fitScale(), 720, 450)')); await act('least', () => ev(p, 'm.setScale(m.minScale(), 720, 450)')); await act('Z start', () => ev(p, 'm.ev("fitToCloth()")')); await act('Mid 1.0', () => ev(p, 'm.setScale(1.0, 640, 480)'));
  for (let k = 0; k < 6; k++) await act('wheel in ' + (k + 1), wheel(-100, 400, 300)); await act('max', () => ev(p, 'm.setScale(m.maxScale(), 600, 400)'));
  for (let k = 0; k < 3; k++) await act('wheel out ' + (k + 1), wheel(100, 900, 600));
  const L = rows.map((r) => r.live).sort((a, b) => a - b); console.log('SUMMARY', tag, 'settles', rows.length, 'computed', rows.filter((r) => r.live > 0).length, 'median', L[L.length >> 1], 'max', L[L.length - 1], 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 2)));
  fs.writeFileSync(`${OUT}qeperf2-${tag}.json`, JSON.stringify(rows, null, 1)); await b.close(); })();

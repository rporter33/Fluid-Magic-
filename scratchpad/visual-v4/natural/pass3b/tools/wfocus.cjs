// the focus sweep: node wfocus.cjs <natural|clear|terrain|mode:<m>> <dpr> [w h]; env VIEWS=start,far,...; out/wfocus-<tag>.json
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1), W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900), tag = `${look.replace(':', '-')}-dpr${dpr}-${W}x${H}${process.env.TAG ? '-' + process.env.TAG : ''}`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, w: W, h: H, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '', mobile: !!process.env.MOBILE }); await p.mouse.move(W / 2, H - 6);
  if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1500); }
  if (look.startsWith('mode:')) { await mev(p, `setMode('${look.slice(5)}')`); await p.waitForTimeout(1500); }
  const views = process.env.VIEWS ? process.env.VIEWS.split(',') : null;
  const r = await ev(p, `m.reliefWildFocusSweep(${JSON.stringify({ views, marches: Number(process.env.MARCHES || 2) })})`);
  console.log(tag, 'states', r.states, 'samples', r.samples, 'fails', r.fails, 'min', r.minRatio, 'worst', r.worst, 'ms', r.ms, 'pass', r.pass); for (const row of r.rows.slice(0, 12)) console.log('  ', JSON.stringify(row));
  r.log = log; fs.writeFileSync(`${OUT}wfocus-${tag}.json`, JSON.stringify(r, null, 1)); console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close();
})();

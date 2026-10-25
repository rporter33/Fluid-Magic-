// the built-in line-floor checks (p90) in one look and density: node focus.cjs <natural|clear> <dpr> [views,..] [modes,..] [hover,select]
// prints one row per view and mode (rest, hover, select) and writes out/sweep-<look>-dpr<d>[-tag].json
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1), views = process.argv[4] ? process.argv[4].split(',') : null, modes = process.argv[5] ? process.argv[5].split(',') : null, how = process.argv[6] ? process.argv[6].split(',') : null, tag = process.env.TAG || '';
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, t0 = Date.now();
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 895);
  const rows = [];
  for (const m of modes ?? ['ownership', 'terrain', 'dominion', 'supply', 'unrest', 'population', 'springs']) {
    const r = await ev(p, `m.reliefLinesSweep(${JSON.stringify({ views: views ?? undefined, modes: [m], how: how ?? undefined })})`);
    for (const q of r.rows) { rows.push(q); console.log(look, 'dpr' + dpr, q.mode, q.view, q.shown, q.band, 'rest', JSON.stringify(q.rest), 'hover', JSON.stringify(q.hover), 'select', JSON.stringify(q.select), q.pass ? 'PASS' : 'FAIL ' + JSON.stringify(q.failing)); }
  }
  fs.writeFileSync(`${OUT}sweep-${look}-dpr${dpr}${tag ? '-' + tag : ''}.json`, JSON.stringify(rows, null, 1));
  console.log('ALLPASS', rows.every((q) => q.pass), 'rows', rows.length, 'fails', rows.filter((q) => !q.pass).length, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3)), 'min', Math.round((Date.now() - t0) / 60000)); await b.close();
})();

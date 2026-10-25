// the pass-3b parts on another map plan: node seedprobe3b.cjs <s7|s31|alt|s44|s5|s58>  ->  ../out/seed3b-<v>.json, shots in ../shots/wip/seed-<v>-*.png
// page errors; at rest (reliefWildRest: no outline drawn, the landform within reach) at the start, the least zoom and Mid / Near / closest on every wild; the focus-state
// sweep (reliefWildFocusSweep: every neighbour hovered and selected, the wild hovered, marches previewed and planned across it) at the start, Mid and Near; the focus-all
// sweep (reliefWildSweep), the wild look, the footprint and the interaction checks
const { launch, open, ev, mev, ME, OUT } = require('./lib.cjs'); const fs = require('fs');
const V0 = process.argv[2], PAGE = ME + 'variants/' + V0 + '/game-screen-v4.html', SH = ME + 'shots/wip/seed-';
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = { variant: V0, rest: {} };
  const p = await open(b, PAGE, { log, settle: 1800 }); await p.mouse.move(720, 896);
  out.wilds = await mev(p, `WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return { name: w.name, kind: w.kind, cells: w.cells.length, c: [x / w.cells.length, y / w.cells.length] }; })`);
  console.log(V0, JSON.stringify(out.wilds)); await p.screenshot({ path: `${SH}${V0}-start.png` });
  const V = [['start', 'm.ev("fit(); draw()")'], ['min', 'm.setScale(m.minScale(), 800, 500)']];
  out.wilds.forEach((w, k) => { V.push([`w${k}mid`, `m.setScale(1.0, ${w.c[0]}, ${w.c[1]})`]); V.push([`w${k}near`, `m.setScale(m.maxScale() * 0.55, ${w.c[0]}, ${w.c[1]})`]); V.push([`w${k}max`, `m.setScale(m.maxScale(), ${w.c[0]}, ${w.c[1]})`]); });
  let restFails = 0;
  for (const [v, src] of V) { await ev(p, src); await p.waitForTimeout(1500); const R = await ev(p, 'm.reliefWildRest()');
    const s = { Dpx: R.Dpx, drawn: R.outlinePixelsDrawn, pass: R.pass, wilds: Object.fromEntries(Object.entries(R.wilds || {}).map(([k, w]) => [k, [w.samples, w.raster.p50D, w.raster.p90D, w.raster.within, w.lighterInnerLine, w.darkLine, w.pass]])) };
    out.rest[v] = s; if (!R.pass) restFails++; console.log(V0, 'rest', v, JSON.stringify(s)); if (/near|min/.test(v)) await p.screenshot({ path: `${SH}${V0}-${v}.png` }); }
  await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(800);
  const t0 = Date.now(), F = await ev(p, 'm.reliefWildFocusSweep({ views: ["start", "mid", "near"] })'); out.focus = { views: F.views, states: F.states, samples: F.samples, fails: F.fails, min: F.minRatio, worst: F.worst, rows: F.rows.slice(0, 8), ms: Date.now() - t0, pass: F.pass };
  console.log(V0, 'focusSweep', JSON.stringify(out.focus));
  const sw = await ev(p, 'm.reliefWildSweep()'); out.sweep = { views: sw.views, samples: sw.samples, fails: sw.fails, min: sw.minRatio, worst: sw.worst, pass: sw.pass }; console.log(V0, 'sweepAll', JSON.stringify(out.sweep));
  out.wildLook = await ev(p, 'm.reliefWildLook()'); out.footprint = await ev(p, 'm.reliefWildFootprint()'); out.interact = await ev(p, 'm.reliefWildInteract()');
  console.log(V0, 'wildLook', out.wildLook.pass, 'footprint', out.footprint.pass, 'interact', out.interact.pass, JSON.stringify(out.interact.problems || []));
  out.restFails = restFails; out.pageErrors = log.pageErrors; fs.writeFileSync(`${OUT}seed3b-${V0}.json`, JSON.stringify(out, null, 1));
  console.log(V0, 'SUMMARY restFails', restFails, 'focusFails', out.focus.fails, 'sweepFails', out.sweep.fails, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close();
})();

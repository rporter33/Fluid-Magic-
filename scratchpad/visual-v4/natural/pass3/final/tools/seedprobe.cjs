// the live parts on another map plan: node seedprobe3.cjs <s7|s31|alt>  ->  out/seed-<v>.json, shots in ../wip/seed-<v>-*.png
// page errors, the wild edge test (and margins) at several zooms on every wild, the in-page sweep (seeded cameras, closest zooms, sub-pixel pans), wild look, footprint, interaction
const { launch, open, ev, mev, OUT } = require('./lib.cjs'); const fs = require('fs');
const V0 = process.argv[2], PAGE = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/variants/' + V0 + '/game-screen-v4.html', SH = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/shots/seed-';
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = { variant: V0, views: {} };
  const p = await open(b, PAGE, { log, settle: 1800 }); await p.mouse.move(720, 896);
  out.wilds = await mev(p, `WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } const nb = new Set(); for (const e of rlWildOutline(w)) if (!isWild(e.j)) nb.add(names[e.j] + ':' + terr[e.j]); return { name: w.name, kind: w.kind, cells: w.cells.length, c: [x / w.cells.length, y / w.cells.length], nb: [...nb] }; })`);
  console.log(V0, JSON.stringify(out.wilds)); await p.screenshot({ path: `${SH}${V0}-start.png` });
  const V = [['start', 'm.ev("fit(); draw()")'], ['min', 'm.setScale(m.minScale(), 800, 500)']];
  out.wilds.forEach((w, k) => { V.push([`w${k}mid`, `m.setScale(1.0, ${w.c[0]}, ${w.c[1]})`]); V.push([`w${k}near`, `m.setScale(m.maxScale() * 0.55, ${w.c[0]}, ${w.c[1]})`]); V.push([`w${k}max`, `m.setScale(m.maxScale(), ${w.c[0]}, ${w.c[1]})`]); });
  for (const [v, src] of V) { await ev(p, src); await p.waitForTimeout(1500);
    const r = await ev(p, `(() => { const E = m.reliefWildEdge(), M = m.reliefWildMargins(), R = m.reliefRails(); return { band: m.band(), samples: E.samples, fails: E.fails, share: E.rim && E.rim.quietEdgeShare, p5: M.p5, min: M.min, ex: E.examples.slice(0, 3), rails: R.fails }; })()`);
    out.views[v] = r; console.log(V0, v, r.band, 'edge', r.samples, r.fails, 'share', r.share, 'p5', r.p5, 'min', JSON.stringify(r.min), r.fails ? JSON.stringify(r.ex) : '', 'railFails', r.rails);
    if (/near|start|min/.test(v)) await p.screenshot({ path: `${SH}${V0}-${v}.png` }); }
  await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(800);
  const sw = await ev(p, 'm.reliefWildSweep()'); out.sweep = { views: sw.views, samples: sw.samples, fails: sw.fails, under110: sw.samplesUnder110, min: sw.minRatio, worst: sw.worst, pans: sw.pans, pass: sw.pass };
  console.log(V0, 'sweep', JSON.stringify(out.sweep));
  out.wildLook = await ev(p, 'm.reliefWildLook()'); out.footprint = await ev(p, 'm.reliefWildFootprint()'); out.interact = await ev(p, 'm.reliefWildInteract()');
  console.log(V0, 'wildLook', out.wildLook.pass, JSON.stringify({ snow: out.wildLook.peaks && out.wildLook.peaks.snowShare, out: out.wildLook.peaks && out.wildLook.peaks.textelsOutsideTheirCells }), 'footprint', out.footprint.pass, 'interact', out.interact.pass, JSON.stringify(out.interact.problems));
  out.pageErrors = log.pageErrors; console.log(V0, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3)));
  fs.writeFileSync(`${OUT}seed-${V0}.json`, JSON.stringify(out, null, 1)); await b.close();
})();

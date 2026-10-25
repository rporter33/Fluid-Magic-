// generality: each build on another map seed (wilds of other shapes and neighbours): page errors, the wild edge test at several zooms on each wild, the wild look, shots
// node seedprobe.cjs <page>  ->  out/seed-<page>.json, shots/seed-<page>-<view>.png
const { launch, open, ev, mev, page, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const PN = process.argv[2];
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = { page: PN, views: {} };
  const t0 = Date.now(); const p = await open(b, page(PN), { log, settle: 2000, reducedMotion: 'reduce' }); out.readyMs = Date.now() - t0; await p.mouse.move(720, 896);
  out.wilds = await mev(p, `WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } const nb = new Set(); for (const e of rlWildOutline(w)) if (!isWild(e.j)) nb.add(names[e.j] + ':' + terr[e.j]); return { name: w.name, kind: w.kind, cells: w.cells.length, c: [x / w.cells.length, y / w.cells.length], nb: [...nb] }; })`);
  console.log(PN, 'ready', out.readyMs, JSON.stringify(out.wilds));
  await p.screenshot({ path: `${SHOTS}seed-${PN}-start.png` });
  const V = [['start', 'm.ev("fit(); draw()")'], ['min', 'm.setScale(m.minScale(), 800, 500)']];
  out.wilds.forEach((w, k) => { V.push([`w${k}mid`, `m.setScale(1.0, ${w.c[0]}, ${w.c[1]})`]); V.push([`w${k}near`, `m.setScale(m.maxScale() * 0.55, ${w.c[0]}, ${w.c[1]})`]); V.push([`w${k}max`, `m.setScale(m.maxScale(), ${w.c[0]}, ${w.c[1]})`]); });
  for (const [v, src] of V) { await ev(p, src); await p.waitForTimeout(1800);
    const r = await ev(p, `(() => { const E = m.reliefWildEdge(), R = m.reliefRails(); return { band: m.band(), samples: E.samples, fails: E.fails, rim: E.rim, worst: E.worstFailRatio, ex: E.examples.slice(0, 4), rails: R.fails }; })()`);
    out.views[v] = r; console.log(PN, v, r.band, 'edge', r.samples, r.fails, JSON.stringify(r.rim), r.fails ? JSON.stringify(r.ex) : '', 'railFails', r.rails);
    if (/near|start|min/.test(v)) await p.screenshot({ path: `${SHOTS}seed-${PN}-${v}.png` }); }
  await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(800);
  out.wildLook = await ev(p, 'm.reliefWildLook()'); out.spill = await ev(p, 'm.reliefWildSpill ? m.reliefWildSpill() : null');
  console.log(PN, 'wildLook', JSON.stringify(out.wildLook).slice(0, 500)); if (out.spill) console.log(PN, 'spill', JSON.stringify(out.spill));
  out.times = await ev(p, 'm.reliefTimes()'); out.pageErrors = log.pageErrors; console.log(PN, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3)));
  fs.writeFileSync(`${OUT}seed-${PN}.json`, JSON.stringify(out, null, 1)); await b.close();
})();

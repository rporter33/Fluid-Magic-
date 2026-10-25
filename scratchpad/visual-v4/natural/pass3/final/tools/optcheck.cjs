// the owner's comparison options on the final page: node optcheck.cjs <query> <dpr>  (e.g. '?wildfoot=talus' 1, '?wildink=2' 1)
// per view: the page's wild edge test and margins, the band share, rails; then the in-page sweep, footprint, interaction, wild look; page errors; a shot of each view
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const q = process.argv[2] || '?wildfoot=talus', dpr = Number(process.argv[3] || 1), tag = q.replace(/[?=&]/g, '_') + '-dpr' + dpr;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = { q, dpr, views: {} };
  const p = await open(b, PAGE, { log, dpr, settle: 1500, q }); await p.mouse.move(720, 896);
  out.opts = await mev(p, '({ foot: typeof RL_WFOOT !== "undefined" ? RL_WFOOT : null, ink: [RL_QE.inkPx, RL_QE.inkHex] })');
  const Wd = await mev(p, 'WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [w.name, x / w.cells.length, y / w.cells.length]; })');
  const V = [['start', 'm.ev("fit(); RCK = null; draw()")'], ['far60', 'm.setScale(60 / m.ev("MED_DIAM"), 720, 450)'], ['min', 'm.setScale(m.minScale(), 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)']];
  Wd.forEach(([nm, x, y], k) => V.push([`w${k}mid`, `m.setScale(1.0, ${x}, ${y})`], [`w${k}near`, `m.setScale(m.maxScale() * 0.55, ${x}, ${y})`], [`w${k}max`, `m.setScale(m.maxScale(), ${x}, ${y})`]));
  for (const [v, src] of V) { await ev(p, src); await p.waitForTimeout(1600);
    const r = await ev(p, '(() => { const E = m.reliefWildEdge(), M = m.reliefWildMargins(), R = m.reliefRails(); return { band: m.band(), Dpx: +(m.scale() * m.ev("MED_DIAM")).toFixed(1), samples: E.samples, fails: E.fails, share: E.rim && E.rim.quietEdgeShare, worst: E.worstFailRatio, ex: E.examples.slice(0, 3), mMin: M.min, mFails: M.fails, rails: R.fails }; })()');
    out.views[v] = r; console.log(tag, v, r.band, r.Dpx, 'edge', r.samples, r.fails, 'share', r.share, 'marginFails', r.mFails, 'min', JSON.stringify(r.mMin), 'rails', r.rails, r.fails ? JSON.stringify(r.ex) : '');
    if (dpr === 1) await p.screenshot({ path: `${SHOTS}opt-${tag}-${v}.png` }); }
  await ev(p, 'm.ev("fit(); RCK = null; draw()")'); await p.waitForTimeout(800);
  const sw = await ev(p, 'm.reliefWildSweep()'); out.sweep = { views: sw.views, samples: sw.samples, fails: sw.fails, under110: sw.samplesUnder110, min: sw.minRatio, worst: sw.worst, pass: sw.pass };
  out.footprint = await ev(p, 'm.reliefWildFootprint()'); out.interact = await ev(p, 'm.reliefWildInteract()'); out.wildLook = await ev(p, 'm.reliefWildLook()');
  console.log(tag, 'opts', JSON.stringify(out.opts), 'sweep', JSON.stringify(out.sweep), 'footprint', out.footprint.pass, 'interact', out.interact.pass, 'wildLook', out.wildLook.pass);
  out.pageErrors = log.pageErrors; console.log(tag, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3)));
  fs.writeFileSync(`${OUT}opt-${tag}.json`, JSON.stringify(out, null, 1)); await b.close(); })();

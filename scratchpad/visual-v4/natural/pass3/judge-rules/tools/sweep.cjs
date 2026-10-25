// robustness: the colour-blind wild edge test and the rails' band rule at camera positions none of the builders tuned on (a seeded list around the three wilds, every zoom band),
// plus the zoom-settle cost of each build's rim / quiet-edge decision: node sweep.cjs <page> [look] [dpr] [n]  ->  out/sweep-<page>-<look>-dpr<d>.json
const { launch, open, ev, mev, page, OUT } = require('./lib.cjs'); const fs = require('fs');
const PN = process.argv[2], look = process.argv[3] || 'natural', dpr = Number(process.argv[4] || 1), NV = Number(process.argv[5] || 30), PAGE = page(PN);
const WC = `(() => { const o = {}; for (const w of WILDS) { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } o[w.kind === 'mere' ? 'mere' : w.name.includes('Ash') ? 'ash' : 'grey'] = [x / w.cells.length, y / w.cells.length]; } return o; })()`;
let seed = 20261023; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, rows = [];
  const p = await open(b, PAGE, { log, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 896);
  if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 400000, polling: 300 }); await p.waitForTimeout(1500); }
  const wc = await mev(p, WC), g = await mev(p, '({ min: minScale, max: maxScale, fit: fitScale, D: MED_DIAM })'); const keys = ['ash', 'grey', 'mere'];
  for (let k = 0; k < NV; k++) {
    const w = keys[k % 3], f = rnd(), s = g.min * Math.pow(g.max / g.min, f), ox = (rnd() - 0.5) * 1.2 * g.D, oy = (rnd() - 0.5) * 1.2 * g.D, cx = wc[w][0] + ox, cy = wc[w][1] + oy;
    const t0 = Date.now(); await ev(p, `m.setScale(${s}, ${cx}, ${cy})`); await p.waitForTimeout(1600);
    const r = await ev(p, `(() => { const E = m.reliefWildEdge(), R = m.reliefRails(); return { band: m.band(), Dpx: +(m.scale() * m.ev('MED_DIAM')).toFixed(1), edge: { samples: E.samples, fails: E.fails, direct: E.directShare, rim: E.rim, worst: E.worstFailRatio, ex: E.examples.slice(0, 3) }, rails: { samples: R.samples, fails: R.fails, worst: R.worstContrast } }; })()`);
    r.view = [w, +s.toFixed(3), +cx.toFixed(1), +cy.toFixed(1)]; r.wallMs = Date.now() - t0; rows.push(r);
    console.log(PN, look, k, JSON.stringify(r.view), r.band, r.Dpx, 'edge', r.edge.samples, r.edge.fails, JSON.stringify(r.edge.rim), r.edge.fails ? JSON.stringify(r.edge.ex) : '', 'rails', r.rails.samples, r.rails.fails);
  }
  const tot = rows.reduce((a, r) => [a[0] + r.edge.samples, a[1] + r.edge.fails, a[2] + r.rails.fails, a[3] + (r.edge.fails ? 1 : 0)], [0, 0, 0, 0]);
  const ms = rows.map((r) => (r.edge.rim && r.edge.rim.ms) || 0).sort((a, b) => a - b);
  console.log('TOTAL', PN, look, 'dpr', dpr, 'views', rows.length, 'edgeSamples', tot[0], 'edgeFails', tot[1], 'viewsWithFails', tot[3], 'railFails', tot[2], 'decisionMs p50/p90/max', ms[ms.length >> 1], ms[Math.floor(ms.length * 0.9)], ms[ms.length - 1], 'pageErrors', log.pageErrors.length);
  fs.writeFileSync(`${OUT}sweep-${PN}-${look}-dpr${dpr}.json`, JSON.stringify({ rows, tot, log }, null, 1)); await b.close();
})();

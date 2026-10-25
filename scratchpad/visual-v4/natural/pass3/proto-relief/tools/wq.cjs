// quick wild checks across views: node wq.cjs [look]
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural';
const V = [['start', null], ['far', 'm.setScale(m.minScale(), 800, 500)'], ['far60', 'm.setScale(60 / m.ev("MED_DIAM"), 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['ash', 'm.setScale(m.maxScale() * 0.55, 560, 230)'], ['grey', 'm.setScale(m.maxScale() * 0.6, 640, 640)'], ['mere', 'm.setScale(m.maxScale() * 0.6, 900, 560)'], ['ashmax', 'm.setScale(m.maxScale(), 600, 240)'], ['greymax', 'm.setScale(m.maxScale(), 640, 700)'], ['meremax', 'm.setScale(m.maxScale(), 900, 600)']];
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, settle: 1200, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 895);
  if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1500); }
  const rows = {};
  for (const [v, src] of V) { if (src) await ev(p, src); await p.waitForTimeout(1500);
    const r = await ev(p, `(() => { const W = m.reliefWildEdge(), L = m.reliefLines({ step: 1 }), R = m.reliefRails(); return { band: m.band(), Dpx: +(m.scale() * m.ev('MED_DIAM')).toFixed(1), wild: { n: W.samples, fails: W.fails, direct: W.directShare, rim: W.rim, worst: W.worstFailRatio, ex: W.examples }, lines: { pass: L.pass, hairMin: L.hairline.min, intMin: L.internal.min, faint: L.faint && [L.faint.median, L.faint.p90, L.faint.max] }, rails: [R.samples, R.fails] }; })()`);
    rows[v] = r; console.log(v, JSON.stringify(r)); }
  rows.wildLook = await ev(p, 'm.reliefWildLook()'); console.log('wildLook', JSON.stringify(rows.wildLook));
  rows.rimNeed = await mev(p, '[...(RL_WRIM.map || new Map()).entries()].filter(([k, E]) => E.need).map(([k, E]) => k + ":" + E.need)'); console.log('rimNeed', JSON.stringify(rows.rimNeed));
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); fs.writeFileSync(OUT + 'wq-' + look + '.json', JSON.stringify(rows, null, 1)); await b.close(); })();

// the page's checks across views and both looks: node views.cjs <look natural|clear|terrain> <dpr>
const { launch, open, PAGE, OUT, realErrors } = require('./nlib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1);
const VIEWS = [['start', ''], ['mid', 'm.setScale(1.0, 640, 480)'], ['mid100', 'm.setScale(110 / m.ev("MED_DIAM"), 800, 500)'], ['nearW', 'm.setScale(m.maxScale() * 0.9, 300, 470)'], ['nearC', 'm.setScale(m.maxScale() * 0.9, 260, 640)'], ['nearE', 'm.setScale(m.maxScale() * 0.9, 1300, 400)'], ['m40', 'm.ev("fitToCloth()"); m.setMonth(40)'], ['m40mid', 'm.setScale(1.0, 900, 500)']];
(async () => {
  const b = await launch(), errors = [], rows = {};
  const p = await open(b, PAGE, { errors, settle: 1500, dpr, q: look === 'clear' ? '?terrain=clear' : '' });
  if (look === 'terrain') { await p.evaluate(() => window.__mock.ev("setMode('terrain')")); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 150000, polling: 300 }); }
  for (const [v, src] of VIEWS) {
    if (dpr === 2 && !['start', 'mid', 'nearW'].includes(v)) continue;
    if (src) await p.evaluate((s) => { const m = window.__mock; return eval(s); }, src); await p.waitForTimeout(1600);
    const r = await p.evaluate(() => { const m = window.__mock, L = m.reliefLines(), R = m.reliefRails(), S = m.reliefSeats(), Y = m.reliefLayout(), M = m.reliefMeans();
      return { band: m.band(), Dpx: +(m.scale() * m.ev('MED_DIAM')).toFixed(0), hair: [L.hairline.samples, L.hairline.min, L.hairline.median, L.hairline.under], int: [L.internal.samples, L.internal.min, L.internal.under], partners: L.partners, flips: L.keylineFlipsAlongEdges, width: L.maxHairWidthPx, worst: L.worst,
        rails: [R.samples, R.fails, R.worstContrast], seats: Object.fromEntries(['hamlet', 'hut', 'town'].filter((k) => S[k]).map((k) => [k, [S[k].seats, S[k].p95Worst, S[k].p95Median, Array.isArray(S[k].over) ? S[k].over.length : '-']])), seatLimit: S.limit,
        layout: [Y.labelOverlaps, Y.labelPieceOverlaps, Y.pieceOverlaps, Y.armiesOutsideInset, Y.names], means: M.applicable === false ? 'n/a' : [M.provinces, M.worstDE, M.pairs.under2012, M.pairs.worstNormal.v, M.pairs.worstCvd.v] }; });
    rows[v] = r; console.log(v, JSON.stringify(r));
  }
  fs.writeFileSync(`${OUT}views-${look}-dpr${dpr}.json`, JSON.stringify(rows, null, 1));
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

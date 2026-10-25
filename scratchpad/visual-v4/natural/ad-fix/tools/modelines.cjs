// the line rule in every data mode (rendered pixels), start and Mid: node modelines.cjs <dpr>
const { launch, open, PAGE, OUT, realErrors } = require('./nlib2.cjs'); const fs = require('fs');
const dpr = Number(process.argv[2] || 1), q = process.argv[3] || '';
(async () => {
  const b = await launch(), errors = [], rows = {};
  const p = await open(b, PAGE, { errors, settle: 1500, dpr, q, reducedMotion: 'reduce' }); const m = (s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
  for (const mode of ['ownership', 'dominion', 'supply', 'unrest', 'population', 'springs']) for (const [v, src] of [['start', 'm.ev("fitToCloth()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ['near', 'm.setScale(m.maxScale() * 0.9, 980, 170)']]) {
    await m(`m.ev("setMode('${mode}')")`); await m(src); await p.waitForTimeout(900);
    const r = await m('(() => { const L = m.reliefLines(); return { hair: [L.hairline.samples, L.hairline.min, L.hairline.median, L.hairline.under], int: [L.internal.samples, L.internal.min, L.internal.under], partners: L.partners + "/" + L.segs, flips: L.keylineFlipsAlongEdges, width: L.maxHairWidthPx, pass: L.pass, worst: L.worst.hair }; })()');
    rows[mode + '-' + v] = r; console.log(mode, v, JSON.stringify(r));
  }
  fs.writeFileSync(`${OUT}modelines-dpr${dpr}${q ? '-clear' : ''}.json`, JSON.stringify(rows, null, 1));
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

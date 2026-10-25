// which hairline + partner split (<= 3 px) keeps every segment over its floor below ratio 1.5
const { launch, open, PAGE } = require('./nlib.cjs');
(async () => { const b = await launch(), errors = [];
  for (const q of ['?terrain=clear', '']) { const p = await open(b, PAGE, { errors, settle: 1200, q, reducedMotion: 'reduce' }); const m = (s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
    for (const pair of [[1.5, 1.5], [2, 1], [1.75, 1.25]]) for (const [v, src] of [['start', 'm.ev("fitToCloth()")'], ['mid100', 'm.setScale(110 / m.ev("MED_DIAM"), 800, 500)'], ['m40', 'm.ev("fitToCloth()")']]) {
      await m(`m.ev("RL_P.line.pairW1 = ${JSON.stringify(pair)}; RCK = null; draw()")`); await m(src); await p.waitForTimeout(700);
      const r = await m('(() => { const L = m.reliefLines(); return [L.hairline.min, L.hairline.under, L.internal.min, L.internal.under, L.maxHairWidthPx, L.worst.hair.at]; })()');
      console.log(q || 'natural', JSON.stringify(pair), v, JSON.stringify(r));
    }
    await p.context().close(); }
  await b.close(); })();

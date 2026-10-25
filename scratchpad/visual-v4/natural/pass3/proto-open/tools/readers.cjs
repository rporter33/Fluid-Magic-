// the page's own terrain readers at several zooms, on this build and on the page before the AD fixes: node readers.cjs <now|before> [dpr]
const { launch, open, ev, PAGE, BEFORE, OUT } = require('./lib.cjs'); const fs = require('fs');
const which = process.argv[2] || 'now', dpr = Number(process.argv[3] || 1);
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, which === 'now' ? PAGE : BEFORE, { log, dpr, settle: 1500 }); await p.mouse.move(720, 895);
  const out = {};
  for (const [v, src] of [['start', null], ['mid75', 'm.setScale(0.75, 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['midE', 'm.setScale(1.0, 1100, 500)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['refW', 'm.setScale(1.142, 300, 470)']]) {
    if (src) await ev(p, src); await p.waitForTimeout(1500);
    const r = await ev(p, 'm.reliefNatural(true).readers');
    const s = (k) => r[k] ? [r[k].lightness.patchAcc, r[k].lightness.provinceAcc, r[k].texture.patchAcc, r[k].texture.provinceAcc] : null;
    out[v] = { Dpx: r.Dpx, pass: r.pass, normal: s('normal'), unexplored: [r.normal.unexplored.patchAcc, r.normal.unexplored.provinceAcc], deutan: s('deutan'), protan: s('protan'), tritan: s('tritan'), provinces: r.normal.lightness.provinces, missed: r.normal.lightness.missed, missedU: r.normal.unexplored.missed };
    console.log(which, v, JSON.stringify(out[v]));
  }
  fs.writeFileSync(`${OUT}readers-${which}-dpr${dpr}.json`, JSON.stringify(out, null, 1)); console.log('pageErrors', log.pageErrors.length);
  await b.close();
})();

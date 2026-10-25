// the page's lightness-only terrain readers at every zoom band: node readers2.cjs <now|before>
const { launch, open, ev, PAGE, BEFORE, OUT } = require('./lib.cjs'); const fs = require('fs');
const which = process.argv[2] || 'now';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, which === 'now' ? PAGE : BEFORE, { log, settle: 1500 }); await p.mouse.move(720, 895); const out = {};
  for (const [v, src] of [['min', 'm.setScale(m.minScale(), 800, 500)'], ['far60', 'm.setScale(60 / m.ev("MED_DIAM"), 800, 500)'], ['start', 'm.ev("fit(); draw()")'], ['mid75', 'm.setScale(0.75, 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['midE', 'm.setScale(1.0, 1100, 500)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['refW', 'm.setScale(1.142, 300, 470)'], ['near', 'm.setScale(m.maxScale() * 0.8, 640, 520)'], ['nearMax', 'm.setScale(m.maxScale(), 600, 300)']]) {
    await ev(p, src); await p.waitForTimeout(1600); const r = await ev(p, 'm.reliefNatural(true).readers');
    const s = (k) => r[k] ? [r[k].lightness.patchAcc, r[k].lightness.provinceAcc, r[k].texture.patchAcc, r[k].texture.provinceAcc] : null;
    out[v] = { Dpx: r.Dpx, pass: r.pass, normal: s('normal'), unexplored: r.normal.unexplored ? [r.normal.unexplored.patchAcc, r.normal.unexplored.provinceAcc] : null, deutan: s('deutan'), protan: s('protan'), tritan: s('tritan'), missed: r.normal.lightness.missed, floors: r.floors };
    console.log(which, v, JSON.stringify(out[v])); }
  fs.writeFileSync(`${OUT}readers2-${which}.json`, JSON.stringify(out, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();

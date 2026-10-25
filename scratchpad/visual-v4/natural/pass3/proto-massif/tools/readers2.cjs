// the page's terrain readers (m.reliefNatural(true).readers) at every zoom band, this build or the base: node readers2.cjs [base]
const { launch, open, ev, PAGE, BEFORE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => {
  const base = process.argv[2] === 'base', b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, base ? BEFORE : PAGE, { log, settle: 1500 }); await p.mouse.move(720, 895); const out = {};
  for (const [v, src] of [['far-min', 'm.setScale(m.minScale(), 800, 500)'], ['start', 'm.ev("fit(); draw()")'], ['mid75', 'm.setScale(0.75, 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['nearA', 'm.setScale(m.maxScale() * 0.55, 490, 237)'], ['nearMax', 'm.setScale(m.maxScale(), 600, 450)']]) {
    await ev(p, src); await p.waitForTimeout(1500);
    const r = await ev(p, 'm.reliefNatural(true).readers'); const s = (k) => (r[k] ? [r[k].lightness.patchAcc, r[k].lightness.provinceAcc, r[k].texture.patchAcc, r[k].texture.provinceAcc] : null);
    out[v] = { Dpx: r.Dpx, pass: r.pass, normal: s('normal'), unexplored: r.normal.unexplored ? [r.normal.unexplored.patchAcc, r.normal.unexplored.provinceAcc] : null, deutan: s('deutan'), protan: s('protan'), tritan: s('tritan'), missed: r.normal.lightness.missed };
    console.log(base ? 'base' : 'proto', v, JSON.stringify(out[v]));
  }
  fs.writeFileSync(`${OUT}readers-${base ? 'base' : 'proto'}.json`, JSON.stringify(out, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close();
})();

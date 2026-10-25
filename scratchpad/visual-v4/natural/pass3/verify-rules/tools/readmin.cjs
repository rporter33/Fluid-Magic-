// the page's own terrain readers at the least zoom and at Fit (natural): node readmin.cjs [pagefile]
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(); const p = await open(b, process.argv[2] || PAGE, { settle: 1500 }); await p.mouse.move(720, 20); const out = {};
  for (const [v, src] of [['least', 'm.setScale(m.minScale(), 800, 500)'], ['fit', 'm.setScale(m.fitScale(), 800, 500)']]) { await ev(p, src); await p.waitForTimeout(1500); const r = await ev(p, 'm.reliefNatural(true).readers'); out[v] = r;
    console.log(v, 'pass', r.pass, JSON.stringify({ N: [r.normal.lightness.patchAcc, r.normal.lightness.provinceAcc, r.normal.lightness.missed], unexplored: [r.normal.unexplored.patchAcc, r.normal.unexplored.provinceAcc], D: [r.deutan.texture.patchAcc, r.deutan.texture.provinceAcc], T: [r.tritan.texture.patchAcc, r.tritan.texture.provinceAcc], P: [r.protan.texture.patchAcc, r.protan.texture.provinceAcc] })); }
  fs.writeFileSync(OUT + 'readmin' + (process.argv[2] ? '-bf' : '') + '.json', JSON.stringify(out, null, 1)); await b.close(); })();

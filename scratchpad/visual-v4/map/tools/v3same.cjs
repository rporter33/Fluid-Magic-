// node v3same.cjs <orig.html> <v4.html>: Painted (v3) against the original page, step by step: the map canvas hash, the v3 checks, the outliner and panel text
const { launch, open } = require('./lib.cjs');
const [orig, v4] = process.argv.slice(2);
const HASH = `(() => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; })()`;
const steps = [
  ['start', null],
  ['month40', (m) => m.setMonth(40)],
  ['month70', (m) => m.setMonth(70)],
  ['month3', (m) => m.setMonth(3)],
  ['dominion', (m) => m.ev(`document.querySelector('.modebtn[data-m="dominion"]').click()`)],
  ['ownership', (m) => m.ev(`document.querySelector('.modebtn[data-m="ownership"]').click()`)],
  ['zoomMid', (m) => m.zoomTo(1.0, 'Varo' in {} ? 'x' : m.ev('names[prov.findIndex((p) => p.cap)]'))],
  ['near', (m) => m.zoomTo(m.maxScale() * 0.9, m.ev('names[prov.findIndex((p) => p.cap)]'))],
  ['supply', (m) => m.ev(`document.querySelector('.modebtn[data-m="supply"]').click()`)],
  ['own2', (m) => m.ev(`document.querySelector('.modebtn[data-m="ownership"]').click()`)],
  ['hoverSel', (m) => m.ev(`hoverProv = names.indexOf('Tormere'); state.sel = { type: 'prov', id: names.indexOf('Ashfen') }; draw()`)],
  ['fit', (m) => m.ev('hoverProv = -1; state.sel = null; fitToCloth(); draw()')],
];
(async () => {
  const b = await launch(), e1 = [], e2 = [];
  const A = await open(b, orig, 1440, 780, '', e1, { v3: true, settle: 1500 }), B = await open(b, v4, 1440, 780, process.env.Q ?? '?look=v3', e2, { v3: true, settle: 1500 });
  if (process.env.RM) for (const P of [A, B]) await P.evaluate(() => window.__mock.ev('view.reduced = true; ANIM.clear(); draw()'));
  const rows = [];
  for (const [name, f] of steps) {
    const r = [];
    for (const P of [A, B]) {
      if (f) await P.evaluate(`(${f.toString()})(window.__mock)`); await P.waitForTimeout(+(process.env.WAIT ?? 500)); await P.evaluate(() => window.__mock.ev('CK = null; draw()'));
      r.push(await P.evaluate((H) => ({ h: window.__mock.ev(H), outl: (document.querySelector('.outliner, #outliner')?.innerText ?? '').length, s: +window.__mock.scale().toFixed(4) }), HASH));
    }
    rows.push([name, r[0].h === r[1].h ? 'same' : 'DIFF', r[0], r[1]]);
  }
  const strip = () => { const c = window.__mock.checks(); delete c.bakes; return JSON.stringify(c); }, c1 = await A.evaluate(strip), c2 = await B.evaluate(strip);
  for (const r of rows) console.log(JSON.stringify(r));
  console.log('v3 checks equal:', c1 === c2); if (c1 !== c2) { console.log(c1.slice(0, 600)); console.log(c2.slice(0, 600)); }
  console.log('errors', JSON.stringify(e1), JSON.stringify(e2)); await b.close();
})();

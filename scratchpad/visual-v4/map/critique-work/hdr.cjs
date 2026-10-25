// the header and map canvas rects: the original v3 page, v4 opened on Painted (v3), v4 switched to it at run time (1440 x 900)
const { launch, open } = require('../tools/lib.cjs');
const [orig, v4] = process.argv.slice(2);
(async () => {
  const b = await launch(), e = [];
  const rect = (P) => P.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(), h = document.querySelector('.page-head').getBoundingClientRect(); return { head: Math.round(h.height), map: [r.top, r.height].map(Math.round), s: +window.__mock.scale().toFixed(4) }; });
  const A = await open(b, orig, 1440, 900, '', e, { v3: true, settle: 1200 }); console.log('original', JSON.stringify(await rect(A)));
  const B = await open(b, v4, 1440, 900, '?look=v3', e, { v3: true, settle: 1200 }); console.log('v4 ?look=v3', JSON.stringify(await rect(B)));
  const C = await open(b, v4, 1440, 900, '', e); await C.evaluate(() => window.__mock.setView('look', 'v3')); await C.waitForTimeout(2500); console.log('v4 switched', JSON.stringify(await rect(C)));
  console.log('errors', JSON.stringify(e)); await b.close();
})();

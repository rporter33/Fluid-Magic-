const { launch, open } = require('../tools/lib.cjs');
const [orig, v4] = process.argv.slice(2);
(async () => {
  const b = await launch(), e = [];
  const m = (P) => P.evaluate(() => { const q = (s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return [+r.top.toFixed(2), +r.height.toFixed(2)]; }; const grps = [...document.querySelectorAll('#mockctl > .grp')].filter((g) => g.offsetParent).map((g) => { const r = g.getBoundingClientRect(); return [g.textContent.trim().slice(0, 12), +r.top.toFixed(1), +r.height.toFixed(1)]; }); return { row1: q('.page-head .row1'), headmore: q('#headMore'), inner: q('#headMore .inner'), mockctl: q('#mockctl'), grps }; });
  const A = await open(b, orig, 1440, 900, '', e, { v3: true, settle: 800 }); console.log('original', JSON.stringify(await m(A)));
  const B = await open(b, v4, 1440, 900, '?look=v3', e, { v3: true, settle: 800 }); console.log('v4 ?look=v3', JSON.stringify(await m(B)));
  await b.close();
})();

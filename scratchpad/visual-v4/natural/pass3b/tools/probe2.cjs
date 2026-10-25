const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 1500 });
  for (const M of [0, 40, 70]) {
    if (M) await ev(p, `m.setMonth(${M})`); await p.waitForTimeout(800);
    const r = await mev(p, `WILDS.map(w => ({ w: w.name, nb: [...new Set(rlWildOutline(w).map(e=>e.j))].map(j => names[j] + ':' + (fogOf(j)||'-') + ':' + (prov[j].owner||'') + ':' + rlWashOf(j, true).toFixed(3) + ':' + terr[j]) }))`);
    console.log('month', M, JSON.stringify(r));
  }
  const g = await mev(p, `({ grey: WILDS[2].cells.map(c => bboxOf(cells[c])), ash: WILDS[0].cells.map(c => bboxOf(cells[c])), seats: ['Karreach','Halevale','Wyrholt'].map(n => { const i = names.indexOf(n); return [n, cent[i]]; }), cap: cent[redCap] })`);
  console.log(JSON.stringify(g));
  await b.close();
})();

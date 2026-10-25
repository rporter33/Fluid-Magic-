const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs');
(async () => { const b = await launch(); const log = { pageErrors: [] };
  const p = await open(b, PAGE, { log });
  const r = await mev(p, `({ s: cam.s, min: minScale, max: maxScale, fit: fitScale, D: MED_DIAM, wilds: WILDS.map((w) => ({ id: w.id, name: w.name, kind: w.kind, cells: w.cells, c: (() => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [x / w.cells.length, y / w.cells.length]; })(), bb: (() => { let a=1e9,b=1e9,c=-1e9,d=-1e9; for (const k of w.cells) for (const q of cells[k]) { a=Math.min(a,q[0]);b=Math.min(b,q[1]);c=Math.max(c,q[0]);d=Math.max(d,q[1]); } return [a,b,c,d].map(Math.round); })() })), view: viewRect() })`).catch(async (e) => ({ err: String(e), keys: await mev(p, 'Object.keys(WILDS[0])') }));
  console.log(JSON.stringify(r)); console.log('pageErrors', log.pageErrors); await b.close(); })();

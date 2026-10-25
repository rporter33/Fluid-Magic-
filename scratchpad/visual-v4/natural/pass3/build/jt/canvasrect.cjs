const { launch, open, mev, PAGES } = require('./lib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGES.p2, { settle: 300 });
  console.log(await mev(p, `JSON.stringify({ r: canvas.getBoundingClientRect(), id: canvas.id, cw: canvas.width, ch: canvas.height, vr: viewRect() })`)); await b.close(); })();

// the start view at 1280x720 and 1920x1080: m.reliefStartClear() and a shot
const { launch, open, ev, PAGE, OUT } = require('./lib.cjs');
(async () => {
  const b = await launch();
  for (const [w, h] of [[1280, 720], [1920, 1080]]) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, w, h, settle: 1500 }); await p.mouse.move(w / 2, h - 4);
    const r = await ev(p, 'm.reliefStartClear()'); console.log(w + 'x' + h, JSON.stringify(r), 'pageErrors', log.pageErrors.length);
    await p.screenshot({ path: `${OUT}start-${w}x${h}.png` }); await p.context().close(); }
  await b.close();
})();

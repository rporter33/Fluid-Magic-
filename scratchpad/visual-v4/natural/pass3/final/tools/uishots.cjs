// shots of the views the UI probe flagged: node uishots.cjs
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs');
(async () => { const b = await launch();
  for (const [w, h, list] of [[1440, 900, [['ref-800-500', 1.142, 800, 500], ['ref-800-100', 1.142, 800, 100]]], [390, 844, [['fit-480-500', 'fit', 480, 500], ['fit-128-500', 'fit', 128, 500], ['fit-800-500', 'fit', 800, 500]]]]) {
    const p = await open(b, PAGE, { w, h, settle: 1000 }); await p.mouse.move(w / 2, 10);
    for (const [nm, s, x, y] of list) { await ev(p, `m.setScale(${s === 'fit' ? 'm.fitScale()' : s}, ${x}, ${y})`); await p.waitForTimeout(900); await p.screenshot({ path: `${SHOTS}uiflag-${w}x${h}-${nm}.png` }); }
    await p.context().close(); }
  await b.close(); })();

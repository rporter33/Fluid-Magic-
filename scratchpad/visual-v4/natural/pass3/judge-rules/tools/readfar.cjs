// the page's lightness-only terrain readers at the far zooms (least zoom, 60 px a province) and the start: node readfar.cjs <page>
const { launch, open, ev, page } = require('./lib.cjs');
const PN = process.argv[2];
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, page(PN), { log, settle: 1500, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
  for (const [v, src] of [['min', 'm.setScale(m.minScale(), 800, 500)'], ['far60', "m.setScale(60 / m.ev('MED_DIAM'), 800, 500)"], ['start', 'm.ev("fit(); draw()")']]) {
    await ev(p, src); await p.waitForTimeout(1800); const R = await ev(p, 'm.reliefNatural(true).readers');
    const f = (x) => x ? [x.patchAcc, x.provinceAcc, x.missed.join('; ')] : null;
    console.log(PN, v, 'pass', R.pass, 'lightness', JSON.stringify(f(R.normal.lightness)), 'texture', JSON.stringify(f(R.normal.texture)), 'unexplored', JSON.stringify(f(R.normal.unexplored))); }
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();

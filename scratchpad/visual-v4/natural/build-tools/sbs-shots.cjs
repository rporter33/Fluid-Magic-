// side-by-side sources (look only): Natural and Clear at the reference zooms, nothing selected, pointer off the map
const { launch, open, PAGE, OUT, realErrors } = require('./nlib.cjs');
(async () => {
  const b = await launch(), errors = [];
  for (const [look, q] of [['natural', ''], ['clear', '?terrain=clear']]) {
    const p = await open(b, PAGE, { errors, settle: 1800, reducedMotion: 'reduce', q }); const m = (s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
    await m('m.ev("clearSel(); closeAll(); draw()")'); await p.mouse.move(5, 880);
    await m('m.setScale(1.0, 560, 430)'); await p.waitForTimeout(1300); await p.screenshot({ path: `${OUT}sbs-${look}-a.png` });
    await m('m.setScale(1.45, 600, 330)'); await p.waitForTimeout(1300); await p.screenshot({ path: `${OUT}sbs-${look}-b.png` });
    console.log(look, await m('JSON.stringify(m.look())'));
    await p.context().close();
  }
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

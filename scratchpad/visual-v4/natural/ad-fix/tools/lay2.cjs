// the critique's busyness views on a page (all layers, and the land alone): node lay2.cjs <tag> [page]
const { launch, open, PAGE, realErrors } = require('./nlib2.cjs');
const OUT = __dirname + '/../shots-dev/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [], tag = process.argv[2] || 'new', file = process.argv[3] || PAGE;
  const p = await open(b, file, { errors, settle: 1500, reducedMotion: 'reduce' });
  await p.mouse.move(700, 880);
  const views = { start: 'm.ev("fit(); draw()")', mid: 'm.setScale(1.0, 640, 480)', mid075: 'm.setScale(0.75, 760, 480)', refC: 'm.setScale(1.142, 700, 560)', refW: 'm.setScale(1.142, 400, 420)', near: 'm.zoomTo(m.maxScale()*0.85, "Kharnath")' };
  for (const [vn, vs] of Object.entries(views)) {
    await ev(p, vs); await p.waitForTimeout(500);
    for (const [k, skip] of [['all', ''], ['landonly', "SKIP.add('labels'); SKIP.add('pieces'); SKIP.add('rails');"]]) {
      await ev(p, `m.ev(${JSON.stringify(`SKIP.delete('labels'); SKIP.delete('pieces'); SKIP.delete('rails'); ${skip} RCK = null; draw(); 'ok'`)})`); await p.waitForTimeout(500);
      await p.screenshot({ path: `${OUT}L-${tag}-${vn}-${k}.png` });
    }
    await ev(p, `m.ev("SKIP.delete('labels'); SKIP.delete('pieces'); SKIP.delete('rails'); RCK = null; draw(); 'ok'")`);
    console.log('shot', vn);
  }
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();

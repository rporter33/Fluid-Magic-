// before / after views for the critique's comparisons: the start view, the reference's zoom (200 px a province) at Tormere and Elmgate, Halebrook at 260,
// Kharnath at 420 (Near), the model fully leaned back (the cliff). Prints each view's land box and block size for review/patchiness.py.
const { launch, open } = require('../tools/lib.cjs');
const [file, tag] = process.argv.slice(2), OUT = __dirname + '/after';
(async () => {
  const b = await launch(), errors = [], boxes = {};
  const page = await open(b, file, 1440, 900, '', errors);
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  const land = () => page.evaluate(() => { const m = window.__mock, cr = m.ev('canvas.getBoundingClientRect()'), [x0, y0] = m.ev('toScreen(0, 0)'), [x1, y1] = m.ev('toScreen(W, H)'), v = m.ev('viewRect()'); return { model: [cr.left + x0, cr.top + y0, cr.left + x1, cr.top + y1].map(Math.round), view: [cr.left + v.l, cr.top + v.t, cr.left + v.r, cr.top + v.b].map(Math.round), Dpx: +m.ev('rlDpx()').toFixed(1) }; });
  await page.mouse.move(5, 880); await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${tag}-start.png` }); boxes.start = await land();
  const fit = await mock('fitScale'), d0 = await mock('rlDpx()');
  for (const [nm, dpx, dy] of [['Tormere', 200, 0], ['Elmgate', 200, 0], ['Halebrook', 260, -20], ['Kharnath', 420, 0]]) {
    await page.evaluate(([nm, s, dy]) => { const m = window.__mock; const c = m.ev('cent')[m.ev('names').indexOf(nm)]; m.setScale(s, c[0], c[1] + dy); }, [nm, fit * dpx / d0, dy]);
    await page.mouse.move(5, 880); await page.waitForTimeout(900);
    const L = await land(), cy = Math.round((L.view[1] + L.view[3]) / 2), clip = { x: 17, y: cy - 266, width: 1356, height: 533 };
    await page.screenshot({ path: `${OUT}/${tag}-${nm}-${dpx}.png`, clip }); boxes[nm] = { ...L, clip: [clip.x, clip.y, clip.width, clip.height], band: await mock('bandOf(cam.s)') };
  }
  await page.evaluate(() => { const m = window.__mock; m.setScale(m.minScale(), 800, 560); }); await page.mouse.move(5, 880); await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${tag}-far.png` }); boxes.far = await land();
  console.log(JSON.stringify(boxes)); console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

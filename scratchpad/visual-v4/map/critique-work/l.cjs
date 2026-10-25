// critique pass L: a view at the reference's zoom (about 200 px per province) in two places, without the mockup panels in frame
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  const fit = await mock('fitScale'), d0 = await mock('rlDpx()');
  for (const [nm, dpx, dy] of [['Tormere', 200, 0], ['Elmgate', 200, 0], ['Halebrook', 260, -20]]) {
    await page.evaluate(([nm, s, dy]) => { const m = window.__mock; const c = m.ev('cent')[m.ev('names').indexOf(nm)]; m.setScale(s, c[0], c[1] + dy); }, [nm, fit * dpx / d0, dy]);
    await page.mouse.move(5, 880); await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/l-${nm}-${dpx}.png`, clip: { x: 17, y: 202, width: 1356, height: 533 } });
    console.log(nm, 'Dpx', await mock('rlDpx().toFixed(0)'), 'band', await mock('bandOf(cam.s)'));
  }
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

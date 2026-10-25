// AD review session 1: 1440x900 dpr1, natural, live motion: start, hover, select, move, zoom out to table, far, ref zoom, near tour
const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const OUT = process.env.OUTD || (__dirname + '/../shots-dev/');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 2000 });
  const shot = async (n, wait = 900, clip) => { await p.waitForTimeout(wait); await p.screenshot({ path: OUT + n + '.png', clip }); console.log('shot', n); };
  await shot('a01-start');
  // hover a province
  let [x, y] = await ev(p, 'm.at("Redholt")'); await p.mouse.move(x + 10, y + 12); await shot('a02-hover-redholt', 1400);
  [x, y] = await ev(p, 'm.at("Ashmoor")'); await p.mouse.move(x - 20, y + 20); await shot('a03-hover-ashmoor', 1400);
  // click a province to select
  await p.mouse.click(x - 20, y + 20); await shot('a04-select-ashmoor', 1200);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  // select Varo's piece and move
  const pv = await ev(p, 'm.pieceAt("varo")'); console.log('varo', pv);
  if (pv) { await p.mouse.click(pv[0], pv[1]); await shot('a05-select-varo', 1000); }
  const tgt = await ev(p, 'm.across()'); console.log('across', tgt);
  [x, y] = await ev(p, `m.at(${JSON.stringify(tgt || 'Ashmoor')})`); await p.mouse.move(x, y); await shot('a06-target-hover', 1000);
  await p.mouse.click(x, y, { button: 'right' }); await shot('a07-moved', 1200);
  await p.mouse.move(200, 880);
  // wheel out to the table
  await p.mouse.move(720, 430);
  for (let k = 0; k < 12; k++) { await p.mouse.wheel(0, 240); await p.waitForTimeout(80); }
  await shot('a08-wheel-out-table', 1500);
  console.log('scale after wheel', await ev(p, 'm.scale()'), await ev(p, 'm.band()'));
  await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await shot('a09-min');
  await ev(p, 'm.setScale(0.4, 800, 520)'); await shot('a10-far04');
  await ev(p, 'm.setScale(1.142, 700, 560)'); await shot('a11-ref-zoom-centre');
  await ev(p, 'm.setScale(1.142, 400, 420)'); await shot('a12-ref-zoom-west');
  await ev(p, 'm.setScale(1.142, 1200, 450)'); await shot('a13-ref-zoom-east');
  await ev(p, 'm.setScale(1.142, 800, 800)'); await shot('a14-ref-zoom-south');
  for (const n of ['Redholt', 'Kharnath', 'Briardale', 'Halegate', 'Morholt', 'Wyrford', 'Ashmoor', 'Elmcrag', 'Thornwick', 'Deepmoss']) { await ev(p, `m.zoomTo(m.maxScale()*0.85, ${JSON.stringify(n)})`); await shot('a2-near-' + n, 1000); }
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();

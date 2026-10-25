// AD review session 3: dpr 2 detail (hamlets, hairlines, cliff, ponds, rock specks, a wild, figures), and window sizes
const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const OUT = __dirname + '/../shots/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  let p = await open(b, PAGE, { errors, settle: 1500, reducedMotion: 'reduce', dpr: 2 });
  const shot = async (n, clip, wait = 900) => { await p.waitForTimeout(wait); await p.screenshot({ path: OUT + n + '.png', clip }); console.log('shot', n); };
  await p.mouse.move(700, 880);
  await shot('c01-start-dpr2-west', { x: 258, y: 150, width: 440, height: 300 });
  await shot('c02-start-dpr2-centre', { x: 600, y: 300, width: 440, height: 300 });
  await shot('c03-start-dpr2-cliff', { x: 258, y: 600, width: 520, height: 140 });
  await ev(p, 'm.setScale(1.142, 700, 560)');
  await shot('c04-ref-dpr2-hamlets', { x: 520, y: 240, width: 420, height: 300 });
  await shot('c05-ref-dpr2-kharnath', { x: 40, y: 380, width: 420, height: 320 });
  await shot('c06-ref-dpr2-greyteeth', { x: 500, y: 380, width: 280, height: 350 });
  await ev(p, 'm.zoomTo(m.maxScale()*0.85, "Kharnath")');
  await shot('c07-near-dpr2-kharnath', { x: 560, y: 360, width: 300, height: 220 });
  await shot('c08-near-dpr2-pond', { x: 700, y: 600, width: 300, height: 130 });
  await ev(p, 'm.zoomTo(m.maxScale()*0.85, "Halegate")');
  await shot('c09-near-dpr2-hills', { x: 560, y: 380, width: 320, height: 220 });
  await ev(p, 'm.zoomTo(m.maxScale()*0.85, "Torbarrow")');
  await shot('c10-near-dpr2-farm', { x: 500, y: 300, width: 400, height: 300 });
  await ev(p, 'm.zoomTo(m.maxScale()*0.85, "Marholt")');
  await shot('c11-near-dpr2-swamp', { x: 500, y: 300, width: 400, height: 300 });
  await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await shot('c12-min-dpr2-cliff', { x: 430, y: 520, width: 540, height: 120 });
  await p.context().close();
  for (const [w, h, n] of [[1280, 720, 'c20-1280x720'], [1920, 1080, 'c21-1920x1080'], [1024, 768, 'c22-1024x768']]) { p = await open(b, PAGE, { errors, settle: 1500, w, h }); console.log(n, await ev(p, '[m.scale(), m.band()]')); await p.screenshot({ path: OUT + n + '.png' }); await p.context().close(); }
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();

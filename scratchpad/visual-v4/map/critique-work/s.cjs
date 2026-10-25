// critique pass S: does 'low' smoothing on the upscaled bake change the Near picture? (pixel difference) and the start-view re-render split
const { launch, open } = require('../tools/lib.cjs');
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const ev = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  const grab = () => ev(`(() => { RCK = null; draw(); return Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data); })()`);
  const time = () => page.evaluate(() => { const m = window.__mock; const r = []; for (let k = 0; k < 6; k++) { const t0 = performance.now(); m.ev('RCK = null; draw()'); r.push(performance.now() - t0); } r.sort((a, b) => a - b); return +r[3].toFixed(1); });
  console.log('start as built', await time());
  await page.evaluate(() => { const m = window.__mock; m.setScale(m.maxScale() * 0.9, 800, 500); }); await page.mouse.move(5, 890);
  const A = await grab();
  await ev(String.raw`(() => { let s = rlRenderStatic.toString(); s = s.replace("g.imageSmoothingQuality = 'high';", "g.imageSmoothingQuality = tpp < 1 ? 'low' : 'high';"); rlRenderStatic = eval('(' + s + ')'); return 1; })()`);
  const B = await grab(); let sum = 0, mx = 0, n = 0; for (let k = 0; k < A.length; k += 4) for (let c = 0; c < 3; c++) { const d = Math.abs(A[k + c] - B[k + c]); sum += d; if (d > mx) mx = d; n++; }
  console.log('near high vs low upscale: mean abs diff', (sum / n).toFixed(3), 'max', mx);
  await ev('fitToCloth(); RCK = null; draw()'); console.log('start with the change', await time());
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

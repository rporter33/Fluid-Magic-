// critique pass R: what the static re-render spends at Near, by switching parts off (in memory; shared machine, noisy)
const { launch, open } = require('../tools/lib.cjs');
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const ev = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  await page.evaluate(() => { const m = window.__mock; m.setScale(m.maxScale() * 0.9, 800, 500); });
  const time = () => page.evaluate(() => { const m = window.__mock; const r = []; for (let k = 0; k < 6; k++) { const t0 = performance.now(); m.ev('RCK = null; draw()'); r.push(performance.now() - t0); } r.sort((a, b) => a - b); return +r[3].toFixed(1); });
  console.log('near as built (median of 6)', await time());
  await ev(String.raw`(() => { let s = rlRenderStatic.toString(); s = s.replace("g.imageSmoothingQuality = 'high';", "g.imageSmoothingQuality = tpp < 1 ? 'low' : 'high';"); rlRenderStatic = eval('(' + s + ')'); return 1; })()`);
  console.log('near, low smoothing when upscaling', await time());
  await ev(String.raw`(() => { let s = rlRenderStatic.toString(); s = s.replace("g.globalCompositeOperation = 'saturation';", "g.globalCompositeOperation = 'source-over'; if (0)"); rlRenderStatic = eval('(' + s + ')'); return 1; })()`);
  console.log('near, plus no saturation pass', await time());
  await ev('SKIP.add("pieces"); SKIP.add("labels")'); console.log('near, plus no pieces and labels', await time());
  await ev('SKIP.add("rails")'); console.log('near, plus no rails', await time());
  console.log('cache size px', await ev('[rlU.width, rlU.height]'), 'dpr', await ev('dpr'));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

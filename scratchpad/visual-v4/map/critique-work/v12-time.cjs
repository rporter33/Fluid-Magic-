// fix 12: the static re-render at Near (median of 7) and a fast pan at Near, for each page given (shared machine, headless software raster: noisy)
const { launch, open } = require('../tools/lib.cjs');
(async () => {
  const b = await launch(), errors = [];
  for (let round = 0; round < 2; round++) for (const file of process.argv.slice(2)) {
    const page = await open(b, file, 1440, 900, '', errors);
    await page.evaluate(() => { const m = window.__mock; m.setScale(m.maxScale() * 0.9, 800, 500); }); await page.mouse.move(5, 890);
    const med = await page.evaluate(() => { const m = window.__mock; const r = []; for (let k = 0; k < 7; k++) { const t0 = performance.now(); m.ev('RCK = null; draw()'); r.push(performance.now() - t0); } r.sort((a, b) => a - b); return +r[3].toFixed(1); });
    const pan = await page.evaluate(() => window.__mock.panStats(25, 90));
    console.log(`round ${round} ${file.split('/').pop()}: near static re-render median ${med} ms; fast pan at Near ${JSON.stringify(pan)}`);
    await page.close();
  }
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

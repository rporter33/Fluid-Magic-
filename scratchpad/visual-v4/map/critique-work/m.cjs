// critique pass M: pan frame times at the start view and at Near (shared machine: noisy), and a long drag across the model at Near
const { launch, open } = require('../tools/lib.cjs');
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  console.log('start pan', JSON.stringify(await page.evaluate(() => window.__mock.panStats(3, 90))));
  await page.evaluate(() => { const m = window.__mock; m.setScale(m.maxScale() * 0.9, 800, 500); });
  console.log('near pan small', JSON.stringify(await page.evaluate(() => window.__mock.panStats(3, 90))));
  console.log('near pan fast', JSON.stringify(await page.evaluate(() => window.__mock.panStats(25, 90))));
  console.log('static renders', JSON.stringify(await page.evaluate(() => window.__mock.ev('({ n: RREB.n, ms: +(RREB.ms / RREB.n).toFixed(1) })'))));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

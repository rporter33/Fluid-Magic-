// critique pass A: real wheel zoom, drag pan, hover, timings
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const t0 = Date.now();
  const page = await open(b, FILE, 1440, 900, '', errors);
  console.log('ready after ms', Date.now() - t0);
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  const info = async () => page.evaluate(() => ({ s: window.__mock.scale(), band: window.__mock.band(), fit: window.__mock.fitScale(), min: window.__mock.minScale(), max: window.__mock.maxScale() }));
  console.log('start', JSON.stringify(await info()));
  await shot('a01-start');
  // wheel out fully at the centre
  await page.mouse.move(700, 470);
  for (let k = 0; k < 12; k++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(80); }
  await page.waitForTimeout(900); console.log('out', JSON.stringify(await info())); await shot('a02-wheel-out');
  // wheel in step by step; shoot at each band
  let lastBand = '';
  for (let k = 0; k < 40; k++) { await page.mouse.wheel(0, -200); await page.waitForTimeout(120); const i = await info(); if (i.band !== lastBand) { await page.waitForTimeout(700); await shot(`a03-wheel-in-${k}-${i.band}`); console.log('band', k, JSON.stringify(i)); lastBand = i.band; } }
  await page.waitForTimeout(900); console.log('in', JSON.stringify(await info())); await shot('a04-wheel-in-max');
  // drag pan at near
  await page.mouse.move(700, 470); await page.mouse.down({ button: 'left' }); for (let k = 0; k < 20; k++) { await page.mouse.move(700 - k * 15, 470 - k * 6); await page.waitForTimeout(16); } await page.mouse.up({ button: 'left' });
  await page.waitForTimeout(900); await shot('a05-near-pan');
  // press Z to return
  await page.keyboard.press('z'); await page.waitForTimeout(900); console.log('after Z', JSON.stringify(await info())); await shot('a06-after-z');
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

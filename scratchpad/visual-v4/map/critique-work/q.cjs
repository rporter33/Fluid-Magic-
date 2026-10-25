// critique pass Q: the start view with the mockup's controls folded and the Try-this list hidden (in memory): map height and px per province
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const m = () => page.evaluate(() => ({ mapH: Math.round(document.getElementById('map').getBoundingClientRect().height), Dpx: +window.__mock.ev('rlDpx()').toFixed(1) }));
  console.log('as built', JSON.stringify(await m()));
  await page.evaluate(() => { document.getElementById('headMore').open = false; document.getElementById('tryListRelief').style.display = 'none'; window.dispatchEvent(new Event('resize')); });
  await page.waitForTimeout(500); await page.evaluate(() => window.__mock.ev('layout(); fitToCloth(); RCK = null; draw()')); await page.waitForTimeout(900);
  console.log('folded', JSON.stringify(await m()));
  await page.mouse.move(5, 890); await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/q-start-folded.png` });
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

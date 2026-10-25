// critique pass G: Near on the wilds and towns; Mid on hamlets; dpr 2 at start
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  console.log('MED_DIAM', await mock('MED_DIAM'), 'RLK', await mock('RLK'), 'W,H', await mock('[W,H]'), 'Dpx start', await mock('rlDpx()'));
  const z = async (s, name, dy = 0) => { await page.evaluate(([s, name, dy]) => { const m = window.__mock; const i = m.ev('names').indexOf(name); const c = m.ev('cent')[i]; m.setScale(s === 'max' ? m.maxScale() : s, c[0], c[1] + dy); }, [s, name, dy]); await page.mouse.move(5, 880); await page.waitForTimeout(900); };
  await z('max', 'Ashfen', -40); await shot('g01-near-ashspine-south'); console.log('Dpx', await mock('rlDpx()'));
  await z('max', 'Marholt', 0); await shot('g02-near-greyteeth');
  await z(1.6, 'Kharnath', 0); await shot('g03-near16-kharnath');
  await z(1.6, 'Ashmoor', 0); await shot('g04-near16-ashmoor');
  await z(0.7, 'Elmwick', 0); await shot('g05-mid07-centre'); console.log('Dpx mid', await mock('rlDpx()'));
  await page.close();
  const p2 = await open(b, FILE, 1440, 900, '', errors, { dpr: 2 });
  await p2.mouse.move(5, 880); await p2.waitForTimeout(600); await p2.screenshot({ path: `${OUT}/g10-start-dpr2.png` });
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

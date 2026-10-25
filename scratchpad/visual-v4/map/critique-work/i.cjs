// critique pass I: the planned path through the time-lapse (relief and v3); the path label on a 1280 resize
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  for (const q of ['', '?look=v3']) {
    const page = await open(b, FILE, 1440, 900, q, errors, { settle: q ? 4000 : 900 });
    const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
    const across = await page.evaluate(() => window.__mock.across()); const [x, y] = await page.evaluate((nm) => window.__mock.at(nm), across);
    await page.mouse.click(x, y, { button: 'right' }); await page.waitForTimeout(700);
    console.log(q || 'relief', 'm3 varo at', await mock('names[cmd.varo.at]'), 'moveLine', await mock('moveLine && [names[moveLine.from], moveLine.path.map((i)=>names[i]).join(">"), moveLine.days]'));
    await page.evaluate(() => window.__mock.setMonth(40)); await page.waitForTimeout(1500);
    console.log(q || 'relief', 'm40 varo at', await mock('names[cmd.varo.at]'), 'order', await mock('cmd.varo.order'), 'moveLine', await mock('moveLine && [names[moveLine.from], moveLine.path.map((i)=>names[i]).join(">"), moveLine.days]'));
    await page.screenshot({ path: `${OUT}/i-${q ? 'v3' : 'relief'}-m40-path.png` });
    await page.close();
  }
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

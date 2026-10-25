// node interact.cjs <html> <outDir>: hover, link hover, selection + move path, wild hover, modes, Shift names, numbers, time-lapse
const { launch, open } = require('./lib.cjs'); const fs = require('fs');
const [file, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await launch(), errors = [];
  let page = await open(b, file, 1440, 900, '', errors);
  const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
  const at = (n) => page.evaluate((nm) => window.__mock.at(nm), n);
  await page.evaluate(() => window.__mock.zoomTo(0.9, 'Ashfen')); await page.waitForTimeout(600);
  let [x, y] = await at('Kharnath'); await page.mouse.move(x + 30, y - 30); await page.waitForTimeout(900); await shot('hover');
  const across = await page.evaluate(() => window.__mock.across());
  [x, y] = await at(across); await page.mouse.click(x, y, { button: 'right' }); await page.waitForTimeout(700); await shot('path');
  const [wx, wy] = await page.evaluate(() => window.__mock.wildAt('ashspine')); await page.mouse.move(wx, wy); await page.waitForTimeout(1200); await shot('wild');
  await page.mouse.move(700, 880); await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.keyboard.down('Shift'); await page.waitForTimeout(500); await shot('shift'); await page.keyboard.up('Shift');
  await page.keyboard.press('Backquote'); await page.waitForTimeout(500); await shot('numbers'); await page.keyboard.press('Backquote');
  for (const [k, m] of [['Digit2', 'dominion'], ['Digit3', 'supply'], ['Digit4', 'unrest'], ['Digit5', 'population'], ['Digit6', 'springs']]) { await page.keyboard.press('Shift+' + k); await page.waitForTimeout(500); await shot('mode-' + m); }
  await page.keyboard.press('Shift+Digit1'); await page.waitForTimeout(400);
  await page.evaluate(() => window.__mock.setMonth(64)); await page.waitForTimeout(900); await shot('m64');
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

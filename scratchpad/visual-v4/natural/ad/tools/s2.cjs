// AD review session 2: modes by keyboard, Shift names, time-lapse by slider, fog frontier, table off, Clear toggle
const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const OUT = __dirname + '/../shots/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 2000 });
  const shot = async (n, wait = 900, clip) => { await p.waitForTimeout(wait); await p.screenshot({ path: OUT + n + '.png', clip }); console.log('shot', n); };
  await p.mouse.move(700, 870);
  await p.keyboard.press('Escape');
  // Shift names with nothing selected
  await p.keyboard.down('Shift'); await shot('b01-shift-names', 700); await p.keyboard.up('Shift');
  for (let k = 1; k <= 7; k++) { await p.keyboard.press('Shift+Digit' + k); await shot('b1' + k + '-mode', k === 7 ? 1500 : 900); }
  if (!(await ev(p, 'm.look().clear'))) { await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 150000, polling: 300 }); await shot('b17b-mode-terrain-ready', 1200); }
  // hover in terrain mode
  let [x, y] = await ev(p, 'm.at("Marholt")'); await p.mouse.move(x, y + 15); await shot('b18-terrain-hover', 1300);
  await p.mouse.move(700, 870);
  await p.keyboard.press('Shift+Digit1'); await shot('b19-back-ownership', 1200);
  // time-lapse
  for (const mo of [14, 30, 45, 60, 70]) { await p.evaluate((mo) => { const s = document.getElementById('tl'); s.value = mo; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); }, mo); await shot('b2-month' + mo, 1600); }
  await p.evaluate(() => { const s = document.getElementById('tl'); s.value = 3; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1200);
  // fog frontier at ref zoom and near
  await ev(p, 'm.setScale(1.142, 1250, 450)'); await shot('b30-fog-ref');
  await ev(p, 'm.setScale(m.maxScale()*0.9, 1300, 350)'); await shot('b31-fog-near');
  // table off and simple
  await ev(p, 'm.ev("fit(); draw()")');
  await ev(p, 'm.setView("table","off")'); await shot('b40-table-off', 1200);
  await ev(p, 'm.setView("table","simple")'); await shot('b41-table-simple', 1200);
  await ev(p, 'm.setView("table","full")');
  // realm tint on
  await ev(p, 'm.setView("tint","on")'); await shot('b42-tint-on', 1200); await ev(p, 'm.setView("tint","off")');
  // clear via setting
  await ev(p, 'm.setView("terrain","clear")'); await shot('b50-clear-setting', 2000);
  await ev(p, 'm.setScale(1.142, 700, 560)'); await shot('b51-clear-ref');
  await ev(p, 'm.setView("terrain","natural")'); await shot('b52-back-natural', 1500);
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();

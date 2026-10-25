// critique pass B: hover, select army, right-click move, province select, wild hover, stack fan, link hover
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  const at = (n) => page.evaluate((nm) => window.__mock.at(nm), n);
  const names = await mock('names.slice()');
  console.log('names', names.length, names.join(','));
  // zoom to mid ~0.75 around Kharnath by wheel
  let [x, y] = await at('Kharnath');
  await page.mouse.move(x, y); for (let k = 0; k < 3; k++) { await page.mouse.wheel(0, -200); await page.waitForTimeout(150); }
  await page.waitForTimeout(800); console.log('scale', await mock('cam.s'), await mock('bandOf(cam.s)'));
  await shot('b01-mid-kharnath');
  // hover the stack in Kharnath
  const arm = await mock('(() => { const L = RL_PIECE_CACHE.get("L"); const r = canvas.getBoundingClientRect(); return L.armies.map((a) => ({ kind: a.kind, ids: a.ids, x: r.left + a.x + cam.x, y: r.top + a.y + cam.y, figH: a.figH, prov: names[a.prov] })); })()');
  console.log('armies', JSON.stringify(arm));
  const st = arm.find((a) => a.kind === 'stack');
  if (st) { await page.mouse.move(st.x, st.y - st.figH * 0.4); await page.waitForTimeout(900); await shot('b02-stack-fan'); }
  // hover a province (own)
  [x, y] = await at('Oakmoor'); await page.mouse.move(x + 20, y - 30); await page.waitForTimeout(700); await shot('b03-hover-own');
  // hover enemy
  const ownerList = await mock('prov.map((p,i)=>[names[i], p.owner||null, p.terrain])');
  const enemy = ownerList.find((o) => o[1] && o[1] !== ownerList.find((q)=>q[0]==='Kharnath')[1]);
  console.log('enemy prov', JSON.stringify(enemy));
  // select Varo by clicking his piece
  const varo = arm.find((a) => a.ids.includes('varo'));
  if (varo) { await page.mouse.click(varo.x, varo.y - varo.figH * 0.4); await page.waitForTimeout(600); await shot('b04-varo-click'); console.log('sel', await mock('state.sel && JSON.stringify(state.sel)')); }
  // hover a far province to see cursor label
  [x, y] = await at('Stagmoor'); await page.mouse.move(x, y + 15); await page.waitForTimeout(800); await shot('b05-cursor-label');
  // right-click to move
  await page.mouse.click(x, y + 15, { button: 'right' }); await page.waitForTimeout(800); await shot('b06-moved');
  console.log('path', await mock('moveLine && moveLine.path.map((i) => names[i]).join(" > ")'));
  // move pointer away; check stale hover
  await page.mouse.move(700, 880); await page.waitForTimeout(700); await shot('b07-after-move-away');
  // escape
  await page.keyboard.press('Escape'); await page.waitForTimeout(500); await shot('b08-esc');
  // click a province to select
  [x, y] = await at('Fenvale'); await page.mouse.click(x + 10, y + 25); await page.waitForTimeout(700); await shot('b09-select-fenvale');
  // hover another while selected
  [x, y] = await at('Oakmoor'); await page.mouse.move(x - 20, y - 20); await page.waitForTimeout(700); await shot('b10-hover-while-selected');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

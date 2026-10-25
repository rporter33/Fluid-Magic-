// critique pass E: input through army pieces (wheel, right-click, drag, hover)
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  const arm = await mock('(() => { const L = RL_PIECE_CACHE.get("L"); const r = canvas.getBoundingClientRect(); return L.armies.map((a) => ({ kind: a.kind, ids: a.ids, side: cmd[a.ids[0]].side, x: r.left + a.x + cam.x, y: r.top + a.y + cam.y, figH: a.figH, B: a.B, prov: names[a.prov] })); })()');
  console.log(JSON.stringify(arm));
  const boxes = await page.evaluate(() => [...document.querySelectorAll('.mini:not(.fanned)')].map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; }));
  console.log('mini boxes', JSON.stringify(boxes));
  // 1 wheel over the enemy piece (ilsa)
  const ilsa = arm.find((a) => a.ids.includes('ilsa'));
  const s0 = await mock('cam.s'); const sy0 = await page.evaluate(() => [window.scrollY, document.scrollingElement.scrollTop]);
  await page.mouse.move(ilsa.x, ilsa.y - ilsa.figH * 0.5); await page.waitForTimeout(400);
  await page.mouse.wheel(0, -300); await page.waitForTimeout(500);
  console.log('wheel over piece: scale', s0, '->', await mock('cam.s'), 'scroll', JSON.stringify(sy0), '->', JSON.stringify(await page.evaluate(() => [window.scrollY, document.scrollingElement.scrollTop])));
  // 2 hover a province, then slide onto the piece: is the old hover kept?
  await page.mouse.move(ilsa.x + 60, ilsa.y + 40); await page.waitForTimeout(400); const h1 = await mock('names[hoverProv]');
  await page.mouse.move(ilsa.x, ilsa.y - ilsa.figH * 0.5, { steps: 6 }); await page.waitForTimeout(500); const h2 = await mock('names[hoverProv]');
  console.log('hover before', h1, 'over piece', h2, 'piece prov', ilsa.prov);
  await shot('e01-hover-onto-piece');
  // 3 right-click the enemy piece (should order an attack/move to Tormere)
  const before = await mock('moveLine ? moveLine.path.map((i) => names[i]).join(">") : null');
  const ev = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); let prevented = null; const h = (e) => { prevented = e.defaultPrevented; }; window.addEventListener('contextmenu', h, { once: true }); el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 })); return { el: el.tagName + '.' + (el.className || el.parentElement.className), prevented }; }, [ilsa.x, ilsa.y - ilsa.figH * 0.5]);
  await page.waitForTimeout(600);
  console.log('right-click on enemy piece', JSON.stringify(ev), 'path before', before, 'after', await mock('moveLine ? moveLine.path.map((i) => names[i]).join(">") : null'));
  // 4 the transparent corner of the piece box: what is under it?
  const bx = await page.evaluate(([x, y]) => { const els = [...document.querySelectorAll('.mini:not(.fanned)')]; for (const e of els) { const b = e.getBoundingClientRect(); if (x > b.left && x < b.right && y > b.top && y < b.bottom) return [b.left, b.top, b.width, b.height]; } return null; }, [ilsa.x, ilsa.y - 10]);
  if (bx) { const cx = bx[0] + 3, cy = bx[1] + 3; const el = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e.tagName + ' ' + (e.parentElement && e.parentElement.className); }, [cx, cy]); const r = await page.evaluate(() => document.getElementById('map').getBoundingClientRect().top); console.log('corner of piece box', cx, cy, 'element', el); }
  // 5 drag starting on a piece
  const cx0 = await mock('cam.x');
  await page.mouse.move(ilsa.x, ilsa.y - 8); await page.mouse.down(); await page.mouse.move(ilsa.x - 120, ilsa.y - 8, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(400);
  console.log('drag from piece: cam.x', cx0, '->', await mock('cam.x'));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

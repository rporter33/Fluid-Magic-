// critique pass H: do the DOM army pieces follow the land during a wheel zoom (the cached fast path)?
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  // where should varo's piece be (from world coords), and where is the DOM element, during a zoom
  const probe = () => page.evaluate(() => { const m = window.__mock; const L = m.ev('RL_PIECE_CACHE.get("L")'); const a = L.armies.find((q) => q.ids.includes('varo')); const ent = m.ev('RL_PIECE_DOM.get("' + a.key + '")'); const cv = ent.cv, r = ent.el.getBoundingClientRect(); const elGround = [r.left + Number(cv.dataset.ox), r.top + Number(cv.dataset.oy)];
    const s = m.ev('cam.s'), sLay = L.key.split('|')[0]; const wx = a.x / Number(sLay), wy = a.y / Number(sLay); const cr = m.ev('canvas.getBoundingClientRect()'); const want = [cr.left + wx * s + m.ev('cam.x'), cr.top + wy * s + m.ev('cam.y')]; return { s: +s.toFixed(3), sLay, el: elGround.map((v) => +v.toFixed(1)), want: want.map((v) => +v.toFixed(1)), off: +Math.hypot(elGround[0] - want[0], elGround[1] - want[1]).toFixed(1) }; });
  const [vx, vy] = await page.evaluate(() => window.__mock.pieceAt('varo'));
  console.log('rest', JSON.stringify(await probe()));
  await page.mouse.move(vx + 150, vy + 80);
  for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(40); }
  const mid = await probe(); await page.screenshot({ path: `${OUT}/h01-mid-zoom.png` });
  console.log('during zoom', JSON.stringify(mid));
  await page.waitForTimeout(600);
  console.log('after settle', JSON.stringify(await probe()));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

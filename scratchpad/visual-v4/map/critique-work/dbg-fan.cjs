const { launch, open } = require('../tools/lib.cjs');
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const info = await page.evaluate(() => { const m = window.__mock; const L = m.ev('RL_PIECE_CACHE.get("L")'); const a = L.armies.find((q) => q.kind === 'stack'); const r = document.getElementById('map').getBoundingClientRect(); const kx = r.left + a.x + m.ev('cam.x'), ky = r.top + a.y + m.ev('cam.y') - 10; const e = document.elementFromPoint(kx, ky); const ent = m.ev('RL_PIECE_DOM.get("' + a.key + '")'); const hb = ent.hit.getBoundingClientRect(), eb = ent.el.getBoundingClientRect(); return { kx, ky, el: e.tagName + '.' + e.className, hit: [hb.left, hb.top, hb.right, hb.bottom].map(Math.round), mini: [eb.left, eb.top, eb.right, eb.bottom].map(Math.round), a: [a.x, a.y, a.figH, a.rx, a.ry], s: [L.s, m.ev('cam.s')] }; });
  console.log(JSON.stringify(info));
  await page.mouse.move(info.kx, info.ky); await page.waitForTimeout(700);
  console.log('fanned', await page.evaluate(() => window.__mock.ev('[...RL_PIECE_DOM.values()].some((e) => e.fanned)')));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();

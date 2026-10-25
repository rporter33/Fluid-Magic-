const { launch, open, PAGE } = require('./vlib.cjs');
(async () => { const b = await launch(), errors = []; const p = await open(b, PAGE, { errors });
  const O = __dirname + '/shots/';
  // link hover: the feed's link names the province on the land
  await p.evaluate(() => document.getElementById('railFeed').click()); await p.waitForTimeout(400);
  const l = await p.evaluate(() => { const e = [...document.querySelectorAll('#msgs .link')].find((x) => x.textContent === 'Tormere'); const r = e.getBoundingClientRect(); return [r.left + 5, r.top + r.height / 2]; });
  await p.mouse.move(l[0], l[1]); await p.waitForTimeout(500); await p.screenshot({ path: O + 'v-link-hover.png' });
  await p.mouse.move(700, 108); await p.evaluate(() => document.getElementById('railFeed').click()); await p.waitForTimeout(400);
  // mid-zoom frame during a wheel gesture
  const [vx, vy] = await p.evaluate(() => window.__mock.pieceAt('varo')); await p.mouse.move(vx + 150, vy + 80); for (let k = 0; k < 6; k++) { await p.mouse.wheel(0, -120); await p.waitForTimeout(30); } await p.screenshot({ path: O + 'v-during-zoom.png' }); await p.waitForTimeout(800); await p.screenshot({ path: O + 'v-after-zoom.png' });
  // the reference's zoom (about 200 px a province) over the middle of the model
  await p.evaluate(() => { const m = window.__mock; const D1 = m.ev('RL_PIECE_CACHE.get("L").Dpx') / m.scale(); m.setScale(200 / D1, 700, 460); }); await p.mouse.move(5, 890); await p.waitForTimeout(800); await p.screenshot({ path: O + 'v-200px.png' });
  await p.evaluate(() => { const m = window.__mock; m.setScale(m.maxScale(), 520, 330); }); await p.waitForTimeout(800); await p.screenshot({ path: O + 'v-max-ashspine.png' });
  await p.evaluate(() => window.__mock.ev('fitToCloth(); draw()')); await p.waitForTimeout(600); await p.screenshot({ path: O + 'v-start.png' });
  await p.context().close();
  const q = await open(b, PAGE, { errors, w: 1366, h: 768 }); await q.screenshot({ path: O + 'v-1366.png' }); await q.context().close();
  console.log('errors', JSON.stringify(errors.filter((x) => !/software WebGL|willReadFrequently/.test(x)))); await b.close(); })();

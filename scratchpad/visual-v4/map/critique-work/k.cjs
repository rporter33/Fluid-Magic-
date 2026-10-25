// critique pass K: Painted (v3) reached by the runtime switch from Relief, against the original page (reduced motion), and leftover relief DOM
const { launch, open } = require('../tools/lib.cjs');
const ORIG = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/ui-mockup/game-screen.html';
const FILE = __dirname + '/../game-screen-v4.html';
const HASH = `(() => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; })()`;
(async () => {
  const b = await launch(), e1 = [], e2 = [];
  const A = await open(b, ORIG, 1440, 780, '', e1, { v3: true, settle: 1500 });
  const B = await open(b, FILE, 1440, 780, '', e2, { settle: 900 });
  // relief: pan and zoom, select a province, then switch to v3 at runtime
  await B.evaluate(() => { const m = window.__mock; m.setScale(1.2, 600, 400); m.ev("state.sel = { type: 'prov', id: names.indexOf('Ashmoor') }; draw()"); });
  await B.waitForTimeout(400);
  await B.evaluate(() => window.__mock.setView('look', 'v3')); await B.waitForTimeout(2500);
  for (const P of [A, B]) await P.evaluate(() => window.__mock.ev("view.reduced = true; ANIM.clear(); state.sel = null; hoverProv = -1; fitToCloth(); draw()"));
  await A.waitForTimeout(1500); await B.waitForTimeout(1500);
  for (const P of [A, B]) await P.evaluate(() => window.__mock.ev('CK = null; draw()'));
  const hA = await A.evaluate((H) => window.__mock.ev(H), HASH), hB = await B.evaluate((H) => window.__mock.ev(H), HASH);
  const leftovers = await B.evaluate(() => ({ minis: document.querySelectorAll('.mini').length, visibleMinis: [...document.querySelectorAll('.mini')].filter((e) => e.offsetParent && getComputedStyle(e).display !== 'none').length }));
  console.log('runtime switch to v3 vs original:', hA === hB ? 'same' : 'DIFF', hA, hB, 'relief DOM pieces left:', JSON.stringify(leftovers));
  await A.screenshot({ path: __dirname + '/shots/k-orig.png' }); await B.screenshot({ path: __dirname + '/shots/k-switched.png' });
  console.log('errors', JSON.stringify(e1), JSON.stringify(e2)); await b.close();
})();

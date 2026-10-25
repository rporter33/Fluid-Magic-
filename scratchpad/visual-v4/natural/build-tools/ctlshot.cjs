// the mockup controls opened: the Terrain colours switch (Natural | Clear) beside Map look
const { launch, open, PAGE, SHOTS, realErrors } = require('./nlib.cjs');
(async () => { const b = await launch(), errors = []; const p = await open(b, PAGE, { errors, settle: 1200 });
  await p.evaluate(() => { const d = document.querySelector('details'); if (d) d.open = true; }); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const g = document.querySelector('#mockctl [data-ctl="terrain"]'); return g ? [g.innerText.replace(/\s+/g, ' '), [...g.querySelectorAll('[data-v]')].map((x) => x.dataset.v + (x.classList.contains('on') || x.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' ')] : 'none'; });
  console.log('terrain control:', JSON.stringify(r)); await p.screenshot({ path: SHOTS + 'ui-controls-terrain-colours.png', clip: { x: 0, y: 0, width: 1440, height: 260 } });
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close(); })();

const { launch, open, PAGE } = require('./vlib.cjs');
(async () => { const b = await launch(); const errors = [];
  const p = await open(b, PAGE, { settle: 1200, errors }); p.on('framenavigated', (f) => console.log('NAV', f.url().slice(-60))); p.on('close', () => console.log('CLOSED')); p.on('crash', () => console.log('CRASH'));
  await p.evaluate(() => { const m = window.__mock; m.setScale(m.maxScale() * 0.9, 800, 500); }); console.log('scaled');
  await p.mouse.move(5, 890); await p.waitForTimeout(500); console.log('moved');
  const med = await p.evaluate(() => { const m = window.__mock; const r = []; for (let k = 0; k < 7; k++) { const t0 = performance.now(); m.ev('RCK = null; draw()'); r.push(performance.now() - t0); } r.sort((a, b) => a - b); return +r[3].toFixed(1); }); console.log('med', med);
  const pan = await p.evaluate(() => window.__mock.panStats(25, 90)); console.log('pan', JSON.stringify(pan));
  console.log(errors.slice(1, 5)); await b.close(); })();

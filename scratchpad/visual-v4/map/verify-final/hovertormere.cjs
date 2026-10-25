const { launch, open, PAGE } = require('./vlib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGE, {});
  const [x, y] = await p.evaluate(() => window.__mock.at('Tormere')); await p.mouse.move(x + 25, y + 25); await p.waitForTimeout(300);
  await p.screenshot({ path: __dirname + '/shots/v-hover-tormere.png', clip: { x: x - 140, y: y - 90, width: 280, height: 180 } });
  await p.evaluate(() => window.__mock.zoomTo(1.0, 'Tormere')); await p.waitForTimeout(500); const [x2, y2] = await p.evaluate(() => window.__mock.at('Tormere')); await p.mouse.move(x2 + 30, y2 + 40); await p.waitForTimeout(400);
  await p.screenshot({ path: __dirname + '/shots/v-hover-tormere-mid.png', clip: { x: x2 - 200, y: y2 - 140, width: 400, height: 280 } });
  await b.close(); })();

// crops around failing samples: node failshots.cjs '<json list of [name, look, dpr, mode, cameraSrc, sx, sy]>'
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const L = JSON.parse(process.argv[2]), PG = process.argv[3] || PAGE;
(async () => { const b = await launch();
  for (const [nm, look, dpr, mode, src, sx, sy] of L) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PG, { log, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 897);
    if (mode) { await mev(p, `setMode('${mode}')`); if (mode === 'terrain') await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 300000, polling: 300 }); await p.waitForTimeout(1200); }
    await ev(p, src); await p.waitForTimeout(1500); const r = await p.evaluate(() => { const c = document.getElementById('map').getBoundingClientRect(); return [c.left, c.top]; });
    const E = await ev(p, 'm.reliefWildEdge()'); await p.screenshot({ path: `${SHOTS}V-fail-${nm}-full.png` });
    await p.screenshot({ path: `${SHOTS}V-fail-${nm}-crop.png`, clip: { x: r[0] + sx - 40, y: r[1] + sy - 40, width: 80, height: 80 } });
    console.log(nm, 'canvas', r, 'page edge', E.samples, E.fails, JSON.stringify(E.examples)); await p.context().close(); }
  await b.close(); })();

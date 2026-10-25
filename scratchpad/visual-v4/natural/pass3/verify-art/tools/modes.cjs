// the wilds in Clear, the Terrain mode and a data mode: node modes.cjs
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [] }; const shot = async (p, n) => { await p.waitForTimeout(2000); await p.screenshot({ path: `${SHOTS}p3-${n}.png` }); console.log('shot', n); };
  { const p = await open(b, PAGE, { log, settle: 2000 }); await p.mouse.move(720, 896);
    await mev(p, "setMode('supply')"); await shot(p, '60-mode-supply-start'); await ev(p, 'm.setScale(1.0, 491.96, 239.47)'); await shot(p, '61-mode-supply-mid-ash');
    await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 300000, polling: 300 }); await shot(p, '62-mode-terrain-mid-ash');
    await mev(p, "setMode('ownership')"); await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 2000, q: '?terrain=clear' }); await p.mouse.move(720, 896); await shot(p, '63-clear-start'); await ev(p, 'm.setScale(1.0, 491.96, 239.47)'); await shot(p, '64-clear-mid-ash'); await p.context().close(); }
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();

// Clear, the Terrain mode and a data mode on this build and the pass-2 build: settled screenshots at fixed views (compare with same.py)
const { launch, open, ev, mev, PAGE, BEFORE, OUT } = require('./lib.cjs');
(async () => { for (const [nm, file] of [['now', PAGE], ['p2', BEFORE]]) for (const look of ['clear', 'terrain', 'supply']) {
    const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '', reducedMotion: 'reduce' }); await p.mouse.move(720, 895);
    if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1500); }
    if (look === 'supply') { await mev(p, "setMode('supply')"); await p.waitForTimeout(1500); }
    for (const [v, src] of [['start', null], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['ash', 'm.setScale(m.maxScale() * 0.55, 560, 230)'], ['far', 'm.setScale(m.minScale(), 800, 500)']]) {
      if (src) await ev(p, src); await p.waitForTimeout(2000); await mev(p, 'draw()'); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}same/${nm}-${look}-${v}.png` }); }
    console.log(nm, look, 'pageErrors', log.pageErrors.length); await b.close(); } })();

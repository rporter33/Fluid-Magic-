// quick probe: node probe.cjs <look> <dpr> <w> <h> '<js view expr>' '<js result expr>' [shot.png]
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const [look = 'natural', dprS = '1', wS = '1440', hS = '900', view = '', res = '0', shot = ''] = process.argv.slice(2);
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr: Number(dprS), w: Number(wS), h: Number(hS), settle: 1200, q: look === 'clear' ? '?terrain=clear' : look === 'v3' ? '?look=v3' : '' });
  await p.mouse.move(Number(wS) / 2, Number(hS) - 6);
  if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1200); }
  if (view) { await ev(p, view); await p.waitForTimeout(1500); }
  const t0 = Date.now(); const r = await ev(p, res); console.log(JSON.stringify(r, null, 0)); console.log('ms', Date.now() - t0, 'ready', p.__readyMs);
  if (shot) await p.screenshot({ path: shot.includes('/') ? shot : SHOTS + shot });
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 4)));
  await b.close();
})();

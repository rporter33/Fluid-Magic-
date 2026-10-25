// node shoot.cjs <look> <prefix> name='view js' ...   (view js evaluated with m = window.__mock); W, H, DPR env
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs');
const [look, prefix, ...specs] = process.argv.slice(2), W = Number(process.env.W || 1440), H = Number(process.env.H || 900), dpr = Number(process.env.DPR || 1);
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, w: W, h: H, settle: 1200, q: look === 'clear' ? '?terrain=clear' : look === 'v3' ? '?look=v3' : '' });
  await p.mouse.move(W / 2, H - 6);
  if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1200); }
  for (const s of specs) { const i = s.indexOf('='), name = s.slice(0, i), js = s.slice(i + 1); if (js) await ev(p, js); await p.waitForTimeout(1600); await p.screenshot({ path: `${SHOTS}${prefix}${name}.png` }); console.log('shot', prefix + name); }
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close();
})();

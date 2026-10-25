// run the page's checks in a view: node checks.cjs <query> <tag> [evalBeforeChecks]
const { launch, open, PAGE, OUT, realErrors } = require('./nlib2.cjs'); const fs = require('fs');
(async () => {
  const b = await launch(), errors = []; const q = process.argv[2] || '', tag = process.argv[3] || 'checks', pre = process.argv[4] || '', which = process.argv[5] || 'all';
  const w = Number(process.env.W || 1440), h = Number(process.env.H || 900), dpr = Number(process.env.DPR || 1);
  const p = await open(b, PAGE, { errors, q, settle: 1500, w, h, dpr });
  if (pre) { await p.evaluate((s) => { const m = window.__mock; return eval(s); }, pre); await p.waitForTimeout(800); }
  if (process.env.WAITCLEAR) await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 120000, polling: 300 });
  await p.waitForTimeout(300);
  const t0 = Date.now();
  const r = await p.evaluate((wh) => { const m = window.__mock; const o = {}; for (const k of wh.split(',')) { const f = { all: 'checks', natural: 'reliefNatural', lines: 'reliefLines', seats: 'reliefSeats', chips: 'reliefHoverChips', cliff: 'reliefCliff', snow: 'reliefSnow', means: 'reliefMeans', rails: 'reliefRails', layout: 'reliefLayout', hit: 'reliefHit', stable: 'reliefStable', design: 'reliefDesign', times: 'reliefTimes', memory: 'reliefMemory' }[k]; o[k] = m[f](); } return o; }, which);
  r.checkMs = Date.now() - t0; r.readyMs = p.__readyMs;
  fs.writeFileSync(OUT + tag + '.json', JSON.stringify(r, null, 1));
  console.log(JSON.stringify(r, null, 1).slice(0, +(process.env.MAXC || 6000)));
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();

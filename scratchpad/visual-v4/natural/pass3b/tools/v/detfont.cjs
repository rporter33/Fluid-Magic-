// the start frame across fresh loads, with the web fonts' state when it is taken: node detfont.cjs <clear|natural|terrain> <loads> <allow|abort> [pagefile]
// (det.cjs found one load in three whose start frame differed in Clear, with identical bakes and identical frames at the other zooms)
const { launch, open, ev, mev, PAGE, OUT, HASH } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'clear', loads = Number(process.argv[3] || 4), fonts = process.argv[4] || 'allow', file = process.argv[5] || PAGE;
(async () => { const runs = [];
  for (let L = 0; L < loads; L++) { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
    const p = await open(b, file, { log, settle: 2500, q: look === 'clear' ? '?terrain=clear' : '', reducedMotion: 'reduce', fonts }); await p.mouse.move(720, 895);
    if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(2000); }
    await p.waitForTimeout(2200); await mev(p, 'draw()');
    const r = await p.evaluate((H) => { const m = window.__mock; const f = [...document.fonts].map((x) => x.family.replace(/"/g, '') + ':' + x.status).filter((s) => !/unloaded/.test(s)); return { hash: m.ev(H), fontsStatus: document.fonts.status, loaded: f.length, families: [...new Set(f)].slice(0, 8), cam: m.ev('[+cam.s.toFixed(4), +cam.x.toFixed(2), +cam.y.toFixed(2)]'), names: m.ev('typeof lastLabelLayout !== "undefined" ? 1 : 0') }; }, HASH);
    await mev(p, 'document.fonts && 0'); await p.waitForTimeout(3000); await mev(p, 'RCK = null; draw()'); r.hashAfterRedraw = await mev(p, HASH); r.readyMs = p.__readyMs; r.pageErrors = log.pageErrors.length; runs.push(r); console.log(look, fonts, 'load', L, JSON.stringify(r)); await b.close(); }
  const same = runs.every((r) => r.hash === runs[0].hash), same2 = runs.every((r) => r.hashAfterRedraw === runs[0].hashAfterRedraw);
  console.log('SAME start', same, 'after a forced redraw', same2); fs.writeFileSync(`${OUT}detfont-${look}-${fonts}.json`, JSON.stringify({ runs, same, same2 }, null, 1)); })();

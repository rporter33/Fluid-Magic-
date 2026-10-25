// frame and render times: this build (Near detail on and off) against the page before the AD fixes, dpr 1 and 2: node perf.cjs
const { launch, open, ev, mev, PAGE, BEFORE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => {
  const rows = [];
  for (const dpr of [1, 2]) for (const [nm, file] of [['now', PAGE], ['beforeAD', BEFORE]]) {
    const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
    const p = await open(b, file, { log, dpr, settle: 2000, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
    const times = await ev(p, 'm.reliefTimes()');
    for (const [v, src] of [['start', null], ['ref', 'm.setScale(1.142, 700, 560)'], ['near', 'm.setScale(m.maxScale() * 0.85, 420, 520)'], ['nearMax', 'm.zoomTo(m.maxScale(), "Wyrford")']]) {
      if (src) await ev(p, src); await p.waitForTimeout(1200);
      for (const det of nm === 'now' ? ['on', 'off'] : ['on']) {
        await ev(p, `m.skip('detail', ${det === 'off'})`);
        const r = await mev(p, '(() => { const t = []; for (let k = 0; k < 5; k++) { RCK = null; const t0 = performance.now(); draw(); t.push(+(performance.now() - t0).toFixed(1)); } t.sort((a, b) => a - b); return t; })()');
        const ps = await ev(p, 'm.panStats(6, 90)');
        const row = { dpr, page: nm, view: v, detail: det, staticRenderMs: r, staticMedian: r[2], pan: ps }; rows.push(row); console.log(JSON.stringify(row));
      }
      await ev(p, "m.skip('detail', false)");
    }
    rows.push({ dpr, page: nm, bakeCpu: times.lookCpu, bakeCpuMs: times.bakeCpuMs, bakeWallMs: times.bakeWallMs, naturalSteps: times.naturalStepsMs, pageErrors: log.pageErrors.length }); console.log(JSON.stringify(rows[rows.length - 1]));
    await b.close();
  }
  fs.writeFileSync(OUT + 'perf.json', JSON.stringify(rows, null, 1));
})();

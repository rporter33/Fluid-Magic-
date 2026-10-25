// interleaved static render times at Near and Mid, this build vs pass 2, dpr 1, 3 rounds
const { launch, open, ev, mev, PAGE, BEFORE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const rows = [];
  for (let k = 0; k < 3; k++) for (const [nm, file] of [['now', PAGE], ['pass2', BEFORE]]) { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 2000, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
    for (const [v, src] of [['near', 'm.setScale(m.maxScale() * 0.85, 420, 520)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['wildNear', 'm.setScale(m.maxScale() * 0.55, ...m.ev("[cent[WILDS[0].cells[0]][0], cent[WILDS[0].cells[0]][1]]"))']]) { await ev(p, src); await p.waitForTimeout(1500);
      const r = await mev(p, '(() => { const t = []; for (let k = 0; k < 5; k++) { RCK = null; const t0 = performance.now(); draw(); t.push(+(performance.now() - t0).toFixed(1)); } t.sort((a, b) => a - b); return t; })()'); const hv = await mev(p, '(() => { const t = []; for (let k = 0; k < 5; k++) { hoverProv = provList[k * 7]; const t0 = performance.now(); draw(); t.push(+(performance.now() - t0).toFixed(1)); } hoverProv = -1; draw(); t.sort((a, b) => a - b); return t; })()');
      rows.push({ round: k, page: nm, view: v, static: r, staticMed: r[2], hoverMed: hv[2] }); console.log(k, nm, v, 'static', JSON.stringify(r), 'hover med', hv[2]); }
    await b.close(); }
  fs.writeFileSync(OUT + 'perf2.json', JSON.stringify(rows, null, 1)); })();

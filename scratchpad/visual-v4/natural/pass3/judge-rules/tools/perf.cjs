// bake and frame cost per page (one browser at a time, pages interleaved): node perf.cjs <rounds> <page,page,...>  -> out/perf.json (appended rows)
const { launch, open, ev, mev, page, OUT } = require('./lib.cjs'); const fs = require('fs');
const rounds = Number(process.argv[2] || 2), pages = (process.argv[3] || 'p2,relief,massif,open').split(',');
const WC = `(() => { const o = {}; for (const w of WILDS) { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } o[w.kind === 'mere' ? 'mere' : w.name.includes('Ash') ? 'ash' : 'grey'] = [x / w.cells.length, y / w.cells.length]; } return o; })()`;
const T = (expr, n) => `(() => { const t = []; for (let k = 0; k < ${n}; k++) { ${expr}; const t0 = performance.now(); draw(); t.push(+(performance.now() - t0).toFixed(1)); } t.sort((a, b) => a - b); return { med: t[t.length >> 1], min: t[0], max: t[t.length - 1] }; })()`;
(async () => {
  const file = OUT + 'perf.json', rows = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
  for (let R = 0; R < rounds; R++) for (const PN of pages) {
    const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const t0 = Date.now();
    const p = await open(b, page(PN), { log, settle: 2500, reducedMotion: 'reduce' }); const readyMs = Date.now() - t0; await p.mouse.move(720, 896);
    const times = await ev(p, 'm.reliefTimes()'), wc = await mev(p, WC);
    const row = { page: PN, round: R, readyMs, bakeCpuMs: times.bakeCpuMs, bakeWallMs: times.bakeWallMs, natural: times.naturalStepsMs, shared: times.sharedStepsMs, views: {} };
    for (const [v, src] of [['start', 'm.ev("fit(); draw()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ash', `m.setScale(m.maxScale() * 0.55, ${wc.ash[0]}, ${wc.ash[1]})`], ['ashMax', `m.setScale(m.maxScale(), ${wc.ash[0]}, ${wc.ash[1]})`], ['far', 'm.setScale(m.minScale(), 800, 500)']]) {
      await ev(p, src); await p.waitForTimeout(1500);
      const frame = await mev(p, T('', 9)), stat = await mev(p, T('RCK = null', 5)), dec = await mev(p, T("RCK = null; RL_WRIM.key = ''", 5)), ms = await mev(p, 'RL_WRIM.ms');
      const pan = await ev(p, 'm.panStats(6, 60)');
      row.views[v] = { frame, static: stat, staticWithDecision: dec, decisionMs: ms, pan }; }
    await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(1200);
    row.selectMs = await mev(p, `(() => { const t = []; const L = provList.slice(0, 7); for (const i of L) { state.sel = { type: 'prov', id: i }; const t0 = performance.now(); draw(); t.push(+(performance.now() - t0).toFixed(1)); } state.sel = null; draw(); t.sort((a, b) => a - b); return { med: t[t.length >> 1], max: t[t.length - 1] }; })()`);
    row.monthMs = await ev(p, `(() => { const t = []; for (let k = 4; k < 10; k++) { const t0 = performance.now(); m.setMonth(k); m.ev('draw()'); t.push(+(performance.now() - t0).toFixed(1)); } t.sort((a, b) => a - b); return { med: t[t.length >> 1], max: t[t.length - 1] }; })()`);
    row.pageErrors = log.pageErrors.length; rows.push(row); console.log(JSON.stringify(row)); fs.writeFileSync(file, JSON.stringify(rows, null, 1)); await b.close();
  }
})();

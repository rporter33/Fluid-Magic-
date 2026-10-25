// determinism: fresh loads (new browser each), canvas hashes at fixed views, bake hashes: node det.cjs <natural|clear|terrain|v3> [loads] [dpr]
const { launch, open, ev, mev, PAGE, OUT, HASH } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', loads = Number(process.argv[3] || 3), dpr = Number(process.argv[4] || 1);
(async () => {
  const runs = [];
  for (let L = 0; L < loads; L++) {
    const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
    const q = look === 'clear' ? '?terrain=clear' : look === 'v3' ? '?look=v3' : '';
    const p = await open(b, PAGE, { log, dpr, settle: 2500, q, reducedMotion: 'reduce' });
    if (look === 'v3') await p.waitForFunction(() => window.__mock && !window.__mock.relief(), null, { timeout: 60000 });
    await p.mouse.move(720, 895);
    if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(2000); }
    const r = { look: look === 'v3' ? 'v3' : await ev(p, 'm.look().shown'), readyMs: p.__readyMs, hashes: {} };
    if (look !== 'v3') r.bake = await mev(p, `(() => { const h = (d) => { let x = 0x811c9dc5; for (let k = 0; k < d.length; k++) { x ^= d[k]; x = Math.imul(x, 0x01000193); } return (x >>> 0).toString(16); }; const o = {}; for (const k of ['natural', 'clear']) if (RB.L[k]) o[k] = h(RB.L[k].img.data); if (RB.nat) o.cls = h(RB.nat.cls); o.hh = h(new Uint8Array(RB.hh.buffer)); return o; })()`);
    const V = [['start', null], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['near', 'm.setScale(m.maxScale() * 0.85, 420, 520)'], ['far', 'm.setScale(m.minScale(), 800, 500)'], ['m40', 'm.ev("fit(); draw()"); m.setMonth(40)']];
    for (const [v, src] of V) { if (src) await ev(p, src); await p.waitForTimeout(2200); await mev(p, 'draw()'); r.hashes[v] = await mev(p, HASH); }
    r.pageErrors = log.pageErrors.length; runs.push(r); console.log(look, 'load', L, JSON.stringify(r));
    await b.close();
  }
  const same = Object.keys(runs[0].hashes).map((v) => [v, runs.every((r) => r.hashes[v] === runs[0].hashes[v])]);
  const bakeSame = runs[0].bake ? Object.keys(runs[0].bake).map((k) => [k, runs.every((r) => r.bake[k] === runs[0].bake[k])]) : null;
  console.log('SAME views', JSON.stringify(same), 'bake', JSON.stringify(bakeSame));
  fs.writeFileSync(`${OUT}det-${look}-dpr${dpr}.json`, JSON.stringify({ runs, same, bakeSame }, null, 1));
})();

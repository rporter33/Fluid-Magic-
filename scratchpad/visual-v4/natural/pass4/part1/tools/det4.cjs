// determinism (pass 3b's det2 views) + pass 4's world digest: node det4.cjs <tag> <pagefile> [query] [loads] [dpr] -> out/det4-<tag>.json
const { launch, open, ev, mev, OUT, HASH } = require('./lib.cjs'); const fs = require('fs');
const [tag, file, q = '', loadsS = '3', dprS = '1'] = process.argv.slice(2), loads = +loadsS, dpr = +dprS;
(async () => { const runs = [];
  for (let L = 0; L < loads; L++) { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
    const p = await open(b, file, { log, dpr, settle: 2500, q, reducedMotion: 'reduce' }); await p.mouse.move(720, 895);
    const terrain = /mode=terrain/.test(q); if (terrain) { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(2000); }
    const r = { readyMs: p.__readyMs, hashes: {} };
    r.bake = await mev(p, `(() => { const h = (d) => { let x = 0x811c9dc5; for (let k = 0; k < d.length; k++) { x ^= d[k]; x = Math.imul(x, 0x01000193); } return (x >>> 0).toString(16); }; const o = {}; for (const k of ['natural', 'clear']) if (RB.L[k]) o[k] = h(RB.L[k].img.data); if (RB.nat) o.cls = h(RB.nat.cls); o.hh = h(new Uint8Array(RB.hh.buffer)); if (typeof RB.S !== 'undefined' && RB.S) for (const [s, V] of Object.entries(RB.S)) if (V && V.img) o['season' + s] = h(V.img.data); return o; })()`);
    r.world = await mev(p, 'typeof p4DeterminismCheck === "function" && P4S.on ? p4DeterminismCheck().digest : null');
    const V = [['start', null], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['near', 'm.setScale(m.maxScale() * 0.85, 420, 520)'], ['far', 'm.setScale(m.minScale(), 800, 500)'], ['m40', 'm.ev("fit(); draw()"); m.setMonth(40)'], ['m70', 'm.setMonth(70)'], ['back3', 'm.setMonth(3)']];
    for (const [v, src] of V) { if (src) await ev(p, src); await p.waitForTimeout(2200); await mev(p, 'draw()'); r.hashes[v] = await mev(p, HASH); }
    r.pageErrors = log.pageErrors; runs.push(r); console.log(tag, 'load', L, JSON.stringify({ hashes: r.hashes, world: r.world, bake: r.bake, perr: r.pageErrors.length, readyMs: r.readyMs })); await b.close(); }
  const same = Object.fromEntries(Object.keys(runs[0].hashes).map((v) => [v, runs.every((r) => r.hashes[v] === runs[0].hashes[v])])), bakeSame = Object.fromEntries(Object.keys(runs[0].bake).map((k) => [k, runs.every((r) => r.bake[k] === runs[0].bake[k])])), worldSame = runs.every((r) => r.world === runs[0].world);
  console.log('SAME', JSON.stringify(same), 'bake', JSON.stringify(bakeSame), 'world', worldSame, 'pageErrors', runs.reduce((a, r) => a + r.pageErrors.length, 0)); fs.writeFileSync(`${OUT}det4-${tag}.json`, JSON.stringify({ runs, same, bakeSame, worldSame }, null, 1)); })();

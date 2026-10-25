// the light rim's share of each wild's outline, and of the Ashspine's hills/mountains edges (the spill edges) against its other edges, per view: node rimwild.cjs (PAGEFILE for another build)
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const V = [['start', null], ['far', 'm.setScale(m.minScale(), 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['ash', 'm.setScale(m.maxScale() * 0.55, 560, 230)'], ['ashmax', 'm.setScale(m.maxScale(), 600, 240)']];
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 1200 }); await p.mouse.move(720, 895); const out = {};
  for (const [v, src] of V) { if (src) await ev(p, src); await p.waitForTimeout(1500);
    out[v] = await mev(p, `(() => { const m = rlWildRimMap(cam.s), acc = {}; const add = (k, L, r) => { const a = acc[k] ??= [0, 0]; a[0] += L; a[1] += r; };
      for (const w of WILDS) for (const e of rlWildOutline(w)) { const E = m.get(e.c + ':' + e.j); if (!E) continue; const r = E.L * rlWildRimRuns(E).reduce((a, [p, q]) => a + q - p, 0); add(w.name, E.L, r); add('all', E.L, r);
        if (w.id === 'ashspine') add(['hills', 'mountains'].includes(terr[e.j]) ? 'Ashspine: hills/mountains edges' : 'Ashspine: other edges', E.L, r); }
      return Object.fromEntries(Object.entries(acc).map(([k, [L, r]]) => [k, +(r / L).toFixed(3)])); })()`);
    console.log(v, JSON.stringify(out[v])); }
  fs.writeFileSync(OUT + 'rimwild-' + (process.env.PAGEFILE ? 'p2' : 'now') + '.json', JSON.stringify(out, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();

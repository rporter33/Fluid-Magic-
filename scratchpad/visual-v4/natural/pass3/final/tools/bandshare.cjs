// the page's own light-band share, per wild, at the views: node bandshare.cjs
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const A = [491.96, 239.47], M = [911.91, 588.11], G = [640.42, 676.33];
const VIEWS = [['start', null], ['far', 'm.setScale(m.minScale(), 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['midAsh', `m.setScale(1.0, ${A})`], ['ref', 'm.setScale(1.142, 700, 560)'], ['nearAsh', `m.setScale(m.maxScale()*0.55, ${A})`], ['nearGrey', `m.setScale(m.maxScale()*0.6, ${G})`], ['maxAsh', `m.setScale(m.maxScale(), ${A})`], ['maxGrey', `m.setScale(m.maxScale(), ${G})`], ['maxMere', `m.setScale(m.maxScale(), ${M})`]];
const IN = `(() => { rlQuietEdgeMap(); const m = RL_WRIM.map; const acc = {}; for (const [key, E] of m) { const c = +key.split(':')[0], w = WILDS.find((q) => q.cells.includes(c)).id; const sn = E.seen.reduce((a, v) => a + v, 0); if (!sn) continue; let n = 0; const R = rlQuietRuns(E); for (let k = 0; k < E.N; k++) { if (!E.seen[k]) continue; const f = (k + 0.5) / E.N; if (R.some(([p, q]) => f >= p && f <= q)) n++; } const a = acc[w] ?? (acc[w] = [0, 0]); a[0] += E.L * (n / E.N); a[1] += E.L * (sn / E.N); } const o = {}; for (const w in acc) o[w] = +(acc[w][0] / acc[w][1]).toFixed(2); o.all = rlQuietShare() == null ? null : +rlQuietShare().toFixed(2); return o; })()`;
(async () => { const b = await launch(), log = { pageErrors: [] }; const res = {};
  for (const dpr of [1, 2]) { const p = await open(b, PAGE, { log, dpr, settle: 1500 }); await p.mouse.move(720, 896);
    for (const [nm, st] of VIEWS) { if (st) await ev(p, st); await p.waitForTimeout(1500); res[`dpr${dpr}-${nm}`] = await mev(p, IN); console.log(dpr, nm, JSON.stringify(res[`dpr${dpr}-${nm}`])); }
    await p.context().close(); }
  fs.writeFileSync(OUT + 'bandshare.json', JSON.stringify(res, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();

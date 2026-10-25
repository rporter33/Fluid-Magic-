// the stone band's runs along each wild's whole outline (edges chained end to end, runs that meet at a corner merged), in screen px: node chainruns.cjs [query] [dpr]
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const q = process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : '', dpr = Number(process.argv[3] || 1);
const IN = `(() => { rlQuietEdgeMap(); const res = {};
  for (const w of WILDS) { const E0 = rlWildOutline(w).map((e) => ({ e, used: false })); if (!E0.length) continue;
    const key = (p) => p[0].toFixed(3) + ',' + p[1].toFixed(3); const chain = []; let cur = E0[0]; cur.used = true; chain.push([cur.e, false]); let end = cur.e.b;
    for (let g = 0; g < E0.length; g++) { const nx = E0.find((q) => !q.used && (key(q.e.a) === key(end) || key(q.e.b) === key(end))); if (!nx) break; nx.used = true; const rev = key(nx.e.b) === key(end); chain.push([nx.e, rev]); end = rev ? nx.e.a : nx.e.b; }
    let off = 0; const iv = []; let undecided = 0, total = 0;
    for (const [e, rev] of chain) { const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lpx = Math.hypot(bx - ax, by - ay); const E = RL_WRIM.map && RL_WRIM.map.get(e.c + ':' + e.j);
      if (!E) undecided += Lpx; else for (const [p, qq] of rlQuietRuns(E)) { const a = rev ? 1 - qq : p, b = rev ? 1 - p : qq; iv.push([off + a * Lpx, off + b * Lpx]); }
      off += Lpx; total += Lpx; }
    iv.sort((a, b) => a[0] - b[0]); const m = []; for (const r of iv) { if (m.length && r[0] - m[m.length - 1][1] < 0.75) m[m.length - 1][1] = Math.max(m[m.length - 1][1], r[1]); else m.push([...r]); }
    if (m.length > 1 && m[0][0] < 0.75 && total - m[m.length - 1][1] < 0.75) { m[0][0] = m[m.length - 1][0] - total; m.pop(); } // wrap round the closed outline
    const runs = m.map(([a, b]) => +(b - a).toFixed(1)); const gaps = []; for (let k = 0; k < m.length; k++) { const nx = m[(k + 1) % m.length]; let gp = nx[0] - m[k][1]; if (k === m.length - 1) gp += total; if (m.length > 1 || gp > 0.5) gaps.push(+gp.toFixed(1)); }
    res[w.id] = { outlinePx: +total.toFixed(0), chained: chain.length + '/' + E0.length, undecidedPx: +undecided.toFixed(0), runs: runs.length, share: +(runs.reduce((a, b) => a + b, 0) / total).toFixed(3), shortestRuns: [...runs].sort((a, b) => a - b).slice(0, 4), runsUnder24: runs.filter((r) => r < 24).length, gapsUnder16: gaps.filter((g) => g < 16).length, shortestGaps: [...gaps].sort((a, b) => a - b).slice(0, 4) }; }
  return res; })()`;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = {}; const p = await open(b, PAGE, { log, dpr, settle: 1500, q }); await p.mouse.move(720, 896);
  for (const [v, src] of [['start', 'm.ev("fit(); RCK = null; draw()")'], ['far60', 'm.setScale(60 / m.ev("MED_DIAM"), 720, 450)'], ['least', 'm.setScale(m.minScale(), 800, 500)'], ['fit', 'm.setScale(m.fitScale(), 800, 500)']]) { await ev(p, src); await p.waitForTimeout(1500); out[v] = await mev(p, IN); console.log(q || 'default', 'dpr' + dpr, v, JSON.stringify(out[v])); }
  console.log('pageErrors', log.pageErrors.length); fs.writeFileSync(`${OUT}chainruns-${(q || 'default').replace(/[?=&]/g, '_')}-dpr${dpr}.json`, JSON.stringify(out, null, 1)); await b.close(); })();

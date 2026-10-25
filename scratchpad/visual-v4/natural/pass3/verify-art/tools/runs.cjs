// lengths (screen px) of the stone band's runs and of the gaps between them, per view: node runs.cjs
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const A = [491.96, 239.47], G = [640.42, 676.33];
const VIEWS = [['start', null], ['far', 'm.setScale(m.minScale(), 800, 500)'], ['midAsh', `m.setScale(1.0, ${A})`], ['nearGrey', `m.setScale(m.maxScale()*0.6, ${G})`], ['maxAsh', `m.setScale(m.maxScale(), ${A})`]];
const IN = `(() => { rlQuietEdgeMap(); const v = viewRect(), runs = [], gaps = []; let edges = 0;
  for (const w of WILDS) for (const e of rlWildOutline(w)) { const E = RL_WRIM.map.get(e.c + ':' + e.j); if (!E) continue; const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b); const mx = (ax + bx) / 2, my = (ay + by) / 2; if (mx < v.l || mx > v.r || my < v.t || my > v.b) continue; edges++;
    const Lpx = Math.hypot(bx - ax, by - ay), R = rlQuietRuns(E); let prev = 0; for (const [p, q] of R) { runs.push(+((q - p) * Lpx).toFixed(1)); if (p - prev > 0) gaps.push(+((p - prev) * Lpx).toFixed(1)); prev = q; } }
  runs.sort((a, b) => a - b); const pc = (a, f) => a.length ? a[Math.min(a.length - 1, Math.floor(f * a.length))] : null;
  return { edges, runs: runs.length, runP10: pc(runs, 0.1), runP50: pc(runs, 0.5), under12px: runs.filter((r) => r < 12).length, under6px: runs.filter((r) => r < 6).length, gapsUnder12px: gaps.filter((g) => g < 12).length }; })()`;
(async () => { const b = await launch(), log = { pageErrors: [] }, res = {}; const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 896);
  for (const [nm, st] of VIEWS) { if (st) await ev(p, st); await p.waitForTimeout(1500); res[nm] = await mev(p, IN); console.log(nm, JSON.stringify(res[nm])); }
  fs.writeFileSync(OUT + 'bandruns.json', JSON.stringify(res, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();

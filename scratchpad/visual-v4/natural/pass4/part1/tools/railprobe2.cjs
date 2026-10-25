const { launch, open, ev, mev } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE, { log, q: process.argv[2] || '', settle: 1500 }); await p.mouse.move(720, 896);
  await ev(p, `m.ev("fit(); draw()"); m.setMonth(40)`); await p.waitForTimeout(1800);
  const r = await mev(p, `(() => { const a = names.indexOf('Morholt'), c = names.indexOf('Ashfen'), k = ekey(a, c), W4 = rlWorld4(); const o = { k, river: W4.riverOf.get(k) || null, owners: [prov[a].owner, prov[c].owner], bridge: W4.bridges.get(k) || null };
    for (const i of [a, c]) { const E = RL_EDGES[i], kk = E.findIndex((e) => e.j === (i === a ? c : a)), e = E[kk]; o[names[i]] = { kk, n: E.length, realm: isRealmEdge(i, e), ri: rlRiverInset(i, e), len: e.len, insPrev: rlRiverInset(i, E[(kk - 1 + E.length) % E.length]), insNext: rlRiverInset(i, E[(kk + 1) % E.length]), a: e.a, b: e.b, nx: e.nx, ny: e.ny }; const V = rlInset(i, 1.5 / cam.s); o[names[i]].v0 = V[kk]; o[names[i]].v1 = V[(kk + 1) % E.length]; o[names[i]].dist0 = (V[kk][0] - e.a[0]) * e.nx + (V[kk][1] - e.a[1]) * e.ny; o[names[i]].dist1 = (V[(kk + 1) % E.length][0] - e.a[0]) * e.nx + (V[(kk + 1) % E.length][1] - e.a[1]) * e.ny; }
    o.s = cam.s; return o; })()`);
  console.log(JSON.stringify(r, null, 1));
  const clip = await mev(p, `(() => { const a = names.indexOf('Morholt'), c = names.indexOf('Ashfen'), E = RL_EDGES[a].find((e) => e.j === c); const [x0, y0] = toScreen(...E.a), [x1, y1] = toScreen(...E.b); return [Math.min(x0, x1) - 40, Math.min(y0, y1) - 40, Math.abs(x1 - x0) + 80, Math.abs(y1 - y0) + 80]; })()`);
  await p.screenshot({ path: process.argv[3], clip: { x: clip[0], y: clip[1], width: clip[2], height: clip[3] } });
  await b.close(); })();

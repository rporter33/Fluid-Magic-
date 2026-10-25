// diagnose a rail band-rule miss from my probe: profile across the rail at the failing point, per-sample results along the edge, a 6x crop
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const CODE = fs.readFileSync(__dirname + '/vrprobe.js', 'utf8'), [A, Bn] = [process.argv[2] || 'Rookmere', process.argv[3] || 'Briarstead'], dpr = Number(process.argv[4] || 1), src = process.argv[5] || 'm.setScale(m.minScale(), 800, 500)';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, dpr, settle: 1500 }); await p.mouse.move(720, 897); await mev(p, CODE); await ev(p, src); await p.waitForTimeout(1500);
  const r = await mev(p, `(() => { const i = names.indexOf(${JSON.stringify(A)}), j = names.indexOf(${JSON.stringify(Bn)}); const d = __vr.frame(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width; const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    const w = rlW(), gap = 1, tot = gap + w.d + w.b + w.l, ban = gap + w.d + w.b / 2; const out = { owner: prov[i].owner, ownerJ: prov[j].owner, fogI: fogOf(i), fogJ: fogOf(j), w, rows: [] };
    for (const [ii, jj] of [[i, j], [j, i]]) for (const e of RL_EDGES[ii]) { if (e.j !== jj || !isRealmEdge(ii, e)) continue; const L = e.len * cam.s; out.len = L;
      for (let t = 0.02; t <= 0.98; t += 1 / L) { const bx = e.a[0] + (e.b[0] - e.a[0]) * t, by = e.a[1] + (e.b[1] - e.a[1]) * t, [sx, sy] = toScreen(bx, by);
        const G = [tot + 2.5, tot + 3, tot + 3.5, tot + 4, tot + 4.5].map((o) => px(sx + e.nx * o, sy + e.ny * o)).sort((p, q) => __vr.pair(p, [0, 0, 0]).n - __vr.pair(q, [0, 0, 0]).n)[2];
        const prof = []; for (let o = 0; o <= tot + 0.5; o += 0.5) prof.push(px(sx + e.nx * o, sy + e.ny * o));
        const B = px(sx + e.nx * ban, sy + e.ny * ban), bg = __vr.pair(B, G); let best = bg.r, via = 'banner'; for (const K of prof) { const q = Math.min(__vr.pair(K, B).r, __vr.pair(K, G).r); if (q > best) { best = q; via = 'key ' + K.join(','); } }
        out.rows.push({ owner: names[ii], t: +t.toFixed(3), sx: +sx.toFixed(1), sy: +sy.toFixed(1), best: +best.toFixed(3), via, B: B.join(','), G: G.join(','), bg: [+bg.n.toFixed(1), +bg.cvd.toFixed(1)], prof: prof.map((c) => c.join(',')).join(' | ') }); } }
    return out; })()`);
  const bad = r.rows.filter((q) => q.best < 1); console.log(JSON.stringify({ owner: r.owner, ownerJ: r.ownerJ, fogI: r.fogI, fogJ: r.fogJ, w: r.w, len: r.len, n: r.rows.length, bad: bad.length }));
  for (const q of bad) console.log(JSON.stringify(q).slice(0, 700));
  const pg = await ev(p, 'm.reliefRails()'); console.log('page rails', pg.samples, pg.fails, pg.worstContrast);
  if (bad.length) { const q = bad[0]; await p.screenshot({ path: `${SHOTS}V-raildiag-${A}-${Bn}-dpr${dpr}.png`, clip: { x: Math.max(0, q.sx - 40), y: Math.max(0, q.sy + 115 - 40), width: 80, height: 80 } }).catch((e) => console.log(e.message)); }
  fs.writeFileSync(`${OUT}raildiag-${A}-${Bn}-dpr${dpr}.json`, JSON.stringify(r, null, 1)); await b.close(); })();

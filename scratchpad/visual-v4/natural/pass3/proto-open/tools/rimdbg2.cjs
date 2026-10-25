// per wild edge: neighbour, terrain, pieces, bad pieces, rim share; and per-sample W/G L* with ink and pair DEs (at given views)
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs');
const V = { start: null, mid: 'm.setScale(1.0, 640, 480)', ref: 'm.setScale(1.142, 700, 560)', ash: 'm.setScale(m.maxScale() * 0.55, 560, 230)', far: 'm.setScale(m.minScale(), 800, 500)' };
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 800 }); await p.mouse.move(720, 895);
  for (const v of (process.argv[2] || 'start').split(',')) { if (V[v]) await ev(p, V[v]); await p.waitForTimeout(1200);
    const r = await mev(p, `(() => { const m = rlWildRimMap(cam.s), out = {}; for (const w of WILDS) for (const e of rlWildOutline(w)) { const E = m.get(e.c + ':' + e.j); if (!E) continue; const k = w.name.slice(4, 9) + '/' + names[e.j] + ':' + terr[e.j]; const o = out[k] ??= [0, 0, 0]; o[0] += E.L; o[1] += E.L * rlWildRimRuns(E).reduce((a, [p, q]) => a + q - p, 0); o[2] += E.L * [...E.bad].reduce((a, b) => a + b, 0) / E.np; }
      return { share: rlWildRimShare(), rows: Object.entries(out).map(([k, [L, r, b]]) => k + ' L' + Math.round(L) + ' rim ' + (r / L).toFixed(2) + ' bad ' + (b / L).toFixed(2)) }; })()`);
    console.log('==', v, 'rimShare', r.share && r.share.toFixed(3)); for (const x of r.rows) console.log('  ', x);
    const d = await mev(p, `(() => { const s = cam.s, d = RB.L.natural.img.data, { BW, TX, id } = RB, res = {}, ink = hex2rgb('#0D0C0B');
      const col = (x, y, ok) => { const tx = Math.floor(x * TX), ty = Math.floor(y * TX), kk = ty * BW + tx, i = id[kk], o = kk * 4; if (i === 255 || !ok(i)) return null; if (isWild(i)) return [d[o], d[o+1], d[o+2]]; return rlApplyState([d[o], d[o+1], d[o+2]], rlStateOf(i, 'natural', false)); };
      const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlLumOf(...p) - rlLumOf(...q)); return s2.length ? s2[s2.length >> 1] : null; };
      for (const w of WILDS) for (const e of rlWildOutline(w)) { const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; }
        const key = w.name.slice(4, 9) + '/' + names[e.j]; const R = res[key] ??= { n: 0, WL: [], GL: [], inkW: 0, inkG: 0, pair: 0 };
        for (let f = 0.05; f < 1; f += 0.1) { const x = ax + (bx - ax) * f, y = ay + (by - ay) * f; const Wg = med([6, 7, 8, 9].map((o) => col(x - (nx * o) / s, y - (ny * o) / s, (i) => w.cells.includes(i)))), G = med([6, 7, 8, 9, 9.5].map((o) => col(x + (nx * o) / s, y + (ny * o) / s, (i) => !isWild(i)))); if (!Wg || !G) continue;
          const ok = (q) => q.normal >= 20 && q.cvd >= 12; R.n++; R.WL.push(Math.round(rgb2lab(Wg)[0])); R.GL.push(Math.round(rgb2lab(G)[0])); if (ok(rlPairDE(ink, Wg))) R.inkW++; if (ok(rlPairDE(ink, G))) R.inkG++; if (ok(rlPairDE(Wg, G))) R.pair++; } }
      return Object.entries(res).map(([k, R]) => k + ' n' + R.n + ' WL ' + R.WL.sort((a,b)=>a-b).join(',') + ' | GL ' + R.GL.sort((a,b)=>a-b).join(',') + ' | inkW ' + R.inkW + ' inkG ' + R.inkG + ' pair ' + R.pair); })()`);
    for (const x of d) console.log('    ', x); }
  console.log('errors', log.pageErrors.length); await b.close(); })();

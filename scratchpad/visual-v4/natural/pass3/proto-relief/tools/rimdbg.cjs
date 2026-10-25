const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 800 }); await p.mouse.move(720, 895);
  const r = await mev(p, `(() => { const m = rlWildRimMap(cam.s), out = []; for (const w of WILDS) for (const e of rlWildOutline(w)) { const E = m.get(e.c + ':' + e.j); if (!E) continue; out.push([w.name, names[e.j], terr[e.j], E.np, [...E.bad].reduce((a, b) => a + b, 0), E.need, rlWildRimRuns(E).reduce((a, [p, q]) => a + q - p, 0).toFixed(2), Math.round(E.L)]); } return out; })()`);
  for (const x of r) console.log(x.join(' | '));
  // detail for one edge: samples of W, G (median) and DEs
  const d = await mev(p, `(() => { const P = RL_P.wildRim, s = cam.s, d = RB.L.natural.img.data, { BW, TX, id } = RB, res = [];
    const col = (x, y, ok) => { const tx = Math.floor(x * TX), ty = Math.floor(y * TX), kk = ty * BW + tx, i = id[kk], o = kk * 4; if (i === 255 || !ok(i)) return null; if (isWild(i)) return [d[o], d[o+1], d[o+2]]; return rlApplyState([d[o], d[o+1], d[o+2]], rlStateOf(i, 'natural', false)); };
    const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlLumOf(...p) - rlLumOf(...q)); return s2.length ? s2[s2.length >> 1] : null; };
    for (const w of WILDS) for (const e of rlWildOutline(w)) { if (!['Karreach', 'Ashmoor', 'Halevale', 'Wyrholt'].includes(names[e.j])) continue; const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; }
      for (let f = 0.1; f < 1; f += 0.2) { const x = ax + (bx - ax) * f, y = ay + (by - ay) * f; const Wg = med([6, 7, 8, 9].map((o) => col(x - (nx * o) / s, y - (ny * o) / s, (i) => w.cells.includes(i)))), G = med([6, 7, 8, 9, 9.5].map((o) => col(x + (nx * o) / s, y + (ny * o) / s, (i) => !isWild(i)))); if (!Wg || !G) continue;
        const ink = RL_RIM_INK, a = rlPairDE(ink, Wg), b2 = rlPairDE(ink, G), c = rlPairDE(Wg, G); res.push([names[e.j], f.toFixed(1), rgb2hex(Wg), rgb2hex(G), 'inkW ' + a.normal.toFixed(1) + '/' + a.cvd.toFixed(1), 'inkG ' + b2.normal.toFixed(1) + '/' + b2.cvd.toFixed(1), 'WG ' + c.normal.toFixed(1) + '/' + c.cvd.toFixed(1), 'L ' + rgb2lab(Wg)[0].toFixed(0) + '/' + rgb2lab(G)[0].toFixed(0)].join(' ')); } }
    return res; })()`);
  for (const x of d) console.log(x);
  await b.close(); })();

// why the ink alone does not carry the wild edge: per sample W, G lightness and the ink's dE against each (start view, the natural bake)
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 800 }); if (process.argv[2]) { await ev(p, process.argv[2]); await p.waitForTimeout(1000); }
  const r = await mev(p, `(() => { const s0 = cam.s, d = RB.L.natural.img.data, { BW, BH, TX, id } = RB, out = [];
    const col = (x, y, ok) => { const tx = Math.floor(x * TX), ty = Math.floor(y * TX), kk = ty * BW + tx, i = id[kk], o = kk * 4; if (i === 255 || !ok(i)) return null; return isWild(i) ? [d[o], d[o + 1], d[o + 2]] : rlApplyState([d[o], d[o + 1], d[o + 2]], rlStateOf(i, 'natural', false)); };
    const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlLumOf(...p) - rlLumOf(...q)); return s2.length ? s2[s2.length >> 1] : null; };
    for (const w of WILDS) for (const e of rlWildOutline(w)) { const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; }
      for (let f = 0.1; f < 0.95; f += 0.2) { const x = ax + (bx - ax) * f, y = ay + (by - ay) * f, Wg = med([6, 7, 8, 9].map((o) => col(x - nx * o / s0, y - ny * o / s0, (i) => w.cells.includes(i)))), G = med([6, 7, 8, 9].map((o) => col(x + nx * o / s0, y + ny * o / s0, (i) => !isWild(i)))); if (!Wg || !G) continue;
        const iw = rlPairDE([10, 9, 8], Wg), ig = rlPairDE([10, 9, 8], G), wg = rlPairDE(Wg, G); out.push({ w: w.id[0], t: terr[e.j], WL: +rgb2lab(Wg)[0].toFixed(0), GL: +rgb2lab(G)[0].toFixed(0), inkW: [+iw.normal.toFixed(0), +iw.cvd.toFixed(0)], inkG: [+ig.normal.toFixed(0), +ig.cvd.toFixed(0)], wg: [+wg.normal.toFixed(0), +wg.cvd.toFixed(0)] }); } }
    return out; })()`);
  const byT = {}; for (const q of r) { const k = q.t; (byT[k] ??= []).push(q); }
  for (const [t, a] of Object.entries(byT)) { const med = (f) => { const v = a.map(f).sort((x, y) => x - y); return v[v.length >> 1]; }; console.log(t, a.length, 'W L', med((q) => q.WL), 'G L', med((q) => q.GL), 'ink-W', med((q) => q.inkW[0]), med((q) => q.inkW[1]), 'ink-G', med((q) => q.inkG[0]), med((q) => q.inkG[1]), 'W-G', med((q) => q.wg[0]), 'inkOK', a.filter((q) => q.inkW[0] >= 22 && q.inkW[1] >= 13.2 && q.inkG[0] >= 22 && q.inkG[1] >= 13.2).length); }
  await b.close();
})();

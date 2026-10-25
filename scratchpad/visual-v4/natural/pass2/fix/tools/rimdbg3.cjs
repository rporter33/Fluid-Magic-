// per wild edge and scale: the share of samples whose ground pair misses 20 / 12 x m (h: hem haze; i: interior), and an example W / G colour
const { launch, open, mev, PAGE } = require('./lib.cjs');
const SRC = String.raw`(() => {
  const Lk = RB.L.natural, d = Lk.img.data, { BW, BH, TX, id } = RB, sc = [], P = RL_P.wildRim, kz = Math.pow(maxScale / minScale, 1 / (P.scales - 1)); for (let q = 0; q < P.scales; q++) sc.push(minScale * Math.pow(kz, q));
  const col = (x, y, ok, inter) => { const tx = Math.floor(x * TX), ty = Math.floor(y * TX); if (tx < 0 || ty < 0 || tx >= BW || ty >= BH) return null; const kk = ty * BW + tx, i = id[kk], o = kk * 4; if (i === 255 || !ok(i) || d[o + 3] < 255) return null;
    if (isWild(i)) return [d[o], d[o + 1], d[o + 2]]; return rlApplyState([d[o], d[o + 1], d[o + 2]], rlStateOf(i, 'natural', inter)); };
  const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlLumOf(...p) - rlLumOf(...q)); return s2.length ? s2[s2.length >> 1] : null; };
  const rows = [];
  for (const w of WILDS) for (const e of rlWildOutline(w)) {
    const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; }
    const inW = (i) => w.cells.includes(i), inG = (i) => !isWild(i), byS = []; let ex = '';
    for (const s of sc) { const n = Math.max(3, Math.ceil((L * s) / 4)); let bad = 0, tot = 0;
      for (let t = 0; t < n; t++) { const f = (t + 0.5) / n, x = ax + (bx - ax) * f, y = ay + (by - ay) * f; tot++;
        const Wg = med([6, 7, 8, 9].map((o) => col(x - (nx * o) / s, y - (ny * o) / s, inW, false))), G = med([6, 7, 8, 9, 9.5].map((o) => col(x + (nx * o) / s, y + (ny * o) / s, inG, false))); if (!Wg || !G) continue;
        const q = rlPairDE(Wg, G); if (q.normal < 20 * P.m || q.cvd < 12 * P.m) { bad++; if (!ex && s * MED_DIAM > 180 && s * MED_DIAM < 250) ex = 's' + (s * MED_DIAM).toFixed(0) + ' W' + rgb2lab(Wg).map((v) => v.toFixed(0)).join('/') + ' G' + rgb2lab(G).map((v) => v.toFixed(0)).join('/') + ' tl' + (RB.nwTL ? rlBilin(RB.nwTL, RB.QW, RB.QH, (x - (nx * 7.5) / s) * TX / 4, (y - (ny * 7.5) / s) * TX / 4).toFixed(1) : '-') + ' n' + q.normal.toFixed(1) + ' c' + q.cvd.toFixed(1); } }
      byS.push(+(bad / tot).toFixed(2)); }
    rows.push({ e: w.name.replace('The ', '') + '/' + names[e.j] + ' (' + terr[e.j] + ')', L: +L.toFixed(0), byS, ex });
  }
  return { scales: sc.map((s) => +(s * MED_DIAM).toFixed(0)), rows };
})()`;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 800 }); const r = await mev(p, SRC); console.log('Dpx', JSON.stringify(r.scales)); for (const q of r.rows) console.log(q.e.padEnd(34), String(q.L).padStart(4), JSON.stringify(q.byS), q.ex); await b.close(); })();

// per wild outline edge: the worst ratio (min of normal/20, cvd/12) by scale and by variant (inter x hover), on the natural bake as rlWildRimSet samples it
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const SRC = String.raw`(() => {
  const Lk = RB.L.natural, d = Lk.img.data, { BW, BH, TX, id } = RB, sc = [], P = RL_P.wildRim, kz = Math.pow(maxScale / minScale, 1 / (P.scales - 1)); for (let q = 0; q < P.scales; q++) sc.push(minScale * Math.pow(kz, q));
  const col = (x, y, ok, inter, hov) => { const tx = Math.floor(x * TX), ty = Math.floor(y * TX); if (tx < 0 || ty < 0 || tx >= BW || ty >= BH) return null; const kk = ty * BW + tx, i = id[kk], o = kk * 4; if (i === 255 || !ok(i) || d[o + 3] < 255) return null;
    if (isWild(i)) return [d[o], d[o + 1], d[o + 2]]; let S = rlStateOf(i, 'natural', inter); if (hov) { const [c, a] = rlTintOf(i, hov === 2); S = { ...S, hov: [hex2rgb(c), a] }; } return rlApplyState([d[o], d[o + 1], d[o + 2]], S); };
  const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlLumOf(...p) - rlLumOf(...q)); return s2.length ? s2[s2.length >> 1] : null; };
  const rows = [];
  for (const w of WILDS) for (const e of rlWildOutline(w)) {
    const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; }
    const inW = (i) => w.cells.includes(i), inG = (i) => !isWild(i), byS = [], byV = {};
    for (const s of sc) { const n = Math.max(3, Math.ceil((L * s) / 4)); let worst = 9;
      for (let t = 0; t < n; t++) { const f = (t + 0.5) / n, x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
        for (const inter of [false, true]) for (const hov of [0, 1, 2]) { const Wg = med([6, 7, 8, 9].map((o) => col(x - (nx * o) / s, y - (ny * o) / s, inW, inter, 0))), G = med([6, 7, 8, 9, 9.5].map((o) => col(x + (nx * o) / s, y + (ny * o) / s, inG, inter, hov))); if (!Wg || !G) continue;
          const q = rlPairDE(Wg, G), r = Math.min(q.normal / 20, q.cvd / 12); if (r < worst) worst = r; const k = (inter ? 'i' : 'h') + hov; byV[k] = Math.min(byV[k] ?? 9, r); } }
      byS.push(+worst.toFixed(2)); }
    rows.push({ e: w.name + '/' + names[e.j] + ' (' + terr[e.j] + (fogOf(e.j) ? ',' + fogOf(e.j) : '') + ')', L: +L.toFixed(0), byS, byV: Object.fromEntries(Object.entries(byV).map(([k, v]) => [k, +v.toFixed(2)])) });
  }
  return { scales: sc.map((s) => +(s * MED_DIAM).toFixed(0)), rows };
})()`;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 800 }); const r = await mev(p, SRC); console.log('Dpx by scale', JSON.stringify(r.scales)); for (const q of r.rows) console.log(q.e.padEnd(44), String(q.L).padStart(4), JSON.stringify(q.byS), JSON.stringify(q.byV)); await b.close(); })();

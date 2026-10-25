const { launch, open, PAGE } = require('./nlib.cjs');
(async () => { const b = await launch(), errors = []; const p = await open(b, PAGE, { errors, settle: 800, q: '?terrain=clear' });
  const r = await p.evaluate(() => window.__mock.ev(`(() => { const Lk = RB.L.clear, d = Lk.img.data, { LT } = RB, sn = hex2rgb(RL_C.snow), G = hex2rgb(RL_C.gesso), F = RL_P.fog.clear, out = new Map();
    for (let k = 0; k < LT.length; k++) { if (RL_T[LT[k]] !== 'mountains' || d[k*4+3] < 255) continue; const c = [d[k*4], d[k*4+1], d[k*4+2]], key = rgb2hex(c); if (out.has(key)) { out.get(key).n++; continue; }
      const e = rlPairDE(c, sn), hz = c.map((x, j) => x + (G[j] - x) * F.hemPeak), eh = rlPairDE(hz, sn), h4 = rlPairDE(c.map((x, j) => x + (G[j] - x) * F.haze), sn); out.set(key, { n: 1, lab: rgb2lab(c).map((v) => +v.toFixed(1)), raw: [+e.normal.toFixed(1), +e.cvd.toFixed(1)], hem: [+eh.normal.toFixed(1), +eh.cvd.toFixed(1)], haze4: [+h4.normal.toFixed(1), +h4.cvd.toFixed(1)] }); }
    const bad = [...out.entries()].filter(([, v]) => v.hem[0] < 20 || v.hem[1] < 12), n = bad.reduce((s, [, v]) => s + v.n, 0), b4 = [...out.values()].filter((v) => v.haze4[0] < 20 || v.haze4[1] < 12).reduce((s, v) => s + v.n, 0);
    bad.sort((a, b) => b[1].n - a[1].n); return { colours: out.size, badColours: bad.length, badTexels: n, badAt4pct: b4, sample: bad.slice(0, 12), Lrange: [Math.min(...bad.map(([, v]) => v.lab[0])), Math.max(...bad.map(([, v]) => v.lab[0]))] }; })()`));
  console.log(JSON.stringify(r, null, 1)); await b.close(); })();

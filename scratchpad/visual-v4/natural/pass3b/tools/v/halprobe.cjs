// a province's land as the readers see it, by distance from the nearest wild outline, this page against the pass-3 final page: node halprobe.cjs <province> [scale] [cx] [cy]
// land frame (rails, pieces, labels, badges, arrows and water off); per 0.05 D band from the wild: pixels, mean L*, sd L*, mean |L - box3| (fine), mean |dL*| now vs before
const { launch, open, ev, mev, PAGE, BEFORE, OUT } = require('./lib.cjs'); const fs = require('fs');
const prov = process.argv[2] || 'Halevale', S = Number(process.argv[3] || 0.75), CX = Number(process.argv[4] || 800), CY = Number(process.argv[5] || 500);
(async () => { const b = await launch(), res = {};
  for (const [nm, file] of [['now', PAGE], ['before', BEFORE]]) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 1500 }); await p.mouse.move(720, 896);
    await ev(p, `m.setScale(${S}, ${CX}, ${CY})`); await p.waitForTimeout(1500);
    res[nm] = await mev(p, `(() => { const i = names.indexOf(${JSON.stringify(prov)}); const d = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows', 'water']); draw(); const W2 = canvas.width, H2 = canvas.height, v = viewRect(), D = MED_DIAM;
      const segs = []; for (const w of WILDS) for (const e of rlWildOutline(w)) segs.push(e); const L = new Float32Array(W2 * H2).fill(-1), dist = new Float32Array(W2 * H2);
      for (let Y = Math.ceil(v.t * dpr); Y < Math.floor(v.b * dpr); Y++) for (let X = Math.ceil(v.l * dpr); X < Math.floor(v.r * dpr); X++) { const [x, y] = toWorld((X + 0.5) / dpr, (Y + 0.5) / dpr); if (provinceAt(x, y) !== i) continue; const k = (Y * W2 + X) * 4; L[Y * W2 + X] = rgb2lab([d[k], d[k + 1], d[k + 2]])[0]; let m = Infinity; for (const e of segs) { const q = rlSegDist(x, y, e.a[0], e.a[1], e.b[0], e.b[1]); if (q < m) m = q; } dist[Y * W2 + X] = m / D; }
      return { W2, H2, L: Array.from(L, (q) => Math.round(q * 10) / 10), dist: Array.from(dist, (q) => Math.round(q * 1000) / 1000) }; })()`);
    await p.context().close(); }
  const A = res.now, B = res.before, W2 = A.W2, bands = {};
  for (let k = 0; k < A.L.length; k++) { if (A.L[k] < 0 || B.L[k] < 0) continue; const bd = Math.min(8, Math.floor(A.dist[k] / 0.05)), x = k % W2, y = (k - x) / W2; const fine = (Lr) => { let s = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = Lr[(y + dy) * W2 + x + dx]; if (q >= 0) { s += q; n++; } } return Math.abs(Lr[k] - s / n); };
    const o = bands[bd] ?? (bands[bd] = { n: 0, Ln: 0, Lb: 0, L2n: 0, L2b: 0, fn: 0, fb: 0, dL: 0 }); o.n++; o.Ln += A.L[k]; o.Lb += B.L[k]; o.L2n += A.L[k] ** 2; o.L2b += B.L[k] ** 2; o.fn += fine(A.L); o.fb += fine(B.L); o.dL += Math.abs(A.L[k] - B.L[k]); }
  const rows = Object.entries(bands).map(([bd, o]) => ({ band: `${(bd * 0.05).toFixed(2)}${bd == 8 ? '+' : '-' + ((+bd + 1) * 0.05).toFixed(2)} D`, px: o.n, meanL: [+(o.Ln / o.n).toFixed(1), +(o.Lb / o.n).toFixed(1)], sdL: [+Math.sqrt(o.L2n / o.n - (o.Ln / o.n) ** 2).toFixed(1), +Math.sqrt(o.L2b / o.n - (o.Lb / o.n) ** 2).toFixed(1)], fine: [+(o.fn / o.n).toFixed(2), +(o.fb / o.n).toFixed(2)], meanAbsDL: +(o.dL / o.n).toFixed(2) }));
  for (const r of rows) console.log(prov, JSON.stringify(r)); fs.writeFileSync(`${OUT}halprobe-${prov}.json`, JSON.stringify(rows, null, 1)); await b.close(); })();

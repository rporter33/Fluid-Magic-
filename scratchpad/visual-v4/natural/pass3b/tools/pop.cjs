// the rock's lightness change across a zoom step: node pop.cjs <pagefile> <tag>; pairs of scales one wheel notch apart (x1.1275) through the bake -> fine raster hand-over,
// sampled on a fixed grid of world points on the range's rock (land layer), mean |dL*| per pair; baseline pairs inside one source (bake only, fine only)
const { launch, open, ev, mev, OUT } = require('./lib.cjs'); const fs = require('fs');
const file = process.argv[2], tag = process.argv[3] || 'now';
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 1500 }); await p.mouse.move(720, 896);
  const N = 1.1275, pairs = [[1.0, 1.0 * N], [1.13, 1.13 * N], [1.2, 1.2 * N], [1.27, 1.29], [1.27, 1.27 * N], [1.43, 1.43 * N], [1.61, 1.61 * N], [1.9, 1.9 * N]];
  const res = await mev(p, `(() => { const w = WILDS[0]; let cx = 0, cy = 0; for (const c of w.cells) { cx += cent[c][0]; cy += cent[c][1]; } cx /= w.cells.length; cy /= w.cells.length;
    const pts = []; for (let gy = -60; gy <= 60; gy += 3) for (let gx = -160; gx <= 160; gx += 3) { const x = cx + gx, y = cy + gy, c = provinceAt(x, y); if (c >= 0 && isWild(c)) pts.push([x, y]); }
    const at = (s) => { window.__mock.setScale(s, cx, cy); const d = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, out = []; for (const [x, y] of pts) { const [sx, sy] = toScreen(x, y), X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr), k = (Y * W2 + X) * 4; const lab = rgb2lab([d[k], d[k + 1], d[k + 2]]); out.push([lab[0], Math.hypot(lab[1], lab[2])]); } return { s, src: rlMsSource(), fk: +(typeof rlMsFineK === 'function' ? rlMsFineK() : rlMsSource() === 'fine' ? 1 : 0).toFixed(3), v: out }; };
    const rows = []; for (const [a, b] of ${JSON.stringify(pairs)}) { const A = at(a), B = at(b); let n = 0, sum = 0, sa = 0, sb = 0; for (let k = 0; k < pts.length; k++) { if (A.v[k][1] >= 9 || B.v[k][1] >= 9) continue; n++; sum += Math.abs(A.v[k][0] - B.v[k][0]); sa += A.v[k][0]; sb += B.v[k][0]; }
      const sdA = Math.sqrt(A.v.reduce((q, v) => q + (v[1] < 9 ? (v[0] - sa / n) ** 2 : 0), 0) / n), sdB = Math.sqrt(B.v.reduce((q, v) => q + (v[1] < 9 ? (v[0] - sb / n) ** 2 : 0), 0) / n);
      rows.push({ a, b, srcA: A.src + ':' + A.fk, srcB: B.src + ':' + B.fk, rockPts: n, meanAbsDL: +(sum / n).toFixed(2), meanL: [+(sa / n).toFixed(1), +(sb / n).toFixed(1)], sdL: [+sdA.toFixed(1), +sdB.toFixed(1)] }); }
    return rows; })()`);
  for (const r of res) console.log(tag, JSON.stringify(r)); fs.writeFileSync(`${OUT}pop-${tag}.json`, JSON.stringify(res, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close();
})();


// (3) the readers (§5): thirteen features of lightness per square patch of 0.3 D_px wholly inside a province (half a patch from its edge), on the rendered land (no rails,
// pieces, labels or water); a linear discriminant trained and tested on disjoint provinces (two folds, stratified by terrain). In sight; and the unexplored state, read by the
// reader trained in sight. Normal vision and the three deficiencies; "texture" drops the mean, p10 and p90.
// Polish (pass-2 verifier items 7 and 8): (a) the Mid reader read 27 of 29 provinces because the view at Mid held one hills province (Karwick) and one wasteland (Duskholt):
// a reader trained on the other provinces had never seen their terrain. The training set now holds at least two provinces of every terrain under test: where the view has
// fewer, further views at the same zoom are pooled (the view shifted by 0.6 of its size, in a fixed order), as the verifier's own reader pools views. (b) The verifier's Far
// reader and this one disagreed (0.864 against 0.894 on unexplored land) because they tested different land: this reader renders every province unexplored and reads it
// with a reader trained in sight (two folds); the verifier's reads the provinces unexplored in the game (8 at the east edge, 81 patches, one hills and one mountains
// province) by leave-one-province-out on the frame as it is. Both protocols now run here (verifier.*): leave-one-out on the frame as it is, by fog state, with the same
// provinces read in sight as a control (what the fog itself costs), and every province forced unexplored read by leave-one-out trained in sight.
function rlPatchFeats(Lp, n) { // Lp: n x n lightness; the prototype's thirteen features (proto/classify.py feats)
  const N2 = n * n, v = Array.from(Lp).sort((a, b) => a - b); let mu = 0; for (const x of Lp) mu += x; mu /= N2; let s2 = 0, s3 = 0, dark = 0, light = 0; for (const x of Lp) { const d = x - mu; s2 += d * d; s3 += d * d * d; if (d < -6) dark++; if (d > 6) light++; } const sd = Math.sqrt(s2 / N2) + 1e-6;
  const at = (x, y) => Lp[y * n + x]; let g1 = 0, ng1 = 0, lap = 0, nl = 0, jxx = 0, jyy = 0, jxy = 0;
  for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) { const gx = at(x + 1, y) - at(x - 1, y), gy = at(x, y + 1) - at(x, y - 1); g1 += Math.hypot(gx, gy); ng1++; jxx += gx * gx; jyy += gy * gy; jxy += gx * gy; lap += Math.abs(4 * at(x, y) - at(x - 1, y) - at(x + 1, y) - at(x, y - 1) - at(x, y + 1)); nl++; }
  const h2 = n >> 1, Hh = new Float32Array(h2 * h2); for (let y = 0; y < h2; y++) for (let x = 0; x < h2; x++) Hh[y * h2 + x] = (at(2 * x, 2 * y) + at(2 * x + 1, 2 * y) + at(2 * x, 2 * y + 1) + at(2 * x + 1, 2 * y + 1)) / 4;
  let g2 = 0, ng2 = 0; for (let y = 1; y < h2 - 1; y++) for (let x = 1; x < h2 - 1; x++) { g2 += Math.hypot(Hh[y * h2 + x + 1] - Hh[y * h2 + x - 1], Hh[(y + 1) * h2 + x] - Hh[(y - 1) * h2 + x]); ng2++; }
  const ac = (k) => { let a = 0, na = 0, b = 0, nb = 0; for (let y = 0; y < n; y++) for (let x = 0; x + k < n; x++) { a += (at(x + k, y) - mu) * (at(x, y) - mu); na++; } for (let y = 0; y + k < n; y++) for (let x = 0; x < n; x++) { b += (at(x, y + k) - mu) * (at(x, y) - mu); nb++; } return (a / na + b / nb) / 2 / (sd * sd); };
  const coh = Math.sqrt((jxx - jyy) ** 2 + 4 * jxy * jxy) / (jxx + jyy + 1e-6);
  return [mu, v[Math.floor(0.1 * N2)], v[Math.floor(0.9 * N2)], Math.log(sd), s3 / N2 / sd ** 3, Math.log(g1 / ng1 + 1e-3), Math.log((ng2 ? g2 / ng2 : 0) + 1e-3), Math.log(lap / nl + 1e-3), coh, dark / N2, light / N2, ac(2), ac(4)];
}
function rlLDA(X, y, K) { // standardised features, pooled covariance with 10% shrinkage toward its diagonal; returns predict(x)
  const D = X[0].length, mu = new Array(D).fill(0), sd = new Array(D).fill(0); for (const x of X) x.forEach((v, j) => (mu[j] += v / X.length)); for (const x of X) x.forEach((v, j) => (sd[j] += (v - mu[j]) ** 2 / X.length)); for (let j = 0; j < D; j++) sd[j] = Math.sqrt(sd[j]) || 1;
  const Z = X.map((x) => x.map((v, j) => (v - mu[j]) / sd[j])), cm = [...Array(K)].map(() => new Array(D).fill(0)), cn = new Array(K).fill(0); Z.forEach((z, k) => { cn[y[k]]++; z.forEach((v, j) => (cm[y[k]][j] += v)); }); for (let c = 0; c < K; c++) if (cn[c]) cm[c] = cm[c].map((v) => v / cn[c]);
  const S = [...Array(D)].map(() => new Array(D).fill(0)); Z.forEach((z, k) => { const m = cm[y[k]]; for (let a = 0; a < D; a++) for (let b = 0; b < D; b++) S[a][b] += ((z[a] - m[a]) * (z[b] - m[b])) / Z.length; });
  for (let a = 0; a < D; a++) for (let b = 0; b < D; b++) S[a][b] = a === b ? S[a][b] + 1e-6 : S[a][b] * 0.9;
  const inv = (() => { const n = D, M = S.map((r, i) => [...r, ...[...Array(n)].map((_, j) => (i === j ? 1 : 0))]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; const piv = M[c][c] || 1e-9; for (let j = 0; j < 2 * n; j++) M[c][j] /= piv; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; if (f) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; } } return M.map((r) => r.slice(n)); })();
  const W = cm.map((m) => inv.map((row) => row.reduce((a, v, j) => a + v * m[j], 0))), b0 = cm.map((m, c) => -0.5 * W[c].reduce((a, v, j) => a + v * m[j], 0));
  return (x) => { const z = x.map((v, j) => (v - mu[j]) / sd[j]); let best = -1, bv = -Infinity; for (let c = 0; c < K; c++) { if (!cn[c]) continue; const s = W[c].reduce((a, v, j) => a + v * z[j], 0) + b0[c]; if (s > bv) { bv = s; best = c; } } return best; };
}
// the patches of one rendered frame (d), with the features in each vision asked for; per province: every patch of n device px wholly inside it, in view, half a patch from its edge
function rlReaderPatchesOf(d, visions) {
  const W2 = canvas.width, Dp = MED_DIAM * cam.s, n = Math.min(48, Math.max(12, Math.round(0.3 * Dp))) * dpr, st = Math.max(4, n >> 1), v = viewRect(), out = [];
  const Ms = visions.map((vi) => (vi && vi !== 'normal' ? CVD[vi] : null)), Lof = (k, m) => { let r = d[k], g = d[k + 1], b = d[k + 2]; if (m) { const c = cvdRgb([r, g, b], m); r = c[0]; g = c[1]; b = c[2]; } return rlL(r, g, b); };
  for (const i of provList) {
    const bb = geo(i).bb, [sx0, sy0] = toScreen(bb[0], bb[1]), [sx1, sy1] = toScreen(bb[2], bb[3]);
    for (let py = Math.ceil(Math.max(v.t, sy0) * dpr); py + n <= Math.min(v.b, sy1) * dpr; py += st) for (let px = Math.ceil(Math.max(v.l, sx0) * dpr); px + n <= Math.min(v.r, sx1) * dpr; px += st) { // stride half a patch (the prototype's)
      const cx = (px + n / 2) / dpr, cy = (py + n / 2) / dpr, [wx, wy] = toWorld(cx, cy); if (!d3.polygonContains(cells[i], [wx, wy]) || !inModel(wx, wy)) continue;
      if (distToEdge(cells[i], wx, wy) < (0.525 * (n / dpr)) / cam.s) continue; // the centre at least half a patch from the edge, and every corner inside (convex cells): wholly inside
      if (![[px, py], [px + n, py], [px, py + n], [px + n, py + n]].every(([qx, qy]) => d3.polygonContains(cells[i], toWorld(qx / dpr, qy / dpr)))) continue;
      const X0 = Math.floor(px), Y0 = Math.floor(py), f = {}; visions.forEach((vi, q) => { const Lp = new Float32Array(n * n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) Lp[y * n + x] = Lof(((Y0 + y) * W2 + X0 + x) * 4, Ms[q]); f[vi] = rlPatchFeats(Lp, n); });
      out.push({ i, t: RL_TI[terr[i]], fog: fogOf(i) || 'sight', f });
    }
  }
  return out;
}
// one frame in a fog state (null: every province in sight; 'unexplored': every province unexplored; undefined: as it is), the land alone
function rlReaderFrame(fogState) { const keep = RL_DBG.fog; RL_DBG.fog = fogState; try { return rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows', 'water']); } finally { RL_DBG.fog = keep; RCK = null; } }
function rlReaderPatches(fogState, vision) { const d = rlReaderFrame(fogState); draw(); return { patches: rlReaderPatchesOf(d, [vision ?? 'normal']).map((p) => ({ ...p, f: p.f[vision ?? 'normal'] })) }; } // (the single-view form, kept for review)
// the views pooled at this zoom: this one, then views shifted by 0.6 of the view in a fixed order, until every terrain with patches has two provinces (at most nine views)
const RL_POOL = [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6]];
function rlNatReader(visions = ['normal', 'deutan', 'tritan', 'protan']) {
  const res = { scale: +cam.s.toFixed(3), Dpx: +(MED_DIAM * cam.s).toFixed(1), band: bandOf(cam.s), look: rlShownLook() }, keep = { x: cam.x, y: cam.y }, v = viewRect(), S = [], U = [], seen = new Set(), views = [];
  try { for (const [fx, fy] of RL_POOL) {
      cam.x = keep.x - fx * (v.r - v.l); cam.y = keep.y - fy * (v.b - v.t); clampCam(); const at = Math.round(cam.x) + ',' + Math.round(cam.y); if (seen.has(at)) continue; seen.add(at); views.push(at);
      const tag = (P) => P.map((p) => ({ ...p, view: views.length - 1 }));
      S.push(...tag(rlReaderPatchesOf(rlReaderFrame(null), visions))); U.push(...tag(rlReaderPatchesOf(rlReaderFrame('unexplored'), ['normal']))); 
      const byT = new Map(); for (const p of S) { const q = byT.get(p.t) ?? new Set(); q.add(p.i); byT.set(p.t, q); } if ([...byT.values()].every((q) => q.size >= 2)) break; }
  } finally { cam.x = keep.x; cam.y = keep.y; RCK = null; draw(); }
  res.views = views.length; res.provinces = new Set(S.map((p) => p.i)).size;
  const byT = {}; provList.forEach((i) => (byT[terr[i]] ??= []).push(i)); const fold = new Map(); for (const L of Object.values(byT)) L.sort((a, b) => a - b).forEach((i, k) => fold.set(i, k % 2));
  const run = (train, test, vis, cols) => { const pick = (f) => (cols ? cols.map((c) => f[vis][c]) : f[vis]); let ok = 0, n = 0; const votes = new Map();
    for (const F of [0, 1]) { const tr = train.filter((p) => fold.get(p.i) !== F), te = test.filter((p) => fold.get(p.i) === F); if (!tr.length || !te.length) continue; const pred = rlLDA(tr.map((p) => pick(p.f)), tr.map((p) => p.t), 7);
      for (const p of te) { const c = pred(pick(p.f)); n++; if (c === p.t) ok++; const vv = votes.get(p.i) ?? new Array(7).fill(0); vv[c]++; votes.set(p.i, vv); } }
    let pOk = 0; const missed = []; for (const [i, vv] of votes) { const c = vv.indexOf(Math.max(...vv)); if (c === RL_TI[terr[i]]) pOk++; else missed.push(`${names[i]} (${terr[i]} read ${RL_T[c]})`); }
    return { patches: n, patchAcc: r3(ok / Math.max(1, n)), provinces: votes.size, provinceAcc: r3(pOk / Math.max(1, votes.size)), missed: missed.slice(0, 6) }; };
  const TEX = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  for (const vis of visions) { res[vis] = { lightness: run(S, S, vis), texture: run(S, S, vis, TEX) }; if (vis === 'normal') { res[vis].unexplored = run(S, U, 'normal'); res[vis].unexploredTexture = run(S, U, 'normal', TEX); } }
  res.verifier = rlVerifierReader();
  const N0 = res.normal, V = res.verifier; res.need = { province: 0.95, patch: 0.90, note: 'at Mid, in sight and on unexplored land; at Far (55 to 85 px a province) unexplored patches 0.88 in both protocols' };
  res.pass = N0.lightness.provinceAcc >= 0.95 && N0.lightness.patchAcc >= 0.9 && N0.unexplored.provinceAcc >= 0.95 && N0.unexplored.patchAcc >= 0.9;
  res.farPass = N0.lightness.patchAcc >= 0.9 && N0.lightness.provinceAcc >= 0.95 && N0.unexplored.patchAcc >= 0.88 && (V.unexplored.acc == null || V.unexplored.acc >= 0.88) && V.forcedUnexplored.acc >= 0.88;
  return res;
}
// the verifier's reader, ported (pass2/verify/tools/readers.py with dump.cjs): the land frame with its water (rails, pieces, labels, badges and arrows off); a grid of n device px
// patches from the view's corner at half a patch; a patch counts when every pixel is in one province (the bake's id at the pixel's centre), on the model and not a wild, its
// centre is at least 0.525 n from another province by the 4-neighbour distance, and water covers at most 5% of it; thirteen lightness features (L* from the CIE Y of the
// readers' own coefficients); leave one province out. Reconciled statistics (natural/design-final.md 'Polish pass'): actual (the frame as it is, by fog state; the verifier's),
// control (the frame with every province in sight, on the provinces the game has unexplored), forced (read in sight, tested with every province unexplored)
function rlVerifierPatches(fogState) {
  const keep = RL_DBG.fog; RL_DBG.fog = fogState; let d; try { d = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']); } finally { RL_DBG.fog = keep; RCK = null; }
  const W2 = canvas.width, H2 = canvas.height, { BW, BH, TX, id } = RB, wm = makeCanvas(W2, H2), wg = wm.getContext('2d', { willReadFrequently: true }); worldT(wg); wg.fillStyle = '#fff'; wg.strokeStyle = '#fff'; wg.lineCap = 'round';
  for (const L of [...RB.water.lakes, ...RB.water.ponds]) { wg.beginPath(); L.P.forEach(([x, y], k) => (k ? wg.lineTo(x, y) : wg.moveTo(x, y))); wg.closePath(); wg.fill(); wg.lineWidth = 6 * RLK; wg.stroke(); }
  for (const st of RB.water.streams) { wg.lineWidth = 2 * (st.w1 + 3 * RLK); wg.beginPath(); st.pts.forEach(([x, y], k) => (k ? wg.lineTo(x, y) : wg.moveTo(x, y))); wg.stroke(); }
  const wd = wg.getImageData(0, 0, W2, H2).data, pid = new Uint8Array(W2 * H2), ok = new Uint8Array(W2 * H2), wet = new Uint8Array(W2 * H2), Lm = new Float32Array(W2 * H2);
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  for (let Y = 0, k = 0; Y < H2; Y++) for (let X = 0; X < W2; X++, k++) { const [x, y] = toWorld((X + 0.5) / dpr, (Y + 0.5) / dpr); let i = 255; if (x >= 0 && y >= 0 && x < W && y < H && inModel(x, y)) { const tx = Math.floor(x * TX), ty = Math.floor(y * TX); if (tx < BW && ty < BH) i = id[ty * BW + tx]; if (i !== 255 && !isWild(i)) ok[k] = 1; } pid[k] = i; if (wd[k * 4 + 3] > 0) wet[k] = 1;
    const yy = 0.2126729 * lin(d[k * 4]) + 0.7151522 * lin(d[k * 4 + 1]) + 0.072175 * lin(d[k * 4 + 2]); Lm[k] = yy > 216 / 24389 ? 116 * Math.cbrt(yy) - 16 : (24389 / 27) * yy; }
  const Dp = MED_DIAM * cam.s, n = Math.round(Math.min(48, Math.max(12, Math.round(0.3 * Dp)))) * dpr, st = Math.max(4, n >> 1), maxd = n + 2, dist = new Int32Array(W2 * H2); let cur = new Uint8Array(W2 * H2);
  for (let Y = 1; Y < H2 - 1; Y++) for (let X = 1; X < W2 - 1; X++) { const k = Y * W2 + X, i = pid[k]; if (pid[k - 1] === i && pid[k + 1] === i && pid[k - W2] === i && pid[k + W2] === i) cur[k] = 1; }
  for (let it = 0; it < maxd; it++) { let any = false; const nx = new Uint8Array(W2 * H2); for (let k = 0; k < cur.length; k++) if (cur[k]) { dist[k]++; any = true; } if (!any) break; for (let Y = 1; Y < H2 - 1; Y++) for (let X = 1; X < W2 - 1; X++) { const k = Y * W2 + X; if (cur[k] && cur[k - 1] && cur[k + 1] && cur[k - W2] && cur[k + W2]) nx[k] = 1; } cur = nx; }
  const v = viewRect(), x0 = Math.trunc(v.l * dpr), x1 = Math.trunc(v.r * dpr), y0 = Math.trunc(v.t * dpr), y1 = Math.trunc(v.b * dpr), out = [];
  for (let y = y0; y < y1 - n; y += st) for (let x = x0; x < x1 - n; x += st) { const i = pid[y * W2 + x]; if (i === 255) continue; let good = true, wn = 0;
    for (let yy = y; yy < y + n && good; yy++) for (let xx = x; xx < x + n; xx++) { const k = yy * W2 + xx; if (pid[k] !== i || !ok[k]) { good = false; break; } wn += wet[k]; }
    if (!good || dist[(y + (n >> 1)) * W2 + x + (n >> 1)] < 0.525 * n || wn / (n * n) > 0.05) continue;
    const Lp = new Float32Array(n * n); for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) Lp[yy * n + xx] = Lm[(y + yy) * W2 + x + xx]; out.push({ i, t: RL_TI[terr[i]], fog: fogOf(i) || 'sight', f: rlPatchFeats(Lp, n) }); }
  return { patches: out, n };
}
function rlVerifierReader() {
  const A = rlVerifierPatches(undefined), S = rlVerifierPatches(null), U = rlVerifierPatches('unexplored'); draw();
  const lopo = (train, test) => { const pred = new Map(); for (const i of new Set(test.map((p) => p.i))) { const tr = train.filter((p) => p.i !== i), P = rlLDA(tr.map((p) => p.f), tr.map((p) => p.t), 7); for (const p of test) if (p.i === i) pred.set(p, P(p.f)); } return pred; };
  const acc = (pred, sel = () => true) => { let ok = 0, n = 0; for (const [p, c] of pred) if (sel(p)) { n++; if (c === p.t) ok++; } return { patches: n, acc: n ? r3(ok / n) : null }; };
  const pa = lopo(A.patches, A.patches), uIds = new Set(A.patches.filter((p) => p.fog === 'unexplored').map((p) => p.i));
  return { patchPx: A.n, all: acc(pa), sight: acc(pa, (p) => p.fog === 'sight'), outofsight: acc(pa, (p) => p.fog === 'outofsight'), unexplored: acc(pa, (p) => p.fog === 'unexplored'), unexploredProvinces: [...uIds].map((i) => names[i]),
    unexploredInSightControl: acc(lopo(S.patches, S.patches.filter((p) => uIds.has(p.i)))), forcedUnexplored: acc(lopo(S.patches, U.patches)) };
}

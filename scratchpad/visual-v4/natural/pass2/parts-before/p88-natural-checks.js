
// ------------------------------------------------------------------ the natural view's checks (natural §13): window.__mock.reliefNatural, reliefLines, reliefSeats, reliefHoverChips, reliefCliff
// Read-only helpers for automated review. Colours are measured on the rendered canvas (the composite as drawn) or on the bake as baked, never on the design's tables.
const rlL = (r, g, b) => { const y = 0.2126 * s2l(r) + 0.7152 * s2l(g) + 0.0722 * s2l(b); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y; };
const rlOk = (r, g, b) => { const l = Math.cbrt(0.4122214708 * s2l(r) + 0.5363325363 * s2l(g) + 0.0514459929 * s2l(b)), m = Math.cbrt(0.2119034982 * s2l(r) + 0.6806995451 * s2l(g) + 0.1073969566 * s2l(b)), s = Math.cbrt(0.0883024619 * s2l(r) + 0.2817188376 * s2l(g) + 0.6299787005 * s2l(b)); return Math.hypot(1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s); };
const rlPct = (a, f) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
const r3 = (v) => (v == null ? null : +v.toFixed(3));
// (1) chroma: no texel of the natural bake over OKLCH C 0.10, nor any material (§2.3)
function rlNatChroma() {
  const Lk = RB.L.natural; if (!Lk) return { baked: false }; const d = Lk.img.data, { LT } = RB, memo = new Map(); let n = 0, over = 0, max = 0; const hist = [];
  for (let k = 0; k < LT.length; k += 2) { if (LT[k] >= 7) continue; const o = k * 4, key = (d[o] << 16) | (d[o + 1] << 8) | d[o + 2]; let c = memo.get(key); if (c == null) { c = rlOk(d[o], d[o + 1], d[o + 2]); memo.set(key, c); } n++; if (c > 0.10) over++; if (c > max) max = c; if ((k & 63) === 0) hist.push(c); }
  const mats = []; for (const [t, M] of Object.entries(RL_NAT.mat)) for (const [nm, lab] of Object.entries(M)) { const o = [0, 0, 0]; rlLabTo(lab[0], lab[1], lab[2], o, 0); mats.push([t + '.' + nm, rgb2hex(o), +rlOk(...o).toFixed(3)]); }
  mats.sort((a, b) => b[2] - a[2]);
  return { texels: n, over010: over, max: r3(max), p99: r3(rlPct(hist, 0.99)), cap: 0.10, materialsMax: mats[0], materialsOver010: mats.filter((m) => m[2] > 0.10).length, pass: over === 0 && mats.every((m) => m[2] <= 0.10) };
}
// (1b) snow (§10 defect 2, both looks): no passable texel of the bake within 20 / 12 of the snow #F2EEE6, raw and under the unexplored haze of the look
function rlSnowCheck(look = rlShownLook()) {
  const Lk = RB.L[look]; if (!Lk) return { baked: false, look }; const d = Lk.img.data, { LT } = RB, sn = hex2rgb(RL_C.snow), F = RL_P.fog[look], G = hex2rgb(RL_C.gesso), memo = new Map(), byT = {};
  for (let k = 0; k < LT.length; k++) { const t = LT[k]; if (t >= 7 || d[k * 4 + 3] < 255) continue; const key = (d[k * 4] << 16) | (d[k * 4 + 1] << 8) | d[k * 4 + 2]; let v = memo.get(key);
    if (!v) { const c = [d[k * 4], d[k * 4 + 1], d[k * 4 + 2]], e = rlPairDE(c, sn), hz = c.map((x, j) => x + (G[j] - x) * F.hemPeak), eh = rlPairDE(hz, sn); v = [e.normal, e.cvd, eh.normal, eh.cvd]; memo.set(key, v); }
    const b = (byT[RL_T[t]] ??= { n: 0, near: 0, nearHaze: 0, minN: 99, minC: 99 }); b.n++; if (v[0] < 20 || v[1] < 12) b.near++; if (v[2] < 20 || v[3] < 12) b.nearHaze++; b.minN = Math.min(b.minN, v[0]); b.minC = Math.min(b.minC, v[1]); }
  const rows = Object.fromEntries(Object.entries(byT).map(([t, b]) => [t, { texels: b.n, within2012: b.near, withinUnderHaze: b.nearHaze, minNormal: +b.minN.toFixed(1), minCvd: +b.minC.toFixed(1) }]));
  return { look, byTerrain: rows, pass: Object.values(byT).every((b) => !b.near && !b.nearHaze) };
}
// (2) N4: each province's own cover. Whole province >= 0.70 own (copses and hedge trees as forest); core (0.15 D in) >= 0.95 own (copses as its own); copses <= 25% of a core
function rlNatCover() {
  if (!RB.nat) return { baked: false }; const { cls } = RB.nat, { BW, BH, TX, id, LT } = RB, A = new Map();
  for (let ty = 1; ty < BH; ty += 2) for (let tx = 1; tx < BW; tx += 2) {
    const k = ty * BW + tx, i = id[k]; if (i === 255 || RL_WILDK[i] || LT[k] >= 7) continue; const own = RL_TI[terr[i]], c = cls[k], x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
    let a = A.get(i); if (!a) A.set(i, (a = { n: 0, ownF: 0, ownC: 0, cn: 0, cownC: 0, cownF: 0, ccopse: 0 }));
    const asForest = c === 9 || c === 10 ? 2 : c, isOwnF = asForest === own, isOwnC = c === own || ((c === 9 || c === 10) && (own === 0 || own === 3 || own === 1)) || (c === 9 && own === 2);
    a.n++; if (isOwnF) a.ownF++; if (isOwnC) a.ownC++;
    if (distToEdge(cells[i], x, y) >= 0.15 * RLD) { a.cn++; if (isOwnC) a.cownC++; if (isOwnF) a.cownF++; if (c === 9) a.ccopse++; }
  }
  const rows = [...A].map(([i, a]) => ({ name: names[i], terrain: terr[i], whole: a.ownF / a.n, wholeOwnCopses: a.ownC / a.n, core: a.cn ? a.cownC / a.cn : null, coreCopsesAsForest: a.cn ? a.cownF / a.cn : null, copseCore: a.cn ? a.ccopse / a.cn : 0 }));
  const col = (k) => rows.map((r) => r[k]).filter((v) => v != null), byT = {};
  for (const r of rows) { const b = (byT[r.terrain] ??= { n: 0, wholeMin: 1, coreMin: 1 }); b.n++; b.wholeMin = Math.min(b.wholeMin, r.whole); if (r.core != null) b.coreMin = Math.min(b.coreMin, r.core); }
  const worst = rows.reduce((p, q) => (q.whole < p.whole ? q : p));
  const scan = [rlNatCoverGen, rlParcel, rlH2].map((f) => f.toString()).join('\n').match(/Math\.(cos|sin|tan|exp|log|pow|atan2|random)\b/g) ?? []; // N8: the cover raster uses arithmetic, sqrt, floor and table noise only
  return { sourceScan: { transcendentals: scan, pass: !scan.length }, provinces: rows.length, wholeMin: r3(Math.min(...col('whole'))), wholeMedian: r3(rlPct(col('whole'), 0.5)), wholeOwnCopsesMin: r3(Math.min(...col('wholeOwnCopses'))), coreMin: r3(Math.min(...col('core'))), coreCopsesAsForestMin: r3(Math.min(...col('coreCopsesAsForest'))), copseCoreMax: r3(Math.max(...col('copseCore'))), worst: `${worst.name} (${worst.terrain}) ${worst.whole.toFixed(3)}`, byTerrain: Object.fromEntries(Object.entries(byT).map(([t, b]) => [t, { n: b.n, wholeMin: r3(b.wholeMin), coreMin: r3(b.coreMin) }])), need: { whole: 0.70, core: 0.95, copseCore: 0.25 }, pass: Math.min(...col('whole')) >= 0.70 && Math.min(...col('core')) >= 0.95 && Math.max(...col('copseCore')) <= 0.25 };
}
// (3) the readers (§5): thirteen features of lightness per square patch of 0.3 D_px wholly inside a province (half a patch from its edge), on the rendered land (no rails,
// pieces, labels or water); a linear discriminant trained and tested on disjoint provinces (two folds, stratified by terrain). In sight; and the unexplored state, read by the
// reader trained in sight. Normal vision and the three deficiencies; "texture" drops the mean, p10 and p90.
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
function rlReaderPatches(fogState, vision) { // patches of the land as rendered at the current zoom; RL_DBG.fog forces one fog state on every province
  const keep = RL_DBG.fog; RL_DBG.fog = fogState; const d = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows', 'water']); RL_DBG.fog = keep; RCK = null; draw();
  const W2 = canvas.width, Dp = MED_DIAM * cam.s, n = Math.min(48, Math.max(12, Math.round(0.3 * Dp))) * dpr, st = Math.max(4, n >> 1), v = viewRect(), m = vision && vision !== 'normal' ? CVD[vision] : null, out = [];
  const Lof = (k) => { let r = d[k], g = d[k + 1], b = d[k + 2]; if (m) { const c = cvdRgb([r, g, b], m); r = c[0]; g = c[1]; b = c[2]; } return rlL(r, g, b); };
  for (const i of provList) {
    const bb = geo(i).bb, [sx0, sy0] = toScreen(bb[0], bb[1]), [sx1, sy1] = toScreen(bb[2], bb[3]);
    for (let py = Math.ceil(Math.max(v.t, sy0) * dpr); py + n <= Math.min(v.b, sy1) * dpr; py += st) for (let px = Math.ceil(Math.max(v.l, sx0) * dpr); px + n <= Math.min(v.r, sx1) * dpr; px += st) { // stride half a patch (the prototype's)
      const cx = (px + n / 2) / dpr, cy = (py + n / 2) / dpr, [wx, wy] = toWorld(cx, cy); if (!d3.polygonContains(cells[i], [wx, wy]) || !inModel(wx, wy)) continue;
      if (distToEdge(cells[i], wx, wy) < (0.525 * (n / dpr)) / cam.s) continue; // the centre at least half a patch from the edge, and every corner inside (convex cells): wholly inside
      if (![[px, py], [px + n, py], [px, py + n], [px + n, py + n]].every(([qx, qy]) => d3.polygonContains(cells[i], toWorld(qx / dpr, qy / dpr)))) continue;
      const Lp = new Float32Array(n * n), X0 = Math.floor(px), Y0 = Math.floor(py); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) Lp[y * n + x] = Lof(((Y0 + y) * W2 + X0 + x) * 4);
      out.push({ i, t: RL_TI[terr[i]], f: rlPatchFeats(Lp, n) });
    }
  }
  return { patches: out, n };
}
function rlNatReader(visions = ['normal', 'deutan', 'tritan', 'protan']) {
  const res = { scale: +cam.s.toFixed(3), Dpx: +(MED_DIAM * cam.s).toFixed(1), band: bandOf(cam.s), look: rlShownLook() }, byT = {}; provList.forEach((i) => (byT[terr[i]] ??= []).push(i));
  const fold = new Map(); for (const L of Object.values(byT)) L.sort((a, b) => a - b).forEach((i, k) => fold.set(i, k % 2));
  const run = (train, test, cols) => { const pick = (f) => (cols ? cols.map((c) => f[c]) : f); let ok = 0, n = 0; const votes = new Map();
    for (const F of [0, 1]) { const tr = train.filter((p) => fold.get(p.i) !== F), te = test.filter((p) => fold.get(p.i) === F); if (!tr.length || !te.length) continue; const pred = rlLDA(tr.map((p) => pick(p.f)), tr.map((p) => p.t), 7);
      for (const p of te) { const c = pred(pick(p.f)); n++; if (c === p.t) ok++; const v = votes.get(p.i) ?? new Array(7).fill(0); v[c]++; votes.set(p.i, v); } }
    let pOk = 0; const missed = []; for (const [i, v] of votes) { const c = v.indexOf(Math.max(...v)); if (c === RL_TI[terr[i]]) pOk++; else missed.push(`${names[i]} (${terr[i]} read ${RL_T[c]})`); }
    return { patches: n, patchAcc: r3(ok / Math.max(1, n)), provinces: votes.size, provinceAcc: r3(pOk / Math.max(1, votes.size)), missed: missed.slice(0, 6) }; };
  const TEX = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  for (const vis of visions) {
    const inS = rlReaderPatches(null, vis).patches, unx = vis === 'normal' ? rlReaderPatches('unexplored', vis).patches : null;
    res[vis] = { lightness: run(inS, inS), texture: run(inS, inS, TEX) }; if (unx) { res[vis].unexplored = run(inS, unx); res[vis].unexploredTexture = run(inS, unx, TEX); }
  }
  const N0 = res.normal; res.need = { province: 0.95, patch: 0.90, note: 'at Mid, in sight and on unexplored land' };
  res.pass = N0.lightness.provinceAcc >= 0.95 && N0.lightness.patchAcc >= 0.9 && N0.unexplored.provinceAcc >= 0.95 && N0.unexplored.patchAcc >= 0.9;
  return res;
}
function rlNaturalCheck(readers = true) { return { look: rlShownLook(), chroma: rlNatChroma(), cover: rlNatCover(), snow: rlSnowCheck('natural'), readers: readers && rlShownLook() === 'natural' ? rlNatReader() : 'not run (the look on screen is Clear)' }; }
// (4) lines on rendered pixels (§8.2): per drawn segment, the best contrast of the line's pixels (the partner's counted) against the same pixel without lines.
// Hairline (+-3 px) >= 2.3:1, internal keyline (0 to 6 px on its lower-right side) >= 3.2:1; one keyline per edge; no hairline wider than 3 px. Fog-dashed edges are skipped.
function rlLinesCheck() {
  const land = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect();
  const px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const R = { hair: [], int: [], skippedFog: 0, edges: RL_LINES.drawn.length, flips: RL_LINES.stats.flips, partners: RL_LINES.stats.partners, segs: RL_LINES.stats.segs, maxHairWidthPx: RL_LINES.stats.maxWidthPx }, worst = { hair: null, int: null };
  const bevel = { ulLight: 0, ulDark: 0, lrLight: 0, lrDark: 0, softLips: 0 }; for (const dr of RL_LINES.drawn) if (dr.kind === 'hair' && dr.keyLR) { bevel[dr.key === 'light' ? 'ulLight' : 'ulDark']++; bevel[dr.keyLR === 'light' ? 'lrLight' : 'lrDark']++; if (dr.soft) bevel.softLips++; } // AD fix 1: the bevel's keys per edge
  for (const dr of RL_LINES.drawn) {
    if (dr.fog) { R.skippedFog++; continue; } const e = dr.e;
    const st = rlSegStyles(e, dr.kind, rlLineCtx()), { nx, ny } = st;
    for (const sg of st.segs) {
      const [sx, sy] = toScreen((sg.x0 + sg.x1) / 2, (sg.y0 + sg.y1) / 2), Ls = Math.hypot(sg.x1 - sg.x0, sg.y1 - sg.y0) * cam.s; if (Ls < 6 || sx < v.l + 8 || sx > v.r - 8 || sy < v.t + 8 || sy > v.b - 8) continue;
      let best = 0; const offs = dr.kind === 'hair' ? [-3, 3] : [0, 6];
      for (let o = offs[0]; o <= offs[1]; o += 0.5) { const a = px(lines, sx + nx * o, sy + ny * o), b = px(land, sx + nx * o, sy + ny * o); if (!a || !b) continue; best = Math.max(best, rlWcag(a, b)); }
      R[dr.kind].push(best); if (!worst[dr.kind] || best < worst[dr.kind].c) worst[dr.kind] = { c: +best.toFixed(2), at: `${names[dr.i]}/${names[dr.j]}`, key: sg.key, partner: !!sg.partner };
    }
  }
  const sum = (a, lim) => ({ samples: a.length, min: r3(Math.min(...a)), median: r3(rlPct(a, 0.5)), under: a.filter((x) => x < lim).length, limit: lim });
  return { look: rlShownLook(), band: bandOf(cam.s), dpr, hairline: sum(R.hair, 2.3), internal: sum(R.int, 3.2), worst, bevel, edges: R.edges, segs: R.segs, partners: R.partners, keylineFlipsAlongEdges: R.flips, maxHairWidthPx: R.maxHairWidthPx, skippedFogDashed: R.skippedFog,
    pass: R.hair.every((x) => x >= 2.3) && R.int.every((x) => x >= 3.2) && R.flips === 0 && R.maxHairWidthPx <= 3 };
}
// (5) seats (§10 defect 3): the light pixels the pieces layer adds at hamlets and huts against the pixel beneath, p95 per seat <= 2.5 (Mid) or 4 (Near)
function rlSeatsCheck() {
  const on = rlRedraw(['rails', 'labels', 'badges', 'arrows', 'nonseats']), off = rlRedraw(['rails', 'labels', 'badges', 'arrows', 'pieces']), W2 = canvas.width, H2 = canvas.height, lay = RL_PIECE_CACHE.get('L'), k = cam.s / lay.s, v = viewRect(), lim = bandOf(cam.s) === 'near' ? 4 : 2.5, kinds = {};
  for (const [i, st] of lay.seats) {
    if (!st.kind || !st.box) continue; const cx = st.x * k + cam.x, cy = st.y * k + cam.y, bx = st.box.map((q, j) => q * k + (j % 2 ? cam.y : cam.x)); if (cx < v.l || cx > v.r || cy < v.t || cy > v.b) continue; const cs = []; // the seat's own box (houses, roofs to shadows), seats drawn alone
    for (let y = Math.floor((bx[1] - 2) * dpr); y <= (bx[3] + 2) * dpr; y++) for (let x = Math.floor((bx[0] - 2) * dpr); x <= (bx[2] + 2) * dpr; x++) { if (x < 0 || y < 0 || x >= W2 || y >= H2) continue; const q = (y * W2 + x) * 4; if (on[q] === off[q] && on[q + 1] === off[q + 1] && on[q + 2] === off[q + 2]) continue; const A = [on[q], on[q + 1], on[q + 2]], B2 = [off[q], off[q + 1], off[q + 2]]; if (rlL(...A) > rlL(...B2)) cs.push(rlWcag(A, B2)); }
    if (cs.length < 6) continue; const b = (kinds[st.kind] ??= { seats: 0, over: [], p95: [] }); b.seats++; const p = rlPct(cs, 0.95); b.p95.push(p); if (p > lim) b.over.push(`${names[i]} ${p.toFixed(2)}`);
  }
  const out = { band: bandOf(cam.s), Dpx: +(MED_DIAM * cam.s).toFixed(1), limit: lim, look: rlShownLook() }; for (const [kd, b] of Object.entries(kinds)) out[kd] = { seats: b.seats, p95Worst: r3(Math.max(...b.p95)), p95Median: r3(rlPct(b.p95, 0.5)), over: kd === 'town' ? 'towns are not muted (bases with rims)' : b.over };
  out.pass = ['hamlet', 'hut'].every((kd) => !out[kd] || !out[kd].over.length); return out;
}
// (6) hover names against day chips (§10 defect 4): every province in view hovered in turn
function rlHoverChipsCheck() {
  const keep = hoverProv, v = viewRect(); let hovered = 0, moved = 0, chipOnTop = 0, over = 0; const ex = [];
  for (const i of provList) { const [sx, sy] = toScreen(...cent[i]); if (sx < v.l || sx > v.r || sy < v.t || sy > v.b) continue; hoverProv = i; draw(); const L = RL_LIVE.list.find((q) => q.i === i); if (!L) continue; hovered++; if (L.moved) moved++; if (L.chipsOnTop) chipOnTop++;
    const hit = RL_CHIPS.some((q) => L.box[2] > q.box[0] && L.box[0] < q.box[2] && L.box[3] > q.box[1] && L.box[1] < q.box[3]); if (hit && !L.chipsOnTop) { over++; ex.push(names[i]); } else if (L.moved && ex.length < 4) ex.push(`${names[i]} moved`); }
  hoverProv = keep; draw(); const dc = rlDayChipsCheck(); return { chips: RL_CHIPS.map((q) => q.text), hovered, namesMoved: moved, chipRedrawnOnTop: chipOnTop, namesOverAChip: over, examples: ex, dayChipsOverNames: dc.overlaps, dayChipExamples: dc.examples, pass: over === 0 && dc.overlaps === 0 };
}
// (6b) AD fix 11: no day chip (the path's and the arrows') covers a placed name, a wild's name, or sits under the alerts ribbon, in the frame as drawn
function rlDayChipsCheck() {
  draw(); const lay = RL_PIECE_CACHE.get('L'), sh = rlLiveBox(lay), names = lay ? [...lay.labels.map((l) => ({ t: l.text, b: sh(l.box) })), ...lay.wildOps.flatMap((o) => (o.gl ? glyphBoxes(o.gl, 0) : o.box ? [o.box] : []).map((b) => ({ t: o.w.name, b: sh(b) })))] : [], room = rlChipRoom();
  let n = 0; const ex = []; for (const c of RL_CHIPS) { const r = c.box; for (const q of names) if (r[2] > q.b[0] && r[0] < q.b[2] && r[3] > q.b[1] && r[1] < q.b[3]) { n++; if (ex.length < 4) ex.push(`${c.text} over ${q.t}`); break; } if (!room.clearOfRibbon(r)) { n++; if (ex.length < 4) ex.push(`${c.text} under the alerts`); } }
  return { chips: RL_CHIPS.length, overlaps: n, examples: ex, pass: n === 0 };
}
// (7) the cliff face (§10 defect 5) on the rendered view: the stripe index (the share of gradient energy across x) and light streak columns per 100 px
function rlCliffCheck() {
  const d = rlRedraw([]), W2 = canvas.width, [x0, yE] = toScreen(RL_RC + 4, H), [x1] = toScreen(W - RL_RC - 4, H), fh = (RL_FACE - RL_PLINTH) * cam.s, pw = W / 2, [qx0] = toScreen(pw - (RL_P.plaqueD * RLD) / 2 - 4, H), [qx1] = toScreen(pw + (RL_P.plaqueD * RLD) / 2 + 4, H);
  const X0 = Math.ceil(Math.max(0, x0) * dpr), X1 = Math.floor(Math.min(cw, x1) * dpr), Y0 = Math.ceil((yE + 2) * dpr), Y1 = Math.floor((yE + fh - 2) * dpr); if (Y1 - Y0 < 6 || X1 - X0 < 40) return { visible: false };
  const fall = (X) => RB.water.falls.some((f) => Math.abs(X / dpr - toScreen(f.x, H)[0]) < f.w * cam.s * 1.6 + 3) || (X / dpr > qx0 && X / dpr < qx1); // waterfalls and the plaque are not the rock
  const cols = []; for (let X = X0; X < X1; X++) if (!fall(X)) cols.push(X); const Lm = cols.map((X) => { const c = []; for (let Y = Y0; Y <= Y1; Y++) { const k = (Y * W2 + X) * 4; c.push(rlL(d[k], d[k + 1], d[k + 2])); } return c; });
  let ex = 0, ey = 0; for (let c = 0; c + 1 < Lm.length; c++) { if (cols[c + 1] !== cols[c] + 1) continue; for (let r = 0; r + 1 < Lm[c].length; r++) { ex += (Lm[c + 1][r] - Lm[c][r]) ** 2; ey += (Lm[c][r + 1] - Lm[c][r]) ** 2; } }
  const mean = Lm.map((c) => c.reduce((a, b) => a + b, 0) / c.length); let streak = 0; for (let c = 0; c < mean.length; c++) { const w = mean.slice(Math.max(0, c - 4), c + 5).sort((a, b) => a - b); if (mean[c] - w[w.length >> 1] > 3) streak++; }
  return { visible: true, facePx: +(fh).toFixed(1), columns: cols.length, stripeIndex: r3(ex / (ex + ey)), lightStreaksPer100px: +((100 * streak) / cols.length).toFixed(1), design: { before: [0.568, 15.4], after: [0.141, 0] } };
}
Object.assign(window.__mock, {
  reliefNatural: (readers) => rlNaturalCheck(readers !== false), reliefSnow: (look) => rlSnowCheck(look), reliefLines: () => rlLinesCheck(), reliefSeats: () => rlSeatsCheck(), reliefHoverChips: () => rlHoverChipsCheck(), reliefCliff: () => rlCliffCheck(), reliefDayChips: () => rlDayChipsCheck(),
  reliefNearDetail: () => ({ strength: +rlNearK().toFixed(3), texelCssPx: +(cam.s * RB.TX).toFixed(2), drawn: !!RL_ND.cv && RL_ND.key !== '', lastMs: RL_ND.ms, builds: RL_ND.n, pixels: RL_ND.px }),
  reliefChecks: () => { const nat = rlShownLook() === 'natural'; return { look: rlShownLook(), mode: state.mode, hit: rlHitCheck(), layout: rlLayoutCheck(), means: rlMeansCheck(), natural: nat ? rlNaturalCheck(true) : 'not applicable (Clear): the 20 / 12 means and pairs run', snow: rlSnowCheck(), rails: rlRailCheck(), lines: rlLinesCheck(), seats: rlSeatsCheck(), stable: rlStableCheck(false), design: rlDesignCheck(), memory: rlMemory(), times: rlTimes() }; },
});

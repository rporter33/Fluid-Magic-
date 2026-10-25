// ------------------------------------------------------------------ pass 3 prototype "Continuous relief": the wilds as the tallest part of one heightfield (Natural only)
// The owner's read of pass 2: the Ashspine and the Greyteeth were dark smoky slabs with straight polygon edges and a pale frame, blurred up close; the Still Mere a teal polygon
// with a full rim. Here a range is not a material laid inside its cells: it is the land's own heightfield (S4's blend of the neighbouring terrains' heights, continued under
// the wild by the land weights that reach into it) lifted by a ridged range that starts at zero on the outline. The foothills inside the cells therefore start at the
// neighbouring land's height and ground, the ridges and valleys are made, lit and shadowed at the full bake resolution (1 texel, not the half-resolution shading of pass 2),
// with crisp light from the upper left, scree in the valleys and snow on the highest crests (no texel over the passable rock's cap, the pass-2 rule). The straight outline is
// carried by the thin dark contour; the light rim is drawn only where neither the ground pair nor the dark contour reaches 20 / 12 (p59b). The land around a range is shaded
// from the same heights (its hillshade, valleys and cast shadow are recomputed from them in a band round each wild), so the land rises into the range without a seam.
// Clear, the Terrain mode and the data modes keep the v4 massif and mere (S4's hh is not changed). Seeded tables only (relief:<seed>:natural:wild:*), no Math.random, no Date.
const RL_NW = { // docs/09-balance "Map presentation" rows (prototype values); distances in D, noise sizes in mapgen units, heights in S4's units
  peaks: { ridgeU: 17, ridgeOct: 5, warp: 0.5, spur: 1.6, ridge2U: 6.5, ridge2A: 0.10, amp: 0.95, lift: 0.35, coreD: 0.5, footD: [0.20, 0.42], footU: 14, ex: 1.0, castD: 0.35, castW: 0.02, castEx: 0.55, noGrain: true, ss: 2, nearTpp: 0.95, valD: 0.035, valH: 0.12, pad: 6 },
  rock: { Lsh: 12, Llit: 48, lit: [0.2, 0.8], shadeAB: [1.5, -6], litAB: [0.5, 0.5], castR: 9, scree: [36, 1, 2], screeK: 0.45, e: [0.19, 0.235], eN: 0.035, kR: 0.22, kS: 0.08, heath: [31, -3, 13], heathK: 0.4 }, // rk: rock where e + kR (ridge - 0.5) + kS steepness + fine noise passes e (the crests and steep faces turn to rock first, the valleys stay green longer; a narrow window, so outcrops have edges)
  snow: { h: 0.78, w: 0.07, crest: [0.6, 0.85], lit: [56, -0.5, -2.5], shade: [36, 0, -5], k: 0.85, litMin: [0.35, 0.6], shadeK: 0.35 }, // snow on the highest crests, mostly where they face the light (shadeK of it on the faces turned away)
  foot: { k0: 5, k1: 14, e: [0.02, 0.35], castF: 5, mirrorD: [0.08, 0.2], edgeD: [0.03, 0.14] }, // edgeD: the foothills' own shading and cast shadow fade in from the outline (the mirrored land carries its own there)
  land: { r1D: 0.06, r2D: 0.25 }, // the blurred land colour the foothills and the mere's fringe continue (quarter resolution, masked to the land)
  mere: { mirrorD: [0.24, 0.34], r: 0.78, noise: 0.20, noiseU: 15, warp: 0.35, edge: [0.025, 0.14], edgeK: 0.9, aa: 0.7, deep: 0.45, shelf: 0.22, Lshelf: 41, Ldeep: 27, ab: [-21, -3], shelfAB: [-18, 3], wetU: 0.035, wetL: 6, reedK: 0.5 },
  rim: { ink: true, inkNat: '#0B0A09', Lmin: 38, Lmax: 92, ab: [0, 3], wetL: 80, hueK: 0.8, mC: 1.3 }, // the light rim only where the dark contour fails (p59b), in the darkest stone that passes
  landAo: false, fogD: 0.22, // the neighbours' fog runs this far into the wild (p58x rlWildFogStrips)
  margin: 2.5, // the cap: no range texel lighter than the passable mountains' brightest lit rock on this bake (p99.9) plus margin
};
const rlNWSet = (w) => (w._set ??= new Set(w.cells));
// the land's heights continued under the wilds (half resolution): S4's formula on the land weights alone, normalised by their sum; where almost no land weight reaches
// (deep inside), it closes on the mean of the wild's land heights, so the field is continuous with hh across every outline
function rlNatLandHeights(out) {
  const { HW, HH, QW, QH, TX, hid, hh, wch } = out, hXl = Float32Array.from(hh), tabs = RL_T.map((tn) => rlGTable('height:' + tn)), feat = RL_T.map((tn) => RL_HT[tn][2] * RLK * RL_P.featK), wv = new Float64Array(7), WS = new Float32Array(HW * HH), sum = new Float64Array(WILDS.length), cnt = new Float64Array(WILDS.length), wix = (o) => WILDS.indexOf(wildOf[o]);
  for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) {
    const o = hid[k]; if (o === 255 || !RL_WILDK[o]) continue; const px = ((x + 0.5) * 2) / TX, py = ((y + 0.5) * 2) / TX, fq = (x + 0.5) / 2, gq = (y + 0.5) / 2; let ws = 0, h = 0;
    for (let c = 0; c < 7; c++) { wv[c] = rlBilin(wch[c], QW, QH, fq, gq); ws += wv[c]; } WS[k] = ws; if (ws < 1e-4) continue;
    for (let c = 0; c < 7; c++) { const wt = wv[c] / ws; if (wt < 0.003) continue; const tn = RL_T[c], [Bt, At] = RL_HT[tn]; const n = tn === 'mountains' ? rlRidged(tabs[c], px / feat[c], py / feat[c], 4, 0.3) : rlGFbm(tabs[c], px / feat[c], py / feat[c], tn === 'hills' ? 3 : RL_P.octaves, RL_P.hGain); h += wt * (Bt + At * n); if (tn === 'forest') h += wt * 0.04; }
    h += 0.30 * rlBilin(wch[7], QW, QH, fq, gq); if (h > 0.85) h = 0.85 + 0.15 * rlTanh((h - 0.85) / 0.15); hXl[k] = h; if (ws > 0.2) { const w = wix(o); sum[w] += h; cnt[w]++; }
  }
  for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || !RL_WILDK[o]) continue; const w = wix(o), m = cnt[w] ? sum[w] / cnt[w] : 0.6, a = Math.min(1, WS[k] / 0.02); hXl[k] = m + (hXl[k] - m) * a; }
  return hXl;
}
// the range (one per peaks wild) on a box at K x the bake resolution (P.ss: supersampled into the bake, and drawn as it is at Near, p58x): heights, the range's rise E, the
// ridge r, the distance to the outline, the slope and the Lambert shade at K x; the heights averaged to 1 x, where the cast shadow and the valleys are made (both soft)
function* rlNatRangeGen(out, w, hXl) {
  const { BW, BH, HW, HH, TX, id } = out, D = RLD, P = RL_NW.peaks, K = P.ss, TK = TX * K, VSw = RL_P.vScale * RLK * P.ex, set = rlNWSet(w), ol = rlWildOutline(w);
  let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
  const x0 = Math.max(0, Math.floor(bb[0] * TX) - P.pad), y0 = Math.max(0, Math.floor(bb[1] * TX) - P.pad), x1 = Math.min(BW - 1, Math.ceil(bb[2] * TX) + P.pad), y1 = Math.min(BH - 1, Math.ceil(bb[3] * TX) + P.pad), bw = x1 - x0 + 1, bh = y1 - y0 + 1, NB1 = bw * bh, bw2 = bw * K, bh2 = bh * K, NB2 = bw2 * bh2;
  const H2 = new Float32Array(NB2), E2 = new Float32Array(NB2), R2 = new Float32Array(NB2), dW2 = new Float32Array(NB2), in2 = new Uint8Array(NB2), s2 = new Float32Array(NB2), sl2 = new Float32Array(NB2);
  const Hf = new Float32Array(NB1), inW = new Uint8Array(NB1), cast = new Float32Array(NB1), val = new Float32Array(NB1), E = new Float32Array(NB1);
  const TF = rlTable('natural:wild:foot'), TR = rlGTable('natural:wild:ridge3'), TR2 = rlGTable('natural:wild:ridge2');
  // the range's axis: the major eigenvector of its texels' spread; the spurs run across it (the ridged noise stretched across the axis by P.spur)
  let n = 0, mx = 0, my = 0, sxx = 0, syy = 0, sxy = 0; for (let ty = y0; ty <= y1; ty += 2) for (let tx = x0; tx <= x1; tx += 2) if (set.has(id[ty * BW + tx])) { n++; mx += tx; my += ty; sxx += tx * tx; syy += ty * ty; sxy += tx * ty; }
  mx /= n || 1; my /= n || 1; const ca = sxx / (n || 1) - mx * mx, cc = syy / (n || 1) - my * my, cb = sxy / (n || 1) - mx * my, lam = (ca + cc) / 2 + Math.sqrt(((ca - cc) / 2) ** 2 + cb * cb);
  let ax = Math.abs(cb) > 1e-6 ? cb : ca >= cc ? 1 : 0, ay = Math.abs(cb) > 1e-6 ? lam - ca : ca >= cc ? 0 : 1; const al = Math.sqrt(ax * ax + ay * ay) || 1; ax /= al; ay /= al;
  const dS = new Float32Array(NB1), fW = new Float32Array(NB1), r2W = new Float32Array(NB1); // at 1 x, read bilinearly at K x: the signed distance to the outline (negative outside), the foothills' width, the small ridges
  for (let y = 0, q = 0; y < bh; y++) for (let x = 0; x < bw; x++, q++) { const wx = (x0 + x + 0.5) / TX, wy = (y0 + y + 0.5) / TX, u = wx / RLK, v = wy / RLK; let d = Infinity; for (const e of ol) { const t = rlSegDist(wx, wy, e.a[0], e.a[1], e.b[0], e.b[1]); if (t < d) d = t; } dS[q] = set.has(id[(y0 + y) * BW + x0 + x]) ? d : -d;
    fW[q] = D * (P.footD[0] + (P.footD[1] - P.footD[0]) * (0.5 + 0.5 * rlFbm(TF, u / P.footU, v / P.footU, 3))); r2W[q] = 0.5 + 0.5 * rlRidged(TR2, u / P.ridge2U, v / P.ridge2U, 3, 0.3); }
  yield;
  for (let y = 0, q = 0; y < bh2; y++) {
    const ty = y0 + Math.floor(y / K), wy = (y0 * K + y + 0.5) / TK;
    for (let x = 0; x < bw2; x++, q++) {
      const tx = x0 + Math.floor(x / K), wx = (x0 * K + x + 0.5) / TK, hl = rlBilin(hXl, HW, HH, (wx * TX) / 2, (wy * TX) / 2); if (!set.has(id[ty * BW + tx])) { H2[q] = hl; continue; }
      const u = wx / RLK, v = wy / RLK, X1 = (x + 0.5) / K, Y1 = (y + 0.5) / K, d = Math.max(0, rlBilin(dS, bw, bh, X1, Y1));
      const pa = u * ax + v * ay, qa = -u * ay + v * ax, fw = rlBilin(fW, bw, bh, X1, Y1), rise = rlSmooth(0, fw, d), env = rlSmooth(0, P.coreD * D, d); // rise: the range's amplitude grows slowly from the outline, so near it the slopes are the spurs' own, not a wall along the edge
      const r = 0.5 + 0.5 * rlRidged(TR, pa / P.ridgeU, qa / (P.ridgeU * P.spur), P.ridgeOct, P.warp), r2 = rlBilin(r2W, bw, bh, X1, Y1);
      const e = rise * (P.lift * env + P.amp * r * (0.35 + 0.65 * env) + P.ridge2A * r2 * env); H2[q] = hl + e; E2[q] = e; R2[q] = r; dW2[q] = d; in2[q] = 1;
    }
    if ((y & 63) === 63) yield;
  }
  { const dx = 1 / TK, [lx, ly, lz] = RL_LIGHT, at = (xx, yy) => H2[(yy < 0 ? 0 : yy >= bh2 ? bh2 - 1 : yy) * bw2 + (xx < 0 ? 0 : xx >= bw2 ? bw2 - 1 : xx)];
    for (let y = 0, q = 0; y < bh2; y++) for (let x = 0; x < bw2; x++, q++) { if (!in2[q]) continue; // the slope (central differences, lightly cross-weighted: Horn's 3 x 3 softened the crests) and the Lambert shade, at K x
      const a = at(x - 1, y - 1), b = at(x, y - 1), c = at(x + 1, y - 1), dd = at(x - 1, y), f = at(x + 1, y), g = at(x - 1, y + 1), i2 = at(x, y + 1), j = at(x + 1, y + 1);
      const zx = (((f - dd) * 0.75 + (c + j - a - g) * 0.125) * VSw) / (2 * dx), zy = (((i2 - b) * 0.75 + (g + j - a - c) * 0.125) * VSw) / (2 * dx), nl = Math.sqrt(zx * zx + zy * zy + 1); s2[q] = Math.max(0, (-zx * lx - zy * ly + lz) / nl); sl2[q] = nl; } }
  for (let y = 0, q = 0; y < bh; y++) for (let x = 0; x < bw; x++, q++) { let h = 0, e = 0; for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) { const q2 = (y * K + j) * bw2 + x * K + i; h += H2[q2]; e += E2[q2]; } Hf[q] = h / (K * K); E[q] = e / (K * K); inW[q] = set.has(id[(y0 + y) * BW + x0 + x]) ? 1 : 0; }
  yield;
  const M = Math.ceil((P.castD * D * TX) / Math.SQRT2), stepZ = (Math.SQRT2 / TX) * RL_TAN_EL, VSc = VSw * P.castEx; // the cast shadow from heights x castEx (the full heights threw the core's shadow over every south-east foothill, a dark band along the edge), one texel diagonal a step
  for (let y = 0, q = 0; y < bh; y++) for (let x = 0; x < bw; x++, q++) { if (!inW[q]) continue; const z0 = Hf[q] * VSc; let occ = 0; for (let m = 1; m <= M; m++) { if (x - m < 0 || y - m < 0) break; const zs = Hf[q - m * (bw + 1)] * VSc - (z0 + m * stepZ); if (zs > occ) occ = zs; } cast[q] = rlSmooth(0, P.castW * D, occ); }
  yield;
  const hb = rlBoxBlur(Hf, bw, bh, Math.max(1, Math.round(P.valD * D * TX)), 2); for (let q = 0; q < NB1; q++) if (inW[q]) val[q] = rlSmooth(0, P.valH, hb[q] - Hf[q]);
  const es = []; for (let q = 0; q < NB2; q += 5) if (in2[q]) es.push(E2[q]); es.sort((p, q2) => p - q2); const eHi = es.length ? es[Math.floor(es.length * 0.985)] : 1;
  return { w, K, x0, y0, bw, bh, bw2, bh2, E2, R2, dW2, in2, s2, sl2, Hf, E, inW, cast, val, eHi, axis: [ax, ay] };
}
function* rlNatWildGen(out) {
  const { HW, HH, TX, hid, hh, fS, ao, shd, wch, QW, QH } = out, D = RLD, P = RL_NW.peaks, VS = RL_P.vScale * RLK, NP = HW * HH;
  const tw = {}; let t0 = performance.now(); const tl = (k) => { const n = performance.now(); tw[k] = +((tw[k] ?? 0) + n - t0).toFixed(1); t0 = n; }; // review: the step times (RB.nw.t)
  const hXl = rlNatLandHeights(out); tl('landHeights'); yield; t0 = performance.now();
  const hX = Float32Array.from(hXl), F = new Float32Array(NP), R = new Float32Array(NP), boxes = [], boxOf = new Map(), meres = [];
  for (const w of WILDS) {
    if (w.kind === 'peaks') { t0 = performance.now(); const B = yield* rlNatRangeGen(out, w, hXl); tl('range:' + w.id); boxes.push(B); for (const c of w.cells) boxOf.set(c, B);
      for (let y = Math.floor(B.y0 / 2); y <= Math.floor((B.y0 + B.bh - 1) / 2); y++) for (let x = Math.floor(B.x0 / 2); x <= Math.floor((B.x0 + B.bw - 1) / 2); x++) { // the half-resolution heights (Far relief, the land's band) from the full-resolution range
        const k = y * HW + x; if (!rlNWSet(w).has(hid[k])) continue; let h = 0, e = 0, m = 0; for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const qx = x * 2 + ox - B.x0, qy = y * 2 + oy - B.y0; if (qx < 0 || qy < 0 || qx >= B.bw || qy >= B.bh) continue; const q = qy * B.bw + qx; if (!B.inW[q]) continue; h += B.Hf[q]; e += B.E[q]; m++; }
        if (m) { hX[k] = h / m; F[k] = Math.min(1, e / m / 0.3); R[k] = 0; } }
    } else { const Mi = rlMereInfo(w); meres.push(Mi); for (const c of w.cells) boxOf.set(c, Mi);
      for (let k = 0; k < NP; k++) { if (!rlNWSet(w).has(hid[k])) continue; const x = ((k % HW) + 0.5) * 2 / TX, y = (Math.floor(k / HW) + 0.5) * 2 / TX, f = rlMereField(Mi, x, y); F[k] = f.F; R[k] = f.dep; hX[k] = hXl[k] - 0.12 * f.F; } }
    yield;
  }
  // the land beside the wilds, shaded from the same heights: its hillshade where a wild texel is in its 3 x 3, its valleys within the blur's reach, its cast shadow (the
  // land's own march on hX, and the ranges' longer one) in each wild's box reaching castD to the lower right; the shared rasters (Clear's) are not touched
  const fSN = Float32Array.from(fS), aoN = Float32Array.from(ao), shdN = Float32Array.from(shd), dxw = 2 / TX, [lx, ly, lz] = RL_LIGHT, rb = Math.round((0.08 * D * TX) / 2), ext = Math.ceil((P.castD * D * TX) / 2);
  const Hh = (xx, yy, k0) => { xx = xx < 0 ? 0 : xx >= HW ? HW - 1 : xx; yy = yy < 0 ? 0 : yy >= HH ? HH - 1 : yy; const kk = yy * HW + xx; return hid[kk] === 255 ? hX[k0] : hX[kk]; };
  t0 = performance.now(); const hbN = rlBoxBlur(hX, HW, HH, rb, 2), wv = new Float64Array(7); tl('band'); yield;
  for (const w of WILDS) {
    let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
    t0 = performance.now(); const set = rlNWSet(w), X0 = Math.max(0, Math.floor((bb[0] * TX) / 2) - 2 * rb), Y0 = Math.max(0, Math.floor((bb[1] * TX) / 2) - 2 * rb), X1 = Math.min(HW - 1, Math.ceil((bb[2] * TX) / 2) + Math.max(ext, 2 * rb)), Y1 = Math.min(HH - 1, Math.ceil((bb[3] * TX) / 2) + Math.max(ext, 2 * rb));
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const k = y * HW + x, o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; let near = false;
      for (let oy = -1; oy <= 1 && !near; oy++) for (let ox = -1; ox <= 1; ox++) { const xx = x + ox, yy = y + oy; if (xx >= 0 && yy >= 0 && xx < HW && yy < HH && set.has(hid[yy * HW + xx])) { near = true; break; } }
      if (near) { const a = Hh(x - 1, y - 1, k), b = Hh(x, y - 1, k), c = Hh(x + 1, y - 1, k), d = Hh(x - 1, y, k), f = Hh(x + 1, y, k), g = Hh(x - 1, y + 1, k), i2 = Hh(x, y + 1, k), j = Hh(x + 1, y + 1, k);
        const zx = ((c + 2 * f + j - (a + 2 * d + g)) * VS) / (8 * dxw), zy = ((g + 2 * i2 + j - (a + 2 * b + c)) * VS) / (8 * dxw), nl = Math.sqrt(zx * zx + zy * zy + 1), s = Math.max(0, (-zx * lx - zy * ly + lz) / nl);
        let ws = 0, gs = 0; for (let t = 0; t < 7; t++) { wv[t] = rlBilin(wch[t], QW, QH, (x + 0.5) / 2, (y + 0.5) / 2); ws += wv[t]; } for (let t = 0; t < 7; t++) gs += ws > 1e-4 ? (wv[t] / ws) * RL_SHG[t] : 0; if (ws <= 1e-4) gs = 1;
        const v = rlTanh(3.2 * gs * (s - RL_SIN_EL)); fSN[k] = v < -1 ? -1 : v > RL_P.litCap ? RL_P.litCap : v; }
      if (RL_NW.landAo) aoN[k] = rlSmooth(0, 0.03 * D, (hbN[k] - hX[k]) * VS); // off: the land's valley term keeps S5's (recomputed from the range's heights it tipped Halevale to read mountains at 131 px a province)
      const z0 = hX[k] * VS; let occ = 0; { const stepW = (RL_P.castD * D) / RL_P.castSteps, stepT = stepW / dxw; for (let m = 1; m <= RL_P.castSteps; m++) { const sx = x + 0.5 - 0.70710678 * stepT * m, sy = y + 0.5 - 0.70710678 * stepT * m; if (sx < 0 || sy < 0) break; const zs = rlBilin(hX, HW, HH, sx, sy) * VS - (z0 + stepW * m * RL_TAN_EL); if (zs > occ) occ = zs; } }
      if (w.kind === 'peaks') { const stepW = (P.castD * D) / 24, stepT = stepW / dxw; for (let m = 1; m <= 24; m++) { const sx = x + 0.5 - 0.70710678 * stepT * m, sy = y + 0.5 - 0.70710678 * stepT * m; if (sx < 0 || sy < 0) break; if (!set.has(hid[Math.floor(sy) * HW + Math.floor(sx)])) continue; const zs = rlBilin(hX, HW, HH, sx, sy) * VS - (z0 + stepW * m * RL_TAN_EL); if (zs > occ) occ = zs; } }
      shdN[k] = rlSmooth(0, 0.04 * D, occ);
    }
    tl('band'); yield;
  }
  out.nw = { hX, hXl, F, R, shd: shdN, fS: fSN, ao: aoN, boxes, boxOf, meres, t: tw };
}
// the mere's lake: an ellipse on the cell's own axes (the texels' spread), its radius wandering with a warped seeded noise (bays and points), pushed off the outline by
// the edge penalty (so the shore never runs parallel to the straight cell edges); r < 1 is water, the depth grows toward the middle
function rlMereInfo(w) {
  const set = rlNWSet(w); let n = 0, mx = 0, my = 0, sxx = 0, syy = 0, sxy = 0; const ol = rlWildOutline(w);
  for (const c of w.cells) { const b = bboxOf(cells[c]); for (let y = b[1]; y <= b[3]; y += 1.5) for (let x = b[0]; x <= b[2]; x += 1.5) { if (!d3.polygonContains(cells[c], [x, y])) continue; n++; mx += x; my += y; sxx += x * x; syy += y * y; sxy += x * y; } }
  mx /= n; my /= n; const ca = sxx / n - mx * mx, cc = syy / n - my * my, cb = sxy / n - mx * my, tr = (ca + cc) / 2, dt = Math.sqrt(((ca - cc) / 2) ** 2 + cb * cb), l1 = tr + dt, l2 = Math.max(1e-6, tr - dt);
  let ax = Math.abs(cb) > 1e-6 ? cb : ca >= cc ? 1 : 0, ay = Math.abs(cb) > 1e-6 ? l1 - ca : ca >= cc ? 0 : 1; const al = Math.sqrt(ax * ax + ay * ay) || 1; ax /= al; ay /= al;
  return { w, set, ol, cx: mx, cy: my, ax, ay, s1: 2 * Math.sqrt(l1), s2: 2 * Math.sqrt(l2), TN: rlTable('natural:wild:mere3'), TW: rlTable('natural:wild:mere3w') };
}
function rlMereField(Mi, x, y) {
  const ME = RL_NW.mere, u = x / RLK, v = y / RLK, wx = ME.warp * rlFbm(Mi.TW, u / 20, v / 20, 2), wy = ME.warp * rlFbm(Mi.TW, u / 20 + 31, v / 20 + 7, 2), dx = x - Mi.cx, dy = y - Mi.cy;
  const p = (dx * Mi.ax + dy * Mi.ay) / (Mi.s1 * ME.r), q = (-dx * Mi.ay + dy * Mi.ax) / (Mi.s2 * ME.r); let d = Infinity; for (const e of Mi.ol) { const t = rlSegDist(x, y, e.a[0], e.a[1], e.b[0], e.b[1]); if (t < d) d = t; }
  const pen = 1 - rlSmooth(ME.edge[0] * RLD, ME.edge[1] * RLD, d), r = Math.sqrt(p * p + q * q) + ME.noise * rlFbm(Mi.TN, u / ME.noiseU + wx, v / ME.noiseU + wy, 3) + ME.edgeK * pen * pen;
  const aw = (ME.aa / RL_P.bakeW) * W / Math.min(Mi.s1, Mi.s2) / ME.r; return { r, d, F: rlSmooth(1 + aw, 1 - aw, r), dep: Math.max(0, Math.min(1, (1 - r) / ME.deep)) };
}

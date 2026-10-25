
// ------------------------------------------------------------------ v4 relief: the shared rasters (natural N1: both looks of the land come from these)
// RB holds every raster the live layers, the checks and the water placement read; RB.L[look] holds each look's colour bake (Natural, Clear), made lazily.
const RB = { ready: false, running: false, ver: 0, lookVer: 0, t: {}, total: 0, slices: 0, wall: 0, L: { natural: null, clear: null }, lookRunning: null };
function* rlSharedGen(out) {
  const BW = RL_P.bakeW, BH = RL_P.bakeH, TX = BW / W, NP = BW * BH, HW = BW >> 1, HH = BH >> 1, QW = BW >> 2, QH = BH >> 2;
  const tm = out.t = {}; let t = performance.now(); const lap = (k) => { const n = performance.now(); tm[k] = +((tm[k] ?? 0) + n - t).toFixed(1); t = n; };
  out.BW = BW; out.BH = BH; out.TX = TX; out.HW = HW; out.HH = HH; out.QW = QW; out.QH = QH;
  // S1: the province id raster (convex cells by scanline, texel centers), off the model 255; the land mask's rounded corners
  const id = new Uint8Array(NP).fill(255);
  for (let i = 0; i < N; i++) {
    const poly = cells[i]; let y0 = Infinity, y1 = -Infinity; for (const q of poly) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const ty0 = Math.max(0, Math.floor(y0 * TX - 0.5)), ty1 = Math.min(BH - 1, Math.ceil(y1 * TX));
    for (let ty = ty0; ty <= ty1; ty++) {
      const wy = (ty + 0.5) / TX; let xa = Infinity, xb = -Infinity;
      for (let k = 0; k < poly.length - 1; k++) { const p = poly[k], q = poly[k + 1]; if ((p[1] - wy) * (q[1] - wy) > 0 || p[1] === q[1]) continue; const x = p[0] + ((wy - p[1]) * (q[0] - p[0])) / (q[1] - p[1]); if (x < xa) xa = x; if (x > xb) xb = x; }
      if (xb < xa) continue; const tx0 = Math.max(0, Math.ceil(xa * TX - 0.5)), tx1 = Math.min(BW - 1, Math.ceil(xb * TX - 0.5) - 1);
      for (let tx = tx0; tx <= tx1; tx++) id[ty * BW + tx] = i;
    }
  }
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) { // gaps on shared edges, then the rounded corners
    const x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
    if (id[k] === 255) id[k] = nearest(x, y);
    if (!inModel(x, y)) id[k] = 255;
  }
  out.id = id; yield; lap('idRaster');
  // S2: the lookup warp (|w| <= 0.10 D; features 40 and 9 mapgen units at 0.7 and 0.3), at quarter resolution, then the lookup
  const Wm = RL_P.warpD * RLD, F1 = RL_P.warpF1 * RLK, F2 = RL_P.warpF2 * RLK, TW1 = rlTable('warp:x1'), TW2 = rlTable('warp:x2'), TW3 = rlTable('warp:y1'), TW4 = rlTable('warp:y2');
  const wqx = new Float32Array(QW * QH), wqy = new Float32Array(QW * QH);
  for (let qy = 0, k = 0; qy < QH; qy++) for (let qx = 0; qx < QW; qx++, k++) {
    const x = ((qx + 0.5) * 4) / TX, y = ((qy + 0.5) * 4) / TX;
    let vx = 0.7 * rlVN(TW1, x / F1, y / F1) + 0.3 * rlVN(TW2, x / F2, y / F2), vy = 0.7 * rlVN(TW3, x / F1, y / F1) + 0.3 * rlVN(TW4, x / F2, y / F2);
    vx *= 1.7 * Wm; vy *= 1.7 * Wm; const m = Math.sqrt(vx * vx + vy * vy); if (m > Wm) { vx *= Wm / m; vy *= Wm / m; }
    wqx[k] = vx; wqy[k] = vy;
  }
  const LT = new Uint8Array(NP), LP = new Uint8Array(NP);
  const own = new Float64Array(N), tot = new Float64Array(N);
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) {
    const o = id[k]; if (o === 255) { LT[k] = 255; LP[k] = 255; continue; }
    if (RL_WILDK[o]) { LT[k] = RL_WILDK[o]; LP[k] = o; continue; }
    const fxq = (tx + 0.5) / 4, fyq = (ty + 0.5) / 4, dx = rlBilin(wqx, QW, QH, fxq, fyq), dy = rlBilin(wqy, QW, QH, fxq, fyq);
    let sx = Math.floor(tx + dx * TX), sy = Math.floor(ty + dy * TX); sx = sx < 0 ? 0 : sx >= BW ? BW - 1 : sx; sy = sy < 0 ? 0 : sy >= BH ? BH - 1 : sy;
    let tid = id[sy * BW + sx]; if (tid === 255 || RL_WILDK[tid]) tid = o;
    LP[k] = tid; LT[k] = RL_TI[terr[tid]];
    tot[o]++; if (terr[tid] === terr[o]) own[o]++;
  }
  out.LT = LT; out.LP = LP; out.ownShare = provList.map((i) => ({ i, share: tot[i] ? own[i] / tot[i] : 1 }));
  yield; lap('warpLookup');
  // S3: height weights: the warped one-hot at quarter resolution, Gaussian sigma 0.12 D (three box passes); wilds excluded from the land blend
  const sigQ = (RL_P.hSigmaD * RLD * TX) / 4, rq = Math.max(1, Math.round((Math.sqrt((12 * sigQ * sigQ) / 3 + 1) - 1) / 2));
  const wch = [];
  for (let c = 0; c < 8; c++) { // 0..6 land terrains, 7 peaks (for foothills); kept (out.wch): the natural ground blend is these weights (natural §3.1)
    const P = new Float32Array(QW * QH);
    for (let qy = 0, k = 0; qy < QH; qy++) for (let qx = 0; qx < QW; qx++, k++) { const v = LT[(qy * 4 + 2) * BW + qx * 4 + 2]; P[k] = v === c ? 1 : 0; }
    wch.push(rlBoxBlur(P, QW, QH, rq, 3)); if (c % 3 === 2) yield;
  }
  out.wch = wch; lap('heightWeights');
  // S4: the heightfield at half resolution: sum_t w_t (B_t + A_t n_t), mountains ridged, the canopy +0.04, foothills toward the peaks,
  // passable land soft-clamped under 1.00; wild peaks a dome plus ridged noise, never under 1.10; meres flat at -0.05 (§3.2)
  const hh = new Float32Array(HW * HH), HG = new Float32Array(HW * HH).fill(1), hid = new Uint8Array(HW * HH), hLT = new Uint8Array(HW * HH); // HG: the shade gain, blended by the height weights
  for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) { const fk = (y * 2 + 1) * BW + x * 2 + 1; hid[k] = id[fk]; hLT[k] = LT[fk]; }
  const tabs = RL_T.map((tn) => rlGTable('height:' + tn)), feat = RL_T.map((tn) => RL_HT[tn][2] * RLK * RL_P.featK);
  const wdist = new Float32Array(HW * HH); // distance into a wild from its outline (half res; wild texels only)
  for (const w of WILDS) {
    const ol = rlWildOutline(w); let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
    const set = new Set(w.cells);
    for (let y = Math.max(0, Math.floor(bb[1] * TX / 2)); y <= Math.min(HH - 1, Math.ceil(bb[3] * TX / 2)); y++) for (let x = Math.max(0, Math.floor(bb[0] * TX / 2)); x <= Math.min(HW - 1, Math.ceil(bb[2] * TX / 2)); x++) {
      const k = y * HW + x; if (!set.has(hid[k])) continue; const px = ((x + 0.5) * 2) / TX, py = ((y + 0.5) * 2) / TX; let d = Infinity;
      for (const e of ol) { const v = rlSegDist(px, py, e.a[0], e.a[1], e.b[0], e.b[1]); if (v < d) d = v; } wdist[k] = d;
    }
  }
  const TR = rlGTable('wild:ridge'), VS = RL_P.vScale * RLK;
  for (let y = 0, k = 0; y < HH; y++) {
    for (let x = 0; x < HW; x++, k++) {
      const o = hid[k], lt = hLT[k], px = ((x + 0.5) * 2) / TX, py = ((y + 0.5) * 2) / TX;
      if (o === 255) { hh[k] = 0; continue; }
      if (lt === 7) { const dome = Math.pow(Math.min(1, wdist[k] / (0.30 * RLD)), 0.75), r = rlRidged(TR, px / (34 * RLK), py / (34 * RLK), 4, 0.6); hh[k] = Math.max(1.10, 1.25 + 0.60 * dome + 0.28 * r * (0.35 + 0.65 * dome)); continue; }
      if (lt === 8) { hh[k] = -0.05; continue; }
      const fq = (x + 0.5) / 2, gq = (y + 0.5) / 2; let ws = 0; const wv = [0, 0, 0, 0, 0, 0, 0];
      for (let c = 0; c < 7; c++) { const v = rlBilin(wch[c], QW, QH, fq, gq); wv[c] = v; ws += v; }
      if (ws < 1e-4) { wv[lt] = 1; ws = 1; }
      { let gs = 0; for (let c = 0; c < 7; c++) gs += (wv[c] / ws) * RL_SHG[c]; HG[k] = gs; }
      let h = 0;
      for (let c = 0; c < 7; c++) {
        const wt = wv[c] / ws; if (wt < 0.003) continue; const tn = RL_T[c], [Bt, At] = RL_HT[tn];
        const n = tn === 'mountains' ? rlRidged(tabs[c], px / feat[c], py / feat[c], 4, 0.3) : rlGFbm(tabs[c], px / feat[c], py / feat[c], tn === 'hills' ? 3 : RL_P.octaves, RL_P.hGain);
        h += wt * (Bt + At * n);
        if (tn === 'forest') h += wt * 0.04; // the canopy (§3.5)
      }
      h += 0.30 * rlBilin(wch[7], QW, QH, fq, gq); // foothills toward the massifs
      if (h > 0.85) h = 0.85 + 0.15 * rlTanh((h - 0.85) / 0.15); // soft clamp under 1.00
      hh[k] = h;
    }
    if ((y & 63) === 63) yield;
  }
  out.hh = hh; out.hid = hid; out.hLT = hLT; out.wdist = wdist; lap('heightfield'); // wdist: kept for the natural wilds (p58w)
  // S5: hillshade (Horn), the asymmetric lit cap, cast shadows (16 steps toward the light, at most 0.25 D), valleys; at half resolution
  const dxw = 2 / TX, fS = new Float32Array(HW * HH), sS = new Float32Array(HW * HH), shd = new Float32Array(HW * HH), [lx, ly, lz] = RL_LIGHT;
  const H_ = (xx, yy, k0) => { xx = xx < 0 ? 0 : xx >= HW ? HW - 1 : xx; yy = yy < 0 ? 0 : yy >= HH ? HH - 1 : yy; const kk = yy * HW + xx; return hid[kk] === 255 ? hh[k0] : hh[kk]; };
  for (let y = 0, k = 0; y < HH; y++) {
    for (let x = 0; x < HW; x++, k++) {
      if (hid[k] === 255) continue;
      const a = H_(x - 1, y - 1, k), b = H_(x, y - 1, k), c = H_(x + 1, y - 1, k), d = H_(x - 1, y, k), f = H_(x + 1, y, k), g = H_(x - 1, y + 1, k), i2 = H_(x, y + 1, k), j = H_(x + 1, y + 1, k);
      const dzdx = ((c + 2 * f + j - (a + 2 * d + g)) * VS) / (8 * dxw), dzdy = ((g + 2 * i2 + j - (a + 2 * b + c)) * VS) / (8 * dxw);
      const nl = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1), s = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / nl);
      sS[k] = s; let v = rlTanh(3.2 * HG[k] * (s - RL_SIN_EL)); fS[k] = v < -1 ? -1 : v > RL_P.litCap ? RL_P.litCap : v;
      // cast shadow: march toward the light; the ray rises at tan 40
      const z0 = hh[k] * VS, stepW = (RL_P.castD * RLD) / RL_P.castSteps, stepT = stepW / dxw; let occ = 0;
      for (let m = 1; m <= RL_P.castSteps; m++) { const sxx = x + 0.5 + -0.70710678 * stepT * m, syy = y + 0.5 + -0.70710678 * stepT * m; if (sxx < 0 || syy < 0) break; const zs = rlBilin(hh, HW, HH, sxx, syy) * VS - (z0 + stepW * m * RL_TAN_EL); if (zs > occ) occ = zs; }
      shd[k] = rlSmooth(0, 0.04 * RLD, occ);
    }
    if ((y & 63) === 63) yield;
  }
  const hb = rlBoxBlur(hh, HW, HH, Math.round(0.08 * RLD * TX / 2), 2), ao = new Float32Array(HW * HH);
  for (let k = 0; k < HW * HH; k++) ao[k] = hid[k] === 255 || RL_WILDK[hid[k]] ? 0 : rlSmooth(0, 0.03 * RLD, (hb[k] - hh[k]) * VS);
  out.fS = fS; out.sS = sS; out.shd = shd; out.ao = ao; yield; lap('hillshade');
  // snow: the highest eighth of each massif where its faces turn to the light (§3.8)
  const snow = new Float32Array(HW * HH);
  for (const w of WILDS) if (w.kind === 'peaks') {
    const set = new Set(w.cells); let lo = Infinity, hi = -Infinity; for (let k = 0; k < HW * HH; k++) if (set.has(hid[k])) { lo = Math.min(lo, hh[k]); hi = Math.max(hi, hh[k]); }
    const cut = hi - (hi - lo) / 8; for (let k = 0; k < HW * HH; k++) if (set.has(hid[k])) snow[k] = rlSmooth(cut - 0.02, cut + 0.03, hh[k]) * rlSmooth(RL_SIN_EL - 0.05, RL_SIN_EL + 0.12, sS[k]);
  }
  out.snow = snow;
  // the quarter-resolution heightfield for the water and the invariant checks (the CPU reference's own; review item 33); water is placed now
  const hq = new Float32Array(QW * QH); for (let y = 0, k = 0; y < QH; y++) for (let x = 0; x < QW; x++, k++) hq[k] = hh[(y * 2 + 1) * HW + x * 2 + 1];
  out.hq = hq; out.water = rlPlaceWater(out); lap('water');
  // the mip texels inside one province carry its id (the land-look wash composites per province into each look's canvases and mips)
  { const W1 = BW / 2, H1 = BH / 2, W2 = BW / 4, H2 = BH / 4, mid1 = new Uint8Array(W1 * H1), mid2 = new Uint8Array(W2 * H2), wid = (k) => (LT[k] < 7 ? id[k] : 255);
    for (let y = 0; y < H1; y++) for (let x = 0; x < W1; x++) { const k = y * 2 * BW + x * 2, a = wid(k); mid1[y * W1 + x] = a !== 255 && a === wid(k + 1) && a === wid(k + BW) && a === wid(k + BW + 1) ? a : 255; }
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const k = y * 2 * W1 + x * 2, a = mid1[k]; mid2[y * W2 + x] = a !== 255 && a === mid1[k + 1] && a === mid1[k + W1] && a === mid1[k + W1 + 1] ? a : 255; }
    out.mid1 = mid1; out.mid2 = mid2; }
  // the mode relief: a gentle fixed relief of +-3 L* (p95), mean-neutral per province, at half resolution (§9.2)
  const mr = new Float32Array(HW * HH), msum = new Float64Array(N), mcnt = new Float64Array(N);
  { const abs = []; for (let k = 0; k < HW * HH; k += 7) if (hid[k] !== 255 && !RL_WILDK[hid[k]]) abs.push(Math.abs(fS[k])); abs.sort((p, q) => p - q); const p95 = abs[Math.floor(abs.length * 0.95)] || 1;
    for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; mr[k] = Math.max(-4, Math.min(4, (RL_P.modeRelief * fS[k]) / p95)); msum[o] += mr[k]; mcnt[o]++; }
    for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; mr[k] -= msum[o] / mcnt[o]; } }
  out.modeRelief = mr; lap('modeRelief');
}
// the wilds' texels (granite with its snow, the meres): shade #2A292C to lit #8A857E by the light, snow on the highest eighth's lit faces. Clear and the Terrain mode as in v4;
// AD fix 3, Natural only (nat): the light's reach 0.2 to 0.8 (v4 0 to 1), snow at 0.7 of its weight and a full-resolution ridged detail of 3 units at +-3 L* (the half-resolution
// shading alone was magnified 2.8 times at Near), so a massif is no longer the loudest object on the map; its contour and rim still carry "impassable"
let RL_WILDC = null;
const rlWildDetail = (T, x, y) => { const e = 0.5 * RLK, f = (u, v) => rlRidged(T, u / (3 * RLK), v / (3 * RLK), 2, 0.25), t = (f(x + e, y + e) - f(x - e, y - e)) * 1.6; return t > 1 ? 1 : t < -1 ? -1 : t; };
function rlWildTexel(S, lt, tx, ty, d8, o4, nat) { // S: the bake's shared rasters (RB, or a re-bake's own); nat: the natural look
  const R = (RL_WILDC ??= { gr: rgb2lab(hex2rgb(RL_C.granite)), gl: rgb2lab(hex2rgb(RL_C.graniteLit)), sn: rgb2lab(hex2rgb(RL_C.snow)), me: rgb2lab(hex2rgb(RL_C.mere)), TG: rlTable('granite'), TD: rlGTable('wild:detail') });
  const { HW, HH, TX, sS, snow } = S, x = (tx + 0.5) / TX, y = (ty + 0.5) / TX, { gr, gl, sn, me, TG } = R;
  if (lt === 7) {
    const s = rlBilin(sS, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2), q0 = rlSmooth(0.12, 1.0, s), q = nat ? 0.2 + 0.6 * q0 : q0, grain = 1.4 * rlVN(TG, x / (3 * RLK), y / (3 * RLK)), sw = rlBilin(snow, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2) * (nat ? 0.7 : 1);
    let L = gr[0] + (gl[0] - gr[0]) * q + grain + 5 * rlMicro(x, y) + (nat ? 3 * rlWildDetail(R.TD, x, y) : 0), a = gr[1] + (gl[1] - gr[1]) * q, b = gr[2] + (gl[2] - gr[2]) * q;
    L += (sn[0] - L) * sw; a += (sn[1] - a) * sw; b += (sn[2] - b) * sw; rlLabTo(L, a, b, d8, o4); d8[o4 + 3] = 255; return;
  }
  rlLabTo(me[0] + 0.9 * rlVN(TG, x / (9 * RLK), y / (5 * RLK)), me[1], me[2], d8, o4); d8[o4 + 3] = 255;
}

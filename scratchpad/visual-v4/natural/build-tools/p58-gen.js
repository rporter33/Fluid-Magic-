// ---- the bake. RB holds every raster the live layers, the checks and the water placement read.
const RB = { ready: false, running: false, ver: 0, t: {}, total: 0, slices: 0, wall: 0 };
function* rlBakeGen(out) {
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
  for (let c = 0; c < 8; c++) { // 0..6 land terrains, 7 peaks (for foothills)
    const P = new Float32Array(QW * QH);
    for (let qy = 0, k = 0; qy < QH; qy++) for (let qx = 0; qx < QW; qx++, k++) { const v = LT[(qy * 4 + 2) * BW + qx * 4 + 2]; P[k] = v === c ? 1 : 0; }
    wch.push(rlBoxBlur(P, QW, QH, rq, 3)); if (c % 3 === 2) yield;
  }
  lap('heightWeights');
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
  out.hh = hh; out.hid = hid; out.hLT = hLT; lap('heightfield');
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
  // S6: the lightness change at full resolution: relief (the blended swing cap x the lit-capped shade), cast shadow, valley, ground detail
  const DL = new Float32Array(NP), TD = [rlTable('detail:a'), rlTable('detail:b'), rlTable('detail:c'), rlTable('detail:d')];
  const capT = RL_T.map((tn) => RL_CAP[tn]), parcelAng = new Float32Array(N); for (let i = 0; i < N; i++) { const R = rngFor(`relief:${MAP_SEED}:parcels:${i}`); parcelAng[i] = [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(R() * 4)] + (R() - 0.5) * 0.12; } // never 45 degrees (the reserved hatch)
  const crownCell = 7 * RLK * 0.75, cellP = 7 * RLK, TMR = rlGTable('micro:mountains'), mE = 0.7 * RLK, micro = (x, y) => { const f = (u, v) => rlRidged(TMR, u / (7 * RLK), v / (7 * RLK), 2, 0.2), t = (f(x + mE, y + mE) - f(x - mE, y - mE)) * 2.2; return t > 1 ? 1 : t < -1 ? -1 : t; }; // micro: rock at 7-unit features, lightness only, in [-1, 1] // canopy crowns of 3 to 6 mapgen units on a jittered grid; parcels of 7 units
  for (let ty = 0, k = 0; ty < BH; ty++) {
    for (let tx = 0; tx < BW; tx++, k++) {
      const lt = LT[k]; if (lt >= 7) continue;
      // the blended swing cap over the 3 x 3 albedo window (land only)
      let cs = 0, cn = 0; for (let oy = -1; oy <= 1; oy++) { const yy = ty + oy; if (yy < 0 || yy >= BH) continue; for (let ox = -1; ox <= 1; ox++) { const xx = tx + ox; if (xx < 0 || xx >= BW) continue; const v = LT[yy * BW + xx]; if (v < 7) { cs += capT[v]; cn++; } } }
      const At = cs / cn, hx = (tx + 0.5) / 2, hy = (ty + 0.5) / 2;
      const fs = rlBilin(fS, HW, HH, hx, hy), x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
      let d = At * fs - RL_P.castL * rlBilin(shd, HW, HH, hx, hy) - RL_P.valleyL * rlBilin(ao, HW, HH, hx, hy);
      const tn = RL_T[lt];
      if (tn === 'plains') d += 1.8 * rlFbm(TD[0], x / (22 * RLK), y / (22 * RLK), 2) + 1.0 * rlVN(TD[1], x / (5 * RLK), y / (5 * RLK)) + 1.1 * rlVN(TD[3], x / (1.6 * RLK), y / (1.6 * RLK));
      else if (tn === 'farmland') {
        const a = parcelAng[LP[k]], ca = Math.cos(a), sa = Math.sin(a), u = (x * ca + y * sa) / (cellP * 1.35), v = (-x * sa + y * ca) / (cellP * 0.8), iu = Math.floor(u), iv = Math.floor(v); let best = 9, best2 = 9, bid = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const cu = iu + ox, cv2 = iv + oy, hh2 = h32(`f${cu},${cv2}`), du = u - (cu + 0.15 + 0.7 * ((hh2 & 1023) / 1023)), dv = v - (cv2 + 0.15 + 0.7 * (((hh2 >>> 10) & 1023) / 1023)), dd = du * du + dv * dv; if (dd < best) { best2 = best; best = dd; bid = hh2; } else if (dd < best2) best2 = dd; }
        d += [-1.6, -0.5, 0.5, 1.6][(bid >>> 20) & 3] * (0.55 + 0.45 * rlSmooth(0, 0.12, Math.sqrt(best2) - Math.sqrt(best))) + 0.8 * rlVN(TD[2], x / (8 * RLK), y / (8 * RLK)); // parcel tones, the seams softened (fix 10)
      } else if (tn === 'forest') {
        const gx = x / crownCell, gy = y / crownCell, ix = Math.floor(gx), iy = Math.floor(gy); let best = 9, bdx = 0, bdy = 0, br = 1;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const cx = ix + ox, cy = iy + oy, hsh = h32(`c${cx},${cy}`), jx = (hsh & 1023) / 1023, jy = ((hsh >>> 10) & 1023) / 1023, rr = 0.42 + 0.33 * (((hsh >>> 20) & 255) / 255);
          const ddx = gx - (cx + jx), ddy = gy - (cy + jy), dd = Math.sqrt(ddx * ddx + ddy * ddy) / rr; if (dd < best) { best = dd; bdx = ddx / rr; bdy = ddy / rr; br = rr; }
        }
        const crown = best < 1 ? 1 - best * best : 0, lit = -(bdx + bdy) * 0.7071; // a dome lit from the upper left
        d += best < 1 ? 6 * (0.15 + 0.55 * crown * 0.5 + 0.55 * lit * Math.sqrt(crown)) : -6 * Math.min(1, (best - 1) * 3 + 0.6);
        d += 2 * rlFbm(TD[3], x / (30 * RLK), y / (30 * RLK), 2); void br;
      } else if (tn === 'hills') d += 2 * rlFbm(TD[0], x / (26 * RLK), y / (26 * RLK), 3) + 0.9 * rlVN(TD[3], x / (1.8 * RLK), y / (1.8 * RLK));
      else if (tn === 'mountains') { const sc = Math.max(0, -fs - 0.15); d += sc * 3 * rlVN(TD[1], x / (2.2 * RLK), y / (2.2 * RLK)) + 0.7 * rlVN(TD[2], x / (5 * RLK), y / (5 * RLK)) + 3 * micro(x, y); } // + the full-resolution micro-relief (fix 10)
      else if (tn === 'swamp') { const pn = rlFbm(TD[2], x / (16 * RLK), y / (16 * RLK), 3); d += -5 * rlSmooth(0.30, 0.42, pn) + 1 * rlVN(TD[3], x / (2.6 * RLK), y / (2.6 * RLK)); }
      else { const cr = 1 - Math.abs(rlFbm(TD[3], x / (12 * RLK), y / (12 * RLK), 3)); d += 2.2 * rlFbm(TD[0], x / (34 * RLK), y / (34 * RLK), 2) + 1.2 * Math.sin((x * 0.8 + y * 0.6) / (3.2 * RLK) + 3 * rlVN(TD[1], x / (25 * RLK), y / (25 * RLK))) - 3 * rlSmooth(0.90, 0.97, cr); }
      DL[k] = d;
    }
    if ((ty & 127) === 127) yield;
  }
  lap('detail');
  // the quarter-resolution heightfield for the water and the invariant checks (the CPU reference's own; review item 33); water is placed now
  const hq = new Float32Array(QW * QH); for (let y = 0, k = 0; y < QH; y++) for (let x = 0; x < QW; x++, k++) hq[k] = hh[(y * 2 + 1) * HW + x * 2 + 1];
  out.hq = hq; out.water = rlPlaceWater(out); lap('water');
  // S7: mean-neutral (V3): per province, the mean change over its pure-terrain pixels is removed as a smooth field (spread 0.03 D, three iterations)
  const pure = new Uint8Array(NP);
  for (let ty = 1, k0 = BW; ty < BH - 1; ty++, k0 += BW) for (let tx = 1; tx < BW - 1; tx++) { const k = k0 + tx, o = id[k]; if (o === 255 || RL_WILDK[o]) continue; const want = RL_TI[terr[o]]; if (LT[k] !== want) continue;
    if (LT[k - 1] === want && LT[k + 1] === want && LT[k - BW] === want && LT[k + BW] === want && LT[k - BW - 1] === want && LT[k - BW + 1] === want && LT[k + BW - 1] === want && LT[k + BW + 1] === want && distToEdge(cells[o], (tx + 0.5) / TX, (ty + 0.5) / TX) >= RL_P.coreD * RLD) pure[k] = 1; } // the untinted core: pure terrain beyond the glow band
  { // erode the core by 4 texels, so a mip or a screen filter never blends a fringe into it (the checks read the same set on screen)
    const r = 4, tmp = new Uint8Array(NP);
    for (let y = 0; y < BH; y++) { let run = 0; for (let x = 0; x < BW; x++) { const k = y * BW + x; run = pure[k] ? run + 1 : 0; tmp[k] = run; } for (let x = BW - 1, run2 = 0; x >= 0; x--) { const k = y * BW + x; run2 = pure[k] ? run2 + 1 : 0; tmp[k] = Math.min(tmp[k], run2) > r ? 1 : 0; } }
    for (let x = 0; x < BW; x++) { let run = 0; const col = new Uint16Array(BH); for (let y = 0; y < BH; y++) { const k = y * BW + x; run = tmp[k] ? run + 1 : 0; col[y] = run; } for (let y = BH - 1, run2 = 0; y >= 0; y--) { const k = y * BW + x; run2 = tmp[k] ? run2 + 1 : 0; pure[k] = Math.min(col[y], run2) > r ? 1 : 0; } }
  }
  { // the water covers part of some cores: those texels (with a 3-unit bank) leave the core, so the visible land is what is mean-neutral
    const m = 3 * RLK, clr = (x0, y0, x1, y1, test) => { for (let ty = Math.max(0, Math.floor(y0 * TX)); ty <= Math.min(BH - 1, Math.ceil(y1 * TX)); ty++) for (let tx = Math.max(0, Math.floor(x0 * TX)); tx <= Math.min(BW - 1, Math.ceil(x1 * TX)); tx++) if (test((tx + 0.5) / TX, (ty + 0.5) / TX)) pure[ty * BW + tx] = 0; };
    for (const L of [...out.water.lakes, ...out.water.ponds]) { const b = bboxOf(L.P), ring = [...L.P, L.P[0]]; clr(b[0] - m, b[1] - m, b[2] + m, b[3] + m, (x, y) => d3.polygonContains(L.P, [x, y]) || distToEdge(ring, x, y) < m); }
    for (const s of out.water.streams) { const b = bboxOf(s.pts), w = s.w1 + m; clr(b[0] - w, b[1] - w, b[2] + w, b[3] + w, (x, y) => distToEdge(s.pts, x, y) < w); }
  }
  const meanOf = new Float64Array(N), hLP = new Uint8Array(HW * HH); for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) hLP[k] = LP[(y * 2 + 1) * BW + x * 2 + 1];
  let Oh = new Float32Array(HW * HH); const rS = Math.max(1, Math.round((RL_P.meanSpreadD * RLD * TX) / 2));
  const landMaskH = new Float32Array(HW * HH); for (let k = 0; k < HW * HH; k++) landMaskH[k] = hLP[k] !== 255 && !RL_WILDK[hLP[k]] ? 1 : 0;
  for (let it = 0; it < RL_P.meanIters; it++) {
    const sum = new Float64Array(N), cnt = new Float64Array(N);
    for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) if (pure[k]) { const o = id[k]; sum[o] += DL[k] - (it ? rlBilin(Oh, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2) : 0); cnt[o]++; }
    for (let i = 0; i < N; i++) if (cnt[i]) meanOf[i] += sum[i] / cnt[i];
    const raw = new Float32Array(HW * HH); for (let k = 0; k < HW * HH; k++) raw[k] = landMaskH[k] ? meanOf[hLP[k]] : 0;
    Oh = rlBoxBlur(raw, HW, HH, rS, 2, landMaskH); yield;
  }
  const resid = new Float64Array(N), rcnt = new Float64Array(N);
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) { if (LT[k] >= 7) continue; DL[k] -= rlBilin(Oh, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2); if (pure[k]) { resid[id[k]] += DL[k]; rcnt[id[k]]++; } }
  out.residual = provList.map((i) => ({ i, dL: rcnt[i] ? resid[i] / rcnt[i] : 0, n: rcnt[i] }));
  out.pure = pure; out.DL = DL; yield; lap('meanNeutral');
  // S8: color: the 3 x 3 blended albedo in CIELAB with the change added to L*, to sRGB once; wilds; the rounded corners' coverage
  const img = new ImageData(BW, BH), d8 = img.data, Lt = RL_T.map((tn) => RL_L[tn]), corr = new Float64Array(N * 3);
  const landPx = (k, tx, ty, o4, cr) => { // the 3 x 3 blended albedo, the lightness change, and (after the first pass) the province's gamut correction
    let L = 0, a = 0, b = 0, n = 0;
    for (let oy = -1; oy <= 1; oy++) { const yy = ty + oy; if (yy < 0 || yy >= BH) continue; for (let ox = -1; ox <= 1; ox++) { const xx = tx + ox; if (xx < 0 || xx >= BW) continue; const v = LT[yy * BW + xx]; if (v < 7) { const c = Lt[v]; L += c[0]; a += c[1]; b += c[2]; n++; } } }
    L = L / n + DL[k]; a /= n; b /= n; if (cr) { const p3 = LP[k] * 3; L += cr[p3]; a += cr[p3 + 1]; b += cr[p3 + 2]; }
    rlLabTo(L, a, b, d8, o4);
  };
  const gr = rgb2lab(hex2rgb(RL_C.granite)), gl = rgb2lab(hex2rgb(RL_C.graniteLit)), sn = rgb2lab(hex2rgb(RL_C.snow)), me = rgb2lab(hex2rgb(RL_C.mere)), TG = rlTable('granite');
  for (let ty = 0, k = 0; ty < BH; ty++) {
    for (let tx = 0; tx < BW; tx++, k++) {
      const lt = LT[k], o4 = k * 4; if (lt === 255) { d8[o4 + 3] = 0; continue; }
      const x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
      if (lt === 7) { // granite: shade #2A292C to lit #8A857E by the light, snow on the highest eighth's lit faces, a little rock grain
        const s = rlBilin(sS, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2), q = rlSmooth(0.12, 1.0, s), grain = 1.4 * rlVN(TG, x / (3 * RLK), y / (3 * RLK)), sw = rlBilin(snow, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2);
        let L = gr[0] + (gl[0] - gr[0]) * q + grain + 5 * micro(x, y), a = gr[1] + (gl[1] - gr[1]) * q, b = gr[2] + (gl[2] - gr[2]) * q;
        L += (sn[0] - L) * sw; a += (sn[1] - a) * sw; b += (sn[2] - b) * sw; rlLabTo(L, a, b, d8, o4); d8[o4 + 3] = 255; continue;
      }
      if (lt === 8) { rlLabTo(me[0] + 0.9 * rlVN(TG, x / (9 * RLK), y / (5 * RLK)), me[1], me[2], d8, o4); d8[o4 + 3] = 255; continue; }
      landPx(k, tx, ty, o4, null); d8[o4 + 3] = 255;
    }
    if ((ty & 127) === 127) yield;
  }
  // the gamut: a dark or lit pixel of a saturated albedo leaves sRGB and is clipped, which moves the province's mean (hills lost about 1 b*).
  // Two correction passes: each province's CIELAB mean over its pure pixels, as converted, is brought back onto its albedo (a constant per province)
  const LIN = new Float32Array(256); for (let v = 0; v < 256; v++) LIN[v] = s2l(v);
  const cf = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  for (let pass = 0; pass < 2; pass++) {
    const sL = new Float64Array(N), sa = new Float64Array(N), sb = new Float64Array(N), sn2 = new Float64Array(N);
    for (let k = 0; k < NP; k++) { if (!pure[k]) continue; const o4 = k * 4, R0 = LIN[d8[o4]], G0 = LIN[d8[o4 + 1]], B0 = LIN[d8[o4 + 2]], fx = cf((0.4124 * R0 + 0.3576 * G0 + 0.1805 * B0) / 0.95047), fy = cf(0.2126 * R0 + 0.7152 * G0 + 0.0722 * B0), fz = cf((0.0193 * R0 + 0.1192 * G0 + 0.9505 * B0) / 1.08883), i = id[k];
      sL[i] += 116 * fy - 16; sa[i] += 500 * (fx - fy); sb[i] += 200 * (fy - fz); sn2[i]++; }
    for (let i = 0; i < N; i++) if (sn2[i] && !RL_WILDK[i]) { const al = RL_L[terr[i]]; corr[i * 3] += al[0] - sL[i] / sn2[i]; corr[i * 3 + 1] += al[1] - sa[i] / sn2[i]; corr[i * 3 + 2] += al[2] - sb[i] / sn2[i]; }
    yield;
    for (let ty = 0, k = 0; ty < BH; ty++) { for (let tx = 0; tx < BW; tx++, k++) { if (LT[k] < 7) landPx(k, tx, ty, k * 4, corr); } if ((ty & 255) === 255) yield; }
  }
  out.gamutCorr = provList.map((i) => [names[i], +corr[i * 3].toFixed(2), +corr[i * 3 + 1].toFixed(2), +corr[i * 3 + 2].toFixed(2)]);
  for (let ty = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++) { // antialias the rounded corners
    const x = (tx + 0.5) / TX, y = (ty + 0.5) / TX; if (!((x < RL_RC || x > W - RL_RC) && (y < RL_RC || y > H - RL_RC))) continue;
    const cx = x < RL_RC ? RL_RC : W - RL_RC, cy = y < RL_RC ? RL_RC : H - RL_RC, dd = Math.hypot(x - cx, y - cy) - RL_RC, cov = Math.max(0, Math.min(1, 0.5 - dd * TX)), o4 = (ty * BW + tx) * 4;
    if (cov > 0 && d8[o4 + 3] === 0) { const nb = nearest(x, y), c = RL_WILDK[nb] ? gr : RL_L[terr[nb]]; rlLabTo(c[0], c[1], c[2], d8, o4); }
    d8[o4 + 3] = Math.round(255 * cov);
  }
  out.img = img; yield; lap('color');
  // S9: the canvas, the wild sculpture drawn into it (crags, mere banks, ripples, reeds and snags), and the mips
  const cv = makeCanvas(BW, BH), g = cv.getContext('2d'); g.putImageData(img, 0, 0);
  g.setTransform(TX, 0, 0, TX, 0, 0); rlSculptWilds(g); g.setTransform(1, 0, 0, 1, 0, 0);
  out.canvas = cv; // the mips average in CIELAB (an sRGB average darkens a textured province's L* mean by 0.2 to 0.4)
  const labMip = (src, w, h) => { const W2 = w >> 1, H2 = h >> 1, dst = new ImageData(W2, H2), dd = dst.data, sd = src.data;
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { let L = 0, a = 0, b = 0, al = 0, n = 0;
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const o = ((y * 2 + oy) * w + x * 2 + ox) * 4; if (!sd[o + 3]) continue; const R0 = LIN[sd[o]], G0 = LIN[sd[o + 1]], B0 = LIN[sd[o + 2]], fx = cf((0.4124 * R0 + 0.3576 * G0 + 0.1805 * B0) / 0.95047), fy = cf(0.2126 * R0 + 0.7152 * G0 + 0.0722 * B0), fz = cf((0.0193 * R0 + 0.1192 * G0 + 0.9505 * B0) / 1.08883); L += 116 * fy - 16; a += 500 * (fx - fy); b += 200 * (fy - fz); al += sd[o + 3]; n++; }
      const o4 = (y * W2 + x) * 4; if (n) { rlLabTo(L / n, a / n, b / n, dd, o4); dd[o4 + 3] = Math.round(al / 4); } }
    return dst; };
  const m1 = labMip(img, BW, BH); yield; const m2 = labMip(m1, BW / 2, BH / 2);
  out.mip1 = makeCanvas(BW / 2, BH / 2); out.mip1.getContext('2d').putImageData(m1, 0, 0); out.mip2 = makeCanvas(BW / 4, BH / 4); out.mip2.getContext('2d').putImageData(m2, 0, 0);
  { const t1 = makeCanvas(BW / 2, BH / 2), t2 = makeCanvas(BW / 4, BH / 4); t1.getContext('2d').drawImage(cv, 0, 0, BW / 2, BH / 2); t2.getContext('2d').drawImage(t1, 0, 0, BW / 4, BH / 4); // the sculpture drawn after the pixel pass: wilds only, so the land mips stay Lab averages
    for (const [m, t] of [[out.mip1, t1], [out.mip2, t2]]) { const mg = m.getContext('2d'); mg.save(); mg.setTransform(m.width / W, 0, 0, m.height / H, 0, 0); mg.beginPath(); for (const w of WILDS) for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? mg.lineTo(x, y) : mg.moveTo(x, y))); mg.closePath(); } mg.clip(); mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, m.width, m.height); mg.drawImage(t, 0, 0); mg.restore(); } }
  // the land-look wash is composited per texel into these canvases from their unwashed copies (rlWashSync); the mip texels inside one province carry its id
  out.img = g.getImageData(0, 0, BW, BH); out.mb1 = out.mip1.getContext('2d').getImageData(0, 0, BW / 2, BH / 2); out.mb2 = out.mip2.getContext('2d').getImageData(0, 0, BW / 4, BH / 4);
  { const W1 = BW / 2, H1 = BH / 2, W2 = BW / 4, H2 = BH / 4, mid1 = new Uint8Array(W1 * H1), mid2 = new Uint8Array(W2 * H2), wid = (k) => (LT[k] < 7 ? id[k] : 255);
    for (let y = 0; y < H1; y++) for (let x = 0; x < W1; x++) { const k = y * 2 * BW + x * 2, a = wid(k); mid1[y * W1 + x] = a !== 255 && a === wid(k + 1) && a === wid(k + BW) && a === wid(k + BW + 1) ? a : 255; }
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const k = y * 2 * W1 + x * 2, a = mid1[k]; mid2[y * W2 + x] = a !== 255 && a === mid1[k + 1] && a === mid1[k + W1] && a === mid1[k + W1 + 1] ? a : 255; }
    out.mid1 = mid1; out.mid2 = mid2; }
  lap('canvas');
  // the mode relief: a gentle fixed relief of +-3 L* (p95), mean-neutral per province, at half resolution (§9.2)
  const mr = new Float32Array(HW * HH), msum = new Float64Array(N), mcnt = new Float64Array(N);
  { const abs = []; for (let k = 0; k < HW * HH; k += 7) if (hid[k] !== 255 && !RL_WILDK[hid[k]]) abs.push(Math.abs(fS[k])); abs.sort((p, q) => p - q); const p95 = abs[Math.floor(abs.length * 0.95)] || 1;
    for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; mr[k] = Math.max(-4, Math.min(4, (RL_P.modeRelief * fS[k]) / p95)); msum[o] += mr[k]; mcnt[o]++; }
    for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; mr[k] -= msum[o] / mcnt[o]; } }
  out.modeRelief = mr; lap('modeRelief');
  // the quarter-resolution heightfield for the water and the invariant checks (the CPU reference's own; review item 33)
}

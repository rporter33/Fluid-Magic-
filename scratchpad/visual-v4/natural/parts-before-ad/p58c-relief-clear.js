
// ------------------------------------------------------------------ v4 relief: the Clear colour pass (map-relief §3.4 and §4 unchanged; natural §6: the setting and the Terrain mode)
// Runs the first time Clear is needed (the setting at load, the Terrain mode, ?terrain=clear). Three changes from v4 apply to both looks or fix verifier defects:
// the snow clamp below (natural §10 defect 2), the line rule (p59b) and the seat ground (p62).
// natural §10 defect 2 (Clear): the lightest L* at which a colour of this a*, b* stays 21 / 13 from the snow #F2EEE6 raw and 20 / 12 under the hem's peak haze
const RL_SNOWC = new Map(); const RL_GAMUT_PASSES = 4;
function rlSnowCap(a, b) {
  const key = Math.round(a * 2) * 1000 + Math.round(b * 2); let v = RL_SNOWC.get(key); if (v != null) return v; const sn = hex2rgb(RL_C.snow), t = [0, 0, 0];
  const G = hex2rgb(RL_C.gesso), hz = RL_P.fog.clear.hemPeak; // and 20 / 12 under the fog's strongest haze (the hem's peak over unexplored land)
  const ok = (L) => { rlLabTo(L, a, b, t, 0); const e = rlPairDE([t[0], t[1], t[2]], sn); if (e.normal < 21 || e.cvd < 13) return false; const h = rlPairDE(t.map((x, j) => x + (G[j] - x) * hz), sn); return h.normal >= 20.6 && h.cvd >= 12.6; }; // margins for 8-bit rounding
  let lo = 40, hi = 95; if (ok(hi)) v = hi; else { for (let it = 0; it < 18; it++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; } v = lo; }
  RL_SNOWC.set(key, v); return v;
}
function* rlClearGen(out) {
  const { BW, BH, TX, HW, HH, id, LT, LP, fS, shd, ao } = out, NP = BW * BH;
  const tm = {}; let t = performance.now(); const lap = (k) => { const n = performance.now(); tm[k] = +((tm[k] ?? 0) + n - t).toFixed(1); t = n; };
  // S6: the lightness change at full resolution: relief (the blended swing cap x the lit-capped shade), cast shadow, valley, ground detail
  const clampN = [0, 0, 0]; out.clampN = clampN; const DL = new Float32Array(NP), TD = [rlTable('detail:a'), rlTable('detail:b'), rlTable('detail:c'), rlTable('detail:d')];
  const capT = RL_T.map((tn) => RL_CAP[tn]), parcelAng = new Float32Array(N); for (let i = 0; i < N; i++) { const R = rngFor(`relief:${MAP_SEED}:parcels:${i}`); parcelAng[i] = [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(R() * 4)] + (R() - 0.5) * 0.12; } // never 45 degrees (the reserved hatch)
  const crownCell = 7 * RLK * 0.75, cellP = 7 * RLK, micro = rlMicro; // micro: rock at 7-unit features (p58a) // canopy crowns of 3 to 6 mapgen units on a jittered grid; parcels of 7 units
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
      if (!RL_DBG.noSnowClamp) { if (d > 0.6 * At) { d = 0.6 * At; clampN[1]++; } else if (d < -At && RL_DBG.clampLow) { d = -At; clampN[0]++; } } DL[k] = d; // natural §10 defect 2: the lit side clamped to +0.6 A before the mean-neutral pass (passable rock kept off the snow; the colour pass caps it again, rlSnowCap)
    }
    if ((ty & 127) === 127) yield;
  }
  lap('detail');
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
    if (L > 60 && !RL_DBG.noSnowClamp) { const c = rlSnowCap(a, b); if (L > c) L = c; } // passable land (rock above all) never reaches the snow: the lightest L* that keeps this a, b 21 / 13 from it
    rlLabTo(L, a, b, d8, o4);
  };
  const gr = rgb2lab(hex2rgb(RL_C.granite));
  for (let ty = 0, k = 0; ty < BH; ty++) {
    for (let tx = 0; tx < BW; tx++, k++) {
      const lt = LT[k], o4 = k * 4; if (lt === 255) { d8[o4 + 3] = 0; continue; }
      if (lt >= 7) { rlWildTexel(out, lt, tx, ty, d8, o4); continue; } // granite and its snow, the meres (p58b; the same in both looks)
      landPx(k, tx, ty, o4, null); d8[o4 + 3] = 255;
    }
    if ((ty & 127) === 127) yield;
  }
  // the gamut: a dark or lit pixel of a saturated albedo leaves sRGB and is clipped, which moves the province's mean (hills lost about 1 b*).
  // Two correction passes: each province's CIELAB mean over its pure pixels, as converted, is brought back onto its albedo (a constant per province)
  const LIN = new Float32Array(256); for (let v = 0; v < 256; v++) LIN[v] = s2l(v);
  const cf = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  for (let pass = 0; pass < (RL_DBG.noSnowClamp ? 2 : RL_GAMUT_PASSES); pass++) { // a third pass since the snow clamp: the means converge again (Ashfen 0.53 to 0.36 at month 40)
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
  yield; lap('color');
  yield* rlFinishLook(out, 'clear', img, tm, lap);
}
// S9 for either look: the canvas, the wild sculpture drawn into it (crags, mere banks, ripples, reeds and snags), the mips (averaged in CIELAB: an sRGB average
// darkens a textured province's L* mean by 0.2 to 0.4) and the unwashed copies the land-look wash composites from (rlWashSync). Writes out.L[look].
function* rlFinishLook(out, look, img, tm, lap) {
  const { BW, BH, TX } = out, LIN = new Float32Array(256); for (let v = 0; v < 256; v++) LIN[v] = s2l(v);
  const cf = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const cv = makeCanvas(BW, BH), g = cv.getContext('2d'); g.putImageData(img, 0, 0);
  g.setTransform(TX, 0, 0, TX, 0, 0); rlSculptWilds(g); g.setTransform(1, 0, 0, 1, 0, 0);
  const labMip = (src, w, h) => { const W2 = w >> 1, H2 = h >> 1, dst = new ImageData(W2, H2), dd = dst.data, sd = src.data;
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { let L = 0, a = 0, b = 0, al = 0, n = 0;
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const o = ((y * 2 + oy) * w + x * 2 + ox) * 4; if (!sd[o + 3]) continue; const R0 = LIN[sd[o]], G0 = LIN[sd[o + 1]], B0 = LIN[sd[o + 2]], fx = cf((0.4124 * R0 + 0.3576 * G0 + 0.1805 * B0) / 0.95047), fy = cf(0.2126 * R0 + 0.7152 * G0 + 0.0722 * B0), fz = cf((0.0193 * R0 + 0.1192 * G0 + 0.9505 * B0) / 1.08883); L += 116 * fy - 16; a += 500 * (fx - fy); b += 200 * (fy - fz); al += sd[o + 3]; n++; }
      const o4 = (y * W2 + x) * 4; if (n) { rlLabTo(L / n, a / n, b / n, dd, o4); dd[o4 + 3] = Math.round(al / 4); } }
    return dst; };
  const m1 = labMip(img, BW, BH); yield; const m2 = labMip(m1, BW / 2, BH / 2), R = { look, canvas: cv };
  R.mip1 = makeCanvas(BW / 2, BH / 2); R.mip1.getContext('2d').putImageData(m1, 0, 0); R.mip2 = makeCanvas(BW / 4, BH / 4); R.mip2.getContext('2d').putImageData(m2, 0, 0);
  { const t1 = makeCanvas(BW / 2, BH / 2), t2 = makeCanvas(BW / 4, BH / 4); t1.getContext('2d').drawImage(cv, 0, 0, BW / 2, BH / 2); t2.getContext('2d').drawImage(t1, 0, 0, BW / 4, BH / 4); // the sculpture drawn after the pixel pass: wilds only, so the land mips stay Lab averages
    for (const [m, t] of [[R.mip1, t1], [R.mip2, t2]]) { const mg = m.getContext('2d'); mg.save(); mg.setTransform(m.width / W, 0, 0, m.height / H, 0, 0); mg.beginPath(); for (const w of WILDS) for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? mg.lineTo(x, y) : mg.moveTo(x, y))); mg.closePath(); } mg.clip(); mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, m.width, m.height); mg.drawImage(t, 0, 0); mg.restore(); } }
  // the land-look wash is composited per texel into these canvases from their unwashed copies (rlWashSync)
  R.img = g.getImageData(0, 0, BW, BH); R.mb1 = R.mip1.getContext('2d').getImageData(0, 0, BW / 2, BH / 2); R.mb2 = R.mip2.getContext('2d').getImageData(0, 0, BW / 4, BH / 4);
  lap('canvas'); R.t = tm; R.washKeys = null; R.ready = true; out.L = out.L ?? {}; out.L[look] = R;
}

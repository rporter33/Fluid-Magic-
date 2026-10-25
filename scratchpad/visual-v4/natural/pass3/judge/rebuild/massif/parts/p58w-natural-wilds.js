// ------------------------------------------------------------------ natural pass 2: the wilds as natural landforms (Natural only; Clear and the Terrain mode keep the v4 massif and mere)
// The verifier's open items: the massifs were the brightest objects on the map and read as grey slabs with straight polygon edges, the meres as black polygons. The rules
// that stay: a wild is impassable and its footprint is exactly its cells (the hit test, the paths, and the contour and rim drawn on the cells' outline, p59b); inside that
// footprint the drawn silhouette may rise and soften. Peaks: a ridged range rising from foothills that continue the land around it, with valleys, its own shading and cast
// shadows (on its slopes and on the land to the lower right), and no texel brighter than the passable mountains' brightest lit rock on this bake plus RL_NW.margin (the cap is
// measured on the land pass, so the rule holds by construction). Meres: a lake inside the cells with a seeded natural shoreline, a marsh and reed fringe, and water in the map's
// natural water colour, darker toward the middle. Seeded tables only (relief:<seed>:natural:wild:*), no Math.random and no Date.
// Pass-2 critique: fix 2 (the range's interior read as crumpled foil: fine detail 2.5x the land's, L* p50 30 against ref-2's 22): fewer and longer crests (ridgeU 30 -> 56 with
// 3 octaves, was 4; ridge2A 0.04 -> 0, gully 4.5 -> 1, detail 1.2 -> 0.4), the heights softened toward a 2-texel blur by 0.5 with the light gain 2.6 (the critique's 0.65 left smooth grey dunes with no
// crest at all; 0.5 keeps the crests and meets the detail targets), darker shade faces and valleys (Lshade 22 -> 13, castL 8 -> 12) and the flat at Lmid 20, not half way to the cap; fix 3a (land inside the fence): the peaks no longer mirror the land inside the footprint and the scree apron starts at the contour (footD [0.07, 0.24] -> [0.02, 0.07]);
// fix 8 (the mere was the polygon shrunk inside a swamp band): the shore comes to the contour (shoreD [0.05, 0.17] -> [0.01, 0.10], shoreU 20 -> 34; the noise maps to it
// through a ramp from shoreN[0] to shoreN[1], so about a third of the shore lies at the contour's 0.01 D and the bays and spits wander between)
const RL_NW = { // docs/09-balance "Map presentation" rows; distances in D, noise sizes in mapgen units
  peaks: { base: 0.40, footD: [0.02, 0.07], footU: 22, coreD: 0.38, ridgeU: 56, ridgeOct: 3, stretch: 1.4, ridge2U: 13, ridgeA: 0.7, ridge2A: 0, lift: 0.22, dome: 0.62, rock: [0.6, 0.85], castD: 0.38, castSteps: 24, aoD: 0.05 },
  mere: { shoreD: [0.01, 0.10], shoreN: [0.05, 0.9], shoreU: 34, deepD: 0.2, Lshore: 33, Ldeep: 22, band: 3, wetU: 2.4, wetL: 6, fringeCap: 3, ripple: [0.08, 0.12], snags: 2 },
  mat: { rockShade: [18, 2, -5], rockLit: [50, 1, -3], scree: [40, 1, 0], turf: [35, -7, 14], foot: [27, -4, 9], frost: [57, -1.5, -6], marsh: [32, -8, 19], reed: [41, -4, 27] },
  Lshade: 13, margin: 2.5, frost: 0.4, footCap: 9, mirrorD: [0.015, 0.075], detail: 0.4, soft: 2, softK: 0.5, gully: 1, gullyU: 7, castL: 12, aoL: 5,
  Lmid: 20, gain: 2.6, grain: 0.4, // the rock's lightness: Lmid where the slope is flat to the light, toward the cap on faces lit by it, toward Lshade on the faces turned away (dark masses, lit crests)
  apron: { d: [0.10, 0.16], dU: 9, dN: 0.02, blurD: 0.03, m: 1.3, Lmin: 6, a: 1, b: -3, la: 2, lb: 3, tex: 2, sig: 0.5, split: 32, paleK: 1, fanU: 7, fan: null, smooth: 2 }, // the pale scree: la, lb (near neutral: a warm tan read as a mat round the range); paleK x the width; fan: [a, b] breaks it into fans (fanU units) where set (tried: [-0.25, 0.35] with paleK 0.75 left the rim on 98% of the outline) // fix 3: the solved apron (rlNatWildApron): its width in D (varied +-dN over dU units), the land blur, the margin on 20 / 12
};
// the rasters at half resolution: hX (the land's heights with the wilds' natural heights), F (peaks: the rise from the footprint; meres: the water factor), R (peaks: the ridge;
// meres: the depth past the shore, in deepD), s (Lambert shade), cast, ao; shd: the land's cast shadow with the ranges' shadows added (the natural colour pass reads it)
function* rlNatWildGen(out) {
  const { HW, HH, TX, hid, hh, shd, wdist } = out, D = RLD, P = RL_NW.peaks, ME = RL_NW.mere, VS = RL_P.vScale * RLK, T2 = TX / 2, NP = HW * HH;
  const hX = Float32Array.from(hh), F = new Float32Array(NP), R = new Float32Array(NP), sN = new Float32Array(NP), cN = new Float32Array(NP), aN = new Float32Array(NP), shdN = Float32Array.from(shd);
  const TF = rlTable('natural:wild:foot'), TS = rlTable('natural:wild:shore'), TR = rlGTable('natural:wild:ridge'), TR2 = rlGTable('natural:wild:ridge2'), boxes = [];
  for (const w of WILDS) {
    const set = new Set(w.cells); let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
    const B = { w, set, x0: Math.max(0, Math.floor(bb[0] * T2) - 2), y0: Math.max(0, Math.floor(bb[1] * T2) - 2), x1: Math.min(HW - 1, Math.ceil(bb[2] * T2) + 2), y1: Math.min(HH - 1, Math.ceil(bb[3] * T2) + 2) }; boxes.push(B);
    // the range's axis: the major eigenvector of its texels' spread (square roots only); its crests run along it (ridged noise stretched along the axis)
    let n = 0, mx = 0, my = 0, sxx = 0, syy = 0, sxy = 0; for (let y = B.y0; y <= B.y1; y++) for (let x = B.x0; x <= B.x1; x++) if (set.has(hid[y * HW + x])) { n++; mx += x; my += y; sxx += x * x; syy += y * y; sxy += x * y; }
    mx /= n || 1; my /= n || 1; const ca = sxx / (n || 1) - mx * mx, cc = syy / (n || 1) - my * my, cb = sxy / (n || 1) - mx * my, lam = (ca + cc) / 2 + Math.sqrt(((ca - cc) / 2) ** 2 + cb * cb);
    let ax = Math.abs(cb) > 1e-6 ? cb : ca >= cc ? 1 : 0, ay = Math.abs(cb) > 1e-6 ? lam - ca : ca >= cc ? 0 : 1; const al = Math.sqrt(ax * ax + ay * ay) || 1; ax /= al; ay /= al;
    for (let y = B.y0; y <= B.y1; y++) for (let x = B.x0; x <= B.x1; x++) {
      const k = y * HW + x; if (!set.has(hid[k])) continue; const u = (x + 0.5) / T2 / RLK, v = (y + 0.5) / T2 / RLK, d = wdist[k];
      if (w.kind === 'peaks') { // the foothills (0.07 to 0.24 D, seeded) where the range rises from the land, then the dome and the crests along the axis; valleys between them
        const fw = D * (P.footD[0] + (P.footD[1] - P.footD[0]) * (0.5 + 0.5 * rlFbm(TF, u / P.footU, v / P.footU, 3))), m = rlSmooth(0, fw, d), core = rlSmooth(0, P.coreD * D, d);
        const pa = u * ax + v * ay, qa = -u * ay + v * ax, r1 = rlRidged(TR, pa / (P.ridgeU * P.stretch), qa / P.ridgeU, P.ridgeOct, 0.7), r2 = rlRidged(TR2, u / P.ridge2U, v / P.ridge2U, 3, 0.4);
        hX[k] = P.base + m * (P.lift + P.dome * core + P.ridgeA * r1 * (0.3 + 0.7 * m) + P.ridge2A * r2 * core); F[k] = m; R[k] = r1;
      } else { // the shore: a seeded distance from the footprint (0.01 to 0.10 D); water past it, deeper toward the middle
        const sw = D * (ME.shoreD[0] + (ME.shoreD[1] - ME.shoreD[0]) * rlSmooth(ME.shoreN[0], ME.shoreN[1], rlFbm(TS, u / ME.shoreU, v / ME.shoreU, 3))), wf = rlSmooth(sw - 0.6 * RLK, sw + 0.6 * RLK, d);
        F[k] = wf; R[k] = (d - sw) / (ME.deepD * D); hX[k] = wf > 0.5 ? -0.05 : 0.40 + 0.04 * rlFbm(TS, u / 6, v / 6, 2);
      }
    }
    yield;
  }
  { const hS = rlBoxBlur(hX, HW, HH, RL_NW.soft, 1); for (const B of boxes) { if (B.w.kind !== 'peaks') continue; for (let y = B.y0; y <= B.y1; y++) for (let x = B.x0; x <= B.x1; x++) { const k = y * HW + x; if (B.set.has(hid[k])) hX[k] += RL_NW.softK * (hS[k] - hX[k]); } } } // the range's heights softened toward a 2-texel blur by softK, as the passable mountains' shading is (RL_NAT.mtnSoft); the mere keeps its own
  const dxw = 2 / TX, [lx, ly, lz] = RL_LIGHT, Hh = (xx, yy, k0) => { xx = xx < 0 ? 0 : xx >= HW ? HW - 1 : xx; yy = yy < 0 ? 0 : yy >= HH ? HH - 1 : yy; const kk = yy * HW + xx; return hid[kk] === 255 ? hX[k0] : hX[kk]; };
  const ext = Math.ceil(P.castD * D * T2), stepW = (P.castD * D) / P.castSteps, stepT = stepW / dxw, ra = Math.max(1, Math.round(P.aoD * D * T2));
  for (const B of boxes) {
    const { set, x0, y0, x1, y1 } = B;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { // Horn's slope on the natural heights, the Lambert shade
      const k = y * HW + x; if (!set.has(hid[k])) continue;
      const a = Hh(x - 1, y - 1, k), b = Hh(x, y - 1, k), c = Hh(x + 1, y - 1, k), d = Hh(x - 1, y, k), f = Hh(x + 1, y, k), g = Hh(x - 1, y + 1, k), i2 = Hh(x, y + 1, k), j = Hh(x + 1, y + 1, k);
      const dzdx = ((c + 2 * f + j - (a + 2 * d + g)) * VS) / (8 * dxw), dzdy = ((g + 2 * i2 + j - (a + 2 * b + c)) * VS) / (8 * dxw), nl = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
      sN[k] = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / nl);
    }
    { const bw = x1 - x0 + 1 + 2 * ra, bh = y1 - y0 + 1 + 2 * ra, sub = new Float32Array(bw * bh); // the valleys: how far a texel lies under its neighbourhood's mean
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) sub[y * bw + x] = Hh(x0 - ra + x, y0 - ra + y, (Math.min(HH - 1, Math.max(0, y0 - ra + y))) * HW + Math.min(HW - 1, Math.max(0, x0 - ra + x)));
      const hb = rlBoxBlur(sub, bw, bh, ra, 2); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = y * HW + x; if (set.has(hid[k])) aN[k] = rlSmooth(0, 0.03 * D, (hb[(y - y0 + ra) * bw + x - x0 + ra] - hX[k]) * VS); } }
    yield;
    for (let y = y0; y <= Math.min(HH - 1, y1 + ext); y++) for (let x = x0; x <= Math.min(HW - 1, x1 + ext); x++) { // cast shadows toward the lower right, over the range and the land beyond it
      const k = y * HW + x; if (hid[k] === 255) continue; const z0 = hX[k] * VS; let occ = 0;
      for (let m = 1; m <= P.castSteps; m++) { const sx = x + 0.5 - 0.70710678 * stepT * m, sy = y + 0.5 - 0.70710678 * stepT * m; if (sx < 0 || sy < 0) break; const zs = rlBilin(hX, HW, HH, sx, sy) * VS - (z0 + stepW * m * RL_TAN_EL); if (zs > occ) occ = zs; }
      const cs = rlSmooth(0, 0.04 * D, occ); if (RL_WILDK[hid[k]]) cN[k] = cs; else if (cs > shdN[k]) shdN[k] = cs;
    }
    yield;
  }
  out.nw = { hX, F, R, s: sN, cast: cN, ao: aN, shd: shdN };
}
// the land's ground blend at a texel (S3's weights, natural §3.1), so the foothills and the mere's fringe continue the land around them; fb where no land is near
function rlNatLandGround(out, tx, ty, fb) {
  const { QW, QH, wch } = out, qx = (tx + 0.5) / 4, qy = (ty + 0.5) / 4; let L = 0, a = 0, b = 0, ws = 0;
  for (let t = 0; t < 7; t++) { const wv = rlBilin(wch[t], QW, QH, qx, qy); if (wv > 0.002) { const G = RL_NAT.mat[RL_T[t]].ground; L += wv * G[0]; a += wv * G[1]; b += wv * G[2]; ws += wv; } }
  if (!ws) return fb; const k = Math.min(1, ws / 0.3); return [fb[0] + (L / ws - fb[0]) * k, fb[1] + (a / ws - fb[1]) * k, fb[2] + (b / ws - fb[2]) * k];
}
let RL_NWT = null;
function rlNatWildTexel(out, lt, tx, ty, d8, o4, Lcap) {
  const T = (RL_NWT ??= { n: rlNatT('wild:grain'), d: rlGTable('wild:detail'), g: rlGTable('natural:wild:gully'), re: rlNatT('reed'), w: rgb2lab(hex2rgb(RL_C.waterNat)) }), { HW, HH, TX } = out, N = out.nw, M = RL_NW.mat;
  const hx = (tx + 0.5) / 2, hy = (ty + 0.5) / 2, x = (tx + 0.5) / TX, y = (ty + 0.5) / TX, u = x / RLK, v = y / RLK, F = rlBilin(N.F, HW, HH, hx, hy), s = rlBilin(N.s, HW, HH, hx, hy), c = rlBilin(N.cast, HW, HH, hx, hy), ao = rlBilin(N.ao, HW, HH, hx, hy);
  let L, A, B;
  if (lt === 7) {
    const h = rlBilin(N.hX, HW, HH, hx, hy), q = rlSmooth(0.05, 1.0, s), rk = rlSmooth(RL_NW.peaks.rock[0], RL_NW.peaks.rock[1], h + 0.06 * rlVN(T.n, u / 4, v / 4)) * rlSmooth(0.2, 0.55, F) + rlSmooth(0.55, 0.9, F) * (1 - rlSmooth(RL_NW.peaks.rock[0], RL_NW.peaks.rock[1], h)) * 0.85, lit = Math.pow(q, 1.3); // rk: rock wherever the range has risen (its valleys scree and shade, the green only in the foothills)
    // rock: shade to lit by the light, darker in its own cast shadow and valleys, a ridged detail; scree in the hollows
    const gE = 0.6 * RLK, gU = RL_NW.gullyU * RLK, gf = (p, q2) => rlRidged(T.g, p / gU, q2 / gU, 3, 0.35), gl = Math.max(-1, Math.min(1, (gf(x + gE, y + gE) - gf(x - gE, y - gE)) * 1.8)); // the gullies: a ridged detail at 7 units lit from the upper left, at full resolution
    const sv = rlTanh(RL_NW.gain * (s - RL_SIN_EL)); // pass-2 critique fix 2: dark masses with lit crests (the flat at Lmid, not half way to the cap)
    let rL = RL_NW.Lmid + (sv > 0 ? sv * (Lcap - RL_NW.Lmid) : sv * (RL_NW.Lmid - RL_NW.Lshade)) - RL_NW.castL * c - RL_NW.aoL * ao + RL_NW.detail * rlWildDetail(T.d, x, y) + RL_NW.gully * gl * (1 - 0.6 * c) + RL_NW.grain * rlVN(T.n, u / 1.3, v / 1.3);
    let rA = M.rockShade[1] + (M.rockLit[1] - M.rockShade[1]) * q, rB = M.rockShade[2] + (M.rockLit[2] - M.rockShade[2]) * q;
    const sc = rlSmooth(0.25, 0.75, ao + 0.3 * rlVN(T.n, u / 5 + 7, v / 5)) * 0.35; rL += (M.scree[0] - 16 + 14 * lit - rL) * sc; // scree in the hollows, in their shade rA += (M.scree[1] - rA) * sc; rB += (M.scree[2] - rB) * sc;
    // frost on the highest crests where they face the light, no lighter than the cap
    const fr = RL_NW.frost * rlSmooth(1.55, 1.75, h) * rlSmooth(RL_SIN_EL - 0.02, RL_SIN_EL + 0.2, s); rL += (M.frost[0] - rL) * fr; rA += (M.frost[1] - rA) * fr; rB += (M.frost[2] - rB) * fr;
    // the foothills: the land's ground and turf, with the hills' relief, the range's cast shadow and the valleys
    // the foothills: the land's ground at the footprint, turning to rough dark heath and rubble as the range rises (F), with the hills' relief, the cast shadow and the valleys
    const G = rlNatLandGround(out, tx, ty, RL_NAT.mat.hills.ground), sh = Math.max(-1, Math.min(0.6, rlTanh(3.2 * (s - RL_SIN_EL)))), fm = 0.2 + 0.5 * F, rub = 0.45 * rlRamp(rlVN(T.n, u / 1.5 + 31, v / 1.5), 0.55, 0.85) * F;
    let fL = G[0] + (M.foot[0] - G[0]) * fm + RL_NW.footCap * sh - 6 * c - 4 * ao + 3 * rlFbm(T.n, u / 5, v / 5, 3), fA = G[1] + (M.foot[1] - G[1]) * fm, fB = G[2] + (M.foot[2] - G[2]) * fm;
    fL += (M.scree[0] - 7 + 6 * lit - fL) * rub; fA += (M.scree[1] - fA) * rub; fB += (M.scree[2] - fB) * rub;
    L = fL + (rL - fL) * rk; A = fA + (rA - fA) * rk; B = fB + (rB - fB) * rk;
    // fix 3: the apron, solved against the land outside (talus in shadow, or fans of pale scree), from the contour and fading over apron.d with a seeded wander
    const AP = RL_NW.apron, wd = rlBilin(out.wdist, HW, HH, hx, hy) + AP.dN * RLD * rlVN(T.n, u / AP.dU + 13, v / AP.dU), ap = 1 - rlSmooth(AP.d[0] * RLD, AP.d[1] * RLD, wd);
    const aw = out.nwTL ? rlBilin(out.nwTL.w, out.QW, out.QH, (tx + 0.5) / 4, (ty + 0.5) / 4) : 0; if (ap * aw > 0.002) { const tL = rlBilin(out.nwTL.L, out.QW, out.QH, (tx + 0.5) / 4, (ty + 0.5) / 4) / aw + AP.tex * rlVN(T.n, u / 1.1, v / 1.1), pale = tL > RL_NW.Lmid + 8, aa = aw * (pale ? (1 - rlSmooth(AP.d[0] * AP.paleK * RLD, AP.d[1] * AP.paleK * RLD, wd)) * (AP.fan ? rlSmooth(AP.fan[0], AP.fan[1], rlFbm(T.n, u / AP.fanU + 3, v / AP.fanU, 2)) : 1) : ap);
      L += (tL - L) * aa; A += ((pale ? AP.la : AP.a) - A) * aa; B += ((pale ? AP.lb : AP.b) - B) * aa; }
    if (L > Lcap) L = Lcap;
  } else {
    const dep = rlBilin(N.R, HW, HH, hx, hy), ME = RL_NW.mere, W0 = T.w;
    // water: the natural water's hue, its shore band 3 L* darker, deeper toward the middle, a faint ripple
    const band = rlSmooth(0, 0.6, ((dep * ME.deepD * RLD) / RLK) / ME.band), wL = ME.Lshore - ME.band * (1 - band) - (ME.Lshore - ME.Ldeep) * rlSmooth(0, 1, dep) + 0.8 * rlVN(T.n, u / 9, v / 2.5);
    // the fringe: marsh on the land's ground, reed beds (short upright strokes), wetter and darker toward the water
    const G = rlNatLandGround(out, tx, ty, RL_NAT.mat.swamp.ground), wet = rlSmooth(-ME.wetU, 0, (dep * ME.deepD * RLD) / RLK), reed = Math.max(0, Math.min(1, (rlVN(T.re, u / 0.9, v / 4.5) * 0.6 + rlFbm(T.re, u / 12 + 7, v / 12, 2) - 0.15) * 2));
    let mL = G[0] + (M.marsh[0] - G[0]) * 0.6, mA = G[1] + (M.marsh[1] - G[1]) * 0.6, mB = G[2] + (M.marsh[2] - G[2]) * 0.6; const rf = 0.6 * reed * (1 - wet);
    mL += (M.reed[0] - mL) * rf; mA += (M.reed[1] - mA) * rf; mB += (M.reed[2] - mB) * rf; mL += ME.fringeCap * Math.max(-1, Math.min(0.6, rlTanh(3.2 * (s - RL_SIN_EL)))) - ME.wetL * wet - 5 * c;
    L = mL + (wL - mL) * F; A = mA + (W0[1] - mA) * F; B = mB + (W0[2] - mB) * F;
  }
  // the land continues across the footprint: the outermost band (to RL_NW.mirrorD) takes the land texel mirrored across the nearest outline (already baked: canopy, fields,
  // heath, as they are outside), fading inward into the foothills or the fringe, so the cells' straight outline is drawn by the contour alone, never by the ground
  // pass-2 critique fix 3a: only the mere mirrors the land (its fringe); on the range the rock and scree start at the contour, so its ground reads impassable on its own
  const fade = lt === 7 ? 0 : (1 - rlSmooth(RL_NW.mirrorD[0] * RLD, RL_NW.mirrorD[1] * RLD, rlBilin(out.wdist, HW, HH, hx, hy))) * (1 - F);
  if (fade > 0.01) { const mc = rlNatMirror(out, hx, hy, x, y, d8); if (mc) { L += (mc[0] - L) * fade; A += (mc[1] - A) * fade; B += (mc[2] - B) * fade; } }
  if (L > Lcap) L = Lcap; // every wild texel, the mirrored land included, under the cap
  rlLabTo(L, A, B, d8, o4); d8[o4 + 3] = 255;
}
// pass-2 critique fix 3 (the wild read as a fenced plaque: its ground 6 to 9 px inside matched the land on 278 of 305 samples, so the frame carried the whole impassable
// read): the range's apron is solved against the land outside it. At quarter resolution, for each range texel within apron.d[1] D of the outline: the land's natural colour
// at its mirror across the outline (a masked blur of the baked land texels over apron.blurD), and the rock lightness (neutral, a* apron.a, b* apron.b) that differs from it
// by 20 / 12 x apron.m (normal / worst deficiency) from that colour and from it apron.sig standard deviations darker and lighter (the land's texture): beside land of L*
// apron.split or more the lightest talus in shadow that reaches it, else the darkest pale scree, then the other (dark only left the rim on 85 to 100% of the outline and the
// ground passing directly on 30 to 50% of the samples); where neither does, the better of the two ends. Cached by the land colour (1 L*, 2 a* b*, 1 sd). Natural only.
function rlNatWildApron(out, d8, Lcap) {
  const { QW, QH, BW, LT, wdist, HW, HH, TX } = out, AP = RL_NW.apron, NQ = QW * QH, Lq = new Float32Array(NQ), L2 = new Float32Array(NQ), Aq = new Float32Array(NQ), Bq = new Float32Array(NQ), mk = new Float32Array(NQ), tl = new Float32Array(NQ), tw = new Float32Array(NQ), cache = new Map(); // tl: the talus L* where tw is 1 (it reaches the target)
  for (let y = 0, k = 0; y < QH; y++) for (let x = 0; x < QW; x++, k++) { const fk = (y * 4 + 2) * BW + x * 4 + 2, o = fk * 4; if (LT[fk] >= 7 || d8[o + 3] < 255) continue; const lab = rgb2lab([d8[o], d8[o + 1], d8[o + 2]]); Lq[k] = lab[0]; L2[k] = lab[0] * lab[0]; Aq[k] = lab[1]; Bq[k] = lab[2]; mk[k] = 1; }
  const r = Math.max(1, Math.round((AP.blurD * RLD * TX) / 4)), bL = rlBoxBlur(Lq, QW, QH, r, 2, mk), bA = rlBoxBlur(Aq, QW, QH, r, 2, mk), bB = rlBoxBlur(Bq, QW, QH, r, 2, mk), bM = rlBoxBlur(mk, QW, QH, r, 2), bL2 = rlBoxBlur(L2, QW, QH, r, 2, mk);
  const rgb = [0, 0, 0], LO = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], score = (L, lt) => { rlLabTo(L, lt ? AP.la : AP.a, lt ? AP.lb : AP.b, rgb, 0); let m = 9; for (const lo of LO) { const q = rlPairDE(rgb, lo); m = Math.min(m, q.normal / 20, q.cvd / 12); } return m; }; // against the land's mean and its mean +- sig standard deviations
  for (let y = 0, k = 0; y < QH; y++) for (let x = 0; x < QW; x++, k++) {
    const fk = (y * 4 + 2) * BW + x * 4 + 2; if (LT[fk] !== 7) continue; const hx = (x + 0.5) * 2, hy = (y + 0.5) * 2, d = rlBilin(wdist, HW, HH, hx, hy); if (d > (AP.d[1] + AP.dN) * RLD) continue;
    const gx = rlBilin(wdist, HW, HH, hx + 1, hy) - rlBilin(wdist, HW, HH, hx - 1, hy), gy = rlBilin(wdist, HW, HH, hx, hy + 1) - rlBilin(wdist, HW, HH, hx, hy - 1), gl = Math.sqrt(gx * gx + gy * gy); if (gl < 1e-6) continue;
    const dm = Math.max(d, 0.03 * RLD) + 2 / TX, qx = x + 0.5 - ((2 * dm * gx) / gl) * (TX / 4), qy = y + 0.5 - ((2 * dm * gy) / gl) * (TX / 4); // the mirror, d outside (world units x TX / 4: quarter texels) if (qx < 0 || qy < 0 || qx >= QW || qy >= QH || rlBilin(bM, QW, QH, qx, qy) < 0.05) continue;
    const L0 = rlBilin(bL, QW, QH, qx, qy), a0 = rlBilin(bA, QW, QH, qx, qy), b0 = rlBilin(bB, QW, QH, qx, qy), sd = AP.sig * Math.sqrt(Math.max(0, rlBilin(bL2, QW, QH, qx, qy) - L0 * L0));
    const key = Math.round(L0) + ',' + Math.round(a0 / 2) + ',' + Math.round(b0 / 2) + ',' + Math.round(sd); let v = cache.get(key);
    if (v === undefined) { [L0, L0 - sd, L0 + sd].forEach((Lr, j) => rlLabTo(Math.max(0, Math.min(100, Lr)), a0, b0, LO[j], 0)); v = null;
      const dark = () => { for (let L = Math.floor(L0 - sd) - 4; L >= AP.Lmin; L--) if (score(L) >= AP.m) return L; return null; }, light = () => { for (let L = Math.ceil(L0 + sd) + 4; L <= Lcap - 3; L++) if (score(L, true) >= AP.m) return L; return null; };
      v = L0 >= AP.split ? dark() ?? light() : light() ?? dark(); if (v === null) v = score(AP.Lmin) >= score(Lcap - 3, true) ? AP.Lmin : Lcap - 3; cache.set(key, v); } // talus in shadow beside light land, pale scree beside dark land; neither reaches it: the better end
    if (v !== null) { tl[k] = v; tw[k] = 1; }
  }
  for (let it = 0; it < 2; it++) { const L2 = Float32Array.from(tl), W2 = Float32Array.from(tw); // spread the solved talus a texel past the outline, so the bilinear read does not halve it at the contour
    for (let y = 1; y < QH - 1; y++) for (let x = 1; x < QW - 1; x++) { const k = y * QW + x; if (tw[k] || LT[(y * 4 + 2) * BW + x * 4 + 2] === 7) continue; let a = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = k + dy * QW + dx; if (tw[q]) { a += tl[q]; n++; } } if (n) { L2[k] = a / n; W2[k] = 1; } }
    tl.set(L2); tw.set(W2); }
  const sL = rlBoxBlur(tl, QW, QH, AP.smooth, 1, tw); return { L: sL.map((v, k) => v * tw[k]), w: tw }; // smoothed where the talus turns to scree (the quarter texels showed as steps)
}
function rlNatMirror(out, hx, hy, x, y, d8) { // the land texel mirrored across the wild's outline (2 px past it), as CIELAB; null where it is not land
  const { HW, HH, TX, BW, BH, LT, wdist } = out, gx = rlBilin(wdist, HW, HH, hx + 1, hy) - rlBilin(wdist, HW, HH, hx - 1, hy), gy = rlBilin(wdist, HW, HH, hx, hy + 1) - rlBilin(wdist, HW, HH, hx, hy - 1), gl = Math.sqrt(gx * gx + gy * gy);
  if (gl < 1e-6) return null; const d = rlBilin(wdist, HW, HH, hx, hy) + 2 / TX, mx = x - (2 * d * gx) / gl, my = y - (2 * d * gy) / gl, tx = Math.floor(mx * TX), ty = Math.floor(my * TX);
  if (tx < 0 || ty < 0 || tx >= BW || ty >= BH) return null; const k = ty * BW + tx; if (LT[k] >= 7) return null; const o = k * 4; return d8[o + 3] === 255 ? rgb2lab([d8[o], d8[o + 1], d8[o + 2]]) : null;
}
// the natural wilds' sculpture on the bake (after the pixel pass): reed clumps along the mere's shore, faint ripples and at most RL_NW.mere.snags dark snags on its water
// (pass-2 critique fix 8: the bone-white snags read as white "Y" icons, the brightest marks on the lake; the ripples at alpha .08 and .12, were .16 and .3).
// The peaks need none: their crags and the old south faces (the slab's walls) are now the range's own relief.
function rlSculptWildsNat(g, out) {
  const N = out.nw; if (!N || out.ms) return; // pass 3 prototype: the sculpted wilds draw no sculpture on the canvas (their reeds and ripples are in their fine raster, p58y) const { HW, TX } = out, T2 = TX / 2;
  for (const w of WILDS) {
    if (w.kind !== 'mere') continue; const R = rngFor(`relief:${MAP_SEED}:natural:wild:sculpt:${w.id}`), set = new Set(w.cells), pts = [];
    let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
    for (let y = Math.floor(bb[1] * T2); y <= Math.ceil(bb[3] * T2); y += 2) for (let x = Math.floor(bb[0] * T2); x <= Math.ceil(bb[2] * T2); x += 2) { const k = y * HW + x; if (!set.has(out.hid[k])) continue; const f = N.F[k]; if (f > 0.15 && f < 0.85) pts.push([(x + 0.5) / T2, (y + 0.5) / T2]); }
    g.save(); g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip(); g.lineCap = 'round'; let snags = 0;
    for (const [px, py] of pts) { if (R() > 0.33) continue; const n = 3 + Math.floor(R() * 3); // a reed clump on the shore
      for (let q = 0; q < n; q++) { const x = px + (R() - 0.5) * 2.6 * RLK, y = py + (R() - 0.5) * 1.6 * RLK, hgt = (2.2 + 2.2 * R()) * RLK, lean = (R() - 0.5) * 1.2 * RLK; g.strokeStyle = R() < 0.5 ? 'rgba(84,92,52,.85)' : 'rgba(118,112,66,.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + lean, y - hgt); g.stroke(); } }
    for (let k = 0; k < 40; k++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]), hk = Math.floor(y * T2) * HW + Math.floor(x * T2); if (!set.has(out.hid[hk]) || N.R[hk] < 0.25) continue;
      if (k % 3 === 0) { g.strokeStyle = `rgba(200,226,222,${RL_NW.mere.ripple[0]})`; g.lineWidth = 0.7; const L = (4 + R() * 6) * RLK; g.beginPath(); g.ellipse(x, y, L, L * 0.2, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); continue; } // a faint ripple
      if (R() < 0.86 || snags >= RL_NW.mere.snags) continue; snags++; g.strokeStyle = 'rgba(52,44,34,.7)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.6, y - 4 * RLK); g.moveTo(x + 0.4, y - 2.4 * RLK); g.lineTo(x + 1.8 * RLK, y - 3.6 * RLK); g.stroke(); // a dark snag of drowned wood
      g.strokeStyle = `rgba(190,220,214,${RL_NW.mere.ripple[1]})`; g.beginPath(); g.ellipse(x, y + 0.4, 2.4 * RLK, 0.6 * RLK, 0, 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
}
// the data modes keep the v4 wild grounds in both looks (natural §9: the mode raster is identical in Natural and Clear, so R16, every mode colour 20 / 12 from the
// granite and the mere, holds unchanged): a half-resolution layer of the v4 massif and mere with their sculpture, drawn with the mode raster over the natural wilds
let RL_WML = null;
function rlWildModeLayer() {
  if (RL_WML && RL_WML.ver === RB.ver) return RL_WML.cv; const { HW, HH, hid, hLT } = RB, img = new ImageData(HW, HH), d = img.data;
  for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) { const lt = hLT[k]; if (hid[k] === 255 || (lt !== 7 && lt !== 8)) continue; rlWildTexel(RB, lt, x * 2, y * 2, d, k * 4); }
  const cv = makeCanvas(HW, HH), g = cv.getContext('2d'); g.putImageData(img, 0, 0); g.setTransform(HW / W, 0, 0, HH / H, 0, 0); rlSculptWilds(g); g.setTransform(1, 0, 0, 1, 0, 0);
  RL_WML = { cv, ver: RB.ver }; return cv;
}

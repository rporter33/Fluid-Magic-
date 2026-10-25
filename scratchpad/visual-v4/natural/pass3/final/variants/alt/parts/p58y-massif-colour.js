// ------------------------------------------------------------------ pass 3: the colour of the wilds' own raster, the bake's wild texels, the draw (Natural only)
// Colours in CIELAB D65. Under the range lies the land itself: the land's own recipe run on the wild's texels (p58n, p58m: canopy, fields, swamp pools, heath, thinning as
// the land climbs), its relief now the range's (the land's caps rising to the foothills' as it climbs). Rock (graft 1): crests and steep faces first, the valleys staying green
// longer, so spurs come down through the foothills; lit faces warm, shade faces cool but not navy (graft 4: the deepest shade lifted, its blue halved), a terminator on each
// ridgeline (the heights are made at F x the bake's resolution), no grain (graft 3: the facets carry the detail up close). No rock texel over the passable mountains'
// brightest lit rock plus RL_NW.margin (pass 2's cap). Snow (graft: caps on the crests, not streaks) sits on the massif's big forms where they peak, less on the steepest
// faces; it may pass the cap (to RL_MSC.snowMax) on at most RL_MSC.snowShareMax of the range: a rule change flagged for the owner (design-final.md "Pass 3 decisions"; reliefWildLook reports it).
// The mere: a narrow lighter shelf at the shore, the map's natural water at mid depth (graft 7: L* about 37), a darker centre, faint ripples; its fringe is the continued land,
// wetter toward the shore, with reed beds.
const RL_MSC = {
  rock: { Lsh: 16, Lmid: 31, gain: 4.0, castL: 6, aoL: 2.5, blueSh: 1.5, floor: 12, crestL: 9, crestK: [0.6, 2.2], gainB: 2.0, crestB: 0 }, rockOn: [0.2, 0.3], rockK: { ridge: 0.4, steep: 0.10, noise: 0.035 }, // pass 3 fix (art verifier 7): a crisper terminator (gain 2.4 to 4), less of the soft navy round the foot (ao 5 to 2.5 L*, blue 4 to 1.5): the shade is the cast shadow, to one side; gainB, crestB: the bake (and the mips made from it: the start view, Far, Mid, the reference zoom) keeps a softer terminator and no ridgeline light, so the crispness is the fine raster's (Near in) and the start view and Mid stay as calm as the owner's reference (art verifier 8, busyness)
  snowMax: 80, snowLit: [67, 12], snowShade: 22, snowShareMax: 0.08,
  scree: [43, 1.5, 6], screeK: 0.6, heath: [36, -0.5, 9], heathK: 0.25, footCap: 8, footCast: 5, footAo: 0.5, bakeK: 0.4, // pass 3 fix: heath at the land's chroma (the skirt read 2 to 4 C* more saturated), no ambient halo round the foot; bakeK, the bake's fine detail kept (art verifier 8; 0.6 to 0.4 with the crisper fine raster)
  water: { shelf: [50, -21, 6], deep: [28, -20, -7] }, wetL: 7, reedK: 0.5, shoreW: 4, shoreB: 5,
};
// the continued land's colour at a fine texel: the box's U plane (bake resolution), bilinear over the texels that hold it; fb where none does
function rlMsUnder(B, bx, by, fb, o3) {
  const { U, Uk, bw, bh } = B; let x = bx - 0.5, y = by - 0.5; if (x < 0) x = 0; if (y < 0) y = 0; if (x > bw - 1) x = bw - 1; if (y > bh - 1) y = bh - 1;
  const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, ix1 = ix + 1 < bw ? ix + 1 : ix, iy1 = iy + 1 < bh ? iy + 1 : iy; let L = 0, a = 0, b = 0, ws = 0;
  for (const [q, wt] of [[iy * bw + ix, (1 - fx) * (1 - fy)], [iy * bw + ix1, fx * (1 - fy)], [iy1 * bw + ix, (1 - fx) * fy], [iy1 * bw + ix1, fx * fy]]) if (Uk[q] && wt > 0) { L += wt * U[q * 3]; a += wt * U[q * 3 + 1]; b += wt * U[q * 3 + 2]; ws += wt; }
  if (ws < 1e-6) { o3[0] = fb[0]; o3[1] = fb[1]; o3[2] = fb[2]; return 0; } o3[0] = L / ws; o3[1] = a / ws; o3[2] = b / ws; return ws;
}
// a rock texel's lightness before scree and snow: lit faces toward the cap, shade toward Lsh (sv the terminator), the cast shade and ambient occlusion, cr the ridgeline light
function rlMsRockL(Rk, Lcap, sv, cs, av, cr) { return Math.max(Rk.floor, (sv > 0 ? Rk.Lmid + sv * (Lcap - 1 - Rk.Lmid) : Rk.Lmid + sv * (Rk.Lmid - Rk.Lsh)) - Rk.castL * cs - Rk.aoL * av + cr * (0.45 + 0.55 * Math.max(0, sv))); }
function* rlMsColour(out, Lcap) {
  const { BW, BH, TX, LT, HW, HH } = out, F = RL_MS.F, VS = RL_P.vScale * RLK, C = RL_MSC, Rk = C.rock, RK = C.rockK, M = RL_NAT.mat, dxh = 1 / (TX * F), [lx, ly, lz] = RL_LIGHT, NAT = RL_NAT, { cls: NC, cmar: NM, wc8 } = out.nat;
  const T = { gr: rlNatT('massif:grain'), sn: rlNatT('massif:snow'), sc: rlNatT('massif:scree'), mo: rlNatT('mottle'), re: rlNatT('reed'), rp: rlNatT('massif:ripple') }, U3 = [0, 0, 0];
  const W0 = rgb2lab(hex2rgb(RL_C.waterNat)), d8 = out.msImg.data, cls = new Uint8Array(BW * BH).fill(255), cm = new Uint8Array(BW * BH); out.mw = { cls, cm, snow8: new Uint8Array(BW * BH), snowTexels: 0, rockTexels: 0, snowOverCap: 0, snowLmax: 0 };
  out.ms.mftT = rlNatT('massif:fan');
  for (const B of out.ms.boxes) {
    const { X0, Y0, nw, nh, h, hM, m, s01, wd, pk, bx0, by0, bw, bh, cast, ao, U, Uk } = B, peaks = B.w.kind === 'peaks', img = new ImageData(nw, nh), d = img.data, db = peaks ? new Uint8ClampedArray(nw * nh * 4) : d; // db: the bake's colour (see bakeK)
    B.mft = peaks && !RL_MFT.talus ? [] : rlMftProfile(out, B.w); yield; // pass 3 fix (p58z): where the land beside each outline edge is too dark for the ink, and how light the rock there must be
    if (!peaks) rlMftMereShore(out, B); // the mere's shore at the outline where the land beside it is dark (the profile's flag, not the terrain's guess)
    // the box's land texels (outside the wild) hold the bake's own colour, so the continued land meets it without a seam
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const q = y * bw + x, k = (by0 + y) * BW + bx0 + x; if (LT[k] >= 7 || LT[k] === 255 || Uk[q]) continue; const o = k * 4; if (d8[o + 3] < 255) continue; const lab = rgb2lab([d8[o], d8[o + 1], d8[o + 2]]); U[q * 3] = lab[0]; U[q * 3 + 1] = lab[1]; U[q * 3 + 2] = lab[2]; Uk[q] = 1; }
    const rk8 = new Uint8Array(nw * nh), sn8 = new Uint8Array(nw * nh); // the rock share (peaks) or the water share (mere), for the Near detail classes
    const gx0 = Math.floor(X0 / F) - 1, gy0 = Math.floor(Y0 / F) - 1, gw = Math.ceil(nw / F) + 3, gh = Math.ceil(nh / F) + 3;
    const NZ = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(() => new Float32Array(gw * gh)); // at the bake's resolution: 0 snow / ripple, 1 mottle, 2 scree, 3 the rock line's wander, 4 reed beds, 5 the land's relief cap, 6 its shade gain; pass 3 fix (p58z): 7 the dark-ground weight of the nearest outline edge, 8 its talus need, 9 the talus' fans
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { const k = y * gw + x, u = (gx0 + x + 0.5) / TX / RLK, v = (gy0 + y + 0.5) / TX / RLK, hx = (gx0 + x + 0.5) / 2, hy = (gy0 + y + 0.5) / 2; let cap = 0, gs = 0, ws = 0;
      for (let t = 0; t < 7; t++) { const wv = rlBilin(wc8[t], HW, HH, hx, hy) / 255; cap += NAT.cap[t] * wv; gs += RL_SHG[t] * wv; ws += wv; } NZ[5][k] = ws > 0.01 ? cap / ws : C.footCap; NZ[6][k] = ws > 0.01 ? gs / ws : 1;
      { const N = rlMftNear(B.mft, (gx0 + x + 0.5) / TX, (gy0 + y + 0.5) / TX); if (N) { const [dk, nd] = rlMftAt(N, 0); NZ[7][k] = dk; NZ[8][k] = nd; NZ[10][k] = N.E.s0 + N.t * N.E.Lg; } NZ[9][k] = 0.5 + 0.5 * rlFbm(out.ms.mftT, u / RL_MFT.fanU, v / RL_MFT.fanU, 2); }
      NZ[1][k] = rlFbm(T.mo, u / 26, v / 26, 3); if (peaks) { NZ[0][k] = rlFbm(T.sn, u / 5, v / 5, 2); NZ[2][k] = rlFbm(T.sc, u / 6, v / 6, 2); NZ[3][k] = rlVN(T.gr, u / 2.2, v / 2.2) + 0.6 * rlVN(T.gr, u / 6 + 17, v / 6); } else { NZ[0][k] = rlFbm(T.rp, u / 5, v / 5, 2); NZ[4][k] = rlFbm(T.re, u / 12 + 7, v / 12, 2); } }
    const nz = (z, a, b) => rlBilin(NZ[z], gw, gh, a, b), nzMax = (z, a, b) => { const ix = Math.max(0, Math.min(gw - 2, Math.floor(a - 0.5))), iy = Math.max(0, Math.min(gh - 2, Math.floor(b - 0.5))), P = NZ[z]; return Math.max(P[iy * gw + ix], P[iy * gw + ix + 1], P[(iy + 1) * gw + ix], P[(iy + 1) * gw + ix + 1]); };
    let fill = null; if (peaks) { // pass 3 fix (art verifier 4): every valley open to the foot; a hollow of land the rock encloses (no way through land to the outline) turns to rock
      const rkA = new Float32Array(nw * nh), seen = new Uint8Array(nw * nh), st = [];
      for (let j = 0; j < nh; j++) { const gyy = (Y0 + j + 0.5) / F - gy0, rU = (j > 0 ? j - 1 : 0) * nw, rC = j * nw, rD = (j < nh - 1 ? j + 1 : j) * nw;
        for (let i = 0; i < nw; i++) { const q = j * nw + i; if (wd[q] < -RL_MS.outside) continue; const gxx = (X0 + i + 0.5) / F - gx0, iL = i > 0 ? i - 1 : 0, iR = i < nw - 1 ? i + 1 : i;
          const dzdx = ((h[rU + iR] + 2 * h[rC + iR] + h[rD + iR] - (h[rU + iL] + 2 * h[rC + iL] + h[rD + iL])) * VS) / (8 * dxh), dzdy = ((h[rD + iL] + 2 * h[rD + i] + h[rD + iR] - (h[rU + iL] + 2 * h[rU + i] + h[rU + iR])) * VS) / (8 * dxh), nl = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1), eN = hM[q] / B.hMax;
          const score = eN + RK.ridge * (s01[q] - 0.5) * rlSmooth(0, 0.25, eN) + RK.steep * rlSmooth(1.4, 3.2, nl) + RK.noise * nz(3, gxx, gyy); rkA[q] = hM[q] > 0 ? rlSmooth(C.rockOn[0], C.rockOn[1], score) : 0;
          if (wd[q] < 0.02 * RLD && rkA[q] < 0.5) { seen[q] = 1; st.push(q); } }
        if ((j & 63) === 63) yield; }
      while (st.length) { const q = st.pop(), i = q % nw, j = (q - i) / nw; for (const p of [i > 0 ? q - 1 : -1, i < nw - 1 ? q + 1 : -1, j > 0 ? q - nw : -1, j < nh - 1 ? q + nw : -1]) if (p >= 0 && !seen[p] && rkA[p] < 0.5 && wd[p] >= -RL_MS.outside) { seen[p] = 1; st.push(p); } }
      const hole = new Float32Array(nw * nh); let nH = 0; for (let q = 0; q < nw * nh; q++) if (!seen[q] && rkA[q] < 0.5 && wd[q] >= 0) { hole[q] = 1; nH++; }
      if (nH) fill = rlBoxBlur(hole, nw, nh, 2, 2); B.holes = nH; yield; }
    for (let j = 0; j < nh; j++) {
      const y = (Y0 + j + 0.5) / (TX * F), v = y / RLK, by = (Y0 + j + 0.5) / F - by0, gyy = (Y0 + j + 0.5) / F - gy0, rU = (j > 0 ? j - 1 : 0) * nw, rC = j * nw, rD = (j < nh - 1 ? j + 1 : j) * nw;
      for (let i = 0; i < nw; i++) {
        const q = j * nw + i; if (wd[q] < -RL_MS.outside) { d[q * 4 + 3] = 0; continue; } const x = (X0 + i + 0.5) / (TX * F), u = x / RLK, bxx = (X0 + i + 0.5) / F - bx0, gxx = (X0 + i + 0.5) / F - gx0, o4 = q * 4, iL = i > 0 ? i - 1 : 0, iR = i < nw - 1 ? i + 1 : i;
        const a0 = h[rU + iL], b0 = h[rU + i], c0 = h[rU + iR], d0 = h[rC + iL], f0 = h[rC + iR], g0 = h[rD + iL], i0 = h[rD + i], j0 = h[rD + iR];
        const dzdx = ((c0 + 2 * f0 + j0 - (a0 + 2 * d0 + g0)) * VS) / (8 * dxh), dzdy = ((g0 + 2 * i0 + j0 - (a0 + 2 * b0 + c0)) * VS) / (8 * dxh), nl = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
        const s = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / nl), cs = rlBilin(cast, bw, bh, bxx, by), av = rlBilin(ao, bw, bh, bxx, by), sv = rlTanh(Rk.gain * (s - RL_SIN_EL));
        rlMsUnder(B, bxx, by, M.hills.ground, U3); let gL = U3[0], gA = U3[1], gB = U3[2], L = 0, A = 0, Bb = 0, Lb = 0;
        if (peaks) {
          // the continued land, lit by the range's heights: the land's own relief cap (and shade gain) where it is low, the foothills' as it climbs; heath and scrub as it climbs
          const e = hM[q], eN = e / B.hMax, up = rlSmooth(0.02, 0.3, eN), cap = nz(5, gxx, gyy) + (C.footCap - nz(5, gxx, gyy)) * up, gsh = nz(6, gxx, gyy) + (1 - nz(6, gxx, gyy)) * up, fs = rlTanh(3.2 * gsh * (s - RL_SIN_EL));
          const ein = rlSmooth(0, 0.05 * RLD, wd[q]), rel = ein * (cap * (fs < -1 ? -1 : fs > NAT.lit ? NAT.lit : fs) - C.footCast * cs - C.footAo * av); gL += rel * Math.max(0.35, Math.min(1.2, gL / 38)); // the relief fades in from the outline, where the land's own (outside) meets it; dark covers (canopy, pools) take less of it
          const hk = C.heathK * rlSmooth(0.05, 0.22, eN); gL += (C.heath[0] - gL) * hk * 0.6; gA += (C.heath[1] - gA) * hk; gB += (C.heath[2] - gB) * hk;
          // the rock line: crests and steep faces turn to rock first, the valleys stay green longer (graft 1)
          const fdk = nz(7, gxx, gyy), wT = RL_MFT.w * RLD * (1 + RL_MFT.fan * nz(9, gxx, gyy)), ndT = fdk > 0.001 ? nzMax(8, gxx, gyy) : 0, tw = fdk > 0.001 ? fdk * rlMftKeep(ndT, Lcap) * (1 - rlSmooth(RL_MFT.edge * wT, wT, wd[q])) : 0, rb = fdk > 0.001 ? fdk * (1 - rlSmooth(wT, wT + RL_MFT.rockD * RLD, wd[q])) : 0; // pass 3 fix (p58z): beside dark ground the talus apron (tw) and the rock above it (rb) reach the line
          const mtn = B.Ldk && !RL_MFT.talus ? rlBilin(B.Ldk, B.lw, B.lh, (X0 + i + 0.5) / B.LS - B.lx0, (Y0 + j + 0.5) / B.LS - B.ly0) * (1 - rlSmooth(0.03 * RLD, 0.12 * RLD, wd[q])) : 0; // beside the passable mountains the range's rock comes to the line (their soft relief ran on inside as a blurred strip)
          const steep = rlSmooth(1.4, 3.2, nl), score = eN + RK.ridge * (s01[q] - 0.5) * rlSmooth(0, 0.25, eN) + RK.steep * steep + RK.noise * nz(3, gxx, gyy), rk = Math.max(e > 0 ? rlSmooth(C.rockOn[0], C.rockOn[1], score) : 0, rb, mtn, fill ? Math.min(1, 1.5 * fill[q]) : 0); rk8[q] = Math.round(Math.max(rk, tw) * 255);
          let rL = 0, rA = 0, rB = 0, sn = 0, rLb = 0; const svb = rlTanh(Rk.gainB * (s - RL_SIN_EL));
          if (rk > 0.001) {
            const crest = rlSmooth(Rk.crestK[0], Rk.crestK[1], -((b0 + d0 + f0 + i0 - 4 * h[q]) * VS) / dxh); // pass 3 fix (art verifier 7): a crisp light on each ridgeline (the convex crest of the fine heights), brighter on the lit side
            rL = rlMsRockL(Rk, Lcap, sv, cs, av, Rk.crestL * crest); rLb = rlMsRockL(Rk, Lcap, svb, cs, av, Rk.crestB * crest); rA = 0.6 + 0.6 * sv; rB = (sv > 0 ? 2 + 3 * sv : 2 + Rk.blueSh * sv) - 3 * cs;
            // scree: aprons where the rock begins and in its gullies, warm grey, in the shading
            const ap = (1 - rlSmooth(0.18, 0.5, eN)) * rlSmooth(0.1, 0.55, av + 0.35 * nz(2, gxx, gyy)) * C.screeK;
            if (ap > 0) { const gr = 2 * rlVN(T.gr, u / 0.9 + 9, v / 0.9), sL = C.scree[0] + 6 * sv - 8 * cs + gr; rL += (sL - rL) * ap; rLb += (C.scree[0] + 6 * svb - 8 * cs + gr - rLb) * ap; rA += (C.scree[1] - rA) * ap; rB += (C.scree[2] - rB) * ap; }
            if (rL > Lcap) rL = Lcap; if (rLb > Lcap) rLb = Lcap; out.mw.rockTexels++;
            // snow caps: on the massif's big forms where they peak (the body and the crest's peaks, not the spurs), broken by the ridges, less on the steepest faces
            const big = (pk[q] - B.snowQ[0]) / Math.max(1e-6, B.snowQ[1] - B.snowQ[0]);
            sn = rlSmooth(0, 1, big + 0.3 * (s01[q] - 0.5) + 0.3 * nz(0, gxx, gyy)) * (0.35 + 0.65 * rlSmooth(0.15, 0.4, 1 / nl));
            if (sn > 0.01) { let nL = (sv > 0 ? C.snowLit[0] + C.snowLit[1] * sv : C.snowLit[0] + C.snowShade * sv) - 0.8 * Rk.castL * cs; if (nL > C.snowMax) nL = C.snowMax; const nB = 1 + (sv < 0 ? 4 * sv : 0) - 3 * cs;
              rL += (nL - rL) * sn; rA += (-0.8 - rA) * sn; rB += (nB - rB) * sn; let nLb = (svb > 0 ? C.snowLit[0] + C.snowLit[1] * svb : C.snowLit[0] + C.snowShade * svb) - 0.8 * Rk.castL * cs; if (nLb > C.snowMax) nLb = C.snowMax; rLb += (nLb - rLb) * sn; }
          }
          L = gL + (rL - gL) * rk; Lb = gL + (rLb - gL) * rk; A = gA + (rA - gA) * rk; Bb = gB + (rB - gB) * rk;
          if (!RL_MFT.talus && rk > 0.001 && (L < RL_MFT.inkL || Lb < RL_MFT.inkL)) { const zf = 1 - rlSmooth(RL_MFT.edge * RL_MFT.w * RLD, RL_MFT.w * RLD, wd[q]); if (zf > 0) { if (L < RL_MFT.inkL) L += (RL_MFT.inkL - L) * rk * zf; if (Lb < RL_MFT.inkL) Lb += (RL_MFT.inkL - Lb) * rk * zf; } } // pass 3 fix (p58z): with the stone band, the rock within the test's reach of the line is never darker than the ink clears
          if (tw > 0.001) { const st = Math.max(0, Math.min(1, 0.5 + 0.9 * rlVN(T.sc, nz(10, gxx, gyy) / RLK / 0.7, wd[q] / RLK / 3.5))), tL = rlMftTalusL(ndT, Lcap, st, sv), tLb = rlMftTalusL(ndT, Lcap, st, svb); L += (Math.max(L, tL) - L) * tw; Lb += (Math.max(Lb, tLb) - Lb) * tw; A += (RL_MFT.hue[0] - A) * tw * 0.7; Bb += (RL_MFT.hue[1] - Bb) * tw * 0.7; } // the talus: scree streaked down the slope, never darker than the test needs
          { const lim = Lcap + (C.snowMax - Lcap) * Math.min(1, sn * rk); if (L > lim) L = lim; if (Lb > lim) Lb = lim; } /* over the cap only by the texel's snow share */ sn8[q] = Math.round(Math.min(1, sn * rk) * 255); if (sn > 0.5 && rk > 0.5) { out.mw.snowTexels++; if (L > Lcap) out.mw.snowOverCap++; if (L > out.mw.snowLmax) out.mw.snowLmax = L; }
        } else {
          // the mere: the narrow shelf at the shore, the map's water at mid depth, a darker centre; the waterline antialiased on the fine raster
          const e = m[q], P = RL_MS.mere, W = C.water, wf = Math.max(0, Math.min(1, e / 0.006 + 0.5)); rk8[q] = Math.round(wf * 255); let wL = 0, wA = 0, wB = 0;
          if (wf > 0) { const fdk = nz(7, gxx, gyy), atLine = fdk * (1 - rlSmooth(0, 0.15 * RLD, wd[q])), shelf = (1 - rlSmooth(0, P.shelf, e + 0.02 * nz(0, gxx, gyy))) * (1 - fdk), deep = rlSmooth(P.shelf, P.deep, e) * (1 - atLine); // pass 3 fix: where the water meets the outline (beside dark ground) no shelf, and the map's water up to the line
            wL = W0[0] + (W.deep[0] - W0[0]) * deep; wA = W0[1] + (W.deep[1] - W0[1]) * deep; wB = W0[2] + (W.deep[2] - W0[2]) * deep;
            wL += (W.shelf[0] - wL) * shelf; wA += (W.shelf[1] - wA) * shelf; wB += (W.shelf[2] - wB) * shelf; wL += (0.35 * rlVN(T.rp, u / 10, v / 2.2) + 0.9 * Math.max(0, rlVN(T.rp, u / 3 + 5, v / 0.7) - 0.3)) * deep; } // faint light ripples, not blotches
          if (wf < 1) { // the fringe: the continued land, wetter and darker toward the shore, with reed beds near it
            const wet = rlSmooth(-0.09, 0, e), reed = Math.max(0, Math.min(1, (rlVN(T.re, u / 0.9, v / 4.5) * 0.6 + nz(4, gxx, gyy) - 0.1) * 2)) * (1 - rlSmooth(0.02, 0.16, -e)) * C.reedK; // wet and reedy toward the shore (the prototype had both reversed: the whole fringe wet, no reeds)
            gL += -C.wetL * wet + 2 * Math.max(-1, Math.min(0.6, rlTanh(3.2 * (s - RL_SIN_EL)))); gA -= 2 * wet;
            gL += (M.swamp.reed[0] - gL) * reed; gA += (M.swamp.reed[1] - gA) * reed; gB += (M.swamp.reed[2] - gB) * reed; }
          L = gL + (wL - gL) * wf; A = gA + (wA - gA) * wf; Bb = gB + (wB - gB) * wf; if (L > Lcap) L = Lcap;
        }
        rlLabTo(L, A, Bb, d, o4); d[o4 + 3] = 255; if (peaks) { rlLabTo(Lb, A, Bb, db, o4); db[o4 + 3] = 255; }
      }
      if ((j & 15) === 15) yield;
    }
    if (!peaks) { // pass 3 fix (art verifier 9): a crisp shore like the map's ponds: a 2-texel band of the water 4 L* darker at the waterline and the bank 5 L* darker just outside it
      const sh = new Int8Array(nw * nh); for (let j = 1; j < nh - 1; j++) for (let i = 1; i < nw - 1; i++) { const q = j * nw + i, wq = rk8[q] >= 128; let edge = 0; for (const p of [q - 1, q + 1, q - nw, q + nw, q - 2, q + 2, q - 2 * nw, q + 2 * nw]) if ((rk8[p] >= 128) !== wq) { edge = 1; break; } if (edge) sh[q] = wq ? 1 : -1; }
      for (let q = 0; q < nw * nh; q++) { if (!sh[q] || d[q * 4 + 3] < 255 || wd[q] < 0) continue; const o = q * 4, c = rgb2lab([d[o], d[o + 1], d[o + 2]]); rlLabTo(c[0] - (sh[q] > 0 ? C.shoreW : C.shoreB), c[1], c[2], d, o); } }
    const cv = makeCanvas(nw, nh); cv.getContext('2d').putImageData(img, 0, 0); Object.assign(B, { cv, img, rk8 });
    // the bake's wild texels: the F x F means of the fine raster (sRGB means), and the Near detail's classes (rock 4; the continued land its own class and canopy; reed 5; open water none)
    const bt = []; for (let ty = Math.floor(Y0 / F); ty * F + F - 1 <= Y0 + nh - 1; ty++) { if (ty * F < Y0 || ty >= BH) continue;
      for (let tx = Math.floor(X0 / F); tx * F + F - 1 <= X0 + nw - 1; tx++) { if (tx * F < X0 || tx >= BW) continue; const k = ty * BW + tx; if (LT[k] !== 7 && LT[k] !== 8) continue; let r = 0, g = 0, b = 0, rr = 0, ss = 0;
        for (let b2 = 0; b2 < F; b2++) for (let a2 = 0; a2 < F; a2++) { const qq = (ty * F + b2 - Y0) * nw + tx * F + a2 - X0, o = qq * 4; r += db[o]; g += db[o + 1]; b += db[o + 2]; rr += rk8[qq]; ss += sn8[qq]; }
        const n = F * F, o = k * 4; d8[o] = Math.round(r / n); d8[o + 1] = Math.round(g / n); d8[o + 2] = Math.round(b / n); d8[o + 3] = 255; rr /= n * 255; out.mw.snow8[k] = Math.round(ss / n); if (peaks) bt.push(k);
        const land = NC[k] !== 255 ? NC[k] : peaks ? 3 : 5; if (peaks) { cls[k] = rr > 0.5 ? 255 : land; cm[k] = rr > 0.5 ? 0 : NM[k]; } else { cls[k] = rr > 0.5 ? 255 : land; cm[k] = rr > 0.5 ? 0 : NM[k]; } } } // graft 3: no grain on the rock (its facets carry the detail)
    if (peaks && C.bakeK < 1 && bt.length) { // pass 3 fix (art verifier 8: the finest ridging read 2.4 x the land's detail at Mid): the bake's range texels keep bakeK of their 3 x 3 detail in L*; the fine raster (Near in) keeps all of it
      const Lb = new Map(); for (const k of bt) { const o = k * 4; Lb.set(k, rgb2lab([d8[o], d8[o + 1], d8[o + 2]])); }
      for (const k of bt) { const c = Lb.get(k); let s = 0, n = 0; for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const q = Lb.get(k + oy * BW + ox); if (q) { s += q[0]; n++; } } const m = s / n; rlLabTo(m + (c[0] - m) * C.bakeK, c[1], c[2], d8, k * 4); } }
    yield;
  }
}
// the wilds' fine raster on screen: where the bake is magnified (more than RL_MSD.tpp device px a fine texel would be shown by the bake), each wild's own canvas over the
// bake, clipped to its cells; from there out to RL_MSD.tpp1 the bake's own full-resolution canvas (crisper than the land's half mip); the Natural look only
const RL_MSD = { tpp: 1.0, tpp1: 1.8, n: 0, ms: 0, src: '' }; // pass 3 fix: the fine raster from 1.0 device px a bake texel (was 0.85), so the Near views (0.55 and 0.6 of the closest zoom) draw it crisp, not the bake magnified
const rlMsSource = () => { if (!RB.ready || !RB.ms) return 'none'; const tpp = RB.TX / (cam.s * dpr); return tpp <= RL_MSD.tpp || RL_DBG.msFine === true ? 'fine' : tpp <= RL_MSD.tpp1 && rlMipLevel() !== 0 ? 'bake' : 'land'; }; // what the wilds are drawn from at this zoom (the edge decision reads the same)
function rlDrawMassifFine(g, alpha) {
  if (!RB.ready || !RB.ms || alpha <= 0 || rlShownLook() !== 'natural' || state.mode === 'terrain' || SKIP.has('massifFine')) return;
  const src = rlMsSource(), Lk = RB.L.natural; if (src === 'land' || src === 'none' || (src === 'bake' && !Lk)) return; const fine = src === 'fine', tpp = RB.TX / (cam.s * dpr);
  const t0 = performance.now(), F = RL_MS.F, FT = RB.TX * F;
  g.save(); g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = (fine ? tpp * F : tpp) > 1 ? 'high' : 'low';
  for (const B of RB.ms.boxes) { if (!B.cv) continue; g.save(); g.beginPath(); for (const c of B.w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    if (fine) g.drawImage(B.cv, B.X0 / FT, B.Y0 / FT, B.nw / FT, B.nh / FT); else { const sx = Math.floor(B.X0 / F), sy = Math.floor(B.Y0 / F), sw = Math.ceil(B.nw / F), sh = Math.ceil(B.nh / F); g.drawImage(Lk.canvas, sx, sy, sw, sh, sx / RB.TX, sy / RB.TX, sw / RB.TX, sh / RB.TX); }
    g.restore(); }
  g.restore(); RL_MSD.n++; RL_MSD.ms = +(performance.now() - t0).toFixed(1); RL_MSD.src = src;
}
// graft 4 (art judge): zoomed out the range was the most contrasty object on the map (navy shade, white snow, 14 to 27% of core cells jumping 20 L*). The mips the start
// view and the least zoom draw (RL_MSM: mip1, mip2) take the wild texels' lightness toward their local mean (k), lift the deepest shade (floor) and hold the snow lower
// (knee): only zoomed out; from Mid in the wilds draw the bake or their own raster, crisp
const RL_MSM = { rD: 0.035, mip1: { k: 0.8, // pass 3 fix: k 0.92 to 0.8 and 0.82 to 0.75 (the deeper shade made the start view 49% busy against the reference's 31 to 35)
   floor: 13, knee: 66, kneeK: 0.5 }, mip2: { k: 0.75, floor: 15, knee: 60, kneeK: 0.35 } };
function rlMsMips(out, R) {
  const { BW, id } = out;
  for (const [cv, P] of [[R.mip1, RL_MSM.mip1], [R.mip2, RL_MSM.mip2]]) {
    const w = cv.width, h = cv.height, f = BW / w, g = cv.getContext('2d'), img = g.getImageData(0, 0, w, h), d = img.data, Lp = new Float32Array(w * h), mk = new Float32Array(w * h), lab = new Float32Array(w * h * 3);
    for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k++) { const o = k * 4, i = id[Math.min(out.BH - 1, Math.floor((y + 0.5) * f)) * BW + Math.floor((x + 0.5) * f)]; if (i === 255 || !RL_WILDK[i] || d[o + 3] < 255) continue; const c = rgb2lab([d[o], d[o + 1], d[o + 2]]); lab[k * 3] = c[0]; lab[k * 3 + 1] = c[1]; lab[k * 3 + 2] = c[2]; Lp[k] = c[0]; mk[k] = 1; }
    const Lb = rlBoxBlur(Lp, w, h, Math.max(1, Math.round((RL_MSM.rD * RLD * out.TX) / f)), 2, mk);
    for (let k = 0; k < w * h; k++) { if (!mk[k]) continue; let L = Lb[k] + (Lp[k] - Lb[k]) * P.k; if (L < P.floor) L = P.floor - (P.floor - L) * 0.5; if (L > P.knee) L = P.knee + (L - P.knee) * P.kneeK; const s = Lp[k] > 1 ? 0.85 + 0.15 * Math.min(1, L / Lp[k]) : 1; rlLabTo(L, lab[k * 3 + 1] * s, lab[k * 3 + 2] * s, d, k * 4); }
    g.putImageData(img, 0, 0);
  }
  rlMftMips(out, R); // pass 3 fix (p58z): the talus apron widened in the mips
}

// ------------------------------------------------------------------ pass 3: the colour of the wilds' own raster, the bake's wild texels, the draw (Natural only)
// Colours in CIELAB D65. Pass 3b (the owner's answer of 2026-10-24, "Soft, like province lines"): no outline at rest, so the landform marks the extent. Past the foot (p58x lf)
// the range is rock: crests and steep faces lit and shaded by the fine heights (a terminator on each ridgeline up close), scree in the gullies and on the lower slopes in patches
// (never a band along the foot), snow caps on the big forms. Below the foot lies the land outside continued (its recipe, relief and covers: p58n, p58m, p58z), with scree
// crumbs scattered on it just below the foot, so the foot is a ragged natural line and no straight line reads at the outline. Lit faces warm, shade faces cool but not navy; no
// grain on rock (the facets carry the detail up close). No rock texel over the passable mountains' brightest lit rock plus RL_NW.margin (pass 2's cap). Snow may pass the cap
// (to RL_MSC.snowMax) on at most RL_MSC.snowShareMax of the range (a pass-3 rule change; reliefWildLook reports it).
// The mere fills its cells: the map's natural water at mid depth (L* about 37), a narrow lighter shelf at the shore that comes and goes, deeper toward the middle, faint ripples;
// between the shore and the outline the land continued, wetter and reedy only toward the shore (never at the outline itself).
const RL_MSC = {
  // pass 3b (the pass-3 verifier: the rock's contrast jumped where the bake hands over to the fine raster, 3.7 L* against 1.1): the fine raster's terminator 4.0 to 3.4 and its
  // ridgeline light 9 to 7, the bake's 2.0 to 2.6 and 0 to 2.5, and the fine raster fades in over RL_MSD.tpp0..tpp, so the two meet; bakeK 0.4 to 0.5 (rock only now)
  rock: { Lsh: 16, Lmid: 31, gain: 3.4, castL: 6, aoL: 2.5, blueSh: 1.5, floor: 12, crestL: 7, crestK: [0.6, 2.2], gainB: 2.3, crestB: 1.2 },
  snowMax: 80, snowLit: [67, 12], snowShade: 22, snowShareMax: 0.08,
  scree: [40, 1.5, 6], screeK: 0.55, screeOn: [0.15, 0.6], screeP: [-0.15, 0.3], bakeK: 0.32, // scree in patches (screeP over the patch noise), so it never runs as a pale band along the foot
  crumb: [0.08, 0.62], // the crumbs below the foot: where the crumb noise is under crumb[1] x the zone's density (1 at the foot, 0 crumbD below it), edged over crumb[0]
  footBlend: [0.03, 0.55], // pass 3b: over the rock's first footBlend[0] D past the foot, turf and lichen in patches take up to footBlend[1] of the land's colour (dense at the foot, thinning up the slope), so the foot is not a cut-out edge
  water: { shelf: [50, -21, 6], deep: [28, -20, -7] }, wetL: 6, wetD: 0.012, reedK: 0.5, shoreW: 4, shoreB: 5, shelfD: [0.003, 0.016], shelfK: 0.8, deepR: [0.04, 0.6],
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
  const { BW, BH, TX, LT } = out, F = RL_MS.F, FT = TX * F, VS = RL_P.vScale * RLK, C = RL_MSC, Rk = C.rock, M = RL_NAT.mat, dxh = 1 / FT, [lx, ly, lz] = RL_LIGHT, { cls: NC, cmar: NM } = out.nat, P = RL_MS.peaks;
  const T = { gr: rlNatT('massif:grain'), sn: rlNatT('massif:snow'), sc: rlNatT('massif:scree'), re: rlNatT('reed'), rp: rlNatT('massif:ripple'), cr: rlNatT('massif:crumb') }, U3 = [0, 0, 0];
  const W0 = rgb2lab(hex2rgb(RL_C.waterNat)), d8 = out.msImg.data, cls = new Uint8Array(BW * BH).fill(255), cm = new Uint8Array(BW * BH); out.mw = { cls, cm, lf8: new Uint8Array(BW * BH), snow8: new Uint8Array(BW * BH), snowTexels: 0, rockTexels: 0, snowOverCap: 0, snowLmax: 0 }; // lf8: the landform's share per bake texel (rock and scree, or water)
  for (const B of out.ms.boxes) {
    const { X0, Y0, nw, nh, h, hM, s01, wd, pk, lf, tp, bx0, by0, bw, bh, cast, ao, U, Uk } = B, peaks = B.w.kind === 'peaks', img = new ImageData(nw, nh), d = img.data, db = peaks ? new Uint8ClampedArray(nw * nh * 4) : d; // db: the bake's colour (see bakeK)
    // the box's land texels (outside the wild) hold the bake's own colour, so the continued land meets it without a seam
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const q = y * bw + x, k = (by0 + y) * BW + bx0 + x; if (LT[k] >= 7 || LT[k] === 255 || Uk[q]) continue; const o = k * 4; if (d8[o + 3] < 255) continue; const lab = rgb2lab([d8[o], d8[o + 1], d8[o + 2]]); U[q * 3] = lab[0]; U[q * 3 + 1] = lab[1]; U[q * 3 + 2] = lab[2]; Uk[q] = 1; }
    yield;
    const rk8 = new Uint8Array(nw * nh), sn8 = new Uint8Array(nw * nh); // the landform share (rock, scree, crumbs; or water), for the Near detail classes and the rest check (reliefWildRest)
    const gx0 = Math.floor(X0 / F) - 1, gy0 = Math.floor(Y0 / F) - 1, gw = Math.ceil(nw / F) + 3, gh = Math.ceil(nh / F) + 3;
    const NZ = [0, 1, 2, 3, 4].map(() => new Float32Array(gw * gh)); // at the bake's resolution: 0 snow / ripple, 1 the scree's patches / the shelf's width, 2 scree, 3 the rock line's wander, 4 reed beds
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { const k = y * gw + x, u = (gx0 + x + 0.5) / TX / RLK, v = (gy0 + y + 0.5) / TX / RLK;
      if (peaks) { NZ[0][k] = rlFbm(T.sn, u / 5, v / 5, 2); NZ[1][k] = rlFbm(T.sc, u / 7 + 23, v / 7, 2); NZ[2][k] = rlFbm(T.sc, u / 6, v / 6, 2); NZ[3][k] = rlVN(T.gr, u / 2.2, v / 2.2) + 0.6 * rlVN(T.gr, u / 6 + 17, v / 6); }
      else { NZ[0][k] = rlFbm(T.rp, u / 5, v / 5, 2); NZ[1][k] = rlFbm(T.rp, u / 9 + 41, v / 9, 2); NZ[4][k] = rlFbm(T.re, u / 12 + 7, v / 12, 2); } }
    const nz = (z, a, b) => rlBilin(NZ[z], gw, gh, a, b);
    for (let j = 0; j < nh; j++) {
      const y = (Y0 + j + 0.5) / FT, v = y / RLK, by = (Y0 + j + 0.5) / F - by0, gyy = (Y0 + j + 0.5) / F - gy0, rU = (j > 0 ? j - 1 : 0) * nw, rC = j * nw, rD = (j < nh - 1 ? j + 1 : j) * nw;
      for (let i = 0; i < nw; i++) {
        const q = j * nw + i; if (wd[q] < -RL_MS.outside) { d[q * 4 + 3] = 0; continue; } const x = (X0 + i + 0.5) / FT, u = x / RLK, bxx = (X0 + i + 0.5) / F - bx0, gxx = (X0 + i + 0.5) / F - gx0, o4 = q * 4, iL = i > 0 ? i - 1 : 0, iR = i < nw - 1 ? i + 1 : i;
        const a0 = h[rU + iL], b0 = h[rU + i], c0 = h[rU + iR], d0 = h[rC + iL], f0 = h[rC + iR], g0 = h[rD + iL], i0 = h[rD + i], j0 = h[rD + iR];
        const dzdx = ((c0 + 2 * f0 + j0 - (a0 + 2 * d0 + g0)) * VS) / (8 * dxh), dzdy = ((g0 + 2 * i0 + j0 - (a0 + 2 * b0 + c0)) * VS) / (8 * dxh), nl = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
        const s = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / nl), cs = rlBilin(cast, bw, bh, bxx, by), av = rlBilin(ao, bw, bh, bxx, by), sv = rlTanh(Rk.gain * (s - RL_SIN_EL)), tw = tp[q]; // tw: past the foot or the shore (world units, p58x)
        rlMsUnder(B, bxx, by, M.hills.ground, U3); const gL = U3[0], gA = U3[1], gB = U3[2]; let L = 0, A = 0, Bb = 0, Lb = 0; // the land continued, as it is outside (its relief from p58m): below the foot this is all that is drawn
        if (peaks) {
          const e = hM[q], eN = e / B.hMax, lq = lf[q], svb = rlTanh(Rk.gainB * (s - RL_SIN_EL));
          let cw = 0; if (lq < 0.999 && tw > -P.crumbD * RLD) { const z = rlSmooth(-P.crumbD * RLD, 0, tw), nC = 0.5 + 0.5 * rlVN(T.cr, u / P.crumbU, v / P.crumbU); cw = (1 - rlSmooth(C.crumb[1] * z - C.crumb[0], C.crumb[1] * z + C.crumb[0], nC)) * z; } // scree crumbs below the foot: densest at it
          let rL = gL, rA = gA, rB = gB, rLb = gL, sn = 0;
          if (lq > 0.001) {
            const crest = rlSmooth(Rk.crestK[0], Rk.crestK[1], -((b0 + d0 + f0 + i0 - 4 * h[q]) * VS) / dxh); // a crisp light on each ridgeline (the convex crest of the fine heights), brighter on the lit side
            rL = rlMsRockL(Rk, Lcap, sv, cs, av, Rk.crestL * crest); rLb = rlMsRockL(Rk, Lcap, svb, cs, av, Rk.crestB * crest); rA = 0.6 + 0.6 * sv; rB = (sv > 0 ? 2 + 3 * sv : 2 + Rk.blueSh * sv) - 3 * cs;
            const ap = (1 - rlSmooth(0.18, 0.5, eN)) * rlSmooth(C.screeOn[0], C.screeOn[1], av + 0.45 * nz(2, gxx, gyy)) * rlSmooth(C.screeP[0], C.screeP[1], nz(1, gxx, gyy)) * C.screeK; // scree: gullies and lower slopes, in patches
            if (ap > 0) { const gr = 2 * rlVN(T.gr, u / 0.9 + 9, v / 0.9), sL = C.scree[0] + 6 * sv - 8 * cs + gr; rL += (sL - rL) * ap; rLb += (C.scree[0] + 6 * svb - 8 * cs + gr - rLb) * ap; rA += (C.scree[1] - rA) * ap; rB += (C.scree[2] - rB) * ap; }
            if (rL > Lcap) rL = Lcap; if (rLb > Lcap) rLb = Lcap; if (lq > 0.5) out.mw.rockTexels++;
            // snow caps: on the massif's big forms where they peak (the body and the crest's peaks, not the spurs), broken by the ridges, less on the steepest faces
            const big = (pk[q] - B.snowQ[0]) / Math.max(1e-6, B.snowQ[1] - B.snowQ[0]);
            sn = rlSmooth(0, 1, big + 0.3 * (s01[q] - 0.5) + 0.3 * nz(0, gxx, gyy)) * (0.35 + 0.65 * rlSmooth(0.15, 0.4, 1 / nl));
            if (sn > 0.01) { let nL = (sv > 0 ? C.snowLit[0] + C.snowLit[1] * sv : C.snowLit[0] + C.snowShade * sv) - 0.8 * Rk.castL * cs; if (nL > C.snowMax) nL = C.snowMax; const nB = 1 + (sv < 0 ? 4 * sv : 0) - 3 * cs;
              rL += (nL - rL) * sn; rA += (-0.8 - rA) * sn; rB += (nB - rB) * sn; let nLb = (svb > 0 ? C.snowLit[0] + C.snowLit[1] * svb : C.snowLit[0] + C.snowShade * svb) - 0.8 * Rk.castL * cs; if (nLb > C.snowMax) nLb = C.snowMax; rLb += (nLb - rLb) * sn; }
          }
          { const ramp = 1 - rlSmooth(0, C.footBlend[0] * RLD * (0.6 + 0.8 * rlSmooth(-0.4, 0.4, nz(1, gxx, gyy))), tw), nT = 0.5 + 0.5 * rlVN(T.cr, u / 1.3 + 17, v / 1.3), fb = C.footBlend[1] * Math.max(0.35 * ramp, 1 - rlSmooth(ramp - 0.12, ramp + 0.12, nT)) * (1 - sn); rL += (gL - rL) * fb; rLb += (gL - rLb) * fb; rA += (gA - rA) * fb; rB += (gB - rB) * fb; } // the lower slopes keep some of the land's colour // turf in patches, dense at the foot and thinning up the slope
          L = gL + (rL - gL) * lq; Lb = gL + (rLb - gL) * lq; A = gA + (rA - gA) * lq; Bb = gB + (rB - gB) * lq;
          if (cw > 0.001) { const k2 = cw * (1 - lq), gr = 2 * rlVN(T.gr, u / 0.9 + 9, v / 0.9), cL = C.scree[0] - 3 + 6 * sv + gr, cLb = C.scree[0] - 3 + 6 * svb + gr; L += (cL - L) * k2; Lb += (cLb - Lb) * k2; A += (C.scree[1] - A) * k2; Bb += (C.scree[2] - Bb) * k2; } // the crumbs: scree a little darker than the aprons, lit as the land lies
          rk8[q] = Math.round(Math.max(lq, cw) * 255);
          { const lim = Lcap + (C.snowMax - Lcap) * Math.min(1, sn * lq); if (L > lim) L = lim; if (Lb > lim) Lb = lim; } /* over the cap only by the texel's snow share */ sn8[q] = Math.round(Math.min(1, sn * lq) * 255); if (sn > 0.5 && lq > 0.5) { out.mw.snowTexels++; if (L > Lcap) out.mw.snowOverCap++; if (L > out.mw.snowLmax) out.mw.snowLmax = L; }
        } else {
          // the mere: the water to the shore (lf), the map's water at mid depth, a narrow shelf at the shore that comes and goes, deeper toward the middle
          const wf = lf[q], W = C.water, edge = rlSmooth(0, 0.008 * RLD, wd[q]); rk8[q] = Math.round(wf * 255); let wL = 0, wA = 0, wB = 0, gl = gL, ga = gA, gb = gB;
          if (wf > 0) { const dep = Math.max(0, tw) / (B.tpMax || 1), sw = RLD * (C.shelfD[0] + (C.shelfD[1] - C.shelfD[0]) * (0.5 + 0.5 * nz(1, gxx, gyy))), shelf = (1 - rlSmooth(0, sw, tw + 0.003 * RLD * nz(0, gxx, gyy))) * C.shelfK, deep = rlSmooth(C.deepR[0], C.deepR[1], dep);
            wL = W0[0] + (W.deep[0] - W0[0]) * deep; wA = W0[1] + (W.deep[1] - W0[1]) * deep; wB = W0[2] + (W.deep[2] - W0[2]) * deep;
            wL += (W.shelf[0] - wL) * shelf; wA += (W.shelf[1] - wA) * shelf; wB += (W.shelf[2] - wB) * shelf; wL += (0.35 * rlVN(T.rp, u / 10, v / 2.2) + 0.9 * Math.max(0, rlVN(T.rp, u / 3 + 5, v / 0.7) - 0.3)) * deep; } // faint light ripples, not blotches
          if (wf < 1) { // between the shore and the outline: the land continued, wetter and reedy toward the shore only (never at the outline: the land outside meets it as it is)
            const wet = rlSmooth(-C.wetD * RLD, 0, tw) * edge, reed = Math.max(0, Math.min(1, (rlVN(T.re, u / 0.9, v / 4.5) * 0.6 + nz(4, gxx, gyy) - 0.1) * 2)) * (1 - rlSmooth(0.004 * RLD, 0.03 * RLD, -tw)) * C.reedK * edge;
            gl -= C.wetL * wet; ga -= 2 * wet; gl += (M.swamp.reed[0] - gl) * reed; ga += (M.swamp.reed[1] - ga) * reed; gb += (M.swamp.reed[2] - gb) * reed; }
          L = gl + (wL - gl) * wf; A = ga + (wA - ga) * wf; Bb = gb + (wB - gb) * wf; if (L > Lcap) L = Lcap;
        }
        rlLabTo(L, A, Bb, d, o4); d[o4 + 3] = 255; if (peaks) { rlLabTo(Lb, A, Bb, db, o4); db[o4 + 3] = 255; }
      }
      if ((j & 15) === 15) yield;
    }
    if (!peaks) { // a crisp shore like the map's ponds: a 2-texel band of the water 4 L* darker at the waterline and the bank 5 L* darker just outside it (not at the outline)
      const sh = new Int8Array(nw * nh); for (let j = 1; j < nh - 1; j++) for (let i = 1; i < nw - 1; i++) { const q = j * nw + i, wq = rk8[q] >= 128; let edge = 0; for (const p of [q - 1, q + 1, q - nw, q + nw, q - 2, q + 2, q - 2 * nw, q + 2 * nw]) if ((rk8[p] >= 128) !== wq) { edge = 1; break; } if (edge) sh[q] = wq ? 1 : -1; }
      for (let q = 0; q < nw * nh; q++) { if (!sh[q] || d[q * 4 + 3] < 255 || wd[q] < 0.006 * RLD) continue; const o = q * 4, c = rgb2lab([d[o], d[o + 1], d[o + 2]]); rlLabTo(c[0] - (sh[q] > 0 ? C.shoreW : C.shoreB), c[1], c[2], d, o); } }
    const cv = makeCanvas(nw, nh); cv.getContext('2d').putImageData(img, 0, 0); Object.assign(B, { cv, img, rk8 });
    // the bake's wild texels: the F x F means of the fine raster (sRGB means), and the Near detail's classes (rock none; the continued land its own class and canopy; open water none)
    const bt = []; for (let ty = Math.floor(Y0 / F); ty * F + F - 1 <= Y0 + nh - 1; ty++) { if (ty * F < Y0 || ty >= BH) continue;
      for (let tx = Math.floor(X0 / F); tx * F + F - 1 <= X0 + nw - 1; tx++) { if (tx * F < X0 || tx >= BW) continue; const k = ty * BW + tx; if (LT[k] !== 7 && LT[k] !== 8) continue; let r = 0, g = 0, b = 0, rr = 0, ss = 0;
        for (let b2 = 0; b2 < F; b2++) for (let a2 = 0; a2 < F; a2++) { const qq = (ty * F + b2 - Y0) * nw + tx * F + a2 - X0, o = qq * 4; r += db[o]; g += db[o + 1]; b += db[o + 2]; rr += rk8[qq]; ss += sn8[qq]; }
        const n = F * F, o = k * 4; d8[o] = Math.round(r / n); d8[o + 1] = Math.round(g / n); d8[o + 2] = Math.round(b / n); d8[o + 3] = 255; rr /= n * 255; out.mw.snow8[k] = Math.round(ss / n); out.mw.lf8[k] = Math.round(rr * 255); if (peaks) bt.push(k);
        const land = NC[k] !== 255 ? NC[k] : peaks ? 3 : 5; cls[k] = rr > 0.5 ? 255 : land; cm[k] = rr > 0.5 ? 0 : NM[k]; } } // no grain on the rock (its facets carry the detail)
    if (peaks && C.bakeK < 1 && bt.length) { // the bake's rock keeps bakeK of its 3 x 3 detail in L* (the fine raster, Near in, all of it); the land continued below the foot keeps all of its own, as the land does
      const Lb = new Map(); for (const k of bt) { const o = k * 4; Lb.set(k, rgb2lab([d8[o], d8[o + 1], d8[o + 2]])); }
      for (const k of bt) { const c = Lb.get(k), lk = out.mw.lf8[k] / 255; if (lk <= 0) continue; let s = 0, n = 0; for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const q = Lb.get(k + oy * BW + ox); if (q) { s += q[0]; n++; } } const m = s / n; rlLabTo(m + (c[0] - m) * (1 - (1 - C.bakeK) * lk), c[1], c[2], d8, k * 4); } }
    yield;
  }
}
// the wilds' fine raster on screen: where the bake is magnified (more than RL_MSD.tpp device px a fine texel would be shown by the bake), each wild's own canvas over the
// bake, clipped to its cells, fading in from tpp (none) to tpp0 (whole) so the crisper rock does not jump in at one zoom (pass 3b); from tpp out to tpp1, where the land itself
// is drawn from its half mip, the landform layer (p58z rlMsLandformCanvas: the bake's rock with the landform as alpha, so the land below the foot is the land's own mip), fading in
// from tpp2 (none: the calmer mip alone, as at the start view) to tpp1 (whole), so the step from the calm mip to the crisper layer is spread over zooms (it read 2.9 L* a notch)
const RL_MSD = { tpp: 1.0, tpp0: 0.72, tpp1: 1.8, tpp2: 2.2, n: 0, ms: 0, src: '' };
const rlMsSource = () => { if (!RB.ready || !RB.ms) return 'none'; const tpp = RB.TX / (cam.s * dpr); return tpp <= RL_MSD.tpp || RL_DBG.msFine === true ? 'fine' : tpp <= RL_MSD.tpp2 && rlMipLevel() !== 0 ? 'bake' : 'land'; }; // what the wilds are drawn from at this zoom (the edge decision reads the same)
const rlMsFineKAt = (s) => { if (!RB.ready || RL_DBG.msFine === true) return 1; const tpp = RB.TX / (s * dpr); return tpp > RL_MSD.tpp ? 0 : 1 - rlSmooth(RL_MSD.tpp0, RL_MSD.tpp, tpp); }, rlMsFineK = () => rlMsFineKAt(cam.s); // the fine raster's alpha over the bake (at a scale; the edge decision reads it at its rung)
const rlMsBakeKAt = (s) => (RB.ready ? 1 - rlSmooth(RL_MSD.tpp1, RL_MSD.tpp2, RB.TX / (s * dpr)) : 0); // the landform layer's alpha over the land's mip
function rlDrawMassifFine(g, alpha) {
  if (!RB.ready || !RB.ms || alpha <= 0 || rlShownLook() !== 'natural' || state.mode === 'terrain' || SKIP.has('massifFine')) return;
  const src = rlMsSource(); if (src === 'land' || src === 'none') return; const fine = src === 'fine', tpp = RB.TX / (cam.s * dpr), fk = fine ? rlMsFineK() : rlMsBakeKAt(cam.s); if (fk <= 0.001 || (!fine && !(RB.mw && RB.mw.lfCv))) return;
  const t0 = performance.now(), F = RL_MS.F, FT = RB.TX * F, clip = (w) => { g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip(); };
  g.save(); g.globalAlpha = alpha * fk; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = (fine ? tpp * F : tpp) > 1 ? 'high' : 'low';
  if (fine) for (const B of RB.ms.boxes) { if (!B.cv) continue; g.save(); clip(B.w); g.drawImage(B.cv, B.X0 / FT, B.Y0 / FT, B.nw / FT, B.nh / FT); g.restore(); }
  else for (const Q of RB.mw.lfCv) { g.save(); clip(Q.B.w); g.drawImage(Q.cv, Q.x0 / RB.TX, Q.y0 / RB.TX, (2 * Q.w) / RB.TX, (2 * Q.h) / RB.TX); g.restore(); } // the landform layer at the half mip's resolution (p58z)
  g.restore(); RL_MSD.n++; RL_MSD.ms = +(performance.now() - t0).toFixed(1); RL_MSD.src = src;
}
// graft 4 (art judge): zoomed out the range was the most contrasty object on the map (navy shade, white snow, 14 to 27% of core cells jumping 20 L*). The mips the start
// view and the least zoom draw (RL_MSM: mip1, mip2) take the rock's lightness toward its local mean (k), lift the deepest shade (floor) and hold the snow lower (knee): only
// zoomed out, and (pass 3b) only the rock, by its share of each mip texel, so the land continued below the foot stays the land outside. Also the landform's share at the
// quarter resolution (out.mw.lfQ), which the Far relief reads (p59c: the land below the foot is lit as the land is)
const RL_MSM = { rD: 0.05, rBig: 0.14, roomRef: 0.40, mip1: { k: 0.6, big: 0.15, floor: 12, knee: 66, kneeK: 0.5 }, mip2: { k: 0.6, big: 0.12, floor: 14, knee: 60, kneeK: 0.35 } }; // pass 3b: k 0.8 to 0.6 and 0.75 to 0.6 over a local mean of 0.05 D (was 0.035), the shade floor 13 to 12 and 15 to 14: the rock now reaches its foot, and the start view read 44 / 8 and 48 / 9 busy against the reference's 31 to 35 / 8 to 9; the big forms (the local mean against a wider one, rBig D) stand out by big, so the big lit and shaded faces keep their drama; pass 3b (the verifier's item 5): k scales with the range's room (its spine's median half-width over roomRef D, at most 1), so a narrow range packs no more detail per 6 px than a wide one (the Greyteeth, 0.36 D: k x 0.91; the Ashspine, 0.44 D: unchanged): the Greyteeth read 37.6 busy at the start view, now 35.6, with its rock's fine detail kept at 1.0 x the land's
function rlMsMips(out, R) {
  const { BW, BH, LT } = out, LF = out.mw.lf8; for (const B of out.ms.boxes) { const r = Array.from(B.G.r).filter((v) => v > 0).sort((a, b) => a - b); B.kRoom = r.length ? Math.min(1, r[r.length >> 1] / (RL_MSM.roomRef * RLD)) : 1; }
  for (const [cv, P, lv] of [[R.mip1, RL_MSM.mip1, 1], [R.mip2, RL_MSM.mip2, 2]]) {
    const w = cv.width, h = cv.height, f = BW / w, g = cv.getContext('2d'), img = g.getImageData(0, 0, w, h), d = img.data, Lp = new Float32Array(w * h), mk = new Float32Array(w * h), lab = new Float32Array(w * h * 3), lq = lv === 2 ? new Float32Array(w * h) : null, kr = new Float32Array(w * h);
    for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k++) { let sp = 0, sa = 0; for (let b = 0; b < f; b++) for (let a = 0; a < f; a++) { const kk = Math.min(BH - 1, y * f + b) * BW + Math.min(BW - 1, x * f + a); if (LT[kk] === 7) sp += LF[kk]; if (LT[kk] === 7 || LT[kk] === 8) sa += LF[kk]; }
      sp /= f * f * 255; if (lq) lq[k] = sa / (f * f * 255); const o = k * 4; if (sp < 0.004 || d[o + 3] < 255) continue; const c = rgb2lab([d[o], d[o + 1], d[o + 2]]); lab[k * 3] = c[0]; lab[k * 3 + 1] = c[1]; lab[k * 3 + 2] = c[2]; Lp[k] = c[0]; mk[k] = sp; const B = out.ms.boxOf.get(out.id[Math.min(BH - 1, y * f + (f >> 1)) * BW + Math.min(BW - 1, x * f + (f >> 1))]); kr[k] = B ? B.kRoom : 1; }
    const Lb = rlBoxBlur(Lp, w, h, Math.max(1, Math.round((RL_MSM.rD * RLD * out.TX) / f)), 2, mk), L2 = rlBoxBlur(Lp, w, h, Math.max(1, Math.round((RL_MSM.rBig * RLD * out.TX) / f)), 2, mk);
    for (let k = 0; k < w * h; k++) { if (!mk[k]) continue; let L = Lb[k] + (Lp[k] - Lb[k]) * P.k * kr[k] + (Lb[k] - L2[k]) * P.big; if (L < P.floor) L = P.floor - (P.floor - L) * 0.5; if (L > P.knee) L = P.knee + (L - P.knee) * P.kneeK; const s = Lp[k] > 1 ? 0.85 + 0.15 * Math.min(1, L / Lp[k]) : 1, wk = mk[k], s2 = 1 + (s - 1) * wk;
      rlLabTo(Lp[k] + (L - Lp[k]) * wk, lab[k * 3 + 1] * s2, lab[k * 3 + 2] * s2, d, k * 4); }
    g.putImageData(img, 0, 0); if (lq) out.mw.lfQ = lq;
  }
}

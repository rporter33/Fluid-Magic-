// ------------------------------------------------------------------ pass 3 prototype "Sculpted massif": the colour of the wilds' own raster, the bake's wild texels, the draw
// Colours in CIELAB D65. Rock: shade faces dark and cool, faces turned to the light lit and warm, the terminator on each ridgeline (the heights are made at F x the bake's
// resolution, so a crest is one texel wide up close); no rock texel over the passable mountains' brightest lit rock plus RL_NW.margin (pass 2's cap). Snow on the top crests
// may pass that cap (to RL_MSC.snowMax): this prototype's one rule change (reliefWildLook reports the snow's share and peak separately). Scree aprons at the massif's foot and
// in its gullies; the foothills are the land's ground (S3's blend: rlNatLandGround) with heath, the hills' shading, the massif's cast shadow and, where the land is forest, its
// crowns climbing to a treeline. The mere: a shallow shelf at the shore, the natural water at mid depth, a darker centre, faint ripples; reeds and wet ground on its fringe.
const RL_MSC = {
  rock: { Lsh: 15, Lmid: 31, gain: 2.6, castL: 9, aoL: 5, grain: 0.6 }, snow0: 0.6, snow1: 0.72, snowMax: 86, snowLit: [72, 14], snowShade: 22, snowShareMax: 0.08, rockOn: [0.0, 0.07],
  scree: [44, 1.5, 6], screeK: 0.75, treeK: 0.4, footCap: 8, footCast: 10, crownU: 2.3,
  water: { shelf: [47, -18, 7], deep: [25, -19, -7] }, wetL: 7, reedK: 0.55,
};
// the land's own surface carried onto the foothills and the mere's fringe with the land's own seeded tables (so its patterns run on across the outline): plains streaks and
// patches, swamp pools, reed beds and shrubs, wasteland drifts; pr: each terrain's presence (S3's weights), Q: the CIELAB colour, changed in place
function rlMsLandTex(Q, u, v, pr, T) {
  const M = RL_NAT.mat, cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x), mix = (c, f) => { if (f <= 0) return; Q[0] += f * (c[0] - Q[0]); Q[1] += f * (c[1] - Q[1]); Q[2] += f * (c[2] - Q[2]); };
  const pp = pr[0], ps = pr[5], pw = pr[6];
  if (pp > 0.02) { Q[0] += pp * 1.6 * rlVN(T.st, u / 14 + (0.6 * v) / 14, v / 3.2); mix(M.plains.light, pp * cl(rlFbm(T.mo, u / 11 + 40, v / 11, 2) - 0.2) * 0.6); mix(M.plains.dry, pp * cl(rlFbm(T.du, u / 18 + 70, v / 18, 2) - 0.3) * 0.8); }
  if (ps > 0.02) { const pool = cl((rlFbm(T.po, u / 9, v / 9, 3) - 0.4) / 0.08) * ps, reed = cl((rlVN(T.re, u / 0.9, v / 4.5) * 0.6 + rlFbm(T.re, u / 12 + 7, v / 12, 2) - 0.25) * 2) * ps * (1 - pool);
    mix(M.swamp.reed, reed * 0.7); mix(M.swamp.shrub, ps * (1 - pool) * 0.6 * rlRamp(rlVN(T.sc, u / 1.3 + 3, v / 1.3), 0.66, 0.84)); mix(M.swamp.pool, pool); }
  if (pw > 0.02) mix(M.wasteland.pale, pw * cl(rlFbm(T.du, u / 16 + 5, v / 16, 2)) * 0.42);
}
const rlMsPresence = (wch, QW, QH, x, y, pr) => { let s = 0; for (let t = 0; t < 7; t++) { pr[t] = rlBilin(wch[t], QW, QH, x, y); s += pr[t]; } for (let t = 0; t < 7; t++) { const q = (s > 1e-4 ? pr[t] / s : 0) - 0.35; pr[t] = q <= 0 ? 0 : q >= 0.3 ? 1 : q / 0.3; } return pr; };
function* rlMsColour(out, Lcap) {
  const { BW, BH, TX, LT, QW, QH, wch } = out, F = RL_MS.F, VS = RL_P.vScale * RLK, C = RL_MSC, Rk = C.rock, M = RL_NAT.mat, dxh = 1 / (TX * F), [lx, ly, lz] = RL_LIGHT;
  const T = { gr: rlNatT('massif:grain'), sn: rlNatT('massif:snow'), sc: rlNatT('massif:scree'), mo: rlNatT('mottle'), he: rlNatT('heath'), re: rlNatT('reed'), rp: rlNatT('massif:ripple'), st: rlNatT('streak'), du: rlNatT('dust'), po: rlNatT('pool'), sc: rlNatT('scrub') }, PR = new Float64Array(7), QL = [0, 0, 0];
  const W0 = rgb2lab(hex2rgb(RL_C.waterNat)), cls = out.mw ? out.mw.cls : new Uint8Array(BW * BH).fill(255); out.mw = { cls, snow8: new Uint8Array(BW * BH), snowTexels: 0, rockTexels: 0, snowOverCap: 0, snowLmax: 0 };
  const lab = [0, 0, 0], rgb = [0, 0, 0];
  for (const B of out.ms.boxes) {
    const { X0, Y0, nw, nh, h, hM, m, s01, wd, bx0, by0, bw, bh, cast, ao, G } = B, peaks = B.w.kind === 'peaks', img = new ImageData(nw, nh), d = img.data;
    const rk8 = new Uint8Array(nw * nh), sn8 = new Uint8Array(nw * nh); // the rock share (peaks) or the water share (mere), for the Near detail classes
    const gx0 = Math.floor(X0 / F) - 1, gy0 = Math.floor(Y0 / F) - 1, gw = Math.ceil(nw / F) + 3, gh = Math.ceil(nh / F) + 3, GL = new Float32Array(gw * gh), GA = new Float32Array(gw * gh), GB = new Float32Array(gw * gh); // the land's ground (S3's blend) at the bake's resolution
    const NZ = [0, 1, 2, 3, 4, 5].map(() => new Float32Array(gw * gh)); // the low-frequency noises at the bake's resolution: heath, mottle, scree, snow, the rock line's wander, the mere's shelf / reed beds
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { const c = rlNatLandGround(out, gx0 + x, gy0 + y, RL_NAT.mat.hills.ground), k = y * gw + x, u = (gx0 + x + 0.5) / TX / RLK, v = (gy0 + y + 0.5) / TX / RLK; GL[k] = c[0]; GA[k] = c[1]; GB[k] = c[2];
      NZ[1][k] = rlFbm(T.mo, u / 26, v / 26, 3); if (peaks) { NZ[0][k] = rlFbm(T.he, u / 9, v / 9, 3); NZ[2][k] = rlFbm(T.sc, u / 6, v / 6, 2); NZ[3][k] = rlFbm(T.sn, u / 4, v / 4, 2); NZ[4][k] = rlVN(T.gr, u / 2, v / 2); } else { NZ[0][k] = rlFbm(T.rp, u / 5, v / 5, 2); NZ[5][k] = rlFbm(T.re, u / 12 + 7, v / 12, 2); } }
    const nz = (z, a, b) => rlBilin(NZ[z], gw, gh, a, b);
    for (let j = 0; j < nh; j++) {
      const y = (Y0 + j + 0.5) / (TX * F), v = y / RLK, by = (Y0 + j + 0.5) / F - by0, gyy = (Y0 + j + 0.5) / F - gy0, rU = (j > 0 ? j - 1 : 0) * nw, rC = j * nw, rD = (j < nh - 1 ? j + 1 : j) * nw;
      for (let i = 0; i < nw; i++) {
        const q = j * nw + i; if (wd[q] < -RL_MS.outside) { d[q * 4 + 3] = 0; continue; } const x = (X0 + i + 0.5) / (TX * F), u = x / RLK, bxx = (X0 + i + 0.5) / F - bx0, gxx = (X0 + i + 0.5) / F - gx0, o4 = q * 4, iL = i > 0 ? i - 1 : 0, iR = i < nw - 1 ? i + 1 : i;
        const a0 = h[rU + iL], b0 = h[rU + i], c0 = h[rU + iR], d0 = h[rC + iL], f0 = h[rC + iR], g0 = h[rD + iL], i0 = h[rD + i], j0 = h[rD + iR];
        const dzdx = ((c0 + 2 * f0 + j0 - (a0 + 2 * d0 + g0)) * VS) / (8 * dxh), dzdy = ((g0 + 2 * i0 + j0 - (a0 + 2 * b0 + c0)) * VS) / (8 * dxh), nl = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
        const s = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / nl), cs = rlBilin(cast, bw, bh, bxx, by), av = rlBilin(ao, bw, bh, bxx, by), sv = rlTanh(Rk.gain * (s - RL_SIN_EL));
        let L = 0, A = 0, Bb = 0, gL = 0, gA = 0, gB = 0;
        if (peaks) {
          const rk = rlSmooth(C.rockOn[0], C.rockOn[1], m[q] * (0.45 + 0.55 * s01[q]) + 0.015 * nz(4, gxx, gyy)); rk8[q] = Math.round(rk * 255);
          if (rk < 0.999) {
            // the foothills: the land's ground with heath blotches, the hills' shading, the massif's cast shadow and the valleys
            const hb = nz(0, gxx, gyy), sh = Math.max(-1, Math.min(0.6, rlTanh(3.2 * (s - RL_SIN_EL))));
            gL = rlBilin(GL, gw, gh, gxx, gyy) + C.footCap * sh - C.footCast * cs - 4 * av + 2.2 * nz(1, gxx, gyy); gA = rlBilin(GA, gw, gh, gxx, gyy); gB = rlBilin(GB, gw, gh, gxx, gyy);
            const tf = 0.45 * Math.max(0, Math.min(1, hb * 1.4)); gL += (M.hills.turf[0] - gL) * tf * 0.5; gA += (M.hills.turf[1] - gA) * tf; gB += (M.hills.turf[2] - gB) * tf;
            rlMsPresence(wch, QW, QH, (x * TX) / 4, (y * TX) / 4, PR); QL[0] = gL; QL[1] = gA; QL[2] = gB; rlMsLandTex(QL, u, v, PR, T); gL = QL[0]; gA = QL[1]; gB = QL[2]; // the land's surface runs on
            // the land's forest climbing the foothills: crowns on a jittered grid (the natural canopy's recipe), thinning to a treeline as the ground rises toward the massif
            const wf = rlBilin(wch[2], QW, QH, (x * TX) / 4, (y * TX) / 4), tl = C.treeK * rlSmooth(0.2, 0.55, wf) * (1 - rlSmooth(0.0, 0.05, m[q])) * rlSmooth(0.03, 0.08, wd[q] / RLD) * (1 - rlSmooth(0.1, 0.2, wd[q] / RLD)); // a few trees up the foothills (the forest floor between them, so the clearing at the wood's edge parts it from the canopy outside)
            if (tl > 0.02) { const gu = u / C.crownU, gv = v / C.crownU, iu = Math.floor(gu), iv = Math.floor(gv); let best = 9, bdx = 0, bdy = 0, bi = 0, bj = 0;
              for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const hh2 = rlH2(iu + ox, iv + oy, 37), rr = 0.55 + 0.35 * rlH2c(hh2), ddx = (gu - (iu + ox + rlH2a(hh2))) / rr, ddy = (gv - (iv + oy + rlH2b(hh2))) / rr, dd = Math.sqrt(ddx * ddx + ddy * ddy); if (dd < best) { best = dd; bdx = ddx; bdy = ddy; bi = iu + ox; bj = iv + oy; } }
              if (best < 1 && rlH2c(rlH2(bi, bj, 53)) < tl) { const cr = Math.max(0, 1 - best * best), lit = -(bdx + bdy) * 0.7071, cv = rlRamp(1 - best, 0, 0.3), cL = M.forest.canopy[0] + 3.5 * cr + 5 * lit * Math.sqrt(cr) - 1 - 6 * cs;
                gL += (cL - gL) * cv; gA += (M.forest.canopy[1] - gA) * cv; gB += (M.forest.canopy[2] - gB) * cv; } }
          }
          let rL = 0, rA = 0, rB = 0, sn = 0;
          if (rk > 0.001) {
            // the rock: lit and shade faces, its own cast shadow (bluer) and valleys, a fine grain
            rL = (sv > 0 ? Rk.Lmid + sv * (Lcap - 1 - Rk.Lmid) : Rk.Lmid + sv * (Rk.Lmid - Rk.Lsh)) - Rk.castL * cs - Rk.aoL * av + Rk.grain * rlVN(T.gr, u / 0.7, v / 0.7); rA = 0.6 + 0.6 * sv; rB = (sv > 0 ? 2 + 3 * sv : 2 + 9 * sv) - 4 * cs;
            // scree: aprons at the massif's foot and in its gullies, warm grey, in the shading
            const ap = (1 - rlSmooth(0.03, 0.3, m[q])) * rlSmooth(0.1, 0.55, av + 0.35 * nz(2, gxx, gyy)) * C.screeK;
            if (ap > 0) { const sL = C.scree[0] + 6 * sv - 8 * cs + 2 * rlVN(T.gr, u / 0.9 + 9, v / 0.9); rL += (sL - rL) * ap; rA += (C.scree[1] - rA) * ap; rB += (C.scree[2] - rB) * ap; }
            if (rL > Lcap) rL = Lcap; out.mw.rockTexels++;
            // snow on the top crests (height share of the massif's highest), less on the steepest faces; lit snow white, shaded snow blue-grey
            const hr = hM[q] / B.hMax; sn = hr < C.snow0 - 0.08 ? 0 : rlSmooth(C.snow0, C.snow1, hr + 0.07 * nz(3, gxx, gyy)) * rlSmooth(0.18, 0.45, 1 / nl);
            if (sn > 0.01) { let nL = (sv > 0 ? C.snowLit[0] + C.snowLit[1] * sv : C.snowLit[0] + C.snowShade * sv) - 0.8 * Rk.castL * cs; if (nL > C.snowMax) nL = C.snowMax; const nB = -2 + (sv < 0 ? 7 * sv : 0) - 4 * cs;
              rL += (nL - rL) * sn; rA += (-0.8 - rA) * sn; rB += (nB - rB) * sn; }
          }
          L = gL + (rL - gL) * rk; A = gA + (rA - gA) * rk; Bb = gB + (rB - gB) * rk;
          { const lim = Lcap + (C.snowMax - Lcap) * Math.min(1, sn * rk); if (L > lim) L = lim; } /* over the cap only by the texel's snow share */ sn8[q] = Math.round(Math.min(1, sn * rk) * 255); if (sn > 0.5 && rk > 0.5) { out.mw.snowTexels++; if (L > Lcap) out.mw.snowOverCap++; if (L > out.mw.snowLmax) out.mw.snowLmax = L; }
        } else {
          // the mere: the shelf at the shore, the map's water at mid depth, a darker centre; the waterline antialiased on the fine raster
          const e = m[q], P = RL_MS.mere, W = C.water, wf = Math.max(0, Math.min(1, e / 0.006 + 0.5)); rk8[q] = Math.round(wf * 255); let wL = 0, wA = 0, wB = 0;
          if (wf > 0) { const shelf = 1 - rlSmooth(0, P.shelf, e + 0.025 * nz(0, gxx, gyy)), deep = rlSmooth(P.shelf, P.deep, e);
            wL = W0[0] + (W.deep[0] - W0[0]) * deep; wA = W0[1] + (W.deep[1] - W0[1]) * deep; wB = W0[2] + (W.deep[2] - W0[2]) * deep;
            wL += (W.shelf[0] - wL) * shelf; wA += (W.shelf[1] - wA) * shelf; wB += (W.shelf[2] - wB) * shelf; wL += (0.35 * rlVN(T.rp, u / 10, v / 2.2) + 0.9 * Math.max(0, rlVN(T.rp, u / 3 + 5, v / 0.7) - 0.3)) * deep; } // faint light ripples, not blotches
          if (wf < 1) { // the fringe: the land's ground, wetter and darker toward the shore, with reed beds near it
            const wet = 1 - rlSmooth(-0.09, 0, e), reed = Math.max(0, Math.min(1, (rlVN(T.re, u / 0.9, v / 4.5) * 0.6 + nz(5, gxx, gyy) - 0.1) * 2)) * (1 - rlSmooth(-0.16, -0.02, -e)) * C.reedK;
            gL = rlBilin(GL, gw, gh, gxx, gyy) - C.wetL * wet + 2.2 * nz(1, gxx, gyy) + 3 * Math.max(-1, Math.min(0.6, rlTanh(3.2 * (s - RL_SIN_EL)))); gA = rlBilin(GA, gw, gh, gxx, gyy) - 2 * wet; gB = rlBilin(GB, gw, gh, gxx, gyy);
            rlMsPresence(wch, QW, QH, (x * TX) / 4, (y * TX) / 4, PR); QL[0] = gL; QL[1] = gA; QL[2] = gB; rlMsLandTex(QL, u, v, PR, T); gL = QL[0]; gA = QL[1]; gB = QL[2]; // the land's surface runs on
            gL += (M.swamp.reed[0] - gL) * reed; gA += (M.swamp.reed[1] - gA) * reed; gB += (M.swamp.reed[2] - gB) * reed; }
          L = gL + (wL - gL) * wf; A = gA + (wA - gA) * wf; Bb = gB + (wB - gB) * wf; if (L > Lcap) L = Lcap;
        }
        rlLabTo(L, A, Bb, d, o4); d[o4 + 3] = 255;
      }
      if ((j & 15) === 15) yield;
    }
    const cv = makeCanvas(nw, nh); cv.getContext('2d').putImageData(img, 0, 0); Object.assign(B, { cv, img, rk8 });
    // the bake's wild texels: the F x F means of the fine raster (sRGB means), and the Near detail's classes (rock 4, heath 3, reed 5; open water none)
    const d8 = out.msImg.data;
    for (let ty = Math.floor(Y0 / F); ty * F + F - 1 <= Y0 + nh - 1; ty++) { if (ty * F < Y0 || ty >= BH) continue;
      for (let tx = Math.floor(X0 / F); tx * F + F - 1 <= X0 + nw - 1; tx++) { if (tx * F < X0 || tx >= BW) continue; const k = ty * BW + tx; if (LT[k] !== 7 && LT[k] !== 8) continue; let r = 0, g = 0, b = 0, rr = 0, ss = 0;
        for (let b2 = 0; b2 < F; b2++) for (let a2 = 0; a2 < F; a2++) { const qq = (ty * F + b2 - Y0) * nw + tx * F + a2 - X0, o = qq * 4; r += d[o]; g += d[o + 1]; b += d[o + 2]; rr += rk8[qq]; ss += sn8[qq]; }
        const n = F * F, o = k * 4; d8[o] = Math.round(r / n); d8[o + 1] = Math.round(g / n); d8[o + 2] = Math.round(b / n); d8[o + 3] = 255; rr /= n * 255; out.mw.snow8[k] = Math.round(ss / n);
        cls[k] = peaks ? (rr > 0.5 ? 4 : 3) : rr > 0.5 ? 255 : 5; } }
    yield;
  }
}
// the wilds' fine raster on screen: where the bake is magnified (more than RL_MSD.tpp device px a fine texel would be shown by the bake), each wild's own canvas over the
// bake, clipped to its cells; the Natural look only (Clear, the Terrain mode and the data modes keep theirs)
const RL_MSD = { tpp: 0.85, tpp1: 1.8, n: 0, ms: 0, src: '' }; // fine raster to tpp bake texels a device px; the bake's own full-resolution canvas to tpp1 (the land shows its half mip from 1.2)
function rlDrawMassifFine(g, alpha) {
  if (!RB.ready || !RB.ms || alpha <= 0 || rlShownLook() !== 'natural' || state.mode === 'terrain' || SKIP.has('massifFine')) return;
  const tpp = RB.TX / (cam.s * dpr), fine = tpp <= RL_MSD.tpp || RL_DBG.msFine === true, Lk = RB.L.natural; if (!fine && (tpp > RL_MSD.tpp1 || rlMipLevel() === 0 || !Lk)) return; // the land's own source is as sharp
  const t0 = performance.now(), F = RL_MS.F, FT = RB.TX * F;
  g.save(); g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = (fine ? tpp * F : tpp) > 1 ? 'high' : 'low';
  for (const B of RB.ms.boxes) { if (!B.cv) continue; g.save(); g.beginPath(); for (const c of B.w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    if (fine) g.drawImage(B.cv, B.X0 / FT, B.Y0 / FT, B.nw / FT, B.nh / FT); else { const sx = Math.floor(B.X0 / F), sy = Math.floor(B.Y0 / F), sw = Math.ceil(B.nw / F), sh = Math.ceil(B.nh / F); g.drawImage(Lk.canvas, sx, sy, sw, sh, sx / RB.TX, sy / RB.TX, sw / RB.TX, sh / RB.TX); }
    g.restore(); }
  g.restore(); RL_MSD.n++; RL_MSD.ms = +(performance.now() - t0).toFixed(1); RL_MSD.src = fine ? 'fine' : 'bake';
}

// ------------------------------------------------------------------ natural pass 3, prototype "open": the wilds as landforms that grow out of the land (Natural only;
// Clear and the Terrain mode keep the v4 massif and mere). What stays: a wild is impassable and its cells are its footprint (the hit test, the paths, the hover card
// "Impassable", the movement preview, and the dark contour drawn on the cells' outline, p59b). What this prototype changes (the rule "0 texels outside the wild's cells"):
// a range's foothills, relief and cast shadow may spill up to RL_NW.spill.D outside its cells, into neighbouring hills and mountains only, never onto farmland or fields,
// water, a seat (town or hamlet, its army slots and its label) or woods' crowns; snow, frost and crags stay inside the cells (V8).
// Peaks: one height field per range at twice the bake's resolution (crisp at Near): a mass rising from a foot that wanders with noise (outside the cells by the spill on
// spill edges, at the outline elsewhere), ridged crests along the range's axis in its core and spurs across it on its flanks, domain-warped; lit by the map's light at full
// resolution. Meres (p58x): a lake with a seeded natural shoreline inside the cells, a shallow shelf and a deep centre in the map's water hue.
// Seeded tables only (relief:<seed>:natural:wild:*), no Math.random and no Date.
const RL_NW = { // docs/09-balance "Map presentation" rows (prototype values); distances in D, noise sizes in mapgen units
  peaks: { ss: 2, base: 0.40, riseD: [0.30, 0.45], hA: 0.60, hR: 0.90, spur: 0.5, U: 22, oct: 4, warp: 0.7, st: [2.2, 2.8], coreA: [0.5, 0.9], zWarpD: 0.06, zWarpU: 22, footD: [0.02, 0.07], footU: 18, sdBlurD: 0.12,
    rock: [0.22, 0.42], rockN: 0.10, castD: 0.38, castSteps: 24, aoD: 0.05 },
  spill: { D: 0.20, n: 0.4, U: 26, terr: [3, 4], seatD: [0.22, 0.32], waterD: 0.035, blurD: 0.045, keep: [0.55, 0.95], rockMax: 0.55, mirD: [0.05, 0.16] },
  mere: { lobes: 0.20, lobeU: 30, bayU: 12, bay: 0.08, minD: [0.02, 0.10], minU: 15, edgeD: 0.07, openD: 0.30, shelfD: 0.07, deepD: 0.24, Lshelf: 43, Ldeep: 27, ashelf: -18, bshelf: -2.5, wetU: 2.4, wetL: 5, ripple: [0.07, 0.10], snags: 2, fringe: 0.4 },
  mat: { rockShade: [27, 1.5, 0], rockLit: [51, 1, 5], heath: [36, -4, 13], rubble: [44, 1, 5], frost: [56, -1, -5], marsh: [36, -8, 20], reed: [44, -2, 26] },
  Lmid: 38, Lshade: 26, floor: 37, floorNS: 37, lightLand: [36, 41], floorD: [0.05, 0.10], floorSD: [0.08, 0.15], gain: 2.0, margin: 2.5, frost: 0.45, castL: 7, aoL: 5, grain: 0.6, rockDetail: 2.4, relief: 1.8, heathRel: 9, spillRel: 9,
};
// the half-resolution rasters every consumer reads (out.nw): hX (the land's heights with the ranges' and the spill's), F (peaks: the mass; meres: the water factor), R (meres:
// the depth past the shore), cast and ao (on the ranges), shd (the land's cast shadow with the ranges' added). out.nwBox: per range, the 2x grid (heights H, mass A, signed
// distance SD and eligibility E at half resolution) the colour pass (p58x) reads; freed after it.
function* rlNatWildGen(out) {
  const { HW, HH, TX, hid, hh, shd, wdist, LT, BW } = out, D = RLD, P = RL_NW.peaks, SP = RL_NW.spill, VS = RL_P.vScale * RLK, T2 = TX / 2, NP = HW * HH;
  const hX = Float32Array.from(hh), F = new Float32Array(NP), R = new Float32Array(NP), cN = new Float32Array(NP), aN = new Float32Array(NP), shdN = Float32Array.from(shd), boxes = [];
  const TF = rlTable('natural:wild:foot'), TS = rlTable('natural:wild:spill'), TZ = rlTable('natural:wild:zwarp'), TR = rlGTable('natural:wild:ridge3'), TR2 = rlGTable('natural:wild:spur3');
  const W8 = out.water ? [...out.water.lakes, ...out.water.ponds] : [], ST = out.water ? out.water.streams : [], ftone = out.nat.ftone, M = Math.ceil(SP.D * (1 + SP.n) * D * T2) + 6;
  for (const w of WILDS) {
    const set = new Set(w.cells), peaks = w.kind === 'peaks'; let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
    const mg = peaks ? M : 2, x0 = Math.max(0, Math.floor(bb[0] * T2) - mg), y0 = Math.max(0, Math.floor(bb[1] * T2) - mg), x1 = Math.min(HW - 1, Math.ceil(bb[2] * T2) + mg), y1 = Math.min(HH - 1, Math.ceil(bb[3] * T2) + mg);
    const B = { w, set, x0, y0, x1, y1, bw: x1 - x0 + 1, bh: y1 - y0 + 1 }; boxes.push(B);
    if (!peaks) { // the mere: the water factor and the depth are made per texel by p58x (rlNatMereField); here the mere sits below the land as before
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = y * HW + x; if (!set.has(hid[k])) continue; const q = rlNatMereField(out, w, (x + 0.5) / T2, (y + 0.5) / T2); F[k] = q.wf; R[k] = q.dep; hX[k] = q.wf > 0.5 ? -0.05 : 0.40; }
      yield; continue;
    }
    // the signed distance (world units, + inside) and the spill's eligibility at half resolution, over the box
    const ol = rlWildOutline(w), bw = B.bw, bh = B.bh, SD = new Float32Array(bw * bh), E0 = new Float32Array(bw * bh), EM = new Float32Array(bw * bh), Dmax = M / T2;
    const nearB = (q) => q[0] < bb[2] + Dmax && q[2] > bb[0] - Dmax && q[1] < bb[3] + Dmax && q[3] > bb[1] - Dmax, W8b = W8.filter((L) => nearB(bboxOf(L.P))), STb = ST.filter((st) => nearB(bboxOf(st.pts)));
    const wet = (x, y) => W8b.some((L) => d3.polygonContains(L.P, [x, y])) || STb.some((st) => { for (let k = 0; k < st.pts.length - 1; k++) if (rlSegDist(x, y, st.pts[k][0], st.pts[k][1], st.pts[k + 1][0], st.pts[k + 1][1]) < st.w1 + SP.waterD * D) return true; return false; });
    for (let y = y0, q = 0; y <= y1; y++) for (let x = x0; x <= x1; x++, q++) {
      const k = y * HW + x, o = hid[k], px = (x + 0.5) / T2, py = (y + 0.5) / T2; if (o === 255) { SD[q] = -Dmax; continue; }
      if (set.has(o)) { SD[q] = wdist[k]; continue; }
      let d = Infinity; for (const e of ol) { const v = rlSegDist(px, py, e.a[0], e.a[1], e.b[0], e.b[1]); if (v < d) d = v; } SD[q] = -Math.min(d, Dmax); EM[q] = 1;
      if (d > Dmax || isWild(o) || !SP.terr.includes(RL_TI[terr[o]])) continue;
      const fk = (y * 2 + 1) * BW + x * 2 + 1; if (!SP.terr.includes(LT[fk]) || ftone[fk] || ftone[fk - 1] || ftone[fk + BW]) continue; // the warped lookup's farmland and every field texel
      const sd = Math.hypot(px - cent[o][0], (py - cent[o][1]) * 1.2) / D; if (sd < SP.seatD[0]) continue; // the seat, its army slots and its label
      if (wet(px, py)) continue; E0[q] = rlSmooth(SP.seatD[0], SP.seatD[1], sd);
    }
    // eligibility, smoothed over the land around (inside texels read their outside neighbours' value); kept above SP.keep only, so it fades out before any excluded texel
    const r = Math.max(1, Math.round(SP.blurD * D * T2)), Eb = rlBoxBlur(E0, bw, bh, r, 2, EM), E = new Float32Array(bw * bh); for (let q = 0; q < bw * bh; q++) E[q] = rlSmooth(SP.keep[0], SP.keep[1], Eb[q]);
    const Ein = rlBoxBlur(E, bw, bh, r * 3, 2, EM); for (let q = 0; q < bw * bh; q++) if (!EM[q] && SD[q] > -Dmax) E[q] = Ein[q]; // inside: the spill offset of the land beside it
    B.SD = SD; B.E = E; yield;
    // the 2x height grid: H = base + the range (its mass from the wandering foot, ridges and spurs); A, the mass
    const ss = P.ss * 2, gw = bw * ss, gh = bh * ss, H = new Float32Array(gw * gh), A = new Float32Array(gw * gh);
    let n = 0, mx = 0, my = 0, sxx = 0, syy = 0, sxy = 0; for (let q = 0; q < bw * bh; q++) if (SD[q] > 0) { const x = q % bw, y = (q / bw) | 0; n++; mx += x; my += y; sxx += x * x; syy += y * y; sxy += x * y; }
    mx /= n || 1; my /= n || 1; const ca = sxx / (n || 1) - mx * mx, cc = syy / (n || 1) - my * my, cb = sxy / (n || 1) - mx * my, lam = (ca + cc) / 2 + Math.sqrt(((ca - cc) / 2) ** 2 + cb * cb);
    let ax = Math.abs(cb) > 1e-6 ? cb : ca >= cc ? 1 : 0, ay = Math.abs(cb) > 1e-6 ? lam - ca : ca >= cc ? 0 : 1; const al = Math.sqrt(ax * ax + ay * ay) || 1; ax /= al; ay /= al; B.ax = ax; B.ay = ay;
    const SDb = rlBoxBlur(SD, bw, bh, Math.max(1, Math.round(P.sdBlurD * D * T2)), 2); // the inner distance with its medial crease rounded (the heights never draw the polygon's skeleton)
    for (let j = 0, q = 0; j < gh; j++) {
      const hy = (j + 0.5) / ss, wy = (y0 + hy) / T2, v = wy / RLK;
      for (let i = 0; i < gw; i++, q++) {
        const hx = (i + 0.5) / ss, wx = (x0 + hx) / T2, u = wx / RLK, sd0 = rlBilin(SD, bw, bh, hx, hy); if (sd0 <= -Dmax + 1) { H[q] = P.base; continue; }
        const e = rlBilin(E, bw, bh, hx, hy); if (sd0 <= 0 && e <= 0.001) { H[q] = P.base; continue; } // outside, away from any spill edge: the land
        const sd = sd0 > 0 ? Math.min(sd0, Math.max(0, rlBilin(SDb, bw, bh, hx, hy))) : sd0, S = SP.D * D * (1 - SP.n + SP.n * (0.5 + 0.5 * rlFbm(TS, u / SP.U, v / SP.U, 2))), zw = P.zWarpD * D * rlFbm(TZ, u / P.zWarpU, v / P.zWarpU, 3);
        const z = sd + e * (S + zw) + (1 - e) * Math.min(zw, 0); if (z <= 0) { H[q] = P.base; continue; }
        const fw = D * (P.footD[0] + (P.footD[1] - P.footD[0]) * (0.5 + 0.5 * rlFbm(TF, u / P.footU, v / P.footU, 2))), pr = D * (P.riseD[0] + (P.riseD[1] - P.riseD[0]) * e);
        const m = rlSmooth(0, pr, z), foot = rlSmooth(0, fw, z), core = rlSmooth(P.coreA[0], P.coreA[1], m), pa = u * ax + v * ay, qa = -u * ay + v * ax;
        const rA = core > 0.001 ? rlRidged(TR, pa / (P.U * P.st[1]), qa / P.U, P.oct, P.warp) : 0, rS = core < 0.999 ? rlRidged(TR2, pa / P.U, qa / (P.U * P.st[0]), P.oct, P.warp) : 0, r01 = 0.5 + 0.5 * (rS + (rA - rS) * core); // spurs on the flanks, crests along the core
        H[q] = P.base + foot * (P.hA * m + P.hR * (P.spur + (1 - P.spur) * m) * r01); A[q] = m;
      }
      if ((j & 63) === 63) yield;
    }
    B.ss = ss; B.gw = gw; B.gh = gh; B.H = H; B.A = A;
    // half resolution: the heights (inside the cells the range; in the spill the land's own plus the range's rise above its base), the mass
    for (let y = y0, q = 0; y <= y1; y++) for (let x = x0; x <= x1; x++, q++) {
      const k = y * HW + x; if (hid[k] === 255) continue; let s = 0, sa = 0; for (let dy = 0; dy < ss; dy++) for (let dx = 0; dx < ss; dx++) { const g = ((y - y0) * ss + dy) * gw + (x - x0) * ss + dx; s += H[g]; sa += A[g]; } s /= ss * ss; sa /= ss * ss;
      if (set.has(hid[k])) { hX[k] = s; F[k] = sa; } else if (s > P.base + 1e-4) { hX[k] = hh[k] + (s - P.base) * E[q]; F[k] = sa * E[q]; }
    }
    yield;
  }
  // cast shadows (toward the lower right, over the ranges and the land beyond them) and valleys at half resolution, on hX
  const dxw = 2 / TX, ext = Math.ceil(P.castD * D * T2), stepW = (P.castD * D) / P.castSteps, stepT = stepW / dxw, ra = Math.max(1, Math.round(P.aoD * D * T2));
  const Hh = (xx, yy) => { xx = xx < 0 ? 0 : xx >= HW ? HW - 1 : xx; yy = yy < 0 ? 0 : yy >= HH ? HH - 1 : yy; return hX[yy * HW + xx]; };
  for (const B of boxes) {
    if (B.w.kind !== 'peaks') continue; const { x0, y0, x1, y1 } = B;
    { const bw = x1 - x0 + 1 + 2 * ra, bh = y1 - y0 + 1 + 2 * ra, sub = new Float32Array(bw * bh); for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) sub[y * bw + x] = Hh(x0 - ra + x, y0 - ra + y);
      const hb = rlBoxBlur(sub, bw, bh, ra, 2); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = y * HW + x; if (F[k] > 0 || B.set.has(hid[k])) aN[k] = rlSmooth(0, 0.03 * D, (hb[(y - y0 + ra) * bw + x - x0 + ra] - hX[k]) * VS); } }
    yield;
    for (let y = y0; y <= Math.min(HH - 1, y1 + ext); y++) for (let x = x0; x <= Math.min(HW - 1, x1 + ext); x++) {
      const k = y * HW + x; if (hid[k] === 255 || RL_WILDK[hid[k]] === 8) continue; const z0 = hX[k] * VS; let occ = 0;
      for (let m = 1; m <= P.castSteps; m++) { const sx = x + 0.5 - 0.70710678 * stepT * m, sy = y + 0.5 - 0.70710678 * stepT * m; if (sx < 0 || sy < 0) break; const zs = rlBilin(hX, HW, HH, sx, sy) * VS - (z0 + stepW * m * RL_TAN_EL); if (zs > occ) occ = zs; }
      const cs = rlSmooth(0, 0.04 * D, occ); if (RL_WILDK[hid[k]]) cN[k] = cs; else if (cs > shdN[k]) shdN[k] = cs;
    }
    yield;
  }
  out.nw = { hX, F, R, cast: cN, ao: aN, shd: shdN }; out.nwBox = boxes;
}
// the land's ground blend at a texel (S3's weights, natural §3.1), so the foothills and the mere's fringe continue the land around them; fb where no land is near
function rlNatLandGround(out, tx, ty, fb) {
  const { QW, QH, wch } = out, qx = (tx + 0.5) / 4, qy = (ty + 0.5) / 4; let L = 0, a = 0, b = 0, ws = 0;
  for (let t = 0; t < 7; t++) { const wv = rlBilin(wch[t], QW, QH, qx, qy); if (wv > 0.002) { const G = RL_NAT.mat[RL_T[t]].ground; L += wv * G[0]; a += wv * G[1]; b += wv * G[2]; ws += wv; } }
  if (!ws) return fb; const k = Math.min(1, ws / 0.3); return [fb[0] + (L / ws - fb[0]) * k, fb[1] + (a / ws - fb[1]) * k, fb[2] + (b / ws - fb[2]) * k];
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


// ------------------------------------------------------------------ natural view: the covers (natural §3.1, §3.2), the rule-bearing raster of the natural look
// What each texel is drawn as (canopy, field, copse, or the cover blend's terrain), decided from the shared lookup and the seeded value tables only (N8):
// arithmetic, square roots, floors and table noise. No cosine, sine, exponential, logarithm, power or arctangent call appears in this part (a source scan guards it, §14).
// In the game this is a GPU pass; this CPU reference (half-resolution blend, 8-bit planes) serves the N4 and readability checks and the fallback (N11).
const RL_NAT = { // natural §2.2, §3, §4 (docs/09-balance "Map presentation" rows): materials in CIELAB D65, sizes in mapgen units (D = 90)
  mat: {
    plains: { ground: [43, -11, 33], light: [48, -14, 35], dry: [46, -5, 31] },
    farmland: { ground: [45, -9, 30], ripe: [51, 2, 31], straw: [52, 1, 25], green: [46, -12, 30], ploughed: [45, 5, 19], fallow: [48, -4, 25], hedge: [29, -12, 19] }, // AD fix 8: crop tones in L* 45 to 52 (v4: 43 to 56); hue still separates them
    forest: { ground: [28, -11, 21], canopy: [19, -15, 21], conifer: [16, -11, 13] },
    hills: { ground: [35, 3, 21], turf: [40, -8, 27], bracken: [37, 7, 24], rock: [50, 1, 6] },
    mountains: { ground: [42, 1, -5], scree: [49, 1, -2], turf: [35, -7, 17] },
    swamp: { ground: [34, -8, 22], pool: [25, -8, 2], reed: [42, -4, 29], shrub: [24, -11, 16] },
    wasteland: { ground: [54, 4, 17], crack: [45, 4, 13], scrub: [36, -5, 15], pale: [59, 3, 14] },
  },
  cap: [6, 4, 7, 10.5, 11, 3, 8], lit: 0.6, castL: 6, valleyL: 4, mottle: 2.2, // the natural relief caps (§3.3), in RL_T order; AD fix 2: mountains 18 -> 11 (the ranges read as crumpled foil), hills 13 -> 10.5 (the critique's 9 left three unexplored hills read as plains, 0.95 by province, at the floor; 10.5 reads 0.967) and mountains stay the strongest
  sigG: 0.12, sigC: 0.04, sigF: 0.07, sigA: 0.06, pres0: 0.35, presW: 0.3, // the ground blend is S3's (0.12 D); the cover blend 0.04 D at half resolution
  canopy: { edgeU: 10, edgeK: 0.42, thr: 0.52, gladeW: 0.85, gladeU: 9, gladeN: -0.62, copseU: 15, copseN: 0.80, copseW: 0.6, treeN: 0.55, treeSeam: 0.6, feather: 0.08, gladeK: 0.5, copseK: 0.5, treeK: 0.25 }, // AD fix 4: feather, the canopy score margin over which wood edges thin into single crowns (presentation only; cls is unchanged)
  field: { rowH: 8.5, bend: 0.5, bendU: 28, depthJ: 1.2, depthU: 24, lenMin: 13, lenSpan: 19, wCentre: 0.6, wCover: 0.4, wRand: 0.36, thr: 0.5, hedgeU: 0.3, hedgeA: 0.5, hedgeGap: 0.12, seamShare: 0.45, furrow: 1.25, furrowL: 1.0, seamMix: 0.4, jitter: 0.06 }, // AD fix 8: rows bend 0.5 (v4 1.6) and their depth wanders 1.2 units over 24 (2.5 over 9: the seams waved in step), furrows +-1.0 L* (1.6); hedges antialiased (fix 4)
  crown: 2.3, shadowU: 1.2, shadowL: 9, damp: 0.7, mtnSoft: { r: 2, k: 0.65, micro: 1.3 }, // pass 2 (verifier: mountain cores borderline busy): the mountains' shading softened toward a 2-texel blur by 0.65, micro-relief +-1.3 L* (2.0)
  tones: ['ripe', 'straw', 'green', 'ploughed', 'fallow', 'ripe', 'green', 'fallow'],
};
// the integer hash of two lattice coordinates and a salt (32-bit): bits 0-9, 10-19 and 20-29 give three values in [0, 1]
const rlH2 = (ix, iy, salt) => { let h = (Math.imul(ix | 0, 374761393) + Math.imul(iy | 0, 668265263) + Math.imul(salt, -2048144777)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; };
const rlH2a = (h) => (h & 1023) / 1023, rlH2b = (h) => ((h >>> 10) & 1023) / 1023, rlH2c = (h) => ((h >>> 20) & 1023) / 1023;
// each province's field frame: 0, 90 or +-30 degrees (never 45, the reserved hatch) by exact constants, then a seeded jitter j (|j| <= 0.06, about 3.4 degrees) as the
// small rotation (1, j) / sqrt(1 + j^2): [cos, sin] with no trigonometry (N8)
const RL_FRAMES = (() => { const base = [[1, 0], [0, 1], [Math.sqrt(3) / 2, 0.5], [Math.sqrt(3) / 2, -0.5]], out = new Float64Array(N * 2);
  for (let i = 0; i < N; i++) { const R = rngFor(`relief:${MAP_SEED}:natural:parcel:${i}`), [c0, s0] = base[Math.floor(R() * 4)], j = (R() - 0.5) * 2 * RL_NAT.field.jitter, n = Math.sqrt(1 + j * j), cj = 1 / n, sj = j / n;
    out[i * 2] = c0 * cj - s0 * sj; out[i * 2 + 1] = s0 * cj + c0 * sj; }
  return out; })();
const rlNatT = (k) => rlTable('natural:' + k); // N8: relief:<seed>:natural:<purpose>
// the parcel a point (mapgen units) falls in, in its province's frame: fills F with the row and column seams, the parcel's id value and centre, the furrow phase
function rlParcel(i, u, v, F) {
  const P = RL_NAT.field, ca = RL_FRAMES[i * 2], sa = RL_FRAMES[i * 2 + 1], T = (RL_NATTF ??= rlNatT('field'));
  const pu = u * ca + v * sa; let pv = -u * sa + v * ca;
  pv += P.bend * rlVN(T, pu / P.bendU + 90, pv / P.bendU); pv += P.depthJ * rlVN(T, pu / P.depthU + 17, pv / 61); // rows bend a little; uneven row depths
  const row = Math.floor(pv / P.rowH), fv = pv / P.rowH - row, hr = rlH2c(rlH2(row, 3, 41)), hp = rlH2c(rlH2(row, 5, 43)), Lp = P.lenMin + P.lenSpan * hr;
  const uu = (pu + hp * 40) / Lp, col = Math.floor(uu), fu = uu - col, bid = rlH2c(rlH2(row, col, 47));
  const sv = Math.min(fv, 1 - fv) * P.rowH, su = Math.min(fu, 1 - fu) * Lp, cu = (col + 0.5) * Lp - hp * 40, cv = (row + 0.5) * P.rowH;
  F.seam = Math.min(sv, su); F.rowSeam = sv < su; F.row = row; F.bid = bid; F.cx = cu * ca - cv * sa; F.cy = cu * sa + cv * ca; // the parcel's centre back in map units
  const ph = pv / P.furrow + bid * 3.1830989; F.phase = ph - Math.floor(ph); // furrows 1.25 units apart along the strip (the colour pass draws them)
}
let RL_NATTF = null;
// the covers: writes out.nat = { cls, ftone, fhedge, fph, cmar, fseam, wc8, wF8, wA8 } (cls: 0-6 the blend's terrain, 1 a field, 2 forest canopy, 9 a copse, 10 a hedge tree, 255 off the land)
function* rlNatCoverGen(out, lap) {
  const { BW, BH, TX, HW, HH, LT, LP } = out, NP = BW * BH, HN = HW * HH, NAT = RL_NAT, CP = NAT.canopy, FP = NAT.field;
  const rad = (sD) => { const s = (sD * RLD * TX) / 2; return Math.max(1, Math.round((Math.sqrt((12 * s * s) / 3 + 1) - 1) / 2)); }; // three box passes, sigma in half-res texels
  const OH = [...Array(7)].map(() => new Float32Array(HN)); // the warped one-hot at half resolution (2 x 2 box), all seven in one pass
  for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) { const a = (y * 2) * BW + x * 2; for (const q of [LT[a], LT[a + 1], LT[a + BW], LT[a + BW + 1]]) if (q < 7) OH[q][k] += 0.25; }
  const onehot = (t) => OH[t];
  const q8 = (P, s) => { const o = new Uint8Array(HN); for (let k = 0; k < HN; k++) { const v = P[k] * s; o[k] = v >= 1 ? 255 : v <= 0 ? 0 : Math.round(v * 255); } return o; };
  const wf = []; for (let t = 0; t < 7; t++) { wf.push(rlBoxBlur(onehot(t), HW, HH, rad(NAT.sigC), 3)); if (t % 2) yield; }
  const sum = new Float32Array(HN); for (let t = 0; t < 7; t++) { const P = wf[t]; for (let k = 0; k < HN; k++) sum[k] += P[k]; }
  const wc8 = wf.map((P) => { const o = new Uint8Array(HN); for (let k = 0; k < HN; k++) { const s = sum[k]; o[k] = s > 1e-4 ? Math.round((255 * P[k]) / s) : 0; } return o; });
  wf.length = 0; const wF8 = q8(rlBoxBlur(onehot(2), HW, HH, rad(NAT.sigF), 3), 1), wA8 = q8(rlBoxBlur(onehot(1), HW, HH, rad(NAT.sigA), 3), 1); yield; lap('coverBlend');
  const cls = new Uint8Array(NP).fill(255), ftone = new Uint8Array(NP), fhedge = new Uint8Array(NP), fph = new Uint8Array(NP), F = {}, w = new Float64Array(7);
  // AD fix 4 (presentation only; cls above is the rule-bearing raster): cmar, the canopy score margin as 8 bits (0: no crown, 255: full canopy, the class edge at 127.5), and
  // fseam, a field texel's distance to its parcel's seam in 1/64 texel, so wood edges thin into single crowns and parcel and hedge edges are antialiased
  const cmar = new Uint8Array(NP), fseam = new Uint8Array(NP), texU = 1 / (TX * RLK), mq = (m) => { const q = 127.5 + (255 * m) / CP.feather; return q >= 255 ? 255 : q <= 0 ? 0 : Math.round(q); };
  const Te = rlNatT('edge'), Tg = rlNatT('glade'), Tc = rlNatT('copse'), Tt = rlNatT('tree'), Tf = rlNatT('field');
  const KU = 1 / RLK, MC = out.msCov, MN = out.msNb, CLm = RL_MS.climb; let nField = 0, nCanopy = 0; // pass 3 (graft 2): the wilds' texels within reach take the land's own covers, continued (MC: 1 + the climb x 254)
  for (let ty = 0, k = 0; ty < BH; ty++) {
    let hy = (ty + 0.5) / 2 - 0.5; if (hy < 0) hy = 0; if (hy > HH - 1) hy = HH - 1; const iy = hy | 0, fy = hy - iy, iy1 = iy + 1 < HH ? iy + 1 : iy, r0 = iy * HW, r1 = iy1 * HW, v = ((ty + 0.5) / TX) * KU;
    for (let tx = 0; tx < BW; tx++, k++) {
      const wl = LT[k] >= 7; if (wl && !(MC && MC[k])) continue; const clm = wl ? (MC[k] - 1) / 254 : 0; // the continued land thins as it climbs: woods to a treeline, fields stop
      let hx = (tx + 0.5) / 2 - 0.5; if (hx < 0) hx = 0; if (hx > HW - 1) hx = HW - 1; const ix = hx | 0, fx = hx - ix, ix1 = ix + 1 < HW ? ix + 1 : ix;
      const a00 = r0 + ix, a01 = r0 + ix1, a10 = r1 + ix, a11 = r1 + ix1, w00 = (1 - fx) * (1 - fy) / 255, w01 = fx * (1 - fy) / 255, w10 = (1 - fx) * fy / 255, w11 = fx * fy / 255;
      for (let t = 0; t < 7; t++) { const P = wc8[t]; w[t] = P[a00] * w00 + P[a01] * w01 + P[a10] * w10 + P[a11] * w11; }
      const u = ((tx + 0.5) / TX) * KU, wFv = wF8[a00] * w00 + wF8[a01] * w01 + wF8[a10] * w10 + wF8[a11] * w11, wAv = wA8[a00] * w00 + wA8[a01] * w01 + wA8[a10] * w10 + wA8[a11] * w11;
      // fields (§3.2.2): strip parcels in the province's frame; a parcel is a field when 0.6 w_A(0.06 D) at its centre + 0.4 w_A(cover) + 0.36 (h - 0.5) > 0.5
      let field = false, hedgeT = false, mg = -1;
      if (wAv > 0.004 || w[1] > 0) {
        rlParcel(wl ? MN[k] : LP[k], u, v, F); // a wild texel continues its nearest neighbour's parcels
        let cx = Math.floor((F.cx * RLK * TX) / 2), cy = Math.floor((F.cy * RLK * TX) / 2); cx = cx < 0 ? 0 : cx >= HW ? HW - 1 : cx; cy = cy < 0 ? 0 : cy >= HH ? HH - 1 : cy;
        const h = F.bid * 7.31 - Math.floor(F.bid * 7.31), wA = FP.wCentre * (wA8[cy * HW + cx] / 255) + FP.wCover * w[1] - CLm.field * clm;
        if (wA + FP.wRand * (h - 0.5) > FP.thr) {
          field = true; if (!wl) nField++; ftone[k] = 1 + (Math.floor(F.bid * 8) % 8); fph[k] = Math.floor(F.phase * 256) & 255;
          const rs = F.row * 0.618 - Math.floor(F.row * 0.618), onSeam = F.rowSeam ? rs < FP.seamShare : true; // about half the row seams carry a hedge; every parcel end does
          const hc = 0.5 + (FP.hedgeU - F.seam) / texU, hg = (rlVN(Tf, u / 6 + 50, v / 6) + 0.35) / FP.hedgeGap; // AD fix 4: a 1-texel antialiased hedge, its gaps ramped
          const hd = (hc >= 1 ? 1 : hc <= 0 ? 0 : hc) * (onSeam ? 1 : 0) * (hg >= 1 ? 1 : hg <= 0 ? 0 : hg); fhedge[k] = Math.round(hd * 255);
          const st = (F.seam / texU) * 64; fseam[k] = st >= 255 ? 255 : Math.floor(st);
          const tn = rlVN(Tt, u, v); hedgeT = F.seam < CP.treeSeam && tn > CP.treeN; mg = Math.max(mg, Math.min(tn - CP.treeN, CP.treeK * (CP.treeSeam - F.seam))); // trees along the hedges
        }
      }
      // canopy (§3.2.1): forest masses with ragged edges that cross borders, glades inside, copses on open land, hedge trees
      let forest = false, copse = false, mf = -1; const fb = 0.5 * wFv + 0.5 * w[2] - CLm.wood * clm;
      if (fb > CP.thr - CP.edgeK) { const sc = fb + CP.edgeK * rlFbm(Te, u / CP.edgeU, v / CP.edgeU, 3); forest = sc > CP.thr; mf = sc - CP.thr; }
      if (w[2] > CP.gladeW) { const gl = rlFbm(Tg, u / CP.gladeU, v / CP.gladeU, 2); if (forest && gl < CP.gladeN) forest = false; mf = Math.min(mf, CP.gladeK * (gl - CP.gladeN)); } // the glade's edge feathers too
      mg = Math.max(mg, mf);
      if (!forest && !field && w[0] + w[3] - CLm.copse * clm > CP.copseW) { const cf = rlFbm(Tc, u / CP.copseU, v / CP.copseU, 3); copse = cf > CP.copseN; mg = Math.max(mg, CP.copseK * (cf - CP.copseN)); }
      if (forest) cls[k] = 2; else if (copse) cls[k] = 9; else if (hedgeT) cls[k] = 10; else if (field) cls[k] = 1;
      else { let bt = 0, bv = -1; for (let t = 0; t < 7; t++) if (t !== 1 && w[t] > bv) { bv = w[t]; bt = t; } cls[k] = bt; // the cover blend's terrain; farmland shows only as fields
        let wo = 0; for (let t = 0; t < 7; t++) if (t !== 1 && t !== 2 && w[t] > wo) wo = w[t]; mg = Math.max(mg, w[2] - wo); } // a forest-led blend is drawn as canopy (class 2, as in v4): its edge feathers on the blend's own margin
      cmar[k] = mq(mg);
      if (!wl && (forest || copse || hedgeT)) nCanopy++;
    }
    if ((ty & 63) === 63) yield;
  }
  out.nat = { cls, ftone, fhedge, fph, cmar, fseam, wc8, wF8, wA8, nField, nCanopy }; lap('covers');
}

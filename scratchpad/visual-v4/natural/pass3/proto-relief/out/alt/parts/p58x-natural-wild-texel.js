// ------------------------------------------------------------------ pass 3 prototype "Continuous relief": the natural wilds' colour (after the land's pixel pass, p58m)
// The land the foothills and the mere's fringe continue: a masked blur of the baked land colour (quarter resolution, RL_NW.land.r1D, a wider r2D where the near blur has
// no land), premultiplied so a bilinear read never pulls toward zero
function rlNatLandField(out, d8) {
  const { QW, QH, BW, LT, TX } = out, NQ = QW * QH, Lq = new Float32Array(NQ), Aq = new Float32Array(NQ), Bq = new Float32Array(NQ), mk = new Float32Array(NQ);
  for (let y = 0, k = 0; y < QH; y++) for (let x = 0; x < QW; x++, k++) { const fk = (y * 4 + 2) * BW + x * 4 + 2, o = fk * 4; if (LT[fk] >= 7 || d8[o + 3] < 255) continue; const lab = rgb2lab([d8[o], d8[o + 1], d8[o + 2]]); Lq[k] = lab[0]; Aq[k] = lab[1]; Bq[k] = lab[2]; mk[k] = 1; }
  const lvl = (rD) => { const r = Math.max(1, Math.round((rD * RLD * TX) / 4)), w = rlBoxBlur(mk, QW, QH, r, 3), P = [Lq, Aq, Bq].map((c) => { const b = rlBoxBlur(c, QW, QH, r, 3, mk); for (let k = 0; k < NQ; k++) b[k] *= w[k]; return b; }); return { w, P }; };
  return [lvl(RL_NW.land.r1D), lvl(RL_NW.land.r2D)];
}
function rlNatLandAt(out, x, y, o3) { // the blurred land colour at a world point (CIELAB into o3)
  const { QW, QH, TX } = out, qx = (x * TX) / 4, qy = (y * TX) / 4, [A, B] = out.nwLand, w1 = rlBilin(A.w, QW, QH, qx, qy), w2 = Math.max(1e-6, rlBilin(B.w, QW, QH, qx, qy)), t = rlSmooth(0, 0.08, w1);
  for (let c = 0; c < 3; c++) { const v2 = rlBilin(B.P[c], QW, QH, qx, qy) / w2, v1 = w1 > 1e-6 ? rlBilin(A.P[c], QW, QH, qx, qy) / w1 : v2; o3[c] = v2 + (v1 - v2) * t; }
  return o3;
}
function rlNatMirrorK(out, hx, hy, x, y) { // the land texel mirrored across the wild's outline (2 px past it): its bake index, or -1 where it is not land
  const { HW, HH, TX, BW, BH, LT, wdist } = out, gx = rlBilin(wdist, HW, HH, hx + 1, hy) - rlBilin(wdist, HW, HH, hx - 1, hy), gy = rlBilin(wdist, HW, HH, hx, hy + 1) - rlBilin(wdist, HW, HH, hx, hy - 1), gl = Math.sqrt(gx * gx + gy * gy);
  if (gl < 1e-6) return -1; const d = rlBilin(wdist, HW, HH, hx, hy) + 2 / TX, mx = x - (2 * d * gx) / gl, my = y - (2 * d * gy) / gl, tx = Math.floor(mx * TX), ty = Math.floor(my * TX);
  if (tx < 0 || ty < 0 || tx >= BW || ty >= BH) return -1; const k = ty * BW + tx; return LT[k] >= 7 ? -1 : k;
}
function rlNatMirror(out, hx, hy, x, y, d8) { const k = rlNatMirrorK(out, hx, hy, x, y); if (k < 0) return null; const o = k * 4; return d8[o + 3] === 255 ? rgb2lab([d8[o], d8[o + 1], d8[o + 2]]) : null; } // as CIELAB; null where it is not land
// the Near detail's grain class for a wild texel (p59c reads it where cls is 255): the continued land's own class and canopy coverage where the land is mirrored, heath on
// the foothills beyond, reeds on the mere's fringe; none on rock and open water (the range's own relief carries its detail; water stays smooth)
function rlNatWildNear(out, k, x, y, d, rock, water, fadeD, dflt) {
  const N = out.nw; if (!N.ndC) { N.ndC = new Uint8Array(out.BW * out.BH).fill(255); N.ndA = new Uint8Array(out.BW * out.BH); } if (rock > 0.5 || water > 0.5) return;
  if (d < fadeD) { const m = rlNatMirrorK(out, (x * out.TX) / 2, (y * out.TX) / 2, x, y); if (m >= 0 && out.nat.cls[m] !== 255) { N.ndC[k] = out.nat.cls[m]; N.ndA[k] = out.nat.cmar[m]; return; } }
  N.ndC[k] = dflt;
}
let RL_NWT = null; const RL_G3 = [0, 0, 0];
const rlNWTables = () => (RL_NWT ??= { n: rlNatT('wild:grain'), re: rlNatT('reed'), sn: rlNatT('wild:snow') });
// the range's colour at one of its K x texels (CIELAB into o3): rock shade to lit by the light, darker in its cast shadow, scree on the valley floors, snow on the highest
// crests; the foothills the land's own colour (mirrored across the outline near it, blurred beyond), darkening to heath as they climb, lit by the rising relief
function rlNatRangeLab(out, B, q2, x, y, d8, o3) {
  const T = rlNWTables(), u = x / RLK, v = y / RLK, K = B.K, X1 = (q2 % B.bw2 + 0.5) / K, Y1 = (Math.floor(q2 / B.bw2) + 0.5) / K, RK = RL_NW.rock, SN = RL_NW.snow, FT = RL_NW.foot;
  const s = B.s2[q2], e = B.E2[q2], ri = B.R2[q2], d = B.dW2[q2], sl = B.sl2[q2], c = rlBilin(B.cast, B.bw, B.bh, X1, Y1), va = rlBilin(B.val, B.bw, B.bh, X1, Y1);
  const lit = rlSmooth(RK.lit[0], RK.lit[1], s); let rL = RK.Lsh + (RK.Llit - RK.Lsh) * lit - RK.castR * c * (0.3 + 0.7 * lit), rA = RK.shadeAB[0] + (RK.litAB[0] - RK.shadeAB[0]) * lit, rB = RK.shadeAB[1] + (RK.litAB[1] - RK.shadeAB[1]) * lit;
  const sc = RK.screeK * va; rL += (RK.scree[0] + 8 * lit - rL) * sc; rA += (RK.scree[1] - rA) * sc; rB += (RK.scree[2] - rB) * sc;
  const hn = e / B.eHi + 0.05 * rlVN(T.sn, u / 2.5, v / 2.5), sw = SN.k * rlSmooth(SN.h, SN.h + SN.w, hn) * rlSmooth(SN.crest[0], SN.crest[1], ri) * (SN.shadeK + (1 - SN.shadeK) * rlSmooth(SN.litMin[0], SN.litMin[1], s));
  if (sw > 0) { const sL = SN.shade[0] + (SN.lit[0] - SN.shade[0]) * lit * (1 - 0.5 * c); rL += (sL - rL) * sw; rA += (SN.lit[1] - rA) * sw; rB += (SN.shade[2] + (SN.lit[2] - SN.shade[2]) * lit - rB) * sw; }
  const rk = rlSmooth(RK.e[0], RK.e[1], e + RK.kR * (ri - 0.5) + RK.kS * rlSmooth(1.4, 3, sl) + RK.eN * (rlVN(T.n, u / 1.1, v / 1.1) + 0.6 * rlVN(T.n, u / 3 + 17, v / 3))); // rock: crests and steep faces first
  if (B.RK2) B.RK2[q2] = rk; if (rk >= 0.999) { o3[0] = rL; o3[1] = rA; o3[2] = rB; return o3; } // all rock: the foothill colour is not needed
  const G = rlNatLandAt(out, x, y, RL_G3); let fL = G[0], fA = G[1], fB = G[2]; const fade = 1 - rlSmooth(FT.mirrorD[0] * RLD, FT.mirrorD[1] * RLD, d);
  if (fade > 0.01) { const mc = rlNatMirror(out, (x * out.TX) / 2, (y * out.TX) / 2, x, y, d8); if (mc) { fL += (mc[0] - fL) * fade; fA += (mc[1] - fA) * fade; fB += (mc[2] - fB) * fade; } }
  const sh = Math.max(-1, Math.min(0.7, rlTanh(3.2 * (s - RL_SIN_EL)))), fk = FT.k0 + (FT.k1 - FT.k0) * rlSmooth(FT.e[0], FT.e[1], e), ek = rlSmooth(FT.edgeD[0] * RLD, FT.edgeD[1] * RLD, d); fL += ek * (fk * sh - FT.castF * c);
  { const hk = RK.heathK * rlSmooth(0.05, 0.2, e); fL += (RK.heath[0] - fL) * hk; fA += (RK.heath[1] - fA) * hk; fB += (RK.heath[2] - fB) * hk; } // the land darkens to heath and scrub as it climbs
  o3[0] = fL + (rL - fL) * rk; o3[1] = fA + (rA - fA) * rk; o3[2] = fB + (rB - fB) * rk; return o3;
}
// the ranges' colour at K x (after the land's pixel pass): Lab planes (the bake's texel is their mean, so the bake is supersampled) and a canvas drawn at Near (rlNatRangeNear)
function* rlNatRangeColour(out, d8, Lcap) {
  const o3 = [0, 0, 0];
  for (const B of out.nw.boxes) {
    B.RK2 = new Float32Array(B.bw2 * B.bh2); const { K, bw2, bh2, x0, y0, in2 } = B, TK = out.TX * K, N2 = bw2 * bh2, Lp = new Float32Array(N2), Ap = new Float32Array(N2), Bp = new Float32Array(N2), img = new ImageData(bw2, bh2), dd = img.data;
    for (let y = 0, q = 0; y < bh2; y++) { const wy = (y0 * K + y + 0.5) / TK; for (let x = 0; x < bw2; x++, q++) { if (!in2[q]) continue; const wx = (x0 * K + x + 0.5) / TK; rlNatRangeLab(out, B, q, wx, wy, d8, o3); if (o3[0] > Lcap) o3[0] = Lcap; Lp[q] = o3[0]; Ap[q] = o3[1]; Bp[q] = o3[2]; rlLabTo(o3[0], o3[1], o3[2], dd, q * 4); dd[q * 4 + 3] = 255; }
      if ((y & 63) === 63) yield; }
    const cv = makeCanvas(bw2, bh2); cv.getContext('2d').putImageData(img, 0, 0); Object.assign(B, { Lp, Ap, Bp, cv2: cv }); B.H2 = null;
  }
}
function rlNatRangeNear(g, a) { // Near: the ranges at K x over the bake (the same colours, averaged in the bake), once a bake texel is RL_NW.peaks.nearTpp CSS px or more
  if (!RB.nw || !RB.nw.boxes || a <= 0 || cam.s * RB.TX < RL_NW.peaks.nearTpp || SKIP.has('rangeNear')) return; const TX = RB.TX;
  g.save(); modelPath(g); g.clip(); g.globalAlpha = a; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low';
  for (const B of RB.nw.boxes) if (B.cv2) g.drawImage(B.cv2, B.x0 / TX, B.y0 / TX, B.bw / TX, B.bh / TX);
  g.restore();
}
// the neighbours' fog runs into the wild's continued land: along each outline edge whose passable neighbour is unexplored or out of sight, its haze and desaturation
// are drawn inside the wild in a strip fading over RL_NW.fogD (the bake's wild texels are never fogged, so the land continued inside them stood out, brighter and more
// saturated, against fogged land). Natural, Ownership only (rlFaintOn); the rim decision (p59b) reads the same factor (rlWildFogK).
const rlWildFogK = (depth) => 1 - rlSmooth(0, RL_NW.fogD * RLD, depth);
function rlWildFogStrips(g, F, what) {
  if (!rlFaintOn() || !RL_NW.fogD) return; const Dd = RL_NW.fogD * RLD;
  for (const w of WILDS) { g.save(); g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    for (const e of rlWildOutline(w)) { if (isWild(e.j)) continue; const f = rlFogAt(e.j), a = what === 'haze' ? (f === 'unexplored' ? F.haze : 0) : f === 'unexplored' ? F.unexSat : f === 'outofsight' ? F.outSat : 0; if (!a) continue;
      const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); if (L < 1e-6) continue; let nx = -(by - ay) / L, ny = (bx - ax) / L; if (!w.cells.includes(provinceAt((ax + bx) / 2 + nx * 2, (ay + by) / 2 + ny * 2))) { nx = -nx; ny = -ny; } // +n into the wild
      const mx = (ax + bx) / 2, my = (ay + by) / 2, gr = g.createLinearGradient(mx, my, mx + nx * Dd, my + ny * Dd), col = what === 'haze' ? hex2rgb(RL_C.gesso) : [128, 128, 128];
      for (const t of [0, 0.25, 0.5, 0.75, 1]) gr.addColorStop(t, `rgba(${col[0]},${col[1]},${col[2]},${(a * rlWildFogK(t * Dd)).toFixed(4)})`);
      g.fillStyle = gr; g.beginPath(); g.moveTo(ax - (bx - ax) / L * Dd, ay - (by - ay) / L * Dd); g.lineTo(bx + (bx - ax) / L * Dd, by + (by - ay) / L * Dd); g.lineTo(bx + (bx - ax) / L * Dd + nx * Dd, by + (by - ay) / L * Dd + ny * Dd); g.lineTo(ax - (bx - ax) / L * Dd + nx * Dd, ay - (by - ay) / L * Dd + ny * Dd); g.closePath(); g.fill(); }
    g.restore(); }
}
function rlNatWildTexel(out, lt, tx, ty, d8, o4, Lcap) {
  const T = rlNWTables(), { TX } = out, N = out.nw, x = (tx + 0.5) / TX, y = (ty + 0.5) / TX, u = x / RLK, v = y / RLK, hx = (tx + 0.5) / 2, hy = (ty + 0.5) / 2;
  const B = N.boxOf.get(out.id[ty * out.BW + tx]); let L, A, Bb, d;
  if (lt === 7) { // the mean of its K x K texels (rlNatRangeColour)
    const K = B.K, q0 = (ty - B.y0) * K * B.bw2 + (tx - B.x0) * K; L = 0; A = 0; Bb = 0; for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) { const q = q0 + j * B.bw2 + i; L += B.Lp[q]; A += B.Ap[q]; Bb += B.Bp[q]; } L /= K * K; A /= K * K; Bb /= K * K; let rk = 0, dd = 0; for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) { const q = q0 + j * B.bw2 + i; rk += B.RK2[q]; dd += B.dW2[q]; } rlNatWildNear(out, ty * out.BW + tx, x, y, dd / (K * K), rk / (K * K), 0, RL_NW.foot.mirrorD[1] * RLD, 3);
  } else {
    const f = rlMereField(B, x, y), ME = RL_NW.mere, Fw = f.F, G = rlNatLandAt(out, x, y, RL_G3); d = f.d;
    // water: the map's natural water hue, a shallow shelf a little lighter and greener by the shore, deeper toward the middle, a faint ripple
    const shelf = 1 - rlSmooth(0, ME.shelf, f.dep), wL = ME.Ldeep + (ME.Lshelf - ME.Ldeep) * (0.25 * (1 - f.dep) + 0.75 * shelf) + 0.6 * rlVN(T.n, u / 9, v / 2.5), wA = ME.ab[0] + (ME.shelfAB[0] - ME.ab[0]) * shelf, wB = ME.ab[1] + (ME.shelfAB[1] - ME.ab[1]) * shelf;
    // the fringe: the land continued (mirrored near the outline), wetter, darker and reedier toward the water
    let mL = G[0], mA = G[1], mB = G[2]; const fade = 1 - rlSmooth(ME.mirrorD[0] * RLD, ME.mirrorD[1] * RLD, d);
    if (fade > 0.01) { const mc = rlNatMirror(out, hx, hy, x, y, d8); if (mc) { mL += (mc[0] - mL) * fade; mA += (mc[1] - mA) * fade; mB += (mc[2] - mB) * fade; } }
    const wet = rlSmooth(1 + ME.wetU, 1, f.r), reed = Math.max(0, Math.min(1, (rlVN(T.re, u / 0.9, v / 4.5) * 0.6 + rlFbm(T.re, u / 12 + 7, v / 12, 2) - 0.15) * 2)) * wet * ME.reedK, M = RL_NAT.mat.swamp;
    mL += (M.reed[0] - mL) * reed; mA += (M.reed[1] - mA) * reed; mB += (M.reed[2] - mB) * reed; mL -= ME.wetL * wet * (1 - reed); mA += (M.ground[1] - mA) * 0.4 * wet; mB += (M.ground[2] - mB) * 0.4 * wet;
    L = mL + (wL - mL) * Fw; A = mA + (wA - mA) * Fw; Bb = mB + (wB - mB) * Fw; rlNatWildNear(out, ty * out.BW + tx, x, y, d, 0, Fw, ME.mirrorD[1] * RLD, 5);
  }
  if (L > Lcap) L = Lcap; // every wild texel, the continued land included, under the cap (the pass-2 rule)
  rlLabTo(L, A, Bb, d8, o4); d8[o4 + 3] = 255;
}
// the natural wilds' sculpture on the bake (after the pixel pass): reed clumps along the mere's shore, faint ripples and at most RL_NW.mere.snags dark snags on its water.
// The peaks need none: their crests, valleys and shadows are the range's own relief.
function rlSculptWildsNat(g, out) {
  const N = out.nw; if (!N) return; const { HW, TX } = out, T2 = TX / 2;
  for (const w of WILDS) {
    if (w.kind !== 'mere') continue; const R = rngFor(`relief:${MAP_SEED}:natural:wild:sculpt3:${w.id}`), set = new Set(w.cells), pts = [];
    let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
    for (let y = Math.floor(bb[1] * T2); y <= Math.ceil(bb[3] * T2); y += 2) for (let x = Math.floor(bb[0] * T2); x <= Math.ceil(bb[2] * T2); x += 2) { const k = y * HW + x; if (!set.has(out.hid[k])) continue; const f = N.F[k]; if (f > 0.1 && f < 0.6) pts.push([(x + 0.5) / T2, (y + 0.5) / T2]); }
    g.save(); g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip(); g.lineCap = 'round';
    for (const [px, py] of pts) { if (R() > 0.3) continue; const n = 3 + Math.floor(R() * 3); // a reed clump on the shore
      for (let q = 0; q < n; q++) { const x = px + (R() - 0.5) * 2.6 * RLK, y = py + (R() - 0.5) * 1.6 * RLK, hgt = (2.0 + 2.0 * R()) * RLK, lean = (R() - 0.5) * 1.2 * RLK; g.strokeStyle = R() < 0.5 ? 'rgba(84,92,52,.8)' : 'rgba(118,112,66,.75)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + lean, y - hgt); g.stroke(); } }
    for (let k = 0; k < 30; k++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]), hk = Math.floor(y * T2) * HW + Math.floor(x * T2); if (!set.has(out.hid[hk]) || N.R[hk] < 0.3) continue;
      g.strokeStyle = 'rgba(200,226,222,.08)'; g.lineWidth = 0.7; const L = (4 + R() * 6) * RLK; g.beginPath(); g.ellipse(x, y, L, L * 0.2, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } // a faint ripple
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

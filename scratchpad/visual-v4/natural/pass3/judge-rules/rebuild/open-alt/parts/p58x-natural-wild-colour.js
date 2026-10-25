// ------------------------------------------------------------------ natural pass 3, prototype "open": the wilds' colour (p58w makes their heights)
// Peaks: each sample of the 2x grid is lit by the map's light (Horn's slope at 2x, the light from the upper left at 40 degrees): rock from shade to the lit cap, scree-grey, cool in
// shade and warm in light, darker in its cast shadow and valleys; heath on the foot where the range has not yet risen (the rock line follows the heights, so valleys reach up
// as green fingers and spurs come down as rock), frost on the highest lit crests (under the cap). In the spill (p58w) the land keeps its own colour and takes the range's relief,
// rubble and outcrops on the spurs (no snow, frost or crags; no material on wood crowns); inside the cells, beside a spill edge, the land mirrored across the outline continues
// it under the same relief, so the range runs across the line. The 1x bake takes the 2x samples' CIELAB mean; the 2x colours are kept as a canvas drawn at Near (rlNatWild2x).
// Meres: a lake inside the cells, its shore a seeded wander of the cells' rounded inner distance (bays, lobes and spits never parallel to the straight edges), a shallow shelf
// and a deep centre in the map's water hue; between the outline and the shore the land continues (mirrored), turning to marsh and reed toward the water.
let RL_NWT = null;
const rlNWT = () => (RL_NWT ??= { d: rlGTable('wild:detail'), n: rlNatT('wild:grain'), re: rlNatT('reed'), po: rlNatT('pool'), sc: rlNatT('scrub'), mb: rlNatT('wild:mere:bay'), ml: rlNatT('wild:mere:lobe'), mm: rlNatT('wild:mere:min'), w: rgb2lab(hex2rgb(RL_C.waterNat)) });
function rlNatMereField(out, w, px, py) { // world point -> { wf: the water factor, dep: depth past the shore in deepD, Lf: the lake field (world units) }
  const T = rlNWT(), ME = RL_NW.mere, D = RLD, u = px / RLK, v = py / RLK, { HW, HH, TX } = out;
  if (!out.mereDb) { const { wdist, hid } = out, mk = new Float32Array(HW * HH); for (let k = 0; k < HW * HH; k++) if (RL_WILDK[hid[k]] === 8) mk[k] = 1; out.mereDb = rlBoxBlur(wdist, HW, HH, Math.max(1, Math.round(ME.edgeD * D * TX / 2)), 2); for (let k = 0; k < HW * HH; k++) out.mereDb[k] *= mk[k]; }
  const db = rlBilin(out.mereDb, HW, HH, px * TX / 2, py * TX / 2), dr = rlBilin(out.wdist, HW, HH, px * TX / 2, py * TX / 2), d = Math.min(db, dr); // the inner distance, its corners rounded
  const mn = D * (ME.minD[0] + (ME.minD[1] - ME.minD[0]) * rlSmooth(-0.5, 0.7, rlFbm(T.mm, u / ME.minU, v / ME.minU, 2))), lobe = ME.lobes * D * Math.max(0, rlFbm(T.ml, u / ME.lobeU, v / ME.lobeU, 2)), bay = ME.bay * D * rlFbm(T.mb, u / ME.bayU, v / ME.bayU, 3);
  const Lf = Math.max(d - mn - lobe - Math.max(-0.4 * mn, bay), d - ME.openD * D), wf = rlSmooth(-0.5 * RLK, 0.5 * RLK, Lf); return { wf, dep: Math.max(0, Lf) / (ME.deepD * D), Lf };
}
const rlLabOf = (d8, o) => rgb2lab([d8[o], d8[o + 1], d8[o + 2]]);
function rlMirLab(out, d8, wx, wy, gx, gy, d) { // the land texel mirrored across the outline (d inside, along the outward gradient gx, gy), as CIELAB; null where not land
  const { BW, BH, TX, LT } = out, mx = wx + gx * (2 * d + 2 / TX), my = wy + gy * (2 * d + 2 / TX), tx = Math.floor(mx * TX), ty = Math.floor(my * TX); if (tx < 0 || ty < 0 || tx >= BW || ty >= BH) return null;
  const k = ty * BW + tx; if (LT[k] >= 7 || d8[k * 4 + 3] < 255) return null; return rlLabOf(d8, k * 4);
}
function* rlNatWildColour(out, d8, Lcap) {
  const T = rlNWT(), { BW, BH, TX, HW, HH, LT, id } = out, N = out.nw, P = RL_NW.peaks, SP = RL_NW.spill, MT = RL_NW.mat, D = RLD, VS = RL_P.vScale * RLK * RL_NW.relief, [lx, ly, lz] = RL_LIGHT, cmar = out.nat.cmar; // the range's light at 1.5 x the heights' scale (crisp faces)
  out.nw2 = []; const SPL = (out.spill = { mask: new Uint8Array(BW * BH) });
  for (const B of out.nwBox) {
    const { w, set, x0, y0, ss } = B, peaks = w.kind === 'peaks', bw = B.bw, bh = B.bh, gw = bw * 4, gh = bh * 4, img = new ImageData(gw, gh), g8 = img.data;
    const acc = new Float32Array(bw * 2 * bh * 2 * 4); // the 1x texels' CIELAB sums and counts
    let gK = -1, gG = null; const dg = 1 / (TX * 2), H = B.H, at = (i, j) => H[(j < 0 ? 0 : j >= gh ? gh - 1 : j) * gw + (i < 0 ? 0 : i >= gw ? gw - 1 : i)];
    for (let j = 0; j < gh; j++) {
      const hy = (j + 0.5) / 4, wy = (y0 + hy) / (TX / 2), v = wy / RLK, ty = 2 * y0 + (j >> 1); if (ty >= BH) continue;
      for (let i = 0; i < gw; i++) {
        const hx = (i + 0.5) / 4, wx = (x0 + hx) / (TX / 2), u = wx / RLK, tx = 2 * x0 + (i >> 1); if (tx >= BW) continue;
        const k1 = ty * BW + tx, lt = LT[k1], inside = lt >= 7 && set.has(id[k1]), o2 = (j * gw + i) * 4; let L, a, b;
        if (!peaks) { if (!inside) continue; [L, a, b] = rlNatMereColour(out, w, d8, wx, wy, u, v, B); }
        else {
          const h = H[j * gw + i], rise = h - P.base; if (!inside && (lt >= 7 || lt === 255 || rise <= 1e-4 || !SP.terr.includes(lt) || !SP.terr.includes(RL_TI[terr[id[k1]]]) || out.nat.ftone[k1])) continue; // the spill only on hills and mountains (the texel's own lookup and province), never a field
          const dzdx = ((at(i + 1, j - 1) + 2 * at(i + 1, j) + at(i + 1, j + 1) - at(i - 1, j - 1) - 2 * at(i - 1, j) - at(i - 1, j + 1)) * VS) / (8 * dg), dzdy = ((at(i - 1, j + 1) + 2 * at(i, j + 1) + at(i + 1, j + 1) - at(i - 1, j - 1) - 2 * at(i, j - 1) - at(i + 1, j - 1)) * VS) / (8 * dg);
          const s = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1)), hX2 = x0 + hx, hY2 = y0 + hy, c = rlBilin(inside ? N.cast : N.shd, HW, HH, hX2, hY2), ao = rlBilin(N.ao, HW, HH, hX2, hY2);
          const sh = Math.max(-1, Math.min(0.6, rlTanh(3.2 * (s - RL_SIN_EL)))), rk = rlSmooth(P.rock[0], P.rock[1], rise + P.rockN * rlFbm(T.n, u / 3.5, v / 3.5, 2)), gr = RL_NW.grain * rlVN(T.n, u / 0.9, v / 0.9), rd = rk > 0.02 ? RL_NW.rockDetail * rlRockGrain(T.n, u, v) : 0; // the rock's crisp grain: a ridged value-noise detail lit from the upper left
          // the range's own material: heath on the foot, rock where it has risen (lit to the cap, shade cool and dark), frost on the highest lit crests
          const vr = rlTanh(RL_NW.gain * (s - RL_SIN_EL)), q = 0.5 + 0.5 * vr; let rL = RL_NW.Lmid + (vr > 0 ? vr * (Lcap - 2 - RL_NW.Lmid) : vr * (RL_NW.Lmid - RL_NW.Lshade)) - RL_NW.castL * c - RL_NW.aoL * ao + gr + rd;
          let rA = MT.rockShade[1] + (MT.rockLit[1] - MT.rockShade[1]) * q, rB = MT.rockShade[2] + (MT.rockLit[2] - MT.rockShade[2]) * q;
          if (inside) { const fr = RL_NW.frost * rlSmooth(0.78, 0.98, rise) * rlSmooth(RL_SIN_EL - 0.02, RL_SIN_EL + 0.2, s); rL += (MT.frost[0] - rL) * fr; rA += (MT.frost[1] - rA) * fr; rB += (MT.frost[2] - rB) * fr; }
          if (inside) {
            if (k1 !== gK) { gK = k1; gG = rlNatLandGround(out, tx, ty, RL_NAT.mat.hills.ground); } const G = gG; let fL = G[0] + (MT.heath[0] - G[0]) * 0.5 + RL_NW.heathRel * sh - 6 * c - 4 * ao + 2 * rlFbm(T.n, u / 5, v / 5, 2) + gr, fA = G[1] + (MT.heath[1] - G[1]) * 0.5, fB = G[2] + (MT.heath[2] - G[2]) * 0.5;
            L = fL + (rL - fL) * rk; a = fA + (rA - fA) * rk; b = fB + (rB - fB) * rk;
            const sd = rlBilin(B.SD, bw, bh, hx, hy), e = rlBilin(B.E, bw, bh, hx, hy), t = e * (1 - rlSmooth(SP.mirD[0] * D, SP.mirD[1] * D, sd)); // beside a spill edge: the land continues inside
            if (t > 0.01) { const gx = rlBilin(B.SD, bw, bh, hx - 1, hy) - rlBilin(B.SD, bw, bh, hx + 1, hy), gy = rlBilin(B.SD, bw, bh, hx, hy - 1) - rlBilin(B.SD, bw, bh, hx, hy + 1), gl = Math.hypot(gx, gy) || 1, m = rlMirLab(out, d8, wx, wy, gx / gl, gy / gl, Math.max(0, sd));
              if (m) { const sp = rlSpillOf(m, rise, sh, rk, c, 0, Lcap); L += (sp[0] - L) * t; a += (sp[1] - a) * t; b += (sp[2] - b) * t; } }
          } else { // the spill: the land's own colour under the range's relief, rubble and outcrops
            const base = rlLabOf(d8, k1 * 4); [L, a, b] = rlSpillOf(base, rise, sh, rk, 0, cmar[k1] / 255, Lcap);
          }
        }
        if (peaks) { const sd = rlBilin(B.SD, bw, bh, hx, hy), kf = rlBilin(B.E, bw, bh, hx, hy) * (1 - rlSmooth(RL_NW.floorSD[0] * D, RL_NW.floorSD[1] * D, Math.abs(sd))); // near the outline no deep shade (the contour reads on both sides)
          if (kf > 0 && L < RL_NW.floor) L += (RL_NW.floor - L) * 0.85 * kf;
          if (inside && sd < RL_NW.floorD[1] * D && L < RL_NW.floorNS) { const kn = (1 - kf) * (1 - rlSmooth(RL_NW.floorD[0] * D, RL_NW.floorD[1] * D, sd)); // beside light land (plains, fields) the foot near the outline keeps no deep shade either, so the contour reads on both sides
            if (kn > 0.01) { const gx = rlBilin(B.SD, bw, bh, hx - 1, hy) - rlBilin(B.SD, bw, bh, hx + 1, hy), gy = rlBilin(B.SD, bw, bh, hx, hy - 1) - rlBilin(B.SD, bw, bh, hx, hy + 1), gl = Math.hypot(gx, gy) || 1, Ls = [];
              for (const dd of [0.03, 0.06, 0.09]) { const q = rlMirLab(out, d8, wx, wy, gx / gl, gy / gl, Math.max(0, sd) + dd * D * 0.5); if (q) Ls.push(q[0]); } Ls.sort((p, q) => p - q);
              if (Ls.length) { const kl = kn * rlSmooth(RL_NW.lightLand[0], RL_NW.lightLand[1], Ls[Ls.length >> 1]); L += (RL_NW.floorNS - L) * 0.8 * kl; } } }
          if (L > Lcap) L = Lcap; }
        rlLabTo(L, a, b, g8, o2); g8[o2 + 3] = 255; const ka = (((ty - 2 * y0) * bw * 2) + tx - 2 * x0) * 4; acc[ka] += L; acc[ka + 1] += a; acc[ka + 2] += b; acc[ka + 3]++;
      }
      if ((j & 31) === 31) yield;
    }
    for (let ty = 0; ty < bh * 2; ty++) for (let tx = 0; tx < bw * 2; tx++) { // the 1x bake: the mean of its 2x samples (land texels with a partial spill keep their own colour for the rest)
      const ka = (ty * bw * 2 + tx) * 4, n = acc[ka + 3]; if (!n) continue; const X = 2 * x0 + tx, Y = 2 * y0 + ty; if (X >= BW || Y >= BH) continue; const k1 = Y * BW + X, o = k1 * 4;
      let L = acc[ka] / n, a = acc[ka + 1] / n, b = acc[ka + 2] / n; const land = LT[k1] < 7, m0 = land ? rlLabOf(d8, o) : null; if (n < 4 && land) { L = (L * n + m0[0] * (4 - n)) / 4; a = (a * n + m0[1] * (4 - n)) / 4; b = (b * n + m0[2] * (4 - n)) / 4; }
      rlLabTo(L, a, b, d8, o); d8[o + 3] = 255;
      if (land) { const e = Math.hypot(L - m0[0], a - m0[1], b - m0[2]); SPL.mask[k1] = Math.min(255, 1 + Math.round(e * 10)); } // review: the spill's texels outside the cells and how far each moved (CIE76 x 10)
    }
    const cv = makeCanvas(gw, gh), g2 = cv.getContext('2d'), q2 = { cv, x: (x0 * 2) / TX, y: (y0 * 2) / TX, w: (bw * 2) / TX, h: (bh * 2) / TX, kind: w.kind }; g2.putImageData(img, 0, 0);
    if (!peaks) { const k2 = gw / q2.w; g2.setTransform(k2, 0, 0, k2, -q2.x * k2, -q2.y * k2); rlSculptWildsNat(g2, out); g2.setTransform(1, 0, 0, 1, 0, 0); } // the mere's reeds and ripples on its 2x layer too
    out.nw2.push(q2);
    B.H = B.A = null; yield;
  }
}
const rlRockGrain = (T, u, v) => { const e = 0.35, r = (p, q) => 1 - Math.abs(rlVN(T, p / 1.4 + 51, q / 1.4)) + 0.5 * (1 - Math.abs(rlVN(T, p / 0.6 + 17, q / 0.6))), t = (r(u + e, v + e) - r(u - e, v - e)) * 1.4; return t > 1 ? 1 : t < -1 ? -1 : t; }; // lit from the upper left, in [-1, 1]
function rlSpillOf(base, rise, sh, rk, c, can, Lcap) { // the land (CIELAB) under the range's relief: its light and shade, rubble on the rising foot, outcrops on the spurs (capped), none on crowns
  const SP = RL_NW.spill, MT = RL_NW.mat, k = rlSmooth(0, 0.10, rise), open = 1 - 0.7 * can, rub = 0.45 * k * open, ro = Math.min(SP.rockMax, rk) * open;
  let L = base[0] + RL_NW.spillRel * sh * k * (1 - 0.4 * can) - 4 * c, a = base[1], b = base[2];
  L += (MT.heath[0] - 1 + 4 * sh - L) * rub * 0.5; a += (MT.heath[1] - a) * rub; b += (MT.heath[2] - b) * rub;
  const oL = MT.rubble[0] + 10 * sh; L += (oL - L) * ro; a += (MT.rubble[1] - a) * ro; b += (MT.rubble[2] - b) * ro;
  return [L > Lcap ? Lcap : L, a, b];
}
function rlNatMereColour(out, w, d8, wx, wy, u, v, B) {
  const T = rlNWT(), ME = RL_NW.mere, MT = RL_NW.mat, W0 = T.w, q = rlNatMereField(out, w, wx, wy), { HW, HH, TX } = out;
  // water: the shelf by the shore (lighter, greener), the deep centre (the map's water hue, darker), a faint ripple
  const dp = rlSmooth(ME.shelfD / ME.deepD, 1, q.dep), sl = rlSmooth(0, ME.shelfD / ME.deepD, q.dep);
  const wL = ME.Lshelf + (ME.Ldeep - ME.Lshelf) * dp - 2.5 * (1 - sl) + 0.6 * rlVN(T.n, u / 9, v / 2.5), wA = ME.ashelf + (W0[1] - ME.ashelf) * dp, wB = ME.bshelf + (W0[2] - 1 - ME.bshelf) * dp;
  // the fringe: the swamp around continues into the cell by the land's own recipe (the same seeded pools, reeds and shrubs, so the pattern runs across the outline with no seam
  // and no mirrored fields), turning to marsh and reed toward the water, wetter and darker at the water's edge
  const NM = RL_NAT.mat, G = rlNatLandGround(out, Math.floor(wx * TX), Math.floor(wy * TX), NM.swamp.ground), wet = rlSmooth(-ME.wetU * RLK, 0, q.Lf), nearW = rlSmooth(-0.03 * RLD, -0.004 * RLD, q.Lf);
  let L = G[0] + 2.2 * rlFbm(T.n, u / 26, v / 26, 3), A = G[1], Bb = G[2]; const mix = (c, f) => { L += (c[0] - L) * f; A += (c[1] - A) * f; Bb += (c[2] - Bb) * f; };
  const pool = rlSmooth(0, 1, (rlFbm(T.po, u / 9, v / 9, 3) - 0.40) / 0.08) * (1 - nearW), reedL = Math.max(0, Math.min(1, (rlVN(T.re, u / 0.9, v / 4.5) * 0.6 + rlFbm(T.re, u / 12 + 7, v / 12, 2) - 0.25) * 2)) * (1 - pool);
  mix(NM.swamp.reed, reedL * 0.7); mix(NM.swamp.shrub, (1 - pool) * (1 - nearW) * 0.6 * rlRamp(rlVN(T.sc, u / 1.3 + 3, v / 1.3), 0.66, 0.84)); mix(NM.swamp.pool, pool); L += pool * 1.2 * rlVN(T.po, u / 2, v / 2);
  mix(MT.marsh, ME.fringe * nearW); mix(MT.reed, 0.5 * nearW * Math.max(0, Math.min(1, (rlVN(T.re, u / 0.9, v / 4.5) * 0.6 + rlFbm(T.re, u / 12 + 7, v / 12, 2) - 0.15) * 2)) * (1 - wet)); L -= ME.wetL * wet;
  return [L + (wL - L) * q.wf, A + (wA - A) * q.wf, Bb + (wB - Bb) * q.wf];
}
// the 2x layer over the bake at Near (a bake texel from RL_NW.near CSS px), so the ranges and the mere's shore stay crisp where the bake is magnified; Natural only
function rlNatWild2x(g) {
  const L = RB.nw2, k = RB.ready ? rlSmooth(0.85, 1.05, cam.s * RB.TX) : 0; if (!L || k < 0.01 || rlShownLook() !== 'natural' || state.mode === 'terrain' || SKIP.has('wild2x')) return;
  g.save(); modelPath(g); g.clip(); g.globalAlpha = k; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low';
  for (const q of L) if (q.x < VW[2] && q.x + q.w > VW[0] && q.y < VW[3] && q.y + q.h > VW[1]) g.drawImage(q.cv, q.x, q.y, q.w, q.h);
  g.restore();
}
// reeds along the mere's shore, faint ripples and at most RL_NW.mere.snags dark snags on its water (on the bake and on the 2x layer)
function rlSculptWildsNat(g, out, s = 1) {
  const N = out.nw; if (!N) return; const { HW, TX } = out, T2 = TX / 2;
  for (const w of WILDS) {
    if (w.kind !== 'mere') continue; const R = rngFor(`relief:${MAP_SEED}:natural:wild:sculpt3:${w.id}`), set = new Set(w.cells), pts = [];
    let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
    for (let y = Math.floor(bb[1] * T2); y <= Math.ceil(bb[3] * T2); y += 2) for (let x = Math.floor(bb[0] * T2); x <= Math.ceil(bb[2] * T2); x += 2) { const k = y * HW + x; if (!set.has(out.hid[k])) continue; const f = N.F[k]; if (f > 0.1 && f < 0.6) pts.push([(x + 0.5) / T2, (y + 0.5) / T2]); }
    g.save(); g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip(); g.lineCap = 'round'; let snags = 0;
    for (const [px, py] of pts) { if (R() > 0.3) continue; const n = 3 + Math.floor(R() * 3);
      for (let q = 0; q < n; q++) { const x = px + (R() - 0.5) * 2.6 * RLK, y = py + (R() - 0.5) * 1.6 * RLK, hgt = (2 + 2 * R()) * RLK, lean = (R() - 0.5) * 1.2 * RLK; g.strokeStyle = R() < 0.5 ? 'rgba(84,92,52,.8)' : 'rgba(118,112,66,.75)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + lean, y - hgt); g.stroke(); } }
    for (let k = 0; k < 40; k++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]), hk = Math.floor(y * T2) * HW + Math.floor(x * T2); if (!set.has(out.hid[hk]) || N.R[hk] < 0.3) continue;
      if (k % 3 === 0) { g.strokeStyle = `rgba(200,226,222,${RL_NW.mere.ripple[0]})`; g.lineWidth = 0.6; const L = (4 + R() * 6) * RLK; g.beginPath(); g.ellipse(x, y, L, L * 0.2, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); continue; }
      if (R() < 0.86 || snags >= RL_NW.mere.snags) continue; snags++; g.strokeStyle = 'rgba(52,44,34,.7)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.6, y - 4 * RLK); g.moveTo(x + 0.4, y - 2.4 * RLK); g.lineTo(x + 1.8 * RLK, y - 3.6 * RLK); g.stroke();
      g.strokeStyle = `rgba(190,220,214,${RL_NW.mere.ripple[1]})`; g.beginPath(); g.ellipse(x, y + 0.4, 2.4 * RLK, 0.6 * RLK, 0, 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
}

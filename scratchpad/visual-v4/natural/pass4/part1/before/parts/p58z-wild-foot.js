// ------------------------------------------------------------------ pass 3b: the wilds' landform at rest (Natural only; natural/pass3b, the owner's answer of 2026-10-24)
// "Soft, like province lines": in the natural view a wild has no drawn outline or rim at rest; its edge is the landform itself (rock, scree and the shore), and the outline comes
// up at the colour-blind floor only in the focus states (p59x). So the landform must mark the extent with no straight line between it and the land: the range's rock and scree
// come to an irregular foot close to the outline (p58x), the mere fills its cells to a natural shore, and the land just inside the outline (the strip below the foot) is the land
// outside continued without a seam. This part holds the helpers that make the strip seamless:
// - the land's heights continued into the wilds: the land's own height recipe (p58b S4) run on the wild's half-resolution texels with the land weights renormalised, so the land
//   meets the range with no step (pass 3 carried a blurred land height in, which left a relief seam at the outline);
// - the natural land's relief over those heights: the shared hillshade's Horn kernel and its valleys read the v4 granite (1.1 and up) and the mere (-0.05) across every outline,
//   which drew a lit or shaded strip and a dark valley band along the outline in the natural land, a straight line once the ink is gone. Recomputed round the wilds only, for the
//   land and for the land continued inside the wilds (p58m), and written only where the wilds' heights reach (elsewhere the shared rasters, bit for bit);
// - the landform layer the Mid zooms draw (the range's rock and the mere's water at the half mip's resolution, the landform as alpha) and its lookup for the edge decision.
// (The distance past the foot or the shore, from which the range climbs and the lake deepens, is p58x's tp: the rounded outline distance less the inset.)
// Seeded tables, arithmetic and square roots only; a pure function of the map (V17).
const RL_MSLH = { tabs: null, feat: null, wv: new Float64Array(7), ws: 0, g: 1 };
function rlMsLandH(out, x, y) { // the land's height recipe (p58b S4) at half-resolution texel (x, y), the land weights renormalised; null where no land weight reaches
  const { QW, QH, TX, wch } = out, px = ((x + 0.5) * 2) / TX, py = ((y + 0.5) * 2) / TX, fq = (x + 0.5) / 2, gq = (y + 0.5) / 2, wv = RL_MSLH.wv;
  const T = RL_MSLH.tabs ?? (RL_MSLH.tabs = RL_T.map((tn) => rlGTable('height:' + tn))), feat = RL_MSLH.feat ?? (RL_MSLH.feat = RL_T.map((tn) => RL_HT[tn][2] * RLK * RL_P.featK));
  let ws = 0; for (let c = 0; c < 7; c++) { const v = rlBilin(wch[c], QW, QH, fq, gq); wv[c] = v; ws += v; } RL_MSLH.ws = ws; if (ws < 1e-3) return null;
  let h = 0, gs = 0;
  for (let c = 0; c < 7; c++) {
    const wt = wv[c] / ws; gs += wt * RL_SHG[c]; if (wt < 0.003) continue; const tn = RL_T[c], [Bt, At] = RL_HT[tn];
    const n = tn === 'mountains' ? rlRidged(T[c], px / feat[c], py / feat[c], 4, 0.3) : rlGFbm(T[c], px / feat[c], py / feat[c], tn === 'hills' ? 3 : RL_P.octaves, RL_P.hGain);
    h += wt * (Bt + At * n); if (tn === 'forest') h += wt * 0.04;
  }
  h += 0.30 * rlBilin(wch[7], QW, QH, fq, gq); if (h > 0.85) h = 0.85 + 0.15 * rlTanh((h - 0.85) / 0.15);
  RL_MSLH.g = gs; return h;
}
// the natural land's hillshade (fS) and valleys (ao) over hXl (the land's heights, the wilds' texels holding the land continued), in the window round the wilds (half res);
// HGn: the shade gain there (the wilds' texels take the land's blend). Written only where hXl differs from the shared heights within the kernel's reach.
function rlMsNatRelief(out, hXl, HGn, win) {
  const { HW, HH, TX, hid, hh, fS, ao } = out, VS = RL_P.vScale * RLK, dxw = 2 / TX, [lx, ly, lz] = RL_LIGHT, fN = Float32Array.from(fS), aN = Float32Array.from(ao), [x0, y0, x1, y1] = win;
  const dif = (k) => hXl[k] !== hh[k];
  const H_ = (xx, yy, k0) => { xx = xx < 0 ? 0 : xx >= HW ? HW - 1 : xx; yy = yy < 0 ? 0 : yy >= HH ? HH - 1 : yy; const kk = yy * HW + xx; return hid[kk] === 255 ? hXl[k0] : hXl[kk]; };
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = y * HW + x; if (hid[k] === 255) continue; let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < HW && yy < HH && dif(yy * HW + xx)) { near = true; break; } }
    if (!near) continue;
    const a = H_(x - 1, y - 1, k), b = H_(x, y - 1, k), c = H_(x + 1, y - 1, k), d = H_(x - 1, y, k), f = H_(x + 1, y, k), g = H_(x - 1, y + 1, k), i2 = H_(x, y + 1, k), j = H_(x + 1, y + 1, k);
    const dzdx = ((c + 2 * f + j - (a + 2 * d + g)) * VS) / (8 * dxw), dzdy = ((g + 2 * i2 + j - (a + 2 * b + c)) * VS) / (8 * dxw);
    const nl = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1), s = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / nl), v = rlTanh(3.2 * HGn[k] * (s - RL_SIN_EL));
    fN[k] = v < -1 ? -1 : v > RL_P.litCap ? RL_P.litCap : v;
  }
  const r = Math.round((0.08 * RLD * TX) / 2), m = 3 * r + 2, ax0 = Math.max(0, x0 - m), ay0 = Math.max(0, y0 - m), ax1 = Math.min(HW - 1, x1 + m), ay1 = Math.min(HH - 1, y1 + m), ww = ax1 - ax0 + 1, wh = ay1 - ay0 + 1;
  const P = new Float32Array(ww * wh), I = new Float32Array(ww * wh);
  for (let y = 0; y < wh; y++) for (let x = 0; x < ww; x++) { const k = (ay0 + y) * HW + ax0 + x; P[y * ww + x] = hXl[k]; I[y * ww + x] = dif(k) ? 1 : 0; }
  const hb = rlBoxBlur(P, ww, wh, r, 2), ib = rlBoxBlur(I, ww, wh, r, 2);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = y * HW + x, q = (y - ay0) * ww + x - ax0; if (ib[q] <= 0) continue; aN[k] = hid[k] === 255 ? 0 : rlSmooth(0, 0.03 * RLD, (hb[q] - hXl[k]) * VS); }
  return { fS: fN, ao: aN };
}
// the landform layer the 'bake' source draws (Mid and the reference zoom at 1x, where the land is drawn from its half mip): each wild's rock and water at the half mip's
// resolution (Lab means of 2 x 2 bake texels, the rock's colour weighted by its share) with the landform's share as alpha, and none of the mips' calm (rlMsMips), so the rock is as
// sharp as the land beside it and as crisp in tone as the bake, while the strip below the foot is the land's own mip. Pass 3 drew the whole wild from the full bake there: the
// strip read crisper than the land beside it (the seam the pass-3 verifier measured) and the rock's fine detail 2.1 x the land's.
const RL_MSLF = { detailK: 0.8 };
function rlMsLandformCanvas(out) {
  const { BW, BH, LT, id } = out, d8 = out.msImg.data, lf8 = out.mw.lf8, cvs = [];
  for (const B of out.ms.boxes) {
    const x0 = Math.max(0, B.bx0 & ~1), y0 = Math.max(0, B.by0 & ~1), x1 = Math.min(BW - 1, B.bx1 | 1), y1 = Math.min(BH - 1, B.by1 | 1), w = (x1 - x0 + 1) >> 1, h = (y1 - y0 + 1) >> 1, img = new ImageData(w, h), d = img.data;
    const Lh = new Float32Array(w * h), Ah = new Float32Array(w * h), Bh = new Float32Array(w * h), Wh = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let L = 0, a = 0, b = 0, ws = 0;
      for (let q = 0; q < 4; q++) { const k = (y0 + 2 * y + (q >> 1)) * BW + x0 + 2 * x + (q & 1); if ((LT[k] !== 7 && LT[k] !== 8) || !B.G.set.has(id[k])) continue; const f = lf8[k] / 255; if (f <= 0) continue; const o = k * 4, c = rgb2lab([d8[o], d8[o + 1], d8[o + 2]]); L += c[0] * f; a += c[1] * f; b += c[2] * f; ws += f; }
      const z = y * w + x; if (ws > 0) { Lh[z] = L / ws; Ah[z] = a / ws; Bh[z] = b / ws; } Wh[z] = ws / 4; }
    const Lm = rlBoxBlur(Lh, w, h, 1, 1, Wh); // the rock's finest detail eased a little (detailK of its 3 x 3 deviation kept), so at Mid it is about as fine as the land beside it
    for (let z = 0; z < w * h; z++) { if (Wh[z] <= 0) continue; const p = z * 4; rlLabTo(Lm[z] + (Lh[z] - Lm[z]) * RL_MSLF.detailK, Ah[z], Bh[z], d, p); d[p + 3] = Math.round(255 * Wh[z]); }
    const cv = makeCanvas(w, h); cv.getContext('2d').putImageData(img, 0, 0); cvs.push({ B, cv, img, x0, y0, w, h });
  }
  out.mw.lfCv = cvs;
}
// a landform layer's colour over a ground colour at a world point, as the canvas composites it (bilinear on premultiplied colour); the edge decision reads it (p59x)
function rlMsLandformAt(Q, x, y, under) {
  const T = RB.TX / 2, d = Q.img.data, W2 = Q.w, H2 = Q.h; let fx = x * T - Q.x0 / 2 - 0.5, fy = y * T - Q.y0 / 2 - 0.5; if (fx < 0) fx = 0; if (fy < 0) fy = 0; if (fx > W2 - 1) fx = W2 - 1; if (fy > H2 - 1) fy = H2 - 1;
  const ix = fx | 0, iy = fy | 0, ax = fx - ix, ay = fy - iy, ix1 = ix + 1 < W2 ? ix + 1 : ix, iy1 = iy + 1 < H2 ? iy + 1 : iy; let r = 0, g = 0, b = 0, A = 0;
  for (const [o, wt] of [[(iy * W2 + ix) * 4, (1 - ax) * (1 - ay)], [(iy * W2 + ix1) * 4, ax * (1 - ay)], [(iy1 * W2 + ix) * 4, (1 - ax) * ay], [(iy1 * W2 + ix1) * 4, ax * ay]]) { const al = (d[o + 3] / 255) * wt; r += d[o] * al; g += d[o + 1] * al; b += d[o + 2] * al; A += al; }
  if (!under) return A > 0.25 ? [r / A, g / A, b / A] : null; return [under[0] * (1 - A) + r, under[1] * (1 - A) + g, under[2] * (1 - A) + b];
}

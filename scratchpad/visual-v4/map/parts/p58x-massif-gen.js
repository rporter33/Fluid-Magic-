// ------------------------------------------------------------------ pass 3: the natural wilds (natural/pass3; the "sculpted massif" prototype with the judges' grafts), Natural only
// Clear, the Terrain mode and the data modes keep the v4 granite massif and mere (rlWildTexel, rlWildModeLayer). What stays: a wild is impassable and its footprint is exactly
// its cells (the hit test, the paths and the focus outline on the cells' outline); inside that footprint the drawing is free and no wild material leaves it. Peaks: one massif
// along a spine on the wild's long axis (its half-width following the room the cells give it, displaced by seeded noise), a crest with peaks and saddles, spurs running off it
// across the axis, faceted ridges at the fine scale. Mere: a lake in its cells.
// Pass 3b (the owner's answer of 2026-10-24, "Soft, like province lines": no outline at rest, the landform marks the extent): the range's rock and scree come down to an
// irregular foot close to the outline: a seeded fractal inset (median about 0.02 D, p90 about 0.06 D; from 0 at the spur crests to about 0.12 D in the coves, with bays and
// spurs about 0.12 D across, so a long straight edge of the cells never draws a straight foot) on the outline's distance with the cells' convex corners rounded off. Below the foot lies the land outside continued (p58z: its heights, its relief and its covers, so no straight line reads at the outline), with
// scree crumbs on it just below the foot (p58y); past the foot the range's relief stands at least footK of its height, so the rock is relief right to its foot, and the big
// forms climb from the outline as in pass 3. The mere fills its cells to a shore drawn the same way (rounder corners, broad lobes), about 0.03 D in. Pass 3's band
// of continued land inside the cells, its dark-ground foot and its talus option (?wildfoot=talus) are gone.
// Each wild is computed on its own raster at RL_MS.F x the bake's resolution (crisp ridgelines and shores up close); the bake's wild texels are its F x F means, so the
// canvas, its mips and the checks read the same picture. Seeded tables only (relief:<seed>:natural:massif:*), arithmetic, squares (`** 2`, exact: fdlibm and V8 square by one product) and square roots: no Math.random, Date or fractional powers.
const RL_MS = { // docs/09-balance "Map presentation" rows (pass 3, 3b); distances in D, noise sizes in mapgen units (x RLK world units)
  F: 2, lowStep: 2, outside: 3, bins: 48, binBlur: 3, // lowStep: the low-frequency fields every lowStep bake texels; outside: fine texels past the outline by more (world units) are skipped
  peaks: { kr: 0.95, round: 0.22, meA: 0.22, meU: 44, silA: 0.30, silU: 26, H: 1.5, crestU: 26, crestA: 0.38, crestQ: 0.6, body: [-0.15, 0.75],
    spurU: [22, 44], spurOct: 2, spurA: 0.6, spurWarp: 0.45, spurReach: 0.6, // spurs off the crest, reaching spurReach (in the body's units) past its silhouette
    fineU: 8.5, fineOct: 2, fineA: 0.08, // graft 3: faceted ridges at the fine scale on the massif's large forms
    hillA: 0.035, hillU: 11, castD: 0.5, castSteps: 28, castBias: 0.012, castK: 0.6, aoD: 0.035,
    // pass 3b, the foot: the rock past an irregular line at inset(x, y) D from the outline, read on the outline's distance with its convex corners rounded (a polynomial smooth
    // minimum of the two nearest edges' distances, k cornerK D): inset = base + a fractal of four octaves (amps, units) + an isotropic gully network (gullyA, gullyU: coves
    // and crests along every edge, whichever way the spurs run) - spurK x (the spur ridge - 0.5) (spur crests reach the outline), within [0, insetMax]; fe: the antialiased foot
    cornerK: 0.15, base: 0.028, amps: [0.034, 0.045, 0.014, 0.007], units: [32, 11, 4, 1.6], gullyA: 0.03, gullyU: 7, gullyMid: 0.44, spurK: 0.05, spurMid: 0.72, target: 0.021, shiftD: 0.08, insetMin: 0.008, softK: 0.01, insetMax: 0.12, insetFloor: 0.002, fe: 0.0025,
    crumbD: 0.012, crumbU: 0.75, // scree crumbs on the land up to crumbD D below the foot
    footD: [0.14, 0.32], footU: 15, footR: 0.3, footK: 0.26, footRiseD: 0.07, lead: 0.004 }, // the big forms climb from the outline over footD D (seeded; never wider than footR x the room the cells give the range); past the foot the spurs and facets stand at least footK of their height, reached over footRiseD D, so the rock is relief right to its foot
  mere: { cornerK: 0.2, base: 0.034, target: 0.022, shiftD: 0.08, amps: [0.038, 0.013, 0.005, 0.002], units: [30, 10, 3.5, 1.4], insetMin: 0.008, softK: 0.008, insetFloor: 0.006, insetMax: 0.1, fe: 0.0025, fadeD: 0.08, deep: 0.8 }, // pass 3b: the shore the same way, rounder (cornerK), in broad lobes (the first octave, about 0.3 D across: zoomed out the lake reads as a lake, not its cell's polygon), about 0.025 D in (median; p90 about 0.05 D, under 0.06 D on the six other map plans tried)
  snowQ: [0.9, 0.975], snowBlurD: 0.035, snowDetail: 0.3, // the snow caps: the range's heights blurred over snowBlurD D (plus snowDetail of their detail), ramped between these quantiles (p58y)
  climb: { eRef: 0.55, reachD: 0.5, wood: 0.5, woodT: 0.9, tl: [0.22, 0.4], field: 0.55, copse: 2, copseT: 0.12, depthK: 0, d0: 0.012, d1: 0.07 }, // the continued land's covers thin as the land climbs (e / eRef), to reachD into a wild; below the foot nothing climbs, so the strip is the land outside
};
// the wild's spine: its texels (half resolution) binned along the long axis (the major eigenvector of their spread); per bin the deepest texel's offset across the axis
// and its depth (distance to the outline), smoothed; the massif's half-width follows that depth, so it fills the room the cells give it without tracing their edges
function rlMsGeom(w, out) {
  const { HW, HH, TX, hid, wdist } = out, T2 = TX / 2, set = new Set(w.cells); let bb = [Infinity, Infinity, -Infinity, -Infinity];
  for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
  const x0 = Math.max(0, Math.floor(bb[0] * T2) - 1), y0 = Math.max(0, Math.floor(bb[1] * T2) - 1), x1 = Math.min(HW - 1, Math.ceil(bb[2] * T2) + 1), y1 = Math.min(HH - 1, Math.ceil(bb[3] * T2) + 1), pts = [];
  let n = 0, mx = 0, my = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = y * HW + x; if (!set.has(hid[k])) continue; const px = (x + 0.5) / T2, py = (y + 0.5) / T2; pts.push([px, py, wdist[k]]); n++; mx += px; my += py; }
  mx /= n || 1; my /= n || 1; let sxx = 0, syy = 0, sxy = 0; for (const [px, py] of pts) { sxx += (px - mx) ** 2; syy += (py - my) ** 2; sxy += (px - mx) * (py - my); }
  sxx /= n || 1; syy /= n || 1; sxy /= n || 1; const lam = (sxx + syy) / 2 + Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy);
  let ax = Math.abs(sxy) > 1e-6 ? sxy : sxx >= syy ? 1 : 0, ay = Math.abs(sxy) > 1e-6 ? lam - sxx : sxx >= syy ? 0 : 1; const al = Math.sqrt(ax * ax + ay * ay) || 1; ax /= al; ay /= al;
  let p0 = Infinity, p1 = -Infinity, q0 = Infinity, q1 = -Infinity; for (const [px, py] of pts) { const pa = (px - mx) * ax + (py - my) * ay, qa = -(px - mx) * ay + (py - my) * ax; p0 = Math.min(p0, pa); p1 = Math.max(p1, pa); q0 = Math.min(q0, qa); q1 = Math.max(q1, qa); }
  const NB2 = RL_MS.bins, bw = (p1 - p0) / NB2 || 1, r = new Float32Array(NB2), c = new Float32Array(NB2), has = new Uint8Array(NB2);
  for (const [px, py, d] of pts) { const pa = (px - mx) * ax + (py - my) * ay, qa = -(px - mx) * ay + (py - my) * ax, b = Math.min(NB2 - 1, Math.floor((pa - p0) / bw)); if (d > r[b]) { r[b] = d; c[b] = qa; has[b] = 1; } }
  const sm = (A) => { const o = new Float32Array(NB2); for (let b = 0; b < NB2; b++) { let s = 0, wt = 0; for (let q = -RL_MS.binBlur; q <= RL_MS.binBlur; q++) { const j = b + q; if (j < 0 || j >= NB2 || !has[j]) continue; const ww = RL_MS.binBlur + 1 - Math.abs(q); s += A[j] * ww; wt += ww; } o[b] = wt ? s / wt : 0; } return o; };
  return { w, set, bb, mx, my, ax, ay, p0, p1, q0, q1, bw, r: sm(r), c: sm(c), ol: rlWildOutline(w) };
}
const rlMsSpine = (G, pa) => { let t = (pa - G.p0) / G.bw - 0.5; const nb = G.r.length; if (t < 0) t = 0; if (t > nb - 1) t = nb - 1; const i = t | 0, f = t - i, j = i + 1 < nb ? i + 1 : i; return [G.c[i] + (G.c[j] - G.c[i]) * f, G.r[i] + (G.r[j] - G.r[i]) * f]; };
// the low-frequency part of one wild texel's heights, at the bake's resolution (world x, y; hL the land's height carried in): o = { m (peaks: the body, 1 on the crest, 0 at the
// massif's silhouette), crest, hF (the land's height under the range), hill (the foothills' noise, laid on as the range climbs) }
function rlMsLow(G, T, x, y, hL, o) {
  const u = x / RLK, v = y / RLK, dx = x - G.mx, dy = y - G.my, pa = dx * G.ax + dy * G.ay, qa = -dx * G.ay + dy * G.ax; o.hF = hL;
  if (G.w.kind !== 'peaks') { o.m = 0; o.crest = 0; o.hill = 0; o.room = 0; return; }
  const P = RL_MS.peaks, [c0, r] = rlMsSpine(G, pa), R = Math.max(1, P.kr * r), c = c0 + P.meA * R * rlGFbm(T.crest, pa / (P.meU * RLK), 1.3, 2, 0.5), e = P.round * R, dq = Math.sqrt((qa - c) ** 2 + e * e) - e; // the crest meanders and is rounded (the spurs carry the crisp ridgelines)
  o.m = 1 - dq / R + P.silA * rlFbm(T.sil, u / P.silU, v / P.silU, 3); o.crest = 1 + P.crestA * rlGFbm(T.crest, pa / (P.crestU * RLK), 3.7 + qa / (P.crestQ * P.crestU * RLK), 2, 0.5); // peaks and saddles vary across the axis too (crestQ): read along it only, they ran as straight bands over the body's flat top, and the snow drew them as ruler-straight bars
  o.hill = P.hillA * rlFbm(T.hill, u / P.hillU, v / P.hillU, 3); o.room = r;
}
// the spur ridge at a fine texel (0 to 1): the foot reads it (spur crests reach the outline) and the range's heights and rock line too
const rlMsSpur = (T, P, x, y, G) => { const dx = x - G.mx, dy = y - G.my, pa = dx * G.ax + dy * G.ay, qa = -dx * G.ay + dy * G.ax; return 0.5 + 0.5 * rlRidged(T.spur, pa / (P.spurU[0] * RLK), qa / (P.spurU[1] * RLK), P.spurOct, P.spurWarp); };
// the range's height above the land at a fine texel: the body (squared, so the faces steepen toward the crest), the spurs (reaching past the body) and the fine facets,
// all times the rise from the foot; returns e (RL_MSE.pk: the big forms' peaks, for the snow caps)
const RL_MSE = { pk: 0 };
function rlMsRange(T, P, x, y, Ed, rise, cr, sp) {
  const u = x / RLK, v = y / RLK, fr = 0.5 + 0.5 * rlRidged(T.fine, u / P.fineU, v / P.fineU, P.fineOct, 0.3);
  const body = rlSmooth(P.body[0], P.body[1], Ed), reach = rlSmooth(-P.spurReach, 0.35, Ed); RL_MSE.pk = body * cr * rise;
  return P.H * cr * rise * (body * body * (1 - P.spurA) + P.spurA * sp * reach * (0.45 + 0.55 * body) + P.fineA * fr * reach);
}
// the generator: per wild its geometry, its own raster (heights, then colour in p58y), the cast shadows and valleys at the bake's resolution, the climb and neighbour maps
// the continued land's covers read (out.msCov, out.msNb), the natural half-resolution heights the Far relief reads (out.nw.hX), the land's heights with the wilds holding the
// land continued (out.nw.hXl) and the natural land's relief over them (out.nw.fS, ao, shd: no wild shades or lights the land outside it, p58z). Runs before the covers (p58n)
// and the materials (p58m).
function* rlMsGen(out) {
  const { HW, HH, TX, BW, BH, hid, hh, id } = out, D = RLD, F = RL_MS.F, FT = TX * F, VS = RL_P.vScale * RLK, NPh = HW * HH, NP = BW * BH, CL = RL_MS.climb;
  const T = { sil: rlNatT('massif:sil'), crest: rlGTable('natural:massif:crest'), spur: rlGTable('natural:massif:spur'), fine: rlGTable('natural:massif:fine'), hill: rlNatT('massif:hill'), foot: rlNatT('massif:foot'), gully: rlGTable('natural:massif:gully') };
  const TM = (out.msT = {}); let tq = performance.now(); const lap = (k) => { const n = performance.now(); TM[k] = +((TM[k] ?? 0) + n - tq).toFixed(1); tq = n; }; // the steps' times (review)
  // the land's height carried into the wild (pass 3b, p58z): the land's own height recipe run on the wild's texels with the land weights renormalised, so it meets the land at
  // the outline with no step; where the land weights fade (deep in a wide wild) it eases into a masked blur of the land and, where none reaches, the land's mean (window round the wilds)
  let wb = [Infinity, Infinity, -Infinity, -Infinity]; for (const w of WILDS) for (const c of w.cells) { const q = bboxOf(cells[c]); wb = [Math.min(wb[0], q[0]), Math.min(wb[1], q[1]), Math.max(wb[2], q[2]), Math.max(wb[3], q[3])]; }
  const mg = Math.ceil((0.45 * D * TX) / 2), wx0 = Math.max(0, Math.floor((wb[0] * TX) / 2) - mg), wy0 = Math.max(0, Math.floor((wb[1] * TX) / 2) - mg), wx1 = Math.min(HW - 1, Math.ceil((wb[2] * TX) / 2) + mg), wy1 = Math.min(HH - 1, Math.ceil((wb[3] * TX) / 2) + mg), ww = wx1 - wx0 + 1, wh = wy1 - wy0 + 1;
  const hs = new Float32Array(ww * wh), lm = new Float32Array(ww * wh); let hs0 = 0, hn0 = 0;
  for (let y = 0; y < wh; y++) for (let x = 0; x < ww; x++) { const k = (wy0 + y) * HW + wx0 + x, q = y * ww + x; hs[q] = hh[k]; lm[q] = hid[k] !== 255 && !RL_WILDK[hid[k]] ? 1 : 0; if (lm[q]) { hs0 += hh[k]; hn0++; } }
  const rad = (dD) => Math.max(1, Math.round((dD * D * TX) / 2)), hN = rlBoxBlur(hs, ww, wh, rad(0.03), 2, lm), mN = rlBoxBlur(lm, ww, wh, rad(0.03), 2), hFr = rlBoxBlur(hs, ww, wh, rad(0.12), 3, lm), mF = rlBoxBlur(lm, ww, wh, rad(0.12), 3);
  const hMean = hn0 ? hs0 / hn0 : 0.45, hLand = Float32Array.from(hh), HGn = new Float32Array(NPh).fill(1);
  for (let y = 0; y < wh; y++) for (let x = 0; x < ww; x++) { const k = (wy0 + y) * HW + wx0 + x; if (!RL_WILDK[hid[k]]) continue; const q = y * ww + x, far = hMean + (hFr[q] - hMean) * rlSmooth(0.01, 0.15, mF[q]); let v = far + (hN[q] - far) * rlSmooth(0.02, 0.25, mN[q]);
    const hc = rlMsLandH(out, wx0 + x, wy0 + y); if (hc !== null) { const wr = rlSmooth(0.02, 0.2, RL_MSLH.ws); v += (hc - v) * wr; HGn[k] = 1 + (RL_MSLH.g - 1) * wr; } hLand[k] = v; if ((y & 63) === 63 && x === 0) yield; }
  lap('landHeight'); yield;
  const boxes = [], boxOf = new Map(), o = {}, msCov = new Uint8Array(NP), msNb = new Uint8Array(NP).fill(255);
  for (const w of WILDS) {
    const G = rlMsGeom(w, out), pad = 3, X0 = Math.max(0, Math.floor(G.bb[0] * FT) - pad), Y0 = Math.max(0, Math.floor(G.bb[1] * FT) - pad), X1 = Math.min(BW * F - 1, Math.ceil(G.bb[2] * FT) + pad), Y1 = Math.min(BH * F - 1, Math.ceil(G.bb[3] * FT) + pad);
    const nw = X1 - X0 + 1, nh = Y1 - Y0 + 1, NH = nw * nh, h = new Float32Array(NH), hM = new Float32Array(NH), m = new Float32Array(NH), s01 = new Float32Array(NH), wd = new Float32Array(NH), pk = new Float32Array(NH), lf = new Float32Array(NH);
    const peaks = w.kind === 'peaks', P = RL_MS.peaks, PK = peaks ? P : RL_MS.mere, B = { G, w, X0, Y0, nw, nh, h, hM, m, s01, wd, pk, lf }; boxes.push(B); for (const c of w.cells) boxOf.set(c, B); // the fine raster's planes (lf: the landform, the rock and scree past the foot or the water)
    // the low-frequency fields at the bake's resolution over the box, with a margin of three blur radii (the inside mask is blurred there), read bilinearly by the fine raster;
    // Lj: the nearest outline edge's province
    const LS = RL_MS.lowStep, FL = F * LS, MG = 2, lx0 = Math.floor(X0 / FL) - 1 - MG, ly0 = Math.floor(Y0 / FL) - 1 - MG, lw = Math.ceil(nw / FL) + 3 + 2 * MG, lh = Math.ceil(nh / FL) + 3 + 2 * MG, NL = lw * lh, lt = FL / FT;
    const Lm = new Float32Array(NL), Lc = new Float32Array(NL), Lf = new Float32Array(NL), Lh = new Float32Array(NL), Lr = new Float32Array(NL), Lw = new Float32Array(NL), Lj = new Uint8Array(NL), Ls = new Float32Array(NL), Le = new Uint16Array(NL), kc = PK.cornerK * D;
    for (let y = 0; y < lh; y++) { const wy = ((ly0 + y + 0.5) * LS) / TX, ty = Math.max(0, Math.min(BH - 1, Math.floor(wy * TX)));
      for (let x = 0; x < lw; x++) { const wx = ((lx0 + x + 0.5) * LS) / TX, tx = Math.max(0, Math.min(BW - 1, Math.floor(wx * TX))), k = y * lw + x; let d = Infinity, d2 = Infinity, j = 255, e1 = null, e2 = null, ei = 0; for (let n = 0; n < G.ol.length; n++) { const e = G.ol[n], v = rlSegDist(wx, wy, e.a[0], e.a[1], e.b[0], e.b[1]); if (v < d) { d2 = d; e2 = e1; d = v; j = e.j; e1 = e; ei = n; } else if (v < d2) { d2 = v; e2 = e; } } Le[k] = ei;
        const ins = G.set.has(id[ty * BW + tx]); let kq = 0; if (e1 && e2) { const u1x = e1.b[0] - e1.a[0], u1y = e1.b[1] - e1.a[1], u2x = e2.b[0] - e2.a[0], u2y = e2.b[1] - e2.a[1], ca = Math.abs(u1x * u2x + u1y * u2y) / (Math.sqrt((u1x * u1x + u1y * u1y) * (u2x * u2x + u2y * u2y)) || 1); kq = kc * (1 - ca); } // the rounding by the corner's sharpness: none between edges that run on (or face each other), full at a right angle
        const hk = kq > 0 ? Math.max(kq - (d2 - d), 0) / kq : 0; Lw[k] = ins ? d : -d; Lj[k] = j; Ls[k] = ins ? d - hk * hk * kq * 0.25 : -d; } // Ls: the distance with the convex corners rounded (a polynomial smooth minimum of the two nearest edges)
      if ((y & 63) === 63) yield; }
    for (let y = 0; y < lh; y++) { const wy = ((ly0 + y + 0.5) * LS) / TX; for (let x = 0; x < lw; x++) { const wx = ((lx0 + x + 0.5) * LS) / TX, k = y * lw + x; rlMsLow(G, T, wx, wy, rlBilin(hLand, HW, HH, wx * TX / 2, wy * TX / 2), o); Lm[k] = o.m; Lc[k] = o.crest; Lf[k] = o.hF; Lh[k] = o.hill; Lr[k] = o.room; }
      if ((y & 63) === 63) yield; }
    Object.assign(B, { Lw, lx0, ly0, lw, lh, LS: FL });
    lap('low');
    // pass 3b, the foot (peaks) or the shore (mere): the landform past inset(x, y) D on the rounded distance; tp, the distance past it (world units), from which the range
    // climbs and the lake deepens
    const tp = new Float32Array(NH), Ls2 = new Float32Array(NH), hfq = new Float32Array(NH); B.tp = tp; let tpMax = 0; const A = PK.amps, Un = PK.units, nearO = G.ol.map(() => null); // first the raw inset (in tp) and the rounded distance (Ls2)
    for (let j = 0; j < nh; j++) {
      const y = (Y0 + j + 0.5) / FT, ly = (Y0 + j + 0.5) / FL - ly0, v = y / RLK;
      for (let i = 0; i < nw; i++) {
        const x = (X0 + i + 0.5) / FT, lxx = (X0 + i + 0.5) / FL - lx0, q = j * nw + i, u = x / RLK; wd[q] = rlBilin(Lw, lw, lh, lxx, ly); if (wd[q] < -RL_MS.outside) { m[q] = -1; continue; } // past the outline: clipped away when drawn
        let ins = PK.base + A[0] * rlFbm(T.foot, u / Un[0], v / Un[0], 2) + A[1] * rlFbm(T.foot, u / Un[1] + 31, v / Un[1], 2); hfq[q] = A[2] * rlFbm(T.foot, u / Un[2] + 57, v / Un[2], 2) + A[3] * rlVN(T.foot, u / Un[3] + 91, v / Un[3]); // the broad wander (ins) and the ragged edge (hfq), laid on after the soft floor so the foot is never a straight run on the outline
        if (peaks) { const sp = rlMsSpur(T, P, x, y, G); s01[q] = sp; ins += -P.spurK * (sp - P.spurMid) - P.gullyA * (rlRidged(T.gully, u / P.gullyU, v / P.gullyU, 2, 0.5) - P.gullyMid); } // the ridged noises have broad crests and narrow valleys: centred on their medians
        tp[q] = ins; Ls2[q] = rlBilin(Ls, lw, lh, lxx, ly); if (wd[q] > 0.005 * D && wd[q] < 0.015 * D && (q % 3) === 0) { const ei = Le[Math.max(0, Math.min(NL - 1, Math.floor(ly) * lw + Math.floor(lxx)))]; (nearO[ei] ??= []).push(ins); }
      }
      if ((j & 31) === 31) yield;
    }
    // each outline edge's foot (or shore) at the same median inset (PK.target D), whatever the noise draws along it; the shifts eased along the outline (no step where edges meet)
    const all = nearO.flat().filter((v) => v != null).sort((a, b) => a - b), med0 = all.length ? all[all.length >> 1] : PK.target, sh = nearO.map((a) => { if (!a || a.length < 8) return PK.target - med0; a.sort((p, q) => p - q); return PK.target - a[a.length >> 1]; });
    const SL = rlBoxBlur(Float32Array.from(Le, (n) => sh[n]), lw, lh, Math.max(1, Math.round((PK.shiftD * D) / lt)), 2); B.insetShift = sh.map((v) => +v.toFixed(4));
    for (let q = 0; q < NH; q++) { if (m[q] === -1) continue; const qi = q % nw, qj = (q - qi) / nw; let ins = tp[q] + rlBilin(SL, lw, lh, (X0 + qi + 0.5) / FL - lx0, (Y0 + qj + 0.5) / FL - ly0); ins = (ins + PK.insetMin + Math.sqrt((ins - PK.insetMin) ** 2 + PK.softK ** 2)) / 2; ins = (ins > PK.insetMax ? PK.insetMax : ins) + hfq[q]; ins = D * (ins < PK.insetFloor ? PK.insetFloor : ins); const t = Ls2[q] - ins; tp[q] = t; if (t > tpMax) tpMax = t; lf[q] = wd[q] > 0 ? rlSmooth(-PK.fe * D, PK.fe * D, t) : 0; } // a soft floor at insetMin (never a straight run of rock on the outline), the ragged edge on it
    lap('foot');
    for (let j = 0; j < nh; j++) {
      const y = (Y0 + j + 0.5) / FT, ly = (Y0 + j + 0.5) / FL - ly0, v = y / RLK;
      for (let i = 0; i < nw; i++) {
        const x = (X0 + i + 0.5) / FT, lxx = (X0 + i + 0.5) / FL - lx0, q = j * nw + i, u = x / RLK; if (m[q] === -1) continue;
        const hF = rlBilin(Lf, lw, lh, lxx, ly), tw = tp[q];
        if (!peaks) { const e = tw / (PK.fadeD * D); m[q] = e; h[q] = e > 0 ? hF - 0.08 - 0.25 * Math.min(1, e / PK.deep) : hF - 0.06 * rlSmooth(-0.15, 0, e); continue; } // the lake's floor (e: the depth past the shore in fadeD D)
        const mm = rlBilin(Lm, lw, lh, lxx, ly); m[q] = rlSmooth(P.body[0], P.body[1], mm);
        const fw = D * (P.footD[0] + (P.footD[1] - P.footD[0]) * (0.5 + 0.5 * rlFbm(T.foot, u / P.footU + 13, v / P.footU, 3))), r0 = rlBilin(Lr, lw, lh, lxx, ly), fwR = Math.min(fw, P.footR * Math.max(r0, 0.05 * D)); // the big forms' rise from the outline (graft 1), never wider than footR x the room
        const rise = wd[q] > 0 ? Math.max(rlSmooth(0, fwR, wd[q]), P.footK * rlSmooth(-P.lead * D, P.footRiseD * D, tw)) : 0; if (rise <= 0) { h[q] = hF; continue; } // past the foot the spurs and facets stand at least footK high; below it the land continued, flat as the land is
        const hv = rlMsRange(T, P, x, y, mm, rise, rlBilin(Lc, lw, lh, lxx, ly), s01[q]); hM[q] = hv; pk[q] = RL_MSE.pk; h[q] = hF + hv + rlBilin(Lh, lw, lh, lxx, ly) * rise;
      }
      if ((j & 31) === 31) yield;
    }
    B.tpMax = tpMax;
    lap('fine'); let mx = 0, mp = 0; for (let q = 0; q < NH; q++) { if (hM[q] > mx) mx = hM[q]; if (pk[q] > mp) mp = pk[q]; } B.hMax = mx || 1; B.pkMax = mp || 1; { const hb = rlBoxBlur(hM, nw, nh, Math.max(1, Math.round(RL_MS.snowBlurD * D * FT)), 2); for (let q = 0; q < NH; q++) pk[q] = hM[q] > 0 ? hb[q] + RL_MS.snowDetail * (hM[q] - hb[q]) : 0; const qs = []; for (let q = 0; q < NH; q += 3) if (pk[q] > 0) qs.push(pk[q]); qs.sort((a, b) => a - b); const at = (f) => (qs.length ? qs[Math.min(qs.length - 1, Math.floor(f * qs.length))] : 1); B.snowQ = [at(RL_MS.snowQ[0]), at(RL_MS.snowQ[1])]; } // the snow caps: the top of the big forms' peak-ness, by quantile (so a range's snow share is held whatever its shape)
    // the bake-resolution raster of the box (F x F means) and its margin: cast shadows toward the lower right (castSteps over castD D, the ray rising at tan 40) and valleys
    const ext = Math.ceil(RL_MS.peaks.castD * D * TX), bx0 = Math.max(0, Math.floor(X0 / F) - ext), by0 = Math.max(0, Math.floor(Y0 / F) - ext), bx1 = Math.min(BW - 1, Math.ceil(X1 / F)), by1 = Math.min(BH - 1, Math.ceil(Y1 / F));
    const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1, h1 = new Float32Array(bw * bh);
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) { const k = (y - by0) * bw + x - bx0, ix = x * F - X0, iy = y * F - Y0, kk = y * BW + x;
      if (ix >= 0 && iy >= 0 && ix + F <= nw && iy + F <= nh && RL_WILDK[id[kk]]) { let s = 0, se = 0; for (let b = 0; b < F; b++) for (let a = 0; a < F; a++) { s += h[(iy + b) * nw + ix + a]; se += hM[(iy + b) * nw + ix + a]; } h1[k] = s / (F * F);
        if (G.set.has(id[kk])) { const wdk = rlBilin(Lw, lw, lh, (x + 0.5) / LS - lx0, (y + 0.5) / LS - ly0), jk = Lj[Math.max(0, Math.min(NL - 1, Math.floor((y + 0.5) / LS - ly0) * lw + Math.floor((x + 0.5) / LS - lx0)))]; msNb[kk] = jk; // graft 2: the climb the continued land's covers read (1 + 254 e / eRef), to reachD into the wild
          if (wdk < CL.reachD * D || !peaks) msCov[kk] = 1 + Math.round(254 * (peaks ? Math.min(1, Math.max(se / (F * F) / CL.eRef, CL.depthK * rlSmooth(CL.d0 * D, CL.d1 * D, wdk))) : 0)); } } // the climb, or the depth (the lower slopes thin the covers too)
      else h1[k] = rlBilin(hh, HW, HH, (x + 0.5) / 2, (y + 0.5) / 2) * (RL_WILDK[id[kk]] ? 0 : 1) + (RL_WILDK[id[kk]] ? rlBilin(hLand, HW, HH, (x + 0.5) / 2, (y + 0.5) / 2) : 0); }
    yield;
    const dx1 = 1 / TX, stepW = (P.castD * D) / P.castSteps, stepT = stepW / dx1, cast = new Float32Array(bw * bh), hc = new Float32Array(bw * bh); // hc: the casters, the wild's own texels only (the land outside casts nothing on it)
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) { const k = (y - by0) * bw + x - bx0; hc[k] = G.set.has(id[y * BW + x]) ? h1[k] : -9; }
    for (let y = by0; y <= by1; y++) { for (let x = bx0; x <= bx1; x++) { const k = (y - by0) * bw + x - bx0; if (!G.set.has(id[y * BW + x])) continue; const z0 = h1[k] * VS; let occ = 0;
      for (let s = 1; s <= P.castSteps; s++) { const sx = x - bx0 + 0.5 - 0.70710678 * stepT * s, sy = y - by0 + 0.5 - 0.70710678 * stepT * s; if (sx < 0 || sy < 0) break; const zs = (rlBilin(hc, bw, bh, sx, sy) * VS - z0) * P.castK - stepW * s * RL_TAN_EL; if (zs > occ) occ = zs; }
      cast[k] = rlSmooth(P.castBias * D, 0.045 * D, occ); } if (((y - by0) & 63) === 63) yield; }
    lap('cast'); const hb = rlBoxBlur(h1, bw, bh, Math.max(1, Math.round(P.aoD * D * TX)), 2), ao = new Float32Array(bw * bh); for (let k = 0; k < bw * bh; k++) ao[k] = rlSmooth(0, 0.05, (hb[k] - h1[k]));
    Object.assign(B, { bx0, by0, bx1, by1, bw, bh, h1, cast, ao, U: new Float32Array(bw * bh * 3), Uk: new Uint8Array(bw * bh) }); yield; // U, Uk: the continued land's colour (CIELAB) at the bake's resolution, set by p58m and p58y
  }
  // the half-resolution natural heights (the Far relief's), the land's heights with the wilds holding the land continued (hXl) and, over hXl, the natural land's relief: the
  // hillshade and valleys (p58z) and the cast shadows (S5's march), for the land round the wilds and for the land continued inside them, so the land meets the range with no seam
  const hX = Float32Array.from(hh), hXl = Float32Array.from(hh), Fm = new Float32Array(NPh);
  for (let y = wy0; y <= wy1; y++) for (let x = wx0; x <= wx1; x++) { const k = y * HW + x; if (RL_WILDK[hid[k]]) hXl[k] = hLand[k]; }
  for (const B of boxes) for (let y = Math.floor(B.by0 / 2); y <= Math.ceil(B.by1 / 2) && y < HH; y++) for (let x = Math.floor(B.bx0 / 2); x <= Math.ceil(B.bx1 / 2) && x < HW; x++) {
    const k = y * HW + x; if (!B.G.set.has(hid[k])) continue; const bx = x * 2 + 1 - B.bx0, by = y * 2 + 1 - B.by0; if (bx < 0 || by < 0 || bx >= B.bw || by >= B.bh) continue;
    hX[k] = B.h1[by * B.bw + bx]; const ix = (x * 2 + 1) * F - B.X0, iy = (y * 2 + 1) * F - B.Y0; Fm[k] = ix >= 0 && iy >= 0 && ix < B.nw && iy < B.nh ? (B.w.kind === 'mere' ? rlSmooth(-0.01, 0.01, B.m[iy * B.nw + ix]) : Math.min(1, B.hM[iy * B.nw + ix] / (0.25 * B.hMax))) : 0;
  }
  const NR = rlMsNatRelief(out, hXl, HGn, [wx0, wy0, wx1, wy1]); yield;
  const shdN = Float32Array.from(out.shd), dxw = 2 / TX, sW = (RL_P.castD * D) / RL_P.castSteps, sT = sW / dxw, ext2 = Math.ceil((RL_P.castD * D * TX) / 2) + 2;
  for (const B of boxes) { for (let y = Math.max(0, Math.floor(B.by0 / 2)); y <= Math.min(HH - 1, Math.ceil(B.by1 / 2) + ext2); y++) for (let x = Math.max(0, Math.floor(B.bx0 / 2)); x <= Math.min(HW - 1, Math.ceil(B.bx1 / 2) + ext2); x++) {
    const k = y * HW + x; if (hid[k] === 255) continue; const z0 = hXl[k] * VS; let occ = 0;
    for (let s = 1; s <= RL_P.castSteps; s++) { const sx = x + 0.5 - 0.70710678 * sT * s, sy = y + 0.5 - 0.70710678 * sT * s; if (sx < 0 || sy < 0) break; const zs = rlBilin(hXl, HW, HH, sx, sy) * VS - (z0 + sW * s * RL_TAN_EL); if (zs > occ) occ = zs; }
    shdN[k] = rlSmooth(0, 0.04 * D, occ); } yield; }
  lap('landShadow'); out.ms = { boxes, boxOf, T }; out.msCov = msCov; out.msNb = msNb; out.nw = { hX, hXl, F: Fm, shd: shdN, fS: NR.fS, ao: NR.ao }; // hXl: the heights with every wild holding the land continued (the Far relief's land light and shadows read it, p59c)
}
// the continued land's colour for one bake texel (p58m writes the wild texels' own recipe; p58y fills the land texels of the box from the bake)
function rlMsUnderSet(out, k, L, a, b) { const B = out.ms.boxOf.get(out.id[k]); if (!B) return; const x = (k % out.BW) - B.bx0, y = Math.floor(k / out.BW) - B.by0; if (x < 0 || y < 0 || x >= B.bw || y >= B.bh) return; const q = y * B.bw + x; B.U[q * 3] = L; B.U[q * 3 + 1] = a; B.U[q * 3 + 2] = b; B.Uk[q] = 1; }
// review and memory: the fine planes are not needed once the colour pass has made the canvases and the bake's texels (rules judge graft 3: about 26 MB freed); the fine colours (B.img) stay for the edge decision at Near (p59x)
function rlMsFree(out) { for (const B of out.ms.boxes) for (const k of ['h', 'hM', 'm', 's01', 'wd', 'pk', 'lf', 'tp', 'h1', 'U', 'Uk', 'cast', 'ao']) B[k] = null; out.msCov = null; out.msNb = null; }

// ------------------------------------------------------------------ pass 3 fix: the ranges' foot beside dark ground (Natural only; natural/pass3/fix, the art verifier's defect 1)
// Pass 3 let the land run on inside the cells, so beside dark ground (forest, swamp, shaded hills: L* 10 to 33) both sides of the outline were the same dark ground and only the
// pale stone band could pass the colour-blind wild edge test: the wilds read as framed plaques. Now, where the land outside is too dark for the ink alone (black against it
// under x RL_MFT.mInk), the range comes down to the line: its foot rises there (p58x darkFoot), its rock faces reach the line and a lit talus apron lies along it, as light as
// the test needs against that land (the least L* whose pair with it reaches 20 / 12 x RL_MFT.mT in every vision, under the fog's haze and desaturation too, never over the
// cap). Elsewhere the land runs on. The land is read as each raster shows it: the bake (Mid in, at dpr 1), the start view's mip and the least zoom's mip, at the test's own
// distances for the zooms that draw each (RL_MFT.zooms), so the apron is RL_MFT.w D wide in the bake and wider in the mips (w1, w2), where a screen pixel covers more land.
// The stone band (p59x) stays the fallback wherever this does not reach. Seeded noise only; a pure function of the bake.
const RL_WFOOT = (() => { try { return new URLSearchParams(location.search).get('wildfoot') === 'talus' ? 'talus' : 'band'; } catch (e) { return 'band'; } })(); // the owner's comparison: ?wildfoot=talus draws the talus apron instead of the stone band
const RL_MFT = { talus: RL_WFOOT === 'talus', step: 3, mT: 1.3, mInk: 1.15, mDark: 1.3, mMere: 1.15, Lmin: 26, Lmax: 75, hue: [1.0, 5.0], w: 0.08, w1: 0.12, w2: 0.2, talMax: 99, streakL: 6, inkL: 32, fan: 0.6, fanU: 9, edge: 0.7, rockD: 0.06, gapD: 0.1, fadeD: 0.06, shadeL: 3,
  zooms: [2.4, 1.92, 1.5, 1.142, 1.0, 0.8, 0.62, 0.548, 0.5, 0.42, 0.342, 0.307], px: [6, 7, 8, 9, 9.5], shifts: [0, 0.5] };
const RL_MFT_LAB = { tal: null, ink: null };
const rlMftLabs = (c) => [rlLab(c), ...Object.values(CVD).map((m) => rlLab(rlCvd(c, m)))]; // a colour's Lab in each vision (rlPairDE's conversions, once)
const rlMftOk = (A, B, m) => { if (dE2000(A[0], B[0]) < 20 * m) return false; for (let q = 1; q < A.length; q++) if (dE2000(A[q], B[q]) < 12 * m) return false; return true; };
function rlMftTal(L) { const o = [0, 0, 0]; rlLabTo(L, RL_MFT.hue[0], RL_MFT.hue[1], o, 0); return o; }
// the land's colour at a world point as the raster of mip level L shows it: the Lab mean of each 2^L x 2^L block of land texels (the mips are Lab means), bilinear between blocks
function rlMftLand(out, cache, x, y, L) {
  const { BW, BH, TX, LT } = out, d8 = out.msImg.data, f = 1 << L, gx = (x * TX) / f - 0.5, gy = (y * TX) / f - 0.5, ix = Math.floor(gx), iy = Math.floor(gy), ax = gx - ix, ay = gy - iy; let l = 0, a = 0, b = 0, ws = 0;
  for (const [dx, dy, wt] of [[0, 0, (1 - ax) * (1 - ay)], [1, 0, ax * (1 - ay)], [0, 1, (1 - ax) * ay], [1, 1, ax * ay]]) {
    const bx = ix + dx, by = iy + dy; if (wt <= 0 || bx < 0 || by < 0 || bx * f >= BW || by * f >= BH) continue; const key = (L * 4096 + by) * 4096 + bx; let c = cache.get(key);
    if (c === undefined) { let n = 0, s0 = 0, s1 = 0, s2 = 0; for (let yy = 0; yy < f; yy++) for (let xx = 0; xx < f; xx++) { const k = (by * f + yy) * BW + bx * f + xx, o = k * 4; if (LT[k] >= 7 || LT[k] === 255 || d8[o + 3] < 255) continue; const q = rgb2lab([d8[o], d8[o + 1], d8[o + 2]]); s0 += q[0]; s1 += q[1]; s2 += q[2]; n++; }
      c = n ? [s0 / n, s1 / n, s2 / n] : null; cache.set(key, c); }
    if (c) { l += wt * c[0]; a += wt * c[1]; b += wt * c[2]; ws += wt; } }
  if (ws < 0.25) return null; const o3 = [0, 0, 0]; rlLabTo(l / ws, a / ws, b / ws, o3, 0); return o3;
}
// per outline edge of one wild, every RL_MFT.step world units: for each raster (0 the bake and fine, 1 the start view's mip, 2 the least zoom's), whether the land is too dark for
// the ink (dark) and the least talus L* that passes against it (need); runs closed over gapD D and faded over fadeD D along the edge
function rlMftProfile(out, w) {
  if (!RL_MFT_LAB.tal) { RL_MFT_LAB.tal = []; for (let L = 0; L <= 100; L++) RL_MFT_LAB.tal.push(rlMftLabs(rlMftTal(L))); RL_MFT_LAB.ink = rlMftLabs([0, 0, 0]); }
  const cache = new Map(), F = RL_P.fog.natural, TAL = RL_MFT_LAB.tal, INK = RL_MFT_LAB.ink, D = RLD, vars = [null, { sat: F.outSat }]; // the land as drawn in sight and out of sight; unexplored land's haze is left to the live decision (p59x), which draws the stone band there while it lasts
  const Z = RL_MFT.zooms.map((s) => { const tpp = out.TX / s, lvl = tpp > 2.4 ? 2 : tpp > 1.2 ? 1 : 0; return { s, lvl, r: tpp <= RL_MSD.tpp || (tpp <= RL_MSD.tpp1 && lvl !== 0) || lvl === 0 ? 0 : lvl }; }); // the raster that draws the wild at each zoom (rlMsSource, rlMipLevel at dpr 1)
  const edges = [];
  for (const e of rlWildOutline(w)) {
    const [ax, ay] = e.a, [bx, by] = e.b, Lg = Math.hypot(bx - ax, by - ay); if (Lg < 1e-6) continue; const n = Math.max(2, Math.ceil(Lg / RL_MFT.step) + 1); let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
    if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; }
    const dark = [0, 1, 2].map(() => new Float32Array(n)), need = [0, 1, 2].map(() => new Float32Array(n));
    for (let k = 0; k < n; k++) { const t = k / (n - 1), x = ax + (bx - ax) * t, y = ay + (by - ay) * t, cur = [RL_MFT.Lmin, RL_MFT.Lmin, RL_MFT.Lmin];
      for (const z of Z) for (const sh of RL_MFT.shifts) { const cs = RL_MFT.px.map((p) => rlMftLand(out, cache, x + (nx * (p + sh)) / z.s, y + (ny * (p + sh)) / z.s, z.lvl)).filter(Boolean); if (cs.length < 3) continue;
        cs.sort((p, q) => rlLumOf(...p) - rlLumOf(...q)); const G0 = cs[cs.length >> 1];
        for (const V of vars) { const GL = rlMftLabs(V ? rlApplyState(G0, V) : G0), inkG = rlMftOk(INK, GL, RL_MFT.mInk); if (!rlMftOk(INK, GL, w.kind === 'mere' ? RL_MFT.mMere : RL_MFT.mDark)) dark[z.r][k] = 1; // dark: the land continued inside (about as dark as this) would not clear the ink
          while (cur[z.r] <= RL_MFT.Lmax && !(inkG ? rlMftOk(INK, TAL[cur[z.r]], RL_MFT.mInk) : rlMftOk(TAL[cur[z.r]], GL, RL_MFT.mT))) cur[z.r]++; } } // the rock needs only to clear the ink where the ink clears the land, else to pass against the land itself
      for (let r = 0; r < 3; r++) need[r][k] = cur[r] > RL_MFT.Lmax ? 99 : cur[r]; }
    const gap = Math.round((RL_MFT.gapD * D) / (Lg / (n - 1))), fd = (RL_MFT.fadeD * D) / (Lg / (n - 1));
    for (let r = 0; r < 3; r++) { const dk = dark[r], nd = need[r], wv = new Float32Array(n), nv = new Float32Array(n); let last = -1e9;
      for (let k = 0; k < n; k++) if (dk[k]) { if (k - last > 1 && k - last <= gap + 1) for (let j = last + 1; j < k; j++) dk[j] = 1; last = k; } // close short gaps
      for (let k = 0; k < n; k++) { let a = 0, m = 0; for (let j = Math.max(0, Math.floor(k - fd)); j <= Math.min(n - 1, Math.ceil(k + fd)); j++) if (dk[j]) { a = Math.max(a, 1 - Math.abs(k - j) / fd); m = Math.max(m, nd[j]); } wv[k] = a; nv[k] = m; }
      dark[r] = wv; need[r] = nv; }
    edges.push({ e, ax, ay, bx, by, Lg, n, nx, ny, dark, need, s0: edges.reduce((a, E) => a + E.Lg, 0) }); // s0: the edge's start along the outline (the scree's streaks run across it)
  }
  return edges;
}
// the nearest outline edge of a wild to a world point: { E, t, d } (d unsigned, world units)
function rlMftNear(edges, x, y) { let best = null, bd = Infinity; for (const E of edges) { const dx = E.bx - E.ax, dy = E.by - E.ay, t = Math.max(0, Math.min(1, ((x - E.ax) * dx + (y - E.ay) * dy) / (E.Lg * E.Lg))), d = Math.hypot(x - E.ax - dx * t, y - E.ay - dy * t); if (d < bd) { bd = d; best = { E, t, d }; } } return best; }
const rlMftAt = (N, r) => { const f = N.t * (N.E.n - 1), i = Math.min(N.E.n - 2, Math.floor(f)), a = f - i, dk = N.E.dark[r], nd = N.E.need[r]; return [dk[i] + (dk[i + 1] - dk[i]) * a, Math.max(nd[i], nd[i + 1])]; }; // the dark weight (linear) and need (the larger) at the point
// the talus lightness for a need: never under Lmin, never over the cap (where the test needs more, the stone band takes over)
const rlMftL = (need, Lcap) => Math.max(RL_MFT.Lmin, Math.min(Lcap - 0.6, need + 1.5));
// the talus apron: kept only where the need is at most talMax (beside the darkest ground, where a mid-grey scree is light enough); beside lighter ground the scree would have to be
// pale, so the stone band (p59x) is drawn there instead. Its lightness is the need plus scree streaks (streak 0..1) and the light on lit slopes, never over the cap
const rlMftKeep = (need, Lcap) => 1 - rlSmooth(RL_MFT.talMax - 2, RL_MFT.talMax + 2, rlMftL(need, Lcap));
const rlMftTalusL = (need, Lcap, streak, sv) => Math.min(Lcap - 0.6, rlMftL(need, Lcap) + RL_MFT.streakL * streak + RL_MFT.shadeL * Math.max(0, sv));
// the mips: the apron widened to RL_MFT.w1 (the start view's mip) and w2 (the least zoom's), with the need of the land as that mip shows it; after the mips' calm (rlMsMips).
// RB.mft2: the apron's weight at the quarter resolution (the least zoom's mip, the Far relief's raster), so the Far relief leaves the apron unshaded
// with the stone band (the default): the rock within the test's reach of the line is never darker than inkL, where black ink alone clears it, so beside land the ink clears
// too (L* 28 and up) the band is not needed; the zone is the bake's RL_MFT.w D and the mips' w1 and w2 D, as for the talus; rock only (the continued land is left as it is)
function rlMftMipsBand(out, R) {
  const { BW, BH, id } = out, cls = out.mw && out.mw.cls; if (!cls) return;
  for (const [cv, r, wk] of [[R.mip1, 1, RL_MFT.w1], [R.mip2, 2, RL_MFT.w2]]) {
    const w = cv.width, h = cv.height, f = BW / w, g = cv.getContext('2d'), img = g.getImageData(0, 0, w, h), d = img.data, m2 = r === 2 ? new Uint8Array(w * h) : null, wT = wk * RLD;
    for (const B of out.ms.boxes) { if (B.w.kind !== 'peaks') continue; const x0 = Math.max(0, Math.floor(B.bx0 / f)), y0 = Math.max(0, Math.floor(B.by0 / f)), x1 = Math.min(w - 1, Math.ceil(B.bx1 / f)), y1 = Math.min(h - 1, Math.ceil(B.by1 / f));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = y * w + x, o = k * 4, kk = Math.min(BH - 1, Math.floor((y + 0.5) * f)) * BW + Math.min(BW - 1, Math.floor((x + 0.5) * f)); if (!B.G.set.has(id[kk]) || d[o + 3] < 255) continue;
        const wx = ((x + 0.5) * f) / out.TX, wy = ((y + 0.5) * f) / out.TX; let dd = Infinity; for (const e of B.G.ol) dd = Math.min(dd, rlSegDist(wx, wy, e.a[0], e.a[1], e.b[0], e.b[1])); const zf = 1 - rlSmooth(RL_MFT.edge * wT, wT, dd); if (zf <= 0.001) continue;
        let rs = 0, n = 0; for (let b = 0; b < f; b++) for (let a = 0; a < f; a++) { const q = Math.min(BH - 1, y * f + b) * BW + Math.min(BW - 1, x * f + a); if (B.G.set.has(id[q])) { rs += cls[q] === 255 ? 1 : 0; n++; } } const rw = n ? (rs / n) * zf : 0; if (rw <= 0.001) continue;
        const c = rgb2lab([d[o], d[o + 1], d[o + 2]]); if (c[0] < RL_MFT.inkL) rlLabTo(c[0] + (RL_MFT.inkL - c[0]) * rw, c[1], c[2], d, o); if (m2) m2[k] = Math.round(255 * rw); } }
    g.putImageData(img, 0, 0); if (m2) out.mft2 = m2;
  }
}
function rlMftMips(out, R) {
  if (out.ms && !RL_MFT.talus) { rlMftMipsBand(out, R); return; }
  if (!out.ms || !RL_MFT.talus) return; const { BW, BH, id } = out, T = out.ms.mftT, Lcap = out.nwCap ? out.nwCap.cap : 55;
  for (const [cv, r, wk] of [[R.mip1, 1, RL_MFT.w1], [R.mip2, 2, RL_MFT.w2]]) {
    const w = cv.width, h = cv.height, f = BW / w, g = cv.getContext('2d'), img = g.getImageData(0, 0, w, h), d = img.data, m2 = r === 2 ? new Uint8Array(w * h) : null;
    for (const B of out.ms.boxes) { if (B.w.kind !== 'peaks' || !B.mft) continue; const x0 = Math.max(0, Math.floor(B.bx0 / f)), y0 = Math.max(0, Math.floor(B.by0 / f)), x1 = Math.min(w - 1, Math.ceil(B.bx1 / f)), y1 = Math.min(h - 1, Math.ceil(B.by1 / f));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = y * w + x, o = k * 4, kk = Math.min(BH - 1, Math.floor((y + 0.5) * f)) * BW + Math.min(BW - 1, Math.floor((x + 0.5) * f)); if (!B.G.set.has(id[kk]) || d[o + 3] < 255) continue;
        const wx = ((x + 0.5) * f) / out.TX, wy = ((y + 0.5) * f) / out.TX, N = rlMftNear(B.mft, wx, wy); if (!N) continue; const [dk, nd] = rlMftAt(N, r); if (dk <= 0.001) continue;
        const wT = wk * RLD * (1 + RL_MFT.fan * (0.5 + 0.5 * rlFbm(T, wx / RLK / RL_MFT.fanU, wy / RLK / RL_MFT.fanU, 2))), tw = dk * (1 - rlSmooth(RL_MFT.edge * wT, wT, N.d)); if (tw <= 0.001) continue;
        const c = rgb2lab([d[o], d[o + 1], d[o + 2]]), Lt = Math.max(c[0], rlMftTalusL(nd, Lcap, 0.4, 0)), tk = tw * rlMftKeep(nd, Lcap); if (tk <= 0.001) continue; rlLabTo(c[0] + (Lt - c[0]) * tk, c[1] + (RL_MFT.hue[0] - c[1]) * tk * 0.7, c[2] + (RL_MFT.hue[1] - c[2]) * tk * 0.7, d, o); if (m2) m2[k] = Math.round(255 * Math.min(1, tk * 1.3)); } }
    g.putImageData(img, 0, 0); if (m2) out.mft2 = m2;
  }
}
// the mere: its shore re-derived with the profile's dark flag (blurred along the outline like p58x's), so the water meets the outline exactly where the fringe would not clear the
// ink, and the meadow fringe stays in the coves beside light ground; only the water's extent (B.m) changes, the heights stay p58x's
function rlMftMereShore(out, B) {
  const { lw, lh, lx0, ly0, LS, Lw, G } = B, TX = out.TX, raw = new Float32Array(lw * lh), Lm = new Float32Array(lw * lh), o = {};
  for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) { const N = rlMftNear(B.mft, ((lx0 + x + 0.5) * LS) / (TX * RL_MS.F), ((ly0 + y + 0.5) * LS) / (TX * RL_MS.F)); raw[y * lw + x] = N ? rlMftAt(N, 0)[0] : 0; }
  const dk = rlBoxBlur(raw, lw, lh, Math.max(1, Math.round((RL_MS.peaks.darkBlurD * RLD * TX * RL_MS.F) / LS)), 2);
  for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) { const k = y * lw + x; rlMsLow(G, out.ms.T, ((lx0 + x + 0.5) * LS) / (TX * RL_MS.F), ((ly0 + y + 0.5) * LS) / (TX * RL_MS.F), Lw[k], 0, o, dk[k]); Lm[k] = o.m; }
  for (let j = 0; j < B.nh; j++) for (let i = 0; i < B.nw; i++) { const q = j * B.nw + i; if (B.wd[q] < -RL_MS.outside) continue; B.m[q] = rlBilin(Lm, lw, lh, (B.X0 + i + 0.5) / LS - lx0, (B.Y0 + j + 0.5) / LS - ly0); }
  B.Ldk = dk;
}

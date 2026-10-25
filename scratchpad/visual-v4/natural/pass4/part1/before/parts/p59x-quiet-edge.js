// ------------------------------------------------------------------ pass 3: the wilds' outline in the natural view (Natural look, Ownership mode)
// The outline is the approved 3 px ink (never tinted, faded or fogged), black (#000000, L* 0; v4 drew #0B0A09, L* 3) so it alone reaches 20 / 12 against more land, plus, only where
// the colour-blind wild edge test needs it, a quiet edge: a 2 px band of stone just inside the ink, in the land side's hue (x RL_QE.hueK), its lightness the least that
// reaches 20 / 12 x RL_QE.mS against both sides (never the cream rim). The test is the verifier's (rlWildEdgeCheck): across the outline, W the wild's ground 6 to 9 px
// inside and G the land 6 to 9.5 px outside; a sample passes when W and G differ by 20 / 12 (normal / worst deficiency), or a line pixel within 4 px differs by that from both.
// Rules judge graft 1: the decision is made from data, once per zoom (cached by the bake, the look, fog, ownership, wash, the realm tint, the selection and the zoom), so a pan
// never changes it and nothing is read back from the screen. It samples the sources the composite draws at this zoom: the wilds' own fine raster, the bake or the mips
// (rlMsSource), the land's bake or mips, the Far relief's soft-light, and the land side's wash, realm tint, glow and hem, fog and selected tint; the composite's own grain
// (the Near detail) is covered by +-RL_QE.jit L* on the land and half that on the wild. Graft 2: the pair and stone margins are x 1.2 (the ink's x 1.1, a departure: at x 1.2 the
// light band came back on 5 to 16 points more of the outline, start 0.64 to 0.74; design-final.md "Pass 3 decisions"), and a hovered or
// linked neighbour's tint is decided again for that one province and drawn live over the static layer (rlDrawWildFocusLive; pass 2 left that gap open).
// Pass 3b (the owner's answer of 2026-10-24, "Soft, like province lines"): in the natural view the outline is drawn only in focus, at the colour-blind floor as before:
// round the hovered, linked and selected province (the wild itself: its whole outline; a neighbour: the edges it shares with a wild) and along a planned or previewed march
// that meets a wild (the edges its provinces share with a wild, and the whole outline of a wild its straight line crosses: the one it goes around or that blocks it). At rest
// nothing is drawn: the landform marks the extent (p58x, p58y). The decision is still made for the edges near the frame at each zoom (so a hover never waits for it).
// Clear, the Terrain mode, the data modes and the passability view draw every edge (p59b). The ?wildink=2 comparison is removed (the owner's answer settles the edge).
const RL_QE = { inkPx: 3, inkHex: '#000000', edgePx: 1.25, edgeDev: 2.5, Lmin: 30, Lmax: 92, hueK: 0.6, m: 1.2, mInk: 1.1, mS: 1.2, jit: 4, jit0: 1.5, stepPx: 2, padPx: 2, gapPx: 16, fadePx: 8, minRunPx: 24, whole: 0.9, rung: 1.01, ms: 0, n: 0, hov: new Map(), pre: { t: 0, n: 0, ms: 0, edges: 0 } };
const RL_QE_INK = hex2rgb(RL_QE.inkHex), RL_WRIM = { key: '', map: null, tot: 0, edges: 0, ms: 0, lru: new Map(), n: 0 };
const rlQeBand = () => Math.max(RL_QE.edgePx, RL_QE.edgeDev / dpr); // pass 3 fix: edgePx 2 to 1.25 CSS px, so at double density the band is 2.5 device px (it was 4), half the weight of the frame the owner saw; at 1x it stays 2.5 px // the stone band's width (CSS px): edgePx, but never under edgeDev device px, so at any slant and sub-pixel offset one pixel across it is wholly stone (at 2 px and dpr 1 none may be: seed 31's sweep drew 0.96)
const rlQuietEdgeOn = () => rlFaintOn() && !view.pass && !RL_DBG.fullRim && !!RB.ms;
// a source the composite draws: RGBA bytes, size, texels per world unit and an offset (texels); sampled bilinearly in sRGB, as drawImage does
const rlQeSrc = (im, k, ox = 0, oy = 0) => ({ d: im.data, w: im.width, h: im.height, k, ox, oy });
const RL_QE_P = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5]; // the decision's profile across the line (px from it), every half pixel
const rlQeBlurMed = (A, offs) => { const v = offs.map((o) => { const i = RL_QE_P.indexOf(o), q = [A[i - 2], A[i - 1], A[i], A[i + 1], A[i + 2]].filter(Boolean); return q.length >= 3 ? [0, 1, 2].map((z) => q.reduce((s, c) => s + c[z], 0) / q.length) : null; }).filter(Boolean); if (!v.length) return null; for (const c of v) c.l = rlLumOf(c[0], c[1], c[2]); v.sort((p, q) => p.l - q.l); return v[v.length >> 1]; }; // the median, over offs, of the profile box-blurred over 2 px
function rlQeAt(S, x, y) {
  let fx = x * S.k - S.ox - 0.5, fy = y * S.k - S.oy - 0.5; if (fx < 0) fx = 0; if (fy < 0) fy = 0; if (fx > S.w - 1) fx = S.w - 1; if (fy > S.h - 1) fy = S.h - 1;
  const ix = fx | 0, iy = fy | 0, ax = fx - ix, ay = fy - iy, ix1 = ix + 1 < S.w ? ix + 1 : ix, iy1 = iy + 1 < S.h ? iy + 1 : iy, d = S.d, o = [(iy * S.w + ix) * 4, (iy * S.w + ix1) * 4, (iy1 * S.w + ix) * 4, (iy1 * S.w + ix1) * 4], wt = [(1 - ax) * (1 - ay), ax * (1 - ay), (1 - ax) * ay, ax * ay];
  let r = 0, g = 0, b = 0, ws = 0; for (let q = 0; q < 4; q++) { if (d[o[q] + 3] < 255 || wt[q] <= 0) continue; r += wt[q] * d[o[q]]; g += wt[q] * d[o[q] + 1]; b += wt[q] * d[o[q] + 2]; ws += wt[q]; }
  return ws > 0.25 ? [r / ws, g / ws, b / ws] : null;
}
const rlSoftLight = (c, sgrey, k) => { if (k <= 0) return c; const s = sgrey / 255; return c.map((v) => { const cb = v / 255, D = cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb), r = s <= 0.5 ? cb - (1 - 2 * s) * cb * (1 - cb) : cb + (2 * s - 1) * (D - cb); return 255 * (cb + (r - cb) * k); }); }; // canvas 'soft-light'
// the decision: edge key (c:j) -> { N samples, seen, fail, L, fails (the failing W, G and water colours), hue }; hov: a province whose live tint is added (-1: none)
// Polish (pass-2 verifier: the decision cost up to 209 ms each time a zoom settled): each edge is decided once per key (a pure function of the key and the edge), and only the
// edges near the frame being drawn (the static layer's cached frame, VW, with 12 px of air) are decided; a pan into new ground decides the new edges and changes none already
// decided. The decision is cached by zoom rung: the scale rounded to 1% steps (RL_QE.rung; a sample moves under 0.05 px at the line, against the half pixel the decision
// already allows for a pan), with the mip and the wilds' source taken at the true scale, so a zoom that lands in a rung already decided costs nothing. The last 24 rungs are
// kept (RL_WRIM.lru), and while the page is idle the rungs a player reaches next are decided ahead (rlQePrefetch: Z, Fit, the least and closest zooms, Mid, and one to three
// wheel steps either way from the scale on screen). Each province's state, tint and fog, and each colour bin's Lab in the four visions, are worked out once, not per sample.
const rlQeRung = (s) => Math.exp(Math.round(Math.log(s) / Math.log(RL_QE.rung)) * Math.log(RL_QE.rung));
function rlQuietEdgeMap(hov = -1, at = null) {
  const Lk = RB.L.natural; if (!Lk || !Lk.mb1 || !RB.ms) return null; const nb = new Set(); for (const w of WILDS) for (const e of rlWildOutline(w)) nb.add(e.j);
  const sp = state.sel && state.sel.type === 'prov' && nb.has(state.sel.id) ? state.sel.id : -1, s0 = at ? at.s : rlQeRung(cam.s), lvl = at ? at.lvl : rlMipLevel(), src = at ? at.src : rlMsSource();
  const fk = (RB.ready ? rlSmooth(RL_P.farRelief.dpx0, RL_P.farRelief.dpx1, s0 * MED_DIAM) : 0) * decoAlpha, nk = RB.ready ? rlSmooth(RL_P.nearDetail.tpp0, RL_P.nearDetail.tpp1, s0 * RB.TX) : 0; // the Far relief's and the Near detail's strength at the rung
  const key = [RB.ver, RB.lookVer, view.tint, sp, s0.toFixed(5), dpr, lvl, src, fk.toFixed(3), nk.toFixed(3), decoTo, [...nb].map((i) => (prov[i] ? (fogOf(i) ?? '-')[0] + (prov[i].owner ?? '') + rlWashOf(i, decoTo >= 0.5).toFixed(3) : '')).join(',')].join('|');
  if (at && at.keyOnly) return key;
  const hk = key + '|' + hov; if (hov >= 0 && RL_QE.hov.has(hk)) return RL_QE.hov.get(hk);
  const pad = 12 / s0, vw = [VW[0] - pad, VW[1] - pad, VW[2] + pad, VW[3] + pad], ent = hov < 0 ? (RL_WRIM.lru.get(key) ?? { map: new Map(), tot: 0 }) : { map: new Map(), tot: 0 }, todo = new Set();
  for (const w of WILDS) for (const e of rlWildOutline(w)) { const k = e.c + ':' + e.j; if (ent.map.has(k)) continue; if (hov >= 0 ? e.j === hov : (at && at.all) || Math.max(e.a[0], e.b[0]) >= vw[0] && Math.min(e.a[0], e.b[0]) <= vw[2] && Math.max(e.a[1], e.b[1]) >= vw[1] && Math.min(e.a[1], e.b[1]) <= vw[3]) todo.add(k); }
  if (hov < 0) { if (!at) RL_WRIM.lru.delete(key); if (!RL_WRIM.lru.has(key)) RL_WRIM.lru.set(key, ent); while (RL_WRIM.lru.size > 24) RL_WRIM.lru.delete(RL_WRIM.lru.keys().next().value); if (!todo.size) { if (!at) Object.assign(RL_WRIM, { key, map: ent.map, tot: ent.tot, edges: ent.map.size }); return ent.map; } }
  const budget = at && at.budget ? performance.now() + at.budget : Infinity; // the idle prefetch decides edges until its slice is spent; the rest wait for the next slice
  const t0 = performance.now(), { TX, BW } = RB, F = RL_MS.F, FP = RL_P.farRelief, FG = RL_FOG(), jit = RL_QE.jit0 + (RL_QE.jit - RL_QE.jit0) * nk, map = ent.map; let tot = ent.tot, ne = 0; // jit: the Near detail's grain only where it is drawn
  const land = rlQeSrc(lvl === 2 ? Lk.mb2 : lvl === 1 ? Lk.mb1 : Lk.img, (TX * (lvl === 2 ? Lk.mb2.width : lvl === 1 ? Lk.mb1.width : BW)) / BW), bake = rlQeSrc(Lk.img, TX);
  const fine = new Map(); if (src === 'fine') for (const B of RB.ms.boxes) if (B.img) for (const c of B.w.cells) fine.set(c, rlQeSrc(B.img, TX * F, B.X0, B.Y0));
  if (fk > 0.02) rlFarRaster(); if (!RL_DBG.noGlow) rlGlow(false); // pass 3 fix (the verifier's timing defect): the sources this rung draws are made before it is decided, so a rung decided ahead by the idle prefetch (from the start view, where the Far relief is not drawn yet) is the same as one decided on screen
  const FR = fk > 0.02 && RL_FR.img ? rlQeSrc(RL_FR.img, (TX * RL_FR.img.width) / BW) : null, GL = !RL_DBG.noGlow && GLOW && GLOW.img ? rlQeSrc(GLOW.img, TX / 2) : null;
  const far = (c, x, y, k) => { if (!FR || !c) return c; const g = rlQeAt(FR, x, y); return g ? rlSoftLight(c, g[0], k) : c; };
  const fkF = src === 'fine' ? rlMsFineKAt(s0) : src === 'bake' ? rlMsBakeKAt(s0) : 1, mix = (a, b, t) => (!a || !b ? a ?? b : a.map((v, z) => v + (b[z] - v) * t)); // pass 3b: the fine raster fades in over the bake; the landform layer ('bake', p58z) over the land's own mip, as the canvas composites it
  const wildAt = (x, y, w) => { const c = provinceAt(x, y); if (c < 0 || !isWild(c)) return null; let col; if (src === 'fine') { col = rlQeAt(fine.get(c), x, y); if (fkF < 0.999) col = mix(rlQeAt(bake, x, y), col, fkF); } else if (src === 'bake') { const Q = RB.mw && RB.mw.lfCv ? RB.mw.lfCv.find((q) => q.B.G.set.has(c)) : null; const lc = rlQeAt(land, x, y); col = Q ? rlMsLandformAt(Q, x, y, lc) : lc; if (Q && fkF < 0.999) col = mix(lc, col, fkF); } else col = rlQeAt(land, x, y); return col ? far(col, x, y, fk) : null; };
  const Sc = new Map(), stOf = (i) => { let v = Sc.get(i); if (!v) { const hv = i === sp ? rlTintOf(i, true) : i === hov ? rlTintOf(i, false) : null; v = { S: rlStateOf(i, 'natural', true), fogU: rlFogAt(i) === 'unexplored', hv: hv ? [hex2rgb(hv[0]), hv[1]] : null }; Sc.set(i, v); } return v; }; // per province, once per call
  const landAt = (x, y, j) => { const i = provinceAt(x, y); if (i < 0) return null; if (isWild(i)) return wildAt(x, y); let c = rlQeAt(land, x, y); if (!c) return null; const { S, fogU, hv: hvc } = stOf(i);
    if (S.wc) c = rlApplyState(c, { wc: S.wc, wa: S.wa }); c = far(c, x, y, fk * (fogU ? 1 - FP.fogK : 1)); if (S.tint) c = rlApplyState(c, { tint: S.tint });
    if (GL) { const gx = x * GL.k - 0.5, gy = y * GL.k - 0.5, q = (Math.max(0, Math.min(GL.h - 1, Math.round(gy))) * GL.w + Math.max(0, Math.min(GL.w - 1, Math.round(gx)))) * 4, a = (GL.d[q + 3] / 255) * decoAlpha; if (a > 0) c = c.map((v, z) => v + (GL.d[q + z] - v) * a); }
    const hz = fogU ? FG.haze * decoAlpha : 0, sat = S.sat * decoAlpha;
    return rlApplyState(c, { haze: hz, sat, hov: hvc }); };
  const lum = (c) => { if (c && c.l === undefined) c.l = rlLumOf(c[0], c[1], c[2]); return c; }, srt = (a) => a.filter(Boolean).sort((p, q) => p.l - q.l), med = (a) => { const s2 = srt(a); return s2.length ? s2[s2.length >> 1] : null; }; // each colour's luminance once (the same order as before)
  const RAIL = []; for (const i of nb) if (prov[i] && prov[i].owner) for (const e of RL_EDGES[i]) if (isRealmEdge(i, e)) RAIL.push(e); const railPx = 7, selfPx = RL_QE.inkPx / 2 + rlQeBand() + 1.5; // samples a realm rail or the wild's own outline (a corner) may cover are left to those lines
  const nearSeg = (x, y, segs, r, skip) => segs.some((e) => e !== skip && rlSegDist(x, y, e.a[0], e.a[1], e.b[0], e.b[1]) < r);
  const memo = RL_QE.memo ?? (RL_QE.memo = new Map()), qk = (c) => ((Math.round(c[0]) >> 1) << 14) | ((Math.round(c[1]) >> 1) << 7) | (Math.round(c[2]) >> 1), qc = (k) => [((k >> 14) & 127) * 2 + 0.5, ((k >> 7) & 127) * 2 + 0.5, (k & 127) * 2 + 0.5]; // the memo's result is a function of its key alone (the bin's centre is tested), so no decision depends on what an earlier one cached: the natural start view drew two frames over three loads when it did
  const labs = RL_QE.labs ?? (RL_QE.labs = new Map()), labOf = (k) => { let v = labs.get(k); if (!v) { const c = qc(k); v = [rlLab(c), ...Object.values(CVD).map((m) => rlLab(rlCvd(c, m)))]; if (labs.size > 200000) labs.clear(); labs.set(k, v); } return v; }; // a bin's Lab in each vision, once (rlPairDE's own conversions)
  const ok = (a, b, m) => { const ka = qk(a), kb = qk(b), k = (ka * 2097152 + kb) * 32 + Math.round(m * 10); let v = memo.get(k); if (v === undefined) { if (memo.size > 400000) memo.clear(); const A = labOf(ka), B = labOf(kb); let cvd = Infinity; for (let q = 1; q < A.length; q++) cvd = Math.min(cvd, dE2000(A[q], B[q])); v = dE2000(A[0], B[0]) >= 20 * m && cvd >= 12 * m; memo.set(k, v); } return v; };
  const W8 = RB.water ? [...RB.water.lakes, ...RB.water.ponds] : [], ST = RB.water ? RB.water.streams : [], WAT = hex2rgb(RL_C.waterNat), Lt = (c, dl) => { const l = rgb2lab(c), o = [0, 0, 0]; rlLabTo(l[0] + dl, l[1], l[2], o, 0); return o; };
  const bbOf = (P) => { let b = [Infinity, Infinity, -Infinity, -Infinity]; for (const [x, y] of P) b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; return b; }, W8b = W8.map((L) => ({ P: L.P, b: L.bb ?? (L.bb = bbOf(L.P)) })), STs = ST.flatMap((st) => st.pts.slice(0, -1).map((p0, k) => ({ a: p0, b: st.pts[k + 1], w: st.w1 })));
  const near = (b, x0, y0, x1, y1, r) => b[0] <= x1 + r && b[2] >= x0 - r && b[1] <= y1 + r && b[3] >= y0 - r; // per edge, only the water, rails and outline near it are tested
  let WL = W8b, SL = STs, RL = RAIL, OLn = [];
  const wet = (x, y, r) => WL.some((L) => d3.polygonContains(L.P, [x, y])) || SL.some((q) => rlSegDist(x, y, q.a[0], q.a[1], q.b[0], q.b[1]) < q.w + r);
  for (const w of WILDS) { const OL = rlWildOutline(w); for (const e of OL) {
    if (!todo.has(e.c + ':' + e.j) || performance.now() > budget) continue; const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); if (L < 1e-6) continue; tot += L; ne++; let nx = -(by - ay) / L, ny = (bx - ax) / L;
    if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; } // +n into the province across
    { const r = 20 / s0, x0 = Math.min(ax, bx), y0 = Math.min(ay, by), x1 = Math.max(ax, bx), y1 = Math.max(ay, by); WL = W8b.filter((q) => near(q.b, x0, y0, x1, y1, r)); SL = STs.filter((q) => near([Math.min(q.a[0], q.b[0]), Math.min(q.a[1], q.b[1]), Math.max(q.a[0], q.b[0]), Math.max(q.a[1], q.b[1])], x0, y0, x1, y1, r + q.w)); RL = RAIL.filter((q) => near([Math.min(q.a[0], q.b[0]), Math.min(q.a[1], q.b[1]), Math.max(q.a[0], q.b[0]), Math.max(q.a[1], q.b[1])], x0, y0, x1, y1, r)); OLn = OL.filter((q) => q !== e && near([Math.min(q.a[0], q.b[0]), Math.min(q.a[1], q.b[1]), Math.max(q.a[0], q.b[0]), Math.max(q.a[1], q.b[1])], x0, y0, x1, y1, r)); }
    const N = Math.max(2, Math.ceil((L * s0) / RL_QE.stepPx)), seen = new Uint8Array(N), fail = new Uint8Array(N), cs = new Map(); let ha = 0, hb = 0, hn = 0; // one sample every stepPx along the edge
    // the check's pixels (W 6 to 9 px in, G 6 to 9.5 out) and half a pixel either side: where the ground changes sharply near the line (a shaded foot, a forest edge) a
    // pan or a sub-pixel offset moves the check's median by a place (seeds 31 and the four-wild plan drew 0.97 and 0.99), so the pair and the ink are also tested with
    // the median's neighbours in the wider set
    for (let k = 0; k < N; k++) { const f = (k + 0.5) / N, x = ax + (bx - ax) * f, y = ay + (by - ay) * f; if (!inModel(x + (nx * 10) / s0, y + (ny * 10) / s0)) continue;
      // pass 3 fix (the verifier's 2x least-zoom failure, Still Mere/Oakmarch 6 px from an edge's end): a sample whose pixels the wild's neighbouring outline edge may cover was
      // left to that edge's line, but the check reads it, and where that edge drew no band only black ink stood there; such a sample is now decided like any other
      if ([6, 9.5].some((o) => nearSeg(x + (nx * o) / s0, y + (ny * o) / s0, RL, railPx / s0))) continue; // a realm rail's own pixels: left to the rail (rails stop at a wild)
      const Wp = RL_QE_P.map((o) => wildAt(x - (nx * o) / s0, y - (ny * o) / s0)), Gp = RL_QE_P.map((o) => landAt(x + (nx * o) / s0, y + (ny * o) / s0)), pk = (A, o) => A[RL_QE_P.indexOf(o)];
      const Wx = [5.5, 6, 7, 8, 9, 9.5].map((o) => lum(pk(Wp, o))), Gx = [5.5, 6, 7, 8, 9, 9.5, 10].map((o) => lum(pk(Gp, o))), Ws = Wx.slice(1, 5), Gs = Gx.slice(1, 6), Wg = med(Ws), G = med(Gs); if (!Wg || !G) continue; const nbr = (a, m) => { const s2 = srt(a), i = s2.findIndex((c) => c.l >= m.l); return [s2[i - 1], s2[i + 1]].filter(Boolean); }, Wc = nbr(Wx, Wg), Gc = nbr(Gx, G); /* the neighbours of each median */ seen[k] = 1; if (RL_DBG.qeSamples && hov < 0) RL_DBG.qeSamples.push([x, y, nx, ny, Wg, G]);
      const isWet = [6, 7.5, 9.5].some((o) => wet(x + (nx * o) / s0, y + (ny * o) / s0, 3 / s0)); let bad = isWet;
      const Wb = rlQeBlurMed(Wp, [6, 7, 8, 9]), Gb = rlQeBlurMed(Gp, [6, 7, 8, 9, 9.5]); // pass 3b (seed 5's sweep, 0.94): the frame's resampling spreads a thin line (a hedge, a crest) over two pixels, so the check's median can take a value no single sample of the model takes; the medians of the profiles blurred over 2 px are tested too
      const Wk = [Wg, ...Wc, ...(Wb ? [Wb] : [])], Gk = [G, ...Gc, ...(Gb ? [Gb] : [])], inkOk = (dw, dg) => Wk.every((c) => ok(RL_QE_INK, dw ? Lt(c, dw) : c, RL_QE.mInk)) && Gk.every((c) => ok(RL_QE_INK, dg ? Lt(c, dg) : c, RL_QE.mInk)); // the ink against every median the check may take (not the darkest: a darker, more saturated colour can stand further from black)
      if (!bad) for (const [dw, dg] of [[0, 0], [0, -jit], [0, jit], [-jit / 2, 0], [jit / 2, 0]]) { const W2 = dw ? Lt(Wg, dw) : Wg, G2 = dg ? Lt(G, dg) : G; if (ok(W2, G2, RL_QE.m) || inkOk(dw, dg)) continue; bad = true; break; } // the pair, or the ink against both
      if (!bad && !inkOk(0, 0)) for (const W2 of Wk) for (const G2 of Gk) if (!bad && !ok(W2, G2, RL_QE.m)) bad = true; // and the pair with the medians' neighbours
      RL_QE.ns = (RL_QE.ns || 0) + 1; if (!bad) continue; RL_QE.nf = (RL_QE.nf || 0) + 1; fail[k] = 1; const gl = rgb2lab(G); ha += gl[1]; hb += gl[2]; hn++;
      for (const c of [Wg, Lt(Wg, -jit / 2), Lt(Wg, jit / 2), G, Lt(G, -jit), Lt(G, jit), ...Wc, ...Gc, ...(isWet ? [WAT] : [])]) cs.set(c.map((v) => Math.round(v / 2)).join(','), c); }
    map.set(e.c + ':' + e.j, { N, seen, fail, L, Lpx: L * s0, fails: [...cs.values()], hue: hn ? [(ha / hn) * RL_QE.hueK, (hb / hn) * RL_QE.hueK] : null });
  } }
  const ms = +(performance.now() - t0).toFixed(1); if (hov >= 0) { if (RL_QE.hov.size > 64) RL_QE.hov.clear(); RL_QE.hov.set(hk, map); return map; }
  ent.tot = tot; if (at) { RL_QE.pre.ms += ms; return map; } RL_QE.ms = ms; RL_QE.n++; if (RL_WRIM.key !== key) RL_QE.hov.clear(); Object.assign(RL_WRIM, { key, map, tot, edges: map.size, ms, n: RL_WRIM.n + 1 }); return map;
}
// the idle prefetch: the rungs a player reaches next, decided whole (every edge) in idle slices; a pure cache, so a frame is the same whether its rung was decided ahead or not
function rlQePrefetch() {
  if (RL_QE.pre.t || !rlQuietEdgeOn() || typeof requestIdleCallback !== 'function') return; const keep = cam.s, at = (s) => { cam.s = s; try { return { s: rlQeRung(s), lvl: rlMipLevel(), src: rlMsSource(), all: true }; } finally { cam.s = keep; } };
  const want = [startScale(), fitScale, minScale, maxScale, 1.0, ...[1, -1, 2, -2, 3, -3].map((k) => keep * Math.exp(0.12 * k))].map((s) => Math.max(minScale, Math.min(maxScale, s))).map(at);
  const done = (a) => { const e = RL_WRIM.lru.get(rlQuietEdgeMap(-1, { ...a, keyOnly: true })); return !!e && e.map.size >= RL_QE.pre.edges; }; RL_QE.pre.edges = WILDS.reduce((n, w) => n + rlWildOutline(w).length, 0);
  const step = (dl) => { RL_QE.pre.t = 0; let a; while ((a = want.find((q) => !done(q))) && dl.timeRemaining() > 6) { rlQuietEdgeMap(-1, { ...a, budget: dl.timeRemaining() - 3 }); RL_QE.pre.n++; } if (want.some((q) => !done(q))) RL_QE.pre.t = requestIdleCallback(step, { timeout: 2000 }); };
  RL_QE.pre.t = requestIdleCallback(step, { timeout: 2000 });
}
// the stretches [[t0, t1], ...] of one edge that keep the quiet edge at full strength: each failing sample padded by padPx, gaps under gapPx closed (a line never dashes:
// N10), most of the edge (whole) the whole edge; past each end the stone fades out over fadePx (rlQuietPaint), so a run never ends in a hard dash
// Pass 3 fix (art verifier 2: the band broke into 44 runs on 30 edges, 20 under 12 px): a run is at least minRunPx long (grown evenly about its centre, kept on the edge), and
// runs closer than gapPx are joined, so the band never reads as dashes; its ends fade over fadePx
function rlQuietRuns(E) {
  if (E.runs) return E.runs; const pad = RL_QE.padPx / E.Lpx, gap = RL_QE.gapPx / E.Lpx, mr = Math.min(1, RL_QE.minRunPx / E.Lpx); let runs = [];
  for (let k = 0; k < E.N; k++) { if (!E.fail[k]) continue; const t0 = Math.max(0, k / E.N - pad), t1 = Math.min(1, (k + 1) / E.N + pad); if (runs.length && runs[runs.length - 1][1] >= t0 - gap) runs[runs.length - 1][1] = t1; else runs.push([t0, t1]); }
  runs = runs.map(([p, q]) => { if (q - p >= mr) return [p, q]; const c = Math.max(mr / 2, Math.min(1 - mr / 2, (p + q) / 2)); return [c - mr / 2, c + mr / 2]; });
  const out = []; for (const r of runs) { if (out.length && out[out.length - 1][1] >= r[0] - gap) out[out.length - 1][1] = Math.max(out[out.length - 1][1], r[1]); else out.push([...r]); }
  return (E.runs = out.reduce((a, [p, q]) => a + q - p, 0) >= RL_QE.whole ? [[0, 1]] : out);
}
const rlQuietShare = () => { const m = RL_WRIM.map; if (!m || !RL_WRIM.tot) return null; let r = 0, t = 0; for (const E of m.values()) { const sn = E.seen.reduce((a, v) => a + v, 0); if (!sn) continue; let c = 0; const R = rlQuietRuns(E); for (let k = 0; k < E.N; k++) { if (!E.seen[k]) continue; const f = (k + 0.5) / E.N; if (R.some(([p, q]) => f >= p && f <= q)) c++; } t += E.L * (sn / E.N); r += E.L * (c / E.N); } return t ? r / t : null; }; // the full-strength share of the outline in view
// one edge's stone: the least L* in its hue that reaches 20 / 12 x mS against every colour its samples failed on (memoised)
function rlQuietStone(E) {
  const cs = E.fails.map((c) => c.map(Math.round)), ha = Math.round(E.hue ? E.hue[0] : 1), hb = Math.round(E.hue ? E.hue[1] : 6), memo = RL_QE.smemo ?? (RL_QE.smemo = new Map()), o = [0, 0, 0]; // solved on the rounded inputs its key holds (a pure function of the key)
  const key = ha + ',' + hb + '|' + cs.map((c) => c.join('.')).sort().join(';'); let L = memo.get(key);
  if (L === undefined) { L = RL_QE.Lmax; for (let q = RL_QE.Lmin; q <= RL_QE.Lmax; q++) { rlLabTo(q, ha, hb, o, 0); if (cs.every((c) => { const p = rlPairDE(o, c); return p.normal >= 20 * RL_QE.mS && p.cvd >= 12 * RL_QE.mS; })) { L = q; break; } } if (memo.size > 2000) memo.clear(); memo.set(key, L); }
  rlLabTo(L, ha, hb, o, 0); return o;
}
function rlQuietPaint(g, px, w, edges, map) { // the quiet edge on the given edges' runs (clipped inside the wild's cells), fading out past their ends, then the ink on those edges
  let n = 0; const strokes = [];
  for (const e of edges) { const E = map && map.get(e.c + ':' + e.j); if (!E) continue; const R = rlQuietRuns(E); if (!R.length) continue; n += R.length; const c = rlQuietStone(E), fd = RL_QE.fadePx / E.Lpx, K = Math.max(2, Math.ceil(E.Lpx / 2)), stops = [];
    for (let k = 0; k <= K; k++) { const t = k / K; let a = 0; for (const [p, q] of R) a = Math.max(a, t >= p && t <= q ? 1 : t < p ? 1 - rlSmooth(0, fd, p - t) : 1 - rlSmooth(0, fd, t - q)); stops.push([t, a]); }
    strokes.push({ e, c, stops }); }
  if (strokes.length) { g.save(); g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip(); g.lineCap = 'butt'; g.lineWidth = (RL_QE.inkPx + 2 * rlQeBand()) * px;
    for (const { e, c, stops } of strokes) { const gr = g.createLinearGradient(e.a[0], e.a[1], e.b[0], e.b[1]); for (const [t, a] of stops) gr.addColorStop(t, `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`); g.strokeStyle = gr; g.beginPath(); g.moveTo(...e.a); g.lineTo(...e.b); g.stroke(); }
    // the corners: a round cap where a full-strength run reaches an edge's end, so the stone does not leave a notch where two edges meet
    for (const { e, c, stops } of strokes) for (const [t, pt] of [[0, e.a], [1, e.b]]) { const a = stops[t ? stops.length - 1 : 0][1]; if (a < 0.999) continue; g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; g.beginPath(); g.arc(pt[0], pt[1], ((RL_QE.inkPx + 2 * rlQeBand()) * px) / 2, 0, Math.PI * 2); g.fill(); }
    g.restore(); }
  g.strokeStyle = RL_QE.inkHex; g.lineWidth = RL_QE.inkPx * px; g.lineCap = 'round'; g.beginPath(); for (const e of edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.lineCap = 'butt'; return n;
}
// pass 3b: the wild edges in focus (see the head of this part): a Map edge key (c:j) -> { w, e, hov }, hov the province whose live tint decides it (-1: the static decision,
// which holds the selected province's tint); live: the hover, the link and the previewed march (drawn each frame), else the selection and the planned march (the static layer)
function rlWildFocus(live) {
  const out = new Map(); if (!rlQuietEdgeOn()) return out;
  const add = (w, e, hov) => { const k = e.c + ':' + e.j, v = out.get(k); if (!v || (hov >= 0 && v.hov < 0)) out.set(k, { w, e, hov }); };
  const whole = (w, hov) => { for (const e of rlWildOutline(w)) add(w, e, e.j === hov ? hov : -1); };
  const round = (i, hov) => { if (i < 0) return; if (isWild(i)) { whole(wildOf[i], -1); return; } for (const w of WILDS) for (const e of rlWildOutline(w)) if (e.j === i) add(w, e, hov); };
  const march = (from, to, hov) => { const d = pathTo(from, to), P = new Set(d ? [from, ...d.path] : [from, to]); for (const w of WILDS) for (const e of rlWildOutline(w)) if (P.has(e.j)) add(w, e, e.j === hov ? hov : -1); const bw = barrierOnLine(from, to); if (bw) whole(bw, hov); };
  if (RL_DBG.focusAll) { if (!live) for (const w of WILDS) whole(w, -1); return out; } // review: every edge in focus (the sweep, p89b)
  const sp = state.sel && state.sel.type === 'prov' ? state.sel.id : -1;
  if (!live) { round(sp, -1); if (moveLine && moveLine.path.length) march(moveLine.from, moveLine.path[moveLine.path.length - 1], -1); return out; }
  for (const i of [hoverProv, RL_LINK.prov]) if (i >= 0 && i !== sp) round(i, i);
  const army = state.sel && state.sel.type === 'cmd' && cmd[state.sel.id] && cmd[state.sel.id].side === 'red' ? cmd[state.sel.id] : null;
  if (army && hoverProv >= 0 && !isWild(hoverProv) && hoverProv !== army.at) march(army.at, hoverProv, hoverProv); // the previewed march: the hovered province takes its live tint
  return out;
}
// the edge keys drawn at the floor now (null: every edge, as in Clear, the Terrain mode and the data modes); the checks sample these (p89 rlWildEdgeCheck)
const rlWildEdgesDrawn = () => (rlQuietEdgeOn() ? new Set([...rlWildFocus(false).keys(), ...rlWildFocus(true).keys()]) : null);
function rlPaintFocus(g, px, F) { // paint a focus map: each wild's edges grouped by the decision they take
  let n = 0; const groups = new Map(); for (const v of F.values()) { const k = v.hov; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(v); }
  for (const [hov, list] of groups) { const map = rlQuietEdgeMap(hov); if (!map) continue; for (const w of WILDS) { const edges = list.filter((v) => v.w === w).map((v) => v.e); if (edges.length) n += rlQuietPaint(g, px, w, edges, map); } }
  return n;
}
function rlDrawQuietEdges(g, px) { rlQuietEdgeMap(); rlPaintFocus(g, px, rlWildFocus(false)); rlQePrefetch(); rlQeWarm(); }
// the stone colour and runs of every edge decided at this rung, worked out while the page is idle (pure functions of their keys, cached), so the first hover on a wild does not
// solve them all in one frame (90 ms for the Ashspine's 15 edges at Mid, against 3 once solved; pass 3 painted every edge at each settle instead)
const RL_QW = { t: 0 };
function rlQeWarm() { if (RL_QW.t || typeof requestIdleCallback !== 'function' || !RL_WRIM.map) return; const list = [...RL_WRIM.map.values()].filter((E) => !E.runs && E.fail.some((v) => v)); let i = 0; if (!list.length) return;
  const step = (dl) => { RL_QW.t = 0; while (i < list.length && dl.timeRemaining() > 4) { const E = list[i++]; rlQuietRuns(E); rlQuietStone(E); } if (i < list.length) RL_QW.t = requestIdleCallback(step, { timeout: 2000 }); };
  RL_QW.t = requestIdleCallback(step, { timeout: 2000 }); } // the static layer (p59b rlDrawWildContours): the decision for the edges near the frame, the static focus, then the idle prefetch
// live (each frame): the hover, the link and the previewed march; a hovered or linked neighbour's tint changes the land side, so its edges are decided again with it (cached per zoom)
function rlDrawWildFocusLive(g, px) { if (!rlQuietEdgeOn() || state.mode !== 'ownership' || SKIP.has('wildEdge')) return 0; const F = rlWildFocus(true); return F.size ? rlPaintFocus(g, px, F) : 0; }

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
// linked neighbour's tint is decided again for that one province and drawn live over the static layer (rlDrawWildHover; pass 2 left that gap open).
const RL_QE = { inkPx: 3, inkHex: '#000000', edgePx: 2, Lmin: 30, Lmax: 92, hueK: 0.6, m: 1.2, mInk: 1.1, mS: 1.2, jit: 4, jit0: 1.5, stepPx: 2, padPx: 2, gapPx: 4, fadePx: 4, whole: 0.9, ms: 0, n: 0, hov: new Map() };
const RL_QE_INK = hex2rgb(RL_QE.inkHex), RL_WRIM = { key: '', map: null, tot: 0, edges: 0, ms: 0 };
const rlQuietEdgeOn = () => rlFaintOn() && !view.pass && !RL_DBG.fullRim && !!RB.ms;
// a source the composite draws: RGBA bytes, size, texels per world unit and an offset (texels); sampled bilinearly in sRGB, as drawImage does
const rlQeSrc = (im, k, ox = 0, oy = 0) => ({ d: im.data, w: im.width, h: im.height, k, ox, oy });
function rlQeAt(S, x, y) {
  let fx = x * S.k - S.ox - 0.5, fy = y * S.k - S.oy - 0.5; if (fx < 0) fx = 0; if (fy < 0) fy = 0; if (fx > S.w - 1) fx = S.w - 1; if (fy > S.h - 1) fy = S.h - 1;
  const ix = fx | 0, iy = fy | 0, ax = fx - ix, ay = fy - iy, ix1 = ix + 1 < S.w ? ix + 1 : ix, iy1 = iy + 1 < S.h ? iy + 1 : iy, d = S.d, o = [(iy * S.w + ix) * 4, (iy * S.w + ix1) * 4, (iy1 * S.w + ix) * 4, (iy1 * S.w + ix1) * 4], wt = [(1 - ax) * (1 - ay), ax * (1 - ay), (1 - ax) * ay, ax * ay];
  let r = 0, g = 0, b = 0, ws = 0; for (let q = 0; q < 4; q++) { if (d[o[q] + 3] < 255 || wt[q] <= 0) continue; r += wt[q] * d[o[q]]; g += wt[q] * d[o[q] + 1]; b += wt[q] * d[o[q] + 2]; ws += wt[q]; }
  return ws > 0.25 ? [r / ws, g / ws, b / ws] : null;
}
const rlSoftLight = (c, sgrey, k) => { if (k <= 0) return c; const s = sgrey / 255; return c.map((v) => { const cb = v / 255, D = cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb), r = s <= 0.5 ? cb - (1 - 2 * s) * cb * (1 - cb) : cb + (2 * s - 1) * (D - cb); return 255 * (cb + (r - cb) * k); }); }; // canvas 'soft-light'
// the decision: edge key (c:j) -> { N samples, seen, fail, L, fails (the failing W, G and water colours), hue }; hov: a province whose live tint is added (-1: none)
function rlQuietEdgeMap(hov = -1) {
  const Lk = RB.L.natural; if (!Lk || !Lk.mb1 || !RB.ms) return null; const nb = new Set(); for (const w of WILDS) for (const e of rlWildOutline(w)) nb.add(e.j);
  const sp = state.sel && state.sel.type === 'prov' && nb.has(state.sel.id) ? state.sel.id : -1, lvl = rlMipLevel(), src = rlMsSource(), fk = rlFarK() * decoAlpha, s0 = cam.s;
  const key = [RB.ver, RB.lookVer, view.tint, sp, s0.toFixed(5), dpr, lvl, src, fk.toFixed(3), rlNearK().toFixed(3), decoTo, [...nb].map((i) => (prov[i] ? (fogOf(i) ?? '-')[0] + (prov[i].owner ?? '') + rlWashOf(i, decoTo >= 0.5).toFixed(3) : '')).join(',')].join('|');
  if (hov < 0 && RL_WRIM.key === key) return RL_WRIM.map; const hk = key + '|' + hov; if (hov >= 0 && RL_QE.hov.has(hk)) return RL_QE.hov.get(hk);
  const t0 = performance.now(), { TX, BW } = RB, F = RL_MS.F, FP = RL_P.farRelief, FG = RL_FOG(), jit = RL_QE.jit0 + (RL_QE.jit - RL_QE.jit0) * rlNearK(), map = new Map(); let tot = 0, ne = 0; // jit: the Near detail's grain only where it is drawn
  const land = rlQeSrc(lvl === 2 ? Lk.mb2 : lvl === 1 ? Lk.mb1 : Lk.img, (TX * (lvl === 2 ? Lk.mb2.width : lvl === 1 ? Lk.mb1.width : BW)) / BW), bake = rlQeSrc(Lk.img, TX);
  const fine = new Map(); if (src === 'fine') for (const B of RB.ms.boxes) if (B.img) for (const c of B.w.cells) fine.set(c, rlQeSrc(B.img, TX * F, B.X0, B.Y0));
  const FR = fk > 0.02 && RL_FR.img ? rlQeSrc(RL_FR.img, (TX * RL_FR.img.width) / BW) : null, GL = !RL_DBG.noGlow && GLOW && GLOW.img ? rlQeSrc(GLOW.img, TX / 2) : null;
  const far = (c, x, y, k) => { if (!FR || !c) return c; const g = rlQeAt(FR, x, y); return g ? rlSoftLight(c, g[0], k) : c; };
  const wildAt = (x, y, w) => { const c = provinceAt(x, y); if (c < 0 || !isWild(c)) return null; const S = src === 'fine' ? fine.get(c) : src === 'bake' ? bake : land; return S ? far(rlQeAt(S, x, y), x, y, fk) : null; };
  const landAt = (x, y, j) => { const i = provinceAt(x, y); if (i < 0) return null; if (isWild(i)) return wildAt(x, y); let c = rlQeAt(land, x, y); if (!c) return null; const S = rlStateOf(i, 'natural', true), fogU = rlFogAt(i) === 'unexplored';
    if (S.wc) c = rlApplyState(c, { wc: S.wc, wa: S.wa }); c = far(c, x, y, fk * (fogU ? 1 - FP.fogK : 1)); if (S.tint) c = rlApplyState(c, { tint: S.tint });
    if (GL) { const gx = x * GL.k - 0.5, gy = y * GL.k - 0.5, q = (Math.max(0, Math.min(GL.h - 1, Math.round(gy))) * GL.w + Math.max(0, Math.min(GL.w - 1, Math.round(gx)))) * 4, a = (GL.d[q + 3] / 255) * decoAlpha; if (a > 0) c = c.map((v, z) => v + (GL.d[q + z] - v) * a); }
    const hz = fogU ? FG.haze * decoAlpha : 0, sat = S.sat * decoAlpha; let hv = null; if (i === sp) hv = rlTintOf(i, true); else if (i === hov) hv = rlTintOf(i, false);
    return rlApplyState(c, { haze: hz, sat, hov: hv ? [hex2rgb(hv[0]), hv[1]] : null }); };
  const srt = (a) => a.filter(Boolean).sort((p, q) => rlLumOf(...p) - rlLumOf(...q)), med = (a) => { const s2 = srt(a); return s2.length ? s2[s2.length >> 1] : null; }, lo2 = (a) => { const s2 = srt(a); return s2.length ? s2[Math.min(1, s2.length - 1)] : null; }; // lo2: the second darkest (a pan may move the check's median down one)
  const RAIL = []; for (const i of nb) if (prov[i] && prov[i].owner) for (const e of RL_EDGES[i]) if (isRealmEdge(i, e)) RAIL.push(e); const railPx = 7, selfPx = RL_QE.inkPx / 2 + RL_QE.edgePx + 1.5; // samples a realm rail or the wild's own outline (a corner) may cover are left to those lines
  const nearSeg = (x, y, segs, r, skip) => segs.some((e) => e !== skip && rlSegDist(x, y, e.a[0], e.a[1], e.b[0], e.b[1]) < r);
  const memo = RL_QE.memo ?? (RL_QE.memo = new Map()), qk = (c) => ((Math.round(c[0]) >> 1) << 14) | ((Math.round(c[1]) >> 1) << 7) | (Math.round(c[2]) >> 1);
  const ok = (a, b, m) => { const k = (qk(a) * 2097152 + qk(b)) * 4 + Math.round(m * 2); let v = memo.get(k); if (v === undefined) { if (memo.size > 400000) memo.clear(); const q = rlPairDE(a, b); v = q.normal >= 20 * m && q.cvd >= 12 * m; memo.set(k, v); } return v; };
  const W8 = RB.water ? [...RB.water.lakes, ...RB.water.ponds] : [], ST = RB.water ? RB.water.streams : [], WAT = hex2rgb(RL_C.waterNat), Lt = (c, dl) => { const l = rgb2lab(c), o = [0, 0, 0]; rlLabTo(l[0] + dl, l[1], l[2], o, 0); return o; };
  const bbOf = (P) => { let b = [Infinity, Infinity, -Infinity, -Infinity]; for (const [x, y] of P) b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; return b; }, W8b = W8.map((L) => ({ P: L.P, b: L.bb ?? (L.bb = bbOf(L.P)) })), STs = ST.flatMap((st) => st.pts.slice(0, -1).map((p0, k) => ({ a: p0, b: st.pts[k + 1], w: st.w1 })));
  const near = (b, x0, y0, x1, y1, r) => b[0] <= x1 + r && b[2] >= x0 - r && b[1] <= y1 + r && b[3] >= y0 - r; // per edge, only the water, rails and outline near it are tested
  let WL = W8b, SL = STs, RL = RAIL, OLn = [];
  const wet = (x, y, r) => WL.some((L) => d3.polygonContains(L.P, [x, y])) || SL.some((q) => rlSegDist(x, y, q.a[0], q.a[1], q.b[0], q.b[1]) < q.w + r);
  for (const w of WILDS) { const OL = rlWildOutline(w); for (const e of OL) {
    if (hov >= 0 && e.j !== hov) continue; const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); if (L < 1e-6) continue; tot += L; ne++; let nx = -(by - ay) / L, ny = (bx - ax) / L;
    if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; } // +n into the province across
    { const r = 20 / s0, x0 = Math.min(ax, bx), y0 = Math.min(ay, by), x1 = Math.max(ax, bx), y1 = Math.max(ay, by); WL = W8b.filter((q) => near(q.b, x0, y0, x1, y1, r)); SL = STs.filter((q) => near([Math.min(q.a[0], q.b[0]), Math.min(q.a[1], q.b[1]), Math.max(q.a[0], q.b[0]), Math.max(q.a[1], q.b[1])], x0, y0, x1, y1, r + q.w)); RL = RAIL.filter((q) => near([Math.min(q.a[0], q.b[0]), Math.min(q.a[1], q.b[1]), Math.max(q.a[0], q.b[0]), Math.max(q.a[1], q.b[1])], x0, y0, x1, y1, r)); OLn = OL.filter((q) => q !== e && near([Math.min(q.a[0], q.b[0]), Math.min(q.a[1], q.b[1]), Math.max(q.a[0], q.b[0]), Math.max(q.a[1], q.b[1])], x0, y0, x1, y1, r)); }
    const N = Math.max(2, Math.ceil((L * s0) / RL_QE.stepPx)), seen = new Uint8Array(N), fail = new Uint8Array(N), cs = new Map(); let ha = 0, hb = 0, hn = 0; // one sample every stepPx along the edge
    for (let k = 0; k < N; k++) { const f = (k + 0.5) / N, x = ax + (bx - ax) * f, y = ay + (by - ay) * f; if (!inModel(x + (nx * 10) / s0, y + (ny * 10) / s0)) continue;
      if ([6, 9].some((o) => nearSeg(x - (nx * o) / s0, y - (ny * o) / s0, OLn, selfPx / s0, e)) || [6, 9.5].some((o) => nearSeg(x + (nx * o) / s0, y + (ny * o) / s0, RL, railPx / s0))) continue;
      const Ws = [6, 7, 8, 9].map((o) => wildAt(x - (nx * o) / s0, y - (ny * o) / s0)), Gs = [6, 7, 8, 9, 9.5].map((o) => landAt(x + (nx * o) / s0, y + (ny * o) / s0)), Wg = med(Ws), G = med(Gs), Wlo = lo2(Ws), Glo = lo2(Gs); if (!Wg || !G) continue; seen[k] = 1; if (RL_DBG.qeSamples && hov < 0) RL_DBG.qeSamples.push([x, y, nx, ny, Wg, G]);
      const isWet = [6, 7.5, 9.5].some((o) => wet(x + (nx * o) / s0, y + (ny * o) / s0, 3 / s0)); let bad = isWet;
      if (!bad) for (const [dw, dg] of [[0, 0], [0, -jit], [0, jit], [-jit / 2, 0], [jit / 2, 0]]) { const W2 = dw ? Lt(Wg, dw) : Wg, G2 = dg ? Lt(G, dg) : G; if (ok(W2, G2, RL_QE.m) || (ok(RL_QE_INK, dw ? Lt(Wlo, dw) : Wlo, RL_QE.mInk) && ok(RL_QE_INK, dg ? Lt(Glo, dg) : Glo, RL_QE.mInk))) continue; bad = true; break; } // the pair, or the ink against both (their second darkest samples)
      RL_QE.ns = (RL_QE.ns || 0) + 1; if (!bad) continue; RL_QE.nf = (RL_QE.nf || 0) + 1; fail[k] = 1; const gl = rgb2lab(G); ha += gl[1]; hb += gl[2]; hn++;
      for (const c of [Wg, Lt(Wg, -jit / 2), Lt(Wg, jit / 2), G, Lt(G, -jit), Lt(G, jit), ...(isWet ? [WAT] : [])]) cs.set(c.map((v) => Math.round(v / 2)).join(','), c); }
    map.set(e.c + ':' + e.j, { N, seen, fail, L, Lpx: L * s0, fails: [...cs.values()], hue: hn ? [(ha / hn) * RL_QE.hueK, (hb / hn) * RL_QE.hueK] : null });
  } }
  const ms = +(performance.now() - t0).toFixed(1); if (hov >= 0) { if (RL_QE.hov.size > 64) RL_QE.hov.clear(); RL_QE.hov.set(hk, map); return map; }
  RL_QE.ms = ms; RL_QE.n++; RL_QE.hov.clear(); Object.assign(RL_WRIM, { key, map, tot, edges: ne, ms }); return map;
}
// the stretches [[t0, t1], ...] of one edge that keep the quiet edge at full strength: each failing sample padded by padPx, gaps under gapPx closed (a line never dashes:
// N10), most of the edge (whole) the whole edge; past each end the stone fades out over fadePx (rlQuietPaint), so a run never ends in a hard dash
function rlQuietRuns(E) {
  if (E.runs) return E.runs; const runs = [], pad = RL_QE.padPx / E.Lpx, gap = RL_QE.gapPx / E.Lpx;
  for (let k = 0; k < E.N; k++) { if (!E.fail[k]) continue; const t0 = Math.max(0, k / E.N - pad), t1 = Math.min(1, (k + 1) / E.N + pad); if (runs.length && runs[runs.length - 1][1] >= t0 - gap) runs[runs.length - 1][1] = t1; else runs.push([t0, t1]); }
  return (E.runs = runs.reduce((a, [p, q]) => a + q - p, 0) >= RL_QE.whole ? [[0, 1]] : runs);
}
const rlQuietShare = () => { const m = RL_WRIM.map; if (!m || !RL_WRIM.tot) return null; let r = 0, t = 0; for (const E of m.values()) { const sn = E.seen.reduce((a, v) => a + v, 0); if (!sn) continue; let c = 0; const R = rlQuietRuns(E); for (let k = 0; k < E.N; k++) { if (!E.seen[k]) continue; const f = (k + 0.5) / E.N; if (R.some(([p, q]) => f >= p && f <= q)) c++; } t += E.L * (sn / E.N); r += E.L * (c / E.N); } return t ? r / t : null; }; // the full-strength share of the outline in view
// one edge's stone: the least L* in its hue that reaches 20 / 12 x mS against every colour its samples failed on (memoised)
function rlQuietStone(E) {
  const cs = E.fails, ha = E.hue ? E.hue[0] : 1, hb = E.hue ? E.hue[1] : 6, memo = RL_QE.smemo ?? (RL_QE.smemo = new Map()), o = [0, 0, 0];
  const key = Math.round(ha) + ',' + Math.round(hb) + '|' + cs.map((c) => c.map((v) => Math.round(v / 3)).join('.')).sort().join(';'); let L = memo.get(key);
  if (L === undefined) { L = RL_QE.Lmax; for (let q = RL_QE.Lmin; q <= RL_QE.Lmax; q++) { rlLabTo(q, ha, hb, o, 0); if (cs.every((c) => { const p = rlPairDE(o, c); return p.normal >= 20 * RL_QE.mS && p.cvd >= 12 * RL_QE.mS; })) { L = q; break; } } if (memo.size > 2000) memo.clear(); memo.set(key, L); }
  rlLabTo(L, ha, hb, o, 0); return o;
}
function rlQuietPaint(g, px, w, edges, map) { // the quiet edge on the given edges' runs (clipped inside the wild's cells), fading out past their ends, then the ink on those edges
  let n = 0; const strokes = [];
  for (const e of edges) { const E = map && map.get(e.c + ':' + e.j); if (!E) continue; const R = rlQuietRuns(E); if (!R.length) continue; n += R.length; const c = rlQuietStone(E), fd = RL_QE.fadePx / E.Lpx, K = Math.max(2, Math.ceil(E.Lpx / 2)), stops = [];
    for (let k = 0; k <= K; k++) { const t = k / K; let a = 0; for (const [p, q] of R) a = Math.max(a, t >= p && t <= q ? 1 : t < p ? 1 - rlSmooth(0, fd, p - t) : 1 - rlSmooth(0, fd, t - q)); stops.push([t, a]); }
    strokes.push({ e, c, stops }); }
  if (strokes.length) { g.save(); g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip(); g.lineCap = 'butt'; g.lineWidth = (RL_QE.inkPx + 2 * RL_QE.edgePx) * px;
    for (const { e, c, stops } of strokes) { const gr = g.createLinearGradient(e.a[0], e.a[1], e.b[0], e.b[1]); for (const [t, a] of stops) gr.addColorStop(t, `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`); g.strokeStyle = gr; g.beginPath(); g.moveTo(...e.a); g.lineTo(...e.b); g.stroke(); }
    // the corners: a round cap where a full-strength run reaches an edge's end, so the stone does not leave a notch where two edges meet
    for (const { e, c, stops } of strokes) for (const [t, pt] of [[0, e.a], [1, e.b]]) { const a = stops[t ? stops.length - 1 : 0][1]; if (a < 0.999) continue; g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; g.beginPath(); g.arc(pt[0], pt[1], ((RL_QE.inkPx + 2 * RL_QE.edgePx) * px) / 2, 0, Math.PI * 2); g.fill(); }
    g.restore(); }
  g.strokeStyle = RL_QE.inkHex; g.lineWidth = RL_QE.inkPx * px; g.lineCap = 'round'; g.beginPath(); for (const e of edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.lineCap = 'butt'; return n;
}
function rlDrawQuietEdges(g, px) { const map = rlQuietEdgeMap(); for (const w of WILDS) rlQuietPaint(g, px, w, rlWildOutline(w), map); } // the static layer (p59b rlDrawWildContours)
// live: a hovered or linked neighbour's tint changes the land side, so that province's edges are decided again with it and drawn over the static layer (cached per zoom)
function rlDrawWildHover(g, i, px) {
  if (i < 0 || isWild(i) || !rlQuietEdgeOn() || state.mode !== 'ownership' || (state.sel && state.sel.type === 'prov' && state.sel.id === i)) return 0; let n = 0;
  for (const w of WILDS) { const edges = rlWildOutline(w).filter((e) => e.j === i); if (!edges.length) continue; const map = rlQuietEdgeMap(i); if (map) n += rlQuietPaint(g, px, w, edges, map); }
  return n;
}

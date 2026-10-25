
// ------------------------------------------------------------------ line pass (natural/pass3/linefix): the floor lines held per position along each segment (p59b solves them)
// The checks (p88 reliefLines, p89 reliefLinesHover, p90) pass a line at a position when one of its pixels reaches the floor there against the same pixel without lines.
// The solver's p5 / p95 (p8 / p92 for the bevel) of a whole 0.1 D segment let a line miss single positions where the ground changes across or along the band; these guards
// test each position on the ground as drawn (rlGroundSides, bilinear) and strengthen only the segments that miss.
// Line pass: the worst ground at each position along a segment, for each key. A line passes at a position when one of its pixels reaches the target there (the checks' rule:
// the best pixel across the line), which the p5 / p95 of a whole segment cannot see where the ground changes across or along the band. Which pixel is well covered depends on
// where the pixel grid falls, so every offset such a pixel can sit on counts, and the worst of them ([oMin, oMax]: the band less a pixel's half extent along the normal each
// side, rlCovM; the samples either side of it when none is inside); and each position takes the worse of its neighbours, so the ground between two sample positions is
// covered (Elmgate/Deepmoss at Near in the Terrain mode: 3.199:1; Elmwick/Halebrook at Mid in Clear: a 45 degree partner on the dark side of a blend, 2.26:1).
const rlCovM = (nx, ny) => (Math.abs(nx) + Math.abs(ny)) / 2 / dpr; // 0.5 device px on an axis, 0.71 at 45 degrees
function rlPosExt(a, oMin = -Infinity, oMax = Infinity) { // { light, dark }: per position the worst ground record for a line of that key (the lightest, the darkest); memoized on the array
  const mk = oMin + '|' + oMax, memo = a.pe ?? (a.pe = new Map()); if (memo.has(mk)) return memo.get(mk);
  const n = a.n ?? 0, lo = new Array(n).fill(null), hi = new Array(n).fill(null); let use = (q) => q[4] >= oMin - 1e-6 && q[4] <= oMax + 1e-6;
  if (!a.some(use)) { const os = a.map((q) => q[4]), below = Math.max(-Infinity, ...os.filter((o) => o < oMin)), above = Math.min(Infinity, ...os.filter((o) => o > oMax)); use = (q) => q[4] === below || q[4] === above; }
  for (const q of a) { if (!use(q)) continue; const t = q[5]; if (lo[t] == null) lo[t] = q; hi[t] = q; }
  const W = (A, worse) => A.map((q, t) => [A[t - 1], q, A[t + 1]].reduce((m, x) => (x == null ? m : m == null || worse(x, m) ? x : m), null));
  const r = { light: W(hi, (x, m) => x[0] > m[0]), dark: W(lo, (x, m) => x[0] < m[0]) }; memo.set(mk, r); return r;
}
// the coverage of a line's best covered pixel among those the checks read at one position (the pixels under points every 0.5 CSS px along the normal), at the worst
// placement of the pixel grid: a band wdev device px wide at the edge's angle (5 degree steps), 8 x 8 grid shifts, 8 x 8 samples a pixel; memoized. 1.5 px at 50 degrees is
// well under the solver's 0.8 (Karford/Ashstead's dark lip, 2.17:1); 2.5 px is near 1 at any angle.
const RL_COVB = new Map();
function rlCovBest(wdev, nx, ny) {
  const ang = Math.round(Math.atan2(Math.abs(ny), Math.abs(nx)) / (Math.PI / 36)), key = Math.round(wdev * 8) + ':' + ang + ':' + dpr; let v = RL_COVB.get(key); if (v != null) return v;
  const th = (ang * Math.PI) / 36, ux = Math.cos(th), uy = Math.sin(th); v = 1;
  for (let sx = 0; sx < 8; sx++) for (let sy = 0; sy < 8; sy++) { const P = [(sx + 0.5) / 8, (sy + 0.5) / 8]; let best = 0; const seen = new Set();
    for (let o = -3 * dpr; o <= 3 * dpr + 1e-9; o += 0.5 * dpr) { const X = Math.floor(P[0] + ux * o), Y = Math.floor(P[1] + uy * o), k = X + ',' + Y; if (seen.has(k)) continue; seen.add(k); let n = 0;
      for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) { const d = (X + (a + 0.5) / 8 - P[0]) * ux + (Y + (b + 0.5) / 8 - P[1]) * uy; if (Math.abs(d) <= wdev / 2) n++; } if (n > best) best = n; }
    v = Math.min(v, best / 64); }
  RL_COVB.set(key, v); return v;
}
function rlPartnerRuns(has) { // the partner's runs: the whole edge where a third needs one; else widened a segment either side and gaps of two closed (it reads as a second line, not dashes)
  const nh = has.filter(Boolean).length, fill = !nh ? has.slice() : nh / has.length >= 1 / 3 ? has.map(() => true) : has.map((h, k) => h || !!has[k - 1] || !!has[k + 1]);
  if (nh) for (let k = 0; k < fill.length; k++) if (!fill[k]) { let q = k; while (q < fill.length && !fill[q]) q++; if (k > 0 && q < fill.length && q - k <= 2) for (let r = k; r < q; r++) fill[r] = true; k = q; }
  return fill;
}
// Line pass: the bevel per position. At each position along a segment one of the two lips must reach the target on its own side's ground (the checks' best pixel);
// the p8 / p92 of a segment let a dark hedge under the dark lip pass beside a soft light lip (Ashmoor/Elmwick at Mid, hovered: 2.10:1). Where both lips miss a position:
// the lip that needs the smaller alpha to serve those positions at its width is raised to it; else a soft lip steps up (its own key, solved, at full width) if that serves
// them; else, below ratio 1.5, the lip that can serve them takes 2 px of the 3 (wo: a fully covered pixel; two 1.5 px lips of opposite keys on a 45 degree edge reached
// 2.11 and 2.17:1 at Karford/Ashstead). Coverage: the best pixel's at the worst grid placement (rlCovBest).
function rlBevelGuard(S, U, Lr, soft, up, wUL, o) {
  const BV = RL_P.bevel, g = { ups: 0, raised: 0, widened: 0, residual: 0 }, cv = (wpx) => rlCovBest(wpx * dpr, o.nx, o.ny), cm = rlCovM(o.nx, o.ny);
  const gr = (s, side, wpx, key) => rlPosExt(S[s][side + 'A'], cm, wpx - cm)[key];
  const lipCR = (s, side, key, a, wpx) => gr(s, side, wpx, key).map((q) => (q == null ? Infinity : rlWorst([q], RL_KEYS[key], a, cv(wpx))));
  const misses = (s) => { const wu = wUL(s), u = lipCR(s, 'ul', U.key, U.al[s], wu), l = lipCR(s, 'lr', Lr.key, Lr.al[s], 2 * BV.w - wu); return u.flatMap((c, t) => (c < BV.T && l[t] < BV.T ? [t] : [])); };
  const need = (s, m, side, key, a0, wpx) => { const G = gr(s, side, wpx, key), Q = m.map((t) => G[t]).filter(Boolean), a = Q.length ? rlAlphaFor(Q, RL_KEYS[key], BV.T, cv(wpx), BV.cap) : null; return a == null ? null : Math.max(a, a0); };
  const raise = (s, m) => { const wu = wUL(s), nu = need(s, m, 'ul', U.key, U.al[s], wu), nl = need(s, m, 'lr', Lr.key, Lr.al[s], 2 * BV.w - wu); if (nu == null && nl == null) return false; if (nl == null || (nu != null && nu - U.al[s] <= nl - Lr.al[s])) U.al[s] = nu; else Lr.al[s] = nl; return true; };
  for (let s = 0; s < S.length; s++) {
    let m = misses(s); if (!m.length) continue;
    if (raise(s, m)) { g.raised++; continue; }
    if (soft && !up[s]) {
      const A = soft === 'ul' ? U.al : Lr.al, keep = A[s]; up[s] = true; A[s] = (soft === 'ul' ? o.U1[s] : o.L1[s]) ?? BV.cap; const m2 = misses(s);
      if (m2.length < m.length) { g.ups++; m = m2; if (!m.length) continue; } else { up[s] = false; A[s] = keep; }
    }
    if (dpr < 1.5) { // widen the lip that serves: try each lip at 2 px, raised to serve what it then misses; keep the arrangement that misses the fewest
      const keep = [o.wo[s], U.al[s], Lr.al[s]]; let best = { n: m.length, st: keep };
      for (const wu of [2 * BV.w - BV.wLit1, BV.wLit1]) { o.wo[s] = wu; U.al[s] = keep[1]; Lr.al[s] = keep[2]; let m2 = misses(s); if (m2.length && raise(s, m2)) m2 = misses(s); if (m2.length < best.n) best = { n: m2.length, st: [wu, U.al[s], Lr.al[s]] }; }
      [o.wo[s], U.al[s], Lr.al[s]] = best.st; if (best.st !== keep) { g.widened++; m = misses(s); }
    }
    g.residual += m.length;
  }
  return g;
}
// Line pass: the anchor-and-partner hairline per position (Clear, the Terrain mode and the data modes). At each position the anchor (its pixels straddle the border: the ground
// under it) or the partner (its band, on its side) must reach the target. Where both miss, the anchor's alpha is raised (to the cap); where that cannot serve, a partner is put,
// or moved, on the side whose ground its key serves (Redwick/Redbarrow at the start view in Clear: the dark partner sat on dark forest beside a light anchor, 2.26:1).
function rlHairGuard(v, S, nx, ny, other, o) { // o: { T, cov, cap }
  const LP = RL_P.line, w = rlW(), g = { raised: 0, partners: 0, moved: 0, residual: 0 }, diag = dpr < 1.5 && Math.abs(nx) > 0.34 && Math.abs(ny) > 0.34, m = rlCovM(nx, ny);
  const geom = (sg) => ({ hw: sg.partner ? (diag ? LP.pairDiagW1[0] : w.ph) : w.h, pw: sg.partner ? (diag ? LP.pairDiagW1[1] : w.pp) : 0 }); // as rlEdgeFloor draws it
  const at = (s, side, a0, b0, key) => rlPosExt(side > 0 ? S[s].lrA : S[s].ulA, a0, b0)[key];
  const cv = (wpx) => rlCovBest(wpx * dpr, nx, ny);
  const miss = (s) => { const sg = v[s], { hw, pw } = geom(sg), al = Math.min(1, (sg.alpha * w.h) / hw), A = rlHairAnchor(S[s], hw / 2 - m, sg.key), P = sg.partner ? at(s, sg.partner.side, hw / 2 + m, hw / 2 + pw - m, sg.partner.key) : null;
    return A.flatMap((q, t) => ((q == null || rlWorst([q], RL_KEYS[sg.key], al, cv(hw)) >= o.T) || (P && (P[t] == null || rlWorst([P[t]], RL_KEYS[sg.partner.key], LP.partnerA, cv(pw)) >= o.T)) ? [] : [t])); };
  for (let s = 0; s < v.length; s++) {
    let ms = miss(s); if (!ms.length) continue; const sg = v[s];
    { const { hw } = geom(sg), A = rlHairAnchor(S[s], hw / 2 - m, sg.key), Q = ms.map((t) => A[t]).filter(Boolean), need = Q.length ? rlAlphaFor(Q, RL_KEYS[sg.key], o.T, cv(hw), Math.min(1, (o.cap * w.h) / hw)) : null;
      if (need != null) { const keep = sg.alpha; sg.alpha = Math.min(o.cap, Math.max(sg.alpha, (need * hw) / w.h)); const m2 = miss(s); if (m2.length < ms.length) { g.raised++; ms = m2; } else sg.alpha = keep; } }
    if (!ms.length) continue;
    const keepP = sg.partner; let bestP = null, bestM = ms;
    for (const side of [1, -1]) { sg.partner = { key: other, side }; const m2 = miss(s); if (m2.length < bestM.length) { bestP = sg.partner; bestM = m2; } }
    sg.partner = bestP ?? keepP; if (bestP) { g[keepP ? 'moved' : 'partners']++; ms = bestM; }
    g.residual += ms.length;
  }
  return g;
}
function rlHairAnchor(Sx, h, key) { // the anchor straddles the border: the worse of its two sides' grounds within h of it (offset 0 where h is under the first sample)
  const L = rlPosExt(Sx.lrA, 0, Math.max(0, h)), U = rlPosExt(Sx.ulA, 0, Math.max(0, h)), A = [L[key], U[key]], worse = key === 'light' ? (x, y) => x[0] > y[0] : (x, y) => x[0] < y[0];
  return A[0].map((q, t) => { const r = A[1][t]; return q == null ? r : r == null ? q : worse(q, r) ? q : r; });
}


// ------------------------------------------------------------------ pass 4 (natural/pass4/design-final.md §5): rivers, fords, bridges and roads drawn as the rules they carry; the supply path
// Rivers run along province borders (the data is p13's): 6 to 9 units wide, widening downstream, never under 2 px; the border's own vertices rounded by Chaikin with a seeded
// meander (<= 0.04 D). The banks carry the province line: in Natural at rest no faint line on a river edge (the river is the border), and a bank keyline (rlAlphaFor at the
// hairline floor) wherever the water misses 20 / 12 against the ground beyond; the hovered and selected provinces' floor runs along their own bank; Clear, the Terrain mode and
// the data modes draw the floor along each bank; dotted where both sides are fogged. Rails on a river edge are inset to clear the water. Bridges (stone spans with road stubs)
// at Mid and Near; roads only by exception (Supply mode, Near, the hovered or selected province, the planned path's own geometry); the ford tick and "· ford +2" on the day chip;
// the Supply mode's supply path (solid wheat-gold over a dark halo, cross-bars at each hop, crossing edges and never following one, its end chip at the army).
const RL_RIV = { w0: 6, w1: 9, floorPx: 2, meander: 0.04, shoreL: -3, bankT: 2.6, bankCov: 0.8, bankM: 1.15, road: '#B6A27C', roadA: 0.45, roadW: [1.2, 2], stub: 0.15, span: [6, 3], trimD: 0.14, gold: '#E6C46A', halo: 'rgba(28,26,23,.9)', haloW: 2, lineW: 2, barPx: 7 };
const RL_WAT = { pad: 0, geo: null, edge: null, ins: null, road: new Map(), bank: new Map(), stats: { bankLines: 0, floorBanks: 0, faintSkipped: 0 }, chip: null };
const p4W = () => p4('waters') && !SKIP.has('p4waters'); // review: SKIP 'p4waters' draws the map without them (the start view against ?p4=off)
function rlRiverGeo() { // per river: the course (world units) with its half-width per point; per river edge, the course points nearest it; per (province, edge), the water's reach into it
  if (RL_WAT.geo) return RL_WAT.geo; const W4 = rlWorld4(), D = MED_DIAM, G = [], EG = new Map(), INS = new Map();
  for (const rv of W4.rivers) {
    const C = rv.corners.map((c) => [c.x, c.y]), P = [C[0]];
    rv.keys.forEach((k, j) => { const a = C[j], b = C[j + 1], m = (rngFor(p4Key('meander', k))() * 2 - 1) * RL_RIV.meander * D, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; P.push([(a[0] + b[0]) / 2 - (dy / L) * m, (a[1] + b[1]) / 2 + (dx / L) * m], b); });
    const S = chaikin(P, 2, false), cum = [0]; for (let q = 1; q < S.length; q++) cum.push(cum[q - 1] + Math.hypot(S[q][0] - S[q - 1][0], S[q][1] - S[q - 1][1])); const tot = cum[cum.length - 1] || 1;
    const hw = S.map((_, q) => ((RL_RIV.w0 + ((RL_RIV.w1 - RL_RIV.w0) * cum[q]) / tot) / 2) * RLK), bb = [Infinity, Infinity, -Infinity, -Infinity]; S.forEach(([x, y], q) => { bb[0] = Math.min(bb[0], x - hw[q]); bb[1] = Math.min(bb[1], y - hw[q]); bb[2] = Math.max(bb[2], x + hw[q]); bb[3] = Math.max(bb[3], y + hw[q]); });
    const R = { id: rv.id, name: rv.name, S, hw, cum, tot, bb, keys: rv.keys, mouth: S[S.length - 1], south: S[S.length - 1][1] > H - 1, wild: WILDS.filter((w) => rv.src.some((c) => w.cells.includes(c))).flatMap((w) => rlWildOutline(w).map((e) => [e.a, e.b])) }; G.push(R);
    const own = S.map(([x, y]) => { let best = null, bd = Infinity; for (const k of rv.keys) { const e = EDGE.get(k), d = rlSegDist(x, y, e.a[0], e.a[1], e.b[0], e.b[1]); if (d < bd) { bd = d; best = k; } } return best; });
    for (const k of rv.keys) { const idx = own.map((kk, q) => (kk === k ? q : -1)).filter((q) => q >= 0), e = EDGE.get(k), s0 = S[idx[0]], s1 = S[idx[idx.length - 1]], dir = idx.length > 1 && (s1[0] - s0[0]) * (e.b[0] - e.a[0]) + (s1[1] - s0[1]) * (e.b[1] - e.a[1]) < 0 ? -1 : 1; EG.set(k, { r: G.length - 1, idx, dir });
      for (const i of [e.i, e.j]) { const ed = RL_EDGES[i].find((x) => x.j === (i === e.i ? e.j : e.i)); if (!ed) continue; let reach = 0; for (const q of idx) reach = Math.max(reach, (S[q][0] - ed.a[0]) * ed.nx + (S[q][1] - ed.a[1]) * ed.ny + hw[q]); INS.set(i + ':' + k, reach); } }
  }
  RL_WAT.edge = EG; RL_WAT.ins = INS; return (RL_WAT.geo = G);
}
const rlQ0 = (R) => { if (!R.wild.length) return 0; if (R.q0s === cam.s) return R.q0; const pad = 11 / cam.s; let q = 0; // a source at a wild's foot: the course starts 11 px clear of its outline at every zoom (the wild edge test reads the land 6 to 9.5 px out)
  while (q < R.S.length - 2 && Math.min(...R.wild.map(([a, b]) => rlSegDist(R.S[q][0], R.S[q][1], a[0], a[1], b[0], b[1]))) < Math.max(R.hw[q], RL_RIV.floorPx / 2 / cam.s) + pad) q++; R.q0s = cam.s; R.q0 = q; return q; };
const rlRiverInset = (i, e) => { if (e.j < 0 || !p4W()) return 0; rlRiverGeo(); const r = RL_WAT.ins.get(i + ':' + ekey(i, e.j)); return r == null ? 0 : r + (RL_WAT.pad && !isRealmEdge(i, e) ? RL_WAT.pad : 0); }; // RL_WAT.pad: p59b rlInnerLine clears the bank lines too // p59b rlInset, p87 rlRailCheck: the water's reach into i past the edge line
const rlRiverFalls = () => (p4W() && RB.ready ? rlRiverGeo().filter((R) => R.south).map((R) => ({ x: R.mouth[0], w: 2 * R.hw[R.hw.length - 1] })) : []); // p59a: a mouth on the south edge falls down the cliff
function rlCrossPt(k) { // where a road or a march crosses edge k: on a river, the course point nearest the ford; elsewhere a seeded point 0.35 to 0.65 along the edge
  const W4 = rlWorld4(), e = EDGE.get(k); if (W4.riverOf.has(k)) { const R = rlRiverGeo()[RL_WAT.edge.get(k).r], f = W4.ford.get(k); let bq = 0, bd = Infinity; RL_WAT.edge.get(k).idx.forEach((q) => { const d = Math.hypot(R.S[q][0] - f[0], R.S[q][1] - f[1]); if (d < bd) { bd = d; bq = q; } }); return { x: R.S[bq][0], y: R.S[bq][1], q: bq, R }; }
  const t = 0.35 + 0.3 * rngFor(p4Key('roadx', k))(); return { x: e.a[0] + (e.b[0] - e.a[0]) * t, y: e.a[1] + (e.b[1] - e.a[1]) * t };
}
function rlRoadPts(k) { // a road: seat to the crossing point to seat, a quadratic through the point, trimmed off both seats (world units)
  let P = RL_WAT.road.get(k); if (P) return P; const e = EDGE.get(k), A = cent[e.i], B = cent[e.j], X = rlCrossPt(k), Q = [2 * X.x - (A[0] + B[0]) / 2, 2 * X.y - (A[1] + B[1]) / 2], raw = [];
  for (let s = 0; s <= 24; s++) { const t = s / 24, u = 1 - t; raw.push([u * u * A[0] + 2 * u * t * Q[0] + t * t * B[0], u * u * A[1] + 2 * u * t * Q[1] + t * t * B[1]]); }
  const r = RL_RIV.trimD * MED_DIAM; P = raw.filter((q) => Math.hypot(q[0] - A[0], q[1] - A[1]) > r && Math.hypot(q[0] - B[0], q[1] - B[1]) > r); RL_WAT.road.set(k, P); return P;
}
function rlWaterErase(g, px) { // the static over layer, right after the rails and lines: their pixels on the water erased (destination-out along the course)
  if (!p4W() || !RB.ready) return; g.save(); g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000'; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const R of rlRiverGeo()) for (let q = rlQ0(R); q < R.S.length - 1; q++) { g.lineWidth = Math.max(0, 2 * ((R.hw[q] + R.hw[q + 1]) / 2)); g.beginPath(); g.moveTo(R.S[q][0], R.S[q][1]); g.lineTo(R.S[q + 1][0], R.S[q + 1][1]); g.stroke(); } g.restore();
}
function rlWaterOut(g) { // clip: everything but the rivers' water (lines meeting a river at a corner stop at its bank)
  if (!p4W() || !RB.ready) return; g.beginPath(); g.rect(-1e5, -1e5, 2e5, 2e5); for (const R of rlRiverGeo()) { const q0 = rlQ0(R), S = R.S.slice(q0), HW = R.hw.slice(q0), n = S.length, side = (sg) => S.map(([x, y], q) => { const a = S[Math.max(0, q - 1)], b = S[Math.min(n - 1, q + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, h = HW[q] - 0.25 / cam.s; return [x - ((b[1] - a[1]) / L) * h * sg, y + ((b[0] - a[0]) / L) * h * sg]; }); const cap = (q, d) => { const [x, y] = S[q], a = S[Math.max(0, q - 1)], b = S[Math.min(n - 1, q + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = ((b[0] - a[0]) / L) * d, ty = ((b[1] - a[1]) / L) * d, h = HW[q]; return [0.25, 0.5, 0.75].map((f) => { const c = Math.sqrt(1 - (2 * f - 1) ** 2); return [x + tx * h * c + (-ty) * h * (1 - 2 * f), y + ty * h * c + tx * h * (1 - 2 * f)]; }); }; const P = [...side(1), ...cap(n - 1, 1), ...side(-1).reverse(), ...cap(0, -1)]; P.forEach(([x, y], q) => (q ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip('evenodd');
}
function rlWaterDist(x, y) { // world point -> its distance past the nearest river's water edge (negative inside the water; the 2 px floor counts at Far)
  let best = Infinity; for (const R of rlRiverGeo()) { if (x < R.bb[0] - best || x > R.bb[2] + best || y < R.bb[1] - best || y > R.bb[3] + best) continue; const f = RL_RIV.floorPx / 2 / cam.s;
    for (let q = rlQ0(R); q < R.S.length - 1; q++) { const d = rlSegDist(x, y, R.S[q][0], R.S[q][1], R.S[q + 1][0], R.S[q + 1][1]) - Math.max(R.hw[q], f); if (d < best) best = d; } }
  return best;
}
function rlRailSpurs(g, i, V, d, k0, k1, n, all) { // p59b rlDrawRails: where a realm edge without a river meets a river edge at a ring vertex, the two insets meet up to 0.4 of the edge back from the
  if (!p4W() || !RB.ready) return; const E = RL_EDGES[i], S = []; // corner, so the realm line would stop short of the water; its rail runs on along its own inset line into the water, clipped at the bank
  for (let c = 0; c < (all ? n : ((k1 - k0 + n) % n) + 1); c++) { const k = (k0 + c) % n, e = E[k]; if (rlRiverInset(i, e) > 0) continue;
    for (const [v, nb, cx, cy, sg] of [[V[k], E[(k - 1 + n) % n], e.a[0], e.a[1], -1], [V[(k + 1) % n], E[(k + 1) % n], e.b[0], e.b[1], 1]]) { if (!(rlRiverInset(i, nb) > 0)) continue;
      const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) || 1, ux = ((e.b[0] - e.a[0]) / L) * sg, uy = ((e.b[1] - e.a[1]) / L) * sg, to = (cx - v[0]) * ux + (cy - v[1]) * uy, st = 0.5 / cam.s; let t = 0;
      while (t < to + 12 * RLK && rlWaterDist(v[0] + ux * t, v[1] + uy * t) > -st) t += st; const end = t < to + 12 * RLK ? t + st : to; if (t > 0 && end > 0) S.push([v, [v[0] + ux * end, v[1] + uy * end]]); } } // into the water, else to the corner
  if (!S.length) return; g.save(); rlWaterOut(g); g.beginPath(); for (const [a, b] of S) { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); } g.stroke(); g.restore();
}
const rlPath = (g, P) => { g.beginPath(); P.forEach(([x, y], q) => (q ? g.lineTo(x, y) : g.moveTo(x, y))); };
// ---- drawing (the static under layer, after the streams and lakes): roads by exception, the rivers, the bridges
function rlDrawWaters(g, px, band) {
  if (!p4W() || !RB.ready || SKIP.has('water')) return; const W4 = rlWorld4(), G = rlRiverGeo(), seen = (b) => b[2] > VW[0] && b[0] < VW[2] && b[3] > VW[1] && b[1] < VW[3];
  const data = state.mode !== 'ownership' && state.mode !== 'terrain', near = band === 'near'; g.save(); modelPath(g); g.clip(); g.lineCap = 'round'; g.lineJoin = 'round';
  if (state.mode === 'supply' || near) { g.save(); rlRoadGapOut(g, W4.road); g.strokeStyle = rgba(RL_RIV.road, RL_RIV.roadA); g.lineWidth = (near ? RL_RIV.roadW[1] : RL_RIV.roadW[0]) * px; for (const k of W4.road) { rlPath(g, rlRoadPts(k)); g.stroke(); } g.restore(); } // roads: Supply mode at every band, faint at Near
  const wc = rlWaterCol(), shore = shadeL(wc, RL_RIV.shoreL), fl = (RL_RIV.floorPx / 2) * px;
  for (const R of G) { if (!seen(R.bb)) continue; const q0 = rlQ0(R), S = R.S.slice(q0), n = S.length, hwAt = (q) => (data ? fl : Math.max(fl, R.hw[q + q0]));
    for (const [col, k] of [[shore, 0], [wc, 1]]) for (let q = 0; q < n - 1; q++) { const h = (hwAt(q) + hwAt(q + 1)) / 2; g.strokeStyle = col; g.lineWidth = Math.max(2 * px, k ? 2 * h - Math.min(0.8 * RLK, h) : 2 * h); g.beginPath(); g.moveTo(S[q][0], S[q][1]); g.lineTo(S[q + 1][0], S[q + 1][1]); g.stroke(); }
    if (!data) { g.strokeStyle = 'rgba(220,240,232,.3)'; g.lineWidth = Math.max(0.4, 0.6 * px); g.beginPath(); S.forEach(([x, y], q) => { const nx = q < n - 1 ? S[q + 1][1] - y : y - S[q - 1][1], ny = q < n - 1 ? x - S[q + 1][0] : S[q - 1][0] - x, L = Math.hypot(nx, ny) || 1, o = hwAt(q) * 0.55; q ? g.lineTo(x - (nx / L) * o, y - (ny / L) * o) : g.moveTo(x - (nx / L) * o, y - (ny / L) * o); }); g.stroke(); } }
  if (band === 'mid' || near) for (const [k, b] of W4.bridges) { const X = rlCrossPt(k); if (X.x < VW[0] - 40 || X.x > VW[2] + 40 || X.y < VW[1] - 40 || X.y > VW[3] + 40) continue; rlBridge(g, k, X, !!(b.cut && curMonth >= b.cut.from)); }
  g.restore();
}
function rlBridge(g, k, X, cut) { // a stone span across the course at the crossing (about 6 x 3 units), lit top, dark ends; road stubs of 0.15 D fading into each bank; cut: a gap and rubble
  const S = X.R.S, q = X.q, a = S[Math.max(0, q - 1)], b = S[Math.min(S.length - 1, q + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / tl, ty = (b[1] - a[1]) / tl, nx = -ty, ny = tx, hw = X.R.hw[q], half = hw + 1.6 * RLK, th = (RL_RIV.span[1] / 2) * RLK, st = RL_RIV.stub * MED_DIAM;
  for (const sg of [1, -1]) { const x0 = X.x + nx * half * sg, y0 = X.y + ny * half * sg, x1 = x0 + nx * st * sg, y1 = y0 + ny * st * sg, gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, rgba(RL_RIV.road, 0.8)); gr.addColorStop(1, rgba(RL_RIV.road, 0)); g.strokeStyle = gr; g.lineWidth = 2.2 * RLK; g.lineCap = 'butt'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  const quad = (s0, s1) => { const p = (s, t) => [X.x + nx * s + tx * t, X.y + ny * s + ty * t]; g.beginPath(); g.moveTo(...p(s0, -th)); g.lineTo(...p(s1, -th)); g.lineTo(...p(s1, th)); g.lineTo(...p(s0, th)); g.closePath(); };
  const spans = cut ? [[-half, -1 * RLK], [1 * RLK, half]] : [[-half, half]];
  for (const [s0, s1] of spans) { g.save(); g.translate(0.5 * RLK, 0.7 * RLK); g.fillStyle = 'rgba(12,10,8,.45)'; quad(s0, s1); g.fill(); g.restore(); g.fillStyle = '#8E8574'; quad(s0, s1); g.fill(); g.strokeStyle = '#CFC6B2'; g.lineWidth = 0.55 * RLK; const p = (s, t) => [X.x + nx * s + tx * t, X.y + ny * s + ty * t]; g.beginPath(); g.moveTo(...p(s0, -th)); g.lineTo(...p(s1, -th)); g.stroke(); g.strokeStyle = '#2B2620'; g.lineWidth = 0.8 * RLK; for (const s of [s0, s1]) { g.beginPath(); g.moveTo(...p(s, -th)); g.lineTo(...p(s, th)); g.stroke(); } }
  if (cut) { g.fillStyle = '#6E6658'; for (const s of [-0.55, 0.6]) { g.beginPath(); g.arc(X.x + nx * s * RLK + tx * (s > 0 ? 1.4 : -1.2) * RLK, X.y + ny * s * RLK + ty * (s > 0 ? 1.4 : -1.2) * RLK, 0.55 * RLK, 0, 2 * Math.PI); g.fill(); } }
}
function rlBridgeFeet() { // the drawn spans' footprints (world quads: the span and its shadow, 0.6 units around), at Mid and Near, where bridges are drawn; the bank lines pass under them
  if (!p4W() || !RB.ready || bandOf(cam.s) === 'far') return []; const out = [];
  for (const [k] of rlWorld4().bridges) { const X = rlCrossPt(k), S = X.R.S, q = X.q, a = S[Math.max(0, q - 1)], b = S[Math.min(S.length - 1, q + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / tl, ty = (b[1] - a[1]) / tl, s1 = X.R.hw[q] + 2.2 * RLK + 5 / cam.s, t1 = (RL_RIV.span[1] / 2 + 0.6) * RLK, t2 = t1 + 0.9 * RLK;
    out.push({ x: X.x, y: X.y, tx, ty, s1, t1, quad: [[-s1, -t1], [s1, -t1], [s1, t2], [-s1, t2]].map(([s, t]) => [X.x - ty * s + tx * t, X.y + tx * s + ty * t]) }); }
  return out;
}
const rlBridgeOut = (g, F) => { if (!F.length) return; g.beginPath(); g.rect(-1e5, -1e5, 2e5, 2e5); for (const f of F) f.quad.forEach(([x, y], n) => (n ? g.lineTo(x, y) : g.moveTo(x, y))); g.clip('evenodd'); }; // clip: all but the spans
// ---- the banks carry the province line (p59b hooks): a river edge's lines, drawn here instead of on its centreline (which lies under the water)
function rlBankStyle(e, k, side, ctx, lock) { // the bank line beyond side's bank: whether the water misses 20 / 12 against the ground there; per course segment an inner and an outer slot (the line's
  const ck = ctx.key + '|bank|' + k + '|' + side + (lock ? '|L' + lock.ck : ''); let v = RL_WAT.bank.get(ck); if (v) return v; // width each, out from the water's edge), keys and alphas solved per position on each slot's own ground: one main key for the bank, alone where it serves
  const R = rlRiverGeo()[RL_WAT.edge.get(k).r], idx = RL_WAT.edge.get(k).idx, wcol = hex2rgb(rlWaterCol()), sgn = rlBankSign(e, side), w = rlW(), G = [], SG = [], T = RL_RIV.bankT, C = RL_RIV.bankCov; // every position on the inner slot; else the pairing
  const ci = 0.5 + w.h / 2, co = 0.5 + w.h + w.hp / 2, ext = (A) => { const B = [...A].sort((a, b) => a[0] - b[0]); return B.length ? [B[0], B[B.length - 1]] : []; }, ok = (A, K, c = C) => !A.length || rlWorst(ext(A), RL_KEYS[K], 1, c) >= T; // (main inside and the other key out as a partner, or the other key inside and the main out:
  for (let m = 0; m + 1 < idx.length; m++) { const p0 = R.S[idx[m]], p1 = R.S[idx[m + 1]], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, nx = (-(p1[1] - p0[1]) / L) * sgn, ny = ((p1[0] - p0[0]) / L) * sgn, h = R.hw[idx[m]] * cam.s, gs = (c, lw) => rlGroundSides(p0[0], p0[1], p1[0], p1[1], nx, ny, ctx.look, ctx.lvl, ctx.states, [h + c - 0.3 * lw, h + c, h + c + 0.3 * lw])[0]; // a sliver of the far side's ground can lie between
    const gi = gs(ci, w.h), go = gs(co, w.hp), n = Math.max(gi.n ?? 0, go.n ?? 0), PI = Array.from({ length: n }, () => []), PO = Array.from({ length: n }, () => []); for (const q of gi) PI[q[5]].push(q); for (const q of go) PO[q[5]].push(q); G.push(...gi, ...go); SG.push({ PI, PO, cI: Math.min(C, rlCovBest(w.h * dpr, nx, ny)), cO: Math.min(C, rlCovBest(w.hp * dpr, nx, ny)) }); } // the water and the line) that serves the most positions
  const memo = new Map(), waterOK = G.every((q) => { const ky = (q[1] << 16) | (q[2] << 8) | q[3]; let ok2 = memo.get(ky); if (ok2 == null) { const d = rlPairDE(wcol, [q[1], q[2], q[3]]); ok2 = d.normal >= 20 * RL_RIV.bankM && d.cvd >= 12 * RL_RIV.bankM; memo.set(ky, ok2); } return ok2; });
  const cnt = (K) => SG.reduce((a, s) => a + s.PI.filter((A) => ok(A, K, s.cI)).length, 0), key = cnt('dark') >= cnt('light') ? 'dark' : 'light', oth = key === 'dark' ? 'light' : 'dark', al = (As, K, c) => (As.length ? rlAlphaFor(ext(As.flat()), RL_KEYS[K], T, c, 1) ?? 1 : 1);
  const ev = SG.map(({ PI, PO, cI, cO }) => (PI.every((A) => ok(A, key, cI)) ? null : [[key, oth], [oth, key]].map(([ki, ko]) => { const si = PI.map((A) => ok(A, ki, cI)), so = PO.map((A, t) => !si[t] && ok(A, ko, cO)); return { ki, ko, si, so, served: si.filter((x, t) => x || so[t]).length }; }))); // cI, cO: the slot's best pixel coverage at the worst grid placement (rlCovBest), at most bankCov
  const pk = ev.map(() => 0); for (let m = 0; m < ev.length; m++) { if (!ev[m]) continue; let m1 = m; while (m1 + 1 < ev.length && ev[m1 + 1]) m1++; const tot = [0, 1].map((p) => ev.slice(m, m1 + 1).reduce((a, x) => a + x[p].served, 0)), b = tot[1] > tot[0] ? 1 : 0; for (let q = m; q <= m1; q++) pk[q] = b; m = m1; } // one pairing along a run of paired segments (two keys crossing at a joint grey each other)
  const seg = lock ? lock.seg.map((x, m) => { const S = SG[m], f = (A, K, c) => al(A.filter((a) => ok(a, K, c)), K, c); return { ...x, i: [x.i[0], Math.max(x.i[1], f(S.PI, x.i[0], S.cI))], o: x.o && [x.o[0], Math.max(x.o[1], f(S.PO, x.o[0], S.cO))] }; }) : SG.map(({ PI, PO, cI, cO }, m) => { /* lock: the live hover over a bank the static layer draws keeps its keys (two keys crossed grey each other: Redholt at 1920, 2.17:1), each alpha also solved on the tinted ground */ if (!ev[m]) return { i: [key, al(PI, key, cI)], o: null, served: PI.length, of: PI.length }; const pick = ev[m][pk[m]];
    return { i: [pick.ki, al(PI.filter((_, t) => pick.si[t]), pick.ki, cI)], o: [pick.ko, al(PO.filter((_, t) => pick.so[t]), pick.ko, cO)], served: pick.served, of: PI.length }; });
  const o0 = seg.map((s) => s.o); if (!lock) seg.forEach((s, m) => { if (!s.o) { const nb = [o0[m - 1], o0[m + 1]].filter(Boolean); if (nb.length && nb.every((x) => x[0] === nb[0][0])) s.o = [nb[0][0], Math.max(...nb.map((x) => x[1]))]; } }); // an outer line runs a segment past where it is needed (no miss at a run's butt end)
  if (!lock) for (const sl of ['i', 'o']) { const a0 = seg.map((s) => s[sl] && s[sl][1]); seg.forEach((s, m) => { if (s[sl]) s[sl] = [s[sl][0], Math.max(a0[m], ...[m - 1, m + 1].filter((q) => seg[q] && seg[q][sl] && seg[q][sl][0] === s[sl][0]).map((q) => a0[q]))]; }); } // each slot's alpha: its neighbours' maximum (same key)
  v = { ck, waterOK, key: lock ? lock.key : key, alpha: Math.max(0, ...seg.map((s) => s.i[1])), seg, paired: seg.filter((s) => s.o).length, unserved: seg.reduce((a, s) => a + s.of - s.served, 0), samples: G.length }; RL_WAT.bank.set(ck, v); if (RL_WAT.bank.size > 4000) RL_WAT.bank.clear(); return v;
}
const rlBankSign = (e, side) => { const cx = cent[side][0], cy = cent[side][1], ex = e.b[0] - e.a[0], ey = e.b[1] - e.a[1], ent = RL_WAT.edge && RL_WAT.edge.get(ekey(e.i, e.j)); return ((cx - e.a[0]) * -ey + (cy - e.a[1]) * ex > 0 ? 1 : -1) * (ent ? ent.dir : 1); }; // +1: side lies on the left normal of the course's own direction along the edge
function rlBankLine(g, e, k, side, st, px, fog, ext = true) { // one bank's lines along the course (one course segment past the edge at each end, no gap at a joint; not in the live hover, over the static joint), each slot in runs of one key and alpha
  const R = rlRiverGeo()[RL_WAT.edge.get(k).r], i0 = RL_WAT.edge.get(k).idx, pre = ext && i0[0] > 0 ? 1 : 0, idx = [...(pre ? [i0[0] - 1] : []), ...i0, ...(ext && i0[i0.length - 1] < R.S.length - 1 ? [i0[i0.length - 1] + 1] : [])], sgn = rlBankSign(e, side), w = rlW(), ns = Math.max(1, st.seg.length), q0 = rlQ0(R);
  const at = (q, o) => { const a = R.S[Math.max(0, q - 1)], b = R.S[Math.min(R.S.length - 1, q + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [R.S[q][0] + (-(b[1] - a[1]) / L) * sgn * (R.hw[q] + o * px), R.S[q][1] + ((b[0] - a[0]) / L) * sgn * (R.hw[q] + o * px)]; };
  const sOf = (j) => st.seg[Math.min(ns - 1, Math.max(0, j - pre))] ?? { i: [st.key, st.alpha], o: null }, q2 = (a) => Math.min(1, Math.ceil(a * 50 - 1e-6) / 50), tag = (x) => (x ? x[0] + q2(x[1]) : null);
  if (idx.length < 2) return; g.save(); rlBridgeOut(g, rlBridgeFeet()); g.lineCap = 'butt'; g.lineJoin = 'round'; if (fog) g.setLineDash([2 * px, 3 * px]);
  for (const [sl, o, lw] of [['i', 0.5 + w.h / 2, w.h], ['o', 0.5 + w.h + w.hp / 2, w.hp]]) { g.lineWidth = lw * px;
    for (let j = 0; j < idx.length - 1; ) { const x = idx[j] >= q0 && sOf(j)[sl]; if (!x) { j++; continue; } const t = tag(x); let j1 = j + 1; while (j1 < idx.length - 1 && tag(sOf(j1)[sl]) === t) j1++;
      g.strokeStyle = rgba(x[0] === 'light' ? RL_C.keyLight : RL_C.keyDark, q2(x[1])); rlPath(g, idx.slice(j, j1 + 1).map((q) => at(q, o))); g.stroke(); j = j1; } }
  g.restore();
}
function rlRiverEdgeLines(g, e, ctx, px, mode, focus) { // p59b: returns true when the edge is a river edge (its lines drawn here). mode 'rest' (Natural): bank lines where the water needs them, the floor on focus's bank; 'floor': both banks at the floor; 'side': focus's bank only (the live hover)
  if (!p4W()) return false; const k = ekey(e.i, e.j); if (!rlWorld4().riverOf.has(k)) return false; rlRiverGeo(); const fog = !!(fogOf(e.i) && fogOf(e.j));
  for (const side of [e.i, e.j]) { if (isWild(side) || (mode === 'side' && side !== focus)) continue; if (prov[side].owner && isRealmEdge(side, RL_EDGES[side].find((x) => x.j === (side === e.i ? e.j : e.i)) ?? { j: -1 })) continue; // a realm edge's owned side has its rails (inset clear of the water)
    const base = mode === 'side' && rlFaintOn() ? rlBankStyle(e, k, side, rlLineCtx()) : null; // the hover: the static layer's own bank under it, when it draws one
    const st = rlBankStyle(e, k, side, side === focus ? rlCtxTinted(ctx, side, mode !== 'side') : ctx, base && !base.waterOK ? base : null), floor = mode !== 'rest' || side === focus; if (!floor && st.waterOK) { RL_WAT.stats.faintSkipped++; continue; }
    rlBankLine(g, e, k, side, st, px, fog, mode !== 'side'); if (floor) RL_WAT.stats.floorBanks++; else RL_WAT.stats.bankLines++; }
  return true;
}
// ---- hover: a river or a bridge opens its card (p80d mousemove; the card is a RAW tip)
function rlWaterAt(x, y) { // world point -> { kind, river, k } within the water (or a bridge's span), at Mid and nearer for bridges
  if (!p4W() || !RB.ready) return null; const W4 = rlWorld4(), band = bandOf(cam.s), pad = 2 / cam.s;
  if (band !== 'far') for (const [k] of W4.bridges) { const X = rlCrossPt(k); if (Math.hypot(x - X.x, y - X.y) < X.R.hw[X.q] + 2 * RLK + pad) return { kind: 'bridge', k, river: X.R.id }; }
  for (const R of rlRiverGeo()) { if (x < R.bb[0] - pad || x > R.bb[2] + pad || y < R.bb[1] - pad || y > R.bb[3] + pad) continue; for (let q = rlQ0(R); q < R.S.length - 1; q++) if (rlSegDist(x, y, R.S[q][0], R.S[q][1], R.S[q + 1][0], R.S[q + 1][1]) < Math.max(R.hw[q], (RL_RIV.floorPx / 2) / cam.s) + pad) return { kind: 'river', river: R.id }; }
  return null;
}
const rlWhen = (M) => `Y${Math.floor((M - 1) / 12) + 1} M${((M - 1) % 12) + 1}`;
function rlWaterTip(w) { const W4 = rlWorld4(), R = W4.rivers[w.river], nm = R.name.replace(/^the /, 'The ');
  if (w.kind === 'river') { const br = [...W4.bridges.entries()].filter(([, b]) => b.river === R.id); return { title: nm, value: 'River', meaning: `Crossing it costs ${P4_RULES.crossing.days} days unless a bridge stands. A defender gets +${P4_RULES.crossing.defBonus} def against an army that crossed it.`, rows: br.map(([k, b]) => { const e = EDGE.get(k), cut = b.cut && curMonth >= b.cut.from; return [`Bridge <span class="link" data-go="${e.i}">${names[e.i]}</span>–<span class="link" data-go="${e.j}">${names[e.j]}</span>`, cut ? `cut ${rlWhen(b.cut.from)}` : 'standing']; }) }; }
  const b = W4.bridges.get(w.k), e = EDGE.get(w.k), cut = b.cut && curMonth >= b.cut.from; return { title: `Bridge over ${R.name}`, value: `${names[e.i]}–${names[e.j]}`, meaning: cut ? `Cut ${rlWhen(b.cut.from)} by ${ownerName(b.cut.by)}: crossing +${P4_RULES.crossing.days} days until rebuilt.` : 'No crossing cost.' };
}
function rlWaterHover(x, y, ev) { // p80d: true when the pointer is over a river or a bridge (the province under it is not hovered)
  const w = rlWaterAt(x, y), key = w ? (w.kind === 'bridge' ? 'bridge' + w.k : 'river' + w.river) : null; if (!w) { if (RL_WAT.hov) { RL_WAT.hov = null; closeAll(); } return false; }
  if (RL_WAT.hov !== key) { RL_WAT.hov = key; RAW['w4' + key] = rlWaterTip(w); if (hoverProv !== -1) { hoverProv = -1; requestDraw(); } closeAll(); clearTimeout(hoverTimer); const sx = ev.clientX, sy = ev.clientY; hoverTimer = setTimeout(() => { if (RL_WAT.hov === key) showTip('raw:w4' + key, { left: sx + 14, right: sx + 14, top: sy + 6, bottom: sy + 6 }, 0); }, 500); }
  return true;
}
// ---- the planned path (p63 rlThread): legs that cross a river bend through the ford (or the bridge); a crossing without an intact bridge draws a tick; the chip's "· ford +2"
function rlThreadLine(ml, pts) { // the stroke's screen points: the waypoints, with each river leg bent through its crossing point and each road leg along the road's geometry
  if (!p4W()) return pts; const W4 = rlWorld4(), out = [pts[0]], seq = [ml.from, ...ml.path];
  for (let m = 1; m < pts.length; m++) { const k = ekey(seq[m - 1], seq[m]); if (W4.riverOf.has(k) || W4.road.has(k)) { const X = rlCrossPt(k); out.push(toScreen(X.x, X.y)); } out.push(pts[m]); }
  return out;
}
const rlLegCross = (v, w) => p4W() && p4Crossing(ekey(v, w)); // a leg across a river without an intact bridge (+2 days)
function rlFordTick(g, v, w) { if (!rlLegCross(v, w)) return; const X = rlCrossPt(ekey(v, w)), [sx, sy] = toScreen(X.x, X.y), [ax, ay] = toScreen(...cent[v]), [bx, by] = toScreen(...cent[w]), L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L, ny = (bx - ax) / L;
  g.save(); g.setLineDash([]); g.lineCap = 'round'; g.strokeStyle = '#1C1A17'; g.lineWidth = 5; g.beginPath(); g.moveTo(sx - nx * 7, sy - ny * 7); g.lineTo(sx + nx * 7, sy + ny * 7); g.stroke(); g.strokeStyle = rlWaterCol() === RL_C.waterNat ? '#5FB3A6' : RL_C.water; g.lineWidth = 3; g.stroke(); g.restore(); }
function rlCrossText(from, path) { // the projection's and the toast's crossing note, and in Supply mode the supply after arrival
  if (!p4('waters')) return ''; const W4 = rlWorld4(), seq = [from, ...path], rv = new Set(); let n = 0; for (let m = 1; m < seq.length; m++) if (p4Crossing(ekey(seq[m - 1], seq[m]))) { n++; rv.add(W4.rivers[W4.riverOf.get(ekey(seq[m - 1], seq[m])).river].name); }
  const sup = state.mode === 'supply' ? `; supply after arrival: ${rlSupplyPath(path[path.length - 1]).text}` : ''; return (n ? ` (+${n * P4_RULES.crossing.days} days, crossing ${[...rv].join(' and ')})` : '') + sup;
}
const rlRoadsOf = (i) => (p4('waters') ? [...rlWorld4().road].map((k) => EDGE.get(k)).filter((e) => e.i === i || e.j === i).map((e) => names[e.i === i ? e.j : e.i]) : []); // the province card's "Roads:" row
const rlRoadGapOut = (g, keys) => { // clip: all but a disc at each road's crossing (5 px; on a river the water and its banks), so the line it crosses keeps its own ground (Briardale/Kharnath, hovered: 3.19:1)
  g.beginPath(); g.rect(-1e5, -1e5, 2e5, 2e5); const W4 = rlWorld4(); for (const k of keys) { const X = rlCrossPt(k), r = (W4.riverOf.has(k) ? X.R.hw[X.q] : 0) + 5 / cam.s; g.moveTo(X.x + r, X.y); g.arc(X.x, X.y, r, 0, 2 * Math.PI, true); } g.clip('evenodd'); };
function rlDrawRoadsLive(g, px, list) { // the hovered or selected province's own road edges, faint (Supply mode and Near draw every road in the static layer)
  if (!p4W() || state.mode === 'supply' || bandOf(cam.s) === 'near') return; const W4 = rlWorld4(); g.save(); modelPath(g); g.clip(); rlRoadGapOut(g, W4.road); g.lineCap = 'round'; g.strokeStyle = rgba(RL_RIV.road, RL_RIV.roadA); g.lineWidth = RL_RIV.roadW[0] * px;
  for (const k of W4.road) { const e = EDGE.get(k); if (!list.some((i) => i >= 0 && (e.i === i || e.j === i))) continue; rlPath(g, rlRoadPts(k)); g.stroke(); } g.restore(); }
// ---- the supply path in Supply mode (§5.4): the selected army of the viewer's to its fort
const rlTight = (c) => p4('waters') && c.side === VIEWER && c.squads.length > 0 && rlSupplyPath(c.at).share < 1; // p62 RL_STATUS: the half wheat
function rlSupplyLine(c) { // screen points from the army's piece through each hop (its road's crossing, or the edge's midpoint) to the fort; the hops' crossing points
  const S = rlSupplyPath(c.at), W4 = rlWorld4(), pc = rlPieceAt(c.id) ?? cent[c.at], pts = [toScreen(...pc)], bars = [];
  for (let m = 1; m < S.path.length; m++) { const v = S.path[m - 1], w = S.path[m], k = ekey(v, w), rd = W4.road.has(k) && (!W4.riverOf.has(k) || p4BridgeUp(k)), e = EDGE.get(k), X = rd || W4.riverOf.has(k) ? rlCrossPt(k) : { x: (e.a[0] + e.b[0]) / 2, y: (e.a[1] + e.b[1]) / 2 };
    const sx = toScreen(X.x, X.y); pts.push(sx); bars.push({ at: sx, dir: [e.b[0] - e.a[0], e.b[1] - e.a[1]] }); pts.push(toScreen(...cent[w])); }
  return { S, pts, bars };
}
function rlDrawSupplyPath(g) { // live, in screen px: a solid 2 px wheat-gold line over a dark halo, tapering toward the fort, a cross-bar at each hop, the end chip at the army
  RL_WAT.chip = null; if (!p4W() || SKIP.has('arrows') /* an overlay like the march thread: off in the line checks' frames */ || state.mode !== 'supply' || !state.sel || state.sel.type !== 'cmd') return; const c = cmd[state.sel.id]; if (!c || c.side !== VIEWER || c.hidden) return;
  const L = rlSupplyLine(c), P = chaikin(L.pts, 2, false), n = P.length; g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [col, extra] of [[RL_RIV.halo, 2 * RL_RIV.haloW], [RL_RIV.gold, 0]]) for (let q = 0; q < n - 1; q++) { const w = RL_RIV.lineW * (1 - 0.4 * (q / Math.max(1, n - 2))) + extra; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(...P[q]); g.lineTo(...P[q + 1]); g.stroke(); }
  for (const b of L.bars) { const l = Math.hypot(b.dir[0], b.dir[1]) || 1, ux = b.dir[0] / l, uy = b.dir[1] / l, h = RL_RIV.barPx / 2; for (const [col, wd] of [[RL_RIV.halo, 2 + 2 * RL_RIV.haloW], [RL_RIV.gold, 2]]) { g.strokeStyle = col; g.lineWidth = wd; g.lineCap = 'butt'; g.beginPath(); g.moveTo(b.at[0] - ux * h, b.at[1] - uy * h); g.lineTo(b.at[0] + ux * h, b.at[1] + uy * h); g.stroke(); } }
  const txt = L.S.text, room = rlChipRoom(), lay = RL_PIECE_CACHE.get('L'), avoid = lay ? [...lay.boxes.map(rlLiveBox(lay)), ...rlNameBoxes(lay), ...room.pieces, ...RL_CHIPS.map((q) => q.box)] : [];
  g.font = "600 11.5px 'IBM Plex Sans Condensed', sans-serif"; const tw = g.measureText(txt).width + 12, ch2 = 18, [ax, ay] = L.pts[0], hit = (r) => avoid.some((q) => r[2] > q[0] && r[0] < q[2] && r[3] > q[1] && r[1] < q[3]);
  const at = rlChipRing(ax, ay, { tw, h: ch2 }, (q) => { const r = [q[0], q[1], q[0] + tw, q[1] + ch2]; return room.inView(r) && room.clearOfRibbon(r) && !hit(r); }, 1, 8) ?? [ax + 12, ay - ch2 - 12];
  g.fillStyle = 'rgba(20,18,15,.95)'; roundRect(g, at[0], at[1], tw, ch2, 3); g.fill(); g.strokeStyle = RL_RIV.gold; g.lineWidth = 1; g.stroke(); g.fillStyle = '#F4EEDF'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, at[0] + tw / 2, at[1] + ch2 / 2 + 0.5);
  RL_WAT.chip = { text: txt, box: [at[0], at[1], at[0] + tw, at[1] + ch2], pts: P.map((q) => q.map((v) => +v.toFixed(1))), bars: L.bars.length }; RL_CHIPS.push({ box: RL_WAT.chip.box, draw: () => {}, text: txt }); g.restore();
}

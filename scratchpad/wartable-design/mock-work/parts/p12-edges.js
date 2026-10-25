
// ------------------------------------------------------------------ v3: hand-ruled borders. One seeded polyline per shared edge, used by the fill, the border,
// the band, hover, selection, the hit test and the wild contour (H3). Endpoints stay the Voronoi vertices; adjacency stays NB.
const PEQ = (a, b) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;
const MEAN_AREA0 = provList.reduce((a, i) => a + areaOf[i], 0) / provList.length;
const EDGE_L = 3 * Math.sqrt(MEAN_AREA0 / 6400); // recursion floor: 3 units on a 6400-unit province
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function segCross(a, b, p, q) { // proper crossing of segments ab and pq
  const d = (b[0] - a[0]) * (q[1] - p[1]) - (b[1] - a[1]) * (q[0] - p[0]); if (Math.abs(d) < 1e-9) return false;
  const u = ((p[0] - a[0]) * (q[1] - p[1]) - (p[1] - a[1]) * (q[0] - p[0])) / d, v = ((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / d;
  return u > 0 && u < 1 && v > 0 && v < 1;
}
function noisyPts(a, b, p, q, R, out) { // Red Blob's quad recursion: the new point lies on the segment between the two sites
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < EDGE_L || !segCross(a, b, p, q)) return;
  const c = lerp2(p, q, 0.4 + 0.2 * R());
  noisyPts(a, c, lerp2(a, p, 0.5), lerp2(a, q, 0.5), R, out); out.push(c); noisyPts(c, b, lerp2(b, p, 0.5), lerp2(b, q, 0.5), R, out);
}
function chaikin(P, n, closed) { // corner cutting; open polylines keep their endpoints
  for (let k = 0; k < n; k++) {
    const o = closed ? [] : [P[0]], m = P.length - 1;
    for (let j = 0; j < m; j++) { const a = P[j], b = P[j + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    if (closed) o.push(o[0]); else o.push(P[m]); P = o;
  }
  return P;
}
const ekey = (i, j) => (i < j ? i + ':' + j : j + ':' + i);
const EDGE = new Map(); // 'min:max' -> { i, j, a, b, wobble: [a ... b], straight: [a, b] }
for (let i = 0; i < N; i++) for (const j of NB[i]) {
  if (j < i) continue; const ci = cells[i];
  for (let k = 0; k < ci.length - 1; k++) {
    const a = ci[k], b = ci[k + 1];
    if (!cells[j].some((q) => PEQ(q, a)) || !cells[j].some((q) => PEQ(q, b))) continue;
    const R = rngFor(`edge:12:${i}:${j}`), mids = [];
    noisyPts(a, b, pts[i], pts[j], R, mids);
    const wob = mids.length ? chaikin([a, ...mids, b], 2, false) : [a, b];
    const Ri = rngFor(`ink:12:${i}:${j}`);
    EDGE.set(i + ':' + j, { i, j, a, b, wobble: wob, straight: [a, b], f1: 1 + Ri(), f2: 3 + 2 * Ri(), p1: Ri(), p2: Ri(), alpha: 0.85 + 0.15 * Ri() });
    break;
  }
}
function edgeBetween(i, j) { return EDGE.get(ekey(i, j)) ?? null; }
function edgePts(e) { return view.borders === 'straight' ? e.straight : e.wobble; }
function wildEdges(w) { // the range's outline as polylines (each against a cell outside the range), with the wild cell it bounds
  const out = [];
  for (const c of w.cells) for (const j of NB[c]) { if (w.cells.includes(j)) continue; const e = edgeBetween(c, j); if (e) out.push({ pts: edgePts(e), c }); }
  return out;
}
function buildNpoly(mode) { // each cell's ring with every shared edge replaced by its polyline, walked in the ring's direction
  return cells.map((ring, i) => {
    if (mode === 'straight') return ring;
    const out = [];
    for (let k = 0; k < ring.length - 1; k++) {
      const a = ring[k], b = ring[k + 1]; let seg = null;
      for (const j of NB[i]) { const e = edgeBetween(i, j); if (!e) continue; if (PEQ(e.a, a) && PEQ(e.b, b)) { seg = e.wobble; break; } if (PEQ(e.a, b) && PEQ(e.b, a)) { seg = [...e.wobble].reverse(); break; } }
      if (seg) for (let m = 0; m < seg.length - 1; m++) out.push(seg[m]); else out.push(a);
    }
    out.push(out[0]); return out;
  });
}
const NPOLY_W = buildNpoly('wobble');
let npoly = NPOLY_W;
// a lighter ring (every third point; first and last kept) for fills, overlays and band clips, where the ink covers the edge anyway
const LITE = new Map();
function npolyLite(i) { if (npoly === cells) return cells[i]; let v = LITE.get(i); if (!v) { const P = npoly[i]; v = P.filter((q, k) => k % 3 === 0 || k === P.length - 1); LITE.set(i, v); } return v; }
function provinceAt(x, y) { // the hit test on the wobbling polygons: the nearest site, then its neighbors
  const i0 = nearest(x, y); if (npoly === cells) return i0;
  for (const c of [i0, ...NB[i0]]) if (d3.polygonContains(npoly[c], [x, y])) return c;
  return i0;
}
// Ribbon geometry per edge: unit normals and the width factor along the arc (2 px x (1 + .12 sin + .05 sin)); computed once per border mode.
const RIBBON = new Map();
function ribbonOf(key) {
  const e = EDGE.get(key), mode = view.borders, k = key + ':' + mode; let r = RIBBON.get(k); if (r) return r;
  const P = edgePts(e), n = P.length, L = [0];
  for (let m = 1; m < n; m++) L.push(L[m - 1] + Math.hypot(P[m][0] - P[m - 1][0], P[m][1] - P[m - 1][1]));
  const tot = L[n - 1] || 1, nx = new Float32Array(n), ny = new Float32Array(n), wf = new Float32Array(n);
  for (let m = 0; m < n; m++) {
    const a = P[Math.max(0, m - 1)], b = P[Math.min(n - 1, m + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    nx[m] = -dy / l; ny[m] = dx / l; const t = L[m] / tot;
    wf[m] = 1 + 0.12 * Math.sin(2 * Math.PI * (e.f1 * t + e.p1)) + 0.05 * Math.sin(2 * Math.PI * (e.f2 * t + e.p2));
  }
  r = { P, nx, ny, wf, len: tot }; RIBBON.set(k, r); return r;
}
function ribbonPath(g, key, wpx, stride) { // a filled ribbon of mean width wpx world units along the edge
  const { P, nx, ny, wf } = ribbonOf(key), n = P.length, h = wpx / 2, idx = [];
  for (let m = 0; m < n; m += stride) idx.push(m); if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
  idx.forEach((m, k) => { const x = P[m][0] + nx[m] * h * wf[m], y = P[m][1] + ny[m] * h * wf[m]; k ? g.lineTo(x, y) : g.moveTo(x, y); });
  for (let k = idx.length - 1; k >= 0; k--) { const m = idx[k]; g.lineTo(P[m][0] - nx[m] * h * wf[m], P[m][1] - ny[m] * h * wf[m]); }
  g.closePath();
}

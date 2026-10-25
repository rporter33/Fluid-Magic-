
// ------------------------------------------------------------------ v3 painters: one light from the upper left (warm lit faces, cool shade faces,
// cool cast shadows to the lower right), painted tree clumps, hachured hills, ridge peaks, sheaves, landmarks, heroes, camps, stones, vignettes.
// Sizes are in u (U world units, U = MED_DIAM / 180, the same in every band); ink widths in band px (PX).
const U = MED_DIAM / 180, B_U = 6.4 * U;
const FEATURE_INK = '#3E3428', PAPER_INK = '#E8DCC2', STAMP_INK = 'rgba(62,52,40,.8)';
const DARK_T = new Set(['forest', 'hills', 'swamp']);
const FACEMEMO = new Map();
function faces(f) { // stamps: lit = fill + 12 L* toward warm light, shade = fill - 18 L* toward the cool shadow
  let v = FACEMEMO.get('s' + f); if (!v) { v = { lit: mix(shadeL(f, 12), '#F6D9A0', 0.12), shade: mix(shadeL(f, -18), '#3A4466', 0.14) }; FACEMEMO.set('s' + f, v); } return v;
}
function kitFaces(tone) { // settlements, landmarks, ruins, heroes: +8 / -12 L*, so every kit keeps its tones (H14)
  let v = FACEMEMO.get('k' + tone); if (!v) { v = { lit: mix(shadeL(tone, 8), '#F6D9A0', 0.12), shade: mix(shadeL(tone, -12), '#3A4466', 0.14) }; FACEMEMO.set('k' + tone, v); } return v;
}
const SHADOW = 'rgba(38,42,64,0.22)';
function castShadow(g, x, y, w) { g.fillStyle = SHADOW; g.beginPath(); g.ellipse(x + 0.25 * w, y + 0.4 * U, Math.max(0.01, 0.6 * w), Math.max(0.01, 0.22 * w), -10 * Math.PI / 180, 0, Math.PI * 2); g.fill(); }
function paletteP(i, band, line) {
  const f = TERRAIN[terr[i]].fill, PX = 1 / BAND_RES[band], F = faces(f);
  return { lit: F.lit, shade: F.shade, ink: STAMP_INK, lw: PX, PX, line, fill: f, trunk: shadeL(f, -30), painted: true, dark: DARK_T.has(terr[i]) };
}
// ---- the hand in the stamp ink (v3 critique 12): a slight wobble, a tapered stroke and one small break. Used on hill, passable-peak,
// rock, sheaf, landmark and pond outlines; never on settlements, tokens, borders or wild outlines. Fills stay on the clean path.
function inkPath(g, pts, R, closed, w0, col, uPer = 1 / U) { // uPer: u per local unit (the break needs a path longer than 12 u)
  let P = closed ? [...pts, pts[0]] : pts; if (P.length < 2) return;
  if (P.length > 12) { const mn = 0.6 / uPer, q = [P[0]]; for (let k = 1; k < P.length - 1; k++) { const a = q[q.length - 1]; if (Math.hypot(P[k][0] - a[0], P[k][1] - a[1]) >= mn) q.push(P[k]); } q.push(P[P.length - 1]); P = q; } // points closer than 0.6 u add nothing
  const o = [P[0]]; // one level of midpoint displacement at 0.04 of the segment, then one Chaikin pass
  for (let k = 0; k < P.length - 1; k++) { const a = P[k], b = P[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = (R() - 0.5) * 2 * 0.04 * L; o.push(L ? [(a[0] + b[0]) / 2 - ((b[1] - a[1]) / L) * d, (a[1] + b[1]) / 2 + ((b[0] - a[0]) / L) * d] : a, b); }
  P = chaikin(o, 1, false);
  const Lc = cumLen(P), tot = Lc[Lc.length - 1]; if (!(tot > 0)) return;
  let pieces = [[0, tot]];
  if (tot * uPer > 12) { const gap = (0.08 + 0.04 * R()) * tot, at = (0.15 + 0.7 * R()) * tot; pieces = closed ? [[at + gap / 2, at - gap / 2 + tot]] : [[0, at - gap / 2], [at + gap / 2, tot]]; }
  g.fillStyle = col; g.beginPath();
  for (const [d0, d1] of pieces) { // a ribbon w0 (0.75 + 0.25 sin(pi t)) wide, t along the piece
    if (d1 - d0 < 1e-6) continue; const S = [[d0, arcAt(P, Lc, d0 % tot)]];
    for (let k = 0; k < P.length - 1; k++) for (const off of closed ? [0, tot] : [0]) { const d = Lc[k] + off; if (d > d0 + 1e-9 && d < d1 - 1e-9) S.push([d, P[k]]); }
    S.push([d1, arcAt(P, Lc, d1 > tot ? d1 - tot : d1)]); if (closed) S.sort((a, b) => a[0] - b[0]);
    const left = [], right = [];
    for (let k = 0; k < S.length; k++) {
      const a = S[Math.max(0, k - 1)][1], b = S[Math.min(S.length - 1, k + 1)][1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
      const t = (S[k][0] - d0) / (d1 - d0), w = (w0 * (0.75 + 0.25 * Math.sin(Math.PI * t))) / 2, q = S[k][1];
      left.push([q[0] + nx * w, q[1] + ny * w]); right.push([q[0] - nx * w, q[1] - ny * w]);
    }
    left.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); for (let k = right.length - 1; k >= 0; k--) g.lineTo(right[k][0], right[k][1]); g.closePath();
  }
  g.fill();
}
// The subpaths a path closure builds on g, flattened to polylines in local coordinates (the closures draw on g itself, so its path
// methods are shadowed for the call and restored after).
function recordPath(g, path) {
  const subs = []; let cur = null, sx = 0, sy = 0;
  const start = (x, y) => { cur = { pts: [[x, y]], closed: false }; subs.push(cur); sx = x; sy = y; };
  const to = (x, y) => { if (!cur) { start(sx, sy); } cur.pts.push([x, y]); };
  const ell = (cx, cy, rx, ry, rot, a0, a1, ccw) => {
    const T = 2 * Math.PI; let sw = a1 - a0;
    if (!ccw) sw = sw >= T ? T : ((sw % T) + T) % T; else sw = sw <= -T ? -T : -((((a0 - a1) % T) + T) % T);
    const n = Math.max(6, Math.ceil(Math.abs(sw) / (Math.PI / 12))), cr = Math.cos(rot), sr = Math.sin(rot), fresh = !cur;
    for (let k = 0; k <= n; k++) { const a = a0 + (sw * k) / n, px = cx + rx * Math.cos(a) * cr - ry * Math.sin(a) * sr, py = cy + rx * Math.cos(a) * sr + ry * Math.sin(a) * cr; if (!k && !cur) start(px, py); else to(px, py); }
    if (fresh && Math.abs(sw) >= T - 1e-9) { cur.closed = true; cur = null; }
  };
  const rec = {
    beginPath: () => { subs.length = 0; cur = null; },
    moveTo: (x, y) => start(x, y), lineTo: (x, y) => to(x, y),
    closePath: () => { if (cur) cur.closed = true; cur = null; },
    rect: (x, y, w, h) => { start(x, y); to(x + w, y); to(x + w, y + h); to(x, y + h); cur.closed = true; cur = null; sx = x; sy = y; },
    arc: (cx, cy, r, a0, a1, ccw) => ell(cx, cy, r, r, 0, a0, a1, ccw), ellipse: ell,
    quadraticCurveTo: (cx, cy, x, y) => { const p = cur ? cur.pts[cur.pts.length - 1] : [sx, sy]; for (let k = 1; k <= 8; k++) { const t = k / 8, u = 1 - t; to(u * u * p[0] + 2 * u * t * cx + t * t * x, u * u * p[1] + 2 * u * t * cy + t * t * y); } },
    bezierCurveTo: (c1x, c1y, c2x, c2y, x, y) => { const p = cur ? cur.pts[cur.pts.length - 1] : [sx, sy]; for (let k = 1; k <= 10; k++) { const t = k / 10, u = 1 - t; to(u ** 3 * p[0] + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t ** 3 * x, u ** 3 * p[1] + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t ** 3 * y); } },
  };
  for (const k of Object.keys(rec)) g[k] = rec[k];
  try { path(); } finally { for (const k of Object.keys(rec)) delete g[k]; }
  return subs;
}
let INKHAND = null; // { R, k }: set while a landmark, ruin or hero draws, so its ink outlines get the hand
function inkStroke(g, path, col, lw) {
  if (!INKHAND) { path(); g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); return; }
  for (const sp of recordPath(g, path)) if (sp.pts.length > 1) inkPath(g, sp.pts, INKHAND.R, sp.closed, lw, col, INKHAND.k);
}
// A shape filled as two faces: lit left of xs, shade right of it, clipped to the path; then the ink outline.
function faceFill(g, path, tone, xs, bb, ink, lw, line) {
  if (line) { inkStroke(g, path, line, lw * 1.1); return; }
  const F = kitFaces(tone);
  g.save(); path(); g.clip(); g.fillStyle = F.lit; g.fillRect(bb[0], bb[1], xs - bb[0], bb[3] - bb[1]); g.fillStyle = F.shade; g.fillRect(xs, bb[1], bb[2] - xs, bb[3] - bb[1]); g.restore();
  if (ink) inkStroke(g, path, ink, lw);
}
const rectPath = (g, x, y, w, h) => () => { g.beginPath(); g.rect(x, y, w, h); };
function faceRect(g, x, y, w, h, tone, lw, line, split = 0.6) { faceFill(g, rectPath(g, x, y, w, h), tone, x + w * split, [x - 1, y - 1, x + w + 1, y + h + 1], INK, lw, line); }
const polyPath = (g, P) => () => { g.beginPath(); P.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
function facePoly(g, P, tone, lw, line, split = 0.6) { const bb = bboxOf(P); faceFill(g, polyPath(g, P), tone, bb[0] + (bb[2] - bb[0]) * split, [bb[0] - 1, bb[1] - 1, bb[2] + 1, bb[3] + 1], INK, lw, line); }

// ---- trees: lobed crowns in clumps, one outer outline per clump (stroke every crown twice the ink width, then fill every crown over it)
function crownPath(g, c) {
  g.beginPath();
  if (c.conifer) { // three jagged tiers
    const { x, y, r } = c, top = y - 1.45 * r, y1 = top + 0.5 * r, y2 = top + 0.95 * r, y3 = y - 0.05 * r;
    for (const [px, py] of [[x, top], [x + 0.55 * r, y1], [x + 0.28 * r, y1], [x + 0.8 * r, y2], [x + 0.5 * r, y2], [x + r, y3], [x - r, y3], [x - 0.5 * r, y2], [x - 0.8 * r, y2], [x - 0.28 * r, y1], [x - 0.55 * r, y1]]) g.lineTo(px, py);
    g.closePath(); return;
  }
  for (let k = 0; k <= 28; k++) { const a = (k / 28) * Math.PI * 2, rr = c.r * (1 + 0.12 * Math.sin(c.k * a + c.ph)); const px = c.x + Math.cos(a) * rr, py = c.y - c.r * 0.95 + Math.sin(a) * rr * 0.92; k ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath();
}
function crownFill(g, c, P, art) {
  if (art) { drawArtFrame(g, art, c.x, c.y, c.r * 2.3, c.seed); return; }
  if (c.conifer) { g.save(); crownPath(g, c); g.clip(); g.fillStyle = P.lit; g.fillRect(c.x - c.r * 1.2, c.y - c.r * 1.6, c.r * 1.2, c.r * 1.8); g.fillStyle = P.shade; g.fillRect(c.x, c.y - c.r * 1.6, c.r * 1.2, c.r * 1.8); g.restore(); return; }
  crownPath(g, c); g.fillStyle = P.shade; g.fill();
  crownPath(g, litFace(c)); g.fillStyle = P.lit; g.fill();
}
// v3 critique 1: the lit face is 0.8 r, its center offset (-0.16 r, -0.18 r) from the crown's center, so a crown reads lit from the upper left
// (v3 drew it 0.72 r and 0.31 r below the center, which left a dark crown with a pale bottom)
const litFace = (c) => ({ ...c, x: c.x - 0.16 * c.r, y: c.y - 0.95 * c.r - 0.18 * c.r + 0.95 * 0.8 * c.r, r: 0.8 * c.r });
function drawClump(g, crowns, P, o = {}) { // crowns sorted back to front
  const art = o.art ?? null;
  if (P.line) { for (const c of crowns) { crownPath(g, c); g.strokeStyle = P.line; g.lineWidth = P.lw; g.stroke(); } return; }
  if (!art) { g.strokeStyle = P.dark ? 'rgba(62,52,40,.6)' : 'rgba(62,52,40,.8)'; g.lineWidth = 2 * P.lw; g.lineJoin = 'round'; for (const c of crowns) { crownPath(g, c); g.stroke(); } }
  for (const c of crowns) { // trunks only under crowns with nothing just below them
    if (art) break;
    if (crowns.some((d) => d !== c && d.y > c.y && d.y - c.y < 1.2 * c.r && Math.abs(d.x - c.x) < c.r)) continue;
    g.fillStyle = P.trunk; g.fillRect(c.x - 0.12 * c.r, c.y - 0.15 * c.r, 0.24 * c.r, 0.3 * c.r + 0.6 * U);
  }
  for (const c of crowns) crownFill(g, c, P, art);
}
function makeClump(cx, cy, n, R, conRate, rU = [4, 5.5]) { // a tight seeded cluster: first crown at the center, the rest on a squashed spiral
  const out = [];
  for (let k = 0; k < n; k++) {
    const r = (rU[0] + R() * (rU[1] - rU[0])) * U, a = k * 2.4 + R() * 0.5, d = k ? 0.85 * r * Math.sqrt(k) : 0; // v3 critique 1: 1.05 -> 0.85, crowns overlap into a canopy
    out.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.62, r, k: 3 + Math.floor(R() * 3), ph: R() * 6.28, conifer: R() < conRate, seed: Math.floor(R() * 1e9) });
  }
  return out.sort((a, b) => a.y - b.y);
}

// ---- hills: humps with warm-cool faces and tapered hachures on the lower-right flank (never within 12 degrees of 45)
// v3 critique 4 and 5: an asymmetric hump (its crest at 0.4 of its width), a shade crescent on the lower-right flank (an ellipse at
// x + 0.3 w, rx 0.34 w, with a one band px soft edge), hachures that start on the crest (lit tone over the shade, feature ink on the lit
// face), the outline in the hand's ink; humps stand in ranges (hillRange), never alone (a lone dome is the reserved shape).
function humpTop(x, y, w) { const h = w * 0.42, xc = x - 0.1 * w, top = []; for (let k = 0; k <= 8; k++) { const a = Math.PI + (k / 8) * (Math.PI / 2); top.push([xc + Math.cos(a) * 0.4 * w, y + Math.sin(a) * h]); } for (let k = 1; k <= 12; k++) { const a = 1.5 * Math.PI + (k / 12) * (Math.PI / 2); top.push([xc + Math.cos(a) * 0.6 * w, y + Math.sin(a) * h]); } return { h, xc, top }; }
function humpP(g, x, y, w, P, R, art) {
  if (art) { drawArtFrame(g, art, x, y, w * 1.1, Math.floor(R() * 1e9)); return; }
  const { h, xc, top } = humpTop(x, y, w), path = () => { g.beginPath(); top.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); };
  if (P.line) { inkPath(g, top, R, false, P.lw * 1.1, P.line); return; }
  // the shade is a crescent on the lower-right flank: the hump in the shade tone, then the lit face as an ellipse offset toward the light
  // (center x - 0.18 w, rx 0.44 w), over a half-alpha ring one band px wider for the soft edge. (Deviation: the critique's literal shade
  // ellipse at x + 0.3 w, rx 0.34 w, split the asymmetric hump down a near-vertical line, the look it set out to remove.)
  path(); g.fillStyle = P.shade; g.fill();
  const lx = x - 0.18 * w, ly = y - 0.04 * h, rx = 0.44 * w, ry = 0.98 * h, n = 4 + Math.floor(R() * 3);
  g.save(); path(); g.clip(); g.fillStyle = P.lit;
  g.globalAlpha = 0.5; g.beginPath(); g.ellipse(lx, ly, rx + P.lw, ry + P.lw, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
  g.beginPath(); g.ellipse(lx, ly, rx, ry, 0, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < n; k++) { // from 0.05 to 0.45 w right of the apex, 0.12 h below the outline, down the flank at 6-33 or 57-80 degrees
    const f = 0.05 + (0.4 * (k + 0.2 + 0.6 * R())) / n, xs = xc + f * w, ys = y - h * Math.sqrt(Math.max(0, 1 - (f / 0.6) ** 2)) + 0.12 * h;
    const deg = k % 2 ? 6 + R() * 27 : 57 + R() * 23, a = (deg * Math.PI) / 180, L = (0.35 + R() * 0.2) * w * 0.5;
    const onShade = ((xs - lx) / rx) ** 2 + ((ys - ly) / ry) ** 2 >= 1;
    taper(g, xs, ys, xs + Math.cos(a) * L, ys + Math.sin(a) * L, 0.9 * P.lw, onShade ? rgba(P.lit, 0.55) : 'rgba(62,52,40,.75)');
  }
  g.restore();
  inkPath(g, top, R, false, P.lw, STAMP_INK);
}
function hillRangeGeom(x, y, w, R, nForce) { // 2 to 4 humps: the lead (w) at the back, flankers 0.55-0.8 w wide lower-left and lower-right, 0.35-0.5 w out
  const n0 = 2 + Math.floor(R() * 3), n = nForce ?? n0, first = R() < 0.5 ? -1 : 1, out = [{ x, y: y - 0.06 * w, w }], reach = { '-1': 0, '1': 0 };
  for (let k = 1; k < n; k++) {
    const s = k % 2 ? first : -first, wk = (n === 2 ? 0.5 + 0.12 * R() : 0.5 + 0.2 * R()) * w, off = reach[s] + (reach[s] ? (0.35 + 0.15 * R()) * wk : (n === 2 ? 0.62 + 0.1 * R() : 0.55 + 0.12 * R()) * w); // spread so the notches show (a lone dome is reserved)
    reach[s] = off; out.push({ x: x + s * off, y: y + (n === 2 ? 0.1 + 0.04 * R() : 0.07 + 0.06 * R()) * w, w: wk });
  }
  return out.sort((a, b) => a.y - b.y);
}
function hillRange(g, list, P, R, art) { for (const q of list) humpP(g, q.x, q.y, q.w, P, R, art); }
const rangeBox = (list) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const q of list) { a = Math.min(a, q.x - q.w / 2); c = Math.max(c, q.x + q.w / 2); b = Math.min(b, q.y - (q.h ?? q.w * 0.42)); d = Math.max(d, q.y); } return [a, b, c, d]; };
function peakRangeGeom(x, y, w, R, nForce) { // 3 to 5 passable peaks chained along an axis within +-20 degrees of horizontal; the tallest in the middle
  const n0 = 3 + Math.floor(R() * 3), n = nForce ?? n0, th = (R() - 0.5) * 2 * ((20 * Math.PI) / 180), ax = [Math.cos(th), Math.sin(th)], left = Math.floor((n - 1) / 2) + (n % 2 ? 0 : R() < 0.5 ? 1 : 0);
  const out = [{ x, y, w, h: 0.75 * w, d: 0 }];
  for (const [s, m] of [[-1, left], [1, n - 1 - left]]) {
    let prev = out[0];
    for (let k = 0; k < m; k++) {
      const hk = prev.h * (k ? 0.75 + 0.15 * R() : 0.6 + 0.25 * R()), wk = hk / 0.75, off = Math.abs(prev.d) + prev.w / 2 + wk / 2 - 0.35 * wk, j = (R() - 0.5) * 0.08 * w;
      const q = { x: x + s * ax[0] * off - ax[1] * j, y: y + s * ax[1] * off + ax[0] * j, w: wk, h: hk, d: off }; out.push(q); prev = q;
    }
  }
  return out.sort((a, b) => a.y - b.y || a.h - b.h);
}
function taper(g, x0, y0, x1, y1, w0, col) { // width w0 sin(pi t)^0.6 + 0.2 band px, as a filled sliver
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, m = 6, left = [], right = [];
  for (let k = 0; k <= m; k++) { const t = k / m, w = (w0 * Math.pow(Math.sin(Math.PI * t), 0.6) + 0.2 * w0 / 0.9) / 2; const px = x0 + dx * t, py = y0 + dy * t; left.push([px + nx * w, py + ny * w]); right.push([px - nx * w, py - ny * w]); }
  g.beginPath(); left.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); for (let k = right.length - 1; k >= 0; k--) g.lineTo(...right[k]); g.closePath(); g.fillStyle = col; g.fill();
}

// ---- peaks: ridge profiles by three levels of midpoint displacement; passable ones low and rounded, wild ones tall and sharp with ragged snow
function ridge(a, b, R, amp, levels) {
  let P = [a, b];
  for (let lv = 0; lv < levels; lv++) { const o = [P[0]]; for (let k = 0; k < P.length - 1; k++) { const p = P[k], q = P[k + 1], L = Math.hypot(q[0] - p[0], q[1] - p[1]), nx = -(q[1] - p[1]) / (L || 1), ny = (q[0] - p[0]) / (L || 1), d = (R() - 0.5) * 2 * amp * L; o.push([(p[0] + q[0]) / 2 + nx * d, (p[1] + q[1]) / 2 + ny * d], q); } P = o; amp *= 0.55; }
  return P;
}
function peakGeom(x, y, h, w, R, wild) {
  const ax = x - w * 0.06, apex = [ax, y - h], mid = [x + w * 0.08, y];
  let L = ridge([x - w / 2, y], apex, R, wild ? 0.16 : 0.12, 3), Rr = ridge(apex, [x + w / 2, y], R, wild ? 0.16 : 0.12, 3);
  if (!wild) { L = chaikin(L, 2, false); Rr = chaikin(Rr, 2, false); }
  const valley = ridge(apex, mid, R, 0.08, 2);
  return { L, Rr, valley, apex, mid, x, y, h, w, wild };
}
function peakPaint(g, q, cols, P, lineCol) {
  const { L, Rr, valley, apex, y, h, w, x } = q;
  const outline = [...L, ...Rr.slice(1)];
  const hand = !q.wild ? rngFor(`ink:peak:${(x * 8) | 0}:${(y * 8) | 0}`) : null; // passable peaks only: wild contours keep the clean line
  if (lineCol) { if (hand) inkPath(g, outline, hand, false, P.lw, lineCol); else { g.beginPath(); outline.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.strokeStyle = lineCol; g.lineWidth = P.lw; g.stroke(); } g.beginPath(); valley.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.strokeStyle = lineCol; g.lineWidth = P.lw * 0.6; g.stroke(); return; }
  const litFace = [...L, ...valley.slice(1)];
  const shadeFace = [...valley, ...[...Rr].reverse().slice(0, -1)];
  const lg = g.createLinearGradient(0, y - h, 0, y); lg.addColorStop(0, shadeL(cols.lit, 4)); lg.addColorStop(1, cols.lit);
  g.beginPath(); litFace.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fillStyle = lg; g.fill();
  g.beginPath(); shadeFace.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fillStyle = cols.shade; g.fill();
  if (cols.snow) { // ragged lower edge, 3 to 5 teeth, down to 40% of the height
    const sy = y - h + 0.4 * h, teeth = 3 + Math.floor(((x * 7 + y * 3) % 1000) / 334), zig = [];
    for (let k = 0; k <= teeth * 2; k++) { const t = k / (teeth * 2); zig.push([x - w / 2 + t * w, sy - (k % 2 ? 0.16 * h : 0) + 0.04 * h * Math.sin(k * 1.7)]); }
    g.save(); g.beginPath(); outline.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.clip();
    g.beginPath(); g.moveTo(x - w, y - h - 2); g.lineTo(x + w, y - h - 2); for (let k = zig.length - 1; k >= 0; k--) g.lineTo(...zig[k]); g.closePath();
    g.save(); g.clip(); g.beginPath(); litFace.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fillStyle = cols.snow; g.fill();
    g.beginPath(); shadeFace.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fillStyle = cols.snowShade; g.fill(); g.restore(); g.restore();
  }
  g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = cols.ink;
  const top = outline.filter(([, py]) => py < y - h * 0.62);
  if (hand) { inkPath(g, outline, hand, false, cols.lw * 0.8, cols.ink); if (top.length > 1) inkPath(g, top, hand, false, cols.lw * 1.4, cols.ink); g.strokeStyle = cols.ink; }
  else { g.beginPath(); outline.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.lineWidth = cols.lw * 0.8; g.stroke();
    if (top.length > 1) { g.beginPath(); top.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.lineWidth = cols.lw * 1.4; g.stroke(); } }
  g.beginPath(); valley.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.lineWidth = cols.lw * 0.5; g.stroke(); g.lineCap = 'butt';
}

// ---- sheaves (H6: the approved half-dome haystack is the camp tent's silhouette): upright tied bundles, in rows along the furrows
function sheaf(g, x, y, P, line) {
  const w = 2.6 * U, h = 4.2 * U;
  const body = [[x - 0.48 * w, y], [x - 0.15 * w, y - 0.4 * h], [x - 0.5 * w, y - 0.84 * h], [x - 0.22 * w, y - h], [x + 0.22 * w, y - h], [x + 0.5 * w, y - 0.84 * h], [x + 0.15 * w, y - 0.4 * h], [x + 0.48 * w, y]];
  const path = polyPath(g, body), hand = rngFor(`ink:sheaf:${(x * 8) | 0}:${(y * 8) | 0}`);
  if (line) inkPath(g, body, hand, true, P.lw, line);
  else { g.save(); path(); g.clip(); g.fillStyle = P.lit; g.fillRect(x - w, y - h - 1, w, h + 2); g.fillStyle = P.shade; g.fillRect(x + 0.05 * w, y - h - 1, w, h + 2); g.restore(); inkPath(g, body, hand, true, P.lw * 0.8, STAMP_INK); }
  g.strokeStyle = line ?? FEATURE_INK; g.lineWidth = P.lw * 0.7; g.beginPath();
  for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k - 1.5) * 0.32; g.moveTo(x + (k - 1.5) * 0.12 * w, y - h); g.lineTo(x + (k - 1.5) * 0.12 * w + Math.cos(a) * 0.32 * h, y - h + Math.sin(a) * 0.32 * h); } // fanned ears
  if (!line) { g.moveTo(x - 0.2 * w, y - 0.4 * h); g.lineTo(x + 0.2 * w, y - 0.4 * h); } // the waist tie
  g.stroke();
}
function sheafRow(g, x, y, P, n, ang, line) { for (let k = 0; k < n; k++) { const d = (k - (n - 1) / 2) * 3.2 * U; sheaf(g, x + Math.cos(ang) * d, y + Math.sin(ang) * d * 0.6, P, line); } }

// ---- landmarks (about 17 u; stone #CFC6B4, timber #8C6A47; settlement faces; ink #1C1A17 at 0.9 band px). Drawn on a grid of LS * 1.3.
const STONE = '#CFC6B4', TIMBER = '#8C6A47', LMS = () => LS * 1.3;
function onGrid(g, x, y, scale, mirror, fn) { g.save(); g.translate(x, y); g.scale(mirror ? -scale : scale, scale); try { fn(); } finally { g.restore(); } }
function rubble(g, pts, lw, line) { for (const [x, y, r] of pts) { const path = () => { g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); }; if (!line) { path(); g.fillStyle = STONE; g.fill(); } inkStroke(g, path, line ?? INK, lw * 0.7); } }
function moundPath(g, x0, x1, hgt) { return () => { g.beginPath(); g.ellipse((x0 + x1) / 2, 0, (x1 - x0) / 2, hgt, 0, Math.PI, 0); g.closePath(); }; }
function archPath(g, x0, x1, top, bottom) { // an opening: a rectangle with a round head
  const r = (x1 - x0) / 2, cx = (x0 + x1) / 2; g.moveTo(x0, bottom); g.lineTo(x0, top + r); g.arc(cx, top + r, r, Math.PI, 0); g.lineTo(x1, bottom); g.closePath();
}
const LANDMARKS = {
  mine(g, lw, line, P) { // v3 critique 4: a timber A-frame headframe (two raked legs, a cross-beam, a head block; no wheel) on a plank collar, over a
    // flat spoil fan of dots. No mound and no dark opening (a mound with an opening is the beast den); the spoil is never stacked (cairns).
    void P;
    rubble(g, [[2.6, -0.25, 0.5], [3.7, -0.15, 0.55], [4.8, -0.05, 0.5], [5.8, 0, 0.45], [6.8, 0.05, 0.4], [7.7, 0.1, 0.35], [3.2, -1.05, 0.42], [4.3, -0.95, 0.4], [5.3, -0.8, 0.36], [6.3, -0.6, 0.3]], lw, line);
    faceRect(g, -4.8, -1.0, 7.6, 1.0, TIMBER, lw, line);
    for (const [bx, tx] of [[-4.0, -0.75], [2.2, 0.45]]) facePoly(g, [[bx - 0.45, -1], [tx - 0.4, -9.4], [tx + 0.4, -9.4], [bx + 0.45, -1]], TIMBER, lw, line, 0.5);
    faceRect(g, -3.1, -5.5, 4.9, 0.8, TIMBER, lw, line);
    faceRect(g, -1.5, -10.4, 2.6, 1.2, TIMBER, lw, line);
    g.strokeStyle = line ?? INK; g.lineWidth = lw * 0.5; g.beginPath(); g.moveTo(-0.2, -9.2); g.lineTo(-0.2, -1.0); g.stroke(); // the hoist rope
  },
  windmill(g, lw, line) {
    facePoly(g, [[-2.3, 0], [-1.5, -9], [1.5, -9], [2.3, 0]], STONE, lw, line);
    if (!line) { g.fillStyle = '#3E3428'; g.fillRect(-0.6, -2, 1.2, 2); }
    facePoly(g, [[-1.9, -9], [0, -11.2], [1.9, -9]], TIMBER, lw, line);
    const hub = [0, -9.8];
    for (let k = 0; k < 4; k++) { // sails at 22.5 + k 90 degrees, never at 45
      const a = ((22.5 + k * 90) * Math.PI) / 180, ex = hub[0] + Math.cos(a) * 7.2, ey = hub[1] + Math.sin(a) * 7.2, nx = -Math.sin(a) * 1.3, ny = Math.cos(a) * 1.3;
      const sail = [[hub[0] + Math.cos(a) * 1.6, hub[1] + Math.sin(a) * 1.6], [ex, ey], [ex + nx, ey + ny], [hub[0] + Math.cos(a) * 1.6 + nx, hub[1] + Math.sin(a) * 1.6 + ny]];
      g.beginPath(); sail.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); if (!line) { g.fillStyle = k % 2 ? '#E8DCC5' : '#D6CCB6'; g.fill(); } g.strokeStyle = line ?? INK; g.lineWidth = lw * 0.7; g.stroke();
      g.beginPath(); g.moveTo(...hub); g.lineTo(ex, ey); g.lineWidth = lw * 1.1; g.stroke();
    }
  },
  arch(g, lw, line) { // a ruined arch: two coursed piers, the ring between them broken short of the right pier, voussoirs, rubble
    const blocks = (x0, y0, w, h, n) => { if (line) return; g.strokeStyle = 'rgba(28,26,23,.55)'; g.lineWidth = lw * 0.5; g.beginPath(); for (let k = 1; k < n; k++) { const y = y0 + (h * k) / n; g.moveTo(x0, y); g.lineTo(x0 + w, y); g.moveTo(x0 + (k % 2 ? w * 0.45 : w * 0.7), y); g.lineTo(x0 + (k % 2 ? w * 0.45 : w * 0.7), y - h / n); } g.stroke(); };
    faceRect(g, -5.6, -7.2, 2.6, 7.2, STONE, lw, line, 0.5); blocks(-5.6, -7.2, 2.6, 7.2, 4);
    facePoly(g, [[3, 0], [3, -4.6], [3.8, -5.2], [4.6, -4.4], [5.6, -4.9], [5.6, 0]], STONE, lw, line, 0.5); blocks(3, -4.4, 2.6, 4.4, 3);
    const cx = -0.0, cy = -7.2, ro = 5.6, ri = 3.0, a0 = Math.PI, a1 = Math.PI * 1.66, P = [];
    for (let k = 0; k <= 14; k++) { const a = a0 + (k / 14) * (a1 - a0); P.push([cx + Math.cos(a) * ro, cy + Math.sin(a) * ro]); }
    P.push([cx + Math.cos(a1 + 0.06) * (ri + 1.1), cy + Math.sin(a1 + 0.06) * (ri + 1.1)]);
    for (let k = 14; k >= 0; k--) { const a = a0 + (k / 14) * (a1 - a0); P.push([cx + Math.cos(a) * ri, cy + Math.sin(a) * ri]); }
    facePoly(g, P, STONE, lw, line, 0.5);
    if (!line) { g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = lw * 0.55; g.beginPath(); for (let k = 1; k < 6; k++) { const a = a0 + (k / 6) * (a1 - a0); g.moveTo(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri); g.lineTo(cx + Math.cos(a) * ro, cy + Math.sin(a) * ro); } g.stroke(); }
    rubble(g, [[1.2, 0, 0.7], [2.2, -0.35, 0.5], [0.2, 0.2, 0.45], [6.6, 0.1, 0.5], [1.7, 0.45, 0.35]], lw, line);
  },
  smallArch(g, lw, line) { // a small broken arch (the ring alone, standing)
    const P = []; for (let k = 0; k <= 12; k++) { const a = Math.PI + (k / 12) * Math.PI * 0.8; P.push([Math.cos(a) * 4, -0.2 + Math.sin(a) * 4.4]); } for (let k = 12; k >= 0; k--) { const a = Math.PI + (k / 12) * Math.PI * 0.8; P.push([Math.cos(a) * 2.4, -0.2 + Math.sin(a) * 2.8]); }
    facePoly(g, [[-4, 0], ...P, [-2.4, 0]], STONE, lw, line, 0.5);
  },
  barrow(g, lw, line, P) { // a long grassy mound, at least 2.5 times as long as tall, no opening (v3 critique: longer and lower, aspect 6, clear of the den)
    faceFill(g, moundPath(g, -7.8, 7.8, 2.6), P.fill, -1.5, [-9, -4, 9, 1], STAMP_INK, lw, line);
    if (!line) { g.strokeStyle = STAMP_INK; g.lineWidth = lw * 0.6; g.beginPath(); for (const x of [-4, -1, 2.5, 5]) { g.moveTo(x, -1.9 + Math.abs(x) * 0.16); g.lineTo(x + 0.4, -2.5 + Math.abs(x) * 0.16); } g.stroke(); }
  },
  aqueduct(g, lw, line) { // a fragment of three arches, the right end broken
    const path = () => { g.beginPath(); g.moveTo(-7, 0); g.lineTo(-7, -7.5); g.lineTo(3.5, -7.5); g.lineTo(4.4, -6.6); g.lineTo(5.6, -6.9); g.lineTo(6.6, -5.4); g.lineTo(6.6, 0); g.closePath(); for (const x0 of [-5.6, -1.4, 2.8]) archPath(g, x0, x0 + 2.8, -5.5, 0); };
    if (line) { inkStroke(g, path, line, lw * 1.1); return; }
    const F = kitFaces(STONE); g.save(); path(); g.clip('evenodd'); g.fillStyle = F.lit; g.fillRect(-8, -9, 9.5, 10); g.fillStyle = F.shade; g.fillRect(1.5, -9, 6, 10); g.restore();
    inkStroke(g, path, INK, lw);
  },
  wallFragment(g, lw, line) { // a ruined wall with an empty window
    const path = () => { g.beginPath(); g.moveTo(-5, 0); g.lineTo(-5, -7.5); g.lineTo(-3.4, -8.4); g.lineTo(-1.8, -7.2); g.lineTo(0.2, -8); g.lineTo(1.8, -5.6); g.lineTo(3.2, -6.1); g.lineTo(4.4, -3.6); g.lineTo(4.4, 0); g.closePath(); archPath(g, -1.9, 0.4, -6, -2.8); };
    if (line) { inkStroke(g, path, line, lw * 1.1); return; }
    const F = kitFaces(STONE); g.save(); path(); g.clip('evenodd'); g.fillStyle = F.lit; g.fillRect(-6, -9, 7.2, 10); g.fillStyle = F.shade; g.fillRect(1.2, -9, 4, 10); g.restore();
    inkStroke(g, path, INK, lw); rubble(g, [[5.4, 0, 0.5], [6.2, -0.1, 0.4]], lw, line);
  },
  fallenTrunk(g, lw, line) { // lying flat with its roots (a bare dead tree standing is Rot's)
    faceFill(g, () => { g.beginPath(); g.moveTo(-5, -0.2); g.lineTo(5.5, -0.5); g.lineTo(5.6, -2.4); g.lineTo(-5, -2.7); g.closePath(); }, '#7A5E40', 1.5, [-6, -3, 6, 0], INK, lw, line);
    if (!line) { g.fillStyle = '#D8C29A'; g.beginPath(); g.ellipse(5.55, -1.45, 0.5, 0.98, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.stroke(); }
    g.strokeStyle = line ?? '#5A4430'; g.lineWidth = lw * 1.3; g.lineCap = 'round'; g.beginPath();
    for (const [dx, dy] of [[-2.4, -3.2], [-3.0, -0.6], [-2.2, 1.6], [-1.2, -3.4], [-2.8, 0.9]]) { g.moveTo(-5, -1.4); g.quadraticCurveTo(-5 + dx * 0.5, -1.4 + dy * 0.2, -5 + dx, -1.4 + dy); }
    g.stroke(); g.lineCap = 'butt';
  },
  columns(g, lw, line) { // three broken columns on a step
    faceRect(g, -6, -1.3, 12, 1.3, STONE, lw, line);
    for (const [x, h] of [[-3.9, 6.2], [0, 4.1], [3.9, 2.4]]) {
      const P = [[x - 0.85, -1.3], [x - 0.85, -1.3 - h], [x - 0.2, -1.3 - h - 0.5], [x + 0.3, -1.3 - h + 0.2], [x + 0.85, -1.3 - h - 0.3], [x + 0.85, -1.3]];
      facePoly(g, P, STONE, lw, line, 0.55);
      if (h > 5 && !line) faceRect(g, x - 1.15, -1.3 - h - 0.2, 2.3, 0.7, STONE, lw, line);
    }
  },
  sunkenColumns(g, lw, line, P) { // half-sunken columns in reeds
    for (const [x, h, a] of [[-3, 4.6, -0.12], [1.2, 3.0, 0.1], [4, 2.0, 0.05]]) { g.save(); g.translate(x, 0); g.rotate(a); facePoly(g, [[-0.8, 0], [-0.8, -h], [0, -h - 0.4], [0.8, -h + 0.1], [0.8, 0]], STONE, lw, line, 0.55); g.restore(); }
    reedFringe(g, -5.5, 5.5, lw, line, P);
  },
  sunkenArch(g, lw, line, P) {
    faceFill(g, () => { g.beginPath(); g.moveTo(-4.4, 0); g.arc(0, 0, 4.4, Math.PI, Math.PI * 1.85); g.lineTo(2.2, -2.1); g.arc(0, 0, 2.6, Math.PI * 1.8, Math.PI, true); g.closePath(); }, STONE, -0.5, [-5, -5, 5, 1], INK, lw, line);
    reedFringe(g, -5.5, 5, lw, line, P);
  },
  toppledStatue(g, lw, line) { // a statue lying face down beside its plinth
    faceRect(g, 3.6, -3.2, 2.6, 3.2, STONE, lw, line);
    facePoly(g, [[-6.2, -0.2], [-6.4, -1.6], [-5.4, -2.4], [-4.4, -1.9], [-3.8, -2.3], [1.8, -2.6], [3.2, -1.8], [3.3, -0.2]], STONE, lw, line, 0.5);
    if (!line) { g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.beginPath(); g.moveTo(-1.6, -2.4); g.lineTo(-1.2, -0.6); g.moveTo(0.9, -2.5); g.lineTo(1.1, -0.5); g.stroke(); }
  },
};
function reedFringe(g, x0, x1, lw, line, P) { g.strokeStyle = line ?? '#5E6A48'; g.lineWidth = lw * 0.9; g.beginPath(); for (let x = x0; x <= x1; x += 1.1) { const h = 1.4 + ((x * 13.7) % 1.2); g.moveTo(x, 0.4); g.lineTo(x + 0.25, 0.4 - h); } g.stroke(); void P; }
// Heroes: one per named region, 34 to 43 u wide (drawn on the same grid; about 19 to 24 grid units).
const HEROES = {
  heroFeet(g, lw, line) { // the stone feet of a fallen colossus on a plinth
    faceRect(g, -10, -3.2, 20, 3.2, STONE, lw, line);
    for (const s of [-1, 1]) {
      const x = s * 4.2;
      facePoly(g, [[x - 3.6, -3.2], [x - 3.2, -5], [x - 1.6, -5.6], [x - 1.4, -12], [x - 0.4, -13.2], [x + 0.6, -12.2], [x + 1.4, -13], [x + 1.6, -5.4], [x + 3.4, -4.6], [x + 3.8, -3.2]], STONE, lw, line, 0.5);
      if (!line) { g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(x + 1.6 + k * 0.5, -4.6 + k * 0.2); g.lineTo(x + 1.6 + k * 0.5, -3.4); } g.stroke(); }
    }
  },
  heroAqueduct(g, lw, line) { // a long ruined aqueduct of five arches striding across the fields
    const path = () => { g.beginPath(); g.moveTo(-12, 0); g.lineTo(-12, -9); g.lineTo(6, -9); g.lineTo(7.2, -7.6); g.lineTo(8.6, -7.9); g.lineTo(9.6, -5.4); g.lineTo(10.8, -5.6); g.lineTo(11.6, -3); g.lineTo(11.6, 0); g.closePath(); for (let k = 0; k < 5; k++) { const x0 = -10.6 + k * 4.4; archPath(g, x0, x0 + 3, -6.4, 0); } };
    if (line) { inkStroke(g, path, line, lw * 1.1); return; }
    const F = kitFaces(STONE); g.save(); path(); g.clip('evenodd'); g.fillStyle = F.lit; g.fillRect(-13, -10, 16, 11); g.fillStyle = F.shade; g.fillRect(3, -10, 10, 11); g.restore();
    inkStroke(g, path, INK, lw); g.strokeStyle = INK; g.beginPath(); g.moveTo(-12, -7.6); g.lineTo(6.8, -7.6); g.lineWidth = lw * 0.6; g.stroke();
    rubble(g, [[12.6, 0, 0.6], [13.6, -0.2, 0.5], [12.2, 0.3, 0.4]], lw, line);
  },
  heroStump(g, lw, line) { // a giant flat-topped ancient stump with roots and ferns, and no crown
    faceFill(g, () => { g.beginPath(); g.moveTo(-7, 0); g.quadraticCurveTo(-5.4, -2, -5.6, -8); g.lineTo(5.6, -8); g.quadraticCurveTo(5.4, -2, 7, 0); g.closePath(); }, '#7A5E40', 0.8, [-8, -9, 8, 1], INK, lw, line);
    const top = () => { g.beginPath(); g.ellipse(0, -8, 5.6, 1.6, 0, 0, Math.PI * 2); }; if (!line) { top(); g.fillStyle = '#D8C29A'; g.fill(); } inkStroke(g, top, line ?? INK, lw);
    if (!line) { g.strokeStyle = 'rgba(110,82,50,.8)'; g.lineWidth = lw * 0.5; for (const r of [1.2, 2.4, 3.6, 4.6]) { g.beginPath(); g.ellipse(0.3, -8, r, r * 0.28, 0, 0, Math.PI * 2); g.stroke(); } }
    g.strokeStyle = line ?? '#5A4430'; g.lineWidth = lw * 1.6; g.lineCap = 'round'; g.beginPath();
    for (const [x, dx] of [[-6.4, -4], [-4, -2.4], [5.8, 4.2], [3.4, 2.8], [0.6, 0.6]]) { g.moveTo(x, -0.4); g.quadraticCurveTo(x + dx * 0.5, 0.8, x + dx, 1.4); }
    g.stroke(); g.lineCap = 'butt';
    if (!line) for (const fx of [-8.6, 8.4]) fern(g, fx, 1, lw);
  },
  heroHead(g, lw, line, P) { // v3 critique 4: a colossal stone head toppled onto its back and seen in profile (brow, nose and chin skyward), its
    // neck stump cut clean at the right, so its outline is long and broken (an upright half-buried face was a dome: the beast den's family)
    void P;
    const head = [[-10.6, 0], [-10.9, -2.3], [-10.1, -4.5], [-8.5, -6.3], [-6.2, -7.3], [-3.6, -7.6], [-1.3, -7.3], [0.3, -6.9], [1.0, -6.3], [1.9, -6.8], [2.5, -8.8], [3.2, -9.2], [3.9, -7.4], [4.7, -7.0], [5.2, -6.4], [5.8, -6.8], [6.6, -6.4], [7.2, -5.3], [7.3, -4.5], [10.4, -4.4], [10.4, 0]];
    facePoly(g, head, STONE, lw, line, 0.55);
    faceFill(g, () => ellipse(g, 10.4, -2.2, 1.0, 2.2), STONE, 10.2, [9.3, -4.6, 11.6, 0.2], INK, lw, line); // the neck's cut face
    g.strokeStyle = line ?? INK; g.lineWidth = lw * 0.8; g.beginPath();
    g.moveTo(-0.6, -5.4); g.quadraticCurveTo(0.6, -4.8, 1.6, -5.5); // the closed eye
    g.moveTo(-4.6, -2.4); g.quadraticCurveTo(-5.8, -3.6, -4.4, -4.8); // the ear
    g.moveTo(5.0, -6.2); g.lineTo(5.6, -5.4); // the lips
    if (!line) { g.moveTo(-7.6, -5.4); g.lineTo(-6.8, -3.9); g.moveTo(8.4, -4.2); g.lineTo(8.9, -2.6); } // weathering cracks
    g.stroke();
  },
  heroArch(g, lw, line) { // a great natural stone arch, rounded, no cliff ticks
    const path = () => { g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-11, -6, -7.5, -10.5); g.quadraticCurveTo(-2, -14.5, 5, -11.5); g.quadraticCurveTo(10, -8.5, 10, 0); g.closePath(); g.moveTo(-6, 0); g.quadraticCurveTo(-6.6, -6.4, -1.5, -7.6); g.quadraticCurveTo(4.4, -7.4, 5.4, 0); g.closePath(); };
    if (line) { inkStroke(g, path, line, lw * 1.1); return; }
    const F = kitFaces('#B9AE98'); g.save(); path(); g.clip('evenodd'); g.fillStyle = F.lit; g.fillRect(-12, -15, 13, 16); g.fillStyle = F.shade; g.fillRect(1, -15, 11, 16); g.restore();
    inkStroke(g, path, INK, lw);
    g.strokeStyle = 'rgba(28,26,23,.45)'; g.lineWidth = lw * 0.5; g.beginPath(); g.moveTo(-8.6, -4); g.quadraticCurveTo(-7, -9.6, -1, -11.6); g.moveTo(7.2, -3); g.quadraticCurveTo(7.6, -7.6, 3.6, -10); g.stroke();
  },
  heroPier(g, lw, line, P) { // a great broken bridge pier with one arch, standing in reeds
    const path = () => { g.beginPath(); g.moveTo(-4, 0); g.lineTo(-4, -14); g.lineTo(-2.6, -15); g.lineTo(-1, -14.2); g.lineTo(0, -14.8); g.lineTo(0, -12); g.quadraticCurveTo(4, -12.6, 7.2, -9.6); g.lineTo(8.4, -10.4); g.lineTo(9.2, -8.6); g.lineTo(8.4, -7.2); g.quadraticCurveTo(5, -9.6, 0, -8.6); g.lineTo(0, 0); g.closePath(); };
    faceFill(g, path, STONE, -1.4, [-5, -16, 10, 1], INK, lw, line);
    if (!line) { g.strokeStyle = 'rgba(28,26,23,.5)'; g.lineWidth = lw * 0.5; g.beginPath(); for (let y = -2; y > -13; y -= 2.2) { g.moveTo(-4, y); g.lineTo(0, y); } g.stroke(); }
    reedFringe(g, -9, 9, lw, line, P);
    if (!line) { g.strokeStyle = '#9FD0D4'; g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(-8, 1.2); g.lineTo(-5, 1.2); g.moveTo(2, 1.4); g.lineTo(6, 1.4); g.stroke(); }
  },
  heroStatue(g, lw, line) { // a colossal toppled statue lying face down
    faceRect(g, 7.6, -4.6, 3.6, 4.6, STONE, lw, line);
    facePoly(g, [[-11, -0.3], [-11.4, -2.4], [-10, -3.6], [-8.4, -3.2], [-7.6, -3.8], [-4, -4.4], [3, -4.2], [5.6, -3.4], [7.4, -2.2], [7.6, -0.3]], STONE, lw, line, 0.5);
    facePoly(g, [[-4.6, -4.2], [-2.6, -6.4], [-1.4, -6.2], [-2.6, -4.2]], STONE, lw, line, 0.5); // an arm lifted from the ground
    if (!line) { g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.beginPath(); for (const x of [-6, -1, 2.6]) { g.moveTo(x, -4.1); g.lineTo(x + 0.4, -0.5); } g.stroke(); }
  },
};
function fern(g, x, y, lw) { g.strokeStyle = '#5E7F45'; g.lineWidth = lw * 0.8; g.beginPath(); for (const a of [-0.8, -0.3, 0.3, 0.8]) { g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * 1.4, y - 1.4, x + Math.sin(a) * 2.6, y - 2); } g.stroke(); }
const RUIN_KINDS = { plains: ['arch', 'barrow', 'aqueduct'], farmland: ['aqueduct', 'wallFragment'], forest: ['fallenTrunk', 'wallFragment', 'arch'], hills: ['columns', 'barrow', 'arch'], mountains: ['columns', 'toppledStatue'], swamp: ['sunkenColumns', 'sunkenArch'], wasteland: ['arch', 'columns', 'toppledStatue'] };
const HERO_KIND = { plains: 'heroFeet', farmland: 'heroAqueduct', forest: 'heroStump', hills: 'heroHead', mountains: 'heroArch', swamp: 'heroPier', wasteland: 'heroStatue' };
const LM_W = { mine: 13, windmill: 10, arch: 9, smallArch: 8, barrow: 14, aqueduct: 14, wallFragment: 10, fallenTrunk: 12, columns: 12, sunkenColumns: 11, sunkenArch: 10, toppledStatue: 13 };
function drawLandmark(g, kind, x, y, PX, P, line, mirror, hero, scale) {
  const sc = scale ?? LMS(), fn = (hero ? HEROES : LANDMARKS)[kind], prev = INKHAND;
  INKHAND = { R: rngFor(`ink:${kind}:${(x * 8) | 0}:${(y * 8) | 0}`), k: sc / U }; // landmarks, ruins and heroes: outlines in the hand's ink
  try { onGrid(g, x, y, sc, mirror, () => fn(g, (0.9 * PX) / sc, line, P)); } finally { INKHAND = prev; }
}

// ---- independent camps (Near; H11): 1 to 4 domed tents by the public strength word, a finial, a pale door line; never a dark slit
const CANVAS = '#B9B4A6';
function campTent(g, x, y, PX, line) {
  const w = 5 * U, h = 4.2 * U, path = () => { g.beginPath(); g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); g.closePath(); };
  faceFill(g, path, CANVAS, x + w * 0.08, [x - w, y - h - 1, x + w, y + 1], line ? null : INK, 0.9 * PX, line);
  g.strokeStyle = line ?? INK; g.lineWidth = 0.9 * PX; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x, y - h - 1.2 * U); g.stroke();
  if (!line) { g.strokeStyle = PAPER_INK; g.lineWidth = 0.8 * PX; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h * 0.55); g.stroke(); }
  else { g.lineWidth = 0.8 * PX; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h * 0.55); g.stroke(); }
}
const strengthWord = (v) => (v < 16 ? 'weak' : v < 24 ? 'moderate' : v < 30 ? 'strong' : 'fortress');
const TENTS = { weak: 1, moderate: 2, strong: 3, fortress: 4 };

// ---- mana spring stones (Near; redundant with the Springs mode)
function springStone(g, x, y, c, PX) {
  g.fillStyle = '#E9E1CC'; g.beginPath(); g.arc(x, y, 4.5 * U, 0, Math.PI * 2); g.fill(); g.strokeStyle = INK; g.lineWidth = PX; g.stroke();
  const img = manaImg[c]; if (img && img.complete && img.naturalWidth) g.drawImage(img, x - 3.5 * U, y - 3.5 * U, 7 * U, 7 * U);
}

// ---- vignettes (Near only; 5 to 8 u; pale birds only; nothing that moves)
const VIG = {
  plains: 'sheep', hills: 'sheep', forest: 'deer', swamp: 'heron', mountains: 'goats', farmland: 'cows', wasteland: 'hare',
};
function vignette(g, kind, x, y, PX, R) {
  const lw = 0.7 * PX, ink = INK;
  const body = (bx, by, rx, ry, col) => { g.beginPath(); g.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke(); };
  const legs = (bx, by, rx, hh) => { g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); for (const dx of [-0.6, 0.6]) { g.moveTo(bx + dx * rx, by); g.lineTo(bx + dx * rx, by + hh); } g.stroke(); };
  if (kind === 'sheep') { const n = 3 + Math.floor(R() * 3); for (let k = 0; k < n; k++) { const sx = x + (k - n / 2) * 2.3 * U + (R() - 0.5) * U, sy = y + (R() - 0.5) * 2 * U; castShadow(g, sx, sy + 0.9 * U, 1.8 * U); legs(sx, sy, 0.9 * U, 0.8 * U); body(sx, sy, 1.1 * U, 0.75 * U, '#EFE9DC'); body(sx + 1.1 * U, sy - 0.3 * U, 0.38 * U, 0.32 * U, '#2B2620'); } return; }
  if (kind === 'cows') { for (let k = 0; k < 2; k++) { const sx = x + k * 4.2 * U, sy = y + k * 0.8 * U; castShadow(g, sx, sy + 1.2 * U, 2.6 * U); legs(sx, sy, 1.4 * U, 1.1 * U); body(sx, sy, 1.7 * U, 0.95 * U, '#EFE9DC'); g.fillStyle = '#8C6A47'; g.beginPath(); g.ellipse(sx - 0.4 * U, sy - 0.2 * U, 0.6 * U, 0.4 * U, 0, 0, Math.PI * 2); g.fill(); body(sx + 1.8 * U, sy - 0.5 * U, 0.5 * U, 0.42 * U, '#EFE9DC'); } return; }
  if (kind === 'deer') { for (let k = 0; k < 2; k++) { const sx = x + k * 3.6 * U, sy = y + k * 0.6 * U; castShadow(g, sx, sy + 1.6 * U, 2.2 * U); legs(sx, sy, 1.1 * U, 1.6 * U); body(sx, sy, 1.4 * U, 0.7 * U, '#8C6A47'); g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(sx + 1.2 * U, sy - 0.3 * U); g.lineTo(sx + 1.8 * U, sy - 1.6 * U); g.stroke(); body(sx + 1.95 * U, sy - 1.8 * U, 0.42 * U, 0.3 * U, '#8C6A47'); if (!k) { g.beginPath(); g.moveTo(sx + 1.9 * U, sy - 2.1 * U); g.lineTo(sx + 1.6 * U, sy - 2.9 * U); g.moveTo(sx + 2.1 * U, sy - 2.1 * U); g.lineTo(sx + 2.4 * U, sy - 2.9 * U); g.stroke(); } } return; }
  if (kind === 'goats') { for (let k = 0; k < 3; k++) { const sx = x + k * 3.2 * U, sy = y - 0.2 * U + (k % 2) * 0.4 * U; legs(sx, sy, 0.7 * U, 0.7 * U); body(sx, sy, 0.95 * U, 0.6 * U, '#D8CBB0'); body(sx + 0.95 * U, sy - 0.45 * U, 0.32 * U, 0.3 * U, '#D8CBB0'); } return; } // v3 critique 4: no ground patch, 3.2 u apart
  if (kind === 'heron') { castShadow(g, x, y + 2.4 * U, 1.6 * U); g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(x - 0.3 * U, y + 0.6 * U); g.lineTo(x - 0.3 * U, y + 2.6 * U); g.moveTo(x + 0.3 * U, y + 0.6 * U); g.lineTo(x + 0.4 * U, y + 2.6 * U); g.stroke(); body(x, y, 1.0 * U, 1.5 * U, '#B9C2C6'); g.beginPath(); g.moveTo(x + 0.4 * U, y - 1.2 * U); g.quadraticCurveTo(x + 1.4 * U, y - 2.2 * U, x + 0.8 * U, y - 3.2 * U); g.strokeStyle = '#B9C2C6'; g.lineWidth = 2.4 * lw; g.stroke(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke(); body(x + 0.9 * U, y - 3.4 * U, 0.42 * U, 0.34 * U, '#B9C2C6'); g.beginPath(); g.moveTo(x + 1.3 * U, y - 3.4 * U); g.lineTo(x + 2.5 * U, y - 3.2 * U); g.stroke(); reeds(g, x - 2 * U, y + 2.6 * U, 3 * U, { lit: '#8E9A6E', shade: '#5E6A48', lw: PX * 0.8 }); return; }
  if (kind === 'hare') { // v3 critique 4: crouched, long and low, the head forward and the ears raised and swept back (a hare sitting up read as a standing stone)
    castShadow(g, x - 0.2 * U, y + 0.3 * U, 1.6 * U); body(x, y, 1.45 * U, 0.6 * U, '#B59A7A'); body(x - 1.05 * U, y + 0.05 * U, 0.55 * U, 0.45 * U, '#B59A7A');
    g.fillStyle = '#B59A7A'; g.strokeStyle = ink; g.lineWidth = lw; for (const [dx, a] of [[1.05, -0.62], [1.35, -0.42]]) { g.beginPath(); g.ellipse(x + dx * U, y - 1.15 * U, 0.15 * U, 0.72 * U, a, 0, Math.PI * 2); g.fill(); g.stroke(); }
    body(x + 1.5 * U, y - 0.3 * U, 0.5 * U, 0.38 * U, '#B59A7A');
    g.fillStyle = '#EFE9DC'; ellipse(g, x - 1.55 * U, y - 0.15 * U, 0.22 * U, 0.2 * U); g.fill(); }
}

// ---- owner sheets ("Try your art"): frames drawn at the stamp's footprint; the image's own shadow replaces castShadow
function artFor(entry) { return view.art[entry] ?? null; }
function drawArtFrame(g, art, x, y, w, seed) {
  const fr = art.frames; if (!fr || !fr.length) return;
  const h32v = Math.abs(seed | 0), f = fr[h32v % fr.length], mirror = h32v & 1, hgt = (w * f.height) / f.width;
  g.save(); g.translate(x, y); if (mirror) g.scale(-1, 1); g.drawImage(f, -w / 2, -hgt * 0.92, w, hgt); g.restore();
}

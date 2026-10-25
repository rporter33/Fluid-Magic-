
// ------------------------------------------------------------------ map detail: terrain, settlements, alignment, wilds (baked per province per zoom band)
const MEAN_AREA = provs.reduce((a, p) => a + areaOf[p.i], 0) / provs.length;
const MED_DIAM = (() => { const d = provs.map((p) => 2 * Math.sqrt(areaOf[p.i] / Math.PI)).sort((a, b) => a - b); return d[Math.floor(d.length / 2)]; })();
const bandOf = (s) => (s * MED_DIAM < 70 ? 'far' : s * MED_DIAM <= 180 ? 'mid' : 'near');
const BAND_RES = { far: 70 / MED_DIAM, mid: 180 / MED_DIAM, near: 420 / MED_DIAM }; // px per unit at the top of each band
const DESIGN = { far: 0.3, mid: 0.62, near: 1.5 }; // scale that screen-px sizes (ticks, strokes) are designed for
const EXCL = { far: 0.33, mid: 70 / MED_DIAM, near: 180 / MED_DIAM }; // label boxes are measured at the band's widest
const TSPEC = { plains: [2, 10, 20], farmland: [2, 4, 8], forest: [4, 30, 60], hills: [3, 6, 10], mountains: [3, 5, 8], swamp: [3, 12, 22], wasteland: [2, 8, 14] };
const BIX = { far: 0, mid: 1, near: 2 };
const SU = Math.sqrt(MEAN_AREA / 6400); // the brief's units assume a 6400-unit average province; this sheet's are about 4 times larger
const HSC = 0.92 * SU, HR = 3.2 * HSC, LS = HSC / 1.3, SS = 1.55, MS = 1.45; // houses, spiral, landmarks, stamps, motifs
const INK = '#1C1A17', INK7 = 'rgba(28,26,23,.7)';
function distToEdge(poly, x, y) { let m = Infinity; for (let k = 0; k < poly.length - 1; k++) { const [ax, ay] = poly[k], [bx, by] = poly[k + 1]; const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); m = Math.min(m, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return m; }
const inPoly = (poly, x, y) => d3.polygonContains(poly, [x, y]);
const bboxOf = (poly) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of poly) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; };
const boxHit = (bs, x0, y0, x1, y1) => bs.some((b) => x1 > b[0] && x0 < b[2] && y1 > b[1] && y0 < b[3]);
const pathPoly = (g, poly) => { g.beginPath(); poly.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };

// ---- per-province geometry: the seat (below the label), stable Poisson slots with ranks
const GEO = new Map();
function geo(i) {
  let G = GEO.get(i); if (G) return G;
  const poly = cells[i], c = cent[i], bb = bboxOf(poly);
  const ext = HR * Math.sqrt((prov[i].cap ? 22 : 12) + 0.35) * 1.3 * 0.62 + 10;
  let seat = [c[0], c[1] + 52];
  for (let t = 1; t >= 0; t -= 0.08) { seat = [c[0], c[1] + 52 * t]; if (inPoly(poly, ...seat) && distToEdge(poly, ...seat) > ext) break; }
  const R = rngFor(`map:11:${i}:slots`), spec = TSPEC[terr[i]] ?? [3, 10, 20];
  const want = Math.round((spec[2] * areaOf[i]) / MEAN_AREA * 1.6) + 10;
  const rad = Math.sqrt(areaOf[i] / want) * 0.78;
  const slots = [];
  for (let t = 0; t < want * 40 && slots.length < want; t++) {
    const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]);
    if (!inPoly(poly, x, y) || distToEdge(poly, x, y) < 15) continue;
    if (slots.some((s) => (s.x - x) ** 2 + (s.y - y) ** 2 < rad * rad)) continue;
    slots.push({ x, y, rank: R(), d: Math.hypot(x - seat[0], (y - seat[1]) * 1.4), v: R(), e: distToEdge(poly, x, y) });
  }
  slots.sort((a, b) => a.d - b.d);
  G = { poly, c, bb, seat, slots, rad };
  GEO.set(i, G); return G;
}
const labelFs = (s) => Math.max(10, Math.min(15, 15 * s * 1.4));
const TW_CACHE = new Map();
let measureCtx = null;
function textW(text, font) { const k = font + '|' + text; let w = TW_CACHE.get(k); if (w == null) { measureCtx ??= makeCanvas(4, 4).getContext('2d'); measureCtx.font = font; w = measureCtx.measureText(text).width; TW_CACHE.set(k, w); } return w; }
const nameFont = (p, fs) => `${p.cap ? 600 : 500} ${p.cap ? fs + 1 : fs}px 'Alegreya Sans', 'Segoe UI', sans-serif`;
function tokensAt(i) { return Object.values(cmd).filter((c) => !c.hidden && c.at === i).length; }
function exclusions(i, band) { // label, token and seat boxes in world units, plus a 4 px margin
  const s = EXCL[band], p = prov[i], G = geo(i), [cx, cy] = G.c, fs = labelFs(s), m = 4 / s;
  const w = Math.max(textW(p.name, nameFont(p, fs)) + 10, 84) / s;
  const out = [[cx - w / 2 - m, cy + (-6 - fs / 2 - 5) / s - m, cx + w / 2 + m, cy + 24 / s + m]];
  const n = tokensAt(i); if (n) { const tw = (15 * n + 4) / s; out.push([cx - tw - m, cy - (72 + (band === 'near' ? 44 : 0)) / s - m, cx + tw + m, cy - 14 / s + m]); }
  const sr = settleExtent(i); out.push([G.seat[0] - sr - 4, G.seat[1] - sr * 0.8 - 14, G.seat[0] + sr + 4, G.seat[1] + sr * 0.8 + 6]);
  return out;
}

// ---- settlements: tier from population, houses on a golden-angle spiral, walls by PD, landmarks, kits by owner
const TIERS = [[0, 2000, 1, 2], [2000, 5000, 3, 5], [5000, 10000, 6, 9], [10000, 20000, 10, 15], [20000, 40000, 16, 22]];
const tierOf = (p) => (p.cap ? 4 : TIERS.findIndex((t) => p.pop < t[1]) < 0 ? 4 : TIERS.findIndex((t) => p.pop < t[1]));
function houseCount(p) { const t = TIERS[tierOf(p)]; const pop = Math.max(p.pop, t[0]); return Math.max(t[2], Math.min(t[3], t[2] + Math.floor(((pop - t[0]) / (t[1] - t[0])) * (t[3] - t[2] + 1)))); }
function settleExtent(i) { const p = prov[i]; return HR * Math.sqrt((p.cap ? 22 : 15) + 0.35) * 1.3 + 8; } // fixed per province, so growth never moves stamps
function settlement(i) {
  const p = prov[i], [sx, sy] = geo(i).seat, n = houseCount(p);
  const thrive = p.pop >= 1.25 * p.startPop, decline = p.pop <= 0.8 * p.startPop;
  const houses = [];
  for (let k = 0; k < n; k++) {
    const R = rngFor(`house:${i}:${k}`), a = (k * 137.508 * Math.PI) / 180, r = HR * Math.sqrt(k + 0.35);
    houses.push({ k, x: sx + Math.cos(a) * r * 1.3 + (R() - 0.5) * 1.4, y: sy + Math.sin(a) * r * 0.8 + (R() - 0.5) * 1.1, v: Math.floor(R() * 3), fresh: thrive && k >= n - 2, ruin: decline && k >= n - 2 });
  }
  const rad = HR * Math.sqrt(n + 0.35) * 1.3 + 5;
  return { tier: tierOf(p), n, houses, rad, thrive, decline, kit: p.kitOwner ?? p.owner, sx, sy };
}
function house(g, h, kit, PX, flags) {
  const { x, y } = h, u = HSC;
  g.lineWidth = PX * 0.9; g.strokeStyle = INK;
  if (flags.line) { g.strokeStyle = flags.line; g.lineWidth = PX * 1.1; g.beginPath(); g.moveTo(x - 3 * u, y); g.lineTo(x - 3 * u, y - 2 * u); g.lineTo(x, y - 4.5 * u); g.lineTo(x + 3 * u, y - 2 * u); g.lineTo(x + 3 * u, y); g.closePath(); g.stroke(); return; }
  g.fillStyle = 'rgba(28,26,23,.25)'; ellipse(g, x + 0.8 * u, y + 0.4 * u, 3.8 * u, 1.3 * u); g.fill();
  if (kit === 'red') {
    g.fillStyle = '#8F8C88'; g.fillRect(x - 3.6 * u, y - 1.8 * u, 7.2 * u, 1.8 * u); g.strokeRect(x - 3.6 * u, y - 1.8 * u, 7.2 * u, 1.8 * u);
    if (h.ruin) return;
    g.fillStyle = h.fresh ? '#E3CF8F' : '#3A3633'; g.beginPath(); g.moveTo(x - 4 * u, y - 1.8 * u); g.lineTo(x - 2.7 * u, y - 4.6 * u); g.lineTo(x + 2.7 * u, y - 4.6 * u); g.lineTo(x + 4 * u, y - 1.8 * u); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = h.fresh ? '#B89A5A' : '#5E5953'; g.beginPath(); for (let k = 0; k <= 6; k++) { const xx = x - 2.7 * u + (k * 5.4 * u) / 6, yy = y - 4.6 * u - (k % 2 ? 0.9 * u : 0); k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke();
    if (!flags.shut) { g.fillStyle = '#FFB347'; for (const dx of [-1.6, 1.4]) { ellipse(g, x + dx * u, y - 0.9 * u, 0.55 * u, 0.55 * u); g.fill(); } } else { g.fillStyle = '#2B2A28'; for (const dx of [-1.6, 1.4]) g.fillRect(x + dx * u - 0.6 * u, y - 1.4 * u, 1.2 * u, 0.9 * u); }
  } else if (kit === 'green') {
    g.fillStyle = '#A0785A'; ellipse(g, x, y - 0.9 * u, 3 * u, 1.5 * u); g.fill(); g.stroke();
    if (h.ruin) return;
    g.fillStyle = h.fresh ? '#E3CF8F' : '#4E6B3A'; g.beginPath(); g.ellipse(x, y - 1.6 * u, 3.3 * u, 3 * u, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = h.fresh ? '#F2E4B0' : '#6E8F4E'; ellipse(g, x - 1 * u, y - 3.2 * u, 1.3 * u, 0.8 * u); g.fill();
    if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.6 * u, y - 1.3 * u, 1.2 * u, 0.9 * u); }
  } else {
    g.fillStyle = '#D8CBB0'; g.fillRect(x - 2.7 * u, y - 2 * u, 5.4 * u, 2 * u); g.strokeRect(x - 2.7 * u, y - 2 * u, 5.4 * u, 2 * u);
    if (h.ruin) return;
    g.fillStyle = h.fresh ? '#E3CF8F' : '#C2A86B'; g.beginPath(); g.moveTo(x - 3.1 * u, y - 2 * u); g.lineTo(x - 1.4 * u, y - 4.7 * u); g.lineTo(x + 1.4 * u, y - 4.7 * u); g.lineTo(x + 3.1 * u, y - 2 * u); g.closePath(); g.fill(); g.stroke();
    if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.6 * u, y - 1.5 * u, 1.2 * u, 0.9 * u); }
  }
  if (flags.vines) { g.strokeStyle = '#4E6B3A'; g.lineWidth = PX * 1.2; g.beginPath(); g.moveTo(x - 3 * u, y); g.quadraticCurveTo(x - 2 * u, y - 3 * u, x, y - 4 * u); g.stroke(); }
}
function pennant(g, x, y, col, PX) { const k = LS; g.strokeStyle = INK; g.lineWidth = PX; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 9 * k); g.stroke(); g.fillStyle = col; g.beginPath(); g.moveTo(x, y - 9 * k); g.lineTo(x + 6 * k, y - 7.5 * k); g.lineTo(x, y - 6 * k); g.closePath(); g.fill(); g.lineWidth = PX * 0.7; g.stroke(); }
function landmark(g, kind, kit, x0, y0, PX0, o = {}) { // drawn on a 1.3-house grid, scaled to the house size
  g.save(); g.translate(x0, y0); g.scale(LS, LS);
  try { return y0 + LS * landmarkShape(g, kind, kit, 0, 0, PX0 / LS, o); } finally { g.restore(); }
}
function landmarkShape(g, kind, kit, x, y, PX, o) {
  g.lineWidth = PX * 0.9; g.strokeStyle = INK;
  if (o.q != null) { // scaffold: the built part's height in quarters
    const hh = 12 * (o.q / 4); g.fillStyle = kit === 'green' ? '#A0785A' : kit === 'red' ? '#5E5953' : '#D8CBB0'; g.fillRect(x - 4, y - hh, 8, hh); g.strokeRect(x - 4, y - hh, 8, hh);
    g.strokeStyle = '#8C6A47'; g.lineWidth = PX * 0.8; for (const xx of [-5, 0, 5]) { g.beginPath(); g.moveTo(x + xx, y); g.lineTo(x + xx, y - 13); g.stroke(); } for (const yy of [-4, -8, -12]) { g.beginPath(); g.moveTo(x - 5.5, y + yy); g.lineTo(x + 5.5, y + yy); g.stroke(); }
    return y - 13;
  }
  const lit = o.lit !== false;
  if (kind === 'keep') {
    if (kit === 'green') { g.strokeStyle = '#4E6B3A'; g.lineWidth = PX * 2.2; ellipse(g, x, y - 2, 9, 5); g.stroke(); g.fillStyle = '#6B4A2B'; g.fillRect(x - 3.5, y - 12, 7, 11); g.strokeStyle = INK; g.lineWidth = PX * 0.9; g.strokeRect(x - 3.5, y - 12, 7, 11); g.fillStyle = '#4E6B3A'; ellipse(g, x, y - 13, 5.5, 3.5); g.fill(); g.stroke(); return y - 15; }
    const col = kit === 'red' ? '#3A3836' : '#9A958C', top = kit === 'red' ? '#2B2A28' : '#B9B4AA';
    g.fillStyle = col; g.fillRect(x - 5, y - 12, 10, 12); g.strokeRect(x - 5, y - 12, 10, 12); g.fillStyle = top; g.fillRect(x - 6, y - 15, 12, 3.4); g.strokeRect(x - 6, y - 15, 12, 3.4);
    g.fillStyle = col; for (const xx of [-6, -2, 2]) { g.fillRect(x + xx, y - 17, 2.6, 2.2); g.strokeRect(x + xx, y - 17, 2.6, 2.2); }
    if (kit === 'red') { g.fillStyle = '#FFB347'; g.fillRect(x - 1, y - 8, 2, 2.6); }
    return y - 17;
  }
  if (kind === 'temple') {
    if (kit === 'red') { // a stepped pyre tower with a brazier
      g.fillStyle = '#5E5953'; for (let k = 0; k < 3; k++) { const w = 9 - k * 2.5; g.fillRect(x - w / 2, y - 4 * (k + 1), w, 4); g.strokeRect(x - w / 2, y - 4 * (k + 1), w, 4); }
      if (lit) { const gl = g.createRadialGradient(x, y - 14, 0.3, x, y - 14, 4.5); gl.addColorStop(0, 'rgba(255,179,71,.9)'); gl.addColorStop(1, 'rgba(255,179,71,0)'); g.fillStyle = gl; ellipse(g, x, y - 14, 4.5, 4.5); g.fill(); g.fillStyle = '#FFB347'; ellipse(g, x, y - 13.6, 1.3, 1.3); g.fill(); }
      else { g.fillStyle = '#8F8C88'; ellipse(g, x, y - 13.5, 1.2, 1.2); g.fill(); }
      return y - 15;
    }
    if (kit === 'green') { // a ring of six small trees around an altar
      g.fillStyle = lit ? '#9A958C' : '#7A7670'; g.fillRect(x - 1.6, y - 2.4, 3.2, 2.4); g.strokeRect(x - 1.6, y - 2.4, 3.2, 2.4);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const tx = x + Math.cos(a) * 6, ty = y - 1 + Math.sin(a) * 3.4; g.fillStyle = '#2F4A26'; ellipse(g, tx, ty - 2.6, 2, 2); g.fill(); g.fillStyle = '#4E6B3A'; ellipse(g, tx - 0.5, ty - 3.1, 1.3, 1.3); g.fill(); g.lineWidth = PX * 0.7; ellipse(g, tx, ty - 2.6, 2, 2); g.stroke(); }
      return y - 6;
    }
    g.fillStyle = '#D8CBB0'; g.fillRect(x - 3, y - 6, 6, 6); g.strokeRect(x - 3, y - 6, 6, 6); g.fillStyle = '#C2A86B'; g.beginPath(); g.moveTo(x - 3.5, y - 6); g.lineTo(x, y - 10); g.lineTo(x + 3.5, y - 6); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x, y - 13); g.moveTo(x - 1.4, y - 11.8); g.lineTo(x + 1.4, y - 11.8); g.stroke();
    return y - 13;
  }
  if (kind === 'lab') {
    if (kit === 'red') { g.fillStyle = '#2B2A28'; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 1.4, y - 16); g.lineTo(x, y - 19); g.lineTo(x + 1.4, y - 16); g.lineTo(x + 3, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#FFB347'; g.fillRect(x - 0.6, y - 12, 1.2, 2); return y - 19; }
    if (kit === 'green') { g.fillStyle = '#5E4630'; g.beginPath(); g.moveTo(x - 3.4, y); g.lineTo(x - 2.4, y - 13); g.lineTo(x + 2.4, y - 13); g.lineTo(x + 3.4, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#1C1A17'; ellipse(g, x, y - 5, 1, 1.6); g.fill(); g.fillStyle = '#4E6B3A'; ellipse(g, x, y - 15, 5, 3.6); g.fill(); g.stroke(); g.fillStyle = '#6E8F4E'; ellipse(g, x - 1.4, y - 16, 2, 1.4); g.fill(); return y - 18; }
    g.fillStyle = '#B9B4AA'; g.fillRect(x - 2.5, y - 14, 5, 14); g.strokeRect(x - 2.5, y - 14, 5, 14); g.fillStyle = '#9A958C'; g.beginPath(); g.moveTo(x - 3, y - 14); g.lineTo(x, y - 18); g.lineTo(x + 3, y - 14); g.closePath(); g.fill(); g.stroke(); return y - 18;
  }
  return y;
}
function walls(g, st, pd, PX, half) { // half: 'back' or 'front'
  const { sx, sy } = st, rx = st.rad + 3, ry = rx * 0.62;
  const a0 = half === 'back' ? Math.PI : 0, a1 = half === 'back' ? 2 * Math.PI : Math.PI;
  if (pd >= 5 && pd < 15) {
    g.strokeStyle = '#6B4A2B'; g.lineWidth = PX * 1.2;
    for (let a = a0; a < a1; a += 0.16) { const x = sx + Math.cos(a) * rx, y = sy + Math.sin(a) * ry; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 2.6); g.stroke(); }
    g.lineWidth = PX * 0.8; g.beginPath(); g.ellipse(sx, sy - 1.3, rx, ry, 0, a0, a1); g.stroke();
  } else if (pd >= 15) {
    g.strokeStyle = INK; g.lineWidth = PX * 3.6 + 1.2; g.beginPath(); g.ellipse(sx, sy, rx, ry, 0, a0, a1); g.stroke();
    g.strokeStyle = '#9A958C'; g.lineWidth = 2.6; g.beginPath(); g.ellipse(sx, sy, rx, ry, 0, a0, a1); g.stroke();
    g.strokeStyle = INK7; g.lineWidth = PX * 0.8; for (let a = a0; a < a1; a += 0.22) { const x = sx + Math.cos(a) * rx, y = sy + Math.sin(a) * ry; g.beginPath(); g.moveTo(x, y - 1.3); g.lineTo(x, y - 2.4); g.stroke(); }
    if (pd >= 25) for (const a of [Math.PI * 1.25, Math.PI * 1.75, Math.PI * 0.25, Math.PI * 0.75]) {
      if ((a > Math.PI) !== (half === 'back')) continue;
      const x = sx + Math.cos(a) * rx, y = sy + Math.sin(a) * ry; g.fillStyle = '#9A958C'; g.fillRect(x - 2.4, y - 5, 4.8, 6); g.strokeStyle = INK; g.lineWidth = PX * 0.9; g.strokeRect(x - 2.4, y - 5, 4.8, 6);
    }
    if (pd >= 25 && half === 'front') { const x = sx, y = sy + ry; g.fillStyle = '#B9B4AA'; g.fillRect(x - 4.5, y - 5, 9, 6); g.strokeRect(x - 4.5, y - 5, 9, 6); g.fillStyle = '#2B2A28'; g.fillRect(x - 1.6, y - 3, 3.2, 4); }
  }
}

// ---- stamp vocabulary (faces: the fill +12 and -18 L*, a 1 px ink outline at 70%)
function palette(i, band, line) {
  const f = TERRAIN[terr[i]].fill, PX = 1 / BAND_RES[band];
  return { lit: shadeL(f, 12), shade: shadeL(f, -18), ink: INK7, lw: PX, PX, line, fill: f, trunk: shadeL(f, -30) };
}
function stroke(g, P, w = 1) { g.strokeStyle = P.line ?? P.ink; g.lineWidth = P.lw * w; g.stroke(); }
function fillOr(g, P, col) { if (!P.line) { g.fillStyle = col; g.fill(); } }
function tree(g, x, y, r, P, o = {}) {
  const cy = y - r * 1.1;
  if (!P.line) { g.fillStyle = o.trunk ?? P.trunk; g.fillRect(x - r * 0.12, cy, r * 0.24, y - cy); }
  ellipse(g, x, cy, r, r * 0.92); fillOr(g, P, o.shade ?? P.shade);
  if (!P.line) { ellipse(g, x - r * 0.22, cy - r * 0.2, r * 0.7, r * 0.64); g.fillStyle = o.lit ?? P.lit; g.fill(); }
  ellipse(g, x, cy, r, r * 0.92); stroke(g, P);
  if (P.line) { g.beginPath(); g.moveTo(x, cy + r * 0.92); g.lineTo(x, y); stroke(g, P); }
  if (o.blossom && !P.line) { g.fillStyle = '#EAD2DA'; for (let k = 0; k < 4; k++) { const a = k * 1.7 + x; ellipse(g, x + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.45, r * 0.16, r * 0.16); g.fill(); } }
  if (o.fruit && !P.line) { g.fillStyle = '#D98E4A'; for (let k = 0; k < 4; k++) { const a = k * 1.9 + y; ellipse(g, x + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.5, r * 0.13, r * 0.13); g.fill(); } }
}
function hump(g, x, y, w, P) {
  const h = w * 0.42; g.beginPath(); g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); g.closePath(); fillOr(g, P, P.lit);
  if (!P.line) { g.save(); g.beginPath(); g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); g.closePath(); g.clip(); g.fillStyle = P.shade; g.beginPath(); g.ellipse(x + w * 0.22, y + h * 0.1, w * 0.42, h * 1.05, 0, Math.PI, 0); g.fill(); g.restore(); }
  g.beginPath(); g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); stroke(g, P);
  for (let k = 0; k < 3; k++) { const a = -0.5 + k * 0.32; g.beginPath(); g.moveTo(x + Math.cos(a) * w * 0.32, y + Math.sin(a) * h * 0.75); g.lineTo(x + Math.cos(a) * w * 0.45, y + Math.sin(a) * h * 0.25 + h * 0.15); stroke(g, P, 0.8); }
}
function peakStamp(g, x, y, h, P, cols) {
  const w = h * 1.15, ax = x - w * 0.06, mid = x + w * 0.08;
  g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(ax, y - h); g.lineTo(mid, y); g.closePath(); fillOr(g, P, cols.lit);
  g.beginPath(); g.moveTo(ax, y - h); g.lineTo(x + w / 2, y); g.lineTo(mid, y); g.closePath(); fillOr(g, P, cols.shade);
  if (cols.snow && !P.line) {
    const sh = h * 0.4, lx = ax + (x - w / 2 - ax) * 0.4, rx = ax + (x + w / 2 - ax) * 0.4, my = y - h + sh;
    g.fillStyle = cols.snow; g.beginPath(); g.moveTo(ax, y - h); g.lineTo(lx, my); g.lineTo(lx + (ax - lx) * 0.35, my - sh * 0.18); g.lineTo(ax + (mid - ax) * 0.4 - w * 0.03, y - h + sh * 0.95); g.lineTo(ax + (mid - ax) * 0.4, y - h + sh * 0.95); g.closePath(); g.fill();
    g.fillStyle = cols.snowShade; g.beginPath(); g.moveTo(ax, y - h); g.lineTo(ax + (mid - ax) * 0.4, y - h + sh * 0.95); g.lineTo(rx - (rx - ax) * 0.3, my - sh * 0.15); g.lineTo(rx, my); g.closePath(); g.fill();
  }
  g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(ax, y - h); g.lineTo(x + w / 2, y); g.strokeStyle = P.line ?? cols.ink; g.lineWidth = cols.lw; g.lineJoin = 'round'; g.stroke();
  g.beginPath(); g.moveTo(ax, y - h); g.lineTo(mid, y); g.lineWidth = cols.lw * 0.6; g.stroke();
}
function reeds(g, x, y, h, P) { for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k - 1.5) * 0.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * h, y + Math.sin(a) * h); g.strokeStyle = P.line ?? (k % 2 ? P.shade : P.lit); g.lineWidth = P.lw * 1.3; g.stroke(); } if (!P.line) { g.fillStyle = '#4A3A2A'; ellipse(g, x + 1, y - h * 0.9, h * 0.08, h * 0.2, 0.2); g.fill(); } }
function rock(g, x, y, r, P, col) { const c1 = col ?? P.lit; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x - r * 0.6, y - r * 0.9); g.lineTo(x + r * 0.2, y - r * 1.05); g.lineTo(x + r * 0.15, y); g.closePath(); fillOr(g, P, c1); g.beginPath(); g.moveTo(x + r * 0.15, y); g.lineTo(x + r * 0.2, y - r * 1.05); g.lineTo(x + r * 0.95, y - r * 0.5); g.lineTo(x + r, y); g.closePath(); fillOr(g, P, col ? shadeL(col, -22) : P.shade); g.beginPath(); g.moveTo(x - r, y); g.lineTo(x - r * 0.6, y - r * 0.9); g.lineTo(x + r * 0.2, y - r * 1.05); g.lineTo(x + r * 0.95, y - r * 0.5); g.lineTo(x + r, y); g.closePath(); stroke(g, P); }
function tuft(g, x, y, h, P) { g.strokeStyle = P.line ?? P.shade; g.lineWidth = P.lw * 1.2; for (const a of [-0.5, 0, 0.45]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * h, y - Math.cos(a) * h); g.stroke(); } }
function haystack(g, x, y, r, P) { g.beginPath(); g.ellipse(x, y, r, r * 1.1, 0, Math.PI, 0); g.closePath(); fillOr(g, P, P.lit); if (!P.line) { g.save(); g.clip(); g.fillStyle = P.shade; g.fillRect(x + r * 0.15, y - r * 1.2, r, r * 1.3); g.restore(); } g.beginPath(); g.ellipse(x, y, r, r * 1.1, 0, Math.PI, 0); g.closePath(); stroke(g, P); g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.5); g.lineTo(x + r * 0.5, y - r * 0.6); stroke(g, P, 0.7); }
function windmill(g, x, y, P) { g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 2, y - 10); g.lineTo(x + 2, y - 10); g.lineTo(x + 3, y); g.closePath(); fillOr(g, P, '#D8CBB0'); stroke(g, P); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + Math.cos(a) * 8, y - 10 + Math.sin(a) * 8); g.strokeStyle = P.line ?? INK; g.lineWidth = P.lw * 1.6; g.stroke(); } }
function snag(g, x, y, h, P, col = '#5A4A3A') { g.strokeStyle = P.line ?? col; g.lineWidth = P.lw * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.5, y - h); g.moveTo(x + 0.3, y - h * 0.6); g.lineTo(x - h * 0.3, y - h * 0.85); g.moveTo(x + 0.4, y - h * 0.75); g.lineTo(x + h * 0.3, y - h * 0.95); g.stroke(); }
function shrub(g, x, y, r, P) { g.strokeStyle = P.line ?? '#8F6E64'; g.lineWidth = P.lw; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.35; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); } }
function skull(g, x, y, P) { if (P.line) return; g.fillStyle = '#E9E4D8'; ellipse(g, x, y - 1.6, 2, 1.7); g.fill(); g.fillRect(x - 1.1, y - 0.6, 2.2, 1); g.fillStyle = INK; ellipse(g, x - 0.7, y - 1.6, 0.45, 0.45); g.fill(); ellipse(g, x + 0.7, y - 1.6, 0.45, 0.45); g.fill(); }

// motifs (nation looks and scale poles)
function cairn(g, x, y, s, PX, ember) { g.fillStyle = '#2B2A28'; g.strokeStyle = INK; g.lineWidth = PX * 0.7; for (let k = 0; k < 3; k++) { ellipse(g, x, y - k * 1.9 * s, (2.6 - k * 0.6) * s, 1.2 * s); g.fill(); g.stroke(); } if (ember) { g.fillStyle = '#FFB347'; ellipse(g, x + 0.6 * s, y - 2 * s, 0.5 * s, 0.5 * s); g.fill(); } }
function scorch(g, x, y, r, R) { g.fillStyle = 'rgba(58,54,51,.35)'; g.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, rr = r * (0.7 + R() * 0.5); const px = x + Math.cos(a) * rr * 1.3, py = y + Math.sin(a) * rr * 0.8; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.fill(); g.fillStyle = '#FFB347'; for (let k = 0; k < 4; k++) { ellipse(g, x + (R() - 0.5) * r * 1.6, y + (R() - 0.5) * r, 0.45, 0.45); g.fill(); } }
function shard(g, x, y, PX) { g.fillStyle = '#1C1A17'; g.strokeStyle = '#6E6A64'; g.lineWidth = PX * 0.8; for (const [dx, h] of [[-1.5, 4], [1.2, 5.5]]) { g.beginPath(); g.moveTo(x + dx - 1.2, y); g.lineTo(x + dx, y - h); g.lineTo(x + dx + 1.2, y); g.closePath(); g.fill(); g.stroke(); } }
function brazier(g, x, y, PX) { g.strokeStyle = INK; g.lineWidth = PX; g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x, y - 3); g.lineTo(x + 2, y); g.stroke(); g.fillStyle = '#3A3836'; g.beginPath(); g.ellipse(x, y - 3.4, 2.4, 1.2, 0, 0, Math.PI); g.fill(); g.stroke(); g.fillStyle = '#FFB347'; ellipse(g, x, y - 4, 1.3, 0.9); g.fill(); }
function charred(g, x, y, r, PX) { g.strokeStyle = '#2B2A28'; g.lineWidth = PX * 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - r * 2); g.moveTo(x, y - r * 1.2); g.lineTo(x - r * 0.7, y - r * 1.8); g.moveTo(x, y - r * 1.5); g.lineTo(x + r * 0.7, y - r * 2.1); g.moveTo(x - r * 0.4, y - r * 1.6); g.lineTo(x - r * 0.7, y - r * 2.2); g.stroke(); g.lineCap = 'butt'; }
function emberCrack(g, x, y, L, R, PX) { g.strokeStyle = '#FFB347'; g.lineWidth = PX * 0.9; g.beginPath(); g.moveTo(x - L / 2, y); for (let k = 1; k <= 4; k++) g.lineTo(x - L / 2 + (k * L) / 4, y + (R() - 0.5) * 3); g.stroke(); }
function burningCairn(g, x, y, PX) { g.strokeStyle = 'rgba(255,179,71,.4)'; g.lineWidth = PX * 1.6; ellipse(g, x, y - 1, 9, 4.5); g.stroke(); g.fillStyle = '#2B2A28'; g.strokeStyle = INK; g.lineWidth = PX * 0.7; for (let k = 0; k < 5; k++) { ellipse(g, x, y - k * 2.3, 3.4 - k * 0.45, 1.4); g.fill(); g.stroke(); } brazier(g, x, y - 11, PX); }
function ivyStone(g, x, y, PX) { rock(g, x, y, 2.8, { lit: '#9A958C', shade: '#7A7670', ink: INK7, lw: PX }, '#9A958C'); g.strokeStyle = '#4E6B3A'; g.lineWidth = PX * 1.1; g.beginPath(); g.moveTo(x - 2.6, y); g.quadraticCurveTo(x - 1.6, y - 2, x - 0.2, y - 2.6); g.moveTo(x + 0.5, y - 1); g.lineTo(x + 1.6, y - 2.2); g.stroke(); }
function blossomBush(g, x, y, PX, R) { g.fillStyle = '#4E6B3A'; g.strokeStyle = INK7; g.lineWidth = PX * 0.7; for (const [dx, dy, r] of [[-2.2, -1.6, 2.2], [1.8, -1.8, 2.4], [0, -3.4, 2.2]]) { ellipse(g, x + dx, y + dy, r, r * 0.85); g.fill(); g.stroke(); } g.fillStyle = '#EAD2DA'; for (let k = 0; k < 7; k++) { const a = k * 2.4; ellipse(g, x + Math.cos(a) * 2.6, y - 2.2 + Math.sin(a) * 1.8, 0.75, 0.75); g.fill(); } }
function sapling(g, x, y, PX) { g.strokeStyle = '#5E4630'; g.lineWidth = PX; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4.5); g.stroke(); g.fillStyle = '#6E8F4E'; ellipse(g, x, y - 5.5, 1.8, 1.6); g.fill(); g.strokeStyle = INK7; g.lineWidth = PX * 0.7; g.stroke(); }
function mossStone(g, x, y, PX) { g.fillStyle = '#9A958C'; g.strokeStyle = INK; g.lineWidth = PX * 0.8; g.beginPath(); g.moveTo(x - 1.6, y); g.lineTo(x - 1.2, y - 6); g.lineTo(x + 1.2, y - 6.4); g.lineTo(x + 1.6, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#5E7F45'; g.fillRect(x - 1.2, y - 6.4, 2.4, 1.6); }
function bramble(g, x, y, PX) { g.strokeStyle = '#5A3A28'; g.lineWidth = PX * 1.1; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x - 3 + k * 3, y, 2.4, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
function warCairn(g, x, y, PX) { cairn(g, x, y, 1.1, PX, false); g.strokeStyle = '#5E4630'; g.lineWidth = PX * 1.1; for (const dx of [-1, 1.2]) { g.beginPath(); g.moveTo(x + dx, y - 4); g.lineTo(x + dx * 1.6, y - 13); g.stroke(); } g.fillStyle = '#A8ADB3'; for (const dx of [-1, 1.2]) { g.beginPath(); g.moveTo(x + dx * 1.6 - 0.8, y - 12.4); g.lineTo(x + dx * 1.6, y - 15); g.lineTo(x + dx * 1.6 + 0.8, y - 12.4); g.closePath(); g.fill(); } }
function tornBanner(g, x, y, PX) { g.strokeStyle = '#3E2E20'; g.lineWidth = PX * 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 12); g.stroke(); g.fillStyle = '#7A1E12'; g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x + 6, y - 11); g.lineTo(x + 4, y - 9.5); g.lineTo(x + 6.5, y - 8); g.lineTo(x + 3, y - 7.4); g.lineTo(x, y - 7); g.closePath(); g.fill(); g.strokeStyle = INK7; g.lineWidth = PX * 0.7; g.stroke(); }
function brokenFence(g, x, y, PX) { g.strokeStyle = '#6B4A2B'; g.lineWidth = PX * 1.1; for (const dx of [-5, -1.5, 2, 5.5]) { g.beginPath(); g.moveTo(x + dx, y); g.lineTo(x + dx + (dx > 4 ? 1.5 : 0), y - 3.4); g.stroke(); } g.beginPath(); g.moveTo(x - 5, y - 2.4); g.lineTo(x - 1.5, y - 2.6); g.moveTo(x + 2, y - 2.2); g.lineTo(x + 6, y - 0.8); g.stroke(); }
function toppledCart(g, x, y, PX) { g.save(); g.translate(x, y); g.rotate(0.5); g.fillStyle = '#8C6A47'; g.fillRect(-4, -3, 8, 3); g.strokeStyle = INK; g.lineWidth = PX * 0.8; g.strokeRect(-4, -3, 8, 3); g.restore(); g.strokeStyle = '#3E2E20'; g.lineWidth = PX; ellipse(g, x + 3, y + 0.5, 1.6, 1.6); g.stroke(); }
function smokeWisp(g, x, y, PX, h = 14) { g.strokeStyle = 'rgba(110,106,100,.55)'; g.lineWidth = PX * 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 3, y - h * 0.3, x - 3, y - h * 0.6, x + 1.5, y - h); g.stroke(); g.lineCap = 'butt'; }
function cropClump(g, x, y, PX) { g.strokeStyle = '#4E7A32'; g.lineWidth = PX * 1.1; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x - 3 + k * 1.2, y); g.lineTo(x - 3.4 + k * 1.3, y - 3.5 - (k % 2)); g.stroke(); } }
function briar(g, x, y, PX) { g.strokeStyle = '#3F4A2A'; g.lineWidth = PX * 1.1; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + (k - 1.5) * 2.2, y - 1, 2.2, Math.PI * (1 + k * 0.1), Math.PI * 2.1); g.stroke(); } }
function fern(g, x, y, PX) { g.strokeStyle = '#5E8A3A'; g.lineWidth = PX * 0.9; for (const a of [-0.7, 0, 0.7]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * 3, y - 3, x + Math.sin(a) * 5, y - 4.5); g.stroke(); } }
function beastDen(g, x, y, PX) { g.fillStyle = '#5E4630'; g.beginPath(); g.ellipse(x, y, 5, 3, 0, Math.PI, 0); g.closePath(); g.fill(); g.strokeStyle = INK7; g.lineWidth = PX * 0.8; g.stroke(); g.fillStyle = '#1C1A17'; g.beginPath(); g.ellipse(x, y, 2, 1.6, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#E9E4D8'; g.lineWidth = PX * 0.9; g.beginPath(); g.moveTo(x + 3.5, y + 0.6); g.lineTo(x + 6, y - 0.2); g.stroke(); }
function hutOutline(g, x, y, PX, col) { g.strokeStyle = col; g.lineWidth = PX * 1.1; g.setLineDash([PX * 2, PX * 1.5]); g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 4, y - 3); g.lineTo(x, y - 6.5); g.lineTo(x + 4, y - 3); g.lineTo(x + 4, y); g.closePath(); g.stroke(); g.setLineDash([]); }

// ---- the province's look: everything its decoration bake depends on (slow and fast parts)
const effOf = (p) => (p.dom.n ? SCALES[p.dom.n].map(([nm, v]) => [nm, effStep(v, p.dom.s)]) : []);
const unrestStage = (p) => (p.unrest >= 75 ? 3 : p.unrest >= 50 ? 2 : p.unrest >= 25 ? 1 : 0);
const wallStage = (pd) => (pd >= 25 ? 4 : pd >= 15 ? 3 : pd >= 5 ? 2 : pd >= 1 ? 1 : 0);
function lookKey(i) {
  const p = prov[i], f = fogOf(i);
  if (f === 'unexplored') return 'U|' + view.detail;
  return [f ?? '', houseCount(p), p.pop >= 1.25 * p.startPop ? 'T' : p.pop <= 0.8 * p.startPop ? 'D' : '', p.kitOwner ?? p.owner, p.owner, p.dom.n, p.dom.s, unrestStage(p), p.scar, p.buildings.join(','), p.build ? p.build.q : '', wallStage(p.pd), tokensAt(i), view.detail].join('|');
}

// ---- ground textures (flat lightness changes within +-8 L*, clipped to the cell)
function ground(g, i, band, R) {
  const p = prov[i], G = geo(i), f = TERRAIN[p.terrain].fill, PX = 1 / BAND_RES[band], k = areaOf[i] / MEAN_AREA, [bx0, by0, bx1, by1] = G.bb;
  const rx = () => bx0 + R() * (bx1 - bx0), ry = () => by0 + R() * (by1 - by0);
  switch (p.terrain) {
    case 'plains': {
      for (let n = 0; n < 120 * k; n++) { g.fillStyle = rgba(shadeL(f, R() < 0.5 ? -8 : 8), 0.55); ellipse(g, rx(), ry(), 1.1, 1.1); g.fill(); }
      for (let h = 0; h < 1 + (R() < 0.5 ? 1 : 0); h++) { const s = G.slots[Math.floor(R() * G.slots.length)]; if (!s) break; const a = R() * Math.PI, L = 40 + R() * 40; g.strokeStyle = 'rgba(94,112,70,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(s.x, s.y); for (let t = 1; t <= 5; t++) g.lineTo(s.x + Math.cos(a) * L * t / 5 + (R() - 0.5) * 3, s.y + Math.sin(a) * L * t / 5 * 0.6 + (R() - 0.5) * 3); g.stroke(); g.fillStyle = 'rgba(94,112,70,.55)'; for (let t = 0; t < 6; t++) { ellipse(g, s.x + Math.cos(a) * L * t / 5, s.y + Math.sin(a) * L * t / 5 * 0.6, 1.8, 1.5); g.fill(); } }
      break;
    }
    case 'farmland': {
      const n = 5 + Math.floor(R() * 5), seeds = []; while (seeds.length < n) { const x = rx(), y = ry(); if (inPoly(G.poly, x, y)) seeds.push([x, y]); }
      const vor = d3.Delaunay.from(seeds).voronoi([bx0 - 2, by0 - 2, bx1 + 2, by1 + 2]);
      const doubled = p.dom.n === 'green' && effStep(3, p.dom.s) >= 2;
      seeds.forEach((sd, j) => {
        const cell = vor.cellPolygon(j); if (!cell) return;
        g.save(); pathPoly(g, cell); g.clip(); g.fillStyle = shadeL(f, (R() - 0.5) * 12); g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
        const ang = [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(R() * 4)], sp = doubled ? 3.2 : 6.4, L = (bx1 - bx0) + (by1 - by0);
        g.strokeStyle = 'rgba(160,122,32,.35)'; g.lineWidth = 0.9; g.beginPath();
        for (let o = -L; o < L; o += sp) { const cx = sd[0] + Math.cos(ang + Math.PI / 2) * o, cy = sd[1] + Math.sin(ang + Math.PI / 2) * o; g.moveTo(cx - Math.cos(ang) * L, cy - Math.sin(ang) * L); g.lineTo(cx + Math.cos(ang) * L, cy + Math.sin(ang) * L); }
        g.stroke(); g.restore();
        pathPoly(g, cell); g.strokeStyle = 'rgba(70,90,40,.55)'; g.lineWidth = 1.6; g.stroke();
      });
      break;
    }
    case 'forest': {
      for (let y = by0; y < by1; y += 8) for (let x = bx0 + ((y / 8) % 2) * 5; x < bx1; x += 10) { const r = 4 + R() * 2; g.strokeStyle = R() < 0.55 ? 'rgba(42,58,33,.4)' : 'rgba(75,99,57,.3)'; g.lineWidth = 1.1; g.beginPath(); g.arc(x + (R() - 0.5) * 3, y, r, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
      break;
    }
    case 'hills': {
      g.strokeStyle = 'rgba(110,86,28,.5)'; g.lineWidth = 1.1;
      for (const s of G.slots) for (let h = 0; h < 3 + (R() < 0.5 ? 1 : 0); h++) { g.beginPath(); g.arc(s.x, s.y, 7 + h * 2.4, 0.15, 1.1); g.stroke(); }
      break;
    }
    case 'mountains': { for (let n = 0; n < 160 * k; n++) { g.fillStyle = 'rgba(110,127,134,.4)'; ellipse(g, rx(), ry(), 0.9 + R() * 0.8, 0.8); g.fill(); } break; }
    case 'swamp': {
      g.strokeStyle = 'rgba(44,140,148,.6)'; g.lineWidth = 1.2; g.lineCap = 'round';
      for (let y = by0 + 4; y < by1; y += 7) for (let x = bx0 + ((y / 7) % 2) * 9; x < bx1; x += 22) { const L = 6 + R() * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y); g.stroke(); }
      g.lineCap = 'butt'; g.fillStyle = 'rgba(44,140,148,.45)'; for (let n = 0; n < 5 * k; n++) { ellipse(g, rx(), ry(), 6 + R() * 8, 2.5 + R() * 2.5); g.fill(); }
      break;
    }
    case 'wasteland': {
      const seeds = []; const n = 20 + Math.floor(R() * 11); while (seeds.length < n) seeds.push([rx(), ry()]);
      const vor = d3.Delaunay.from(seeds).voronoi([bx0, by0, bx1, by1]); g.strokeStyle = 'rgba(143,110,100,.45)'; g.lineWidth = 1; g.beginPath(); vor.render(g); g.stroke();
      break;
    }
  }
}

// ---- one province's decoration bake
function drawProvinceDeco(g, i, band) {
  const p = prov[i], G = geo(i), fog = fogOf(i), unexp = fog === 'unexplored';
  const PX = 1 / BAND_RES[band], R = rngFor(`map:11:${i}:${band}:paint`);
  const lineCol = ['forest', 'hills', 'swamp'].includes(p.terrain) ? '#E8DCC2' : '#3E3428';
  const P = palette(i, band, unexp ? lineCol : null);
  g.save(); pathPoly(g, G.poly); g.clip();
  if (!unexp) ground(g, i, band, rngFor(`map:11:${i}:ground`));
  const look = unexp ? null : p.dom.n, lvl = p.dom.s >= 7 ? 3 : p.dom.s >= 4 ? 2 : p.dom.s >= 1 ? 1 : 0;
  const shown = band !== 'far' && !unexp;
  if (shown && look === 'red' && lvl) { // L1: ash drifts
    const Rr = rngFor(`map:11:${i}:ash`); g.fillStyle = 'rgba(143,140,136,.25)'; for (let n = 0; n < 50 * lvl; n++) { const s = G.slots[Math.floor(Rr() * Math.min(G.slots.length, 6 + lvl * 6))]; if (s) { ellipse(g, s.x + (Rr() - 0.5) * 26, s.y + (Rr() - 0.5) * 18, 1.2, 1.2); g.fill(); } }
  }
  if (shown && look === 'green' && lvl >= 2) { const Rr = rngFor(`map:11:${i}:meadow`); g.fillStyle = 'rgba(239,231,207,.75)'; for (let n = 0; n < 30 * lvl; n++) { const s = G.slots[Math.floor(Rr() * Math.min(G.slots.length, 8 + lvl * 6))]; if (s) { ellipse(g, s.x + (Rr() - 0.5) * 24, s.y + (Rr() - 0.5) * 16, 0.9, 0.9); g.fill(); } } }
  const st = unexp ? null : settlement(i);
  if (st && st.thrive && band !== 'far') { const Rr = rngFor(`map:11:${i}:garden`); for (let n = 0; n < 6; n++) { const a = Rr() * Math.PI * 2, r = st.rad + 3 + Rr() * 6; g.fillStyle = n % 2 ? 'rgba(110,143,78,.55)' : 'rgba(138,106,58,.45)'; g.fillRect(st.sx + Math.cos(a) * r * 1.1 - 2.5, st.sy + Math.sin(a) * r * 0.7 - 1.5, 5, 3); } }
  if (!unexp && p.scar === 'churned' && band !== 'far') { const Rr = rngFor(`map:11:${i}:scar`); g.fillStyle = 'rgba(94,70,48,.45)'; for (let n = 0; n < 40; n++) { const t = Rr(); ellipse(g, G.c[0] - 60 + t * 120 + (Rr() - 0.5) * 10, G.c[1] - 30 + t * 50 + (Rr() - 0.5) * 10, 2 + Rr() * 3, 1.2 + Rr()); g.fill(); } }
  g.restore();

  // standing stamps, motifs, the settlement: collected, then drawn by bottom edge
  const items = [];
  const ex = exclusions(i, band);
  const spec = TSPEC[p.terrain], k = areaOf[i] / MEAN_AREA, reduced = view.detail === 'reduced';
  const free = G.slots.filter((s) => !boxHit(ex, s.x - 6, s.y - 12, s.x + 6, s.y + 2));
  let motifSlots = [], poleSlots = [];
  if (shown && look && lvl) {
    const pct = [0, 0.08, 0.15, 0.22][lvl]; motifSlots = free.slice(0, Math.max(1, Math.round(free.length * pct)));
    if (!reduced) { const eff = effOf(p); const per = band === 'near' ? 2 : 1; const list = []; for (const [nm, st2] of eff) for (let n = 0; n < Math.min(6, st2 * per); n++) list.push(nm); poleSlots = free.slice(-list.length).map((s, j) => ({ s, pole: list[j] })).filter((x) => list.length && x.s); poleSlots = poleSlots.slice(0, Math.floor(free.length * 0.3)); }
  }
  const taken = new Set([...motifSlots, ...poleSlots.map((x) => x.s)]);
  const count = Math.round(spec[BIX[band]] * k * (reduced ? 0.5 : 1));
  const stampSlots = free.filter((s) => !taken.has(s)).sort((a, b) => a.rank - b.rank).slice(0, count);
  const forestNear = p.terrain === 'forest';
  const blossom = shown && look === 'green', charredOK = shown && look === 'red' && lvl >= 3;
  for (const s of stampSlots) items.push({ y: s.y, f: () => stampFor(g, p, s, band, P, { blossom: blossom && s.v < 0.35, charred: charredOK && forestNear && s.d < (G.slots.at(-1)?.d ?? 1) * 0.5 && s.v < 0.33, great: shown && look === 'green' && lvl >= 3 && s.v > 0.85, fruit: false }) });
  const scaled = (s, k, fn) => { g.save(); g.translate(s.x, s.y); g.scale(k, k); try { fn({ ...s, x: 0, y: 0 }, PX / k); } finally { g.restore(); } };
  motifSlots.forEach((s, j) => items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => motifFor(g, look, lvl, q, j, px2, R)) }));
  poleSlots.forEach(({ s, pole }, j) => items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => poleFor(g, pole, q, j, px2, { ...P, lw: px2, PX: px2 })) }));
  if (shown && look && lvl === 3 && free.length) { const s = free[Math.min(free.length - 1, motifSlots.length)]; items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => (look === 'red' ? burningCairn(g, q.x, q.y, px2) : tree(g, q.x, q.y, 9, { ...P, lw: px2 }, { blossom: true, shade: '#2F4A26', lit: '#5E7F45' }))) }); }
  if (shown && look === 'red' && lvl >= 3) { const Rr = rngFor(`map:11:${i}:cracks`); for (let n = 0; n < 3; n++) { const s = free[Math.floor(Rr() * free.length)]; if (s) items.push({ y: s.y - 1, f: () => emberCrack(g, s.x, s.y, 9, Rr, PX) }); } }
  if (!unexp && p.scar === 'cairns' && band !== 'far') { const s0 = free[Math.floor(free.length / 2)] ?? G.slots[0]; for (let n = 0; n < 3; n++) items.push({ y: s0.y + n, f: () => cairn(g, s0.x - 12 + n * 11, s0.y + n * 2, 1.4, PX, false) }); }
  if (!unexp && p.scar === 'churned' && band !== 'far') { const s0 = free[Math.floor(free.length / 2)] ?? G.slots[0]; items.push({ y: s0.y, f: () => { g.strokeStyle = '#5E4630'; g.lineWidth = PX * 1.2; for (const [dx, a] of [[-6, 0.6], [4, -0.8], [9, 0.3]]) { g.beginPath(); g.moveTo(s0.x + dx, s0.y); g.lineTo(s0.x + dx + Math.cos(a) * 7, s0.y - Math.abs(Math.sin(a)) * 7); g.stroke(); } g.fillStyle = '#1C1A17'; for (const [dx, dy] of [[-2, -10], [6, -13], [12, -8]]) { g.beginPath(); g.moveTo(s0.x + dx - 1.6, s0.y + dy); g.lineTo(s0.x + dx, s0.y + dy - 0.8); g.lineTo(s0.x + dx + 1.6, s0.y + dy); g.lineTo(s0.x + dx, s0.y + dy + 0.4); g.closePath(); g.fill(); } } }); }
  if (p.terrain === 'mountains' && !unexp) items.push({ y: -1e9, f: () => footpath(g, i, PX) });
  if (st) settlementItems(g, i, st, band, items, PX, look, lvl);
  if (unexp) items.push({ y: G.seat[1], f: () => hutOutline(g, G.seat[0], G.seat[1], PX, lineCol) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.f());
}
function footpath(g, i, PX) {
  const G = geo(i), poly = G.poly, edges = [];
  for (let k = 0; k < poly.length - 1; k++) edges.push([poly[k], poly[k + 1], Math.hypot(poly[k + 1][0] - poly[k][0], poly[k + 1][1] - poly[k][1])]);
  edges.sort((a, b) => b[2] - a[2]); const m = (e) => [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2]; const a = m(edges[0]), b = m(edges[1]);
  const ins = (q) => [q[0] + (G.c[0] - q[0]) * 0.12, q[1] + (G.c[1] - q[1]) * 0.12];
  g.strokeStyle = 'rgba(43,38,32,.75)'; g.lineWidth = 1.5 * PX * 1.3; g.setLineDash([4 * PX * 1.6, 3 * PX * 1.6]); g.beginPath(); const A0 = ins(a), B0 = ins(b); g.moveTo(...A0); g.quadraticCurveTo(G.seat[0], G.seat[1] + 6, ...B0); g.stroke(); g.setLineDash([]);
}
function stampFor(g, p, s0, band, P0, o) {
  const R = rngFor(`stamp:${p.i}:${s0.x | 0}:${s0.y | 0}`), far = band === 'far', sc = far ? 1.8 : 1;
  g.save(); g.translate(s0.x, s0.y); g.scale(SS, SS);
  const P = { ...P0, lw: P0.lw / SS, PX: P0.PX / SS }, s = { ...s0, x: 0, y: 0 };
  try { stampShape(g, p, s, far, sc, R, P, o); } finally { g.restore(); }
}
function stampShape(g, p, s, far, sc, R, P, o) {
  switch (p.terrain) {
    case 'plains': if (far) { for (let n = 0; n < 4; n++) tuft(g, s.x + (n - 1.5) * 4, s.y + (n % 2) * 2, 5, P); return; }
      if (s.v < 0.18) return tree(g, s.x, s.y, 4.2, P, { blossom: o.blossom }); if (s.v > 0.94) return haystack(g, s.x, s.y, 3.4, P); return tuft(g, s.x, s.y, 4, P);
    case 'farmland': if (far) { g.fillStyle = P.line ? 'rgba(0,0,0,0)' : rgba(P.shade, 0.5); g.fillRect(s.x - 9, s.y - 6, 18, 12); g.strokeStyle = P.line ?? P.ink; g.lineWidth = P.lw; g.strokeRect(s.x - 9, s.y - 6, 18, 12); return; }
      if (s.v > 0.9 && s.rank < 0.5) return windmill(g, s.x, s.y, P); return haystack(g, s.x, s.y, 3.2, P);
    case 'forest': if (o.charred) return charred(g, s.x, s.y, 3.4, P.PX);
      if (far) { for (let n = 0; n < 5; n++) tree(g, s.x + Math.cos(n * 1.3) * 7, s.y + Math.sin(n * 1.3) * 4, 6, P); return; }
      return tree(g, s.x, s.y, (o.great ? 2 : 1) * (3.8 + R() * 1.4), P, { blossom: o.blossom, shade: s.v < 0.5 ? P.shade : shadeL(P.fill, -10), lit: s.v < 0.5 ? P.lit : shadeL(P.fill, 6) });
    case 'hills': return hump(g, s.x, s.y, (12 + R() * 6) * sc, P);
    case 'mountains': return peakStamp(g, s.x, s.y, (9 + R() * 4) * sc, P, { lit: '#B4C1C6', shade: '#6E7F86', ink: INK, lw: P.lw });
    case 'swamp': if (far) { for (let n = 0; n < 3; n++) reeds(g, s.x + (n - 1) * 4, s.y, 7, P); return; } if (s.v > 0.8) return snag(g, s.x, s.y, 7, P); return reeds(g, s.x, s.y, 5.5, P);
    case 'wasteland': if (far) { rock(g, s.x - 3, s.y, 4, P); rock(g, s.x + 4, s.y + 1, 3, P); return; } if (s.v > 0.95) return skull(g, s.x, s.y, P); if (s.v > 0.65) return shrub(g, s.x, s.y, 4, P); return rock(g, s.x, s.y, 2.6 + R() * 1.2, P);
  }
}
function motifFor(g, look, lvl, s, j, PX, R) {
  const kinds = look === 'red' ? ['cairn', ...(lvl >= 2 ? ['scorch', 'shard', 'brazier'] : [])] : ['blossom', 'ivy', ...(lvl >= 2 ? ['sapling', 'moss', 'blossom'] : []), ...(lvl >= 3 ? ['bramble'] : [])];
  const kd = kinds[j % kinds.length];
  if (kd === 'cairn') return cairn(g, s.x, s.y, 1, PX, true); if (kd === 'scorch') return scorch(g, s.x, s.y, 5, R); if (kd === 'shard') return shard(g, s.x, s.y, PX); if (kd === 'brazier') return brazier(g, s.x, s.y, PX);
  if (kd === 'blossom') return blossomBush(g, s.x, s.y, PX, R);
  if (kd === 'ivy') return ivyStone(g, s.x, s.y, PX); if (kd === 'sapling') return sapling(g, s.x, s.y, PX); if (kd === 'moss') return mossStone(g, s.x, s.y, PX); return bramble(g, s.x, s.y, PX);
}
function poleFor(g, pole, s, j, PX, P) {
  switch (pole) {
    case 'Fury': return j % 2 ? tornBanner(g, s.x, s.y, PX) : warCairn(g, s.x, s.y, PX);
    case 'Turmoil': return [brokenFence, toppledCart, smokeWisp][j % 3](g, s.x, s.y, PX);
    case 'Growth': return j % 2 ? cropClump(g, s.x, s.y, PX) : tree(g, s.x, s.y, 4, P, { fruit: true, shade: '#3F5E2E', lit: '#6E8F4E' });
    case 'Wild': return [briar, fern, beastDen][j % 3](g, s.x, s.y, PX);
  }
}
function settlementItems(g, i, st, band, items, PX, look, lvl) {
  const p = prov[i], kit = st.kit, out = fogOf(i) === 'outofsight';
  if (band === 'far') { // a keep glyph at capitals and one roof cluster from tier 3
    if (p.cap) items.push({ y: st.sy, f: () => landmark(g, 'keep', kit, st.sx, st.sy, PX) });
    else if (st.tier >= 2) items.push({ y: st.sy, f: () => { for (const h of st.houses.slice(0, 3)) house(g, h, kit, PX, {}); } });
    return;
  }
  const shut = unrestStage(p) >= 1, vines = look === 'green' && lvl >= 3;
  const ord = (y) => y;
  items.push({ y: st.sy - st.rad, f: () => walls(g, st, p.pd, PX, 'back') });
  for (const h of st.houses) items.push({ y: ord(h.y), f: () => house(g, h, kit, PX, { shut, vines: vines && h.k % 3 === 0 }) });
  items.push({ y: st.sy + st.rad * 0.62 + 0.5, f: () => walls(g, st, p.pd, PX, 'front') });
  if (p.pd >= 1 && p.pd < 5) { const x = st.sx + st.rad + 3, y = st.sy + 2; items.push({ y, f: () => { g.save(); g.translate(x, y); g.scale(LS, LS); g.translate(-x, -y); g.fillStyle = kit === 'green' ? '#6B4A2B' : '#8C6A47'; g.fillRect(x - 1.6, y - 9, 3.2, 9); g.strokeStyle = INK; g.lineWidth = PX * 0.8; g.strokeRect(x - 1.6, y - 9, 3.2, 9); g.fillStyle = '#5E4630'; g.fillRect(x - 2.6, y - 11, 5.2, 2.4); g.strokeRect(x - 2.6, y - 11, 5.2, 2.4); g.restore(); } }); }
  let top = { x: st.houses[0].x, y: st.houses[0].y - 4.6 * HSC };
  const keepAt = [st.sx + 1, st.sy - st.rad * 0.62 - 3];
  if (p.buildings.includes('fort')) items.push({ y: keepAt[1], f: () => { const t = landmark(g, 'keep', kit, ...keepAt, PX); top = { x: keepAt[0], y: t }; } });
  const faith = !(p.dom.n && p.dom.n !== p.owner);
  if (p.build) { const at = [st.sx + st.rad + 7 * LS, st.sy - 1]; items.push({ y: at[1], f: () => landmark(g, 'temple', kit, ...at, PX, { q: p.build.q }) }); }
  else if (p.buildings.includes('temple')) { const at = [st.sx + st.rad + 7 * LS, st.sy - 1]; items.push({ y: at[1], f: () => landmark(g, 'temple', kit, ...at, PX, { lit: faith }) }); }
  if (p.buildings.includes('lab')) { const at = [st.sx - st.rad - 7 * LS, st.sy - 1]; items.push({ y: at[1], f: () => landmark(g, 'lab', kit, ...at, PX) }); }
  if (band === 'near' && st.tier >= 1) { // yard details: a well and a cart
    const wx = st.sx - st.rad * 0.55, wy = st.sy + st.rad * 0.45; items.push({ y: wy, f: () => { g.fillStyle = '#9A958C'; ellipse(g, wx, wy, 1.8, 1.1); g.fill(); g.strokeStyle = INK; g.lineWidth = PX * 0.7; g.stroke(); g.fillStyle = '#24222A'; ellipse(g, wx, wy, 0.9, 0.5); g.fill(); } });
    const cx = st.sx + st.rad * 0.5, cy = st.sy + st.rad * 0.55; items.push({ y: cy, f: () => { g.fillStyle = '#8C6A47'; g.fillRect(cx - 2.4, cy - 2, 4.8, 1.8); g.strokeStyle = INK; g.lineWidth = PX * 0.7; g.strokeRect(cx - 2.4, cy - 2, 4.8, 1.8); ellipse(g, cx - 1.6, cy, 0.9, 0.9); g.stroke(); ellipse(g, cx + 1.6, cy, 0.9, 0.9); g.stroke(); } });
  }
  if (unrestStage(p) >= 2) { const bx = st.sx - st.rad * 0.3, by = st.sy + st.rad * 0.62 + 4; items.push({ y: by, f: () => { g.strokeStyle = '#6B4A2B'; g.lineWidth = PX * 1.3; for (let n = 0; n < 3; n++) { g.beginPath(); g.moveTo(bx + n * 4 - 2, by); g.lineTo(bx + n * 4 + 2, by - 4); g.moveTo(bx + n * 4 + 2, by); g.lineTo(bx + n * 4 - 2, by - 4); g.stroke(); } smokeWisp(g, st.sx + 3, st.sy - 6, PX, 16); if (unrestStage(p) >= 3) smokeWisp(g, st.sx - 6, st.sy - 4, PX, 13); } }); }
  items.push({ y: 1e9, f: () => { if (p.owner && !out) pennant(g, top.x, top.y, BAN[p.owner], PX); else if (p.owner === null && !out) pennant(g, top.x, top.y, '#8C8A80', PX); } });
}

// ---- wilds: one bake per range per band (ground, massif or mere marks); contour, ticks and names are drawn live
const WGEO = new Map();
function wgeo(w) {
  let G = WGEO.get(w.id); if (G) return G;
  const eq = (a, b) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;
  const edges = [];
  for (const c of w.cells) { const poly = cells[c]; for (let k = 0; k < poly.length - 1; k++) { const a = poly[k], b = poly[k + 1]; const shared = w.cells.some((o) => o !== c && cells[o].some((q) => eq(q, a)) && cells[o].some((q) => eq(q, b))); if (!shared) edges.push({ a, b, c }); } }
  let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
  const ticks = {};
  for (const band of ['far', 'mid', 'near']) {
    const s = DESIGN[band], sp = (band === 'far' ? 3.5 : 5) / s, R = rngFor(`wild:${w.id}:ticks:${band}`), out = [];
    for (const e of edges) {
      const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]), dx = (e.b[0] - e.a[0]) / L, dy = (e.b[1] - e.a[1]) / L; let nx = -dy, ny = dx;
      const mx = (e.a[0] + e.b[0]) / 2, my = (e.a[1] + e.b[1]) / 2; if (!inPoly(cells[e.c], mx + nx * 2, my + ny * 2)) { nx = -nx; ny = -ny; }
      for (let t = sp / 2; t < L; t += sp) { const j = (R() - 0.5) * 2 / s, len = (4 + R() * 3) / s; const x = e.a[0] + dx * (t + j), y = e.a[1] + dy * (t + j); out.push([x + nx * 1.5 / s, y + ny * 1.5 / s, x + nx * (1.5 / s + len), y + ny * (1.5 / s + len)]); }
    }
    ticks[band] = out;
  }
  const nameFs = Math.max(11, Math.min(16, 11 + (w.cells.reduce((a, c) => a + areaOf[c], 0) / MEAN_AREA) * 1.8));
  const zs = 0.42, byAt = new Map(); for (const c of Object.values(cmd)) if (!c.hidden) byAt.set(c.at, [...(byAt.get(c.at) ?? []), c]);
  const tokenZones = [...byAt].map(([at, l]) => { const hw = Math.max(15 * l.length + 3, l.some((c) => c.eta) ? 42 : 0) / zs; return [cent[at][0] - hw, cent[at][1] - 92 / zs, cent[at][0] + hw, cent[at][1] - 14 / zs]; });
  const lw0 = (textW(w.name, `italic 400 16px 'Alegreya Sans'`) * 1.1 + 8) / zs / 2, lh0 = 13 / zs;
  const labelAt = [...w.cells].sort((a, b) => areaOf[b] - areaOf[a]).find((c) => !boxHit(tokenZones, cent[c][0] - lw0, cent[c][1] - lh0, cent[c][0] + lw0, cent[c][1] + lh0)) ?? w.big;
  // a range taller than wide is named along its axis, reading upward, at its middle
  const vertical = w.cells.length > 1 && (bb[3] - bb[1]) > (bb[2] - bb[0]) * 1.2;
  const tot = w.cells.reduce((a2, c) => a2 + areaOf[c], 0), mid = [w.cells.reduce((a2, c) => a2 + cent[c][0] * areaOf[c], 0) / tot, w.cells.reduce((a2, c) => a2 + cent[c][1] * areaOf[c], 0) / tot];
  const labelPt = vertical ? mid : cent[labelAt];
  G = { edges, bb, ticks, nameFs, labelAt, vertical, labelPt }; WGEO.set(w.id, G); return G;
}
const inWild = (w, x, y) => w.cells.some((c) => inPoly(cells[c], x, y));
function bakeWildInto(g, w, band) {
  const G = wgeo(w), PX = 1 / BAND_RES[band], s = DESIGN[band];
  g.save(); g.beginPath(); for (const c of w.cells) { const poly = cells[c]; poly.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
  const peaks = w.kind === 'peaks';
  g.fillStyle = peaks ? '#2A292C' : '#24222A'; g.fillRect(G.bb[0], G.bb[1], G.bb[2] - G.bb[0], G.bb[3] - G.bb[1]);
  const ls = { far: 0.3, mid: 0.42, near: 1.02 }[band], [lx, ly] = G.labelPt, tl = (textW(w.name, `italic 400 ${G.nameFs}px 'Alegreya Sans'`) * 1.1 + 8) / ls, th = (G.nameFs + 8) / ls;
  const lw = G.vertical ? th : Math.min(tl, (bboxOf(cells[G.labelAt])[2] - bboxOf(cells[G.labelAt])[0]) * 0.9), lh = G.vertical ? Math.min(tl, (G.bb[3] - G.bb[1]) * 0.9) : th;
  const lbox = band === 'far' ? [] : [[lx - lw / 2, ly - lh / 2, lx + lw / 2, ly + lh / 2]]; // at Far the massif keeps all its peaks
  if (!peaks) {
    for (const e of G.edges) { g.strokeStyle = '#2E3138'; g.lineWidth = 10 / s; g.beginPath(); g.moveTo(...e.a); g.lineTo(...e.b); g.stroke(); }
    const R = rngFor('wild:' + w.id + ':ripples'), area = w.cells.reduce((a, c) => a + areaOf[c], 0), n = Math.round(Math.max(8, Math.min(14, (8 * area) / MEAN_AREA))) * (band === 'far' ? 0.4 : 1);
    g.strokeStyle = '#8FC3D3'; g.lineWidth = 1.5 / s; let placed = 0;
    for (let t = 0; t < 400 && placed < n; t++) {
      const x = G.bb[0] + R() * (G.bb[2] - G.bb[0]), y = G.bb[1] + R() * (G.bb[3] - G.bb[1]), wv = (14 + R() * 6) / s;
      if (!inWild(w, x - wv / 2, y) || !inWild(w, x + wv / 2, y) || Math.abs(y - ly) < (G.nameFs * 1.4) / s || w.cells.some((c) => distToEdge(cells[c], x, y) < 14 / s && inPoly(cells[c], x, y))) continue;
      g.beginPath(); g.moveTo(x - wv / 2, y); g.quadraticCurveTo(x - wv / 4, y - 3 / s, x, y); g.quadraticCurveTo(x + wv / 4, y - 3 / s, x + wv / 2, y); g.stroke(); placed++;
    }
    if (band !== 'far') {
      const Rr = rngFor('wild:' + w.id + ':shore'); let reedsN = 5 + Math.floor(Rr() * 4), snags = 2 + Math.floor(Rr() * 2);
      for (const e of G.edges) { if (reedsN <= 0 && snags <= 0) break; if (Rr() < 0.45) continue; const t = 0.3 + Rr() * 0.4; let x = e.a[0] + (e.b[0] - e.a[0]) * t, y = e.a[1] + (e.b[1] - e.a[1]) * t; x += (cent[e.c][0] - x) * 0.09; y += (cent[e.c][1] - y) * 0.09;
        if (reedsN > 0) { reeds(g, x, y, 7, { lit: '#8E9A6E', shade: '#5E6A48', ink: INK7, lw: PX }); reedsN--; } else if (snags > 0) { snag(g, x, y, 9, { lw: PX }, '#CFC6B4'); if (band === 'near') { g.globalAlpha = 0.25; g.save(); g.translate(x, y); g.scale(1, -0.6); snag(g, 0, 0, 9, { lw: PX }, '#CFC6B4'); g.restore(); g.globalAlpha = 1; } snags--; } }
    }
  }
  g.restore();
  if (peaks) { // the massif: drawn after the clip so tips may rise a little over the outline
    const R = rngFor('wild:' + w.id), list = [];
    for (const c of w.cells) {
      const poly = cells[c], bb = bboxOf(poly), inr = distToEdge(poly, ...cent[c]), base = 0.55 * inr;
      const n = band === 'far' ? 3 + Math.floor(R() * 3) : Math.round(Math.max(8, Math.min(14, (11 * areaOf[c]) / MEAN_AREA)));
      const pts2 = []; const rad = Math.sqrt(areaOf[c] / (n * 1.6));
      for (let t = 0; t < 600 && pts2.length < n; t++) {
        const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]);
        if (!inPoly(poly, x, y) || distToEdge(poly, x, y) < base * 0.42) continue;
        if (pts2.some((q) => Math.hypot(q[0] - x, (q[1] - y) * 1.6) < rad)) continue;
        if (boxHit(lbox, x - base * 0.6, y - base, x + base * 0.6, y + 2)) continue;
        pts2.push([x, y]);
      }
      const centers = Math.min(pts2.length, 2 + (R() < 0.5 ? 1 : 0));
      pts2.forEach(([x, y], k) => {
        let h = base * (k < centers ? 1.7 : 0.75 + R() * 0.45) * (band === 'far' ? 1.25 : 1);
        while (h > base * 0.4 && !inWild(w, x, y - h * 0.9)) h *= 0.85;
        if (lbox.length && boxHit(lbox, x - h * 0.6, y - h, x + h * 0.6, y)) h = Math.min(h, Math.max(base * 0.4, y - lbox[0][3] - 2));
        list.push({ x, y, h, big: k < centers });
      });
    }
    list.sort((a, b) => (a.big !== b.big ? (a.big ? -1 : 1) : a.y - b.y));
    const cols = { lit: '#8A857E', shade: '#46423F', snow: '#F2EEE6', snowShade: '#CFCAC1', ink: INK, lw: 1.3 / s };
    for (const q of list) {
      if (band === 'near') { g.strokeStyle = 'rgba(110,106,100,.55)'; g.lineWidth = PX; for (let n = 0; n < 5; n++) { g.beginPath(); g.moveTo(q.x - q.h * 0.3 + n * q.h * 0.15, q.y); g.lineTo(q.x - q.h * 0.42 + n * q.h * 0.21, q.y + q.h * 0.14); g.stroke(); } }
      peakStamp(g, q.x, q.y, q.h, { lw: 1.3 / s }, cols);
    }
  }
}

// ---- the sprite cache: decoration per province per band, wilds per range per band; budgeted, with cross-fades
const SPR = new Map(), WSPR = new Map(), KEYS = new Array(N).fill(''), ANIM = new Map();
const dprC = () => Math.min(2, dpr);
function spriteRes(band) { return Math.min(3.2, BAND_RES[band] * dprC()); }
function bakeProv(i, band) {
  const G = geo(i), pad = [12, 30, 12, 8], bb = [G.bb[0] - pad[0], G.bb[1] - pad[1], G.bb[2] + pad[2], G.bb[3] + pad[3]];
  return bakeWorld(bb, spriteRes(band), (g) => drawProvinceDeco(g, i, band));
}
function bakeWild(w, band) { const G = wgeo(w), bb = [G.bb[0] - 4, G.bb[1] - 30, G.bb[2] + 4, G.bb[3] + 4]; return bakeWorld(bb, spriteRes(band), (g) => bakeWildInto(g, w, band)); }
let KEYVER = 0;
function refreshKeys() { for (const i of provList) KEYS[i] = lookKey(i); KEYVER++; }
const STL = new Map();
function settlementC(i) { const k = KEYS[i] + '|' + prov[i].pop; let v = STL.get(i); if (!v || v.k !== k) { v = { k, st: settlement(i) }; STL.set(i, v); } return v.st; }
const COMP = {};
function animatingSprites(now) { for (const i of ANIM.keys()) { const sp = SPR.get(bandOf(cam.s) + ':' + i); if (!sp || sp.key !== KEYS[i] || (sp.prev && now - sp.t0 < 600)) return true; } return false; }
function decoComposite(band, now) { // the whole sheet in one canvas for Far and Mid: a pan blits it once
  const sig = KEYVER + ':' + band + ':' + dpr + ':' + SPR.size;
  const c = COMP[band]; if (c && c.sig === sig && c.ok) return c;
  if (!bakeMissing(provsByY.map((p) => p.i), band, now)) return null;
  const out = bakeWorld([-20, -40, W + 20, H + 20], spriteRes(band), (g) => { for (const p of provsByY) blitW(g, SPR.get(band + ':' + p.i)); });
  out.sig = KEYVER + ':' + band + ':' + dpr + ':' + SPR.size; out.ok = true; COMP[band] = out; return out;
}
let bakeBudgetEnd = 0, bakesPending = false;
const BAKES = [];
function provSprite(i, band, now, force) { // force: bake now whatever the budget (the caller guarantees progress)
  const k = band + ':' + i, sp = SPR.get(k);
  if (sp && sp.key === KEYS[i]) return sp;
  if (!force && performance.now() > bakeBudgetEnd) { bakesPending = true; return sp ?? SPR.get('mid:' + i) ?? SPR.get('far:' + i) ?? SPR.get('near:' + i) ?? null; }
  const nb = bakeProv(i, band); nb.key = KEYS[i];
  const an = ANIM.get(i);
  if (sp && an && !view.reduced) { nb.prev = sp; nb.t0 = now; nb.from = an.from; }
  SPR.set(k, nb); return nb;
}
function bakeMissing(list, band, now) { // at least one bake per pass, then as many as the budget allows
  let n = 0;
  for (const i of list) { const sp = SPR.get(band + ':' + i); if (sp && sp.key === KEYS[i]) continue; if (n > 0 && performance.now() > bakeBudgetEnd) { bakesPending = true; return false; } provSprite(i, band, now, true); n++; }
  return true;
}
function wildSprite(w, band) { const k = band + ':' + w.id; let sp = WSPR.get(k); if (!sp) { sp = bakeWild(w, band); WSPR.set(k, sp); } return sp; }
function invalidateBakes() { SPR.clear(); WSPR.clear(); for (const k in COMP) delete COMP[k]; }


// ------------------------------------------------------------------ v3: watercolor washes on linen (D1 ground paint, D2 paper), the province bake,
// and the live state overlay. The paint's mean stays the docs/09 fill (H1, H2); its key is terrain, explored, owned and Map detail (H10).
// v3 critique 2: lifts recalibrated for the wider, irregular edge pool and the ranges' relief wash (mountains 1.2 -> 2.6, plains 1.2 -> 1.7)
const PAINT = { plains: { M: 3, E: -7, G: 0.25, B: 1, lift: 1.7 }, farmland: { M: 3, E: -7, G: 0.2, B: 0, lift: 1.2 }, forest: { M: 3, E: -5, G: 0.45, B: 0, lift: 0.8 }, hills: { M: 0, E: -6, G: 0.6, B: 1, lift: 1.0 }, mountains: { M: 1, E: -7, G: 0.7, B: 1, lift: 2.6, relief: 0.08 }, swamp: { M: 1, E: -6, G: 0.35, B: 2, lift: 1.0 }, wasteland: { M: 0, E: -8, G: 0.8, B: 1, lift: 1.4 } };
const FLECK = { plains: { col: '#9A6446', cov: 0.009, bands: ['near'] }, mountains: { col: '#B59A55', cov: 0.015, bands: ['mid', 'near'] }, wasteland: { col: '#8E5A3E', cov: 0.02, bands: ['mid', 'near'] }, swamp: { col: '#A99C70', cov: 0.015, bands: ['near'], stalk: true } };
// ---- seamless tiles, seeded and world-locked (one tile pixel per u)
function vnoiseTile(S, R, cells, amp) { // periodic value noise, smoothstep-interpolated
  const L = new Float32Array(cells * cells); for (let k = 0; k < L.length; k++) L[k] = R() * 2 - 1;
  const out = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const gx = (x / S) * cells, gy = (y / S) * cells, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const at = (a, b) => L[((b % cells) * cells) + (a % cells)];
    out[y * S + x] = amp * ((at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy);
  }
  return out;
}
let PAPER = null, GRAN = null;
function paperTile() {
  if (view.art.paper && view.art.paper.tile) return view.art.paper.tile;
  if (PAPER) return PAPER;
  const S = 256, R = rngFor('paper:12'), fine = vnoiseTile(S, R, 170, 12), coarse = vnoiseTile(S, R, 6, 8); // v3 critique 2: the coarse octave 11 -> 6 cells (the slow unevenness of a wash)
  const c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let k = 0; k < S * S; k++) { const v = 128 + fine[k] + coarse[k]; img.data[k * 4] = img.data[k * 4 + 1] = img.data[k * 4 + 2] = v; img.data[k * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); g.lineCap = 'round'; g.lineWidth = 0.8;
  for (let k = 0; k < 400; k++) { // fibres within 25 degrees of horizontal (never near the reserved 45)
    const x = R() * S, y = R() * S, a = (R() - 0.5) * (50 * Math.PI / 180), L = 3 + R() * 5; g.strokeStyle = k % 2 ? 'rgba(90,70,40,.10)' : 'rgba(255,250,235,.14)';
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L); g.stroke(); }
  }
  PAPER = c; return c;
}
function granTile() {
  if (GRAN) return GRAN;
  const S = 128, R = rngFor('gran:12'), n = vnoiseTile(S, R, 85, 26), c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let k = 0; k < S * S; k++) { const v = 128 + n[k]; img.data[k * 4] = img.data[k * 4 + 1] = img.data[k * 4 + 2] = v; img.data[k * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); GRAN = c; return c;
}
const PATS = new WeakMap();
// v3 critique 2 (deviation from §1.3, "one tile pixel = 1 u"): the paper and granulation tiles are scaled per band, U x {far 4, mid 2.4,
// near 1.2} per tile pixel, so the tooth lands at about 1.5 screen px at the start zoom instead of averaging away below a pixel.
// Amplitudes, alpha and the soft-light blend are unchanged, so the means hold; the 150 ms band cross-fade hides the step in scale.
const PAT_SCALE = { far: 4, mid: 2.4, near: 1.2 };
function worldPattern(g, tile, band = 'mid') { const k = U * PAT_SCALE[band], p = g.createPattern(tile, 'repeat'); p.setTransform(new DOMMatrix([k, 0, 0, k, 0, 0])); return p; }
// scratch canvases reused by every bake
const SCR = {};
function scratch(name, w, h, T) {
  let c = SCR[name]; if (!c) c = SCR[name] = makeCanvas(w, h);
  if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
  const x = c.getContext('2d', BAKE_CTX); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.filter = 'none'; x.clearRect(0, 0, w, h); if (T) x.setTransform(T); return [c, x];
}
function blitScratch(g, c, w, h, mode, alpha) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = mode; g.globalAlpha = alpha; g.drawImage(c, 0, 0, w, h, 0, 0, w, h); g.restore(); }
const rgbaOf = (hex, a) => rgba(hex, a);
const PG = {}, PSKIP = new Set(); let PGT = 0; const pgm = (k) => { const t = performance.now(); PG[k] = (PG[k] ?? 0) + t - PGT; PGT = t; };
function paintGround(g, i, band, unexp) { PGT = performance.now();
  const p = prov[i], f = TERRAIN[p.terrain].fill, rec = PAINT[p.terrain], G = geo(i), poly = G.poly, PX = 1 / BAND_RES[band];
  const T = g.getTransform(), res = T.a, cw = g.canvas.width, ch = g.canvas.height, D = MED_DIAM;
  // 1 base, opaque
  pathPoly(g, poly); g.fillStyle = f; g.fill();
  const paper = () => { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.5; g.fillStyle = worldPattern(g, paperTile(), band); pathPoly(g, poly); g.fill(); g.restore(); };
  if (unexp) { paper(); return; } // not yet painted: the terrain base and the paper only
  pgm('base');
  // 2 lift
  g.globalAlpha = 0.5; g.fillStyle = shadeL(f, 2 * rec.lift); pathPoly(g, poly); g.fill(); g.globalAlpha = 1;
  const zs = zonesAll(i), R = rngFor(`paint:12:${i}`), owned = !!p.owner, n = Math.max(2, Math.round((6 * areaOf[i]) / MEAN_AREA)), bb = G.bb;
  const inside = (x, y, m) => d3.polygonContains(poly, [x, y]) && distToEdge(cells[i], x, y) - 6 > m;
  const pick = (m) => { for (let t = 0; t < 30; t++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]); if (inside(x, y, m)) return [x, y]; } return null; };
  pgm('lift');
  // 3 mottle pairs: skipped whole when either blotch's inner half touches the zones, so the sum stays zero in every band
  if (rec.M) for (let k = 0; k < n; k++) {
    const r = (0.1 + 0.08 * R()) * D, a = pick(0), b = pick(0);
    if (!a || !b || inBoxes(zs, a[0], a[1], r / 2) || inBoxes(zs, b[0], b[1], r / 2)) continue;
    for (const [[x, y], dl] of [[a, rec.M], [b, -rec.M]]) { const col = shadeL(f, dl), rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgbaOf(col, 0.55)); rg.addColorStop(1, rgbaOf(col, 0)); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  }
  pgm('mottle');
  // the zones are cut out of the textures with a two-step 4 px feather: full strength beyond zone + 4 px, half between, none inside.
  // (A clip of the polygon minus the zones' union; cheaper than a mask layer.)
  const fth = 4 * U, cutClip = (e) => { g.beginPath(); g.rect(bb[0] - 50, bb[1] - 50, bb[2] - bb[0] + 100, bb[3] - bb[1] + 100); for (const r of rectUnion(zs.map((z) => [z[0] - e, z[1] - e, z[2] + e, z[3] + e]))) g.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]); g.clip('evenodd'); };
  const feathered = (draw) => { for (const [e, a] of [[fth, 0.5], [0, 0.5]]) { g.save(); cutClip(e); g.globalAlpha = a; draw(); g.restore(); } };
  pgm('mask');
  // 4 relief wash beside passable peaks (Mountains; the Mid peak slots, so it is the same in every band): one path, so overlaps never stack
  if (rec.relief && !PSKIP.has('relief')) feathered(() => { g.globalAlpha *= rec.relief; g.fillStyle = '#3A4466'; g.beginPath(); for (const q of midPeaks(i)) { g.moveTo(q.x + 1.7 * q.w, q.y + 0.25 * q.w); g.ellipse(q.x + 0.6 * q.w, q.y + 0.25 * q.w, 1.1 * q.w, 0.45 * q.w, 0, 0, Math.PI * 2); } g.fill(); });
  pgm('relief');
  // 5 granulation (Mid, Near): earths and greys granulate, yellows stay smooth
  if (band !== 'far' && !PSKIP.has('gran')) feathered(() => { g.globalAlpha *= rec.G; g.globalCompositeOperation = 'soft-light'; g.fillStyle = worldPattern(g, granTile(), band); pathPoly(g, poly); g.fill(); });
  pgm('gran');
  // 6 blooms (Mid, Near)
  if (band !== 'far') for (let k = 0; k < rec.B; k++) {
    const r = (0.07 + 0.04 * R()) * D, c = pick(10 * U + r); if (!c || inBoxes(zs, c[0], c[1], r + 4 * U)) continue;
    g.beginPath(); for (let m = 0; m <= 48; m++) { const t = (m / 48) * Math.PI * 2, rr = r * (1 + 0.18 * Math.sin(5 * t) + 0.1 * Math.sin(11 * t)); const x = c[0] + Math.cos(t) * rr, y = c[1] + Math.sin(t) * rr; m ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath();
    g.fillStyle = rgbaOf(shadeL(f, 4), 0.35); g.fill(); g.strokeStyle = rgbaOf(shadeL(f, -9), 0.3); g.lineWidth = 1.2 * PX; g.stroke();
  }
  pgm('blooms');
  // 7 flecks: blue noise, outside the zones (hue richness without a hue mottle). v3 critique 11: gathered in drifts, only where a seeded
  // value-noise mask at 0.25 D is above 0.55 (about a third of the land), radius 0.6 to 1.4 u; the count keeps the §1.4 coverage, so the
  // density inside a drift is about 2.5 to 3 times v3's and the mean holds. 3 u minimum spacing, no rings or rows.
  const fk = FLECK[p.terrain];
  if (fk && fk.bands.includes(band) && view.detail !== 'reduced' && !PSKIP.has('flecks')) {
    const Rf = rngFor('fleck:12:' + i), Rm = rngFor('fleckmask:12:' + i), mc = 0.25 * D, mx = Math.ceil((bb[2] - bb[0]) / mc) + 2, my = Math.ceil((bb[3] - bb[1]) / mc) + 2, lat = new Float32Array(mx * my);
    for (let k = 0; k < lat.length; k++) lat[k] = Rm();
    const sm = (f) => f * f * (3 - 2 * f), mask = (x, y) => { const gx = (x - bb[0]) / mc, gy = (y - bb[1]) / mc, ix = Math.floor(gx), iy = Math.floor(gy), fx = sm(gx - ix), fy = sm(gy - iy), at = (a, b) => lat[b * mx + a]; return (at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx) * (1 - fy) + (at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx) * fy; };
    const want = Math.round((fk.cov * areaOf[i]) / (Math.PI * 1.0533 * U * U)), got = [], cell = 3 * U, grid = new Map(); // E[r^2] for r uniform in 0.6..1.4 u
    for (let t = 0; t < want * 16 && got.length < want; t++) {
      const x = bb[0] + Rf() * (bb[2] - bb[0]), y = bb[1] + Rf() * (bb[3] - bb[1]), r = (0.6 + 0.8 * Rf()) * U;
      if (mask(x, y) <= 0.55 || inBoxes(zs, x, y, 2 * U)) continue;
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell); let near = false;
      for (let a = -1; a <= 1 && !near; a++) for (let b = -1; b <= 1 && !near; b++) for (const q of grid.get((gx + a) * 8192 + gy + b) ?? []) if (Math.hypot(q[0] - x, q[1] - y) < cell) { near = true; break; }
      if (near || !inside(x, y, 3 * U)) continue; got.push([x, y, r]); const kk = gx * 8192 + gy; let gl = grid.get(kk); if (!gl) grid.set(kk, (gl = [])); gl.push([x, y]);
    }
    if (fk.stalk) { g.strokeStyle = 'rgba(94,106,72,.8)'; g.lineWidth = 0.5 * PX; g.beginPath(); for (const [x, y] of got) { g.moveTo(x, y + 3 * U); g.lineTo(x + 0.3 * U, y); } g.stroke(); }
    g.fillStyle = fk.col; g.beginPath(); for (const [x, y, r] of got) { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2); } g.fill();
  }
  pgm('flecks');
  // 8 the edge pool: an inner shadow (inset by B_u on owned land so it begins at the band's inner edge)
  if (!PSKIP.has('pool')) {
    const [c, x] = scratch('pool', cw, ch); x.fillStyle = '#000'; x.fillRect(0, 0, cw, ch); x.setTransform(T); x.globalCompositeOperation = 'destination-out'; pathPoly(x, poly); x.fill(); x.globalCompositeOperation = 'source-over';
    if (owned) { x.strokeStyle = '#000'; x.lineWidth = 2 * B_U; x.lineJoin = 'round'; pathPoly(x, poly); x.stroke(); }
    // v3 critique 2: an irregular casting rim (circles every 3 u along the ring, inset B_u on owned land, radius (1 + 0.6 n) x 3 band px,
    // n value noise along the arc), so the pooled edge swells and thins like a drying wash; and a wider blur (far 5, mid 11, near 14)
    const Rp = rngFor('pool:12:' + i), Lc = cumLen(poly), tot = Lc[Lc.length - 1], nk = Math.max(3, Math.ceil(tot / (24 * U))), kn = Array.from({ length: nk }, () => Rp() * 2 - 1);
    const nAt = (d) => { const t = (d / tot) * nk, k0 = Math.floor(t) % nk, f = t - Math.floor(t), sm = f * f * (3 - 2 * f); return kn[k0] * (1 - sm) + kn[(k0 + 1) % nk] * sm; };
    const nrm = (d) => { const a = arcAt(poly, Lc, Math.max(0, d - U)), b = arcAt(poly, Lc, Math.min(tot, d + U)), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; };
    let vote = 0; for (const f of [0.13, 0.46, 0.79]) { const q = arcAt(poly, Lc, f * tot), n = nrm(f * tot); vote += inPoly(poly, q[0] + n[0] * 2 * U, q[1] + n[1] * 2 * U) ? 1 : -1; }
    const sg = vote > 0 ? 1 : -1, ins = owned ? B_U : 0; x.fillStyle = '#000'; x.beginPath();
    for (let d = 0; d < tot; d += 3 * U) { const q = arcAt(poly, Lc, d), n = nrm(d), r = (1 + 0.6 * nAt(d)) * 3 * PX, cx = q[0] + n[0] * sg * ins, cy = q[1] + n[1] * sg * ins; x.moveTo(cx + r, cy); x.arc(cx, cy, r, 0, Math.PI * 2); }
    x.fill();
    const blur = { far: 5, mid: 11, near: 14 }[band] * spriteRes(band) * PX, OFF = cw + ch + 200;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.shadowColor = rgbaOf(shadeL(f, -28), 0.45); g.shadowBlur = blur; g.shadowOffsetX = OFF; g.drawImage(c, 0, 0, cw, ch, -OFF, 0, cw, ch); g.restore();
  }
  pgm('pool');
  // 9 the pooling line: 2.2 band px visible inside the border or the band
  g.strokeStyle = rgbaOf(shadeL(f, -14), 0.35); g.lineWidth = (owned ? 2 * B_U : 0) + 4.4 * PX; g.lineJoin = 'round'; pathPoly(g, poly); g.stroke();
  pgm('line');
  if (!PSKIP.has('paper')) paper(); pgm('paper');
}
// the Mid passable-peak stamps of a Mountains province (positions and sizes), for the relief wash in every band
const MIDPEAKS = new Map();
function midPeaks(i) {
  const k = KEYS[i] + ':' + i; let v = MIDPEAKS.get(i); if (v && v.k === k) return v.list;
  const list = stampSlotsFor(i, 'mid').flatMap((s) => mountainRange(i, s, false).list); // v3 critique 4: every peak of every range
  MIDPEAKS.set(i, { k, list }); return list;
}
// ---- the province's stamp slots for a band: free of the band's zones, motifs and poles, tracks, water and marks
const STAMP_R = { forest: 7, hills: 10, mountains: 9, plains: 3.5, farmland: 5, swamp: 3.5, wasteland: 3.5 };
function slotLooks(i, band) {
  const p = prov[i], G = geo(i), unexp = fogOf(i) === 'unexplored', ex = zones(i, band);
  const free = G.slots.filter((s) => !boxHit(ex, s.x - 6, s.y - 12, s.x + 6, s.y + 2));
  // deviation: terrain stamps may stand in the fixed token zone (tokens are opaque plates over them; the zone keeps the paint flat);
  // labels, the second line and the seat stay clear
  const exS = [ex[0], ex[1], ex[3]], free3 = (G.slots3 ?? G.slots).filter((s) => !boxHit(exS, s.x - 4, s.y - 8, s.x + 4, s.y + 2));
  const look = unexp ? null : p.dom.n, lvl = p.dom.s >= 7 ? 3 : p.dom.s >= 4 ? 2 : p.dom.s >= 1 ? 1 : 0, shown = band !== 'far' && !unexp, reduced = view.detail === 'reduced';
  let motifSlots = [], poleSlots = [];
  if (shown && look && lvl) {
    const pct = [0, 0.08, 0.15, 0.22][lvl]; motifSlots = free.slice(0, Math.max(1, Math.round(free.length * pct)));
    if (!reduced) { const eff = effOf(p); const per = band === 'near' ? 2 : 1; const list = []; for (const [nm, st2] of eff) for (let n = 0; n < Math.min(6, st2 * per); n++) list.push(nm); poleSlots = free.slice(-list.length).map((s, j) => ({ s, pole: list[j] })).filter((x) => list.length && x.s); poleSlots = poleSlots.slice(0, Math.floor(free.length * 0.3)); }
  }
  return { free, free3, look, lvl, shown, motifSlots, poleSlots, unexp, reduced };
}
function stampSlotsFor(i, band, L) {
  L = L ?? slotLooks(i, band); const p = prov[i], k = areaOf[i] / MEAN_AREA, spec = TSPEC[p.terrain], r = STAMP_R[p.terrain] * U;
  const taken = new Set([...L.motifSlots, ...L.poleSlots.map((x) => x.s)]);
  const se = settleExtent(i), G = geo(i), clearing = p.terrain === 'forest' ? 1.3 * se : 0;
  const count = Math.round(spec[BIX[band]] * k * (L.reduced ? 0.5 : 1) * (p.terrain === 'forest' && band !== 'far' ? (band === 'mid' ? 2 : 1.5) : 1)); // forests (fog line art): crowns in clumps
  const near = (s) => [...L.motifSlots, ...L.poleSlots.map((x) => x.s)].some((q) => Math.hypot(q.x - s.x, q.y - s.y) < 6 * U);
  // v3 critique 4: a range's whole box keeps out of the label, second-line and seat zones and off the tracks, brooks, ponds and marks
  const rng = p.terrain === 'hills' ? hillsRange : p.terrain === 'mountains' ? mountainRange : null, zb = zones(i, band), zS = [zb[0], zb[1], zb[3]];
  const rangeOK = (s) => { const b = rng(i, s, band === 'far').box; return !boxHit(zS, b[0], b[1], b[2], b[3]) && !rangeBlocked(i, b); };
  return L.free3.filter((s) => !taken.has(s) && !near(s) && !stampBlocked(i, s.x, s.y, r) && !(clearing && Math.hypot(s.x - G.seat[0], (s.y - G.seat[1]) * 1.3) < clearing) && (!rng || rangeOK(s))).sort((a, b) => a.rank - b.rank).slice(0, count);
}
// ---- v3 critique 4: Hills and Mountains stand as ranges, one §5.4 item per slot (seeded by the slot, so every band draws the same range)
const RANGES = new Map();
function hillsRange(i, s, far) {
  const k = 'h' + i + ':' + (s.x | 0) + ':' + (s.y | 0) + ':' + far; let v = RANGES.get(k); if (v) return { ...v, R: rngFor(k + ':draw') };
  const R = rngFor(`stamp:${i}:${s.x | 0}:${s.y | 0}`), w = (11 + R() * 5) * (far ? 1.8 : 1) * SS, list = hillRangeGeom(s.x, s.y, w, R);
  v = { list, box: rangeBox(list.map((q) => ({ ...q, h: q.w * 0.42 }))) }; RANGES.set(k, v); return { ...v, R: rngFor(k + ':draw') };
}
function mountainRange(i, s, far) {
  const k = 'm' + i + ':' + (s.x | 0) + ':' + (s.y | 0) + ':' + far; let v = RANGES.get(k); if (v) return v;
  const R = rngFor(`stamp:${i}:${s.x | 0}:${s.y | 0}`), w = (7 + R() * 3) * (far ? 1.8 : 1) * SS * 1.15, list = peakRangeGeom(s.x, s.y, w, R);
  v = { list, box: rangeBox(list), geoms: list.map((q) => peakGeom(q.x, q.y, q.h, q.w, R, false)), R }; RANGES.set(k, v); return v;
}
function rangeBlocked(i, b) { // landmarks, ruins, heroes, vignettes and ponds keep clear of the whole range; tracks and brooks of its middle
  const blk = feats().block.get(i); if (!blk) return false; const cy = (b[1] + b[3]) / 2, rr = Math.max(2 * U, (b[3] - b[1]) / 2), cx = (b[0] + b[2]) / 2;
  if (blk.lines.some((L) => distToPolyline(L, cx, cy) < rr + 2 * U)) return true;
  for (let k = 0; k <= 4; k++) { const x = b[0] + rr + ((b[2] - b[0] - 2 * rr) * k) / 4; if (blk.pond && Math.hypot(x - blk.pond.x, (cy - blk.pond.y) / 0.75) < blk.pond.r + rr) return true; if (blk.marks.some(([mx, my, mr]) => Math.hypot(x - mx, cy - my) < mr + rr)) return true; }
  return false;
}
// ---- v3 critique 1: forests as a canopy. Crown centers are sampled once per province by seeded Poisson disk at Near spacing (0.75 (ra + rb),
// about 1.5 r, r 4.5 to 6.5 u) over the polygon inset by B_u + 2 u, off the tracks, brooks, ponds and marks, the clearing (1.3 x the settlement
// extent) and 2 to 4 glades (r 0.08 to 0.12 D). Each band keeps a rank share (Mid 0.55) outside its own label, second-line and seat zones,
// so crossing into Near adds crowns and never moves one. Crowns group into clumps by proximity (at most 7 at Mid, 9 at Near), a clump is one
// §5.4 item, and the clumps are capped at 28 (Mid) and 55 (Near) per average province.
const CANOPY = new Map(), CANOPY_KEEP = { mid: 0.55, near: 0.77 }, CLUMP_MAX = { mid: 7, near: 9 }, CLUMP_CAP = { mid: 28, near: 55 };
const conRateOf = (i) => (nbrs(i).some((w) => terr[w] === 'mountains') || NB[i].some((w) => isWild(w) && wildOf[w].kind === 'peaks') ? 0.7 : 0.15);
function canopyAll(i) {
  const F = feats(); let v = CANOPY.get(i); if (v && v.F === F) return v.list;
  const G = geo(i), poly = G.poly, cv = cells[i], bb = G.bb, R = rngFor('canopy:12:' + i), se = settleExtent(i), D = MED_DIAM, conRate = conRateOf(i);
  const glades = [], ng = 2 + Math.floor(R() * 3);
  for (let t = 0; t < 80 && glades.length < ng; t++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]), r = (0.08 + 0.04 * R()) * D; if (inPoly(cv, x, y) && distToEdge(cv, x, y) > 0.12 * D && Math.hypot(x - G.seat[0], (y - G.seat[1]) * 1.3) > 1.3 * se + r * 0.5) glades.push([x, y, r]); }
  const list = [], cell = 10 * U, grid = new Map(), lastD = G.slots.at(-1)?.d ?? 1, tries = Math.round((areaOf[i] / (Math.PI * (3.6 * U) ** 2)) * 14);
  const crowd = (x, y, r) => { const gx = Math.floor(x / cell), gy = Math.floor(y / cell); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const q of grid.get((gx + a) * 8192 + gy + b) ?? []) if (Math.hypot(q.x - x, q.y - y) < 0.75 * (q.r + r)) return true; return false; };
  for (let t = 0; t < tries; t++) {
    const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]), r = (4.5 + 2 * R()) * U, vy = y - 0.95 * r;
    if (crowd(x, y, r) || Math.hypot(x - G.seat[0], (y - G.seat[1]) * 1.3) < 1.3 * se || glades.some(([gx, gy, gr]) => Math.hypot(x - gx, y - gy) < gr)) continue;
    if (!inPoly(cv, x, vy) || distToEdge(cv, x, vy) - 6 < B_U + 2 * U || !inPoly(poly, x, vy) || !inPoly(poly, x, y) || stampBlocked(i, x, vy, r)) continue;
    const Rc = rngFor(`crown:12:${i}:${list.length}`), q = { x, y, r, rank: Rc(), k: 3 + Math.floor(Rc() * 3), ph: Rc() * 6.28, conifer: Rc() < conRate, seed: Math.floor(Rc() * 1e9), v: Rc(), d: Math.hypot(x - G.seat[0], (y - G.seat[1]) * 1.4), lastD };
    list.push(q); const kk = Math.floor(x / cell) * 8192 + Math.floor(y / cell); let gl = grid.get(kk); if (!gl) grid.set(kk, (gl = [])); gl.push(q);
  }
  CANOPY.set(i, { F, list, glades }); return list;
}
function canopyFor(i, band) {
  const zb = zones(i, band), zS = [zb[0], zb[1], zb[3]], keep = CANOPY_KEEP[band] * (view.detail === 'reduced' ? 0.5 : 1);
  return canopyAll(i).filter((q) => q.rank < keep && !boxHit(zS, q.x - q.r, q.y - 2 * q.r, q.x + q.r, q.y));
}
function canopyClumps(i, band, crowns) { // greedy grouping by proximity in rank order, then the smallest clumps merge until under the cap
  const max = CLUMP_MAX[band], cap = Math.max(3, Math.round(CLUMP_CAP[band] * (areaOf[i] / MEAN_AREA))), cell = 16 * U, grid = new Map(), left = new Set(crowns);
  for (const q of crowns) { const kk = Math.floor(q.x / cell) * 8192 + Math.floor(q.y / cell); let gl = grid.get(kk); if (!gl) grid.set(kk, (gl = [])); gl.push(q); }
  const nb = (m) => { const gx = Math.floor(m.x / cell), gy = Math.floor(m.y / cell), o = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const q of grid.get((gx + a) * 8192 + gy + b) ?? []) if (left.has(q)) o.push(q); return o; };
  let clumps = [];
  for (const c of [...crowns].sort((a, b) => a.rank - b.rank)) {
    if (!left.has(c)) continue; left.delete(c); const cl = [c];
    while (cl.length < max) { let best = null, bd = Infinity; for (const m of cl) for (const q of nb(m)) { const d = Math.hypot(q.x - m.x, q.y - m.y); if (d < 1.2 * (q.r + m.r) && d < bd) { bd = d; best = q; } } if (!best) break; left.delete(best); cl.push(best); }
    clumps.push(cl);
  }
  const ctr = (cl) => [cl.reduce((a, q) => a + q.x, 0) / cl.length, cl.reduce((a, q) => a + q.y, 0) / cl.length];
  while (clumps.length > cap) { clumps.sort((a, b) => a.length - b.length); const sm = clumps.shift(), c0 = ctr(sm); let best = 0, bd = Infinity; clumps.forEach((cl, k) => { const c1 = ctr(cl), d = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]); if (d < bd) { bd = d; best = k; } }); clumps[best] = clumps[best].concat(sm); }
  return clumps.map((cl) => cl.sort((a, b) => a.y - b.y));
}

// ---- D3 ground textures for the painted look (within +-8 L*): v2's, with hand-inked fields, wavy dotted hedges, infields and clearings
function dotLine(g, P, every, r, col) { const Lc = cumLen(P), tot = Lc[Lc.length - 1]; g.fillStyle = col; g.beginPath(); for (let d = every / 2; d < tot; d += every) { const q = arcAt(P, Lc, d); g.moveTo(q[0] + r, q[1]); g.arc(q[0], q[1], r, 0, Math.PI * 2); } g.fill(); }
function wobble(a, b, R, amp, levels) { return ridge(a, b, R, amp, levels); }
function groundP(g, i, band, R) {
  const p = prov[i], G = geo(i), f = TERRAIN[p.terrain].fill, PX = 1 / BAND_RES[band], k = areaOf[i] / MEAN_AREA, [bx0, by0, bx1, by1] = G.bb;
  const rx = () => bx0 + R() * (bx1 - bx0), ry = () => by0 + R() * (by1 - by0), se = settleExtent(i);
  switch (p.terrain) {
    case 'plains': {
      for (let n = 0; n < 120 * k; n++) { g.fillStyle = rgba(shadeL(f, R() < 0.5 ? -8 : 8), 0.55); ellipse(g, rx(), ry(), 1.1, 1.1); g.fill(); }
      for (let h = 0; h < 1 + (R() < 0.5 ? 1 : 0); h++) { // v3 critique 10: hedgerow dots 1.2 u every 3.5 u (wavy: Order's are straight); at Near a crown on every fifth
        const s = G.slots[Math.floor(R() * G.slots.length)]; if (!s) break; const a = R() * Math.PI, L = 40 + R() * 40; const P = chaikin(wobble([s.x, s.y], [s.x + Math.cos(a) * L, s.y + Math.sin(a) * L * 0.6], R, 0.12, 3), 2, false);
        dotLine(g, P, 3.5 * U, 1.2 * U, 'rgba(94,112,70,.6)');
        if (band === 'near') { const Lc = cumLen(P), tot = Lc[Lc.length - 1], Pp = paletteP(i, band, null), Rh = rngFor(`hedge:12:${i}:${h}`); let m = 0; for (let d = 3.5 * U / 2; d < tot; d += 3.5 * U, m++) { if (m % 5 !== 2) continue; const q = arcAt(P, Lc, d); drawClump(g, [{ x: q[0], y: q[1], r: 2.5 * U, k: 3 + Math.floor(Rh() * 3), ph: Rh() * 6.28, conifer: false }], Pp); } }
      }
      break;
    }
    case 'farmland': {
      const n = 5 + Math.floor(R() * 5), seeds = []; while (seeds.length < n) { const x = rx(), y = ry(); if (inPoly(G.poly, x, y)) seeds.push([x, y]); }
      const vor = d3.Delaunay.from(seeds).voronoi([bx0 - 2, by0 - 2, bx1 + 2, by1 + 2]);
      const doubled = p.dom.n === 'green' && effStep(3, p.dom.s) >= 2, edges = new Map();
      seeds.forEach((sd, j) => {
        const cell = vor.cellPolygon(j); if (!cell) return;
        g.save(); pathPoly(g, cell); g.clip(); g.fillStyle = shadeL(f, (R() - 0.5) * 10); g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
        const ang = [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(R() * 4)], sp = doubled ? 3.2 : 6.4, L = (bx1 - bx0) + (by1 - by0);
        g.strokeStyle = rgba(shadeL(f, -12), 0.35); g.lineWidth = 0.9; g.beginPath();
        for (let o = -L; o < L; o += sp) { const cx = sd[0] + Math.cos(ang + Math.PI / 2) * o, cy = sd[1] + Math.sin(ang + Math.PI / 2) * o; g.moveTo(cx - Math.cos(ang) * L, cy - Math.sin(ang) * L); g.lineTo(cx + Math.cos(ang) * L, cy + Math.sin(ang) * L); }
        g.stroke(); g.restore();
        for (let m = 0; m < cell.length - 1; m++) { const a = cell[m], b = cell[m + 1], key = [a, b].map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).sort().join('|'); if (!edges.has(key)) edges.set(key, [a, b]); }
      });
      const Re = rngFor(`map:11:${i}:hedges`); // hedges between fields: hand-inked, wobbly dotted bushes
      for (const [a, b] of edges.values()) { if (!inPoly(G.poly, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)) continue; const P = chaikin(wobble(a, b, Re, 0.15, 2), 1, false); g.strokeStyle = 'rgba(78,90,46,.35)'; g.lineWidth = 0.8 * PX; g.beginPath(); P.forEach(([x, y], m) => (m ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); dotLine(g, P, 3 * U, 0.7 * U, 'rgba(78,90,46,.6)'); }
      break;
    }
    case 'forest': {
      for (let y = by0; y < by1; y += 8) for (let x = bx0 + ((y / 8) % 2) * 5; x < bx1; x += 10) { const r = 4 + R() * 2; g.strokeStyle = R() < 0.55 ? 'rgba(42,58,33,.4)' : 'rgba(75,99,57,.3)'; g.lineWidth = 1.1; g.beginPath(); g.arc(x + (R() - 0.5) * 3, y, r, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
      const c = G.seat, rg = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], 1.3 * se); rg.addColorStop(0, rgba(shadeL(f, 5), 1)); rg.addColorStop(0.75, rgba(shadeL(f, 5), 0.85)); rg.addColorStop(1, rgba(shadeL(f, 5), 0)); // a clearing in the woods
      g.save(); g.translate(c[0], c[1]); g.scale(1, 1 / 1.3); g.translate(-c[0], -c[1]); g.fillStyle = rg; g.beginPath(); g.arc(c[0], c[1], 1.3 * se, 0, Math.PI * 2); g.fill(); g.restore();
      break;
    }
    case 'hills': break; // v3 critique 5: v2's loose arcs (unscaled, with no hump under them) are gone
    case 'mountains': { for (let n = 0; n < 160 * k; n++) { g.fillStyle = 'rgba(110,127,134,.4)'; ellipse(g, rx(), ry(), 0.9 + R() * 0.8, 0.8); g.fill(); } break; }
    case 'swamp': {
      g.strokeStyle = 'rgba(44,140,148,.6)'; g.lineWidth = 1.2; g.lineCap = 'round';
      for (let y = by0 + 4; y < by1; y += 7) for (let x = bx0 + ((y / 7) % 2) * 9; x < bx1; x += 22) { const L = 6 + R() * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y); g.stroke(); }
      g.lineCap = 'butt'; for (let n = 0; n < 5 * k; n++) { const x = rx(), y = ry(), w = 6 + R() * 8, h = 2.5 + R() * 2.5; g.fillStyle = 'rgba(44,140,148,.45)'; ellipse(g, x, y, w, h); g.fill(); if (band === 'near') { g.strokeStyle = 'rgba(159,208,212,.7)'; g.lineWidth = PX; g.beginPath(); g.moveTo(x - w * 0.4, y - h * 0.2); g.lineTo(x + w * 0.1, y - h * 0.2); g.stroke(); } }
      break;
    }
    case 'wasteland': { const seeds = []; const n = 20 + Math.floor(R() * 11); while (seeds.length < n) seeds.push([rx(), ry()]); const vor = d3.Delaunay.from(seeds).voronoi([bx0, by0, bx1, by1]); g.strokeStyle = 'rgba(143,110,100,.45)'; g.lineWidth = 1; g.beginPath(); vor.render(g); g.stroke(); break; }
  }
  // infields: on Plains, Hills and Wasteland a town of tier T >= 2 tills T - 1 patches just outside its fixed extent (growth adds the next spot)
  const tier = tierOf(p);
  if (band !== 'far' && tier >= 2 && ['plains', 'hills', 'wasteland'].includes(p.terrain)) {
    const Ri = rngFor('infield:12:' + i), spots = []; for (let m = 0; m < 6; m++) spots.push({ a: Ri() * Math.PI * 2, rr: (1.15 + 0.35 * Ri()) * se, rank: Ri(), sides: 3 + Math.floor(Ri() * 3), ang: [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(Ri() * 4)], dl: (Ri() - 0.5) * 10, rot: Ri() * 6.28 });
    const st = settlementC(i), hr = 0.5 * st.rad;
    for (const sp of spots.sort((a, b) => a.rank - b.rank).slice(0, Math.min(4, tier - 1))) {
      const cx = G.seat[0] + Math.cos(sp.a) * sp.rr, cy = G.seat[1] + Math.sin(sp.a) * sp.rr * 0.7; if (!inPoly(G.poly, cx, cy)) continue;
      const P = []; for (let m = 0; m < sp.sides; m++) { const t = sp.rot + (m / sp.sides) * Math.PI * 2; P.push([cx + Math.cos(t) * hr, cy + Math.sin(t) * hr * 0.7]); }
      g.save(); pathPoly(g, P); g.clip(); g.fillStyle = shadeL(f, sp.dl); g.fillRect(cx - hr, cy - hr, 2 * hr, 2 * hr); g.strokeStyle = rgba(shadeL(f, -12), 0.4); g.lineWidth = 0.8 * PX; g.beginPath(); for (let o = -hr; o < hr; o += 2.4) { const ox = cx + Math.cos(sp.ang + Math.PI / 2) * o, oy = cy + Math.sin(sp.ang + Math.PI / 2) * o; g.moveTo(ox - Math.cos(sp.ang) * hr, oy - Math.sin(sp.ang) * hr); g.lineTo(ox + Math.cos(sp.ang) * hr, oy + Math.sin(sp.ang) * hr); } g.stroke(); g.restore();
      pathPoly(g, P); g.strokeStyle = 'rgba(78,90,46,.45)'; g.lineWidth = 0.8 * PX; g.stroke();
    }
  }
}

// ---- the painted province bake
function drawProvinceDeco(g, i, band, opt = {}) { if (!PAINTED()) return drawProvinceDecoV2(g, i, band); return drawProvinceDecoP(g, i, band, opt); }
function drawProvinceDecoP(g, i, band, opt) {
  const p = prov[i], G = geo(i), fog = fogOf(i), unexp = fog === 'unexplored';
  const PX = 1 / BAND_RES[band], R = rngFor(`map:11:${i}:${band}:paint`);
  const lineCol = DARK_T.has(p.terrain) ? PAPER_INK : FEATURE_INK;
  const P = paletteP(i, band, unexp ? lineCol : null);
  const FT = feats(), LM = FT.land.get(i) ?? {}, HERO = FT.heroes.get(i), VG = FT.vig.get(i), reduced = view.detail === 'reduced';
  const IO = !!opt.itemsOnly; // the density check: standing items only, no paint, ground, water, settlement or shadows
  g.save(); pathPoly(g, G.poly); g.clip();
  if (!reduced && !IO) paintGround(g, i, band, unexp);
  if (opt.paintOnly) { g.restore(); return; }
  if (!unexp && !IO) groundP(g, i, band, rngFor(`map:11:${i}:ground`));
  const L = slotLooks(i, band), { look, lvl, shown } = L, st = unexp ? null : settlement(i);
  if (IO) g.restore(); else {
  if (shown && look === 'red' && lvl) { const Rr = rngFor(`map:11:${i}:ash`); g.fillStyle = 'rgba(143,140,136,.25)'; for (let n = 0; n < 50 * lvl; n++) { const s = G.slots[Math.floor(Rr() * Math.min(G.slots.length, 6 + lvl * 6))]; if (s) { ellipse(g, s.x + (Rr() - 0.5) * 26, s.y + (Rr() - 0.5) * 18, 1.2, 1.2); g.fill(); } } }
  if (shown && look === 'green' && lvl >= 2) { const Rr = rngFor(`map:11:${i}:meadow`); g.fillStyle = 'rgba(239,231,207,.75)'; for (let n = 0; n < 30 * lvl; n++) { const s = G.slots[Math.floor(Rr() * Math.min(G.slots.length, 8 + lvl * 6))]; if (s) { ellipse(g, s.x + (Rr() - 0.5) * 24, s.y + (Rr() - 0.5) * 16, 0.9, 0.9); g.fill(); } } }
  if (st && st.thrive && band !== 'far') { const Rr = rngFor(`map:11:${i}:garden`); for (let n = 0; n < 6; n++) { const a = Rr() * Math.PI * 2, r = st.rad + 3 + Rr() * 6; g.fillStyle = n % 2 ? 'rgba(110,143,78,.55)' : 'rgba(138,106,58,.45)'; g.fillRect(st.sx + Math.cos(a) * r * 1.1 - 2.5, st.sy + Math.sin(a) * r * 0.7 - 1.5, 5, 3); } }
  if (!unexp && p.scar === 'churned' && band !== 'far') { const Rr = rngFor(`map:11:${i}:scar`); g.fillStyle = 'rgba(94,70,48,.45)'; for (let n = 0; n < 40; n++) { const t = Rr(); ellipse(g, G.c[0] - 60 + t * 120 + (Rr() - 0.5) * 10, G.c[1] - 30 + t * 50 + (Rr() - 0.5) * 10, 2 + Rr() * 3, 1.2 + Rr()); g.fill(); } }
  if (!unexp && band !== 'far') drawWater(g, i, band, PX); // D4: scenery; unexplored provinces show no water (H5)
  g.restore(); }

  // D6: standing items, by bottom edge, every cast shadow first
  const items = [], free = L.free, far = band === 'far';
  const stampSlots = stampSlotsFor(i, band, L);
  const blossom = shown && look === 'green', charredOK = shown && look === 'red' && lvl >= 3;
  const conRate = conRateOf(i);
  if (p.terrain === 'forest' && !P.line && !far) { // v3 critique 1: the canopy (see canopyAll)
    const all = canopyFor(i, band), ch = all.filter((q) => charredOK && q.d < q.lastD * 0.5 && q.v < 0.33), rest = all.filter((q) => !ch.includes(q));
    for (const q of ch) items.push({ y: q.y, sh: () => castShadow(g, q.x, q.y, 4 * U), f: () => charred(g, q.x, q.y, 3.4 * SS, PX) });
    const art = artFor('broadleaf'), artC = artFor('conifer');
    for (const crowns of canopyClumps(i, band, rest)) {
      if (blossom) crowns.forEach((q) => (q.blossom = q.seed % 100 < 35)); else crowns.forEach((q) => (q.blossom = false));
      const xs = crowns.map((q) => q.x), w = Math.max(...xs) - Math.min(...xs) + 2 * crowns[0].r, by = Math.max(...crowns.map((q) => q.y));
      items.push({ y: by, clump: crowns.length, sh: () => castShadow(g, (Math.max(...xs) + Math.min(...xs)) / 2, by, w), f: () => { const conMost = crowns.filter((q) => q.conifer).length * 2 > crowns.length, a = conMost ? artC ?? art : art ?? artC; if (a) drawArtFrame(g, a, (Math.max(...xs) + Math.min(...xs)) / 2, by, w * 1.15, crowns[0].seed); else drawClump(g, crowns, P); for (const q of crowns) if (q.blossom) { g.fillStyle = '#EAD2DA'; for (let m = 0; m < 3; m++) { const a2 = m * 2.1 + q.ph; ellipse(g, q.x + Math.cos(a2) * q.r * 0.45, q.y - 0.95 * q.r + Math.sin(a2) * q.r * 0.4, q.r * 0.16, q.r * 0.16); g.fill(); } } } });
    }
  } else for (const s of stampSlots) {
    const it = stampItemP(g, i, p, s, band, P, { conRate, blossom: blossom && s.v < 0.35, great: shown && look === 'green' && lvl >= 3 && s.v > 0.85 });
    if (it) items.push(it);
  }
  const scaled = (s, k2, fn) => { g.save(); g.translate(s.x, s.y); g.scale(k2, k2); try { fn({ ...s, x: 0, y: 0 }, PX / k2); } finally { g.restore(); } };
  L.motifSlots.forEach((s, j) => items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => motifFor(g, look, lvl, q, j, px2, R)) }));
  L.poleSlots.forEach(({ s, pole }, j) => items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => poleFor(g, pole, q, j, px2, { ...P, lw: px2, PX: px2 })) }));
  if (shown && look && lvl === 3 && free.length) { const s = free[Math.min(free.length - 1, L.motifSlots.length)]; items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => (look === 'red' ? burningCairn(g, q.x, q.y, px2) : tree(g, q.x, q.y, 9, { ...P, lw: px2 }, { blossom: true, shade: '#2F4A26', lit: '#5E7F45' }))) }); }
  if (shown && look === 'red' && lvl >= 3) { const Rr = rngFor(`map:11:${i}:cracks`); for (let n = 0; n < 3; n++) { const s = free[Math.floor(Rr() * free.length)]; if (s) items.push({ y: s.y - 1, f: () => emberCrack(g, s.x, s.y, 9, Rr, PX) }); } }
  if (!unexp && p.scar === 'cairns' && !far) { const s0 = free[Math.floor(free.length / 2)] ?? G.slots[0]; for (let n = 0; n < 3; n++) items.push({ y: s0.y + n, f: () => cairn(g, s0.x - 12 + n * 11, s0.y + n * 2, 1.4, PX, false) }); }
  if (!unexp && p.scar === 'churned' && !far) { const s0 = free[Math.floor(free.length / 2)] ?? G.slots[0]; items.push({ y: s0.y, f: () => { g.strokeStyle = '#5E4630'; g.lineWidth = PX * 1.2; for (const [dx, a] of [[-6, 0.6], [4, -0.8], [9, 0.3]]) { g.beginPath(); g.moveTo(s0.x + dx, s0.y); g.lineTo(s0.x + dx + Math.cos(a) * 7, s0.y - Math.abs(Math.sin(a)) * 7); g.stroke(); } g.fillStyle = '#1C1A17'; for (const [dx, dy] of [[-2, -10], [6, -13], [12, -8]]) { g.beginPath(); g.moveTo(s0.x + dx - 1.6, s0.y + dy); g.lineTo(s0.x + dx, s0.y + dy - 0.8); g.lineTo(s0.x + dx + 1.6, s0.y + dy); g.lineTo(s0.x + dx, s0.y + dy + 0.4); g.closePath(); g.fill(); } } }); }
  if (p.terrain === 'mountains' && !unexp && view.footpath) items.push({ y: -1e9, f: () => footpath(g, i, PX) });
  // landmarks (terrain-coded), ruins (history), the hero set piece (Far, Mid, Near)
  const lm = (o, hero) => items.push({ y: o.y, sh: P.line ? null : () => castShadow(g, o.x, o.y, o.w * 0.8), f: () => drawLandmark(g, o.kind, o.x, o.y, PX, P, P.line, o.mirror, hero, hero ? o.scale : null) });
  if (!far && LM.always) lm(LM.always, false);
  if (!far && LM.ruin) lm(LM.ruin, false);
  if (HERO) lm(HERO, true);
  // independent camps (Near; the public strength word, so line art in fog too)
  if (band === 'near' && p.owner === null) {
    const n = TENTS[strengthWord(p.indep)], se = settleExtent(i);
    for (let k = 0; k < n; k++) { const x = G.seat[0] + 0.9 * se + k * 7 * U, y = G.seat[1] + 4 * U; items.push({ y, sh: P.line ? null : () => castShadow(g, x, y, 5 * U), f: () => campTent(g, x, y, PX, P.line) }); }
  }
  // mana spring stones (Near; never in unexplored provinces)
  if (band === 'near' && !unexp) p.springs.forEach((c, k) => { const se = settleExtent(i), x = G.seat[0] - (0.9 * se + k * 10 * U), y = G.seat[1] + 6 * U; items.push({ y, f: () => springStone(g, x, y, c, PX) }); });
  // vignettes (Near only)
  if (band === 'near' && !unexp && VG && !reduced) items.push({ y: VG.y, f: () => vignette(g, VG.kind, VG.x, VG.y, PX, rngFor('vig:' + VG.seed)) });
  if (opt.stats) { const n = items.length + (HERO ? 2 : 0); Object.assign(opt.stats, { items: n, clumps: items.filter((q) => q.clump).length, crowns: items.reduce((a, q) => a + (q.clump ?? 0), 0), ranges: items.filter((q) => q.range).length, rangeParts: items.reduce((a, q) => a + (q.range ?? 0), 0) }); }
  if (st && !IO) settlementItemsP(g, i, st, band, items, PX, look, lvl);
  if (unexp && !IO) items.push({ y: G.seat[1], f: () => hutOutline(g, G.seat[0], G.seat[1], PX, lineCol) });
  items.sort((a, b) => a.y - b.y);
  if (!IO) for (const it of items) if (it.sh) it.sh();
  for (const it of items) it.f();
}
function stampItemP(g, i, p, s, band, P, o) {
  const R = rngFor(`stamp:${p.i}:${s.x | 0}:${s.y | 0}`), far = band === 'far', sc = far ? 1.8 : 1;
  const viaV2 = (w) => ({ y: s.y, sh: P.line ? null : () => castShadow(g, s.x, s.y, w), f: () => stampFor(g, p, s, band, P, o) });
  switch (p.terrain) {
    case 'forest': { // Far: canopy masses of six crowns at r 15 u; fog line art
      const crowns = makeClump(s.x, s.y, far ? 6 : 3, R, o.conRate, far ? [13, 16] : [4, 5.5]);
      return { y: s.y, sh: P.line ? null : () => castShadow(g, s.x, s.y, far ? 40 * U : 12 * U), f: () => drawClump(g, crowns, P) };
    }
    case 'hills': { // v3 critique 4 and 5: a range of 2 to 4 humps; no cast shadow (hills are ground forms; the hachures carry the shade)
      const hr = hillsRange(i, s, far), art = artFor('relief'); return { y: hr.box[3], range: hr.list.length, f: () => hillRange(g, hr.list, P, hr.R, art && art.hills) };
    }
    case 'mountains': { // v3 critique 4: a range of 3 to 5 passable peaks (each 0.75 of its base tall, Chaikin-rounded)
      const m = mountainRange(i, s, far), art = artFor('relief');
      if (art && art.peaks && !P.line) return { y: m.box[3], range: m.list.length, f: () => { for (const q of m.list) drawArtFrame(g, art.peaks, q.x, q.y, q.w * 1.1, (q.x * 7 + q.y * 13) | 0); } };
      const cols = { lit: '#B4C1C6', shade: '#6E7F86', ink: INK, lw: P.lw };
      return { y: m.box[3], range: m.list.length, sh: P.line ? null : () => { g.fillStyle = SHADOW; g.beginPath(); for (const q of m.list) { const w2 = q.w * 0.8; g.moveTo(q.x + 0.25 * w2 + 0.6 * w2, q.y + 0.4 * U); g.ellipse(q.x + 0.25 * w2, q.y + 0.4 * U, 0.6 * w2, 0.22 * w2, -10 * Math.PI / 180, 0, Math.PI * 2); } g.fill(); }, f: () => { for (const q of m.geoms) peakPaint(g, q, cols, P, P.line); } };
    }
    case 'farmland': {
      if (far) return viaV2(0);
      const n = 2 + (R() < 0.5 ? 1 : 0), ang = [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(rngFor(`furrow:${i}`)() * 4)];
      return { y: s.y, sh: P.line ? null : () => castShadow(g, s.x, s.y, n * 3.2 * U), f: () => sheafRow(g, s.x, s.y, P, n, ang, P.line) };
    }
    case 'plains': {
      if (far) return viaV2(0);
      if (s.v < 0.18) { const c = makeClump(s.x, s.y, 2 + Math.floor(R() * 3), R, 0.1); if (o.blossom) c[0].blossom = true; const by = Math.max(...c.map((q) => q.y)); return { y: by, sh: P.line ? null : () => castShadow(g, s.x, by, 3 * c[0].r), f: () => drawClump(g, c, P) }; } // v3 critique 10: a copse of 2 to 4
      if (s.v > 0.94) return { y: s.y, sh: P.line ? null : () => castShadow(g, s.x, s.y, 2.6 * U), f: () => sheaf(g, s.x, s.y, P, P.line) };
      return viaV2(0);
    }
    case 'wasteland': return { y: s.y, sh: P.line || s.v > 0.65 ? null : () => castShadow(g, s.x, s.y, 5 * U), f: () => stampFor(g, p, s, band, P, { ...o, noSkull: true }) };
    default: return viaV2(0);
  }
}
function settlementItemsP(g, i, st, band, items, PX, look, lvl) {
  const p = prov[i], kit = st.kit;
  if (band === 'far') { // a capital reads as a city from the table's edge: the keep, three roofs of its kit and the pennant
    if (p.cap) { for (const h of st.houses.slice(0, 3)) items.push({ y: h.y, sh: () => castShadow(g, h.x, h.y, 7 * HSC), f: () => house(g, h, kit, PX, {}) }); items.push({ y: st.sy + 0.5, f: () => landmark(g, 'keep', kit, st.sx, st.sy, PX) }); if (p.owner) items.push({ y: 1e9, f: () => pennant(g, st.sx, st.sy - 17 * LS, BAN[p.owner], PX) }); }
    else if (st.tier >= 2) items.push({ y: st.sy, sh: () => castShadow(g, st.sx, st.sy, 14 * HSC), f: () => { for (const h of st.houses.slice(0, 3)) house(g, h, kit, PX, {}); } });
    return;
  }
  const before = items.length; settlementItems(g, i, st, band, items, PX, look, lvl);
  for (let k = before; k < items.length; k++) { const it = items[k]; if (it.house) it.sh = () => castShadow(g, it.house.x, it.house.y, 7 * HSC); }
}
function drawStateOverlay(g, band) { // live (H10): haze, the out-of-sight grey and the land-look wash; a pending paint bake shows its live fill
  if (!PAINTED() || state.mode !== 'ownership' || decoAlpha < 0.001) return;
  g.globalAlpha = decoAlpha;
  for (const p of provs) {
    const G = geo(p.i); if (G.bb[2] < VW[0] || G.bb[0] > VW[2] || G.bb[3] < VW[1] || G.bb[1] > VW[3]) continue;
    const f = TERRAIN[p.terrain].fill, fog = fogOf(p.i), sp = SPR.get(band + ':' + p.i) ?? null, pend = sp && sp.key.split('|')[0] !== KEYS[p.i].split('|')[0];
    let col = null;
    if (pend) col = ownFill(p);
    else if (fog === 'unexplored') col = 'rgba(232,220,194,.04)';
    else if (fog === 'outofsight') col = rgba(greyEqL(f), 0.1);
    else if (p.dom.n) col = rgba(p.dom.n === 'red' ? '#8F8C88' : '#5E7F45', ((p.dom.n === 'red' ? 0.1 : 0.06) * p.dom.s) / 10);
    if (!col) continue; pathPoly(g, npolyLite(p.i)); g.fillStyle = col; g.fill();
  }
  g.globalAlpha = 1;
}
const GREYMEMO = new Map();
function greyEqL(f) { let v = GREYMEMO.get(f); if (!v) { const L = rgb2lab(hex2rgb(f))[0]; v = rgb2hex(lab2rgb([L, 0, 0])); GREYMEMO.set(f, v); } return v; }
function ownFill(p) { // v2's Ownership fill: haze, the out-of-sight desaturation or the land-look mix
  const fog = fogOf(p.i), f = TERRAIN[p.terrain].fill;
  if (fog === 'unexplored') return mix(f, '#E8DCC2', 0.04);
  if (fog === 'outofsight') return desat(f, 0.1);
  if (!p.dom.n) return f;
  return mix(f, p.dom.n === 'red' ? '#8F8C88' : '#5E7F45', ((p.dom.n === 'red' ? 0.1 : 0.06) * p.dom.s) / 10);
}

function rectUnion(rs) { // disjoint rectangles covering the union of rs (slab decomposition), so an even-odd clip can cut them all out
  const ys = [...new Set(rs.flatMap((r) => [r[1], r[3]]))].sort((a, b) => a - b), out = [];
  for (let k = 0; k < ys.length - 1; k++) {
    const y0 = ys[k], y1 = ys[k + 1], iv = rs.filter((r) => r[1] <= y0 && r[3] >= y1).map((r) => [r[0], r[2]]).sort((a, b) => a[0] - b[0]);
    let cur = null; for (const v of iv) { if (cur && v[0] <= cur[1]) cur[1] = Math.max(cur[1], v[1]); else { if (cur) out.push([cur[0], y0, cur[1], y1]); cur = [...v]; } } if (cur) out.push([cur[0], y0, cur[1], y1]);
  }
  return out;
}

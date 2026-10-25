// Relief map bake and per-frame composite.
// CPU bake: provinces (Voronoi of jittered sites in a rounded rectangle, aspect 1.6 like mapgen), terrain weights
// blended across borders, a procedural heightfield (Perlin fBm + ridged), Horn hillshade, depression-filled lakes,
// D8 rivers, cliff skirt where the land ends, tree scatter baked as dense forest masses.
// GPU bake: the same heightfield + hillshade as two fragment passes into RenderTextures.
// Frame: one full-screen pass that adds the owner tint and thin owner borders from an id texture and a border
// distance field, at any zoom. Query: w (bake width, default 2048), gpu=1, trees=1, frame=1, shots=1.
import { PIXI, makeApp, timeFrames, done, qn, rng, stats, memMB } from './harness.js';
import { perlin } from './noise.js';

const MW = qn('w', 2048), MH = Math.round(MW / 1.6), NPX = MW * MH;
const ctx = await makeApp({ width: window.innerWidth, height: window.innerHeight, background: 0x3a2a1c });
const { app, sync } = ctx;
const T = {}; // timings
const tic = (k, t0) => (T[k] = +(performance.now() - t0).toFixed(1));
const R = rng(42);
const SC = MW / 2048; // feature scale relative to the 2048 bake

// painted fills (palette-ab decision, view B) as relief base colors
const TERR = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland'];
const FILL = { plains: 0xd4dcc0, farmland: 0xcea265, forest: 0x243f1b, hills: 0x7d6542, mountains: 0x9fb8d0, swamp: 0x58696e, wasteland: 0x9e8a91 };
const BASE = { plains: 0.12, farmland: 0.1, forest: 0.16, hills: 0.3, mountains: 0.5, swamp: 0.04, wasteland: 0.2 };
const AMP = { plains: 0.05, farmland: 0.035, forest: 0.07, hills: 0.2, mountains: 0.55, swamp: 0.02, wasteland: 0.09 };
const SHARE = { mountains: 0.08, hills: 0.14, swamp: 0.08, forest: 0.22, wasteland: 0.1, farmland: 0.14, plains: 0.24 };

// ---------- 1. provinces ----------
let t0 = performance.now();
const noise = perlin(7), noise2 = perlin(19), noise3 = perlin(23);
const fbm = (x, y, o, n = noise) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * n(x * f, y * f); a *= 0.5; f *= 2.03; } return s; };
const NPROV = qn('prov', 60);
const gx = Math.round(Math.sqrt(NPROV * 1.6)), gy = Math.round(NPROV / gx);
const sites = [];
for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) sites.push({ x: ((i + 0.2 + R() * 0.6) / gx) * MW, y: ((j + 0.2 + R() * 0.6) / gy) * MH });
// terrain by elevation rank of a coarse noise, as mapgen does
const elev = sites.map((s) => fbm(s.x / MW * 2.4, s.y / MH * 1.5, 3));
const order = sites.map((_, i) => i).sort((a, b) => elev[b] - elev[a]);
const terrOf = new Uint8Array(sites.length);
{
  const seq = []; for (const t of ['mountains', 'hills', 'forest', 'wasteland', 'farmland', 'plains', 'swamp']) for (let k = 0; k < Math.round(SHARE[t] * sites.length); k++) seq.push(t);
  order.forEach((si, r) => { terrOf[si] = TERR.indexOf(seq[Math.min(r, seq.length - 1)]); });
}
// land mask: rounded rectangle (corner 0.15 of the short side) with a noisy edge
const inset = 70 * SC, rad = 0.15 * MH;
const landD = (x, y) => { // signed distance to the rounded rectangle, negative inside
  const qx = Math.abs(x - MW / 2) - (MW / 2 - inset - rad), qy = Math.abs(y - MH / 2) - (MH / 2 - inset - rad);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
};
// id raster (borders straight, as the game's convex cells) via a bucket grid
const id = new Uint8Array(NPX), land = new Uint8Array(NPX);
{
  const bw = MW / gx, bh = MH / gy;
  for (let y = 0; y < MH; y++) {
    const by = Math.min(gy - 1, Math.floor(y / bh));
    for (let x = 0; x < MW; x++) {
      const bx = Math.min(gx - 1, Math.floor(x / bw));
      let best = 1e18, bi = 0;
      for (let j = Math.max(0, by - 1); j <= Math.min(gy - 1, by + 1); j++) for (let i = Math.max(0, bx - 2); i <= Math.min(gx - 1, bx + 2); i++) {
        const k = j * gx + i, s = sites[k], d = (s.x - x) ** 2 + (s.y - y) ** 2;
        if (d < best) { best = d; bi = k; }
      }
      const p = y * MW + x; id[p] = bi;
      land[p] = landD(x, y) + noise2(x * 0.012 / SC, y * 0.012 / SC) * 26 * SC + noise2(x * 0.05 / SC, y * 0.05 / SC) * 6 * SC < 0 ? 1 : 0;
    }
  }
}
tic('1_provinceIdRaster', t0);

// ---------- 2. terrain weights blended across borders (warped lookup + box blur at half res) ----------
t0 = performance.now();
const HW = MW >> 1, HH = MH >> 1, HN = HW * HH, NT = TERR.length;
const wHalf = new Float32Array(HN * NT);
for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
  // domain warp so terrain edges wander naturally across the straight province borders
  const wx = x * 2 + (noise3(x * 0.009 / SC, y * 0.009 / SC) * 150 + noise3(x * 0.04 / SC, y * 0.04 / SC) * 30) * SC, wy = y * 2 + (noise3(x * 0.009 / SC + 40, y * 0.009 / SC) * 150 + noise3(x * 0.04 / SC + 9, y * 0.04 / SC) * 30) * SC;
  const sx = Math.max(0, Math.min(MW - 1, wx | 0)), sy = Math.max(0, Math.min(MH - 1, wy | 0));
  wHalf[(y * HW + x) * NT + terrOf[id[sy * MW + sx]]] = 1;
}
const boxBlur = (buf, w, h, ch, r) => { // separable running-sum box blur, all channels, two passes
  const tmp = new Float32Array(buf.length), inv = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) for (let c = 0; c < ch; c++) {
    let acc = 0; for (let k = -r; k <= r; k++) acc += buf[(y * w + Math.min(w - 1, Math.max(0, k))) * ch + c];
    for (let x = 0; x < w; x++) { tmp[(y * w + x) * ch + c] = acc * inv; acc += buf[(y * w + Math.min(w - 1, x + r + 1)) * ch + c] - buf[(y * w + Math.max(0, x - r)) * ch + c]; }
  }
  for (let x = 0; x < w; x++) for (let c = 0; c < ch; c++) {
    let acc = 0; for (let k = -r; k <= r; k++) acc += tmp[(Math.min(h - 1, Math.max(0, k)) * w + x) * ch + c];
    for (let y = 0; y < h; y++) { buf[(y * w + x) * ch + c] = acc * inv; acc += tmp[(Math.min(h - 1, y + r + 1) * w + x) * ch + c] - tmp[(Math.max(0, y - r) * w + x) * ch + c]; }
  }
};
boxBlur(wHalf, HW, HH, NT, Math.round(14 * SC));
boxBlur(wHalf, HW, HH, NT, Math.round(14 * SC)); // twice: close to a Gaussian
tic('2_terrainWeightsHalfRes', t0);

// ---------- 3. heightfield (full res; weights sampled bilinearly from half res) ----------
t0 = performance.now();
const hgt = new Float32Array(NPX), hsh = new Float32Array(NPX), wFull = new Float32Array(NT);
const sampleW = (x, y, out) => {
  const fx = Math.min(HW - 1.001, x / 2), fy = Math.min(HH - 1.001, y / 2), ix = fx | 0, iy = fy | 0, ax = fx - ix, ay = fy - iy;
  const p00 = (iy * HW + ix) * NT, p10 = p00 + NT, p01 = p00 + HW * NT, p11 = p01 + NT;
  for (let c = 0; c < NT; c++) out[c] = (wHalf[p00 + c] * (1 - ax) + wHalf[p10 + c] * ax) * (1 - ay) + (wHalf[p01 + c] * (1 - ax) + wHalf[p11 + c] * ax) * ay;
};
const iM = TERR.indexOf('mountains'), iH = TERR.indexOf('hills');
let ridgedPx = 0;
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const p = y * MW + x;
  sampleW(x, y, wFull);
  let base = 0, amp = 0;
  for (let c = 0; c < NT; c++) { base += wFull[c] * BASE[TERR[c]]; amp += wFull[c] * AMP[TERR[c]]; }
  const u = x / (220 * SC), v = y / (220 * SC);
  let h = base + amp * fbm(u, v, 6) + 0.03 * noise3(u * 0.25 + 5, v * 0.25);
  const rr = wFull[iM] + 0.45 * wFull[iH];
  if (rr > 0.02) { // ridged multifractal for ranges
    let s = 0, a = 0.5, f = 1.4, prev = 1;
    for (let o = 0; o < 6; o++) { let n = 1 - Math.abs(noise2(u * f + 11, v * f - 7)); n *= n * prev; prev = n; s += a * n; a *= 0.5; f *= 2.1; }
    h += rr * rr * 0.9 * (s - 0.35);
    ridgedPx++;
  }
  hgt[p] = h; hsh[p] = h - 0.7 * base; // shade the relief, not the plateau each terrain sits on
}
tic('3_heightfield', t0);

// ---------- 4. hillshade (Horn) ----------
t0 = performance.now();
const shade = new Float32Array(NPX);
{
  const z = 520 * SC / 2048 * 2048 / MW * MW / 2048; // vertical exaggeration in px per height unit at this bake size
  const zf = qn('zf', 170); // exaggeration
  const az = (315 * Math.PI) / 180, alt = (40 * Math.PI) / 180;
  const lx = Math.cos(alt) * Math.cos(az), ly = -Math.cos(alt) * Math.sin(az), lz = Math.sin(alt);
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    const p = y * MW + x;
    const a = hsh[p - MW - 1], b = hsh[p - MW], c = hsh[p - MW + 1], d = hsh[p - 1], f = hsh[p + 1], g = hsh[p + MW - 1], hh = hsh[p + MW], i = hsh[p + MW + 1];
    const dx = ((c + 2 * f + i) - (a + 2 * d + g)) / 8 * zf * (2048 / MW), dy = ((g + 2 * hh + i) - (a + 2 * b + c)) / 8 * zf * (2048 / MW);
    const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
    shade[p] = Math.max(0, (-dx * lx - dy * ly + lz) * inv);
  }
  void z;
}
tic('4_hillshade', t0);

// ---------- 5. lakes and rivers on a quarter-res grid (priority flood, D8, accumulation) ----------
t0 = performance.now();
const QW = MW >> 2, QH = MH >> 2, QN = QW * QH;
const qh = new Float32Array(QN), qland = new Uint8Array(QN);
for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) { const p = (y * 4 + 2) * MW + x * 4 + 2; qh[y * QW + x] = hgt[p]; qland[y * QW + x] = land[p]; }
boxBlur(qh, QW, QH, 1, 2);
const qr = new Float32Array(QN); for (let i = 0; i < QN; i++) qr[i] = qh[i] + 0.012 * noise3((i % QW) * 0.08, ((i / QW) | 0) * 0.08);
const filled = new Float32Array(QN).fill(Infinity), done_ = new Uint8Array(QN), down = new Int32Array(QN).fill(-1);
// binary heap keyed by height
const heap = new Int32Array(QN * 2); let hs = 0;
const key = filled;
const push = (i) => { let k = hs++; heap[k] = i; while (k > 0) { const pr = (k - 1) >> 1; if (key[heap[pr]] <= key[heap[k]]) break; [heap[pr], heap[k]] = [heap[k], heap[pr]]; k = pr; } };
const pop = () => { const top = heap[0]; heap[0] = heap[--hs]; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hs && key[heap[l]] < key[heap[m]]) m = l; if (r < hs && key[heap[r]] < key[heap[m]]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } return top; };
for (let i = 0; i < QN; i++) { // seeds: land cells next to the void (water leaves the model over the cliff)
  if (!qland[i]) continue; const x = i % QW, y = (i / QW) | 0;
  if (x === 0 || y === 0 || x === QW - 1 || y === QH - 1 || !qland[i - 1] || !qland[i + 1] || !qland[i - QW] || !qland[i + QW]) { filled[i] = qr[i]; done_[i] = 1; push(i); }
}
const NB = [-1, 1, -QW, QW, -QW - 1, -QW + 1, QW - 1, QW + 1];
const orderQ = new Int32Array(QN); let on = 0;
while (hs) {
  const c = pop(); orderQ[on++] = c; const cx = c % QW;
  for (const o of NB) {
    const n = c + o; if (n < 0 || n >= QN || done_[n] || !qland[n]) continue; const nx = n % QW; if (Math.abs(nx - cx) > 1) continue;
    done_[n] = 1; filled[n] = Math.max(qr[n], filled[c] + 1e-5); down[n] = c; push(n);
  }
}
const acc = new Float32Array(QN).fill(1);
for (let k = on - 1; k >= 0; k--) { const c = orderQ[k]; if (down[c] >= 0) acc[down[c]] += acc[c]; }
let lakeCells = 0, riverCells = 0, lakes = 0; const RIV = qn('riv', 900), LAKE_D = 0.02, LAKE_MIN = 60;
const lake = new Uint8Array(QN);
const lakeDepth = new Float32Array(QN);
{ // keep depressions deeper than LAKE_D whose connected area is at least LAKE_MIN cells
  const seen = new Uint8Array(QN), stack = [], region = [];
  for (let i = 0; i < QN; i++) {
    if (seen[i] || !qland[i] || filled[i] - qr[i] <= LAKE_D * 0.5) continue;
    stack.push(i); seen[i] = 1; region.length = 0; let deep = 0;
    while (stack.length) { const c = stack.pop(); region.push(c); if (filled[c] - qr[c] > LAKE_D) deep++;
      for (const o of [-1, 1, -QW, QW]) { const n = c + o; if (n >= 0 && n < QN && !seen[n] && qland[n] && filled[n] - qr[n] > LAKE_D * 0.5 && Math.abs((n % QW) - (c % QW)) <= 1) { seen[n] = 1; stack.push(n); } } }
    if (deep >= LAKE_MIN) { lakes++; for (const c of region) { lake[c] = 1; lakeDepth[c] = filled[c] - qr[c]; lakeCells++; } }
  }
}
for (let i = 0; i < QN; i++) if (acc[i] > RIV) riverCells++;
tic('5_lakesRivers', t0);

// ---------- 6. composite colors, water, cliff skirt ----------
t0 = performance.now();
const rgba = new Uint8ClampedArray(NPX * 4);
const COL = TERR.map((t) => [(FILL[t] >> 16) & 255, (FILL[t] >> 8) & 255, FILL[t] & 255]);
const iF = TERR.indexOf('forest'), iFarm = TERR.indexOf('farmland');
const forestW = new Float32Array(NPX), SHADE_AMP = qn('shadeAmp', -1), FAITHFUL = qn('faithful', 0);
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const p = y * MW + x; if (!land[p]) continue;
  sampleW(x, y, wFull);
  let r = 0, g = 0, b = 0;
  for (let c = 0; c < NT; c++) { const w = wFull[c]; if (w < 0.004) continue; r += w * COL[c][0]; g += w * COL[c][1]; b += w * COL[c][2]; }
  forestW[p] = wFull[iF];
  // forest ground is lighter than the canopy that will sit on it; farmland gets field strips
  const grain = noise3(x * 0.15 / SC, y * 0.15 / SC) * 10;
  let fieldK = 0; if (!FAITHFUL && wFull[iFarm] > 0.2) { const th = id[p] * 1.7, cu = x * Math.cos(th) + y * Math.sin(th), cv2 = -x * Math.sin(th) + y * Math.cos(th); const par = noise(Math.floor(cu / (26 * SC)) * 0.9 + 0.5, Math.floor(cv2 / (60 * SC)) * 0.9 + 0.5); const row = 0.5 + 0.5 * Math.sin(cu * 1.3 / SC); fieldK = wFull[iFarm] * (par * 30 + row * 6 - 3); }
  if (!FAITHFUL && wFull[iF] > 0.05) { r += wFull[iF] * 30; g += wFull[iF] * 34; b += wFull[iF] * 14; }
  const rockK = Math.min(1, wFull[iM] * 1.4 + wFull[iH] * 0.4);
  if (!FAITHFUL && rockK > 0.05) { const hh = hgt[p]; const snow = Math.max(0, Math.min(1, (hh - 0.95) * 4)) * wFull[iM];
    r = r * (1 - rockK * 0.45) + 112 * rockK * 0.45; g = g * (1 - rockK * 0.45) + 104 * rockK * 0.45; b = b * (1 - rockK * 0.45) + 98 * rockK * 0.45;
    r += (238 - r) * snow; g += (242 - g) * snow; b += (246 - b) * snow; }
  // relief light. shadeAmp >= 0: lightness-neutral on flat ground (k = 1), slopes go lighter or darker by the amplitude
  const s = shade[p], k = SHADE_AMP < 0 ? 0.3 + 0.95 * s : 1 + SHADE_AMP * 1.4 * (s - 0.643);
  const hz = SHADE_AMP < 0 ? Math.min(1, Math.max(0, hgt[p] * 0.25 + 0.85)) : 1; // slight lift with height
  rgba[p * 4] = (r + grain + fieldK) * k * hz; rgba[p * 4 + 1] = (g + grain + fieldK * 0.8) * k * hz; rgba[p * 4 + 2] = (b + grain * 0.7) * k * hz; rgba[p * 4 + 3] = 255;
}
// lakes from the flood (bilinear-ish: nearest quarter cell with a soft shore)
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const p = y * MW + x; if (!land[p]) continue; const q = (y >> 2) * QW + (x >> 2);
  // bilinear lake depth gives a smooth shoreline instead of quarter-res blocks
  const fx = Math.min(QW - 1.001, x / 4 - 0.5 < 0 ? 0 : x / 4 - 0.5), fy = Math.min(QH - 1.001, y / 4 - 0.5 < 0 ? 0 : y / 4 - 0.5), ix = fx | 0, iy = fy | 0, ax = fx - ix, ay = fy - iy, q0 = iy * QW + ix;
  if (!(lake[q0] | lake[q0 + 1] | lake[q0 + QW] | lake[q0 + QW + 1])) continue;
  const dd = (lakeDepth[q0] * (1 - ax) + lakeDepth[q0 + 1] * ax) * (1 - ay) + (lakeDepth[q0 + QW] * (1 - ax) + lakeDepth[q0 + QW + 1] * ax) * ay;
  if (dd > LAKE_D * 0.6) { const d = Math.min(1, (dd - LAKE_D * 0.6) * 25); const sh = 0.85 + 0.15 * shade[p];
    rgba[p * 4] = (70 - d * 26) * sh; rgba[p * 4 + 1] = (104 - d * 30) * sh; rgba[p * 4 + 2] = (112 - d * 22) * sh; }
  else if (dd > LAKE_D * 0.4) { rgba[p * 4] *= 0.8; rgba[p * 4 + 1] *= 0.82; rgba[p * 4 + 2] *= 0.8; } // wet shore
}
// cliff skirt: void below the land shows a rock face whose depth wanders along the edge
let cliffPx = 0;
for (let x = 0; x < MW; x++) {
  let lastLand = -1e9, edgeH = 0;
  for (let y = 0; y < MH; y++) {
    const p = y * MW + x;
    if (land[p]) { lastLand = y; edgeH = hgt[p]; continue; }
    const D = (34 + 22 * noise2(x * 0.01 / SC, 3.3) + 40 * Math.max(0, edgeH)) * SC, dy = y - lastLand;
    if (dy > 0 && dy < D) {
      const t = dy / D, strata = 0.5 + 0.5 * Math.sin(y * 0.55 / SC + noise3(x * 0.04 / SC, y * 0.02 / SC) * 4), streak = noise(x * 0.35 / SC, y * 0.04 / SC);
      const v = (0.95 - 0.55 * t) * (0.8 + 0.12 * strata + 0.1 * streak);
      rgba[p * 4] = 92 * v; rgba[p * 4 + 1] = 84 * v; rgba[p * 4 + 2] = 80 * v; rgba[p * 4 + 3] = 255; cliffPx++;
    } else if (dy >= D && dy < D + 16 * SC) { rgba[p * 4 + 3] = 90 * (1 - (dy - D) / (16 * SC)); } // contact shadow on the table
  }
}
tic('6_composite_cliffs', t0);

// rivers: stroke the accumulation network with canvas 2D (anti-aliased), widths by sqrt(flow)
t0 = performance.now();
const cv = document.createElement('canvas'); cv.width = MW; cv.height = MH;
const c2 = cv.getContext('2d');
c2.putImageData(new ImageData(rgba, MW, MH), 0, 0);
c2.lineCap = 'round'; c2.lineJoin = 'round'; c2.strokeStyle = 'rgb(62,100,112)';
let segs = 0;
const outlets = [];
{ // a source is a river cell with no river cell flowing into it; follow it down, drawing a smoothed polyline per width band
  const inflow = new Uint8Array(QN);
  for (let i = 0; i < QN; i++) if (acc[i] >= RIV && down[i] >= 0) inflow[down[i]] = 1;
  const drawn = new Uint8Array(QN);
  for (let i = 0; i < QN; i++) {
    if (acc[i] < RIV || inflow[i]) continue;
    let c = i; const pts = [];
    while (c >= 0) { if (lake[c]) { if (pts.length > 1) break; c = down[c]; continue; } pts.push([(c % QW) * 4 + 2 + noise3(c * 0.37, 1) * 1.5, ((c / QW) | 0) * 4 + 2 + noise3(c * 0.37, 2) * 1.5, acc[c]]); if (drawn[c]) break; drawn[c] = 1; if (down[c] < 0) { outlets.push(pts[pts.length - 1]); break; } c = down[c]; }
    // Chaikin smoothing, then stroke in short runs so the width can grow downstream
    let P = pts; for (let it = 0; it < 3; it++) { const Q = [P[0]]; for (let k = 0; k < P.length - 1; k++) { const a = P[k], b = P[k + 1]; Q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25, a[2]], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75, b[2]]); } Q.push(P[P.length - 1]); P = Q; }
    for (let k = 0; k < P.length - 1; k += 4) {
      c2.lineWidth = Math.min(8, 1.0 + Math.sqrt(P[k][2] / RIV) * 1.0) * SC * 1.3;
      c2.beginPath(); c2.moveTo(P[k][0], P[k][1]); for (let m = k + 1; m <= Math.min(P.length - 1, k + 4); m++) c2.lineTo(P[m][0], P[m][1]); c2.stroke(); segs++;
    }
  }
}
// waterfalls: where a river leaves the model, a pale streak down the cliff skirt
for (const [ox, oy, a] of outlets) { if (a < RIV * 2) continue; const w = Math.min(7, 1 + Math.sqrt(a / RIV)) * SC; const gr = c2.createLinearGradient(0, oy, 0, oy + 70 * SC); gr.addColorStop(0, 'rgba(150,185,195,0.95)'); gr.addColorStop(1, 'rgba(220,235,240,0)'); c2.fillStyle = gr; c2.fillRect(ox - w / 2, oy, w, 70 * SC); }
tic('7_rivers_canvas', t0);

// ---------- 7. upload ----------
t0 = performance.now();
const baseTex = PIXI.Texture.from(cv);
if (qn('export', 0)) {
  window.__shots = window.__shots || [];
  window.__shots.push({ name: 'bake-base', url: cv.toDataURL('image/png') });
  const tc = document.createElement('canvas'); tc.width = MW; tc.height = MH; const tx = tc.getContext('2d'); const ti = tx.createImageData(MW, MH);
  for (let p = 0; p < NPX; p++) { const q = ((p / MW | 0) >> 2) * QW + ((p % MW) >> 2); const v = land[p] ? (lake[q] ? 200 : 10 + terrOf[id[p]] * 20) : 255; ti.data[p * 4] = v; ti.data[p * 4 + 1] = id[p]; ti.data[p * 4 + 2] = 0; ti.data[p * 4 + 3] = 255; }
  tx.putImageData(ti, 0, 0); window.__shots.push({ name: 'bake-terrain-index', url: tc.toDataURL('image/png') });
}
const tinyRT = PIXI.RenderTexture.create({ width: 4, height: 4 });
{ const sp = new PIXI.Sprite(baseTex); sp.scale.set(4 / MW); app.renderer.render({ container: sp, target: tinyRT }); sync(); } // forces the texImage2D upload, almost no fill
tic('8_upload', t0);
{ const u0 = performance.now(); const src = new PIXI.BufferImageSource({ resource: new Uint8Array(rgba.buffer), width: MW, height: MH, format: 'rgba8unorm' }); const sp = new PIXI.Sprite(new PIXI.Texture({ source: src })); sp.scale.set(4 / MW); app.renderer.render({ container: sp, target: tinyRT }); sync(); T['8b_uploadFromTypedArray'] = +(performance.now() - u0).toFixed(1); }

const out = { bake: [MW, MH], provinces: sites.length, timings: T, ridgedSharePct: +(ridgedPx / NPX * 100).toFixed(1), lakes, lakeCells, riverCells, riverSegments: segs, outlets: outlets.length, cliffPx, heapMB: memMB() };
out.cpuBakeTotalMs = +Object.values(T).reduce((a, b) => a + b, 0).toFixed(1);

// ---------- trees: jittered-grid scatter on forest weight, baked into the map ----------
const shots = window.__shots || [];
window.__shots = shots;
let mapRT = null;
if (qn('trees', 1)) {
  t0 = performance.now();
  const treeRT = PIXI.RenderTexture.create({ width: 64, height: 32 });
  {
    const g = new PIXI.Graphics();
    // broadleaf (0..15), conifer (16..31): shadow to the lower right, lit from the upper left
    g.ellipse(9, 11, 6, 3).fill({ color: 0, alpha: 0.35 }); g.circle(7, 8, 5.5).fill(0x1d3a17); g.circle(6, 7, 3.6).fill(0x2f5524); g.circle(5, 5.6, 1.8).fill(0x4a7034);
    g.ellipse(25, 12, 5, 2.4).fill({ color: 0, alpha: 0.35 }); g.poly([22, 1, 28, 12, 16, 12]).fill(0x16301a); g.poly([22, 1, 22, 12, 16, 12]).fill(0x24452a);
    app.renderer.render({ container: g, target: treeRT });
  }
  const TT = [0, 1].map((k) => { const t = new PIXI.Texture({ source: treeRT.source, frame: new PIXI.Rectangle(k * 16, 0, 16, 16) }); t.defaultAnchor = { x: 0.45, y: 0.75 }; return t; });
  const SP = qn('treeSpacing', 4.2) * SC, trees = [];
  const R2 = rng(5);
  for (let y = SP / 2; y < MH; y += SP) for (let x = SP / 2; x < MW; x += SP) {
    const px = x + (R2() - 0.5) * SP * 0.9, py = y + (R2() - 0.5) * SP * 0.9;
    const p = (py | 0) * MW + (px | 0); if (!land[p]) continue;
    const q = ((py | 0) >> 2) * QW + ((px | 0) >> 2); if (lake[q] || acc[q] >= RIV) continue;
    const fw = forestW[p] + 0.25 * (noise(px * 0.02, py * 0.02) - 0.1);
    const clearing = noise2(px * 0.03 / SC + 3, py * 0.03 / SC) < -0.28;
    const keep = fw > 0.42 ? (clearing ? 0.08 : 1) : fw > 0.25 ? 0.3 : 0.003; // dense masses with clearings, ragged edges, a few lone trees
    if (R2() < keep) trees.push({ x: px, y: py, k: hgt[p] > 0.45 || R2() < 0.25 ? 1 : 0, s: 0.75 + R2() * 0.5 });
  }
  trees.sort((a, b) => a.y - b.y);
  tic('9_treeScatter', t0);
  out.trees = trees.length;
  // bake: base sprite + trees into one map RenderTexture
  t0 = performance.now();
  mapRT = PIXI.RenderTexture.create({ width: MW, height: MH });
  const bakeRoot = new PIXI.Container();
  bakeRoot.addChild(new PIXI.Sprite(baseTex));
  const pc = new PIXI.ParticleContainer({ texture: new PIXI.Texture({ source: treeRT.source }) });
  for (const t of trees) pc.addParticle(new PIXI.Particle({ texture: TT[t.k], x: t.x, y: t.y, scaleX: t.s * SC * 0.9, scaleY: t.s * SC * 0.9, anchorX: 0.45, anchorY: 0.75 }));
  bakeRoot.addChild(pc);
  app.renderer.render({ container: bakeRoot, target: mapRT }); sync();
  tic('10_treeBake', t0);
  // live trees: every tree each frame vs only the chunks in view at 3x zoom
  const live = new PIXI.Container(); live.addChild(new PIXI.Sprite(mapRT)); live.addChild(pc); app.stage.addChild(live);
  live.scale.set(window.innerWidth / MW);
  out.frameLiveAllTrees = timeFrames(ctx, () => {}, 60, 10);
  app.stage.removeChild(live);
}

// ---------- GPU bake: heightfield + hillshade in two fragment passes ----------
if (qn('gpu', 1)) {
  const VERT = `in vec2 aPosition; in vec2 aUV; out vec2 vUV;
uniform mat3 uProjectionMatrix; uniform mat3 uWorldTransformMatrix; uniform mat3 uTransformMatrix;
void main(){ mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix; gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0); vUV = aUV; }`;
  const NOISE = `
vec2 hash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }
float pnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
 return mix(mix(dot(hash2(i), f), dot(hash2(i+vec2(1,0)), f-vec2(1,0)), u.x), mix(dot(hash2(i+vec2(0,1)), f-vec2(0,1)), dot(hash2(i+vec2(1,1)), f-vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<6;i++){ s+=a*pnoise(p); p*=2.03; a*=0.5; } return s; }
float ridged(vec2 p){ float s=0.0,a=0.5,prev=1.0; p*=1.4; for(int i=0;i<6;i++){ float n=1.0-abs(pnoise(p+vec2(11.0,-7.0))); n*=n*prev; prev=n; s+=a*n; p*=2.1; a*=0.5; } return s; }`;
  const FRAG_H = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D uW; uniform vec2 uSize;
${NOISE}
vec4 bilin(sampler2D t, vec2 uv){ vec2 sz = vec2(textureSize(t, 0)); vec2 f = uv * sz - 0.5; ivec2 i = ivec2(floor(f)); vec2 a = fract(f); ivec2 m = ivec2(sz) - 1;
 vec4 p00 = texelFetch(t, clamp(i, ivec2(0), m), 0), p10 = texelFetch(t, clamp(i + ivec2(1, 0), ivec2(0), m), 0), p01 = texelFetch(t, clamp(i + ivec2(0, 1), ivec2(0), m), 0), p11 = texelFetch(t, clamp(i + ivec2(1, 1), ivec2(0), m), 0);
 return mix(mix(p00, p10, a.x), mix(p01, p11, a.x), a.y); }
void main(){ vec4 w = bilin(uW, vUV); // r = mountains, g = hills, b = base height, a = amplitude (float, half res, bilinear by hand: float linear filtering is optional on phones)
 vec2 p = vUV * uSize / 220.0; float h = w.b + w.a * fbm(p); float rr = w.r + 0.45 * w.g; if (rr > 0.02) h += rr*rr*0.9*(ridged(p)-0.35);
 float e = clamp(h * 0.5 + 0.25, 0.0, 1.0) * 65535.0; o = vec4(floor(e / 256.0) / 255.0, mod(e, 256.0) / 255.0, 0.0, 1.0); }`;
  const FRAG_S = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D uH; uniform vec2 uTexel;
float H(vec2 uv){ vec4 t = texture(uH, uv); return ((t.r * 255.0 * 256.0 + t.g * 255.0) / 65535.0 - 0.25) * 2.0; }
void main(){ float a=H(vUV+uTexel*vec2(-1,-1)), b=H(vUV+uTexel*vec2(0,-1)), c=H(vUV+uTexel*vec2(1,-1)), d=H(vUV+uTexel*vec2(-1,0)), f=H(vUV+uTexel*vec2(1,0)), g=H(vUV+uTexel*vec2(-1,1)), h=H(vUV+uTexel*vec2(0,1)), i=H(vUV+uTexel*vec2(1,1));
 float dx=((c+2.0*f+i)-(a+2.0*d+g))/8.0*60.0, dy=((g+2.0*h+i)-(a+2.0*b+c))/8.0*60.0; vec3 L=normalize(vec3(0.54,0.54,0.64)); vec3 n=normalize(vec3(-dx,-dy,1.0));
 float s=max(0.0,dot(n,vec3(L.x,-L.y,L.z))); o=vec4(vec3(s),1.0); }`;
  // pack the half-res weights the shader needs (mountains, hills, base, amp) into an RGBA8 texture
  const tP = performance.now();
  const pack = new Float32Array(HN * 4);
  for (let i = 0; i < HN; i++) {
    let base = 0, amp = 0; for (let c = 0; c < NT; c++) { base += wHalf[i * NT + c] * BASE[TERR[c]]; amp += wHalf[i * NT + c] * AMP[TERR[c]]; }
    pack[i * 4] = wHalf[i * NT + iM]; pack[i * 4 + 1] = wHalf[i * NT + iH]; pack[i * 4 + 2] = base; pack[i * 4 + 3] = amp;
  }
  const wTex = new PIXI.Texture({ source: new PIXI.BufferImageSource({ resource: pack, width: HW, height: HH, format: 'rgba32float', scaleMode: 'nearest', alphaMode: 'no-premultiply-alpha' }) });
  const packMs = performance.now() - tP;
  const quad = (shader) => new PIXI.Mesh({ geometry: new PIXI.MeshGeometry({ positions: new Float32Array([0, 0, MW, 0, MW, MH, 0, MH]), uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), indices: new Uint32Array([0, 1, 2, 0, 2, 3]) }), shader });
  const hRT = PIXI.RenderTexture.create({ width: MW, height: MH, scaleMode: 'nearest' });
  const sRT = PIXI.RenderTexture.create({ width: MW, height: MH });
  const shH = PIXI.Shader.from({ gl: { vertex: VERT, fragment: FRAG_H }, resources: { uW: wTex.source, u: { uSize: { value: [MW, MH], type: 'vec2<f32>' } } } });
  const shS = PIXI.Shader.from({ gl: { vertex: VERT, fragment: FRAG_S }, resources: { uH: hRT.source, u: { uTexel: { value: [1 / MW, 1 / MH], type: 'vec2<f32>' } } } });
  const runs = [];
  for (let r = 0; r < 3; r++) {
    const g0 = performance.now();
    app.renderer.render({ container: quad(shH), target: hRT }); sync();
    const g1 = performance.now();
    app.renderer.render({ container: quad(shS), target: sRT }); sync();
    const g2 = performance.now();
    runs.push({ heightMs: +(g1 - g0).toFixed(1), shadeMs: +(g2 - g1).toFixed(1) });
  }
  out.gpuBake = { packWeightsMs: +packMs.toFixed(1), runs };
  if (qn('shots', 1)) { const cvs = app.renderer.extract.canvas({ target: sRT }); shots.push({ name: 'gpu-hillshade', url: cvs.toDataURL('image/png') }); }
}

// ---------- per-frame composite: owner tint + thin borders from an id texture and a border distance field ----------
if (qn('frame', 1)) {
  t0 = performance.now();
  // chamfer distance (3-4) to the nearest pixel of another province, in px, capped at 15
  const dist = new Float32Array(NPX).fill(1e9);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const p = y * MW + x, v = id[p];
    if ((x > 0 && id[p - 1] !== v) || (x < MW - 1 && id[p + 1] !== v) || (y > 0 && id[p - MW] !== v) || (y < MH - 1 && id[p + MW] !== v)) dist[p] = 0.5;
  }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const p = y * MW + x; let d = dist[p];
    if (x > 0) d = Math.min(d, dist[p - 1] + 1); if (y > 0) { d = Math.min(d, dist[p - MW] + 1); if (x > 0) d = Math.min(d, dist[p - MW - 1] + 1.414); if (x < MW - 1) d = Math.min(d, dist[p - MW + 1] + 1.414); } dist[p] = d; }
  for (let y = MH - 1; y >= 0; y--) for (let x = MW - 1; x >= 0; x--) { const p = y * MW + x; let d = dist[p];
    if (x < MW - 1) d = Math.min(d, dist[p + 1] + 1); if (y < MH - 1) { d = Math.min(d, dist[p + MW] + 1); if (x < MW - 1) d = Math.min(d, dist[p + MW + 1] + 1.414); if (x > 0) d = Math.min(d, dist[p + MW - 1] + 1.414); } dist[p] = d; }
  const idData = new Uint8Array(NPX * 4);
  for (let p = 0; p < NPX; p++) { idData[p * 4] = id[p]; idData[p * 4 + 1] = Math.min(255, dist[p] * 16); idData[p * 4 + 2] = land[p] * 255; idData[p * 4 + 3] = 255; }
  tic('11_borderDistanceField', t0);
  const idTex = new PIXI.Texture({ source: new PIXI.BufferImageSource({ resource: idData, width: MW, height: MH, format: 'rgba8unorm', scaleMode: 'nearest', alphaMode: 'no-premultiply-alpha' }) });
  // owner palette: 256 x 1, rgb = owner color, a = tint strength (0 = unowned); changes once per turn
  const pal = new Uint8Array(256 * 4);
  const OWN = [[0xfd, 0x65, 0x33], [0x00, 0x67, 0x4b], [0x3a, 0x7b, 0xd5]];
  for (let i = 0; i < sites.length; i++) { const o = i % 5 < 3 ? OWN[(i * 7) % 3] : null; if (o) { pal.set([...o, 255], i * 4); } else pal.set([235, 228, 210, 0], i * 4); }
  const palTex = new PIXI.Texture({ source: new PIXI.BufferImageSource({ resource: pal, width: 256, height: 1, format: 'rgba8unorm', scaleMode: 'nearest', alphaMode: 'no-premultiply-alpha' }) });
  const FRAG = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D uMap; uniform sampler2D uId; uniform sampler2D uPal;
uniform float uPxPerTexel; uniform float uSel; uniform float uTint;
void main(){ vec4 c = texture(uMap, vUV); vec4 idt = texture(uId, vUV); float pid = floor(idt.r * 255.0 + 0.5);
 vec4 own = texture(uPal, vec2((pid + 0.5) / 256.0, 0.5)); float owned = own.a; float sel = step(abs(pid - uSel), 0.5);
 vec3 col = mix(c.rgb, own.rgb * c.a, owned * uTint + sel * 0.22);
 // border distance in screen px; a line of 1.6 px total, each side drawn in its own owner's color
 float dScreen = idt.g * 255.0 / 16.0 * uPxPerTexel; float line = 1.0 - smoothstep(0.55, 1.35, dScreen);
 vec3 lineCol = owned > 0.0 ? own.rgb : vec3(0.93, 0.90, 0.82);
 col = mix(col, lineCol * c.a, line * (owned > 0.0 ? 0.95 : 0.45) * idt.b);
 o = vec4(col, c.a); }`;
  const VERT = `in vec2 aPosition; in vec2 aUV; out vec2 vUV;
uniform mat3 uProjectionMatrix; uniform mat3 uWorldTransformMatrix; uniform mat3 uTransformMatrix;
void main(){ mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix; gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0); vUV = aUV; }`;
  const uni = new PIXI.UniformGroup({ uPxPerTexel: { value: 1, type: 'f32' }, uSel: { value: 17, type: 'f32' }, uTint: { value: 0.14, type: 'f32' } });
  const shader = PIXI.Shader.from({ gl: { vertex: VERT, fragment: FRAG }, resources: { uMap: (mapRT ?? baseTex).source, uId: idTex.source, uPal: palTex.source, u: uni } });
  const mesh = new PIXI.Mesh({ geometry: new PIXI.MeshGeometry({ positions: new Float32Array([0, 0, MW, 0, MW, MH, 0, MH]), uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), indices: new Uint32Array([0, 1, 2, 0, 2, 3]) }), shader });
  const cam = new PIXI.Container(); cam.addChild(mesh); app.stage.addChild(cam);
  const VW = window.innerWidth, VH = window.innerHeight;
  const view = (zoom, cx, cy) => { const s = (VW / MW) * zoom; cam.scale.set(s); cam.position.set(VW / 2 - cx * s, VH / 2 - cy * s); uni.uniforms.uPxPerTexel = s; };
  // baseline: the same baked map as a plain sprite
  const plain = new PIXI.Sprite(mapRT ?? baseTex); const camP = new PIXI.Container(); camP.addChild(plain);
  out.frame = {};
  for (const [name, z] of [['far', 1], ['mid', 2], ['near', 4]]) {
    view(z, MW * 0.5, MH * 0.5);
    out.frame[name] = timeFrames(ctx, (f) => view(z, MW * 0.5 + Math.sin(f * 0.05) * 30, MH * 0.5), 60, 10);
    if (qn('shots', 1)) { app.renderer.render(app.stage); sync(); shots.push({ name: 'map-' + name, url: app.canvas.toDataURL('image/jpeg', 0.9) }); }
  }
  app.stage.removeChild(cam); app.stage.addChild(camP);
  camP.scale.set(VW / MW * 2); camP.position.set(VW / 2 - MW * 0.5 * VW / MW * 2, VH / 2 - MH * 0.5 * VW / MW * 2);
  out.frame.plainSpriteMid = timeFrames(ctx, () => {}, 60, 10);
  // palette update cost (a turn's ownership change)
  const tiny = PIXI.RenderTexture.create({ width: 4, height: 4 }); const ps = new PIXI.Sprite(palTex); ps.scale.set(4 / 256, 4);
  app.renderer.render({ container: ps, target: tiny }); sync();
  const u0 = performance.now(); pal[17 * 4 + 3] = 255; palTex.source.update(); app.renderer.render({ container: ps, target: tiny }); sync(); out.paletteUpdateMs = +(performance.now() - u0).toFixed(2);
  app.stage.removeChild(camP);
}
out.timings = T;
done(out);

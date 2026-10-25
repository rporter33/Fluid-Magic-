
// ================================================================== v4: the relief map (visual-v4/map-design-final.md). Map look: Relief (default) | Painted (v3)
// The cloth becomes a terrain model on the oak table: one bake per map (albedo through a seeded lookup warp, relief with its own wider
// blend, mean-neutral hillshade, ground detail, wilds in relief), live layers over it (glow, fog, modes, hover), vector rails and water,
// miniatures on bases, labels by zoom band. Nothing here calls Math.random or Date: every draw is seeded from the map seed.
// This file: constants, the seeded noise, the CPU bake (the design's CPU reference and fallback path, time-sliced on the main thread),
// the model's rim (cliff, plinth, shadow, plaque) and the water placement.
const RELIEF = () => view.look === 'relief';
const RLD = MED_DIAM, RLK = MED_DIAM / 90; // D, and mockup units per mapgen unit (the design's numbers are mapgen units, D = 90)
const RL_T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']; // terrain index order; 7 peaks, 8 mere, 255 off
const RL_TI = Object.fromEntries(RL_T.map((t, k) => [t, k]));
const RL_ALB = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' }; // §4.1
const RL_CAP = { plains: 4, farmland: 4, forest: 6, hills: 9, mountains: 16, swamp: 3, wasteland: 6 }; // §3.3 swing caps, L*
// Shade gain per terrain (RL_T order), blended across ecotones like the heights: tanh(3.2 g (s - sin 40)) under the same caps, so the low land's
// gentle slopes reach a third of their swing cap in the core (§3.2, §13) and the relief, not the mottle, carries the lightness budget (critique fix 3)
const RL_SHG = [2.6, 3.6, 1.4, 1.0, 1.0, 2.2, 1.2]; // plains, farmland, forest, hills, mountains, swamp, wasteland
const RL_HT = { swamp: [0.03, 0.04, 60], farmland: [0.08, 0.075, 60], plains: [0.10, 0.15, 60], forest: [0.14, 0.175, 45], wasteland: [0.18, 0.25, 40], hills: [0.28, 0.30, 30], mountains: [0.48, 0.62, 22] }; // §3.2 base, amplitude, feature (mapgen units)
const RL_KEYFOR = { plains: '#1C1A17', farmland: '#1C1A17', forest: '#F4EEDF', hills: '#F4EEDF', mountains: '#1C1A17', swamp: '#F4EEDF', wasteland: '#1C1A17' }; // keylineFor(albedo), §4.1
// The neutral hairline's alpha per terrain (fix 5; was keylineFor at 70% everywhere, 6.3:1 on forest, louder than the rails): each solved so the worst case over the
// relief extremes (-A, 0, +0.6 A) and the five approved states is 2.41 to 2.44:1 (wasteland stays at the 70% cap, 2.39:1, the design's floor); critique-work/calc/hairline.ts
const RL_HAIRA = { plains: 0.62, farmland: 0.47, forest: 0.34, hills: 0.51, mountains: 0.67, swamp: 0.48, wasteland: 0.70 };
const RL_WASH = { red: ['#8F8C88', 0.1], green: ['#5E7F45', 0.06] }; // the land looks' wash colors and caps at strength 10 (ash 10%, moss 6%; §4.2)
const RL_C = { water: '#50AF9B', granite: '#2A292C', graniteLit: '#8A857E', snow: '#F2EEE6', mere: '#24222A', mereBank: '#3A3640', ripple: '#8FC3D3', lip: '#E9E4D8', cliffTop: '#3A3436', cliffFoot: '#221E20', plinth: '#2B231C', contact: '#1C1A17', brass: '#B8914A', fall: '#B9D3CF', gesso: '#E8DCC2', base: '#1E1B18', baseLip: '#B8B1A4', pewter: '#91A092', keyLight: '#F4EEDF', keyDark: '#1C1A17' };
// Presentation numbers (V16: docs/09-balance "Map presentation"; one place, read by the checks). Lengths in D or in mapgen units (x RLK).
const RL_P = {
  bakeW: 2048, bakeH: 1280, warpD: 0.10, warpF1: 40, warpF2: 9, albBlur: 1.1, hSigmaD: 0.12, vScale: 26, litCap: 0.6, elev: 40, azimuth: 315,
  castD: 0.25, castSteps: 16, castL: 6, valleyL: 4, meanBudget: 0.5, meanSpreadD: 0.03, meanIters: 3, octaves: 5, lacunarity: 2.03, gain: 0.5, hGain: 0.42, featK: 1.5, // featK: the height features x 1.5 (larger landforms) // hGain: the heights' fBm gain (the design's 0.5 let the fine octaves own the hillshade)
  glow: 0.35, glowD: 0.05, glowPow: 1.6, coreD: 0.06, hover: 0.25, select: 0.30, indepHover: 0.20, indepSelect: 0.25, hairline: 0.70, hemPeak: 0.12, haze: 0.04, outSat: 0.10, realmTint: 0.08,
  face: 48, faceShown: 37, plinth: 3, strata: 6, crag: 10, cragShown: 8, bank: 4, cornerD: 0.22, shadowD: 0.05, shadowBlurD: 0.06, shadowA: 0.55, plaqueD: 0.9,
  modeRelief: 3, lakeMax: 0.08, pondMax: 0.02, waterClearD: 0.10, townStep: 4, townPD: 5,
  hamletDpx: 100, hamletFadePx: 130, guardDpx: 300, guardMax: 2, townMaxPx: 96, townHouseK: 0.14, townHouseMax: 16, // fix 4: hamlets and huts from 100 px a province (fading in to 130); fix 7: guards from 300 px, at most 2; fix 8: town ceiling and house size
  plaqueH: 11.3, // the plaque keeps its height on the taller face (mapgen units)
};
const RL_FACE = RL_P.faceShown * RLK; // the cliff as shown in the 40 degree oblique (48 units tall, 37 shown; critique fix 9, the design's §2.2 had 24 and 18)
const RL_PLINTH = RL_P.plinth * RLK * 0.77;
const RL_RC = RL_P.cornerD * RLD; // the model is mapgen's rounded rectangle
const MODEL_BOX = [0, 0, W, H + RL_FACE];
function inModel(x, y) { // inside the land's rounded rectangle
  if (x < 0 || y < 0 || x > W || y > H) return false;
  const cx = x < RL_RC ? RL_RC : x > W - RL_RC ? W - RL_RC : x, cy = y < RL_RC ? RL_RC : y > H - RL_RC ? H - RL_RC : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= RL_RC * RL_RC;
}
function modelPath(g) { g.beginPath(); g.roundRect(0, 0, W, H, RL_RC); }
const RL_L = (() => { const r = {}; for (const t of RL_T) r[t] = rgb2lab(hex2rgb(RL_ALB[t])); return r; })();
// tanh by a rational approximation (the rule-bearing rasters use arithmetic, sqrt and floor only; V13, review item 34)
const rlTanh = (x) => { if (x > 4.97) return 1; if (x < -4.97) return -1; const x2 = x * x; return (x * (135135 + x2 * (17325 + x2 * (378 + x2)))) / (135135 + x2 * (62370 + x2 * (3150 + x2 * 28))); };
const rlLum = (c) => 0.2126 * s2l(c[0]) + 0.7152 * s2l(c[1]) + 0.0722 * s2l(c[2]);
const rlWcag = (a, b) => { const la = rlLum(a), lb = rlLum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }; // WCAG contrast of two sRGB triples
const rlSmooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- seeded value noise: one 256 x 256 table per purpose (V13: presentation streams keyed relief:<seed>:<purpose>, never state.rng)
const RL_TABLES = new Map();
function rlTable(purpose) {
  let t = RL_TABLES.get(purpose); if (t) return t;
  const R = rngFor(`relief:${MAP_SEED}:${purpose}`); t = new Float32Array(65536); for (let k = 0; k < 65536; k++) t[k] = R() * 2 - 1;
  RL_TABLES.set(purpose, t); return t;
}
function rlVN(T, x, y) { // value noise on the unit lattice, smoothstep interpolation, in [-1, 1]
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const x0 = ix & 255, x1 = (ix + 1) & 255, y0 = (iy & 255) << 8, y1 = ((iy + 1) & 255) << 8;
  const a = T[y0 | x0], b = T[y0 | x1], c = T[y1 | x0], d = T[y1 | x1];
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
// gradient noise for the heights (value noise creases along its lattice): a seeded permutation and unit gradients made with sqrt only
const RL_GTABLES = new Map();
function rlGTable(purpose) {
  let t = RL_GTABLES.get(purpose); if (t) return t;
  const R = rngFor(`relief:${MAP_SEED}:g:${purpose}`), perm = new Uint8Array(512), gx = new Float32Array(256), gy = new Float32Array(256), p = [...Array(256).keys()];
  for (let k = 255; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [p[k], p[j]] = [p[j], p[k]]; }
  for (let k = 0; k < 512; k++) perm[k] = p[k & 255];
  for (let k = 0; k < 256; k++) { let x, y, l; do { x = R() * 2 - 1; y = R() * 2 - 1; l = x * x + y * y; } while (l > 1 || l < 0.05); l = Math.sqrt(l); gx[k] = x / l; gy[k] = y / l; }
  t = { perm, gx, gy }; RL_GTABLES.set(purpose, t); return t;
}
function rlGN(G, x, y) { // 2D gradient noise, quintic fade, about [-1, 1]
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, X = ix & 255, Y = iy & 255, P = G.perm;
  const a = P[P[X] + Y], b = P[P[X + 1] + Y], c = P[P[X] + Y + 1], d = P[P[X + 1] + Y + 1];
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const na = G.gx[a] * fx + G.gy[a] * fy, nb = G.gx[b] * (fx - 1) + G.gy[b] * fy, nc = G.gx[c] * fx + G.gy[c] * (fy - 1), nd = G.gx[d] * (fx - 1) + G.gy[d] * (fy - 1);
  return 1.45 * (na + (nb - na) * u + (nc - na) * v + (na - nb - nc + nd) * u * v);
}
function rlGFbm(G, x, y, oct, gain) { let s = 0, amp = 1, f = 1, norm = 0; for (let k = 0; k < oct; k++) { s += amp * rlGN(G, x * f + k * 19.17, y * f + k * 47.53); norm += amp; amp *= gain; f *= RL_P.lacunarity; } const v = (s / norm) * 1.5; return v > 1 ? 1 : v < -1 ? -1 : v; }
function rlFbm(T, x, y, oct, gain = RL_P.gain) { // fBm, lacunarity 2.03; each octave offset in the table; scaled so p95 |n| is about 0.9
  let s = 0, amp = 1, f = 1, norm = 0;
  for (let k = 0; k < oct; k++) { s += amp * rlVN(T, x * f + k * 37.31, y * f + k * 91.17); norm += amp; amp *= gain; f *= RL_P.lacunarity; }
  const v = (s / norm) * 1.75; return v > 1 ? 1 : v < -1 ? -1 : v;
}
function rlRidged(G, x, y, oct, warp) { // ridged multifractal on gradient noise (sharp crests, smooth valleys), domain-warped so crests meander; about [-1, 1]
  if (warp) { const wx = rlGN(G, x * 0.43 + 17.3, y * 0.43 + 5.1), wy = rlGN(G, x * 0.43 + 61.7, y * 0.43 + 29.9); x += warp * wx; y += warp * wy; }
  let s = 0, amp = 1, f = 1, w = 1, norm = 0;
  for (let k = 0; k < oct; k++) { let n = 1 - Math.abs(rlGN(G, x * f + k * 37.31, y * f + k * 91.17)); n *= n; n *= w; w = Math.min(1, n * 1.6); s += n * amp; norm += amp; amp *= 0.45; f *= RL_P.lacunarity; }
  return Math.max(-1, Math.min(1, (s / norm) * 2.4 - 1.0));
}

// ---- box blur helpers on Float32 planes (separable running sums; edges renormalized)
function rlBoxBlur(src, w, h, r, passes, mask) { // mask: optional Float32 weights (blur value*mask and mask, divide); returns a new plane
  let a = Float32Array.from(src), m = mask ? Float32Array.from(mask) : null; const tmp = new Float32Array(w * h), tmpm = m ? new Float32Array(w * h) : null;
  if (m) for (let k = 0; k < a.length; k++) a[k] *= m[k];
  const run = (S, D, n, stride, count, step) => { // blur `count` lines of length n
    for (let l = 0; l < count; l++) {
      const o = l * step; let acc = 0, cnt = 0;
      for (let k = 0; k <= r && k < n; k++) { acc += S[o + k * stride]; cnt++; }
      for (let k = 0; k < n; k++) {
        D[o + k * stride] = acc / cnt;
        const add = k + r + 1, rem = k - r; if (add < n) { acc += S[o + add * stride]; cnt++; } if (rem >= 0) { acc -= S[o + rem * stride]; cnt--; }
      }
    }
  };
  for (let p = 0; p < passes; p++) {
    run(a, tmp, w, 1, h, w); run(tmp, a, h, w, w, 1);
    if (m) { run(m, tmpm, w, 1, h, w); run(tmpm, m, h, w, w, 1); }
  }
  if (m) for (let k = 0; k < a.length; k++) a[k] = m[k] > 1e-6 ? a[k] / m[k] : 0;
  return a;
}
function rlBilin(P, w, h, x, y) { // bilinear sample of a plane at fractional texel coordinates (texel centers at k + 0.5)
  x -= 0.5; y -= 0.5; if (x < 0) x = 0; if (y < 0) y = 0; if (x > w - 1) x = w - 1; if (y > h - 1) y = h - 1;
  const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, ix1 = ix + 1 < w ? ix + 1 : ix, iy1 = iy + 1 < h ? iy + 1 : iy;
  const a = P[iy * w + ix], b = P[iy * w + ix1], c = P[iy1 * w + ix], d = P[iy1 * w + ix1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const RL_GAMMA = (() => { const n = 4096, t = new Uint8ClampedArray(n + 1); for (let k = 0; k <= n; k++) { const c = k / n; t[k] = Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)); } return t; })();
function rlLabTo(L, a, b, d, o) { // CIELAB (D65) to sRGB bytes at d[o..o+2]
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const X = (fx > 0.2068966 ? fx * fx * fx : (fx - 16 / 116) / 7.787) * 0.95047, Y = fy > 0.2068966 ? fy * fy * fy : (fy - 16 / 116) / 7.787, Z = (fz > 0.2068966 ? fz * fz * fz : (fz - 16 / 116) / 7.787) * 1.08883;
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, bb = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  r = r < 0 ? 0 : r > 1 ? 1 : r; g = g < 0 ? 0 : g > 1 ? 1 : g; bb = bb < 0 ? 0 : bb > 1 ? 1 : bb;
  d[o] = RL_GAMMA[(r * 4096 + 0.5) | 0]; d[o + 1] = RL_GAMMA[(g * 4096 + 0.5) | 0]; d[o + 2] = RL_GAMMA[(bb * 4096 + 0.5) | 0];
}

// ---- the wild outlines (straight edges against non-wild cells) and the light
const RL_WILDK = new Uint8Array(N); for (const w of WILDS) for (const c of w.cells) RL_WILDK[c] = w.kind === 'peaks' ? 7 : 8;
const RL_LIGHT = (() => { const el = (RL_P.elev * Math.PI) / 180, az = (RL_P.azimuth * Math.PI) / 180; // azimuth 315: from the upper left of the screen
  return [Math.sin(az) * Math.cos(el), -Math.cos(az) * Math.cos(el), Math.sin(el)]; })(); // [-0.54, -0.54, 0.64]
const RL_SIN_EL = Math.sin((RL_P.elev * Math.PI) / 180), RL_TAN_EL = Math.tan((RL_P.elev * Math.PI) / 180);
function rlWildOutline(w) { const out = []; for (const c of w.cells) for (const j of NB[c]) { if (w.cells.includes(j)) continue; const e = edgeBetween(c, j); if (e) out.push({ a: e.a, b: e.b, c, j }); } return out; }
function rlSegDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; let t = ((px - ax) * dx + (py - ay) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = px - ax - t * dx, ey = py - ay - t * dy; return Math.sqrt(ex * ex + ey * ey); }

// ---- the bake. RB holds every raster the live layers, the checks and the water placement read.
const RB = { ready: false, running: false, ver: 0, t: {}, total: 0, slices: 0, wall: 0 };
function* rlBakeGen(out) {
  const BW = RL_P.bakeW, BH = RL_P.bakeH, TX = BW / W, NP = BW * BH, HW = BW >> 1, HH = BH >> 1, QW = BW >> 2, QH = BH >> 2;
  const tm = out.t = {}; let t = performance.now(); const lap = (k) => { const n = performance.now(); tm[k] = +((tm[k] ?? 0) + n - t).toFixed(1); t = n; };
  out.BW = BW; out.BH = BH; out.TX = TX; out.HW = HW; out.HH = HH; out.QW = QW; out.QH = QH;
  // S1: the province id raster (convex cells by scanline, texel centers), off the model 255; the land mask's rounded corners
  const id = new Uint8Array(NP).fill(255);
  for (let i = 0; i < N; i++) {
    const poly = cells[i]; let y0 = Infinity, y1 = -Infinity; for (const q of poly) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const ty0 = Math.max(0, Math.floor(y0 * TX - 0.5)), ty1 = Math.min(BH - 1, Math.ceil(y1 * TX));
    for (let ty = ty0; ty <= ty1; ty++) {
      const wy = (ty + 0.5) / TX; let xa = Infinity, xb = -Infinity;
      for (let k = 0; k < poly.length - 1; k++) { const p = poly[k], q = poly[k + 1]; if ((p[1] - wy) * (q[1] - wy) > 0 || p[1] === q[1]) continue; const x = p[0] + ((wy - p[1]) * (q[0] - p[0])) / (q[1] - p[1]); if (x < xa) xa = x; if (x > xb) xb = x; }
      if (xb < xa) continue; const tx0 = Math.max(0, Math.ceil(xa * TX - 0.5)), tx1 = Math.min(BW - 1, Math.ceil(xb * TX - 0.5) - 1);
      for (let tx = tx0; tx <= tx1; tx++) id[ty * BW + tx] = i;
    }
  }
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) { // gaps on shared edges, then the rounded corners
    const x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
    if (id[k] === 255) id[k] = nearest(x, y);
    if (!inModel(x, y)) id[k] = 255;
  }
  out.id = id; yield; lap('idRaster');
  // S2: the lookup warp (|w| <= 0.10 D; features 40 and 9 mapgen units at 0.7 and 0.3), at quarter resolution, then the lookup
  const Wm = RL_P.warpD * RLD, F1 = RL_P.warpF1 * RLK, F2 = RL_P.warpF2 * RLK, TW1 = rlTable('warp:x1'), TW2 = rlTable('warp:x2'), TW3 = rlTable('warp:y1'), TW4 = rlTable('warp:y2');
  const wqx = new Float32Array(QW * QH), wqy = new Float32Array(QW * QH);
  for (let qy = 0, k = 0; qy < QH; qy++) for (let qx = 0; qx < QW; qx++, k++) {
    const x = ((qx + 0.5) * 4) / TX, y = ((qy + 0.5) * 4) / TX;
    let vx = 0.7 * rlVN(TW1, x / F1, y / F1) + 0.3 * rlVN(TW2, x / F2, y / F2), vy = 0.7 * rlVN(TW3, x / F1, y / F1) + 0.3 * rlVN(TW4, x / F2, y / F2);
    vx *= 1.7 * Wm; vy *= 1.7 * Wm; const m = Math.sqrt(vx * vx + vy * vy); if (m > Wm) { vx *= Wm / m; vy *= Wm / m; }
    wqx[k] = vx; wqy[k] = vy;
  }
  const LT = new Uint8Array(NP), LP = new Uint8Array(NP);
  const own = new Float64Array(N), tot = new Float64Array(N);
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) {
    const o = id[k]; if (o === 255) { LT[k] = 255; LP[k] = 255; continue; }
    if (RL_WILDK[o]) { LT[k] = RL_WILDK[o]; LP[k] = o; continue; }
    const fxq = (tx + 0.5) / 4, fyq = (ty + 0.5) / 4, dx = rlBilin(wqx, QW, QH, fxq, fyq), dy = rlBilin(wqy, QW, QH, fxq, fyq);
    let sx = Math.floor(tx + dx * TX), sy = Math.floor(ty + dy * TX); sx = sx < 0 ? 0 : sx >= BW ? BW - 1 : sx; sy = sy < 0 ? 0 : sy >= BH ? BH - 1 : sy;
    let tid = id[sy * BW + sx]; if (tid === 255 || RL_WILDK[tid]) tid = o;
    LP[k] = tid; LT[k] = RL_TI[terr[tid]];
    tot[o]++; if (terr[tid] === terr[o]) own[o]++;
  }
  out.LT = LT; out.LP = LP; out.ownShare = provList.map((i) => ({ i, share: tot[i] ? own[i] / tot[i] : 1 }));
  yield; lap('warpLookup');
  // S3: height weights: the warped one-hot at quarter resolution, Gaussian sigma 0.12 D (three box passes); wilds excluded from the land blend
  const sigQ = (RL_P.hSigmaD * RLD * TX) / 4, rq = Math.max(1, Math.round((Math.sqrt((12 * sigQ * sigQ) / 3 + 1) - 1) / 2));
  const wch = [];
  for (let c = 0; c < 8; c++) { // 0..6 land terrains, 7 peaks (for foothills)
    const P = new Float32Array(QW * QH);
    for (let qy = 0, k = 0; qy < QH; qy++) for (let qx = 0; qx < QW; qx++, k++) { const v = LT[(qy * 4 + 2) * BW + qx * 4 + 2]; P[k] = v === c ? 1 : 0; }
    wch.push(rlBoxBlur(P, QW, QH, rq, 3)); if (c % 3 === 2) yield;
  }
  lap('heightWeights');
  // S4: the heightfield at half resolution: sum_t w_t (B_t + A_t n_t), mountains ridged, the canopy +0.04, foothills toward the peaks,
  // passable land soft-clamped under 1.00; wild peaks a dome plus ridged noise, never under 1.10; meres flat at -0.05 (§3.2)
  const hh = new Float32Array(HW * HH), HG = new Float32Array(HW * HH).fill(1), hid = new Uint8Array(HW * HH), hLT = new Uint8Array(HW * HH); // HG: the shade gain, blended by the height weights
  for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) { const fk = (y * 2 + 1) * BW + x * 2 + 1; hid[k] = id[fk]; hLT[k] = LT[fk]; }
  const tabs = RL_T.map((tn) => rlGTable('height:' + tn)), feat = RL_T.map((tn) => RL_HT[tn][2] * RLK * RL_P.featK);
  const wdist = new Float32Array(HW * HH); // distance into a wild from its outline (half res; wild texels only)
  for (const w of WILDS) {
    const ol = rlWildOutline(w); let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
    const set = new Set(w.cells);
    for (let y = Math.max(0, Math.floor(bb[1] * TX / 2)); y <= Math.min(HH - 1, Math.ceil(bb[3] * TX / 2)); y++) for (let x = Math.max(0, Math.floor(bb[0] * TX / 2)); x <= Math.min(HW - 1, Math.ceil(bb[2] * TX / 2)); x++) {
      const k = y * HW + x; if (!set.has(hid[k])) continue; const px = ((x + 0.5) * 2) / TX, py = ((y + 0.5) * 2) / TX; let d = Infinity;
      for (const e of ol) { const v = rlSegDist(px, py, e.a[0], e.a[1], e.b[0], e.b[1]); if (v < d) d = v; } wdist[k] = d;
    }
  }
  const TR = rlGTable('wild:ridge'), VS = RL_P.vScale * RLK;
  for (let y = 0, k = 0; y < HH; y++) {
    for (let x = 0; x < HW; x++, k++) {
      const o = hid[k], lt = hLT[k], px = ((x + 0.5) * 2) / TX, py = ((y + 0.5) * 2) / TX;
      if (o === 255) { hh[k] = 0; continue; }
      if (lt === 7) { const dome = Math.pow(Math.min(1, wdist[k] / (0.30 * RLD)), 0.75), r = rlRidged(TR, px / (34 * RLK), py / (34 * RLK), 4, 0.6); hh[k] = Math.max(1.10, 1.25 + 0.60 * dome + 0.28 * r * (0.35 + 0.65 * dome)); continue; }
      if (lt === 8) { hh[k] = -0.05; continue; }
      const fq = (x + 0.5) / 2, gq = (y + 0.5) / 2; let ws = 0; const wv = [0, 0, 0, 0, 0, 0, 0];
      for (let c = 0; c < 7; c++) { const v = rlBilin(wch[c], QW, QH, fq, gq); wv[c] = v; ws += v; }
      if (ws < 1e-4) { wv[lt] = 1; ws = 1; }
      { let gs = 0; for (let c = 0; c < 7; c++) gs += (wv[c] / ws) * RL_SHG[c]; HG[k] = gs; }
      let h = 0;
      for (let c = 0; c < 7; c++) {
        const wt = wv[c] / ws; if (wt < 0.003) continue; const tn = RL_T[c], [Bt, At] = RL_HT[tn];
        const n = tn === 'mountains' ? rlRidged(tabs[c], px / feat[c], py / feat[c], 4, 0.3) : rlGFbm(tabs[c], px / feat[c], py / feat[c], tn === 'hills' ? 3 : RL_P.octaves, RL_P.hGain);
        h += wt * (Bt + At * n);
        if (tn === 'forest') h += wt * 0.04; // the canopy (§3.5)
      }
      h += 0.30 * rlBilin(wch[7], QW, QH, fq, gq); // foothills toward the massifs
      if (h > 0.85) h = 0.85 + 0.15 * rlTanh((h - 0.85) / 0.15); // soft clamp under 1.00
      hh[k] = h;
    }
    if ((y & 63) === 63) yield;
  }
  out.hh = hh; out.hid = hid; out.hLT = hLT; lap('heightfield');
  // S5: hillshade (Horn), the asymmetric lit cap, cast shadows (16 steps toward the light, at most 0.25 D), valleys; at half resolution
  const dxw = 2 / TX, fS = new Float32Array(HW * HH), sS = new Float32Array(HW * HH), shd = new Float32Array(HW * HH), [lx, ly, lz] = RL_LIGHT;
  const H_ = (xx, yy, k0) => { xx = xx < 0 ? 0 : xx >= HW ? HW - 1 : xx; yy = yy < 0 ? 0 : yy >= HH ? HH - 1 : yy; const kk = yy * HW + xx; return hid[kk] === 255 ? hh[k0] : hh[kk]; };
  for (let y = 0, k = 0; y < HH; y++) {
    for (let x = 0; x < HW; x++, k++) {
      if (hid[k] === 255) continue;
      const a = H_(x - 1, y - 1, k), b = H_(x, y - 1, k), c = H_(x + 1, y - 1, k), d = H_(x - 1, y, k), f = H_(x + 1, y, k), g = H_(x - 1, y + 1, k), i2 = H_(x, y + 1, k), j = H_(x + 1, y + 1, k);
      const dzdx = ((c + 2 * f + j - (a + 2 * d + g)) * VS) / (8 * dxw), dzdy = ((g + 2 * i2 + j - (a + 2 * b + c)) * VS) / (8 * dxw);
      const nl = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1), s = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / nl);
      sS[k] = s; let v = rlTanh(3.2 * HG[k] * (s - RL_SIN_EL)); fS[k] = v < -1 ? -1 : v > RL_P.litCap ? RL_P.litCap : v;
      // cast shadow: march toward the light; the ray rises at tan 40
      const z0 = hh[k] * VS, stepW = (RL_P.castD * RLD) / RL_P.castSteps, stepT = stepW / dxw; let occ = 0;
      for (let m = 1; m <= RL_P.castSteps; m++) { const sxx = x + 0.5 + -0.70710678 * stepT * m, syy = y + 0.5 + -0.70710678 * stepT * m; if (sxx < 0 || syy < 0) break; const zs = rlBilin(hh, HW, HH, sxx, syy) * VS - (z0 + stepW * m * RL_TAN_EL); if (zs > occ) occ = zs; }
      shd[k] = rlSmooth(0, 0.04 * RLD, occ);
    }
    if ((y & 63) === 63) yield;
  }
  const hb = rlBoxBlur(hh, HW, HH, Math.round(0.08 * RLD * TX / 2), 2), ao = new Float32Array(HW * HH);
  for (let k = 0; k < HW * HH; k++) ao[k] = hid[k] === 255 || RL_WILDK[hid[k]] ? 0 : rlSmooth(0, 0.03 * RLD, (hb[k] - hh[k]) * VS);
  out.fS = fS; out.sS = sS; out.shd = shd; out.ao = ao; yield; lap('hillshade');
  // snow: the highest eighth of each massif where its faces turn to the light (§3.8)
  const snow = new Float32Array(HW * HH);
  for (const w of WILDS) if (w.kind === 'peaks') {
    const set = new Set(w.cells); let lo = Infinity, hi = -Infinity; for (let k = 0; k < HW * HH; k++) if (set.has(hid[k])) { lo = Math.min(lo, hh[k]); hi = Math.max(hi, hh[k]); }
    const cut = hi - (hi - lo) / 8; for (let k = 0; k < HW * HH; k++) if (set.has(hid[k])) snow[k] = rlSmooth(cut - 0.02, cut + 0.03, hh[k]) * rlSmooth(RL_SIN_EL - 0.05, RL_SIN_EL + 0.12, sS[k]);
  }
  out.snow = snow;
  // S6: the lightness change at full resolution: relief (the blended swing cap x the lit-capped shade), cast shadow, valley, ground detail
  const DL = new Float32Array(NP), TD = [rlTable('detail:a'), rlTable('detail:b'), rlTable('detail:c'), rlTable('detail:d')];
  const capT = RL_T.map((tn) => RL_CAP[tn]), parcelAng = new Float32Array(N); for (let i = 0; i < N; i++) { const R = rngFor(`relief:${MAP_SEED}:parcels:${i}`); parcelAng[i] = [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(R() * 4)] + (R() - 0.5) * 0.12; } // never 45 degrees (the reserved hatch)
  const crownCell = 7 * RLK * 0.75, cellP = 7 * RLK, TMR = rlGTable('micro:mountains'), mE = 0.7 * RLK, micro = (x, y) => { const f = (u, v) => rlRidged(TMR, u / (7 * RLK), v / (7 * RLK), 2, 0.2), t = (f(x + mE, y + mE) - f(x - mE, y - mE)) * 2.2; return t > 1 ? 1 : t < -1 ? -1 : t; }; // micro: rock at 7-unit features, lightness only, in [-1, 1] // canopy crowns of 3 to 6 mapgen units on a jittered grid; parcels of 7 units
  for (let ty = 0, k = 0; ty < BH; ty++) {
    for (let tx = 0; tx < BW; tx++, k++) {
      const lt = LT[k]; if (lt >= 7) continue;
      // the blended swing cap over the 3 x 3 albedo window (land only)
      let cs = 0, cn = 0; for (let oy = -1; oy <= 1; oy++) { const yy = ty + oy; if (yy < 0 || yy >= BH) continue; for (let ox = -1; ox <= 1; ox++) { const xx = tx + ox; if (xx < 0 || xx >= BW) continue; const v = LT[yy * BW + xx]; if (v < 7) { cs += capT[v]; cn++; } } }
      const At = cs / cn, hx = (tx + 0.5) / 2, hy = (ty + 0.5) / 2;
      const fs = rlBilin(fS, HW, HH, hx, hy), x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
      let d = At * fs - RL_P.castL * rlBilin(shd, HW, HH, hx, hy) - RL_P.valleyL * rlBilin(ao, HW, HH, hx, hy);
      const tn = RL_T[lt];
      if (tn === 'plains') d += 1.8 * rlFbm(TD[0], x / (22 * RLK), y / (22 * RLK), 2) + 1.0 * rlVN(TD[1], x / (5 * RLK), y / (5 * RLK)) + 1.1 * rlVN(TD[3], x / (1.6 * RLK), y / (1.6 * RLK));
      else if (tn === 'farmland') {
        const a = parcelAng[LP[k]], ca = Math.cos(a), sa = Math.sin(a), u = (x * ca + y * sa) / (cellP * 1.35), v = (-x * sa + y * ca) / (cellP * 0.8), iu = Math.floor(u), iv = Math.floor(v); let best = 9, best2 = 9, bid = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const cu = iu + ox, cv2 = iv + oy, hh2 = h32(`f${cu},${cv2}`), du = u - (cu + 0.15 + 0.7 * ((hh2 & 1023) / 1023)), dv = v - (cv2 + 0.15 + 0.7 * (((hh2 >>> 10) & 1023) / 1023)), dd = du * du + dv * dv; if (dd < best) { best2 = best; best = dd; bid = hh2; } else if (dd < best2) best2 = dd; }
        d += [-1.6, -0.5, 0.5, 1.6][(bid >>> 20) & 3] * (0.55 + 0.45 * rlSmooth(0, 0.12, Math.sqrt(best2) - Math.sqrt(best))) + 0.8 * rlVN(TD[2], x / (8 * RLK), y / (8 * RLK)); // parcel tones, the seams softened (fix 10)
      } else if (tn === 'forest') {
        const gx = x / crownCell, gy = y / crownCell, ix = Math.floor(gx), iy = Math.floor(gy); let best = 9, bdx = 0, bdy = 0, br = 1;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const cx = ix + ox, cy = iy + oy, hsh = h32(`c${cx},${cy}`), jx = (hsh & 1023) / 1023, jy = ((hsh >>> 10) & 1023) / 1023, rr = 0.42 + 0.33 * (((hsh >>> 20) & 255) / 255);
          const ddx = gx - (cx + jx), ddy = gy - (cy + jy), dd = Math.sqrt(ddx * ddx + ddy * ddy) / rr; if (dd < best) { best = dd; bdx = ddx / rr; bdy = ddy / rr; br = rr; }
        }
        const crown = best < 1 ? 1 - best * best : 0, lit = -(bdx + bdy) * 0.7071; // a dome lit from the upper left
        d += best < 1 ? 6 * (0.15 + 0.55 * crown * 0.5 + 0.55 * lit * Math.sqrt(crown)) : -6 * Math.min(1, (best - 1) * 3 + 0.6);
        d += 2 * rlFbm(TD[3], x / (30 * RLK), y / (30 * RLK), 2); void br;
      } else if (tn === 'hills') d += 2 * rlFbm(TD[0], x / (26 * RLK), y / (26 * RLK), 3) + 0.9 * rlVN(TD[3], x / (1.8 * RLK), y / (1.8 * RLK));
      else if (tn === 'mountains') { const sc = Math.max(0, -fs - 0.15); d += sc * 3 * rlVN(TD[1], x / (2.2 * RLK), y / (2.2 * RLK)) + 0.7 * rlVN(TD[2], x / (5 * RLK), y / (5 * RLK)) + 3 * micro(x, y); } // + the full-resolution micro-relief (fix 10)
      else if (tn === 'swamp') { const pn = rlFbm(TD[2], x / (16 * RLK), y / (16 * RLK), 3); d += -5 * rlSmooth(0.30, 0.42, pn) + 1 * rlVN(TD[3], x / (2.6 * RLK), y / (2.6 * RLK)); }
      else { const cr = 1 - Math.abs(rlFbm(TD[3], x / (12 * RLK), y / (12 * RLK), 3)); d += 2.2 * rlFbm(TD[0], x / (34 * RLK), y / (34 * RLK), 2) + 1.2 * Math.sin((x * 0.8 + y * 0.6) / (3.2 * RLK) + 3 * rlVN(TD[1], x / (25 * RLK), y / (25 * RLK))) - 3 * rlSmooth(0.90, 0.97, cr); }
      DL[k] = d;
    }
    if ((ty & 127) === 127) yield;
  }
  lap('detail');
  // the quarter-resolution heightfield for the water and the invariant checks (the CPU reference's own; review item 33); water is placed now
  const hq = new Float32Array(QW * QH); for (let y = 0, k = 0; y < QH; y++) for (let x = 0; x < QW; x++, k++) hq[k] = hh[(y * 2 + 1) * HW + x * 2 + 1];
  out.hq = hq; out.water = rlPlaceWater(out); lap('water');
  // S7: mean-neutral (V3): per province, the mean change over its pure-terrain pixels is removed as a smooth field (spread 0.03 D, three iterations)
  const pure = new Uint8Array(NP);
  for (let ty = 1, k0 = BW; ty < BH - 1; ty++, k0 += BW) for (let tx = 1; tx < BW - 1; tx++) { const k = k0 + tx, o = id[k]; if (o === 255 || RL_WILDK[o]) continue; const want = RL_TI[terr[o]]; if (LT[k] !== want) continue;
    if (LT[k - 1] === want && LT[k + 1] === want && LT[k - BW] === want && LT[k + BW] === want && LT[k - BW - 1] === want && LT[k - BW + 1] === want && LT[k + BW - 1] === want && LT[k + BW + 1] === want && distToEdge(cells[o], (tx + 0.5) / TX, (ty + 0.5) / TX) >= RL_P.coreD * RLD) pure[k] = 1; } // the untinted core: pure terrain beyond the glow band
  { // erode the core by 4 texels, so a mip or a screen filter never blends a fringe into it (the checks read the same set on screen)
    const r = 4, tmp = new Uint8Array(NP);
    for (let y = 0; y < BH; y++) { let run = 0; for (let x = 0; x < BW; x++) { const k = y * BW + x; run = pure[k] ? run + 1 : 0; tmp[k] = run; } for (let x = BW - 1, run2 = 0; x >= 0; x--) { const k = y * BW + x; run2 = pure[k] ? run2 + 1 : 0; tmp[k] = Math.min(tmp[k], run2) > r ? 1 : 0; } }
    for (let x = 0; x < BW; x++) { let run = 0; const col = new Uint16Array(BH); for (let y = 0; y < BH; y++) { const k = y * BW + x; run = tmp[k] ? run + 1 : 0; col[y] = run; } for (let y = BH - 1, run2 = 0; y >= 0; y--) { const k = y * BW + x; run2 = tmp[k] ? run2 + 1 : 0; pure[k] = Math.min(col[y], run2) > r ? 1 : 0; } }
  }
  { // the water covers part of some cores: those texels (with a 3-unit bank) leave the core, so the visible land is what is mean-neutral
    const m = 3 * RLK, clr = (x0, y0, x1, y1, test) => { for (let ty = Math.max(0, Math.floor(y0 * TX)); ty <= Math.min(BH - 1, Math.ceil(y1 * TX)); ty++) for (let tx = Math.max(0, Math.floor(x0 * TX)); tx <= Math.min(BW - 1, Math.ceil(x1 * TX)); tx++) if (test((tx + 0.5) / TX, (ty + 0.5) / TX)) pure[ty * BW + tx] = 0; };
    for (const L of [...out.water.lakes, ...out.water.ponds]) { const b = bboxOf(L.P), ring = [...L.P, L.P[0]]; clr(b[0] - m, b[1] - m, b[2] + m, b[3] + m, (x, y) => d3.polygonContains(L.P, [x, y]) || distToEdge(ring, x, y) < m); }
    for (const s of out.water.streams) { const b = bboxOf(s.pts), w = s.w1 + m; clr(b[0] - w, b[1] - w, b[2] + w, b[3] + w, (x, y) => distToEdge(s.pts, x, y) < w); }
  }
  const meanOf = new Float64Array(N), hLP = new Uint8Array(HW * HH); for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) hLP[k] = LP[(y * 2 + 1) * BW + x * 2 + 1];
  let Oh = new Float32Array(HW * HH); const rS = Math.max(1, Math.round((RL_P.meanSpreadD * RLD * TX) / 2));
  const landMaskH = new Float32Array(HW * HH); for (let k = 0; k < HW * HH; k++) landMaskH[k] = hLP[k] !== 255 && !RL_WILDK[hLP[k]] ? 1 : 0;
  for (let it = 0; it < RL_P.meanIters; it++) {
    const sum = new Float64Array(N), cnt = new Float64Array(N);
    for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) if (pure[k]) { const o = id[k]; sum[o] += DL[k] - (it ? rlBilin(Oh, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2) : 0); cnt[o]++; }
    for (let i = 0; i < N; i++) if (cnt[i]) meanOf[i] += sum[i] / cnt[i];
    const raw = new Float32Array(HW * HH); for (let k = 0; k < HW * HH; k++) raw[k] = landMaskH[k] ? meanOf[hLP[k]] : 0;
    Oh = rlBoxBlur(raw, HW, HH, rS, 2, landMaskH); yield;
  }
  const resid = new Float64Array(N), rcnt = new Float64Array(N);
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) { if (LT[k] >= 7) continue; DL[k] -= rlBilin(Oh, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2); if (pure[k]) { resid[id[k]] += DL[k]; rcnt[id[k]]++; } }
  out.residual = provList.map((i) => ({ i, dL: rcnt[i] ? resid[i] / rcnt[i] : 0, n: rcnt[i] }));
  out.pure = pure; out.DL = DL; yield; lap('meanNeutral');
  // S8: color: the 3 x 3 blended albedo in CIELAB with the change added to L*, to sRGB once; wilds; the rounded corners' coverage
  const img = new ImageData(BW, BH), d8 = img.data, Lt = RL_T.map((tn) => RL_L[tn]), corr = new Float64Array(N * 3);
  const landPx = (k, tx, ty, o4, cr) => { // the 3 x 3 blended albedo, the lightness change, and (after the first pass) the province's gamut correction
    let L = 0, a = 0, b = 0, n = 0;
    for (let oy = -1; oy <= 1; oy++) { const yy = ty + oy; if (yy < 0 || yy >= BH) continue; for (let ox = -1; ox <= 1; ox++) { const xx = tx + ox; if (xx < 0 || xx >= BW) continue; const v = LT[yy * BW + xx]; if (v < 7) { const c = Lt[v]; L += c[0]; a += c[1]; b += c[2]; n++; } } }
    L = L / n + DL[k]; a /= n; b /= n; if (cr) { const p3 = LP[k] * 3; L += cr[p3]; a += cr[p3 + 1]; b += cr[p3 + 2]; }
    rlLabTo(L, a, b, d8, o4);
  };
  const gr = rgb2lab(hex2rgb(RL_C.granite)), gl = rgb2lab(hex2rgb(RL_C.graniteLit)), sn = rgb2lab(hex2rgb(RL_C.snow)), me = rgb2lab(hex2rgb(RL_C.mere)), TG = rlTable('granite');
  for (let ty = 0, k = 0; ty < BH; ty++) {
    for (let tx = 0; tx < BW; tx++, k++) {
      const lt = LT[k], o4 = k * 4; if (lt === 255) { d8[o4 + 3] = 0; continue; }
      const x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
      if (lt === 7) { // granite: shade #2A292C to lit #8A857E by the light, snow on the highest eighth's lit faces, a little rock grain
        const s = rlBilin(sS, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2), q = rlSmooth(0.12, 1.0, s), grain = 1.4 * rlVN(TG, x / (3 * RLK), y / (3 * RLK)), sw = rlBilin(snow, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2);
        let L = gr[0] + (gl[0] - gr[0]) * q + grain + 5 * micro(x, y), a = gr[1] + (gl[1] - gr[1]) * q, b = gr[2] + (gl[2] - gr[2]) * q;
        L += (sn[0] - L) * sw; a += (sn[1] - a) * sw; b += (sn[2] - b) * sw; rlLabTo(L, a, b, d8, o4); d8[o4 + 3] = 255; continue;
      }
      if (lt === 8) { rlLabTo(me[0] + 0.9 * rlVN(TG, x / (9 * RLK), y / (5 * RLK)), me[1], me[2], d8, o4); d8[o4 + 3] = 255; continue; }
      landPx(k, tx, ty, o4, null); d8[o4 + 3] = 255;
    }
    if ((ty & 127) === 127) yield;
  }
  // the gamut: a dark or lit pixel of a saturated albedo leaves sRGB and is clipped, which moves the province's mean (hills lost about 1 b*).
  // Two correction passes: each province's CIELAB mean over its pure pixels, as converted, is brought back onto its albedo (a constant per province)
  const LIN = new Float32Array(256); for (let v = 0; v < 256; v++) LIN[v] = s2l(v);
  const cf = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  for (let pass = 0; pass < 2; pass++) {
    const sL = new Float64Array(N), sa = new Float64Array(N), sb = new Float64Array(N), sn2 = new Float64Array(N);
    for (let k = 0; k < NP; k++) { if (!pure[k]) continue; const o4 = k * 4, R0 = LIN[d8[o4]], G0 = LIN[d8[o4 + 1]], B0 = LIN[d8[o4 + 2]], fx = cf((0.4124 * R0 + 0.3576 * G0 + 0.1805 * B0) / 0.95047), fy = cf(0.2126 * R0 + 0.7152 * G0 + 0.0722 * B0), fz = cf((0.0193 * R0 + 0.1192 * G0 + 0.9505 * B0) / 1.08883), i = id[k];
      sL[i] += 116 * fy - 16; sa[i] += 500 * (fx - fy); sb[i] += 200 * (fy - fz); sn2[i]++; }
    for (let i = 0; i < N; i++) if (sn2[i] && !RL_WILDK[i]) { const al = RL_L[terr[i]]; corr[i * 3] += al[0] - sL[i] / sn2[i]; corr[i * 3 + 1] += al[1] - sa[i] / sn2[i]; corr[i * 3 + 2] += al[2] - sb[i] / sn2[i]; }
    yield;
    for (let ty = 0, k = 0; ty < BH; ty++) { for (let tx = 0; tx < BW; tx++, k++) { if (LT[k] < 7) landPx(k, tx, ty, k * 4, corr); } if ((ty & 255) === 255) yield; }
  }
  out.gamutCorr = provList.map((i) => [names[i], +corr[i * 3].toFixed(2), +corr[i * 3 + 1].toFixed(2), +corr[i * 3 + 2].toFixed(2)]);
  for (let ty = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++) { // antialias the rounded corners
    const x = (tx + 0.5) / TX, y = (ty + 0.5) / TX; if (!((x < RL_RC || x > W - RL_RC) && (y < RL_RC || y > H - RL_RC))) continue;
    const cx = x < RL_RC ? RL_RC : W - RL_RC, cy = y < RL_RC ? RL_RC : H - RL_RC, dd = Math.hypot(x - cx, y - cy) - RL_RC, cov = Math.max(0, Math.min(1, 0.5 - dd * TX)), o4 = (ty * BW + tx) * 4;
    if (cov > 0 && d8[o4 + 3] === 0) { const nb = nearest(x, y), c = RL_WILDK[nb] ? gr : RL_L[terr[nb]]; rlLabTo(c[0], c[1], c[2], d8, o4); }
    d8[o4 + 3] = Math.round(255 * cov);
  }
  out.img = img; yield; lap('color');
  // S9: the canvas, the wild sculpture drawn into it (crags, mere banks, ripples, reeds and snags), and the mips
  const cv = makeCanvas(BW, BH), g = cv.getContext('2d'); g.putImageData(img, 0, 0);
  g.setTransform(TX, 0, 0, TX, 0, 0); rlSculptWilds(g); g.setTransform(1, 0, 0, 1, 0, 0);
  out.canvas = cv; // the mips average in CIELAB (an sRGB average darkens a textured province's L* mean by 0.2 to 0.4)
  const labMip = (src, w, h) => { const W2 = w >> 1, H2 = h >> 1, dst = new ImageData(W2, H2), dd = dst.data, sd = src.data;
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { let L = 0, a = 0, b = 0, al = 0, n = 0;
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const o = ((y * 2 + oy) * w + x * 2 + ox) * 4; if (!sd[o + 3]) continue; const R0 = LIN[sd[o]], G0 = LIN[sd[o + 1]], B0 = LIN[sd[o + 2]], fx = cf((0.4124 * R0 + 0.3576 * G0 + 0.1805 * B0) / 0.95047), fy = cf(0.2126 * R0 + 0.7152 * G0 + 0.0722 * B0), fz = cf((0.0193 * R0 + 0.1192 * G0 + 0.9505 * B0) / 1.08883); L += 116 * fy - 16; a += 500 * (fx - fy); b += 200 * (fy - fz); al += sd[o + 3]; n++; }
      const o4 = (y * W2 + x) * 4; if (n) { rlLabTo(L / n, a / n, b / n, dd, o4); dd[o4 + 3] = Math.round(al / 4); } }
    return dst; };
  const m1 = labMip(img, BW, BH); yield; const m2 = labMip(m1, BW / 2, BH / 2);
  out.mip1 = makeCanvas(BW / 2, BH / 2); out.mip1.getContext('2d').putImageData(m1, 0, 0); out.mip2 = makeCanvas(BW / 4, BH / 4); out.mip2.getContext('2d').putImageData(m2, 0, 0);
  { const t1 = makeCanvas(BW / 2, BH / 2), t2 = makeCanvas(BW / 4, BH / 4); t1.getContext('2d').drawImage(cv, 0, 0, BW / 2, BH / 2); t2.getContext('2d').drawImage(t1, 0, 0, BW / 4, BH / 4); // the sculpture drawn after the pixel pass: wilds only, so the land mips stay Lab averages
    for (const [m, t] of [[out.mip1, t1], [out.mip2, t2]]) { const mg = m.getContext('2d'); mg.save(); mg.setTransform(m.width / W, 0, 0, m.height / H, 0, 0); mg.beginPath(); for (const w of WILDS) for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? mg.lineTo(x, y) : mg.moveTo(x, y))); mg.closePath(); } mg.clip(); mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, m.width, m.height); mg.drawImage(t, 0, 0); mg.restore(); } }
  // the land-look wash is composited per texel into these canvases from their unwashed copies (rlWashSync); the mip texels inside one province carry its id
  out.img = g.getImageData(0, 0, BW, BH); out.mb1 = out.mip1.getContext('2d').getImageData(0, 0, BW / 2, BH / 2); out.mb2 = out.mip2.getContext('2d').getImageData(0, 0, BW / 4, BH / 4);
  { const W1 = BW / 2, H1 = BH / 2, W2 = BW / 4, H2 = BH / 4, mid1 = new Uint8Array(W1 * H1), mid2 = new Uint8Array(W2 * H2), wid = (k) => (LT[k] < 7 ? id[k] : 255);
    for (let y = 0; y < H1; y++) for (let x = 0; x < W1; x++) { const k = y * 2 * BW + x * 2, a = wid(k); mid1[y * W1 + x] = a !== 255 && a === wid(k + 1) && a === wid(k + BW) && a === wid(k + BW + 1) ? a : 255; }
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const k = y * 2 * W1 + x * 2, a = mid1[k]; mid2[y * W2 + x] = a !== 255 && a === mid1[k + 1] && a === mid1[k + W1] && a === mid1[k + W1 + 1] ? a : 255; }
    out.mid1 = mid1; out.mid2 = mid2; }
  lap('canvas');
  // the mode relief: a gentle fixed relief of +-3 L* (p95), mean-neutral per province, at half resolution (§9.2)
  const mr = new Float32Array(HW * HH), msum = new Float64Array(N), mcnt = new Float64Array(N);
  { const abs = []; for (let k = 0; k < HW * HH; k += 7) if (hid[k] !== 255 && !RL_WILDK[hid[k]]) abs.push(Math.abs(fS[k])); abs.sort((p, q) => p - q); const p95 = abs[Math.floor(abs.length * 0.95)] || 1;
    for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; mr[k] = Math.max(-4, Math.min(4, (RL_P.modeRelief * fS[k]) / p95)); msum[o] += mr[k]; mcnt[o]++; }
    for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; mr[k] -= msum[o] / mcnt[o]; } }
  out.modeRelief = mr; lap('modeRelief');
  // the quarter-resolution heightfield for the water and the invariant checks (the CPU reference's own; review item 33)
}
function rlSculptWilds(g) { // world units on the bake: crags on the peaks' south faces, the meres' north banks, ripples, reeds, snags (§3.8)
  for (const w of WILDS) {
    const R = rngFor(`relief:${MAP_SEED}:wild:${w.id}`), ol = rlWildOutline(w);
    g.save(); g.beginPath(); for (const c of w.cells) { const P = cells[c]; P.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    if (w.kind === 'peaks') {
      const hs = RL_P.cragShown * RLK;
      for (const e of ol) {
        const [ax, ay] = e.a, [bx, by] = e.b, mx = (ax + bx) / 2, my = (ay + by) / 2, inside = d3.polygonContains(cells[e.c], [mx, my - 2]); // the face shows where the land lies to the south
        if (!inside) continue; const L = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(L / (6 * RLK)));
        // the face as a parallelogram above the outline; its top edge broken into crags, strata, darker at the foot
        const top = []; for (let m = 0; m <= n; m++) { const t = m / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, e = m === 0 || m === n ? 0.5 : 1; top.push([x, y - hs * e * (0.8 + 0.35 * R())]); }
        const gr = g.createLinearGradient(0, my - hs, 0, my); gr.addColorStop(0, '#4A4648'); gr.addColorStop(0.55, '#2E2B2E'); gr.addColorStop(1, '#1A181B');
        g.fillStyle = gr; g.beginPath(); g.moveTo(ax, ay); top.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(bx, by); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(14,12,14,.45)'; g.lineWidth = 0.7; for (let m = 1; m < n; m += 2 + Math.floor(R() * 2)) { const [x, y] = top[m], t = m / n; g.beginPath(); g.moveTo(x, y + 1.5); g.lineTo(ax + (bx - ax) * t + (R() - 0.5) * 2, ay + (by - ay) * t - hs * 0.25 * R()); g.stroke(); }
        g.strokeStyle = 'rgba(160,152,145,.45)'; g.lineWidth = 0.7; g.beginPath(); top.forEach(([x, y], m) => (m ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); // the lit lip of the crags
      }
    } else {
      const hb = RL_P.bank * RLK * 0.77;
      for (const e of ol) {
        const [ax, ay] = e.a, [bx, by] = e.b, mx = (ax + bx) / 2, my = (ay + by) / 2; if (!d3.polygonContains(cells[e.c], [mx, my + 2])) continue; // the north bank: water to the south of the outline
        g.fillStyle = RL_C.mereBank; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(bx, by + hb); g.lineTo(ax, ay + hb); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(20,18,24,.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(ax, ay + hb); g.lineTo(bx, by + hb); g.stroke();
      }
      let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
      g.lineCap = 'round';
      for (let k = 0; k < 26; k++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]); if (!w.cells.some((c) => d3.polygonContains(cells[c], [x, y]))) continue; const L = (4 + R() * 7) * RLK; g.strokeStyle = `rgba(143,195,211,${0.18 + 0.2 * R()})`; g.lineWidth = 0.9; g.beginPath(); g.ellipse(x, y, L, L * 0.22, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      for (const e of ol) { const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]); for (let m = 0; m < L / (6 * RLK); m++) { const t = R(), x = e.a[0] + (e.b[0] - e.a[0]) * t, y = e.a[1] + (e.b[1] - e.a[1]) * t; const [cx, cy] = cent[e.c], dx = cx - x, dy = cy - y, dl = Math.hypot(dx, dy) || 1, ix = x + (dx / dl) * (2 + 4 * R()) * RLK, iy = y + (dy / dl) * (2 + 4 * R()) * RLK;
        g.strokeStyle = R() < 0.5 ? '#3E4A34' : '#55603F'; g.lineWidth = 0.9; for (let q = 0; q < 3; q++) { g.beginPath(); g.moveTo(ix + q * 1.2, iy); g.lineTo(ix + q * 1.2 + (R() - 0.5) * 2, iy - (2.5 + 2 * R()) * RLK); g.stroke(); } } }
      for (let k = 0; k < 5; k++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]); if (!w.cells.some((c) => d3.polygonContains(cells[c], [x, y]) && distToEdge(cells[c], x, y) > 14 * RLK)) continue; // bone-white snags
        g.strokeStyle = '#E2DCCD'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - 7 * RLK); g.moveTo(x + 0.6, y - 4 * RLK); g.lineTo(x + 3.4 * RLK, y - 6.5 * RLK); g.moveTo(x + 0.8, y - 5.5 * RLK); g.lineTo(x - 2.4 * RLK, y - 7.6 * RLK); g.stroke();
        g.strokeStyle = 'rgba(143,195,211,.35)'; g.beginPath(); g.ellipse(x, y + 0.5, 3 * RLK, 0.8 * RLK, 0, 0, Math.PI * 2); g.stroke(); }
    }
    g.restore();
  }
}
// ---- water inside one province (§3.6): lakes at a local low of the CPU heightfield, ponds, streams traced downhill (biased toward their sink)
function rlPlaceWater(out) {
  const { QW, QH, TX, hq } = out, res = { lakes: [], ponds: [], streams: [], falls: [] }, clear = RL_P.waterClearD * RLD + 2;
  const H4 = (x, y) => rlBilin(hq, QW, QH, (x * TX) / 4, (y * TX) / 4);
  const zoneOK = (i, x, y, r) => { // the seat, the army slots east of it, the label under it and the Wellspring west of it stay clear (world units at the start zoom)
    const [sx, sy] = cent[i], dx = x - sx, dy = y - sy;
    if (Math.hypot(dx, dy * 1.2) < 0.17 * RLD + r) return false; // the seat piece
    if (dx > 0 && Math.hypot(dx, dy) < 0.36 * RLD + r && Math.abs(dy) < 0.22 * RLD + r) return false; // the first army slots, east of the seat
    if (Math.abs(dx) < 0.24 * RLD + r && dy > 0 && dy < 0.18 * RLD + r) return false; // the label
    return true;
  };
  const seatOK = (i, x, y) => Math.hypot(x - cent[i][0], (y - cent[i][1]) * 1.2) > 0.15 * RLD;
  const blob = (x, y, r, R) => { const k1 = R() * 6.28, k2 = R() * 6.28, a1 = 0.10 + 0.08 * R(), a2 = 0.06 + 0.05 * R(), rot = R() * 3.14, P = []; for (let m = 0; m < 40; m++) { const t = (m / 40) * Math.PI * 2, rr = r * (1 + a1 * Math.cos(2 * t + k1) + a2 * Math.cos(3 * t + k2)); P.push([x + Math.cos(t + rot) * rr * 1.25, y + Math.sin(t + rot) * rr * 0.8]); } return P; };
  const polyArea = (P) => Math.abs(d3.polygonArea(P));
  const fits = (i, P) => P.every(([x, y]) => d3.polygonContains(cells[i], [x, y]) && distToEdge(cells[i], x, y) >= clear && inModel(x, y));
  for (const i of provList) {
    const tn = terr[i], R = rngFor(`relief:${MAP_SEED}:water:${i}`), roll = R();
    const kind = ['plains', 'farmland', 'forest', 'hills'].includes(tn) && roll < 0.2 ? 'lake' : roll > 0.2 && roll < 0.34 && tn !== 'swamp' ? 'pond' : null; if (!kind) continue;
    const maxShare = kind === 'lake' ? RL_P.lakeMax * 0.55 : RL_P.pondMax * 0.9, r = Math.sqrt((maxShare * areaOf[i]) / Math.PI / 1.0);
    let best = null; const bb = bboxOf(cells[i]);
    for (let t = 0; t < 140; t++) { // candidates; the lowest valid one wins
      const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]); if (!zoneOK(i, x, y, r * 1.25)) continue;
      const P = blob(x, y, r, rngFor(`relief:${MAP_SEED}:blob:${i}:${t}`)); if (!fits(i, P) || polyArea(P) > (kind === 'lake' ? RL_P.lakeMax : RL_P.pondMax) * areaOf[i]) continue;
      const hgt = H4(x, y); if (!best || hgt < best.h) best = { x, y, P, h: hgt };
    }
    if (!best) continue; const wb = { i, kind, P: best.P, x: best.x, y: best.y, share: polyArea(best.P) / areaOf[i] };
    (kind === 'lake' ? res.lakes : res.ponds).push(wb);
    // a stream from a seeded high source in the core, downhill on the quarter-resolution field and drawn toward its lake or pond
    if (R() < 0.75) for (let t = 0; t < 18; t++) {
      const x0 = bb[0] + R() * (bb[2] - bb[0]), y0 = bb[1] + R() * (bb[3] - bb[1]); if (!d3.polygonContains(cells[i], [x0, y0]) || distToEdge(cells[i], x0, y0) < clear + 4 || !seatOK(i, x0, y0) || Math.hypot(x0 - wb.x, y0 - wb.y) < 0.3 * RLD) continue;
      const pts = [[x0, y0]]; let [x, y] = [x0, y0], ok = false; const st = 2.2 * RLK;
      for (let m = 0; m < 260; m++) {
        const e = 1.2, gx = (H4(x + e, y) - H4(x - e, y)) / (2 * e), gy = (H4(x, y + e) - H4(x, y - e)) / (2 * e), gl = Math.hypot(gx, gy) || 1, tx = wb.x - x, ty = wb.y - y, tl = Math.hypot(tx, ty) || 1;
        const k = Math.min(1, 0.35 + m / 80); let vx = (-gx / gl) * (1 - k) + (tx / tl) * k, vy = (-gy / gl) * (1 - k) + (ty / tl) * k; const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
        x += vx * st; y += vy * st; pts.push([x, y]);
        if (d3.polygonContains(wb.P, [x, y])) { ok = true; break; }
        if (distToEdge(cells[i], x, y) < clear || !seatOK(i, x, y)) break;
      }
      if (!ok || pts.length < 8) continue;
      res.streams.push({ i, pts: chaikin(pts, 2, false), w0: 1.5 * RLK, w1: (kind === 'lake' ? 3 : 2.2) * RLK, sink: kind }); break;
    }
  }
  // streams that fall off the model's south edge (a waterfall down the cliff): provinces with a long south edge
  for (const i of provList) {
    const P = cells[i], south = []; for (let k = 0; k < P.length - 1; k++) if (Math.abs(P[k][1] - H) < 0.5 && Math.abs(P[k + 1][1] - H) < 0.5) south.push([Math.min(P[k][0], P[k + 1][0]), Math.max(P[k][0], P[k + 1][0])]);
    const R = rngFor(`relief:${MAP_SEED}:fall:${i}`); if (!south.length || R() > 0.7 || res.streams.some((s) => s.i === i)) continue;
    const [sa, sb] = south[0]; if (sb - sa < 2 * clear + 0.3 * RLD) continue;
    const ex = sa + clear + R() * (sb - sa - 2 * clear); if (ex < RL_RC + 6 || ex > W - RL_RC - 6) continue;
    for (let t = 0; t < 14; t++) {
      const bb = bboxOf(P), x0 = bb[0] + R() * (bb[2] - bb[0]), y0 = bb[1] + R() * (bb[3] - bb[1]) * 0.6; if (!d3.polygonContains(P, [x0, y0]) || distToEdge(P, x0, y0) < clear + 4 || !seatOK(i, x0, y0) || H - y0 < 0.3 * RLD) continue;
      const pts = [[x0, y0]]; let [x, y] = [x0, y0], ok = false; const st = 2.2 * RLK;
      for (let m = 0; m < 300; m++) {
        const e = 1.2, gx = (H4(x + e, y) - H4(x - e, y)) / (2 * e), gy = (H4(x, y + e) - H4(x, y - e)) / (2 * e), gl = Math.hypot(gx, gy) || 1, tx = ex - x, ty = H + 2 - y, tl = Math.hypot(tx, ty) || 1;
        const k = Math.min(1, 0.4 + m / 70); let vx = (-gx / gl) * (1 - k) + (tx / tl) * k, vy = (-gy / gl) * (1 - k) + (ty / tl) * k; const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
        x += vx * st; y += vy * st; if (y >= H) { pts.push([x, H]); ok = true; break; } pts.push([x, y]);
        const dEdge = Math.min(...(() => { const ds = []; for (let k2 = 0; k2 < P.length - 1; k2++) { const a = P[k2], b = P[k2 + 1]; if (Math.abs(a[1] - H) < 0.5 && Math.abs(b[1] - H) < 0.5) continue; ds.push(rlSegDist(x, y, a[0], a[1], b[0], b[1])); } return ds; })());
        if (dEdge < clear || !seatOK(i, x, y)) break;
      }
      if (!ok || pts.length < 8) continue;
      const sm = chaikin(pts, 2, false); res.streams.push({ i, pts: sm, w0: 1.5 * RLK, w1: 2.6 * RLK, sink: 'edge' }); res.falls.push({ i, x: sm[sm.length - 1][0], w: 2.6 * RLK }); break;
    }
  }
  return res;
}
function rlStartBake() {
  if (RB.running || RB.ready) return; RB.running = true; const t0 = performance.now(), gen = rlBakeGen(RB);
  const step = () => { const s0 = performance.now(); let r; do { r = gen.next(); } while (!r.done && performance.now() - s0 < 28); RB.slices++; RB.total += performance.now() - s0;
    if (!r.done) { setTimeout(step, 0); return; } RB.wall = performance.now() - t0; RB.running = false; RB.ready = true; RB.ver++; RIM = null; rlAfterBake(); requestDraw(); };
  setTimeout(step, 0);
}
